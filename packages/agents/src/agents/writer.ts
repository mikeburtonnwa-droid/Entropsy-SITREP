import { z } from "zod";
import { BaseAgent, type AgentContext } from "./base-agent.js";
import { MODELS, type Industry } from "../config.js";
import { callClaudeJson } from "../services/anthropic.js";
import { buildWriterSystemPrompt } from "../prompts/writer-system.js";
import { scrapeArticle } from "../services/web-scraper.js";
import { getCuratedByRunAndIndustry } from "../db/queries/curated-stories.js";
import {
  insertContentPackages,
  type InsertContentPackage,
} from "../db/queries/content-packages.js";
import {
  validateWordCount,
  type FormatKey,
} from "../utils/word-count.js";

// ---------------------------------------------------------------------------
// Zod schema for writer LLM output (all 6 formats in one response)
// ---------------------------------------------------------------------------
const WordCountsSchema = z.object({
  brief_block: z.number().int().nonnegative(),
  morning_brief: z.number().int().nonnegative(),
  linkedin_post: z.number().int().nonnegative(),
  facebook_post: z.number().int().nonnegative(),
  video_script_a: z.number().int().nonnegative(),
  video_script_b: z.number().int().nonnegative(),
  video_script_c: z.number().int().nonnegative(),
});

const WriterOutputSchema = z.object({
  brief_block: z.string().min(1),
  morning_brief: z.string().min(1),
  linkedin_post: z.string().min(1),
  facebook_post: z.string().min(1),
  video_script_a: z.string().min(1),
  video_script_b: z.string().min(1),
  video_script_c: z.string().min(1),
  word_counts: WordCountsSchema,
});

type WriterOutput = z.infer<typeof WriterOutputSchema>;

// ---------------------------------------------------------------------------
// Format keys for validation (maps writer output fields to FORMAT_SPECS keys)
// ---------------------------------------------------------------------------
const VALIDATION_MAP: Array<{ field: keyof Omit<WriterOutput, "word_counts">; format: FormatKey }> = [
  { field: "brief_block", format: "brief_block" },
  { field: "morning_brief", format: "morning_brief" },
  { field: "linkedin_post", format: "linkedin_post" },
  { field: "facebook_post", format: "facebook_post" },
  { field: "video_script_a", format: "video_script_a" },
  { field: "video_script_b", format: "video_script_b" },
  { field: "video_script_c", format: "video_script_c_cards" },
];

// ---------------------------------------------------------------------------
// WriterAgent
// ---------------------------------------------------------------------------

/**
 * Content Writer (Agents 08-10 in the pipeline).
 * One instance per industry. For each curated story, produces all 7 content
 * formats (brief block, morning brief, LinkedIn, Facebook, 3 video scripts)
 * in a single LLM call, then validates word counts before writing to the DB.
 */
export class WriterAgent extends BaseAgent {
  readonly agentName = "writer" as const;
  private readonly industry: Industry;

  constructor(industry: Industry) {
    super();
    this.industry = industry;
  }

  protected async execute(ctx: AgentContext): Promise<void> {
    const { runId } = ctx;

    // ----- 1. Fetch curated stories for this run + industry -----
    const curatedStories = await getCuratedByRunAndIndustry(runId, this.industry);

    if (!curatedStories || curatedStories.length === 0) {
      this.log.warn("No curated stories found for this run + industry, skipping writing");
      return;
    }

    this.log.info(
      { storyCount: curatedStories.length },
      "Fetched curated stories for writing",
    );

    // ----- 2. Build system prompt (shared across all stories) -----
    const systemPrompt = buildWriterSystemPrompt(this.industry);

    // ----- 3. Process each story sequentially -----
    const contentPackages: InsertContentPackage[] = [];

    for (const story of curatedStories) {
      const storyId = story.id as string;
      const headline = story.headline as string;
      const url = story.url as string;
      const source = story.source as string;
      const keyInsight = (story.key_insight as string) ?? "";
      const storyAngle = (story.story_angle as string) ?? "";

      this.log.info({ headline, storyId }, "Processing story");

      // ----- 2a. Scrape full article text, fall back to snippet -----
      let articleText: string;
      try {
        const scraped = await scrapeArticle(url);
        if (scraped && scraped.markdown && scraped.markdown.length > 100) {
          articleText = scraped.markdown;
          this.log.info(
            { url, chars: articleText.length },
            "Scraped full article text",
          );
        } else {
          articleText = (story.why_selected as string) ?? "No article text available.";
          this.log.warn({ url }, "Scrape returned insufficient content, using snippet");
        }
      } catch (err) {
        articleText = (story.why_selected as string) ?? "No article text available.";
        this.log.warn({ url, err }, "Scrape failed, falling back to snippet");
      }

      // ----- 3a. Build user message for this story -----
      const userMessage = this.buildStoryUserMessage({
        headline,
        url,
        source,
        keyInsight,
        storyAngle,
        articleText,
      });

      // ----- 4. Call LLM — one call per story, all 6 formats -----
      let writerOutput = await this.callWriter(systemPrompt, userMessage);

      // ----- 5. Validate word counts; retry once if needed -----
      const validationErrors = this.validateOutput(writerOutput);

      if (validationErrors.length > 0) {
        this.log.warn(
          { errors: validationErrors },
          "Word count validation failed, retrying with feedback",
        );
        writerOutput = await this.retryWithFeedback(
          systemPrompt,
          userMessage,
          writerOutput,
          validationErrors,
        );

        // Check again after retry; log but accept whatever we get
        const retryErrors = this.validateOutput(writerOutput);
        if (retryErrors.length > 0) {
          this.log.warn(
            { errors: retryErrors },
            "Word count validation still has issues after retry; proceeding with best effort",
          );
        }
      }

      // ----- 6. Write content package to DB -----
      contentPackages.push({
        run_id: runId,
        industry: this.industry,
        story_id: storyId,
        brief_block: writerOutput.brief_block,
        morning_brief: writerOutput.morning_brief,
        linkedin_post: writerOutput.linkedin_post,
        facebook_post: writerOutput.facebook_post,
        video_script_a: writerOutput.video_script_a,
        video_script_b: writerOutput.video_script_b,
        video_script_c: writerOutput.video_script_c,
        word_counts: writerOutput.word_counts,
      });
    }

    // Batch insert all content packages
    await insertContentPackages(contentPackages);

    this.log.info(
      { packageCount: contentPackages.length },
      "Content packages written to DB",
    );
  }

  // -------------------------------------------------------------------------
  // Helpers
  // -------------------------------------------------------------------------

  /**
   * Build the user message for a single story, including full article text
   * or snippet as context for the writer.
   */
  private buildStoryUserMessage(story: {
    headline: string;
    url: string;
    source: string;
    keyInsight: string;
    storyAngle: string;
    articleText: string;
  }): string {
    // Truncate article text to avoid exceeding context window
    const maxArticleChars = 12_000;
    const truncatedArticle =
      story.articleText.length > maxArticleChars
        ? story.articleText.slice(0, maxArticleChars) + "\n\n[Article truncated...]"
        : story.articleText;

    return `Write all 7 content formats for the following story.

## Story Details
**Headline**: ${story.headline}
**URL**: ${story.url}
**Source**: ${story.source}
**Key Insight**: ${story.keyInsight}
**Story Angle**: ${story.storyAngle}

## Full Article Text
${truncatedArticle}

Remember: return a single JSON object with all 7 content formats and their word counts. No markdown fences.`;
  }

  /**
   * Call the writer LLM and track tokens.
   */
  private async callWriter(
    systemPrompt: string,
    userMessage: string,
  ): Promise<WriterOutput> {
    const result = await callClaudeJson({
      model: MODELS.writer,
      system: systemPrompt,
      messages: [{ role: "user", content: userMessage }],
      maxTokens: 8192,
      schema: WriterOutputSchema,
    });

    // Track tokens from this call
    this.trackTokens(result.inputTokens, result.outputTokens, result.costUsd);

    return result.data;
  }

  /**
   * Validate all content format word counts against FORMAT_SPECS.
   * Returns an array of error strings (empty if all valid).
   */
  private validateOutput(output: WriterOutput): string[] {
    const errors: string[] = [];

    for (const { field, format } of VALIDATION_MAP) {
      const text = output[field];
      const error = validateWordCount(format, text);
      if (error) {
        errors.push(error);
      }
    }

    return errors;
  }

  /**
   * Retry the writer call with validation feedback appended.
   * Passes the original output and errors back to the LLM for correction.
   */
  private async retryWithFeedback(
    systemPrompt: string,
    originalUserMessage: string,
    previousOutput: WriterOutput,
    validationErrors: string[],
  ): Promise<WriterOutput> {
    const feedbackMessage = `Your previous output had word count validation errors:\n\n${validationErrors.map((e) => `- ${e}`).join("\n")}\n\nPlease revise the affected formats to meet the word count requirements and return the complete JSON object with all 7 formats. Keep the formats that passed validation unchanged.`;

    const result = await callClaudeJson({
      model: MODELS.writer,
      system: systemPrompt,
      messages: [
        { role: "user", content: originalUserMessage },
        { role: "assistant", content: JSON.stringify(previousOutput) },
        { role: "user", content: feedbackMessage },
      ],
      maxTokens: 8192,
      schema: WriterOutputSchema,
    });

    // Track tokens from the retry call
    this.trackTokens(result.inputTokens, result.outputTokens, result.costUsd);

    return result.data;
  }
}

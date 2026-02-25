import { z } from "zod";
import { BaseAgent, type AgentContext } from "./base-agent.js";
import { MODELS, CONTENT, type Industry } from "../config.js";
import { callClaudeJson } from "../services/anthropic.js";
import { buildCuratorSystemPrompt } from "../prompts/curator-system.js";
import {
  getHarvestByRunAndIndustry,
} from "../db/queries/harvest-results.js";
import {
  getRecentCuratedHeadlines,
  insertCuratedStories,
  type InsertCuratedStory,
} from "../db/queries/curated-stories.js";

// ---------------------------------------------------------------------------
// Zod schema for curator LLM output
// ---------------------------------------------------------------------------
const CuratorStorySchema = z.object({
  rank: z.number().int().positive(),
  headline: z.string().min(1),
  url: z.string().url(),
  source: z.string().min(1),
  why_selected: z.string().min(1),
  key_insight: z.string().min(1),
  story_angle: z.string().min(1),
  relevance_score: z.number().min(0).max(100),
  freshness_score: z.number().min(0).max(100),
  total_score: z.number().min(0).max(100),
});

const CuratorOutputSchema = z.array(CuratorStorySchema);

type CuratorStory = z.infer<typeof CuratorStorySchema>;

// ---------------------------------------------------------------------------
// CuratorAgent
// ---------------------------------------------------------------------------

/**
 * Story Curator (Agents 05-07 in the pipeline).
 * One instance per industry. Selects 3-5 highest-quality stories from the
 * harvest results using an LLM editorial judgment call, with 7-day dedup.
 */
export class CuratorAgent extends BaseAgent {
  readonly agentName = "curator" as const;
  private readonly industry: Industry;

  constructor(industry: Industry) {
    super();
    this.industry = industry;
  }

  protected async execute(ctx: AgentContext): Promise<void> {
    const { runId } = ctx;

    // ----- 1. Fetch harvest results for this run + industry -----
    const harvestResults = await getHarvestByRunAndIndustry(runId, this.industry);

    if (!harvestResults || harvestResults.length === 0) {
      this.log.warn("No harvest results found for this run + industry, skipping curation");
      return;
    }

    this.log.info(
      { storyCount: harvestResults.length },
      "Fetched harvest results",
    );

    // ----- 2. Get recent headlines for 7-day dedup -----
    const recentEntries = await getRecentCuratedHeadlines(this.industry, 7);
    const recentHeadlines = (recentEntries ?? []).map(
      (entry: { headline: string }) => entry.headline,
    );

    this.log.info(
      { dedupCount: recentHeadlines.length },
      "Loaded recent headlines for dedup",
    );

    // ----- 3. Build system prompt -----
    const systemPrompt = buildCuratorSystemPrompt(this.industry, recentHeadlines);

    // ----- 4. Format harvest results into user message -----
    const storyList = harvestResults
      .map(
        (r: {
          story_headline: string;
          story_url: string;
          source_name: string;
          snippet?: string | null;
          publish_date?: string | null;
          relevance_pre_score?: number | null;
        }, i: number) =>
          `${i + 1}. **${r.story_headline}**\n   URL: ${r.story_url}\n   Source: ${r.source_name}\n   Published: ${r.publish_date ?? "unknown"}\n   Pre-score: ${r.relevance_pre_score ?? "n/a"}\n   Snippet: ${r.snippet ?? "No snippet available"}`,
      )
      .join("\n\n");

    const userMessage = `Here are ${harvestResults.length} candidate stories harvested for today's ${this.industry} brief. Select the top 3-5 stories using the scoring rubric in your system prompt.\n\n${storyList}`;

    // ----- 5. Call LLM with Zod schema -----
    const llmResult = await callClaudeJson({
      model: MODELS.curator,
      system: systemPrompt,
      messages: [{ role: "user", content: userMessage }],
      maxTokens: 4096,
      schema: CuratorOutputSchema,
    });

    let curatedStories: CuratorStory[] = llmResult.data;

    // ----- 6. Validate: 3-5 stories, min score with fallback -----
    curatedStories = this.applyScoreFilter(curatedStories);

    this.log.info(
      { selectedCount: curatedStories.length },
      "Curation complete",
    );

    // ----- 7. Write results to curated_stories table -----
    const inserts: InsertCuratedStory[] = curatedStories.map((story) => ({
      run_id: runId,
      industry: this.industry,
      rank: story.rank,
      headline: story.headline,
      url: story.url,
      source: story.source,
      why_selected: story.why_selected,
      key_insight: story.key_insight,
      story_angle: story.story_angle,
      freshness_score: story.freshness_score,
      relevance_score: story.relevance_score,
    }));

    await insertCuratedStories(inserts);

    this.log.info(
      { insertedCount: inserts.length },
      "Curated stories written to DB",
    );

    // ----- 8. Track tokens -----
    this.trackTokens(llmResult.inputTokens, llmResult.outputTokens, llmResult.costUsd);
  }

  // -------------------------------------------------------------------------
  // Score filtering with PRD fallback logic
  // -------------------------------------------------------------------------

  /**
   * Filter stories by minimum score threshold.
   * Per PRD: minimum pass score is 60. If fewer than 3 stories pass,
   * lower the threshold to 45 and retry.
   * Enforce 3-5 story count constraint.
   */
  private applyScoreFilter(stories: CuratorStory[]): CuratorStory[] {
    const { minStoriesPerIndustry, maxStoriesPerIndustry, curatorMinScore, curatorFallbackScore } =
      CONTENT;

    // First pass: filter by primary threshold (60)
    let passing = stories.filter((s) => s.total_score >= curatorMinScore);

    // Fallback: if fewer than 3 pass, lower threshold to 45
    if (passing.length < minStoriesPerIndustry) {
      this.log.warn(
        { passingCount: passing.length, threshold: curatorMinScore },
        `Fewer than ${minStoriesPerIndustry} stories passed min score, falling back to ${curatorFallbackScore}`,
      );
      passing = stories.filter((s) => s.total_score >= curatorFallbackScore);
    }

    // If still fewer than min, take whatever we have
    if (passing.length < minStoriesPerIndustry) {
      this.log.warn(
        { passingCount: passing.length },
        "Still fewer than minimum stories after fallback; using all available",
      );
    }

    // Sort by total_score descending and cap at max
    passing.sort((a, b) => b.total_score - a.total_score);

    if (passing.length > maxStoriesPerIndustry) {
      passing = passing.slice(0, maxStoriesPerIndustry);
    }

    // Re-assign rank based on final position
    passing.forEach((story, idx) => {
      story.rank = idx + 1;
    });

    return passing;
  }
}

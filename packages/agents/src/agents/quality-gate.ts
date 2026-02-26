import { z } from "zod";
import { BaseAgent, type AgentContext } from "./base-agent.js";
import { MODELS, CONTENT } from "../config.js";
import { callClaudeJson } from "../services/anthropic.js";
import { buildQaSystemPrompt } from "../prompts/qa-system.js";
import { getAllContentByRun } from "../db/queries/content-packages.js";
import { getCuratedByRunAndIndustry } from "../db/queries/curated-stories.js";
import { insertQaResults } from "../db/queries/qa-results.js";
import { sendSlackAlert } from "../services/slack.js";

// ---------------------------------------------------------------------------
// Zod schema for structured QA output
// ---------------------------------------------------------------------------
const qaResultSchema = z.array(
  z.object({
    content_id: z.string(),
    status: z.enum(["PASS", "REVISE", "ESCALATE"]),
    issues_found: z.array(z.string()),
    revised_content: z.record(z.string(), z.unknown()).nullable(),
    qa_agent_notes: z.string(),
  }),
);

type QaResultItem = z.infer<typeof qaResultSchema>[number];

// ---------------------------------------------------------------------------
// Quality Gate Agent (Agent 11)
// Reviews ALL content across every industry for accuracy, tone, format, and
// brand compliance. Does NOT take an industry parameter.
// ---------------------------------------------------------------------------
export class QualityGateAgent extends BaseAgent {
  readonly agentName = "quality-gate";

  protected async execute(ctx: AgentContext): Promise<void> {
    // 1. Fetch ALL content packages for this run (all industries)
    const contentPackages = await getAllContentByRun(ctx.runId);

    if (contentPackages.length === 0) {
      this.log.warn("No content packages found for run — skipping QA");
      return;
    }

    this.log.info(
      { count: contentPackages.length },
      "Loaded content packages for QA review",
    );

    // 2. Fetch curated stories to get source URLs for fact-checking.
    //    Build a map of story_id -> curated story for quick lookup.
    const industries = [...new Set(contentPackages.map((p: any) => p.industry))];
    const storyMap = new Map<string, any>();

    for (const industry of industries) {
      const stories = await getCuratedByRunAndIndustry(ctx.runId, industry);
      for (const story of stories) {
        storyMap.set(story.id, story);
      }
    }

    // 3. Build system prompt
    const systemPrompt = buildQaSystemPrompt();

    // 4. Format all content packages into a user message with source URLs
    const userMessage = this.buildUserMessage(contentPackages, storyMap);

    // 5. Call Claude with structured JSON output
    this.log.info("Sending content to QA model for review");

    const { data: qaResults, inputTokens, outputTokens, costUsd } =
      await callClaudeJson({
        model: MODELS.qualityGate,
        system: systemPrompt,
        messages: [{ role: "user", content: userMessage }],
        maxTokens: 8192,
        schema: qaResultSchema,
      });

    // 6. Track tokens
    this.trackTokens(inputTokens, outputTokens, costUsd);

    this.log.info(
      {
        total: qaResults.length,
        passed: qaResults.filter((r) => r.status === "PASS").length,
        revised: qaResults.filter((r) => r.status === "REVISE").length,
        escalated: qaResults.filter((r) => r.status === "ESCALATE").length,
      },
      "QA review complete",
    );

    // 7. Write results to qa_results table
    const dbRows = qaResults.map((r: QaResultItem) => ({
      run_id: ctx.runId,
      content_id: r.content_id,
      status: r.status,
      issues_found: r.issues_found,
      revised_content: r.revised_content,
      qa_agent_notes: r.qa_agent_notes,
    }));

    await insertQaResults(dbRows);
    this.log.info({ count: dbRows.length }, "QA results written to database");

    // 8. Check escalation threshold
    const escalatedCount = qaResults.filter(
      (r) => r.status === "ESCALATE",
    ).length;
    const escalatedPct = qaResults.length > 0
      ? escalatedCount / qaResults.length
      : 0;

    if (escalatedPct > CONTENT.qaEscalateThreshold) {
      const alertMsg =
        `QA Gate HALT: ${escalatedCount}/${qaResults.length} content pieces ` +
        `(${(escalatedPct * 100).toFixed(0)}%) were escalated, exceeding the ` +
        `${(CONTENT.qaEscalateThreshold * 100).toFixed(0)}% threshold.\n\n` +
        `Escalated items:\n` +
        qaResults
          .filter((r) => r.status === "ESCALATE")
          .map((r) => `  - ${r.content_id}: ${r.qa_agent_notes}`)
          .join("\n");

      await sendSlackAlert(alertMsg, "error");

      throw new Error(
        `QA escalation threshold exceeded: ${escalatedCount}/${qaResults.length} ` +
          `(${(escalatedPct * 100).toFixed(0)}%) escalated. Pipeline halted.`,
      );
    }
  }

  // -------------------------------------------------------------------------
  // Format each content package for the QA model, including the source URL
  // -------------------------------------------------------------------------
  private buildUserMessage(
    contentPackages: any[],
    storyMap: Map<string, any>,
  ): string {
    const sections = contentPackages.map((pkg, i) => {
      const story = storyMap.get(pkg.story_id);
      const sourceUrl = story?.url ?? "Source URL not available";
      const sourceHeadline = story?.headline ?? "Unknown headline";

      return [
        `--- Content Package ${i + 1} ---`,
        `Content ID: ${pkg.id}`,
        `Industry: ${pkg.industry}`,
        `Source Headline: ${sourceHeadline}`,
        `Source URL: ${sourceUrl}`,
        ``,
        `**Brief Block:**`,
        pkg.brief_block,
        ``,
        `**Morning Brief Article:**`,
        pkg.morning_brief,
        ``,
        `**LinkedIn Post:**`,
        pkg.linkedin_post,
        ``,
        `**Facebook Post:**`,
        pkg.facebook_post,
        ``,
        `**Video Script A (Talking Head):**`,
        pkg.video_script_a,
        ``,
        `**Video Script B (AI Avatar):**`,
        pkg.video_script_b,
        ``,
        `**Video Script C (Caption Cards):**`,
        pkg.video_script_c,
      ].join("\n");
    });

    return [
      `Please review the following ${contentPackages.length} content packages. ` +
        `For each one, verify factual accuracy against the source URL, check ` +
        `brand voice compliance, format adherence, and industry relevance.`,
      ``,
      ...sections,
    ].join("\n");
  }
}

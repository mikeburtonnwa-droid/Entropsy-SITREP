import { BaseAgent, type AgentContext } from "./base-agent.js";
import { env } from "../config.js";
import { getQaResultsByRun } from "../db/queries/qa-results.js";
import { getAllContentByRun } from "../db/queries/content-packages.js";
import { getCuratedByRunAndIndustry } from "../db/queries/curated-stories.js";
import {
  insertPublishedContent,
  type InsertPublishedContent,
} from "../db/queries/published-content.js";
import { queueToBuffer } from "../services/buffer.js";
import { sendSlackAlert } from "../services/slack.js";

// ---------------------------------------------------------------------------
// Content format definitions — maps content_package fields to publish types
// ---------------------------------------------------------------------------
const CONTENT_FORMATS: {
  type: string;
  field: string;
  bufferEligible: "linkedin" | "facebook" | null;
}[] = [
  { type: "brief", field: "brief_block", bufferEligible: null },
  { type: "morning_brief", field: "morning_brief", bufferEligible: null },
  { type: "linkedin", field: "linkedin_post", bufferEligible: "linkedin" },
  { type: "facebook", field: "facebook_post", bufferEligible: "facebook" },
  { type: "video_a", field: "video_script_a", bufferEligible: null },
  { type: "video_b", field: "video_script_b", bufferEligible: null },
  { type: "video_c", field: "video_script_c", bufferEligible: null },
];

// ---------------------------------------------------------------------------
// Publisher Agent (Agent 12)
// Deterministic publishing logic — no LLM calls. Takes QA-approved content
// and publishes to the feed, queues social posts to Buffer.
// ---------------------------------------------------------------------------
export class PublisherAgent extends BaseAgent {
  readonly agentName = "publisher";

  protected async execute(ctx: AgentContext): Promise<void> {
    // 1. Fetch QA results for this run
    const qaResults = await getQaResultsByRun(ctx.runId);

    if (qaResults.length === 0) {
      this.log.warn("No QA results found for run — nothing to publish");
      return;
    }

    // Build QA lookup by content_id
    const qaMap = new Map<string, any>();
    for (const qa of qaResults) {
      qaMap.set(qa.content_id, qa);
    }

    // 2. Fetch content packages and curated stories for context
    const contentPackages = await getAllContentByRun(ctx.runId);

    const industries = [...new Set(contentPackages.map((p: any) => p.industry))];
    const storyMap = new Map<string, any>();

    for (const industry of industries) {
      const stories = await getCuratedByRunAndIndustry(ctx.runId, industry);
      for (const story of stories) {
        storyMap.set(story.id, story);
      }
    }

    // 3. Process each content package
    let publishedCount = 0;
    let escalatedCount = 0;
    const publishBatch: InsertPublishedContent[] = [];
    const bufferQueue: { text: string; platform: "linkedin" | "facebook" }[] = [];

    for (const pkg of contentPackages) {
      const qa = qaMap.get(pkg.id);

      if (!qa) {
        this.log.warn(
          { contentId: pkg.id },
          "No QA result found for content package — skipping",
        );
        continue;
      }

      // 4. Skip escalated content
      if (qa.status === "ESCALATE") {
        escalatedCount++;
        this.log.info(
          { contentId: pkg.id, notes: qa.qa_agent_notes },
          "Skipping ESCALATE content — requires human review",
        );
        continue;
      }

      // 3a. If REVISE, merge revised_content onto the original package
      const effective = { ...pkg };

      if (qa.status === "REVISE" && qa.revised_content) {
        for (const [key, value] of Object.entries(qa.revised_content)) {
          if (key in effective) {
            (effective as any)[key] = value;
          }
        }
        this.log.debug(
          { contentId: pkg.id, revisedFields: Object.keys(qa.revised_content) },
          "Applied QA revisions to content package",
        );
      }

      // Resolve the story for headline context
      const story = storyMap.get(pkg.story_id);
      const headline = story?.headline ?? "Untitled";

      // 3b. For each format, insert into published_content
      for (const format of CONTENT_FORMATS) {
        const body = (effective as any)[format.field];

        if (!body) {
          this.log.warn(
            { contentId: pkg.id, format: format.type },
            "Empty content body — skipping format",
          );
          continue;
        }

        const record: InsertPublishedContent = {
          run_id: ctx.runId,
          industry: pkg.industry,
          content_type: format.type,
          title: headline,
          body,
          feed_url: story?.url ?? null,
        };

        publishBatch.push(record);
        publishedCount++;

        // 3c/3d. Queue social posts to Buffer if configured
        if (format.bufferEligible) {
          bufferQueue.push({
            text: body,
            platform: format.bufferEligible,
          });
        }
      }
    }

    // Batch insert all published content
    if (publishBatch.length > 0) {
      await insertPublishedContent(publishBatch);
      this.log.info(
        { count: publishBatch.length },
        "Published content written to database",
      );
    }

    // Queue social posts to Buffer
    const linkedInProfileIds = this.getBufferProfileIds("linkedin");
    const facebookProfileIds = this.getBufferProfileIds("facebook");

    let linkedInQueued = 0;
    let facebookQueued = 0;

    for (const item of bufferQueue) {
      if (item.platform === "linkedin" && linkedInProfileIds.length > 0) {
        const result = await queueToBuffer({
          text: item.text,
          profileIds: linkedInProfileIds,
        });
        if (result.success) {
          linkedInQueued++;
        } else {
          this.log.warn(
            { error: result.error },
            "Failed to queue LinkedIn post to Buffer",
          );
        }
      }

      if (item.platform === "facebook" && facebookProfileIds.length > 0) {
        const result = await queueToBuffer({
          text: item.text,
          profileIds: facebookProfileIds,
        });
        if (result.success) {
          facebookQueued++;
        } else {
          this.log.warn(
            { error: result.error },
            "Failed to queue Facebook post to Buffer",
          );
        }
      }
    }

    // 5. Send Slack notification with publish summary
    const summary = [
      `*Morning Brief Published*`,
      `Total pieces published: ${publishedCount}`,
      `Escalated (skipped): ${escalatedCount}`,
      linkedInQueued > 0 ? `LinkedIn posts queued: ${linkedInQueued}` : null,
      facebookQueued > 0 ? `Facebook posts queued: ${facebookQueued}` : null,
    ]
      .filter(Boolean)
      .join("\n");

    await sendSlackAlert(summary, escalatedCount > 0 ? "warning" : "info");

    this.log.info(
      { publishedCount, escalatedCount, linkedInQueued, facebookQueued },
      "Publisher complete",
    );
  }

  // -------------------------------------------------------------------------
  // Read Buffer profile IDs from environment (comma-separated)
  // -------------------------------------------------------------------------
  private getBufferProfileIds(platform: "linkedin" | "facebook"): string[] {
    const envKey =
      platform === "linkedin"
        ? "BUFFER_LINKEDIN_PROFILE_IDS"
        : "BUFFER_FACEBOOK_PROFILE_IDS";

    const raw = process.env[envKey] ?? "";
    return raw
      .split(",")
      .map((id) => id.trim())
      .filter(Boolean);
  }
}

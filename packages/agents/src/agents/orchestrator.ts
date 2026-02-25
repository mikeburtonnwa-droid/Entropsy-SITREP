// ---------------------------------------------------------------------------
// Agent 01 — Pipeline Orchestrator
// Runs the full Morning Brief pipeline: Harvest → Curate → Write → QA → Publish
// ---------------------------------------------------------------------------

import { BaseAgent, type AgentContext } from "./base-agent.js";
import { HarvesterAgent } from "./harvester.js";
import { CuratorAgent } from "./curator.js";
import { WriterAgent } from "./writer.js";
import { QualityGateAgent } from "./quality-gate.js";
import { PublisherAgent } from "./publisher.js";
import { INDUSTRIES, TIMEOUTS_MS, type Industry } from "../config.js";
import {
  executeTier,
  partitionResults,
  type TierTask,
} from "../pipeline/tier-executor.js";
import {
  createPipelineRun,
  updatePipelineStatus,
} from "../db/queries/index.js";
import type { PipelineStatus } from "../types/pipeline.js";
import { todayString } from "../utils/date.js";
import { sendSlackAlert } from "../services/slack.js";

export class OrchestratorAgent extends BaseAgent {
  readonly agentName = "orchestrator";

  protected async execute(ctx: AgentContext): Promise<void> {
    const runDate = todayString();

    // ------------------------------------------------------------------
    // 1. Create pipeline_run record
    // ------------------------------------------------------------------
    this.log.info({ runDate }, "Creating pipeline run record");
    const run = await createPipelineRun({
      run_date: runDate,
      status: "SCHEDULED" as PipelineStatus,
    });

    const runId = run.id;
    // Overwrite ctx.runId so all downstream agents share the same run
    (ctx as { runId: string }).runId = runId;

    const pipelineStart = Date.now();

    const industriesList = [...INDUSTRIES] as Industry[];
    let industriesCompleted: string[] = [];
    let industriesFailed: string[] = [];

    try {
      // ----------------------------------------------------------------
      // 2. HARVESTING tier
      // ----------------------------------------------------------------
      await this.transitionTo(runId, "HARVESTING");

      const harvesterTasks: TierTask<void>[] = industriesList.map(
        (industry) => ({
          label: `harvest:${industry}`,
          execute: async () => {
            const agent = new HarvesterAgent(industry);
            await agent.run({ runId, industry });
          },
        }),
      );

      const harvestResults = await executeTier(harvesterTasks, TIMEOUTS_MS.harvester);
      const harvest = partitionResults(harvestResults);

      this.log.info(
        {
          succeeded: harvest.succeeded.map((r) => r.label),
          failed: harvest.failed.map((r) => r.label),
        },
        "Harvest tier complete",
      );

      if (harvest.failed.length > 0) {
        await this.alertFailures("HARVESTING", harvest.failed.map((r) => r.label));
      }

      // Track which industries survived harvesting
      const harvestSurvivors = this.survivingIndustries(
        industriesList,
        harvest.failed.map((r) => r.label),
      );

      // ----------------------------------------------------------------
      // 3. CURATING tier
      // ----------------------------------------------------------------
      await this.transitionTo(runId, "CURATING");

      const curatorTasks: TierTask<void>[] = harvestSurvivors.map(
        (industry) => ({
          label: `curate:${industry}`,
          execute: async () => {
            const agent = new CuratorAgent(industry);
            await agent.run({ runId, industry });
          },
        }),
      );

      const curateResults = await executeTier(curatorTasks, TIMEOUTS_MS.curator);
      const curate = partitionResults(curateResults);

      this.log.info(
        {
          succeeded: curate.succeeded.map((r) => r.label),
          failed: curate.failed.map((r) => r.label),
        },
        "Curate tier complete",
      );

      if (curate.failed.length > 0) {
        await this.alertFailures("CURATING", curate.failed.map((r) => r.label));
      }

      const curateSurvivors = this.survivingIndustries(
        harvestSurvivors,
        curate.failed.map((r) => r.label),
      );

      // ----------------------------------------------------------------
      // 4. WRITING tier
      // ----------------------------------------------------------------
      await this.transitionTo(runId, "WRITING");

      const writerTasks: TierTask<void>[] = curateSurvivors.map(
        (industry) => ({
          label: `write:${industry}`,
          execute: async () => {
            const agent = new WriterAgent(industry);
            await agent.run({ runId, industry });
          },
        }),
      );

      const writeResults = await executeTier(writerTasks, TIMEOUTS_MS.writer);
      const write = partitionResults(writeResults);

      this.log.info(
        {
          succeeded: write.succeeded.map((r) => r.label),
          failed: write.failed.map((r) => r.label),
        },
        "Write tier complete",
      );

      if (write.failed.length > 0) {
        await this.alertFailures("WRITING", write.failed.map((r) => r.label));
      }

      const writeSurvivors = this.survivingIndustries(
        curateSurvivors,
        write.failed.map((r) => r.label),
      );

      // ----------------------------------------------------------------
      // 5. QA_REVIEW
      // ----------------------------------------------------------------
      await this.transitionTo(runId, "QA_REVIEW");

      try {
        const qaAgent = new QualityGateAgent();
        await qaAgent.run({ runId });
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        this.log.error({ error: msg }, "Quality gate failed");
        await this.alertFailures("QA_REVIEW", ["quality-gate"]);
      }

      // ----------------------------------------------------------------
      // 6. PUBLISHING
      // ----------------------------------------------------------------
      await this.transitionTo(runId, "PUBLISHING");

      try {
        const publisherAgent = new PublisherAgent();
        await publisherAgent.run({ runId });
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        this.log.error({ error: msg }, "Publisher failed");
        await this.alertFailures("PUBLISHING", ["publisher"]);
      }

      // ----------------------------------------------------------------
      // 7. Determine final status
      // ----------------------------------------------------------------
      industriesCompleted = writeSurvivors;
      industriesFailed = industriesList.filter(
        (ind) => !writeSurvivors.includes(ind),
      );

      const finalStatus: PipelineStatus =
        industriesFailed.length === 0 ? "COMPLETE" : "PARTIAL";

      const durationMs = Date.now() - pipelineStart;

      await updatePipelineStatus(runId, finalStatus, {
        industries_completed: industriesCompleted,
        industries_failed: industriesFailed,
        duration_ms: durationMs,
      });

      this.log.info(
        {
          status: finalStatus,
          industriesCompleted,
          industriesFailed,
          durationMs,
        },
        "Pipeline run finished",
      );

      if (finalStatus === "COMPLETE") {
        await sendSlackAlert(
          `Pipeline run *${runId}* completed successfully for ${industriesCompleted.length} industries in ${Math.round(durationMs / 1000)}s.`,
          "info",
        );
      } else {
        await sendSlackAlert(
          `Pipeline run *${runId}* partially completed. Succeeded: [${industriesCompleted.join(", ")}]. Failed: [${industriesFailed.join(", ")}].`,
          "warning",
        );
      }
    } catch (err) {
      // Catastrophic failure — mark the entire run as FAILED
      const msg = err instanceof Error ? err.message : String(err);
      const durationMs = Date.now() - pipelineStart;

      this.log.error({ error: msg, durationMs }, "Pipeline run failed catastrophically");

      await updatePipelineStatus(runId, "FAILED", {
        industries_completed: industriesCompleted,
        industries_failed: industriesList,
        duration_ms: durationMs,
      });

      await sendSlackAlert(
        `Pipeline run *${runId}* FAILED: ${msg}`,
        "error",
      );

      throw err;
    }
  }

  // --------------------------------------------------------------------
  // Helpers
  // --------------------------------------------------------------------

  /**
   * Transition the pipeline to a new status and persist it.
   */
  private async transitionTo(
    runId: string,
    status: PipelineStatus,
  ): Promise<void> {
    this.log.info({ status }, `Transitioning pipeline to ${status}`);
    await updatePipelineStatus(runId, status);
  }

  /**
   * Given a list of industries and a list of failed tier labels
   * (e.g. "harvest:financial_services"), return the industries that survived.
   */
  private survivingIndustries(
    industries: Industry[],
    failedLabels: string[],
  ): Industry[] {
    const failedSet = new Set(
      failedLabels.map((label) => label.split(":")[1]),
    );
    return industries.filter((ind) => !failedSet.has(ind));
  }

  /**
   * Send a Slack alert about tier failures.
   */
  private async alertFailures(
    tier: string,
    failedLabels: string[],
  ): Promise<void> {
    await sendSlackAlert(
      `${tier} tier had failures: ${failedLabels.join(", ")}`,
      "warning",
    );
  }
}

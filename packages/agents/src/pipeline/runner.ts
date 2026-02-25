import { logger } from "../utils/logger.js";
import { INDUSTRIES, TIMEOUTS_MS, CONTENT } from "../config.js";
import type { Industry } from "../config.js";
import { todayString, elapsed } from "../utils/date.js";
import { createPipelineRun, updatePipelineStatus } from "../db/queries/pipeline-runs.js";
import { executeTier, partitionResults, type TierTask } from "./tier-executor.js";
import { assertTransition } from "./state-machine.js";
import { sendSlackAlert } from "../services/slack.js";
import { OrchestratorAgent } from "../agents/orchestrator.js";

/**
 * Full pipeline execution — entry point for both cron and manual trigger.
 *
 * Creates a pipeline_run, then delegates to the Orchestrator agent.
 * The Orchestrator handles all tier sequencing internally.
 */
export async function runPipeline(): Promise<void> {
  const start = new Date();
  const runDate = todayString();

  logger.info({ runDate }, "Creating pipeline run");

  // Create the pipeline run record
  const run = await createPipelineRun({
    run_date: runDate,
    status: "SCHEDULED",
  });

  const runId = run.id;
  logger.info({ runId, runDate }, "Pipeline run created");

  try {
    // Delegate everything to the orchestrator
    const orchestrator = new OrchestratorAgent();
    await orchestrator.run({ runId });

    const durationMs = elapsed(start);
    logger.info({ runId, durationMs }, "Pipeline completed successfully");

    await sendSlackAlert(
      `Morning Brief published for ${runDate}. Duration: ${Math.round(durationMs / 1000)}s.`,
      "info",
    );
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    logger.fatal({ runId, error: msg }, "Pipeline failed");

    await updatePipelineStatus(runId, "FAILED", {
      duration_ms: elapsed(start),
    });

    await sendSlackAlert(
      `Morning Brief FAILED for ${runDate}: ${msg}`,
      "error",
    );

    throw err;
  }
}

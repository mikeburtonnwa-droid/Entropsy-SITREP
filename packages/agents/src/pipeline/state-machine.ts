import type { PipelineStatus } from "../types/pipeline.js";

/** Valid state transitions for the pipeline. */
const TRANSITIONS: Record<PipelineStatus, PipelineStatus[]> = {
  SCHEDULED: ["HARVESTING", "FAILED"],
  HARVESTING: ["CURATING", "PARTIAL", "FAILED"],
  CURATING: ["WRITING", "PARTIAL", "FAILED"],
  WRITING: ["QA_REVIEW", "PARTIAL", "FAILED"],
  QA_REVIEW: ["PUBLISHING", "PARTIAL", "FAILED"],
  PUBLISHING: ["COMPLETE", "PARTIAL", "FAILED"],
  COMPLETE: [],
  PARTIAL: [],
  FAILED: [],
};

/**
 * Check whether a transition is allowed.
 */
export function canTransition(
  from: PipelineStatus,
  to: PipelineStatus,
): boolean {
  return TRANSITIONS[from]?.includes(to) ?? false;
}

/**
 * Assert a valid transition, throw if not.
 */
export function assertTransition(
  from: PipelineStatus,
  to: PipelineStatus,
): void {
  if (!canTransition(from, to)) {
    throw new Error(`Invalid pipeline transition: ${from} → ${to}`);
  }
}

/**
 * Determine the next tier status based on industry results.
 */
export function nextStatus(
  currentTier: PipelineStatus,
  succeeded: number,
  total: number,
): PipelineStatus {
  const next: Record<string, PipelineStatus> = {
    HARVESTING: "CURATING",
    CURATING: "WRITING",
    WRITING: "QA_REVIEW",
    QA_REVIEW: "PUBLISHING",
    PUBLISHING: "COMPLETE",
  };

  if (succeeded === 0) return "FAILED";
  if (succeeded < total) return next[currentTier] ?? "PARTIAL";
  return next[currentTier] ?? "COMPLETE";
}

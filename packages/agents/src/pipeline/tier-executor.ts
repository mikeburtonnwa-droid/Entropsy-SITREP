import { logger } from "../utils/logger.js";

export interface TierTask<T> {
  label: string;
  execute: () => Promise<T>;
}

export interface TierResult<T> {
  label: string;
  status: "fulfilled" | "rejected";
  value?: T;
  error?: Error;
  durationMs: number;
}

/**
 * Execute a tier of parallel tasks with a shared timeout.
 * Uses Promise.allSettled so one failure doesn't cascade.
 */
export async function executeTier<T>(
  tasks: TierTask<T>[],
  timeoutMs: number,
): Promise<TierResult<T>[]> {
  const results = await Promise.allSettled(
    tasks.map(async (task) => {
      const start = Date.now();
      const value = await Promise.race([
        task.execute(),
        rejectAfter(timeoutMs, task.label),
      ]);
      return {
        label: task.label,
        value,
        durationMs: Date.now() - start,
      };
    }),
  );

  return results.map((r, i) => {
    if (r.status === "fulfilled") {
      logger.info(
        { label: r.value.label, durationMs: r.value.durationMs },
        "Tier task completed",
      );
      return {
        label: r.value.label,
        status: "fulfilled" as const,
        value: r.value.value,
        durationMs: r.value.durationMs,
      };
    }

    const error =
      r.reason instanceof Error ? r.reason : new Error(String(r.reason));
    logger.error(
      { label: tasks[i].label, error: error.message },
      "Tier task failed",
    );
    return {
      label: tasks[i].label,
      status: "rejected" as const,
      error,
      durationMs: timeoutMs,
    };
  });
}

function rejectAfter(ms: number, label: string): Promise<never> {
  return new Promise((_, reject) =>
    setTimeout(() => reject(new Error(`Timeout after ${ms}ms: ${label}`)), ms),
  );
}

/**
 * Partition tier results into succeeded and failed.
 */
export function partitionResults<T>(
  results: TierResult<T>[],
): { succeeded: TierResult<T>[]; failed: TierResult<T>[] } {
  const succeeded = results.filter((r) => r.status === "fulfilled");
  const failed = results.filter((r) => r.status === "rejected");
  return { succeeded, failed };
}

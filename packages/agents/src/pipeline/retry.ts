import { RETRY } from "../config.js";
import { logger } from "../utils/logger.js";

/**
 * Execute an async function with exponential backoff retry.
 * Retries on any error, up to RETRY.maxAttempts times.
 * Delays: 1s, 2s, 4s (capped at maxDelayMs).
 */
export async function withRetry<T>(
  fn: () => Promise<T>,
  label: string,
  maxAttempts = RETRY.maxAttempts,
): Promise<T> {
  let lastError: Error | undefined;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (err) {
      lastError = err instanceof Error ? err : new Error(String(err));

      if (attempt === maxAttempts) break;

      const delay = Math.min(
        RETRY.baseDelayMs * 2 ** (attempt - 1),
        RETRY.maxDelayMs,
      );

      logger.warn(
        { attempt, maxAttempts, delay, error: lastError.message },
        `Retry ${label}`,
      );

      await sleep(delay);
    }
  }

  throw lastError!;
}

/**
 * Check if an error is a rate-limit (429) response.
 */
export function isRateLimitError(err: unknown): boolean {
  if (err && typeof err === "object" && "status" in err) {
    return (err as { status: number }).status === 429;
  }
  return false;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

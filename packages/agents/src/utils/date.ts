import { env } from "../config.js";

/**
 * Get the current date string in the pipeline's timezone (YYYY-MM-DD).
 */
export function todayString(): string {
  return new Date().toLocaleDateString("en-CA", { timeZone: env.timezone });
}

/**
 * Get a Date object for N hours ago from now.
 */
export function hoursAgo(n: number): Date {
  return new Date(Date.now() - n * 60 * 60 * 1_000);
}

/**
 * Format a Date as a human-readable time string in the pipeline timezone.
 */
export function formatTime(date: Date): string {
  return date.toLocaleTimeString("en-US", {
    timeZone: env.timezone,
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
}

/**
 * Calculate elapsed time in ms between two dates.
 */
export function elapsed(start: Date, end: Date = new Date()): number {
  return end.getTime() - start.getTime();
}

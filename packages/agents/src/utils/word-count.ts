/**
 * Count words in a string (split on whitespace, ignore empty tokens).
 */
export function wordCount(text: string): number {
  return text
    .trim()
    .split(/\s+/)
    .filter((w) => w.length > 0).length;
}

/** Format spec limits from PRD §3.1-3.4 */
export const FORMAT_SPECS = {
  brief_block: { min: 50, max: 80 },
  brief_total: { min: 200, max: 400 },
  linkedin_post: { min: 150, max: 300 },
  facebook_post: { min: 100, max: 200 },
  video_script_a: { min: 130, max: 160 },
  video_script_b: { min: 120, max: 140 },
  video_script_c_cards: { min: 8, max: 12 }, // card count, not words
} as const;

export type FormatKey = keyof typeof FORMAT_SPECS;

/**
 * Validate word count against spec. Returns null if valid, error string if not.
 */
export function validateWordCount(
  format: FormatKey,
  text: string,
): string | null {
  const spec = FORMAT_SPECS[format];
  const count =
    format === "video_script_c_cards"
      ? text.split(/\n---\n|\n\n/).filter((c) => c.trim()).length
      : wordCount(text);

  if (count < spec.min) {
    return `${format}: ${count} below minimum ${spec.min}`;
  }
  if (count > spec.max) {
    return `${format}: ${count} exceeds maximum ${spec.max}`;
  }
  return null;
}

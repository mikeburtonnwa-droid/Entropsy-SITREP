import { z } from "zod";
import { Industry } from "./pipeline.js";

// ---------------------------------------------------------------------------
// Word counts — JSON object tracking counts for each content format
// ---------------------------------------------------------------------------

export const WordCountsSchema = z.object({
  brief_block: z.number().int().nonnegative(),
  linkedin_post: z.number().int().nonnegative(),
  facebook_post: z.number().int().nonnegative(),
  video_script_a: z.number().int().nonnegative(),
  video_script_b: z.number().int().nonnegative(),
  video_script_c: z.number().int().nonnegative(),
});

export type WordCounts = z.infer<typeof WordCountsSchema>;

// ---------------------------------------------------------------------------
// content_packages — DB row
// ---------------------------------------------------------------------------

export const ContentPackageSchema = z.object({
  id: z.string().uuid(),
  run_id: z.string().uuid(),
  industry: Industry,
  story_id: z.string().uuid(),
  brief_block: z.string(),
  linkedin_post: z.string(),
  facebook_post: z.string(),
  video_script_a: z.string(),
  video_script_b: z.string(),
  video_script_c: z.string(),
  word_counts: WordCountsSchema,
  created_at: z.string(), // ISO datetime string
});

export type ContentPackage = z.infer<typeof ContentPackageSchema>;

// ---------------------------------------------------------------------------
// content_packages — Insert (no id or created_at)
// ---------------------------------------------------------------------------

export const ContentPackageInsertSchema = ContentPackageSchema.omit({
  id: true,
  created_at: true,
});

export type ContentPackageInsert = z.infer<typeof ContentPackageInsertSchema>;

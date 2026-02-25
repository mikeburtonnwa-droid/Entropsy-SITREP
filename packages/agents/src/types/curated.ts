import { z } from "zod";
import { Industry } from "./pipeline.js";

// ---------------------------------------------------------------------------
// curated_stories — DB row
// ---------------------------------------------------------------------------

export const CuratedStorySchema = z.object({
  id: z.string().uuid(),
  run_id: z.string().uuid(),
  industry: Industry,
  rank: z.number().int().positive(),
  headline: z.string(),
  url: z.string().url(),
  source: z.string(),
  why_selected: z.string(),
  key_insight: z.string(),
  story_angle: z.string(),
  freshness_score: z.number().min(0).max(1),
  relevance_score: z.number().min(0).max(1),
  created_at: z.string(), // ISO datetime string
});

export type CuratedStory = z.infer<typeof CuratedStorySchema>;

// ---------------------------------------------------------------------------
// curated_stories — Insert (no id or created_at)
// ---------------------------------------------------------------------------

export const CuratedStoryInsertSchema = CuratedStorySchema.omit({
  id: true,
  created_at: true,
});

export type CuratedStoryInsert = z.infer<typeof CuratedStoryInsertSchema>;

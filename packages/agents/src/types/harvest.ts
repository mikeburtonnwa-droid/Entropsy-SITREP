import { z } from "zod";
import { Industry } from "./pipeline.js";

// ---------------------------------------------------------------------------
// harvest_results — DB row
// ---------------------------------------------------------------------------

export const HarvestResultSchema = z.object({
  id: z.string().uuid(),
  run_id: z.string().uuid(),
  industry: Industry,
  source_name: z.string(),
  story_headline: z.string(),
  story_url: z.string().url(),
  publish_date: z.string(), // ISO date or datetime string
  snippet: z.string(),
  raw_text: z.string().nullable(),
  relevance_pre_score: z.number().min(0).max(1),
  created_at: z.string(), // ISO datetime string
});

export type HarvestResult = z.infer<typeof HarvestResultSchema>;

// ---------------------------------------------------------------------------
// harvest_results — Insert (no id or created_at)
// ---------------------------------------------------------------------------

export const HarvestResultInsertSchema = HarvestResultSchema.omit({
  id: true,
  created_at: true,
});

export type HarvestResultInsert = z.infer<typeof HarvestResultInsertSchema>;

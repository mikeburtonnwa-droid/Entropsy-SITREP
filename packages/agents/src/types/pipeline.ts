import { z } from "zod";

// ---------------------------------------------------------------------------
// Enums
// ---------------------------------------------------------------------------

export const PipelineStatus = z.enum([
  "SCHEDULED",
  "HARVESTING",
  "CURATING",
  "WRITING",
  "QA_REVIEW",
  "PUBLISHING",
  "COMPLETE",
  "PARTIAL",
  "FAILED",
]);

export type PipelineStatus = z.infer<typeof PipelineStatus>;

export const Industry = z.enum([
  "professional_services",
  "financial_services",
  "retail_ecommerce",
]);

export type Industry = z.infer<typeof Industry>;

// ---------------------------------------------------------------------------
// pipeline_runs — DB row
// ---------------------------------------------------------------------------

export const PipelineRunSchema = z.object({
  id: z.string().uuid(),
  run_date: z.string(), // ISO date string (YYYY-MM-DD)
  trigger_time: z.string(), // ISO datetime string
  status: PipelineStatus,
  industries_completed: z.array(Industry),
  industries_failed: z.array(Industry),
  total_pieces_published: z.number().int().nonnegative(),
  duration_ms: z.number().int().nonnegative().nullable(),
  created_at: z.string(), // ISO datetime string
});

export type PipelineRun = z.infer<typeof PipelineRunSchema>;

// ---------------------------------------------------------------------------
// pipeline_runs — Insert (no id or created_at)
// ---------------------------------------------------------------------------

export const PipelineRunInsertSchema = PipelineRunSchema.omit({
  id: true,
  created_at: true,
});

export type PipelineRunInsert = z.infer<typeof PipelineRunInsertSchema>;

import { z } from "zod";

// ---------------------------------------------------------------------------
// QA status enum
// ---------------------------------------------------------------------------

export const QaStatus = z.enum(["PASS", "REVISE", "ESCALATE"]);

export type QaStatus = z.infer<typeof QaStatus>;

// ---------------------------------------------------------------------------
// qa_results — DB row
// ---------------------------------------------------------------------------

export const QaResultSchema = z.object({
  id: z.string().uuid(),
  run_id: z.string().uuid(),
  content_id: z.string().uuid(),
  status: QaStatus,
  issues_found: z.array(z.string()),
  revised_content: z.record(z.string(), z.unknown()).nullable(),
  qa_agent_notes: z.string(),
  created_at: z.string(), // ISO datetime string
});

export type QaResult = z.infer<typeof QaResultSchema>;

// ---------------------------------------------------------------------------
// qa_results — Insert (no id or created_at)
// ---------------------------------------------------------------------------

export const QaResultInsertSchema = QaResultSchema.omit({
  id: true,
  created_at: true,
});

export type QaResultInsert = z.infer<typeof QaResultInsertSchema>;

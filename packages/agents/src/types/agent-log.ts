import { z } from "zod";

// ---------------------------------------------------------------------------
// Agent run status enum
// ---------------------------------------------------------------------------

export const AgentRunStatus = z.enum(["RUNNING", "SUCCESS", "FAILED"]);

export type AgentRunStatus = z.infer<typeof AgentRunStatus>;

// ---------------------------------------------------------------------------
// agent_run_log — DB row
// ---------------------------------------------------------------------------

export const AgentRunLogSchema = z.object({
  id: z.string().uuid(),
  run_id: z.string().uuid(),
  agent_id: z.string(),
  agent_name: z.string(),
  started_at: z.string(), // ISO datetime string
  completed_at: z.string().nullable(), // ISO datetime string, null while running
  status: AgentRunStatus,
  input_hash: z.string(),
  output_summary: z.string().nullable(),
  error_message: z.string().nullable(),
  tokens_used: z.number().int().nonnegative(),
  cost_usd: z.number().nonnegative(),
});

export type AgentRunLog = z.infer<typeof AgentRunLogSchema>;

// ---------------------------------------------------------------------------
// agent_run_log — Insert (no id)
// ---------------------------------------------------------------------------

export const AgentRunLogInsertSchema = AgentRunLogSchema.omit({
  id: true,
});

export type AgentRunLogInsert = z.infer<typeof AgentRunLogInsertSchema>;

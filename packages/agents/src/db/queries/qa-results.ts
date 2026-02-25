import { getSupabase } from "../client.js";

export interface InsertQaResult {
  run_id: string;
  content_id: string;
  status: "PASS" | "REVISE" | "ESCALATE";
  issues_found?: string[];
  revised_content?: Record<string, unknown> | null;
  qa_agent_notes?: string;
}

export async function insertQaResults(results: InsertQaResult[]) {
  if (results.length === 0) return [];
  const db = getSupabase();
  const { data, error } = await db
    .from("qa_results")
    .insert(results)
    .select();
  if (error) throw error;
  return data;
}

export async function getQaResultsByRun(runId: string) {
  const db = getSupabase();
  const { data, error } = await db
    .from("qa_results")
    .select()
    .eq("run_id", runId);
  if (error) throw error;
  return data;
}

export async function getEscalatedCount(runId: string) {
  const db = getSupabase();
  const { count, error } = await db
    .from("qa_results")
    .select("*", { count: "exact", head: true })
    .eq("run_id", runId)
    .eq("status", "ESCALATE");
  if (error) throw error;
  return count ?? 0;
}

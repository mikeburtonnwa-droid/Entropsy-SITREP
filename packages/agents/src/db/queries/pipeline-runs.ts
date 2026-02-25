import { getSupabase } from "../client.js";
import type { PipelineStatus } from "../../types/pipeline.js";
import type { Industry } from "../../config.js";

export interface CreatePipelineRunInput {
  run_date: string;
  status: PipelineStatus;
}

export async function createPipelineRun(input: CreatePipelineRunInput) {
  const db = getSupabase();
  const { data, error } = await db
    .from("pipeline_runs")
    .insert(input)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function updatePipelineStatus(
  runId: string,
  status: PipelineStatus,
  extras?: {
    industries_completed?: string[];
    industries_failed?: string[];
    total_pieces_published?: number;
    duration_ms?: number;
  },
) {
  const db = getSupabase();
  const { error } = await db
    .from("pipeline_runs")
    .update({ status, ...extras })
    .eq("id", runId);
  if (error) throw error;
}

export async function getLatestRun() {
  const db = getSupabase();
  const { data, error } = await db
    .from("pipeline_runs")
    .select()
    .order("created_at", { ascending: false })
    .limit(1)
    .single();
  if (error && error.code !== "PGRST116") throw error;
  return data;
}

export async function getRunByDate(date: string) {
  const db = getSupabase();
  const { data, error } = await db
    .from("pipeline_runs")
    .select()
    .eq("run_date", date)
    .order("created_at", { ascending: false })
    .limit(1)
    .single();
  if (error && error.code !== "PGRST116") throw error;
  return data;
}

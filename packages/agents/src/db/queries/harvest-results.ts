import { getSupabase } from "../client.js";

export interface InsertHarvestResult {
  run_id: string;
  industry: string;
  source_name: string;
  story_headline: string;
  story_url: string;
  publish_date?: string;
  snippet?: string;
  raw_text?: string;
  relevance_pre_score?: number;
}

export async function insertHarvestResults(results: InsertHarvestResult[]) {
  if (results.length === 0) return [];
  const db = getSupabase();
  const { data, error } = await db
    .from("harvest_results")
    .insert(results)
    .select();
  if (error) throw error;
  return data;
}

export async function getHarvestByRunAndIndustry(
  runId: string,
  industry: string,
) {
  const db = getSupabase();
  const { data, error } = await db
    .from("harvest_results")
    .select()
    .eq("run_id", runId)
    .eq("industry", industry)
    .order("relevance_pre_score", { ascending: false });
  if (error) throw error;
  return data;
}

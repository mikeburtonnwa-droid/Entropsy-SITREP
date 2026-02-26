import { getSupabase } from "../client.js";

export interface InsertContentPackage {
  run_id: string;
  industry: string;
  story_id: string;
  brief_block: string;
  morning_brief: string;
  linkedin_post: string;
  facebook_post: string;
  video_script_a: string;
  video_script_b: string;
  video_script_c: string;
  word_counts: Record<string, number>;
}

export async function insertContentPackages(packages: InsertContentPackage[]) {
  if (packages.length === 0) return [];
  const db = getSupabase();
  const { data, error } = await db
    .from("content_packages")
    .insert(packages)
    .select();
  if (error) throw error;
  return data;
}

export async function getContentByRunAndIndustry(
  runId: string,
  industry: string,
) {
  const db = getSupabase();
  const { data, error } = await db
    .from("content_packages")
    .select()
    .eq("run_id", runId)
    .eq("industry", industry);
  if (error) throw error;
  return data;
}

export async function getAllContentByRun(runId: string) {
  const db = getSupabase();
  const { data, error } = await db
    .from("content_packages")
    .select()
    .eq("run_id", runId);
  if (error) throw error;
  return data;
}

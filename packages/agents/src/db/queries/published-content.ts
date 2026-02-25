import { getSupabase } from "../client.js";

export interface InsertPublishedContent {
  run_id: string;
  industry: string;
  content_type: string;
  title: string;
  body: string;
  feed_url?: string;
  linkedin_queued?: boolean;
  facebook_queued?: boolean;
  video_added?: boolean;
}

export async function insertPublishedContent(
  items: InsertPublishedContent[],
) {
  if (items.length === 0) return [];
  const db = getSupabase();
  const { data, error } = await db
    .from("published_content")
    .insert(items)
    .select();
  if (error) throw error;
  return data;
}

export async function getPublishedByRunAndIndustry(
  runId: string,
  industry: string,
) {
  const db = getSupabase();
  const { data, error } = await db
    .from("published_content")
    .select()
    .eq("run_id", runId)
    .eq("industry", industry)
    .order("publish_timestamp", { ascending: true });
  if (error) throw error;
  return data;
}

export async function getPublishedByDate(date: string) {
  const db = getSupabase();
  const { data, error } = await db
    .from("published_content")
    .select("*, pipeline_runs!inner(run_date)")
    .eq("pipeline_runs.run_date", date);
  if (error) throw error;
  return data;
}

export async function incrementClientViews(contentId: string) {
  const db = getSupabase();
  // Simple increment — a Supabase RPC would be better but this works
  const { data } = await db
    .from("published_content")
    .select("client_views")
    .eq("id", contentId)
    .single();
  if (data) {
    await db
      .from("published_content")
      .update({ client_views: (data.client_views ?? 0) + 1 })
      .eq("id", contentId);
  }
}

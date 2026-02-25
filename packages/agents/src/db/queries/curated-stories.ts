import { getSupabase } from "../client.js";

export interface InsertCuratedStory {
  run_id: string;
  industry: string;
  rank: number;
  headline: string;
  url: string;
  source: string;
  why_selected?: string;
  key_insight?: string;
  story_angle?: string;
  freshness_score?: number;
  relevance_score?: number;
}

export async function insertCuratedStories(stories: InsertCuratedStory[]) {
  if (stories.length === 0) return [];
  const db = getSupabase();
  const { data, error } = await db
    .from("curated_stories")
    .insert(stories)
    .select();
  if (error) throw error;
  return data;
}

export async function getCuratedByRunAndIndustry(
  runId: string,
  industry: string,
) {
  const db = getSupabase();
  const { data, error } = await db
    .from("curated_stories")
    .select()
    .eq("run_id", runId)
    .eq("industry", industry)
    .order("rank", { ascending: true });
  if (error) throw error;
  return data;
}

export async function getRecentCuratedHeadlines(
  industry: string,
  days: number = 7,
) {
  const db = getSupabase();
  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();
  const { data, error } = await db
    .from("curated_stories")
    .select("headline, url")
    .eq("industry", industry)
    .gte("created_at", since);
  if (error) throw error;
  return data;
}

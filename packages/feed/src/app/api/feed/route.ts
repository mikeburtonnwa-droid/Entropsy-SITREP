import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { markdownToHtml } from "@/lib/markdown";

export const dynamic = "force-dynamic";

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );
}

export async function GET(request: NextRequest) {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    return NextResponse.json(
      { error: "Supabase environment variables are not configured" },
      { status: 500 },
    );
  }

  const { searchParams } = new URL(request.url);
  const industry = searchParams.get("industry") ?? "professional_services";
  const contentType = searchParams.get("type") ?? "brief";
  const date = searchParams.get("date");

  const supabase = getSupabase();

  let query = supabase
    .from("published_content")
    .select("*")
    .eq("industry", industry)
    .order("publish_timestamp", { ascending: true });

  if (contentType !== "all") {
    query = query.eq("content_type", contentType);
  }

  if (date) {
    // Filter by date range
    query = query
      .gte("publish_timestamp", `${date}T00:00:00`)
      .lt("publish_timestamp", `${date}T23:59:59`);
  } else {
    // Default to today
    const today = new Date().toISOString().split("T")[0];
    query = query
      .gte("publish_timestamp", `${today}T00:00:00`)
      .lt("publish_timestamp", `${today}T23:59:59`);
  }

  const { data, error } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const stories = (data ?? []).map((story) => ({
    ...story,
    body: story.content_type === "brief" ? markdownToHtml(story.body) : story.body,
  }));

  return NextResponse.json({ stories });
}

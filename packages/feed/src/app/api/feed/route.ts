import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const industry = searchParams.get("industry") ?? "professional_services";
  const contentType = searchParams.get("type") ?? "brief";
  const date = searchParams.get("date");

  const supabase = getSupabase();

  let query = supabase
    .from("published_content")
    .select("*, pipeline_runs!inner(run_date)")
    .eq("industry", industry)
    .order("publish_timestamp", { ascending: true });

  if (contentType !== "all") {
    query = query.eq("content_type", contentType);
  }

  if (date) {
    query = query.eq("pipeline_runs.run_date", date);
  } else {
    // Default to today
    const today = new Date().toISOString().split("T")[0];
    query = query.eq("pipeline_runs.run_date", today);
  }

  const { data, error } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ stories: data ?? [] });
}

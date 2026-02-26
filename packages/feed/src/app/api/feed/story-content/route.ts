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
  const { searchParams } = new URL(request.url);
  const title = searchParams.get("title");
  const industry = searchParams.get("industry");
  const runId = searchParams.get("run_id");

  if (!title || !industry || !runId) {
    return NextResponse.json(
      { error: "title, industry, and run_id are required" },
      { status: 400 },
    );
  }

  const supabase = getSupabase();

  const { data, error } = await supabase
    .from("published_content")
    .select("content_type, body")
    .eq("title", title)
    .eq("industry", industry)
    .eq("run_id", runId);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const content: Record<string, string> = {};
  for (const row of data ?? []) {
    content[row.content_type] =
      (row.content_type === "brief" || row.content_type === "morning_brief")
        ? markdownToHtml(row.body)
        : row.body;
  }

  return NextResponse.json({ content });
}

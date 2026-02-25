import { NextRequest, NextResponse } from "next/server";

/**
 * Cron trigger endpoint.
 * In production, the pipeline runs on Railway (not Vercel) because
 * it exceeds Vercel's function timeout. This endpoint exists as a
 * lightweight trigger that could hit the Railway API.
 *
 * For now, returns the intended behavior.
 */
export async function POST(request: NextRequest) {
  // Verify cron secret to prevent unauthorized triggers
  const authHeader = request.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;

  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // In production: trigger the Railway pipeline process
  // For now: return a placeholder
  return NextResponse.json({
    message: "Pipeline trigger received. Pipeline runs on Railway.",
    timestamp: new Date().toISOString(),
  });
}

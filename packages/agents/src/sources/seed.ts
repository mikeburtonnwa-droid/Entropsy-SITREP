// ---------------------------------------------------------------------------
// Seed script — upserts all 44 sources into the source_registry table
// Run: pnpm seed  (or: tsx src/sources/seed.ts)
// ---------------------------------------------------------------------------

import { SOURCES } from "./registry.js";
import { getSupabase } from "../db/client.js";

async function seed() {
  const supabase = getSupabase();

  console.log(`Seeding ${SOURCES.length} sources into source_registry...`);

  // Map camelCase source objects to snake_case DB columns
  const rows = SOURCES.map((s) => ({
    industry: s.industry,
    source_name: s.sourceName,
    feed_url: s.feedUrl,
    source_type: s.sourceType,
    active: true,
    avg_stories_per_day: 0,
    avg_relevance_score: 0,
    last_fetched: null,
  }));

  // Upsert on the (industry, source_name) unique constraint
  const { data, error } = await supabase
    .from("source_registry")
    .upsert(rows, { onConflict: "industry,source_name" })
    .select();

  if (error) {
    console.error("Seed failed:", error.message);
    process.exit(1);
  }

  console.log(`Successfully upserted ${data.length} sources.`);

  // Summary by industry
  const counts: Record<string, number> = {};
  for (const row of data) {
    counts[row.industry] = (counts[row.industry] ?? 0) + 1;
  }
  for (const [industry, count] of Object.entries(counts)) {
    console.log(`  ${industry}: ${count} sources`);
  }
}

// ---------------------------------------------------------------------------
// Run as main script
// ---------------------------------------------------------------------------

seed().catch((err) => {
  console.error("Unexpected seed error:", err);
  process.exit(1);
});

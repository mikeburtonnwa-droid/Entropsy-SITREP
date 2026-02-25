import { z } from "zod";

// ---------------------------------------------------------------------------
// Source industry — extends pipeline Industry with 'universal'
// ---------------------------------------------------------------------------

export const SourceIndustry = z.enum([
  "professional_services",
  "financial_services",
  "retail_ecommerce",
  "universal",
]);

export type SourceIndustry = z.infer<typeof SourceIndustry>;

// ---------------------------------------------------------------------------
// Source type enum — matches DB CHECK constraint
// ---------------------------------------------------------------------------

export const SourceType = z.enum(["rss", "web_scrape", "web_search"]);

export type SourceType = z.infer<typeof SourceType>;

// ---------------------------------------------------------------------------
// source_registry — DB row
// ---------------------------------------------------------------------------

export const SourceRegistrySchema = z.object({
  id: z.string().uuid(),
  industry: SourceIndustry,
  source_name: z.string(),
  feed_url: z.string(), // Can be URL or search query for web_search sources
  source_type: SourceType,
  active: z.boolean(),
  avg_stories_per_day: z.number().nonnegative(),
  avg_relevance_score: z.number().nonnegative(),
  last_fetched: z.string().nullable(),
  created_at: z.string(),
});

export type SourceRegistry = z.infer<typeof SourceRegistrySchema>;

// ---------------------------------------------------------------------------
// source_registry — Insert (no id or created_at)
// ---------------------------------------------------------------------------

export const SourceRegistryInsertSchema = SourceRegistrySchema.omit({
  id: true,
  created_at: true,
});

export type SourceRegistryInsert = z.infer<typeof SourceRegistryInsertSchema>;

import { z } from "zod";
import { Industry } from "./pipeline.js";

// ---------------------------------------------------------------------------
// published_content — DB row
// ---------------------------------------------------------------------------

export const PublishedContentSchema = z.object({
  id: z.string().uuid(),
  run_id: z.string().uuid(),
  industry: Industry,
  content_type: z.string(),
  title: z.string(),
  body: z.string(),
  feed_url: z.string().url().nullable(),
  linkedin_queued: z.boolean(),
  facebook_queued: z.boolean(),
  video_added: z.boolean(),
  publish_timestamp: z.string(), // ISO datetime string
  client_views: z.number().int().nonnegative(),
});

export type PublishedContent = z.infer<typeof PublishedContentSchema>;

// ---------------------------------------------------------------------------
// published_content — Insert (no id)
// ---------------------------------------------------------------------------

export const PublishedContentInsertSchema = PublishedContentSchema.omit({
  id: true,
});

export type PublishedContentInsert = z.infer<typeof PublishedContentInsertSchema>;

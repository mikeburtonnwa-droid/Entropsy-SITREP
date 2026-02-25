import Parser from "rss-parser";
import { childLogger } from "../utils/logger.js";

const log = childLogger("rss-fetcher");

// ---------------------------------------------------------------------------
// Lazy singleton parser
// ---------------------------------------------------------------------------
let _parser: Parser | null = null;

function getParser(): Parser {
  if (!_parser) {
    _parser = new Parser({
      timeout: 15_000,
      headers: {
        "User-Agent": "MorningBrief/1.0 (RSS Aggregator)",
      },
    });
  }
  return _parser;
}

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
export interface FeedItem {
  title: string;
  url: string;
  publishDate: Date;
  snippet: string;
  source: string;
}

// ---------------------------------------------------------------------------
// fetchRssFeed — fetch and filter an RSS feed by date
// ---------------------------------------------------------------------------
export async function fetchRssFeed(
  url: string,
  since?: Date,
): Promise<FeedItem[]> {
  const cutoff = since ?? new Date(Date.now() - 24 * 60 * 60 * 1000);

  try {
    log.debug({ url, since: cutoff.toISOString() }, "Fetching RSS feed");

    const parser = getParser();
    const feed = await parser.parseURL(url);
    const feedTitle = feed.title ?? new URL(url).hostname;

    const items: FeedItem[] = [];

    for (const entry of feed.items) {
      const pubDateStr = entry.pubDate ?? entry.isoDate;
      if (!pubDateStr) continue;

      const publishDate = new Date(pubDateStr);
      if (isNaN(publishDate.getTime())) continue;
      if (publishDate < cutoff) continue;

      const title = entry.title?.trim();
      if (!title) continue;

      const link = entry.link?.trim();
      if (!link) continue;

      const snippet =
        entry.contentSnippet?.slice(0, 500) ??
        entry.content?.replace(/<[^>]+>/g, "").slice(0, 500) ??
        "";

      items.push({
        title,
        url: link,
        publishDate,
        snippet: snippet.trim(),
        source: feedTitle,
      });
    }

    log.info(
      { url, totalItems: feed.items.length, filteredItems: items.length },
      "RSS feed fetched",
    );

    return items;
  } catch (err) {
    log.error({ url, err }, "Failed to fetch RSS feed");
    return [];
  }
}

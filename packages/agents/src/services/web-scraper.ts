import { env } from "../config.js";
import { childLogger } from "../utils/logger.js";

const log = childLogger("web-scraper");

const FIRECRAWL_SCRAPE_URL = "https://api.firecrawl.dev/v1/scrape";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
export interface ScrapeResult {
  title: string;
  content: string;
  markdown: string;
}

// ---------------------------------------------------------------------------
// scrapeArticle — scrape a single URL via Firecrawl
// ---------------------------------------------------------------------------
export async function scrapeArticle(
  url: string,
): Promise<ScrapeResult | null> {
  const apiKey = env.firecrawlApiKey();

  if (!apiKey) {
    log.warn("FIRECRAWL_API_KEY not configured, skipping scrape");
    return null;
  }

  try {
    log.debug({ url }, "Scraping article via Firecrawl");

    const response = await fetch(FIRECRAWL_SCRAPE_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        url,
        formats: ["markdown"],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text().catch(() => "unknown");
      log.error(
        { url, status: response.status, errorText },
        "Firecrawl API error",
      );
      return null;
    }

    const json = await response.json();
    const data = json.data;

    if (!data) {
      log.warn({ url }, "Firecrawl returned no data");
      return null;
    }

    const result: ScrapeResult = {
      title: data.metadata?.title ?? data.title ?? "",
      content: data.content ?? data.text ?? "",
      markdown: data.markdown ?? "",
    };

    log.info(
      { url, titleLength: result.title.length, markdownLength: result.markdown.length },
      "Article scraped successfully",
    );

    return result;
  } catch (err) {
    log.error({ url, err }, "Failed to scrape article");
    return null;
  }
}

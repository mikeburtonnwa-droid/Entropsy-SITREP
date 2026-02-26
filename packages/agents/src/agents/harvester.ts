// ---------------------------------------------------------------------------
// Agents 02-04 — Industry News Harvester
// Fetches RSS feeds and web search results for a given industry, deduplicates,
// runs a quick AI relevance pre-filter, and writes surviving stories to the DB.
// ---------------------------------------------------------------------------

import { BaseAgent, type AgentContext } from "./base-agent.js";
import { MODELS, type Industry } from "../config.js";
import { SOURCES, type Source } from "../sources/registry.js";
import { fetchRssFeed, type FeedItem } from "../services/rss-fetcher.js";
import { webSearch, type SearchResult } from "../services/web-search.js";
import { callClaude } from "../services/anthropic.js";
import { normaliseUrl, dedup } from "../utils/dedup.js";
import { insertHarvestResults, type InsertHarvestResult } from "../db/queries/index.js";
import { hoursAgo } from "../utils/date.js";

// ---------------------------------------------------------------------------
// AI-relevance keywords used for cheap pre-filter before LLM scoring
// ---------------------------------------------------------------------------
const AI_KEYWORDS = [
  // --- Core AI terms ---
  "ai",
  "artificial intelligence",
  "machine learning",
  "ml",
  "deep learning",
  "llm",
  "large language model",
  "gpt",
  "claude",
  "generative ai",
  "gen ai",
  "genai",
  "automation",
  "chatbot",
  "copilot",
  "neural",
  "nlp",
  "natural language",
  "computer vision",
  "predictive",
  "algorithm",
  "model training",
  "fine-tun",
  "transformer",
  "agent",
  "agentic",
  "rag",
  "retrieval augmented",
  "embedding",
  "vector",

  // --- Retail & E-Commerce AI signals ---
  "personalization",
  "recommendation engine",
  "demand forecast",
  "dynamic pricing",
  "smart inventory",
  "customer analytics",
  "conversational commerce",
  "visual search",
  "supply chain optim",
  "automated fulfillment",

  // --- Financial Services AI signals ---
  "robo-advis",
  "fraud detection",
  "credit scoring",
  "risk model",
  "algorithmic trading",
  "regtech",
  "know your customer",
  "kyc",
  "anti-money laundering",
  "aml",
  "underwriting model",
  "fintech",

  // --- Cross-industry AI signals ---
  "intelligent automation",
  "robotic process",
  "rpa",
  "data-driven",
  "smart contract",
  "digital twin",
  "prescriptive analytics",
];

/**
 * A unified story shape used internally before DB insertion.
 */
interface RawStory {
  headline: string;
  url: string;
  publishDate: string;
  snippet: string;
  sourceName: string;
}

// ---------------------------------------------------------------------------
// Relevance scoring prompt
// ---------------------------------------------------------------------------
const RELEVANCE_SYSTEM_PROMPT = `You are a news relevance scorer for an AI-focused industry newsletter.
Given a list of story headlines and snippets for a specific industry, score each story from 0.0 to 1.0
based on how relevant it is to AI adoption, AI tools, or AI impact within that industry.

Respond with ONLY a JSON array of objects, each with "index" (0-based) and "score" (0.0-1.0).
Example: [{"index": 0, "score": 0.85}, {"index": 1, "score": 0.2}]`;

// ---------------------------------------------------------------------------
// HarvesterAgent
// ---------------------------------------------------------------------------
export class HarvesterAgent extends BaseAgent {
  readonly agentName = "harvester";
  private readonly industry: Industry;

  constructor(industry: Industry) {
    super();
    this.industry = industry;
  }

  protected async execute(ctx: AgentContext): Promise<void> {
    const { runId } = ctx;
    const since = hoursAgo(24);

    this.log.info({ industry: this.industry }, "Starting harvest");

    // ----------------------------------------------------------------
    // 1. Gather sources for this industry + universal sources
    // ----------------------------------------------------------------
    const industrySources = SOURCES.filter(
      (s) => s.industry === this.industry,
    );
    const universalSources = SOURCES.filter(
      (s) => s.industry === "universal",
    );
    const allSources = [...industrySources, ...universalSources];

    this.log.info(
      {
        industrySources: industrySources.length,
        universalSources: universalSources.length,
        total: allSources.length,
      },
      "Sources collected",
    );

    // ----------------------------------------------------------------
    // 2. Fetch from all sources (RSS + web_search), tolerating failures
    // ----------------------------------------------------------------
    const rawStories: RawStory[] = [];

    const fetchPromises = allSources.map(async (source) => {
      try {
        return await this.fetchSource(source, since);
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        this.log.warn(
          { source: source.sourceName, error: msg },
          "Source fetch failed — continuing with remaining sources",
        );
        return [];
      }
    });

    const results = await Promise.allSettled(fetchPromises);

    for (const result of results) {
      if (result.status === "fulfilled") {
        rawStories.push(...result.value);
      }
      // rejected results already logged inside fetchSource try/catch
    }

    this.log.info(
      { rawCount: rawStories.length },
      "Raw stories collected before dedup",
    );

    // ----------------------------------------------------------------
    // 3. Dedup by normalised URL
    // ----------------------------------------------------------------
    const unique = dedup(rawStories, (s) => normaliseUrl(s.url));
    this.log.info(
      { beforeDedup: rawStories.length, afterDedup: unique.length },
      "Deduplication complete",
    );

    if (unique.length === 0) {
      this.log.warn("No stories found after dedup — nothing to score");
      return;
    }

    // ----------------------------------------------------------------
    // 4. Keyword-based pre-filter (cheap, no LLM cost)
    // ----------------------------------------------------------------
    const keywordFiltered = unique.filter((story) =>
      this.passesKeywordFilter(story),
    );

    this.log.info(
      { beforeKeyword: unique.length, afterKeyword: keywordFiltered.length },
      "Keyword pre-filter complete",
    );

    if (keywordFiltered.length === 0) {
      this.log.warn("No stories passed keyword filter — nothing to score");
      return;
    }

    // ----------------------------------------------------------------
    // 5. LLM relevance pre-filter (Haiku — fast and cheap)
    // ----------------------------------------------------------------
    const scored = await this.scoreRelevance(keywordFiltered);

    // Keep stories with relevance >= 0.3 (generous threshold — curator
    // will apply stricter filtering later)
    const RELEVANCE_THRESHOLD = 0.3;
    const surviving = scored.filter((s) => s.score >= RELEVANCE_THRESHOLD);

    this.log.info(
      {
        scored: scored.length,
        surviving: surviving.length,
        threshold: RELEVANCE_THRESHOLD,
      },
      "LLM relevance scoring complete",
    );

    // ----------------------------------------------------------------
    // 6. Write to harvest_results table
    // ----------------------------------------------------------------
    const rows: InsertHarvestResult[] = surviving.map((s) => ({
      run_id: runId,
      industry: this.industry,
      source_name: s.story.sourceName,
      story_headline: s.story.headline,
      story_url: s.story.url,
      publish_date: s.story.publishDate,
      snippet: s.story.snippet,
      relevance_pre_score: s.score,
    }));

    const inserted = await insertHarvestResults(rows);

    this.log.info(
      {
        industry: this.industry,
        storiesHarvested: inserted.length,
      },
      "Harvest results written to DB",
    );
  }

  // --------------------------------------------------------------------
  // Source fetching
  // --------------------------------------------------------------------

  /**
   * Fetch stories from a single source based on its type.
   */
  private async fetchSource(
    source: Source,
    since: Date,
  ): Promise<RawStory[]> {
    switch (source.sourceType) {
      case "rss":
        return this.fetchRssSource(source, since);
      case "web_search":
        return this.fetchWebSearchSource(source);
      case "web_scrape":
        // web_scrape sources are not yet implemented — skip gracefully
        this.log.debug(
          { source: source.sourceName },
          "web_scrape source skipped (not implemented)",
        );
        return [];
      default:
        this.log.warn(
          { source: source.sourceName, type: source.sourceType },
          "Unknown source type — skipping",
        );
        return [];
    }
  }

  private async fetchRssSource(
    source: Source,
    since: Date,
  ): Promise<RawStory[]> {
    this.log.debug({ source: source.sourceName, url: source.feedUrl }, "Fetching RSS");

    const items: FeedItem[] = await fetchRssFeed(source.feedUrl, since);

    return items.map((item) => ({
      headline: item.title,
      url: item.url,
      publishDate: item.publishDate.toISOString(),
      snippet: item.snippet,
      sourceName: source.sourceName,
    }));
  }

  private async fetchWebSearchSource(
    source: Source,
  ): Promise<RawStory[]> {
    // The feedUrl for web_search sources contains the search query string
    const query = `${source.feedUrl} news ${this.industry.replace(/_/g, " ")}`;
    this.log.debug({ source: source.sourceName, query }, "Performing web search");

    const results: SearchResult[] = await webSearch(query, 10);

    return results.map((r) => ({
      headline: r.title,
      url: r.url,
      publishDate: new Date().toISOString(),
      snippet: r.snippet,
      sourceName: source.sourceName,
    }));
  }

  // --------------------------------------------------------------------
  // Keyword pre-filter
  // --------------------------------------------------------------------

  /**
   * Returns true if the headline or snippet contains at least one AI keyword.
   * This is a cheap heuristic to reduce the number of stories sent to the LLM.
   */
  private passesKeywordFilter(story: RawStory): boolean {
    const text = `${story.headline} ${story.snippet}`.toLowerCase();
    return AI_KEYWORDS.some((kw) => text.includes(kw));
  }

  // --------------------------------------------------------------------
  // LLM relevance scoring
  // --------------------------------------------------------------------

  /**
   * Score stories for AI relevance using Haiku. Processes in batches of 25
   * to stay within context limits and keep latency reasonable.
   */
  private async scoreRelevance(
    stories: RawStory[],
  ): Promise<Array<{ story: RawStory; score: number }>> {
    const BATCH_SIZE = 25;
    const allScored: Array<{ story: RawStory; score: number }> = [];

    for (let i = 0; i < stories.length; i += BATCH_SIZE) {
      const batch = stories.slice(i, i + BATCH_SIZE);
      const scored = await this.scoreBatch(batch, i);
      allScored.push(...scored);
    }

    return allScored;
  }

  private async scoreBatch(
    batch: RawStory[],
    globalOffset: number,
  ): Promise<Array<{ story: RawStory; score: number }>> {
    const storySummaries = batch
      .map(
        (s, idx) =>
          `[${idx}] "${s.headline}"\n    ${s.snippet.slice(0, 200)}`,
      )
      .join("\n\n");

    const userMessage = `Industry: ${this.industry.replace(/_/g, " ")}\n\nStories:\n${storySummaries}`;

    try {
      const result = await callClaude({
        model: MODELS.harvester,
        system: RELEVANCE_SYSTEM_PROMPT,
        messages: [{ role: "user", content: userMessage }],
        maxTokens: 2048,
      });

      this.trackTokens(result.inputTokens, result.outputTokens, result.costUsd);

      // Parse the JSON array of scores
      const scores = this.parseScores(result.content, batch.length);

      return batch.map((story, idx) => ({
        story,
        score: scores[idx] ?? 0,
      }));
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      this.log.warn(
        { error: msg, batchOffset: globalOffset, batchSize: batch.length },
        "LLM scoring failed for batch — assigning default score of 0.5",
      );

      // On LLM failure, assign a neutral score so stories are not lost
      return batch.map((story) => ({ story, score: 0.5 }));
    }
  }

  /**
   * Parse the LLM's JSON response into a score map indexed by position.
   * Falls back gracefully if the JSON is malformed.
   */
  private parseScores(
    content: string,
    expectedCount: number,
  ): Record<number, number> {
    const scores: Record<number, number> = {};

    try {
      // Extract JSON array from potential markdown fences
      const jsonMatch =
        content.match(/```(?:json)?\s*\n?([\s\S]*?)\n?```/) ??
        content.match(/(\[[\s\S]*\])/);

      const raw = jsonMatch ? jsonMatch[1].trim() : content.trim();
      const parsed: Array<{ index: number; score: number }> = JSON.parse(raw);

      if (Array.isArray(parsed)) {
        for (const entry of parsed) {
          if (
            typeof entry.index === "number" &&
            typeof entry.score === "number" &&
            entry.index >= 0 &&
            entry.index < expectedCount
          ) {
            scores[entry.index] = Math.max(0, Math.min(1, entry.score));
          }
        }
      }
    } catch {
      this.log.warn("Failed to parse LLM relevance scores — using defaults");
    }

    return scores;
  }
}

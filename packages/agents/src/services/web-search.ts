import Anthropic from "@anthropic-ai/sdk";
import { env } from "../config.js";
import { childLogger } from "../utils/logger.js";

const log = childLogger("web-search");

// ---------------------------------------------------------------------------
// Lazy singleton client (shared initialization pattern)
// ---------------------------------------------------------------------------
let _client: Anthropic | null = null;

function getClient(): Anthropic {
  if (!_client) {
    _client = new Anthropic({ apiKey: env.anthropicApiKey() });
  }
  return _client;
}

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
export interface SearchResult {
  title: string;
  url: string;
  snippet: string;
}

/**
 * The web_search server-side tool was introduced in the Anthropic API
 * (2025-03-05) but SDK v0.39 does not include type definitions for it.
 * We use explicit `as any` casts at the boundary to keep the rest of
 * the codebase fully typed.
 */

// ---------------------------------------------------------------------------
// webSearch — use Anthropic's web_search tool to find information
// ---------------------------------------------------------------------------
export async function webSearch(
  query: string,
  maxResults: number = 10,
): Promise<SearchResult[]> {
  const client = getClient();

  log.debug({ query, maxResults }, "Performing web search");

  try {
    // The web_search tool type is not in the SDK types at v0.39, so we
    // cast the tools array to satisfy the compiler while still sending
    // the correct payload to the API.
    const response = await client.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 4096,
      tools: [
        {
          type: "web_search_20250305",
          name: "web_search",
          max_uses: maxResults,
        } as any,
      ],
      messages: [
        {
          role: "user",
          content: `Search the web for: ${query}\n\nReturn the most relevant and recent results.`,
        },
      ],
    });

    const results: SearchResult[] = [];

    for (const block of response.content as any[]) {
      if (block.type === "web_search_tool_result") {
        // Each web_search_tool_result contains search result entries
        for (const entry of block.content ?? []) {
          if (entry.type === "web_search_result") {
            results.push({
              title: entry.title ?? "",
              url: entry.url ?? "",
              snippet: entry.snippet ?? entry.content ?? "",
            });
          }
        }
      }
    }

    log.info(
      { query, resultCount: results.length },
      "Web search completed",
    );

    return results.slice(0, maxResults);
  } catch (err) {
    log.error({ query, err }, "Web search failed");
    return [];
  }
}

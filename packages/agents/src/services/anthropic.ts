import Anthropic from "@anthropic-ai/sdk";
import { z, type ZodSchema } from "zod";
import { env } from "../config.js";
import { childLogger } from "../utils/logger.js";

const log = childLogger("anthropic");

// ---------------------------------------------------------------------------
// Lazy singleton client
// ---------------------------------------------------------------------------
let _client: Anthropic | null = null;

function getClient(): Anthropic {
  if (!_client) {
    _client = new Anthropic({ apiKey: env.anthropicApiKey() });
  }
  return _client;
}

// ---------------------------------------------------------------------------
// Pricing per million tokens (USD)
// ---------------------------------------------------------------------------
const PRICING: Record<string, { input: number; output: number }> = {
  "claude-haiku-4-5-20251001": { input: 0.80, output: 4.0 },
  "claude-sonnet-4-6-20250514": { input: 3.0, output: 15.0 },
};

function estimateCost(
  model: string,
  inputTokens: number,
  outputTokens: number,
): number {
  // Fall back to sonnet pricing for unknown models
  const pricing = PRICING[model] ?? PRICING["claude-sonnet-4-6-20250514"];
  return (
    (inputTokens / 1_000_000) * pricing.input +
    (outputTokens / 1_000_000) * pricing.output
  );
}

// ---------------------------------------------------------------------------
// callClaude — generic message wrapper with token tracking
// ---------------------------------------------------------------------------
export interface CallClaudeOptions {
  model: string;
  system: string;
  messages: Anthropic.MessageParam[];
  maxTokens?: number;
}

export interface CallClaudeResult {
  content: string;
  inputTokens: number;
  outputTokens: number;
  costUsd: number;
}

export async function callClaude(
  options: CallClaudeOptions,
): Promise<CallClaudeResult> {
  const { model, system, messages, maxTokens = 4096 } = options;
  const client = getClient();

  log.debug({ model, messageCount: messages.length }, "Calling Claude");

  const response = await client.messages.create({
    model,
    max_tokens: maxTokens,
    system,
    messages,
  });

  const inputTokens = response.usage.input_tokens;
  const outputTokens = response.usage.output_tokens;
  const costUsd = estimateCost(model, inputTokens, outputTokens);

  // Extract text from content blocks
  const content = response.content
    .filter((block): block is Anthropic.TextBlock => block.type === "text")
    .map((block) => block.text)
    .join("");

  log.debug(
    { inputTokens, outputTokens, costUsd: costUsd.toFixed(6) },
    "Claude response received",
  );

  return { content, inputTokens, outputTokens, costUsd };
}

// ---------------------------------------------------------------------------
// callClaudeJson — parse response through Zod with one retry on failure
// ---------------------------------------------------------------------------
export interface CallClaudeJsonOptions<T> extends CallClaudeOptions {
  schema: ZodSchema<T>;
}

export async function callClaudeJson<T>(
  options: CallClaudeJsonOptions<T>,
): Promise<{ data: T; inputTokens: number; outputTokens: number; costUsd: number }> {
  const { schema, ...callOptions } = options;

  let totalInputTokens = 0;
  let totalOutputTokens = 0;
  let totalCost = 0;

  // First attempt
  const first = await callClaude(callOptions);
  totalInputTokens += first.inputTokens;
  totalOutputTokens += first.outputTokens;
  totalCost += first.costUsd;

  const jsonText = extractJson(first.content);
  const firstParse = schema.safeParse(JSON.parse(jsonText));

  if (firstParse.success) {
    return {
      data: firstParse.data,
      inputTokens: totalInputTokens,
      outputTokens: totalOutputTokens,
      costUsd: totalCost,
    };
  }

  // Retry once with the validation error appended
  log.warn(
    { error: firstParse.error.message },
    "JSON parse failed, retrying with error feedback",
  );

  const retryMessages: Anthropic.MessageParam[] = [
    ...callOptions.messages,
    { role: "assistant", content: first.content },
    {
      role: "user",
      content: `Your previous response failed JSON schema validation with this error:\n\n${firstParse.error.message}\n\nPlease fix the JSON and respond with only the corrected JSON.`,
    },
  ];

  const second = await callClaude({ ...callOptions, messages: retryMessages });
  totalInputTokens += second.inputTokens;
  totalOutputTokens += second.outputTokens;
  totalCost += second.costUsd;

  const retryJsonText = extractJson(second.content);
  const secondParse = schema.safeParse(JSON.parse(retryJsonText));

  if (secondParse.success) {
    return {
      data: secondParse.data,
      inputTokens: totalInputTokens,
      outputTokens: totalOutputTokens,
      costUsd: totalCost,
    };
  }

  throw new Error(
    `Claude JSON validation failed after retry: ${secondParse.error.message}`,
  );
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Extract JSON from a response that may contain markdown code fences. */
function extractJson(text: string): string {
  // Try to extract from ```json ... ``` blocks
  const fenceMatch = text.match(/```(?:json)?\s*\n?([\s\S]*?)\n?```/);
  if (fenceMatch) return fenceMatch[1].trim();

  // Otherwise try to find raw JSON (object or array)
  const objectMatch = text.match(/(\{[\s\S]*\})/);
  if (objectMatch) return objectMatch[1].trim();

  const arrayMatch = text.match(/(\[[\s\S]*\])/);
  if (arrayMatch) return arrayMatch[1].trim();

  // Return as-is; JSON.parse will throw if invalid
  return text.trim();
}

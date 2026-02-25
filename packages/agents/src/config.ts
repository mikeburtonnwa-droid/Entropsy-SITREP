import { config } from "dotenv";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

// Load .env from monorepo root (local dev only — Railway injects env vars directly)
const __dirname = dirname(fileURLToPath(import.meta.url));
// Try monorepo root from src/, then from dist/ (compiled output)
config({ path: resolve(__dirname, "../../../.env") });
config({ path: resolve(__dirname, "../../../../.env") });

// ---------------------------------------------------------------------------
// Model assignments (optimised from PRD — Sonnet replaces Opus for cost)
// ---------------------------------------------------------------------------
export const MODELS = {
  orchestrator: "claude-haiku-4-5-20251001",
  harvester: "claude-haiku-4-5-20251001",
  curator: "claude-sonnet-4-6",
  writer: "claude-sonnet-4-6",
  qualityGate: "claude-sonnet-4-6",
} as const;

export type ModelRole = keyof typeof MODELS;

// ---------------------------------------------------------------------------
// Industries
// ---------------------------------------------------------------------------
export const INDUSTRIES = [
  "professional_services",
  "financial_services",
  "retail_ecommerce",
] as const;

export type Industry = (typeof INDUSTRIES)[number];

export const INDUSTRY_LABELS: Record<Industry, string> = {
  professional_services: "Professional Services",
  financial_services: "Financial Services",
  retail_ecommerce: "Retail & E-Commerce",
};

// ---------------------------------------------------------------------------
// Pipeline timing
// ---------------------------------------------------------------------------
export const TIMEOUTS_MS = {
  harvester: 10 * 60_000, // 10 min
  curator: 8 * 60_000, // 8 min
  writer: 15 * 60_000, // 15 min
  qualityGate: 10 * 60_000, // 10 min
  publisher: 5 * 60_000, // 5 min
} as const;

// ---------------------------------------------------------------------------
// Retry config
// ---------------------------------------------------------------------------
export const RETRY = {
  maxAttempts: 4,
  baseDelayMs: 5_000,
  maxDelayMs: 30_000,
} as const;

// ---------------------------------------------------------------------------
// Content thresholds
// ---------------------------------------------------------------------------
export const CONTENT = {
  minStoriesPerIndustry: 3,
  maxStoriesPerIndustry: 5,
  curatorMinScore: 60,
  curatorFallbackScore: 45,
  qaEscalateThreshold: 0.2, // halt if >20% escalated
  maxCostPerRunUsd: parseFloat(process.env.MAX_COST_PER_RUN_USD ?? "8.00"),
} as const;

// ---------------------------------------------------------------------------
// Environment variables
// ---------------------------------------------------------------------------
function required(key: string): string {
  const val = process.env[key];
  if (!val) throw new Error(`Missing required env var: ${key}`);
  return val;
}

export const env = {
  anthropicApiKey: () => required("ANTHROPIC_API_KEY"),
  supabaseUrl: () => required("SUPABASE_URL"),
  supabaseServiceKey: () => required("SUPABASE_SERVICE_KEY"),
  firecrawlApiKey: () => process.env.FIRECRAWL_API_KEY ?? "",
  bufferAccessToken: () => process.env.BUFFER_ACCESS_TOKEN ?? "",
  slackWebhookUrl: () => process.env.SLACK_WEBHOOK_URL ?? "",
  timezone: process.env.PIPELINE_TIMEZONE ?? "America/Chicago",
  logLevel: (process.env.LOG_LEVEL ?? "info") as "debug" | "info" | "warn" | "error",
};

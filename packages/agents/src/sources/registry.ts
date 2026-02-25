// ---------------------------------------------------------------------------
// Source Registry — all 44 news sources from the PRD
// ---------------------------------------------------------------------------

import type { Industry } from "../types/pipeline.js";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/** Extended industry type that includes the "universal" category for cross-vertical AI sources. */
export type SourceIndustry = Industry | "universal";

export type SourceType = "rss" | "web_scrape" | "web_search";

export interface Source {
  industry: SourceIndustry;
  sourceName: string;
  feedUrl: string;
  sourceType: SourceType;
}

// ---------------------------------------------------------------------------
// Professional Services (12 sources)
// ---------------------------------------------------------------------------

const PROFESSIONAL_SERVICES: Source[] = [
  {
    industry: "professional_services",
    sourceName: "Law.com",
    feedUrl: "https://feeds.law.com/rss/legaltech",
    sourceType: "rss",
  },
  {
    industry: "professional_services",
    sourceName: "Above the Law",
    feedUrl: "https://abovethelaw.com/feed/",
    sourceType: "rss",
  },
  {
    industry: "professional_services",
    sourceName: "The American Lawyer",
    feedUrl: "https://americanlawyer.com/rss/",
    sourceType: "rss",
  },
  {
    industry: "professional_services",
    sourceName: "AccountingToday",
    feedUrl: "https://accountingtoday.com/feeds",
    sourceType: "rss",
  },
  {
    industry: "professional_services",
    sourceName: "Journal of Accountancy",
    feedUrl: "https://journalofaccountancy.com/rss",
    sourceType: "rss",
  },
  {
    industry: "professional_services",
    sourceName: "Consulting.us",
    feedUrl: "https://consulting.us/rss",
    sourceType: "rss",
  },
  {
    industry: "professional_services",
    sourceName: "McKinsey Insights",
    feedUrl: "https://mckinsey.com/rss/insights",
    sourceType: "rss",
  },
  {
    industry: "professional_services",
    sourceName: "Harvard Business Review",
    feedUrl: "https://hbr.org/rss",
    sourceType: "rss",
  },
  {
    industry: "professional_services",
    sourceName: "Thomson Reuters Legal",
    feedUrl: "https://reuters.com/legal/rss",
    sourceType: "rss",
  },
  {
    industry: "professional_services",
    sourceName: "Bloomberg Law",
    feedUrl: "site:news.bloomberglaw.com",
    sourceType: "web_scrape",
  },
  {
    industry: "professional_services",
    sourceName: "AI Legal Services Search",
    feedUrl: "AI legal services",
    sourceType: "web_search",
  },
  {
    industry: "professional_services",
    sourceName: "AI Accounting Automation Search",
    feedUrl: "AI accounting automation",
    sourceType: "web_search",
  },
];

// ---------------------------------------------------------------------------
// Financial Services (12 sources)
// ---------------------------------------------------------------------------

const FINANCIAL_SERVICES: Source[] = [
  {
    industry: "financial_services",
    sourceName: "Financial Times",
    feedUrl: "https://ft.com/rss/home/technology",
    sourceType: "rss",
  },
  {
    industry: "financial_services",
    sourceName: "American Banker",
    feedUrl: "https://americanbanker.com/feeds/latest",
    sourceType: "rss",
  },
  {
    industry: "financial_services",
    sourceName: "Finextra",
    feedUrl: "https://finextra.com/rss",
    sourceType: "rss",
  },
  {
    industry: "financial_services",
    sourceName: "PYMNTS",
    feedUrl: "https://pymnts.com/feed/",
    sourceType: "rss",
  },
  {
    industry: "financial_services",
    sourceName: "Insurance Journal",
    feedUrl: "https://insurancejournal.com/rss/",
    sourceType: "rss",
  },
  {
    industry: "financial_services",
    sourceName: "Risk.net",
    feedUrl: "https://risk.net/rss",
    sourceType: "rss",
  },
  {
    industry: "financial_services",
    sourceName: "CFA Institute Blog",
    feedUrl: "https://blogs.cfainstitute.org/rss",
    sourceType: "rss",
  },
  {
    industry: "financial_services",
    sourceName: "Deloitte Insights",
    feedUrl: "https://deloitte.com/rss/financial-services",
    sourceType: "rss",
  },
  {
    industry: "financial_services",
    sourceName: "Reuters Finance",
    feedUrl: "https://reuters.com/finance/rss",
    sourceType: "rss",
  },
  {
    industry: "financial_services",
    sourceName: "Bloomberg Finance",
    feedUrl: "site:bloomberg.com/finance",
    sourceType: "web_scrape",
  },
  {
    industry: "financial_services",
    sourceName: "AI Banking Fintech Search",
    feedUrl: "AI banking fintech",
    sourceType: "web_search",
  },
  {
    industry: "financial_services",
    sourceName: "AI Insurance Underwriting Search",
    feedUrl: "AI insurance underwriting",
    sourceType: "web_search",
  },
];

// ---------------------------------------------------------------------------
// Retail & E-Commerce (12 sources)
// ---------------------------------------------------------------------------

const RETAIL_ECOMMERCE: Source[] = [
  {
    industry: "retail_ecommerce",
    sourceName: "Retail Dive",
    feedUrl: "https://retaildive.com/feeds/news/",
    sourceType: "rss",
  },
  {
    industry: "retail_ecommerce",
    sourceName: "Modern Retail",
    feedUrl: "https://modernretail.co/rss",
    sourceType: "rss",
  },
  {
    industry: "retail_ecommerce",
    sourceName: "PYMNTS Commerce",
    feedUrl: "https://pymnts.com/commerce/feed/",
    sourceType: "rss",
  },
  {
    industry: "retail_ecommerce",
    sourceName: "Digital Commerce 360",
    feedUrl: "https://digitalcommerce360.com/feed/",
    sourceType: "rss",
  },
  {
    industry: "retail_ecommerce",
    sourceName: "Glossy",
    feedUrl: "https://glossy.co/rss",
    sourceType: "rss",
  },
  {
    industry: "retail_ecommerce",
    sourceName: "WWD Technology",
    feedUrl: "https://wwd.com/business-news/technology/rss",
    sourceType: "rss",
  },
  {
    industry: "retail_ecommerce",
    sourceName: "Chain Store Age",
    feedUrl: "https://chainstoreage.com/rss",
    sourceType: "rss",
  },
  {
    industry: "retail_ecommerce",
    sourceName: "Supply Chain Dive",
    feedUrl: "https://supplychaindive.com/feeds/news/",
    sourceType: "rss",
  },
  {
    industry: "retail_ecommerce",
    sourceName: "Shopify Blog",
    feedUrl: "https://shopify.com/blog.atom",
    sourceType: "rss",
  },
  {
    industry: "retail_ecommerce",
    sourceName: "NRF News",
    feedUrl: "https://nrf.com/rss.xml",
    sourceType: "rss",
  },
  {
    industry: "retail_ecommerce",
    sourceName: "AI Retail Personalization Search",
    feedUrl: "AI retail personalization",
    sourceType: "web_search",
  },
  {
    industry: "retail_ecommerce",
    sourceName: "AI E-Commerce Forecasting Search",
    feedUrl: "AI e-commerce forecasting",
    sourceType: "web_search",
  },
];

// ---------------------------------------------------------------------------
// Universal AI Sources (8 sources)
// ---------------------------------------------------------------------------

const UNIVERSAL: Source[] = [
  // --- Verified working (from original) ---
  {
    industry: "universal",
    sourceName: "TechCrunch AI",
    feedUrl: "https://techcrunch.com/category/artificial-intelligence/feed/",
    sourceType: "rss",
  },
  {
    industry: "universal",
    sourceName: "VentureBeat AI",
    feedUrl: "https://venturebeat.com/category/ai/feed/",
    sourceType: "rss",
  },
  {
    industry: "universal",
    sourceName: "The Verge AI",
    feedUrl: "https://theverge.com/rss/ai/index.xml",
    sourceType: "rss",
  },
  {
    industry: "universal",
    sourceName: "ArsTechnica AI",
    feedUrl: "https://feeds.arstechnica.com/arstechnica/technology-lab",
    sourceType: "rss",
  },
  // --- Replaced broken feeds with verified working ones ---
  {
    industry: "universal",
    sourceName: "MIT Technology Review AI",
    feedUrl: "https://www.technologyreview.com/topic/artificial-intelligence/feed",
    sourceType: "rss",
  },
  {
    industry: "universal",
    sourceName: "Bloomberg Technology",
    feedUrl: "https://feeds.bloomberg.com/technology/news.rss",
    sourceType: "rss",
  },
  {
    industry: "universal",
    sourceName: "CNBC Technology",
    feedUrl: "https://www.cnbc.com/id/19854910/device/rss/rss.html",
    sourceType: "rss",
  },
  {
    industry: "universal",
    sourceName: "Techmeme",
    feedUrl: "https://www.techmeme.com/feed.xml",
    sourceType: "rss",
  },
  // --- New: AI lab official blogs ---
  {
    industry: "universal",
    sourceName: "OpenAI Blog",
    feedUrl: "https://openai.com/blog/rss.xml",
    sourceType: "rss",
  },
  {
    industry: "universal",
    sourceName: "Google AI Blog",
    feedUrl: "https://blog.google/technology/ai/rss/",
    sourceType: "rss",
  },
  {
    industry: "universal",
    sourceName: "Microsoft AI Blog",
    feedUrl: "https://blogs.microsoft.com/ai/feed/",
    sourceType: "rss",
  },
  // --- New: Broader tech/AI coverage ---
  {
    industry: "universal",
    sourceName: "Engadget",
    feedUrl: "https://www.engadget.com/rss.xml",
    sourceType: "rss",
  },
  {
    industry: "universal",
    sourceName: "IEEE Spectrum AI",
    feedUrl: "https://spectrum.ieee.org/feeds/topic/artificial-intelligence.rss",
    sourceType: "rss",
  },
  {
    industry: "universal",
    sourceName: "SiliconANGLE",
    feedUrl: "https://siliconangle.com/feed/",
    sourceType: "rss",
  },
  {
    industry: "universal",
    sourceName: "NBC News Technology",
    feedUrl: "https://feeds.nbcnews.com/nbcnews/public/tech",
    sourceType: "rss",
  },
  {
    industry: "universal",
    sourceName: "AI News",
    feedUrl: "https://www.artificialintelligence-news.com/feed/",
    sourceType: "rss",
  },
  {
    industry: "universal",
    sourceName: "Hacker News",
    feedUrl: "https://news.ycombinator.com/rss",
    sourceType: "rss",
  },
  {
    industry: "universal",
    sourceName: "9to5Google",
    feedUrl: "https://9to5google.com/feed/",
    sourceType: "rss",
  },
];

// ---------------------------------------------------------------------------
// Combined registry — all 44 sources
// ---------------------------------------------------------------------------

export const SOURCES: Source[] = [
  ...PROFESSIONAL_SERVICES,
  ...FINANCIAL_SERVICES,
  ...RETAIL_ECOMMERCE,
  ...UNIVERSAL,
];

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
    sourceName: "MIT Technology Review",
    feedUrl: "https://feeds.feedburner.com/mit-tech-review",
    sourceType: "rss",
  },
  {
    industry: "universal",
    sourceName: "Wired AI",
    feedUrl: "https://wired.com/feed/category/artificial-intelligence/latest/rss",
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
  {
    industry: "universal",
    sourceName: "Axios AI",
    feedUrl: "https://axios.com/feeds/technology.rss",
    sourceType: "rss",
  },
  {
    industry: "universal",
    sourceName: "WSJ Technology",
    feedUrl: "https://wsj.com/rss/technology.xml",
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

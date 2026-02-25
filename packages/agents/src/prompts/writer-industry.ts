import type { Industry } from "../config.js";

interface WriterAddendum {
  coreFrame: string;
  hotButtons: string[];
  audienceFear: string;
  desiredOutcome: string;
}

const ADDENDA: Record<Industry, WriterAddendum> = {
  professional_services: {
    coreFrame:
      "For every story, answer: 'What does this mean for a law firm / accounting firm / consulting firm trying to serve clients better and protect its own relevance?'",
    hotButtons: [
      "AI replacing billable hours",
      "LLM contract review vs. junior associates",
      "Big 4 AI strategies",
      "Bar association AI guidance",
      "AI audit tools",
      "Client advisory on AI risk",
    ],
    audienceFear:
      "Am I going to be replaced? Are my clients going to bypass me? Is my firm moving fast enough?",
    desiredOutcome:
      "Reader finishes the post and thinks: 'I need to show this to my managing partner.'",
  },
  financial_services: {
    coreFrame:
      "For every story, answer: 'What does this mean for a bank / insurer / wealth manager trying to serve clients, manage risk, and stay compliant?'",
    hotButtons: [
      "AI in underwriting and credit decisions",
      "Robo-advisory vs. human advisors",
      "Fraud detection accuracy",
      "RegTech and compliance automation",
      "AI model risk management",
    ],
    audienceFear:
      "Is my risk model still valid? Are fintechs going to eat our lunch? Is the regulator watching this?",
    desiredOutcome:
      "Reader finishes and thinks: 'I need to bring this to our CRO / innovation committee.'",
  },
  retail_ecommerce: {
    coreFrame:
      "For every story, answer: 'What does this mean for a retailer or e-commerce brand trying to sell more, waste less, and keep customers coming back?'",
    hotButtons: [
      "AI personalization and recommendation engines",
      "Demand forecasting and inventory",
      "AI merchandising and visual search",
      "Customer service automation",
      "Supply chain optimization",
    ],
    audienceFear:
      "Are Amazon and the big platforms going to make our advantages irrelevant? Are we spending on the right AI tools?",
    desiredOutcome:
      "Reader finishes and thinks: 'I need to test this with our digital team this quarter.'",
  },
};

export function getWriterIndustryAddendum(industry: Industry): WriterAddendum {
  return ADDENDA[industry];
}

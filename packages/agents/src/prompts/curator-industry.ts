import type { Industry } from "../config.js";

interface IndustryAddendum {
  audienceRole: string;
  firmType: string;
  hotButtons: string[];
}

const ADDENDA: Record<Industry, IndustryAddendum> = {
  professional_services: {
    audienceRole: "Partner / Managing Director",
    firmType: "mid-size to large law firm, accounting firm, or consulting firm",
    hotButtons: [
      "AI replacing billable hours",
      "LLM contract review vs. junior associates",
      "Big 4 AI strategies",
      "Bar association AI guidance",
      "AI audit tools",
      "Client advisory on AI risk",
    ],
  },
  financial_services: {
    audienceRole: "VP / CRO / Head of Innovation",
    firmType: "bank, insurance company, or wealth management firm",
    hotButtons: [
      "AI in underwriting and credit decisions",
      "Robo-advisory vs. human advisors",
      "Fraud detection accuracy",
      "RegTech and compliance automation",
      "AI model risk management",
    ],
  },
  retail_ecommerce: {
    audienceRole: "VP Digital / Category Manager / Head of E-Commerce",
    firmType: "retailer, e-commerce brand, or CPG company",
    hotButtons: [
      "AI personalization and recommendation engines",
      "Demand forecasting and inventory",
      "AI merchandising and visual search",
      "Customer service automation",
      "Supply chain optimization",
    ],
  },
};

export function getCuratorIndustryAddendum(industry: Industry): IndustryAddendum {
  return ADDENDA[industry];
}

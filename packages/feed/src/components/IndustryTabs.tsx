"use client";

import { useState } from "react";

const INDUSTRIES = [
  { id: "professional_services", label: "Professional Services" },
  { id: "financial_services", label: "Financial Services" },
  { id: "retail_ecommerce", label: "Retail & E-Commerce" },
] as const;

interface IndustryTabsProps {
  activeIndustry: string;
  onChange: (industry: string) => void;
}

export function IndustryTabs({ activeIndustry, onChange }: IndustryTabsProps) {
  return (
    <div className="flex gap-1 rounded-lg bg-gray-100 p-1">
      {INDUSTRIES.map((ind) => (
        <button
          key={ind.id}
          onClick={() => onChange(ind.id)}
          className={`rounded-md px-4 py-2 text-sm font-medium transition-colors ${
            activeIndustry === ind.id
              ? "bg-white text-gray-900 shadow-sm"
              : "text-gray-600 hover:text-gray-900"
          }`}
        >
          {ind.label}
        </button>
      ))}
    </div>
  );
}

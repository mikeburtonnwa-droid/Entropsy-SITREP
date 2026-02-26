"use client";

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
    <div className="flex flex-wrap gap-2">
      {INDUSTRIES.map((ind) => (
        <button
          key={ind.id}
          onClick={() => onChange(ind.id)}
          className={`rounded border px-4 py-2 text-[13px] uppercase tracking-wide transition-all ${
            activeIndustry === ind.id
              ? "border-[rgba(64,224,144,0.4)] bg-[rgba(64,224,144,0.06)] text-[var(--text)]"
              : "border-[var(--border)] bg-[var(--bg-card)] text-[var(--text-muted)] hover:border-[var(--border-hover)] hover:text-[var(--text)]"
          }`}
          style={{ fontFamily: "var(--font-mono)" }}
        >
          {ind.label}
        </button>
      ))}
    </div>
  );
}

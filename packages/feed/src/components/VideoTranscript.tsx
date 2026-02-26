"use client";

import { useState } from "react";
import { CopyToClipboard } from "./CopyToClipboard";

const VARIANTS = [
  { id: "a", label: "Talking Head" },
  { id: "b", label: "AI Avatar" },
  { id: "c", label: "Caption Cards" },
] as const;

interface VideoTranscriptProps {
  scriptA: string;
  scriptB: string;
  scriptC: string;
}

export function VideoTranscript({
  scriptA,
  scriptB,
  scriptC,
}: VideoTranscriptProps) {
  const [activeVariant, setActiveVariant] = useState<"a" | "b" | "c">("a");

  const scripts = { a: scriptA, b: scriptB, c: scriptC };
  const activeScript = scripts[activeVariant];

  return (
    <div className="rounded border border-[var(--border)] bg-[var(--bg-card)]">
      <div className="flex border-b border-[var(--border)]">
        {VARIANTS.map((v) => (
          <button
            key={v.id}
            onClick={() => setActiveVariant(v.id)}
            className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
              activeVariant === v.id
                ? "border-b-2 border-[var(--accent)] text-[var(--accent)]"
                : "text-[var(--text-muted)] hover:text-[var(--text)]"
            }`}
            style={{ fontFamily: "var(--font-mono)" }}
          >
            {v.label}
          </button>
        ))}
      </div>
      <div className="p-4">
        <pre
          className="mb-3 max-h-64 overflow-y-auto whitespace-pre-wrap rounded border border-[var(--border)] bg-[var(--bg-card)] p-4 text-sm leading-relaxed text-[var(--text)]"
          style={{ fontFamily: "var(--font-sans)" }}
        >
          {activeScript}
        </pre>
        <CopyToClipboard text={activeScript} />
      </div>
    </div>
  );
}

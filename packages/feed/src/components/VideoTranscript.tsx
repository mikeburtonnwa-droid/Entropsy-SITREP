"use client";

import { useState } from "react";
import { CopyToClipboard } from "./CopyToClipboard.js";

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
    <div className="rounded-lg border border-gray-200 bg-white">
      <div className="flex border-b border-gray-200">
        {VARIANTS.map((v) => (
          <button
            key={v.id}
            onClick={() => setActiveVariant(v.id)}
            className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
              activeVariant === v.id
                ? "border-b-2 border-blue-600 text-blue-600"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            {v.label}
          </button>
        ))}
      </div>
      <div className="p-4">
        <pre className="mb-3 max-h-64 overflow-y-auto whitespace-pre-wrap rounded bg-gray-50 p-4 text-sm leading-relaxed text-gray-800">
          {activeScript}
        </pre>
        <CopyToClipboard text={activeScript} />
      </div>
    </div>
  );
}

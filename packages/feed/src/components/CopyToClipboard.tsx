"use client";

import { useState, useCallback } from "react";

interface CopyToClipboardProps {
  text: string;
  label?: string;
}

export function CopyToClipboard({
  text,
  label = "Copy to clipboard",
}: CopyToClipboardProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      const textarea = document.createElement("textarea");
      textarea.value = text;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand("copy");
      document.body.removeChild(textarea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }, [text]);

  return (
    <button
      onClick={handleCopy}
      className={`btn btn--sm transition-all ${
        copied
          ? "border-[var(--accent)] bg-[var(--accent)] text-[var(--bg)]"
          : ""
      }`}
    >
      {copied ? "Copied!" : label}
    </button>
  );
}

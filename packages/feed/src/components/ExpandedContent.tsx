"use client";

import { useState } from "react";
import { CopyToClipboard } from "./CopyToClipboard";
import { VideoTranscript } from "./VideoTranscript";

interface ExpandedContentProps {
  content: {
    brief?: string;
    morning_brief?: string;
    linkedin?: string;
    facebook?: string;
    video_a?: string;
    video_b?: string;
    video_c?: string;
  };
}

function SocialPost({ text }: { text: string }) {
  const lines = text.split("\n");

  return (
    <pre className="social-post">
      {lines.map((line, i) => {
        const isFirst = i === 0;
        const isHashtag = line.trimStart().startsWith("#");

        let className = "";
        if (isFirst) className = "text-[var(--text)] font-medium";
        else if (isHashtag) className = "text-[var(--accent)]";

        return (
          <span key={i} className={className}>
            {line}
            {i < lines.length - 1 ? "\n" : ""}
          </span>
        );
      })}
    </pre>
  );
}

function AccordionSection({
  id,
  label,
  isOpen,
  onToggle,
  children,
}: {
  id: string;
  label: string;
  isOpen: boolean;
  onToggle: (id: string) => void;
  children: React.ReactNode;
}) {
  return (
    <div className="expanded-section">
      <button
        className="accordion-header"
        onClick={(e) => {
          e.stopPropagation();
          onToggle(id);
        }}
        aria-expanded={isOpen}
      >
        <span className="overline" style={{ marginBottom: 0 }}>
          {label}
        </span>
        <span
          className={`expand-chevron ${isOpen ? "expand-chevron--open" : ""}`}
          aria-hidden="true"
        >
          ▾
        </span>
      </button>
      <div className={`expand-wrapper ${isOpen ? "expand-wrapper--open" : ""}`}>
        <div>{children}</div>
      </div>
    </div>
  );
}

export function ExpandedContent({ content }: ExpandedContentProps) {
  const [openSections, setOpenSections] = useState<Set<string>>(new Set());

  function toggleSection(id: string) {
    setOpenSections((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }

  return (
    <div className="mt-4">
      {/* Section 1 — Full Morning Brief (always visible) */}
      {(content.morning_brief || content.brief) && (
        <div className="expanded-section">
          <span className="overline">Morning Brief</span>
          <div
            className="text-sm leading-relaxed text-[var(--text-muted)]"
            dangerouslySetInnerHTML={{ __html: content.morning_brief ?? content.brief! }}
          />
          <div className="mt-3">
            <CopyToClipboard text={content.morning_brief ?? content.brief!} label="Copy brief" />
          </div>
        </div>
      )}

      {/* Section 2 — LinkedIn Post (accordion) */}
      {content.linkedin && (
        <AccordionSection
          id="linkedin"
          label="LinkedIn"
          isOpen={openSections.has("linkedin")}
          onToggle={toggleSection}
        >
          <SocialPost text={content.linkedin} />
          <div className="mt-3">
            <CopyToClipboard text={content.linkedin} label="Copy post" />
          </div>
        </AccordionSection>
      )}

      {/* Section 3 — Facebook Post (accordion) */}
      {content.facebook && (
        <AccordionSection
          id="facebook"
          label="Facebook"
          isOpen={openSections.has("facebook")}
          onToggle={toggleSection}
        >
          <SocialPost text={content.facebook} />
          <div className="mt-3">
            <CopyToClipboard text={content.facebook} label="Copy post" />
          </div>
        </AccordionSection>
      )}

      {/* Section 4 — Video Scripts (accordion) */}
      {content.video_a && content.video_b && content.video_c && (
        <AccordionSection
          id="video"
          label="Video Scripts"
          isOpen={openSections.has("video")}
          onToggle={toggleSection}
        >
          <VideoTranscript
            scriptA={content.video_a}
            scriptB={content.video_b}
            scriptC={content.video_c}
          />
        </AccordionSection>
      )}
    </div>
  );
}

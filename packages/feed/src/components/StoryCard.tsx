"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { ExpandedContent } from "./ExpandedContent";

interface StoryCardProps {
  rank: number;
  headline: string;
  source: string;
  publishTime: string;
  briefBlock: string;
  url: string;
  isExpanded: boolean;
  onToggleExpand: () => void;
  storyTitle: string;
  industry: string;
  runId: string;
}

interface StoryContent {
  brief?: string;
  morning_brief?: string;
  linkedin?: string;
  facebook?: string;
  video_a?: string;
  video_b?: string;
  video_c?: string;
}

function timeAgo(dateString: string): string {
  const now = Date.now();
  const then = new Date(dateString).getTime();
  const seconds = Math.floor((now - then) / 1000);

  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

function extractDomain(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return "";
  }
}

export function StoryCard({
  rank,
  headline,
  source,
  publishTime,
  briefBlock,
  url,
  isExpanded,
  onToggleExpand,
  storyTitle,
  industry,
  runId,
}: StoryCardProps) {
  const [copied, setCopied] = useState(false);
  const [contentCache, setContentCache] = useState<StoryContent | null>(null);
  const [loadingContent, setLoadingContent] = useState(false);
  const cardRef = useRef<HTMLElement>(null);

  const domain = extractDomain(url);
  const relativeTime = timeAgo(publishTime);
  const subreddit = `r/${source.replace(/\s+/g, "_").toLowerCase()}`;

  const fetchContent = useCallback(async () => {
    if (contentCache) return;
    setLoadingContent(true);
    try {
      const params = new URLSearchParams({
        title: storyTitle,
        industry,
        run_id: runId,
      });
      const res = await fetch(`/api/feed/story-content?${params}`);
      const data = await res.json();
      setContentCache(data.content ?? {});
    } catch {
      setContentCache({});
    } finally {
      setLoadingContent(false);
    }
  }, [contentCache, storyTitle, industry, runId]);

  useEffect(() => {
    if (isExpanded && !contentCache) {
      fetchContent();
    }
  }, [isExpanded, contentCache, fetchContent]);

  useEffect(() => {
    if (isExpanded && cardRef.current) {
      // Wait for expand animation to start, then scroll into view
      requestAnimationFrame(() => {
        cardRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
      });
    }
  }, [isExpanded]);

  function handleCopy(e: React.MouseEvent) {
    e.stopPropagation();
    if (url && url !== "#") {
      navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }

  function handleShare(e: React.MouseEvent) {
    e.stopPropagation();
    if (navigator.share) {
      navigator.share({ title: headline, url });
    } else {
      handleCopy(e);
    }
  }

  return (
    <article
      ref={cardRef}
      className={`reddit-card group cursor-pointer ${isExpanded ? "reddit-card--expanded" : ""}`}
      onClick={onToggleExpand}
    >
      {/* Vote column */}
      <div className="vote-col">
        <svg
          className="vote-arrow"
          viewBox="0 0 20 20"
          width="20"
          height="20"
        >
          <path d="M10 3l7 8H3z" fill="currentColor" />
        </svg>
        <span className="vote-score">{rank}</span>
        <svg
          className="vote-arrow vote-arrow--down"
          viewBox="0 0 20 20"
          width="20"
          height="20"
        >
          <path d="M10 17l7-8H3z" fill="currentColor" />
        </svg>
      </div>

      {/* Content area */}
      <div className="min-w-0 flex-1">
        {/* Meta line */}
        <div className="mb-1 flex items-center gap-1.5 text-xs text-[var(--text-dim)]">
          <span className="font-medium text-[var(--accent)]">{subreddit}</span>
          <span>&bull;</span>
          <span>posted {relativeTime}</span>
        </div>

        {/* Title line */}
        <h3 className="mb-1.5 text-[15px] font-medium leading-snug">
          <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-[var(--text)] transition-colors hover:text-[var(--accent)]"
            onClick={(e) => e.stopPropagation()}
          >
            {headline}
          </a>
          {domain && (
            <span className="ml-1.5 text-xs font-normal text-[var(--text-dim)]">
              ({domain})
            </span>
          )}
        </h3>

        {/* Body preview — hidden when expanded since Morning Brief shows full content */}
        {!isExpanded && (
          <div
            className="text-sm leading-relaxed text-[var(--text-muted)] line-clamp-3"
            dangerouslySetInnerHTML={{ __html: briefBlock }}
          />
        )}

        {/* Action bar */}
        <div className="action-bar">
          {url && url !== "#" && (
            <a
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              className="action-btn"
              onClick={(e) => e.stopPropagation()}
            >
              <svg viewBox="0 0 20 20" width="14" height="14" fill="currentColor">
                <path d="M11 3a1 1 0 100 2h2.586l-6.293 6.293a1 1 0 101.414 1.414L15 6.414V9a1 1 0 102 0V4a1 1 0 00-1-1h-5z" />
                <path d="M5 5a2 2 0 00-2 2v8a2 2 0 002 2h8a2 2 0 002-2v-3a1 1 0 10-2 0v3H5V7h3a1 1 0 000-2H5z" />
              </svg>
              Open Article
            </a>
          )}
          <button onClick={handleCopy} className="action-btn">
            <svg viewBox="0 0 20 20" width="14" height="14" fill="currentColor">
              <path d="M8 3a1 1 0 011-1h2a1 1 0 110 2H9a1 1 0 01-1-1z" />
              <path d="M6 3a2 2 0 00-2 2v11a2 2 0 002 2h8a2 2 0 002-2V5a2 2 0 00-2-2 3 3 0 01-3 3H9a3 3 0 01-3-3z" />
            </svg>
            {copied ? "Copied!" : "Copy Link"}
          </button>
          <button onClick={handleShare} className="action-btn">
            <svg viewBox="0 0 20 20" width="14" height="14" fill="currentColor">
              <path d="M15 8a3 3 0 10-2.977-2.63l-4.94 2.47a3 3 0 100 4.319l4.94 2.47a3 3 0 10.895-1.789l-4.94-2.47a3.027 3.027 0 000-.74l4.94-2.47C13.456 7.68 14.19 8 15 8z" />
            </svg>
            Share
          </button>
          {/* Chevron indicator */}
          <span
            className={`expand-chevron ml-auto ${isExpanded ? "expand-chevron--open" : ""}`}
            aria-hidden="true"
          >
            ▾
          </span>
        </div>

        {/* Expandable content area */}
        <div className={`expand-wrapper ${isExpanded ? "expand-wrapper--open" : ""}`}>
          <div>
            {isExpanded && (
              loadingContent ? (
                <div className="py-8 text-center text-sm text-[var(--text-dim)]">
                  Loading content...
                </div>
              ) : contentCache ? (
                <div onClick={(e) => e.stopPropagation()}>
                  <ExpandedContent content={contentCache} />
                </div>
              ) : null
            )}
          </div>
        </div>
      </div>
    </article>
  );
}

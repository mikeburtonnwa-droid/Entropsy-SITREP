"use client";

import { useState, useEffect, useCallback } from "react";
import { IndustryTabs } from "@/components/IndustryTabs";
import { StoryCard } from "@/components/StoryCard";

export default function ArchivePage() {
  const [industry, setIndustry] = useState("professional_services");
  const [date, setDate] = useState(
    new Date().toISOString().split("T")[0],
  );
  const [stories, setStories] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [expandedStoryId, setExpandedStoryId] = useState<string | null>(null);

  const [hasLoaded, setHasLoaded] = useState(false);

  const loadArchive = useCallback(() => {
    setLoading(true);
    setExpandedStoryId(null);
    fetch(`/api/feed?industry=${industry}&date=${date}`)
      .then((r) => r.json())
      .then((data) => {
        setStories(data.stories ?? []);
        setLoading(false);
        setHasLoaded(true);
      })
      .catch(() => setLoading(false));
  }, [industry, date]);

  // Re-fetch when industry changes (if user has already loaded once)
  useEffect(() => {
    if (hasLoaded) {
      loadArchive();
    }
  }, [industry]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="mx-auto max-w-[1200px] px-6 py-16">
      <header className="mb-10">
        <span className="overline">
          Section 05 // Archive -- Historical Intelligence
        </span>
        <h1 className="heading-lg mt-2">Archive</h1>
        <p
          className="mt-3 text-sm font-light text-[var(--text-muted)]"
          style={{ fontFamily: "var(--font-sans)" }}
        >
          Browse previous morning briefs
        </p>
      </header>

      <div className="mb-8 flex items-end gap-4">
        <div>
          <label
            className="mb-2 block text-[11px] font-medium tracking-[1.5px] uppercase text-[var(--text-muted)]"
            style={{ fontFamily: "var(--font-mono)" }}
          >
            Date
          </label>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="rounded border border-[var(--border)] bg-[var(--bg-card)] px-4 py-3 text-sm text-[var(--text)]"
            style={{ fontFamily: "var(--font-sans)", colorScheme: "dark" }}
          />
        </div>
        <button onClick={loadArchive} className="btn btn--sm">
          Load
        </button>
      </div>

      <IndustryTabs activeIndustry={industry} onChange={setIndustry} />

      <div className="mt-8 space-y-4">
        {loading ? (
          <div className="py-16 text-center text-[var(--text-dim)]" style={{ fontFamily: "var(--font-mono)" }}>
            Loading...
          </div>
        ) : stories.length === 0 ? (
          <div className="py-16 text-center text-[var(--text-dim)]" style={{ fontFamily: "var(--font-mono)" }}>
            No stories found for this date.
          </div>
        ) : (
          stories.map((story: any, i: number) => (
            <StoryCard
              key={story.id}
              rank={i + 1}
              headline={story.headline ?? story.title}
              source={story.source ?? ""}
              publishTime={
                story.publish_timestamp
                  ? new Date(story.publish_timestamp).toLocaleTimeString(
                      "en-US",
                      { hour: "numeric", minute: "2-digit" },
                    )
                  : ""
              }
              briefBlock={story.body}
              url={story.feed_url ?? "#"}
              isExpanded={expandedStoryId === story.id}
              onToggleExpand={() =>
                setExpandedStoryId((prev) =>
                  prev === story.id ? null : story.id,
                )
              }
              storyTitle={story.headline ?? story.title}
              industry={story.industry ?? industry}
              runId={story.run_id ?? ""}
            />
          ))
        )}
      </div>
    </div>
  );
}

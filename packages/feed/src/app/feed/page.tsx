"use client";

import { useState, useEffect } from "react";
import { IndustryTabs } from "@/components/IndustryTabs";
import { StoryCard } from "@/components/StoryCard";

interface Story {
  id: string;
  title: string;
  body: string;
  content_type: string;
  industry: string;
  feed_url: string;
  publish_timestamp: string;
  run_id: string;
}

export default function FeedPage() {
  const [industry, setIndustry] = useState("professional_services");
  const [stories, setStories] = useState<Story[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedStoryId, setExpandedStoryId] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    setError(null);
    setExpandedStoryId(null);
    fetch(`/api/feed?industry=${industry}`)
      .then((r) => {
        if (!r.ok) return r.json().then((d) => Promise.reject(d.error ?? `API error ${r.status}`));
        return r.json();
      })
      .then((data) => {
        setStories(data.stories ?? []);
        setLoading(false);
      })
      .catch((err) => {
        setError(typeof err === "string" ? err : "Failed to load stories");
        setLoading(false);
      });
  }, [industry]);

  return (
    <div className="mx-auto max-w-[740px] px-4 py-10">
      <header className="mb-6">
        <h1 className="heading-lg">Morning Brief</h1>
      </header>

      <IndustryTabs activeIndustry={industry} onChange={setIndustry} />

      <div className="mt-6 space-y-2">
        {loading ? (
          <div className="py-16 text-center text-sm text-[var(--text-dim)]">
            Loading...
          </div>
        ) : error ? (
          <div className="py-16 text-center text-sm text-[var(--critical)]">
            {error}
          </div>
        ) : stories.length === 0 ? (
          <div className="py-16 text-center text-sm text-[var(--text-dim)]">
            No stories published yet today.
          </div>
        ) : (
          stories.map((story, i) => (
            <StoryCard
              key={story.id}
              rank={i + 1}
              headline={story.title}
              source={story.industry}
              publishTime={story.publish_timestamp}
              briefBlock={story.body}
              url={story.feed_url ?? "#"}
              isExpanded={expandedStoryId === story.id}
              onToggleExpand={() =>
                setExpandedStoryId((prev) =>
                  prev === story.id ? null : story.id,
                )
              }
              storyTitle={story.title}
              industry={story.industry}
              runId={story.run_id}
            />
          ))
        )}
      </div>
    </div>
  );
}

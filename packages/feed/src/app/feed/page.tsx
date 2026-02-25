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
}

export default function FeedPage() {
  const [industry, setIndustry] = useState("professional_services");
  const [stories, setStories] = useState<Story[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/feed?industry=${industry}`)
      .then((r) => r.json())
      .then((data) => {
        setStories(data.stories ?? []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [industry]);

  return (
    <main className="mx-auto max-w-4xl px-4 py-8">
      <header className="mb-8">
        <h1 className="text-2xl font-bold">Morning Brief</h1>
        <p className="mt-1 text-sm text-gray-500">
          Today&apos;s top AI stories for industry professionals
        </p>
      </header>

      <IndustryTabs activeIndustry={industry} onChange={setIndustry} />

      <div className="mt-6 space-y-4">
        {loading ? (
          <div className="py-12 text-center text-gray-400">Loading...</div>
        ) : stories.length === 0 ? (
          <div className="py-12 text-center text-gray-400">
            No stories published yet today.
          </div>
        ) : (
          stories.map((story, i) => (
            <StoryCard
              key={story.id}
              rank={i + 1}
              headline={story.title}
              source={story.industry.replace("_", " ")}
              publishTime={new Date(story.publish_timestamp).toLocaleTimeString(
                "en-US",
                { hour: "numeric", minute: "2-digit" },
              )}
              briefBlock={story.body}
              url={story.feed_url ?? "#"}
            />
          ))
        )}
      </div>
    </main>
  );
}

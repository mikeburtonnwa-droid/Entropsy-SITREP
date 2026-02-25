"use client";

import { useState } from "react";
import { IndustryTabs } from "@/components/IndustryTabs";
import { StoryCard } from "@/components/StoryCard";

export default function ArchivePage() {
  const [industry, setIndustry] = useState("professional_services");
  const [date, setDate] = useState(
    new Date().toISOString().split("T")[0],
  );
  const [stories, setStories] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const loadArchive = () => {
    setLoading(true);
    fetch(`/api/feed?industry=${industry}&date=${date}`)
      .then((r) => r.json())
      .then((data) => {
        setStories(data.stories ?? []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  };

  return (
    <main className="mx-auto max-w-4xl px-4 py-8">
      <header className="mb-8">
        <h1 className="text-2xl font-bold">Archive</h1>
        <p className="mt-1 text-sm text-gray-500">
          Browse previous morning briefs
        </p>
      </header>

      <div className="mb-6 flex items-end gap-4">
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">
            Date
          </label>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="rounded-md border border-gray-300 px-3 py-2 text-sm"
          />
        </div>
        <button
          onClick={loadArchive}
          className="rounded-md bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-800"
        >
          Load
        </button>
      </div>

      <IndustryTabs activeIndustry={industry} onChange={setIndustry} />

      <div className="mt-6 space-y-4">
        {loading ? (
          <div className="py-12 text-center text-gray-400">Loading...</div>
        ) : stories.length === 0 ? (
          <div className="py-12 text-center text-gray-400">
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
            />
          ))
        )}
      </div>
    </main>
  );
}

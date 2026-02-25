"use client";

import { useState, useEffect } from "react";
import { IndustryTabs } from "@/components/IndustryTabs";
import { CopyToClipboard } from "@/components/CopyToClipboard";
import { VideoTranscript } from "@/components/VideoTranscript";

interface ContentItem {
  id: string;
  title: string;
  content_type: string;
  body: string;
  video_a?: string;
  video_b?: string;
  video_c?: string;
}

export default function LibraryPage() {
  const [industry, setIndustry] = useState("professional_services");
  const [items, setItems] = useState<ContentItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/feed?industry=${industry}&type=all`)
      .then((r) => r.json())
      .then((data) => {
        setItems(data.stories ?? []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [industry]);

  const grouped = {
    linkedin: items.filter((i) => i.content_type === "linkedin"),
    facebook: items.filter((i) => i.content_type === "facebook"),
    video: items.filter((i) => i.content_type === "video_a"),
  };

  return (
    <main className="mx-auto max-w-4xl px-4 py-8">
      <header className="mb-8">
        <h1 className="text-2xl font-bold">Content Library</h1>
        <p className="mt-1 text-sm text-gray-500">
          Copy and deploy today&apos;s content
        </p>
      </header>

      <IndustryTabs activeIndustry={industry} onChange={setIndustry} />

      {loading ? (
        <div className="py-12 text-center text-gray-400">Loading...</div>
      ) : (
        <div className="mt-6 space-y-8">
          {grouped.linkedin.length > 0 && (
            <section>
              <h2 className="mb-4 text-lg font-semibold">LinkedIn Posts</h2>
              <div className="space-y-4">
                {grouped.linkedin.map((item) => (
                  <div
                    key={item.id}
                    className="rounded-lg border border-gray-200 bg-white p-4"
                  >
                    <h3 className="mb-2 font-medium">{item.title}</h3>
                    <pre className="mb-3 whitespace-pre-wrap text-sm text-gray-700">
                      {item.body}
                    </pre>
                    <CopyToClipboard text={item.body} />
                  </div>
                ))}
              </div>
            </section>
          )}

          {grouped.facebook.length > 0 && (
            <section>
              <h2 className="mb-4 text-lg font-semibold">Facebook Posts</h2>
              <div className="space-y-4">
                {grouped.facebook.map((item) => (
                  <div
                    key={item.id}
                    className="rounded-lg border border-gray-200 bg-white p-4"
                  >
                    <h3 className="mb-2 font-medium">{item.title}</h3>
                    <pre className="mb-3 whitespace-pre-wrap text-sm text-gray-700">
                      {item.body}
                    </pre>
                    <CopyToClipboard text={item.body} />
                  </div>
                ))}
              </div>
            </section>
          )}
        </div>
      )}
    </main>
  );
}

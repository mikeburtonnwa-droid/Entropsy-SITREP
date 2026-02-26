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
}

interface VideoGroup {
  title: string;
  scriptA: string;
  scriptB: string;
  scriptC: string;
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

  const linkedin = items.filter((i) => i.content_type === "linkedin");
  const facebook = items.filter((i) => i.content_type === "facebook");

  // Group video scripts by title (video_a, video_b, video_c are separate rows)
  const videoItems = items.filter((i) =>
    i.content_type === "video_a" ||
    i.content_type === "video_b" ||
    i.content_type === "video_c"
  );
  const videoMap = new Map<string, Partial<Record<string, string>>>();
  for (const v of videoItems) {
    const existing = videoMap.get(v.title) ?? {};
    existing[v.content_type] = v.body;
    videoMap.set(v.title, existing);
  }
  const videoGroups: VideoGroup[] = [];
  for (const [title, scripts] of videoMap) {
    if (scripts.video_a && scripts.video_b && scripts.video_c) {
      videoGroups.push({
        title,
        scriptA: scripts.video_a,
        scriptB: scripts.video_b,
        scriptC: scripts.video_c,
      });
    }
  }

  return (
    <div className="mx-auto max-w-[1200px] px-6 py-16">
      <header className="mb-10">
        <span className="overline">
          Section 03 // Content Arsenal
        </span>
        <h1 className="heading-lg mt-2">Content Library</h1>
        <p
          className="mt-3 text-sm font-light text-[var(--text-muted)]"
          style={{ fontFamily: "var(--font-sans)" }}
        >
          Copy and deploy today&apos;s content
        </p>
      </header>

      <IndustryTabs activeIndustry={industry} onChange={setIndustry} />

      {loading ? (
        <div className="py-16 text-center text-[var(--text-dim)]" style={{ fontFamily: "var(--font-mono)" }}>
          Loading...
        </div>
      ) : (
        <div className="mt-8 space-y-10">
          {linkedin.length > 0 && (
            <section>
              <h2
                className="mb-5 text-xs font-medium tracking-[2px] uppercase text-[var(--text-muted)]"
                style={{ fontFamily: "var(--font-mono)" }}
              >
                LinkedIn Posts
              </h2>
              <div className="space-y-4">
                {linkedin.map((item) => (
                  <div key={item.id} className="sector-card">
                    <h3
                      className="mb-3 text-sm font-medium text-[var(--text)]"
                      style={{ fontFamily: "var(--font-mono)" }}
                    >
                      {item.title}
                    </h3>
                    <pre
                      className="mb-4 whitespace-pre-wrap rounded border border-[var(--border)] bg-[rgba(0,0,0,0.3)] p-4 text-sm font-light leading-relaxed text-[var(--text)]"
                      style={{ fontFamily: "var(--font-sans)" }}
                    >
                      {item.body}
                    </pre>
                    <CopyToClipboard text={item.body} />
                  </div>
                ))}
              </div>
            </section>
          )}

          {facebook.length > 0 && (
            <section>
              <h2
                className="mb-5 text-xs font-medium tracking-[2px] uppercase text-[var(--text-muted)]"
                style={{ fontFamily: "var(--font-mono)" }}
              >
                Facebook Posts
              </h2>
              <div className="space-y-4">
                {facebook.map((item) => (
                  <div key={item.id} className="sector-card">
                    <h3
                      className="mb-3 text-sm font-medium text-[var(--text)]"
                      style={{ fontFamily: "var(--font-mono)" }}
                    >
                      {item.title}
                    </h3>
                    <pre
                      className="mb-4 whitespace-pre-wrap rounded border border-[var(--border)] bg-[rgba(0,0,0,0.3)] p-4 text-sm font-light leading-relaxed text-[var(--text)]"
                      style={{ fontFamily: "var(--font-sans)" }}
                    >
                      {item.body}
                    </pre>
                    <CopyToClipboard text={item.body} />
                  </div>
                ))}
              </div>
            </section>
          )}

          {videoGroups.length > 0 && (
            <section>
              <h2
                className="mb-5 text-xs font-medium tracking-[2px] uppercase text-[var(--text-muted)]"
                style={{ fontFamily: "var(--font-mono)" }}
              >
                Video Scripts
              </h2>
              <div className="space-y-4">
                {videoGroups.map((group) => (
                  <div key={group.title} className="sector-card">
                    <h3
                      className="mb-3 text-sm font-medium text-[var(--text)]"
                      style={{ fontFamily: "var(--font-mono)" }}
                    >
                      {group.title}
                    </h3>
                    <VideoTranscript
                      scriptA={group.scriptA}
                      scriptB={group.scriptB}
                      scriptC={group.scriptC}
                    />
                  </div>
                ))}
              </div>
            </section>
          )}
        </div>
      )}
    </div>
  );
}

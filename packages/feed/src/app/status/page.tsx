"use client";

import { useState, useEffect, useCallback } from "react";

interface PipelineStatus {
  id: string;
  run_date: string;
  status: string;
  trigger_time: string;
  industries_completed: string[];
  industries_failed: string[];
  total_pieces_published: number;
  duration_ms: number | null;
}

const STATUS_COLORS: Record<string, { bg: string; text: string }> = {
  COMPLETE: { bg: "rgba(64,224,144,0.1)", text: "var(--accent)" },
  PARTIAL: { bg: "rgba(255,170,0,0.1)", text: "var(--warning)" },
  FAILED: { bg: "rgba(255,68,68,0.1)", text: "var(--critical)" },
  HARVESTING: { bg: "rgba(64,224,144,0.06)", text: "var(--text-muted)" },
  CURATING: { bg: "rgba(64,224,144,0.06)", text: "var(--text-muted)" },
  WRITING: { bg: "rgba(64,224,144,0.06)", text: "var(--text-muted)" },
  QA_REVIEW: { bg: "rgba(64,224,144,0.06)", text: "var(--text-muted)" },
  PUBLISHING: { bg: "rgba(64,224,144,0.06)", text: "var(--text-muted)" },
  SCHEDULED: { bg: "rgba(85,102,96,0.15)", text: "var(--text-dim)" },
};

export default function StatusPage() {
  const [status, setStatus] = useState<PipelineStatus | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchStatus = useCallback(() => {
    fetch("/api/status")
      .then((r) => r.json())
      .then((data) => {
        setStatus(data.run);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  useEffect(() => {
    fetchStatus();
    const interval = setInterval(fetchStatus, 30_000);
    return () => clearInterval(interval);
  }, [fetchStatus]);

  return (
    <div className="mx-auto max-w-[1200px] px-6 py-16">
      <header className="mb-10">
        <span className="overline">
          Section 04 // Pipeline Status -- Operational Readiness
        </span>
        <h1 className="heading-lg mt-2">Pipeline Status</h1>
        <button
          onClick={() => { setLoading(true); fetchStatus(); }}
          className="btn btn--sm mt-4"
        >
          Refresh
        </button>
      </header>

      {loading ? (
        <div className="py-16 text-center text-[var(--text-dim)]" style={{ fontFamily: "var(--font-mono)" }}>
          Loading...
        </div>
      ) : !status ? (
        <div className="py-16 text-center text-[var(--text-dim)]" style={{ fontFamily: "var(--font-mono)" }}>
          No pipeline runs found.
        </div>
      ) : (
        <div className="sector-card">
          <div className="mb-6 flex items-center gap-4">
            <span
              className="rounded px-3 py-1.5 text-xs font-medium uppercase tracking-wider"
              style={{
                fontFamily: "var(--font-mono)",
                background: STATUS_COLORS[status.status]?.bg ?? "rgba(85,102,96,0.15)",
                color: STATUS_COLORS[status.status]?.text ?? "var(--text-dim)",
              }}
            >
              {status.status}
            </span>
            <span
              className="text-xs text-[var(--text-dim)]"
              style={{ fontFamily: "var(--font-mono)" }}
            >
              {new Date(status.trigger_time).toLocaleString()}
            </span>
          </div>

          <dl className="grid grid-cols-2 gap-6 md:grid-cols-3">
            <div>
              <dt
                className="mb-1 text-[11px] font-medium tracking-[2px] uppercase text-[var(--text-dim)]"
                style={{ fontFamily: "var(--font-mono)" }}
              >
                Date
              </dt>
              <dd
                className="text-2xl font-medium text-[var(--text)]"
                style={{ fontFamily: "var(--font-mono)" }}
              >
                {status.run_date}
              </dd>
            </div>
            <div>
              <dt
                className="mb-1 text-[11px] font-medium tracking-[2px] uppercase text-[var(--text-dim)]"
                style={{ fontFamily: "var(--font-mono)" }}
              >
                Pieces Published
              </dt>
              <dd
                className="text-2xl font-medium text-[var(--accent)]"
                style={{ fontFamily: "var(--font-mono)" }}
              >
                {status.total_pieces_published}
              </dd>
            </div>
            {status.duration_ms && (
              <div>
                <dt
                  className="mb-1 text-[11px] font-medium tracking-[2px] uppercase text-[var(--text-dim)]"
                  style={{ fontFamily: "var(--font-mono)" }}
                >
                  Duration
                </dt>
                <dd
                  className="text-2xl font-medium text-[var(--text)]"
                  style={{ fontFamily: "var(--font-mono)" }}
                >
                  {Math.round(status.duration_ms / 1000)}s
                </dd>
              </div>
            )}
            <div>
              <dt
                className="mb-1 text-[11px] font-medium tracking-[2px] uppercase text-[var(--text-dim)]"
                style={{ fontFamily: "var(--font-mono)" }}
              >
                Industries Completed
              </dt>
              <dd className="text-sm font-light text-[var(--text)]">
                {status.industries_completed.join(", ") || "None yet"}
              </dd>
            </div>
            <div>
              <dt
                className="mb-1 text-[11px] font-medium tracking-[2px] uppercase text-[var(--text-dim)]"
                style={{ fontFamily: "var(--font-mono)" }}
              >
                Industries Failed
              </dt>
              <dd className="text-sm font-light text-[var(--critical)]">
                {status.industries_failed.join(", ") || "None"}
              </dd>
            </div>
          </dl>
        </div>
      )}
    </div>
  );
}

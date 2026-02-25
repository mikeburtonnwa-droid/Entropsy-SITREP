"use client";

import { useState, useEffect } from "react";

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

const STATUS_COLORS: Record<string, string> = {
  COMPLETE: "bg-green-100 text-green-800",
  PARTIAL: "bg-yellow-100 text-yellow-800",
  FAILED: "bg-red-100 text-red-800",
  HARVESTING: "bg-blue-100 text-blue-800",
  CURATING: "bg-blue-100 text-blue-800",
  WRITING: "bg-blue-100 text-blue-800",
  QA_REVIEW: "bg-blue-100 text-blue-800",
  PUBLISHING: "bg-blue-100 text-blue-800",
  SCHEDULED: "bg-gray-100 text-gray-800",
};

export default function StatusPage() {
  const [status, setStatus] = useState<PipelineStatus | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/status")
      .then((r) => r.json())
      .then((data) => {
        setStatus(data.run);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  return (
    <main className="mx-auto max-w-4xl px-4 py-8">
      <h1 className="mb-6 text-2xl font-bold">Pipeline Status</h1>

      {loading ? (
        <div className="py-12 text-center text-gray-400">Loading...</div>
      ) : !status ? (
        <div className="py-12 text-center text-gray-400">
          No pipeline runs found.
        </div>
      ) : (
        <div className="rounded-lg border border-gray-200 bg-white p-6">
          <div className="mb-4 flex items-center gap-3">
            <span
              className={`rounded-full px-3 py-1 text-sm font-medium ${STATUS_COLORS[status.status] ?? "bg-gray-100"}`}
            >
              {status.status}
            </span>
            <span className="text-sm text-gray-500">
              {new Date(status.trigger_time).toLocaleString()}
            </span>
          </div>

          <dl className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <dt className="font-medium text-gray-500">Date</dt>
              <dd>{status.run_date}</dd>
            </div>
            <div>
              <dt className="font-medium text-gray-500">Pieces Published</dt>
              <dd>{status.total_pieces_published}</dd>
            </div>
            <div>
              <dt className="font-medium text-gray-500">
                Industries Completed
              </dt>
              <dd>{status.industries_completed.join(", ") || "None yet"}</dd>
            </div>
            <div>
              <dt className="font-medium text-gray-500">Industries Failed</dt>
              <dd>{status.industries_failed.join(", ") || "None"}</dd>
            </div>
            {status.duration_ms && (
              <div>
                <dt className="font-medium text-gray-500">Duration</dt>
                <dd>{Math.round(status.duration_ms / 1000)}s</dd>
              </div>
            )}
          </dl>
        </div>
      )}
    </main>
  );
}

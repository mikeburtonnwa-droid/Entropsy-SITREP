import Link from "next/link";

const NAV_ITEMS = [
  {
    href: "/feed",
    title: "Morning Brief",
    description: "Today's top AI stories ranked by sector relevance",
  },
  {
    href: "/library",
    title: "Content Arsenal",
    description: "LinkedIn, Facebook, and video content ready to deploy",
  },
  {
    href: "/status",
    title: "Pipeline Status",
    description: "Operational readiness and pipeline metrics",
  },
  {
    href: "/archive",
    title: "Archive",
    description: "Historical intelligence briefings by date",
  },
];

export default function Home() {
  return (
    <div className="mx-auto max-w-[1200px] px-6 py-16">
      <span className="overline">
        Section 01 // Daily Intelligence -- Morning Brief
      </span>
      <h1 className="heading-lg mt-2">Entropsy SITREP</h1>
      <p
        className="mt-4 max-w-[700px] text-base font-light leading-relaxed text-[var(--text-muted)]"
        style={{ fontFamily: "var(--font-sans)" }}
      >
        Automated intelligence briefing. Three sectors. 48 content assets.
        Delivered before your first meeting.
      </p>

      <div className="mt-12 grid gap-4 sm:grid-cols-2">
        {NAV_ITEMS.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="sector-card group block"
          >
            <h2
              className="text-base font-medium text-[var(--text)] transition-colors group-hover:text-[var(--accent)]"
              style={{ fontFamily: "var(--font-mono)" }}
            >
              {item.title}
            </h2>
            <p
              className="mt-2 text-sm font-light text-[var(--text-muted)]"
              style={{ fontFamily: "var(--font-sans)" }}
            >
              {item.description}
            </p>
          </Link>
        ))}
      </div>
    </div>
  );
}

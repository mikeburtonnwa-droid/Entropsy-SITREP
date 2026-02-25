import Link from "next/link";

const NAV_ITEMS = [
  {
    href: "/feed",
    title: "Morning Brief",
    description: "Today's top AI stories by industry",
  },
  {
    href: "/library",
    title: "Content Library",
    description: "LinkedIn, Facebook, and video content ready to deploy",
  },
  {
    href: "/status",
    title: "Pipeline Status",
    description: "Current pipeline run status and metrics",
  },
  {
    href: "/archive",
    title: "Archive",
    description: "Browse previous morning briefs by date",
  },
];

export default function Home() {
  return (
    <main className="mx-auto max-w-4xl px-4 py-12">
      <h1 className="text-3xl font-bold">Entropsy Morning Brief</h1>
      <p className="mt-2 text-gray-600">
        Daily AI news for industry professionals. Automated. Every morning.
      </p>

      <div className="mt-8 grid gap-4 sm:grid-cols-2">
        {NAV_ITEMS.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm transition-shadow hover:shadow-md"
          >
            <h2 className="text-lg font-semibold">{item.title}</h2>
            <p className="mt-1 text-sm text-gray-500">{item.description}</p>
          </Link>
        ))}
      </div>
    </main>
  );
}

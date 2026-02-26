import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";

export const metadata: Metadata = {
  title: "Entropsy SITREP",
  description: "Daily AI intelligence briefing for industry professionals",
};

const NAV_LINKS = [
  { href: "/", label: "Home" },
  { href: "/feed", label: "Morning Brief" },
  { href: "/library", label: "Content Library" },
  { href: "/status", label: "Pipeline Status" },
  { href: "/archive", label: "Archive" },
];

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          rel="preload"
          as="style"
          href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600&family=JetBrains+Mono:wght@400;500&display=swap"
        />
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600&family=JetBrains+Mono:wght@400;500&display=swap"
        />
      </head>
      <body className="bg-[#0a0a12] text-[#e0e8e4] antialiased">
        <nav className="sticky top-0 z-50 border-b border-[rgba(0,255,136,0.12)] bg-[rgba(10,10,18,0.95)] backdrop-blur-xl">
          <div className="mx-auto flex max-w-[1200px] items-center gap-6 px-6 py-4">
            <Link href="/" className="flex items-center gap-3">
              <span
                className="text-sm font-medium tracking-[4px] uppercase text-[#40e090]"
                style={{ fontFamily: "var(--font-mono)" }}
              >
                Entropsy
              </span>
              <span
                className="rounded border border-[rgba(0,255,136,0.3)] bg-[rgba(0,255,136,0.06)] px-2 py-0.5 text-[10px] font-medium tracking-[2px] uppercase text-[#40e090]"
                style={{ fontFamily: "var(--font-mono)" }}
              >
                SITREP
              </span>
            </Link>
            <div className="flex gap-5">
              {NAV_LINKS.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="text-[11px] font-normal tracking-[1px] uppercase text-[#8a9a90] transition-colors hover:text-[#40e090]"
                  style={{ fontFamily: "var(--font-mono)" }}
                >
                  {link.label}
                </Link>
              ))}
            </div>
          </div>
        </nav>
        <main>{children}</main>
      </body>
    </html>
  );
}

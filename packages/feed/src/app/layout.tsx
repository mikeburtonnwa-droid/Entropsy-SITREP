import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";

export const metadata: Metadata = {
  title: "Entropsy Morning Brief",
  description: "Daily AI news for industry professionals",
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
      <body className="bg-gray-50 text-gray-900 antialiased">
        <nav className="border-b border-gray-200 bg-white">
          <div className="mx-auto flex max-w-4xl items-center gap-6 px-4 py-3">
            <Link href="/" className="text-lg font-bold text-gray-900">
              Entropsy
            </Link>
            <div className="flex gap-4">
              {NAV_LINKS.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="text-sm text-gray-600 hover:text-gray-900"
                >
                  {link.label}
                </Link>
              ))}
            </div>
          </div>
        </nav>
        {children}
      </body>
    </html>
  );
}

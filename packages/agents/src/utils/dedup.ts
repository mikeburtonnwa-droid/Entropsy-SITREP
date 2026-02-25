import { createHash } from "node:crypto";

/**
 * Normalise a URL for deduplication — strip protocol, trailing slash, query
 * params like utm_*, and lowercase.
 */
export function normaliseUrl(raw: string): string {
  try {
    const u = new URL(raw);
    // Remove tracking params
    for (const key of [...u.searchParams.keys()]) {
      if (key.startsWith("utm_") || key === "ref" || key === "source") {
        u.searchParams.delete(key);
      }
    }
    return `${u.hostname}${u.pathname}`.replace(/\/+$/, "").toLowerCase();
  } catch {
    return raw.toLowerCase().trim();
  }
}

/**
 * Quick content hash for semantic-ish dedup (headline-based).
 * Two headlines within edit-distance are caught by normalising whitespace
 * and lowering before hashing.
 */
export function headlineHash(headline: string): string {
  const normalised = headline
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, "")
    .replace(/\s+/g, " ")
    .trim();
  return createHash("sha256").update(normalised).digest("hex").slice(0, 16);
}

/**
 * Deduplicate an array of items by a key function.
 */
export function dedup<T>(items: T[], keyFn: (item: T) => string): T[] {
  const seen = new Set<string>();
  return items.filter((item) => {
    const key = keyFn(item);
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

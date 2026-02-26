/**
 * Lightweight markdown-to-HTML converter for brief content.
 * Handles: bold, line breaks, and basic structure.
 * No external dependencies.
 */
export function markdownToHtml(md: string): string {
  return md
    .split("\n")
    .map((line) => {
      // Convert **bold** to <strong>
      let html = line.replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>");
      // Convert *italic* to <em>
      html = html.replace(/(?<!\*)\*(?!\*)(.+?)(?<!\*)\*(?!\*)/g, "<em>$1</em>");
      // Wrap non-empty lines in <p>
      return html.trim() ? `<p>${html}</p>` : "";
    })
    .filter(Boolean)
    .join("\n");
}

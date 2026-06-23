/**
 * On-demand Google Fonts loading, ported from the type-explorer app. Injects a
 * deduped css2 <link> per family into <head>; browser-only (no-ops during SSR).
 * The pairing list is fixed (see ./pairings) — this is the whole mechanism, kept
 * dependency-free so the typography preview stays a thin lens, not a subsystem.
 */

const loaded = new Set<string>()

function injectLink(href: string): void {
  if (loaded.has(href)) return
  loaded.add(href)
  if (typeof document === 'undefined') return
  const link = document.createElement('link')
  link.rel = 'stylesheet'
  link.href = href
  document.head.appendChild(link)
}

/** Inject a Google Fonts css2 <link> for a family by name (deduped, browser-only).
 *  The CDN ignores weights a family lacks, so a small spread is safe. */
export function loadFontByName(name: string, weights: number[] = [400, 700]): void {
  const plus = name.trim().replace(/\s+/g, '+')
  injectLink(
    `https://fonts.googleapis.com/css2?family=${plus}:wght@${weights.join(';')}&display=swap`,
  )
}

/** A quoted CSS font-family value from a bare family name, with a system fallback. */
export function fontStackByName(name: string): string {
  return `"${name}", system-ui, sans-serif`
}

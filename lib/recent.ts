// What the game player stores about recently played games. Kept apart from lib/portal.ts so the home page's
// client code doesn't pull in the whole catalog.
export const RECENT_KEY = 'ektukhani-recent';
const RECENT_MAX = 12;

/**
 * Reads what the game player stored under `ektukhani-recent`: a JSON array, newest first, of slugs
 * (or objects with a `slug`). Unknown slugs, repeats and anything malformed are dropped.
 */
export function parseRecent(raw: string | null, known: (slug: string) => boolean): string[] {
  if (!raw) return [];
  let value: unknown;
  try { value = JSON.parse(raw); } catch { return []; }
  if (!Array.isArray(value)) return [];
  const seen = new Set<string>();
  for (const item of value) {
    const slug = typeof item === 'string' ? item : item && typeof item === 'object' && typeof (item as { slug?: unknown }).slug === 'string' ? (item as { slug: string }).slug : undefined;
    if (slug && known(slug) && !seen.has(slug)) seen.add(slug);
    if (seen.size === RECENT_MAX) break;
  }
  return [...seen];
}

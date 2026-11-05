// Pure logic behind the shared game player (shared/game-player-client.tsx): the recently played list,
// the Back-button bookkeeping for immersive mode, and the desktop stage size. No browser access here, so it's testable.

/** localStorage key the portal reads for "সম্প্রতি খেলেছ": a JSON array of slugs, most recent first. */
export const RECENT_KEY = 'ektukhani-recent';
export const RECENT_LIMIT = 12;
const SLUG = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

/** The saved list, cleaned: only slug-shaped strings, no repeats, at most 12. Anything unreadable is an empty list. */
export function parseRecent(raw: string | null): string[] {
  let value: unknown;
  try { value = JSON.parse(raw ?? '[]'); } catch { return []; }
  if (!Array.isArray(value)) return [];
  return [...new Set(value.filter((slug): slug is string => typeof slug === 'string' && slug.length <= 40 && SLUG.test(slug)))].slice(0, RECENT_LIMIT);
}

/** The list after opening `slug`: it moves to the front, the oldest falls off the end. */
export function withRecent(raw: string | null, slug: string): string[] {
  return [slug, ...parseRecent(raw).filter(saved => saved !== slug)].slice(0, RECENT_LIMIT);
}

/**
 * Immersive mode owns one history entry, so the phone's Back (or a swipe-back) closes the game instead of leaving the page.
 * - `enter`: push an entry.
 * - `leave` (বের হও, Escape, the browser leaving full screen): go back over our entry, and ignore the popstate that causes.
 * - `pop` (Back pressed): if it isn't one we caused, leave immersive mode. The entry is already gone, so don't go back again.
 */
export type Nav = { immersive: boolean; pushed: boolean; skipPops: number };
export type NavEffect = 'push' | 'back' | 'enter' | 'leave';
export const closedNav: Nav = { immersive: false, pushed: false, skipPops: 0 };

export function navigate(nav: Nav, event: 'enter' | 'leave' | 'pop'): { nav: Nav; effects: NavEffect[] } {
  if (event === 'enter') {
    if (nav.immersive) return { nav, effects: [] };
    return { nav: { ...nav, immersive: true, pushed: true }, effects: ['push', 'enter'] };
  }
  if (event === 'leave') {
    if (!nav.immersive) return { nav, effects: [] };
    return nav.pushed
      ? { nav: { immersive: false, pushed: false, skipPops: nav.skipPops + 1 }, effects: ['back', 'leave'] }
      : { nav: { ...nav, immersive: false }, effects: ['leave'] };
  }
  if (nav.skipPops > 0) return { nav: { ...nav, skipPops: nav.skipPops - 1 }, effects: [] };
  if (!nav.immersive) return { nav, effects: [] };
  return { nav: { ...nav, immersive: false, pushed: false }, effects: ['leave'] };
}

/** Portrait games are phone-shaped; wide ones (a cricket pitch, a carrom board seen side on) want a landscape box. */
export type StageShape = 'portrait' | 'wide';

const clamp = (value: number, low: number, high: number) => Math.min(high, Math.max(low, value));
/** Space the desktop layout keeps outside the stage: the gap under the header, the gap above the control bar. */
export const STAGE_GAP = 28;
export const STAGE_MIN_HEIGHT = 480;

/**
 * The desktop stage: as tall as the window allows under the header and above the control bar, and as wide as its shape wants.
 * A portrait stage is 480–560 px wide, about 0.62 × its height; a wide one is 16:9, 640–1024 px. Never wider than the window.
 */
export function inlineStage({ viewWidth, viewHeight, top, bar, shape = 'portrait' }: { viewWidth: number; viewHeight: number; top: number; bar: number; shape?: StageShape }) {
  const height = Math.round(Math.max(STAGE_MIN_HEIGHT, viewHeight - top - bar - STAGE_GAP));
  const ideal = shape === 'portrait' ? clamp(height * 0.62, 480, 560) : clamp(height * 16 / 9, 640, 1024);
  return { width: Math.round(Math.max(0, Math.min(ideal, viewWidth - 32))), height };
}

/**
 * Phone mode (launch card, then full screen on খেলো) is for touch phones only, like Poki. A laptop or desktop with a
 * mouse plays in the page at any window width, and goes full screen only from the ⛶ button.
 */
export const PHONE_QUERY = '(pointer: coarse) and (max-width: 899px), (pointer: coarse) and (max-height: 599px)';

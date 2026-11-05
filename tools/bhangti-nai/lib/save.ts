// What this phone keeps between visits, as pure string ⇄ value functions (the component does the localStorage calls).
// The stars stay where they always were (useLevels("bhangti-nai")); your own open day gets its own key, migrated once.
import { unlockedLevel, type LevelStars } from '../../../shared/game-core';
import { LEVEL_COUNT } from './levels';

export const OPEN_KEY = 'ektukhani-bhangti-nai-open';
export const RELAXED_KEY = 'bhangti-nai-relaxed';

/**
 * The highest day you may pick. The first time, it's what the old rule gave (one past the highest day with stars), so
 * nobody loses an open day. After that only your own play opens days: clearing day L opens L + 1 when L was already open,
 * and a friend's far-ahead day records its stars but opens nothing in between.
 */
export function readOpen(raw: string | null, stars: LevelStars) {
  const saved = Number(raw);
  if (raw !== null && raw.trim() !== '' && Number.isInteger(saved) && saved >= 1 && saved <= LEVEL_COUNT) return saved;
  return unlockedLevel(stars, LEVEL_COUNT);
}
export const openAfter = (open: number, cleared: number) => cleared <= open ? Math.min(LEVEL_COUNT, Math.max(open, cleared + 1)) : open;

/** Where to open, and the day the sheet recommends: the furthest open day not three-starred yet, else the first one that isn't. */
export function startLevel(stars: LevelStars, open: number) {
  if ((stars[open] ?? 0) < 3) return open;
  for (let level = 1; level <= open; level++) if ((stars[level] ?? 0) < 3) return level;
  return open;
}

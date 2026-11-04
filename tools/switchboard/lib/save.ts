// What this phone keeps, as pure functions over raw localStorage strings (the component reads and writes them).
// - The new ladder's stars: `ektukhani-levels-switchboard-v2` (through useLevels). The boards are new, so stars start again.
// - Your own open level: `ektukhani-switchboard-open`. Set once from the old stars (`ektukhani-levels-switchboard`, the ladder
//   before the rewrite, left untouched), so every level you had open stays open. After that only your own play opens levels:
//   a friend's far-ahead board records its stars but never opens the ones in between (unlockedLevel stays as it is).
import { readLevels, unlockedLevel, type LevelStars } from "../../../shared/game-core";
import { LEGACY_COUNT } from "./legacy";
import { LEVEL_COUNT } from "./levels";

export const TOOL = "switchboard";
/** The useLevels slug of the new ladder, and the keys around it. */
export const LADDER = `${TOOL}-v2`;
export const OLD_LEVELS_KEY = `ektukhani-levels-${TOOL}`;
export const OPEN_KEY = `ektukhani-${TOOL}-open`;
/** useBest slugs: the new ladder's boards, and an old link's board (its best from before still counts). */
export const bestSlug = (level: number, legacy: boolean) => legacy ? `${TOOL}-l${level}` : `${LADDER}-l${level}`;

/** Your open level: the one saved, else (once) one past your highest star on the old ladder, else on the new one. */
export function readOpen(raw: string | null, oldStars: string | null, stars: LevelStars) {
  const saved = Number(raw);
  if (raw !== null && Number.isInteger(saved) && saved >= 1 && saved <= LEVEL_COUNT) return saved;
  const old = readLevels(oldStars, LEGACY_COUNT);
  return Math.max(Object.keys(old).length ? unlockedLevel(old, LEGACY_COUNT) : 1, unlockedLevel(stars, LEVEL_COUNT));
}

/** Clearing your open level (or any below it) opens the next one; a friend's far-ahead level opens nothing. */
export const openAfter = (open: number, cleared: number) => cleared <= open ? Math.min(LEVEL_COUNT, Math.max(open, cleared + 1)) : open;

/** Where to start: the furthest open level you haven't three-starred, so nobody replays what they've mastered. */
export function startLevel(stars: LevelStars, open: number) {
  for (let level = open; level >= 1; level--) if ((stars[level] ?? 0) < 3) return level;
  return open;
}

// What this phone keeps between visits, as pure string ⇄ value functions (the component does the localStorage calls).
// The new stars live in ektukhani-levels-jora-melao-v2 (the 24 levels are new boards); the old ones stay where they were.
// Your own open level gets its own key, set once from the old stars so nobody loses ground.
import { unlockedLevel, type LevelStars } from "../../../shared/game-core";
import { LEVEL_COUNT, PER_WORLD } from "./levels";

export const TOOL = "jora-melao";
/** useLevels / useBest take a slug: these give `ektukhani-levels-jora-melao-v2` and `ektukhani-best-jora-melao-v2-l<N>`. */
export const STARS_SLUG = `${TOOL}-v2`;
export const bestSlug = (level: number) => `${TOOL}-v2-l${level}`;
export const OPEN_KEY = `ektukhani-${TOOL}-open`;
export const OLD_STARS_KEY = `ektukhani-levels-${TOOL}`;
export const OLD_COUNT = 12;

/** The first table that a player of the old ৮→২০ card boards opens: the highest old level cleared, scaled to the 8 levels of the first table. */
export function openFromOld(oldStars: LevelStars) {
  const highest = Math.max(0, ...Object.keys(oldStars).map(Number));
  return highest ? Math.min(PER_WORLD, 1 + Math.ceil(highest * PER_WORLD / OLD_COUNT)) : 1;
}

/**
 * The highest level you may pick. The first time, it comes from the old stars (and any new ones); after that only your
 * own clears open levels: clearing level L opens L + 1 when L was already open, and a friend's far-ahead level records
 * its stars but opens nothing in between.
 */
export function readOpen(raw: string | null, stars: LevelStars, oldStars: LevelStars) {
  const saved = Number(raw);
  if (raw !== null && raw.trim() !== "" && Number.isInteger(saved) && saved >= 1 && saved <= LEVEL_COUNT) return saved;
  return Math.max(openFromOld(oldStars), unlockedLevel(stars, LEVEL_COUNT));
}
export const openAfter = (open: number, cleared: number) => cleared <= open ? Math.min(LEVEL_COUNT, Math.max(open, cleared + 1)) : open;

/** Where to open, and the level the sheet recommends: the furthest open level not three-starred yet, else the first one that isn't. */
export function startLevel(stars: LevelStars, open: number) {
  if ((stars[open] ?? 0) < 3) return open;
  for (let level = 1; level <= open; level++) if ((stars[level] ?? 0) < 3) return level;
  return open;
}
/** All 24 have stars. */
export const allCleared = (stars: LevelStars) => Array.from({ length: LEVEL_COUNT }, (_, index) => stars[index + 1] ?? 0).every(earned => earned > 0);

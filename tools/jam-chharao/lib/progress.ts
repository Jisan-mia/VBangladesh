// This game's own unlock rule. The shared unlockedLevel opens every level below the highest one with stars, which is right
// for a migration but wrong after a friend's link: clearing their jam 8 must not open 2–7. So the game keeps its own number,
// migrated once from what this phone had before the rewrite (nobody starts over), and raises it only by clearing a jam that
// was already open. A friend's jam is a visit: playable while the link is open, and kept once it has stars.
import { readLevels, unlockedLevel, type LevelStars } from "../../../shared/game-core";
import { LEVEL_COUNT } from "./worlds";

/** The ladder's own stars and bests live under -v2, so the 40 old jams' stars stay exactly as they were. */
export const TOOL = "jam-chharao-v2";
export const OLD_STARS_KEY = "ektukhani-levels-jam-chharao";
export const OLD_PROGRESS_KEY = "ektukhani-jam-chharao-progress";
export const UNLOCK_KEY = "ektukhani-unlock-jam-chharao-v2";
export const INTRO_KEY = "ektukhani-intro-jam-chharao";
const OLD_COUNT = 40;

/**
 * The first visit after the rewrite: the old ladder had 40 jams and this one has 32, so the old unlock maps across by share
 * (clearing 20 of 40 opens 16 of 32). Never fewer than one.
 */
export function migratedUnlock(oldStarsRaw: string | null, oldProgressRaw: string | null, count = LEVEL_COUNT) {
  let oldOpen = unlockedLevel(readLevels(oldStarsRaw, OLD_COUNT), OLD_COUNT);
  try {
    const saved: unknown = JSON.parse(oldProgressRaw ?? "{}");
    if (saved && typeof saved === "object" && !Array.isArray(saved)) {
      for (const key of Object.keys(saved)) { const level = Number(key); if (Number.isInteger(level) && level >= 1 && level < OLD_COUNT) oldOpen = Math.max(oldOpen, level + 1); }
    }
  } catch { /* broken JSON: the stars are enough */ }
  return Math.max(1, Math.min(count, Math.round(((oldOpen - 1) * count) / OLD_COUNT) + 1));
}

/** The saved unlock, or the migration's answer the first time. `migrated` says whether to write it back. */
export function readUnlock(raw: string | null, oldStarsRaw: string | null, oldProgressRaw: string | null, count = LEVEL_COUNT) {
  const saved = Number(raw);
  if (raw !== null && raw.trim() !== "" && Number.isInteger(saved) && saved >= 1) return { unlock: Math.min(count, saved), migrated: false };
  return { unlock: migratedUnlock(oldStarsRaw, oldProgressRaw, count), migrated: true };
}

/** After a clear: the next jam opens only when this one was already open. A friend's far-ahead jam opens nothing. */
export const afterClear = (unlock: number, level: number, count = LEVEL_COUNT) =>
  level >= 1 && level <= unlock ? Math.max(unlock, Math.min(count, level + 1)) : unlock;

/** A jam can be played when it is open, already has stars, or is the friend's jam on this link. */
export const playable = (level: number, unlock: number, stars: LevelStars, visit = 0) =>
  Number.isInteger(level) && level >= 1 && (level <= unlock || Boolean(stars[level]) || level === visit);

/** The jam to suggest: the first open one without stars, else the first with fewer than 3, else the last open one. */
export function recommended(unlock: number, stars: LevelStars) {
  for (let level = 1; level <= unlock; level++) if (!stars[level]) return level;
  for (let level = 1; level <= unlock; level++) if ((stars[level] ?? 0) < 3) return level;
  return unlock;
}

/** The nearest playable jam before or after `level` (‹ › on the title), or 0 when there is none. */
export function neighbourLevel(level: number, step: -1 | 1, unlock: number, stars: LevelStars, visit: number, count = LEVEL_COUNT) {
  for (let next = level + step; next >= 1 && next <= count; next += step) if (playable(next, unlock, stars, visit)) return next;
  return 0;
}

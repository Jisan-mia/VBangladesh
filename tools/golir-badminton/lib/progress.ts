// This phone's progress. Two things the shared helpers don't do:
// 1. The old fifteen-level ladder's stars move once to the new twelve levels (the same place on the ladder, the better stars).
// 2. This game keeps its own unlock. The shared unlockedLevel opens every level below the highest one with stars, which is
//    right for the migration but wrong after a friend's link: clearing their far level must not open the ones in between.
import { readLevels, unlockedLevel, type LevelStars } from "../../../shared/game-core";
import { fromOld, isMode, LEVEL_COUNT, OLD_COUNT, type Mode } from "./levels";

export const LEVELS_KEY = "ektukhani-levels-golir-badminton";
export const UNLOCK_KEY = "ektukhani-unlock-golir-badminton";
export const INTRO_KEY = "ektukhani-intro-golir-badminton";
export const MODE_KEY = "ektukhani-mode-golir-badminton";
/** The longest rally on this phone, kept from before the rewrite. */
export const BEST_KEY = "ektukhani-best-golir-badminton";

/** The old `{ "1": 3, "7": 1 }` (levels 1–15) as the new numbers. */
export function migrateStars(raw: string | null): LevelStars {
  const old = readLevels(raw, OLD_COUNT), stars: LevelStars = {};
  for (const [from, earned] of Object.entries(old)) {
    const to = fromOld(Number(from));
    stars[to] = Math.max(stars[to] ?? 0, earned);
  }
  return stars;
}

/**
 * First run of the new ladder (no unlock saved yet): migrate the stars, then the unlock from the shared rule, so nobody loses
 * a level they could play. Later runs read the saved unlock. `write` says what to store.
 */
export function loadProgress(levelsRaw: string | null, unlockRaw: string | null) {
  const saved = Number(unlockRaw);
  if (unlockRaw !== null && Number.isInteger(saved) && saved >= 1) {
    return { stars: readLevels(levelsRaw, LEVEL_COUNT), unlock: Math.min(LEVEL_COUNT, saved), write: null };
  }
  const stars = migrateStars(levelsRaw), unlock = unlockedLevel(stars, LEVEL_COUNT);
  return { stars, unlock, write: { levels: JSON.stringify(stars), unlock: String(unlock) } };
}

/** After a clear: the next level opens only when this one was already open. A friend's far-ahead level keeps its stars and opens nothing. */
export const afterClear = (unlock: number, level: number) => level >= 1 && level <= unlock ? Math.max(unlock, Math.min(LEVEL_COUNT, level + 1)) : unlock;

/** A level can be played when it is open, already has stars, or is the friend's level on this link. */
export const playable = (level: number, unlock: number, stars: LevelStars, friendLevel = 0) =>
  level >= 1 && level <= LEVEL_COUNT && (level <= unlock || Boolean(stars[level]) || level === friendLevel);

/** The level to suggest: the first open one without stars, else the first with fewer than 3, else the last open one. */
export function recommended(unlock: number, stars: LevelStars) {
  for (let level = 1; level <= unlock; level++) if (!stars[level]) return level;
  for (let level = 1; level <= unlock; level++) if ((stars[level] ?? 0) < 3) return level;
  return unlock;
}

export const readMode = (raw: string | null): Mode => raw && isMode(raw) ? raw : "n";

/** The best rally saved on this phone (a whole number, else none). */
export function readBest(raw: string | null) {
  const value = Number(raw);
  return raw !== null && Number.isInteger(value) && value > 0 && value <= 999 ? value : 0;
}

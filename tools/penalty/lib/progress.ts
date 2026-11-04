// This phone's progress. Two things the shared helpers don't do:
// 1. The old eight-match ladder's stars are moved once to the new twelve matches (same team, same stars).
// 2. This game keeps its own unlock. The shared unlockedLevel opens every match below the highest one with stars, which is right
//    for the migration but wrong after a friend's link: clearing their final must not open the matches in between. So the
//    number lives in its own key, migrated once from the shared rule, and grows only by clearing the furthest open match.
import { readLevels, unlockedLevel, type LevelStars } from "../../../shared/game-core";
import { LEVEL_COUNT, OLD_LEVELS } from "./levels";

export const LEVELS_KEY = "ektukhani-levels-penalty";
export const UNLOCK_KEY = "ektukhani-unlock-penalty";
export const INTRO_KEY = "ektukhani-intro-penalty";

/** The old `{ "1": 2, "3": 1 }` (matches 1–8) as the new numbers. Runs only before this game's unlock was ever saved. */
export function migrateStars(raw: string | null): LevelStars {
  const old = readLevels(raw, 8), stars: LevelStars = {};
  for (const [from, earned] of Object.entries(old)) {
    const to = OLD_LEVELS[Number(from)];
    if (to) stars[to] = Math.max(stars[to] ?? 0, earned);
  }
  return stars;
}

/**
 * First run of the new ladder (no unlock saved yet): migrate the stars, then the unlock from the shared rule, so nobody loses
 * a match they could play. Later runs read the saved unlock. `write` says what to store.
 */
export function loadProgress(levelsRaw: string | null, unlockRaw: string | null) {
  const saved = Number(unlockRaw);
  if (unlockRaw !== null && Number.isInteger(saved) && saved >= 1) {
    return { stars: readLevels(levelsRaw, LEVEL_COUNT), unlock: Math.min(LEVEL_COUNT, saved), write: null };
  }
  const stars = migrateStars(levelsRaw), unlock = unlockedLevel(stars, LEVEL_COUNT);
  return { stars, unlock, write: { levels: JSON.stringify(stars), unlock: String(unlock) } };
}

/** After a clear: the next match opens only when this one was already open. A friend's far-ahead final keeps its stars and opens nothing. */
export const afterClear = (unlock: number, level: number) => level >= 1 && level <= unlock ? Math.max(unlock, Math.min(LEVEL_COUNT, level + 1)) : unlock;

/** A match can be played when it is open, already has stars, or is the friend's match on this link. */
export const playable = (level: number, unlock: number, stars: LevelStars, friendLevel = 0) =>
  level >= 1 && level <= LEVEL_COUNT && (level <= unlock || Boolean(stars[level]) || level === friendLevel);

/** The match to suggest: the first open one without stars, else the first with fewer than 3, else the last open one. */
export function recommended(unlock: number, stars: LevelStars) {
  for (let level = 1; level <= unlock; level++) if (!stars[level]) return level;
  for (let level = 1; level <= unlock; level++) if ((stars[level] ?? 0) < 3) return level;
  return unlock;
}

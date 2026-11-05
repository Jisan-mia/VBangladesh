// This phone's progress. Three things the shared helpers don't do:
// 1. The old ten-level ladder's stars move once to the new twelve levels (the same place on the ladder, the better stars),
//    and the oldest saved best (from the one-field game, before levels) becomes level 1's stars when nothing newer exists.
// 2. This game keeps its own unlock. The shared unlockedLevel opens every level below the highest one with stars, which is
//    right for the migration but wrong after a friend's link: clearing their far level must not open the ones in between.
// 3. Bests per level live in one JSON map; the old per-level best keys move into it once.
import { readLevels, unlockedLevel, type LevelStars } from "../../../shared/game-core";
import { fromOld, isMode, LEVEL_COUNT, MAX_HIT, OLD_COUNT, starsOf, HITS, type Mode } from "./levels";

export const LEVELS_KEY = "ektukhani-levels-danguli";
export const UNLOCK_KEY = "ektukhani-unlock-danguli";
export const INTRO_KEY = "ektukhani-intro-danguli";
export const MODE_KEY = "ektukhani-mode-danguli";
export const BESTS_KEY = "ektukhani-bests-danguli";
/** The one-field game's best (old level 1), and the old ladder's per-level bests (`-2` … `-10`). */
export const OLD_BEST_KEY = "ektukhani-best-danguli";
export const oldBestKey = (old: number) => old === 1 ? OLD_BEST_KEY : `${OLD_BEST_KEY}-${old}`;

export type Bests = Record<number, number>;
const MAX_TOTAL = HITS * MAX_HIT;
const total = (raw: string | null) => {
  const value = Number(raw);
  return raw !== null && Number.isInteger(value) && value >= 0 && value <= MAX_TOTAL ? value : -1;
};

/** The old `{ "1": 3, "7": 1 }` (levels 1–10) as the new numbers. */
export function migrateStars(raw: string | null): LevelStars {
  const old = readLevels(raw, OLD_COUNT), stars: LevelStars = {};
  for (const [from, earned] of Object.entries(old)) {
    const to = fromOld(Number(from));
    stars[to] = Math.max(stars[to] ?? 0, earned);
  }
  return stars;
}

export function readBests(raw: string | null): Bests {
  const bests: Bests = {};
  try {
    const parsed = JSON.parse(raw ?? "{}");
    for (const [key, value] of Object.entries(parsed ?? {})) {
      const level = Number(key), best = Number(value);
      if (Number.isInteger(level) && level >= 1 && level <= LEVEL_COUNT && Number.isInteger(best) && best >= 0 && best <= MAX_TOTAL) bests[level] = best;
    }
  } catch { /* broken JSON: start fresh */ }
  return bests;
}

/**
 * First run of the new ladder (no unlock saved yet): migrate the stars and the bests, then the unlock from the shared rule,
 * so nobody loses a level they could play. Later runs read what's saved. `write` says what to store; `read` reads a key.
 */
export function loadProgress(read: (key: string) => string | null) {
  const unlockRaw = read(UNLOCK_KEY), saved = Number(unlockRaw);
  if (unlockRaw !== null && Number.isInteger(saved) && saved >= 1) {
    return { stars: readLevels(read(LEVELS_KEY), LEVEL_COUNT), unlock: Math.min(LEVEL_COUNT, saved), bests: readBests(read(BESTS_KEY)), write: null };
  }
  const stars = migrateStars(read(LEVELS_KEY)), bests: Bests = {};
  for (let old = 1; old <= OLD_COUNT; old++) {
    const best = total(read(oldBestKey(old)));
    if (best < 0) continue;
    const to = fromOld(old);
    bests[to] = Math.max(bests[to] ?? 0, best);
  }
  // Before the ladder there was one field and one best: it beat the first neighbour or it didn't.
  const first = total(read(OLD_BEST_KEY));
  if (!Object.keys(stars).length && first >= 0) {
    const earned = starsOf(first, 1);
    if (earned) stars[1] = earned;
  }
  const unlock = unlockedLevel(stars, LEVEL_COUNT);
  return { stars, unlock, bests, write: { levels: JSON.stringify(stars), unlock: String(unlock), bests: JSON.stringify(bests) } };
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

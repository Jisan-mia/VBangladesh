// What this phone keeps, and the one-time move from the old 8-stage game's stars.
// The shared unlockedLevel opens every level below the highest one with stars (right for a migration, wrong after a friend's
// link), so the game keeps its own unlock: migrated once, then raised only by clearing the furthest open floor.
import { readLevels, unlockedLevel, type LevelStars } from "../../../shared/game-core";
import { STAGE_COUNT } from "./legacy";
import { LEVEL_COUNT } from "./levels";

export const TOOL = "marble-sinri";
/** The 12-floor ladder (the useLevels slug), and the old 8-stage one it migrates from. */
export const LADDER = `${TOOL}-floors`;
export const LADDER_KEY = `ektukhani-levels-${LADDER}`;
export const OLD_LEVELS_KEY = `ektukhani-levels-${TOOL}`;
export const UNLOCK_KEY = `ektukhani-unlock-${TOOL}`;
export const INTRO_KEY = `ektukhani-intro-${TOOL}`;
export const MODE_KEY = `ektukhani-mode-${TOOL}`;
export const COLOUR_KEY = `ektukhani-${TOOL}-colour`;
/** useBest slugs: an old link's endless stairs keep the old per-stage best; a floor keeps its best time in tenths. */
export const oldBestSlug = (stage: number) => `${TOOL}-${stage}`;
export const floorBestSlug = (level: number) => `${TOOL}-floor-${level}`;

/**
 * Run once, before the ladder is first read (while its key is still empty). Old stages 1..K cleared open the new floors
 * 1..⌊1.5 K⌋, each carrying the stars of the old stage in the same place. Returns the new store, or null when there is nothing to move.
 */
export function migrateLadder(ladderRaw: string | null, levelsRaw: string | null) {
  if (ladderRaw !== null || levelsRaw === null) return null;
  const old = readLevels(levelsRaw, STAGE_COUNT);
  const cleared = Math.max(0, ...Object.keys(old).map(Number));
  if (!cleared) return null;
  const stars: LevelStars = {};
  for (let level = 1; level <= Math.min(LEVEL_COUNT, Math.floor(cleared * LEVEL_COUNT / STAGE_COUNT)); level++) {
    stars[level] = old[Math.ceil(level * STAGE_COUNT / LEVEL_COUNT)] ?? 1;
  }
  return JSON.stringify(stars);
}

/** The saved unlock, or the shared rule's answer the first time (the migration). `migrated` says whether to write it back. */
export function readUnlock(raw: string | null, stars: LevelStars) {
  const saved = Number(raw);
  if (raw !== null && Number.isInteger(saved) && saved >= 1) return { unlock: Math.min(LEVEL_COUNT, saved), migrated: false };
  return { unlock: unlockedLevel(stars, LEVEL_COUNT), migrated: true };
}

/** After a clear: the next floor opens only when this one was already open. A friend's far-ahead floor keeps its stars and opens nothing. */
export const afterClear = (unlock: number, level: number) => level >= 1 && level <= unlock ? Math.max(unlock, Math.min(LEVEL_COUNT, level + 1)) : unlock;

/** A floor can be played when it is open, already has stars, or is the friend's floor on this link. */
export const playable = (level: number, unlock: number, stars: LevelStars, friendLevel = 0) => level >= 1 && level <= LEVEL_COUNT && (level <= unlock || Boolean(stars[level]) || level === friendLevel);

/** The floor to suggest: the first open one without stars, else the first with fewer than 3, else the last open one. */
export function recommended(unlock: number, stars: LevelStars) {
  for (let level = 1; level <= unlock; level++) if (!stars[level]) return level;
  for (let level = 1; level <= unlock; level++) if ((stars[level] ?? 0) < 3) return level;
  return unlock;
}

export const readMode = (raw: string | null) => raw === "0" || raw === "2" ? Number(raw) : 1;

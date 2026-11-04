// What this phone keeps, and the one-time move from the old game's 20 waves to the 12 flights.
// The shared unlockedLevel opens every level below the highest one with stars (right for migrations, wrong after a friend's
// link), so the game keeps its own unlock: migrated once, then raised only by clearing the furthest open flight.
import { readLevels, unlockedLevel, type LevelStars } from "../../../shared/game-core";
import { LEGACY_COUNT } from "./legacy";
import { LEVEL_COUNT } from "./levels";

export const TOOL = "kagojer-urojahaj";
/** The 12-flight ladder (useLevels slug), and the old 20-wave one it migrates from. */
export const LADDER = `${TOOL}-udan`;
export const LADDER_KEY = `ektukhani-levels-${LADDER}`;
export const OLD_LEVELS_KEY = `ektukhani-levels-${TOOL}`;
export const UNLOCK_KEY = `ektukhani-unlock-${TOOL}`;
export const INTRO_KEY = `ektukhani-intro-${TOOL}`;
export const MODE_KEY = `ektukhani-mode-${TOOL}`;
export const TOTAL_KEY = `ektukhani-${TOOL}-candies`;
/** This phone's best points for one flight. */
export const bestSlug = (level: number) => `${LADDER}-${level}`;

/**
 * Run once, before the ladder is first read (when its key is still empty). Old waves 1..K cleared open the new flights
 * 1..⌊0.6K⌋, each carrying the stars of the old wave in the same place. Returns the new store, or null with nothing to move.
 */
export function migrateLadder(ladderRaw: string | null, oldRaw: string | null) {
  if (ladderRaw !== null || oldRaw === null) return null;
  const old = readLevels(oldRaw, LEGACY_COUNT);
  const cleared = Math.max(0, ...Object.keys(old).map(Number));
  if (!cleared) return null;
  const stars: LevelStars = {};
  for (let level = 1; level <= Math.min(LEVEL_COUNT, Math.floor((cleared * LEVEL_COUNT) / LEGACY_COUNT)); level++) {
    stars[level] = old[Math.ceil((level * LEGACY_COUNT) / LEVEL_COUNT)] ?? 1;
  }
  return Object.keys(stars).length ? JSON.stringify(stars) : null;
}

/** The saved unlock, or the shared rule's answer the first time (the migration). `migrated` says whether to write it back. */
export function readUnlock(raw: string | null, stars: LevelStars) {
  const saved = Number(raw);
  if (raw !== null && Number.isInteger(saved) && saved >= 1) return { unlock: Math.min(LEVEL_COUNT, saved), migrated: false };
  return { unlock: unlockedLevel(stars, LEVEL_COUNT), migrated: true };
}

/** After a landing: the next flight opens only when this one was already open. A friend's far-ahead flight keeps its stars and opens nothing. */
export const afterClear = (unlock: number, level: number) => (level >= 1 && level <= unlock ? Math.max(unlock, Math.min(LEVEL_COUNT, level + 1)) : unlock);

/** A flight can be played when it is open, already has stars, or is the friend's flight on this link. */
export const playable = (level: number, unlock: number, stars: LevelStars, friendLevel = 0) =>
  level >= 1 && level <= LEVEL_COUNT && (level <= unlock || Boolean(stars[level]) || level === friendLevel);

/** The flight to suggest: the first open one without stars, else the first with fewer than 3, else the last open one. */
export function recommended(unlock: number, stars: LevelStars) {
  for (let level = 1; level <= unlock; level++) if (!stars[level]) return level;
  for (let level = 1; level <= unlock; level++) if ((stars[level] ?? 0) < 3) return level;
  return unlock;
}

export const readMode = (raw: string | null) => (raw === "0" || raw === "2" ? Number(raw) : 1);

/** Candies caught on this phone across every flight, and the badges on the way. */
export const MILESTONES = [25, 50, 100, 250, 500, 1000] as const;
export const milestoneOf = (total: number) => [...MILESTONES].reverse().find(mark => total >= mark) ?? 0;
export const nextMilestone = (total: number) => MILESTONES.find(mark => total < mark) ?? 0;

// What this phone keeps, and the one-time moves from the old game's storage.
// The shared unlockedLevel opens every level below the highest one with stars (right for migrations, wrong after a friend's
// link), so the game keeps its own unlock: migrated once, then raised only by clearing the furthest open storm.
import { readLevels, unlockedLevel, type LevelStars } from "../../../shared/game-core";
import { CLASSIC_STAGE, LEGACY_COUNT } from "./legacy";
import { LEVEL_COUNT } from "./levels";

export const TOOL = "kalbaishakhi-aam";
/** The 12-storm ladder (useLevels slug), and the old 8-storm one it migrates from. */
export const LADDER = `${TOOL}-ladder`;
export const LADDER_KEY = `ektukhani-levels-${LADDER}`;
export const OLD_LEVELS_KEY = `ektukhani-levels-${TOOL}`;
export const BEST_KEY = `ektukhani-best-${TOOL}`;
export const TOTAL_KEY = `ektukhani-${TOOL}-total`;
export const UNLOCK_KEY = `ektukhani-unlock-${TOOL}`;
export const INTRO_KEY = `ektukhani-intro-${TOOL}`;
export const MODE_KEY = `ektukhani-mode-${TOOL}`;

/** The old game kept only a best score from the original storm (storm 4): that counts as storm 4 cleared with one star. */
function oldStars(levelsRaw: string | null, bestRaw: string | null): LevelStars {
  if (levelsRaw !== null) return readLevels(levelsRaw, LEGACY_COUNT);
  const best = Number(bestRaw);
  return bestRaw !== null && Number.isFinite(best) && best > 0 ? { [CLASSIC_STAGE]: 1 } : {};
}

/**
 * Run once, before the ladder is first read (when its key is still empty). Old storms 1..K cleared open the new storms 1..⌊1.5K⌋,
 * each carrying the stars of the old storm in the same place. Returns the new store, or null when there is nothing to move.
 */
export function migrateLadder(ladderRaw: string | null, levelsRaw: string | null, bestRaw: string | null) {
  if (ladderRaw !== null) return null;
  const old = oldStars(levelsRaw, bestRaw);
  const cleared = Math.max(0, ...Object.keys(old).map(Number));
  if (!cleared) return null;
  const stars: LevelStars = {};
  for (let level = 1; level <= Math.min(LEVEL_COUNT, Math.floor(cleared * LEVEL_COUNT / LEGACY_COUNT)); level++) {
    stars[level] = old[Math.ceil(level * LEGACY_COUNT / LEVEL_COUNT)] ?? 1;
  }
  return JSON.stringify(stars);
}

/** The saved unlock, or the shared rule's answer the first time (the migration). `migrated` says whether to write it back. */
export function readUnlock(raw: string | null, stars: LevelStars) {
  const saved = Number(raw);
  if (raw !== null && Number.isInteger(saved) && saved >= 1) return { unlock: Math.min(LEVEL_COUNT, saved), migrated: false };
  return { unlock: unlockedLevel(stars, LEVEL_COUNT), migrated: true };
}

/** After a clear: the next storm opens only when this one was already open. A friend's far-ahead storm keeps its stars and opens nothing. */
export const afterClear = (unlock: number, level: number) => level >= 1 && level <= unlock ? Math.max(unlock, Math.min(LEVEL_COUNT, level + 1)) : unlock;

/** A storm can be played when it is open, already has stars, or is the friend's storm on this link. */
export const playable = (level: number, unlock: number, stars: LevelStars, friendLevel = 0) => level >= 1 && level <= LEVEL_COUNT && (level <= unlock || Boolean(stars[level]) || level === friendLevel);

/** The storm to suggest: the first open one without stars, else the first with fewer than 3, else the last open one. */
export function recommended(unlock: number, stars: LevelStars) {
  for (let level = 1; level <= unlock; level++) if (!stars[level]) return level;
  for (let level = 1; level <= unlock; level++) if ((stars[level] ?? 0) < 3) return level;
  return unlock;
}

export const readMode = (raw: string | null) => raw === "0" || raw === "2" ? Number(raw) : 1;

/** Mangoes gathered on this phone across every storm, and the badges on the way. */
export const MILESTONES = [50, 100, 250, 500, 1000, 2500, 5000] as const;
export const milestoneOf = (total: number) => [...MILESTONES].reverse().find(mark => total >= mark) ?? 0;
export const nextMilestone = (total: number) => MILESTONES.find(mark => total < mark) ?? 0;

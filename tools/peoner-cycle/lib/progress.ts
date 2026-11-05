// What this phone keeps, and the one-time move from the old game's 10 routes (or, before those, its one-road best)
// to the 12 new routes. The shared unlockedLevel opens every level below the highest one with stars (right for
// migrations, wrong after a friend's link), so the game keeps its own unlock: migrated once, then raised only by
// reaching the place on the furthest open route.
import { readLevels, unlockedLevel, type LevelStars } from "../../../shared/game-core";
import { LEVEL_COUNT, MODES, DEFAULT_MODE } from "./levels";

export const TOOL = "peoner-cycle";
/** The new ladder (useLevels slug), and the old keys it migrates from. */
export const LADDER = `${TOOL}-dak`;
export const LADDER_KEY = `ektukhani-levels-${LADDER}`;
export const OLD_LEVELS_KEY = `ektukhani-levels-${TOOL}`;
export const OLD_BEST_KEY = `ektukhani-best-${TOOL}`;
export const UNLOCK_KEY = `ektukhani-unlock-${TOOL}`;
export const INTRO_KEY = `ektukhani-intro-${TOOL}`;
export const MODE_KEY = `ektukhani-mode-${TOOL}`;
export const TOTAL_KEY = `ektukhani-${TOOL}-letters`;
export const OLD_ROUTES = 10;
/** This phone's best points for one route. */
export const bestSlug = (level: number) => `${LADDER}-${level}`;

/**
 * Before routes, this phone kept only a best score for the one road (old route 1). A score also counted letters and
 * bells (at most 3 × মিটার + 40 in all), so it becomes the fewest মিটার that could have made it: no unearned stars.
 */
export function oldBestStars(oldBest: string | null) {
  const score = Number(oldBest);
  if (oldBest === null || !Number.isInteger(score) || score < 0) return 0;
  const meters = Math.floor((score - 40) / 3);
  return meters < 100 ? 0 : meters >= 320 ? 3 : meters >= 200 ? 2 : 1;
}

/**
 * Run once, before the ladder is first read (when its key is still empty). Old routes 1..K cleared open the new routes
 * 1..⌊1.2 K⌋, each with the stars of the old route in the same place. Returns the new store, or null with nothing to move.
 */
export function migrateLadder(ladderRaw: string | null, oldRaw: string | null, oldBest: string | null) {
  if (ladderRaw !== null) return null;
  let old = readLevels(oldRaw, OLD_ROUTES);
  if (!Object.keys(old).length) {
    const first = oldBestStars(oldBest);
    if (first) old = { 1: first };
  }
  const cleared = Math.max(0, ...Object.keys(old).map(Number));
  if (!cleared) return null;
  const stars: LevelStars = {};
  for (let level = 1; level <= Math.min(LEVEL_COUNT, Math.floor((cleared * LEVEL_COUNT) / OLD_ROUTES)); level++) {
    stars[level] = old[Math.max(1, Math.ceil((level * OLD_ROUTES) / LEVEL_COUNT))] ?? 1;
  }
  return Object.keys(stars).length ? JSON.stringify(stars) : null;
}

/** The saved unlock, or the shared rule's answer the first time (the migration). `migrated` says whether to write it back. */
export function readUnlock(raw: string | null, stars: LevelStars) {
  const saved = Number(raw);
  if (raw !== null && Number.isInteger(saved) && saved >= 1) return { unlock: Math.min(LEVEL_COUNT, saved), migrated: false };
  return { unlock: unlockedLevel(stars, LEVEL_COUNT), migrated: true };
}

/** After reaching the place: the next route opens only when this one was already open. A friend's far-ahead route opens nothing. */
export const afterClear = (unlock: number, level: number) => (level >= 1 && level <= unlock ? Math.max(unlock, Math.min(LEVEL_COUNT, level + 1)) : unlock);

/** A route can be played when it is open, already has stars, or is the friend's route on this link. */
export const playable = (level: number, unlock: number, stars: LevelStars, friendLevel = 0) =>
  level >= 1 && level <= LEVEL_COUNT && (level <= unlock || Boolean(stars[level]) || level === friendLevel);

/** The route to suggest: the first open one without stars, else the first with fewer than 3, else the last open one. */
export function recommended(unlock: number, stars: LevelStars) {
  for (let level = 1; level <= unlock; level++) if (!stars[level]) return level;
  for (let level = 1; level <= unlock; level++) if ((stars[level] ?? 0) < 3) return level;
  return unlock;
}

export const readMode = (raw: string | null) => {
  const index = MODES.findIndex(mode => mode.id === raw);
  return index >= 0 ? index : DEFAULT_MODE;
};

/** Letters delivered on this phone across every route, and the badges on the way. */
export const MILESTONES = [25, 50, 100, 250, 500, 1000] as const;
export const milestoneOf = (total: number) => [...MILESTONES].reverse().find(mark => total >= mark) ?? 0;
export const nextMilestone = (total: number) => MILESTONES.find(mark => total < mark) ?? 0;

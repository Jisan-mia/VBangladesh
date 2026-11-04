// What this phone keeps, and the one-time move from the old game's storage. The old game had only খোলা পাটি and a best
// score (`ektukhani-best-pati-buni`, still খোলা পাটি's best). The shared unlockedLevel opens every level below the highest
// one with stars (right for migrations, wrong after a friend's link), so the game keeps its own unlock: migrated once from
// the old best, then raised only by clearing the furthest open পাটি.
import { unlockedLevel, type LevelStars } from "../../../shared/game-core";
import { LEVEL_COUNT, PER_WORLD } from "./levels";

export const TOOL = "pati-buni";
export const BEST_KEY = `ektukhani-best-${TOOL}`;
export const UNLOCK_KEY = `ektukhani-unlock-${TOOL}`;
export const INTRO_KEY = `ektukhani-intro-${TOOL}`;
export const MODE_KEY = `ektukhani-mode-${TOOL}`;

/** An old best opens পাটি 2 (you know how to place a strip); 150 or more (about 15 rows) opens the whole first world. */
export function migratedUnlock(bestRaw: string | null) {
  const best = Number(bestRaw);
  if (bestRaw === null || !Number.isFinite(best) || best <= 0) return 1;
  return best >= 150 ? PER_WORLD : 2;
}

/** The saved unlock, or (the first time) the larger of the old best's and the shared rule's. `migrated` says whether to write it back. */
export function readUnlock(raw: string | null, stars: LevelStars, bestRaw: string | null) {
  const saved = Number(raw);
  if (raw !== null && Number.isInteger(saved) && saved >= 1) return { unlock: Math.min(LEVEL_COUNT, saved), migrated: false };
  return { unlock: Math.min(LEVEL_COUNT, Math.max(unlockedLevel(stars, LEVEL_COUNT), migratedUnlock(bestRaw))), migrated: true };
}

/** After a clear: the next পাটি opens only when this one was already open. A friend's far-ahead পাটি keeps its stars and opens nothing. */
export const afterClear = (unlock: number, level: number) => level >= 1 && level <= unlock ? Math.max(unlock, Math.min(LEVEL_COUNT, level + 1)) : unlock;

/** A পাটি can be played when it is open, already has stars, or is the friend's on this link. খোলা পাটি (0) is always open. */
export const playable = (level: number, unlock: number, stars: LevelStars, friendLevel = -1) =>
  level === 0 || (level >= 1 && level <= LEVEL_COUNT && (level <= unlock || Boolean(stars[level]) || level === friendLevel));

/** The পাটি to suggest: the first open one without stars, else the first with fewer than 3, else the last open one. */
export function recommended(unlock: number, stars: LevelStars) {
  for (let level = 1; level <= unlock; level++) if (!stars[level]) return level;
  for (let level = 1; level <= unlock; level++) if ((stars[level] ?? 0) < 3) return level;
  return unlock;
}

export const readMode = (raw: string | null) => raw === "0" || raw === "2" ? Number(raw) : 1;

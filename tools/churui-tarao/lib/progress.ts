// What this phone keeps. Stars stay where they always were (`ektukhani-levels-churui-tarao`, by ক্ষেত number). The shared
// unlockedLevel opens every ক্ষেত below the highest one with stars (right for the one-time migration, wrong after a friend's
// link), so the game keeps its own unlock: migrated once, then raised only by clearing the furthest open ক্ষেত.
import { unlockedLevel, type LevelStars } from "../../../shared/game-core";
import { DEFAULT_MODE, LEVEL_COUNT, MODES } from "./levels";

export const TOOL = "churui-tarao";
export const LEVELS_KEY = `ektukhani-levels-${TOOL}`;
export const UNLOCK_KEY = `ektukhani-unlock-${TOOL}`;
export const INTRO_KEY = `ektukhani-intro-${TOOL}`;
export const MODE_KEY = `ektukhani-mode-${TOOL}`;
/** Field 1 keeps the key the one-field game used, so the old best stays its best. */
export const bestKey = (level: number) => level === 1 ? `ektukhani-best-${TOOL}` : `ektukhani-best-${TOOL}-${level}`;

/** The saved unlock, or the shared rule's answer the first time (the migration). `migrated` says whether to write it back. */
export function readUnlock(raw: string | null, stars: LevelStars) {
  const saved = Number(raw);
  if (raw !== null && Number.isInteger(saved) && saved >= 1) return { unlock: Math.min(LEVEL_COUNT, saved), migrated: false };
  return { unlock: unlockedLevel(stars, LEVEL_COUNT), migrated: true };
}

/** After a clear: the next ক্ষেত opens only when this one was already open. A friend's far-ahead ক্ষেত keeps its stars and opens nothing. */
export const afterClear = (unlock: number, level: number) => (level >= 1 && level <= unlock ? Math.max(unlock, Math.min(LEVEL_COUNT, level + 1)) : unlock);

/** A ক্ষেত can be played when it is open, already has stars, or is the friend's ক্ষেত on this link. */
export const playable = (level: number, unlock: number, stars: LevelStars, friendLevel = 0) =>
  level >= 1 && level <= LEVEL_COUNT && (level <= unlock || Boolean(stars[level]) || level === friendLevel);

/** The ক্ষেত to suggest: the first open one without stars, else the first with fewer than 3, else the last open one. */
export function recommended(unlock: number, stars: LevelStars) {
  for (let level = 1; level <= unlock; level++) if (!stars[level]) return level;
  for (let level = 1; level <= unlock; level++) if ((stars[level] ?? 0) < 3) return level;
  return unlock;
}

export const readMode = (raw: string | null) => {
  const mode = Number(raw);
  return raw !== null && raw !== "" && Number.isInteger(mode) && mode >= 0 && mode < MODES.length ? mode : DEFAULT_MODE;
};

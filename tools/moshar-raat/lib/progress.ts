// What this phone keeps. Stars stay where they always were (`ektukhani-levels-moshar-raat`, by রাত number, with the same three
// meanings). The shared unlockedLevel opens every রাত below the highest one with stars (right for the one-time migration,
// wrong after a friend's link), so the game keeps its own unlock: migrated once, then raised only by clearing the furthest open রাত.
import { unlockedLevel, type LevelStars } from "../../../shared/game-core";
import { DEFAULT_MODE, LEVEL_COUNT, MODES } from "./levels";

export const TOOL = "moshar-raat";
export const UNLOCK_KEY = `ektukhani-unlock-${TOOL}`;
export const INTRO_KEY = `ektukhani-intro-${TOOL}`;
export const MODE_KEY = `ektukhani-mode-${TOOL}`;

/** The saved unlock, or the shared rule's answer the first time (the migration). `migrated` says whether to write it back. */
export function readUnlock(raw: string | null, stars: LevelStars) {
  const saved = Number(raw);
  if (raw !== null && Number.isInteger(saved) && saved >= 1) return { unlock: Math.min(LEVEL_COUNT, saved), migrated: false };
  return { unlock: unlockedLevel(stars, LEVEL_COUNT), migrated: true };
}

/** After a clear: the next রাত opens only when this one was already open. A friend's far-ahead রাত keeps its stars and opens nothing. */
export const afterClear = (unlock: number, level: number) => (level >= 1 && level <= unlock ? Math.max(unlock, Math.min(LEVEL_COUNT, level + 1)) : unlock);

/** A রাত can be played when it is open, already has stars, or is the friend's রাত on this link. */
export const playable = (level: number, unlock: number, stars: LevelStars, friendLevel = 0) =>
  level >= 1 && level <= LEVEL_COUNT && (level <= unlock || Boolean(stars[level]) || level === friendLevel);

/** The রাত to suggest: the first open one without stars, else the first with fewer than 3, else the last open one. */
export function recommended(unlock: number, stars: LevelStars) {
  for (let level = 1; level <= unlock; level++) if (!stars[level]) return level;
  for (let level = 1; level <= unlock; level++) if ((stars[level] ?? 0) < 3) return level;
  return unlock;
}

export const readMode = (raw: string | null) => {
  const mode = Number(raw);
  return raw !== null && Number.isInteger(mode) && mode >= 0 && mode < MODES.length ? mode : DEFAULT_MODE;
};

// This game's own unlock rule. The shared unlockedLevel opens every level below the highest one with stars, which is right
// for the migration but wrong after a friend's link: clearing their level 8 must not open 2–7. So the game keeps its own
// number, migrated once from the shared rule (nobody loses a level they could already play), and raises it only by clearing
// a level that was already open. A friend's level is a visit: playable while the link is open, and kept once it has stars.
import { unlockedLevel, type LevelStars } from "../../../shared/game-core";

export const UNLOCK_KEY = "ektukhani-unlock-ponero-ghor";
export const INTRO_KEY = "ektukhani-intro-ponero-ghor";

/** The saved unlock, or the shared rule's answer the first time (the migration). `migrated` says whether to write it back. */
export function readUnlock(raw: string | null, stars: LevelStars, count: number) {
  const saved = Number(raw);
  if (raw !== null && raw.trim() !== "" && Number.isInteger(saved) && saved >= 1) return { unlock: Math.min(count, saved), migrated: false };
  return { unlock: unlockedLevel(stars, count), migrated: true };
}

/** After a clear: the next level opens only when this one was already open. A friend's far-ahead level opens nothing. */
export const afterClear = (unlock: number, level: number, count: number) =>
  level >= 1 && level <= unlock ? Math.max(unlock, Math.min(count, level + 1)) : unlock;

/** A level can be played when it is open, already has stars, or is the friend's level on this link. */
export const playable = (level: number, unlock: number, stars: LevelStars, visit = 0) =>
  Number.isInteger(level) && level >= 1 && (level <= unlock || Boolean(stars[level]) || level === visit);

/** The level to suggest: the first open one without stars, else the first with fewer than 3, else the last open one. */
export function recommended(unlock: number, stars: LevelStars) {
  for (let level = 1; level <= unlock; level++) if (!stars[level]) return level;
  for (let level = 1; level <= unlock; level++) if ((stars[level] ?? 0) < 3) return level;
  return unlock;
}

/** The nearest playable level before or after `level` (‹ › on the title), or 0 when there is none. */
export function neighbourLevel(level: number, step: -1 | 1, unlock: number, stars: LevelStars, visit: number, count: number) {
  for (let next = level + step; next >= 1 && next <= count; next += step) if (playable(next, unlock, stars, visit)) return next;
  return 0;
}

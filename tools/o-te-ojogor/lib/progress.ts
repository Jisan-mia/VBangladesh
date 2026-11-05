// This game's own unlock rule. The shared unlockedLevel opens every level below the highest one with stars, which is right for
// migrations but wrong after a friend's link: clearing their level 8 must not open 2–7, and a second link must never lock what
// the first opened. So the game keeps its own number, migrated once from the shared rule (nobody loses a level they could
// already play), and raises it only by clearing the furthest open level.
import { unlockedLevel, type LevelStars } from "../../../shared/game-core";
import { isMode, type Mode } from "./tree";

export const UNLOCK_KEY = "ektukhani-unlock-o-te-ojogor";
export const MODE_KEY = "ektukhani-mode-o-te-ojogor";
/** Levels a link has opened on this phone: each stays playable, so a second link never locks the first one's level. */
export const LINKS_KEY = "ektukhani-links-o-te-ojogor";

/** The saved link levels, cleaned: whole numbers 1..count, no repeats, sorted. */
export function readOpened(raw: string | null, count: number): number[] {
  try {
    const list = JSON.parse(raw ?? "[]");
    return Array.isArray(list) ? [...new Set(list.filter((level: unknown) => Number.isInteger(level) && (level as number) >= 1 && (level as number) <= count) as number[])].sort((a, b) => a - b) : [];
  } catch { return []; }
}
export const withOpened = (opened: readonly number[], level: number) => opened.includes(level) ? [...opened] : [...opened, level].sort((a, b) => a - b);

/** The saved unlock, or the shared rule's answer the first time (the migration). `migrated` says whether to write it back. */
export function readUnlock(raw: string | null, stars: LevelStars, count: number) {
  const saved = Number(raw);
  if (raw !== null && Number.isInteger(saved) && saved >= 1) return { unlock: Math.min(count, saved), migrated: false };
  return { unlock: unlockedLevel(stars, count), migrated: true };
}

/** After a clear: the next level opens only when this one was already open. A friend's far-ahead level keeps its stars and opens nothing. */
export const afterClear = (unlock: number, level: number, count: number) => level >= 1 && level <= unlock ? Math.max(unlock, Math.min(count, level + 1)) : unlock;

/** A level can be played when it is open, already has stars, or a link opened it on this phone. */
export const playable = (level: number, unlock: number, stars: LevelStars, opened: readonly number[] = []) => level >= 1 && (level <= unlock || Boolean(stars[level]) || opened.includes(level));

/** The level to suggest: the first open one without stars, else the first with fewer than 3, else the last open one. */
export function recommended(unlock: number, stars: LevelStars) {
  for (let level = 1; level <= unlock; level++) if (!stars[level]) return level;
  for (let level = 1; level <= unlock; level++) if ((stars[level] ?? 0) < 3) return level;
  return unlock;
}

/** After a level: the one শেষ leaves ready on the title. The next level when it is open, else this one. */
export const nextUp = (level: number, unlock: number, count: number) => level < count && level + 1 <= unlock ? level + 1 : level;

export const readMode = (raw: string | null): Mode => isMode(raw) ? raw : "calm";

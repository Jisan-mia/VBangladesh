// What this phone keeps, as pure functions over raw localStorage strings (the component reads and writes them).
// - The ladder's stars: `ektukhani-levels-paka-kancha-v2` (through useLevels). The levels are new, so stars start again.
// - Your own open level: `ektukhani-paka-kancha-open`. Set once from what the old ladder (`ektukhani-levels-paka-kancha`, left
//   untouched) or an old best had opened, so every level you had open stays open. After that only your own play opens levels:
//   a friend's far-ahead level records its stars but never opens the ones in between (unlockedLevel stays as it is).
// - Today's game: `paka-kancha-day`; the daily best: `ektukhani-best-paka-kancha`; the last mode: `ektukhani-paka-kancha-mode`.
import { readLevels, unlockedLevel, type LevelStars } from '../../../shared/game-core';
import { OLD_LEVEL_COUNT, migrateLevels } from './legacy';
import { LEVEL_COUNT } from './levels';

export const TOOL = 'paka-kancha';
/** The useLevels slug of the ladder, and the keys around it. */
export const LADDER = `${TOOL}-v2`;
export const OLD_LEVELS_KEY = `ektukhani-levels-${TOOL}`;
export const BEST_KEY = `ektukhani-best-${TOOL}`;
export const OPEN_KEY = `ektukhani-${TOOL}-open`;
export const MODE_KEY = `ektukhani-${TOOL}-mode`;
export const DAY_KEY = `${TOOL}-day`;

/** How far the old ladder had opened: its stars, or (no stars yet) the one-time move of an old best. */
export function oldOpen(levelsRaw: string | null, bestRaw: string | null) {
  const stars = readLevels(levelsRaw ?? migrateLevels(levelsRaw, bestRaw), OLD_LEVEL_COUNT);
  return Object.keys(stars).length ? unlockedLevel(stars, OLD_LEVEL_COUNT) : 1;
}

/** Your open level: the one saved, else (once) what the old ladder had opened, or one past your highest star on this one. */
export function readOpen(raw: string | null, oldLevelsRaw: string | null, oldBestRaw: string | null, stars: LevelStars) {
  const saved = Number(raw);
  if (raw !== null && Number.isInteger(saved) && saved >= 1 && saved <= LEVEL_COUNT) return saved;
  return Math.min(LEVEL_COUNT, Math.max(oldOpen(oldLevelsRaw, oldBestRaw), unlockedLevel(stars, LEVEL_COUNT)));
}

/** Clearing your open level (or any below it) opens the next one; a friend's far-ahead level opens nothing. */
export const openAfter = (open: number, cleared: number) => cleared <= open ? Math.min(LEVEL_COUNT, Math.max(open, cleared + 1)) : open;

/** Where to start: your first open level you haven't cleared, so the lessons come in order; else the first one short of three stars. */
export function startLevel(stars: LevelStars, open: number) {
  for (let level = 1; level <= open; level++) if (!stars[level]) return level;
  for (let level = 1; level <= open; level++) if ((stars[level] ?? 0) < 3) return level;
  return open;
}

export type Mode = 'level' | 'day';
export const readMode = (raw: string | null): Mode => raw === 'day' ? 'day' : 'level';

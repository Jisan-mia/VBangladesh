// 30 levels in three worlds, the daily maze, and par times. Pure and server-safe.
import { starsFor, unlockedLevel, type LevelStars } from "../../../shared/game-core";
import { makeMaze, shortestPath, swipesOnPath, type Maze } from "./maze";

export const LEVEL_COUNT = 30;
export const DAILY_SIZE = 12;

export type World = { name: string; place: string; clear: string };
export const WORLDS: readonly World[] = [
  { name: "পুরান ঢাকা", place: "পুরান ঢাকার গলি", clear: "গলি পার, জিলাপির দোকান সামনে।" },
  { name: "গ্রামের মেঠোপথ", place: "গ্রামের মেঠোপথ", clear: "আল পেরিয়ে মেলায় এলে। জিলাপি ভাজা হচ্ছে।" },
  { name: "সুন্দরবনের খাল", place: "সুন্দরবনের খাল", clear: "খাল পেরিয়ে নৌকা ঘাটে ভিড়ল। দোকানে গরম জিলাপি।" },
];
export const worldOf = (level: number) => Math.min(2, Math.floor((level - 1) / 10));

/** 5×5 at level 1, 15×15 at level 30, growing a step every two or three levels. */
export const levelSize = (level: number) => 5 + Math.round((level - 1) * 10 / (LEVEL_COUNT - 1));

/** The decisions (junction stops) on the shortest way: 2 at level 1, rising one at a time to 13. */
export const targetSwipes = (level: number) => Math.round(2 + (level - 1) * 11 / (LEVEL_COUNT - 1));

const CANDIDATES = 80;
const cache = new Map<number, Maze>();

/**
 * A level's maze: of 80 fixed seeds, the one whose shortest way needs closest to `targetSwipes` decisions,
 * then the one whose way is closest to half the board's cells long. Same on every phone, rising in small steps.
 */
export function levelMaze(level: number): Maze {
  const saved = cache.get(level);
  if (saved) return saved;
  const size = levelSize(level), want = targetSwipes(level), length = Math.round(size * size / 2);
  let best: Maze | null = null, bestScore = Infinity;
  for (let k = 0; k < CANDIDATES; k++) {
    const maze = makeMaze(size, 7000 + level * 101 + k), path = shortestPath(maze)!;
    const score = Math.abs(swipesOnPath(maze, path) - want) * 1000 + Math.abs(path.length - 1 - length);
    if (score < bestScore) { best = maze; bestScore = score; }
  }
  cache.set(level, best!);
  return best!;
}

/** Today's date in Dhaka (UTC+6) as a number like 20261012: the daily maze's seed. */
export function dhakaDate(now = Date.now()) {
  const date = new Date(now + 6 * 3600_000);
  return date.getUTCFullYear() * 10000 + (date.getUTCMonth() + 1) * 100 + date.getUTCDate();
}

/** A real calendar date from 2026 to 2099 written as YYYYMMDD. */
export function isDailySeed(seed: number) {
  if (!Number.isInteger(seed) || seed < 20260101 || seed > 20991231) return false;
  const year = Math.floor(seed / 10000), month = Math.floor(seed / 100) % 100, day = seed % 100;
  const date = new Date(Date.UTC(year, month - 1, day));
  return date.getUTCMonth() === month - 1 && date.getUTCDate() === day;
}

export const dailyMaze = (seed: number) => makeMaze(DAILY_SIZE, seed);
/** The daily maze takes a world's look by date, so each day looks a little different. */
export const dailyWorld = (seed: number) => seed % 3;

/** Cells a second the walker covers; ধীরে খেলো halves it. */
export const SPEED = 14, SLOW_SPEED = 7;

export type Par = { three: number; two: number };
/**
 * Star times in tenths of a second, from the shortest way: the walk itself at this speed, 0.7 s to choose at each junction, and 2 s to look.
 * Three stars at or under `three`, two at or under `two`, and any finish earns one.
 */
export function parFor(maze: Maze, speed = SPEED): Par {
  const path = shortestPath(maze)!;
  const three = Math.ceil(((path.length - 1) / speed + swipesOnPath(maze, path) * 0.7 + 2) * 10);
  return { three, two: three * 2 + 30 };
}

export const starsForTime = (tenths: number, par: Par) => starsFor(tenths, par.three, par.two, true);

/** The quickest time anyone could post: the shortest way at full speed, with no thinking at all. Faster claims are refused. */
export const fastestTenths = (maze: Maze) => Math.floor((shortestPath(maze)!.length - 1) / SPEED * 10);

/** Where a returning player starts: the furthest open level not yet at three stars (level 1 for someone new). */
export function openingLevel(stars: LevelStars) {
  const top = unlockedLevel(stars, LEVEL_COUNT);
  for (let level = top; level >= 1; level--) if ((stars[level] ?? 0) < 3) return level;
  return top;
}

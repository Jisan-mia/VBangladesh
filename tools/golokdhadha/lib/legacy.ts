// The game before the rewrite: 30 plain mazes, the plain daily and their par times, kept byte for byte so a link made
// before `v=2` replays the same maze and passes the same checks. Pure and server-safe. Nothing new is built on this.
import { starsFor } from "../../../shared/game-core";
import { makeMaze, shortestPath, swipesOnPath, type Maze } from "./maze";

export const OLD_LEVEL_COUNT = 30;
export const OLD_DAILY_SIZE = 12;

/** 5×5 at level 1, 15×15 at level 30. */
export const oldLevelSize = (level: number) => 5 + Math.round((level - 1) * 10 / (OLD_LEVEL_COUNT - 1));
/** The decisions on the shortest way: 2 at level 1, rising to 13. */
export const oldTargetSwipes = (level: number) => Math.round(2 + (level - 1) * 11 / (OLD_LEVEL_COUNT - 1));

const cache = new Map<number, Maze>();
/** Of 80 fixed seeds, the one whose shortest way needs closest to `oldTargetSwipes` decisions, then closest to half the cells long. */
export function oldLevelMaze(level: number): Maze {
  const saved = cache.get(level);
  if (saved) return saved;
  const size = oldLevelSize(level), want = oldTargetSwipes(level), length = Math.round(size * size / 2);
  let best: Maze | null = null, bestScore = Infinity;
  for (let k = 0; k < 80; k++) {
    const maze = makeMaze(size, 7000 + level * 101 + k), path = shortestPath(maze)!;
    const score = Math.abs(swipesOnPath(maze, path) - want) * 1000 + Math.abs(path.length - 1 - length);
    if (score < bestScore) { best = maze; bestScore = score; }
  }
  cache.set(level, best!);
  return best!;
}

export const oldDailyMaze = (seed: number) => makeMaze(OLD_DAILY_SIZE, seed);
/** The old daily took one of three looks by date. */
export const oldDailyWorld = (seed: number) => seed % 3;
export const oldWorldOf = (level: number) => Math.min(2, Math.floor((level - 1) / 10));

/** Cells a second; ধীরে খেলো halved it. */
export const OLD_SPEED = 14, OLD_SLOW_SPEED = 7;

export type OldPar = { three: number; two: number };
/** Tenths: the walk at this speed, 0.7 s a junction and 2 s to look; two stars at twice that plus 3 s. */
export function oldParFor(maze: Maze, speed = OLD_SPEED): OldPar {
  const path = shortestPath(maze)!;
  const three = Math.ceil(((path.length - 1) / speed + swipesOnPath(maze, path) * 0.7 + 2) * 10);
  return { three, two: three * 2 + 30 };
}
export const oldStarsForTime = (tenths: number, par: OldPar) => starsFor(tenths, par.three, par.two, true);
/** The shortest way at full speed with no thinking: faster claims were refused. */
export const oldFastestTenths = (maze: Maze) => Math.floor((shortestPath(maze)!.length - 1) / OLD_SPEED * 10);
export const oldMazeOf = (level: number, seed: number) => level ? oldLevelMaze(level) : oldDailyMaze(seed);

/**
 * The old checks on `l`, `r`, `s` and `t`: the seed must be that level's old maze (or a real date), the time no faster
 * than the shortest way, and the stars anywhere between what normal and slow play would have earned.
 */
export function oldLinkOk(level: number, seed: number, tenths: number, stars: number, isDate: (seed: number) => boolean) {
  if (level > OLD_LEVEL_COUNT) return false;
  if (level ? oldLevelMaze(level).seed !== seed : !isDate(seed)) return false;
  const maze = oldMazeOf(level, seed);
  if (tenths < oldFastestTenths(maze)) return false;
  return stars >= oldStarsForTime(tenths, oldParFor(maze, OLD_SPEED)) && stars <= oldStarsForTime(tenths, oldParFor(maze, OLD_SLOW_SPEED));
}

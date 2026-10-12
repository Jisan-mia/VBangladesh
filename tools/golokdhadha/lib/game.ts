// The walk through a maze: where you are, the pencil line behind you, and how often you turned back. Pure.
import type { Maze } from "./maze";

/** `trail` runs from home to where you stand; stepping back onto the cell behind you rubs the line out, like a pencil on a magazine maze. */
export type Walk = { trail: number[]; seen: Uint8Array; steps: number; backtracks: number };

export function startWalk(maze: Maze): Walk {
  const seen = new Uint8Array(maze.open.length);
  seen[maze.start] = 1;
  return { trail: [maze.start], seen, steps: 0, backtracks: 0 };
}

export const here = (walk: Walk) => walk.trail[walk.trail.length - 1];

/** Moves one cell (the caller checks the wall). Changes `walk` in place, since it runs once per cell walked; returns it for tests. */
export function stepTo(walk: Walk, cell: number) {
  const { trail } = walk;
  if (trail.length >= 2 && trail[trail.length - 2] === cell) { trail.pop(); walk.backtracks++; }
  else trail.push(cell);
  walk.seen[cell] = 1;
  walk.steps++;
  return walk;
}

/** Never once turned back: the line goes straight from home to the shop. */
export const clean = (walk: Walk) => walk.backtracks === 0;

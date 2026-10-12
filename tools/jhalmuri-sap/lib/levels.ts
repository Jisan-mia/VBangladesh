// The ঠোঙা ladder: each level asks for a few more bites at a little more speed, and from level 3 on, tin walls stand on the board.
// Server-safe (link.ts reads LEVELS to check a shared level score). A test walks every level: walls connected, the start lane clear, a bot clears it.

export const COLS = 12;
export const ROWS = 16;

/** goal: bites to clear; ms: one move; walls: tin rectangles [x, y, width, height] in cells. */
export type Level = { goal: number; ms: number; walls: ReadonlyArray<readonly [number, number, number, number]> };

// The snake starts at (5, 11) heading up, so column 5 stays clear from row 7 down: four free moves before the first turn.
export const LEVELS: readonly Level[] = [
  { goal: 5, ms: 240, walls: [] },
  { goal: 9, ms: 225, walls: [] },
  { goal: 10, ms: 215, walls: [[2, 4, 3, 1], [7, 4, 3, 1]] },
  { goal: 10, ms: 205, walls: [[0, 8, 3, 1], [9, 8, 3, 1]] },
  { goal: 12, ms: 195, walls: [[3, 3, 6, 1], [2, 11, 1, 3], [9, 11, 1, 3]] },
  { goal: 12, ms: 185, walls: [[3, 5, 6, 1], [3, 9, 1, 4], [8, 9, 1, 4]] },
  { goal: 13, ms: 178, walls: [[2, 2, 1, 5], [9, 2, 1, 5], [4, 15, 4, 1]] },
  { goal: 14, ms: 170, walls: [[3, 4, 6, 1], [5, 1, 2, 3], [0, 10, 3, 1], [9, 10, 3, 1]] },
  { goal: 15, ms: 162, walls: [[1, 4, 4, 1], [7, 4, 4, 1], [1, 9, 3, 1], [8, 9, 3, 1]] },
  { goal: 16, ms: 154, walls: [[0, 6, 5, 1], [7, 6, 5, 1], [3, 11, 1, 4], [8, 11, 1, 4]] },
  { goal: 18, ms: 146, walls: [[6, 0, 1, 5], [0, 8, 4, 1], [8, 8, 4, 1], [7, 11, 1, 5]] },
  { goal: 20, ms: 138, walls: [[2, 3, 8, 1], [2, 4, 1, 3], [9, 4, 1, 3], [0, 9, 4, 1], [8, 9, 4, 1], [3, 13, 1, 3]] },
];
export const LEVEL_COUNT = LEVELS.length;

export const levelOf = (level: number) => LEVELS[Math.max(1, Math.min(LEVEL_COUNT, level)) - 1];

/** Every wall cell of a level (y * COLS + x). */
export function wallCells(level: number) {
  const cells: number[] = [];
  for (const [x, y, w, h] of levelOf(level).walls) for (let dy = 0; dy < h; dy++) for (let dx = 0; dx < w; dx++) cells.push((y + dy) * COLS + x + dx);
  return cells;
}

/** A golden chilli turns up after every 4th bite; the last bite ends the level, so these are the chillies a level can offer. */
export const chilliesIn = (level: number, every = 4) => Math.floor((levelOf(level).goal - 1) / every);

/** 3 stars for every golden chilli, 2 for at least half of them, 1 for clearing. */
export function levelStars(level: number, golden: number) {
  const offered = chilliesIn(level);
  return golden >= offered ? 3 : golden >= Math.ceil(offered / 2) ? 2 : 1;
}

/** ধীরে খেলো never moves faster than one cell in 240ms. */
export const levelInterval = (level: number, slow: boolean) => slow ? Math.max(240, levelOf(level).ms + 90) : levelOf(level).ms;

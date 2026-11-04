// Game rules: the 30 levels, how a seed cuts and shuffles the pieces, the tray, where a drop lands, and stars. Pure and server-safe (share.ts reaches it through link.ts).
import { makeRng, pick, starsFor as starsBetween } from "../../../shared/game-core";
import { infoOf, isFinale, presetOf } from "./levels";

export const LEVEL_COUNT = 30;
/** Ten paintings each at dawn, at sunset and under the moon. */
export const WORLDS = ["ভোর", "গোধূলি", "জোছনা"] as const;
export type World = 0 | 1 | 2;

export const isLevel = (level: number) => Number.isInteger(level) && level >= 1 && level <= LEVEL_COUNT;
export const worldOf = (level: number) => Math.min(2, Math.floor((level - 1) / 10)) as World;
/** A fixed seed per level, so a challenge link names exactly one painting and one cut. */
export const levelSeed = (level: number) => 71_000 + level * 37;

/** One new thing at a time: a bigger grid, or turned pieces on the grid you already know. */
export function planOf(level: number): { n: number; rotate: boolean } {
  if (level <= 4) return { n: 3, rotate: false };
  if (level <= 10) return { n: 4, rotate: false };
  if (level <= 13) return { n: 4, rotate: true };
  if (level <= 17) return { n: 5, rotate: false };
  if (level <= 20) return { n: 5, rotate: true };
  if (level <= 25) return { n: 6, rotate: false };
  return { n: 6, rotate: true };
}
export const pieceCount = (level: number) => planOf(level).n ** 2;
/** How strongly the finished painting shows through the empty board: a clear guide at dawn, a faint one by moonlight. */
export const ghostOf = (level: number) => infoOf(level).ghost;
/** The empty board under the pieces: warm card by day, deep blue at night so the moonlit ghost still shows. */
export const boardOf = (level: number) => (worldOf(level) === 2 ? { fill: "#202c44", line: "rgba(255,255,255,0.2)" } : { fill: "#efe3c8", line: "rgba(90,60,30,0.3)" });

/** Tabs between neighbours: 1 means the tab pokes down (h) or right (v) into the next cell, -1 the other way. */
export type Edges = { h: number[]; v: number[] };
export type Puzzle = { level: number; seed: number; n: number; rotate: boolean; edges: Edges; turns: number[]; order: number[] };

/** A cell's four sides, clockwise from the top: 0 flat (the frame), 1 a tab sticking out, -1 a blank cut in. */
export function sidesOf({ h, v }: Edges, n: number, cell: number): [number, number, number, number] {
  const row = Math.floor(cell / n), col = cell % n;
  return [
    row ? -h[(row - 1) * n + col] : 0,
    col < n - 1 ? v[row * (n - 1) + col] : 0,
    row < n - 1 ? h[row * n + col] : 0,
    col ? -v[row * (n - 1) + col - 1] : 0,
  ];
}

/** The cut, the starting turns and the tray order for a level. Same level and seed, same puzzle on every phone. Cheap (36 pieces at most), so no cache. */
export function makePuzzle(level: number, seed = levelSeed(level)): Puzzle {
  const { n, rotate } = planOf(level), rng = makeRng(seed), count = n * n;
  const flip = () => (rng() < 0.5 ? 1 : -1);
  const edges: Edges = { h: Array.from({ length: (n - 1) * n }, flip), v: Array.from({ length: n * (n - 1) }, flip) };
  // About one piece in five starts the right way up, so a turned level never feels like busywork.
  const turns = Array.from({ length: count }, () => (rotate && rng() > 0.2 ? 1 + pick(rng, 3) : 0));
  const order = Array.from({ length: count }, (_, index) => index);
  for (let index = count - 1; index > 0; index--) { const other = pick(rng, index + 1); [order[index], order[other]] = [order[other], order[index]]; }
  return { level, seed, n, rotate, edges, turns, order };
}

/**
 * What's on the table: which pieces are in, what the tray holds (piece ids, -1 for an empty slot), what waits behind it, and each piece's turns.
 * Turns only ever count up (a CSS rotation that keeps going clockwise); a piece is upright when turns % 4 is 0.
 */
export type Table = { placed: boolean[]; slots: number[]; queue: number[]; turns: number[] };

/** The pieces a level starts with already in: the four corners first, then the middle, then by tray order. */
export function presetIds(puzzle: Puzzle, count: number) {
  const n = puzzle.n, last = n * n - 1, wanted = [0, n - 1, last - n + 1, last, Math.floor(last / 2), ...puzzle.order];
  const ids: number[] = [];
  for (const id of wanted) if (ids.length < count && !ids.includes(id)) ids.push(id);
  return ids;
}

export function startTable(puzzle: Puzzle, slotCount: number, preset = presetOf(puzzle.level)): Table {
  const count = puzzle.n ** 2, already = presetIds(puzzle, Math.min(count - 1, Math.max(0, preset)));
  const waiting = puzzle.order.filter(id => !already.includes(id)), slots = waiting.slice(0, slotCount);
  while (slots.length < slotCount) slots.push(-1);
  const placed: boolean[] = Array(count).fill(false), turns = puzzle.turns.slice();
  for (const id of already) { placed[id] = true; turns[id] = 0; }
  return { placed, slots, queue: waiting.slice(slotCount), turns };
}

/** The tray resized (a phone turned sideways): the same pieces in the same order, refilled or trimmed to the new slot count. */
export function reslot(table: Table, slotCount: number): Table {
  const waiting = [...table.slots.filter(id => id >= 0), ...table.queue];
  const slots = waiting.slice(0, slotCount);
  while (slots.length < slotCount) slots.push(-1);
  return { ...table, slots, queue: waiting.slice(slotCount) };
}

/** A piece goes in; the next waiting piece takes its tray slot. */
export function placePiece(table: Table, id: number): Table {
  if (table.placed[id]) return table;
  const placed = table.placed.slice(), slots = table.slots.slice(), queue = table.queue.slice();
  placed[id] = true;
  const slot = slots.indexOf(id);
  if (slot >= 0) slots[slot] = queue.shift() ?? -1;
  else { const waiting = queue.indexOf(id); if (waiting >= 0) queue.splice(waiting, 1); }
  return { ...table, placed, slots, queue };
}

/** A quarter turn clockwise. */
export function turnPiece(table: Table, id: number): Table {
  const turns = table.turns.slice();
  turns[id] += 1;
  return { ...table, turns };
}

export const isDone = (table: Table) => table.placed.every(Boolean);
export const isUpright = (turns: number) => turns % 4 === 0;

/** How far from its home a piece may land and still snap in: more than half a cell, never under 24px (6×6 on a 320px phone). */
export const snapReach = (cell: number) => Math.max(0.55 * cell, 24);

export type Drop = "snap" | "turn" | "wrong" | "away";
/**
 * Where a piece dropped with its centre at board point (x, y) lands, on a board `size` wide.
 * "snap": home and upright. "turn": home but still turned. "wrong": somewhere else on the board. "away": off the board.
 */
export function judgeDrop(n: number, id: number, turns: number, x: number, y: number, size: number): Drop {
  const cell = size / n, margin = cell * 0.3;
  if (!(x >= -margin && y >= -margin && x <= size + margin && y <= size + margin)) return "away";
  const homeX = (id % n + 0.5) * cell, homeY = (Math.floor(id / n) + 0.5) * cell;
  if (Math.hypot(x - homeX, y - homeY) > snapReach(cell)) return "wrong";
  return isUpright(turns) ? "snap" : "turn";
}

/** The board cell under point (x, y), or -1 off the board. */
export function cellAt(n: number, x: number, y: number, size: number) {
  if (!(x >= 0 && y >= 0 && x < size && y < size)) return -1;
  return Math.floor(y / (size / n)) * n + Math.floor(x / (size / n));
}

/** The pieces the player places: all of them, less the ones a level starts with. */
export const toPlace = (level: number) => pieceCount(level) - presetOf(level);

/**
 * Seconds that still earn 3 stars: 2.5 a placed piece at dawn, 2.6 at sunset, 3.2 by moonlight (the look-alike sky), plus 1
 * when pieces come turned. A fainter picture on the board gives a little more time; a finale (none at all) a fifth more.
 * Tuned with the bots in tests/bot.ts.
 */
export function parFor(level: number) {
  const perPiece = [2.5, 2.6, 3.2][worldOf(level)] + (planOf(level).rotate ? 1 : 0);
  const fade = isFinale(level) ? 1.2 : 1 + Math.max(0, 0.3 - infoOf(level).ghost) * 0.7;
  return Math.round(toPlace(level) * perPiece * fade);
}

/** A piece on the frame: at least one flat side. */
export const isEdge = (n: number, id: number) => id < n || id >= n * (n - 1) || id % n === 0 || id % n === n - 1;
/** Every frame piece is in. */
export const frameDone = (table: Table, n: number) => table.placed.every((placed, id) => placed || !isEdge(n, id));

/** Whether piece `id`, turned `turns` quarter turns clockwise, has the same knobs and blanks as cell `cell`'s outline. */
export function fitsCut(edges: Edges, n: number, id: number, turns: number, cell: number) {
  const mine = sidesOf(edges, n, id), there = sidesOf(edges, n, cell), r = ((turns % 4) + 4) % 4;
  for (let side = 0; side < 4; side++) if (mine[side] !== there[(side + r) % 4]) return false;
  return true;
}

/** 3 stars within par, 2 within twice par, 1 for any finished painting. */
export const starsFor = (level: number, seconds: number) => starsBetween(seconds, parFor(level), parFor(level) * 2, true);

/** What stood between this time and one more star, or null at three. */
export function shortBy(level: number, seconds: number) {
  const earned = starsFor(level, seconds);
  if (earned === 3) return null;
  return { stars: earned + 1, seconds: seconds - parFor(level) * (earned === 1 ? 2 : 1) };
}

/** The furthest open level not yet three-starred, so nobody replays what they've mastered (the old start rule; lib/progress.ts recommends now). */
export function startLevel(stars: Record<number, number>, unlocked: number) {
  for (let level = unlocked; level >= 1; level--) if ((stars[level] ?? 0) < 3) return level;
  return unlocked;
}

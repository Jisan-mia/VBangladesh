// The grid: Bangla words split into letter clusters, placed from a seed, the rest filled with the pack's own letters.
// Pure and server-safe. Every random choice comes from makeRng(seed), so a link rebuilds the same grid on every phone.
import { makeRng, pick } from "../../../shared/game-core";
import { packById, type PackId } from "./packs";

export const SIZE = 7;
export const WORDS = 6;
export const CELLS = SIZE * SIZE;
/** Each hint adds this many seconds to the time. */
export const HINT_SECONDS = 10;

export type Level = 0 | 1;
export const LEVELS: readonly Level[] = [0, 1];
/** [row step, column step]. সহজ reads forwards only: left to right, top to bottom, and down the diagonal. কঠিন adds the reverse of each. */
const FORWARD: ReadonlyArray<readonly [number, number]> = [[0, 1], [1, 0], [1, 1], [-1, 1]];
const ALL: ReadonlyArray<readonly [number, number]> = [...FORWARD, ...FORWARD.map(([r, c]) => [-r, -c] as const)];
export const directions = (level: Level) => level ? ALL : FORWARD.slice(0, 3);

const HASANTA = "্";
const graphemes = new Intl.Segmenter("bn", { granularity: "grapheme" });

/** Old ICU (before Unicode 15.1) breaks a conjunct after its হসন্ত (ক্ | ষ); join those so every phone builds the same grid. */
export function joinConjuncts(parts: readonly string[]) {
  const out: string[] = [];
  for (const part of parts) {
    if (out.length && out[out.length - 1].endsWith(HASANTA)) out[out.length - 1] += part;
    else out.push(part);
  }
  return out;
}

/** One cell per letter cluster: "কৃষ্ণচূড়া" → কৃ, ষ্ণ, চূ, ড়া. NFC first, so a typed ড় and a stored ড় split the same way. */
export const clusters = (word: string) => joinConjuncts([...graphemes.segment(word.normalize("NFC"))].map(part => part.segment));

export type Placed = { word: string; letters: string[]; cells: number[] };
export type Puzzle = { seed: number; pack: PackId; level: Level; grid: string[]; words: Placed[] };

const rowOf = (cell: number) => Math.floor(cell / SIZE);
const colOf = (cell: number) => cell % SIZE;
const inside = (row: number, col: number) => row >= 0 && row < SIZE && col >= 0 && col < SIZE;

/** The cells of a straight run from (row, col), or null if it leaves the grid. */
function run(row: number, col: number, [dr, dc]: readonly [number, number], length: number) {
  const cells: number[] = [];
  for (let k = 0; k < length; k++) {
    const r = row + dr * k, c = col + dc * k;
    if (!inside(r, c)) return null;
    cells.push(r * SIZE + c);
  }
  return cells;
}

/** Every place a word reads, in any of the eight directions, as distinct sets of cells (a palindrome read both ways counts once). */
export function findAll(grid: readonly string[], letters: readonly string[]) {
  const seen = new Map<string, number[]>();
  for (let cell = 0; cell < CELLS; cell++) {
    if (grid[cell] !== letters[0]) continue;
    for (const dir of ALL) {
      const cells = run(rowOf(cell), colOf(cell), dir, letters.length);
      if (cells && cells.every((at, k) => grid[at] === letters[k])) seen.set([...cells].sort((a, b) => a - b).join(), cells);
    }
  }
  return [...seen.values()];
}

/** Does this word read through `cell` anywhere? Used while filling: any reading through a filler cell is an extra copy. */
function readsThrough(grid: readonly string[], letters: readonly string[], cell: number) {
  for (const [dr, dc] of ALL) {
    for (let k = 0; k < letters.length; k++) {
      const cells = run(rowOf(cell) - dr * k, colOf(cell) - dc * k, [dr, dc], letters.length);
      if (cells && cells.every((at, i) => grid[at] === letters[i])) return true;
    }
  }
  return false;
}

function shuffle<T>(items: T[], rng: () => number) {
  for (let i = items.length - 1; i > 0; i--) { const j = pick(rng, i + 1); [items[i], items[j]] = [items[j], items[i]]; }
  return items;
}

/** One attempt at a grid; null when a word has nowhere to go or the filler can't avoid a second copy. */
function attempt(rng: () => number, list: string[][], pool: string[], level: Level) {
  const grid = Array<string>(CELLS).fill("");
  const chosen = shuffle(list.map((_, index) => index), rng).slice(0, WORDS);
  const order = [...chosen].sort((a, b) => list[b].length - list[a].length);
  const placed = new Map<number, number[]>();
  for (const index of order) {
    const letters = list[index];
    const spots: number[][] = [];
    for (let cell = 0; cell < CELLS; cell++) {
      for (const dir of directions(level)) {
        const cells = run(rowOf(cell), colOf(cell), dir, letters.length);
        // Crossing on a shared letter is fine; at least one new cell, so no word ever lies wholly on another.
        if (cells && cells.every((at, k) => grid[at] === "" || grid[at] === letters[k]) && cells.some(at => grid[at] === "")) spots.push(cells);
      }
    }
    if (!spots.length) return null;
    const cells = spots[pick(rng, spots.length)];
    cells.forEach((at, k) => { grid[at] = letters[k]; });
    placed.set(index, cells);
  }
  const targets = chosen.map(index => list[index]);
  for (let cell = 0; cell < CELLS; cell++) {
    if (grid[cell]) continue;
    const start = pick(rng, pool.length);
    let ok = false;
    for (let k = 0; k < pool.length && !ok; k++) {
      grid[cell] = pool[(start + k) % pool.length];
      ok = !targets.some(letters => readsThrough(grid, letters, cell));
    }
    if (!ok) return null;
  }
  // Crossings can spell a target by accident too: each word must read exactly once, where it was put.
  if (!targets.every(letters => findAll(grid, letters).length === 1)) return null;
  return { grid, words: chosen.map(index => ({ letters: list[index], cells: placed.get(index)! })) };
}

/** The same seed, pack and level always give the same grid. Words are listed in the order they were picked. */
export function generate(seed: number, packId: PackId, level: Level): Puzzle {
  const pack = packById(packId);
  if (!pack) throw new Error(`unknown pack ${packId}`);
  const rng = makeRng(seed);
  const list = pack.words.map(clusters);
  // Filler comes from the pack's own letters, so the grid looks like Bangla, not random noise.
  const pool = list.flat();
  for (let tries = 0; tries < 400; tries++) {
    const made = attempt(rng, list, pool, level);
    if (made) return { seed, pack: packId, level, grid: made.grid, words: made.words.map(word => ({ ...word, word: word.letters.join("") })) };
  }
  throw new Error(`no grid for ${packId} #${seed}`);
}

/** The straight run from one cell to another (row, column or 45° diagonal), or null if they aren't in line. */
export function lineBetween(from: number, to: number) {
  const dr = rowOf(to) - rowOf(from), dc = colOf(to) - colOf(from);
  if (dr && dc && Math.abs(dr) !== Math.abs(dc)) return null;
  const length = Math.max(Math.abs(dr), Math.abs(dc)) + 1;
  return run(rowOf(from), colOf(from), [Math.sign(dr), Math.sign(dc)], length);
}

/**
 * A finger dragged (dx, dy) cell-widths from the centre of `from`: the nearest of the eight directions, as long as the drag,
 * cut at the grid's edge. A wobbly swipe still makes a straight line.
 */
export function dragLine(from: number, dx: number, dy: number) {
  const octant = Math.round(Math.atan2(dy, dx) / (Math.PI / 4));
  const dr = Math.round(Math.sin(octant * Math.PI / 4)), dc = Math.round(Math.cos(octant * Math.PI / 4));
  // How far along that direction the finger got, in cells (a diagonal step is one row and one column).
  const steps = Math.round((dx * dc + dy * dr) / (dc * dc + dr * dr));
  const cells = [from];
  for (let k = 1; k <= steps; k++) {
    const r = rowOf(from) + dr * k, c = colOf(from) + dc * k;
    if (!inside(r, c)) break;
    cells.push(r * SIZE + c);
  }
  return cells;
}

/** Which word these cells spell, read either way (a swipe from the last letter back to the first counts); -1 if none. */
export function wordAt(puzzle: Puzzle, cells: readonly number[]) {
  if (cells.length < 2) return -1;
  const key = cells.join(), back = [...cells].reverse().join();
  return puzzle.words.findIndex(word => { const own = word.cells.join(); return own === key || own === back; });
}

/** The word a hint shows next: the first one not found and not hinted yet, or -1. */
export function nextHint(puzzle: Puzzle, found: readonly number[], hinted: readonly number[]) {
  return puzzle.words.findIndex((_, index) => !found.includes(index) && !hinted.includes(index));
}

/** The word kept found on a first, teaching grid: the first one that reads left to right, so the demo is the easiest to see. */
export function demoWord(puzzle: Puzzle) {
  const flat = puzzle.words.findIndex(word => word.cells[1] - word.cells[0] === 1);
  return flat < 0 ? 0 : flat;
}

/** The time that counts: seconds on the clock plus the hint seconds. */
export const totalTime = (seconds: number, hints: number) => Math.round(seconds) + hints * HINT_SECONDS;

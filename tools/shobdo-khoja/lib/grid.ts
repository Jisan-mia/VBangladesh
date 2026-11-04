// The grid: Bangla words split into letter clusters, placed from a seed, the rest filled with the pack's own letters.
// Pure and server-safe. Every random choice comes from makeRng(seed), so a link rebuilds the same grid on every phone.
// The classic 7×7 grids (free play and every link from before the ladder) are build() with CLASSIC[level]; it draws
// from the generator in exactly the old order, and tests pin checksums so old links keep opening the same grid.
import { makeRng, pick } from "../../../shared/game-core";
import { packById, type PackId } from "./packs";

/** The classic grid: 7×7, six words. */
export const SIZE = 7;
export const WORDS = 6;
export const CELLS = SIZE * SIZE;
/** Each hint adds this many seconds to the time. */
export const HINT_SECONDS = 10;

/** Free play's two difficulties: 0 সহজ, 1 কঠিন. */
export type Level = 0 | 1;
export const LEVELS: readonly Level[] = [0, 1];

/** [row step, column step]. The first four read forwards; the last four are their reverses. */
export const DIRS = {
  R: [0, 1], D: [1, 0], DR: [1, 1], UR: [-1, 1],
  L: [0, -1], U: [-1, 0], UL: [-1, -1], DL: [1, -1],
} as const satisfies Record<string, readonly [number, number]>;
export type Dir = keyof typeof DIRS;
/** The old order of the eight directions: the forward four, then each reversed. Placement walks them in this order. */
export const ALL_DIRS: readonly Dir[] = ["R", "D", "DR", "UR", "L", "U", "UL", "DL"];
export const BACKWARDS: ReadonlySet<Dir> = new Set<Dir>(["L", "U", "UL", "DL"]);
const ALL = ALL_DIRS.map(dir => DIRS[dir]);
/** সহজ reads left to right, top to bottom, and down the diagonal. কঠিন adds the up diagonal and the reverse of each. */
export const directions = (level: Level) => level ? ALL : ALL.slice(0, 3);

/** What a grid is made of. Ladder levels set the optional parts; the classic grids use none of them. */
export type Spec = {
  size: number;
  words: number;
  dirs: readonly Dir[];
  /** False starts: a word's letters but its last, in a line somewhere else. */
  traps?: number;
  /** The list shows only each word's first letter and its cell count. */
  clue?: boolean;
  /** At least this many of the words pass `test` (a level about conjuncts, reph, repeated letters). */
  must?: { test: (letters: readonly string[]) => boolean; count: number };
  /** At least this many words run backwards. */
  backwards?: number;
  /** At least this many cells are shared by two words. */
  cross?: number;
};
export const CLASSIC: Readonly<Record<Level, Spec>> = {
  0: { size: SIZE, words: WORDS, dirs: ["R", "D", "DR"] },
  1: { size: SIZE, words: WORDS, dirs: ALL_DIRS },
};

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
/** `level` is the free-play difficulty the grid reads like (1 when any direction runs backwards). */
export type Puzzle = { seed: number; pack: PackId; level: Level; size: number; grid: string[]; words: Placed[]; traps: number[][]; clue: boolean };

/** The side of a square grid. */
export const sideOf = (grid: readonly unknown[]) => Math.round(Math.sqrt(grid.length));

/** The cells of a straight run from (row, col), or null if it leaves the grid. */
function run(size: number, row: number, col: number, [dr, dc]: readonly [number, number], length: number) {
  const cells: number[] = [];
  for (let k = 0; k < length; k++) {
    const r = row + dr * k, c = col + dc * k;
    if (r < 0 || r >= size || c < 0 || c >= size) return null;
    cells.push(r * size + c);
  }
  return cells;
}

/** Every place a word reads, in any of the eight directions, as distinct sets of cells (a palindrome read both ways counts once). */
export function findAll(grid: readonly string[], letters: readonly string[]) {
  const size = sideOf(grid), seen = new Map<string, number[]>();
  for (let cell = 0; cell < grid.length; cell++) {
    if (grid[cell] !== letters[0]) continue;
    for (const dir of ALL) {
      const cells = run(size, Math.floor(cell / size), cell % size, dir, letters.length);
      if (cells && cells.every((at, k) => grid[at] === letters[k])) seen.set([...cells].sort((a, b) => a - b).join(), cells);
    }
  }
  return [...seen.values()];
}

/** Does this word read through `cell` anywhere? Used while filling: any reading through a filler cell is an extra copy. */
function readsThrough(size: number, grid: readonly string[], letters: readonly string[], cell: number) {
  for (const [dr, dc] of ALL) {
    for (let k = 0; k < letters.length; k++) {
      const cells = run(size, Math.floor(cell / size) - dr * k, cell % size - dc * k, [dr, dc], letters.length);
      if (cells && cells.every((at, i) => grid[at] === letters[i])) return true;
    }
  }
  return false;
}

function shuffle<T>(items: T[], rng: () => number) {
  for (let i = items.length - 1; i > 0; i--) { const j = pick(rng, i + 1); [items[i], items[j]] = [items[j], items[i]]; }
  return items;
}

/** "আ" + one dot per further cell: what a clue list shows for a word. */
export const clueOf = (letters: readonly string[]) => letters[0] + "·".repeat(letters.length - 1);

/** One attempt at a grid; null when a word has nowhere to go or the filler can't avoid a second copy. */
function attempt(rng: () => number, list: string[][], pool: string[], spec: Spec) {
  const { size } = spec, cells = size * size;
  const grid = Array<string>(cells).fill("");
  const shuffled = shuffle(list.map((_, index) => index), rng);
  let chosen = shuffled.slice(0, spec.words);
  if (spec.must) {
    const test = spec.must.test, wanted = shuffled.filter(index => test(list[index])).slice(0, spec.must.count);
    chosen = [...wanted, ...shuffled.filter(index => !wanted.includes(index))].slice(0, spec.words);
  }
  const order = [...chosen].sort((a, b) => list[b].length - list[a].length);
  const dirs = spec.dirs.map(dir => DIRS[dir]);
  const back = spec.dirs.filter(dir => BACKWARDS.has(dir)).map(dir => DIRS[dir]);
  const placed = new Map<number, number[]>();
  let backwardsLeft = spec.backwards ?? 0, crossLeft = spec.cross ?? 0;
  for (const index of order) {
    const letters = list[index];
    const spots: number[][] = [], crossing: number[][] = [];
    for (let cell = 0; cell < cells; cell++) {
      for (const dir of backwardsLeft > 0 ? back : dirs) {
        const at = run(size, Math.floor(cell / size), cell % size, dir, letters.length);
        // Crossing on a shared letter is fine; at least one new cell, so no word ever lies wholly on another.
        if (!at || !at.every((spot, k) => grid[spot] === "" || grid[spot] === letters[k]) || !at.some(spot => grid[spot] === "")) continue;
        spots.push(at);
        if (crossLeft > 0 && at.some(spot => grid[spot] !== "")) crossing.push(at);
      }
    }
    if (!spots.length) return null;
    const from = crossing.length ? crossing : spots;
    const at = from[pick(rng, from.length)];
    if (crossing.length) crossLeft -= at.filter(spot => grid[spot] !== "").length;
    if (backwardsLeft > 0) backwardsLeft--;
    at.forEach((spot, k) => { grid[spot] = letters[k]; });
    placed.set(index, at);
  }
  if (crossLeft > 0) return null;
  const traps: number[][] = [];
  for (let t = 0; t < (spec.traps ?? 0); t++) {
    const long = chosen.filter(index => list[index].length >= 3);
    if (!long.length) return null;
    const letters = list[long[pick(rng, long.length)]].slice(0, -1), spots: number[][] = [];
    for (let cell = 0; cell < cells; cell++) for (const dir of dirs) {
      const at = run(size, Math.floor(cell / size), cell % size, dir, letters.length);
      if (at && at.every(spot => grid[spot] === "")) spots.push(at);
    }
    if (!spots.length) return null;
    const at = spots[pick(rng, spots.length)];
    at.forEach((spot, k) => { grid[spot] = letters[k]; });
    traps.push(at);
  }
  const targets = chosen.map(index => list[index]);
  for (let cell = 0; cell < cells; cell++) {
    if (grid[cell]) continue;
    const start = pick(rng, pool.length);
    let ok = false;
    for (let k = 0; k < pool.length && !ok; k++) {
      grid[cell] = pool[(start + k) % pool.length];
      ok = !targets.some(letters => readsThrough(size, grid, letters, cell));
    }
    if (!ok) return null;
  }
  // Crossings can spell a target by accident too: each word must read exactly once, where it was put.
  if (!targets.every(letters => findAll(grid, letters).length === 1)) return null;
  // A clue list must never point at a pack word that isn't on it: none with a listed word's first letter and length may read.
  if (spec.clue) {
    const clues = new Set(targets.map(clueOf));
    if (list.some((letters, index) => !chosen.includes(index) && clues.has(clueOf(letters)) && findAll(grid, letters).length)) return null;
  }
  return { grid, traps, words: chosen.map(index => ({ letters: list[index], cells: placed.get(index)! })) };
}

/** The same seed, pack and spec always give the same grid. Words are listed in the order they were picked. */
export function build(seed: number, packId: PackId, spec: Spec): Puzzle {
  const pack = packById(packId);
  if (!pack) throw new Error(`unknown pack ${packId}`);
  const rng = makeRng(seed);
  const all = pack.words.map(clusters);
  const list = all.every(letters => letters.length <= spec.size) ? all : all.filter(letters => letters.length <= spec.size);
  // Filler comes from the pack's own letters, so the grid looks like Bangla, not random noise.
  const pool = list.flat();
  const level: Level = spec.dirs.some(dir => BACKWARDS.has(dir) || dir === "UR") ? 1 : 0;
  for (let tries = 0; tries < 600; tries++) {
    const made = attempt(rng, list, pool, spec);
    if (made) return { seed, pack: packId, level, size: spec.size, grid: made.grid, traps: made.traps, clue: Boolean(spec.clue), words: made.words.map(word => ({ ...word, word: word.letters.join("") })) };
  }
  throw new Error(`no grid for ${packId} #${seed}`);
}

/** A classic 7×7 grid: free play, and every link from before the ladder. */
export const generate = (seed: number, packId: PackId, level: Level): Puzzle => build(seed, packId, CLASSIC[level]);

/** The straight run from one cell to another (row, column or 45° diagonal), or null if they aren't in line. */
export function lineBetween(from: number, to: number, size = SIZE) {
  const dr = Math.floor(to / size) - Math.floor(from / size), dc = to % size - from % size;
  if (dr && dc && Math.abs(dr) !== Math.abs(dc)) return null;
  const length = Math.max(Math.abs(dr), Math.abs(dc)) + 1;
  return run(size, Math.floor(from / size), from % size, [Math.sign(dr), Math.sign(dc)], length);
}

/**
 * A finger dragged (dx, dy) cell-widths from the centre of `from`: the nearest of the eight directions, as long as the drag,
 * cut at the grid's edge. A wobbly swipe still makes a straight line.
 */
export function dragLine(from: number, dx: number, dy: number, size = SIZE) {
  const octant = Math.round(Math.atan2(dy, dx) / (Math.PI / 4));
  const dr = Math.round(Math.sin(octant * Math.PI / 4)), dc = Math.round(Math.cos(octant * Math.PI / 4));
  // How far along that direction the finger got, in cells (a diagonal step is one row and one column).
  const steps = Math.round((dx * dc + dy * dr) / (dc * dc + dr * dr));
  const cells = [from];
  for (let k = 1; k <= steps; k++) {
    const r = Math.floor(from / size) + dr * k, c = from % size + dc * k;
    if (r < 0 || r >= size || c < 0 || c >= size) break;
    cells.push(r * size + c);
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

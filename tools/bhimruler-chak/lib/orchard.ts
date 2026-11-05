// The orchard after the rewrite: hidden nests, what each cleared bush says, the flood, the logic solver (with the reason for
// every step, for the hint and the bots) and the no-guess generator. Pure and server-safe: makeRng only, no DOM, no clock.
//
// A cleared bush is one of three kinds:
// - PLAIN: its number counts the nests in the 8 bushes around it;
// - MANGO (world 2 on): a fallen mango hides its number, so it says nothing (it is never a nest);
// - POST (world 3 on): a bamboo post, whose number counts only the 4 bushes above, below, left and right.
// Each kind "watches" a set of neighbours (8, nothing, or 4), and everything below works on those sets.
import { makeRng } from "../../../shared/game-core";

export const PLAIN = 0, MANGO = 1, POST = 2;
export type Kind = typeof PLAIN | typeof MANGO | typeof POST;

export type Orchard = {
  cols: number; rows: number; nests: number;
  /** The bush the gardener's path enters by: it and its 8 neighbours are never nests, and the start opens from it. */
  start: number;
  nest: Uint8Array;
  kind: Uint8Array;
  /** The number a cleared bush shows (its watched nests); 0 for a mango. */
  count: Uint8Array;
};

export type Shape = { cols: number; rows: number; nests: number; mangoes?: number; posts?: number };

type Near = { eight: number[][]; four: number[][] };
const tables = new Map<number, Near>();
const NONE: readonly number[] = [];

/** The 8 and the 4 neighbours of every bush, cached per grid size. */
export function near(cols: number, rows: number): Near {
  const key = cols * 64 + rows;
  let found = tables.get(key);
  if (!found) {
    const eight: number[][] = [], four: number[][] = [];
    for (let cell = 0; cell < cols * rows; cell++) {
      const r = Math.floor(cell / cols), c = cell % cols, e: number[] = [], f: number[] = [];
      for (let dr = -1; dr <= 1; dr++) for (let dc = -1; dc <= 1; dc++) {
        const rr = r + dr, cc = c + dc;
        if ((dr || dc) && rr >= 0 && rr < rows && cc >= 0 && cc < cols) { e.push(rr * cols + cc); if (!dr || !dc) f.push(rr * cols + cc); }
      }
      eight.push(e); four.push(f);
    }
    found = { eight, four };
    tables.set(key, found);
  }
  return found;
}

/** The bushes a cleared bush's number is about. */
export function watched(o: Orchard, cell: number): readonly number[] {
  const kind = o.kind[cell];
  if (kind === MANGO) return NONE;
  const n = near(o.cols, o.rows);
  return kind === POST ? n.four[cell] : n.eight[cell];
}

/** Opens `cell` and, through every number 0, all it watches. Returns the newly opened bushes with their ring (for the ripple). */
export function flood(o: Orchard, open: Uint8Array, cell: number): Array<[cell: number, ring: number]> {
  if (cell < 0 || cell >= open.length || open[cell] || o.nest[cell]) return [];
  const out: Array<[number, number]> = [[cell, 0]];
  open[cell] = 1;
  for (let index = 0; index < out.length; index++) {
    const [at, ring] = out[index];
    if (o.count[at] || o.kind[at] === MANGO) continue;
    for (const other of watched(o, at)) if (!open[other] && !o.nest[other]) { open[other] = 1; out.push([other, ring + 1]); }
  }
  return out;
}

// ---- the solver ----

const UNKNOWN = 0, SAFE = 1, NEST = 2;
/** How a step was proven: one number on its own, two numbers compared, or the count of nests left. */
export type Via = "single" | "pair" | "total";
export type Step = { safe: boolean; cells: number[]; via: Via; clues: number[] };
type Need = { clue: number; cells: number[]; need: number };

/** What every open number still needs: its unknown bushes and how many nests among them. Proves singles on the way. */
function needsOf(o: Orchard, known: Uint8Array): Step | Need[] {
  const out: Need[] = [];
  for (let cell = 0; cell < known.length; cell++) {
    if (known[cell] !== SAFE || o.kind[cell] === MANGO) continue;
    const unknown: number[] = [];
    let found = 0;
    for (const other of watched(o, cell)) { if (known[other] === NEST) found++; else if (known[other] === UNKNOWN) unknown.push(other); }
    if (!unknown.length) continue;
    const need = o.count[cell] - found;
    if (need === 0) return { safe: true, cells: unknown, via: "single", clues: [cell] };
    if (need === unknown.length) return { safe: false, cells: unknown, via: "single", clues: [cell] };
    out.push({ clue: cell, cells: unknown, need });
  }
  return out;
}

/**
 * The next thing logic proves from `known` (SAFE for cleared bushes, NEST for proven nests), with its reason. A number whose
 * nests are all found frees the rest; one with as many unknown bushes as nests marks them all; two overlapping numbers are
 * compared; the count of nests left settles the end. Null when nothing more can be proven.
 */
export function deduce(o: Orchard, known: Uint8Array): Step | null {
  const needs = needsOf(o, known);
  if (!Array.isArray(needs)) return needs;
  for (let a = 0; a < needs.length; a++) {
    const A = needs[a];
    for (let b = 0; b < needs.length; b++) {
      if (a === b) continue;
      const B = needs[b];
      let shared = 0;
      for (const cell of A.cells) if (B.cells.includes(cell)) shared++;
      if (!shared) continue;
      const onlyB = B.cells.filter(cell => !A.cells.includes(cell));
      if (!onlyB.length) continue;
      const most = Math.min(shared, A.need), least = Math.max(0, A.need - (A.cells.length - shared));
      if (B.need - least <= 0) return { safe: true, cells: onlyB, via: "pair", clues: [A.clue, B.clue] };
      if (B.need - most === onlyB.length) return { safe: false, cells: onlyB, via: "pair", clues: [A.clue, B.clue] };
    }
  }
  let found = 0;
  const unknown: number[] = [];
  for (let cell = 0; cell < known.length; cell++) { if (known[cell] === NEST) found++; else if (known[cell] === UNKNOWN) unknown.push(cell); }
  if (!unknown.length) return null;
  if (found === o.nests) return { safe: true, cells: unknown, via: "total", clues: [] };
  if (o.nests - found === unknown.length) return { safe: false, cells: unknown, via: "total", clues: [] };
  return null;
}

/** Knowledge from what is open: cleared bushes are SAFE, nothing else is trusted (not even your গামছা). */
export function knownFrom(open: Uint8Array) {
  const known = new Uint8Array(open.length);
  for (let cell = 0; cell < open.length; cell++) if (open[cell]) known[cell] = SAFE;
  return known;
}

/** Applies a step: proven nests are marked, proven safe bushes are opened (with their floods) in `open` and `known`. */
export function apply(o: Orchard, known: Uint8Array, open: Uint8Array, step: Step) {
  for (const cell of step.cells) {
    if (!step.safe) { known[cell] = NEST; continue; }
    for (const [at] of flood(o, open, cell)) known[at] = SAFE;
    known[cell] = SAFE;
  }
}

/** Plays the orchard by logic alone from `open`. Whether every safe bush gets cleared, and the steps it took. */
export function solve(o: Orchard, start: Uint8Array) {
  const open = start.slice(), known = knownFrom(open);
  let steps = 0, pairs = 0;
  for (let step = deduce(o, known); step; step = deduce(o, known)) {
    apply(o, known, open, step);
    steps++;
    if (step.via !== "single") pairs++;
  }
  let left = 0;
  for (let cell = 0; cell < open.length; cell++) if (!open[cell] && !o.nest[cell]) left++;
  return { cleared: left === 0, steps, pairs };
}

/**
 * The hint: the first safe bush logic proves from what is open now, the numbers that prove it, and the nests it relied on
 * (proven on the way). -1 when nothing can be proven (never on a fair orchard before it is cleared).
 */
export function proveSafe(o: Orchard, open: Uint8Array): { cell: number; via: Via; clues: number[]; nests: number[] } {
  const scratch = open.slice(), known = knownFrom(scratch), nests: number[] = [];
  for (let step = deduce(o, known); step; step = deduce(o, known)) {
    if (step.safe) {
      const cell = step.cells.find(at => !open[at]) ?? -1;
      if (cell >= 0) return { cell, via: step.via, clues: step.clues, nests: nests.filter(at => step.clues.some(clue => watched(o, clue).includes(at))) };
    } else nests.push(...step.cells);
    apply(o, known, scratch, step);
  }
  return { cell: -1, via: "single", clues: [], nests: [] };
}

// ---- laying an orchard ----

/** Where the gardener's path comes in: a bush near the bottom middle, so the start opens upward into the orchard. */
export function entry(cols: number, rows: number, rng: () => number) {
  const row = rows - 2 - Math.floor(rng() * Math.min(2, rows - 3));
  const col = 1 + Math.floor(rng() * (cols - 2));
  return row * cols + col;
}

/** One random draw: nests away from the entry, then mangoes and posts on safe bushes beside a nest (never on a 0). */
export function lay(shape: Shape, start: number, rng: () => number): Orchard {
  const { cols, rows, nests } = shape, size = cols * rows, n = near(cols, rows);
  const clear = new Set([start, ...n.eight[start]]), spots: number[] = [];
  for (let cell = 0; cell < size; cell++) if (!clear.has(cell)) spots.push(cell);
  const nest = new Uint8Array(size);
  for (let placed = 0; placed < nests; placed++) {
    const at = placed + Math.floor(rng() * (spots.length - placed));
    [spots[placed], spots[at]] = [spots[at], spots[placed]];
    nest[spots[placed]] = 1;
  }
  const eight = new Uint8Array(size), four = new Uint8Array(size);
  for (let cell = 0; cell < size; cell++) {
    for (const other of n.eight[cell]) eight[cell] += nest[other];
    for (const other of n.four[cell]) four[cell] += nest[other];
  }
  const kind = new Uint8Array(size);
  const place = (want: number, as: Kind, fits: (cell: number) => boolean) => {
    const pool: number[] = [];
    for (let cell = 0; cell < size; cell++) if (!nest[cell] && !kind[cell] && cell !== start && eight[cell] > 0 && fits(cell)) pool.push(cell);
    for (let k = 0; k < want && pool.length; k++) kind[pool.splice(Math.floor(rng() * pool.length), 1)[0]] = as;
  };
  // A post only matters where its 4-count differs from what an ordinary number would say.
  place(shape.posts ?? 0, POST, cell => four[cell] < eight[cell]);
  place(shape.mangoes ?? 0, MANGO, () => true);
  const count = new Uint8Array(size);
  for (let cell = 0; cell < size; cell++) count[cell] = kind[cell] === POST ? four[cell] : kind[cell] === MANGO ? 0 : eight[cell];
  return { cols, rows, nests, start, nest, kind, count };
}

export const kinds = (o: Orchard, kind: Kind) => o.kind.reduce((sum, k, cell) => sum + (k === kind && !o.nest[cell] ? 1 : 0), 0);

/** Tries before giving up on a fully logical orchard; the tests show every level finds one in far fewer. */
export const MAX_TRIES = 4000;

export type Laid = { orchard: Orchard; tries: number; fair: boolean };

/**
 * The orchard for a shape and a seed: same two in, same orchard out, on every phone and on the server. Re-lays until logic
 * alone clears it from the entry, every mango and post asked for was placed, and (`see`) one of them shows in the first opening.
 * `teach` also asks for level 1's lesson.
 */
export function generate(shape: Shape, seed: number, { see = false, teach = false } = {}): Laid {
  const rng = makeRng(seed >>> 0 || 1), size = shape.cols * shape.rows;
  const start = entry(shape.cols, shape.rows, rng);
  let orchard = lay(shape, start, rng);
  for (let tries = 1; tries <= MAX_TRIES; tries++) {
    const open = new Uint8Array(size);
    flood(orchard, open, start);
    if (fits(orchard, open, shape, see, teach) && solve(orchard, open).cleared) return { orchard, tries, fair: true };
    orchard = lay(shape, start, rng);
  }
  // Never seen in testing. The hint then clears any safe bush, so nobody is left guessing.
  return { orchard, tries: MAX_TRIES, fair: false };
}

function fits(o: Orchard, open: Uint8Array, shape: Shape, see: boolean, teach: boolean) {
  if (kinds(o, MANGO) !== (shape.mangoes ?? 0) || kinds(o, POST) !== (shape.posts ?? 0)) return false;
  let opened = 0, shown = 0;
  for (let cell = 0; cell < open.length; cell++) if (open[cell]) { opened++; if (o.kind[cell] !== PLAIN) shown++; }
  if (opened < Math.min(8, Math.floor(open.length / 4))) return false;
  // The entry must leave real work: a few safe bushes for level 1's lesson, about a third of them everywhere else.
  const left = open.length - o.nests - opened;
  if (teach ? left < 2 || left > 4 : left < Math.max(3, Math.floor((open.length - o.nests) * 0.3))) return false;
  if (see && !shown) return false;
  return !teach || lesson(o, open) !== null;
}

/** Level 1's lesson: a 1 with exactly one covered bush (that's a nest), and a 1 beside that nest whose other covered bushes are safe. */
export function lesson(o: Orchard, open: Uint8Array) {
  for (let clue = 0; clue < open.length; clue++) {
    if (!open[clue] || o.kind[clue] !== PLAIN || o.count[clue] !== 1) continue;
    const covered = watched(o, clue).filter(cell => !open[cell]);
    if (covered.length !== 1) continue;
    const nest = covered[0];
    for (const helper of near(o.cols, o.rows).eight[nest]) {
      if (!open[helper] || o.kind[helper] !== PLAIN || o.count[helper] !== 1 || helper === clue) continue;
      const safe = watched(o, helper).filter(cell => !open[cell] && cell !== nest);
      if (safe.length) return { clue, nest, helper, safe };
    }
  }
  return null;
}
export type Lesson = NonNullable<ReturnType<typeof lesson>>;

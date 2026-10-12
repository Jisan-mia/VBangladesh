// The orchard grid: hidden nests, neighbour counts, the no-guess generator and the logic solver behind it. Pure, server-safe.
import { makeRng } from "../../../shared/game-core";

export type Board = { cols: number; rows: number; nest: Uint8Array; count: Uint8Array; nests: number };

const around = new Map<string, number[][]>();
/** The up-to-8 neighbours of every cell, cached per grid size. */
export function neighbours(cols: number, rows: number) {
  const key = `${cols}x${rows}`;
  let list = around.get(key);
  if (!list) {
    list = [];
    for (let cell = 0; cell < cols * rows; cell++) {
      const r = Math.floor(cell / cols), c = cell % cols, near: number[] = [];
      for (let dr = -1; dr <= 1; dr++) for (let dc = -1; dc <= 1; dc++) {
        const rr = r + dr, cc = c + dc;
        if ((dr || dc) && rr >= 0 && rr < rows && cc >= 0 && cc < cols) near.push(rr * cols + cc);
      }
      list.push(near);
    }
    around.set(key, list);
  }
  return list;
}

/** Puts `nests` nests anywhere except the first cell and its neighbours, so the first tap opens an area. */
export function layNests(cols: number, rows: number, nests: number, first: number, rng: () => number): Board {
  const size = cols * rows, near = neighbours(cols, rows), keepClear = new Set([first, ...near[first]]);
  const spots: number[] = [];
  for (let cell = 0; cell < size; cell++) if (!keepClear.has(cell)) spots.push(cell);
  const nest = new Uint8Array(size);
  for (let placed = 0; placed < nests; placed++) {
    const at = placed + Math.floor(rng() * (spots.length - placed));
    [spots[placed], spots[at]] = [spots[at], spots[placed]];
    nest[spots[placed]] = 1;
  }
  const count = new Uint8Array(size);
  for (let cell = 0; cell < size; cell++) for (const other of near[cell]) count[cell] += nest[other];
  return { cols, rows, nest, count, nests };
}

/** Opens `cell` and, through every 0, the whole area around it. Returns the newly opened cells with their ring (for the ripple). */
export function flood(board: Board, open: Uint8Array, cell: number): Array<[cell: number, ring: number]> {
  if (open[cell] || board.nest[cell]) return [];
  const near = neighbours(board.cols, board.rows), out: Array<[number, number]> = [[cell, 0]];
  open[cell] = 1;
  for (let index = 0; index < out.length; index++) {
    const [at, ring] = out[index];
    if (board.count[at]) continue;
    for (const other of near[at]) if (!open[other] && !board.nest[other]) { open[other] = 1; out.push([other, ring + 1]); }
  }
  return out;
}

const UNKNOWN = 0, SAFE = 1, NEST = 2;

/**
 * Plays the board by logic alone from what is already open: a number whose nests are all found frees the rest, a number
 * with only as many covered cells as nests marks them all, overlapping numbers are compared pair by pair, and the nest
 * total settles the end. Returns whether every safe cell got opened, and the first safe cell it proved that `open` hadn't.
 */
export function solve(board: Board, start: Uint8Array, stopAtFirstSafe = false) {
  const size = board.cols * board.rows, near = neighbours(board.cols, board.rows);
  const known = new Uint8Array(size), open = start.slice();
  let firstSafe = -1, safeLeft = size - board.nests, nestsFound = 0;
  for (let cell = 0; cell < size; cell++) if (open[cell]) { known[cell] = SAFE; safeLeft--; }

  const proveSafe = (cell: number) => {
    if (firstSafe < 0) firstSafe = cell;
    for (const [at] of flood(board, open, cell)) if (known[at] !== SAFE) { known[at] = SAFE; safeLeft--; }
  };
  const proveNest = (cell: number) => { known[cell] = NEST; nestsFound++; };

  for (;;) {
    if (safeLeft === 0 || (stopAtFirstSafe && firstSafe >= 0)) break;
    let progress = false;
    // Each open number on its own, and the list of what each one still needs.
    const needs: Array<{ cells: number[]; need: number }> = [];
    for (let cell = 0; cell < size; cell++) {
      if (known[cell] !== SAFE || !board.count[cell]) continue;
      const unknown: number[] = [];
      let found = 0;
      for (const other of near[cell]) { if (known[other] === NEST) found++; else if (known[other] === UNKNOWN) unknown.push(other); }
      if (!unknown.length) continue;
      const need = board.count[cell] - found;
      if (need === 0) { unknown.forEach(proveSafe); progress = true; }
      else if (need === unknown.length) { unknown.forEach(proveNest); progress = true; }
      else needs.push({ cells: unknown, need });
      if (progress && stopAtFirstSafe && firstSafe >= 0) break;
    }
    if (progress) continue;

    // Two numbers that share covered cells: what one forces on the shared cells limits the other.
    const touching = new Map<number, number[]>();
    needs.forEach((item, index) => item.cells.forEach(cell => { const list = touching.get(cell); if (list) list.push(index); else touching.set(cell, [index]); }));
    search: for (let a = 0; a < needs.length; a++) {
      const A = needs[a], partners = new Set<number>();
      for (const cell of A.cells) for (const b of touching.get(cell)!) if (b !== a) partners.add(b);
      for (const b of partners) {
        const B = needs[b], shared = A.cells.filter(cell => B.cells.includes(cell));
        const onlyB = B.cells.filter(cell => !shared.includes(cell));
        if (!onlyB.length) continue;
        const most = Math.min(shared.length, A.need), least = Math.max(0, A.need - (A.cells.length - shared.length));
        if (B.need - least <= 0) { onlyB.forEach(proveSafe); progress = true; break search; }
        if (B.need - most === onlyB.length) { onlyB.forEach(proveNest); progress = true; break search; }
      }
    }
    if (progress) continue;

    // The total: when the nests left equal the covered cells left (or none are left), the rest is settled.
    const left = board.nests - nestsFound, unknown: number[] = [];
    for (let cell = 0; cell < size; cell++) if (known[cell] === UNKNOWN) unknown.push(cell);
    if (unknown.length && left === 0) { unknown.forEach(proveSafe); continue; }
    if (unknown.length && left === unknown.length) { unknown.forEach(proveNest); continue; }
    break;
  }
  return { cleared: safeLeft === 0, firstSafe };
}

/** Level 1's lesson: a 1 with exactly one covered neighbour (that's a nest), and a 1 beside that nest whose other covered cells are therefore safe. */
export function lesson(board: Board, open: Uint8Array) {
  const near = neighbours(board.cols, board.rows), size = board.cols * board.rows;
  for (let clue = 0; clue < size; clue++) {
    if (!open[clue] || board.count[clue] !== 1) continue;
    const covered = near[clue].filter(cell => !open[cell]);
    if (covered.length !== 1) continue;
    const nest = covered[0];
    for (const helper of near[nest]) {
      if (!open[helper] || board.count[helper] !== 1) continue;
      const safe = near[helper].filter(cell => !open[cell] && cell !== nest);
      if (safe.length) return { clue, nest, helper, safe };
    }
  }
  return null;
}

/** Tries before giving up on a fully logical board; the tests show every level finds one in far fewer. */
export const MAX_TRIES = 3000;

/**
 * The board for a level, a seed and the first cell tapped: same three in, same board out, on every phone and on the server.
 * Re-lays the nests until logic alone clears it from the first opening (and, with `teach`, until level 1's lesson exists).
 */
export function generate(cols: number, rows: number, nests: number, seed: number, first: number, teach = false) {
  const rng = makeRng((seed ^ Math.imul(first + 1, 0x9e3779b1)) >>> 0);
  let board = layNests(cols, rows, nests, first, rng);
  for (let tries = 1; tries <= MAX_TRIES; tries++) {
    const open = new Uint8Array(cols * rows);
    flood(board, open, first);
    if (solve(board, open).cleared && (!teach || lesson(board, open))) return { board, tries, fair: true };
    board = layNests(cols, rows, nests, first, rng);
  }
  // Never seen in testing. The hint then opens any safe bush, so the player is never left guessing.
  return { board, tries: MAX_TRIES, fair: false };
}

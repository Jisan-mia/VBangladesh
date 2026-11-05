// The switchboard's wiring and its solver. Pure and server-safe: share.ts replays links with it.
//
// A board is n×n bulbs, each with its own round switch under it, wired to its bulb and the four beside it (সোজা তার).
// Two later rules: a taped switch (কসটেপ) can't be pressed, and a long line switch (মরিচবাতির লাইন) at the head of a row or
// column flips that whole line. Switch ids: 0..n²-1 are the bulbs' own switches, n²+k is the board's k-th line switch.
// Lit bulbs are a bitmask (bit i = bulb i), at most 25 bits.

export type Line = { kind: "row" | "col"; at: number };
export type Board = { size: number; taped: number; lines: readonly Line[] };

export const MAX_SIZE = 5;
/** The solver tracks pressable switches in one 32-bit mask, so a board may have at most 30 of them. */
export const MAX_SWITCHES = 30;

export const cellsOf = (board: Board) => board.size * board.size;
export const switchCount = (board: Board) => cellsOf(board) + board.lines.length;
export const allLit = (size: number) => 2 ** (size * size) - 1;
export const isLit = (lit: number, index: number) => (lit & (1 << index)) !== 0;
export const isLine = (board: Board, id: number) => id >= cellsOf(board) && id < switchCount(board);
export const lineOf = (board: Board, id: number) => board.lines[id - cellsOf(board)];
export const isTaped = (board: Board, id: number) => id >= 0 && id < cellsOf(board) && (board.taped & (1 << id)) !== 0;
export const canPress = (board: Board, id: number) => Number.isInteger(id) && id >= 0 && id < switchCount(board) && !isTaped(board, id);

export function bits(mask: number) {
  let count = 0;
  for (let rest = mask >>> 0; rest; rest &= rest - 1) count++;
  return count;
}
export const litCount = bits;

/** The bulbs a bulb's own switch flips: itself, up, down, left, right. */
export function plusMask(size: number, index: number) {
  const row = Math.floor(index / size), col = index % size;
  let mask = 1 << index;
  if (row > 0) mask |= 1 << (index - size);
  if (row < size - 1) mask |= 1 << (index + size);
  if (col > 0) mask |= 1 << (index - 1);
  if (col < size - 1) mask |= 1 << (index + 1);
  return mask;
}

/** The bulbs a line switch flips: its whole row or column. */
export function lineMask(size: number, line: Line) {
  let mask = 0;
  for (let k = 0; k < size; k++) mask |= 1 << (line.kind === "row" ? line.at * size + k : k * size + line.at);
  return mask;
}

/** What one switch flips (0 for an id that isn't on the board). */
export function pressMask(board: Board, id: number) {
  if (!Number.isInteger(id) || id < 0 || id >= switchCount(board)) return 0;
  return id < cellsOf(board) ? plusMask(board.size, id) : lineMask(board.size, lineOf(board, id));
}

/** The pressable switches that touch a bulb. */
export function reachOf(board: Board, bulb: number) {
  const out: number[] = [];
  for (let id = 0; id < switchCount(board); id++) if (canPress(board, id) && pressMask(board, id) & (1 << bulb)) out.push(id);
  return out;
}

// ---- the solver: Gaussian elimination over GF(2) ----
// Each pressable switch is a vector (the bulbs it flips). Pressing a set of switches flips the XOR of their vectors, and order
// never matters, so lighting every bulb means finding a set whose XOR is exactly the dark bulbs. The basis keeps, for each
// vector, which switches add up to it; switch sets that add up to nothing (the board's "free" moves) are the null space.
// Every answer is one answer XOR any mix of null vectors, so trying every mix finds the fewest presses.

type System = { vars: number[]; basis: { vec: number; comb: number; pivot: number }[]; nulls: number[] };
const systems = new Map<string, System>();

function systemOf(board: Board): System {
  const key = `${board.size}|${board.taped}|${board.lines.map(line => `${line.kind}${line.at}`).join(",")}`;
  const cached = systems.get(key);
  if (cached) return cached;
  const vars: number[] = [];
  for (let id = 0; id < switchCount(board); id++) if (canPress(board, id)) vars.push(id);
  if (vars.length > MAX_SWITCHES) throw new Error(`too many switches (${vars.length})`);
  const basis: System["basis"] = [], nulls: number[] = [];
  vars.forEach((id, j) => {
    let vec = pressMask(board, id), comb = 1 << j;
    for (const b of basis) if ((vec >>> b.pivot) & 1) { vec ^= b.vec; comb ^= b.comb; }
    if (vec) basis.push({ vec, comb, pivot: 31 - Math.clz32(vec) });
    else nulls.push(comb);
  });
  const system = { vars, basis, nulls };
  systems.set(key, system);
  return system;
}

/** Every fewest-press answer from `lit`, each as switch ids in order; [] when already lit; null when no presses can do it. */
export function solutions(board: Board, lit: number): number[][] | null {
  const { vars, basis, nulls } = systemOf(board);
  let target = allLit(board.size) & ~lit, x = 0;
  for (const b of basis) if ((target >>> b.pivot) & 1) { target ^= b.vec; x ^= b.comb; }
  if (target) return null;
  let best = Infinity;
  const found: number[] = [];
  for (let choice = 0; choice < 2 ** nulls.length; choice++) {
    let pick = x;
    for (let k = 0; k < nulls.length; k++) if ((choice >> k) & 1) pick ^= nulls[k];
    const weight = bits(pick);
    if (weight < best) { best = weight; found.length = 0; }
    if (weight === best && !found.includes(pick)) found.push(pick);
  }
  return found.sort((a, b) => a - b).map(pick => vars.filter((_, j) => (pick >>> j) & 1));
}

/** One fewest-press answer, or null when the board can't be lit. */
export const solve = (board: Board, lit: number) => solutions(board, lit)?.[0] ?? null;
/** The fewest presses left, or -1 when the board can't be lit. */
export const pressesLeft = (board: Board, lit: number) => solve(board, lit)?.length ?? -1;

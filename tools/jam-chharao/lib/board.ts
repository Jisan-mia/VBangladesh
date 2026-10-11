// The street, the vehicles and every rule of a slide. Pure and server-safe: share.ts replays links through this file.

/** 6 lanes across, 7 down. Your CNG leaves through the gap in the top footpath, above lane EXIT_COL. */
export const COLS = 6, ROWS = 7, EXIT_COL = 2;
/** A link spends one character per move (car × 6 + position < 64), so a level holds at most 10 vehicles. */
export const MAX_CARS = 10;

export type Kind = "cng" | "rickshaw" | "van" | "bus" | "truck";
/** `line` is the fixed lane: the column of a car that moves up and down, the row of one that moves sideways. */
export type Car = { kind: Kind; len: number; down: boolean; line: number };
/** One counted move: a car slid from one place to another. `pos` is the top row (down) or left column (across). */
export type Move = { car: number; from: number; to: number };

const KINDS: Record<string, readonly [Kind, number]> = { g: ["cng", 2], r: ["rickshaw", 2], v: ["van", 2], b: ["bus", 3], t: ["truck", 3] };
const CELLS = "0123456789abcdefghijklmnopqrstuvwxyzABCDEF";

/** Level codes are two characters a vehicle: its kind (capital = moves up and down) and its top-left cell. Car 0 is always your CNG. */
export function parseLevel(code: string): { cars: Car[]; start: number[] } {
  const cars: Car[] = [], start: number[] = [];
  for (let i = 0; i < code.length; i += 2) {
    const letter = code[i], cell = CELLS.indexOf(code[i + 1]);
    const [kind, len] = KINDS[letter.toLowerCase()];
    const down = letter !== letter.toLowerCase();
    cars.push({ kind, len, down, line: down ? cell % COLS : Math.floor(cell / COLS) });
    start.push(down ? Math.floor(cell / COLS) : cell % COLS);
  }
  return { cars, start };
}

export function levelCode(cars: readonly Car[], pos: readonly number[]) {
  return cars.map((car, i) => {
    const letter = Object.keys(KINDS).find(key => KINDS[key][0] === car.kind)!;
    return (car.down ? letter.toUpperCase() : letter) + CELLS[car.down ? pos[i] * COLS + car.line : car.line * COLS + pos[i]];
  }).join("");
}

export const cellOf = (car: Car, at: number) => car.down ? at * COLS + car.line : car.line * COLS + at;
export const laneLength = (car: Car) => car.down ? ROWS : COLS;

/** Which car stands on each of the 42 cells (-1 for open road). Pass `grid` to reuse one buffer. */
export function occupancy(cars: readonly Car[], pos: readonly number[], grid: Int8Array = new Int8Array(COLS * ROWS)) {
  grid.fill(-1);
  for (let i = 0; i < cars.length; i++) for (let k = 0; k < cars[i].len; k++) grid[cellOf(cars[i], pos[i] + k)] = i;
  return grid;
}

/** How far car `i` can slide: the lowest and highest position it can reach in one move. */
export function reach(cars: readonly Car[], grid: Int8Array, pos: readonly number[], i: number): [number, number] {
  const car = cars[i];
  let low = pos[i], high = pos[i];
  while (low > 0 && grid[cellOf(car, low - 1)] < 0) low--;
  while (high + car.len < laneLength(car) && grid[cellOf(car, high + car.len)] < 0) high++;
  return [low, high];
}

export const solved = (pos: readonly number[]) => pos[0] === 0;

// Three bits a car: ten cars pack into one 30-bit whole number.
export const pack = (pos: readonly number[]) => pos.reduce((key, at, i) => key | (at << (3 * i)), 0);
export const posIn = (key: number, car: number) => (key >> (3 * car)) & 7;

/** Calls `visit` with every position one slide away from `key`. `pos` and `grid` are scratch buffers. */
export function eachSlide(cars: readonly Car[], key: number, pos: number[], grid: Int8Array, visit: (next: number, car: number, to: number) => boolean | void) {
  for (let i = 0; i < cars.length; i++) pos[i] = posIn(key, i);
  occupancy(cars, pos, grid);
  for (let i = 0; i < cars.length; i++) {
    const [low, high] = reach(cars, grid, pos, i);
    for (let to = low; to <= high; to++) if (to !== pos[i] && visit(key + ((to - pos[i]) << (3 * i)), i, to)) return;
  }
}

/**
 * Breadth-first search over slides (any distance counts as one move). Returns an optimal move list,
 * [] when already out, or null when the CNG can never get out. `limit` caps the states explored.
 */
export function solve(cars: readonly Car[], start: readonly number[], limit = 400_000): Move[] | null {
  if (solved(start)) return [];
  const parent = new Map<number, number>([[pack(start), -1]]);
  const pos = start.slice(), grid = new Int8Array(COLS * ROWS);
  let frontier = [pack(start)], end = -1;
  while (frontier.length && end < 0 && parent.size < limit) {
    const next: number[] = [];
    for (const key of frontier) {
      eachSlide(cars, key, pos, grid, (nextKey, car, to) => {
        if (parent.has(nextKey)) return;
        parent.set(nextKey, key);
        if (car === 0 && to === 0) { end = nextKey; return true; }
        next.push(nextKey);
      });
      if (end >= 0) break;
    }
    frontier = next;
  }
  return end < 0 ? null : path(parent, end, cars.length);
}

function path(parent: Map<number, number>, end: number, count: number) {
  const moves: Move[] = [];
  for (let key = end, before = parent.get(end)!; before !== -1; key = before, before = parent.get(key)!) {
    for (let car = 0; car < count; car++) {
      if (posIn(key, car) !== posIn(before, car)) { moves.push({ car, from: posIn(before, car), to: posIn(key, car) }); break; }
    }
  }
  return moves.reverse();
}

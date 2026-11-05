// The street, the vehicles and every rule of a slide. Pure and server-safe: share.ts replays links through this file.
// A street is 6 lanes across and 7 down. Your CNG (or two, in the last world) leaves through a gap in the top footpath, above its own lane.
// Bricks and barricades (walls) never move. A vehicle that reaches the top row is out for good.

export const COLS = 6, ROWS = 7, CELLS = COLS * ROWS;
/** A link spends one character per move (car × 6 + position < 64), so a level holds at most 10 vehicles. */
export const MAX_CARS = 10;
/** What occupancy() holds for a cell with a brick pile or a barricade (a vehicle's index otherwise, -1 for open road). */
export const WALL = -2;

export type Kind = "cng" | "cng2" | "rickshaw" | "van" | "bus" | "truck";
/** `line` is the fixed lane: the column of a car that moves up and down, the row of one that moves sideways. */
export type Car = { kind: Kind; len: number; down: boolean; line: number };
/** One counted move: a car slid from one place to another. `pos` is the top row (down) or left column (across). */
export type Move = { car: number; from: number; to: number };
/** A jam: the vehicles, where each starts, the walls (cells) and how many of the first vehicles are yours to get out. */
export type Layout = { cars: Car[]; start: number[]; walls: number[]; heroes: number };

const KINDS: Record<string, readonly [Kind, number]> = { g: ["cng", 2], c: ["cng2", 2], r: ["rickshaw", 2], v: ["van", 2], b: ["bus", 3], t: ["truck", 3] };
const CELL_CHARS = "0123456789abcdefghijklmnopqrstuvwxyzABCDEF";

export const isHero = (kind: Kind) => kind === "cng" || kind === "cng2";

/**
 * Level codes are two characters a vehicle: its kind (capital = moves up and down) and its top-left cell. Vehicle 0 is always
 * your CNG; a second hero ("c", the blue CNG) must be vehicle 1. `walls` is one character a wall cell.
 */
export function parseLevel(code: string, walls = ""): Layout {
  const cars: Car[] = [], start: number[] = [];
  for (let i = 0; i < code.length; i += 2) {
    const letter = code[i], cell = CELL_CHARS.indexOf(code[i + 1]);
    const [kind, len] = KINDS[letter.toLowerCase()];
    const down = letter !== letter.toLowerCase();
    cars.push({ kind, len, down, line: down ? cell % COLS : Math.floor(cell / COLS) });
    start.push(down ? Math.floor(cell / COLS) : cell % COLS);
  }
  const heroes = cars.filter(car => isHero(car.kind)).length;
  return { cars, start, walls: [...walls].map(char => CELL_CHARS.indexOf(char)), heroes };
}

export function levelCode(cars: readonly Car[], pos: readonly number[]) {
  return cars.map((car, i) => {
    const letter = Object.keys(KINDS).find(key => KINDS[key][0] === car.kind)!;
    return (car.down ? letter.toUpperCase() : letter) + CELL_CHARS[car.down ? pos[i] * COLS + car.line : car.line * COLS + pos[i]];
  }).join("");
}
export const wallCode = (walls: readonly number[]) => [...walls].sort((a, b) => a - b).map(cell => CELL_CHARS[cell]).join("");

export const cellOf = (car: Car, at: number) => car.down ? at * COLS + car.line : car.line * COLS + at;
export const laneLength = (car: Car) => car.down ? ROWS : COLS;

/** A hero that has reached the top row has driven out through the gap: it is gone from the street. */
export const isOut = (lay: Pick<Layout, "heroes">, pos: readonly number[], i: number) => i < lay.heroes && pos[i] === 0;
/** Every hero is out: the jam is cleared. */
export function solved(lay: Pick<Layout, "heroes">, pos: readonly number[]) {
  for (let i = 0; i < lay.heroes; i++) if (pos[i] !== 0) return false;
  return true;
}
export function heroesOut(lay: Pick<Layout, "heroes">, pos: readonly number[]) {
  let out = 0;
  for (let i = 0; i < lay.heroes; i++) if (pos[i] === 0) out++;
  return out;
}

/** Which vehicle stands on each of the 42 cells (-1 for open road, WALL for a wall). Pass `grid` to reuse one buffer. */
export function occupancy(lay: Pick<Layout, "cars" | "walls" | "heroes">, pos: readonly number[], grid: Int8Array = new Int8Array(CELLS)) {
  grid.fill(-1);
  for (let w = 0; w < lay.walls.length; w++) grid[lay.walls[w]] = WALL;
  for (let i = 0; i < lay.cars.length; i++) {
    if (isOut(lay, pos, i)) continue;
    for (let k = 0; k < lay.cars[i].len; k++) grid[cellOf(lay.cars[i], pos[i] + k)] = i;
  }
  return grid;
}

/** How far car `i` can slide: the lowest and highest position it can reach in one move. A hero that is out stays put. */
export function reach(lay: Pick<Layout, "cars" | "heroes">, grid: Int8Array, pos: readonly number[], i: number): [number, number] {
  const car = lay.cars[i];
  let low = pos[i], high = pos[i];
  if (isOut(lay, pos, i)) return [low, high];
  while (low > 0 && grid[cellOf(car, low - 1)] === -1) low--;
  while (high + car.len < laneLength(car) && grid[cellOf(car, high + car.len)] === -1) high++;
  return [low, high];
}

/** The vehicles standing between each hero still in the street and the gap above it. */
export function blockers(lay: Layout, pos: readonly number[], grid: Int8Array = occupancy(lay, pos)) {
  const found: number[] = [];
  for (let h = 0; h < lay.heroes; h++) {
    if (pos[h] === 0) continue;
    for (let row = 0; row < pos[h]; row++) {
      const at = grid[row * COLS + lay.cars[h].line];
      if (at >= 0 && !found.includes(at)) found.push(at);
    }
  }
  return found;
}

// Three bits a car: ten cars pack into one 30-bit whole number. A hero's 0 means it is out.
export const pack = (pos: readonly number[]) => pos.reduce((key, at, i) => key | (at << (3 * i)), 0);
export const posIn = (key: number, car: number) => (key >> (3 * car)) & 7;

/** Calls `visit` with every position one slide away from `key`. `pos` and `grid` are scratch buffers. */
export function eachSlide(lay: Layout, key: number, pos: number[], grid: Int8Array, visit: (next: number, car: number, to: number) => boolean | void) {
  for (let i = 0; i < lay.cars.length; i++) pos[i] = posIn(key, i);
  occupancy(lay, pos, grid);
  for (let i = 0; i < lay.cars.length; i++) {
    const [low, high] = reach(lay, grid, pos, i);
    for (let to = low; to <= high; to++) if (to !== pos[i] && visit(key + ((to - pos[i]) << (3 * i)), i, to)) return;
  }
}

/**
 * Breadth-first search over slides (any distance counts as one move). Returns an optimal move list,
 * [] when already out, or null when the way out can never open. `limit` caps the states explored.
 */
export function solve(lay: Layout, start: readonly number[], limit = 400_000): Move[] | null {
  if (solved(lay, start)) return [];
  const heroMask = (1 << (3 * lay.heroes)) - 1;
  const parent = new Map<number, number>([[pack(start), -1]]);
  const pos = start.slice(), grid = new Int8Array(CELLS);
  let frontier = [pack(start)], end = -1;
  while (frontier.length && end < 0 && parent.size < limit) {
    const next: number[] = [];
    for (const key of frontier) {
      eachSlide(lay, key, pos, grid, (nextKey) => {
        if (parent.has(nextKey)) return;
        parent.set(nextKey, key);
        if ((nextKey & heroMask) === 0) { end = nextKey; return true; }
        next.push(nextKey);
      });
      if (end >= 0) break;
    }
    frontier = next;
  }
  return end < 0 ? null : path(parent, end, lay.cars.length);
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

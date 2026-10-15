// The seven tangram pieces, and exact rules for fitting them into a silhouette.
// Units: the classic set cut from a 4×4 square. Every silhouette lives on the "quarter-cell" grid: each unit square split
// by its two diagonals into four triangles. A piece in a lattice pose (big triangles with a level long side, the square
// as a diamond, …) covers whole quarter cells, so "does it fit", "does it overlap" and "can the rest still be finished"
// are exact set checks, never pixel guesses.

export type Kind = 'L' | 'M' | 'S' | 'Q' | 'P';
export type Point = readonly [number, number];
/** A piece's turn (rot × 45° clockwise), mirror (only the parallelogram has a different mirror image) and centroid. */
export type Pose = { kind: Kind; rot: number; flip: boolean; x: number; y: number };

/** One set: two large triangles, a medium one, two small ones, the square and the parallelogram. */
export const SET: readonly Kind[] = ['L', 'L', 'M', 'S', 'S', 'Q', 'P'];
export const AREA: Record<Kind, number> = { L: 4, M: 2, S: 1, Q: 2, P: 2 };

const r2 = Math.SQRT2;
const BASE: Record<Kind, Point[]> = {
  L: [[0, 0], [2 * r2, 0], [0, 2 * r2]],
  M: [[0, 0], [2, 0], [0, 2]],
  S: [[0, 0], [r2, 0], [0, r2]],
  Q: [[0, 0], [r2, 0], [r2, r2], [0, r2]],
  P: [[0, 0], [2, 0], [3, 1], [1, 1]],
};

export const turn8 = (rot: number) => ((rot % 8) + 8) % 8;

function turnPoint([x, y]: Point, rot: number, flip: boolean): Point {
  const angle = (turn8(rot) * Math.PI) / 4, c = Math.cos(angle), s = Math.sin(angle), fx = flip ? -x : x;
  return [fx * c - y * s, fx * s + y * c];
}
const mean = (points: readonly Point[]): Point => [points.reduce((t, p) => t + p[0], 0) / points.length, points.reduce((t, p) => t + p[1], 0) / points.length];

/** The piece's corners around its own centroid, turned and mirrored (for drawing at a translate). */
export function localCorners(kind: Kind, rot: number, flip: boolean): Point[] {
  const turned = BASE[kind].map(p => turnPoint(p, rot, flip && kind === 'P')), [cx, cy] = mean(turned);
  return turned.map(([x, y]) => [x - cx, y - cy]);
}

/** A pose written the way a solution is authored: the piece's first corner sits at (x, y). */
export function placed(kind: Kind, rot: number, x: number, y: number, flip = false): Pose {
  const turned = BASE[kind].map(p => turnPoint(p, rot, flip && kind === 'P')), [cx, cy] = mean(turned);
  return { kind, rot: turn8(rot), flip: flip && kind === 'P', x: x + cx, y: y + cy };
}

export function corners(pose: Pose): Point[] {
  return localCorners(pose.kind, pose.rot, pose.flip).map(([x, y]) => [pose.x + x, pose.y + y]);
}

/** Same outline? Triangles have no turn symmetry, the square repeats every 90°, the parallelogram every 180°. */
export function sameTurn(a: Pose, b: Pose) {
  if (a.kind !== b.kind) return false;
  if (a.kind === 'Q') return turn8(a.rot) % 2 === turn8(b.rot) % 2;
  if (a.kind === 'P') return turn8(a.rot) % 4 === turn8(b.rot) % 4 && a.flip === b.flip;
  return turn8(a.rot) === turn8(b.rot);
}

// ---- the quarter-cell lattice -------------------------------------------------------------------------------------

export const GRID = 48;
const cellKey = (i: number, j: number, t: number) => (j * GRID + i) * 4 + t;
/** Centroids of a unit square's top, right, bottom and left quarter triangles. */
const QUARTER: Point[] = [[0.5, 1 / 6], [5 / 6, 0.5], [0.5, 5 / 6], [1 / 6, 0.5]];
export const cellOf = (key: number) => { const t = key % 4, square = (key - t) / 4; return { i: square % GRID, j: Math.floor(square / GRID), t }; };

const isInt = (value: number) => Number.isInteger(value);

/** The quarter cells a convex polygon covers, or null when an edge leaves the lattice lines or the shape leaves the box. */
export function cellsOf(points: readonly Point[]): number[] | null {
  const snap = points.map(([x, y]) => [Math.round(x * 2) / 2, Math.round(y * 2) / 2] as const);
  if (snap.some(([x, y], k) => Math.abs(x - points[k][0]) > 1e-6 || Math.abs(y - points[k][1]) > 1e-6)) return null;
  for (let k = 0; k < snap.length; k++) {
    const [ax, ay] = snap[k], [bx, by] = snap[(k + 1) % snap.length], dx = bx - ax, dy = by - ay;
    const onLine = dy === 0 ? isInt(ay) : dx === 0 ? isInt(ax) : dx === dy ? isInt(ay - ax) : dx === -dy ? isInt(ay + ax) : false;
    if (!onLine) return null;
  }
  const xs = snap.map(p => p[0]), ys = snap.map(p => p[1]);
  const [x0, x1, y0, y1] = [Math.floor(Math.min(...xs)), Math.ceil(Math.max(...xs)), Math.floor(Math.min(...ys)), Math.ceil(Math.max(...ys))];
  if (x0 < 0 || y0 < 0 || x1 > GRID || y1 > GRID) return null;
  const cells: number[] = [];
  for (let j = y0; j < y1; j++) for (let i = x0; i < x1; i++) for (let t = 0; t < 4; t++) {
    if (inside([i + QUARTER[t][0], j + QUARTER[t][1]], snap)) cells.push(cellKey(i, j, t));
  }
  return cells;
}

/** Strictly inside a convex polygon (either winding). */
export function inside([px, py]: Point, poly: readonly Point[]) {
  let sign = 0;
  for (let k = 0; k < poly.length; k++) {
    const [ax, ay] = poly[k], [bx, by] = poly[(k + 1) % poly.length];
    const cross = (bx - ax) * (py - ay) - (by - ay) * (px - ax);
    if (Math.abs(cross) < 1e-9) return false;
    if (sign === 0) sign = Math.sign(cross); else if (Math.sign(cross) !== sign) return false;
  }
  return true;
}

// ---- placements and the solver -------------------------------------------------------------------------------------

/** The lattice turns of each piece (the others never sit on the grid): one entry per distinct outline. */
const LATTICE_TURNS: Record<Kind, Array<[number, boolean]>> = {
  L: [[1, false], [3, false], [5, false], [7, false]],
  M: [[0, false], [2, false], [4, false], [6, false]],
  S: [[1, false], [3, false], [5, false], [7, false]],
  Q: [[1, false]],
  P: [[0, false], [2, false], [0, true], [2, true]],
};

export type Placement = { pose: Pose; cells: number[] };
export type Board = {
  /** Every quarter cell of the silhouette, sorted. */
  cells: number[];
  /** Every lattice placement of every kind that lies wholly inside the silhouette. */
  placements: Placement[];
  /** For each silhouette cell, the indexes of the placements that cover it. */
  byCell: Map<number, number[]>;
};

export function makeBoard(solution: readonly Pose[]): Board {
  return boardOf(solution.flatMap(pose => cellsOf(corners(pose)) ?? []));
}

export function boardOf(silhouette: readonly number[]): Board {
  const all = new Set(silhouette), cells = [...all].sort((a, b) => a - b);
  const placements: Placement[] = [];
  const mid = GRID / 2;
  for (const kind of ['L', 'M', 'S', 'Q', 'P'] as Kind[]) for (const [rot, flip] of LATTICE_TURNS[kind]) for (const offset of [0, 0.5]) {
    // One copy near the middle of the box, then slid by whole units over the silhouette.
    const seed = placed(kind, rot, mid + offset, mid + offset, flip), seedCells = cellsOf(corners(seed));
    if (!seedCells) continue;
    const spots = seedCells.map(cellOf), minI = Math.min(...spots.map(s => s.i)), minJ = Math.min(...spots.map(s => s.j));
    const maxI = Math.max(...spots.map(s => s.i)), maxJ = Math.max(...spots.map(s => s.j));
    const cellSpots = cells.map(cellOf), lowI = Math.min(...cellSpots.map(s => s.i)), lowJ = Math.min(...cellSpots.map(s => s.j));
    const highI = Math.max(...cellSpots.map(s => s.i)), highJ = Math.max(...cellSpots.map(s => s.j));
    for (let dj = lowJ - minJ; dj <= highJ - maxJ; dj++) for (let di = lowI - minI; di <= highI - maxI; di++) {
      const moved = seedCells.map(cell => cell + (dj * GRID + di) * 4);
      if (moved.every(cell => all.has(cell))) placements.push({ pose: { ...seed, x: seed.x + di, y: seed.y + dj }, cells: moved });
    }
  }
  const byCell = new Map<number, number[]>(cells.map(cell => [cell, []]));
  placements.forEach((placement, index) => placement.cells.forEach(cell => byCell.get(cell)!.push(index)));
  return { cells, placements, byCell };
}

/**
 * Ways to fill the silhouette's still-empty cells with `kinds` (a multiset, so the two twins never count twice).
 * Returns up to `limit` solutions as lists of poses; [] when there's none.
 */
export function solve(board: Board, filled: ReadonlySet<number>, kinds: readonly Kind[], limit = 1): Pose[][] {
  const left = new Map<Kind, number>();
  for (const kind of kinds) left.set(kind, (left.get(kind) ?? 0) + 1);
  const used = new Set(filled), open = board.cells.filter(cell => !used.has(cell));
  if (open.length !== kinds.reduce((t, kind) => t + AREA[kind] * 4, 0)) return [];
  const found: Pose[][] = [], path: Pose[] = [];
  const walk = () => {
    if (found.length >= limit) return;
    const first = open.find(cell => !used.has(cell));
    if (first === undefined) { found.push([...path]); return; }
    for (const index of board.byCell.get(first) ?? []) {
      const { pose, cells } = board.placements[index];
      if (!left.get(pose.kind) || cells.some(cell => used.has(cell))) continue;
      left.set(pose.kind, left.get(pose.kind)! - 1); cells.forEach(cell => used.add(cell)); path.push(pose);
      walk();
      path.pop(); cells.forEach(cell => used.delete(cell)); left.set(pose.kind, left.get(pose.kind)! + 1);
      if (found.length >= limit) return;
    }
  };
  walk();
  return found;
}

export type Fit = { pose: Pose; cells: number[]; rest: Pose[] };

/**
 * Generous snapping: try lattice spots within `reach` units of where the piece was let go, nearest first, and accept the
 * first one that sits inside the empty part of the silhouette and still leaves a finishable puzzle. A spot that matches
 * the outline already shown (`shown`) wins over a nearer one, so a child following the outline always lands on it.
 */
export function fit(board: Board, filled: ReadonlySet<number>, others: readonly Kind[], pose: Pose, shown: readonly Pose[], reach = 1.25): Fit | null {
  const here = corners(pose), [vx, vy] = here[0];
  const tries: Array<{ dx: number; dy: number; far: number }> = [];
  for (let gy = Math.ceil((vy - reach) * 2); gy <= Math.floor((vy + reach) * 2); gy++) for (let gx = Math.ceil((vx - reach) * 2); gx <= Math.floor((vx + reach) * 2); gx++) {
    if (Math.abs(gx % 2) !== Math.abs(gy % 2)) continue; // lattice points: both whole or both halves
    const dx = gx / 2 - vx, dy = gy / 2 - vy, far = Math.hypot(dx, dy);
    if (far <= reach) tries.push({ dx, dy, far });
  }
  const options = tries.map(({ dx, dy, far }) => {
    const moved = { ...pose, x: pose.x + dx, y: pose.y + dy };
    const outline = shown.find(slot => sameTurn(slot, moved) && Math.hypot(slot.x - moved.x, slot.y - moved.y) < 1e-6);
    return { moved, far: outline ? far - 100 : far };
  }).sort((a, b) => a.far - b.far);
  for (const { moved } of options) {
    const cells = cellsOf(corners(moved));
    if (!cells || cells.some(cell => filled.has(cell) || !board.byCell.has(cell))) continue;
    const after = new Set(filled); cells.forEach(cell => after.add(cell));
    const rest = solve(board, after, others)[0];
    if (rest) return { pose: moved, cells, rest };
  }
  return null;
}

/** Would some other turn (or the mirror) of this piece fit right here? Then the child only needs to turn it. */
export function fitsTurned(board: Board, filled: ReadonlySet<number>, others: readonly Kind[], pose: Pose, shown: readonly Pose[]) {
  for (let rot = 0; rot < 8; rot++) for (const flip of pose.kind === 'P' ? [false, true] : [false]) {
    const other = { ...pose, rot, flip };
    if (sameTurn(other, pose)) continue;
    if (fit(board, filled, others, other, shown, 1)) return true;
  }
  return false;
}

/** The silhouette's size, from its cells. */
export function extent(board: Board) {
  const spots = board.cells.map(cellOf);
  return { width: Math.max(...spots.map(s => s.i)) + 1, height: Math.max(...spots.map(s => s.j)) + 1 };
}

/** Is a point over the silhouette? (Used to tell a parked piece from a try.) */
export function overSilhouette(board: Board, [x, y]: Point) {
  const i = Math.floor(x), j = Math.floor(y);
  if (i < 0 || j < 0 || i >= GRID || j >= GRID) return false;
  const fx = x - i, fy = y - j;
  // Which quarter of the unit square: compare against both diagonals.
  const t = fy < fx ? (fy < 1 - fx ? 0 : 1) : (fy < 1 - fx ? 3 : 2);
  return board.byCell.has(cellKey(i, j, t));
}

// The bangle tray: pieces, lines, the two special bangles, gravity and the seeded refill. Pure and server-safe.
import { makeRng } from "../../../shared/game-core";

export const SIZE = 7;
export const CELLS = SIZE * SIZE;
export const EMPTY = -1;
/** A piece is a colour 0..5 (a plain glass bangle), SPARKLE + colour (a gold-glint ঝিকমিক bangle) or RAINBOW. */
export const SPARKLE = 10;
export const RAINBOW = 20;
export const colourOf = (piece: number) => (piece >= 0 && piece < RAINBOW ? piece % SPARKLE : -1);
export const isSparkle = (piece: number) => piece >= SPARKLE && piece < RAINBOW;
/** Points per bangle lifted, times the cascade step (1, 2, 3… up to 5). */
export const POINT = 10;

/** The n-th number of a seed's stream. Each draw stands alone, so a game's random state is just a counter. */
export const roll = (seed: number, n: number) => makeRng((seed ^ Math.imul(n + 1, 0x9e3779b1)) >>> 0)();
const draw = (seed: number, n: number, below: number) => Math.floor(roll(seed, n) * below);

export const neighbours = (a: number, b: number) =>
  a >= 0 && b >= 0 && a < CELLS && b < CELLS && ((Math.abs(a - b) === 1 && Math.floor(a / SIZE) === Math.floor(b / SIZE)) || Math.abs(a - b) === SIZE);

/** How many bangles of one colour run through `cell` in a straight line, the longer way. */
function lineAt(cells: readonly number[], cell: number) {
  const colour = colourOf(cells[cell]);
  if (colour < 0) return 0;
  const row = Math.floor(cell / SIZE), col = cell % SIZE;
  let across = 1, down = 1;
  for (let c = col - 1; c >= 0 && colourOf(cells[row * SIZE + c]) === colour; c--) across++;
  for (let c = col + 1; c < SIZE && colourOf(cells[row * SIZE + c]) === colour; c++) across++;
  for (let r = row - 1; r >= 0 && colourOf(cells[r * SIZE + col]) === colour; r--) down++;
  for (let r = row + 1; r < SIZE && colourOf(cells[r * SIZE + col]) === colour; r++) down++;
  return Math.max(across, down);
}

/** Does swapping these two neighbours do anything? A rainbow always does; otherwise it must make a line of three. */
export function swapWorks(cells: number[], a: number, b: number) {
  if (!neighbours(a, b) || cells[a] === EMPTY || cells[b] === EMPTY) return false;
  if (cells[a] === RAINBOW || cells[b] === RAINBOW) return true;
  [cells[a], cells[b]] = [cells[b], cells[a]];
  const works = lineAt(cells, a) >= 3 || lineAt(cells, b) >= 3;
  [cells[a], cells[b]] = [cells[b], cells[a]];
  return works;
}

/** Every swap that works, as [cell, its right or lower neighbour]. */
export function allMoves(cells: readonly number[]) {
  const scratch = cells.slice(), out: Array<[number, number]> = [];
  for (let cell = 0; cell < CELLS; cell++) {
    if (cell % SIZE < SIZE - 1 && swapWorks(scratch, cell, cell + 1)) out.push([cell, cell + 1]);
    if (cell + SIZE < CELLS && swapWorks(scratch, cell, cell + SIZE)) out.push([cell, cell + SIZE]);
  }
  return out;
}
export const hasMove = (cells: readonly number[]) => allMoves(cells).length > 0;

/** Straight runs of three or more of one colour (sparkles count as their colour, rainbows as none). */
export function findRuns(cells: readonly number[]) {
  const runs: number[][] = [];
  for (const across of [true, false]) {
    for (let line = 0; line < SIZE; line++) {
      const at = (k: number) => (across ? line * SIZE + k : k * SIZE + line);
      let start = 0;
      for (let k = 1; k <= SIZE; k++) {
        const colour = colourOf(cells[at(start)]);
        if (k < SIZE && colour >= 0 && colourOf(cells[at(k)]) === colour) continue;
        if (colour >= 0 && k - start >= 3) runs.push(Array.from({ length: k - start }, (_, i) => at(start + i)));
        start = k;
      }
    }
  }
  return runs;
}

/** A fresh tray: no line anywhere, and at least one swap that works. */
export function deal(seed: number, colours: number) {
  for (let attempt = 0; ; attempt++) {
    const cells: number[] = [];
    let n = 100_000 + attempt * 1000;
    for (let cell = 0; cell < CELLS; cell++) {
      const col = cell % SIZE;
      let piece: number;
      do piece = draw(seed, n++, colours);
      while ((col >= 2 && cells[cell - 1] === piece && cells[cell - 2] === piece) || (cell >= 2 * SIZE && cells[cell - SIZE] === piece && cells[cell - 2 * SIZE] === piece));
      cells.push(piece);
    }
    if (hasMove(cells)) return cells;
  }
}

/** The cells a ঝিকমিক bangle lifts: two each way along its row and its column. */
export function sparkleReach(cell: number) {
  const row = Math.floor(cell / SIZE), col = cell % SIZE, out: number[] = [];
  for (let d = -2; d <= 2; d++) {
    if (d && col + d >= 0 && col + d < SIZE) out.push(row * SIZE + col + d);
    if (d && row + d >= 0 && row + d < SIZE) out.push((row + d) * SIZE + col);
  }
  return out;
}

export type Step = {
  /** Cells lifted this step, read against the tray as it stood before the step. */
  cleared: number[];
  /** ঝিকমিক bangles that went off this step. */
  blasts: number[];
  /** New special bangles: they stay where the line was. */
  made: Array<{ cell: number; piece: number }>;
  /** The tray after the drop and refill. */
  cells: number[];
  /** Per cell of `cells`: how many rows that piece dropped (fresh ones come in from above the tray). */
  fall: number[];
  /** Bangles lifted this step, per colour. */
  lifted: number[];
  points: number;
};

export type Outcome = {
  cells: number[];
  draws: number;
  steps: Step[];
  /** No swap was left, so the tray was shaken: new cell ← old cell. */
  shuffle: number[] | null;
  /** Bangles lifted per colour, and specials made: [ঝিকমিক, রংধনু]. */
  lifted: number[];
  made: [number, number];
  points: number;
};

/**
 * One swap, then every cascade until the tray is still. Null if the swap does nothing (it costs no move).
 * `draws` is how far the seed's stream has been used, so the same moves always bring the same bangles down.
 */
export function play(start: readonly number[], seed: number, draws: number, colours: number, a: number, b: number): Outcome | null {
  const cells = start.slice();
  if (!swapWorks(cells, a, b)) return null;
  [cells[a], cells[b]] = [cells[b], cells[a]];

  // A rainbow swapped onto a colour lifts every bangle of that colour; two rainbows lift the whole tray.
  let forced: Set<number> | null = null;
  const spent = new Set<number>();
  if (cells[a] === RAINBOW || cells[b] === RAINBOW) {
    const other = cells[a] === RAINBOW ? cells[b] : cells[a];
    const colour = colourOf(other);
    forced = new Set(cells.flatMap((piece, cell) => (other === RAINBOW || colourOf(piece) === colour ? [cell] : [])));
    forced.add(a).add(b);
    for (const cell of [a, b]) if (cells[cell] === RAINBOW) spent.add(cell);
  }

  const steps: Step[] = [], lifted = [0, 0, 0, 0, 0, 0], made: [number, number] = [0, 0];
  let points = 0;
  for (let step = 0; step < 60; step++) {
    let clear = new Set<number>();
    const born: Step["made"] = [];
    if (step === 0 && forced) clear = forced;
    else {
      for (const group of groups(findRuns(cells))) {
        for (const cell of group.cells) clear.add(cell);
        const longest = group.runs.reduce((best, run) => (run.length > best.length ? run : best));
        const piece = group.cells.size >= 5 ? RAINBOW : group.cells.size === 4 ? SPARKLE + colourOf(cells[longest[0]]) : null;
        if (piece === null) continue;
        const at = step === 0 && group.cells.has(b) ? b : step === 0 && group.cells.has(a) ? a : longest[Math.floor(longest.length / 2)];
        born.push({ cell: at, piece });
      }
      if (!clear.size) break;
    }

    // Specials caught in the lift go off too, and can set each other off.
    const keep = new Set(born.map(item => item.cell)), blasts: number[] = [], queue = [...clear];
    while (queue.length) {
      const cell = queue.pop()!, piece = cells[cell];
      let hit: number[] = [];
      if (isSparkle(piece)) { blasts.push(cell); hit = sparkleReach(cell); }
      else if (piece === RAINBOW && !spent.has(cell)) { spent.add(cell); const colour = commonest(cells, clear); hit = cells.flatMap((other, index) => (colourOf(other) === colour ? [index] : [])); }
      for (const next of hit) if (!clear.has(next) && !keep.has(next)) { clear.add(next); queue.push(next); }
    }

    const stepLifted = [0, 0, 0, 0, 0, 0];
    for (const cell of clear) { const colour = colourOf(cells[cell]); if (colour >= 0) { lifted[colour]++; stepLifted[colour]++; } }
    for (const cell of keep) clear.delete(cell);
    const cleared = [...clear].sort((x, y) => x - y);
    const stepPoints = (cleared.length + keep.size) * POINT * Math.min(step + 1, 5);
    points += stepPoints;
    for (const cell of cleared) cells[cell] = EMPTY;
    for (const { cell, piece } of born) { cells[cell] = piece; made[piece === RAINBOW ? 1 : 0]++; }

    const fall = Array<number>(CELLS).fill(0);
    for (let col = 0; col < SIZE; col++) {
      let write = SIZE - 1;
      for (let row = SIZE - 1; row >= 0; row--) {
        const from = row * SIZE + col;
        if (cells[from] === EMPTY) continue;
        if (row !== write) { cells[write * SIZE + col] = cells[from]; cells[from] = EMPTY; fall[write * SIZE + col] = write - row; }
        write--;
      }
      for (let row = write; row >= 0; row--) { cells[row * SIZE + col] = draw(seed, draws++, colours); fall[row * SIZE + col] = write + 1; }
    }
    steps.push({ cleared, blasts, made: born, cells: cells.slice(), fall, lifted: stepLifted, points: stepPoints });
  }

  // Nothing left to swap: shake the tray until something lines up, never into a ready-made line.
  let shuffle: number[] | null = null, out = cells;
  if (!hasMove(cells)) {
    for (let attempt = 0; attempt < 200 && !shuffle; attempt++) {
      const order = Array.from({ length: CELLS }, (_, i) => i);
      for (let i = CELLS - 1; i > 0; i--) { const j = draw(seed, draws++, i + 1); [order[i], order[j]] = [order[j], order[i]]; }
      const next = order.map(cell => cells[cell]);
      if (!findRuns(next).length && hasMove(next)) { shuffle = order; out = next; }
    }
    if (!shuffle) { out = deal(seed + draws, colours); draws++; shuffle = Array.from({ length: CELLS }, (_, i) => i); }
  }
  return { cells: out, draws, steps, shuffle, lifted, made, points };
}

/** Runs that share a cell form one group (an L or a T); each group lifts together. Four leave a ঝিকমিক, five or more a রংধনু. */
function groups(runs: number[][]) {
  const out: Array<{ cells: Set<number>; runs: number[][] }> = [];
  for (const run of runs) {
    const touching = out.filter(group => run.some(cell => group.cells.has(cell)));
    const merged = { cells: new Set(run), runs: [run] };
    for (const group of touching) { group.cells.forEach(cell => merged.cells.add(cell)); merged.runs.push(...group.runs); out.splice(out.indexOf(group), 1); }
    out.push(merged);
  }
  return out;
}

/** The colour with the most bangles still standing (a rainbow caught in a blast takes that one). */
function commonest(cells: readonly number[], skip: ReadonlySet<number>) {
  const count = [0, 0, 0, 0, 0, 0];
  cells.forEach((piece, cell) => { const colour = colourOf(piece); if (colour >= 0 && !skip.has(cell)) count[colour]++; });
  return count.indexOf(Math.max(...count));
}

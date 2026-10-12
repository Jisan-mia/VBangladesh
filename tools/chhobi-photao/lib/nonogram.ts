// Nonogram rules: clues from a line, and a line-logic solver (no guessing). Pure, so tests and the hint share it.

/** The run lengths of filled cells in a line; an empty line is []. */
export function cluesOf(line: ArrayLike<boolean | number>) {
  const runs: number[] = [];
  let run = 0;
  for (let index = 0; index < line.length; index++) {
    if (line[index]) run++;
    else if (run) { runs.push(run); run = 0; }
  }
  if (run) runs.push(run);
  return runs;
}

export const sameClue = (a: readonly number[], b: readonly number[]) => a.length === b.length && a.every((value, index) => value === b[index]);

/**
 * What one line forces, given what's known (-1 unknown, 0 empty, 1 filled): tries every placement of the clue's blocks
 * that agrees with the known cells and keeps the cells that come out the same in all of them. Null when none agrees.
 */
export function settleLine(clue: readonly number[], known: ArrayLike<number>) {
  const length = known.length, canFill = new Uint8Array(length), canEmpty = new Uint8Array(length), current = new Uint8Array(length);
  let found = false;
  const place = (block: number, start: number) => {
    if (block === clue.length) {
      for (let index = start; index < length; index++) if (known[index] === 1) return;
      found = true;
      for (let index = 0; index < length; index++) if (index < start && current[index]) canFill[index] = 1; else canEmpty[index] = 1;
      return;
    }
    const run = clue[block];
    for (let at = start; at + run <= length; at++) {
      if (at > start && known[at - 1] === 1) break; // a gap can't skip a filled cell
      let fits = true;
      for (let index = at; index < at + run; index++) if (known[index] === 0) { fits = false; break; }
      if (fits && at + run < length && known[at + run] === 1) fits = false;
      if (!fits) continue;
      for (let index = start; index < at; index++) current[index] = 0;
      for (let index = at; index < at + run; index++) current[index] = 1;
      const next = Math.min(length, at + run + 1);
      if (at + run < length) current[at + run] = 0;
      place(block + 1, next);
    }
  };
  place(0, 0);
  if (!found) return null;
  const out = new Int8Array(length);
  for (let index = 0; index < length; index++) out[index] = canFill[index] && canEmpty[index] ? -1 : canFill[index] ? 1 : 0;
  return out;
}

export type Clues = { rows: number[][]; cols: number[][] };

/**
 * Line logic only: settle rows and columns again and again until nothing changes. Returns the grid
 * (-1 where logic got stuck) or null on a contradiction. `stopAfterOne` returns as soon as one new cell is known (the hint).
 */
export function solveByLines({ rows, cols }: Clues, start?: ArrayLike<number>, stopAfterOne = false) {
  const height = rows.length, width = cols.length, grid = new Int8Array(width * height).fill(-1);
  if (start) for (let index = 0; index < grid.length; index++) grid[index] = start[index];
  const line = new Int8Array(Math.max(width, height));
  for (let changed = true; changed;) {
    changed = false;
    for (let pass = 0; pass < 2; pass++) {
      const count = pass ? width : height, span = pass ? height : width;
      for (let which = 0; which < count; which++) {
        const at = (step: number) => pass ? step * width + which : which * width + step;
        const view = line.subarray(0, span);
        for (let step = 0; step < span; step++) view[step] = grid[at(step)];
        const settled = settleLine(pass ? cols[which] : rows[which], view);
        if (!settled) return null;
        for (let step = 0; step < span; step++) {
          if (settled[step] !== -1 && grid[at(step)] === -1) {
            grid[at(step)] = settled[step];
            changed = true;
            if (stopAfterOne) return grid;
          }
        }
      }
    }
  }
  return grid;
}

// A headless player for the difficulty tests. It scans the page the way a person does: one cell at a time in reading
// order (with the odd jump), and when a cell holds the first letter of a word still on the list it looks along each
// direction the level allows. A false start (a trap, or letters that happen to match) costs more the further it reads.
// A clue list makes every look slower, since the whole run must be read and recognised. Seeded, so the rates are exact.
import { makeRng, pick } from "../../../shared/game-core";
import { DIRS, type Dir, type Puzzle } from "../lib/grid";

export type Skill = { look: number; check: number; stroke: number; notice: number; slip: number; clue: number; start: number };

/** `look` s per cell scanned, `check` s per direction tried, `stroke` s to drag a word, `notice` the chance a right look lands. */
export const PLAYERS = {
  casual: { look: 0.2, check: 0.32, stroke: 1.1, notice: 0.75, slip: 0.12, clue: 1.7, start: 1.2 },
  steady: { look: 0.13, check: 0.22, stroke: 0.8, notice: 0.85, slip: 0.06, clue: 1.5, start: 0.8 },
  strong: { look: 0.08, check: 0.14, stroke: 0.6, notice: 0.93, slip: 0.02, clue: 1.3, start: 0.5 },
} as const satisfies Record<string, Skill>;

export function bot(puzzle: Puzzle, dirs: readonly Dir[], seed: number, skill: Skill) {
  const rng = makeRng(seed), { size, grid } = puzzle, cells = size * size;
  const left = new Set(puzzle.words.map((_, index) => index));
  let time = skill.start, misses = 0, cell = pick(rng, cells), guard = 0;
  const lookCost = skill.check * (puzzle.clue ? skill.clue : 1);
  while (left.size && guard++ < 100_000) {
    time += skill.look;
    let hit = -1;
    for (const index of left) {
      const { letters } = puzzle.words[index];
      if (grid[cell] !== letters[0]) continue;
      for (const dir of dirs) {
        const [dr, dc] = DIRS[dir], r = Math.floor(cell / size), c = cell % size;
        let read = 1;
        while (read < letters.length) {
          const rr = r + dr * read, cc = c + dc * read;
          if (rr < 0 || rr >= size || cc < 0 || cc >= size || grid[rr * size + cc] !== letters[read]) break;
          read++;
        }
        // Left to right is how the eye reads anyway, so that look is cheaper.
        time += lookCost * (dir === "R" ? 0.4 : 1) * (1 + 0.35 * (read - 1));
        // Each word reads exactly once on the page (the generator checks), so a full read is the word.
        if (read === letters.length && rng() < skill.notice) { hit = index; break; }
      }
      if (hit >= 0) break;
    }
    if (hit >= 0) {
      time += skill.stroke + 0.12 * puzzle.words[hit].letters.length;
      if (rng() < skill.slip) { misses++; time += 1.5; }
      left.delete(hit);
      cell = pick(rng, cells);
    } else cell = rng() < 0.08 ? pick(rng, cells) : (cell + 1) % cells;
  }
  return { seconds: time, misses };
}

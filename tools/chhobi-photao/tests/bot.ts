// A headless player. It reads the board the way a person does (only cells line logic proves), fills them in one stroke per
// run along a row, and sometimes slips onto a wrong cell. Each stroke costs a human 1.2 s of reading and moving.
import { makeRng } from "../../../shared/game-core";
import { isSolved, mistakes, puzzleOf, starsFor } from "../lib/game";
import { solveByLines } from "../lib/nonogram";
import { startPlay, stitch, type Play } from "../lib/play";

export type Person = { name: string; /** chance that any one stitch slips onto a wrong cell */ slip: number; /** seconds per stroke or slip */ pace: number };
export const FIRST_TIMER: Person = { name: "first-timer", slip: 0.04, pace: 1.6 };
export const STEADY: Person = { name: "steady", slip: 0.01, pace: 1.2 };
export const CAREFUL: Person = { name: "careful", slip: 0.003, pace: 1.0 };

export type Run = { won: boolean; strokes: number; seconds: number; wrong: number; stars: number; play: Play };

export function runBot(level: number, person: Person, seed: number): Run {
  const puzzle = puzzleOf(level), rng = makeRng(seed * 7919 + level);
  let play = startPlay(level), strokes = 0, seconds = 0;
  for (let guard = 0; guard < 400 && !isSolved(play); guard++) {
    const known = play.cells.map(mark => (mark === 1 ? 1 : -1));
    const grid = solveByLines(puzzle, known);
    if (!grid) break;
    // Strokes along a row or a column from the first to the last cell it still needs, over cells that are already in.
    const n = puzzle.size, spans: { cells: number[]; needed: number }[] = [];
    for (let axis = 0; axis < 2; axis++) for (let line = 0; line < n; line++) {
      let segment: number[] = [];
      for (let step = 0; step <= n; step++) {
        const at = step < n ? (axis ? step * n + line : line * n + step) : -1;
        if (at >= 0 && grid[at] === 1) segment.push(at);
        else {
          const need = segment.filter(cell => play.cells[cell] !== 1);
          if (need.length) spans.push({ cells: segment.slice(segment.indexOf(need[0]), segment.indexOf(need[need.length - 1]) + 1), needed: need.length });
          segment = [];
        }
      }
    }
    if (!spans.length) break;
    spans.sort((a, b) => b.needed - a.needed);
    const best = spans[0];
    if (rng() < 1 - (1 - person.slip) ** best.needed) {
      const wrongCells = puzzle.solution.flatMap((filled, index) => (!filled && play.cells[index] !== 1 ? [index] : []));
      if (wrongCells.length) { play = stitch(play, [wrongCells[Math.floor(rng() * wrongCells.length)]], 1, true).play; seconds += person.pace; }
    }
    // The drag starts on a cell it needs, so cells already in stay in.
    play = stitch(play, best.cells.filter(cell => play.cells[cell] !== 1), 1, true, 0).play;
    strokes++; seconds += person.pace;
  }
  const wrong = mistakes(play);
  return { won: isSolved(play), strokes, seconds, wrong, stars: starsFor(wrong, false), play };
}

/** Rates over `count` seeds: how often it wins, gets ≥2 stars and 3 stars, and the median seconds. */
export function rate(level: number, person: Person, count = 200) {
  const runs = Array.from({ length: count }, (_, seed) => runBot(level, person, seed + 1));
  const share = (test: (run: Run) => boolean) => runs.filter(test).length / count;
  const times = runs.map(run => run.seconds).sort((a, b) => a - b);
  return { win: share(run => run.won), two: share(run => run.stars >= 2), three: share(run => run.stars === 3), median: times[Math.floor(count / 2)] };
}

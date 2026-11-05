// A simple greedy player that sees what a person sees: of every swap that works, it takes the one whose first lift does
// most for the goals, then lifts the most. It never peeks at the bangles about to fall in.
// It proves each level can be won inside its moves (tests), sets the moves (scripts/make-levels.ts) and gives the idle hint.
// With `rng` it picks among its top three instead, a rough stand-in for a person; those runs set the stars.
import { makeRng } from "../../../shared/game-core";
import { allMoves, CELLS, FREE_GOAL, RAINBOW, SIZE, colourOf, isLocked } from "./board";
import type { Spec } from "./ladder";
import { createGame, move, newRun, progress, type Game, type Run } from "./rules";

/** For a level that asks to free tied bangles: how many tied ones have a same-coloured neighbour once this swap is made (a person sets one up). */
function setUp(cells: readonly number[], a: number, b: number) {
  const swapped = cells.slice();
  [swapped[a], swapped[b]] = [swapped[b], swapped[a]];
  let near = 0;
  for (let cell = 0; cell < CELLS; cell++) {
    if (!isLocked(swapped[cell])) continue;
    const colour = colourOf(swapped[cell]), row = Math.floor(cell / SIZE), col = cell % SIZE;
    if ((col > 0 && colourOf(swapped[cell - 1]) === colour) || (col < SIZE - 1 && colourOf(swapped[cell + 1]) === colour) || (row > 0 && colourOf(swapped[cell - SIZE]) === colour) || (row < SIZE - 1 && colourOf(swapped[cell + SIZE]) === colour)) near++;
  }
  return near;
}

export function bestMove(game: Game, rng?: () => number, pool = 3): [number, number] | null {
  const wantsFree = game.spec.goals.some((goal, index) => goal[0] === FREE_GOAL && game.left[index] > 0);
  const scored: Array<{ pair: [number, number]; value: number }> = [];
  for (const [a, b] of allMoves(game.cells)) {
    const next = move(game, a, b);
    if (!next) continue;
    const first = next.last!.steps[0], specials = first.made.filter(item => item.piece !== RAINBOW).length;
    const gained = progress(game.spec.goals, { lifted: first.lifted, made: [specials, first.made.length - specials], freed: first.freed, wiped: first.wiped });
    const value = game.left.reduce((sum, count, index) => sum + Math.min(count, gained[index]), 0) * 1000 + first.points + first.made.length * 25 + (next.won ? 1e6 : 0) + (wantsFree ? setUp(game.cells, a, b) * 120 : 0);
    scored.push({ pair: [a, b], value });
  }
  if (!scored.length) return null;
  if (!rng) return scored.reduce((best, item) => (item.value > best.value ? item : best)).pair;
  scored.sort((x, y) => y.value - x.value);
  return scored[Math.floor(rng() * Math.min(pool, scored.length))].pair;
}

/** Plays a level to the end (won or out of moves): greedily, or with `runSeed` among its top three. */
export function botGame(run: Run, spec: Spec, runSeed = 0) {
  const rng = runSeed ? makeRng(runSeed) : undefined;
  let game = createGame(run, spec);
  while (!game.over) {
    const pick = bestMove(game, rng);
    if (!pick) break;
    game = move(game, pick[0], pick[1])!;
  }
  return game;
}

export const PEOPLE = 15;
/** Scores of PEOPLE top-three runs on a level (0 for a run that doesn't clear it), lowest first. */
export const peopleScores = (level: number, spec: Spec) =>
  Array.from({ length: PEOPLE }, (_, run) => { const game = botGame(newRun(level), spec, spec.seed * 31 + run + 1); return game.won ? game.score : 0; }).sort((x, y) => x - y);
/** Three stars at the middle of those runs, two at the lower fifth (or 70% of three if that many runs fell short). */
export function thresholds(level: number, spec: Spec) {
  const scores = peopleScores(level, spec), floor10 = (value: number) => Math.floor(value / 10) * 10;
  const three = floor10(scores[Math.floor(PEOPLE / 2)]), low = floor10(scores[Math.floor(PEOPLE / 5)]);
  return { three, two: low > 0 && low <= three - 100 ? low : floor10(three * 0.7) };
}

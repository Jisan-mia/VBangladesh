// A simple greedy player that sees what a person sees: of every swap that works, it takes the one whose first lift does most
// for the goals, then lifts the most. It never peeks at the bangles about to fall in.
// It proves each level can be won inside its moves (tests), sets the moves (scripts/make-levels.ts) and gives hints.
// With `rng` it picks among its top three instead, a rough stand-in for a person; those runs set the stars.
import { makeRng } from "../../../shared/game-core";
import { allMoves, RAINBOW } from "./board";
import { move, progress, startGame, type Game } from "./game";
import type { LevelSpec } from "./levels";

export function bestMove(game: Game, spec: LevelSpec, rng?: () => number): [number, number] | null {
  const scored: Array<{ pair: [number, number]; value: number }> = [];
  for (const [a, b] of allMoves(game.cells)) {
    const next = move(game, a, b, spec);
    if (!next) continue;
    const first = next.outcome.steps[0], specials = first.made.filter(item => item.piece !== RAINBOW).length;
    const gained = progress(spec.goals, { lifted: first.lifted, made: [specials, first.made.length - specials] });
    const value = game.left.reduce((sum, count, index) => sum + Math.min(count, gained[index]), 0) * 1000 + first.points + first.made.length * 25;
    scored.push({ pair: [a, b], value });
  }
  if (!scored.length) return null;
  if (!rng) return scored.reduce((best, item) => (item.value > best.value ? item : best)).pair;
  scored.sort((x, y) => y.value - x.value);
  return scored[Math.floor(rng() * Math.min(3, scored.length))].pair;
}

/** Plays a level to the end (won or out of moves): greedily, or with `runSeed` among its top three. */
export function botGame(spec: LevelSpec, level = 0, runSeed = 0) {
  const rng = runSeed ? makeRng(runSeed) : undefined;
  let game = startGame(level, spec);
  while (!game.over) {
    const pick = bestMove(game, spec, rng);
    if (!pick) break;
    game = move(game, pick[0], pick[1], spec)!.game;
  }
  return game;
}

export const PEOPLE = 15;
/** Scores of PEOPLE top-three runs on a level (0 for a run that doesn't clear it), lowest first. */
export const peopleScores = (spec: LevelSpec) =>
  Array.from({ length: PEOPLE }, (_, run) => { const game = botGame(spec, 0, spec.seed * 31 + run + 1); return game.won ? game.score : 0; }).sort((x, y) => x - y);
/** Three stars at the middle of those runs, two at the lower fifth (or 70% of three if that many runs fell short). */
export function thresholds(spec: LevelSpec) {
  const scores = peopleScores(spec), floor10 = (value: number) => Math.floor(value / 10) * 10;
  const three = floor10(scores[Math.floor(PEOPLE / 2)]), low = floor10(scores[Math.floor(PEOPLE / 5)]);
  return { three, two: low > 0 && low <= three - 100 ? low : floor10(three * 0.7) };
}

// Headless players for the tests. A casual person sees a right switch some of the time, otherwise presses the switch that
// lights the most right now (the obvious move) or one at random; after too many presses they take the hint and finish.
import { makeRng, pick } from "../../../shared/game-core";
import { canPress, litCount, solutions, switchCount } from "../lib/board";
import { footprint, isSolved, newGame, press, starLimits, starsFor, teach, withHint, type Game, type Puzzle } from "../lib/play";

export type Person = { insight: number; greedy: number };
export const CASUAL: Person = { insight: 0.5, greedy: 0.35 };
export const SHARP: Person = { insight: 1, greedy: 0 };

export function move(game: Game, rng: () => number, who: Person) {
  const { board } = game.puzzle, roll = rng();
  if (roll < who.insight) {
    const best = solutions(board, game.lit)!, answer = best[pick(rng, best.length)];
    return answer[pick(rng, answer.length)];
  }
  const ids: number[] = [];
  for (let id = 0; id < switchCount(board); id++) if (canPress(board, id)) ids.push(id);
  if (roll < who.insight + who.greedy) {
    let top = -Infinity, tops: number[] = [];
    for (const id of ids) {
      const { on, off } = footprint(board, game.lit, id), net = litCount(on) - litCount(off);
      if (net > top) { top = net; tops = [id]; } else if (net === top) tops.push(id);
    }
    return tops[pick(rng, tops.length)];
  }
  return ids[pick(rng, ids.length)];
}

/** One run: the presses it took, whether it needed the hint, and its stars. */
export function playOnce(puzzle: Puzzle, seed: number, who: Person) {
  const rng = makeRng(seed), cap = starLimits(puzzle.par).two * 3;
  let game = newGame(puzzle);
  // A first lesson's switch pulses until the first press: everyone presses it.
  if (puzzle.guide !== undefined) game = press(game, puzzle.guide)!;
  while (!isSolved(game) && game.moves.length < cap) game = press(game, move(game, rng, who))!;
  while (!isSolved(game)) { const hint = teach(game)!; game = press(withHint(game), hint.id)!; }
  return { moves: game.moves.length, hinted: game.hinted, stars: starsFor(game.moves.length, puzzle.par, game.hinted) };
}

/** Shares of runs that earned ★★★ and at least ★★, over `runs` seeds. */
export function rates(puzzle: Puzzle, who: Person, runs = 200) {
  let three = 0, two = 0;
  for (let seed = 1; seed <= runs; seed++) { const { stars } = playOnce(puzzle, seed * 977 + puzzle.level, who); if (stars === 3) three++; if (stars >= 2) two++; }
  return { three: three / runs, two: two / runs };
}

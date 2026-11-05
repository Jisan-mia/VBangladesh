// A headless child for the level tests: looks at the tiles, knows the next letter with probability `knows`, otherwise taps
// a tile at random; once a tile glows (after two missed tries on a word) it taps that one. A think time per tap gives seconds.
import { makeRng } from "../../../shared/game-core";
import { createRound, currentStep, hint, isLast, nextStep, place, tiles, wanted, type Pace, type Round } from "../lib/round";

export type Child = { knows: number; think: number };
export const GUESSER: Child = { knows: 0, think: 1.5 };
export const SEVEN: Child = { knows: 0.85, think: 2 };
export const LEARNER: Child = { knows: 0.97, think: 1.5 };
/** Seconds between a solved word and the child's tap on পরেরটা (a look at the equation). */
export const NEXT_S = 1.2;

export type Play = { round: Round; taps: number; seconds: number; firstSolvedAt: number; mostTapsOnAWord: number };

export function playRound(level: number, seed: number, child: Child, pace?: Pace): Play {
  const rng = makeRng(seed ^ 0x5bd1e995);
  let round = createRound(level, seed, pace), taps = 0, seconds = 0, firstSolvedAt = -1, mostTapsOnAWord = 0;
  for (;;) {
    const before = taps;
    while (!round.solved) {
      const shown = tiles(round), right = wanted(round)!;
      const letter = hint(round) >= 2 || rng() < child.knows ? right : shown[Math.floor(rng() * shown.length)];
      round = place(round, letter).round;
      taps++; seconds += child.think;
      if (taps > 400) throw new Error("bot stuck");
    }
    mostTapsOnAWord = Math.max(mostTapsOnAWord, taps - before);
    if (firstSolvedAt < 0) firstSolvedAt = seconds;
    if (isLast(round)) return { round, taps, seconds, firstSolvedAt, mostTapsOnAWord };
    seconds += NEXT_S;
    round = nextStep(round);
  }
}
export { currentStep };

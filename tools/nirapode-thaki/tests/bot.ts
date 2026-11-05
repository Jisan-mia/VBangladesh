// A headless child for the level tests: looks at the pictures, knows the safe one with probability `knows`, otherwise taps
// one it hasn't tried yet at random; once the safe picture glows (after two misses) it taps that one. A think time per
// tap gives seconds, and the child's pace carries from round to round like the game's.
import { makeRng } from "../../../shared/game-core";
import { answer, createRound, currentItem, hintOn, isLast, nextQuestion, START_PACE, type Pace, type Round } from "../lib/play";

export type Child = { knows: number; think: number };
export const GUESSER: Child = { knows: 0, think: 1.5 };
export const FIVE: Child = { knows: 0.7, think: 2.2 };
export const LEARNER: Child = { knows: 0.9, think: 1.6 };
/** Seconds the child spends on the ➜ after an answer (looking at why). */
export const LOOK_S = 1.5;

export type Play = { round: Round; taps: number; seconds: number; firstRightAt: number; mostTaps: number; sizes: number[] };

export function playRound(level: number, seed: number, child: Child, pace: Pace = START_PACE): Play {
  const rng = makeRng(seed ^ 0x5bd1e995);
  let round = createRound(level, seed, pace), taps = 0, seconds = 0, firstRightAt = -1, mostTaps = 0;
  const sizes: number[] = [];
  for (;;) {
    const item = currentItem(round), tried = new Set<string>();
    let here = 0;
    sizes.push(round.choices.length);
    while (!round.solved) {
      const fresh = round.choices.filter(choice => !tried.has(choice.id));
      const pick = hintOn(round) || rng() < child.knows ? item.question.right.id : fresh[Math.floor(rng() * fresh.length)].id;
      tried.add(pick);
      round = answer(round, pick);
      taps++; here++; seconds += child.think;
      if (taps > 200) throw new Error("bot stuck");
    }
    mostTaps = Math.max(mostTaps, here);
    if (firstRightAt < 0) firstRightAt = seconds;
    if (isLast(round)) return { round, taps, seconds, firstRightAt, mostTaps, sizes };
    seconds += LOOK_S;
    round = nextQuestion(round);
  }
}

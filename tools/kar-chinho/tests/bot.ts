// A headless child for the level tests: looks at the tiles, knows the sign with probability `knows`, otherwise taps one it
// hasn't tried yet at random; once a tile glows (after two misses) it taps that one. A think time per tap gives seconds.
import { makeRng } from "../../../shared/game-core";
import { answer, createRound, currentItem, hintOn, isDone, nextWord, START_PACE, type Pace, type Round } from "../lib/round";

export type Child = { knows: number; think: number };
export const GUESSER: Child = { knows: 0, think: 1.5 };
export const FIVE: Child = { knows: 0.7, think: 2 };
export const LEARNER: Child = { knows: 0.9, think: 1.5 };
/** Seconds between a right sign and the next word (the game's 1.1 s timer). */
export const NEXT_S = 1.1;

export type Play = { round: Round; taps: number; seconds: number; firstRightAt: number };

export function playRound(level: number, seed: number, child: Child, pace: Pace = START_PACE): Play {
  const rng = makeRng(seed ^ 0x5bd1e995);
  let round = createRound(level, seed, pace), taps = 0, seconds = 0, firstRightAt = -1;
  for (;;) {
    const item = currentItem(round), tried = new Set<string>();
    while (!round.solved) {
      const fresh = round.choices.filter(kar => !tried.has(kar));
      const kar = hintOn(round) || rng() < child.knows ? item.kar : fresh[Math.floor(rng() * fresh.length)];
      tried.add(kar);
      round = answer(round, kar);
      taps++; seconds += child.think;
      if (taps > 200) throw new Error("bot stuck");
    }
    if (firstRightAt < 0) firstRightAt = seconds;
    if (isDone(round)) return { round, taps, seconds, firstRightAt };
    seconds += NEXT_S;
    round = nextWord(round);
  }
}

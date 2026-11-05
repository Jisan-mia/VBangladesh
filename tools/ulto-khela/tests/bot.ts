// A headless child for the level tests: sees the picture, knows the answer with probability `knows`, otherwise taps one of the
// two at random; once the right one glows (after two tries on a picture) it taps that. `think` seconds pass per tap, so the
// optional চটপট clock can be tested too (a picture the child takes longer than the pace to answer passes as a miss).
import { makeRng } from "../../../shared/game-core";
import { levelOf } from "../lib/course";
import { answer, answerOf, createRound, glows, isDone, nextItem, pass, paceSeconds, START_PACE, type Pace, type Round } from "../lib/round";

export type Child = { knows: number; think: number };
export const GUESSER: Child = { knows: 0, think: 1.5 };
export const FIVE: Child = { knows: 0.8, think: 2 };
export const LEARNER: Child = { knows: 0.95, think: 1.5 };
/** Seconds a picture rests after a right tap (the game's own wait). */
export const REST_S = 0.7;

export type Play = { round: Round; taps: number; seconds: number; firstRightAt: number };

export function playRound(level: number, seed: number, child: Child, pace: Pace = START_PACE, quick = false): Play {
  const rng = makeRng(seed ^ 0x5bd1e995);
  let round = createRound(level, seed, pace), taps = 0, seconds = 0, firstRightAt = -1;
  for (;;) {
    // One picture: taps until it is answered, or (চটপট) until its time runs out.
    let waited = 0;
    while (round.stage === "pick") {
      if (quick && !round.demo && waited + child.think > paceSeconds(round.pace)) { round = pass(round); seconds += Math.max(0, paceSeconds(round.pace) - waited); break; }
      const knows = glows(round) || rng() < child.knows;
      round = answer(round, knows ? answerOf(round) : Math.floor(rng() * 2)).round;
      taps++; waited += child.think; seconds += child.think;
      if (taps > 600) throw new Error("bot stuck");
    }
    if (firstRightAt < 0) firstRightAt = seconds;
    if (isDone(round)) return { round, taps, seconds, firstRightAt };
    seconds += REST_S;
    const next = nextItem(round);
    if (!next) throw new Error("no next item before the end");
    round = next;
  }
}
export const itemsOf = (level: number) => levelOf(level).items;

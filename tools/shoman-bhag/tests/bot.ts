// A headless child for the level tests. At every choice it knows the answer with probability `knows`, otherwise it does
// what a small child does: puts the piece on any other plate, tries another knife, taps another answer. Once the answer glows
// (after two misses) it follows the glow. A think time per touch gives seconds.
import { makeRng } from "../../../shared/game-core";
import {
  START_PACE, createRound, cut, decide, glows, isDone, nextItem, pick, answerOf, tapBasket, tapPlate, target, resultOf,
  type Leftover, type Pace, type Result, type Round, type Step,
} from "../lib/round";

export type Child = { knows: number; think: number; leftover?: Leftover };
export const GUESSER: Child = { knows: 0, think: 1.5 };
export const FIVE: Child = { knows: 0.7, think: 2 };
export const LEARNER: Child = { knows: 0.9, think: 1.5 };
export const PERFECT: Child = { knows: 1, think: 1 };
/** Seconds to press the ➜ after a finished serving. */
export const NEXT_S = 1.2;

export type Play = { round: Round; result: Result; taps: number; seconds: number; firstServedAt: number; misses: number };

export function playRound(level: number, seed: number, child: Child, pace: Pace = START_PACE): Play {
  const rng = makeRng(seed ^ 0x5bd1e995);
  let round = createRound(level, seed, pace), taps = 0, seconds = 0, firstServedAt = -1, misses = 0;
  const touch = (step: Step) => { taps++; seconds += child.think; if (step.event === "over" || step.event === "again") misses++; if (taps > 600) throw new Error("bot stuck"); round = step.round; };
  for (;;) {
    while (!isDone(round)) {
      const item = round.item;
      if (item.kind === "share") {
        if (round.stage === "share") {
          const fair = target(round);
          if (round.hand === null) {
            const over = round.plates.findIndex(count => count > fair);
            touch(over >= 0 ? tapPlate(round, over) : tapBasket(round));
          } else {
            const others = round.plates.map((_, index) => index).filter(index => index !== round.hand);
            const needy = others.filter(index => round.plates[index] < fair);
            const wise = needy.length ? needy.reduce((low, index) => round.plates[index] < round.plates[low] ? index : low) : others[0];
            touch(tapPlate(round, rng() < child.knows || !needy.length ? wise : others[Math.floor(rng() * others.length)]));
          }
        } else if (round.stage === "left") {
          touch(decide(round, child.leftover ?? "share"));
        } else if (round.stage === "cut") {
          const right = item.guests.length, tried = [2, 3, 4].filter(parts => !(round.miss && round.miss.kind === "cut" && round.miss.parts === parts));
          touch(cut(round, glows(round) || rng() < child.knows ? right : tried[Math.floor(rng() * tried.length)]));
        } else touch(tapPlate(round, round.pieces.indexOf(false)));
      } else {
        const right = answerOf(round), wrongs = item.choices.filter(value => value !== right);
        touch(pick(round, glows(round) || rng() < child.knows ? right : wrongs[Math.floor(rng() * wrongs.length)]));
      }
    }
    if (firstServedAt < 0) firstServedAt = seconds;
    if (round.index + 1 >= round.length) return { round, result: resultOf(round), taps, seconds, firstServedAt, misses };
    seconds += NEXT_S;
    round = nextItem(round)!;
  }
}

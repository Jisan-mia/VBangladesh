// A headless child for the level tests. It looks at the item and knows it with probability `knows`; otherwise it makes the mix-up
// children really make (the wrong hour, the wrong long-hand place, or an untried card). Once the answer shows (after two slips,
// or from the start when the pace is eased) it takes it. Seconds are a think time plus the time to drag and press ✓.
import { makeRng, pick } from "../../../shared/game-core";
import { check, choose, createRound, currentItem, glowOn, isDone, nextItem, turn, START_PACE, type Pace, type Round } from "../lib/round";
import { levelOf } from "../lib/levels";
import { hour12, mod } from "../lib/time";

export type Child = { knows: number; think: number };
export const GUESSER: Child = { knows: 0, think: 1.5 };
export const FIVE: Child = { knows: 0.8, think: 2 };
export const LEARNER: Child = { knows: 0.9, think: 1.5 };
/** Seconds to drag a hand and press ✓, and to pick a card. */
const SET_S = 3, PICK_S = 1.2, NEXT_S = 1.2;

export type Play = { round: Round; taps: number; slips: number; seconds: number; firstRightAt: number };

export function playRound(level: number, seed: number, child: Child, pace: Pace = START_PACE): Play {
  const rng = makeRng(seed ^ 0x5bd1e995), spec = levelOf(level);
  let round = createRound(level, seed, pace), taps = 0, seconds = 0, firstRightAt = -1;
  for (;;) {
    const item = currentItem(round), target = item.time.h * 60 + item.time.m;
    while (!round.solved) {
      const right = glowOn(round) || rng() < child.knows;
      seconds += child.think;
      if (item.mode === "set") {
        // A mix-up: the short hand one hour off, or the long hand on another of this level's places.
        const wrongMinute = spec.ask.filter(m => m !== item.time.m);
        const total = right ? target
          : wrongMinute.length && rng() < 0.5 ? mod(item.time.h, 12) * 60 + wrongMinute[pick(rng, wrongMinute.length)] : (hour12(item.time.h) % 12 + 1) * 60 + item.time.m;
        round = check(turn(round, total === round.total ? total + 720 : total));
        seconds += SET_S;
      } else {
        const fresh = round.choices.filter(card => !round.tried.includes(`${card.h}:${card.m}`) && !(card.h === item.time.h && card.m === item.time.m));
        round = choose(round, right || !fresh.length ? item.time : fresh[pick(rng, fresh.length)]);
        seconds += PICK_S;
      }
      taps++;
      if (taps > 200) throw new Error("bot stuck");
    }
    if (firstRightAt < 0) firstRightAt = seconds;
    if (isDone(round)) return { round, taps, slips: round.misses, seconds, firstRightAt };
    seconds += NEXT_S;
    round = nextItem(round);
  }
}

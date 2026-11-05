// A headless child for the difficulty tests: plays a whole round through the pure round, with a chance of knowing the answer.
import { makeRng } from "../../../shared/game-core";
import { advance, createRound, current, isLast, predict, replay, shownChoices, watched, type Round } from "../lib/round";

export type Kid = { knows: number; replays?: boolean };

/** Plays a round to its last guess (the win), the way a child would: guess, watch, answer, maybe again, next. */
export function play(level: number, seed: number, kid: Kid, eased = false): Round {
  const rng = makeRng(seed * 31 + level), round = createRound(level, seed, eased);
  for (;;) {
    const item = current(round), shown = shownChoices(item, round.eased);
    const wrong = shown.filter(index => index !== item.answer);
    const choice = rng() < kid.knows ? item.answer : (rng() < 0.5 && wrong.length ? wrong[Math.floor(rng() * wrong.length)] : shown[Math.floor(rng() * shown.length)]);
    if (predict(round, choice) === "ignore") throw new Error("a shown choice was refused");
    if (!watched(round)) throw new Error("the experiment did not end");
    if (kid.replays && rng() < 0.3) { replay(round); watched(round); }
    if (isLast(round)) return round;
    if (!advance(round)) throw new Error("could not move on");
  }
}

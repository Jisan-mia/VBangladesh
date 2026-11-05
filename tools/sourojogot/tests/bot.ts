// A headless child for the level tests: looks at the question, knows the answer with probability `knows`, otherwise taps
// something it hasn't tried yet at random; once the right answer glows (after two tries, or when eased) it taps that.
// A think time per tap gives seconds, and the board's flight or the ▶ button adds the game's own waits.
import { makeRng, pick } from "../../../shared/game-core";
import { levelOf } from "../lib/course";
import { PLANETS } from "../lib/planets";
import { advance, answer, createRound, glowOn, isDone, itemOf, rightKey, START_PACE, type Pace, type Round } from "../lib/round";

export type Child = { knows: number; think: number };
export const GUESSER: Child = { knows: 0, think: 1.5 };
export const FIVE: Child = { knows: 0.7, think: 2 };
export const LEARNER: Child = { knows: 0.9, think: 1.5 };
/** Seconds the rocket takes to land, and a child's pause on the ▶ button. */
export const FLIGHT_S = 0.9, NEXT_S = 1.2;

export type Play = { round: Round; taps: number; seconds: number; firstRightAt: number };

/** The keys a guess could be: everything the screen offers that isn't the right one and hasn't been tried. */
function wrongKeys(round: Round): string[] {
  const item = itemOf(round), right = rightKey(round);
  const all = item.kind === "tour" ? PLANETS.slice(round.index + 1, levelOf(round.level).count).map(planet => planet.id)
    : item.kind === "place" ? round.slots.map((planet, orbit) => planet < 0 ? String(orbit) : "").filter(Boolean)
    : [...round.choices];
  return all.filter(key => key !== right && !round.wrong.includes(key));
}

export function playRound(level: number, seed: number, child: Child, pace: Pace = START_PACE): Play {
  const rng = makeRng(seed ^ 0x5bd1e995), mode = levelOf(level).mode;
  const button = mode === "know" || mode === "size" || mode === "far" || mode === "scale";
  let round = createRound(level, seed, pace), taps = 0, seconds = 0, firstRightAt = -1;
  for (;;) {
    while (!round.solved) {
      const wrong = wrongKeys(round);
      const key = glowOn(round) || wrong.length === 0 || rng() < child.knows ? rightKey(round) : wrong[pick(rng, wrong.length)];
      round = answer(round, key);
      taps++; seconds += child.think;
      if (taps > 400) throw new Error("bot stuck");
    }
    if (firstRightAt < 0) firstRightAt = seconds + (button ? 0 : FLIGHT_S);
    if (isDone(round)) return { round, taps, seconds, firstRightAt };
    seconds += button ? NEXT_S : FLIGHT_S * 0.3;
    round = advance(round);
  }
}

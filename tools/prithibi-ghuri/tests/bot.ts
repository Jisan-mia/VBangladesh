// A headless child for the level tests: flies to the stops in a seeded order, turns every postcard, knows the right picture with
// probability `knows`, otherwise taps one it hasn't tried at random; once the right picture glows (after two misses) it taps that.
// A think time per tap gives seconds, and the child's pace carries from trip to trip like the game's.
import { makeRng } from "../../../shared/game-core";
import { flightOf, flightMs } from "../lib/geo";
import { levelOf } from "../lib/levels";
import { advance, answer, createTrip, hintOn, isLast, land, nextCard, questionNow, fly, START_PACE, type Pace, type Trip } from "../lib/trip";

export type Child = { knows: number; think: number };
export const GUESSER: Child = { knows: 0, think: 1.5 };
export const FIVE: Child = { knows: 0.7, think: 2.2 };
export const LEARNER: Child = { knows: 0.9, think: 1.6 };
export const CARD_S = 1.2, LOOK_S = 1.2, PICK_S = 1;

export type Play = { trip: Trip; taps: number; seconds: number; firstRightAt: number; mostTaps: number; sizes: number[]; cards: number; pins: number };

export function playTrip(level: number, seed: number, child: Child, pace: Pace = START_PACE): Play {
  const rng = makeRng(seed ^ 0x5bd1e995), stops = levelOf(level).stops;
  let trip = createTrip(level, seed, pace), taps = 0, seconds = 0, firstRightAt = -1, mostTaps = 0, cards = 0, pins = 0;
  const sizes: number[] = [];
  for (let guard = 0; guard < 400; guard++) {
    if (trip.phase === "map") {
      const left = stops.map((_, at) => at).filter(at => !trip.visited.includes(at));
      const at = left[Math.floor(rng() * left.length)];
      trip = fly(trip, at); pins++; seconds += PICK_S + flightMs(flightOf(stops[at].id)) / 1000;
    } else if (trip.phase === "fly") trip = land(trip);
    else if (trip.phase === "card") { trip = nextCard(trip); cards++; seconds += CARD_S; }
    else {
      const q = questionNow(trip)!, right = stops[q.stop].id, tried = new Set<string>();
      sizes.push(trip.choices.length);
      let here = 0;
      while (!trip.solved) {
        const fresh = trip.choices.filter(id => !tried.has(id));
        const pick = hintOn(trip) || rng() < child.knows ? right : fresh[Math.floor(rng() * fresh.length)];
        tried.add(pick); trip = answer(trip, pick); taps++; here++; seconds += child.think;
      }
      mostTaps = Math.max(mostTaps, here);
      if (firstRightAt < 0) firstRightAt = seconds;
      if (isLast(trip)) return { trip, taps, seconds, firstRightAt, mostTaps, sizes, cards, pins };
      seconds += LOOK_S; trip = advance(trip);
    }
  }
  throw new Error("bot stuck");
}

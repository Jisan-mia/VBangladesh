// Headless children for the level tests. They write through the same pure rules the board uses (down, move, up), at the
// pace a finger moves: a sample every 2 units, one touch event about every 16 ms.
import { makeRng } from "../../../shared/game-core";
import type { Pt } from "../lib/strokes";
import { down, done, move, newRound, nextLetter, strokeOf, up, type Round } from "../lib/trace";

export type Child = {
  /** How far (units in the 100-box) the finger strays from the path at any moment, roughly a standard deviation. */
  wobble: number;
  /** Chance of lifting the finger part-way and trying again. */
  lifts: number;
  /** Samples between two touch events: how fast the finger goes. */
  speed: number;
  /** Tries the child gives a stroke before wandering off to the next letter. */
  patience: number;
};
export const PRECISE: Child = { wobble: 2.5, lifts: 0, speed: 3, patience: 12 };
/** A 4-year-old: shaky, quick, sometimes lifts early. */
export const FOUR: Child = { wobble: 6.5, lifts: 0.15, speed: 5, patience: 12 };
/** A toddler who mostly bangs near the path. */
export const WILD: Child = { wobble: 11, lifts: 0.25, speed: 7, patience: 12 };

const gauss = (rng: () => number) => (rng() + rng() + rng() - 1.5) * 2;
export type Play = { round: Round; tries: number; stuck: boolean };

/** One try at the current stroke: down, along the samples with wobble (maybe lifting early), up. */
function tryStroke(round: Round, child: Child, rng: () => number): Round {
  const stroke = strokeOf(round)!, samples = stroke.samples;
  const near = (p: Pt): Pt => [p[0] + gauss(rng) * child.wobble / 1.7, p[1] + gauss(rng) * child.wobble / 1.7];
  let now: Round = round, from = near(samples[0]);
  [now] = down(now, from);
  if (stroke.dot) return up(now)[0];
  const stopAt = rng() < child.lifts ? Math.floor(samples.length * (0.3 + rng() * 0.5)) : samples.length;
  const step = Math.min(child.speed, Math.max(1, Math.floor(samples.length / 4)));
  for (let i = step; i < stopAt; i += step) {
    const before = now.stroke, point = near(samples[i]);
    [now] = move(now, from, point);
    from = point;
    if (now.stroke !== before || now.letterDone) return now;
  }
  return up(now)[0];
}

/** A child writes the whole set; gives up on a letter after `patience` tries per stroke. */
export function writeSet(level: number, seed: number, child: Child): Play {
  const rng = makeRng(seed ^ 0x9e3779b1);
  let round = newRound(level), tries = 0;
  while (!done(round)) {
    let guard = 0;
    while (!round.letterDone) {
      if (guard++ > child.patience * 8) return { round, tries, stuck: true };
      round = tryStroke(round, child, rng);
      tries++;
    }
    round = nextLetter(round);
  }
  return { round, tries, stuck: false };
}

/** A child who scribbles anywhere on the board: random touches, random jumps, no path in mind. */
export function scribble(level: number, seed: number, movesPerTry = 60, triesPerLetter = 40): Play {
  const rng = makeRng(seed ^ 0x7f4a7c15);
  const at = (): Pt => [rng() * 100, rng() * 100];
  let round = newRound(level), tries = 0;
  while (!done(round)) {
    let guard = 0;
    while (!round.letterDone) {
      if (guard++ > triesPerLetter) return { round, tries, stuck: true };
      let from = at();
      [round] = down(round, from);
      for (let i = 0; i < movesPerTry && !round.letterDone; i++) { const point = at(); [round] = move(round, from, point); from = point; }
      if (!round.letterDone) [round] = up(round);
      tries++;
    }
    round = nextLetter(round);
  }
  return { round, tries, stuck: false };
}

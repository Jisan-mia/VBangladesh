// The endless tune from before the rewrite, kept byte for byte: a link without `l`/`v` (every link shared before the
// rewrite) replays exactly the same notes at exactly the same speed. Never change this file.
import { makeRng, pick } from "../../../shared/game-core";

export const LEGACY_POTS = 4;
/** Notes per old level: levels ended at 5, 10, 15… notes. */
export const STAGE = 5;
/** The longest tune; repeating all of it ends the run as a win. */
export const MAX_LEN = 99;
/** The fastest beat: at most 2.5 flashes a second (WCAG 2.3.1 allows 3). */
export const MIN_BEAT = 400;

/** The whole tune for a seed. Any prefix is the same on every phone. */
export function legacyTune(seed: number, length = MAX_LEN) {
  const rng = makeRng(seed), tune: number[] = [];
  for (let index = 0; index < length; index++) {
    let pot = pick(rng, LEGACY_POTS);
    // Never the same pot three times running: three flashes of one pot are hard to count.
    if (index >= 2 && tune[index - 1] === pot && tune[index - 2] === pot) pot = (pot + 1 + pick(rng, LEGACY_POTS - 1)) % LEGACY_POTS;
    tune.push(pot);
  }
  return tune;
}

/** The level a round of `length` notes belonged to: 1–5 → 1, 6–10 → 2… (rounds past 50 stayed at level 10's speed). */
export const legacyLevelOf = (length: number) => Math.max(1, Math.ceil(length / STAGE));

/** The old beat in ms for a round of `length` notes: faster by 40 ms a level. */
export const legacyBeat = (length: number) => Math.max(MIN_BEAT, 760 - 40 * (legacyLevelOf(length) - 1));

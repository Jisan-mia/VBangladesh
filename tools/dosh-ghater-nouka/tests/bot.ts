// A headless child for the level tests. It looks at what is wanted, taps it with probability `knows` (otherwise a ghat it has
// not tried yet), and takes `think` seconds over every press. The race clock steps at 60 a second, as the page's loop does.
import { makeRng } from "../../../shared/game-core";
import { advance } from "../lib/clock.hot";
import { IGNORE, canSpin, expected, newRace, spinNow, tap, type Race } from "../lib/sim";

export type Child = { knows: number; think: number };
export const GUESSER: Child = { knows: 0, think: 1.2 };
export const FIVE: Child = { knows: 0.8, think: 1 };
export const LEARNER: Child = { knows: 0.95, think: 0.8 };
export const QUICK: Child = { knows: 1, think: 0.6 };

export type Play = { race: Race; seconds: number; taps: number };

export function playRace(level: number, seed: number, child: Child, options: { duo?: boolean } = {}): Play {
  const rng = makeRng(seed ^ 0x5bd1e995), race = newRace(level, seed, options);
  let wait = 0, taps = 0, tried = new Set<number>();
  for (let frame = 0; frame < 60 * 600; frame++) {
    advance(race, 1000 / 60);
    race.nev = 0;
    if (race.ended) return { race, seconds: race.time / 1000, taps };
    if (race.over) continue;
    wait -= 1000 / 60;
    if (wait > 0) continue;
    if (canSpin(race)) { spinNow(race); wait = child.think * 1000; tried = new Set(); continue; }
    const want = expected(race);
    if (!want) continue;
    let k = want;
    if (rng() >= child.knows) {
      const options: number[] = [];
      for (let ghat = 1; ghat <= race.n; ghat++) if (ghat !== want && !tried.has(ghat)) options.push(ghat);
      if (options.length) k = options[Math.floor(rng() * options.length)];
    }
    tried.add(k);
    if (tap(race, k) !== IGNORE) taps++;
    if (k === want) tried = new Set();
    wait = child.think * 1000;
  }
  throw new Error("bot stuck");
}

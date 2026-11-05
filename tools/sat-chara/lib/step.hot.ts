// The round's 60 Hz step: aiming time (টুনি's hands, মিঠু's hop), the flight, and the end of each ball.
// Runs every step: no object or array literals, closures, `new` or string building (npm run lint:games).
import type { Round } from "./game";
import { BALLS } from "./game";
import { downCount, idle, nextThrow, settled, step } from "./physics.hot";
import { STONES } from "./world";

/** A ball settled (the next one is in the hand, or the round is over). */
export const E_SETTLE = 1;
/** All seven are down. */
export const E_CLEAR = 2;
/** The third ball is gone and some still stand. */
export const E_FAIL = 4;
/** টুনি put a piece back. */
export const E_BACK = 8;

/** One step. Returns the events as bits. */
export function advance(r: Round) {
  if (r.phase === "aim") return idle(r.world) ? E_BACK : 0;
  if (r.phase !== "flying") return 0;
  step(r.world);
  if (!settled(r.world)) return 0;
  r.balls++;
  const down = downCount(r.world);
  if (r.balls === 1) r.first = down;
  if (down === STONES) { r.phase = "done"; r.cleared = true; return E_SETTLE | E_CLEAR; }
  if (r.balls >= BALLS) { r.phase = "done"; return E_SETTLE | E_FAIL; }
  nextThrow(r.world);
  r.phase = "aim";
  return E_SETTLE;
}

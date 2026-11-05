// The run's clock. One rover step arrives every `stepMs` after a short lead; the run ends a little after its last step
// (a beat to see the last rock lifted). The clock only moves when the component says the game is live, so nothing drives,
// picks up or wins while the child is away, under the player's menu or behind the rest screen. After coming back it
// gives a short breath before moving again. Runs every animation frame: it allocates nothing.

export const LEAD_MS = 300;
export const STEP_MS = 520;
export const SLOW_STEP_MS = 850;
export const WIN_BEAT_MS = 450;
export const MISS_BEAT_MS = 200;
export const BREATH_MS = 350;
/** A frame longer than this (a slow phone, a hidden tab that woke) counts as this long: no catch-up lurch. */
export const MAX_DT = 100;

import type { Clock } from "./run";

/** Advance by `dt` live milliseconds. Returns true when something new happened (a step arrived or the run ended). */
export function tick(clock: Clock, dt: number): boolean {
  if (clock.ended) return false;
  let step = dt > MAX_DT ? MAX_DT : dt < 0 ? 0 : dt;
  if (clock.breath > 0) {
    clock.breath -= step;
    if (clock.breath > 0) return false;
    step = -clock.breath;
    clock.breath = 0;
  }
  clock.t += step;
  const reached = clock.t < 0 ? 0 : Math.min(clock.steps, 1 + Math.floor(clock.t / clock.stepMs));
  let moved = false;
  if (reached !== clock.reached) { clock.reached = reached; moved = true; }
  // The beat starts when the last step arrives (or at the lead's end for a plan with no step at all).
  const over = clock.t - (clock.steps === 0 ? 0 : (clock.steps - 1) * clock.stepMs) - clock.beat;
  if (clock.reached === clock.steps && clock.t >= 0 && over >= 0) { clock.ended = true; moved = true; }
  return moved;
}

/** Called when the game becomes live again after being held: a short breath before anything moves. */
export function giveBreath(clock: Clock) { clock.breath = BREATH_MS; }

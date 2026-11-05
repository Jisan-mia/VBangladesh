// A routine's clock, set up once per round. The per-step code is run.hot.ts; this file only builds the state.
import { totalSeconds } from "./routines";

/** How long the halfway badge stays up, in shown seconds. */
export const HALF_SHOW = 2.2;

export type Run = {
  /** Seconds of routine actually shown. It moves only inside advance(), so a pause or a blur cannot move it. */
  t: number;
  index: number;
  total: number;
  half: number;
  halfFired: boolean;
  done: boolean;
  /** Where each step ends, in seconds. */
  ends: Float64Array;
};

export function createRun(steps: readonly { seconds: number }[]): Run {
  const ends = new Float64Array(steps.length);
  let at = 0;
  for (let index = 0; index < steps.length; index++) { at += steps[index].seconds; ends[index] = at; }
  return { t: 0, index: 0, total: totalSeconds(steps), half: at / 2, halfFired: false, done: false, ends };
}

/** The ring: 0 at the start, 1 when the routine is over. */
export const ringAt = (run: Run) => run.t >= run.total ? 1 : run.t <= 0 ? 0 : run.t / run.total;

/** The halfway badge shows for HALF_SHOW seconds of shown time after the middle. */
export const halfShowing = (run: Run) => run.halfFired && run.t - run.half < HALF_SHOW && !run.done;

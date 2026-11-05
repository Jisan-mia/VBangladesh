// Setting up a run's clock (the per-frame part is run.hot.ts, which allocates nothing).
import { LEAD_MS, SLOW_STEP_MS, STEP_MS, WIN_BEAT_MS, MISS_BEAT_MS } from "./run.hot";

export type Clock = {
  /** Milliseconds of live run time so far, after the lead (starts at minus the lead). */
  t: number;
  stepMs: number;
  steps: number;
  /** How many steps have arrived (0..steps). */
  reached: number;
  /** Live milliseconds after the last step before the run ends. */
  beat: number;
  ended: boolean;
  /** Time still to wait after a pause before the clock moves again. */
  breath: number;
};

export const makeClock = (steps: number, slow: boolean, wins: boolean): Clock =>
  ({ t: -LEAD_MS, stepMs: slow ? SLOW_STEP_MS : STEP_MS, steps, reached: 0, beat: wins ? WIN_BEAT_MS : MISS_BEAT_MS, ended: false, breath: 0 });

/** Live time left until the run ends (for tests). */
export const remaining = (clock: Clock) => Math.max(0, (clock.steps === 0 ? 0 : (clock.steps - 1) * clock.stepMs) + clock.beat - clock.t);

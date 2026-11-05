// The beat clock, stepped 60 times a second. No allocation: it mutates the run and returns a bit mask.
import { COUNT_IN } from "./plan";
import type { Run } from "./run";

export const EV_COUNT = 1; // a count-in beat sounded (run.counted says which)
export const EV_BEAT = 2;  // a new beat started (run.index)
export const EV_END = 4;   // the last beat finished

/** Moves the clock on by `dt` ms. Count-in first (two beats of the level's pace), then the beats, then the end. */
export function advance(run: Run, dt: number): number {
  let events = 0;
  if (run.phase === 2) return events;
  if (run.phase === 0) {
    run.countAt += dt;
    const beat = run.beatMs, due = Math.min(COUNT_IN, Math.floor(run.countAt / beat) + 1);
    if (run.counted < due) { run.counted = due; events |= EV_COUNT; }
    if (run.countAt < COUNT_IN * beat) return events;
    run.phase = 1; run.clock += run.countAt - COUNT_IN * beat;
  } else {
    run.clock += dt;
  }
  const { at, len } = run.plan, last = run.plan.beats.length - 1;
  while (run.index < last && (run.index < 0 || run.clock >= at[run.index] + len[run.index])) {
    run.index++; events |= EV_BEAT;
    run.focus = run.index;
  }
  if (run.index === last && run.clock >= at[last] + len[last]) { run.phase = 2; events |= EV_END; }
  return events;
}

/** How far through its beat the clock is, 0..1 (for the ball's arc and the ruler). */
export function beatFraction(run: Run): number {
  if (run.phase === 0) { const beat = run.beatMs, x = (run.countAt % beat) / beat; return x; }
  const index = run.index < 0 ? 0 : run.index, f = (run.clock - run.plan.at[index]) / run.plan.len[index];
  return f < 0 ? 0 : f > 1 ? 1 : f;
}

// The routine's per-frame step: no allocation. Returns which things happened this step as flag bits.
import type { Run } from "./run";

export const STEP_CHANGED = 1, HALFWAY = 2, FINISHED = 4;

/** Moves the routine on by `dt` shown seconds. Nothing calls this while the game is paused, hidden or blurred. */
export function advance(run: Run, dt: number): number {
  if (run.done) return 0;
  let events = 0;
  run.t += dt;
  if (!run.halfFired && run.t >= run.half) { run.halfFired = true; events |= HALFWAY; }
  if (run.t >= run.total) { run.t = run.total; run.done = true; run.index = run.ends.length - 1; return events | FINISHED | STEP_CHANGED; }
  let index = run.index;
  while (index < run.ends.length - 1 && run.t >= run.ends[index]) index++;
  if (index !== run.index) { run.index = index; events |= STEP_CHANGED; }
  return events;
}

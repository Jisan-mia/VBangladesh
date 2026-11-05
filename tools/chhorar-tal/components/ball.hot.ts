// The hopping ball, placed every animation frame from the beat clock. Allocation-free: it reads numbers and writes one
// transform. The ball is at a dot exactly when its beat starts, and lands on the next dot exactly when that beat starts.
import { beatFraction } from "../lib/tick.hot";
import type { Run } from "../lib/run";

/** Where the dots of the line on screen are, measured after each line is laid out. `base` is the line's first beat. */
export type Geo = { px: Float32Array; py: Float32Array; n: number; base: number };
export const HOP = 26;

export function paintBall(node: HTMLElement | null, geo: Geo, run: Run, still: boolean) {
  if (!node || geo.n === 0) return;
  const at = run.phase === 0 ? run.focus : run.index;
  // The line on screen isn't measured yet (it changed this very frame): hold the ball back for a frame.
  if (run.plan.lineAt[at < 0 ? 0 : at] !== geo.base) { node.style.visibility = "hidden"; return; }
  node.style.visibility = "visible";
  const local = run.phase === 0 ? 0 : Math.max(0, Math.min(geo.n - 1, run.index - geo.base));
  const f = beatFraction(run), arc = f * (1 - f) * 4;
  const last = local >= geo.n - 1 || run.phase === 0;
  const x = last || still ? geo.px[local] : geo.px[local] + (geo.px[local + 1] - geo.px[local]) * f;
  const y = (last || still ? geo.py[local] : geo.py[local] + (geo.py[local + 1] - geo.py[local]) * f) - (still ? 0 : arc * (last ? HOP * 0.45 : HOP));
  node.style.opacity = last && run.phase === 1 ? (f < 0.6 ? 1 : 1 - (f - 0.6) / 0.4).toFixed(2) : "1";
  node.style.transform = "translate3d(" + x.toFixed(1) + "px," + y.toFixed(1) + "px,0)";
}

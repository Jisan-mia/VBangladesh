// Per-frame painting of the board: the ink growing along the current stroke, the pen nib at its head, and the moving
// dot that shows the stroke's order and direction. No allocation in here: the component makes one Paint object, and these
// functions only read its numbers and write element attributes. Ink and trail are one pathLength=1 path each, revealed
// with stroke-dashoffset, so a frame costs two style writes however long the stroke is.
import type { Pt } from "../lib/strokes";

export type Paint = {
  /** The current stroke's ink and the demo's trail: the same path as the stroke, pathLength 1. */
  ink: SVGPathElement | null;
  trail: SVGPathElement | null;
  /** The nib at the ink's head, the moving dot, its ring and the little hand that rides on it (a nested svg, moved by x/y). */
  nib: SVGCircleElement | null;
  dot: SVGCircleElement | null;
  ring: SVGCircleElement | null;
  hand: SVGSVGElement | null;
  samples: readonly Pt[] | null;
  last: number;
  /** Samples covered now (shown, eased) and where the finger has got to (target). */
  shown: number;
  target: number;
  /** Slow mode: no easing and no travelling dot. */
  still: boolean;
  /** A dot stroke: tapped, not traced. */
  tap: boolean;
  demo: boolean;
  demoAt: number;
  demoTravel: number;
  /** After the dot rests, wait this long and go again; 0 plays once. */
  demoGap: number;
  demoShowing: boolean;
};

export const HOLD_MS = 650;

/** A new stroke is current (or the same one again): the ink shows `reach` samples, the demo is off. */
export function setStroke(p: Paint, samples: readonly Pt[] | null, reach: number) {
  p.samples = samples;
  p.last = samples ? samples.length - 1 : 0;
  p.shown = reach;
  p.target = reach;
  p.tap = !!samples && samples.length < 4;
  p.demo = false;
  hideDemo(p);
}

export function setTarget(p: Paint, reach: number) { p.target = reach; }

/** Play the moving dot along the stroke once (gap 0) or on a loop with a pause between runs. */
export function startDemo(p: Paint, gap: number) {
  p.demo = true;
  p.demoAt = 0;
  p.demoGap = gap;
  p.demoTravel = p.tap ? 0 : 500 + p.last * 28;
}

export function stopDemo(p: Paint) { p.demo = false; }

/** Numbers go to attributes and styles as text. */
const num = (n: number) => String(Math.round(n * 100) / 100);
const ease = (t: number) => t < 0.5 ? 2 * t * t : 1 - 2 * (1 - t) * (1 - t);

function hideDemo(p: Paint) {
  if (!p.demoShowing) return;
  p.demoShowing = false;
  if (p.trail) p.trail.style.opacity = "0";
  if (p.dot) p.dot.style.opacity = "0";
  if (p.ring) p.ring.style.opacity = "0";
  if (p.hand) p.hand.style.opacity = "0";
}

function placeDot(p: Paint, x: number, y: number, fade: number) {
  p.demoShowing = true;
  if (p.dot) { p.dot.setAttribute("cx", num(x)); p.dot.setAttribute("cy", num(y)); p.dot.style.opacity = num(fade); }
  if (p.ring) { p.ring.setAttribute("cx", num(x)); p.ring.setAttribute("cy", num(y)); p.ring.style.opacity = num(fade); }
  if (p.hand) { p.hand.setAttribute("x", num(x - 5)); p.hand.setAttribute("y", num(y - 0.3)); p.hand.style.opacity = num(fade); }
}

/** One frame. `dt` is milliseconds since the last frame (clamped by the caller). Returns true while more frames are needed. */
export function paintFrame(p: Paint, dt: number): boolean {
  const samples = p.samples;
  let busy = false;
  if (samples) {
    const gap = p.target - p.shown;
    if (p.still || gap < 0.03 && gap > -0.03) p.shown = p.target;
    else { p.shown += gap * (1 - Math.exp(-dt / 50)); busy = true; }
    if (p.ink) { p.ink.style.strokeDashoffset = num(1 - (p.last ? p.shown / p.last : 0)); p.ink.style.opacity = p.shown > 0.25 ? "1" : "0"; }
    if (p.nib) {
      p.nib.style.opacity = p.shown > 0.25 ? "1" : "0";
      const at = Math.min(p.last, Math.max(0, p.shown)), i = Math.min(p.last - 1, Math.floor(at)), f = at - i;
      const a = samples[i < 0 ? 0 : i], b = samples[i < 0 ? 0 : i + 1];
      p.nib.setAttribute("cx", num(a[0] + (b[0] - a[0]) * f));
      p.nib.setAttribute("cy", num(a[1] + (b[1] - a[1]) * f));
    }
  }
  if (!p.demo || !samples) { hideDemo(p); return busy; }
  if (p.still) {
    if (p.trail) { p.trail.style.opacity = "0.75"; p.trail.style.strokeDashoffset = "0"; }
    placeDot(p, samples[0][0], samples[0][1], 1);
    return busy;
  }
  p.demoAt += dt;
  const total = p.demoTravel + HOLD_MS;
  if (p.demoAt >= total) {
    hideDemo(p);
    if (p.demoGap > 0 && p.demoAt >= total + p.demoGap) p.demoAt = 0;
    else if (p.demoGap === 0) p.demo = false;
    return true;
  }
  if (p.tap) { placeDot(p, samples[0][0], samples[0][1], 0.55 + 0.45 * Math.sin(p.demoAt / 110)); return true; }
  const t = p.demoAt >= p.demoTravel ? 1 : ease(p.demoAt / p.demoTravel), at = t * p.last, i = Math.min(p.last - 1, Math.floor(at)), f = at - i;
  if (p.trail) { p.trail.style.opacity = "0.8"; p.trail.style.strokeDashoffset = num(1 - t); }
  placeDot(p, samples[i][0] + (samples[i + 1][0] - samples[i][0]) * f, samples[i][1] + (samples[i + 1][1] - samples[i][1]) * f, 1);
  return true;
}

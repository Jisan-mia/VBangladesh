// Code that runs every frame or every pointermove: springs that carry the vehicles, the finger's pull on one of them, and the
// end screen's count-up. Numbers in, numbers out, typed arrays and the drag object mutated in place: no objects, arrays,
// closures or strings are made here (npm run lint:games checks it).
import type { Drag, Motion } from "./motion";

/** Under this many CSS px a press is a tap, not a drag. */
export const TAP_PX = 8;
/** How far past a stop the finger can push a car, at most, in cells. */
export const STRETCH = 0.3;
/** A flick this fast (cells a millisecond) carries the car on to the next cell. */
export const FLICK = 0.004;
const OUT_OF_SIGHT = -12;

/** Moves every shown position a step closer to its target with a spring. Returns true while anything still moves. */
export function stepMotion(m: Motion, dt: number, calm: boolean, held: number) {
  let moving = false;
  const sub = dt > 0.02 ? 3 : dt > 0.011 ? 2 : 1, h = dt / sub;
  for (let i = 0; i < m.n; i++) {
    if (m.wait[i] > 0) { m.wait[i] -= dt; moving = true; continue; }
    const grip = i === held ? 1 : 0;
    const lift = grip && !calm ? 1 : 0;
    m.lift[i] += (lift - m.lift[i]) * Math.min(1, dt * 14);
    if (m.lift[i] < 0.004 && lift === 0) m.lift[i] = 0;
    const root = Math.sqrt(m.mass[i]);
    // Held: follows the finger smoothly, heavier ones later. Let go: a lively spring that overshoots a little and settles.
    const omega = (grip ? 24 : calm ? 34 : 21) / root;
    const zeta = grip || calm ? 1 : 0.5 + 0.1 * root;
    const gap = m.t[i] - m.x[i];
    if (gap < 0.002 && gap > -0.002 && m.v[i] < 0.02 && m.v[i] > -0.02) { m.x[i] = m.t[i]; m.v[i] = 0; moving = moving || m.lift[i] > 0; continue; }
    for (let s = 0; s < sub; s++) {
      const a = omega * omega * (m.t[i] - m.x[i]) - 2 * zeta * omega * m.v[i];
      m.v[i] += a * h;
      m.x[i] += m.v[i] * h;
    }
    moving = true;
  }
  return moving;
}

/** Where a drag lands the car: the nearest cell, carried on by a flick, inside what the road allows. */
export function landing(d: Drag) {
  const carried = d.speed > FLICK ? 0.45 : d.speed < -FLICK ? -0.45 : 0;
  const cell = Math.round(d.want + carried);
  return cell < d.low ? d.low : cell > d.high ? d.high : cell;
}

/** A finger goes down on `car`, shown at `from`, free to go between `low` and `high`. */
export function pressDrag(d: Drag, id: number, car: number, down: number, from: number, low: number, high: number, x: number, y: number, t: number) {
  d.id = id; d.car = car; d.down = down; d.x0 = x; d.y0 = y; d.from = from; d.want = from; d.low = low; d.high = high;
  d.moved = 0; d.speed = 0; d.lastWant = from; d.lastT = t; d.bumped = 0;
}

/**
 * The finger moves: the car follows it one to one along its lane, stopped by the road with a little give (a rubber band,
 * never more than STRETCH past a stop). Returns how far past a stop the finger is, in cells (0 when the road is free).
 */
export function moveDrag(d: Drag, m: Motion, x: number, y: number, t: number, cellPx: number) {
  if (d.id < 0 || cellPx <= 0) return 0;
  const dx = x - d.x0, dy = y - d.y0, far = Math.sqrt(dx * dx + dy * dy);
  if (far > d.moved) d.moved = far;
  d.want = d.from + (d.down ? dy : dx) / cellPx;
  const dt = t - d.lastT;
  if (dt > 0) { d.speed = d.speed * 0.5 + ((d.want - d.lastWant) / dt) * 0.5; d.lastWant = d.want; d.lastT = t; }
  let over = 0, target = d.want;
  if (d.want > d.high) { over = d.want - d.high; target = d.high + STRETCH * (1 - Math.exp(-over * 2.2)); }
  else if (d.want < d.low) { over = d.low - d.want; target = d.low - STRETCH * (1 - Math.exp(-over * 2.2)); }
  m.t[d.car] = target;
  return over;
}

/** Lets go (lift, blur, hide, pause or pointercancel): nothing counts as held any more. */
export function releaseDrag(d: Drag) {
  d.id = -1; d.car = -1; d.moved = 0; d.speed = 0; d.bumped = 0;
}

/** Sends a vehicle off the top of the street: your CNG leaving through the gap. */
export function driveOff(m: Motion, car: number) {
  m.t[car] = OUT_OF_SIGHT;
}

/** A hit: the vehicle in the way shivers (a push of speed that its spring takes back). */
export function jolt(m: Motion, car: number, strength: number) {
  m.v[car] += strength / (m.mass[car] + 0.5);
}

/** Milliseconds on the clock: the banked time, plus the run since `since` while it runs. */
export function clockMs(base: number, since: number, running: boolean, now: number) {
  return running ? base + Math.max(0, now - since) : base;
}

/** Ease out (cubic) over 0..1, clamped. */
export function easeOut(t: number) {
  const c = t < 0 ? 0 : t > 1 ? 1 : t;
  return 1 - (1 - c) * (1 - c) * (1 - c);
}

/** The value a count-up shows at progress t (0..1). */
export function countAt(to: number, t: number) {
  return Math.round(to * easeOut(t));
}

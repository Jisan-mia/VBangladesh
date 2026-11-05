// Code that runs on every pointermove of a drag and every frame of the end screen's count-up. Numbers in, numbers out, the
// drag state mutated in place: no objects, arrays, closures or strings are made here (npm run lint:games checks it).
// The drag state itself is made once, at setup, by makeDrag() in input.ts.
import type { Drag } from "./input";

/** Under this many CSS px a press is a tap, not a drag. */
export const TAP_PX = 10;
/** Let go past this fraction of a cell and the line lands. */
export const COMMIT_AT = 0.42;
/** A flick this fast (cells per ms, about 2.2 cells a second) lands the line from as little as FLICK_FROM of a cell. */
export const FLICK_SPEED = 0.0022;
export const FLICK_FROM = 0.12;

/** What letting go does: nothing (the line springs back), lands the dragged line, a tap on the pressed ঘুঁটি, or a swipe. */
export const Release = { None: 0, Land: 1, Tap: 2, Swipe: 3 } as const;

/** A finger (or mouse) goes down on `cell`. `axis` 0 = along x, 1 = along y, -1 when the cell isn't in the gap's line. */
export function pressDrag(d: Drag, id: number, cell: number, axis: number, sign: number, count: number, x: number, y: number, t: number) {
  d.id = id; d.cell = cell; d.axis = axis; d.sign = sign; d.count = count;
  d.x0 = x; d.y0 = y; d.x = x; d.y = y; d.offset = 0; d.lastOffset = 0; d.lastT = t; d.speed = 0; d.moved = 0;
}

/**
 * The finger moves: returns the line's offset in cells toward the gap (0..1). It follows the finger one to one, resists a
 * little backwards and past the gap, and keeps a smoothed speed for flicks.
 */
export function moveDrag(d: Drag, x: number, y: number, t: number, cellPx: number) {
  if (d.id < 0) return 0;
  d.x = x; d.y = y;
  const dx = x - d.x0, dy = y - d.y0, far = Math.sqrt(dx * dx + dy * dy);
  if (far > d.moved) d.moved = far;
  if (d.axis < 0 || cellPx <= 0) return 0;
  const along = (d.axis === 0 ? dx : dy) * d.sign / cellPx;
  const offset = along < 0 ? Math.max(-0.08, along * 0.2) : along > 1 ? Math.min(1.04, 1 + (along - 1) * 0.1) : along;
  const dt = t - d.lastT;
  if (dt > 0) {
    const instant = (offset - d.lastOffset) / dt;
    d.speed = d.speed * 0.4 + instant * 0.6;
    d.lastOffset = offset; d.lastT = t;
  }
  d.offset = offset;
  return offset;
}

/** What the release does, by how far and how fast the finger went. */
export function releaseOf(d: Drag) {
  if (d.id < 0) return Release.None;
  if (d.moved < TAP_PX) return Release.Tap;
  if (d.axis >= 0) {
    if (d.offset >= COMMIT_AT || (d.speed >= FLICK_SPEED && d.offset >= FLICK_FROM)) return Release.Land;
    if (d.offset >= FLICK_FROM) return Release.None;
  }
  return Release.Swipe;
}

/** The finger's direction for a swipe: 0 up, 1 down, 2 left, 3 right (the ঘুঁটি next to the gap moves that way). */
export function swipeDir(d: Drag) {
  const dx = d.x - d.x0, dy = d.y - d.y0;
  return Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? 3 : 2) : (dy > 0 ? 1 : 0);
}

/** Lifts the finger, or drops it on blur, hide, the player's pause or pointercancel: nothing counts as held any more. */
export function releaseDrag(d: Drag) {
  d.id = -1; d.axis = -1; d.offset = 0; d.speed = 0; d.moved = 0;
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

// One finger (or the mouse button) on the sand. Pure and mutable, so the statechart's bug path replays in a node test:
// a press lost in another window ends the stroke, hover never brushes, and a new press always starts a fresh stroke.
export type Hand = { on: boolean; id: number; x: number; y: number; moved: number; n: number };
export type PointerLike = { pointerId: number; isPrimary: boolean; pointerType: string; buttons: number };

export const createHand = (): Hand => ({ on: false, id: -1, x: 0, y: 0, moved: 0, n: 0 });
/** The stroke number: every press is a new one, so deep sand can tell "the same stroke again" from "brushed again". */
export const strokeOf = (hand: Hand) => hand.n;

const held = (e: PointerLike) => e.pointerType !== "mouse" || (e.buttons & 1) === 1;

/** A press. Only the first finger counts (a palm or a second finger is ignored), and a mouse needs its left button down. */
export function press(hand: Hand, e: PointerLike, x: number, y: number): boolean {
  if (!e.isPrimary || !held(e)) return false;
  hand.on = true; hand.id = e.pointerId; hand.x = x; hand.y = y; hand.moved = 0; hand.n += 1;
  return true;
}

/** A move. Returns the distance since the last point, 0 when it isn't ours, or -1 when the button is no longer down (the stroke ends). */
export function drag(hand: Hand, e: PointerLike, x: number, y: number): number {
  if (!hand.on || hand.id !== e.pointerId) return 0;
  if (!held(e)) { release(hand); return -1; }
  const length = Math.hypot(x - hand.x, y - hand.y);
  hand.x = x; hand.y = y; hand.moved += length;
  return length;
}

/** The finger lifts. Returns "tap" when it hardly moved (the caller clears a bigger patch), "stroke" otherwise, "none" when it wasn't ours. */
export function lift(hand: Hand, e: Pick<PointerLike, "pointerId">): "tap" | "stroke" | "none" {
  if (!hand.on || hand.id !== e.pointerId) return "none";
  hand.on = false;
  return hand.moved < 12 ? "tap" : "stroke";
}

/** The press is gone without a lift: pointercancel, lostpointercapture, window blur, the tab hiding, the pause menu, the sand leaving. */
export function release(hand: Hand) { hand.on = false; hand.id = -1; }

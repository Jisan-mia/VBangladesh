// One finger or mouse button turning a hand: the gesture's state, as the clock face sees it. Pure, so the bug paths replay in node.
// Rules: only the first pointer counts; a hand moves only while a button or finger is down; a press lost in another window ends
// the drag; a new item starts clean.
import type { Hand } from "./hands";

export type Gesture = { id: number; x: number; y: number; hand: Hand | null; moved: boolean };
export type Holder = { current: Gesture | null };
export type DownEvent = { pointerId: number; isPrimary: boolean; button: number; clientX: number; clientY: number };
export type MoveEvent = { pointerId: number; buttons: number; clientX: number; clientY: number };

/** A press that moves less than this is a tap. */
export const SLOP = 8;

/** A press starts a gesture only if none is held and it is the first pointer and the main button. */
export function down(holder: Holder, event: DownEvent): boolean {
  if (holder.current || !event.isPrimary || event.button !== 0) return false;
  holder.current = { id: event.pointerId, x: event.clientX, y: event.clientY, hand: null, moved: false };
  return true;
}

export type Moved = "none" | "begin" | "drag" | "lost";
/** A move. "lost" means no button is down any more (it came up in another window): the gesture is dropped, the hand stays. */
export function move(holder: Holder, event: MoveEvent): Moved {
  const g = holder.current;
  if (!g || g.id !== event.pointerId) return "none";
  if ((event.buttons & 1) === 0) { holder.current = null; return "lost"; }
  if (!g.moved) {
    if (Math.hypot(event.clientX - g.x, event.clientY - g.y) < SLOP) return "none";
    g.moved = true;
    return "begin";
  }
  return "drag";
}

/** The finger comes up: the finished gesture (a tap if it never moved), or null if it isn't ours. */
export function up(holder: Holder, pointerId: number): Gesture | null {
  const g = holder.current;
  if (!g || g.id !== pointerId) return null;
  holder.current = null;
  return g;
}

/** Cancel, lost capture, blur, hide, the player's pause, a new item: whatever turn was in flight is over. Returns it so the hand can click in. */
export function drop(holder: Holder): Gesture | null {
  const g = holder.current;
  holder.current = null;
  return g;
}

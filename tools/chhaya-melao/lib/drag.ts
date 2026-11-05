// One finger or mouse button carrying a toy: the gesture's state, as the shelf sees it. Pure, so the bug paths replay in node.
// Rules: only the first pointer counts; a toy moves only while a button or finger is down; a press lost in another window ends
// the drag; a press that barely moves is a tap (tap a toy, then tap a shadow).

export type Gesture = { id: number; x: number; y: number; toy: number; moved: boolean };
export type Holder = { current: Gesture | null };
export type DownEvent = { pointerId: number; isPrimary: boolean; button: number; clientX: number; clientY: number };
export type MoveEvent = { pointerId: number; buttons: number; clientX: number; clientY: number };

/** A press that moves less than this is a tap. */
export const SLOP = 8;

/** A press starts a gesture only if none is held and it is the first pointer and the main button. */
export function down(holder: Holder, event: DownEvent, toy: number): boolean {
  if (holder.current || !event.isPrimary || event.button !== 0) return false;
  holder.current = { id: event.pointerId, x: event.clientX, y: event.clientY, toy, moved: false };
  return true;
}

export type Moved = "none" | "begin" | "drag" | "lost";
/** A move. "lost" means no button is down any more (it came up in another window): the gesture is dropped. */
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

/** Cancel, lost capture, blur, hide, the player's pause, a new wall: whatever was in the hand is over. Returns it so the toy can go home. */
export function drop(holder: Holder): Gesture | null {
  const g = holder.current;
  holder.current = null;
  return g;
}

/** How near a toy must come to a shadow of `size` px to count as on it: generous, never under 56 px. */
export const reach = (size: number) => Math.max(56, size * 0.75);

/**
 * The open shadow a toy at (x, y) is on: the nearest centre within reach, or -1. `centers` holds x0, y0, x1, y1…; `open[i]` is false
 * for a shadow already matched.
 */
export function nearest(x: number, y: number, centers: readonly number[], open: readonly boolean[], size: number): number {
  let best = -1, bestDistance = reach(size);
  for (let slot = 0; slot < open.length; slot++) {
    if (!open[slot]) continue;
    const distance = Math.hypot(x - centers[slot * 2], y - centers[slot * 2 + 1]);
    if (distance <= bestDistance) { best = slot; bestDistance = distance; }
  }
  return best;
}

/** The toy a number key picks, and the shadow an arrow key aims at: wraps over the open ones. */
export function aimNext(open: readonly boolean[], from: number, direction: number): number {
  const count = open.length;
  for (let step = 1; step <= count; step++) {
    const slot = ((from + direction * step) % count + count) % count;
    if (open[slot]) return slot;
  }
  return -1;
}

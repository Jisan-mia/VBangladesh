// A tap is a finger that goes down and comes up on the same thing, close by, soon after. A finger that starts a scroll
// (the browser cancels it) or slides away is not a tap, so a child who scrolls with a finger on the pond counts no fish.
// Pure, so tests/session.test.ts replays the scroll bug against it.
export const TAP_SLOP = 12;
export const TAP_MS = 800;

export type Press = { id: number; x: number; y: number; at: number; target: unknown };
type Down = { pointerId: number; isPrimary: boolean; button: number; clientX: number; clientY: number; timeStamp: number };
type Up = { pointerId: number; clientX: number; clientY: number; timeStamp: number };

/** Only the first finger and the main mouse button start a press: a second finger or a palm is ignored. */
export const pressStart = (e: Down, target: unknown): Press | null =>
  e.isPrimary && e.button <= 0 ? { id: e.pointerId, x: e.clientX, y: e.clientY, at: e.timeStamp, target } : null;

/** True when this lift completes the press as a tap on the same target. */
export function pressEnd(press: Press | null, e: Up, target: unknown): boolean {
  if (!press || press.id !== e.pointerId || press.target !== target) return false;
  return Math.hypot(e.clientX - press.x, e.clientY - press.y) <= TAP_SLOP && e.timeStamp - press.at <= TAP_MS;
}

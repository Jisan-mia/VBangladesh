// The page around the tray: which screen shows, the player's pause, window focus, a press in flight, the shake's rattle and
// what gets celebrated. Pure, so the statechart's bug paths replay in node tests (tests/session.test.ts); the component
// forwards events here and does what syncLoops asks.
export type Screen = "title" | "intro" | "play" | "over";

/** A press this soon after চালিয়ে যাও only wakes the game; the click that brings focus back is never a move. */
export const RESUME_GUARD = 250;
/** The end screen ignores keys for this long after it appears, so a key held through the last move never skips it. */
export const RESULT_GUARD = 450;

export type Session = {
  screen: Screen;
  /** The player's menu is open, or সব লেভেল is, or a choice. */
  paused: boolean;
  focused: boolean;
  visible: boolean;
  /** A finger or mouse button is down on the tray, waiting to travel far enough to be a swap. */
  pressing: boolean;
  sound: boolean;
  /** The tray is shaking (nothing left to swap). */
  shaking: boolean;
  /** The rattle loop this session started and hasn't stopped. */
  rattle: boolean;
  overAt: number;
  resumeAt: number;
  /** The end-of-level notes (stars, the call) are scheduled until this time. */
  cheerUntil: number;
};

export const createSession = (sound: boolean): Session =>
  ({ screen: "title", paused: false, focused: true, visible: true, pressing: false, sound, shaking: false, rattle: false, overAt: 0, resumeAt: -Infinity, cheerUntil: 0 });

/** The tray takes presses only on the play screen, with nothing over it, the tab showing and the window focused. */
export const live = (s: Session) => s.screen === "play" && !s.paused && s.focused && s.visible;
/** A press or key at event time `now` may pick or swap: the tray is live, and it isn't the wake-up after a pause. */
export const canMove = (s: Session, now: number) => live(s) && now - s.resumeAt >= RESUME_GUARD;

/** The rattle sounds while the tray shakes on a live screen with sound on, never paused, away or muted. */
export const wantRattle = (s: Session) => live(s) && s.sound && s.shaking;

export type Loops = { start: (kind: "rattle") => void; stop: (kind: "rattle") => void };
export function syncLoops(s: Session, loops: Loops) {
  const rattle = wantRattle(s);
  if (rattle !== s.rattle) { s.rattle = rattle; if (rattle) loops.start("rattle"); else loops.stop("rattle"); }
}

/** Window blur (real, or the player's synthetic one): a press in flight never finishes as a swap. */
export function blur(s: Session) { s.focused = false; s.pressing = false; }
/** The window is back. With `now`, the click that brought it back is not a press (it only wakes the tray). */
export function focus(s: Session, now?: number) { s.focused = true; if (now !== undefined) s.resumeAt = now; }
export function hide(s: Session) { s.visible = false; s.focused = false; s.pressing = false; }
export function show(s: Session, now?: number) { s.visible = true; s.focused = true; if (now !== undefined) s.resumeAt = now; }
/** The player's menu, সব লেভেল or a choice, opened. */
export function pause(s: Session) { s.paused = true; s.pressing = false; }
/** চালিয়ে যাও: fresh hands, and a short breath before a press counts. */
export function resume(s: Session, now: number) { s.paused = false; s.pressing = false; s.resumeAt = now; }
/** The site-wide switch. Turning it off has already stopped every loop in the kit. */
export function setSound(s: Session, on: boolean) { s.sound = on; if (!on) s.rattle = false; }
export function goTo(s: Session, screen: Screen, at = 0) {
  s.screen = screen;
  s.pressing = false;
  if (screen === "over") s.overAt = at;
}
export function press(s: Session, now: number) { s.pressing = canMove(s, now); return s.pressing; }
export function release(s: Session) { s.pressing = false; }

/** A press-move counts only while a real press is down: a mouse that moves with no button held is not a swap. */
export const dragCounts = (s: Session, event: { buttons: number; pointerType: string }) => s.pressing && (event.pointerType !== "mouse" || event.buttons > 0);

/**
 * A new run starts: whatever the last one scheduled (its stars, its call) is cut, and nothing of it can play on this one.
 * `silence` is the kit's silenceScheduled.
 */
export function startRun(s: Session, silence: () => void) { silence(); s.cheerUntil = 0; s.shaking = false; }
/** The result's notes were scheduled `ms` ahead of `now`. */
export function cheer(s: Session, now: number, ms: number) { s.cheerUntil = now + ms; }
export const cheering = (s: Session, now: number) => now < s.cheerUntil;

/** End screen keys: a fresh, non-repeating keydown that arrived a moment after the screen appeared. */
export const freshResultKey = (s: Session, event: { timeStamp: number; repeat: boolean }) =>
  s.screen === "over" && !s.paused && !event.repeat && event.timeStamp > s.overAt + RESULT_GUARD;

// The page around the walker: which screen shows, the player's pause, window focus, the level list, the finger on the board
// and the result keys. Pure, so the statechart's bug paths replay in node tests (tests/session.test.ts); the component
// only forwards events here and asks before it steers.
export type Screen = "title" | "intro" | "play" | "over";

export type Session = {
  screen: Screen;
  /** The player's menu is open. */
  paused: boolean;
  focused: boolean;
  visible: boolean;
  /** The level list is open (a choice screen: nothing runs behind it). */
  sheet: boolean;
  /** The pointer on the board, if one is down. */
  drag: number | null;
  /** Set by a blur: the click that brings the window back only wakes the game. */
  wake: boolean;
  /** Event time the window came back. */
  focusAt: number;
  /** Event time the result screen appeared: its keys count only from a fresh press after it. */
  overAt: number;
};

/** A click this soon after the window comes back is the click that brought it back. */
export const WAKE_MS = 500;

export const createSession = (): Session =>
  ({ screen: "title", paused: false, focused: true, visible: true, sheet: false, drag: null, wake: false, focusAt: -Infinity, overAt: 0 });

/** The walker and the clock move only on the play screen, with the menu and the list shut, the tab showing and the window focused. */
export const ticking = (s: Session) => s.screen === "play" && !s.paused && !s.sheet && s.focused && s.visible;
/** Input steers only while the game ticks. */
export const canSteer = ticking;

const letGo = (s: Session) => { s.drag = null; };

/** Window blur (real, or the player's synthetic one): no finger stays down, because its pointerup may never come. */
export function blur(s: Session) { s.focused = false; s.wake = true; letGo(s); }
export function focus(s: Session, at: number) { s.focused = true; s.focusAt = at; }
export function hide(s: Session) { s.visible = false; s.focused = false; s.wake = true; letGo(s); }
export function show(s: Session, at: number) { s.visible = true; s.focused = true; s.focusAt = at; }
/** The player's menu opened. */
export function pause(s: Session) { s.paused = true; letGo(s); }
/** চালিয়ে যাও: the menu took the click, so there's nothing left to wake. */
export function resume(s: Session) { s.paused = false; s.wake = false; letGo(s); }
export function openSheet(s: Session) { s.sheet = true; letGo(s); }
export function closeSheet(s: Session) { s.sheet = false; }

export function goTo(s: Session, screen: Screen, at = 0) {
  s.screen = screen;
  s.sheet = false;
  letGo(s);
  if (screen === "over") s.overAt = at;
}

/**
 * A finger or button goes down on the board. "steer": it counts (a swipe or a tap may follow). "wake": it's the click
 * that brought the window back, and does nothing else. "ignore": the game isn't taking input.
 */
export function pointerDown(s: Session, id: number, at: number): "steer" | "wake" | "ignore" {
  const waking = s.wake && at - s.focusAt < WAKE_MS;
  s.wake = false;
  if (waking) return "wake";
  if (!canSteer(s)) return "ignore";
  s.drag = id;
  return "steer";
}
/** A move counts only for the pointer that went down here, and a mouse only with its button still held. */
export const pointerMoves = (s: Session, id: number, mouse: boolean, buttons: number) => s.drag === id && canSteer(s) && (!mouse || buttons !== 0);
export function pointerUp(s: Session, id: number) { if (s.drag === id) { s.drag = null; return true; } return false; }
/** Any key wakes the game too (it can only arrive with the window focused). */
export function keyDown(s: Session) { s.wake = false; return canSteer(s); }

/** Result screen keys: a fresh, non-repeating keydown that arrived after the screen appeared. */
export const freshResultKey = (s: Session, event: { timeStamp: number; repeat: boolean }) => s.screen === "over" && !s.paused && !s.sheet && !event.repeat && event.timeStamp > s.overAt;

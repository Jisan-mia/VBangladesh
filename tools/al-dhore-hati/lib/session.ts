// The page around the walk: which screen shows, the player's pause, window focus, the held sides, and the wind loop.
// Pure, so the statechart's bug paths replay in node tests (tests/session.test.ts); the component only forwards events
// here and does what syncLoops asks.
import { PH_WALK, type Game } from "./rules";

export type Screen = "title" | "intro" | "ready" | "play" | "over";

/** Presses this soon after চালিয়ে যাও (or the window coming back) only wake the game; they never steer. */
export const RESUME_GUARD = 250;
/** The end screen and the ready card ignore keys for this long after they appear, so a key pressed as the field ended never skips them. */
export const RESULT_GUARD = 450;
/** A finger that moves this many CSS px is dragging, not holding a side. */
export const DRAG_START = 8;

/** A finger on the field: the side it started on, where it is, and whether it has become a drag. */
export type Press = { side: number; x: number; drag: boolean };

export type Session = {
  screen: Screen;
  /** The player's menu is open. */
  paused: boolean;
  /** The level list is open (it stops the game like the menu does). */
  sheet: boolean;
  focused: boolean;
  visible: boolean;
  /** ← / A and → / D are physically down. */
  left: boolean;
  right: boolean;
  /** Fingers on the field, by pointer id. */
  presses: Map<number, Press>;
  sound: boolean;
  /** The wind loop this session started and hasn't stopped. */
  wind: boolean;
  /** Event times (ms): when the end screen and the ready card appeared, and when play last resumed. */
  overAt: number;
  readyAt: number;
  resumeAt: number;
};

export const createSession = (sound: boolean): Session => ({
  screen: "title", paused: false, sheet: false, focused: true, visible: true, left: false, right: false, presses: new Map(),
  sound, wind: false, overAt: 0, readyAt: 0, resumeAt: -Infinity,
});

/** The walk steps only on the play screen, with the menu and the list shut, the tab showing and the window focused. */
export const ticking = (s: Session) => s.screen === "play" && !s.paused && !s.sheet && s.focused && s.visible;
/** A press at event time `now` may steer: the game steps, and it isn't the wake-up after a pause or a return. */
export const canSteer = (s: Session, now: number) => ticking(s) && now - s.resumeAt >= RESUME_GUARD;

/** The wind plays through a windy or gusty field, never paused, away, muted or once the field is over. */
export const wantWind = (s: Session, game: Game) => ticking(s) && s.sound && (game.spec.wind > 0 || game.spec.gusts > 0) && game.phase === PH_WALK;

export type Loops = { start: () => void; stop: () => void };
/** Starts or stops the wind to match what the session wants. Called every step and after every event below. */
export function syncLoops(s: Session, game: Game, loops: Loops) {
  const wind = wantWind(s, game);
  if (wind !== s.wind) { s.wind = wind; if (wind) loops.start(); else loops.stop(); }
}

/** Lets go of every key and finger. Their keyup and pointerup go to whatever window has focus, so they may never come. */
export function clearInput(s: Session) { s.left = s.right = false; s.presses.clear(); }

/** The held side the feet follow: ← and → together cancel, and every finger holding a side adds its own. A dragging finger steers alone. */
export function holdOf(s: Session) {
  let sum = (s.right ? 1 : 0) - (s.left ? 1 : 0), dragging = false;
  for (const press of s.presses.values()) { if (press.drag) dragging = true; else sum += press.side; }
  return { dir: dragging ? 0 : sum > 0 ? 1 : sum < 0 ? -1 : 0, dragging };
}

/** Window blur (real, or the player's synthetic one): nothing held counts any more. */
export function blur(s: Session) { s.focused = false; clearInput(s); }
export function focus(s: Session, now: number) { s.focused = true; s.resumeAt = now; }
export function hide(s: Session) { s.visible = false; s.focused = false; clearInput(s); }
export function show(s: Session, now: number) { s.visible = true; s.focused = true; s.resumeAt = now; }
/** The player's menu opened. */
export function pause(s: Session) { s.paused = true; clearInput(s); }
/** চালিয়ে যাও: fresh hands, and a short breath before a press counts. */
export function resume(s: Session, now: number) { s.paused = false; clearInput(s); s.resumeAt = now; }
export function openSheet(s: Session) { s.sheet = true; clearInput(s); }
export function closeSheet(s: Session, now: number) { s.sheet = false; clearInput(s); s.resumeAt = now; }
/** The site-wide switch. Turning it off has already stopped every loop in the kit. */
export function setSound(s: Session, on: boolean) { s.sound = on; if (!on) s.wind = false; }

export function goTo(s: Session, screen: Screen, at = 0) {
  s.screen = screen;
  clearInput(s);
  if (screen === "over") s.overAt = at;
  if (screen === "ready") s.readyAt = at;
}

/** A finger lands. True when it counts (the game steps and it isn't the wake-up press): it then holds its half of the field. */
export function press(s: Session, id: number, side: number, x: number, now: number) {
  if (!canSteer(s, now)) return false;
  s.presses.set(id, { side, x, drag: false });
  return true;
}
/** A finger moves: becomes a drag once it has travelled DRAG_START px. Returns the movement since last time (px), or null if it isn't a drag yet. */
export function move(s: Session, id: number, x: number) {
  const p = s.presses.get(id);
  if (!p) return null;
  if (!p.drag) { if (Math.abs(x - p.x) < DRAG_START) return null; p.drag = true; }
  const dx = x - p.x;
  p.x = x;
  return dx;
}
export function release(s: Session, id: number) { return s.presses.delete(id); }

/** ← / → / A / D. True when it was one of them. Ignored while the game doesn't step. */
export function keyDown(s: Session, key: string) {
  const k = key.toLowerCase(), isLeft = k === "arrowleft" || k === "a", isRight = k === "arrowright" || k === "d";
  if (!isLeft && !isRight) return false;
  if (!ticking(s)) return true;
  if (isLeft) s.left = true; else s.right = true;
  return true;
}
export function keyUp(s: Session, key: string) {
  const k = key.toLowerCase();
  if (k === "arrowleft" || k === "a") s.left = false;
  else if (k === "arrowright" || k === "d") s.right = false;
}

/** Result-screen and ready-card keys: a fresh, non-repeating keydown that arrived a moment after the screen appeared. */
export const freshKey = (s: Session, screen: Screen, event: { timeStamp: number; repeat: boolean }) =>
  s.screen === screen && !s.paused && !s.sheet && !event.repeat && event.timeStamp > (screen === "over" ? s.overAt : s.readyAt) + RESULT_GUARD;

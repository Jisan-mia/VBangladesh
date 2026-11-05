// The page around the game: which screen shows, the player's pause, window focus, the drop key, and the wind loop.
// Pure, so the statechart's bug paths replay in node tests (tests/session.test.ts); the component only forwards events
// here and does what syncLoops asks.
import type { Game } from "./rules";

export type Screen = "title" | "intro" | "play" | "over";

/** Taps and keys this soon after চালিয়ে যাও only wake the game; they never drop a sack. */
export const RESUME_GUARD = 250;
/** The end screen ignores keys for this long after it appears, so a drop pressed as the pile fell never skips it. */
export const RESULT_GUARD = 450;

export type Session = {
  screen: Screen;
  /** The player's menu is open, or a choice sheet is. */
  paused: boolean;
  focused: boolean;
  visible: boolean;
  /** Space, Enter or ↓ is physically down. */
  held: boolean;
  sound: boolean;
  /** The wind loop this session started and hasn't stopped. */
  wind: boolean;
  /** Event times (ms) the end screen appeared and play last resumed. */
  overAt: number;
  resumeAt: number;
};

export const createSession = (sound: boolean): Session =>
  ({ screen: "title", paused: false, focused: true, visible: true, held: false, sound, wind: false, overAt: 0, resumeAt: -Infinity });

/** The game steps only on the play screen, with the menu shut, the tab showing and the window focused. */
export const ticking = (s: Session) => s.screen === "play" && !s.paused && s.focused && s.visible;
/** A tap or key at event time `now` may drop a sack: the game steps, and it isn't the wake-up after a pause. */
export const canDrop = (s: Session, now: number) => ticking(s) && now - s.resumeAt >= RESUME_GUARD;

/** The wind loop plays through a gusty level, never paused, away, muted, or once the round is over. */
export const wantWind = (s: Session, game: Game) => ticking(s) && s.sound && game.def.gusts > 0 && game.started && game.phase !== "end" && game.phase !== "over";

export type Loops = { start: (kind: "wind") => void; stop: (kind: "wind") => void };
/** Starts or stops the wind to match what the session wants. Called every step and after every event below. */
export function syncLoops(s: Session, game: Game, loops: Loops) {
  const wind = wantWind(s, game);
  if (wind !== s.wind) { s.wind = wind; if (wind) loops.start("wind"); else loops.stop("wind"); }
}

/** Window blur (real, or the player's synthetic one): the key's keyup never comes, so it doesn't count as held. */
export function blur(s: Session) { s.focused = false; s.held = false; }
export function focus(s: Session) { s.focused = true; }
export function hide(s: Session) { s.visible = false; s.focused = false; s.held = false; }
export function show(s: Session) { s.visible = true; s.focused = true; }
/** The player's menu (or the level list) opened. */
export function pause(s: Session) { s.paused = true; s.held = false; }
/** চালিয়ে যাও: fresh hands, and a short breath before a tap counts. */
export function resume(s: Session, now: number) { s.paused = false; s.held = false; s.resumeAt = now; }
/** The site-wide switch. Turning it off has already stopped every loop in the kit. */
export function setSound(s: Session, on: boolean) { s.sound = on; if (!on) s.wind = false; }

export function goTo(s: Session, screen: Screen, at = 0) {
  s.screen = screen;
  if (screen === "over") s.overAt = at;
}

/** A drop key goes down. True when it should drop: a fresh press (never the browser's auto-repeat) while the game steps. */
export function keyDown(s: Session, event: { repeat: boolean; timeStamp: number }) {
  const fresh = !event.repeat && !s.held;
  s.held = true;
  return fresh && canDrop(s, event.timeStamp);
}
export function keyUp(s: Session) { s.held = false; }

/** End screen keys: a fresh, non-repeating keydown that arrived a moment after the screen appeared. */
export const freshResultKey = (s: Session, event: { timeStamp: number; repeat: boolean }) =>
  s.screen === "over" && !s.paused && !event.repeat && event.timeStamp > s.overAt + RESULT_GUARD;

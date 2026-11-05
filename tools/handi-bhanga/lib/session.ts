// The page around the stall: which screen shows, the player's pause, the level list, window focus, whether the stall is on
// screen, the held keys and the finger or mouse on the stall, and the wind loop. Pure, so the statechart's bug paths replay
// in node tests (tests/session.test.ts); the component only forwards events here and does what it says.
import type { Game } from "./rules";

export type Screen = "title" | "intro" | "play" | "over";

/** Taps and keys this soon after চালিয়ে যাও (or closing the level list) only wake the game; they never throw. */
export const RESUME_GUARD = 250;
/** The end screen ignores keys for this long after it appears, so a throw pressed as the last pot fell never skips it. */
export const RESULT_GUARD = 450;

/** What a finger (or the mouse) on the stall is doing: aiming a resting ball, or moving the লাঠি under a flying one. */
export type Hand = "" | "aim" | "move";

export type Session = {
  screen: Screen;
  /** The player's menu is open. */
  paused: boolean;
  /** The level list is open (a choice screen: play waits). */
  sheet: boolean;
  focused: boolean;
  visible: boolean;
  /** The stall is on screen (a desktop page can scroll it away). */
  inView: boolean;
  /** ← and → (or A and D) are physically down, and a throw key (Space, Enter, ↑). */
  left: boolean; right: boolean; throwHeld: boolean;
  /** The pointer that pressed on the stall (-1: none), and what it's doing. */
  pointer: number; hand: Hand;
  sound: boolean;
  /** The wind loop this session started and hasn't stopped. */
  wind: boolean;
  /** Event times (ms) the end screen appeared and play last resumed. */
  overAt: number;
  resumeAt: number;
};

export const createSession = (sound: boolean): Session => ({
  screen: "title", paused: false, sheet: false, focused: true, visible: true, inView: true,
  left: false, right: false, throwHeld: false, pointer: -1, hand: "", sound, wind: false, overAt: 0, resumeAt: -Infinity,
});

/** The stall steps only on the play screen, with the menu and the level list shut, the tab showing, the window focused and the stall on screen. */
export const ticking = (s: Session) => s.screen === "play" && !s.paused && !s.sheet && s.focused && s.visible && s.inView;
/** A tap or key at event time `now` may act: the stall steps, and it isn't the wake-up after a pause. */
export const canAct = (s: Session, now: number) => ticking(s) && now - s.resumeAt >= RESUME_GUARD;

/** Every key and finger lets go; an aim in progress is dropped, never thrown. */
export function release(s: Session) { s.left = false; s.right = false; s.throwHeld = false; s.pointer = -1; s.hand = ""; }

/** Window blur (real, or the player's synthetic one): no keyup or pointerup will come. */
export function blur(s: Session) { s.focused = false; release(s); }
export function focus(s: Session) { s.focused = true; }
export function hide(s: Session) { s.visible = false; s.focused = false; release(s); }
export function show(s: Session) { s.visible = true; s.focused = true; }
/** The stall scrolled off or back on screen. */
export function setInView(s: Session, inView: boolean) { s.inView = inView; if (!inView) release(s); }
/** The player's menu opened. */
export function pause(s: Session) { s.paused = true; release(s); }
/** চালিয়ে যাও: fresh hands, and a short breath before a tap counts. */
export function resume(s: Session, now: number) { s.paused = false; release(s); s.resumeAt = now; }
/** The level list opens over the stall (it pauses play) and closes again. */
export function openSheet(s: Session) { s.sheet = true; release(s); }
export function closeSheet(s: Session, now: number) { s.sheet = false; release(s); s.resumeAt = now; }
/** The site-wide switch. Turning it off has already stopped every loop in the kit. */
export function setSound(s: Session, on: boolean) { s.sound = on; if (!on) s.wind = false; }

export function goTo(s: Session, screen: Screen, at = 0) {
  s.screen = screen;
  release(s);
  if (screen === "over") s.overAt = at;
}

/** A finger or the mouse presses on the stall. True when it takes hold (aiming or moving); false when it only wakes the game. */
export function pointerDown(s: Session, event: { pointerId: number; timeStamp: number }, hand: Exclude<Hand, "">) {
  if (!canAct(s, event.timeStamp)) return false;
  s.pointer = event.pointerId;
  s.hand = hand;
  return true;
}
/** A move counts only for the pointer that pressed, and only while a mouse still has a button down. */
export function pointerMove(s: Session, event: { pointerId: number; pointerType: string; buttons: number }) {
  if (event.pointerId !== s.pointer || !ticking(s)) return false;
  if (event.pointerType === "mouse" && event.buttons === 0) { s.pointer = -1; s.hand = ""; return false; }
  return true;
}
/** The finger lifts. Returns what it was doing (an aim throws), or "" when it no longer counted. */
export function pointerUp(s: Session, event: { pointerId: number }): Hand {
  if (event.pointerId !== s.pointer) return "";
  const hand = s.hand;
  s.pointer = -1; s.hand = "";
  return ticking(s) ? hand : "";
}

/** A throw key goes down. True when it should throw: a fresh press (never the browser's auto-repeat) while the stall steps. */
export function throwKeyDown(s: Session, event: { repeat: boolean; timeStamp: number }) {
  const fresh = !event.repeat && !s.throwHeld;
  s.throwHeld = true;
  return fresh && canAct(s, event.timeStamp);
}
export function throwKeyUp(s: Session) { s.throwHeld = false; }
/** ← → go down or up. They count only while the stall steps. */
export function arrow(s: Session, side: "left" | "right", down: boolean) { s[side] = down && ticking(s); }
/** The held arrows as a direction: -1, 0 or 1. */
export const steer = (s: Session) => ticking(s) ? (s.right ? 1 : 0) - (s.left ? 1 : 0) : 0;

/** The wind loop plays through a windy stall while it steps with sound on, never paused, away, muted, or once the stall is done. */
export const wantWind = (s: Session, game: Game) => ticking(s) && s.sound && game.def.wind > 0 && (game.phase === "aim" || game.phase === "fly");

export type Loops = { start: (kind: "wind") => void; stop: (kind: "wind") => void };
/** Starts or stops the wind to match what the session wants. Called every step and after every event above. */
export function syncLoops(s: Session, game: Game, loops: Loops) {
  const wind = wantWind(s, game);
  if (wind !== s.wind) { s.wind = wind; if (wind) loops.start("wind"); else loops.stop("wind"); }
}

/** End screen keys: a fresh, non-repeating keydown that arrived a moment after the screen appeared, with nothing over it. */
export const freshResultKey = (s: Session, event: { timeStamp: number; repeat: boolean }) =>
  s.screen === "over" && !s.paused && !s.sheet && !event.repeat && event.timeStamp > s.overAt + RESULT_GUARD;

// The page around the game: which screen shows, the player's pause, window focus, the hand on the dial, and which sound
// loops should be playing. Pure, so the statechart's bug paths replay in node tests (tests/session.test.ts);
// the component only forwards events here and does what syncLoops asks.
import type { Game } from "./antenna";

export type Screen = "title" | "intro" | "play" | "over";

export type Session = {
  screen: Screen;
  /** The player's menu is open. */
  paused: boolean;
  focused: boolean;
  visible: boolean;
  /** A held ◀ ▶ button or arrow key: -1, 0 or 1, and for how long. */
  hold: number;
  holdTime: number;
  /** The pointer turning the dial, if any. */
  drag: number | null;
  /** Degrees to turn on the next step (taps, the dial, the slider, the wheel). */
  pending: number;
  sound: boolean;
  /** The loops this session started and hasn't stopped. */
  hiss: boolean;
  wind: boolean;
  /** Event time the result screen appeared: result keys count only from a fresh press after it. */
  overAt: number;
};

export const createSession = (sound: boolean): Session =>
  ({ screen: "title", paused: false, focused: true, visible: true, hold: 0, holdTime: 0, drag: null, pending: 0, sound, hiss: false, wind: false, overAt: 0 });

/** The game steps only on the play screen, with the menu shut, the tab showing and the window focused. */
export const ticking = (s: Session) => s.screen === "play" && !s.paused && s.focused && s.visible;
/** Input counts only while the game steps. */
export const canTurn = ticking;

/** Static plays while there's snow to hear: before the first turn and while searching, never on a locked picture. */
export const wantHiss = (s: Session, game: Game) => ticking(s) && s.sound && (game.phase === "ready" || game.phase === "search");
/** The wind loop plays through a windy level's channels. */
export const wantWind = (s: Session, game: Game) => ticking(s) && s.sound && (game.def.wind > 0 || game.def.gusts) && game.phase !== "over";

export type Loops = { start: (kind: "hiss" | "wind") => void; stop: (kind: "hiss" | "wind") => void };
/** Starts or stops each loop to match what the session wants. Called every step and after every event below. */
export function syncLoops(s: Session, game: Game, loops: Loops) {
  const hiss = wantHiss(s, game), wind = wantWind(s, game);
  if (hiss !== s.hiss) { s.hiss = hiss; if (hiss) loops.start("hiss"); else loops.stop("hiss"); }
  if (wind !== s.wind) { s.wind = wind; if (wind) loops.start("wind"); else loops.stop("wind"); }
}

const letGo = (s: Session) => { s.hold = 0; s.holdTime = 0; s.drag = null; s.pending = 0; };

/** Window blur (real, or the player's synthetic one): no key or finger stays held, because its keyup never comes. */
export function blur(s: Session) { s.focused = false; letGo(s); }
export function focus(s: Session) { s.focused = true; }
export function hide(s: Session) { s.visible = false; s.focused = false; letGo(s); }
export function show(s: Session) { s.visible = true; s.focused = true; }
/** The player's menu opened. */
export function pause(s: Session) { s.paused = true; letGo(s); }
/** চালিয়ে যাও: fresh hands, nothing carried over from before the pause. */
export function resume(s: Session) { s.paused = false; letGo(s); }
/** The site-wide switch. Turning it off has already stopped every loop in the kit. */
export function setSound(s: Session, on: boolean) {
  s.sound = on;
  if (!on) { s.hiss = false; s.wind = false; }
}

export function goTo(s: Session, screen: Screen, at = 0) {
  s.screen = screen;
  letGo(s);
  if (screen === "over") s.overAt = at;
}

/** A turn button or arrow key goes down. Returns false (and holds nothing) when input doesn't count. */
export function press(s: Session, direction: number, tap: number) {
  if (!canTurn(s)) return false;
  s.pending += direction * tap;
  s.hold = direction;
  s.holdTime = 0;
  return true;
}
export function release(s: Session, direction?: number) { if (direction === undefined || s.hold === direction) { s.hold = 0; s.holdTime = 0; } }
export function nudge(s: Session, degrees: number) { if (canTurn(s)) s.pending += degrees; }

/** Holding turns 70°/s, then 120°/s after a second; 35°/s in slow mode. Adds to `pending`. */
export const HOLD_DELAY = 0.22;
export function holdStep(s: Session, dt: number, slow: boolean) {
  if (!s.hold) return;
  s.holdTime += dt;
  if (s.holdTime > HOLD_DELAY) s.pending += s.hold * (slow ? 35 : s.holdTime > 1.2 ? 120 : 70) * dt;
}
/** Takes the turn for this step. */
export function takeTurn(s: Session) { const turn = s.pending; s.pending = 0; return turn; }

/** Result screen keys: a fresh, non-repeating keydown that arrived after the screen appeared. */
export const freshResultKey = (s: Session, event: { timeStamp: number; repeat: boolean }) => s.screen === "over" && !s.paused && !event.repeat && event.timeStamp > s.overAt;

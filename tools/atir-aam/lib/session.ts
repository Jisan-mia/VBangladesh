// The page around the garden: which screen shows, the player's pause, window focus, a swipe in flight, the wind loop
// and what gets celebrated. Pure, so the statechart's bug paths replay in node tests (tests/session.test.ts); the
// component forwards events here and does what syncLoops asks.
import { TOP } from "./board";
import type { Game } from "./rules";

export type Screen = "title" | "intro" | "play" | "over";

/** Swipes this soon after চালিয়ে যাও only wake the game; the click that brings focus back is never a move. */
export const RESUME_GUARD = 250;
/** The end screen ignores keys for this long after it appears, so a key held through the last swipe never skips it. */
export const RESULT_GUARD = 450;

export type Session = {
  screen: Screen;
  /** The player's menu is open, or সব লেভেল is. */
  paused: boolean;
  focused: boolean;
  visible: boolean;
  /** A finger or mouse button is down on the bed, waiting to travel far enough to be a swipe. */
  pressing: boolean;
  sound: boolean;
  /** The wind loop this session started and hasn't stopped. */
  wind: boolean;
  overAt: number;
  resumeAt: number;
};

export const createSession = (sound: boolean): Session =>
  ({ screen: "title", paused: false, focused: true, visible: true, pressing: false, sound, wind: false, overAt: 0, resumeAt: -Infinity });

/** The bed takes swipes only on the play screen, with nothing over it, the tab showing and the window focused. */
export const live = (s: Session) => s.screen === "play" && !s.paused && s.focused && s.visible;
/** A swipe or key at event time `now` may move the plates: the bed is live, and it isn't the wake-up after a pause. */
export const canSwipe = (s: Session, now: number) => live(s) && now - s.resumeAt >= RESUME_GUARD;

/** The wind blows through a gust level while it is played, never paused, away, muted, choosing or over. */
export const wantWind = (s: Session, game: Game) => live(s) && s.sound && game.spec.gust > 0 && !game.over && !game.offer;

export type Loops = { start: (kind: "wind") => void; stop: (kind: "wind") => void };
export function syncLoops(s: Session, game: Game, loops: Loops) {
  const wind = wantWind(s, game);
  if (wind !== s.wind) { s.wind = wind; if (wind) loops.start("wind"); else loops.stop("wind"); }
}

/** Window blur (real, or the player's synthetic one): a press in flight never finishes as a swipe. */
export function blur(s: Session) { s.focused = false; s.pressing = false; }
export function focus(s: Session) { s.focused = true; }
export function hide(s: Session) { s.visible = false; s.focused = false; s.pressing = false; }
export function show(s: Session) { s.visible = true; s.focused = true; }
/** The player's menu, or সব লেভেল, opened. */
export function pause(s: Session) { s.paused = true; s.pressing = false; }
/** চালিয়ে যাও: fresh hands, and a short breath before a swipe counts. */
export function resume(s: Session, now: number) { s.paused = false; s.pressing = false; s.resumeAt = now; }
/** The site-wide switch. Turning it off has already stopped every loop in the kit. */
export function setSound(s: Session, on: boolean) { s.sound = on; if (!on) s.wind = false; }
export function goTo(s: Session, screen: Screen, at = 0) {
  s.screen = screen;
  s.pressing = false;
  if (screen === "over") s.overAt = at;
}
export function press(s: Session, now: number) { s.pressing = canSwipe(s, now); return s.pressing; }
export function release(s: Session) { s.pressing = false; }

/** End screen keys: a fresh, non-repeating keydown that arrived a moment after the screen appeared. */
export const freshResultKey = (s: Session, event: { timeStamp: number; repeat: boolean }) =>
  s.screen === "over" && !s.paused && !event.repeat && event.timeStamp > s.overAt + RESULT_GUARD;

/**
 * The confetti and fanfare for a big new stage (পাকা আম or more): only when this swipe raised the run's peak, and past
 * this phone's best. The peak survives ফেরত নাও, so taking a swipe back and making it again never celebrates twice.
 */
export const cheerOf = (before: Game, after: Game, bestStage: number) =>
  after.peak > before.peak && after.peak >= TOP - 2 && after.peak > bestStage ? after.peak : 0;
/** The new-stage line in the HUD belongs to the swipe that grew it; after ফেরত নাও it's gone with the stage. */
export const newsOf = (game: Game) => game.last && game.peak > (game.prev?.peak ?? 1) && game.top === game.peak ? game.peak : 0;

// The page around the class: which screen shows, the player's pause, window focus, the level list, the finger on the chit,
// the breath after coming back, and whether the chit's hum should be playing. Pure, so the statechart's bug paths replay in
// node tests (tests/session.test.ts); the component only forwards events here and does what syncHum asks.

export type Screen = "title" | "intro" | "play" | "over";

export type Session = {
  screen: Screen;
  /** The player's menu is open. */
  paused: boolean;
  focused: boolean;
  visible: boolean;
  /** The level list (a choice screen) is open. */
  sheet: boolean;
  sound: boolean;
  /** One-tap mode: a press starts the chit, the next stops it. */
  tapMode: boolean;
  /** The finger or key on the chit, as the rules read it. */
  held: boolean;
  /** The hum this session started and hasn't stopped. */
  hum: boolean;
  /** The class stopped ticking mid-play: on return it waits a short breath before moving again. */
  stale: boolean;
  /** Seconds of that breath left. */
  breath: number;
  /** Event time the result screen appeared: result keys count only from a fresh press after it. */
  overAt: number;
};

/** Seconds the class waits after you come back, so nothing turns the moment the menu closes. */
export const BREATH = 0.5;

export const createSession = (sound: boolean, tapMode = false): Session =>
  ({ screen: "title", paused: false, focused: true, visible: true, sheet: false, sound, tapMode, held: false, hum: false, stale: false, breath: 0, overAt: 0 });

/** The class steps only on the play screen, with the menu and the level list shut, the tab showing and the window focused. */
export const ticking = (s: Session) => s.screen === "play" && !s.paused && !s.sheet && s.focused && s.visible;
/** The hum plays only while the class runs on a focused, visible page with sound on (silent unless the chit moves). */
export const wantHum = (s: Session) => ticking(s) && s.sound;

export type Loops = { start: () => void; stop: () => void };
/** Starts or stops the hum to match what the session wants. Called every step and after every event below. */
export function syncHum(s: Session, loops: Loops) {
  const want = wantHum(s);
  if (want !== s.hum) { s.hum = want; if (want) loops.start(); else loops.stop(); }
}

/** Anything that stops the class: lets go of the chit (one-tap mode too) and marks the class for a breath on return. */
function away(s: Session, change: () => void) {
  const was = ticking(s);
  change();
  s.held = false;
  if (was && !ticking(s)) s.stale = true;
}

/** Window blur (real, or the player's synthetic one). */
export function blur(s: Session) { away(s, () => { s.focused = false; }); }
export function focus(s: Session) { s.focused = true; }
export function hide(s: Session) { away(s, () => { s.visible = false; s.focused = false; }); }
export function show(s: Session) { s.visible = true; s.focused = true; }
/** The player's menu opened. */
export function pause(s: Session) { away(s, () => { s.paused = true; }); }
/** চালিয়ে যাও. */
export function resume(s: Session) { s.paused = false; }
export function openSheet(s: Session) { away(s, () => { s.sheet = true; }); }
export function closeSheet(s: Session) { s.sheet = false; }
/**
 * The site-wide switch. Turning it off has already stopped every loop in the kit, so the hum counts as stopped; turning it on
 * lets syncHum start a fresh one (never a stub made while muted).
 */
export function setSound(s: Session, on: boolean) {
  s.sound = on;
  if (!on) s.hum = false;
}

export function goTo(s: Session, screen: Screen, at = 0) {
  s.screen = screen;
  s.stale = false; s.breath = 0; s.held = false;
  if (screen === "over") s.overAt = at;
}

/** Whenever the class may tick again (focus, show, চালিয়ে যাও, the list shut): if it stopped mid-play, a breath first. */
export function wake(s: Session) {
  if (!ticking(s) || !s.stale) return false;
  s.stale = false;
  s.breath = BREATH;
  return true;
}

/**
 * A press on the chit (pointerdown, or a key that isn't a repeat). Only while the class runs; one-tap mode toggles. During the
 * breath after coming back it is ignored: the click that brings focus back is not a move.
 */
export function press(s: Session) {
  if (!ticking(s) || s.breath > 0) return false;
  s.held = s.tapMode ? !s.held : true;
  return true;
}
/** The finger lifts or the key comes up. One-tap mode ignores it. */
export function release(s: Session) { if (!s.tapMode) s.held = false; }
/** A catch: one-tap mode lets go, so the chit doesn't walk on into the next look. */
export function caught(s: Session) { if (s.tapMode) s.held = false; }
export function setTapMode(s: Session, on: boolean) { s.tapMode = on; s.held = false; }

/** Result screen keys: a fresh, non-repeating keydown that arrived after the screen appeared. */
export const freshResultKey = (s: Session, event: { timeStamp: number; repeat: boolean }) =>
  s.screen === "over" && !s.paused && !s.sheet && !event.repeat && event.timeStamp > s.overAt;

// The page around the stove: which screen shows, the player's pause, window focus, the level list, the finger on the button,
// the breath after coming back, and whether the stove's hum should be playing. Pure, so the statechart's bug paths replay in
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
  /** The finger or key on the button, as the rules read it. */
  held: boolean;
  /** When it went down (event time, ms). */
  heldAt: number;
  /** A pot is on the stove with the foam rising. */
  rising: boolean;
  /** The hum this session started and hasn't stopped. */
  hum: boolean;
  /** The kitchen stopped ticking mid-play: on return it waits a short breath before moving again. */
  stale: boolean;
  /** Seconds of that breath left. */
  breath: number;
  /** Event time the result screen appeared: result keys count only from a fresh press after it. */
  overAt: number;
};

/** Seconds the milk waits after you come back, so nothing happens the moment the menu closes. */
export const BREATH = 0.5;
/** A press longer than this was a hold: letting go lifts the pot. A shorter one was a tap: the milk keeps heating until the next press. */
export const HOLD_MS = 260;

export const createSession = (sound: boolean): Session =>
  ({ screen: "title", paused: false, focused: true, visible: true, sheet: false, sound, held: false, heldAt: 0, rising: false, hum: false, stale: false, breath: 0, overAt: 0 });

/** The foam moves only on the play screen, with the menu and the level list shut, the tab showing and the window focused. */
export const ticking = (s: Session) => s.screen === "play" && !s.paused && !s.sheet && s.focused && s.visible;
/** The stove hums only while milk is rising on a focused, visible page with sound on. */
export const wantHum = (s: Session) => ticking(s) && s.sound && s.rising;

export type Loops = { start: () => void; stop: () => void };
/** Starts or stops the hum to match what the session wants. Called every step and after every event below. */
export function syncHum(s: Session, loops: Loops) {
  const want = wantHum(s);
  if (want !== s.hum) { s.hum = want; if (want) loops.start(); else loops.stop(); }
}

/** Anything that stops the kitchen: lets go of the button (no lift) and marks the pot for a breath on return. */
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
  s.stale = false; s.breath = 0; s.held = false; s.rising = false;
  if (screen === "over") s.overAt = at;
}

/** Whenever the kitchen may tick again (focus, show, চালিয়ে যাও, the list shut): if it stopped mid-play, a breath first. */
export function wake(s: Session) {
  if (!ticking(s) || !s.stale) return false;
  s.stale = false;
  s.breath = BREATH;
  return true;
}

/**
 * A press on the button or stove (pointerdown, or a key that isn't a repeat). Only while the kitchen runs. During the breath after
 * coming back it is ignored: the click that brings focus back is not a move.
 */
export function press(s: Session, now: number) {
  if (!ticking(s) || s.breath > 0 || s.held) return false;
  s.held = true; s.heldAt = now;
  return true;
}

/** The finger lifts or the key comes up: "hold" if it was held long enough that letting go lifts the pot, "tap" if not, "" if nothing was down. */
export function release(s: Session, now: number): "hold" | "tap" | "" {
  if (!s.held) return "";
  s.held = false;
  return now - s.heldAt >= HOLD_MS ? "hold" : "tap";
}

/** Result screen keys: a fresh, non-repeating keydown that arrived after the screen appeared. */
export const freshResultKey = (s: Session, event: { timeStamp: number; repeat: boolean }) =>
  s.screen === "over" && !s.paused && !s.sheet && !event.repeat && event.timeStamp > s.overAt;

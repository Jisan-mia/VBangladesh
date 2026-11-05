// The page around the race: which screen shows, the player's pause, window focus, the race list, the breath after চালিয়ে যাও,
// তাল মেলাও, a friend's link that arrives mid-race and which sound loop should be playing. Pure, so the statechart's bug paths
// replay in node tests (tests/session.test.ts); the component only forwards events here and does what syncLoops asks.

export type Screen = "title" | "intro" | "play" | "calib" | "over";

export type Session = {
  screen: Screen;
  /** The player's menu is open. */
  paused: boolean;
  focused: boolean;
  visible: boolean;
  /** The race list (a choice screen) is open: nothing moves behind it. */
  sheet: boolean;
  sound: boolean;
  /** The race is on the water, the count-in included, and not yet over. */
  racing: boolean;
  /** The river rush this session started and hasn't stopped. */
  rush: boolean;
  /** Event time the result screen appeared: result keys count only from a fresh press after it. */
  overAt: number;
  /** Seconds of breath after চালিয়ে যাও before taps count again and the water moves. */
  breath: number;
  /** তাল মেলাও stopped ticking (a blur, a hidden tab, the menu): its pulses are void and it must start over. */
  calibLost: boolean;
  /** A friend's link arrived while you were rowing or measuring: their river is owed to your next start. */
  owed: boolean;
};

export const createSession = (sound: boolean): Session => ({
  screen: "title", paused: false, focused: true, visible: true, sheet: false, sound,
  racing: false, rush: false, overAt: 0, breath: 0, calibLost: false, owed: false,
});

/** Time passes (the race, the pulses) only on a play or calibration screen, with the menu and the list shut, the tab showing and the window focused. */
export const ticking = (s: Session) => (s.screen === "play" || s.screen === "calib") && !s.paused && !s.sheet && s.focused && s.visible;
/** Taps and lane changes count only while time passes, and not in the breath after resuming. The click that brings focus back is not a move. */
export const canTap = (s: Session) => ticking(s) && !(s.breath > 0);
/** The river rushes only while a race is on the water, on a focused, visible page with sound on, once the breath is over. */
export const wantRush = (s: Session) => ticking(s) && s.racing && s.sound;

export type Loops = { start: () => void; stop: () => void };
/** Starts or stops the rush to match what the session wants. Called every step and after every event below. */
export function syncLoops(s: Session, loops: Loops) {
  const want = wantRush(s);
  if (want !== s.rush) { s.rush = want; if (want) loops.start(); else loops.stop(); }
}

function away(s: Session, change: () => void) {
  const was = ticking(s);
  change();
  if (was && !ticking(s) && s.screen === "calib") s.calibLost = true;
}

/** Window blur (real, or the player's synthetic one). */
export function blur(s: Session) { away(s, () => { s.focused = false; }); }
export function focus(s: Session) { s.focused = true; }
export function hide(s: Session) { away(s, () => { s.visible = false; s.focused = false; }); }
export function show(s: Session) { s.visible = true; s.focused = true; }
/** The player's menu opened. */
export function pause(s: Session) { away(s, () => { s.paused = true; }); }
/** A short breath after চালিয়ে যাও, so the water doesn't move the instant the menu closes. */
export const BREATH = 0.8;
/** চালিয়ে যাও. */
export function resume(s: Session) { s.paused = false; s.breath = BREATH; }
export function openSheet(s: Session) { away(s, () => { s.sheet = true; }); }
export function closeSheet(s: Session) { s.sheet = false; s.breath = BREATH; }
/** True while the breath lasts: the step waits. */
export function breathing(s: Session, dt: number) {
  if (!(s.breath > 0)) return false;
  s.breath -= dt;
  return true;
}
/** The site-wide switch. Turning it off has already stopped every loop in the kit; turning it on lets syncLoops start a fresh one (never a stub made while muted). */
export function setSound(s: Session, on: boolean) {
  s.sound = on;
  if (!on) s.rush = false;
}

export function goTo(s: Session, screen: Screen, at = 0) {
  s.screen = screen;
  s.breath = 0;
  s.sheet = false;
  s.calibLost = false;
  s.racing = false;
  if (screen === "over") s.overAt = at;
}
/** The race leaves the rope (the count-in starts) or ends. */
export function setRacing(s: Session, racing: boolean) { s.racing = racing; }

/**
 * Result screen keys: a fresh, non-repeating keydown that arrived after the screen appeared and after this guard (ms), which is longer than
 * a beat of the drum, so a rower still drumming on Space never starts the next race by accident. Buttons answer at once.
 */
export const RESULT_GUARD = 2000;
export const freshResultKey = (s: Session, event: { timeStamp: number; repeat: boolean }) =>
  s.screen === "over" && !s.paused && !s.sheet && !event.repeat && event.timeStamp > s.overAt + RESULT_GUARD;

/** Did তাল মেলাও lose its pulses? Reads the flag once. */
export function takeCalibLost(s: Session) {
  if (!s.calibLost) return false;
  s.calibLost = false;
  return true;
}

/** A friend's link arrives: mid-race or mid-তাল মেলাও it only remembers that their river is owed; anywhere else it's shown at once. Returns whether to show it now. */
export function linkArrives(s: Session) {
  const busy = s.screen === "play" || s.screen === "calib";
  s.owed = busy;
  return !busy;
}
/** The next start: true when it must be the friend's river. Settles the debt. */
export function takeOwed(s: Session) {
  const owed = s.owed;
  s.owed = false;
  return owed;
}

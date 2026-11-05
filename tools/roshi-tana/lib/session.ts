// The page around the match: which screen shows, the player's pause, window focus, the level list, the match clock and which
// sound loop should be playing. Pure, so the statechart's bug paths replay in node tests (tests/session.test.ts);
// the component only forwards events here and does what syncLoops and wake ask.

export type Screen = "title" | "intro" | "ready" | "play" | "over";

export type Session = {
  screen: Screen;
  /** The player's menu is open. */
  paused: boolean;
  focused: boolean;
  visible: boolean;
  /** The level list (a choice screen) is open. */
  sheet: boolean;
  sound: boolean;
  /** The crowd loop this session started and hasn't stopped. */
  crowd: boolean;
  /** The match stopped ticking mid-play: on return the clock is re-based and a fresh ৩-২-১ runs. */
  stale: boolean;
  /** Event time the result screen appeared: result keys count only from a fresh press after it. */
  overAt: number;
};

export const createSession = (sound: boolean): Session =>
  ({ screen: "title", paused: false, focused: true, visible: true, sheet: false, sound, crowd: false, stale: false, overAt: 0 });

/** The match steps only on the play screen, with the menu and the level list shut, the tab showing and the window focused. */
export const ticking = (s: Session) => s.screen === "play" && !s.paused && !s.sheet && s.focused && s.visible;
/** Taps pull only while the match steps. Anything else (the click that brings focus back, a tap under the menu) is not a move. */
export const canTap = ticking;
/** The crowd plays only while a match runs on a focused, visible page with sound on. */
export const wantCrowd = (s: Session) => ticking(s) && s.sound;

export type Loops = { start: () => void; stop: () => void };
/** Starts or stops the crowd to match what the session wants. Called every step and after every event below. */
export function syncLoops(s: Session, loops: Loops) {
  const want = wantCrowd(s);
  if (want !== s.crowd) { s.crowd = want; if (want) loops.start(); else loops.stop(); }
}

function away(s: Session, change: () => void) {
  const was = ticking(s);
  change();
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
 * The site-wide switch. Turning it off has already stopped every loop in the kit, so the crowd counts as stopped; turning it on
 * lets syncLoops start a fresh one (never a stub made while muted).
 */
export function setSound(s: Session, on: boolean) {
  s.sound = on;
  if (!on) s.crowd = false;
}

export function goTo(s: Session, screen: Screen, at = 0) {
  s.screen = screen;
  s.stale = false;
  if (screen === "over") s.overAt = at;
}

/** Result screen keys: a fresh, non-repeating keydown that arrived after the screen appeared. */
export const freshResultKey = (s: Session, event: { timeStamp: number; repeat: boolean }) =>
  s.screen === "over" && !s.paused && !s.sheet && !event.repeat && event.timeStamp > s.overAt;

/* ---------- the match clock ---------- */

/** The longest stretch one step may move the clock. Anything longer (a frozen tab, a missed blur) is skipped, not played. */
export const MAX_GAP = 100;

/** Match time is `real - origin`, but only while ticking: `now` is where the match is. */
export type Clock = { origin: number; now: number };
export const createClock = (real: number, lead: number): Clock => ({ origin: real + lead, now: -lead });

/** One step at real time `real`: the match clock follows real time, never jumping more than MAX_GAP. */
export function tick(clock: Clock, real: number) {
  let t = real - clock.origin;
  if (t - clock.now > MAX_GAP) { clock.origin = real - clock.now - MAX_GAP; t = clock.now + MAX_GAP; }
  if (t > clock.now) clock.now = t;
  return clock.now;
}
/** A tap's match time, from its own event timestamp. */
export const tapTime = (clock: Clock, stamp: number) => stamp - clock.origin;

/**
 * Called whenever the match may tick again (focus, show, চালিয়ে যাও, the list shut). If it stopped mid-play, the clock is re-based
 * to carry on from where it stopped (no time passed while away) and the caller runs a fresh count-in. Returns whether it did.
 */
export function wake(s: Session, clock: Clock, real: number) {
  if (!ticking(s) || !s.stale) return false;
  s.stale = false;
  clock.origin = real - clock.now;
  return true;
}

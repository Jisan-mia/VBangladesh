// The page around the match: which screen shows, the player's pause, window focus, the level list, a held finger, the
// breath after coming back, and whether the wind loop should sound. Pure, so the statechart's bug paths replay in node
// tests (tests/session.test.ts); the component forwards events here and does what syncLoops and wake ask.

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
  /** This level has wind (the rooftops), so a wind loop belongs to it. */
  windy: boolean;
  /** The wind loop this session started and hasn't stopped. */
  wind: boolean;
  /** A finger or key is down on the shuttle (the match holds it on the racket until the touch decides). */
  held: boolean;
  /** The match stopped stepping mid-play: on return it waits a breath before the shuttle moves again. */
  stale: boolean;
  /** Steps of breath left before the match moves again (after coming back). Swings don't count during it. */
  breath: number;
  /** Event time the result screen appeared: result keys count only from a fresh press after it. */
  overAt: number;
};

/** Steps of breath after coming back: the shuttle hangs where it was for this long, then carries on. */
export const BREATH = 48;

/** `focused` starts from the document's real focus, so a loop mounted while another window has focus never steps. */
export const createSession = (sound: boolean, focused = true, visible = true): Session =>
  ({ screen: "title", paused: false, focused, visible, sheet: false, sound, windy: false, wind: false, held: false, stale: false, breath: 0, overAt: 0 });

/** The match steps only on the play screen, with the menu and the list shut, the tab showing and the window focused. */
export const ticking = (s: Session) => s.screen === "play" && !s.paused && !s.sheet && s.focused && s.visible;
/** Swings count only while the match steps and isn't catching its breath. The click that brings focus back is not a swing. */
export const canSwing = (s: Session) => ticking(s) && s.breath === 0;
/** The wind sounds only on a windy level whose match runs on a focused, visible page with sound on. */
export const wantWind = (s: Session) => ticking(s) && s.sound && s.windy;

export type Loops = { start: () => void; stop: () => void };
/** Starts or stops the wind to match what the session wants. Called every step and after every event below. */
export function syncLoops(s: Session, loops: Loops) {
  const want = wantWind(s);
  if (want !== s.wind) { s.wind = want; if (want) loops.start(); else loops.stop(); }
}

/** Leaving (in any way) releases a held finger: the caller resolves it as the tap it was, so nothing stays held. */
function away(s: Session, change: () => void) {
  const was = ticking(s);
  change();
  if (was && !ticking(s)) s.stale = true;
  if (!ticking(s)) s.held = false;
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
 * The site-wide switch. Turning it off has already stopped every loop in the kit, so the wind counts as stopped; turning it
 * on lets syncLoops start a fresh one (never a stub made while muted).
 */
export function setSound(s: Session, on: boolean) {
  s.sound = on;
  if (!on) s.wind = false;
}

export function press(s: Session) { if (canSwing(s)) s.held = true; return s.held; }
export function lift(s: Session) { s.held = false; }

export function goTo(s: Session, screen: Screen, at = 0, windy = s.windy) {
  s.screen = screen;
  s.stale = false; s.breath = 0; s.held = false; s.windy = windy;
  if (screen === "over") s.overAt = at;
}

/** Result screen keys: a fresh, non-repeating keydown that arrived after the screen appeared. */
export const freshResultKey = (s: Session, event: { timeStamp: number; repeat: boolean }) =>
  s.screen === "over" && !s.paused && !s.sheet && !event.repeat && event.timeStamp > s.overAt;

/** Called whenever the match may step again (focus, show, চালিয়ে যাও, the list shut): after time away, a breath first. */
export function wake(s: Session) {
  if (!ticking(s) || !s.stale) return false;
  s.stale = false;
  s.breath = BREATH;
  return true;
}

/** One loop step: true when the match itself should advance (ticking, and the breath is over). */
export function step(s: Session) {
  if (!ticking(s)) return false;
  if (s.breath > 0) { s.breath--; return false; }
  return true;
}

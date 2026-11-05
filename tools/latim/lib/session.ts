// The page around the top: which screen shows, the player's pause, window focus, the level list, a play key held down, the
// breath after coming back, and whether the hum and the wind should sound. Pure, so the statechart's bug paths replay in node
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
  /** The top is spinning (thrown, not yet fallen or lifted): the hum belongs to it. */
  spinning: boolean;
  /** This level has wind, so a wind loop belongs to the spin. */
  windy: boolean;
  /** The loops this session started and hasn't stopped. */
  hum: boolean; wind: boolean;
  /** A play key (Space, Enter, ↑) is down. Its auto-repeat never acts; only a fresh press does. */
  key: boolean;
  /** The round stopped stepping mid-play: on return it waits a breath before the top moves again. */
  stale: boolean;
  /** Steps of breath left before the round moves again (after coming back). Touches don't count during it. */
  breath: number;
  /** Event time the result screen appeared: result keys count only from a fresh press after it. */
  overAt: number;
};

/** Steps of breath after coming back: the top hangs where it was for this long, then carries on. */
export const BREATH = 36;

/** `focused` starts from the document's real focus, so a loop mounted while another window has focus never steps. */
export const createSession = (sound: boolean, focused = true, visible = true): Session =>
  ({ screen: "title", paused: false, focused, visible, sheet: false, sound, spinning: false, windy: false, hum: false, wind: false, key: false, stale: false, breath: 0, overAt: 0 });

/** The round steps only on the play screen, with the menu and the list shut, the tab showing and the window focused. */
export const ticking = (s: Session) => s.screen === "play" && !s.paused && !s.sheet && s.focused && s.visible;
/** Touches count only while the round steps and isn't catching its breath. The click that brings focus back is not a touch. */
export const canTap = (s: Session) => ticking(s) && s.breath === 0;
/** The hum sounds only while the top spins on a focused, visible page with sound on. */
export const wantHum = (s: Session) => ticking(s) && s.sound && s.spinning;
/** The wind sounds only on a windy level, in the same states as the hum. */
export const wantWind = (s: Session) => wantHum(s) && s.windy;

export type Loops = { startHum: () => void; stopHum: () => void; startWind: () => void; stopWind: () => void };
/** Starts or stops each loop to match what the session wants. Called every step and after every event below. */
export function syncLoops(s: Session, loops: Loops) {
  const hum = wantHum(s), wind = wantWind(s);
  if (hum !== s.hum) { s.hum = hum; if (hum) loops.startHum(); else loops.stopHum(); }
  if (wind !== s.wind) { s.wind = wind; if (wind) loops.startWind(); else loops.stopWind(); }
}

/** Leaving (in any way) releases a held key: its keyup will land somewhere else. */
function away(s: Session, change: () => void) {
  const was = ticking(s);
  change();
  if (was && !ticking(s)) s.stale = true;
  if (!ticking(s)) s.key = false;
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
 * The site-wide switch. Turning it off has already stopped every loop in the kit, so they count as stopped; turning it on
 * lets syncLoops start fresh ones (never a stub made while muted).
 */
export function setSound(s: Session, on: boolean) {
  s.sound = on;
  if (!on) { s.hum = false; s.wind = false; }
}
/** The top started or stopped spinning. */
export function setSpinning(s: Session, spinning: boolean) { s.spinning = spinning; }

/**
 * A play key went down. True only for a fresh press while touches count: the keyboard's auto-repeat of a held key, and a
 * press while paused, away or catching a breath, do nothing.
 */
export function keyDown(s: Session, repeat: boolean) {
  if (repeat) return false;
  s.key = true;
  return canTap(s);
}
export function keyUp(s: Session) { s.key = false; }

export function goTo(s: Session, screen: Screen, at = 0, windy = s.windy) {
  s.screen = screen;
  s.stale = false; s.breath = 0; s.windy = windy; s.spinning = false;
  if (screen === "over") s.overAt = at;
}

/** Result screen keys: a fresh, non-repeating keydown that arrived after the screen appeared. */
export const freshResultKey = (s: Session, event: { timeStamp: number; repeat: boolean }) =>
  s.screen === "over" && !s.paused && !s.sheet && !event.repeat && event.timeStamp > s.overAt;

/** Called whenever the round may step again (focus, show, চালিয়ে যাও, the list shut): after time away, a breath first. */
export function wake(s: Session) {
  if (!ticking(s) || !s.stale) return false;
  s.stale = false;
  s.breath = BREATH;
  return true;
}

/** One loop step: true when the round itself should advance (ticking, and the breath is over). */
export function step(s: Session) {
  if (!ticking(s)) return false;
  if (s.breath > 0) { s.breath--; return false; }
  return true;
}

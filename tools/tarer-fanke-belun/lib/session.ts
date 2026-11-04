// The page around the game: which screen shows, the player's pause, window focus, the level list, your finger on the
// lane and the keys, and which sound loops should be playing. Pure, so the statechart's bug paths replay in node tests
// (tests/session.test.ts); the component only forwards events here and does what syncLoops asks.
import { FLY, type Game } from "./belun";

export type Screen = "title" | "intro" | "play" | "over";
export type LoopKind = "hum" | "wind";

export type Session = {
  screen: Screen;
  /** The player's menu is open. */
  paused: boolean;
  focused: boolean;
  visible: boolean;
  /** At least a fifth of the lane is on screen (a desktop page can scroll it away). */
  inView: boolean;
  /** The level list is open (a choice screen: nothing moves behind it). */
  sheet: boolean;
  /** The finger holding the balloon up, if any. */
  pointer: number | null;
  /** Held keys that lift: Space, ↑, W. */
  space: boolean; up: boolean;
  /** A press that came and went between two steps still counts once. */
  tapped: boolean;
  sound: boolean;
  /** The loops this session started and hasn't stopped. */
  hum: boolean; wind: boolean;
  /** Event time the result screen appeared: result keys count only from a fresh press after it. */
  overAt: number;
  /** Seconds of breath after চালিয়ে যাও before the street moves again. */
  breath: number;
};

export const createSession = (sound: boolean): Session => ({
  screen: "title", paused: false, focused: true, visible: true, inView: true, sheet: false,
  pointer: null, space: false, up: false, tapped: false, sound, hum: false, wind: false, overAt: 0, breath: 0,
});

/**
 * The street moves only on the play screen, with the menu and the level list shut, the tab showing, the window focused
 * and the lane on screen. The last one is the game's own guard: however play resumes, nothing happens out of sight.
 */
export const ticking = (s: Session) => s.screen === "play" && !s.paused && !s.sheet && s.focused && s.visible && s.inView;

/** The wires hum while you fly; the wind blows only on a street with gusts. */
export const wantHum = (s: Session, game: Game) => ticking(s) && s.sound && game.phase === FLY;
export const wantWind = (s: Session, game: Game) => wantHum(s, game) && game.gusts.length > 0;

export type Loops = { start: (kind: LoopKind) => void; stop: (kind: LoopKind) => void };
/** Starts or stops each loop to match what the session wants. Called every step and after every event below. */
export function syncLoops(s: Session, game: Game, loops: Loops) {
  const hum = wantHum(s, game), wind = wantWind(s, game);
  if (hum !== s.hum) { s.hum = hum; if (hum) loops.start("hum"); else loops.stop("hum"); }
  if (wind !== s.wind) { s.wind = wind; if (wind) loops.start("wind"); else loops.stop("wind"); }
}

/** No finger, key or latched tap outlives a blur, a hidden tab, the menu, the list or a screen change. */
export function letGo(s: Session) { s.pointer = null; s.space = false; s.up = false; s.tapped = false; }

/** Window blur (real, or the player's synthetic one): its keyup and pointerup never come, so let go now. */
export function blur(s: Session) { s.focused = false; letGo(s); }
export function focus(s: Session) { s.focused = true; }
export function hide(s: Session) { s.visible = false; s.focused = false; letGo(s); }
export function show(s: Session) { s.visible = true; s.focused = true; }
/** The lane scrolls off (or back on) the screen. */
export function setInView(s: Session, inView: boolean) { s.inView = inView; if (!inView) letGo(s); }
/** The player's menu opened. */
export function pause(s: Session) { s.paused = true; letGo(s); }
/** A short breath after চালিয়ে যাও, so the street doesn't move the instant the menu closes. */
export const BREATH = 0.35;
/** চালিয়ে যাও: fresh hands, nothing carried over from before the pause, and a breath before motion. */
export function resume(s: Session) { s.paused = false; s.breath = BREATH; letGo(s); }
/** True while the breath lasts: the step waits (a finger put down early counts once it ends). */
export function breathing(s: Session, dt: number) {
  if (!(s.breath > 0)) return false;
  s.breath -= dt;
  return true;
}
export function openSheet(s: Session) { s.sheet = true; letGo(s); }
export function closeSheet(s: Session) { s.sheet = false; letGo(s); }
/** The site-wide switch. Turning it off has already stopped every loop in the kit. */
export function setSound(s: Session, on: boolean) {
  s.sound = on;
  if (!on) { s.hum = false; s.wind = false; }
}

export function goTo(s: Session, screen: Screen, at = 0) {
  s.screen = screen;
  s.breath = 0;
  s.sheet = false;
  letGo(s);
  if (screen === "over") s.overAt = at;
}

/** A finger lands on the lane: lift. Returns false (and holds nothing) when input doesn't count, such as the click that brings focus back. */
export function pointerDown(s: Session, id: number) {
  if (!ticking(s) || s.pointer !== null) return false;
  s.pointer = id; s.tapped = true;
  return true;
}
export function pointerUp(s: Session, id: number) { if (id === s.pointer) s.pointer = null; }

export type Key = "space" | "up";
export function keyOf(key: string): Key | null {
  if (key === " ") return "space";
  if (key === "ArrowUp" || key === "w" || key === "W") return "up";
  return null;
}
/** A lift key goes down. Ignored (and nothing held) unless the street is moving. */
export function keyDown(s: Session, key: Key) {
  if (!ticking(s)) return false;
  s[key] = true; s.tapped = true;
  return true;
}
export function keyUp(s: Session, key: Key) { s[key] = false; }

/** Is the balloon held up right now: a finger, a lift key, or a press that came and went since the last step. */
export const lifting = (s: Session) => s.pointer !== null || s.space || s.up || s.tapped;

/** This step's input: whether the balloon is held. Clears the latched tap. */
export function takeInput(s: Session) {
  if (!ticking(s)) { s.tapped = false; return false; }
  const hold = lifting(s);
  s.tapped = false;
  return hold;
}

/** Result screen keys: a fresh, non-repeating keydown that arrived after the screen appeared. */
export const freshResultKey = (s: Session, event: { timeStamp: number; repeat: boolean }) =>
  s.screen === "over" && !s.paused && !s.sheet && !event.repeat && event.timeStamp > s.overAt;

// The page around the game: which screen shows, the player's pause, window focus, the level list, your hand on the sky
// and the keys, and which sound loops should be playing. Pure, so the statechart's bug paths replay in node tests
// (tests/session.test.ts); the component only forwards events here and does what syncLoops asks.
import { steerBy, steerTo, type Game } from "./kite";

export type Screen = "title" | "intro" | "play" | "over";
export type LoopKind = "wind" | "hum";

/** The kite travels a little further than the thumb, so a short slide covers the sky. */
export const GAIN = 1.3;
/** A still touch shorter than this many px is a tap: a short tug towards that spot. */
export const TAP_SLOP = 10;
export const TAP_PULL = 0.22;
/** Arrow keys move the aim this many units a second. */
export const KEY_SPEED = 230;

export type Session = {
  screen: Screen;
  /** The player's menu is open. */
  paused: boolean;
  focused: boolean;
  visible: boolean;
  /** At least a fifth of the sky is on screen (a desktop page can scroll it away). */
  inView: boolean;
  /** The level list is open (a choice screen: nothing moves behind it). */
  sheet: boolean;
  /** The finger on the sky, if any, and where it last was. */
  pointer: number | null;
  lastX: number; lastY: number; startX: number; startY: number; moved: boolean;
  /** World units the aim should move on the next step (slides). */
  dx: number; dy: number;
  /** A tap's spot, waiting for the next step. */
  tap: boolean; tapX: number; tapY: number;
  /** Seconds left of a tap's tug. */
  tapLeft: number;
  /** Held keys: the arrows and Space (টান). */
  left: boolean; right: boolean; up: boolean; down: boolean; space: boolean;
  sound: boolean;
  /** The loops this session started and hasn't stopped. */
  wind: boolean;
  hum: boolean;
  /** Event time the result screen appeared: result keys count only from a fresh press after it. */
  overAt: number;
  /** Seconds of breath after চালিয়ে যাও before the sky moves again. */
  breath: number;
};

export const createSession = (sound: boolean): Session => ({
  screen: "title", paused: false, focused: true, visible: true, inView: true, sheet: false,
  pointer: null, lastX: 0, lastY: 0, startX: 0, startY: 0, moved: false, dx: 0, dy: 0, tap: false, tapX: 0, tapY: 0, tapLeft: 0,
  left: false, right: false, up: false, down: false, space: false,
  sound, wind: false, hum: false, overAt: 0, breath: 0,
});

/**
 * The sky moves only on the play screen, with the menu and the level list shut, the tab showing, the window focused and
 * the sky on screen. The last one is the game's own guard: however play resumes (the bar's button with the stage scrolled
 * away included), nothing happens where you can't see it.
 */
export const ticking = (s: Session) => s.screen === "play" && !s.paused && !s.sheet && s.focused && s.visible && s.inView;

/** The wind plays while there is an evening in the sky to hear; the string hums only inside a প্যাঁচ. */
export const wantWind = (s: Session, game: Game) => ticking(s) && s.sound && (game.phase === "ready" || game.phase === "fly");
export const wantHum = (s: Session, game: Game) => wantWind(s, game) && game.hooked >= 0;

export type Loops = { start: (kind: LoopKind) => void; stop: (kind: LoopKind) => void };
/** Starts or stops each loop to match what the session wants. Called every step and after every event below. */
export function syncLoops(s: Session, game: Game, loops: Loops) {
  const wind = wantWind(s, game), hum = wantHum(s, game);
  if (wind !== s.wind) { s.wind = wind; if (wind) loops.start("wind"); else loops.stop("wind"); }
  if (hum !== s.hum) { s.hum = hum; if (hum) loops.start("hum"); else loops.stop("hum"); }
}

/** No finger, key or tug outlives a blur, a hidden tab, the menu, the list or a screen change. */
export function letGo(s: Session) {
  s.pointer = null; s.moved = false; s.dx = 0; s.dy = 0; s.tap = false; s.tapLeft = 0;
  s.left = s.right = s.up = s.down = s.space = false;
}

/** Window blur (real, or the player's synthetic one): its keyup and pointerup never come, so let go now. */
export function blur(s: Session) { s.focused = false; letGo(s); }
export function focus(s: Session) { s.focused = true; }
export function hide(s: Session) { s.visible = false; s.focused = false; letGo(s); }
export function show(s: Session) { s.visible = true; s.focused = true; }
/** The sky scrolls off (or back on) the screen. */
export function setInView(s: Session, inView: boolean) { s.inView = inView; if (!inView) letGo(s); }
/** The player's menu opened. */
export function pause(s: Session) { s.paused = true; letGo(s); }
/** A short breath after চালিয়ে যাও, so the sky doesn't move the instant the menu closes. */
export const BREATH = 0.35;
/** চালিয়ে যাও: fresh hands, nothing carried over from before the pause, and a breath before motion. */
export function resume(s: Session) { s.paused = false; s.breath = BREATH; letGo(s); }
/** True while the breath lasts: the step waits (input still lands, so a finger put down early counts once it ends). */
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
  if (!on) { s.wind = false; s.hum = false; }
}

export function goTo(s: Session, screen: Screen, at = 0) {
  s.screen = screen;
  s.breath = 0;
  s.sheet = false;
  letGo(s);
  if (screen === "over") s.overAt = at;
}

/** A finger lands on the sky: টান. Returns false (and holds nothing) when input doesn't count, such as the click that brings focus back. */
export function pointerDown(s: Session, id: number, x: number, y: number) {
  if (!ticking(s) || s.pointer !== null) return false;
  s.pointer = id; s.lastX = s.startX = x; s.lastY = s.startY = y; s.moved = false;
  return true;
}
/** A slide steers: screen px over the sky's scale, times GAIN. */
export function pointerMove(s: Session, id: number, x: number, y: number, scale: number) {
  if (id !== s.pointer || !ticking(s)) return;
  s.dx += ((x - s.lastX) * GAIN) / scale;
  s.dy += ((y - s.lastY) * GAIN) / scale;
  s.lastX = x; s.lastY = y;
  if (!s.moved && Math.hypot(x - s.startX, y - s.startY) > TAP_SLOP) s.moved = true;
}
/** The finger lifts: ঢিল. A still tap also sends a short tug towards the spot it touched (world units). */
export function pointerUp(s: Session, id: number, worldX: number, worldY: number) {
  if (id !== s.pointer) return;
  s.pointer = null;
  if (!s.moved && ticking(s)) { s.tap = true; s.tapX = worldX; s.tapY = worldY; s.tapLeft = TAP_PULL; }
}
export function pointerCancel(s: Session, id: number) { if (id === s.pointer) s.pointer = null; }

export type Key = "left" | "right" | "up" | "down" | "space";
export function keyOf(key: string): Key | null {
  if (key === "ArrowLeft" || key === "a" || key === "A") return "left";
  if (key === "ArrowRight" || key === "d" || key === "D") return "right";
  if (key === "ArrowUp" || key === "w" || key === "W") return "up";
  if (key === "ArrowDown" || key === "s" || key === "S") return "down";
  if (key === " ") return "space";
  return null;
}
/** A game key goes down. Ignored (and nothing held) unless the sky is moving. */
export function keyDown(s: Session, key: Key) {
  if (!ticking(s)) return false;
  s[key] = true;
  return true;
}
export function keyUp(s: Session, key: Key) { s[key] = false; }

/** Is টান held right now: a finger on the sky, Space, or a tap's tug. */
export const pulling = (s: Session) => s.pointer !== null || s.space || s.tapLeft > 0;

/** Applies this step's steering to the game and returns whether টান is held. */
export function applyInput(s: Session, game: Game, dt: number) {
  if (!ticking(s)) return false;
  const kx = (s.right ? 1 : 0) - (s.left ? 1 : 0), ky = (s.down ? 1 : 0) - (s.up ? 1 : 0);
  if (kx || ky) steerBy(game, kx * KEY_SPEED * dt, ky * KEY_SPEED * dt);
  if (s.dx || s.dy) { steerBy(game, s.dx, s.dy); s.dx = 0; s.dy = 0; }
  if (s.tap) { steerTo(game, s.tapX, s.tapY); s.tap = false; }
  const pull = pulling(s);
  if (s.tapLeft > 0) s.tapLeft -= dt;
  return pull;
}

/** Result screen keys: a fresh, non-repeating keydown that arrived after the screen appeared. */
export const freshResultKey = (s: Session, event: { timeStamp: number; repeat: boolean }) =>
  s.screen === "over" && !s.paused && !s.sheet && !event.repeat && event.timeStamp > s.overAt;

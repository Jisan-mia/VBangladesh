// The page around the run: which screen shows, the player's pause, window focus, the lane on screen, the level list,
// your thumbs and keys. Pure, so the statechart's bug paths replay in node tests (tests/session.test.ts); the component
// only forwards events here and then feeds the run.
import { pressDuck, pressJump, releaseAll, RUN, type Run } from "./game";

export type Screen = "title" | "intro" | "play" | "over";

/** What holds the jump or the duck right now, as bits: a key, the road under a thumb, or one of the two pads. */
export const SPACE = 1, UP = 2, LANE = 4, JUMP_PAD = 8;
export const DOWN = 1, SWIPE = 2, DUCK_PAD = 4;
export const NONE = 0, JUMP = 1, DUCK = 2;

export type Session = {
  screen: Screen;
  /** The player's menu is open. */
  paused: boolean;
  focused: boolean;
  visible: boolean;
  /** At least a fifth of the road is on screen (a desktop page can scroll it away). */
  inView: boolean;
  /** The level list is open (a choice screen: nothing moves behind it). */
  sheet: boolean;
  jump: number; duck: number;
  /** The last press since the step before: it counts once even if the key came and went between two steps. */
  press: number;
  /** Which finger is on the road, where it landed, and whether it has swiped down; the fingers on the pads. */
  lane: number; laneY: number; laneX: number; swiped: boolean; jumpPad: number; duckPad: number;
  /** Event time the result screen appeared: result keys count only from a fresh press after it. */
  overAt: number;
  /** Seconds of breath after চালিয়ে যাও before the road moves again. */
  breath: number;
};

export const createSession = (): Session => ({
  screen: "title", paused: false, focused: true, visible: true, inView: true, sheet: false,
  jump: 0, duck: 0, press: NONE, lane: -1, laneY: 0, laneX: 0, swiped: false, jumpPad: -1, duckPad: -1, overAt: 0, breath: 0,
});

/**
 * The road moves only on the play screen, with the menu and the level list shut, the tab showing, the window focused
 * and the road on screen. The last one is the game's own guard: however play resumes, nothing happens out of sight.
 */
export const ticking = (s: Session) => s.screen === "play" && !s.paused && !s.sheet && s.focused && s.visible && s.inView;

/** No thumb, key or latched press outlives a blur, a hidden tab, the menu, the list or a screen change. The run lets go too. */
export function letGo(s: Session, run?: Run | null) {
  s.jump = 0; s.duck = 0; s.press = NONE; s.lane = -1; s.swiped = false; s.jumpPad = -1; s.duckPad = -1;
  if (run) releaseAll(run);
}

/** Window blur (real, or the player's synthetic one): its keyup and pointerup never come, so let go now. */
export function blur(s: Session, run?: Run | null) { s.focused = false; letGo(s, run); }
export function focus(s: Session) { s.focused = true; }
export function hide(s: Session, run?: Run | null) { s.visible = false; s.focused = false; letGo(s, run); }
export function show(s: Session) { s.visible = true; s.focused = true; }
export function setInView(s: Session, inView: boolean, run?: Run | null) { s.inView = inView; if (!inView) letGo(s, run); }
export function pause(s: Session, run?: Run | null) { s.paused = true; letGo(s, run); }
/** A short breath after চালিয়ে যাও, so the road doesn't move the instant the menu closes. */
export const BREATH = 0.5;
export function resume(s: Session, run?: Run | null) { s.paused = false; s.breath = BREATH; letGo(s, run); }
/** True while the breath lasts: the step waits (a press made early counts once it ends). */
export function breathing(s: Session, dt: number) {
  if (!(s.breath > 0)) return false;
  s.breath -= dt;
  return true;
}
export function openSheet(s: Session, run?: Run | null) { s.sheet = true; letGo(s, run); }
export function closeSheet(s: Session, run?: Run | null) {
  // Shutting the list mid-run gives the same breath as চালিয়ে যাও.
  if (s.sheet) s.breath = BREATH;
  s.sheet = false; letGo(s, run);
}

export function goTo(s: Session, screen: Screen, at = 0, run?: Run | null) {
  s.screen = screen;
  s.breath = 0;
  s.sheet = false;
  letGo(s, run);
  if (screen === "over") s.overAt = at;
}

/* ---------- presses ---------- */

function jumpOn(s: Session, bit: number) {
  if (!ticking(s)) return false;
  s.jump |= bit; s.duck = 0; s.press = JUMP;
  return true;
}
function duckOn(s: Session, bit: number) {
  if (!ticking(s)) return false;
  s.duck |= bit; s.jump &= ~LANE; s.press = DUCK;
  return true;
}

export type Key = "space" | "up" | "down";
export function keyOf(key: string): Key | null {
  if (key === " " || key === "Spacebar") return "space";
  if (key === "ArrowUp" || key === "w" || key === "W") return "up";
  if (key === "ArrowDown" || key === "s" || key === "S") return "down";
  return null;
}
/** A game key goes down. Ignored (and nothing held) unless the road is moving. */
export function keyDown(s: Session, key: Key) { return key === "down" ? duckOn(s, DOWN) : jumpOn(s, key === "space" ? SPACE : UP); }
export function keyUp(s: Session, key: Key) {
  if (key === "down") s.duck &= ~DOWN;
  else s.jump &= ~(key === "space" ? SPACE : UP);
}

/** A thumb lands on the road: jump. Returns false (and holds nothing) when input doesn't count, such as the click that brings focus back. */
export function laneDown(s: Session, id: number, x: number, y: number) {
  if (s.lane !== -1 || !jumpOn(s, LANE)) return false;
  s.lane = id; s.laneX = x; s.laneY = y; s.swiped = false;
  return true;
}
/** A thumb on the road that moves this far down (CSS pixels), more down than sideways, is a swipe: duck. */
export const SWIPE_PX = 22;
export function laneMove(s: Session, id: number, x: number, y: number) {
  if (id !== s.lane || s.swiped) return false;
  const dy = y - s.laneY, dx = x - s.laneX;
  if (dy > SWIPE_PX && dy > Math.abs(dx) && duckOn(s, SWIPE)) { s.swiped = true; return true; }
  return false;
}
export function laneUp(s: Session, id: number) {
  if (id !== s.lane) return;
  s.lane = -1; s.jump &= ~LANE; s.duck &= ~SWIPE; s.swiped = false;
}
export function padDown(s: Session, duck: boolean, id: number) {
  if (duck ? s.duckPad !== -1 : s.jumpPad !== -1) return false;
  if (!(duck ? duckOn(s, DUCK_PAD) : jumpOn(s, JUMP_PAD))) return false;
  if (duck) s.duckPad = id; else s.jumpPad = id;
  return true;
}
export function padUp(s: Session, duck: boolean, id: number) {
  if (duck && id === s.duckPad) { s.duckPad = -1; s.duck &= ~DUCK_PAD; }
  if (!duck && id === s.jumpPad) { s.jumpPad = -1; s.jump &= ~JUMP_PAD; }
}

/** This step's input into the run: the press since the last step (once), then what is held right now. */
export function takeInput(s: Session, run: Run) {
  if (!ticking(s)) { s.press = NONE; return; }
  if (s.press === JUMP) pressJump(run);
  else if (s.press === DUCK) { pressDuck(run); if (run.phase === RUN) run.ducks++; }
  s.press = NONE;
  run.jumpHeld = s.jump !== 0;
  run.duckHeld = s.duck !== 0;
}

/** Result screen keys: a fresh, non-repeating keydown that arrived after the screen appeared. */
export const freshResultKey = (s: Session, event: { timeStamp: number; repeat: boolean }) =>
  s.screen === "over" && !s.paused && !s.sheet && !event.repeat && event.timeStamp > s.overAt;

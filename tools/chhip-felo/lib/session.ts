// The page around the trip: which screen shows, the player's pause, window focus, the level list and the album, your
// finger and Space, and whether the reel hum should play. Pure, so the statechart's bug paths replay in node tests
// (tests/session.test.ts); the component only forwards events here and does what syncHum asks.
import { P, type Trip } from "./trip";

export type Screen = "title" | "intro" | "play" | "over";

export type Session = {
  screen: Screen;
  /** The player's menu is open. */
  paused: boolean;
  focused: boolean;
  visible: boolean;
  /** At least a fifth of the pond is on screen (a desktop page can scroll it away). */
  inView: boolean;
  /** A choice screen is open over the game (সব লেভেল or the album): nothing moves behind it. */
  sheet: boolean;
  /** The finger on the pond (its pointer id), and Space or Enter held. */
  pointer: number | null;
  key: boolean;
  /** A press since the last step, so a tap shorter than a step still counts. */
  pressed: boolean;
  /** The first pointerdown after coming back to the window only wakes the game; it never strikes. */
  swallow: boolean;
  sound: boolean;
  /** The reel hum is playing. */
  hum: boolean;
  /** Event time the end screen appeared: its keys count only from a fresh press after it. */
  overAt: number;
  /** Seconds of breath after চালিয়ে যাও before the water moves again. */
  breath: number;
};

export const createSession = (sound: boolean): Session => ({
  screen: "title", paused: false, focused: true, visible: true, inView: true, sheet: false,
  pointer: null, key: false, pressed: false, swallow: false, sound, hum: false, overAt: 0, breath: 0,
});

/** The water moves only on the play screen, with the menu and the sheets shut, the tab showing, the window focused and the pond in view. */
export const ticking = (s: Session) => s.screen === "play" && !s.paused && !s.sheet && s.focused && s.visible && s.inView;

/** The reel hums only while a fish is on the line and the water is moving, with sound on. */
export const wantHum = (s: Session, trip: Pick<Trip, "phase">) => ticking(s) && s.sound && trip.phase === P.REEL;

export type Hum = { start: () => void; stop: () => void };
/** Starts or stops the hum to match what the session wants. Called every step and after every event below. */
export function syncHum(s: Session, trip: Pick<Trip, "phase">, hum: Hum) {
  const want = wantHum(s, trip);
  if (want === s.hum) return;
  s.hum = want;
  if (want) hum.start(); else hum.stop();
}

/** No finger or key outlives a blur, a hidden tab, the menu, a sheet or a screen change. */
export function letGo(s: Session) { s.pointer = null; s.key = false; s.pressed = false; }

/** Window blur (real, or the player's synthetic one): its keyup and pointerup never come, so let go now. */
export function blur(s: Session) { s.focused = false; letGo(s); if (s.screen === "play") s.swallow = true; }
export function focus(s: Session) { s.focused = true; }
export function hide(s: Session) { s.visible = false; s.focused = false; letGo(s); if (s.screen === "play") s.swallow = true; }
export function show(s: Session) { s.visible = true; s.focused = true; }
export function setInView(s: Session, inView: boolean) { s.inView = inView; if (!inView) letGo(s); }
/** The player's menu opened. */
export function pause(s: Session) { s.paused = true; letGo(s); }
export const BREATH = 0.35;
/** চালিয়ে যাও: fresh hands, and a breath before the water moves. The click on চালিয়ে যাও was the wake-up. */
export function resume(s: Session) { s.paused = false; s.breath = BREATH; s.swallow = false; letGo(s); }
/** True while the breath lasts: the step waits. */
export function breathing(s: Session, dt: number) {
  if (!(s.breath > 0)) return false;
  s.breath -= dt;
  return true;
}
export function openSheet(s: Session) { s.sheet = true; letGo(s); }
export function closeSheet(s: Session) { s.sheet = false; letGo(s); }
/** The site-wide switch. Turning it off has already stopped every loop in the kit. */
export function setSound(s: Session, on: boolean) { s.sound = on; if (!on) s.hum = false; }

export function goTo(s: Session, screen: Screen, at = 0) {
  s.screen = screen; s.breath = 0; s.sheet = false; s.swallow = false;
  letGo(s);
  if (screen === "over") s.overAt = at;
}

/** A finger lands on the pond. False (and nothing held) when it doesn't count: the water isn't moving, or it's the wake-up tap. */
export function pointerDown(s: Session, id: number) {
  if (s.swallow) { s.swallow = false; return false; }
  if (!ticking(s) || s.pointer !== null) return false;
  s.pointer = id; s.pressed = true;
  return true;
}
export function pointerUp(s: Session, id: number) { if (id === s.pointer) s.pointer = null; }

export const isGameKey = (key: string) => key === " " || key === "Enter";
/** Space or Enter goes down. Ignored (and nothing held) unless the water is moving. */
export function keyDown(s: Session) {
  if (!ticking(s)) return false;
  s.swallow = false;
  if (!s.key) { s.key = true; s.pressed = true; }
  return true;
}
export function keyUp(s: Session) { s.key = false; }

export const held = (s: Session) => s.pointer !== null || s.key;
/** This step's input for the trip: held, and whether a press came since the last step (consumed). */
export function takePress(s: Session) {
  const pressed = s.pressed;
  s.pressed = false;
  return pressed;
}

/** End-screen keys: a fresh, non-repeating keydown that arrived after the screen appeared. */
export const freshResultKey = (s: Session, event: { timeStamp: number; repeat: boolean }) =>
  s.screen === "over" && !s.paused && !s.sheet && !event.repeat && event.timeStamp > s.overAt;

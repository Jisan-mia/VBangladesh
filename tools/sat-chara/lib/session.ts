// The page around the round: which screen shows, the player's pause, the level list, window focus, the pull or key in
// the hand, and the stretch hum. Pure, so the statechart's bug paths replay in node tests (tests/session.test.ts); the
// component forwards every event here and does what syncHum asks.

export type Screen = "title" | "play" | "over";
/** What the hand holds: a finger or mouse pulling the ball back, or Space/Enter pressed down. */
export type Hold = "none" | "pull" | "key";

/** Taps and keys this soon after চালিয়ে যাও only wake the game; they never throw. */
export const RESUME_GUARD = 250;
/** The end screen ignores keys for this long after it appears, so a throw key still down never skips it. */
export const RESULT_GUARD = 450;

export type Session = {
  screen: Screen;
  /** The player's menu is open. */
  paused: boolean;
  /** সব লেভেল is open. */
  sheet: boolean;
  focused: boolean;
  visible: boolean;
  hold: Hold;
  /** The pull has moved past the tap slop: it aims (and hums) instead of being a tap. */
  dragging: boolean;
  sound: boolean;
  /** The hum this session started and hasn't stopped. */
  hum: boolean;
  /** Event times (ms): the end screen appeared, play last resumed. */
  overAt: number;
  resumeAt: number;
};

export const createSession = (sound: boolean): Session => ({
  screen: "title", paused: false, sheet: false, focused: true, visible: true, hold: "none", dragging: false, sound, hum: false, overAt: 0, resumeAt: -Infinity,
});

/** The round steps (the flight, the clock, টুনি and মিঠু) only here. */
export const ticking = (s: Session) => s.screen === "play" && !s.paused && !s.sheet && s.focused && s.visible;
/** A press at event time `now` may aim or throw: the round steps, and it isn't the wake-up after a pause. */
export const canPress = (s: Session, now: number) => ticking(s) && now - s.resumeAt >= RESUME_GUARD;

function letGo(s: Session) { s.hold = "none"; s.dragging = false; }

/** Window blur (real, or the player's synthetic one): no keyup or pointerup will come, so nothing counts as held. */
export function blur(s: Session) { s.focused = false; letGo(s); }
export function focus(s: Session) { s.focused = true; }
export function hide(s: Session) { s.visible = false; s.focused = false; letGo(s); }
export function show(s: Session) { s.visible = true; s.focused = true; }
/** The player's menu opened. */
export function pause(s: Session) { s.paused = true; letGo(s); }
/** চালিয়ে যাও: fresh hands, and a short breath before a press counts. */
export function resume(s: Session, now: number) { s.paused = false; letGo(s); s.resumeAt = now; }
export function openSheet(s: Session) { s.sheet = true; letGo(s); }
export function closeSheet(s: Session, now: number) { s.sheet = false; s.resumeAt = now; }
/** The site-wide switch. Turning it off has already stopped every loop in the kit. */
export function setSound(s: Session, on: boolean) { s.sound = on; if (!on) s.hum = false; }

export function goTo(s: Session, screen: Screen, at = 0) {
  s.screen = screen;
  letGo(s);
  if (screen === "over") s.overAt = at;
}

/** A finger or mouse goes down on the lane while the ball is in the hand. */
export function pullStart(s: Session, now: number, aiming: boolean) {
  if (!aiming || s.hold !== "none" || !canPress(s, now)) return false;
  s.hold = "pull";
  s.dragging = false;
  return true;
}
/** The pull moved past the tap slop: from now on it aims. */
export function pullMoved(s: Session) { if (s.hold === "pull") s.dragging = true; }
/** pointerup. "throw" after a real pull, "tap" for a still press, "none" if the pull was already let go (blur, pause). */
export function pullEnd(s: Session): "throw" | "tap" | "none" {
  if (s.hold !== "pull") return "none";
  const dragged = s.dragging;
  letGo(s);
  if (!ticking(s)) return "none";
  return dragged ? "throw" : "tap";
}
/** pointercancel, or a pull brought back to where it started. */
export function pullCancel(s: Session) { if (s.hold === "pull") letGo(s); }

/** Space or Enter goes down during play. True when it should act: a fresh press (never the auto-repeat) while the round steps. */
export function keyDown(s: Session, event: { repeat: boolean; timeStamp: number }) {
  const fresh = !event.repeat && s.hold !== "key";
  if (s.hold === "none") s.hold = "key";
  return fresh && canPress(s, event.timeStamp);
}
export function keyUp(s: Session) { if (s.hold === "key") letGo(s); }

/** End screen keys: a fresh, non-repeating keydown that arrived a moment after the screen appeared. */
export const freshResultKey = (s: Session, event: { timeStamp: number; repeat: boolean }) =>
  s.screen === "over" && !s.paused && !s.sheet && !event.repeat && event.timeStamp > s.overAt + RESULT_GUARD;

/** The stretch hum plays only while a real pull aims on a live round with sound on. */
export const humWanted = (s: Session) => ticking(s) && s.hold === "pull" && s.dragging && s.sound;

export type Loops = { start: () => void; stop: () => void };
/** Starts or stops the hum to match what the session wants. Call after every event and every step. */
export function syncHum(s: Session, loops: Loops) {
  const want = humWanted(s);
  if (want !== s.hum) { s.hum = want; if (want) loops.start(); else loops.stop(); }
}

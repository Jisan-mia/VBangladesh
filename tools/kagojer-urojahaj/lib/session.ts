// The run's screens as a small pure machine, so the statechart's rules replay in node tests against the code the component
// runs: title → (story, first run only) → flying ⇄ paused → over. The level list (`picking`) is a choice screen that
// freezes play. Time comes in as `now` (ms); the component owns the timers, this owns when they may act.

export type Phase = "title" | "story" | "flying" | "paused" | "over";
/** The end screen's buttons and keys wait this long, so a tap meant for the plane never skips the result. */
export const GUARD_MS = 700;
/** After a resume, the flight waits this long before it moves again. */
export const BREATH_MS = 450;

export type Session = {
  phase: Phase;
  /** What a resume returns to. */
  from: "flying" | "story";
  /** The tab is shown and the window has focus. */
  visible: boolean; focused: boolean;
  /** The level list is open. */
  picking: boolean;
  /** Bumped on every new run and reset: a celebration queued for an older run is dropped. */
  run: number;
  overAt: number;
  /** No flight time passes before this (a breath after a throw or a resume). */
  holdUntil: number;
  /** A finger or key is really down, and whether the game counts it as holding the nose up. */
  held: boolean;
};

export const createSession = (): Session => ({ phase: "title", from: "flying", visible: true, focused: true, picking: false, run: 0, overAt: 0, holdUntil: 0, held: false });

export const canPlay = (s: Session) => s.visible && s.focused;
/** The flight advances only here. */
export const moving = (s: Session, now: number) => s.phase === "flying" && !s.picking && canPlay(s) && now >= s.holdUntil;
/** The nose is held up only while a finger or key is down and the flight is moving. */
export const holding = (s: Session, now: number) => s.held && moving(s, now);

/** ছোড়ো, Space, a press on the classroom: throw from the title (the story first, if it hasn't been seen). */
export function start(s: Session, story: boolean, now: number) {
  if (s.phase !== "title" || s.picking || !canPlay(s)) return false;
  s.phase = story ? "story" : "flying";
  s.run++;
  s.holdUntil = now + 200;
  return true;
}
export function storyDone(s: Session, now: number) {
  if (s.phase !== "story") return false;
  s.phase = "flying";
  s.holdUntil = now + 350;
  s.held = false;
  return true;
}
/** The player's pause, blur, a hidden tab, P: freezes the flight or the story and lets go of the nose. */
export function pause(s: Session) {
  s.held = false;
  if (s.phase !== "flying" && s.phase !== "story") return false;
  s.from = s.phase;
  s.phase = "paused";
  return true;
}
/** চালিয়ে যাও (or the first tap back on our own cover): back to what was paused, after a breath. The tap is not a hold. */
export function resume(s: Session, now: number) {
  if (s.phase !== "paused" || s.picking || !canPlay(s)) return false;
  s.phase = s.from;
  s.holdUntil = now + BREATH_MS;
  s.held = false;
  return true;
}
export function away(s: Session, what: "blur" | "hide") {
  if (what === "blur") s.focused = false; else { s.visible = false; s.focused = false; }
  pause(s);
}
export function back(s: Session, what: "focus" | "show") {
  if (what === "focus") s.focused = true; else { s.visible = true; s.focused = true; }
}
/** A finger or key goes down (only counts while flying) or comes up. */
export function press(s: Session, down: boolean) {
  s.held = down && s.phase === "flying" && !s.picking && canPlay(s);
}
/** The plane landed, or the last page came down. */
export function finish(s: Session, now: number) {
  if (s.phase !== "flying") return false;
  s.phase = "over";
  s.overAt = now;
  s.held = false;
  return true;
}
/** আবার খেলো / পরের লেভেল / Enter on the end screen: only after the guard, and only for a key pressed after the screen appeared. */
export function again(s: Session, now: number, key?: { at: number; repeat: boolean }) {
  if (s.phase !== "over" || s.picking || !canPlay(s) || now - s.overAt < GUARD_MS) return false;
  if (key && (key.repeat || key.at <= s.overAt)) return false;
  s.phase = "flying";
  s.run++;
  s.holdUntil = now + 200;
  s.held = false;
  return true;
}
/** নতুন করে শুরু, a level picked, a friend's link: a fresh flight on its title. Every queued celebration is dropped. */
export function reset(s: Session) {
  s.phase = "title";
  s.picking = false;
  s.held = false;
  s.run++;
}
/** The level list opens (pausing a flight in progress) or closes. */
export function pick(s: Session, open: boolean) {
  if (open && (s.phase === "flying" || s.phase === "story")) pause(s);
  s.picking = open;
  s.held = false;
  return true;
}
/** A celebration timer fires: it may play only on its own run's end screen. */
export const cheerMayPlay = (s: Session, run: number) => s.phase === "over" && s.run === run && !s.picking;

/**
 * The wind loop's next move, checked every step: it plays exactly while the flight moves with sound on. A loop made while
 * sound was off is a silent stub, so sound coming back always means a new loop (never `??=` the old one).
 */
export function windStep(live: boolean, wanted: boolean, on: boolean): "start" | "stop" | "keep" {
  if (wanted && on && !live) return "start";
  if (live && (!wanted || !on)) return "stop";
  return "keep";
}

// The run's screens as a small pure machine, so the statechart's rules replay in node tests against the code the component runs:
// title → (story, first run only) → playing ⇄ paused → over. সব পাটি (`picking`) is a choice screen that freezes play.
// Time comes in as `now` (ms); the component owns the timers, this owns when they may act.

export type Phase = "title" | "story" | "playing" | "paused" | "over";
/** The end screen's buttons and keys wait this long, so a tap meant for the strip never skips the result. */
export const GUARD_MS = 700;
/** After a resume, the frame waits this long before anything falls again. */
export const BREATH_MS = 500;

export type Session = {
  phase: Phase;
  /** What a resume returns to. */
  from: "playing" | "story";
  /** The tab is shown, the window has focus, and the frame is on screen. */
  visible: boolean; focused: boolean; inView: boolean;
  /** সব পাটি is open. */
  picking: boolean;
  /** Bumped on every new run and reset: a celebration queued for an older run is dropped. */
  run: number;
  overAt: number;
  /** Nothing falls before this (a breath after a start or a resume). */
  holdUntil: number;
};

export const createSession = (): Session => ({ phase: "title", from: "playing", visible: true, focused: true, inView: true, picking: false, run: 0, overAt: 0, holdUntil: 0 });

export const canPlay = (s: Session) => s.visible && s.focused && s.inView;
/** The frame advances only here. */
export const moving = (s: Session, now: number) => s.phase === "playing" && !s.picking && canPlay(s) && now >= s.holdUntil;

/** বোনা শুরু, a key or a tap on the frame: start from the title (the story first, if it hasn't been seen). */
export function start(s: Session, story: boolean, now: number) {
  if (s.phase !== "title" || s.picking || !canPlay(s)) return false;
  s.phase = story ? "story" : "playing";
  s.run++;
  s.holdUntil = now + 200;
  return true;
}
export function storyDone(s: Session, now: number) {
  if (s.phase !== "story") return false;
  s.phase = "playing";
  s.holdUntil = now + 300;
  return true;
}
/** The player's pause, blur, a hidden tab, the frame scrolled off, P: freezes the frame or the story. */
export function pause(s: Session) {
  if (s.phase !== "playing" && s.phase !== "story") return false;
  s.from = s.phase;
  s.phase = "paused";
  return true;
}
/** চালিয়ে যাও (or the first tap back on our own cover): back to what was paused, after a breath. Never off screen. */
export function resume(s: Session, now: number) {
  if (s.phase !== "paused" || s.picking || !canPlay(s)) return false;
  s.phase = s.from;
  s.holdUntil = now + BREATH_MS;
  return true;
}
export function away(s: Session, what: "blur" | "hide" | "scroll") {
  if (what === "blur") s.focused = false;
  else if (what === "scroll") s.inView = false;
  else { s.visible = false; s.focused = false; }
  pause(s);
}
export function back(s: Session, what: "focus" | "show" | "scroll") {
  if (what === "focus") s.focused = true;
  else if (what === "scroll") s.inView = true;
  else { s.visible = true; s.focused = true; }
}
/** The goal was woven or the frame filled. */
export function finish(s: Session, now: number) {
  if (s.phase !== "playing") return false;
  s.phase = "over";
  s.overAt = now;
  return true;
}
/** আবার খেলো / Enter on the end screen: only after the guard, only on screen, and only for a key pressed after the screen appeared. */
export function again(s: Session, now: number, key?: { at: number; repeat: boolean }) {
  if (s.phase !== "over" || s.picking || !canPlay(s) || now - s.overAt < GUARD_MS) return false;
  if (key && (key.repeat || key.at <= s.overAt)) return false;
  s.phase = "playing";
  s.run++;
  s.holdUntil = now + 250;
  return true;
}
/** নতুন করে শুরু, a পাটি picked, পরের পাটি, a friend's link: a fresh run on the title. Every queued celebration is dropped. */
export function reset(s: Session) {
  s.phase = "title";
  s.picking = false;
  s.run++;
}
/** সব পাটি opens (pausing a run in progress) or closes. */
export function pick(s: Session, open: boolean) {
  if (open && (s.phase === "playing" || s.phase === "story")) pause(s);
  s.picking = open;
  return true;
}
/** A celebration timer fires: it may play only on its own run's end screen. */
export const cheerMayPlay = (s: Session, run: number) => s.phase === "over" && s.run === run && !s.picking;

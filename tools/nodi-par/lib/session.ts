// The crossing's screens as a small pure machine, so the statechart's rules replay in node tests against the code the component runs:
// title → (story, first run only) → playing ⇄ paused → over. সব নদী (`picking`) is a choice screen that freezes play.
// Time comes in as `now` (ms); the component owns the timers, this owns when they may act.

export type Phase = "title" | "story" | "playing" | "paused" | "over";
/** The end screen's buttons and keys wait this long, so a tap meant for a bird never skips the result. */
export const GUARD_MS = 700;
/** After a resume, the river waits this long before it moves again. */
export const BREATH_MS = 500;

export type Session = {
  phase: Phase;
  /** What a resume returns to. */
  from: "playing" | "story";
  /** The tab is shown and the window has focus. */
  visible: boolean; focused: boolean;
  /** সব নদী is open. */
  picking: boolean;
  /** Bumped on every new run and reset: a celebration queued for an older run is dropped. */
  run: number;
  overAt: number;
  /** No game time passes before this (a breath after a start or a resume). */
  holdUntil: number;
};

export const createSession = (): Session => ({ phase: "title", from: "playing", visible: true, focused: true, picking: false, run: 0, overAt: 0, holdUntil: 0 });

export const canPlay = (s: Session) => s.visible && s.focused;
/** The river and its clock advance only here. */
export const moving = (s: Session, now: number) => s.phase === "playing" && !s.picking && canPlay(s) && now >= s.holdUntil;
/** A hop counts only here (during the breath after a resume the hands already work: the river is just still). */
export const canHop = (s: Session) => s.phase === "playing" && !s.picking && canPlay(s);

/** লাফ দাও, Enter or Space: start from the title (the story first, if it hasn't been seen). */
export function start(s: Session, story: boolean, now: number) {
  if (s.phase !== "title" || s.picking || !canPlay(s)) return false;
  s.phase = story ? "story" : "playing";
  s.run++;
  s.holdUntil = now + 250;
  return true;
}
export function storyDone(s: Session, now: number) {
  if (s.phase !== "story") return false;
  s.phase = "playing";
  s.holdUntil = now + 400;
  return true;
}
/** The player's pause, blur, a hidden tab, P: freezes the river or the story. */
export function pause(s: Session) {
  if (s.phase !== "playing" && s.phase !== "story") return false;
  s.from = s.phase;
  s.phase = "paused";
  return true;
}
/** চালিয়ে যাও (or the first tap back on our own cover): back to what was paused, after a breath. */
export function resume(s: Session, now: number) {
  if (s.phase !== "paused" || s.picking || !canPlay(s)) return false;
  s.phase = s.from;
  s.holdUntil = now + BREATH_MS;
  return true;
}
export function away(s: Session, what: "blur" | "hide") {
  if (what === "blur") s.focused = false; else { s.visible = false; s.focused = false; }
  pause(s);
}
export function back(s: Session, what: "focus" | "show") {
  if (what === "focus") s.focused = true; else { s.visible = true; s.focused = true; }
}
/** The far ghat's bell. */
export function finish(s: Session, now: number) {
  if (s.phase !== "playing") return false;
  s.phase = "over";
  s.overAt = now;
  return true;
}
/** আবার খেলো / Enter on the end screen: only after the guard, and only for a key pressed after the screen appeared. */
export function again(s: Session, now: number, key?: { at: number; repeat: boolean }) {
  if (!choiceOk(s, now, key)) return false;
  s.phase = "playing";
  s.run++;
  s.holdUntil = now + 250;
  return true;
}
/** May the end screen take a choice now? (`at` is the key's own time, on the same clock as `now`.) */
export function choiceOk(s: Session, now: number, key?: { at: number; repeat: boolean }) {
  if (s.phase !== "over" || s.picking || !canPlay(s) || now - s.overAt < GUARD_MS) return false;
  return !key || (!key.repeat && key.at > s.overAt);
}
/** নতুন করে শুরু, a river picked, পরের নদী, a friend's link: a fresh river on the title. Every queued celebration is dropped. */
export function reset(s: Session) {
  s.phase = "title";
  s.picking = false;
  s.run++;
}
/** সব নদী opens (pausing a round in progress) or closes. */
export function pick(s: Session, open: boolean) {
  if (open && (s.phase === "playing" || s.phase === "story")) pause(s);
  s.picking = open;
  return true;
}
/** A celebration timer fires: it may play only on its own run's end screen. */
export const cheerMayPlay = (s: Session, run: number) => s.phase === "over" && s.run === run && !s.picking;

/**
 * A sound loop's next move, checked every step: it plays exactly while it is wanted with sound on. A loop made while sound
 * was off is a silent stub, so sound coming back always means a new loop (never `??=` the old one).
 */
export function loopStep(live: boolean, wanted: boolean, on: boolean): "start" | "stop" | "keep" {
  if (wanted && on && !live) return "start";
  if (live && (!wanted || !on)) return "stop";
  return "keep";
}

// The ride's screens as a small pure machine, so the statechart's rules replay in node tests against the code the
// component runs: title → (story, first run only) → riding ⇄ paused → over. The level list (`picking`) is a choice
// screen that freezes play. Time comes in as `now` (ms); the component owns the timers, this owns when they may act.

export type Phase = "title" | "story" | "riding" | "paused" | "over";
/** The end screen's buttons and keys wait this long, so a tap meant for the road never skips the result. */
export const GUARD_MS = 700;
/** After a resume, the road waits this long before it moves again. */
export const BREATH_MS = 450;
/** After রওনা দাও, a short breath before the road moves. */
export const START_MS = 250;

export type Session = {
  phase: Phase;
  /** What a resume returns to. */
  from: "riding" | "story";
  /** The tab is shown, the window has focus, the road is on screen. */
  visible: boolean; focused: boolean; inView: boolean;
  /** The level list is open. */
  picking: boolean;
  /** Bumped on every new run and reset: a celebration queued for an older run is dropped. */
  run: number;
  overAt: number;
  /** No ride time passes before this (a breath after a start or a resume). */
  holdUntil: number;
};

export const createSession = (): Session => ({ phase: "title", from: "riding", visible: true, focused: true, inView: true, picking: false, run: 0, overAt: 0, holdUntil: 0 });

export const canPlay = (s: Session) => s.visible && s.focused && s.inView;
/** The road rolls only here. */
export const moving = (s: Session, now: number) => s.phase === "riding" && !s.picking && canPlay(s) && now >= s.holdUntil;
/** A lane tap counts only while the road rolls (the breath after a resume included, so a quick thumb isn't lost). */
export const steerable = (s: Session) => s.phase === "riding" && !s.picking && canPlay(s);

/** রওনা দাও, Space, a tap on the road: set off from the title (the story first, if it hasn't been seen). */
export function start(s: Session, story: boolean, now: number) {
  if (s.phase !== "title" || s.picking || !canPlay(s)) return false;
  s.phase = story ? "story" : "riding";
  s.run++;
  s.holdUntil = now + START_MS;
  return true;
}
export function storyDone(s: Session, now: number) {
  if (s.phase !== "story") return false;
  s.phase = "riding";
  s.holdUntil = now + 350;
  return true;
}
/** The player's pause, blur, a hidden tab, scrolling away, P: freezes the ride or the story. */
export function pause(s: Session) {
  if (s.phase !== "riding" && s.phase !== "story") return false;
  s.from = s.phase;
  s.phase = "paused";
  return true;
}
/** চালিয়ে যাও (or the first tap back on our own cover): back to what was paused, after a breath. The tap is not a move. */
export function resume(s: Session, now: number) {
  if (s.phase !== "paused" || s.picking || !canPlay(s)) return false;
  s.phase = s.from;
  s.holdUntil = now + BREATH_MS;
  return true;
}
export function away(s: Session, what: "blur" | "hide" | "scroll") {
  if (what === "blur") s.focused = false;
  else if (what === "hide") { s.visible = false; s.focused = false; }
  else s.inView = false;
  pause(s);
}
export function back(s: Session, what: "focus" | "show" | "scroll") {
  if (what === "focus") s.focused = true;
  else if (what === "show") { s.visible = true; s.focused = true; }
  else s.inView = true;
}
/** The bike reached the place, or the last allowed bump stopped it. */
export function finish(s: Session, now: number) {
  if (s.phase !== "riding") return false;
  s.phase = "over";
  s.overAt = now;
  return true;
}
/** আবার খেলো / Enter on the end screen: only after the guard, and only for a key pressed after the screen appeared. */
export function again(s: Session, now: number, key?: { at: number; repeat: boolean }) {
  if (s.phase !== "over" || s.picking || !canPlay(s) || now - s.overAt < GUARD_MS) return false;
  if (key && (key.repeat || key.at <= s.overAt)) return false;
  s.phase = "riding";
  s.run++;
  s.holdUntil = now + START_MS;
  return true;
}
/** The end screen's other choices (পরের লেভেল, সব লেভেল) wait for the same guard and fresh press. */
export function choiceReady(s: Session, now: number, key?: { at: number; repeat: boolean }) {
  if (s.phase !== "over" || s.picking || now - s.overAt < GUARD_MS) return false;
  return !key || (!key.repeat && key.at > s.overAt);
}
/** নতুন করে শুরু, a level picked, a friend's link: a fresh ride on its title. Every queued celebration is dropped. */
export function reset(s: Session) {
  s.phase = "title";
  s.picking = false;
  s.run++;
}
/** The level list opens (pausing a ride in progress) or closes. */
export function pick(s: Session, open: boolean) {
  if (open) pause(s);
  s.picking = open;
}
/** A friend's link may change the route on screen only while no ride, pause or story is in progress; until then it is kept for after. */
export const friendMayLoad = (s: Session) => s.phase === "title" || s.phase === "over";
/** A celebration timer fires: it may play only on its own run's end screen. */
export const cheerMayPlay = (s: Session, run: number) => s.phase === "over" && s.run === run && !s.picking;

/**
 * The road loop's next move, checked every step: it plays exactly while the road rolls with sound on. A loop made while
 * sound was off is a silent stub, so sound coming back always means a new loop (never `??=` the old one).
 */
export function loopStep(live: boolean, wanted: boolean, on: boolean): "start" | "stop" | "keep" {
  if (wanted && on && !live) return "start";
  if (live && (!wanted || !on)) return "stop";
  return "keep";
}

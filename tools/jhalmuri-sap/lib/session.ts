// The run's screens as a small pure machine, so the statechart's rules can be replayed in node tests against the same code the
// component runs: title → (story, first time only) → playing ⇄ paused → over → playing again. Time comes in as `now` (ms).
// The component owns the timers; this owns the rules about when they may act.

export type Phase = "title" | "story" | "playing" | "paused" | "over";
/** The card's buttons and keys wait this long after a crash, so taps meant for the turn buttons don't skip the result. */
export const GUARD_MS = 700;

export type Session = {
  phase: Phase;
  /** What a resume returns to. */
  from: "playing" | "story";
  /** The stage is on screen, the tab is shown and the window has focus. */
  inView: boolean; visible: boolean; focused: boolean;
  /** Bumped on every reset and new run: a celebration queued for an older run is dropped. */
  run: number;
  /** When the end screen appeared; its keys count only from a fresh press after this. */
  overAt: number;
  /** The level list is open (a choice screen: nothing moves). */
  picking: boolean;
};

export const createSession = (): Session => ({ phase: "title", from: "playing", inView: true, visible: true, focused: true, run: 0, overAt: 0, picking: false });

export const canPlay = (s: Session) => s.inView && s.visible && s.focused;

/** খেলো, an arrow, a swipe: start from the title (the story first, if it hasn't been seen). Refused while away or off-screen. */
export function start(s: Session, story: boolean) {
  if (s.phase !== "title" || s.picking || !canPlay(s)) return false;
  s.phase = story ? "story" : "playing";
  s.run++;
  return true;
}
/** The story ends or is skipped. */
export function storyDone(s: Session) {
  if (s.phase !== "story") return false;
  s.phase = "playing";
  return true;
}
/** The player's pause (blur, hide, scroll away, Escape, ⏸): freezes the snake or the story. */
export function pause(s: Session) {
  if (s.phase !== "playing" && s.phase !== "story") return false;
  s.from = s.phase;
  s.phase = "paused";
  return true;
}
/** চালিয়ে যাও: back to what was paused, only when the game can be seen. */
export function resume(s: Session) {
  if (s.phase !== "paused" || !canPlay(s)) return false;
  s.phase = s.from;
  return true;
}
/** The window, the tab or the stage: going away pauses (the player does it; this keeps the flags). */
export function away(s: Session, what: "blur" | "hide" | "scroll") {
  if (what === "blur") s.focused = false; else if (what === "hide") { s.visible = false; s.focused = false; } else s.inView = false;
  pause(s);
}
export function back(s: Session, what: "focus" | "show" | "scroll") {
  if (what === "focus") s.focused = true; else if (what === "show") { s.visible = true; s.focused = true; } else s.inView = true;
}
/** A crash or the last bite. */
export function finish(s: Session, now: number) {
  if (s.phase !== "playing") return false;
  s.phase = "over";
  s.overAt = now;
  return true;
}
/** আবার খেলো / পরের লেভেল / Enter on the end screen: only after the guard, and only for a key pressed after the screen appeared. */
export function again(s: Session, now: number, key?: { at: number; repeat: boolean }) {
  if (s.phase !== "over" || s.picking || !canPlay(s) || now - s.overAt < GUARD_MS) return false;
  if (key && (key.repeat || key.at <= s.overAt)) return false;
  s.phase = "playing";
  s.run++;
  return true;
}
/** নতুন করে শুরু, a level picked, a friend's link: a fresh board on the title screen. Every queued celebration is dropped. */
export function reset(s: Session) {
  s.phase = "title";
  s.picking = false;
  s.run++;
}
export function pick(s: Session, open: boolean) {
  if (open && s.phase !== "title" && s.phase !== "over") return false;
  s.picking = open;
  return true;
}
/** A celebration timer fires: it may play only on its own run's end screen. */
export const cheerMayPlay = (s: Session, run: number) => s.phase === "over" && s.run === run;
/** The snake moves only here. */
export const moving = (s: Session) => s.phase === "playing" && !s.picking && canPlay(s);

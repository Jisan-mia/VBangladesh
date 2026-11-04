// The screens around a match as a small pure machine, so the statechart's rules replay in node tests against the code the
// component runs: title → (story, first time only) → playing ⇄ paused → over → playing again. Time comes in as `now` (ms).
// The component owns the timers and the canvas; this owns the rules about when anything may move or act.

export type Phase = "title" | "story" | "playing" | "paused" | "over";
/** The card's buttons and keys wait this long, so a tap meant for the last dive doesn't skip the result. */
export const GUARD_MS = 700;

export type Session = {
  phase: Phase;
  /** What a resume returns to. */
  from: "playing" | "story";
  /** The stage is on screen, the tab is shown and the window has focus. */
  inView: boolean; visible: boolean; focused: boolean;
  /** Bumped on every reset and new match: a celebration queued for an older match is dropped. */
  run: number;
  /** When the end screen appeared; its keys count only from a fresh press after this. */
  overAt: number;
  /** The match list is open (a choice screen: nothing moves). */
  picking: boolean;
  /** Set when the window loses focus: the first press after coming back only brings you back, it never kicks or dives. */
  swallow: boolean;
  /** A finger is on the field (released on blur, hide and pause). */
  finger: boolean;
};

export const createSession = (): Session => ({ phase: "title", from: "playing", inView: true, visible: true, focused: true, run: 0, overAt: 0, picking: false, swallow: false, finger: false });

export const canPlay = (s: Session) => s.inView && s.visible && s.focused;

/** খেলো, Enter or Space on the title: the story first, if it hasn't been seen. Refused while away or under the list. */
export function start(s: Session, story: boolean) {
  if (s.phase !== "title" || s.picking || !canPlay(s)) return false;
  s.phase = story ? "story" : "playing";
  s.swallow = false;
  s.run++;
  return true;
}
export function storyDone(s: Session) {
  if (s.phase !== "story") return false;
  s.phase = "playing";
  return true;
}
/** The player's pause (blur, hide, scroll away, Escape, ⏸, P): freezes the match or the story, and lets go of the finger. */
export function pause(s: Session) {
  s.finger = false;
  if (s.phase !== "playing" && s.phase !== "story") return false;
  s.from = s.phase;
  s.phase = "paused";
  return true;
}
/** চালিয়ে যাও: back to what was paused, only when the game can be seen. The press that resumed is spent. */
export function resume(s: Session) {
  if (s.phase !== "paused" || !canPlay(s)) return false;
  s.phase = s.from;
  s.swallow = false;
  return true;
}
/** The window or the tab goes away (the game's own listener): the finger is let go, and the next press back is spent. */
export function lostFocus(s: Session, hidden = false) {
  s.finger = false;
  s.focused = false;
  s.swallow = true;
  if (hidden) s.visible = false;
}
/** Going away as a whole: the game's listener, then the player's pause (it opens its menu once you've touched the game). */
export function away(s: Session, what: "blur" | "hide" | "scroll") {
  if (what === "scroll") { s.finger = false; s.inView = false; } else lostFocus(s, what === "hide");
  pause(s);
}
export function back(s: Session, what: "focus" | "show" | "scroll") {
  if (what === "focus") s.focused = true; else if (what === "show") { s.visible = true; s.focused = true; } else s.inView = true;
}
/** A finger (or a key) on the field. False when it may not act: away, paused, or the first tap back after a blur. */
export function press(s: Session, pointer = true) {
  if (s.phase !== "playing" || s.picking || !canPlay(s)) return false;
  if (pointer && s.swallow) { s.swallow = false; return false; }
  return true;
}
/** The match is decided. Once: a second call (another step in the same frame) does nothing. */
export function finish(s: Session, now: number) {
  if (s.phase !== "playing") return false;
  s.phase = "over";
  s.overAt = now;
  s.finger = false;
  return true;
}
/** আবার খেলো / পরের ম্যাচ / Enter on the end screen: only after the guard, and only for a key pressed after the screen appeared. */
export function again(s: Session, now: number, key?: { at: number; repeat: boolean }) {
  if (s.phase !== "over" || s.picking || !canPlay(s) || now - s.overAt < GUARD_MS) return false;
  if (key && (key.repeat || key.at <= s.overAt)) return false;
  s.phase = "playing";
  s.swallow = false;
  s.run++;
  return true;
}
/** নতুন করে শুরু, a match picked, a friend's link: a fresh match on the title. Every queued celebration is dropped. */
export function reset(s: Session) {
  s.phase = "title";
  s.picking = false;
  s.finger = false;
  s.run++;
}
/** The match list opens only on the title or the card (a choice screen: nothing runs under it). */
export function pick(s: Session, open: boolean) {
  if (open && s.phase !== "title" && s.phase !== "over") return false;
  s.picking = open;
  return true;
}
/** A celebration timer fires: it may play only on its own match's end screen. */
export const cheerMayPlay = (s: Session, run: number) => s.phase === "over" && s.run === run;
/** The match clock runs only here. */
export const moving = (s: Session) => s.phase === "playing" && !s.picking && canPlay(s);

// The run's screens and what the hand holds, as a small pure machine, so the statechart's rules replay in node tests
// against the code the component runs: title → playing ⇄ paused → over → playing again. Time comes in as `now` (ms).

export type Phase = "title" | "playing" | "paused" | "over";
/** What is held: a finger pulling on the board, a finger on মারো, or a key (Space or Enter). */
export type Hold = "none" | "pull" | "button" | "key";
/** The end screen's buttons and keys wait this long, so a thumb still on মারো doesn't skip the result. */
export const GUARD_MS = 600;

export type Session = {
  phase: Phase;
  /** Why it's paused: you went away (blur, hidden tab, the player's menu, the stage scrolled off) or opened সব বোর্ড. */
  why: "away" | "sheet" | null;
  visible: boolean;
  focused: boolean;
  inView: boolean;
  hold: Hold;
  /** The key that started a key hold; only its own keyup lets go. */
  holdKey: string;
  /** Bumped on every reset and new run: a celebration queued for an older run is dropped. */
  run: number;
  /** When the end screen appeared; its keys count only from a fresh press after this. */
  overAt: number;
  /** সব বোর্ড is open. */
  sheet: boolean;
};

export const createSession = (): Session => ({ phase: "title", why: null, visible: true, focused: true, inView: true, hold: "none", holdKey: "", run: 0, overAt: 0, sheet: false });

export const canPlay = (s: Session) => s.visible && s.focused && s.inView;
/** The discs roll and the clock of the power meter runs only here. */
export const live = (s: Session) => s.phase === "playing" && !s.sheet && canPlay(s);

function letGo(s: Session) { s.hold = "none"; s.holdKey = ""; }

/** শুরু করো on the start card (or Enter there). */
export function start(s: Session) {
  if (s.phase !== "title" || s.sheet || !canPlay(s)) return false;
  s.phase = "playing";
  s.run++;
  return true;
}

/** The player's menu, blur, hide, scroll away or সব বোর্ড: play freezes and whatever was held is let go. */
export function pause(s: Session, why: "away" | "sheet") {
  letGo(s);
  if (s.phase === "playing") { s.phase = "paused"; s.why = why; return true; }
  if (s.phase === "paused" && why === "sheet") s.why = "sheet";
  return false;
}

/** চালিয়ে যাও ends an away pause; closing the sheet ends a sheet pause. Only when the game can be seen. */
export function resume(s: Session, why: "away" | "sheet") {
  if (s.phase !== "paused" || s.why !== why || s.sheet || !canPlay(s)) return false;
  s.phase = "playing";
  s.why = null;
  return true;
}

export function away(s: Session, what: "blur" | "hide" | "scroll") {
  if (what === "blur") s.focused = false;
  else if (what === "hide") { s.visible = false; s.focused = false; }
  else s.inView = false;
  pause(s, "away");
  letGo(s);
}
export function back(s: Session, what: "focus" | "show" | "scroll") {
  if (what === "focus") s.focused = true;
  else if (what === "show") { s.visible = true; s.focused = true; }
  else s.inView = true;
}

/** A pull, a press on মারো, or a keydown of Space/Enter: only while playing, seen, and with nothing else held. */
export function hold(s: Session, how: Exclude<Hold, "none">, key = "") {
  if (!live(s) || s.hold !== "none") return false;
  s.hold = how;
  s.holdKey = how === "key" ? key : "";
  return true;
}

/**
 * The release that ends a hold: pointerup, or the keyup of the very key that started it, wherever focus is and whether
 * the board shows. True means "strike now" (only while play is live); a release after the hold was already let go is nothing.
 */
export function release(s: Session, how: Exclude<Hold, "none">, key = "") {
  if (s.hold !== how || (how === "key" && key !== s.holdKey)) return false;
  letGo(s);
  return live(s);
}
/** pointercancel or a cancelled pull: let go without striking. */
export function cancel(s: Session) { letGo(s); }

/** The board is cleared, or out of strikes. */
export function finish(s: Session, now: number) {
  if (s.phase !== "playing") return false;
  s.phase = "over";
  s.overAt = now;
  letGo(s);
  return true;
}

/** আবার খেলো / পরের বোর্ড / Enter or R on the end screen: after the guard, and a key only if pressed after the screen appeared. */
export function again(s: Session, now: number, key?: { at: number; repeat: boolean }) {
  if (s.phase !== "over" || s.sheet || !canPlay(s) || now - s.overAt < GUARD_MS) return false;
  if (key && (key.repeat || key.at <= s.overAt)) return false;
  return true;
}

/** নতুন করে শুরু, a board picked, a friend's link, পরের বোর্ড: a fresh board on the start card. Queued celebrations are dropped. */
export function reset(s: Session) {
  s.phase = "title";
  s.why = null;
  s.sheet = false;
  s.run++;
  letGo(s);
}

/** আবার খেলো: the same board again, straight into play. */
export function replay(s: Session) {
  reset(s);
  s.phase = "playing";
}

export function openSheet(s: Session) {
  s.sheet = true;
  pause(s, "sheet");
}
export function closeSheet(s: Session) {
  s.sheet = false;
  resume(s, "sheet");
}

/** The pull's hum plays only while something is held during live play and the strike hasn't left yet. */
export const humWanted = (s: Session, aiming: boolean, power: number) => live(s) && s.hold !== "none" && aiming && power > 0;
/** A celebration timer fires: it may play only on its own run's end screen. */
export const cheerMayPlay = (s: Session, run: number) => s.phase === "over" && s.run === run;

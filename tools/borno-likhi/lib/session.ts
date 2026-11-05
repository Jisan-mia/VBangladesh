// The page around a set of letters: which screen shows, the finger on the board, the player's pause, going away and
// coming back, the kids' rest screen, and which keys count. Pure and mutable, so the statechart's bug paths replay in
// node tests (tests/session.test.ts); the component forwards events here and obeys.
// Spec: ai_docs/statecharts/borno-likhi/BornoLikhi.tla.

export type Screen = "title" | "play" | "end" | "levels";
/** The letter on the board: being traced, or finished and showing its picture. */
export type Letter = "tracing" | "drawn";

export type Session = {
  screen: Screen;
  back: "title" | "end" | "play";
  letter: Letter;
  /** The current letter is the set's last. */
  last: boolean;
  /** The one finger that counts on the board (its pointer id), or null. */
  pointer: number | null;
  paused: boolean;
  away: boolean;
  /** The first tap after coming back only wakes the game; it never writes. */
  swallow: boolean;
  /** The kids' daily limit has passed at a break: the rest screen shows on every screen but play. */
  resting: boolean;
  /** Which set is on screen, and the last one whose stars were saved and limit checked. */
  serial: number;
  recorded: number;
  /** Event times the picture and the end screen appeared: their keys count only from a fresh press after that. */
  drawnAt: number;
  endAt: number;
};

export const createSession = (): Session =>
  ({ screen: "title", back: "title", letter: "tracing", last: false, pointer: null, paused: false, away: false, swallow: false, resting: false, serial: 0, recorded: 0, drawnAt: 0, endAt: 0 });

/** The rest screen covers the stage at a break only: never over a letter being written. */
export const restShows = (s: Session) => s.resting && s.screen !== "play";

/**
 * খেলো, আবার খেলো or a set from the list. Opening a set is a break too: past today's limit (`over`, from atBreak())
 * nothing starts and the rest screen shows. Returns true when the set starts.
 */
export function begin(s: Session, over: boolean, last = false): boolean {
  s.resting = over;
  if (over || s.paused) { if (s.screen === "levels") s.screen = "title"; return false; }
  s.screen = "play"; s.serial += 1; s.letter = "tracing"; s.last = last; s.pointer = null; s.swallow = false;
  return true;
}

export type Touch = "ignored" | "woke" | "counts";
/** A finger goes down on the board. Only the first pointer counts, only while a letter is being traced. */
export function touchDown(s: Session, id: number): Touch {
  if (s.screen !== "play" || s.letter !== "tracing" || s.paused || restShows(s) || s.pointer !== null) return "ignored";
  // The click that brings the window back arrives before its focus event: it wakes the game and writes nothing.
  if (s.swallow || s.away) { s.swallow = false; return "woke"; }
  s.pointer = id;
  return "counts";
}
/**
 * A move of pointer `id`. `buttons` is 0 when nothing is pressed any more (a lift we never heard of, after a window
 * switch): the finger is released. Returns whether the move counts.
 */
export function touchMove(s: Session, id: number, buttons: number): boolean {
  if (s.pointer !== id) return false;
  if (buttons === 0) { s.pointer = null; return false; }
  return s.screen === "play" && s.letter === "tracing" && !s.paused && !s.away;
}
/** pointerup, pointercancel or lost capture. Returns true when it was the counted finger. */
export function touchUp(s: Session, id: number): boolean {
  if (s.pointer !== id) return false;
  s.pointer = null;
  return true;
}

/**
 * The letter's last stroke is written. On the set's last letter this is the win: stars saved and the limit checked at
 * this very moment (`over`, from atBreak()), not when the child taps on. Returns true when the caller must record.
 */
export function letterDone(s: Session, last: boolean, over: boolean, now: number): boolean {
  s.letter = "drawn"; s.last = last; s.pointer = null; s.drawnAt = now;
  if (!last || s.recorded === s.serial) return false;
  s.recorded = s.serial;
  s.resting = over;
  return true;
}

export type Step = "ignored" | "next" | "end";
/** → on the picture: the next letter, or after the last the end screen. */
export function goNext(s: Session, now: number): Step {
  if (s.screen !== "play" || s.letter !== "drawn" || s.paused || restShows(s)) return "ignored";
  if (s.last) { s.screen = "end"; s.endAt = now; s.letter = "tracing"; return "end"; }
  s.letter = "tracing";
  return "next";
}
/** ↺ on the picture: write the same letter again. */
export function writeAgain(s: Session): boolean {
  if (s.screen !== "play" || s.letter !== "drawn" || s.paused || restShows(s)) return false;
  s.letter = "tracing";
  return true;
}

/** The player's menu opened (⏸, P, Escape, blur or hide): no finger counts any more. */
export function pause(s: Session) { s.paused = true; s.pointer = null; }
/** চালিয়ে যাও: the hand is fresh, and the first tap is a real one. */
export function resume(s: Session) { s.paused = false; s.swallow = false; }

/** Window blur or tab hide: the finger is released, and the first tap back is swallowed (unless the menu takes it). */
export function blur(s: Session) { s.away = true; s.pointer = null; if (s.screen === "play" && s.letter === "tracing") s.swallow = true; }
export function focus(s: Session) { s.away = false; }

/** নতুন করে শুরু, or শেষ: back to the title. A finished set was already recorded at its last letter. */
export function toTitle(s: Session) { s.screen = "title"; s.letter = "tracing"; s.pointer = null; s.paused = false; s.swallow = false; }
/**
 * The set list: a choice screen, nothing runs under it. Opens from the title, the end screen, or the player's menu
 * while a letter is being traced (the finger is released); ← goes back to where it came from.
 */
export function openLevels(s: Session) {
  if (s.screen !== "title" && s.screen !== "end" && s.screen !== "play") return;
  s.back = s.screen; s.screen = "levels"; s.pointer = null;
}
export function closeLevels(s: Session) { if (s.screen === "levels") { s.screen = s.back; s.swallow = false; } }

/** A grown-up gave more time on the rest screen. */
export function extend(s: Session) { s.resting = false; }

/** Result keys need a fresh press that started after the screen appeared, never a held or repeating key. */
export const freshKey = (since: number, timeStamp: number, repeat: boolean) => !repeat && timeStamp > since;

export type Action = "pause" | "start" | "demo" | "next" | "again" | "left" | "right" | "up" | "down" | null;
/**
 * What a key does, by screen, never by what happens to hold focus: Enter and Space go to the game, not to the last button
 * clicked. While a letter is being traced Enter only replays the moving dot (a hint, never a stroke written); the keyboard
 * writes with the arrow keys, which move a pen that must follow the path like a finger.
 */
export function route(s: Session, key: string, repeat: boolean, timeStamp: number): Action {
  if (s.paused || (restShows(s) && s.screen !== "play")) return null;
  if (key === "p" || key === "P") return "pause";
  const go = key === "Enter" || key === " ";
  if (s.screen === "title") return go && !repeat ? "start" : null;
  if (s.screen === "end") return go && freshKey(s.endAt, timeStamp, repeat) ? "again" : null;
  if (s.screen !== "play") return null;
  if (s.letter === "drawn") return go && freshKey(s.drawnAt, timeStamp, repeat) ? "next" : null;
  if (go) return repeat ? null : "demo";
  return ({ ArrowLeft: "left", ArrowRight: "right", ArrowUp: "up", ArrowDown: "down" } as Record<string, Action>)[key] ?? null;
}

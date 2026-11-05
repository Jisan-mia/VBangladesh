// The page around a round: which screen shows, the player's pause, going away and coming back, the facts waiting for ▶, the finder's
// book covering the stage, the kids' rest screen, and which keys count. Pure and mutable, so the statechart's bug paths replay in node
// tests (tests/session.test.ts); the component forwards events here and obeys. Spec: ai_docs/statecharts/dinosaur/Dinosaur.tla.

export type Screen = "title" | "play" | "end" | "levels";

export type Session = {
  screen: Screen;
  /** Where the level list goes back to. */
  back: "title" | "end";
  /** The player's pause menu is open. */
  paused: boolean;
  /** The window is blurred or the tab hidden. */
  away: boolean;
  /** The first tap after coming back only wakes the game; it never brushes, picks a bone or sorts a food. */
  swallow: boolean;
  /** The finder's book is open over the stage: nothing under it runs. */
  book: boolean;
  /** The last food was right and ▶ is waiting. `last` says it was the round's last dinosaur. */
  solved: boolean;
  last: boolean;
  /** The kids' daily limit has passed at a break: the rest screen shows on every screen but play. */
  resting: boolean;
  /** Which round is on screen, and the last one whose stars were saved and limit checked. */
  serial: number;
  recorded: number;
  /** Event times: ▶ and the end screen's keys count only from a fresh press after these. */
  solvedAt: number;
  endAt: number;
};

export const createSession = (): Session =>
  ({ screen: "title", back: "title", paused: false, away: false, swallow: false, book: false, solved: false, last: false, resting: false, serial: 0, recorded: 0, solvedAt: 0, endAt: 0 });

/** The rest screen covers the stage at a break only: never over a dig. */
export const restShows = (s: Session) => s.resting && s.screen !== "play";

/**
 * খুঁড়ি, আবার খেলো or a level from the list. Opening a round is a break too: past today's limit (`over`, from atBreak())
 * the round doesn't start and the rest screen shows instead. Returns true when the round starts.
 */
export function begin(s: Session, over: boolean): boolean {
  s.resting = over;
  if (over || s.paused) return false;
  s.screen = "play"; s.serial += 1; s.solved = false; s.last = false; s.swallow = false; s.book = false;
  return true;
}

export type Touch = "ignored" | "woke" | "counts";
/** A finger or key on the sand, a bone, a place or a food. Only on the play screen, with nothing covering it, and not while the facts wait. */
export function touch(s: Session): Touch {
  if (s.screen !== "play" || s.paused || s.book || s.solved || restShows(s)) return "ignored";
  if (s.swallow) { s.swallow = false; return "woke"; }
  return "counts";
}

/**
 * The last food is right. On the round's last dinosaur the stars are saved and the limit is checked at this very tap (`over`,
 * from atBreak()), not when ▶ is pressed, so nothing a quick hand does next can lose them. Returns true when the caller must record the round.
 */
export function solve(s: Session, last: boolean, over: boolean, now: number): boolean {
  s.solved = true; s.last = last; s.solvedAt = now;
  if (!last) return false;
  s.recorded = s.serial;
  s.resting = over;
  return true;
}

export type Advance = "no" | "next" | "end";
/** ▶ (by finger, or a key press that began after the facts showed and isn't a repeat). The last dinosaur's ▶ opens the end screen, once. */
export function advance(s: Session, key?: { timeStamp: number; repeat: boolean }): Advance {
  if (s.screen !== "play" || s.paused || s.book || !s.solved || restShows(s)) return "no";
  if (key && (key.repeat || key.timeStamp <= s.solvedAt)) return "no";
  s.solved = false;
  if (s.last) { s.screen = "end"; s.endAt = key?.timeStamp ?? s.solvedAt; return "end"; }
  return "next";
}

/** The end screen's keys: only a fresh press that began after it appeared, never a held or repeating one. */
export const freshKey = (s: Session, timeStamp: number, repeat: boolean) => s.screen === "end" && !s.book && !repeat && timeStamp > s.endAt;

/** The player's menu opened (⏸, P, Escape, blur or hide). */
export function pause(s: Session) { s.paused = true; }
/** চালিয়ে যাও. */
export function resume(s: Session) { s.paused = false; s.swallow = false; }

/** Window blur or tab hide. The first tap back is swallowed unless the player's menu takes it. */
export function blur(s: Session) { s.away = true; if (s.screen === "play") s.swallow = true; }
export function focus(s: Session) { s.away = false; }

/** The book opens (a choice screen over the stage: play stops) and closes. */
export function openBook(s: Session) { s.book = true; }
export function closeBook(s: Session) { s.book = false; }

/** নতুন করে শুরু, or শেষ: back to the title. A finished round was already recorded at its last food. */
export function toTitle(s: Session) { s.screen = "title"; s.solved = false; s.last = false; s.paused = false; s.swallow = false; s.book = false; }
/** The level list: a choice screen, nothing runs under it. From the title or the end screen it goes back there; from the player's menu mid-round the round is left and it goes back to the title. */
export function openLevels(s: Session) {
  if (s.screen === "title" || s.screen === "end") { s.back = s.screen; s.screen = "levels"; }
  else if (s.screen === "play") { s.back = "title"; s.screen = "levels"; s.solved = false; s.last = false; s.swallow = false; }
}
export function closeLevels(s: Session) { if (s.screen === "levels") s.screen = s.back; }

/** A grown-up gave more time on the rest screen. */
export function extend(s: Session) { s.resting = false; }

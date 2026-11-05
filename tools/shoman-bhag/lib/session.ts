// The page around a round: which screen shows, the player's pause, going away and coming back, the ➜ that moves the round
// on (next item, or the end screen), the kids' rest screen, and which keys count. Pure and mutable, so the statechart's bug
// paths replay in node tests (tests/session.test.ts); the component forwards events here and obeys.
// Spec: ai_docs/statecharts/shoman-bhag/ShomanBhag.tla. There is no timer: nothing moves unless the child taps.

export type Screen = "title" | "play" | "end" | "levels";

export type Session = {
  screen: Screen;
  /** Where the level list goes back to. */
  back: "title" | "end";
  /** The player's pause menu is open. */
  paused: boolean;
  /** The window is blurred or the tab hidden. */
  away: boolean;
  /** The first tap after coming back only wakes the game; it never lifts a piece, picks a plate or moves on. */
  swallow: boolean;
  /** The serving on screen is finished (every face smiling), and waits for the ➜. */
  solved: boolean;
  /** That serving is the round's last one. */
  last: boolean;
  /** The kids' daily limit has passed at a break: the rest screen shows on every screen but play. */
  resting: boolean;
  /** Which round is on screen, and the last one whose stars were saved and limit checked. */
  serial: number;
  recorded: number;
  /** Event time the end screen appeared: its keys count only from a fresh press after it. */
  endAt: number;
};

export const createSession = (): Session =>
  ({ screen: "title", back: "title", paused: false, away: false, swallow: false, solved: false, last: false, resting: false, serial: 0, recorded: 0, endAt: 0 });

/** The rest screen covers the stage at a break only: never over an item. */
export const restShows = (s: Session) => s.resting && s.screen !== "play";

/**
 * খেলো, আবার খেলো or a level from the list. Opening a round is a break too: past today's limit (`over`, from atBreak())
 * the round doesn't start and the rest screen shows instead. Returns true when the round starts.
 */
export function begin(s: Session, over: boolean): boolean {
  s.resting = over;
  if (over || s.paused) return false;
  s.screen = "play"; s.serial += 1; s.solved = false; s.last = false; s.swallow = false;
  return true;
}

export type Tap = "ignored" | "woke" | "counts";
const live = (s: Session) => s.screen === "play" && !s.paused && !restShows(s);
/** A finger or key on the board. Only on the play screen, with nothing covering it and the serving still open. */
export function tapBoard(s: Session): Tap {
  if (!live(s) || s.solved) return "ignored";
  if (s.swallow) { s.swallow = false; return "woke"; }
  return "counts";
}

/**
 * The last piece given. On the last serving the round is finished at this very tap: its stars are saved and the limit is checked
 * (`over`, from atBreak()) now, not when the end screen comes, so nothing a quick hand does next can lose them.
 * Returns true when the caller must record the round.
 */
export function servedDone(s: Session, last: boolean, over: boolean): boolean {
  s.solved = true; s.last = last;
  if (!last) return false;
  s.recorded = s.serial;
  s.resting = over;
  return true;
}

export type Next = "ignored" | "woke" | "next" | "end";
/** The ➜ after a finished serving: the next guests, or on the last one the end screen. */
export function tapNext(s: Session, now: number): Next {
  if (!live(s) || !s.solved) return "ignored";
  if (s.swallow) { s.swallow = false; return "woke"; }
  s.solved = false;
  if (!s.last) return "next";
  s.screen = "end"; s.endAt = now;
  return "end";
}

/** The player's menu opened (⏸, P, Escape, blur or hide). */
export function pause(s: Session) { s.paused = true; }
/** চালিয়ে যাও: the hand is fresh. */
export function resume(s: Session) { s.paused = false; s.swallow = false; }

/** Window blur or tab hide. The first tap back is swallowed unless the player's menu takes it. */
export function blur(s: Session) { s.away = true; if (s.screen === "play") s.swallow = true; }
export function focus(s: Session) { s.away = false; }

/** নতুন করে শুরু, or শেষ: back to the title. A finished round was already recorded at its last tap. */
export function toTitle(s: Session) { s.screen = "title"; s.solved = false; s.last = false; s.paused = false; s.swallow = false; }
/** The level list: a choice screen, nothing runs under it. Opens from the title or the end screen only. */
export function openLevels(s: Session) { if (s.screen === "title" || s.screen === "end") { s.back = s.screen; s.screen = "levels"; } }
export function closeLevels(s: Session) { if (s.screen === "levels") s.screen = s.back; }

/** A grown-up gave more time on the rest screen. */
export function extend(s: Session) { s.resting = false; }

/** Result-screen keys need a fresh press that started after the screen appeared, never a held or repeating key. */
export const freshKey = (s: Session, timeStamp: number, repeat: boolean) => s.screen === "end" && !repeat && timeStamp > s.endAt;

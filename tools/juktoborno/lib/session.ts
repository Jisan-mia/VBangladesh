// The page around a round: which screen shows, the player's pause, going away and coming back, the child-paced step from a
// solved word to the next one, the kids' rest screen, and which keys count. Pure and mutable, so the statechart's bug
// paths replay in node tests (tests/session.test.ts); the component forwards events here and obeys.
// There are no timers: the game moves only when the child taps, so a pause has nothing to freeze.
// Spec: ai_docs/statecharts/juktoborno/Juktoborno.tla.

export type Screen = "title" | "play" | "end" | "levels";

/** A tap on the পরেরটা button counts only this long after the word was solved, so a double-tap on a tile never skips the word. */
export const SETTLE_MS = 400;

export type Session = {
  screen: Screen;
  /** Where the level list goes back to (a round in progress stays as it was). */
  back: "title" | "end" | "play";
  /** The player's pause menu is open. */
  paused: boolean;
  /** The window is blurred or the tab hidden. */
  away: boolean;
  /** The first tap after coming back only wakes the game; it never picks a tile. */
  swallow: boolean;
  /** The current word is solved and waits for the child's পরেরটা. */
  waiting: boolean;
  /** The kids' daily limit has passed at a break: the rest screen shows on every screen but play. */
  resting: boolean;
  /** Which round is on screen, and the last one whose stars were saved and limit checked. */
  serial: number;
  recorded: number;
  /** Event times: when the word was solved, and when the end screen appeared. */
  solvedAt: number;
  endAt: number;
};

export const createSession = (): Session =>
  ({ screen: "title", back: "title", paused: false, away: false, swallow: false, waiting: false, resting: false, serial: 0, recorded: 0, solvedAt: 0, endAt: 0 });

/** The rest screen covers the stage at a break only: never over a word. */
export const restShows = (s: Session) => s.resting && s.screen !== "play";

/**
 * খেলো, আবার খেলো or a level from the list. Opening a round is a break too: past today's limit (`over`, from atBreak())
 * the round doesn't start and the rest screen shows instead. Returns true when the round starts.
 */
export function begin(s: Session, over: boolean): boolean {
  s.resting = over;
  if (over || s.paused) return false;
  s.screen = "play"; s.serial += 1; s.waiting = false; s.swallow = false; s.back = "title";
  return true;
}

export type Tap = "ignored" | "woke" | "counts";
/** A finger or key on a letter tile or a slot. Only on the play screen, with nothing covering it and the word not yet solved. */
export function tapLetter(s: Session): Tap {
  if (s.screen !== "play" || s.paused || s.waiting || restShows(s)) return "ignored";
  if (s.swallow) { s.swallow = false; return "woke"; }
  return "counts";
}

/**
 * The right letter in the last slot. The word is solved at this tap. On the last word the round is finished here too: its
 * stars are saved and the limit is checked (`over`, from atBreak()) now, not when the end screen comes, so nothing a quick
 * hand does next can lose them. Returns true when the caller must record the round.
 */
export function solved(s: Session, last: boolean, over: boolean, now: number): boolean {
  s.waiting = true; s.solvedAt = now;
  if (!last) return false;
  s.recorded = s.serial;
  s.resting = over;
  return true;
}

/**
 * পরেরটা (or শেষ on the last word). Counts only after the settle time, with the menu shut and nothing covering the game;
 * the first tap after coming back only wakes. Returns "ok" when the component must move on (and, after the last word, the
 * end screen shows).
 */
export function tapNext(s: Session, now: number, last: boolean): Tap | "ok" {
  if (s.screen !== "play" || s.paused || !s.waiting || restShows(s)) return "ignored";
  if (now - s.solvedAt < SETTLE_MS) return "ignored";
  if (s.swallow) { s.swallow = false; return "woke"; }
  s.waiting = false;
  if (last) { s.screen = "end"; s.endAt = now; }
  return "ok";
}

/** The player's menu opened (⏸, P, Escape, blur or hide). Nothing runs on a timer, so nothing needs freezing. */
export function pause(s: Session) { s.paused = true; }
/** চালিয়ে যাও: the hand is fresh. */
export function resume(s: Session) { s.paused = false; s.swallow = false; }

/** Window blur or tab hide. The first tap back is swallowed unless the player's menu takes it. */
export function blur(s: Session) { s.away = true; if (s.screen === "play") s.swallow = true; }
export function focus(s: Session) { s.away = false; }

/** নতুন করে শুরু, or শেষ: back to the title. A finished round was already recorded at its last tap. */
export function toTitle(s: Session) { s.screen = "title"; s.waiting = false; s.paused = false; s.swallow = false; s.back = "title"; }

/** The level list: a choice screen, nothing runs under it. Opens from the title, the end screen, or a round (through the pause menu). */
export function openLevels(s: Session) { if (s.screen === "title" || s.screen === "end" || s.screen === "play") { s.back = s.screen; s.screen = "levels"; } }
/** Closing the list returns to where it came from; a round in progress is exactly as it was. */
export function closeLevels(s: Session) { if (s.screen === "levels") { s.screen = s.back; s.swallow = false; } }

/** A grown-up gave more time on the rest screen. */
export function extend(s: Session) { s.resting = false; }

/** Result-screen and next-word keys need a fresh press that started after the screen appeared, never a held or repeating key. */
export const freshEndKey = (s: Session, timeStamp: number, repeat: boolean) => s.screen === "end" && !repeat && timeStamp > s.endAt;
export const freshNextKey = (s: Session, timeStamp: number, repeat: boolean) => s.screen === "play" && s.waiting && !repeat && timeStamp - s.solvedAt >= SETTLE_MS;

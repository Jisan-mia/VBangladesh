// The page around a round: which screen shows, the player's pause, going away and coming back, the question that waits
// for ➜ after a right answer, the kids' rest screen, and which keys count. Nothing here runs on a timer: a right answer
// shows why and waits for the child. Pure and mutable, so the statechart's bug paths replay in node tests
// (tests/session.test.ts); the component forwards events here and obeys. Spec: ai_docs/statecharts/nirapode-thaki/NirapodeThaki.tla.

export type Screen = "title" | "play" | "end" | "levels";

export type Session = {
  screen: Screen;
  /** Where the level list goes back to. */
  back: "title" | "end";
  /** The player's pause menu is open. */
  paused: boolean;
  /** The window is blurred or the tab hidden. */
  away: boolean;
  /** The first tap after coming back only wakes the game; it never picks a picture. */
  swallow: boolean;
  /** The safe picture was found: the reason shows and ➜ waits. */
  answered: boolean;
  /** The kids' daily limit has passed at a break: the rest screen shows on every screen but play. */
  resting: boolean;
  /** Which round is on screen, and the last one whose stars were saved and limit checked. */
  serial: number;
  recorded: number;
  /** Event times: the answer appeared, the end screen appeared. Their keys count only from a fresh press after them. */
  answeredAt: number;
  endAt: number;
};

export const createSession = (): Session =>
  ({ screen: "title", back: "title", paused: false, away: false, swallow: false, answered: false, resting: false, serial: 0, recorded: 0, answeredAt: 0, endAt: 0 });

/** The rest screen covers the stage at a break only: never over a question. */
export const restShows = (s: Session) => s.resting && s.screen !== "play";

/**
 * খেলো, আবার খেলো or a level from the list. Opening a round is a break too: past today's limit (`over`, from atBreak())
 * the round doesn't start and the rest screen shows instead. Returns true when the round starts.
 */
export function begin(s: Session, over: boolean): boolean {
  s.resting = over;
  if (over || s.paused) return false;
  s.screen = "play"; s.serial += 1; s.answered = false; s.swallow = false;
  return true;
}

export type Tap = "ignored" | "woke" | "counts";
/** A finger or key on a picture. Only on the play screen, nothing covering it, and no answer already found. */
export function tapTile(s: Session): Tap {
  if (s.screen !== "play" || s.paused || s.answered || restShows(s)) return "ignored";
  if (s.swallow) { s.swallow = false; return "woke"; }
  return "counts";
}

/**
 * The safe picture. On the last question the round is finished at this very tap: its stars are saved and the limit is
 * checked (`over`, from atBreak()) now, not when the end screen comes, so nothing a quick hand does next can lose them.
 * Returns true when the caller must record the round.
 */
export function solved(s: Session, last: boolean, over: boolean, now: number): boolean {
  s.answered = true; s.answeredAt = now;
  if (!last) return false;
  s.recorded = s.serial;
  s.resting = over;
  return true;
}

/** ➜: the next question, or (after the last) the end screen. Only with an answer showing and nothing covering the game. */
export function advance(s: Session, last: boolean, now: number): "ignored" | "next" | "end" {
  if (s.screen !== "play" || !s.answered || s.paused) return "ignored";
  s.answered = false;
  if (!last) return "next";
  s.screen = "end"; s.endAt = now;
  return "end";
}

/** The player's menu opened (⏸, P, Escape, blur or hide). */
export function pause(s: Session) { s.paused = true; }
/** চালিয়ে যাও: the hand is fresh. */
export function resume(s: Session) { s.paused = false; s.swallow = false; }

/** Window blur or tab hide. The first tap back is swallowed unless the player's menu takes it. */
export function blur(s: Session) { s.away = true; if (s.screen === "play" && !s.answered) s.swallow = true; }
export function focus(s: Session) { s.away = false; }

/** নতুন করে শুরু, or শেষ: back to the title. A finished round was already recorded at its last tap. */
export function toTitle(s: Session) { s.screen = "title"; s.answered = false; s.paused = false; s.swallow = false; }
/** The level list: a choice screen, nothing runs under it. Opens from the title or the end screen only, never over a question. */
export function openLevels(s: Session) { if (s.screen === "title" || s.screen === "end") { s.back = s.screen; s.screen = "levels"; } }
export function closeLevels(s: Session) { if (s.screen === "levels") s.screen = s.back; }

/** A grown-up gave more time on the rest screen. */
export function extend(s: Session) { s.resting = false; }

/** Keys that move on need a fresh press that started after the answer (or the end screen) appeared, never a held or repeating key. */
export const freshNext = (s: Session, timeStamp: number, repeat: boolean) => s.screen === "play" && s.answered && !repeat && timeStamp > s.answeredAt;
export const freshKey = (s: Session, timeStamp: number, repeat: boolean) => s.screen === "end" && !repeat && timeStamp > s.endAt;

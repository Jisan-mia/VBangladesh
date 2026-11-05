// The page around a round: which screen shows, the player's pause, going away and coming back, the one timer that moves
// the round to its end screen, the kids' rest screen, and which keys count. Pure and mutable, so the statechart's bug
// paths replay in node tests (tests/session.test.ts); the component forwards events here and obeys.
// Spec: ai_docs/statecharts/sourojogot/Sourojogot.tla.

export type Screen = "title" | "play" | "end" | "levels";
/** After the last answer: "end" = a timer brings the end screen, "wait" = the ▶ button does. */
export type Pending = "none" | "end" | "wait";

export type Session = {
  screen: Screen;
  /** Where the level list goes back to. */
  back: "title" | "end";
  /** The player's pause menu is open. */
  paused: boolean;
  /** The window is blurred or the tab hidden. */
  away: boolean;
  /** The first tap after coming back only wakes the game; it never answers. */
  swallow: boolean;
  pending: Pending;
  /** The end timer was stopped by a pause and waits for চালিয়ে যাও. */
  frozen: boolean;
  /** The kids' daily limit has passed at a break: the rest screen shows on every screen but play. */
  resting: boolean;
  /** Which round is on screen, and the last one whose stars were saved and limit checked. */
  serial: number;
  recorded: number;
  /** Event time the end screen appeared: its keys count only from a fresh press after it. */
  endAt: number;
};

export const createSession = (): Session =>
  ({ screen: "title", back: "title", paused: false, away: false, swallow: false, pending: "none", frozen: false, resting: false, serial: 0, recorded: 0, endAt: 0 });

/** The rest screen covers the stage at a break only: never over a question. */
export const restShows = (s: Session) => s.resting && s.screen !== "play";
/** The end timer may run only while nothing covers the game. */
export const timerMayRun = (s: Session) => s.pending === "end" && !s.paused && !s.frozen;

/**
 * খেলো, আবার খেলো or a level from the list. Opening a round is a break too: past today's limit (`over`, from atBreak())
 * the round doesn't start and the rest screen shows instead. Returns true when the round starts.
 */
export function begin(s: Session, over: boolean): boolean {
  s.resting = over;
  if (over || s.paused) return false;
  s.screen = "play"; s.serial += 1; s.pending = "none"; s.frozen = false; s.swallow = false;
  return true;
}

export type Tap = "ignored" | "woke" | "counts";
/** A finger or key on an answer. Only on the play screen, with nothing covering it and the round not already finished. */
export function tapAnswer(s: Session): Tap {
  if (s.screen !== "play" || s.paused || s.pending !== "none" || restShows(s)) return "ignored";
  if (s.swallow) { s.swallow = false; return "woke"; }
  return "counts";
}

/**
 * An answer was right. On the last question the round is finished at this very tap: its stars are saved and the limit is
 * checked (`over`, from atBreak()) now, not when the end screen comes, so nothing a quick hand does next can lose them.
 * `button` says the ▶ button brings the end screen (a reveal to look at) instead of a timer. Returns true when the caller must record.
 */
export function solved(s: Session, last: boolean, over: boolean, button: boolean): boolean {
  if (!last) return false;
  s.pending = button ? "wait" : "end";
  s.recorded = s.serial;
  s.resting = over;
  return true;
}

/** The ▶ button after the last reveal. */
export function goEnd(s: Session, now: number): boolean {
  if (s.screen !== "play" || s.pending !== "wait" || s.paused || restShows(s)) return false;
  s.screen = "end"; s.endAt = now; s.pending = "none";
  return true;
}

/** The end timer fires. */
export function timerFires(s: Session, now: number) {
  if (!timerMayRun(s)) return;
  s.screen = "end"; s.endAt = now; s.pending = "none";
}

/** The player's menu opened (⏸, P, Escape, blur or hide): the timer freezes where it is. */
export function pause(s: Session) {
  s.paused = true;
  if (s.pending === "end") s.frozen = true;
}
/** চালিয়ে যাও: the timer runs again (the component gives it a short breath), and the hand is fresh. */
export function resume(s: Session) { s.paused = false; s.frozen = false; s.swallow = false; }

/** Window blur or tab hide. The first tap back is swallowed unless the player's menu takes it. */
export function blur(s: Session) { s.away = true; if (s.screen === "play") s.swallow = true; }
export function focus(s: Session) { s.away = false; }

/** নতুন করে শুরু, or শেষ: back to the title. A finished round was already recorded at its last answer. */
export function toTitle(s: Session) { s.screen = "title"; s.pending = "none"; s.frozen = false; s.paused = false; s.swallow = false; }
/** The level list: a choice screen, nothing runs under it. Opens from the title or the end screen, or from the player's সব লেভেল. */
export function openLevels(s: Session) {
  if (s.screen === "title" || s.screen === "end") s.back = s.screen;
  else if (s.screen === "play") { s.back = "title"; s.pending = "none"; s.frozen = false; }
  else return;
  s.screen = "levels";
}
export function closeLevels(s: Session) { if (s.screen === "levels") s.screen = s.back; }

/** A grown-up gave more time on the rest screen. */
export function extend(s: Session) { s.resting = false; }

/** Result-screen keys need a fresh press that started after the screen appeared, never a held or repeating key. */
export const freshKey = (s: Session, timeStamp: number, repeat: boolean) => s.screen === "end" && !repeat && timeStamp > s.endAt;

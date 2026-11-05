// The page around a round: which screen shows, the player's pause, going away and coming back, the one finish timer
// (the ring has closed, the end screen follows), the kids' rest screen, and which keys count. Pure and mutable, so the
// statechart's bug paths replay in node tests (tests/session.test.ts); the component forwards events here and obeys.
// Spec: ai_docs/statecharts/hat-dhui/HatDhui.tla.

export type Screen = "title" | "play" | "end";
export type Pending = "none" | "end";

export type Session = {
  screen: Screen;
  /** The player's pause menu is open. */
  paused: boolean;
  /** The window is blurred or the tab hidden. */
  away: boolean;
  /** The first tap after coming back only wakes the game; it never pops a bubble or picks a card. */
  swallow: boolean;
  pending: Pending;
  /** The pending timer was stopped by a pause and waits for চালিয়ে যাও. */
  frozen: boolean;
  /** The round on screen is won (the ring closed, or the last right card): its stars are saved. */
  finished: boolean;
  /** The kids' daily limit has passed at a break: the rest screen shows on every screen but play. */
  resting: boolean;
  /** Which round is on screen, and the last one whose stars were saved and limit checked. */
  serial: number;
  recorded: number;
  /** Event time the end screen appeared: its keys count only from a fresh press after it. */
  endAt: number;
};

export const createSession = (): Session =>
  ({ screen: "title", paused: false, away: false, swallow: false, pending: "none", frozen: false, finished: false, resting: false, serial: 0, recorded: 0, endAt: 0 });

/** The rest screen covers the stage at a break only: never over a wash or a brush. */
export const restShows = (s: Session) => s.resting && s.screen !== "play";
/** A timer may run only while nothing covers the game. */
export const timerMayRun = (s: Session) => s.pending !== "none" && !s.paused && !s.frozen;
/** The routine's clock may move only on the play screen, with the menu shut, and while the window is here. */
export const clockMayRun = (s: Session) => s.screen === "play" && !s.paused && !s.away && !s.finished;

/**
 * খেলো or আবার খেলো. Opening a round is a break too: past today's limit (`over`, from atBreak()) the round doesn't
 * start and the rest screen shows instead. Starting always drops any older finish timer (it belongs to an older serial).
 * Returns true when the round starts.
 */
export function begin(s: Session, over: boolean): boolean {
  s.resting = over;
  s.pending = "none"; s.frozen = false;
  if (over || s.paused) return false;
  s.screen = "play"; s.serial += 1; s.swallow = false; s.finished = false;
  return true;
}

export type Tap = "ignored" | "woke" | "counts";
/** A finger or key on the play screen. Nothing covering it, and the first tap back from away only wakes the game. */
export function tapGame(s: Session): Tap {
  if (s.screen !== "play" || s.paused || restShows(s)) return "ignored";
  if (s.swallow) { s.swallow = false; return "woke"; }
  return "counts";
}

/**
 * The round is won, at this very step: the ring closed, or the last right card. Its stars are saved and the limit is
 * checked now (`over`, from atBreak()), not when the end screen comes, so nothing a quick hand does next can lose them.
 * `timed` arms the short finish timer (the ring's closing flourish); the quiz waits for its → button instead.
 * Returns true when the caller must record the round (once per serial).
 */
export function finish(s: Session, over: boolean, timed: boolean): boolean {
  if (s.screen !== "play" || s.finished || s.recorded === s.serial) return false;
  s.finished = true; s.recorded = s.serial; s.resting = over;
  if (timed) s.pending = "end";
  return true;
}

/** The end screen comes: from the finish timer (only the round that armed it) or the quiz's → button. */
export function goToEnd(s: Session, now: number, serial = s.serial): boolean {
  if (serial !== s.serial || s.screen !== "play" || !s.finished || s.paused) return false;
  s.screen = "end"; s.endAt = now; s.pending = "none"; s.frozen = false;
  return true;
}

/** The finish timer fires. It only counts for the round that armed it, and only while nothing covers the game. */
export function timerFires(s: Session, now: number, serial: number) {
  if (!timerMayRun(s)) return false;
  return goToEnd(s, now, serial);
}

/** The player's menu opened (⏸, P, Escape, blur or hide): the timer freezes where it is. */
export function pause(s: Session) {
  s.paused = true;
  if (s.pending !== "none") s.frozen = true;
}
/** চালিয়ে যাও: the timer runs again (the component gives it a short breath), and the hand is fresh. */
export function resume(s: Session) { s.paused = false; s.frozen = false; s.swallow = false; }

/** Window blur or tab hide. The clock stops (clockMayRun); the first tap back is swallowed unless the player's menu takes it. */
export function blur(s: Session) { s.away = true; if (s.screen === "play") s.swallow = true; }
export function focus(s: Session) { s.away = false; }

/** নতুন করে শুরু, সব লেভেল or শেষ: back to the title. A finished round was already recorded at its last step. */
export function toTitle(s: Session) { s.screen = "title"; s.pending = "none"; s.frozen = false; s.paused = false; s.swallow = false; s.finished = false; }

/** A grown-up gave more time on the rest screen. */
export function extend(s: Session) { s.resting = false; }

/** Result-screen keys need a fresh press that started after the screen appeared, never a held or repeating key. */
export const freshKey = (s: Session, timeStamp: number, repeat: boolean) => s.screen === "end" && !repeat && timeStamp > s.endAt;

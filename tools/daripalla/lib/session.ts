// The page around a round: which screen shows, the player's pause, going away and coming back, the kids' rest screen, the level list's
// "leave this round?" check, and which keys count. Pure and mutable, so the statechart's bug paths replay in node tests
// (tests/session.test.ts); the component forwards events here and obeys. The round itself moves only on the page's fixed-step clock,
// so a pause or a blur needs no timers to stop. Spec: ai_docs/statecharts/daripalla/Daripalla.tla.

export type Screen = "title" | "play" | "end" | "levels";

export type Session = {
  screen: Screen;
  /** Where the level list goes back to. */
  back: "title" | "end" | "play";
  /** The player's pause menu is open. */
  paused: boolean;
  /** The window is blurred or the tab hidden. */
  away: boolean;
  /** The first tap after coming back only wakes the game; it never puts a weight on or picks a number. */
  swallow: boolean;
  /** The kids' daily limit has passed at a break: the rest screen shows on every screen but play. */
  resting: boolean;
  /** Which round is on screen, and the last one whose stars were saved and limit checked. */
  serial: number;
  recorded: number;
  /** The child has touched this round's pans and it is not won yet: leaving it asks first. */
  dirty: boolean;
  /** The level the child picked in the list while a round was mid-way, waiting for yes or no. 0 = none. */
  ask: number;
  /** Event time the end page appeared: its keys count only from a fresh press after it. */
  endAt: number;
};

export const createSession = (): Session =>
  ({ screen: "title", back: "title", paused: false, away: false, swallow: false, resting: false, serial: 0, recorded: 0, dirty: false, ask: 0, endAt: 0 });

/** The rest screen covers the stage at a break only: never over a round. */
export const restShows = (s: Session) => s.resting && s.screen !== "play";
/** The clock may run only while a round is on screen and nothing covers it. */
export const clockMayRun = (s: Session) => s.screen === "play" && !s.paused;

/**
 * খেলো, আবার খেলো or a level from the list. Opening a round is a break too: past today's limit (`over`, from atBreak()) the round
 * doesn't start and the rest screen shows instead. Returns true when the round starts.
 */
export function begin(s: Session, over: boolean): boolean {
  s.resting = over; s.ask = 0;
  if (over || s.paused) return false;
  s.screen = "play"; s.serial += 1; s.swallow = false; s.dirty = false;
  return true;
}

export type Tap = "ignored" | "woke" | "counts";
/** A finger or key on a weight, the pan or a number. Only on the play screen, with nothing covering it. */
export function touch(s: Session): Tap {
  if (s.screen !== "play" || s.paused || restShows(s)) return "ignored";
  if (s.swallow) { s.swallow = false; return "woke"; }
  return "counts";
}

/** The child changed the pans: the round is theirs now. */
export function moved(s: Session) { if (s.screen === "play") s.dirty = true; }

/**
 * The last pan is level. The round is won at this very moment: its stars are saved and the limit is checked (`over`, from atBreak())
 * now, not when the end page comes, so nothing a quick hand does next can lose them. Returns true once per round, when the caller
 * must record it.
 */
export function won(s: Session, over: boolean): boolean {
  if (s.screen !== "play" || s.recorded === s.serial) return false;
  s.recorded = s.serial; s.resting = over; s.dirty = false;
  return true;
}

/** The win's wait is over and the end page comes. */
export function cardShows(s: Session, now: number) {
  if (s.screen !== "play") return;
  s.screen = "end"; s.endAt = now;
}

export function pause(s: Session) { s.paused = true; }
/** চালিয়ে যাও: the clock runs again and the hand is fresh. */
export function resume(s: Session) { s.paused = false; s.swallow = false; }
/** Window blur or tab hide. The first tap back is swallowed unless the player's menu takes it. */
export function blur(s: Session) { s.away = true; if (s.screen === "play") s.swallow = true; }
export function focus(s: Session) { s.away = false; }

/** নতুন করে শুরু, or শেষ: back to the title. A won round was already recorded at its last pan. */
export function toTitle(s: Session) { s.screen = "title"; s.paused = false; s.swallow = false; s.dirty = false; s.ask = 0; }
/** The level list: a choice screen, nothing runs under it. Opens from the title, the end page or (from the pause menu) a round. */
export function openLevels(s: Session) {
  if (s.screen === "title" || s.screen === "end" || s.screen === "play") { s.back = s.screen; s.screen = "levels"; s.ask = 0; }
}
export function closeLevels(s: Session) {
  if (s.screen !== "levels") return;
  s.ask = 0; s.screen = s.back;
  // Back in a round: the first tap only wakes it, and nothing was lost.
  if (s.back === "play") s.swallow = true;
}
/** A level card in the list. Mid-round it asks first; otherwise it starts. */
export function pick(s: Session, id: number): "start" | "ask" | "ignored" {
  if (s.screen !== "levels") return "ignored";
  if (s.back === "play" && s.dirty) { s.ask = id; return "ask"; }
  return "start";
}
/** "না, থাকি": the round stays. */
export function stay(s: Session) { s.ask = 0; }
/** "হ্যাঁ": the level picked is the one to start. Returns it (0 when nothing was asked). */
export function leave(s: Session): number { const id = s.ask; s.ask = 0; return id; }

/** A grown-up gave more time on the rest screen. */
export function extend(s: Session) { s.resting = false; }

/** End-page keys need a fresh press that started after the page appeared, never a held or repeating key. */
export const freshKey = (s: Session, timeStamp: number, repeat: boolean) => s.screen === "end" && !repeat && timeStamp > s.endAt;

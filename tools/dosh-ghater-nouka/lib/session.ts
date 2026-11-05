// The page around a race: which screen shows, the player's pause, going away and coming back, the kids' rest screen, the
// mode choice, and which keys count. Pure and mutable, so the statechart's bug paths replay in node tests
// (tests/session.test.ts); the component forwards events here and obeys. The race itself moves only on the page's
// fixed-step clock, so a pause or a blur needs no timers to stop. Spec: ai_docs/statecharts/dosh-ghater-nouka/Nouka.tla.

export type Screen = "title" | "play" | "end" | "levels";

export type Session = {
  screen: Screen;
  /** Where the level list goes back to. */
  back: "title" | "end";
  /** The player's pause menu is open. */
  paused: boolean;
  /** The window is blurred or the tab hidden. */
  away: boolean;
  /** The first tap after coming back only wakes the game; it never taps a ghat or spins. */
  swallow: boolean;
  /** The kids' daily limit has passed at a break: the rest screen shows on every screen but play. */
  resting: boolean;
  /** Which race is on screen, and the last one whose stars were saved and limit checked. */
  serial: number;
  recorded: number;
  /** পালা করে: a grown-up sails the second boat by turns. Chosen on the title only. */
  duo: boolean;
  /** Event time the end page appeared: its keys count only from a fresh press after it. */
  endAt: number;
};

export const createSession = (duo = false): Session =>
  ({ screen: "title", back: "title", paused: false, away: false, swallow: false, resting: false, serial: 0, recorded: 0, duo, endAt: 0 });

/** The rest screen covers the stage at a break only: never over a race. */
export const restShows = (s: Session) => s.resting && s.screen !== "play";
/** The clock may run only while a race is on screen and nothing covers it. */
export const clockMayRun = (s: Session) => s.screen === "play" && !s.paused;

/**
 * খেলো, আবার খেলো or a level from the list. Opening a race is a break too: past today's limit (`over`, from atBreak())
 * the race doesn't start and the rest screen shows instead. Returns true when the race starts.
 */
export function begin(s: Session, over: boolean): boolean {
  s.resting = over;
  if (over || s.paused) return false;
  s.screen = "play"; s.serial += 1; s.swallow = false;
  return true;
}

/** The mode chips live on the title. A tap on the mode already on, or one made anywhere else, changes nothing. */
export function chooseMode(s: Session, duo: boolean): boolean {
  if (s.screen !== "title" || s.paused || restShows(s) || s.duo === duo) return false;
  s.duo = duo;
  return true;
}

export type Tap = "ignored" | "woke" | "counts";
/** A finger or key on a ghat or the চরকি. Only on the play screen, with nothing covering it. */
export function touch(s: Session): Tap {
  if (s.screen !== "play" || s.paused || restShows(s)) return "ignored";
  if (s.swallow) { s.swallow = false; return "woke"; }
  return "counts";
}

/**
 * Your boat reaches the last ghat. The race is finished at this very moment: its stars are saved and the limit is checked
 * (`over`, from atBreak()) now, not when the end page comes, so nothing a quick hand does next can lose them.
 * Returns true once per race, when the caller must record it.
 */
export function arrived(s: Session, over: boolean): boolean {
  if (s.screen !== "play" || s.recorded === s.serial) return false;
  s.recorded = s.serial;
  s.resting = over;
  return true;
}

/** The finish is over and the end page comes. */
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

/** নতুন করে শুরু, or শেষ: back to the title. A finished race was already recorded at its last ghat. */
export function toTitle(s: Session) { s.screen = "title"; s.paused = false; s.swallow = false; }
/** The level list: a choice screen, nothing runs under it. Opens from the title or the end page only. */
export function openLevels(s: Session) { if (s.screen === "title" || s.screen === "end") { s.back = s.screen; s.screen = "levels"; } }
export function closeLevels(s: Session) { if (s.screen === "levels") s.screen = s.back; }

/** A grown-up gave more time on the rest screen. */
export function extend(s: Session) { s.resting = false; }

/** End-page keys need a fresh press that started after the page appeared, never a held or repeating key. */
export const freshKey = (s: Session, timeStamp: number, repeat: boolean) => s.screen === "end" && !repeat && timeStamp > s.endAt;

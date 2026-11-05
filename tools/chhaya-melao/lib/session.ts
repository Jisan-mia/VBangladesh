// The page around a round: which screen shows, the player's pause, going away and coming back, the hold after a finished wall,
// the kids' rest screen, and which keys count. Pure and mutable, so the statechart's bug paths replay in node tests
// (tests/session.test.ts); the component forwards events here and obeys.
// Spec: ai_docs/statecharts/chhaya-melao/Chhaya.tla. The one clock in the game is `hold`, and it only runs while play is live.

export type Screen = "title" | "play" | "end" | "levels";

export type Session = {
  screen: Screen;
  /** Where the level list goes back to. */
  back: "title" | "end" | "play";
  /** The player's pause menu is open. */
  paused: boolean;
  /** The window is blurred or the tab hidden. */
  away: boolean;
  /** The first tap after coming back only wakes the game; it never lifts a toy or puts one down. */
  swallow: boolean;
  /** The wall on screen is finished and holds a moment before the next one (or the end screen). */
  solved: boolean;
  /** That wall is the round's last one. */
  last: boolean;
  /** Milliseconds of the hold still to run; 0 when none. Runs down only while live. */
  hold: number;
  /** The kids' daily limit has passed at a break: the rest screen shows on every screen but play. */
  resting: boolean;
  /** Which round is on screen, and the last one whose stars were saved and limit checked. */
  serial: number;
  recorded: number;
  /** Event time the end screen appeared: its keys count only from a fresh press after it. */
  endAt: number;
};

export const createSession = (): Session =>
  ({ screen: "title", back: "title", paused: false, away: false, swallow: false, solved: false, last: false, hold: 0, resting: false, serial: 0, recorded: 0, endAt: 0 });

/** The rest screen covers the stage at a break only: never over a wall in play. */
export const restShows = (s: Session) => s.resting && s.screen !== "play";
/** Play is running: on the play screen, nothing open over it, the window in front. */
export const live = (s: Session) => s.screen === "play" && !s.paused && !s.away && !restShows(s);

/**
 * খেলো, আবার খেলো or a level from the list. Opening a round is a break too: past today's limit (`over`, from atBreak())
 * the round doesn't start and the rest screen shows instead. Returns true when the round starts.
 */
export function begin(s: Session, over: boolean): boolean {
  s.resting = over;
  if (over || s.paused) return false;
  s.screen = "play"; s.serial += 1; s.solved = false; s.last = false; s.hold = 0; s.swallow = false;
  return true;
}

export type Tap = "ignored" | "woke" | "counts";
/** A finger or key on a toy or a shadow. Only on the play screen, with nothing covering it. */
export function touch(s: Session): Tap {
  if (!live(s)) return "ignored";
  if (s.swallow) { s.swallow = false; return "woke"; }
  return "counts";
}

/**
 * A shadow matched. When it finishes the wall the hold starts. On the round's last wall the round is finished at this very
 * match: its stars are saved and the limit is checked (`over`, from atBreak()) now, never in a timer, so nothing a quick hand
 * or a window switch does next can lose or fake them. Returns true when the caller must record the round.
 */
export function matched(s: Session, wallDone: boolean, last: boolean, over: boolean, holdMs: number): boolean {
  if (!wallDone) return false;
  s.solved = true; s.last = last; s.hold = holdMs;
  if (!last) return false;
  s.recorded = s.serial;
  s.resting = over;
  return true;
}

export type Step = "none" | "next" | "end";
/** Time passing, `dt` ms. The hold runs only while play is live (not paused, away, or under a list or the rest screen). */
export function tick(s: Session, dt: number, now: number): Step {
  if (!s.solved || s.hold <= 0 || !live(s)) return "none";
  s.hold -= dt;
  if (s.hold > 0) return "none";
  s.hold = 0; s.solved = false;
  if (!s.last) return "next";
  s.screen = "end"; s.endAt = now;
  return "end";
}

/** The player's menu opened (⏸, P, Escape, blur or hide). */
export function pause(s: Session) { s.paused = true; }
/** চালিয়ে যাও: a tap in the menu means the window is in front again, and the hand is fresh. */
export function resume(s: Session) { s.paused = false; s.away = false; s.swallow = false; }

/** Window blur or tab hide. The first tap back is swallowed unless the player's menu takes it. */
export function blur(s: Session) { s.away = true; if (s.screen === "play") s.swallow = true; }
export function focus(s: Session) { s.away = false; }

/** নতুন করে শুরু, or শেষ: back to the title. A finished round was already recorded at its last match. */
export function toTitle(s: Session) { s.screen = "title"; s.solved = false; s.last = false; s.hold = 0; s.paused = false; s.swallow = false; }
/** The level list: a choice screen, nothing runs under it. It opens from the title, the end screen, or the pause menu's সব লেভেল. */
export function openLevels(s: Session) { if (s.screen === "title" || s.screen === "end" || s.screen === "play") { s.back = s.screen; s.screen = "levels"; s.paused = false; } }
/** Back out of the list: to where it came from. A round it paused stays as it was, and the first tap on it only wakes it. */
export function closeLevels(s: Session) { if (s.screen !== "levels") return; s.screen = s.back; if (s.back === "play") s.swallow = true; }

/** A grown-up gave more time on the rest screen. */
export function extend(s: Session) { s.resting = false; }

/** Result-screen keys need a fresh press that started after the screen appeared, never a held or repeating key. */
export const freshKey = (s: Session, timeStamp: number, repeat: boolean) => s.screen === "end" && !repeat && timeStamp > s.endAt;

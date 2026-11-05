// The page around a round: which screen shows, the player's pause, going away and coming back, the one timer that moves
// the round on (next pond, or the end screen), the 1.5 s glimpse of এক নজরে, the kids' rest screen, and which keys count.
// Pure and mutable, so the statechart's bug paths replay in node tests (tests/session.test.ts); the component forwards
// events here and obeys. Spec: ai_docs/statecharts/gune-dekhi/GuneDekhi.tla.

export type Screen = "title" | "play" | "end" | "levels";
/** The timer after a right answer: the next pond, or (after the last one) the end screen. */
export type Pending = "none" | "next" | "end";

export type Session = {
  screen: Screen;
  /** Where the level list goes back to. */
  back: Screen;
  /** The player's pause menu is open. */
  paused: boolean;
  /** The window is blurred or the tab hidden. */
  away: boolean;
  /** The first tap after coming back only wakes the game; it never counts a fish or picks a tile. */
  swallow: boolean;
  pending: Pending;
  /** The pattern of এক নজরে is on screen and its 1.5 s are still to run. */
  looking: boolean;
  /** The kids' daily limit has passed at a break: the rest screen shows on every screen but play. */
  resting: boolean;
  /** Which round is on screen, and the last one whose stars were saved and limit checked. */
  serial: number;
  recorded: number;
  /** Event time the end screen appeared: its keys count only from a fresh press after it. */
  endAt: number;
};

export const createSession = (): Session =>
  ({ screen: "title", back: "title", paused: false, away: false, swallow: false, pending: "none", looking: false, resting: false, serial: 0, recorded: 0, endAt: 0 });

/** The rest screen covers the stage at a break only: never over a pond. */
export const restShows = (s: Session) => s.resting && s.screen !== "play";
/** Someone can see the game and play it: nothing covers it, the window is in front. */
export const watching = (s: Session) => !s.paused && !s.away && !restShows(s);
/** A timer may run only while the play screen is in front of someone. */
export const timerMayRun = (s: Session) => s.pending !== "none" && s.screen === "play" && watching(s);
/** The 1.5 s of the pattern run only while someone is looking at the play screen. */
export const glimpseMayRun = (s: Session) => s.looking && s.screen === "play" && watching(s);

/**
 * খেলো, আবার খেলো or a level from the list. Opening a round is a break too: past today's limit (`over`, from atBreak())
 * the round doesn't start and the rest screen shows instead. Returns true when the round starts.
 */
export function begin(s: Session, over: boolean): boolean {
  s.resting = over;
  if (over || s.paused) return false;
  s.screen = "play"; s.serial += 1; s.pending = "none"; s.swallow = false; s.looking = false;
  return true;
}

export type Tap = "ignored" | "woke" | "counts";
/** A finger or key on a fish or tile. Only on the play screen, with nothing covering it and no pond mid-cheer. */
export function tapOn(s: Session): Tap {
  if (s.screen !== "play" || !watching(s) || s.pending !== "none") return "ignored";
  if (s.swallow) { s.swallow = false; return "woke"; }
  return "counts";
}

/** A new pond of the glimpse game comes, or the child asks to see it again. */
export function showPattern(s: Session) { s.looking = true; }
/** The 1.5 s are up. Returns true when the pattern hides; false when nobody was looking (the timer is a stale one). */
export function glimpseEnds(s: Session): boolean {
  if (!glimpseMayRun(s)) return false;
  s.looking = false;
  return true;
}

/**
 * The right answer. On the last pond the round is finished at this very tap: its stars are saved and the limit is
 * checked (`over`, from atBreak()) now, not when the end screen comes, so nothing a quick hand does next can lose them.
 * Returns true when the caller must record the round.
 */
export function solved(s: Session, last: boolean, over: boolean): boolean {
  s.pending = last ? "end" : "next"; s.looking = false;
  if (!last) return false;
  s.recorded = s.serial;
  s.resting = over;
  return true;
}

/** The pending timer fires. */
export function timerFires(s: Session, now: number) {
  if (!timerMayRun(s)) return;
  if (s.pending === "end") { s.screen = "end"; s.endAt = now; }
  s.pending = "none";
}

/** The player's menu opened (⏸, P, Escape, blur or hide): the timers wait where they are. */
export function pause(s: Session) { s.paused = true; }
/** চালিয়ে যাও: the timers run again (the component gives them a short breath), and the hand is fresh. */
export function resume(s: Session) { s.paused = false; s.swallow = false; }

/** Window blur or tab hide. The first tap back is swallowed unless the player's menu takes it. */
export function blur(s: Session) { s.away = true; if (s.screen === "play") s.swallow = true; }
export function focus(s: Session) { s.away = false; }

/** নতুন করে শুরু, or শেষ: back to the title. A finished round was already recorded at its last tap. */
export function toTitle(s: Session) { s.screen = "title"; s.pending = "none"; s.looking = false; s.paused = false; s.swallow = false; }
/**
 * The level list: a choice screen, nothing runs under it. It opens from the title, the end screen, or the player's
 * সব লেভেল in mid-play; closing it goes back where it came from, with the pond still waiting.
 */
export function openLevels(s: Session) {
  if (s.screen === "levels") return;
  s.back = s.screen; s.screen = "levels";
}
export function closeLevels(s: Session) { if (s.screen === "levels") s.screen = s.back; }

/** A grown-up gave more time on the rest screen. */
export function extend(s: Session) { s.resting = false; }

/** Result-screen keys need a fresh press that started after the screen appeared, never a held or repeating key. */
export const freshKey = (s: Session, timeStamp: number, repeat: boolean) => s.screen === "end" && !repeat && timeStamp > s.endAt;

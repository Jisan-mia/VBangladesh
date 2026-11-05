// The page around a round: which screen shows, the player's pause, going away and coming back, the timers (the short rest
// after a picture, and the optional চটপট clock), the kids' rest screen, and which keys count. Pure and mutable, so the
// statechart's bug paths replay in node tests (tests/session.test.ts); the component forwards events here and obeys.
// Spec: ai_docs/statecharts/ulto-khela/UltoKhela.tla.

export type Screen = "title" | "play" | "end" | "levels";
/** After a right answer: "next" = a timer brings the next picture, "end" = after the last picture a timer brings the end screen. */
export type Pending = "none" | "next" | "end";

export type Session = {
  screen: Screen;
  /** Where the level list goes back to. */
  back: "title" | "end";
  /** চটপট is chosen (only on the title). */
  quick: boolean;
  /** The player's pause menu is open. */
  paused: boolean;
  /** The window is blurred or the tab hidden. */
  away: boolean;
  /** The first tap after coming back only wakes the game; it never answers. */
  swallow: boolean;
  pending: Pending;
  /** The pending timer was stopped by a pause or going away and waits to be armed again. */
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
  ({ screen: "title", back: "title", quick: false, paused: false, away: false, swallow: false, pending: "none", frozen: false, resting: false, serial: 0, recorded: 0, endAt: 0 });

/** The rest screen covers the stage at a break only: never over a picture. */
export const restShows = (s: Session) => s.resting && s.screen !== "play";
/** Is the game itself live: on a round, with nothing covering it and the child here. Every clock needs this. */
export const live = (s: Session) => s.screen === "play" && !s.paused && !s.away && !restShows(s);
/** The rest after a picture may run only while the game is live and not frozen. */
export const timerMayRun = (s: Session) => s.pending !== "none" && !s.frozen && live(s);
/** চটপট's clock runs only on a waiting, non-demo picture while the game is live. */
export const quickMayRun = (s: Session, picking: boolean) => s.quick && picking && s.pending === "none" && live(s);

/** চটপট is chosen on the title, never in the middle of a round. */
export function setQuick(s: Session, on: boolean) { if (s.screen === "title") s.quick = on; }

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
/** A finger or key on an answer. Only on a live round, with the picture not already answered. */
export function tapAnswer(s: Session): Tap {
  if (!live(s) || s.pending !== "none") return "ignored";
  if (s.swallow) { s.swallow = false; return "woke"; }
  return "counts";
}

/**
 * The picture is finished (a right tap, or চটপট's time ran out). On the last picture the round is finished at this very
 * moment: its stars are saved and the limit is checked (`over`, from atBreak()) now, not when the end screen comes, so
 * nothing a quick hand does next can lose them. Returns true when the caller must record.
 */
export function solved(s: Session, last: boolean, over: boolean): boolean {
  s.pending = last ? "end" : "next";
  if (!last) return false;
  s.recorded = s.serial;
  s.resting = over;
  return true;
}

/** The rest after a picture ends. Says what comes next: the next picture, the end screen, or nothing (a frozen clock). */
export function timerFires(s: Session, now: number): "none" | "next" | "end" {
  if (!timerMayRun(s)) return "none";
  const fired = s.pending;
  s.pending = "none";
  if (fired === "end") { s.screen = "end"; s.endAt = now; }
  return fired === "none" ? "none" : fired;
}

/** The player's menu opened (⏸, P, Escape, blur or hide): every clock freezes where it is. */
export function pause(s: Session) {
  s.paused = true;
  if (s.pending !== "none") s.frozen = true;
}
/** চালিয়ে যাও: the clocks run again (the component gives them a short breath), and the hand is fresh. */
export function resume(s: Session) { s.paused = false; if (!s.away) s.frozen = false; s.swallow = false; }

/** Window blur or tab hide: nothing runs while away. The first tap back is swallowed unless the player's menu takes it. */
export function blur(s: Session) { s.away = true; if (s.pending !== "none") s.frozen = true; if (s.screen === "play") s.swallow = true; }
/** Back again. A pause stays until চালিয়ে যাও; with none, the clocks are free to start again. */
export function focus(s: Session) { s.away = false; if (!s.paused) s.frozen = false; }

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

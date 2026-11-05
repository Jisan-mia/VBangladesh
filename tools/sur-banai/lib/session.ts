// The page around a round: which screen shows, the beat loop's permission to run, the player's pause, going away and coming
// back, the win that waits for ➜, the kids' rest screen, and which keys count. Nothing here runs on a timer. Pure and
// mutable, so the statechart's bug paths replay in node tests (tests/session.test.ts); the component forwards events here and
// obeys. Spec: ai_docs/statecharts/sur-banai/SurBanai.tla.
import type { Playing } from "./play";

export type Screen = "title" | "play" | "free" | "end" | "levels";

export type Session = {
  screen: Screen;
  /** Where the level list goes back to. */
  back: "title" | "end";
  /** What the end screen is for: a won level, or a tune kept from the free grid. */
  endKind: "level" | "kept";
  /** The beat loop: nothing plays unless this says so. */
  playing: Playing;
  /** The player's pause menu is open. */
  paused: boolean;
  /** The window is blurred or the tab hidden. */
  away: boolean;
  /** The first tap after coming back only wakes the game; it never puts a note. */
  swallow: boolean;
  /** The level is won: the tune played through and ➜ waits. */
  answered: boolean;
  /** The kids' daily limit has passed at a break: the rest screen shows on every screen but the grid. */
  resting: boolean;
  /** Which round is on screen, and the last one whose stars were saved and limit checked. */
  serial: number;
  recorded: number;
  /** When the win appeared and when the end screen appeared: their keys count only from a fresh press after them. */
  answeredAt: number;
  endAt: number;
};

export const createSession = (): Session =>
  ({ screen: "title", back: "title", endKind: "level", playing: "none", paused: false, away: false, swallow: false, answered: false, resting: false, serial: 0, recorded: 0, answeredAt: 0, endAt: 0 });

/** The grid screens: a tune you are making or a level you are on. The rest screen never covers them. */
export const onGrid = (s: Session) => s.screen === "play" || s.screen === "free";
export const restShows = (s: Session) => s.resting && !onGrid(s);

/**
 * খেলো, আবার খেলো, আমার সুর or a level from the list. Opening a round is a break too: past today's limit (`over`, from
 * atBreak()) the round doesn't start and the rest screen shows instead. Returns true when the round starts.
 */
export function begin(s: Session, over: boolean, free: boolean): boolean {
  s.resting = over;
  if (over || s.paused) return false;
  s.screen = free ? "free" : "play"; s.serial += 1; s.answered = false; s.swallow = false; s.playing = "none";
  return true;
}

/** May the beat loop start this kind? Only on its own screen, with nothing covering it. (A press needs the window, so it is here.) */
export function canPlay(s: Session, kind: Exclude<Playing, "none">): boolean {
  if (s.paused || restShows(s)) return false;
  if (kind === "free") return s.screen === "free";
  if (kind === "echo") return s.screen === "play" && s.answered;
  return s.screen === "play" && !s.answered;
}
export function startPlay(s: Session, kind: Exclude<Playing, "none">): boolean {
  if (!canPlay(s, kind)) return false;
  s.playing = kind;
  return true;
}
/** Stopping is never a break: no rest screen, nothing saved or lost. */
export function stopPlay(s: Session) { s.playing = "none"; }

export type Tap = "ignored" | "woke" | "counts";
/** A finger or key on a cell. Only on a grid, nothing covering it, and (on a level) not already won. */
export function tapCell(s: Session): Tap {
  if (!onGrid(s) || s.paused || restShows(s) || (s.screen === "play" && s.answered)) return "ignored";
  if (s.swallow) { s.swallow = false; return "woke"; }
  return "counts";
}

/**
 * ✓ matched. The stars are saved and the limit checked (`over`, from atBreak()) at this very tap, not when the end
 * screen comes, so nothing a quick hand does next can lose them. Returns true when the caller must record the round.
 */
export function won(s: Session, over: boolean, now: number): boolean {
  if (s.screen !== "play" || s.answered || s.paused) return false;
  s.answered = true; s.answeredAt = now; s.recorded = s.serial; s.resting = over;
  return true;
}

/** ➜ after a win: the end screen. */
export function advance(s: Session, now: number): boolean {
  if (s.screen !== "play" || !s.answered || s.paused) return false;
  s.screen = "end"; s.endKind = "level"; s.endAt = now; s.answered = false; s.playing = "none";
  return true;
}

/** ♥ রাখো: the tune on the free grid goes on the shelf, the grid stops, the end screen shows. A break: the limit is checked now. */
export function kept(s: Session, over: boolean, now: number): boolean {
  if (s.screen !== "free" || s.paused) return false;
  s.playing = "none"; s.screen = "end"; s.endKind = "kept"; s.endAt = now; s.resting = over;
  return true;
}

/** The player's menu opened (⏸, P, Escape, blur or hide): the beat stops. */
export function pause(s: Session) { s.paused = true; s.playing = "none"; }
/** চালিয়ে যাও: the hand is fresh. */
export function resume(s: Session) { s.paused = false; s.swallow = false; }

/** Window blur or tab hide: the beat stops and the first tap back is swallowed (the menu may take it). */
export function blur(s: Session) { s.away = true; s.playing = "none"; if (onGrid(s) && !s.answered) s.swallow = true; }
export function focus(s: Session) { s.away = false; }

/** নতুন করে শুরু, শেষ or home: back to the title. A kept tune is already on the shelf; the free grid's draft is in storage. */
export function toTitle(s: Session) { s.screen = "title"; s.answered = false; s.paused = false; s.swallow = false; s.playing = "none"; }
/** The level list: a choice screen, nothing runs under it. From the title or the end screen; from the pause menu (any screen) it goes back to the title. */
export function openLevels(s: Session, fromMenu = false) {
  if (s.screen === "title" || s.screen === "end") s.back = s.screen;
  else if (fromMenu) s.back = "title";
  else return;
  s.screen = "levels"; s.playing = "none"; s.answered = false; s.swallow = false;
}
export function closeLevels(s: Session) { if (s.screen === "levels") s.screen = s.back; }

/** A grown-up gave more time on the rest screen. */
export function extend(s: Session) { s.resting = false; }

/** Keys that move on need a fresh press that started after the win (or the end screen) appeared, never a held or repeating key. */
export const freshNext = (s: Session, timeStamp: number, repeat: boolean) => s.screen === "play" && s.answered && !repeat && timeStamp > s.answeredAt;
export const freshKey = (s: Session, timeStamp: number, repeat: boolean) => s.screen === "end" && !repeat && timeStamp > s.endAt;

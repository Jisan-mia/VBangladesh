// The game's screens as a small pure machine, so every statechart rule can be replayed in node tests against the code the
// component runs: title (with the level list) → play ⇄ paused → done → play again or back to the title.
// The kids' daily limit comes in as `overLimit` (useKidsSession's atBreak()); the component owns time and timers.

export type Phase = "title" | "play" | "done";
/** The end screen's buttons wait this long, so a quick last tap on the tree never lands on আবার খেলো. */
export const GUARD_MS = 700;

export type Session = {
  phase: Phase;
  paused: boolean;
  /** The level list is open (a choice screen: nothing moves). */
  picking: boolean;
  /** The kids' rest screen covers the stage. */
  resting: boolean;
  /** An arrow key or a finger is steering the basket. */
  held: boolean;
  /** The window or tab is away. */
  away: boolean;
  /** After coming back, the first tap only wakes the game; it is never a move. */
  swallow: boolean;
  /** Bumped on every new round, so a celebration queued for an older one is dropped. */
  run: number;
  /** When the end screen appeared (ms). */
  doneAt: number;
};

export const createSession = (): Session => ({ phase: "title", paused: false, picking: false, resting: false, held: false, away: false, swallow: false, run: 0, doneAt: 0 });

/** A round may begin only from the title, with no list open and the window here. Past today's limit, the rest screen shows instead. */
export function start(s: Session, overLimit: boolean) {
  if (s.phase !== "title" || s.picking || s.resting || s.away) return false;
  if (overLimit) { s.resting = true; return false; }
  s.phase = "play"; s.paused = false; s.held = false; s.swallow = false; s.run++;
  return true;
}

/** The last letter is in the basket: the end screen, and the rest screen on top of it once today's time is up. */
export function finish(s: Session, now: number, overLimit: boolean) {
  if (s.phase !== "play") return false;
  s.phase = "done"; s.paused = false; s.held = false; s.doneAt = now;
  s.resting = overLimit;
  return true;
}

/** আবার খেলো: the same level again, after the guard, and only within today's time. */
export function again(s: Session, now: number, overLimit: boolean) {
  if (s.phase !== "done" || s.resting || now - s.doneAt < GUARD_MS) return false;
  if (overLimit) { s.resting = true; return false; }
  s.phase = "play"; s.paused = false; s.held = false; s.swallow = false; s.run++;
  return true;
}

/** শেষ, নতুন করে শুরু, a picked level or a link: back to the title. Nothing starts on its own. */
export function home(s: Session) {
  s.phase = "title"; s.paused = false; s.held = false; s.picking = false; s.swallow = false; s.run++;
}

/** The end screen's buttons are live. */
export const endLive = (s: Session, now: number) => s.phase === "done" && !s.resting && now - s.doneAt >= GUARD_MS;

/** The player's pause, or this game's own on blur and hide: freeze a round in play and drop what the hand held. */
export function pause(s: Session) {
  s.held = false;
  if (s.phase !== "play" || s.paused) return false;
  s.paused = true;
  return true;
}

/** চালিয়ে যাও (or the first tap back when no menu is up). */
export function resume(s: Session) {
  if (!s.paused || s.away || s.resting) return false;
  s.paused = false; s.held = false; s.swallow = false;
  return true;
}

/** Blur or hide: release the hand and pause. The tap that brings focus back must not count as a move. */
export function leave(s: Session) {
  s.away = true;
  if (s.phase === "play") s.swallow = true;
  pause(s);
}
export function back(s: Session) { s.away = false; }

/** An arrow pressed or a finger down on the board: only during a round that's moving. */
export function grab(s: Session) {
  if (s.phase !== "play" || s.paused || s.away || s.resting || s.picking) return false;
  s.held = true;
  return true;
}
export function letGo(s: Session) { s.held = false; }

/** A pointerdown on the board: false when it only wakes the game after it was away (the first tap back). */
export function tapCounts(s: Session) {
  if (s.swallow) { s.swallow = false; return false; }
  return s.phase === "play" && !s.paused && !s.away && !s.resting;
}

/** The level list: a choice screen, open only between rounds. */
export function openList(s: Session) {
  if (s.phase === "play" || s.resting) return false;
  s.picking = true;
  return true;
}
export function closeList(s: Session) { s.picking = false; }

/** The parent gave more time, behind the gate. */
export function rested(s: Session) { s.resting = false; }

/** The round's clock and the tree move only now. */
export const moving = (s: Session) => s.phase === "play" && !s.paused && !s.away && !s.resting && !s.picking;

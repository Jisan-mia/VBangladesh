// The page around a round: which screen shows, the player's pause, going away and coming back (with the count-in that
// brings the beat back), the kids' rest screen, and which keys count. Pure and mutable, so the statechart's bug paths
// replay in node tests (tests/session.test.ts); the component forwards events here and obeys.
// Spec: ai_docs/statecharts/chhorar-tal/ChhorarTal.tla.

export type Screen = "title" | "play" | "end" | "levels";

/** The end screen's buttons and keys wait this long, so the tap that was still drumming when the ছড়া ended never lands on আবার খেলো. */
export const GUARD_MS = 700;

export type Session = {
  screen: Screen;
  /** Where the level list goes back to. */
  back: "title" | "end";
  /** The player's pause menu is open. */
  paused: boolean;
  /** The window is blurred or the tab hidden. */
  away: boolean;
  /** The first tap after coming back only wakes the game; it never lands on a beat. */
  swallow: boolean;
  /** The child lost the beat (a pause or a blur): two beats are counted in again before play carries on. */
  owed: boolean;
  /** The kids' daily limit has passed at a break: the rest screen shows on every screen but play. */
  resting: boolean;
  /** Which round is on screen, and the last one whose stars were saved and limit checked. */
  serial: number;
  recorded: number;
  /** When the end screen appeared (ms). */
  endAt: number;
};

export const createSession = (): Session =>
  ({ screen: "title", back: "title", paused: false, away: false, swallow: false, owed: false, resting: false, serial: 0, recorded: 0, endAt: 0 });

/** The rest screen covers the stage at a break only: never over a round. */
export const restShows = (s: Session) => s.resting && s.screen !== "play";

/**
 * খেলো, আবার খেলো or a level from the list. Opening a round is a break too: past today's limit (`over`, from atBreak())
 * the round doesn't start and the rest screen shows instead. Returns true when the round starts.
 */
export function begin(s: Session, over: boolean): boolean {
  s.resting = over;
  if (over || s.paused) return false;
  s.screen = "play"; s.serial += 1; s.swallow = false; s.owed = false;
  return true;
}

export type Tap = "ignored" | "woke" | "counts";
/** A finger or key on the drum: only while playing, nothing covering it, and not the click that brought the window back. */
export function tapCounts(s: Session): Tap {
  if (s.screen !== "play" || s.paused || s.away) return "ignored";
  if (s.swallow) { s.swallow = false; return "woke"; }
  return "counts";
}

/**
 * The ছড়া is over. The round is finished at this very moment: the stars are saved and the limit is checked (`over`, from
 * atBreak()) now, not behind a timer a quick tap could cancel. Returns true when the caller must record it (once per round).
 */
export function finished(s: Session, over: boolean, now: number): boolean {
  if (s.screen !== "play" || s.recorded === s.serial) return false;
  s.recorded = s.serial; s.resting = over; s.screen = "end"; s.endAt = now; s.owed = false; s.swallow = false;
  return true;
}

/** The player's menu opened (⏸, P, Escape, blur or hide): the beat is lost. */
export function pause(s: Session) { s.paused = true; if (s.screen === "play") s.owed = true; }
/** চালিয়ে যাও: the menu took the click, so nothing is swallowed. Returns true when the beat must be counted in again. */
export function resume(s: Session): boolean { s.paused = false; s.swallow = false; return takeOwed(s); }

/** Window blur or tab hide. The first tap back is swallowed unless the player's menu takes it. */
export function blur(s: Session) { s.away = true; if (s.screen === "play") { s.swallow = true; s.owed = true; } }
/** The window is back. Returns true when the beat must be counted in again (not while the menu is still open). */
export function focus(s: Session): boolean { s.away = false; return s.paused ? false : takeOwed(s); }

function takeOwed(s: Session) {
  if (!s.owed || s.screen !== "play") { s.owed = false; return false; }
  s.owed = false;
  return true;
}

/** নতুন করে শুরু, or শেষ: back to the title. A finished round was already recorded the moment it ended. */
export function toTitle(s: Session) { s.screen = "title"; s.paused = false; s.swallow = false; s.owed = false; }
/** The level list: a choice screen, nothing runs under it. Opens from the title or the end screen only, never over a round. */
export function openLevels(s: Session) { if (s.screen === "title" || s.screen === "end") { s.back = s.screen; s.screen = "levels"; } }
export function closeLevels(s: Session) { if (s.screen === "levels") s.screen = s.back; }

/** A grown-up gave more time on the rest screen. */
export function extend(s: Session) { s.resting = false; }

/** The end screen is live: its keys and buttons count only after the guard. */
export const endLive = (s: Session, now: number) => s.screen === "end" && !s.paused && now - s.endAt >= GUARD_MS;

export type KeyAct = "tap" | "start" | "again" | "done" | "pause" | "none";
export type KeyRoute = { act: KeyAct; prevent: boolean };
const NONE: KeyRoute = { act: "none", prevent: false };
const KEYS: Record<KeyAct, KeyRoute> = {
  tap: { act: "tap", prevent: true }, start: { act: "start", prevent: true }, again: { act: "again", prevent: true },
  done: { act: "done", prevent: true }, pause: { act: "pause", prevent: true }, none: { act: "none", prevent: true },
};

/**
 * Where a key goes. Space and Enter always belong to the game on its own screens (`prevent`), so they never press the
 * last clicked button and never scroll the page. A held key (`repeat`) is swallowed, and an end-screen key needs a fresh
 * press after the guard. The level list and the rest screen handle their own keys.
 */
export function routeKey(s: Session, key: string, repeat: boolean, now: number): KeyRoute {
  if (s.paused || restShows(s) || s.screen === "levels") return NONE;
  const go = key === " " || key === "Enter";
  if (key === "p" || key === "P") return KEYS.pause;
  if (s.screen === "title") return go ? (repeat ? KEYS.none : KEYS.start) : NONE;
  if (s.screen === "play") return go ? (repeat ? KEYS.none : KEYS.tap) : NONE;
  if (s.screen === "end") {
    const press = go ? "again" : key === "1" ? "again" : key === "2" ? "done" : null;
    if (!press) return NONE;
    return repeat || !endLive(s, now) ? KEYS.none : KEYS[press];
  }
  return NONE;
}

// The page around a trip: which screen shows, the player's pause, going away and coming back, the answer that waits for ➜,
// the kids' rest screen, and which keys and taps count. Nothing here runs on a timer except the plane's flight, which the
// component pauses and resumes. Pure and mutable, so the statechart's bug paths replay in node tests (tests/session.test.ts);
// the component forwards events here and obeys. Spec: ai_docs/statecharts/prithibi-ghuri/PrithibiGhuri.tla.

export type Screen = "title" | "play" | "end" | "levels" | "passport";

export type Session = {
  screen: Screen;
  /** Where the level list and the passport go back to. */
  back: "title" | "end" | "play";
  /** The player's pause menu is open. */
  paused: boolean;
  /** The window is blurred or the tab hidden. */
  away: boolean;
  /** The first tap after coming back only wakes the game; it never flies, turns a card or picks a picture. */
  swallow: boolean;
  /** A right answer is showing: ➜ waits. */
  answered: boolean;
  /** The kids' daily limit has passed at a break: the rest screen shows on every screen but play. */
  resting: boolean;
  /** Which trip is on screen, and the last one whose stars were saved and limit checked. */
  serial: number;
  recorded: number;
  /** When the thing on screen appeared (a card, an answer, the end screen). A key counts only from a fresh press after it. */
  shownAt: number;
  /** The list was opened from the pause menu, over a trip that waits underneath. */
  listOverTrip: boolean;
};

export const createSession = (): Session =>
  ({ screen: "title", back: "title", paused: false, away: false, swallow: false, answered: false, resting: false, serial: 0, recorded: 0, shownAt: 0, listOverTrip: false });

/** The rest screen covers the stage at a break only: never over a trip in play. */
export const restShows = (s: Session) => s.resting && s.screen !== "play";

/** Everything in play stands still: the pause menu, a blurred window, or a list or passport over the trip. */
export const frozen = (s: Session) => s.paused || s.away || s.screen !== "play";

/**
 * খেলো, আবার খেলো or a level from the list. Opening a trip is a break too: past today's limit (`over`, from atBreak())
 * the trip doesn't start and the rest screen shows instead. Returns true when the trip starts.
 */
export function begin(s: Session, over: boolean, now = 0): boolean {
  s.resting = over;
  if (over || s.paused) return false;
  s.screen = "play"; s.serial += 1; s.answered = false; s.swallow = false; s.shownAt = now; s.listOverTrip = false;
  return true;
}

export type Tap = "ignored" | "woke" | "counts";
/** A finger on a pin, ➜ or a picture. Only in play, nothing covering it; the first tap after coming back only wakes the game. */
export function tap(s: Session): Tap {
  if (s.screen !== "play" || s.paused || restShows(s)) return "ignored";
  if (s.swallow) { s.swallow = false; return "woke"; }
  return "counts";
}

/** Something new is on screen (a card, a question, the map): its keys and taps count only after this moment. */
export function shown(s: Session, now: number) { s.shownAt = now; }

/** A right answer. On the last question of the trip the round is finished at this very tap: stars saved, the limit checked. Returns true when the caller must record. */
export function solved(s: Session, last: boolean, over: boolean, now: number): boolean {
  s.answered = true; s.shownAt = now;
  if (!last) return false;
  s.recorded = s.serial;
  s.resting = over;
  return true;
}

/** ➜ after a right answer: the next question or the map, or after the last question the end screen. */
export function advance(s: Session, last: boolean, now: number): "ignored" | "next" | "end" {
  if (s.screen !== "play" || !s.answered || s.paused) return "ignored";
  s.answered = false; s.shownAt = now;
  if (!last) return "next";
  s.screen = "end";
  return "end";
}

/** The player's menu opened (⏸, P, Escape, blur or hide). */
export function pause(s: Session) { s.paused = true; }
/** চালিয়ে যাও: the hand is fresh. */
export function resume(s: Session) { s.paused = false; s.swallow = false; }

/** Window blur or tab hide. The first tap back is swallowed unless the player's menu takes it. */
export function blur(s: Session) { s.away = true; if (s.screen === "play") s.swallow = true; }
export function focus(s: Session) { s.away = false; }

/** নতুন করে শুরু, or শেষ: back to the title. A finished trip was already recorded at its last answer. */
export function toTitle(s: Session) { s.screen = "title"; s.answered = false; s.paused = false; s.swallow = false; s.listOverTrip = false; }

/**
 * The level list or the passport: a choice screen, and nothing runs under it. From the title or the end screen with a tap;
 * over a trip only from the pause menu (`fromMenu`), so a stray tap never reaches it. Opening it freezes the trip, and ফিরে যাও gives it back.
 */
export function openChoice(s: Session, kind: "levels" | "passport", fromMenu = false) {
  if (s.screen === "title" || s.screen === "end") { s.back = s.screen; s.screen = kind; s.listOverTrip = false; return; }
  if (s.screen === "play" && fromMenu && kind === "levels") { s.back = "play"; s.screen = "levels"; s.listOverTrip = true; }
}
export function closeChoice(s: Session) {
  if (s.screen !== "levels" && s.screen !== "passport") return;
  const into = s.back;
  s.screen = into; s.listOverTrip = false;
  if (into === "play") s.swallow = true; // the tap that closes the list is not a move
}

/** A grown-up gave more time on the rest screen. */
export function extend(s: Session) { s.resting = false; }

/** Keys that move on need a fresh press that started after the thing appeared, never a held or repeating key. */
export const freshKey = (s: Session, timeStamp: number, repeat: boolean) => !repeat && timeStamp > s.shownAt;
/** A finger waits a moment too, so a double tap on ➜ never flips past a card unseen. */
export const DOUBLE_TAP_MS = 180;
export const freshTap = (s: Session, now: number) => now - s.shownAt >= DOUBLE_TAP_MS;

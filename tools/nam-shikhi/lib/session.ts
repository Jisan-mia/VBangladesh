// The screens around a round as a small pure machine, so every statechart rule replays in node tests against the code the
// component runs: title (world tiles, the level list) → play ⇄ paused → end → play again or back to the title.
// The kids' daily limit comes in as `over` (useKidsSession's atBreak()). Nothing here is timed except the end screen's guard.
// Spec: ai_docs/statecharts/nam-shikhi/NamShikhi.tla.

export type Screen = "title" | "list" | "play" | "end";
/** The end screen's buttons wait this long, so the quick tap that opened it never lands on আবার খেলো. */
export const GUARD_MS = 700;

export type Session = {
  screen: Screen;
  /** Where the level list goes back to. */
  from: "title" | "end";
  /** The player's pause menu is open. */
  paused: boolean;
  /** The window is blurred or the tab hidden. */
  away: boolean;
  /** After coming back mid-round, the first tap only wakes the game; it never places a sticker. */
  swallow: boolean;
  /** The kids' daily limit has passed at a break (mirrors useKidsSession's resting). */
  resting: boolean;
  /** Which round is on screen, and the last one whose stars were saved and limit checked. */
  serial: number;
  recorded: number;
  /** When the end screen appeared (ms): its keys and buttons count only after the guard. */
  endAt: number;
};

export const createSession = (): Session =>
  ({ screen: "title", from: "title", paused: false, away: false, swallow: false, resting: false, serial: 0, recorded: 0, endAt: 0 });

/** The rest screen covers the stage at a break only, never over a card. */
export const restShows = (s: Session) => s.resting && s.screen !== "play";

/**
 * খেলো (from the title) or আবার খেলো (from the end, after the guard). Opening a round is a break too: past today's limit
 * (`over`, from atBreak()) the round doesn't start and the rest screen shows instead. Returns true when the round starts.
 */
export function begin(s: Session, over: boolean, now = 0): boolean {
  if (s.screen !== "title" && s.screen !== "end") return false;
  if (s.screen === "end" && now - s.endAt < GUARD_MS) return false;
  if (s.paused || s.resting) return false;
  if (over) { s.resting = true; return false; }
  s.screen = "play"; s.serial += 1; s.swallow = false;
  return true;
}

export type Tap = "ignored" | "woke" | "counts";
/** A finger or key on a sticker or the figure: only on the play screen with nothing covering it. */
export function tapCounts(s: Session): Tap {
  if (s.screen !== "play" || s.paused || s.away) return "ignored";
  if (s.swallow) { s.swallow = false; return "woke"; }
  return "counts";
}

/**
 * The last sticker is placed. The round is finished at this very tap: its stars are saved and the limit is checked (`over`)
 * now, so nothing a quick hand does next can lose them. Returns true when the caller must record the round (once per round).
 */
export function won(s: Session, over: boolean): boolean {
  if (s.screen !== "play" || s.recorded === s.serial) return false;
  s.recorded = s.serial;
  s.resting = over;
  return true;
}

/** → on the full page: the end screen. Only after the round was recorded. */
export function toEnd(s: Session, now: number): boolean {
  if (s.screen !== "play" || s.recorded !== s.serial || s.paused) return false;
  s.screen = "end"; s.endAt = now;
  return true;
}

/** The end screen's buttons and keys are live. */
export const endLive = (s: Session, now: number) => s.screen === "end" && !restShows(s) && !s.paused && now - s.endAt >= GUARD_MS;

/** শেষ (after the guard), নতুন করে শুরু, or a #p= link: back to a title. Nothing starts on its own. */
export function home(s: Session) {
  s.screen = "title"; s.from = "title"; s.swallow = false;
}

/** সব লেভেল: a choice screen, open only between rounds. */
export function openList(s: Session): boolean {
  if (s.screen !== "title" && s.screen !== "end") return false;
  if (restShows(s) || s.paused) return false;
  s.from = s.screen; s.screen = "list";
  return true;
}
/** A level picked, or ফিরে যাও: a level pick always goes to the title (it never starts a round by itself). */
export function closeList(s: Session, picked: boolean) {
  if (s.screen !== "list") return;
  s.screen = picked ? "title" : s.from;
}

/** The world tiles and the level chip are tappable only on the title. */
export const choosingAllowed = (s: Session) => s.screen === "title" && !s.paused && !restShows(s);

/** The player's menu opened (⏸, P, Escape, blur or hide). */
export function pause(s: Session) { s.paused = true; }
/** চালিয়ে যাও: the menu took the click that came back, so nothing is swallowed. */
export function resume(s: Session) { s.paused = false; s.swallow = false; }

/** Blur or hide. Mid-round, the tap that brings focus back must not place a sticker. */
export function leave(s: Session) {
  s.away = true;
  if (s.screen === "play") s.swallow = true;
}
export function back(s: Session) { s.away = false; }

/** The parent gave more time, behind the gate. */
export function rested(s: Session) { s.resting = false; }

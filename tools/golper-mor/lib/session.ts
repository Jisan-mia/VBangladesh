// The screens and the page of a story as a small pure machine, so every statechart rule replays in node tests against the
// code the component runs: shelf → reading (up to the মোড়, a path chosen, the path) → end → another turn, again, or the shelf.
// The kids' daily limit comes in as `over` (useKidsSession's atBreak()). Nothing here is timed except the end page's guard.
// Spec: ai_docs/statecharts/golper-mor/Golper.tla.
import { pathOf, storyOf, type Side } from "./stories";

export type Screen = "shelf" | "read" | "end";
/** The end page's buttons wait this long, so the quick tap that finished the story never lands on আবার পড়ো. */
export const GUARD_MS = 700;

export type Session = {
  screen: Screen;
  /** The story on screen (or the one just finished), and the path chosen at the মোড় (null before). */
  id: string;
  side: Side | null;
  /** The panel on screen, counted along the whole path (the shared start, then the chosen side). */
  step: number;
  /** The player's pause menu is open. */
  paused: boolean;
  /** The window is blurred or the tab hidden. */
  away: boolean;
  /** After coming back mid-story, the first tap only wakes the book; it never turns a page or picks a path. */
  swallow: boolean;
  /** The kids' daily limit has passed at a break (mirrors useKidsSession's resting). */
  resting: boolean;
  /** Which reading is on screen, and the last one whose mark was saved and limit checked. */
  serial: number;
  recorded: number;
  /** When the end page appeared (ms): its buttons and keys count only after the guard. */
  endAt: number;
};

export const createSession = (): Session =>
  ({ screen: "shelf", id: "", side: null, step: 0, paused: false, away: false, swallow: false, resting: false, serial: 0, recorded: 0, endAt: 0 });

/** The rest screen covers the shelf. The end page shows first (its talk question stays), then the rest comes. */
export const restShows = (s: Session) => s.resting && s.screen === "shelf";

/** The step of the মোড় panel: the last panel of the shared start. */
export const turnStep = (id: string) => storyOf(id)!.intro.length - 1;
export const atTurn = (s: Session) => s.screen === "read" && s.side === null && s.step === turnStep(s.id);
export const pathLength = (s: Session) => s.side === null ? storyOf(s.id)!.intro.length : pathOf(storyOf(s.id)!, s.side).length;

/** A new reading starts from the shelf or the end page. Opening a story is a break: past today's limit nothing starts. */
function start(s: Session, id: string, step: number, over: boolean, now: number): boolean {
  if (s.paused || s.away) return false;
  if (s.screen === "end" && now - s.endAt < GUARD_MS) return false;
  if (s.screen === "shelf" && s.resting) return false;
  if (s.screen === "read") return false;
  if (over || s.resting) { s.resting = true; s.screen = "shelf"; s.side = null; s.step = 0; return false; }
  s.screen = "read"; s.id = id; s.side = null; s.step = step; s.serial += 1; s.swallow = false;
  return true;
}

/** A cover on the shelf, or আবার পড়ো (after the guard): the story from its first picture. Returns true when it starts. */
export const openStory = (s: Session, id: string, over: boolean, now = 0) => start(s, id, 0, over, now);
/** অন্যটা বেছে দেখো: the same story, back at the মোড় to pick again. */
export const tryOther = (s: Session, over: boolean, now = 0) => s.screen === "end" && start(s, s.id, turnStep(s.id), over, now);

export type Tap = "ignored" | "woke" | "counts";
/** A finger or key on the book: only while reading, with nothing covering it. */
export function tapCounts(s: Session): Tap {
  if (s.screen !== "read" || s.paused || s.away) return "ignored";
  if (s.swallow) { s.swallow = false; return "woke"; }
  return "counts";
}

export type Turned = "ignored" | "panel" | "turn" | "last";
/** → on a picture. At the মোড় it does nothing (the path must be picked); on the last picture of a path it asks to finish. */
export function nextPanel(s: Session): Turned {
  if (s.screen !== "read" || s.paused) return "ignored";
  if (atTurn(s)) return "ignored";
  if (s.step < pathLength(s) - 1) {
    s.step += 1;
    return atTurn(s) ? "turn" : "panel";
  }
  return s.side === null ? "ignored" : "last";
}

/** ←: one picture back. Back from the first picture of a path is the মোড় again, with the path unpicked. */
export function prevPanel(s: Session): boolean {
  if (s.screen !== "read" || s.paused || s.step === 0) return false;
  s.step -= 1;
  if (s.step === turnStep(s.id)) s.side = null;
  return true;
}

/** One of the two paths at the মোড়: the first picture of that path. */
export function choose(s: Session, side: Side): boolean {
  if (!atTurn(s) || s.paused) return false;
  s.side = side; s.step = turnStep(s.id) + 1;
  return true;
}

/**
 * গল্প শেষ on the last picture of a path. The story is finished at this very tap: the mark is saved and the limit is checked
 * (`over`) now, so nothing a quick hand does next can lose it. Returns true when the caller must record it (once per reading).
 */
export function finish(s: Session, over: boolean, now: number): boolean {
  if (s.screen !== "read" || s.paused || s.side === null || s.step !== pathLength(s) - 1 || s.recorded === s.serial) return false;
  s.recorded = s.serial; s.resting = over; s.screen = "end"; s.endAt = now;
  return true;
}

/** The end page's buttons and keys are live. */
export const endLive = (s: Session, now: number) => s.screen === "end" && !s.paused && now - s.endAt >= GUARD_MS;

/** ← সব গল্প, শেষ, নতুন করে শুরু or সব লেভেল: back to the shelf. Nothing starts on its own. */
export function toShelf(s: Session) {
  s.screen = "shelf"; s.side = null; s.step = 0; s.swallow = false;
}

/** নতুন করে শুরু: a story being read starts again from its first picture; anywhere else it is the shelf. */
export function restart(s: Session, over: boolean): boolean {
  s.paused = false; s.swallow = false;
  if (s.screen !== "read") { toShelf(s); return false; }
  const id = s.id;
  toShelf(s);
  return start(s, id, 0, over, 0);
}

/** The player's menu opened (⏸, P, Escape, blur or hide). */
export function pause(s: Session) { s.paused = true; }
/** চালিয়ে যাও: the menu took the click that came back, so nothing is swallowed. */
export function resume(s: Session) { s.paused = false; s.swallow = false; }

/** Blur or hide. Mid-story, the tap that brings focus back must not turn a page or pick a path. */
export function leave(s: Session) {
  s.away = true;
  if (s.screen === "read") s.swallow = true;
}
export function returned(s: Session) { s.away = false; }

/** The parent gave more time, behind the gate. */
export function rested(s: Session) { s.resting = false; }

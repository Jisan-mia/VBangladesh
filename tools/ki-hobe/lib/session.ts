// The screens around a round as a small pure machine, so every statechart rule replays in node tests against the code the
// component runs: title (world tiles, the level list) → play ⇄ paused → end → play again or back to the title.
// The experiment itself runs as CSS animations; this says when they may run (`running`) and when the answer may show
// (`experimentEnds`), so looking away can never let an experiment finish without the child.
// The kids' daily limit comes in as `over` (useKidsSession's atBreak()). Spec: ai_docs/statecharts/ki-hobe/KiHobe.tla.
import { watched, type Round } from "./round";

export type Screen = "title" | "list" | "play" | "end";
/** The end screen's buttons wait this long, so the quick tap that opened it never lands on আবার খেলো. */
export const GUARD_MS = 700;
/** After a guess, an answer or → lands, the next tap is deaf for this long, so a double tap never skips an experiment. */
export const SETTLE_MS = 350;

export type Session = {
  screen: Screen;
  /** Where the level list goes back to. */
  from: "title" | "end";
  /** The player's pause menu is open. */
  paused: boolean;
  /** The window is blurred or the tab hidden. */
  away: boolean;
  /** After coming back mid-round, the first tap only wakes the game; it never guesses, replays or moves on. */
  swallow: boolean;
  /** The experiment reached its end while the child was away or the menu was open; the answer waits for them. */
  waiting: boolean;
  /** The kids' daily limit has passed at a break (mirrors useKidsSession's resting). */
  resting: boolean;
  /** Which round is on screen, and the last one whose stars were saved and limit checked. */
  serial: number;
  recorded: number;
  /** When the end screen appeared (ms): its keys and buttons count only after the guard. */
  endAt: number;
  /** When the last step landed, in ms. */
  stepAt: number;
};

export const createSession = (): Session =>
  ({ screen: "title", from: "title", paused: false, away: false, swallow: false, waiting: false, resting: false, serial: 0, recorded: 0, endAt: 0, stepAt: 0 });

/** The rest screen covers the stage at a break only, never over an experiment in play. */
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
  s.screen = "play"; s.serial += 1; s.swallow = false; s.waiting = false; s.stepAt = now;
  return true;
}

export type Tap = "ignored" | "woke" | "counts";
/** A finger or key on a guess, আবার দেখো or →: only on the play screen with nothing covering it. */
export function tapCounts(s: Session, now = Number.POSITIVE_INFINITY): Tap {
  if (s.screen !== "play" || s.paused || s.away) return "ignored";
  if (now - s.stepAt < SETTLE_MS) return "ignored";
  if (s.swallow) { s.swallow = false; return "woke"; }
  return "counts";
}

/** A guess landed, an experiment ended or a new one came: the next tap waits for SETTLE_MS. */
export function stepped(s: Session, now: number) { s.stepAt = now; }

/** The experiment's animations may move only now: on the play screen, in the watch step, nobody away and no menu up. */
export const running = (s: Session, round: Round) => s.screen === "play" && round.step === "watch" && !s.away && !s.paused;

/**
 * The experiment's last animation ended. If the child is away (or the menu is up) the answer waits (`waiting`); otherwise it
 * shows now. Returns true when the answer must show.
 */
export function experimentEnds(s: Session, round: Round): boolean {
  if (s.screen !== "play" || round.step !== "watch") return false;
  if (s.away || s.paused) { s.waiting = true; return false; }
  return watched(round);
}

/** Back from away or the menu: an experiment that ended while the child was gone shows its answer now. */
export function settleWaiting(s: Session, round: Round): boolean {
  if (!s.waiting || s.away || s.paused) return false;
  s.waiting = false;
  return watched(round);
}

/**
 * The last guess is made. The round is won at this very tap: its stars are saved and the limit is checked (`over`) now, so
 * nothing a quick hand does next can lose them or count them twice. Returns true when the caller must record the round (once
 * per round, however many times this is asked).
 */
export function won(s: Session, over: boolean): boolean {
  if (s.screen !== "play" || s.recorded === s.serial) return false;
  s.recorded = s.serial;
  s.resting = over;
  return true;
}

/** → on the last answer: the end screen. Only after the round was recorded and the answer was shown. */
export function toEnd(s: Session, round: Round, now: number): boolean {
  if (s.screen !== "play" || s.recorded !== s.serial || s.paused || round.step !== "answer") return false;
  s.screen = "end"; s.endAt = now;
  return true;
}

/** The end screen's buttons and keys are live. */
export const endLive = (s: Session, now: number) => s.screen === "end" && !restShows(s) && !s.paused && now - s.endAt >= GUARD_MS;

/** শেষ (after the guard), নতুন করে শুরু: back to a title. Nothing starts on its own. */
export function home(s: Session) {
  s.screen = "title"; s.from = "title"; s.swallow = false; s.waiting = false;
}

/**
 * সব লেভেল: a choice screen. From the title or the end screen, or from the pause menu mid-round (the round is left unfinished:
 * nothing is recorded and nothing is lost). Not under the rest screen.
 */
export function openList(s: Session): boolean {
  if (s.screen === "list") return false;
  if (restShows(s)) return false;
  s.from = s.screen === "end" ? "end" : "title"; s.screen = "list"; s.swallow = false; s.waiting = false;
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

/** Blur or hide. Mid-round, the tap that brings focus back must not guess or move on. */
export function leave(s: Session) {
  s.away = true;
  if (s.screen === "play") s.swallow = true;
}
export function back(s: Session) { s.away = false; }

/** The parent gave more time, behind the gate. */
export function rested(s: Session) { s.resting = false; }

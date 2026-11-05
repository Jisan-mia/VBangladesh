// A level's play as a pure reducer: the component passes performance.now() in, so the tests replay every statechart
// path exactly. Every timed thing (the shutter, the look, the eyelids, the reveal's pause, the answer clock) is one phase
// clock that runs only while nothing pauses it, so nothing can happen behind a hidden tab, a blur, the menu or a sheet.
import { clockMs } from "./tick.hot";

/**
 * ready: the shutter is down · opening: it rolls up (shelf 1) · look: the shelf shows and its time runs · closing: the
 * eyes close, মামা takes, they open on the question · ask: the pictures, the answer clock runs · reveal: the answer and
 * the things going back · blink: the eyes close and open on the next shelf · over: the cash memo.
 */
export type Phase = "ready" | "opening" | "look" | "closing" | "ask" | "reveal" | "blink" | "over";
/** Why play is paused: you went away (blur, a hidden tab, the player's menu), or a sheet is open (সব লেভেল). */
export type Why = "away" | "sheet";
/** `dur` ms the phase lasts (0: until you act), `spent` ms banked on its clock, `since` when it last started running. */
export type Session = { phase: Phase; shelf: number; dur: number; spent: number; since: number; why: Why | null };
export type Timing = { shutter: number; close: number; blink: number; auto: number; breath: number };

export const TIMING: Timing = { shutter: 650, close: 760, blink: 640, auto: 1300, breath: 600 };
/** ধীরে খেলো: the same look time, calmer changes, and a right answer waits longer before moving on. */
export const SLOW_TIMING: Timing = { shutter: 650, close: 900, blink: 800, auto: 2200, breath: 900 };

export const ready = (): Session => ({ phase: "ready", shelf: 0, dur: 0, spent: 0, since: 0, why: null });

/** The clock runs: a phase that moves on its own or counts, and nothing pausing it. */
export const running = (s: Session) => s.why === null && s.phase !== "ready" && s.phase !== "over";
export const elapsed = (s: Session, now: number) => clockMs(s.spent, s.since, running(s), now);

const enter = (s: Session, phase: Phase, dur: number, since: number, shelf = s.shelf): Session => ({ phase, shelf, dur, spent: 0, since, why: null });

/** ঝাঁপ তোলো: the shutter rolls up; the look starts once it is up. */
export const begin = (s: Session, now: number, t: Timing): Session => s.phase === "ready" ? enter(s, "opening", t.shutter, now) : s;

/** The clock moves the phase on when its time is up, carrying any overshoot so nothing drifts. */
export function tick(s: Session, now: number, lookMs: number, t: Timing, last: boolean): Session {
  if (!running(s) || !s.dur) return s;
  const el = elapsed(s, now);
  if (el < s.dur) return s;
  const at = now - (el - s.dur);
  switch (s.phase) {
    case "opening": return enter(s, "look", lookMs, at);
    case "look": return enter(s, "closing", t.close, at);
    case "closing": return enter(s, "ask", 0, at);
    case "reveal": return last ? enter(s, "over", 0, at) : enter(s, "blink", t.blink, at);
    case "blink": return enter(s, "look", lookMs, at, s.shelf + 1);
    default: return s;
  }
}

/** মনে আছে: you end the look early. */
export const doneLooking = (s: Session, now: number, t: Timing): Session => s.phase === "look" && running(s) ? enter(s, "closing", t.close, now) : s;

/** Picks count only while the question's clock runs. */
export const canPick = (s: Session) => s.phase === "ask" && running(s);
/** The ms the question has been up: what a pick now is timed at. */
export const askMs = (s: Session, now: number) => s.phase === "ask" ? Math.round(elapsed(s, now)) : 0;

/** The shelf is decided: the reveal, moving on by itself after `autoMs` (0 waits for পরের তাক). */
export const decided = (s: Session, now: number, autoMs: number): Session => canPick(s) ? enter(s, "reveal", autoMs, now) : s;

/** পরের তাক (or the reveal's own time running out): the next shelf behind a blink, or the cash memo after the last. */
export function next(s: Session, now: number, t: Timing, last: boolean): Session {
  if (s.phase !== "reveal" || !running(s)) return s;
  return last ? enter(s, "over", 0, now) : enter(s, "blink", t.blink, now);
}

/** Stops the clock. A sheet outranks an away pause: coming back from another window doesn't close the sheet. */
export function pause(s: Session, now: number, why: Why): Session {
  if (running(s)) return { ...s, spent: elapsed(s, now), why };
  if (s.why !== null && why === "sheet" && s.why !== "sheet") return { ...s, why };
  return s;
}

/** Starts the clock again after a short breath, but only from the pause this action ends. */
export const resume = (s: Session, now: number, why: Why, breath: number): Session =>
  s.why !== null && s.why === why ? { ...s, why: null, since: now + breath } : s;

/** The shelf is on screen and its look time counts (the hum's only state). */
export const looking = (s: Session) => s.phase === "look" && running(s);
/** A level someone has started and not finished. */
export const started = (s: Session) => s.phase !== "ready" && s.phase !== "over";

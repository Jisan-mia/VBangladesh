// One round as a pure reducer: the component passes performance.now() in, so the tests replay every statechart path
// exactly. Two clocks, both stopped by any pause: the round clock (the 60 s, minus every penalty) runs only while a sum
// is on screen, and the phase clock times the cash drawer opening and the how-line after a miss. Nothing can tick
// behind a hidden tab, a blur, the player's menu or the level sheet, and a second pause changes nothing.
import { clockMs } from "./tick.hot";
import { penaltyMs } from "./game";

/** ready: the cash box is shut · opening: its drawer slides out · play: a sum is up and the clock runs · lesson: a miss, the right answer and how, the clock held · over: the end screen. */
export type Phase = "ready" | "opening" | "play" | "lesson" | "over";
/** Why play is paused: you went away (blur, a hidden tab, the player's menu), or a sheet is open (সব লেভেল). */
export type Why = "away" | "sheet";
export type Session = {
  phase: Phase; why: Why | null;
  /** ms the round may run: the round's seconds less every penalty. */
  budget: number;
  /** The round clock: banked ms and when it last started running. */
  spent: number; since: number;
  /** The phase clock (opening, lesson): how long the phase lasts, banked ms, when it last started. */
  dur: number; pSpent: number; pSince: number;
  /** Round ms when the sum on screen appeared (what an answer is timed from). */
  shownAt: number;
  /** Wrong answers in a row, for the next penalty. */
  slips: number;
};
export type Timing = { drawer: number; lesson: number; breath: number };
export const TIMING: Timing = { drawer: 450, lesson: 1100, breath: 600 };
/** ধীরে খেলো: the same clock, a longer look at the how-line (the clock is held while it shows) and a longer breath. */
export const SLOW_TIMING: Timing = { drawer: 450, lesson: 2200, breath: 900 };

export const ready = (budget: number): Session => ({ phase: "ready", why: null, budget, spent: 0, since: 0, dur: 0, pSpent: 0, pSince: 0, shownAt: 0, slips: 0 });

/** The round clock runs: a sum is up and nothing pauses it. */
export const roundRuns = (s: Session) => s.phase === "play" && s.why === null;
/** The phase clock runs: the drawer or the how-line, and nothing pauses it. */
export const phaseRuns = (s: Session) => (s.phase === "opening" || s.phase === "lesson") && s.why === null;
/** Anything is counting. */
export const running = (s: Session) => roundRuns(s) || phaseRuns(s);
export const roundMs = (s: Session, now: number) => clockMs(s.spent, s.since, roundRuns(s), now);
export const phaseMs = (s: Session, now: number) => clockMs(s.pSpent, s.pSince, phaseRuns(s), now);
export const leftMs = (s: Session, now: number) => Math.max(0, s.budget - roundMs(s, now));

/** শুরু করো: the drawer slides out; the clock starts once it is open. */
export const begin = (s: Session, now: number, t: Timing): Session =>
  s.phase === "ready" ? { ...s, phase: "opening", why: null, dur: t.drawer, pSpent: 0, pSince: now } : s;

/** The clocks move the phase on: the drawer opens onto the first sum, the how-line gives way to the next, time runs out. */
export function tick(s: Session, now: number): Session {
  if (phaseRuns(s)) {
    const el = phaseMs(s, now);
    if (el < s.dur) return s;
    const at = now - (el - s.dur);
    return { ...s, phase: "play", since: at, shownAt: s.spent };
  }
  if (roundRuns(s) && roundMs(s, now) >= s.budget) return { ...s, phase: "over", spent: s.budget };
  return s;
}

/** Answers count only while a sum is up and its clock runs. */
export const canAnswer = (s: Session) => roundRuns(s);
/** The ms the sum on screen has been up: what an answer now is timed at. */
export const answerMs = (s: Session, now: number) => Math.max(0, Math.round(roundMs(s, now) - s.shownAt));

/** A right answer: the next sum, the clock never stops. */
export function right(s: Session, now: number): Session {
  if (!canAnswer(s)) return s;
  return { ...s, shownAt: roundMs(s, now), slips: 0 };
}

/** A wrong answer: the penalty comes off the clock, which holds while the how-line shows; out of time, the round ends. */
export function wrong(s: Session, now: number, t: Timing): Session {
  if (!canAnswer(s)) return s;
  const slips = s.slips + 1, budget = s.budget - penaltyMs(slips), spent = roundMs(s, now);
  if (spent >= budget) return { ...s, phase: "over", budget: Math.max(0, budget), spent: Math.max(0, budget), slips };
  return { ...s, phase: "lesson", budget, spent, slips, dur: t.lesson, pSpent: 0, pSince: now };
}

/** Stops every clock. A sheet outranks an away pause: coming back from another window doesn't close the sheet. */
export function pause(s: Session, now: number, why: Why): Session {
  if (running(s)) return { ...s, spent: roundMs(s, now), pSpent: phaseMs(s, now), why };
  if (s.why !== null && why === "sheet" && s.why !== "sheet") return { ...s, why };
  return s;
}

/** Starts the clocks again after a short breath, but only from the pause this action ends. */
export const resume = (s: Session, now: number, why: Why, breath: number): Session =>
  s.why !== null && s.why === why ? { ...s, why: null, since: now + breath, pSince: now + breath } : s;

/** A round someone has started and not finished. */
export const started = (s: Session) => s.phase !== "ready" && s.phase !== "over";

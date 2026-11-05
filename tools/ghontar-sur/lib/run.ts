// A level's play as a pure reducer. The component passes the clock in, so the tests replay every statechart
// path exactly. Every timed thing (the lead-in, the call, the pause after a slip, the cheer, the encore) is one phase
// clock that runs only while nothing pauses it, so nothing can happen behind a hidden tab, a blur, the menu or a sheet.
import { answerBell, beatMs, callMs, isFinaleDeal, onMs, roundCount, roundLen, type Deal } from "./deal";
import { clockMs } from "./tick.hot";

/**
 * ready: the title · lead: "শোনো", the quiet before the call · call: the bells ring the round's tune · answer: your turn ·
 * miss: the right bell is shown, then the call again · cheer: a round (or the level) is right · encore: a finale tune plays
 * through once · over: the end screen (won or lost).
 */
export type Phase = "ready" | "lead" | "call" | "answer" | "miss" | "cheer" | "encore" | "over";
/** Why play is paused: you went away (blur, a hidden tab, the player's menu), or a sheet is open (সব লেভেল). */
export type Why = "away" | "sheet";
export type Grade = "on" | "early" | "late";

export type Run = {
  phase: Phase; why: Why | null;
  /** `dur` ms the phase lasts (0: until you act), `spent` ms banked on its clock, `since` when it last started running. */
  dur: number; spent: number; since: number;
  round: number; at: number; hearts: number;
  /** The phase clock at your last right tap this turn (-1 before the first): the tal is the gap between taps. */
  lastAt: number;
  /** The last slip: the bell you needed, the bell you tapped, and which tap of the round it was. */
  expected: number; picked: number; missAt: number;
  /** The level is decided: won or lost (set with the cheer or the miss that ends it). */
  done: "won" | "lost" | null;
  roundMiss: boolean;
  // the stats the end screen counts
  rounds: number; right: number; mistakes: number; graded: number; onBeat: number; streak: number; bestStreak: number; points: number; heard: number;
};
export type Timing = { lead: number; miss: number; cheer: number; breath: number; scale: number };

export const TIMING: Timing = { lead: 700, miss: 1600, cheer: 650, breath: 600, scale: 1 };
/** ধীরে খেলো: the call is half as slow again, the quiet around it longer. The tal you must keep is the call's own, so stars are earned the same way. */
export const SLOW_TIMING: Timing = { lead: 1050, miss: 2200, cheer: 1000, breath: 900, scale: 1.5 };

/** Your tal must land within this share of the call's gap (never under MIN_TOL ms). */
export const TOL_SHARE = 0.25;
export const MIN_TOL = 90;
export const POINTS_NOTE = 10;
export const POINTS_BEAT = 5;
export const POINTS_CLEAN = 20;

export const ready = (): Run => ({
  phase: "ready", why: null, dur: 0, spent: 0, since: 0, round: 0, at: 0, hearts: 3, lastAt: -1, expected: -1, picked: -1, missAt: -1,
  done: null, roundMiss: false, rounds: 0, right: 0, mistakes: 0, graded: 0, onBeat: 0, streak: 0, bestStreak: 0, points: 0, heard: 0,
});

/** The clock runs: a phase that counts or moves on, and nothing pausing it. */
export const running = (s: Run) => s.why === null && s.phase !== "ready" && s.phase !== "over";
export const elapsed = (s: Run, now: number) => clockMs(s.spent, s.since, running(s), now);
export const started = (s: Run) => s.phase !== "ready" && s.phase !== "over";
/** Your turn, and the clock is running: taps count. */
export const canTap = (s: Run) => s.phase === "answer" && running(s);
/** The bells are ringing by themselves (the call or an encore) and nothing pauses it. */
export const ringing = (s: Run) => (s.phase === "call" || s.phase === "encore") && running(s);

const enter = (s: Run, phase: Phase, dur: number, since: number, patch: Partial<Run> = {}): Run =>
  ({ ...s, ...patch, phase, dur, spent: 0, since, why: null });

const roundBeat = (deal: Deal, s: Run, t: Timing) => beatMs(deal, s.round, t.scale);
const encoreMs = (deal: Deal, t: Timing) => { const beat = beatMs(deal, deal.tune.ends.length - 1, t.scale); return callMs(deal, deal.tune.notes.length, beat) + 600; };

/** শুরু করো: the lead-in, then the first call. */
export const begin = (s: Run, deal: Deal, now: number, t: Timing): Run =>
  s.phase === "ready" ? enter({ ...ready() }, "lead", t.lead, now, { hearts: deal.spec.hearts }) : s;

/** The clock moves the phase on when its time is up, carrying any overshoot so nothing drifts. */
export function tick(s: Run, deal: Deal, now: number, t: Timing): Run {
  if (!running(s) || !s.dur) return s;
  const el = elapsed(s, now);
  if (el < s.dur) return s;
  const at = now - (el - s.dur);
  switch (s.phase) {
    case "lead": return enter(s, "call", callMs(deal, roundLen(deal, s.round), roundBeat(deal, s, t)), at, { heard: s.heard + 1, at: 0 });
    case "call": return enter(s, "answer", 0, at, { at: 0, lastAt: -1 });
    case "miss": return s.done === "lost" ? enter(s, "over", 0, at) : enter(s, "lead", t.lead, at, { at: 0 });
    case "cheer":
      if (s.done === "won") return isFinaleDeal(deal) ? enter(s, "encore", encoreMs(deal, t), at) : enter(s, "over", 0, at);
      return enter(s, "lead", t.lead, at, { round: s.round + 1, at: 0, roundMiss: false });
    case "encore": return enter(s, "over", 0, at);
    default: return s;
  }
}

export type TapKind = "ignored" | "right" | "round" | "won" | "miss" | "lost";
export type TapResult = { run: Run; kind: TapKind; grade: Grade | null };

/** One tap on a bell. Counts only on your turn with the clock running; the bell you need comes from the tune. */
export function tap(s: Run, deal: Deal, bell: number, now: number, t: Timing): TapResult {
  if (!canTap(s) || !Number.isInteger(bell) || bell < 0 || bell >= deal.spec.bells) return { run: s, kind: "ignored", grade: null };
  const want = answerBell(deal, s.round, s.at), el = elapsed(s, now);
  if (bell !== want) {
    const hearts = s.hearts - 1, done = hearts <= 0 ? "lost" as const : null;
    const next = enter(s, "miss", t.miss, now, { hearts, done, expected: want, picked: bell, missAt: s.at, mistakes: s.mistakes + 1, streak: 0, roundMiss: true, at: 0 });
    return { run: next, kind: done ? "lost" : "miss", grade: null };
  }
  let grade: Grade | null = null, graded = s.graded, onBeat = s.onBeat;
  if (deal.spec.rhythm && s.at > 0 && s.lastAt >= 0) {
    const expected = deal.tune.notes[s.at - 1].gap * roundBeat(deal, s, t), actual = el - s.lastAt;
    const tol = Math.max(MIN_TOL, TOL_SHARE * expected);
    grade = Math.abs(actual - expected) <= tol ? "on" : actual < expected ? "early" : "late";
    graded++;
    if (grade === "on") onBeat++;
  }
  const streak = s.streak + 1, len = roundLen(deal, s.round);
  const gained = POINTS_NOTE + (grade === "on" ? POINTS_BEAT : 0);
  const base = { right: s.right + 1, graded, onBeat, streak, bestStreak: Math.max(s.bestStreak, streak), points: s.points + gained, at: s.at + 1, lastAt: el };
  if (s.at + 1 < len) return { run: { ...s, ...base }, kind: "right", grade };
  const last = s.round === roundCount(deal) - 1;
  const done = last ? "won" as const : null;
  const next = enter(s, "cheer", t.cheer, now, { ...base, rounds: s.round + 1, done, points: base.points + (s.roundMiss ? 0 : POINTS_CLEAN) });
  return { run: next, kind: last ? "won" : "round", grade };
}

/** Skips the encore (a tap or Enter). */
export const skipEncore = (s: Run, now: number): Run => s.phase === "encore" && running(s) ? enter(s, "over", 0, now) : s;

/** Stops the clock. A sheet outranks an away pause: coming back from another window doesn't close the sheet. */
export function pause(s: Run, now: number, why: Why): Run {
  if (running(s)) return { ...s, spent: elapsed(s, now), why };
  if (s.why !== null && why === "sheet" && s.why !== "sheet") return { ...s, why };
  return s;
}

/**
 * Starts the clock again after a short breath, but only from the pause this action ends. A call you were away for starts
 * over from its lead-in (you didn't hear it), and so does an encore; every other phase carries on where it stopped.
 */
export function resume(s: Run, deal: Deal, now: number, why: Why, t: Timing): Run {
  if (s.why === null || s.why !== why) return s;
  const since = now + t.breath;
  if (s.phase === "lead" || s.phase === "call") return enter(s, "lead", t.lead, since, { at: 0 });
  if (s.phase === "encore") return enter(s, "encore", encoreMs(deal, t), since);
  return { ...s, why: null, since };
}

/** The ms a call's note `index` lights, for the component. */
export const noteOn = (deal: Deal, s: Run, t: Timing) => onMs(roundBeat(deal, s, t));
export const callBeat = roundBeat;

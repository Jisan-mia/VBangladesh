// The tracing rules, pure so tests can play them: a stroke fills as the finger moves along it in the right direction,
// it counts once most of it is covered, and nothing is ever "wrong". Three tries that go nowhere replay the stroke's
// animation and quietly widen the path; five clean strokes in a row narrow it a little again. Never announced.
// Nothing here finishes a stroke without a finger (or the keyboard's pen) following it, so the stars are honest.
import { starsFor } from "../../../shared/game-core";
import { levelOf } from "./levels";
import { strokesOf, type Pt, type Stroke } from "./strokes";

/** How far (in the 100-unit box) a finger may stray and still count: eased, normal, stepped up. Generous for little fingers. */
export const TOLERANCE = [16, 13, 11] as const;
export type Pace = 0 | 1 | 2;
/** How many 2-unit samples ahead a finger may land: enough for a quick swipe, too few to start from the wrong end. */
export const LOOKAHEAD = 10;
/** Share of a stroke that counts as done. */
export const DONE_AT = 0.85;
/** A try that covers fewer samples than this is a miss (a tap, a scribble elsewhere, the wrong way). */
export const MISS_UNDER = 3;
/** A finger that jumps farther than this between two events (in 100-unit box terms) teleported: the gap is not filled in, and a landing on the path counts only if the finger was already near it. */
export const TELEPORT = 24;
/** The most a teleport can add to a stroke, in 2-unit samples. */
export const JUMP_STEP = 3;
/** Events in a row near the stroke before progress is kept: lucky scattered touches are rolled back, a finger that follows keeps its ink. */
export const RUN_MIN = 3;
/** A short stroke (a few samples) needs a shorter run, so a quick little flick still counts. */
export const needRun = (stroke: Stroke) => Math.min(RUN_MIN, Math.max(1, Math.floor((stroke.samples.length - 1) / 3)));
export const EASE_AFTER = 3;
export const HARDEN_AFTER = 5;

export type Round = {
  level: number; letters: readonly string[]; index: number;
  stroke: number; reach: number; tryFrom: number;
  misses: number; clean: boolean; streak: number; pace: Pace; helps: number; letterDone: boolean;
  /** Finger moves that stayed near the stroke, and those that wandered off it (for honest stars). */
  on: number; off: number;
  /** Moves in a row that stayed near the stroke, and the reach when that run began: a run shorter than RUN_MIN is rolled back. */
  run: number; runFrom: number;
};
export type Event = "stroke" | "letter" | "help" | null;

export const newRound = (level: number, pace: Pace = 1): Round => ({
  level, letters: levelOf(level).letters, index: 0, stroke: 0, reach: 0, tryFrom: 0, misses: 0, clean: true, streak: 0, pace, helps: 0, letterDone: false, on: 0, off: 0, run: 0, runFrom: 0,
});

export const letterOf = (round: Round) => round.letters[round.index];
export const strokeOf = (round: Round): Stroke | undefined => strokesOf(letterOf(round))[round.stroke];
export const done = (round: Round) => round.index >= round.letters.length;
const tolOf = (round: Round) => TOLERANCE[round.pace];
const far = (a: Pt, b: Pt) => Math.hypot(a[0] - b[0], a[1] - b[1]);
const lastSample = (stroke: Stroke) => stroke.samples.length - 1;
export const fullAt = (stroke: Stroke) => Math.ceil(lastSample(stroke) * DONE_AT);
/** 0–1: how much of the current stroke is covered. */
export const progressOf = (round: Round) => { const stroke = strokeOf(round); return stroke ? round.reach / lastSample(stroke) : 0; };

/** True while the finger is near the current stroke anywhere along it: only then does its ink show. */
export function nearPath(round: Round, point: Pt) {
  const stroke = strokeOf(round);
  return !!stroke && !round.letterDone && stroke.samples.some(sample => far(sample, point) <= tolOf(round) * 1.15);
}

/** The sample nearest a finger at `point`, if it is close enough: progress only moves forward from `reach` and never jumps far ahead. */
export function advance(stroke: Stroke, reach: number, point: Pt, tolerance: number) {
  let best = reach, nearest = tolerance;
  for (let j = reach; j <= Math.min(lastSample(stroke), reach + LOOKAHEAD); j++) {
    const distance = far(stroke.samples[j], point);
    if (distance <= nearest) { nearest = distance; best = j; }
  }
  return best;
}

/** Counts the current stroke as written (a dot touched, a stroke covered, or Enter on the board for keyboard players). */
export function finishStroke(round: Round): [Round, Event] {
  const streak = round.clean ? round.streak + 1 : 0, harden = streak >= HARDEN_AFTER;
  const next = {
    ...round, stroke: round.stroke + 1, reach: 0, tryFrom: 0, misses: 0, clean: true, run: 0, runFrom: 0,
    streak: harden ? 0 : streak, pace: (harden ? Math.min(2, round.pace + 1) : round.pace) as Pace,
  };
  if (next.stroke >= strokesOf(letterOf(round)).length) return [{ ...next, stroke: next.stroke - 1, letterDone: true }, "letter"];
  return [next, "stroke"];
}

/** A finger touches down. A dot stroke counts on a touch near it. */
export function down(round: Round, point: Pt): [Round, Event] {
  const stroke = strokeOf(round);
  if (!stroke || round.letterDone || done(round)) return [round, null];
  if (stroke.dot) return far(stroke.samples[0], point) <= tolOf(round) * 1.3 ? finishStroke(round) : [{ ...round, tryFrom: round.reach }, null];
  return move({ ...round, tryFrom: round.reach }, point, point);
}

/** The finger moved from `from` to `to`; the gap is filled in 2-unit steps so a quick swipe still counts, a jump across the board does not. */
export function move(round: Round, from: Pt, to: Pt): [Round, Event] {
  const stroke = strokeOf(round);
  if (!stroke || stroke.dot || round.letterDone) return [round, null];
  const gap = far(from, to), jumped = gap > TELEPORT, steps = jumped ? 1 : Math.max(1, Math.ceil(gap / 2));
  let reach = round.reach;
  const lands = !jumped || nearPath(round, from);
  for (let i = 1; lands && i <= steps; i++) reach = advance(stroke, reach, jumped ? to : [from[0] + (to[0] - from[0]) * i / steps, from[1] + (to[1] - from[1]) * i / steps], tolOf(round));
  if (jumped) reach = Math.min(reach, round.reach + JUMP_STEP);
  const near = nearPath(round, to), run = near ? round.run + 1 : 0;
  let runFrom = round.run === 0 ? round.reach : round.runFrom;
  const need = needRun(stroke);
  if (!near && round.run > 0 && round.run < need) reach = round.runFrom; // a run that broke before it counted
  else if (run >= need) runFrom = reach;
  else if (reach >= fullAt(stroke)) reach = fullAt(stroke) - 1;
  const next = { ...round, reach, run, runFrom, on: round.on + (near ? 1 : 0), off: round.off + (near ? 0 : 1) };
  return reach >= fullAt(stroke) ? finishStroke(next) : [next, null];
}

/** The finger lifts. A try that went nowhere is a miss; the third in a row replays the stroke and widens the path. */
export function up(round: Round): [Round, Event] {
  const here = strokeOf(round);
  if (!here || round.letterDone) return [round, null];
  if (round.run > 0 && round.run < needRun(here)) round = { ...round, reach: round.runFrom };
  round = { ...round, run: 0 };
  if (round.reach - round.tryFrom >= MISS_UNDER) return [{ ...round, tryFrom: round.reach }, null];
  const misses = round.misses + 1;
  if (misses < EASE_AFTER) return [{ ...round, misses, clean: false, streak: 0 }, null];
  return [{ ...round, misses: 0, clean: false, streak: 0, pace: 0, helps: round.helps + 1 }, "help"];
}

/** On to the next letter (the child taps "পরের বর্ণ"); the pace carries over. */
export const nextLetter = (round: Round): Round => ({ ...round, index: round.index + 1, stroke: 0, reach: 0, tryFrom: 0, misses: 0, clean: true, letterDone: false, run: 0, runFrom: 0 });
/** Trace the same letter again from its first stroke. */
export const againLetter = (round: Round): Round => ({ ...round, stroke: 0, reach: 0, tryFrom: 0, misses: 0, clean: true, letterDone: false, run: 0, runFrom: 0 });

/** How much of the finger's travel stayed near the path (1 when nothing was drawn yet). */
export const accuracyOf = (round: Round) => round.on + round.off ? round.on / (round.on + round.off) : 1;

/**
 * Stars only record the round, and only real tracing earns them: 3 when the stroke animation came back at most once
 * and the finger stayed on the path three moves in four, 2 for up to three replays and half the moves, else 1.
 */
export const starsOf = (helps: number, accuracy = 1) => Math.min(starsFor(helps, 1, 3, true), accuracy >= 0.75 ? 3 : accuracy >= 0.5 ? 2 : 1);

// The tracing rules, pure so tests can play them: a stroke fills as the finger moves along it in the right direction,
// it counts once most of it is covered, and nothing is ever "wrong". Three tries that go nowhere replay the stroke's
// animation and quietly widen the path; five clean strokes in a row narrow it a little again. Never announced.
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
export const EASE_AFTER = 3;
export const HARDEN_AFTER = 5;

export type Round = {
  level: number; letters: readonly string[]; index: number;
  stroke: number; reach: number; tryFrom: number;
  misses: number; clean: boolean; streak: number; pace: Pace; helps: number; letterDone: boolean;
};
export type Event = "stroke" | "letter" | "help" | null;

export const newRound = (level: number, pace: Pace = 1): Round => ({
  level, letters: levelOf(level).letters, index: 0, stroke: 0, reach: 0, tryFrom: 0, misses: 0, clean: true, streak: 0, pace, helps: 0, letterDone: false,
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
    ...round, stroke: round.stroke + 1, reach: 0, tryFrom: 0, misses: 0, clean: true,
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

/** The finger moved from `from` to `to`; the gap is filled in 2-unit steps so a quick swipe still counts. */
export function move(round: Round, from: Pt, to: Pt): [Round, Event] {
  const stroke = strokeOf(round);
  if (!stroke || stroke.dot || round.letterDone) return [round, null];
  const steps = Math.max(1, Math.ceil(far(from, to) / 2));
  let reach = round.reach;
  for (let i = 1; i <= steps; i++) reach = advance(stroke, reach, [from[0] + (to[0] - from[0]) * i / steps, from[1] + (to[1] - from[1]) * i / steps], tolOf(round));
  const next = { ...round, reach };
  return reach >= fullAt(stroke) ? finishStroke(next) : [next, null];
}

/** The finger lifts. A try that went nowhere is a miss; the third in a row replays the stroke and widens the path. */
export function up(round: Round): [Round, Event] {
  if (!strokeOf(round) || round.letterDone) return [round, null];
  if (round.reach - round.tryFrom >= MISS_UNDER) return [{ ...round, tryFrom: round.reach }, null];
  const misses = round.misses + 1;
  if (misses < EASE_AFTER) return [{ ...round, misses, clean: false, streak: 0 }, null];
  return [{ ...round, misses: 0, clean: false, streak: 0, pace: 0, helps: round.helps + 1 }, "help"];
}

/** On to the next letter (the child taps "পরের বর্ণ"); the pace carries over. */
export const nextLetter = (round: Round): Round => ({ ...round, index: round.index + 1, stroke: 0, reach: 0, tryFrom: 0, misses: 0, clean: true, letterDone: false });
/** Trace the same letter again from its first stroke. */
export const againLetter = (round: Round): Round => ({ ...round, stroke: 0, reach: 0, tryFrom: 0, misses: 0, clean: true, letterDone: false });

/** Stars only record the round: 3 when the stroke animation had to come back at most once, 2 up to three times, else 1. */
export const starsOf = (helps: number) => starsFor(helps, 1, 3, true);

// One play of a level, as a pure reducer: what you found and when, wrong taps, hints, the run of finds in a row, and where
// the হারিকেন stands in the dark. The component feeds it taps in scene units and the clock in seconds.
import { HINT_SECONDS, WRONG_FOR, type Stage } from "./levels";
import { LAMP, hintCircle, nextHint, tapAt, type Puzzle, type Tap } from "./puzzle";
import { SCENE_H, SCENE_W } from "./shapes";

export type Round = {
  found: number[];
  /** The clock (seconds, without hint seconds) at each find, in the same order. */
  foundAt: number[];
  wrong: number;
  /** Differences a hint has circled, and those it has shown exactly (a second hint on the same one). */
  hinted: number[];
  exact: number[];
  /** Hint steps taken; each adds HINT_SECONDS to the time. */
  steps: number;
  streak: number;
  bestStreak: number;
  lamp: { x: number; y: number } | null;
};

export const newRound = (dark: boolean): Round => ({
  found: [], foundAt: [], wrong: 0, hinted: [], exact: [], steps: 0, streak: 0, bestStreak: 0,
  lamp: dark ? { x: SCENE_W / 2, y: SCENE_H / 2 } : null,
});

/** A tap at scene point (x, y) at `clock` seconds. In the dark, a tap outside the light moves the lamp there instead. */
export function tapRound(round: Round, puzzle: Puzzle, x: number, y: number, clock: number): { round: Round; outcome: Tap } {
  const outcome = tapAt(puzzle, round.found, x, y, round.lamp);
  switch (outcome.kind) {
    case "lamp": return { round: moveLamp(round, x, y), outcome };
    case "again": return { round, outcome };
    case "miss": return { round: { ...round, wrong: round.wrong + 1, streak: 0 }, outcome };
    case "found": {
      const streak = round.streak + 1;
      return {
        round: { ...round, found: [...round.found, outcome.index], foundAt: [...round.foundAt, clock], streak, bestStreak: Math.max(round.bestStreak, streak) },
        outcome,
      };
    }
  }
}

export const moveLamp = (round: Round, x: number, y: number): Round =>
  round.lamp ? { ...round, lamp: { x: Math.min(SCENE_W, Math.max(0, x)), y: Math.min(SCENE_H, Math.max(0, y)) } } : round;

/** A hint: the first on a difference circles the area around it and names its kind; the second shows its exact spot. */
export function hintRound(round: Round, puzzle: Puzzle): { round: Round; index: number; step: 1 | 2 } | null {
  const index = nextHint(puzzle, round.found, round.hinted);
  if (index < 0 || round.exact.includes(index)) return null;
  const second = round.hinted.includes(index);
  const next: Round = {
    ...round, steps: round.steps + 1, streak: 0,
    hinted: second ? round.hinted : [...round.hinted, index],
    exact: second ? [...round.exact, index] : round.exact,
    // In the dark, a hint carries the lamp to its circle (the first) or its spot (the second), so the hint can be seen
    // without the lamp giving away more than the hint does.
    lamp: round.lamp ? second
      ? { x: puzzle.diffs[index].region.x + puzzle.diffs[index].region.w / 2, y: puzzle.diffs[index].region.y + puzzle.diffs[index].region.h / 2 }
      : { x: hintCircle(puzzle, index).x, y: hintCircle(puzzle, index).y } : null,
  };
  return { round: next, index, step: second ? 2 : 1 };
}

/** Whether another hint can be taken (some difference left that isn't shown exactly). */
export const canHint = (round: Round, puzzle: Puzzle) => {
  const index = nextHint(puzzle, round.found, round.hinted);
  return index >= 0 && !round.exact.includes(index);
};

export const isDone = (round: Round, puzzle: Pick<Puzzle, "diffs">) => round.found.length === puzzle.diffs.length;

/** The time that earns stars: the clock plus the hint seconds. */
export const timeOf = (round: Pick<Round, "steps">, clock: number) => clock + round.steps * HINT_SECONDS;

/** ★★★ within the level's time and at most 2 wrong taps; ★★ within its second time and at most 5; else ★. */
export function starsOf(stage: Pick<Stage, "three" | "two">, time: number, wrong: number) {
  const byTime = time <= stage.three ? 3 : time <= stage.two ? 2 : 1;
  const byWrong = wrong <= WRONG_FOR.three ? 3 : wrong <= WRONG_FOR.two ? 2 : 1;
  return Math.min(byTime, byWrong);
}

/** What stood between this result and one more star: seconds over, and wrong taps over. Null at three stars. */
export function shortBy(stage: Pick<Stage, "three" | "two">, time: number, wrong: number) {
  const earned = starsOf(stage, time, wrong);
  if (earned === 3) return null;
  const par = earned === 1 ? stage.two : stage.three, limit = earned === 1 ? WRONG_FOR.two : WRONG_FOR.three;
  return { stars: earned + 1, seconds: Math.max(0, Math.ceil(time - par)), wrong: Math.max(0, wrong - limit) };
}

/** The difference that took longest to find after the one before it: its index and the seconds it took. */
export function slowest(round: Pick<Round, "found" | "foundAt">) {
  let index = -1, longest = -1;
  for (let at = 0; at < round.found.length; at++) {
    const took = round.foundAt[at] - (at ? round.foundAt[at - 1] : 0);
    if (took > longest) { longest = took; index = round.found[at]; }
  }
  return { index, seconds: Math.max(0, longest) };
}

/** True when the lamp's light reaches a point (always, in daylight). */
export const lit = (round: Pick<Round, "lamp">, x: number, y: number) => !round.lamp || Math.hypot(x - round.lamp.x, y - round.lamp.y) <= LAMP;

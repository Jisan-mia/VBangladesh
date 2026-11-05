// A round: one level's pots on the stove, one after another. Plain data; step.hot.ts advances it.
import { oldPots } from "./legacy";
import { averageOf, type Mode } from "./levels";
import { makePots, potScore, type Pot } from "./pot";

export type Phase = "waiting" | "rising" | "result" | "over";
export type Round = {
  seed: number;
  /** A level on the new ladder, or (old) a kitchen from before the rewrite. */
  level: number;
  mode: Mode;
  old: boolean;
  pots: Pot[];
  index: number;
  phase: Phase;
  /** The current pot's clock and its foam height (1 = the rim). */
  t: number;
  foam: number;
  /** Seconds the current result has shown. */
  wait: number;
  scores: number[];
  spills: boolean[];
  /** Pots scored so far. */
  scored: number;
  /** A pot boiled over while the foam was still rising on screen, or a lift was made. */
  lastLift: number;
};

/** How long a pot's result shows before the next pot is put on. */
export const RESULT_SECONDS = 1.1;
/** ধীরে খেলো runs the pot's clock at this speed and halves the ripples. */
export const SLOW = 0.6;

export function newRound(seed: number, level: number, mode: Mode = "n", old = false): Round {
  const pots = old ? oldPots(seed, level) : makePots(seed, level);
  return { seed, level, mode, old, pots, index: 0, phase: "waiting", t: 0, foam: 0, wait: 0, scores: pots.map(() => 0), spills: pots.map(() => false), scored: 0, lastLift: -1 };
}

/** Lights the stove under the waiting pot. */
export function startPot(round: Round) {
  if (round.phase !== "waiting") return false;
  round.phase = "rising"; round.t = 0; round.foam = 0;
  return true;
}

/** Takes the pot off the stove: it scores how close the foam got to the rim. */
export function liftPot(round: Round) {
  if (round.phase !== "rising") return false;
  round.scores[round.index] = potScore(round.foam);
  round.spills[round.index] = false;
  round.scored = round.index + 1;
  round.lastLift = round.scores[round.index];
  round.phase = "result"; round.wait = 0;
  return true;
}

export const potCount = (round: Round) => round.pots.length;
/** The level's average over the pots scored so far; old kitchens count every pot the same. */
export function averageOfRound(round: Round) {
  const scores = round.scores.slice(0, round.scored);
  if (round.old) return Math.round(scores.reduce((sum, score) => sum + score, 0) / (scores.length || 1));
  return averageOf(round.level, scores);
}
export const spillCount = (round: Round) => round.spills.slice(0, round.scored).filter(Boolean).length;

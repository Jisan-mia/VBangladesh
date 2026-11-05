// What a won level leaves behind, as a pure function: the stars, the counts for the end screen and the card.
import { BEST, levelOf } from "./levels";
import { starsOf, type Block } from "./rover";

export type Result = { level: number; stars: number; blocks: number; fewest: number; rocks: number; runs: number; repeat: boolean };

/** The result of winning level `n` with `plan` on the `runs`-th run. Stars depend on the plan's length only (ধীরে খেলো never changes them). */
export function resultOf(n: number, plan: Block[], runs: number): Result {
  const level = levelOf(n), best = BEST[level.n - 1];
  return { level: level.n, stars: starsOf(plan.length, best.blocks), blocks: plan.length, fewest: best.blocks, rocks: level.samples.length, runs, repeat: plan.some(block => block.times > 1) };
}

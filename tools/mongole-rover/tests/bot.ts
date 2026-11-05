// Headless players for the difficulty tests: a casual child who thinks out the path, mistaps now and then, and fixes the
// block that lit up; and a careless one who lays random arrows. Time is counted the way the game counts it (taps, then the run).
import { makeRng } from "../../../shared/game-core";
import { BEST, levelOf } from "../lib/levels";
import { LEAD_MS, MISS_BEAT_MS, STEP_MS, WIN_BEAT_MS } from "../lib/run.hot";
import { DIR_ORDER, MAX_BLOCKS, addBlock, repeatLast, removeBlock, runPlan, type Block, type Dir } from "../lib/rover";

export const TAP_MS = 700;

export type Play = { won: boolean; runs: number; seconds: number; plan: Block[] };

/** The tapped blocks that make up a plan: an arrow, then one আরেক বার tap for each extra step of a loop block. */
const taps = (plan: Block[]) => plan.flatMap(block => [block.dir as string, ...Array(block.times - 1).fill("repeat")]);

export function casual(levelNumber: number, seed: number, mistap = 0.05, maxRuns = 6): Play {
  const rng = makeRng(seed), level = levelOf(levelNumber), goal = BEST[levelNumber - 1].plan;
  const wanted = taps(goal);
  let plan: Block[] = [], seconds = 0, runs = 0;
  const type = (from: number) => {
    // Types the rest of the wanted taps, each with a chance of the wrong arrow.
    let at = from;
    while (at < wanted.length && plan.length < MAX_BLOCKS) {
      const tap = wanted[at];
      seconds += TAP_MS / 1000;
      if (tap === "repeat") { plan = repeatLast(plan); at++; continue; }
      const wrong = rng() < mistap;
      const dir = (wrong ? DIR_ORDER[Math.floor(rng() * 4)] : tap) as Dir;
      plan = addBlock(plan, dir);
      at++;
    }
  };
  type(0);
  while (runs < maxRuns) {
    seconds += TAP_MS / 1000;
    const run = runPlan(level, plan);
    runs++;
    seconds += (LEAD_MS + STEP_MS * Math.max(0, run.steps.length - 1) + (run.end === "win" ? WIN_BEAT_MS : MISS_BEAT_MS)) / 1000;
    if (run.end === "win") return { won: true, runs, seconds, plan };
    // Debug: find the first block that isn't what the path needs (the lit block, or one before it that only looked fine),
    // take it and everything after out, type the rest again.
    let keep = 0;
    while (keep < plan.length && keep < goal.length && plan[keep].dir === goal[keep].dir && plan[keep].times === goal[keep].times) keep++;
    if (run.failBlock !== null) keep = Math.min(keep, run.failBlock);
    seconds += (plan.length - keep) * TAP_MS / 1000;
    plan = plan.slice(0, keep);
    type(taps(goal.slice(0, keep)).length);
  }
  return { won: false, runs, seconds, plan };
}

/** Lays random arrows (1 to 8 of them) and presses চালাও, over and over, never learning. */
export function careless(levelNumber: number, seed: number, maxRuns = 6): Play {
  const rng = makeRng(seed), level = levelOf(levelNumber);
  let seconds = 0;
  for (let runs = 1; runs <= maxRuns; runs++) {
    let plan: Block[] = [];
    const length = 1 + Math.floor(rng() * 8);
    for (let i = 0; i < length; i++) plan = addBlock(plan, DIR_ORDER[Math.floor(rng() * 4)]);
    seconds += length * TAP_MS / 1000;
    if (runPlan(level, plan).end === "win") return { won: true, runs, seconds, plan };
  }
  return { won: false, runs: maxRuns, seconds, plan: [] };
}

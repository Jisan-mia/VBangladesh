// Headless players for the real sim: a thumb with a reaction time, a misjudged landing now and then, and no plan for mangoes.
// They see the river as it will be when their hop lands (reaction time ahead), but judge each platform's position with a little error.
import { makeRng } from "../../../shared/game-core";
import { floaterAt, makeRiver, target, COLS, DOWN, LEFT, RIGHT, UP, WATER, type Lane, type River } from "../lib/river";
import { createRun, type Run } from "../lib/run";
import { act, drain, stepRun } from "../lib/step.hot";

export const DT = 1 / 60;
export type Profile = { react: number; sigma: number; misread: number; margin: number };
export const CASUAL: Profile = { react: 0.3, sigma: 0.25, misread: 0.08, margin: -0.15 };
export const SHARP: Profile = { react: 0.18, sigma: 0.1, misread: 0.02, margin: -0.1 };

const safeAt = (river: River, row: number, x: number, t: number, margin: number) => {
  const lane = river.lanes[row];
  return lane.type !== WATER || (x >= 0.4 && x <= COLS - 0.4 && floaterAt(lane, x, t, margin) >= 0);
};
const SIDE = [LEFT, RIGHT, DOWN] as const;

/** What the thumb does next: hop up when the next row will hold, step aside when this spot is about to fail, else wait (0). */
function choose(run: Run, p: Profile, rng: () => number) {
  const river = run.river, lane: Lane = river.lanes[run.row], exec = run.t + p.react;
  const px = lane.type === WATER ? run.x + lane.dir * lane.speed * p.react : run.x;
  const noise = () => (rng() + rng() + rng() - 1.5) * 2 * p.sigma;
  const tryAction = (action: number) => {
    const land = target(river, run.row, px, action);
    return land !== null && safeAt(river, land[0], land[1] + noise(), exec, p.margin);
  };
  if (tryAction(UP) || rng() < p.misread) return UP;
  const urgent = lane.type === WATER && !safeAt(river, run.row, px + lane.dir * lane.speed * 0.8, exec + 0.8, p.margin);
  if (!urgent) return 0;
  for (const action of SIDE) if (tryAction(action)) return action;
  return UP;
}

/** One crossing, played by a profile from `seed`; returns the finished (or timed out) run. */
export function playRiver(river: River, profile: Profile, seed: number, mode = 1, limit = 150) {
  const run = createRun(river, mode), rng = makeRng(seed);
  let pending: { at: number; action: number } | null = null, nextLook = rng() * 0.3;
  while (!run.done && run.t < limit) {
    stepRun(run, DT); drain(run);
    if (pending && run.t >= pending.at) { act(run, pending.action); pending = null; }
    if (!pending && run.t >= nextLook && !run.falling && run.down === 0 && run.hop === 0) {
      const action = choose(run, profile, rng);
      nextLook = run.t + 0.1;
      if (action) pending = { at: run.t + profile.react, action };
    }
  }
  return run;
}

export const allRivers = (count: number) => Array.from({ length: count }, (_, index) => makeRiver(index + 1));

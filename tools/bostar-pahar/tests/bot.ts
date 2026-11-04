// A headless crane operator for tuning and fairness tests. It sees what a person sees: the swinging sack and where the
// top sack is. It lets go at the moment it judges the sack will be over the top, with a person's timing spread.
// Both follow the sway and the pontoon with their eyes; only the skilled one allows for the moment the sack is in the air,
// and it waits for a wild pile to calm down.
import { makeRng } from "../../../shared/game-core";
import type { Mode, Run } from "../lib/levels";
import { createRun, DROP_TIME, isDark, MIN_SWING, PONTOON_T, ROLL_T, SWAY_DAMP, swayOmega, type Game } from "../lib/rules";
import { stepGame, tap } from "../lib/step.hot";

export type Skill = {
  name: string;
  /** Seconds of watching a new swing before committing. */
  watch: number;
  /** Timing spread (seconds, one standard deviation) and how often a tap is rushed (three times the spread). */
  spread: number; rush: number;
  /** Allows for the sway and roll during the drop itself (a casual player aims at where the top is as they let go). */
  predicts: boolean;
  /** Waits while the pile's tension is above this share of the limit (1: never waits). */
  calm: number;
};
export const SKILLED: Skill = { name: "skilled", watch: 0.35, spread: 0.022, rush: 0.02, predicts: true, calm: 0.45 };
export const CASUAL: Skill = { name: "casual", watch: 0.5, spread: 0.045, rush: 0.06, predicts: false, calm: 0.8 };

const DT = 1 / 60, LOOK = 1 / 240, TAU = 2 * Math.PI;

/** Where the sack hangs `ahead` seconds from now. */
function swingAt(game: Game, ahead: number) {
  const roll = game.def.roll * Math.sin((TAU * (game.rollT + ahead)) / ROLL_T);
  return game.pivot + roll + game.swing.amp * Math.sin((TAU * (game.t + ahead)) / game.swing.period + game.swing.phase);
}
/** Where the top sack will be `ahead` seconds from now: a person tracks the sway and the pontoon's roll with their eyes. */
function topAt(game: Game, ahead: number) {
  let sway = game.n > 1 ? game.sway : 0, v = game.swayV;
  if (game.n > 1) {
    const w = swayOmega(game.n);
    for (let t = 0; t < ahead; t += LOOK) { v += (-w * w * sway - 2 * SWAY_DAMP * w * v) * LOOK; sway += v * LOOK; }
  }
  const truck = game.def.pontoon * Math.sin((TAU * (game.rollT + ahead)) / PONTOON_T);
  return truck + game.xs[game.n - 1] + sway;
}

export type Outcome = { game: Game; cleared: boolean; seconds: number };

/** Plays one round to the end (or 3 minutes). */
export function play(run: Run, skill: Skill): Outcome {
  const game = createRun(run), rng = makeRng((run.seed * 7919 + run.level * 31 + 17) >>> 0);
  const gauss = () => Math.sqrt(-2 * Math.log(1 - rng())) * Math.cos(TAU * rng());
  let plan = -1, waited = 0, hung = -1, steps = 0;
  while (game.phase !== "over" && steps++ < 60 * 180) {
    if (game.phase === "ready" || game.phase === "swing") {
      if (game.hung !== hung) { hung = game.hung; plan = -1; waited = 0; }
      if (plan < 0 && game.t >= skill.watch) {
        const strain = game.n > 1 ? Math.abs(game.xs[game.n - 1] - game.xs[0] + game.sway) / game.limit : 0;
        const hurry = game.def.clock > 0 && game.left < 6;
        if (strain > skill.calm && waited < 2.5 && !hurry) waited += DT;
        else {
          // The next moment the sack will be over the top (as this player judges it), then the person's own error.
          let best = -1, previous = NaN;
          for (let ahead = MIN_SWING; ahead < game.swing.period + MIN_SWING; ahead += LOOK) {
            const gap = swingAt(game, ahead) - topAt(game, ahead + (skill.predicts ? DROP_TIME : 0));
            if (!Number.isNaN(previous) && Math.sign(gap) !== Math.sign(previous)) { best = ahead; break; }
            previous = gap;
          }
          if (best > 0) {
            const spread = skill.spread * (isDark(game) ? 1.5 : 1) * (rng() < skill.rush ? 3 : 1);
            plan = game.t + Math.max(MIN_SWING - game.t, best + gauss() * spread);
          }
        }
      }
      if (plan >= 0 && game.t + 1e-9 >= plan) { tap(game); plan = -1; }
    }
    stepGame(game, DT);
    game.events = 0;
  }
  return { game, cleared: game.end === "clear", seconds: game.time };
}

export const runOf = (seed: number, level: number, mode: Mode = "n"): Run => ({ seed, kind: "level", level, mode });
export const percentile = (sorted: number[], p: number) => sorted[Math.min(sorted.length - 1, Math.floor(sorted.length * p))];

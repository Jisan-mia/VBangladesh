// Headless players for the difficulty tests. They steer the way a person holding ← and → does: they see their own feet a moment late,
// aim a little off, and now and then pick the wrong side of an obstacle.
import { makeRng } from "../../../shared/game-core";
import { centreAt, obstacleAt, safeOffset } from "../lib/field";
import { type Mode, type Run } from "../lib/levels";
import { createGame, PH_DONE, PH_FELL, PH_READY, SLOW_PACE, start, type Game } from "../lib/rules";
import { stepGame } from "../lib/step.hot";

export type Skill = {
  name: string;
  /** Seconds before the player notices where their own feet are. */
  lag: number;
  /** The aim wanders by up to this share of the ridge's half-width. */
  aim: number;
  /** Chance of taking the wrong side of an obstacle. */
  wrong: number;
  /** How far ahead (px) the player looks for the ridge's bend and the next obstacle. */
  look: number;
  /** Feet within this many px of the aim count as there. */
  dead: number;
};
export const SKILLED: Skill = { name: "skilled", lag: 0.12, aim: 0.1, wrong: 0, look: 26, dead: 2 };
export const CASUAL: Skill = { name: "casual", lag: 0.28, aim: 0.22, wrong: 0.12, look: 30, dead: 4 };

const DT = 1 / 60;
export const runOf = (seed: number, level: number, mode: Mode = "n"): Run => ({ seed, kind: "level", level, mode });
export const oldRun = (seed: number, level: number): Run => ({ seed, kind: "old", level, mode: "n" });

export type Outcome = { game: Game; seconds: number; cleared: boolean };

/** Plays one field with `choose` picking the held side each step (see the skills above for people). */
export function playWith(run: Run, choose: (game: Game, step: number) => number, pace = 1, limit = 400): Outcome {
  const game = createGame(run);
  start(game);
  let step = 0;
  while (game.phase !== PH_DONE && game.phase !== PH_FELL && game.clock < limit) {
    game.dir = choose(game, step++);
    stepGame(game, DT, pace);
    game.events = 0;
  }
  return { game, seconds: game.clock, cleared: game.phase === PH_DONE };
}

/** A person: sees the feet late, aims at the dry lane ahead (maybe the wrong one), wanders a little. */
export function person(skill: Skill, seed: number, run: Run) {
  const rng = makeRng(seed * 7 + 3), phase = rng() * 6, history: number[] = [], lagSteps = Math.round(skill.lag / DT);
  const wrong = new Map<number, boolean>();
  return (game: Game, step: number) => {
    history.push(game.x);
    const seen = history[Math.max(0, history.length - 1 - lagSteps)];
    const field = game.field, spec = game.spec;
    const ahead = game.d - game.spec.speed * skill.lag + skill.look;
    let offset = safeOffset(field, ahead, 26);
    const o = obstacleAt(field, ahead, 26);
    if (o && offset !== 0) {
      const index = field.obstacles.indexOf(o);
      if (!wrong.has(index)) wrong.set(index, rng() < skill.wrong);
      if (wrong.get(index)) offset = 0;
    }
    const wander = skill.aim * spec.half * Math.sin(phase + step * DT * 0.9);
    const want = centreAt(field, ahead) + offset + wander;
    // Let go a moment early: the feet keep sliding a little after a release (more in the rain).
    const error = want - (seen + game.vel * (skill.lag * 0.8 + (spec.rain ? 0.15 : 0.05)));
    return error > skill.dead ? 1 : error < -skill.dead ? -1 : 0;
  };
}

export const play = (run: Run, skill: Skill, pace = 1) => playWith(run, person(skill, run.seed, run), pace);
export const idle = (run: Run) => playWith(run, () => 0);
export const heldRight = (run: Run) => playWith(run, () => 1);
export const SLOW = SLOW_PACE;

export function percentile(sorted: number[], at: number) {
  return sorted.length ? sorted[Math.min(sorted.length - 1, Math.floor(sorted.length * at))] : null;
}
void PH_READY;

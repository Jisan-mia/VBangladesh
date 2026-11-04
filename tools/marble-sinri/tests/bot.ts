// A headless player for tuning. It plans each drop with the same probe the fairness rule uses, then plays it like a person:
// it reacts late, aims a little off, sometimes holds the wrong side for a moment, and dawdles now and then.
// It plays the real stepGame, so a rate asserted here is the rate a person of that skill would get.
import { makeRng } from "../../../shared/game-core";
import { bestDrop } from "../lib/gen";
import { DEFAULT_MODE, MODES } from "../lib/levels";
import { makeFloor } from "../lib/gen";
import { surfaceY, G, GAP, R, STEP } from "../lib/physics";
import { createGame, starsOf, HURT, type Game } from "../lib/game";
import { stepGame } from "../lib/step.hot";

/** reaction (s), aim error in the air (units), chance per drop of a wrong-side slip or a dawdle, and how long either lasts (s). */
export type Skill = { reaction: number; aim: number; slip: number; dawdle: number; lapse: number };
export const CASUAL: Skill = { reaction: 0.4, aim: 12, slip: 0.12, dawdle: 0.2, lapse: 0.7 };
export const SHARP: Skill = { reaction: 0.22, aim: 4, slip: 0.03, dawdle: 0.05, lapse: 0.3 };
export const PERFECT: Skill = { reaction: 0, aim: 0, slip: 0, dawdle: 0, lapse: 0 };

export function playBot(game: Game, skill: Skill, seed: number, limit = 60 * 120, hurts?: number[]) {
  const rng = makeRng(seed * 31 + 7);
  let planned = -2, decideAt = 0, dir = 0, cap = 999, aim = NaN, slipUntil = -1, slipDir = 0;
  for (let steps = 0; !game.over && steps < limit; steps++) {
    if (game.wait > 0) { planned = -2; stepGame(game, STEP, 0); continue; }
    const on = game.on;
    if (on >= 0 && on !== planned) {
      // Just landed (or came back): think for a reaction time, maybe dawdle, maybe start the wrong way.
      planned = on; dir = 0; aim = NaN;
      decideAt = game.t + skill.reaction + (rng() < skill.dawdle ? skill.lapse : 0);
      slipUntil = rng() < skill.slip ? decideAt + skill.lapse * 0.6 : -1;
      slipDir = rng() < 0.5 ? -1 : 1;
    }
    if (on >= 0 && game.t >= decideAt && Number.isNaN(aim)) {
      const a = game.rows[on], b = game.rows[on + 1];
      const plan = b ? bestDrop(a, b, game.x, game.vx, (GAP / game.speed) * 2, a.crackT) : null;
      if (plan) { dir = plan.dir; cap = plan.cap; aim = plan.aim + (rng() * 2 - 1) * skill.aim; }
      else { dir = a.x0 < 12 ? 1 : a.x1 > 348 ? -1 : game.x < (a.x0 + a.x1) / 2 ? -1 : 1; cap = 999; aim = game.x + dir * 60; }
    }
    let hold = 0;
    if (game.t < slipUntil) hold = slipDir;
    else if (on >= 0) hold = game.t >= decideAt && (cap >= 190 || game.vx * dir < cap) ? dir : 0;
    else if (!Number.isNaN(aim)) {
      // In the air: steer for the aim, judging the landing from the drop so far.
      const b = game.rows[planned + 1];
      const surface = b ? surfaceY(b, game.x) : game.y + GAP, drop = Math.max(0, surface - game.y - R);
      const left = (-game.vy + Math.sqrt(game.vy * game.vy + 2 * G * drop)) / G, ahead = game.x + game.vx * left;
      hold = Math.abs(aim - ahead) < 1.5 ? 0 : aim > ahead ? 1 : -1;
    }
    stepGame(game, STEP, hold);
    if (hurts && game.events & HURT) hurts[game.hurt] = (hurts[game.hurt] ?? 0) + 1;
  }
  return game;
}

/** Plays `seeds` runs of a floor; returns the share cleared, the share with three stars, and the mean seconds. */
export function rate(level: number, skill: Skill, seeds: number, chances: number = MODES[DEFAULT_MODE].chances, from = 1) {
  let cleared = 0, three = 0, time = 0;
  for (let seed = from; seed < from + seeds; seed++) {
    const rows = makeFloor(seed * 7919, level), game = playBot(createGame(seed, rows, rows.length - 1, chances), skill, seed);
    const stars = starsOf(game);
    if (stars) { cleared++; time += game.t; }
    if (stars === 3) three++;
  }
  return { cleared: cleared / seeds, three: three / seeds, time: cleared ? time / cleared : 0 };
}

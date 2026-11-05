// A headless player for tuning. It notices a bird flying in, takes a reaction time to move its thumb, and claps at the
// spot it will land on (its shadow), with some aim error. It plays the real stepGame and clap, so a rate asserted here is
// the rate a person of that skill would get.
import { makeRng } from "../../../shared/game-core";
import { createGame, gameStars, DUSK, FLYING, HOPPING, ON, SITTING, type Game } from "../lib/afternoon";
import { FIRST_PECK, HOP, TAPPABLE } from "../lib/field";
import { clap, stepGame } from "../lib/step.hot";

/**
 * reaction (s), aim error (units, a thumb on a phone), the fewest seconds between claps, how often it watches the most
 * urgent bird (else any it can see), and whether it aims at the middle of a flock rather than one bird in it.
 */
export type Skill = { reaction: number; aim: number; period: number; focus: number; flock: boolean };
export const CASUAL: Skill = { reaction: 0.75, aim: 18, period: 0.55, focus: 0.65, flock: false };
export const SHARP: Skill = { reaction: 0.45, aim: 8, period: 0.3, focus: 0.95, flock: true };
export const DT = 1 / 60;

export function playBot(game: Game, skill: Skill | "idle", seed: number, limit = 90) {
  const rng = makeRng(seed * 31 + 7);
  let next = 0, aimAt = -1, aimX = 0, aimY = 0, last = -1;
  while (game.over === ON && game.t < limit) {
    stepGame(game, DT);
    if (skill === "idle") continue;
    if (aimAt >= 0 && game.t >= aimAt) {
      clap(game, aimX + (rng() * 2 - 1) * skill.aim, aimY + (rng() * 2 - 1) * skill.aim * 0.8);
      aimAt = -1; next = game.t + Math.max(0, skill.period - skill.reaction);
      continue;
    }
    if (aimAt >= 0 || game.t < next) continue;
    // Watch the bird that will peck soonest among those it has noticed.
    let target = -1, soonest = Infinity;
    const urgent = rng() < skill.focus;
    for (let i = 0; i < game.n; i++) {
      const state = game.state[i];
      if (game.immune[i] > game.t) continue;
      // It notices a bird a moment after it sets off; in mist, only once its shadow shows on the paddy.
      if (state === FLYING && game.t - game.t0[i] < (game.row.fog ? game.fly[i] * 0.45 : 0.15)) continue;
      if (state !== FLYING && state !== SITTING && state !== HOPPING) continue;
      const peck = state === FLYING ? game.land[i] + FIRST_PECK : game.nextPeck[i];
      const score = urgent ? peck : -game.t0[i] - rng() * 3;
      if (score < soonest) { soonest = score; target = i; }
    }
    if (target < 0) continue;
    const state = game.state[target];
    let x = game.x[target], y = game.y[target];
    if (skill.flock && game.group[target] >= 0) {
      let sx = 0, sy = 0, count = 0;
      for (let i = 0; i < game.n; i++) {
        if (game.group[i] !== game.group[target] || (game.state[i] !== FLYING && game.state[i] !== SITTING)) continue;
        sx += game.x[i]; sy += game.y[i]; count++;
      }
      if (count) { x = sx / count; y = sy / count; }
    }
    const ready = state === FLYING ? game.t0[target] + game.fly[target] * TAPPABLE + 0.02 : state === HOPPING ? game.moveAt[target] + HOP * 0.6 : 0;
    // Following the same bird (a শালিক's hop, the boss's next spot) is quicker: the thumb is already there.
    aimX = x; aimY = y; aimAt = Math.max(game.t + skill.reaction * (target === last ? 0.65 : 1), ready);
    last = target;
  }
  return game;
}

/** Plays `seeds` afternoons of one ক্ষেত: the share cleared (one star or more), the share with three stars, the mean finish time. */
export function rate(level: number, skill: Skill | "idle", seeds: number, mode = 1) {
  let cleared = 0, three = 0, time = 0, grain = 0;
  for (let seed = 1; seed <= seeds; seed++) {
    const game = playBot(createGame(level, seed * 7919, mode), skill, seed);
    const stars = gameStars(game);
    if (stars > 0) { cleared++; time += game.t; }
    if (stars === 3) three++;
    grain += game.over === DUSK ? game.grain : 0;
  }
  return { cleared: cleared / seeds, three: three / seeds, time: cleared ? time / cleared : 0, grain: grain / seeds };
}

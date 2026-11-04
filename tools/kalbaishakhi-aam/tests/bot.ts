// A headless player for tuning: it reacts late, aims a little off, moves at a human thumb's speed and sometimes ignores
// a twig. It plays the real stepGame, so a rate asserted here is the rate a person of that skill would get.
import { makeRng } from "../../../shared/game-core";
import { createGame, starsOf, type Game } from "../lib/game";
import { makeStorm, type StormRef } from "../lib/gen";
import { isHazard, isMango, reachOf, CATCH, FALLING, WARN, W } from "../lib/physics";
import { stepGame } from "../lib/step.hot";

/** reaction (s), aim error (units), how much of the wind's push it misjudges, thumb speed (units/s), hazards it ignores, mangoes it never looks at. */
export type Skill = { reaction: number; aim: number; drift: number; speed: number; careless: number; distracted: number };
export const CASUAL: Skill = { reaction: 0.45, aim: 34, drift: 0.7, speed: 210, careless: 0.18, distracted: 0.16 };
export const SHARP: Skill = { reaction: 0.25, aim: 8, drift: 0.15, speed: 380, careless: 0.02, distracted: 0 };
export const DT = 1 / 60;

export function playBot(game: Game, skill: Skill, seed: number) {
  const rng = makeRng(seed * 7 + 3);
  // Each drop's misjudged landing: a fixed aim error, plus part of the wind's push read the wrong way.
  const error = new Float32Array(game.drops.length).map((_, index) => (rng() * 2 - 1) * skill.aim + (rng() * 2 - 1) * skill.drift * Math.abs(game.drops[index].drift));
  const careless = new Uint8Array(game.drops.length).map(() => (rng() < skill.careless ? 1 : 0));
  const ignored = new Uint8Array(game.drops.length).map(() => (rng() < skill.distracted ? 1 : 0));
  const warn = game.storm.dark ? 0 : WARN;
  let aim = W / 2;
  for (let steps = 0; !game.over && steps < 20_000; steps++) {
    const seen = game.t - skill.reaction;
    // The next mango it can still reach, as it saw the yard a reaction ago.
    for (let index = game.next; index < game.drops.length; index++) {
      const drop = game.drops[index];
      if (drop.tc > game.t + 4) break;
      if (drop.t0 - warn > seen || !isMango(drop.kind) || drop.state !== FALLING || ignored[index]) continue;
      if (Math.abs(drop.xc - game.basket) <= skill.speed * Math.max(0, drop.tc - game.t) + CATCH * 0.6) { aim = drop.xc + error[index]; break; }
    }
    // Step aside from a hazard it has seen coming down where it means to stand.
    for (let index = game.next; index < game.drops.length; index++) {
      const drop = game.drops[index];
      if (drop.tc > game.t + 0.8) break;
      if (drop.t0 - warn > seen || !isHazard(drop.kind) || careless[index]) continue;
      const reach = reachOf(drop.kind) + 6;
      if (Math.abs(drop.xc - aim) <= reach) aim = drop.xc + (aim < drop.xc ? -1 : 1) * (reach + 4);
      if (aim < 26) aim = drop.xc + reach + 4; else if (aim > W - 26) aim = drop.xc - reach - 4;
    }
    stepGame(game, DT, aim, skill.speed * DT);
  }
  return game;
}

/** Plays `seeds` storms of one number; returns how many were cleared (one star or more) and the average stars. */
export function rate(ref: StormRef, skill: Skill, seeds: number, hearts = 3, from = 1) {
  let cleared = 0, stars = 0;
  for (let seed = from; seed < from + seeds; seed++) {
    const game = playBot(createGame(makeStorm(seed * 7919, ref), hearts), skill, seed);
    const earned = starsOf(game);
    if (earned) cleared++;
    stars += earned;
  }
  return { cleared: cleared / seeds, stars: stars / seeds };
}

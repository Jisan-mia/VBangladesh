// A headless player for tuning. It notices a mosquito, takes a reaction time to move its thumb, and taps where it expects
// the mosquito to be, with some aim error. It can't see a ঝাপসা মশা while it is faded. It plays the real stepGame and swing,
// so a rate asserted here is the rate a person of that skill would get.
import { makeRng } from "../../../shared/game-core";
import { createGame, gameStars, FLY, ON, WON, type Game } from "../lib/game";
import { HEAD_X, HEAD_Y } from "../lib/room";
import { stepGame, swing } from "../lib/step.hot";

/**
 * reaction (s), aim error (units, a thumb on a phone), the fewest seconds between taps, the faintest ঝাপসা মশা it notices,
 * how far ahead it leads a moving target (0..1), and how often it watches the most urgent one (else any it can see).
 */
export type Skill = { reaction: number; aim: number; period: number; see: number; lead: number; focus: number };
export const CASUAL: Skill = { reaction: 0.45, aim: 20, period: 0.6, see: 0.55, lead: 0.5, focus: 0.6 };
export const SHARP: Skill = { reaction: 0.25, aim: 7, period: 0.28, see: 0.3, lead: 0.85, focus: 0.95 };
export const DT = 1 / 60;

export function playBot(game: Game, skill: Skill | "idle" | "camper", seed: number, limit = 120) {
  const rng = makeRng(seed * 31 + 7);
  let next = 0, aimAt = -1, aimX = 0, aimY = 0;
  while (game.over === ON && game.t < limit) {
    stepGame(game, DT);
    if (skill === "idle") continue;
    if (skill === "camper") { if (game.t >= next) { swing(game, HEAD_X, HEAD_Y); next = game.t + 0.25; } continue; }
    if (aimAt >= 0 && game.t >= aimAt) {
      swing(game, aimX + (rng() * 2 - 1) * skill.aim, aimY + (rng() * 2 - 1) * skill.aim);
      aimAt = -1; next = game.t + Math.max(0, skill.period - skill.reaction);
      continue;
    }
    if (aimAt >= 0 || game.t < next) continue;
    // Watch the one that will bite soonest among those it can see.
    let target = -1, soonest = Infinity;
    const urgent = rng() < skill.focus;
    for (let i = 0; i < game.n; i++) {
      if (game.state[i] !== FLY || game.t - game.at[i] < 0.25 || game.vis[i] < skill.see || game.immune[i] > game.t) continue;
      // Distracted: the newest it noticed, not the one about to bite.
      const score = urgent ? game.biteAt[i] : -game.at[i] - rng() * 3;
      if (score < soonest) { soonest = score; target = i; }
    }
    if (target < 0) continue;
    const vx = (game.x[target] - game.px[target]) / DT, vy = (game.y[target] - game.py[target]) / DT;
    aimX = game.x[target] + vx * skill.reaction * skill.lead; aimY = game.y[target] + vy * skill.reaction * skill.lead;
    aimAt = game.t + skill.reaction;
  }
  return game;
}

/** Plays `seeds` nights of one রাত; the share cleared (one star or more), the share with three stars, the mean clear time. */
export function rate(level: number, skill: Skill | "idle" | "camper", seeds: number, hearts = 3) {
  let cleared = 0, three = 0, time = 0;
  for (let seed = 1; seed <= seeds; seed++) {
    const game = playBot(createGame(level, seed * 7919, hearts), skill, seed);
    const stars = gameStars(game);
    if (game.over === WON) { cleared++; time += game.t; }
    if (stars === 3) three++;
  }
  return { cleared: cleared / seeds, three: three / seeds, time: cleared ? time / cleared : 0 };
}

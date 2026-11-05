// Headless pilots for tuning. Each one looks a little way ahead the way a person does: it tries a few presses (let go,
// a short hold, a long one, feathering), plays each forward on a copy of the real stepGame, and keeps the one that flies
// best. Reaction time is how long it must keep a choice before it can change it; noise is how sloppy its thumb is;
// carelessness is how often it simply guesses. A rate asserted with these is the rate a person of that skill would get.
import { makeRng } from "../../../shared/game-core";
import { makeCourse } from "../lib/course";
import { createGame, starsOf, type Game } from "../lib/flight";
import { G, STEP, padX } from "../lib/physics";
import { stepGame } from "../lib/step.hot";

export type Skill = {
  /** Seconds a choice is kept before the next. */ reaction: number;
  /** How far ahead it looks (s), and how sloppy its hold timing is (s). */ look: number; noise: number;
  /** How often it guesses instead of thinking, and how much it cares about candies. */ careless: number; greed: number;
};
export const CASUAL: Skill = { reaction: 0.32, look: 1.1, noise: 0.09, careless: 0.12, greed: 0.4 };
export const SHARP: Skill = { reaction: 0.2, look: 1.2, noise: 0.02, careless: 0, greed: 0.7 };

/** A plan: hold for `h` seconds, let go for `r`, then feather (hold while faster than 85 u/s). h = -1 feathers from the start. */
const PLANS: [number, number][] = [[-1, 0]];
for (const h of [0, 0.12, 0.25, 0.4, 0.6, 0.9, 1.4]) for (const r of [0.25, 0.6, 9]) PLANS.push([h, r]);

function copy(into: Game, from: Game) {
  const { taken, evKind, evX, evY, evN } = into;
  Object.assign(into, from);
  into.probe = false;
  taken.set(from.taken); into.taken = taken; into.evKind = evKind; into.evX = evX; into.evY = evY; into.evN = evN;
}

function judge(game: Game, from: Game, greed: number) {
  const pad = game.course.pad, centre = padX(pad, game.t) + (pad.x1 - pad.x0) / 2;
  if (game.landing) return 1e6 + (game.landing === 2 ? 5e5 : 0) - Math.abs(game.landX - (pad.x1 - pad.x0) / 2) * 100;
  if (game.crashes > from.crashes) return -1e6 + (game.t - from.t) * 1e4;
  const candies = (game.candies - from.candies) * 120 * greed, distance = centre - game.x;
  // How far it could still glide (height and speed over the landing place, at about 4.5 forward for 1 down).
  const reach = (game.y - pad.y + (game.v * game.v) / (2 * G) - 40) * 4.5;
  // Once the middle is in reach, come down on it (neither short nor long); until then, fly far and keep energy.
  if (distance > -40 && reach >= distance && distance < 900) return 5000 + candies - Math.abs(reach - distance) * 1.5 - Math.max(0, -distance) * 10;
  return game.x + (game.y + (game.v * game.v) / (2 * G)) * 4 + candies;
}

/** Plays one flight to its end and returns the game. */
export function fly(game: Game, skill: Skill, seed: number, watch?: (game: Game) => void) {
  const rng = makeRng(seed * 977 + 13), trial = createGame(game.course, game.pages), best = createGame(game.course, game.pages);
  game.probe = false;
  let plan: [number, number] = [0, 9], planAt = 0, hold = false, nextThink = 0;
  const holdOf = (g: Game, p: readonly [number, number], since: number) => (p[0] < 0 || since > p[0] + p[1] ? g.v > 85 : since < p[0]);
  for (let steps = 0; !game.over && steps < 60 * 120; steps++) {
    if (game.t >= nextThink && game.state === 0) {
      let choice: [number, number] = [0, 9], score = -Infinity;
      if (rng() < skill.careless) choice = PLANS[Math.floor(rng() * PLANS.length)];
      else for (const p of PLANS) {
        copy(trial, game);
        let since = 0;
        const horizon = skill.look + (Math.abs(trial.course.pad.x0 - trial.x) < 600 ? 0.8 : 0);
        for (let k = 0; k < horizon / STEP && !trial.over && trial.state === 0; k++) { stepGame(trial, holdOf(trial, p, since), STEP); since += STEP; }
        // Near the end, play the plan out to the landing; before that, a calm feathered moment, so a plan that only dooms
        // the plane just after the horizon still scores low.
        const centre = padX(trial.course.pad, trial.t) + (trial.course.pad.x1 - trial.course.pad.x0) / 2;
        if (centre - trial.x < 700) for (let k = 0; k < 6 / STEP && !trial.over && trial.state === 0; k++) { stepGame(trial, holdOf(trial, p, since), STEP); since += STEP; }
        else for (let k = 0; k < 1.2 / STEP && !trial.over && trial.state === 0; k++) stepGame(trial, trial.v > 85, STEP);
        const value = judge(trial, game, skill.greed);
        if (value > score) { score = value; choice = p; copy(best, trial); }
      }
      plan = choice[0] < 0 ? choice : [Math.max(0, choice[0] + (rng() * 2 - 1) * skill.noise), choice[1]];
      planAt = game.t; nextThink = game.t + skill.reaction;
    }
    hold = holdOf(game, plan, game.t - planAt);
    stepGame(game, hold, STEP);
    watch?.(game);
    if (game.state !== 0) nextThink = game.t;
  }
  return game;
}

/** Plays `seeds` flights of one level; returns the share landed (one star or more), the average stars and the share with ★★★. */
export function rate(level: number, skill: Skill, seeds: number, pages = 3, from = 1) {
  let cleared = 0, stars = 0, three = 0;
  for (let seed = from; seed < from + seeds; seed++) {
    const game = fly(createGame(makeCourse(seed * 7919, level), pages), skill, seed);
    const earned = starsOf(game);
    if (earned) cleared++;
    if (earned === 3) three++;
    stars += earned;
  }
  return { cleared: cleared / seeds, stars: stars / seeds, three: three / seeds };
}

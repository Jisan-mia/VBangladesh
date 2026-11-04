// Headless players for the fairness tests. They pick a pot the way a person would (sometimes not the easiest one),
// aim with a human's error, let the guide's snap catch them the way the page does, and miss power by a little.
import { makeRng } from "../../../shared/game-core";
import { packCentre, plansAll, plansAt, plansHere, smash, type Plan } from "../lib/aim";
import { angleTo, cloneGame, fire, nearestFree, levelStars, newLevel, placeStriker, settle, type Game, type Hand } from "../lib/game";
import { step } from "../lib/physics.hot";
import { SNAP } from "../lib/guide";

export type Skill = {
  /** Aim error (degrees, one standard deviation) and power error (share of the power). */
  aim: number;
  power: number;
  /** Chance of taking the second or third pot instead of the easiest. */
  wander: number;
  /** How many of the best pots it tries out in its head first (0: none). */
  think: number;
};

// Aim error is what is left after the page's damped pull (sideways finger moves turn the line at a third of the rate).
export const CASUAL: Skill = { aim: 1.2, power: 0.14, wander: 0.35, think: 0 };
export const CAREFUL: Skill = { aim: 0.6, power: 0.08, wander: 0.1, think: 4 };

const LIMIT = 60 * 25;

/** Steps a strike to rest; returns the seconds it took. */
export function roll(g: Game) {
  let frames = 0;
  while (g.world.moving && frames < LIMIT) { step(g.world); frames++; }
  return frames / 60;
}

/** How good a strike's outcome is, looking ahead on a copy. */
function worth(g: Game, plan: Plan) {
  const copy = cloneGame(g);
  placeStriker(copy, plan.u);
  if (fire(copy, plan.angle, plan.power) !== "ok") return -99;
  roll(copy);
  const before = copy.stats.pieces, fouls = copy.stats.fouls, blacks = copy.stats.blacks, queen = copy.queen;
  settle(copy);
  return (copy.stats.pieces - before) * 2 - (copy.stats.fouls - fouls) * 3 - (copy.stats.blacks - blacks) * 2
    + (copy.queen === "covered" && queen !== "covered" ? 3 : copy.queen === "pending" && queen === "board" ? 1 : 0) + (copy.cleared ? 10 : 0);
}

function gauss(rng: () => number) {
  const a = Math.max(1e-9, rng()), b = rng();
  return Math.sqrt(-2 * Math.log(a)) * Math.cos(2 * Math.PI * b);
}

/** The aim after the human error, caught by the page's snap when it lands near a pot line from that spot. */
function aimWithError(g: Game, plan: Plan, hand: Hand, skill: Skill, rng: () => number) {
  const off = (gauss(rng) * skill.aim * Math.PI) / 180, angle = plan.angle + off, window = (SNAP[hand] * Math.PI) / 180;
  if (!window) return angle;
  let best = angle, gap = window;
  for (const line of plansAt(g, plan.u, true, [])) {
    const d = Math.abs(line.angle - angle);
    if (d < gap) { gap = d; best = line.angle; }
  }
  return best;
}

/** Chooses and takes one strike. */
export function takeStrike(g: Game, hand: Hand, skill: Skill, rng: () => number) {
  let plan: Plan | null = null;
  if (g.spec?.pattern && g.strikes === 0) {
    const centre = packCentre(g);
    placeStriker(g, 0.5);
    plan = { u: 0.5, angle: angleTo(g, centre.x, centre.y), power: 1, target: -1, pocket: -1, bank: -1, via: -1, cut: 0, score: 0, least: 0, ceiling: 1 };
  } else {
    const plans = plansAll(g, 16);
    if (plans.length) {
      if (skill.think) {
        let bestWorth = -Infinity;
        for (const candidate of plans.slice(0, skill.think)) { const value = worth(g, candidate) + candidate.score; if (value > bestWorth) { bestWorth = value; plan = candidate; } }
      } else {
        const pick = rng() < skill.wander ? Math.min(plans.length - 1, 1 + Math.floor(rng() * 2)) : 0;
        plan = plans[pick];
      }
    } else plan = smash(g);
  }
  if (!plan) return false;
  placeStriker(g, plan.u);
  const angle = plan.pocket >= 0 ? aimWithError(g, plan, hand, skill, rng) : plan.angle + (gauss(rng) * skill.aim * Math.PI) / 180;
  const power = Math.min(1, Math.max(0.08, plan.power * (1 + gauss(rng) * skill.power)));
  if (fire(g, angle, power) !== "ok") { placeStriker(g, nearestFree(g, g.u)); if (fire(g, 0, 0.6) !== "ok") return false; }
  roll(g);
  settle(g);
  return true;
}

/** Plays a whole board; returns whether it cleared, the strikes used and the stars. */
export function playLevel(level: number, hand: Hand, skill: Skill, seed: number) {
  const g = newLevel(level, hand), rng = makeRng(seed);
  // The first strike of a board with a locked aim: a person who just pulls straight back and lets go takes it.
  if (g.spec?.aim && g.spec.lockAim && skill.wander > 0) {
    // The ghost finger shows a pull of the right length (the ring's suggested power).
    const angle = angleTo(g, g.spec.aim[0], g.spec.aim[1]), shown = plansHere(g)[0]?.power ?? 0.55;
    fire(g, angle, shown * (1 + gauss(rng) * skill.power));
    roll(g);
    settle(g);
  }
  let guard = 0;
  while (g.phase !== "over" && guard++ < 60) if (!takeStrike(g, hand, skill, rng)) break;
  return { cleared: g.cleared, strikes: g.strikes, stars: levelStars(g) };
}

/** Clear rate and mean stars over `runs` seeds. */
export function rate(level: number, hand: Hand, skill: Skill, runs: number, salt = 1) {
  let cleared = 0, stars = 0, strikes = 0;
  for (let k = 0; k < runs; k++) {
    const result = playLevel(level, hand, skill, salt * 7919 + k * 104729 + level);
    if (result.cleared) cleared++;
    stars += result.stars;
    strikes += result.strikes;
  }
  return { clear: cleared / runs, stars: stars / runs, strikes: strikes / runs };
}

// Headless players for the tests. They play the real match clock (createGame + stepGame at 60 steps a second) and act only
// on what the screen shows, after a human reaction time: the keeper's lean, the kicker's shoulders and foot, the flag.
// casual: a person on a bus with one thumb. Wide aim, ignores the keeper and the foot, sometimes dives before looking.
// strong: reads every tell 0.25 s after it shows, shoots for the corners, allows for the wind.
import { makeRng } from "../../../shared/game-core";
import { createGame, dive, footShown, keeperLean, leanShown, shoot, roundOf, Ev, Stage, type Game } from "../lib/game";
import { stepGame } from "../lib/step.hot";
import { drift, linkScore, starsOf, type Zone } from "../lib/rules";

export type Skill = "casual" | "strong";
const STEP = 1 / 60;

/** One whole match. Returns the link score, the stars and the game (for stats). */
export function playMatch(level: number, seed: number, skill: Skill, slow = false) {
  const g = createGame(level, seed, slow), rng = makeRng((seed ^ 0x5bd1e995) >>> 0);
  const noise = (size: number) => (rng() + rng() + rng() - 1.5) * size * 2;
  let plan = -1, shotAt = 0, x = 0, y = 0, power = 0, pickAt = -1, pickZone: Zone = 1, footChecked = false, steps = 0;
  const casual = skill === "casual";
  while (g.stage !== Stage.Over) {
    const key = g.count;
    if (g.stage === Stage.Aim && plan !== key) {
      // A fresh kick: decide when and where.
      plan = key;
      const side = rng() < (casual ? 0.2 : 0) ? 0 : rng() < 0.5 ? -1 : 1;
      x = side * (casual ? 0.62 : 0.82); y = rng() < 0.5 ? (casual ? 0.25 : 0.15) : (casual ? 0.65 : 0.8);
      power = casual ? 0.55 + rng() * 0.35 : 0.78 + noise(0.03);
      shotAt = casual ? 0.6 + rng() * 0.6 : g.data.keeper.tell ? 0.5 + 0.3 + 0.25 : 0.5;
    }
    if (g.stage === Stage.Aim && g.t >= shotAt) {
      let aimX = x;
      if (!casual) {
        // Read the keeper: shoot away from his lean (when he shows one).
        if (keeperLean(g) > 0.5) {
          const lean = g.plans.keeper[roundOf(g)].lean;
          aimX = lean < 0 ? 0.82 : lean > 0 ? -0.82 : x;
        }
        aimX -= drift(g.plans.keeper[roundOf(g)].wind, power) * 0.9;
      }
      shoot(g, { x: aimX + noise(casual ? 0.22 : 0.06), y: y + noise(casual ? 0.15 : 0.06), power, curve: 0 });
    }
    if ((g.stage === Stage.Ready || g.stage === Stage.Run) && plan !== key) {
      plan = key; footChecked = false;
      const early = casual && rng() < 0.25;
      pickAt = early ? 0.1 + rng() * 0.4 : -1;
      pickZone = early ? (Math.floor(rng() * 3) as Zone) : 1;
    }
    if (g.stage === Stage.Run) {
      const t = g.t, shoulders = g.plans.shots[roundOf(g)].lean;
      if (pickAt >= 0 && t >= pickAt * 1.6 && g.dive < 0) dive(g, pickZone);
      if (pickAt === -1 && leanShown(g) >= 0.6 && g.dive < 0) {
        // Seen the lean: react a beat later.
        pickAt = -2; shotAt = t + (casual ? 0.35 : 0.25);
        pickZone = casual && rng() < 0.3 ? (Math.floor(rng() * 3) as Zone) : ((shoulders + 1) as Zone);
      }
      if (pickAt === -2 && t >= shotAt && g.dive < 0) dive(g, pickZone);
      if (!casual && footShown(g) && !footChecked) { footChecked = true; shotAt = t + 0.25; }
      if (!casual && footChecked && t >= shotAt && g.data.shooter.honest < 1) dive(g, g.plans.shots[roundOf(g)].zone);
    }
    stepGame(g, STEP);
    g.events &= ~Ev.Land;
    if (++steps > 60 * 60 * 10) throw new Error("a match never ended");
  }
  const [us, them] = linkScore(level, g.tally);
  return { us, them, stars: starsOf(level, us, them), game: g as Game, seconds: g.played };
}

/** Clear rate and three-star rate over `runs` seeds. */
export function rate(level: number, skill: Skill, runs = 300, slow = false) {
  let wins = 0, three = 0;
  for (let seed = 1; seed <= runs; seed++) {
    const m = playMatch(level, seed * 7919, skill, slow);
    if (m.stars > 0) wins++;
    if (m.stars === 3) three++;
  }
  return { win: wins / runs, three: three / runs };
}

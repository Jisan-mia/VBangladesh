// A headless player for tuning and fairness tests. It sees what a person sees: the ring (when the shuttle will reach it),
// whether the ball is high or low, the shadow past the back line, the wind on the flags and where the rival stands. It
// swings with a human wobble, sometimes not at all, and picks its shot the way a casual or a sharp player would.
import { makeRng } from "../../../shared/game-core";
import { levelDef, type Mode } from "../lib/levels";
import { createMatch, press, release, windNow, DONE, DOWN, E_LAND, FLY, HIGH, SOFT, type Match } from "../lib/match";
import { DT } from "../lib/physics";
import { advance } from "../lib/step.hot";

export type Skill = {
  name: string;
  /** Mean and spread of the touch around the right moment (seconds). */
  bias: number; sigma: number;
  /** Chance of no swing at all. */
  skip: number;
  /** Chance to smash a high ball (from level 2), to drop (from level 3, more when the rival stands deep). */
  smash: number; drop: number;
  /** Reads the wind (no high shots with it behind), and leaves a ball landing out. */
  wind: number; leave: number;
  /** Plays every high ball as a smash, even on level 1. */
  smasher?: boolean;
};
export const SHARP: Skill = { name: "sharp", bias: 0.008, sigma: 0.045, skip: 0, smash: 0.7, drop: 0.5, wind: 0.95, leave: 0.9 };
export const STEADY: Skill = { name: "steady", bias: 0.015, sigma: 0.06, skip: 0.01, smash: 0.5, drop: 0.35, wind: 0.7, leave: 0.6 };
export const CASUAL: Skill = { name: "casual", bias: 0.03, sigma: 0.08, skip: 0.03, smash: 0.35, drop: 0.2, wind: 0.3, leave: 0.3 };
export const SMASHER: Skill = { name: "smasher", bias: 0.008, sigma: 0.045, skip: 0, smash: 1, drop: 0, wind: 0, leave: 0, smasher: true };

const gauss = (r: () => number) => Math.sqrt(-2 * Math.log(r() || 1e-9)) * Math.cos(2 * Math.PI * r());

/** The shot this player picks for the ball coming now. */
function choose(m: Match, skill: Skill, r: () => number) {
  const p = m.path, high = p.high, level = m.level, wind = windNow(m);
  if (skill.smasher) return high ? DOWN : HIGH;
  const tail = wind > 12 && r() < skill.wind, head = wind < -12 && r() < skill.wind;
  if (high && level >= 2 && r() < skill.smash * (tail ? 1.6 : 1)) return DOWN;
  const deep = m.rivalX > 282 || m.def.run < 200;
  if (level >= 3 && r() < skill.drop * (deep ? 1.6 : 0.6) && !head) return SOFT;
  if (tail && level >= 2) return high ? DOWN : SOFT;
  return HIGH;
}

/** Plays a whole match; returns it with the time of the first point you won. */
export function botMatch(level: number, seed: number, skill: Skill, mode: Mode = "n", slow = false) {
  const m = createMatch(seed, level, mode, slow), r = makeRng(seed * 7919 + 17);
  let planAt = -1, kind = HIGH, seen = -1, firstPoint = -1, steps = 0;
  const reasons = new Array<number>(16).fill(0), rallies: number[] = [];
  for (; m.phase !== DONE && steps < 60 * 60 * 20; steps++) {
    const p = m.path;
    if (m.phase === FLY && p.from === 1 && m.i === 0 && seen !== steps) {
      seen = steps; planAt = -1;
      const leave = p.out && r() < skill.leave;
      if (!leave && r() >= skill.skip && p.contactAt >= 0) {
        // A person reacts to what the ring shows: in fog it comes late, which widens the wobble.
        const wobble = skill.sigma * (m.def.fog ? 1.25 : 1);
        planAt = p.contactAt + Math.round((skill.bias + wobble * gauss(r)) / DT);
        kind = choose(m, skill, r);
      }
    }
    if (planAt >= 0 && m.phase === FLY && m.path.from === 1 && m.i >= planAt) {
      planAt = -1;
      if (press(m) === 1) release(m, kind);
    }
    const us = m.us, rally = m.rally;
    advance(m);
    for (let e = 0; e < m.evN; e++) if (m.evType[e] === E_LAND) { reasons[m.evA[e] * 8 + m.evB[e]]++; if (m.evA[e] === 0) rallies.push(rally); }
    m.evN = 0;
    if (m.us > us && firstPoint < 0) firstPoint = m.clock;
  }
  return { m, firstPoint, time: m.clock, reasons, rallies };
}

/** Taps every 0.12–0.3 s with any shot, never looking. */
export function mashMatch(level: number, seed: number) {
  const m = createMatch(seed, level), r = makeRng(seed);
  let next = 0;
  for (let steps = 0; m.phase !== DONE && steps < 60 * 60 * 20; steps++) {
    if (m.clock >= next) { next = m.clock + 0.12 + r() * 0.18; if (press(m) === 1) release(m, Math.floor(r() * 3)); }
    advance(m);
    m.evN = 0;
  }
  return m;
}

export const SEEDS = Array.from({ length: 40 }, (_, index) => index * 97 + 13);
export const median = (values: number[]) => [...values].sort((a, b) => a - b)[Math.floor(values.length / 2)];
export const rate = (values: boolean[]) => values.filter(Boolean).length / values.length;
export const defOf = levelDef;

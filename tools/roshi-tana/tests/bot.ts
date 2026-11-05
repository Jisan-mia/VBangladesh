// A headless player for tuning and fairness tests. It taps once per beat the way a person does: a little late on average,
// with a wobble, sometimes not at all. It sees what a person sees: the dashed ring of a rest (and sometimes taps it anyway),
// a quiet stretch (its timing drifts), and a tempo change (it is late for the first beats after it).
import { makeRng } from "../../../shared/game-core";
import type { Mode } from "../lib/levels";
import { beatTime, createMatch, kindOf, periodAt, tap, COUNT_IN, KIND, MAX_BEATS, QUIET, REST, type Match } from "../lib/match";
import { advance } from "../lib/step.hot";

export type Skill = {
  name: string;
  /** Average ms after the beat, and the spread of a tap around it. */
  mean: number; spread: number;
  /** Chance per beat of no tap at all, and of tapping a rest anyway. */
  skip: number; restSlip: number;
  /** × the spread during a quiet stretch. */
  quiet: number;
};
export const SHARP: Skill = { name: "sharp", mean: 25, spread: 35, skip: 0, restSlip: 0.03, quiet: 1.4 };
export const STEADY: Skill = { name: "steady", mean: 40, spread: 80, skip: 0.05, restSlip: 0.15, quiet: 1.6 };
export const SHAKY: Skill = { name: "shaky", mean: 60, spread: 120, skip: 0.1, restSlip: 0.3, quiet: 1.8 };

const gauss = (r: () => number) => Math.sqrt(-2 * Math.log(r() || 1e-9)) * Math.cos(2 * Math.PI * r());

/** The tap times (ms on the match clock) a person of this skill would make in a match with no pause. */
export function tapsFor(probe: Match, skill: Skill, seed: number) {
  const r = makeRng(seed * 7919 + 17), out: number[] = [];
  let lastPeriod = periodAt(probe, COUNT_IN), lateFor = 0, lag = 0;
  for (let k = COUNT_IN; k < COUNT_IN + MAX_BEATS + 5; k++) {
    const kind = kindOf(probe, k), period = periodAt(probe, k);
    // A tempo change: the next couple of taps come as if the old tempo still held.
    if (Math.abs(period - lastPeriod) > 1) { lag = lastPeriod - period; lateFor = 2; lastPeriod = period; }
    const drift = lateFor > 0 ? lag * (lateFor / 2) * 0.6 : 0;
    if (lateFor > 0) lateFor--;
    if ((kind & KIND) === REST) { if (r() < skill.restSlip) out.push(beatTime(probe, k) + skill.mean + skill.spread * gauss(r)); continue; }
    if (r() < skill.skip) continue;
    const spread = skill.spread * (kind & QUIET ? skill.quiet : 1) * (lateFor > 0 ? 1.5 : 1);
    out.push(beatTime(probe, k) + skill.mean + drift + spread * gauss(r));
  }
  return out.sort((a, b) => a - b);
}

/** Taps as fast as a thumb goes, with no regard for the drum. */
export function mash(probe: Match, seed: number, perSecond: number) {
  const r = makeRng(seed), out: number[] = [], end = beatTime(probe, COUNT_IN + MAX_BEATS + 5);
  for (let t = -300 + r() * 100; t < end; t += (1000 / perSecond) * (0.6 + 0.8 * r())) out.push(t);
  return out;
}

/** Steps the same pure rules the page uses at 60 frames a second, feeding tap times. */
export function play(level: number, seed: number, taps: number[], mode: Mode = "n", old = false, slow = false, frame = 1000 / 60) {
  const m = createMatch(seed, level, mode, old, slow);
  let next = 0;
  for (let t = -400; m.winner === null && t < 400_000; t += frame) {
    while (next < taps.length && taps[next] <= t) tap(m, 0, taps[next++]);
    advance(m, t);
  }
  return m;
}

/** One match for a skill on a level and seed. */
export function botMatch(level: number, seed: number, skill: Skill, mode: Mode = "n", slow = false) {
  const probe = createMatch(seed, level, mode, false, slow);
  return play(level, seed, tapsFor(probe, skill, seed), mode, false, slow);
}

/** ms from the start tap's count-in to the win. */
export const winTime = (m: Match) => beatTime(m, m.playFrom + m.beats);

export const SEEDS = Array.from({ length: 40 }, (_, index) => index * 97 + 13);
export const median = (values: number[]) => [...values].sort((a, b) => a - b)[Math.floor(values.length / 2)];
export const percentile = (values: number[], p: number) => [...values].sort((a, b) => a - b)[Math.min(values.length - 1, Math.floor(values.length * p))];

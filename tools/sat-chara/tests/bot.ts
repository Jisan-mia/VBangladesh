// Headless throwers for tuning and fairness tests. A person looks at the pile, aims at the bottom of the nearest standing
// piece, and picks an arc that clears what's in the way (a brick, the clothesline, মিঠু standing); then their hand adds an
// error. The casual thrower takes the flattest clear arc; the skilled one has learned which arc works best (it tries the
// clear arcs it knows and keeps the best), aims more steadily, throws sooner when টুনি is stacking, and times মিঠু's hop.
import { makeRng } from "../../../shared/game-core";
import { defOf, layoutOf } from "../lib/levels";
import { downCount, guardTop, idle, nextThrow, settled, step, throwBall, GUARD_HALF } from "../lib/physics.hot";
import { createWorld, powerOf, BALL_R, FLYING, G, GROUND, HAND_X, HAND_Y, LYING, SPEED_MAX, SPEED_MIN, STANDING, STONES, type Layout, type World } from "../lib/world";
import type { Hand } from "../lib/save";

export type Skill = {
  name: string;
  /** Hand error: one standard deviation of the angle (degrees) and the power (0–1). */
  sa: number; sp: number;
  /** Seconds spent aiming, and its spread. */
  think: number; spread: number;
  /** Clear arcs it tries (by experience) before picking one; 1 = the flattest. */
  tries: number;
  /** Error judging মিঠু's hop (seconds); Infinity = ignores him. */
  timing: number;
  /** Aims this much faster while টুনি is stacking. */
  hurry: number;
  /** Throws anywhere: any angle 0–60°, any power. */
  random?: boolean;
};

/** The hand error grows as the difficulty shows less of the path. */
const HAND_SCALE: Record<Hand, number> = { e: 0.7, n: 1, h: 1.45 };

export const RANDOM: Skill = { name: "random", sa: 0, sp: 0, think: 1.2, spread: 0.3, tries: 1, timing: Infinity, hurry: 1, random: true };
export const CASUAL: Skill = { name: "casual", sa: 2.6, sp: 0.07, think: 2.4, spread: 0.5, tries: 1, timing: 0.14, hurry: 1 };
export const SKILLED: Skill = { name: "skilled", sa: 1.2, sp: 0.035, think: 1.6, spread: 0.3, tries: 6, timing: 0.06, hurry: 0.5 };

const DEG = Math.PI / 180;
/** The room a person leaves over a brick, under the line and over মিঠু's head. */
const ROOM = 7;
/** A ball can pass close under the clothesline. */
const LINE_ROOM = 3;
const clone = (w: World): World => structuredClone(w);

/** The point a person aims at: just in front of the bottom of the nearest standing piece. */
function target(w: World) {
  let near = -1;
  for (let i = 0; i < STONES; i++) if (w.state[i] === STANDING && (near < 0 || w.x[i] - w.w[i] / 2 < w.x[near] - w.w[near] / 2)) near = i;
  if (near < 0) return null;
  let low = near;
  for (let i = 0; i < STONES; i++) if (w.state[i] === STANDING && Math.abs(w.x[i] - w.x[near]) < 30 && w.y[i] > w.y[low]) low = i;
  const bottom = w.y[low] + w.h[low] / 2, x = w.x[low] - w.w[low] / 2 - BALL_R * 0.7;
  // Rubble lying right where the ball would roll in: aim at the piece's face instead, from above it.
  for (let i = 0; i < STONES; i++) {
    if (w.state[i] !== LYING || Math.abs(w.x[i] - x) > w.w[i] / 2 + BALL_R * 2 || w.y[i] < bottom - 2 * w.h[low]) continue;
    return { x, y: w.y[low] - w.h[low] / 2, stone: low };
  }
  return { x, y: Math.min(w.y[low], bottom - BALL_R), stone: low };
}

type Arc = { angle: number; power: number; tGuard: number };

/** Every arc (1° apart) that reaches the aim point without meeting something on the way. */
function arcs(w: World, aim: { x: number; y: number; stone: number }): Arc[] {
  const dx = aim.x - HAND_X, dy = aim.y - HAND_Y, found: Arc[] = [];
  for (let deg = 0; deg <= 66; deg += 1) {
    const a = deg * DEG, cos = Math.cos(a), lift = dy + dx * Math.tan(a);
    if (lift <= 0) continue;
    const v = Math.sqrt((G * dx * dx) / (2 * cos * cos * lift));
    if (v < SPEED_MIN || v > SPEED_MAX) continue;
    const vx = v * cos, vy = -v * Math.sin(a), end = dx / vx;
    let clear = true, tGuard = -1;
    for (let t = 0.01; t < end && clear; t += 0.01) {
      const x = HAND_X + vx * t, y = HAND_Y + vy * t + 0.5 * G * t * t;
      if (x > aim.x - 6) break;
      if (y + BALL_R > GROUND + 0.5 && x < aim.x - 30) clear = false;
      for (let b = 0; b < w.blocks.length; b += 4) {
        if (x + BALL_R > w.blocks[b] && x - BALL_R < w.blocks[b + 2] && y + BALL_R + ROOM > w.blocks[b + 1] && x < aim.x - 14) clear = false;
      }
      if (w.hasLine && x > w.lineX0 && x < w.lineX1 && y - BALL_R < w.lineY + LINE_ROOM) clear = false;
      if (w.hasGuard && Math.abs(x - w.guardX) < GUARD_HALF + BALL_R) {
        if (y + BALL_R + ROOM > GROUND - w.guardTall) clear = false;
        if (tGuard < 0) tGuard = t;
      }
      for (let i = 0; i < STONES; i++) {
        if (i === aim.stone || w.state[i] === FLYING) continue;
        // Standing pieces of another pile, and the rubble of fallen ones (a person lobs over it).
        if (w.state[i] === LYING && x > aim.x - 10) continue;
        if (Math.abs(x - w.x[i]) < w.w[i] / 2 + BALL_R + 2 && Math.abs(y - w.y[i]) < w.h[i] / 2 + BALL_R + 2) clear = false;
      }
    }
    if (clear) found.push({ angle: a, power: powerOf(v), tGuard });
  }
  return found;
}

/** The first step at or after `from` whose ball would pass মিঠু while he stands, with `slack` steps either side. */
function safeRelease(w: World, from: number, tGuard: number, slack: number) {
  if (!w.hasGuard || tGuard < 0) return from;
  const base = GROUND - w.guardTall;
  for (let r = from; r < from + w.guardPeriod * 2; r++) {
    let ok = true;
    for (let k = -slack; k <= slack && ok; k++) if (guardTop(w, r + tGuard * 60 + k) < base - 2) ok = false;
    if (ok) return r;
  }
  return from;
}

function wait(w: World, steps: number) { for (let k = 0; k < steps; k++) idle(w); }
function fly(w: World) { while (!settled(w)) step(w); }

export type Outcome = { cleared: boolean; balls: number; first: number; seconds: number; caught: number; restacked: number };

/** One round of a level (or any layout) by a thrower, with its own seed for hand error. */
export function play(level: number | Layout, skill: Skill, seed: number, hand: Hand = "n"): Outcome {
  const w = createWorld(typeof level === "number" ? layoutOf(level) : level), rng = makeRng(seed);
  const gauss = () => Math.sqrt(-2 * Math.log(1 - rng())) * Math.cos(2 * Math.PI * rng());
  const scale = skill.random ? 1 : HAND_SCALE[hand];
  let first = 0, balls = 0;
  for (let ball = 0; ball < 3; ball++) {
    if (ball > 0) nextThrow(w);
    const stacking = w.hasRebuild && ball > 0;
    wait(w, Math.max(12, Math.round((skill.think * (stacking ? skill.hurry : 1) + gauss() * skill.spread) * 60)));
    let angle: number, power: number, release = w.clock;
    if (skill.random) {
      angle = rng() * 60 * DEG; power = 0.15 + rng() * 0.85;
    } else {
      const aim = target(w);
      const options = aim ? arcs(w, aim) : [];
      let pick: Arc = options[0] ?? { angle: 20 * DEG, power: 0.7, tGuard: -1 };
      if (skill.tries > 1 && options.length > 1) {
        let best = -1;
        for (let k = 0; k < Math.min(skill.tries, options.length); k++) {
          const option = options[Math.round((k * (options.length - 1)) / Math.max(1, Math.min(skill.tries, options.length) - 1))];
          const trial = clone(w);
          wait(trial, safeRelease(trial, trial.clock, option.tGuard, 6) - trial.clock);
          throwBall(trial, option.angle, option.power); fly(trial);
          if (downCount(trial) > best) { best = downCount(trial); pick = option; }
        }
      }
      if (Number.isFinite(skill.timing)) release = safeRelease(w, w.clock, pick.tGuard, 6) + Math.round(gauss() * skill.timing * 60);
      angle = pick.angle + gauss() * skill.sa * scale * DEG;
      power = pick.power + gauss() * skill.sp * scale;
    }
    wait(w, Math.max(0, release - w.clock));
    throwBall(w, angle, power);
    fly(w);
    balls = ball + 1;
    if (ball === 0) first = downCount(w);
    if (downCount(w) === STONES) return { cleared: true, balls, first, seconds: w.clock / 60, caught: w.caught, restacked: w.restacked };
  }
  return { cleared: false, balls, first, seconds: w.clock / 60, caught: w.caught, restacked: w.restacked };
}

export type Rates = { clear: number; three: number; twoPlus: number; median: number };

export function rates(level: number, skill: Skill, seeds: number, hand: Hand = "n"): Rates {
  let clear = 0, three = 0, twoPlus = 0;
  const times: number[] = [];
  for (let s = 1; s <= seeds; s++) {
    const out = play(level, skill, s * 7919 + level * 31 + 7, hand);
    if (!out.cleared) continue;
    clear++; times.push(out.seconds);
    if (out.balls === 1) three++;
    if (out.balls <= 2) twoPlus++;
  }
  times.sort((a, b) => a - b);
  return { clear: clear / seeds, three: three / seeds, twoPlus: twoPlus / seeds, median: times[Math.floor(times.length / 2)] ?? Infinity };
}

export const finaleOf = (world: number) => [5, 10, 15][world];
export const levelsOf = (world: number) => [1, 2, 3, 4, 5].map(k => world * 5 + k);
export const nameOf = (level: number) => defOf(level).name;
/** For tuning: the clear arcs a person sees at the start of a level. */
export function startArcs(level: number) {
  const w = createWorld(layoutOf(level)), aim = target(w);
  return aim ? arcs(w, aim).map(arc => `${Math.round(arc.angle / DEG)}°/${arc.power.toFixed(2)}`) : [];
}

// A headless player for tuning and fairness tests. It sees what a person sees: the dot swinging along the lean gauge (so it
// knows when the next edge comes), the pointers for what's about to land, and when lifting opens. It touches with a human
// wobble in its timing, sometimes skips a window, and lifts after a human pause when it is safe.
import { makeRng } from "../../../shared/game-core";
import { type Mode } from "../lib/levels";
import { advance } from "../lib/step.hot";
import {
  canLift, createTop, DT, lift, liftSafe, nudge, P_DONE, P_READY, P_SPIN, scoreOf, swayRate, throwTop, BRACE, MAX_TIME, type Top,
} from "../lib/top";

export type Skill = {
  name: string;
  /** Throw: mean and spread of power and of straightness (a pull; a winder lands on the same kind of numbers). */
  power: number; powerSd: number; straight: number; straightSd: number;
  /** Timing of a touch around the lean's edge (seconds): bias and spread. */
  bias: number; sigma: number;
  /** Starts touching once the wobble is above this. */
  trigger: number;
  /** Chance of skipping a window. */
  skip: number;
  /** Chance of timing a touch to land just before a knock (reads the pointers). */
  read: number;
  /** Lifts when the spin is below this and the wobble below `safe` (after `pause` seconds); 0 never lifts. */
  liftAt: number; safe: number; pause: number;
};
export const SHARP: Skill = { name: "sharp", power: 0.95, powerSd: 0.05, straight: 0.95, straightSd: 0.04, bias: 0.004, sigma: 0.022, trigger: 0.12, skip: 0.01, read: 0.9, liftAt: 0.3, safe: 0.45, pause: 0.25 };
export const STEADY: Skill = { name: "steady", power: 0.88, powerSd: 0.09, straight: 0.9, straightSd: 0.07, bias: 0.01, sigma: 0.04, trigger: 0.2, skip: 0.04, read: 0.6, liftAt: 0.25, safe: 0.4, pause: 0.3 };
export const CASUAL: Skill = { name: "casual", power: 0.78, powerSd: 0.14, straight: 0.82, straightSd: 0.1, bias: 0.02, sigma: 0.065, trigger: 0.28, skip: 0.1, read: 0.2, liftAt: 0.2, safe: 0.35, pause: 0.35 };
/** Throws like a casual player, then never touches the top. */
export const IDLE: Skill = { ...CASUAL, name: "idle", trigger: 9, liftAt: 0 };

const gauss = (r: () => number) => Math.sqrt(-2 * Math.log(r() || 1e-9)) * Math.cos(2 * Math.PI * r());
const clamp01 = (v: number) => Math.max(0, Math.min(1, v));

/** Seconds until the lean next reaches a green edge, and whether a green side exists at all (a slope hides one). */
function nextEdge(top: Top) {
  const rate = swayRate(top.omega), slope = top.def.slope;
  // sin(sway) = +1 at sway = π/2 (mod 2π), and -1 at 3π/2. With a slope only the downhill side reaches the green.
  const turn = 2 * Math.PI, up = ((Math.PI / 2 - top.sway) % turn + turn) % turn, down = ((3 * Math.PI / 2 - top.sway) % turn + turn) % turn;
  const target = slope > 0 ? up : Math.min(up, down);
  return (target < 0.02 ? target + (slope > 0 ? turn : Math.PI) : target) / rate;
}

/** Plays a whole spin; returns the Top (finished) and how long it ran. */
export function botSpin(level: number, seed: number, skill: Skill, mode: Mode = "n", slow = false) {
  const top = createTop(seed, level, mode, slow), rng = makeRng(seed * 7919 + 17);
  // The throw: a pull or a wind lands on {power, straight}.
  throwTop(top, clamp01(skill.power + skill.powerSd * gauss(rng)), clamp01(skill.straight + skill.straightSd * gauss(rng)));
  let tapAt = -1, liftSince = -1, steps = 0;
  const step = slow ? 0.8 : 1;
  for (; top.phase === P_SPIN && steps < 60 * 130; steps++) {
    if (tapAt < 0 && top.wobble > skill.trigger && rng() >= skill.skip) {
      let wait = nextEdge(top);
      if (rng() < skill.read && top.next < top.n) {
        // A knock is about to land: prefer the edge just before it.
        const due = top.at[top.next] - top.t;
        if (due > 0.05 && due < 1.1) {
          const rate = swayRate(top.omega), span = Math.PI;
          for (let w = wait; w < due + 0.5; w += span / rate) if (w <= due - 0.03 && w >= due - BRACE * step * 0.9) { wait = w; break; }
        }
      }
      tapAt = top.t + wait + (skill.bias + skill.sigma * gauss(rng)) * step;
    } else if (tapAt < 0 && top.wobble > skill.trigger) tapAt = top.t + 0.4;
    if (tapAt >= 0 && top.t >= tapAt) { tapAt = -1; nudge(top); }
    if (skill.liftAt > 0 && canLift(top) && top.omega < skill.liftAt && liftSafe(top) && top.wobble < skill.safe) {
      if (liftSince < 0) liftSince = top.t;
      if (top.t - liftSince >= skill.pause) lift(top);
    } else liftSince = -1;
    advance(top, DT * step);
    top.evN = 0;
  }
  // Let the fall or the palm play out.
  for (let i = 0; top.phase !== P_DONE && i < 400; i++) { advance(top, DT); top.evN = 0; }
  return { top, score: scoreOf(top), seconds: top.t };
}

/** Taps every 0.1–0.3 s, never looking, after a middling throw. */
export function mashSpin(level: number, seed: number) {
  const top = createTop(seed, level), rng = makeRng(seed);
  throwTop(top, 0.7, 0.8);
  let next = 0;
  for (let steps = 0; top.phase === P_SPIN && steps < 60 * MAX_TIME * 2; steps++) {
    if (top.t >= next) { next = top.t + 0.1 + rng() * 0.2; nudge(top); }
    advance(top, DT);
    top.evN = 0;
  }
  return { top, score: scoreOf(top) };
}

export const SEEDS = Array.from({ length: 60 }, (_, index) => index * 97 + 13);
export const median = (values: number[]) => [...values].sort((a, b) => a - b)[Math.floor(values.length / 2)];
export const rate = (values: boolean[]) => values.filter(Boolean).length / values.length;
export { P_READY };

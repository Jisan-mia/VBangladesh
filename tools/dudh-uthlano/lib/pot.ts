// One pot: its numbers from a seed, and the foam's height at any moment. Pure and allocation-free in potLevel/heatAt, so the
// per-step code can call them. Everything random comes from makeRng(seed), so a friend's link replays the same pots.
import { makeRng } from "../../../shared/game-core";
import { levelDef, worldOf, type World } from "./levels";

export type Vessel = "dekchi" | "patil" | "hari";
export type Stove = "gas" | "clay";
export type Pot = {
  vessel: Vessel;
  stove: Stove;
  /** The kitchen's art: 0 morning gas, 1 clay dusk, 2 night gas. */
  scene: 0 | 1 | 2;
  /** Seconds for the foam to reach the rim on the pot's clock, ignoring ripples. */
  seconds: number;
  /** >1: creeps first, then climbs fast near the top, the way milk does. */
  power: number;
  /** Ripple height as a share of the rim at full boil. */
  wobble: number; hz: number; phase: number;
  /** Seconds into the boil when the doorbell rings, or -1. Only a distraction: the milk doesn't care. */
  bell: number;
  /** The last pot of a finale: counts double. */
  boss: boolean;
  /** The fire's breathing (share of speed), its rate in Hz and phase. 0: steady. */
  fire: number; fireHz: number; firePhase: number;
  /** The flame leaps at this second (the foam surges for FLARE_DUR by `flareBoost` of a second per second), or -1. */
  flareAt: number; flareBoost: number;
  /** The second boil: the foam peaks at `peak`, falls to `low`, then climbs in `rise2` seconds. 0: none. */
  peak: number; low: number; rise2: number;
  /** Two big bubbles burst at these seconds, dropping the foam by the depths; -1: none. */
  popAt1: number; popAt2: number; popDepth1: number; popDepth2: number;
  /** A lid hides the foam. */
  lid: boolean;
  /** The lights are out. */
  dark: boolean;
  /** A small, fast pot. */
  quick: boolean;
};

export const FALL = 0.5, HOLD2 = 0.35, FLARE_DUR = 1.5, FLARE_TELL = 0.6, POP_TELL = 0.45, POP_DECAY = 0.22;
const TAU = Math.PI * 2;

export const calm = (vessel: Vessel, stove: Stove, scene: 0 | 1 | 2, seconds: number, power: number, wobble: number): Pot => ({
  vessel, stove, scene, seconds, power, wobble, hz: 1, phase: 0, bell: -1, boss: false,
  fire: 0, fireHz: 0.35, firePhase: 0, flareAt: -1, flareBoost: 0, peak: 0, low: 0, rise2: 1,
  popAt1: -1, popAt2: -1, popDepth1: 0, popDepth2: 0, lid: false, dark: false, quick: false,
});

const lerp = (pair: readonly [number, number], at: number) => pair[0] + (pair[1] - pair[0]) * at;

/** `count` distinct indices from `from` to `to - 1`, from the generator. */
function choose(rng: () => number, count: number, from: number, to: number) {
  const chosen = new Set<number>();
  while (chosen.size < Math.min(count, to - from)) chosen.add(from + Math.floor(rng() * (to - from)));
  return chosen;
}

/** A level's pots from a seed. Always the same number of draws per pot, so pot 4 never depends on what pot 2 rolled. */
export function makePots(seed: number, value: number): Pot[] {
  const L = levelDef(value), world: World = worldOf(value), n = L.pots;
  const rng = makeRng((seed ^ Math.imul(value, 0x9e3779b1)) >>> 0), sel = makeRng((seed ^ 0x5bd1e995 ^ Math.imul(value, 0x85ebca6b)) >>> 0);
  const bellAt = choose(sel, L.bells, 1, n), flareAt = choose(sel, L.flares, 1, n), popAt = choose(sel, L.pops, 1, n), quickAt = choose(sel, L.quick, 1, n);
  if (L.boss && L.flares > 0) flareAt.add(n - 1);
  if (L.boss && L.pops > 0) popAt.add(n - 1);
  const rings = Array.from({ length: n }, () => 0.5 + 0.3 * sel());
  return Array.from({ length: n }, (_, index) => {
    const time = rng(), curve = rng(), size = rng(), hz = rng(), phase = rng(), kind = rng(), fh = rng(), fp = rng(), fl = rng(), p1 = rng(), p2 = rng(), pd = rng();
    const at = n > 1 ? index / (n - 1) : 0, boss = L.boss !== null && index === n - 1, quick = quickAt.has(index);
    const vessel: Vessel = world.stove === "clay" ? "hari" : boss ? "dekchi" : quick ? "patil" : world.scene === 2 ? "dekchi" : index === 0 ? "dekchi" : kind < 0.4 ? "patil" : "dekchi";
    const base = quick ? 2.8 * (0.96 + 0.08 * time) : lerp(L.secs, at) * (0.94 + 0.12 * time);
    const pot = calm(vessel, world.stove, world.scene, base, quick ? 1.3 : lerp(L.power, at) + (curve - 0.5) * 0.1, lerp(L.wobble, at) * (0.85 + 0.3 * size) * (world.stove === "clay" ? 1.2 : 1));
    pot.hz = 0.7 + 0.5 * hz; pot.phase = phase * TAU;
    pot.boss = boss; pot.quick = quick; pot.dark = L.dark;
    if (bellAt.has(index)) pot.bell = rings[index] * pot.seconds;
    if (L.fire > 0) { pot.fire = L.fire; pot.fireHz = 0.3 + 0.15 * fh; pot.firePhase = fp * TAU; }
    if (L.lidFrom >= 0 && index >= L.lidFrom) pot.lid = true;
    if (flareAt.has(index)) { pot.flareAt = pot.seconds * (0.25 + 0.15 * fl); pot.flareBoost = 0.4; }
    if (boss && L.boss!.second) { pot.peak = 0.72; pot.low = 0.38; pot.rise2 = pot.seconds * 0.5; }
    if (popAt.has(index)) {
      pot.popAt1 = pot.seconds * (0.4 + 0.1 * p1); pot.popAt2 = pot.seconds * (0.58 + 0.1 * p2);
      pot.popDepth1 = 0.1 + 0.06 * pd; pot.popDepth2 = 0.1 + 0.06 * (1 - pd);
    }
    return pot;
  });
}

/** The pot's clock after the fire's breathing and a flare have sped it up or slowed it down. */
export function warp(pot: Pot, t: number) {
  let tau = t;
  if (pot.fire > 0) tau += pot.fire / (TAU * pot.fireHz) * (Math.cos(pot.firePhase) - Math.cos(TAU * pot.fireHz * t + pot.firePhase));
  if (pot.flareAt >= 0 && t > pot.flareAt) tau += pot.flareBoost * Math.min(FLARE_DUR, t - pot.flareAt);
  return tau;
}

/** How hard the flame burns now, 0.4–1.6 (1 steady): the fire's breathing, and the leap of a flare. The flame's height reads it. */
export function heatAt(pot: Pot, t: number) {
  let rate = 1;
  if (pot.fire > 0) rate += pot.fire * Math.sin(TAU * pot.fireHz * t + pot.firePhase);
  if (pot.flareAt >= 0 && t > pot.flareAt && t < pot.flareAt + FLARE_DUR) rate += pot.flareBoost;
  return rate;
}

/** 0..1: how far into the warning the flame's leap is (0 before the tell, 1 when the surge starts). */
export const flareTell = (pot: Pot, t: number) => pot.flareAt < 0 || t >= pot.flareAt ? 0 : Math.max(0, 1 - (pot.flareAt - t) / FLARE_TELL);
/** 0..1: how big the bubble about to burst has swollen; 0 outside its warning. */
export function popSwell(pot: Pot, t: number) {
  if (pot.popAt1 >= 0 && t < pot.popAt1 && t > pot.popAt1 - POP_TELL) return 1 - (pot.popAt1 - t) / POP_TELL;
  if (pot.popAt2 >= 0 && t < pot.popAt2 && t > pot.popAt2 - POP_TELL) return 1 - (pot.popAt2 - t) / POP_TELL;
  return 0;
}
/** True once the second boil's collapse has started on this clock. */
export const collapsed = (pot: Pot, t: number) => pot.peak > 0 && warp(pot, t) >= pot.seconds * Math.pow(pot.peak, 1 / pot.power);

/** How high the foam is (1 = the rim) after `t` seconds on the pot's clock. `ripple` scales the ripples (0.5 in slow mode, 1.2 on কঠিন). */
export function potLevel(pot: Pot, t: number, ripple: number) {
  if (t <= 0) return 0;
  const tau = warp(pot, t);
  if (pot.peak > 0) {
    const first = pot.seconds * Math.pow(pot.peak, 1 / pot.power);
    if (tau >= first) {
      const d = tau - first;
      if (d < FALL) { const k = d / FALL; return pot.peak + (pot.low - pot.peak) * k * k * (3 - 2 * k); }
      const e = d - FALL - HOLD2;
      return e <= 0 ? pot.low : pot.low + (1 - pot.low) * Math.pow(e / pot.rise2, 1.2);
    }
  }
  const base = Math.pow(tau / pot.seconds, pot.power);
  let level = base + pot.wobble * ripple * base * base * base * Math.sin(TAU * pot.hz * tau + pot.phase);
  if (pot.popAt1 >= 0 && t >= pot.popAt1) level -= pot.popDepth1 * Math.exp(-(t - pot.popAt1) / POP_DECAY);
  if (pot.popAt2 >= 0 && t >= pot.popAt2) level -= pot.popDepth2 * Math.exp(-(t - pot.popAt2) / POP_DECAY);
  return level < 0 ? 0 : level;
}

/** Percent of the rim, 0–99; reaching 100 is a spill. */
export const potScore = (level: number) => Math.max(0, Math.min(99, Math.floor(level * 100 + 1e-6)));

// One storm from a seed and a storm number: gusts, the fall schedule, the world's special moves (tree shakes, hail,
// sweeps, big branches), then the fairness passes. Old links get the old generator (legacy.ts) behind the same shape.
import { makeRng } from "../../../shared/game-core";
import { CLASSIC_STAGE, LEGACY_DURATION, legacyStage, makeLegacyStorm } from "./legacy";
import { LEVEL_COUNT, STAR_SHARE, levelOf } from "./levels";
import {
  clamp, isHazard, isMango, lerp, pathAt, place, pullReachable, reachOf, safePath, windAt,
  BIG, BRANCH, FALLING, GOLD, GREEN, HAIL, RIPE, S_CATCH, U_CATCH, W, type Drop, type Gust,
} from "./physics";

export type Storm = {
  seed: number;
  /** 1..12 for the new storms, 0 for an old link's storm. */
  level: number;
  /** The old storm's number (1..8) when level is 0. */
  stage: number;
  name: string; world: number; duration: number; steady: number; dark: boolean;
  drops: Drop[]; gusts: Gust[];
  /** When the whole tree shakes, and when a hail sweep starts and which way it goes (-1 from the right, 1 from the left). */
  shakes: number[]; sweeps: number[]; sweepDirs: number[];
  /** Mangoes in the storm, and how many catch each star (pass is 0 for the old storms: surviving was one star). */
  mangoes: number; pass: number; two: number; three: number;
};

export type StormRef = { level: number } | { stage: number };

/** Gold falls this much faster than its neighbours; hail and sweeps fall in this long. */
const GOLD_FALL = 0.72, HAIL_FALL = 1.15, SWEEP_FALL = 1.05, BIG_FALL = 2.3;

function targets(storm: Storm, shares: readonly number[]) {
  storm.mangoes = storm.drops.filter(drop => isMango(drop.kind)).length;
  storm.pass = Math.ceil(storm.mangoes * shares[0]);
  storm.two = Math.ceil(storm.mangoes * shares[1]);
  storm.three = Math.ceil(storm.mangoes * shares[2]);
  return storm;
}

export function makeLevelStorm(seed: number, number: number): Storm {
  const level = levelOf(number), duration = level.duration;
  const rng = makeRng((seed ^ Math.imul(number, 0x9e3779b1)) >>> 0);
  const gusts: Gust[] = [];
  if (level.gusts) for (let at = 3.5 + rng() * 2; at < duration - 3; at += level.gusts[0] + rng() * level.gusts[1])
    gusts.push({ at, length: 2.4 + rng() * 1.4, strength: (rng() < 0.5 ? -1 : 1) * (level.gust[0] + level.gust[1] * rng()), swing: level.swing });
  const steady = level.steady * (rng() < 0.5 ? -1 : 1);

  const drops: Drop[] = [];
  const add = (kind: number, t0: number, x: number, fall: number) => {
    const sway = kind === HAIL ? 0.25 : kind === BIG ? 0.5 : 1;
    const drop: Drop = { kind, t0, x0: x, drift: windAt(gusts, t0, steady) * 48 * fall * sway, fall, spin: (rng() - 0.5) * 6, tc: t0 + fall * U_CATCH, xc: 0, state: FALLING };
    place(drop, x + drop.drift * S_CATCH);
    if (drop.tc < duration - 0.15) drops.push(drop);
  };
  const mango = () => rng() < level.gold ? GOLD : rng() < level.ripe ? RIPE : GREEN;
  const fallAt = (t: number) => lerp(level.fall[0], level.fall[1], t / duration);

  for (let t = 0.6; t < duration;) {
    const p = t / duration;
    const fall = fallAt(t) * (0.92 + 0.16 * rng());
    const kind = t > level.twigFrom && rng() < lerp(level.twig[0], level.twig[1], p) ? BRANCH : mango();
    add(kind, t, W / 2 + (rng() * 2 - 1) * level.spread, kind === GOLD ? fall * GOLD_FALL : fall);
    t += lerp(level.gap[0], level.gap[1], p ** 0.85) * (0.8 + 0.4 * rng());
  }
  // Each gust shakes loose a small shower of three, close together.
  for (const gust of gusts) {
    const at = gust.at + gust.length * 0.45, x = 70 + rng() * 220;
    for (let index = 0; index < 3; index++) add(rng() < 0.5 ? RIPE : GREEN, at + index * 0.22, x + (rng() - 0.5) * 50, fallAt(at));
  }
  // The finale's ঝাঁকুনি: the whole tree shakes and five mangoes fall across one band.
  const shakes: number[] = [];
  for (let index = 0; index < level.shakes; index++) {
    const at = duration * (index + 1) / (level.shakes + 1) + (rng() - 0.5) * 2, x = 90 + rng() * 180;
    shakes.push(at);
    for (let drop = 0; drop < 5; drop++) add(drop === 2 ? RIPE : mango(), at + 0.6 + drop * 0.13, x + (drop - 2) * 30, fallAt(at) * 0.95);
  }
  // Hail volleys: four pellets spread over a stretch of the yard.
  for (let index = 0; index < level.hail; index++) {
    const at = 4 + rng() * (duration - 8), x = 60 + rng() * 240;
    for (let pellet = 0; pellet < 4; pellet++) add(HAIL, at + pellet * 0.16, x + (rng() - 0.5) * 150, HAIL_FALL);
  }
  // Sweeps: a row of hail from one side to the other. The fairness pass below leaves a gap where the mangoes lead you.
  const sweeps: number[] = [], sweepDirs: number[] = [];
  for (let index = 0; index < level.sweeps; index++) {
    const at = duration * (index + 0.7) / (level.sweeps + 0.6) + (rng() - 0.5), dir = rng() < 0.5 ? -1 : 1;
    sweeps.push(at); sweepDirs.push(dir);
    for (let pellet = 0; pellet < 9; pellet++) add(HAIL, at + pellet * 0.13, dir > 0 ? 34 + pellet * 36.5 : W - 34 - pellet * 36.5, SWEEP_FALL);
  }
  for (let index = 0; index < level.big; index++) add(BIG, 5 + rng() * (duration - 9), 60 + rng() * 240, BIG_FALL);

  drops.sort((a, b) => a.tc - b.tc);
  pullReachable(drops);
  // Fairness 2: a hazard never lands on the safe path or right beside a mango falling at the same moment; mirror it or drop it.
  const path = safePath(drops);
  const clear = (hazard: Drop) => Math.abs(pathAt(path, hazard.tc) - hazard.xc) >= reachOf(hazard.kind) + 10
    && drops.every(other => !isMango(other.kind) || Math.abs(other.tc - hazard.tc) >= 0.35 || Math.abs(other.xc - hazard.xc) >= reachOf(hazard.kind) + CATCH_GAP);
  const kept = drops.filter(drop => {
    if (!isHazard(drop.kind) || clear(drop)) return true;
    if (drop.kind === HAIL && level.sweeps) return false; // a sweep's gap stays a gap
    place(drop, W - drop.xc);
    return clear(drop);
  });
  return targets({
    seed, level: clamp(Math.round(number), 1, LEVEL_COUNT), stage: 0, name: level.name, world: level.world, duration, steady, dark: level.dark,
    drops: kept, gusts, shakes, sweeps, sweepDirs, mangoes: 0, pass: 0, two: 0, three: 0,
  }, STAR_SHARE);
}
/** A hazard must also keep this far (beyond its own reach) from a mango caught at the same moment. */
const CATCH_GAP = 44;

/** An old link's storm in the new shape: 45 seconds, the afternoon yard, surviving for a star. */
export function makeOldStorm(seed: number, stage = CLASSIC_STAGE): Storm {
  const old = makeLegacyStorm(seed, stage);
  return targets({
    seed, level: 0, stage: old.stage, name: legacyStage(old.stage).name, world: 0, duration: LEGACY_DURATION, steady: 0, dark: false,
    drops: old.drops, gusts: old.gusts, shakes: [], sweeps: [], sweepDirs: [], mangoes: 0, pass: 0, two: 0, three: 0,
  }, [0, 0.45, 0.7]);
}

export const makeStorm = (seed: number, ref: StormRef) => "level" in ref ? makeLevelStorm(seed, ref.level) : makeOldStorm(seed, ref.stage);

/** Lightning comes only with the strongest gusts and the shakes, one soft glow each: never more than once in several seconds. */
export function lightningTimes(storm: Storm) {
  const times = storm.gusts.filter(gust => Math.abs(gust.strength) > 0.78).map(gust => gust.at + 0.4);
  for (const at of storm.shakes) times.push(at - 0.4);
  if (storm.dark) for (let at = 5; at < storm.duration - 2; at += 7) times.push(at);
  times.sort((a, b) => a - b);
  return times.filter((at, index) => index === 0 || at - times[index - 1] >= 3);
}

/** The most and fewest points `count` mangoes from this storm can make. */
export function pointRange(storm: Storm, count: number) {
  const values = storm.drops.filter(drop => isMango(drop.kind)).map(drop => drop.kind === GOLD ? 25 : drop.kind === RIPE ? 10 : 5).sort((a, b) => a - b);
  if (count > values.length) return null;
  let low = 0, high = 0;
  for (let index = 0; index < count; index++) { low += values[index]; high += values[values.length - 1 - index]; }
  return { low, high };
}

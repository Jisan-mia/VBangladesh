// The eight storms of the game before the rewrite, kept bit for bit so every old challenge link replays exactly the storm
// it was played on (tests pin a fingerprint). Links without `w` open these: no `l` is the original storm, number 4.
import { makeRng } from "../../../shared/game-core";
import {
  lerp, pathAt, place, pullReachable, safePath, windAt, BRANCH, CATCH, FALLING, GREEN, RIPE, S_CATCH, U_CATCH, W, type Drop, type Gust,
} from "./physics";

export const LEGACY_DURATION = 45;
/** Storm 4 is the original game's storm, draw for draw. */
export const CLASSIC_STAGE = 4;

export type LegacyStage = { name: string; fall: [number, number]; gap: [number, number]; twigFrom: number; twig: [number, number]; gustGap: [number, number]; gust: [number, number] };
export const LEGACY_STAGES: readonly LegacyStage[] = [
  { name: "হালকা হাওয়া", fall: [3.0, 2.3], gap: [1.1, 0.7], twigFrom: Infinity, twig: [0, 0], gustGap: [9, 3], gust: [0.35, 0.25] },
  { name: "দমকা হাওয়া", fall: [2.8, 2.0], gap: [1.05, 0.6], twigFrom: 12, twig: [0.05, 0.1], gustGap: [8, 3], gust: [0.45, 0.35] },
  { name: "মেঘ ডাকছে", fall: [2.65, 1.75], gap: [1.0, 0.5], twigFrom: 9, twig: [0.08, 0.16], gustGap: [7, 3.5], gust: [0.5, 0.4] },
  { name: "কালবৈশাখী", fall: [2.5, 1.5], gap: [0.95, 0.42], twigFrom: 7, twig: [0.1, 0.22], gustGap: [6.5, 3.5], gust: [0.55, 0.45] },
  { name: "জোর ঝড়", fall: [2.35, 1.42], gap: [0.9, 0.4], twigFrom: 6, twig: [0.12, 0.24], gustGap: [6, 3], gust: [0.6, 0.4] },
  { name: "ডাল ভাঙছে", fall: [2.3, 1.4], gap: [0.9, 0.4], twigFrom: 5, twig: [0.16, 0.3], gustGap: [6, 3], gust: [0.6, 0.4] },
  { name: "উল্টো হাওয়া", fall: [2.2, 1.36], gap: [0.86, 0.38], twigFrom: 5, twig: [0.15, 0.27], gustGap: [5, 2.5], gust: [0.7, 0.3] },
  { name: "বোশেখের শেষ ঝড়", fall: [2.1, 1.3], gap: [0.8, 0.36], twigFrom: 4, twig: [0.18, 0.3], gustGap: [5, 2.5], gust: [0.75, 0.25] },
];
export const LEGACY_COUNT = LEGACY_STAGES.length;
export const legacyStage = (stage: number) => LEGACY_STAGES[Math.max(1, Math.min(LEGACY_COUNT, stage)) - 1];

/** The old generator, unchanged: gusts, then the fall schedule, then the two fairness passes. */
export function makeLegacyStorm(seed: number, stage = CLASSIC_STAGE) {
  const rng = makeRng(seed), level = legacyStage(stage), DURATION = LEGACY_DURATION;
  const gusts: Gust[] = [];
  for (let at = 6 + rng() * 3; at < DURATION - 4; at += level.gustGap[0] + rng() * level.gustGap[1])
    gusts.push({ at, length: 2.6 + rng() * 1.6, strength: (rng() < 0.5 ? -1 : 1) * (level.gust[0] + level.gust[1] * rng()) });

  const drops: Drop[] = [];
  const add = (kind: number, t0: number, x: number, fall: number) => {
    const drop: Drop = { kind, t0, x0: x, drift: windAt(gusts, t0) * 48 * fall, fall, spin: (rng() - 0.5) * 6, tc: t0 + fall * U_CATCH, xc: 0, state: FALLING };
    place(drop, x + drop.drift * S_CATCH);
    if (drop.tc < DURATION - 0.15) drops.push(drop);
  };
  for (let t = 0.9; t < DURATION;) {
    const p = t / DURATION;
    const fall = lerp(level.fall[0], level.fall[1], p) * (0.92 + 0.16 * rng());
    const kind = t > level.twigFrom && rng() < lerp(level.twig[0], level.twig[1], p) ? BRANCH : rng() < 0.32 ? RIPE : GREEN;
    add(kind, t, 50 + rng() * 260, fall);
    t += lerp(level.gap[0], level.gap[1], p ** 0.85) * (0.8 + 0.4 * rng());
  }
  for (const gust of gusts) {
    const at = gust.at + gust.length * 0.45, x = 70 + rng() * 220, fall = lerp(level.fall[0] - 0.2, level.fall[1] + 0.1, at / DURATION);
    for (let index = 0; index < 3; index++) add(rng() < 0.5 ? RIPE : GREEN, at + index * 0.22, x + (rng() - 0.5) * 50, fall);
  }
  drops.sort((a, b) => a.tc - b.tc);
  pullReachable(drops);
  const path = safePath(drops);
  const clear = (branch: Drop) => Math.abs(pathAt(path, branch.tc) - branch.xc) >= CATCH + 10
    && drops.every(other => other.kind === BRANCH || Math.abs(other.tc - branch.tc) >= 0.35 || Math.abs(other.xc - branch.xc) >= 2 * CATCH);
  const kept = drops.filter(drop => {
    if (drop.kind !== BRANCH || clear(drop)) return true;
    place(drop, W - drop.xc);
    return clear(drop);
  });
  return { seed, stage, drops: kept, gusts };
}

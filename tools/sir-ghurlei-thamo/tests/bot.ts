// Headless players for tuning and fairness tests, on the same eyes as lib/bot.ts. The casual one reacts 0.3–0.45 s late, sometimes
// holds a little into a warning, mistakes some harmless moments, and throws whenever it reaches a sleeper. The reckless one never lets go.
import { makeRng } from "../../../shared/game-core";
import { BACK, BLIND, createGame, makeClass, PEEK, type Game } from "../lib/class";
import { DT, looksSafe, scoreOf } from "../lib/bot";
import type { Mode } from "../lib/levels";
import { stepGame } from "../lib/step.hot";

export type Run = { tenths: number; catches: number; won: boolean; close: number; braved: number; throws: number };
const result = (g: Game): Run => ({ tenths: scoreOf(g), catches: g.catches, won: g.won, close: g.close, braved: g.braved, throws: g.throws });

export function casualRun(seed: number, level: number, mode: Mode = "n", skill = 0, lagBase = 0.3) {
  const r = makeRng(seed * 7919 + 101 + skill);
  const g = createGame(makeClass(seed, level, mode));
  const lag = Math.round((lagBase + r() * 0.15) / DT), seen = new Uint8Array(lag);
  // Per harmless moment, does this player trust it? Decided once per segment.
  let judged = -1, trusts = true, dare = 0, wasSafe = true, steps = 0, watcherLate = 0;
  stepGame(g, true, DT);
  while (g.phase !== "over" && steps++ < 60 * 600) {
    const k = g.klass, kind = k.kinds[g.seg];
    if (judged !== g.seg) {
      judged = g.seg;
      trusts = kind === PEEK || kind === BLIND ? r() < 0.5 : kind === BACK ? r() < 0.35 : true;
    }
    let safe = looksSafe(g);
    if (kind === PEEK || kind === BLIND) safe = safe && trusts;
    if (kind === BACK && trusts) safe = true;
    const slot = steps % lag;
    // A second pair of eyes splits attention: its warnings reach this player a few frames later still.
    const then = seen[slot] === 1 && !safe && k.wKinds.length > 0 && k.wKinds[g.wSeg] !== 0 && watcherLate-- > 0 ? 1 : seen[slot];
    if (safe || k.wKinds.length === 0 || k.wKinds[g.wSeg] === 0) watcherLate = Math.round(0.15 / DT);
    seen[slot] = safe ? 1 : 0;
    // Now and then they hold on a little past the moment they saw the warning.
    if (wasSafe && then === 0 && r() < 0.35) dare = 0.12 + r() * 0.18;
    wasSafe = then === 1;
    if (dare > 0) dare -= DT;
    const hold = !g.needRelease && (then === 1 || dare > 0);
    stepGame(g, hold, DT);
  }
  return result(g);
}

export function recklessRun(seed: number, level: number, mode: Mode = "n") {
  const g = createGame(makeClass(seed, level, mode));
  let steps = 0, up = false;
  while (g.phase !== "over" && steps++ < 60 * 600) { up = g.needRelease ? !up : false; stepGame(g, !up, DT); }
  return result(g);
}

export const SEEDS = Array.from({ length: 40 }, (_, index) => index * 7919 + 13);
export const median = (values: number[]) => [...values].sort((a, b) => a - b)[Math.floor(values.length / 2)];
export const rate = (values: boolean[]) => values.filter(Boolean).length / values.length;

// Headless players for tuning and fairness tests. The bot plays the way a thumb does: it steers by holding or letting go,
// aims a little off the gap's middle, notices a crow only a reaction time after its edge pointer appears, and sometimes
// misses one altogether. The solver is a beam search over hold/let go that proves a level can be flown without a pop.
import { makeRng } from "../../../shared/game-core";
import { BX, CEIL, cloneGame, createGame, END, FLY, FLYER, FLYING, GROUND, HIT, lowWire, OVER, PENDING, POP, racingLine, READY, speedOf, SPAWN, topWire, WARN, type Game } from "../lib/belun";
import type { Mode } from "../lib/levels";
import { stepGame } from "../lib/step.hot";

export type Skill = {
  name: string;
  /** Seconds between decisions, and how far ahead it looks at its own balloon. */
  period: number; lead: number;
  /** Seconds from a crow's edge pointer to the bot noticing it; the chance it never does. */
  notice: number; miss: number;
  /** How far off the gap's middle it aims (resampled every crossing), and its dead band. */
  aim: number; band: number;
  /** Seconds before a crow meets the balloon that it starts to move out of the way. */
  dodge: number;
  /** How unsure it is of its own balloon's height (units, each look), and how late it sees it (seconds): a person's eye and thumb. */
  jitter: number; lag: number;
};
export const SKILLED: Skill = { name: "skilled", period: 0.05, lead: 0.26, notice: 0.2, miss: 0.03, aim: 5, band: 3, dodge: 1.05, jitter: 1.5, lag: 0.1 };
export const CASUAL: Skill = { name: "casual", period: 0.11, lead: 0.14, notice: 0.3, miss: 0.3, aim: 14, band: 7, dodge: 0.95, jitter: 6, lag: 0.18 };

const DT = 1 / 60;
const BEAM = 140;
const LIMIT = 60 * 240;

export type Outcome = { won: boolean; time: number; lost: number; grazes: number; score: number; dodged: number; game: Game };

/** Plays one level. "idle" presses once to start, then never again; "holder" holds the whole time. */
export function play(seed: number, level: number, mode: Mode, skill: Skill | "idle" | "holder", slow = false, watch?: (game: Game, hold: boolean, target: number) => void): Outcome {
  const game = createGame(seed, level, mode);
  const rng = makeRng(seed * 13 + level * 101 + 7);
  const seen = new Float64Array(game.crows.length).fill(-1), ignored = new Uint8Array(game.crows.length), side = new Int8Array(game.crows.length);
  let hold = false, think = 0, aim = 0, aimFor = -1, steps = 0;
  const pastY = new Float64Array(64), pastV = new Float64Array(64);
  while (game.phase !== OVER && steps++ < LIMIT) {
    if (skill === "idle") hold = steps === 1;
    else if (skill === "holder") hold = game.phase === READY ? steps % 2 === 0 : true;
    else if (game.phase === READY) hold = !hold;
    else if (game.phase === FLY && (think -= DT) <= 0) {
      think = skill.period;
      if (aimFor !== game.next) { aimFor = game.next; aim = (rng() * 2 - 1) * skill.aim; }
      const v = speedOf(game), ahead = game.dist + BX + v * skill.lead;
      let target = racingLine(game, ahead) + aim;
      for (let i = 0; i < game.crows.length; i++) {
        const state = game.cState[i];
        // A crow called again after a spare balloon is a fresh look (and a fresh chance to miss it).
        if (state === PENDING) { seen[i] = -1; side[i] = 0; }
        if (state !== WARN && state !== FLYING) continue;
        if (seen[i] < 0) { seen[i] = game.time; ignored[i] = rng() < skill.miss ? 1 : 0; }
        if (ignored[i] || game.time - seen[i] < skill.notice) continue;
        const plan = game.crows[i];
        // A diver gives nothing away until it launches.
        if (state === WARN && plan.kind !== FLYER) continue;
        const rel = state === FLYING ? game.cX[i] - (game.dist + BX) : SPAWN - BX + v * game.cT[i];
        // A thumb moves late, once the crow is close, not while still threading a crossing.
        if (rel < -plan.r - HIT || rel / (v + plan.speed) > skill.dodge) continue;
        const cy = game.cTy[i], safe = HIT + plan.r + 16;
        // Pick a side once (the one towards the line, if there's room) and stick to it, the way a thumb commits.
        if (!side[i]) {
          const up = cy - safe, down = cy + safe, line = racingLine(game, game.dist + BX + v * rel / (v + plan.speed));
          side[i] = up < CEIL + HIT + 8 ? 1 : down > GROUND - HIT - 8 ? -1 : Math.abs(up - line) <= Math.abs(down - line) ? -1 : 1;
        }
        if (side[i] < 0 ? target > cy - safe : target < cy + safe) target = cy + side[i] * safe;
        // Never into a wire to miss a crow.
        const gate = game.gates[Math.min(game.gates.length - 1, game.next)], u = (ahead - gate.x) / gate.w;
        if (u > -1.2 && u < 1) {
          const cyGate = game.cy[Math.min(game.gates.length - 1, game.next)], uu = Math.max(-1, u);
          target = Math.max(topWire(gate, cyGate, uu) + HIT + 8, Math.min(lowWire(gate, cyGate, uu) - HIT - 8, target));
        }
      }
      const back = (steps - Math.round(skill.lag * 60) + 6400) % 64, seenY = steps > 30 ? pastY[back] : game.y, seenV = steps > 30 ? pastV[back] : game.vy;
      const err = seenY + (rng() * 2 - 1) * skill.jitter + seenV * skill.lead - target;
      hold = err > skill.band ? true : err < -skill.band ? false : hold;
      watch?.(game, hold, target);
    }
    stepGame(game, hold, DT, slow);
    game.evCount = 0;
    pastY[steps % 64] = game.y; pastV[steps % 64] = game.vy;
  }
  return { won: game.won, time: game.flyTime, lost: game.lost, grazes: game.grazes, score: game.score, dodged: game.crowsDodged, game };
}

/**
 * Fairness: a beam search over "hold or let go" every 6 steps, from the first press. Returns the most crossings any
 * flight passes without a pop, and the cleanest winning flight if one exists.
 */
export function solve(seed: number, level: number, mode: Mode): { best: number; won: Game | null } {
  const first = createGame(seed, level, mode);
  stepGame(first, true, DT, false);
  let frontier: Game[] = [first], best = 0;
  while (frontier.length) {
    const next = new Map<string, Game>();
    for (const state of frontier) for (const hold of [false, true]) {
      const game = cloneGame(state);
      for (let i = 0; i < 6 && game.phase === FLY; i++) { stepGame(game, hold, DT, false); game.evCount = 0; }
      if (game.phase === END || game.won) return { best: game.goal, won: game };
      if (game.phase === POP || game.phase === OVER) continue;
      best = Math.max(best, game.score);
      const key = `${Math.round(game.y / 2)}|${Math.round(game.vy / 20)}`;
      const held = next.get(key);
      if (!held || game.grazes < held.grazes) next.set(key, game);
    }
    const all = [...next.values()].sort((a, b) => a.y - b.y);
    frontier = all.length <= BEAM ? all : Array.from({ length: BEAM }, (_, i) => all[Math.floor(i * all.length / BEAM)]);
  }
  return { best, won: null };
}

export const percentile = (sorted: number[], p: number) => sorted[Math.min(sorted.length - 1, Math.floor(sorted.length * p))];

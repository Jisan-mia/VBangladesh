// Headless riders that play the pure ride the way a person would: they see only what a phone shows (and less at dusk),
// notice a thing only a reaction time after it appears, tap one lane at a time with a thumb's pause between taps, and
// sometimes pick the wrong lane or ignore a gate. tests/levels.test.ts tunes every route against them.
import { makeRng } from "../../../shared/game-core";
import { makeCourse, mudAt } from "../lib/course";
import { createGame, steer, AHEAD, RUNNING, WAITING, type Game } from "../lib/game";
import { laneX, BIKE_LEN, BIKE_W, DOG, DOG_V, LANES, LANE_W, LETTER, MUD_T, SPEC, SWITCH_T, VAN, WALK_COW, WALK_GOAT } from "../lib/geometry";
import { stepGame } from "../lib/step.hot";

export type Skill = {
  /** Seconds between something appearing and the thumb answering. */
  reaction: number;
  /** Chance a lane change goes to a wrong lane. */
  wrong: number;
  /** Chance a gate is simply missed. */
  skipGate: number;
  /** How far ahead the rider can see (the phone's road ahead), in units. */
  look: number;
  /** The shortest pause between two taps. */
  tapGap: number;
  /** Goes for letters lying on the road. */
  letters: boolean;
  /** Chance a thing is noticed late (the eyes were elsewhere), and how much later, in seconds. */
  lapse: number; lapseBy: number;
};
/** The phone shows at least this much road ahead of the front wheel. */
export const VIEW = 400;
export const CAREFUL: Skill = { reaction: 0, wrong: 0, skipGate: 0, look: Infinity, tapGap: 0, letters: true, lapse: 0, lapseBy: 0 };
export const SHARP: Skill = { reaction: 0.18, wrong: 0, skipGate: 0.02, look: VIEW, tapGap: 0.12, letters: true, lapse: 0.04, lapseBy: 0.3 };
export const CASUAL: Skill = { reaction: 0.3, wrong: 0.1, skipGate: 0.15, look: VIEW, tapGap: 0.24, letters: false, lapse: 0.18, lapseBy: 0.5 };
export const IDLE: Skill = { reaction: 0, wrong: 0, skipGate: 1, look: 0, tapGap: 99, letters: false, lapse: 0, lapseBy: 0 };

const DT = 1 / 60;

/** The lanes a thing at `x`, `w` wide, overlaps (with a hair of margin), as a bitmask. */
function lanesOf(x: number, w: number) {
  let mask = 0;
  for (let lane = 0; lane < LANES; lane++) if (Math.abs(laneX(lane) - x) < (w + BIKE_W) / 2 + 4) mask |= 1 << lane;
  return mask;
}

export function makeBot(skill: Skill, seed: number) {
  const rng = makeRng(seed * 7919 + 13);
  const seen = new Map<number, number>();
  const skipped = new Set<number>();
  const rolled = new Set<number>();
  let lastTap = -9, plan = -1;
  const danger = new Float64Array(LANES);

  return (game: Game) => {
    const t = game.t, d = game.d, back = d - BIKE_LEN, v = Math.max(1, game.v);
    const horizon = Math.min(skill.look, game.course.sight);
    const known = (key: number, visible: boolean) => {
      if (!visible) return false;
      if (!seen.has(key)) seen.set(key, t + (rng() < skill.lapse ? skill.lapseBy : 0));
      return t - seen.get(key)! >= skill.reaction;
    };
    danger.fill(Infinity);
    const mark = (mask: number, start: number, end: number) => {
      if (end < 0) return;
      for (let lane = 0; lane < LANES; lane++) if (mask & (1 << lane)) danger[lane] = Math.min(danger[lane], Math.max(0, start));
    };
    let letterLane = -1, letterAt = Infinity;
    for (let index = game.first; index < game.pieces.length; index++) {
      const piece = game.pieces[index];
      if (piece.y0 > d + 900) break;
      if (piece.state !== AHEAD) continue;
      const visible = piece.y - d <= horizon || (piece.kind === VAN && piece.moving === 1);
      if (!known(index, visible)) continue;
      if (piece.kind === LETTER) {
        const at = (piece.y - d) / v;
        if (at > 0 && at < letterAt) { letterAt = at; letterLane = piece.lane; }
        continue;
      }
      const closing = piece.kind === VAN && piece.moving ? v + piece.vy : v;
      const start = (piece.y - d) / closing, end = (piece.y + piece.len - back) / closing;
      let mask = lanesOf(piece.x, piece.w);
      // A crossing animal: once its arrow has been seen, it blocks where it is going too.
      if ((piece.kind === WALK_GOAT || piece.kind === WALK_COW) && piece.moving && known(100000 + index, true)) mask |= 1 << piece.to;
      mark(mask, start, end);
    }
    for (let index = 0; index < game.course.dogs.length; index++) {
      if (game.dogState[index] !== RUNNING || !known(200000 + index, true)) continue;
      const y = game.dogY[index], gap = back - (y + SPEC[DOG].len);
      mark(lanesOf(game.dogX[index], SPEC[DOG].w), gap / DOG_V, (d - y) / DOG_V);
    }

    // A gate coming up: head for the lane beside it unless something stands there in the window.
    let want = -1;
    for (let index = game.houseNext; index < game.course.houses.length; index++) {
      const house = game.course.houses[index];
      if (game.houseState[index] !== WAITING) continue;
      const at = (house.y - d) / v;
      if (at > 2.2) break;
      if (house.y - d > horizon + 60 || game.bag <= 0) break;
      if (!rolled.has(index)) { rolled.add(index); if (rng() < skill.skipGate) skipped.add(index); }
      if (skipped.has(index)) continue;
      const lane = house.side ? LANES - 1 : 0, leave = (house.y + 40 - back) / v;
      if (danger[lane] > leave + 0.05) want = lane;
      break;
    }
    const lane = game.lane, sw = mudAt(game.course, d) || mudAt(game.course, d + 2 * v * MUD_T) ? MUD_T : SWITCH_T;
    const safe = 0.32 + sw * 1.5;
    if (want < 0 && skill.letters && letterLane >= 0 && letterAt < 1.1 && danger[letterLane] > letterAt + 0.4) want = letterLane;
    if (want < 0) {
      if (danger[lane] > safe) want = lane;
      else {
        let best = lane, bestTime = danger[lane];
        for (const other of [lane - 1, lane + 1, lane - 2, lane + 2]) {
          if (other < 0 || other >= LANES) continue;
          const mid = (lane + other) / 2;
          if (Math.abs(other - lane) === 2 && danger[mid] < sw + 0.05) continue;
          const time = danger[other] - Math.abs(other - lane) * sw;
          if (time > bestTime + 0.05) { best = other; bestTime = time; }
        }
        want = best;
      }
      if (want !== plan && want !== lane && rng() < skill.wrong) want = (want + 1 + Math.floor(rng() * 2)) % LANES;
    }
    plan = want;
    if (want === lane || t - lastTap < skill.tapGap) return;
    const towards = want < lane ? -1 : 1, next = lane + towards;
    // Never slide into something that is right beside the bike.
    if (danger[next] <= 0.02 && Math.abs(game.x - laneX(lane)) < LANE_W / 2) return;
    // Cutting across a lane on the way to another: only if nothing reaches the lane in between before the bike is through.
    if (next !== want && danger[next] < 2 * sw + 0.1) return;
    steer(game, towards);
    lastTap = t;
  };
}

export type RideResult = { finished: boolean; stars: number; time: number; delivered: number; houses: number; bumps: number; meters: number; picked: number; score: number; game: Game };

/** Rides one route to the end with a bot, at `scale` × real time (ধীরে খেলো is 0.75). */
export function rideWith(skill: Skill, seed: number, level: number, mode = 1, scale = 1, botSeed = seed): RideResult {
  const game = createGame(makeCourse(seed, level), mode), bot = makeBot(skill, botSeed);
  for (let steps = 0; !game.over && steps < 60 * 300; steps++) {
    bot(game);
    stepGame(game, DT * scale);
  }
  const stars = !game.finished ? 0 : game.delivered >= game.course.houses.length ? 3 : game.delivered >= game.course.spec.goal ? 2 : 1;
  return { finished: Boolean(game.finished), stars, time: game.t, delivered: game.delivered, houses: game.course.houses.length, bumps: game.bumps, meters: game.meters, picked: game.picked, score: game.score, game };
}
export { laneX, LANE_W };

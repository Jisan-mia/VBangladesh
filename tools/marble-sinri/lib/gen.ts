// One floor's ledges from a seed and a row of levels.ts. Every ledge is checked with the real step function before it is
// placed (the fairness rule below), so the same seed gives the same fair stairs on every phone.
import { makeRng } from "../../../shared/game-core";
import { LEVELS, levelOf, type Level } from "./levels";
import {
  landable, makeLedge, pieces, surfaceY, ALLEY, CLEAR, CONCRETE, FIRST_Y, GAP, LANDING, PARAPET, PLANK, POLE, R, RAIL, SAFE, STEP, SURGE, VX, W, G,
  type Ledge,
} from "./physics";
import { createGame, type Game } from "./game";
import { stepGame } from "./step.hot";

/** Seconds of slack the fairness rule leaves for a human hand (reaction, a late press). */
export const MARGIN = 0.18;
/** A landing window must be this wide, so a thumb has something to aim at. */
export const ROOM = 14;

const KIND_OF_WORLD = [PARAPET, CONCRETE, PLANK];
const probeGame: Game = createGame(0, [makeLedge(0, 0, W, 0, CONCRETE, 1), makeLedge(1, 0, W, GAP, CONCRETE, 1)], 0, 1);

/** Seconds a marble at (x, y) moving down at vy needs to fall to `surface`. */
function fallFor(y: number, vy: number, surface: number) {
  const drop = surface - (y + R);
  if (drop <= 0) return 0;
  return (-vy + Math.sqrt(vy * vy + 2 * G * drop)) / G;
}

/**
 * Rolls a marble from x (speed vx) on ledge `a`, holding `dir` until it drops (no faster than `cap`), then steering in the air
 * to land at `aim` on `b`.
 * Returns the seconds it took to land safely on `b`, or -1. Pure: `a` and `b` are copied, never changed.
 */
export function tryDrop(a: Ledge, b: Ledge, x: number, vx: number, dir: number, aim: number, budget: number, crackLeft = -1, cap = VX) {
  const game = probeGame, top = { ...a }, low = { ...b };
  if (top.crack) top.crackT = crackLeft >= 0 ? crackLeft : 1;
  game.rows[0] = top; game.rows[1] = low;
  Object.assign(game, { lo: 0, x, y: surfaceY(top, x) - R, vx, vy: 0, roll: 0, on: 0, skip: -1, cam: 0, speed: 0, wind: 0, deepest: top.row, start: top.row, chances: 9, most: 9, falls: 0, t: 0, wait: 0, over: 0, events: 0 });
  for (let steps = 0; steps * STEP <= budget; steps++) {
    // On the ledge: hold the side, or (a careful approach) only until the marble rolls at `cap`.
    let hold = cap >= VX || game.vx * dir < cap ? dir : 0;
    if (game.on < 0) {
      const ahead = game.x + game.vx * fallFor(game.y, game.vy, surfaceY(low, game.x));
      hold = Math.abs(aim - ahead) < 1.5 ? 0 : aim > ahead ? 1 : -1;
    }
    stepGame(game, STEP, hold, false);
    if (game.falls) return -1;
    if (game.on === 1) {
      const landed = game.t, count = pieces(low, spots);
      let inside = false;
      for (let index = 0; index < count; index++) if (game.x >= spots[index * 2] + 3 && game.x <= spots[index * 2 + 1] - 3) inside = true;
      if (!inside) return -1;
      // Safe only if the marble can also stop there: brake for a moment and make sure it neither meets the pot nor rolls off.
      for (let settle = 0; settle < 24 && Math.abs(game.vx) > 4; settle++) {
        stepGame(game, STEP, game.vx > 0 ? -1 : 1, false);
        if (game.falls || game.on !== 1) return -1;
      }
      return landed;
    }
    if (game.y > low.y + 60) return -1;
  }
  return -1;
}
const spots = new Float64Array(8), from = new Float64Array(8);

/** Where to aim on `b`: inside each safe stretch, the point nearest the drop's natural line, and the stretch's middle. */
function aims(b: Ledge, near: number, out: number[]) {
  out.length = 0;
  const count = pieces(b, spots);
  for (let index = 0; index < count; index++) {
    const a = spots[index * 2] + 8, z = spots[index * 2 + 1] - 8;
    if (z - a < ROOM) continue;
    out.push(Math.min(z, Math.max(a, near)), (a + z) / 2);
  }
  return out;
}
const aimList: number[] = [];

/** The quickest safe way from x on `a` down onto `b`: { dir, aim, time }, or null. Bots use it as their plan. */
export type Drop = { dir: number; aim: number; time: number; cap: number };
export function bestDrop(a: Ledge, b: Ledge, x: number, vx: number, budget: number, crackLeft = -1): Drop | null {
  let best = null as Drop | null;
  for (const cap of CAPS) {
    for (const dir of [-1, 1]) {
      // Where a roll off that side would come down, to try the nearest aims first.
      const edge = dir < 0 ? a.x0 : a.x1, near = edge + dir * cap * 0.3;
      for (const aim of aims(b, near, aimList).slice()) {
        const time = tryDrop(a, b, x, vx, dir, aim, budget, crackLeft, cap);
        if (time >= 0 && (!best || time < best.time)) best = { dir, aim, time, cap };
      }
    }
    if (best) return best;
  }
  return null;
}
/** Approach speeds: a full roll first, then a careful one (a thumb tapping, not holding). */
export const CAPS = [VX, VX * 0.5] as const;

/**
 * The fairness rule. From every spot on `a` a marble can stand on, one that sets off at once lands on a safe part of `b`
 * before `b` has risen one row (with MARGIN to spare). So a player who keeps pace with the stairs is never trapped: the
 * ledge under them never gets closer to the awning.
 */
export function fair(a: Ledge, b: Ledge) {
  // While the marble is on `a`, the stairs rise at a's speed (the speed of the deepest row reached).
  const budget = GAP / a.speed - MARGIN;
  if (budget <= 0 || !landable(b)) return false;
  const count = pieces(a, from);
  if (!count) return false;
  for (let index = 0; index < count; index++) {
    const p0 = from[index * 2], p1 = from[index * 2 + 1];
    for (const x of [p0 + 0.5, (p0 + p1) / 2, p1 - 0.5]) {
      let ok = false;
      for (const cap of CAPS) {
        for (const dir of [-1, 1]) {
          const edge = dir < 0 ? a.x0 : a.x1, near = edge + dir * cap * 0.3;
          for (const aim of aims(b, near, aimList).slice()) if (tryDrop(a, b, x, 0, dir, aim, budget, -1, cap) >= 0) { ok = true; break; }
          if (ok) break;
        }
        if (ok) break;
      }
      if (!ok) return false;
    }
  }
  return true;
}

/** A plain full-width ledge one row below, to check a ledge has a way off at all. */
const under = (ledge: Ledge, speed: number) => makeLedge(ledge.row + 1, 0, W, ledge.y + GAP, CONCRETE, speed);

/** Builds floor `level`'s rows for `seed`: the first ledge, `steps` more, the last one the floor's landing. */
export function makeFloor(seed: number, level: number): Ledge[] {
  // A row with no fair ledge throws the whole floor away and draws again from the next stream: still the same on every phone.
  for (let draw = 0; draw < 12; draw++) {
    const rows = drawFloor(seed, level, draw);
    if (rows) return rows;
  }
  return drawFloor(seed, level, 12, true)!;
}

function drawFloor(seed: number, level: number, draw: number, final = false): Ledge[] | null {
  const spec: Level = levelOf(level), rng = makeRng((seed ^ Math.imul(level, 0x85ebca6b) ^ Math.imul(draw, 0x27d4eb2f)) >>> 0);
  const kind = KIND_OF_WORLD[spec.world], between = (lo: number, hi: number) => lo + rng() * (hi - lo);
  const first = makeLedge(0, W / 2 - spec.width[1] / 2, W / 2 + spec.width[1] / 2, FIRST_Y, kind, spec.speed);
  const rows = [first];
  let surging = 0;

  for (let row = 1; row < spec.steps; row++) {
    const prev = rows[rows.length - 1];
    if (surging > 0) surging--;
    else if (row >= 4 && row < spec.steps - 2 && rng() < spec.surge) surging = 3;
    const speed = surging > 0 ? spec.speed * SURGE : spec.speed;
    const exits: number[] = [];
    const count = pieces(prev, from);
    for (let index = 0; index < count; index++) {
      if (from[index * 2] >= R + 2) exits.push(from[index * 2]);
      if (from[index * 2 + 1] <= W - R - 2) exits.push(from[index * 2 + 1]);
    }
    let ledge: Ledge | null = null;
    for (let attempt = 0; attempt < 80 && !ledge; attempt++) {
      // In a surge the stairs rise faster, so the ledges are short enough to roll off either end in time.
      const late = attempt > 50, width = surging > 0 ? between(56, 70) : late ? spec.width[0] : between(spec.width[0], spec.width[1]);
      let centre: number;
      if (rng() < 0.25 || !exits.length) centre = (prev.x0 + prev.x1) / 2 + (rng() - 0.5) * 70;
      else {
        const exit = exits[Math.floor(rng() * exits.length)], out = exit < (prev.x0 + prev.x1) / 2 ? -1 : 1;
        centre = exit + out * rng() * 70 + (rng() - 0.5) * width * 0.6;
      }
      let x0 = Math.max(0, Math.min(W - width, centre - width / 2));
      if (x0 < 16) x0 = 0;
      if (W - (x0 + width) < 16) x0 = W - width;
      const made = makeLedge(row, x0, x0 + width, prev.y + GAP, kind, speed);
      // One surface feature at most, never in the first row; the floor's newest one shows from the second row.
      if (row >= 2 && !late) {
        let roll = rng();
        if ((roll -= spec.wet) < 0) made.wet = true;
        else if ((roll -= spec.tilt) < 0) { made.kind = RAIL; made.tilt = (rng() < 0.5 ? -1 : 1) * between(0.12, 0.2); }
        else if ((roll -= spec.crack) < 0) made.crack = true;
        else if ((roll -= spec.round) < 0 && width <= 120) { made.kind = POLE; made.round = true; }
        // A pot sits at one end, so that end is closed: roll the other way.
        if (rng() < spec.pots && row >= 3 && width >= SAFE + 2 * CLEAR && !made.round) made.pot = rng() < 0.5 ? made.x0 + CLEAR - 2 : made.x1 - CLEAR + 2;
        else if (rng() < spec.holes && width >= 2 * SAFE + 30 && !made.round && made.tilt === 0) {
          const gap = between(28, 36), mid = between(made.x0 + SAFE + gap / 2, made.x1 - SAFE - gap / 2);
          made.h0 = mid - gap / 2; made.h1 = mid + gap / 2;
        }
        if (rng() < spec.gust) made.gust = rng() < 0.5 ? -1 : 1;
      }
      if (landable(made) && fair(prev, made) && fair(made, under(made, speed))) ledge = made;
    }
    // Last resort: a plain ledge straight under the first way off `prev`, nudged until it is fair.
    for (let shift = 0; !ledge && shift < 24; shift++) {
      const exit = exits[shift % Math.max(1, exits.length)] ?? (prev.x0 + prev.x1) / 2, side = exit < W / 2 ? -1 : 1;
      const width = surging > 0 ? 56 : spec.width[0], x0 = Math.max(0, Math.min(W - width, exit + side * (shift * 6) - width / 2));
      const made = makeLedge(row, x0, x0 + width, prev.y + GAP, kind, speed);
      if (fair(prev, made) && fair(made, under(made, speed))) ledge = made;
    }
    if (!ledge && !final) return null;
    // Never reached in practice (tests draw thousands of floors): a wide ledge with both ends open.
    ledge ??= makeLedge(row, 40, W - 40, prev.y + GAP, kind, speed);
    // Marbles to collect, on a safe stretch.
    if (rng() < spec.picks && !ledge.round) {
      const count = pieces(ledge, spots), at = Math.floor(rng() * count), a = spots[at * 2] + 8, z = spots[at * 2 + 1] - 8;
      if (z > a) ledge.pick = between(a, z);
    }
    rows.push(ledge);
  }
  const last = rows[rows.length - 1];
  const floor = makeLedge(spec.steps, 0, W, last.y + GAP, level === LEVELS.length ? ALLEY : LANDING, spec.speed);
  floor.floor = true;
  rows.push(floor);
  return rows;
}

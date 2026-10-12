// The running game: the plane, auto-fired paper balls, clouds, drops and রোদ, all in fixed pools so a step allocates nothing.
// Pure (no DOM): the component steps it, drains `events` for sound and sparkle, and reads the pools to draw.
import {
  BUTTON_SPEED, COMBO_CAP, DRAG_SPEED, H, PLANE_Y, STORM, STORM_POINTS, STORM_SUNS, STORM_WEIGHT, SUN_POINTS, X_MAX, X_MIN,
  ballReach, cloudHitsPlane, cloudX, cloudY, dropHitsPlane, makeWave, stormActive, stormGoneAt, stormX, stormY, type Wave,
} from "./wave";

export const HITS_MAX = 3;
export const FIRE_GAP = 0.2, BALL_SPEED = 150, BALL_R = 1.6;
const SAFE_AFTER_HIT = 1.4, COMBO_WINDOW = 1.0, SUN_FALL = 22, SUN_CATCH = 7.5;
const DROPS = 160, BALLS = 16, SUNS = 16, EVENTS = 48;

export const EV = { pop: 1, crack: 2, burst: 3, stormHit: 4, stormPop: 5, sun: 6, wet: 7, thunder: 8, stormIn: 9, combo: 10 } as const;
export type Phase = "ready" | "play" | "clear" | "over";

export type Game = {
  wave: Wave; seed: number; level: number; phase: Phase; t: number;
  px: number; vx: number; steer: number; target: number;
  /** Per cloud plan: 0 waiting, 1 in the sky, 2 popped, 3 gone past. */
  cloudState: Uint8Array; cloudHp: Uint8Array; cloudX: Float32Array; cloudY: Float32Array; cloudFlash: Float32Array; cloudTouched: Uint8Array;
  nextCloud: number; nextDrop: number; nextCurtain: number;
  dropAlive: Uint8Array; dropX: Float32Array; dropY: Float32Array; dropY0: Float32Array; dropT: Float32Array; dropVy: Float32Array;
  ballAlive: Uint8Array; ballX: Float32Array; ballY: Float32Array; fireClock: number;
  sunAlive: Uint8Array; sunX: Float32Array; sunY: Float32Array;
  /** 0 not yet, 1 in the sky, 2 popped, 3 left. */
  stormState: number; stormHp: number; stormX: number; stormY: number; stormFlash: number;
  score: number; popped: number; regular: number; suns: number; hits: number; safe: number;
  combo: number; bestCombo: number; lastPop: number; checkClock: number;
  events: Uint8Array; eventX: Float32Array; eventY: Float32Array; eventN: Int16Array; eventCount: number;
};

export function newGame(seed: number, level = 1): Game {
  const wave = makeWave(seed, level), count = wave.clouds.length;
  return {
    wave, seed, level, phase: "ready", t: 0,
    px: 50, vx: 0, steer: 0, target: NaN,
    cloudState: new Uint8Array(count), cloudHp: Uint8Array.from(wave.clouds, c => c.hp), cloudX: new Float32Array(count), cloudY: new Float32Array(count), cloudFlash: new Float32Array(count), cloudTouched: new Uint8Array(count),
    nextCloud: 0, nextDrop: 0, nextCurtain: 0,
    dropAlive: new Uint8Array(DROPS), dropX: new Float32Array(DROPS), dropY: new Float32Array(DROPS), dropY0: new Float32Array(DROPS), dropT: new Float32Array(DROPS), dropVy: new Float32Array(DROPS),
    ballAlive: new Uint8Array(BALLS), ballX: new Float32Array(BALLS), ballY: new Float32Array(BALLS), fireClock: FIRE_GAP * 0.5,
    sunAlive: new Uint8Array(SUNS), sunX: new Float32Array(SUNS), sunY: new Float32Array(SUNS),
    stormState: 0, stormHp: wave.storm?.hp ?? 0, stormX: 50, stormY: -30, stormFlash: 0,
    score: 0, popped: 0, regular: 0, suns: 0, hits: 0, safe: 0,
    combo: 0, bestCombo: 0, lastPop: -9, checkClock: 0,
    events: new Uint8Array(EVENTS), eventX: new Float32Array(EVENTS), eventY: new Float32Array(EVENTS), eventN: new Int16Array(EVENTS), eventCount: 0,
  };
}

function emit(game: Game, type: number, x: number, y: number, n = 0) {
  if (game.eventCount >= EVENTS) return;
  const index = game.eventCount++;
  game.events[index] = type; game.eventX[index] = x; game.eventY[index] = y; game.eventN[index] = n;
}

function free(alive: Uint8Array) {
  for (let index = 0; index < alive.length; index++) if (!alive[index]) return index;
  return -1;
}

function dropSun(game: Game, x: number, y: number) {
  const index = free(game.sunAlive);
  if (index < 0) return;
  game.sunAlive[index] = 1; game.sunX[index] = Math.max(X_MIN, Math.min(X_MAX, x)); game.sunY[index] = y;
}

function scorePop(game: Game, points: number, x: number, y: number) {
  game.combo = game.t - game.lastPop <= COMBO_WINDOW ? game.combo + 1 : 1;
  game.lastPop = game.t;
  game.bestCombo = Math.max(game.bestCombo, game.combo);
  game.score += points + Math.min(COMBO_CAP, (game.combo - 1) * 2);
  if (game.combo >= 2) emit(game, EV.combo, x, y, game.combo);
}

/** Starts the wave clock (the first tap). */
export function launch(game: Game) {
  if (game.phase === "ready") game.phase = "play";
}

/** Hold-to-steer from buttons or arrow keys: -1 left, 0 still, 1 right. Cancels a drag target. */
export function steer(game: Game, direction: number) {
  game.steer = direction;
  if (direction) game.target = NaN;
}

/** A relative drag: move the plane by this many sky units (the finger stays wherever it is). */
export function dragBy(game: Game, units: number) {
  const from = Number.isNaN(game.target) ? game.px : game.target;
  game.target = Math.max(X_MIN, Math.min(X_MAX, from + units));
  game.steer = 0;
}

/** Is anything still to come? Popped clouds' drops and a popped storm's rain never arrive. */
function pending(game: Game) {
  const { wave } = game;
  if (game.stormState === 1 || (wave.storm && game.stormState === 0)) return true;
  for (let index = 0; index < wave.clouds.length; index++) {
    const state = game.cloudState[index];
    if (state === 1 || (state === 0 && !wave.clouds[index].fromStorm)) return true;
  }
  for (let index = 0; index < game.dropAlive.length; index++) if (game.dropAlive[index]) return true;
  return false;
}

export function step(game: Game, dt: number) {
  if (game.phase !== "play") return;
  const { wave } = game, storm = wave.storm;
  const t = (game.t += dt);

  // The plane: a drag target pulls it fast, the buttons push it at a steady pace.
  const before = game.px;
  if (!Number.isNaN(game.target)) {
    const gap = game.target - game.px, reach = DRAG_SPEED * dt;
    game.px = Math.abs(gap) <= reach ? game.target : game.px + Math.sign(gap) * reach;
    if (game.px === game.target) game.target = NaN;
  } else if (game.steer) game.px += game.steer * BUTTON_SPEED * dt;
  game.px = Math.max(X_MIN, Math.min(X_MAX, game.px));
  game.vx = (game.px - before) / dt;
  if (game.safe > 0) game.safe -= dt;

  // The storm.
  if (storm) {
    if (game.stormState === 0 && t >= storm.t0) { game.stormState = 1; emit(game, EV.stormIn, 50, 0); }
    if (game.stormState === 1) {
      game.stormX = stormX(storm, t); game.stormY = stormY(storm, t);
      if (t >= stormGoneAt(storm)) game.stormState = 3;
      while (game.nextCurtain < storm.curtains.length && storm.curtains[game.nextCurtain].t - storm.curtains[game.nextCurtain].warn <= t) {
        if (stormActive(storm, t)) emit(game, EV.thunder, game.stormX, game.stormY, game.nextCurtain);
        game.nextCurtain++;
      }
    }
    if (game.stormFlash > 0) game.stormFlash -= dt;
  }

  // Clouds come in on schedule (the storm's little clouds only while it's still there).
  while (game.nextCloud < wave.clouds.length && wave.clouds[game.nextCloud].t0 <= t) {
    const c = wave.clouds[game.nextCloud];
    game.cloudState[game.nextCloud] = c.fromStorm && game.stormState !== 1 ? 3 : 1;
    game.nextCloud++;
  }
  for (let index = 0; index < game.nextCloud; index++) {
    if (game.cloudState[index] !== 1) continue;
    const c = wave.clouds[index], y = cloudY(c, t);
    game.cloudX[index] = cloudX(c, t); game.cloudY[index] = y;
    if (game.cloudFlash[index] > 0) game.cloudFlash[index] -= dt;
    if (y - c.rh > H) game.cloudState[index] = 3;
  }

  // Drops leave a cloud (or the storm) only if it's still in the sky.
  while (game.nextDrop < wave.drops.length && wave.drops[game.nextDrop].t <= t) {
    const d = wave.drops[game.nextDrop++];
    const alive = d.source === STORM ? game.stormState === 1 : game.cloudState[d.source] === 1;
    const slot = alive ? free(game.dropAlive) : -1;
    if (slot < 0) continue;
    game.dropAlive[slot] = 1; game.dropX[slot] = d.x; game.dropY0[slot] = d.y; game.dropT[slot] = d.t; game.dropVy[slot] = d.vy;
  }
  for (let index = 0; index < game.dropAlive.length; index++) {
    if (!game.dropAlive[index]) continue;
    const y = game.dropY0[index] + game.dropVy[index] * (t - game.dropT[index]);
    game.dropY[index] = y;
    if (y > H + 4) game.dropAlive[index] = 0;
  }

  // Auto-fire.
  game.fireClock -= dt;
  if (game.fireClock <= 0) {
    game.fireClock += FIRE_GAP;
    const slot = free(game.ballAlive);
    if (slot >= 0) { game.ballAlive[slot] = 1; game.ballX[slot] = game.px; game.ballY[slot] = PLANE_Y - 6; }
  }
  for (let ball = 0; ball < game.ballAlive.length; ball++) {
    if (!game.ballAlive[ball]) continue;
    const bx = game.ballX[ball], by = (game.ballY[ball] -= BALL_SPEED * dt);
    if (by < -4) { game.ballAlive[ball] = 0; continue; }
    if (game.stormState === 1 && storm && Math.abs(bx - game.stormX) < storm.rw * 0.9 && Math.abs(by - game.stormY) < storm.rh) {
      game.ballAlive[ball] = 0;
      game.stormHp--; game.stormFlash = 0.12;
      if (game.stormHp <= 0) {
        game.stormState = 2; game.popped += STORM_WEIGHT;
        scorePop(game, STORM_POINTS, game.stormX, game.stormY);
        for (let sun = 0; sun < STORM_SUNS; sun++) dropSun(game, game.stormX + (sun - 2) * 11, game.stormY + 4);
        emit(game, EV.stormPop, game.stormX, game.stormY);
      } else emit(game, EV.stormHit, bx, by);
      continue;
    }
    for (let index = 0; index < game.nextCloud; index++) {
      if (game.cloudState[index] !== 1) continue;
      const c = wave.clouds[index], cx = game.cloudX[index], cy = game.cloudY[index];
      if (cy < -c.rh * 0.4 || Math.abs(bx - cx) > ballReach(c) + BALL_R || Math.abs(by - cy) > c.rh * 0.8 + BALL_R) continue;
      game.ballAlive[ball] = 0;
      if (--game.cloudHp[index] > 0) { game.cloudFlash[index] = 0.15; emit(game, EV.crack, cx, cy); break; }
      game.cloudState[index] = 2;
      game.popped += c.weight;
      if (c.weight) game.regular++;
      scorePop(game, c.points, cx, cy);
      if (c.kind === "dark") dropSun(game, cx, cy);
      emit(game, c.kind === "dark" ? EV.burst : EV.pop, cx, cy, c.points);
      break;
    }
  }

  // রোদ floats down; touch it to keep it.
  for (let index = 0; index < game.sunAlive.length; index++) {
    if (!game.sunAlive[index]) continue;
    const y = (game.sunY[index] += SUN_FALL * dt);
    if (Math.abs(game.sunX[index] - game.px) < SUN_CATCH && Math.abs(y - PLANE_Y) < SUN_CATCH) {
      game.sunAlive[index] = 0; game.suns++; game.score += SUN_POINTS;
      emit(game, EV.sun, game.sunX[index], y, game.suns);
    } else if (y > H + 4) game.sunAlive[index] = 0;
  }

  // Getting wet: a cloud or a drop on the plane. A short dry spell follows each one.
  if (game.safe <= 0) {
    let wet = false;
    for (let index = 0; index < game.nextCloud && !wet; index++) {
      if (game.cloudState[index] !== 1 || game.cloudTouched[index]) continue;
      if (cloudHitsPlane(wave.clouds[index], game.cloudX[index], game.cloudY[index], game.px)) { game.cloudTouched[index] = 1; wet = true; }
    }
    for (let index = 0; index < game.dropAlive.length && !wet; index++) {
      if (game.dropAlive[index] && dropHitsPlane(game.dropX[index], game.dropY[index], game.px)) { game.dropAlive[index] = 0; wet = true; }
    }
    if (wet) {
      game.hits++; game.safe = SAFE_AFTER_HIT; game.combo = 0;
      emit(game, EV.wet, game.px, PLANE_Y, game.hits);
      if (game.hits >= HITS_MAX) { game.phase = "over"; return; }
    }
  }

  if ((game.checkClock -= dt) <= 0) {
    game.checkClock = 0.25;
    if (!pending(game)) game.phase = "clear";
  }
}

/** 0 when the plane got soaked; otherwise 1, +1 for popping enough clouds, +1 for never getting wet. */
export const starsOf = (wave: Pick<Wave, "goal">, popped: number, hits: number) =>
  hits >= HITS_MAX ? 0 : 1 + (popped >= wave.goal ? 1 : 0) + (hits === 0 ? 1 : 0);

/** How far along the wave is, 0..1, for the thin bar at the top. */
export const progressOf = (game: Game) => Math.min(1, game.t / Math.max(1, game.wave.length));

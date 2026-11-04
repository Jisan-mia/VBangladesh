// The flight's step, 60 times a second: turn the nose, trade speed for height, add the wind, then check what the plane
// touched (the floor, a bench, a fan, a kite string, a bird, the landing place) and the candies it flew through.
// Allocation-free (npm run lint:games checks it): it only mutates the Game made by flight.ts.
import { CRASH, DOWN, EV, EVENT_RING, FLYING, LANDED, type Game } from "./flight";
import {
  BIRD, BIRD_R, CANDY_R, DOWN_TIME, DRAG, EASE, G, INDUCED, KITE_R, MIN_SPEED, PAPER, PITCH_DOWN, PITCH_UP, PLANE_R, RECOVER, RECT,
  RETHROW_PITCH, RETHROW_SPEED, SKY_CAP, STALL, STALL_PITCH, STALL_SINK, STRING, STRING_R, TURN, WATER, STREET, WIND, WINDF, A, padX, type Course,
} from "./physics";

/** Seconds of warning before a finale beat. */
export const WARN_AHEAD = 1;
const RAIN_DRAG = 8;

function emit(game: Game, kind: number, x: number, y: number, n: number) {
  const slot = game.eventCount++ % EVENT_RING;
  game.evKind[slot] = kind; game.evX[slot] = x; game.evY[slot] = y; game.evN[slot] = n;
}

/** Is a wind zone blowing at time t (gusts and bells come and go)? */
export function windOn(winds: Float32Array, index: number, t: number) {
  const base = index * WINDF, period = winds[base + 6];
  if (!period) return true;
  const phase = (t + winds[base + 8]) % period;
  return phase < winds[base + 7] * period;
}

/** How strongly a zone blows at t, 0..1: gusts and bells swell in and out over a quarter second, so streaks can show it coming. */
export function windLevel(winds: Float32Array, index: number, t: number) {
  const base = index * WINDF, period = winds[base + 6];
  if (!period) return 1;
  const phase = (t + winds[base + 8]) % period, on = winds[base + 7] * period;
  if (phase >= on) return 0;
  const edge = 0.25;
  return phase < edge ? phase / edge : on - phase < edge ? (on - phase) / edge : 1;
}

/** Where a cut kite is at t; its string hangs from it down to the tail (kiteTailX, kiteY − length). */
export function kiteX(strings: Float32Array, index: number, t: number) {
  const base = index * STRING;
  return strings[base] + strings[base + 4] * Math.sin(strings[base + 5] * t + strings[base + 6]);
}
export function kiteY(strings: Float32Array, index: number, t: number) {
  const base = index * STRING;
  return strings[base + 1] + strings[base + 4] * 0.45 * Math.cos(strings[base + 5] * 1.3 * t + strings[base + 6]);
}
export function tailX(strings: Float32Array, index: number, t: number) {
  const base = index * STRING;
  return kiteX(strings, index, t) + strings[base + 3] + strings[base + 4] * 0.35 * Math.sin(strings[base + 5] * t + strings[base + 6] - 0.9);
}
export function birdX(birds: Float32Array, index: number, t: number) {
  const base = index * BIRD;
  return birds[base] + birds[base + 2] * Math.sin(birds[base + 4] * t + birds[base + 5]);
}
export function birdY(birds: Float32Array, index: number, t: number) {
  const base = index * BIRD;
  return birds[base + 1] + birds[base + 3] * Math.sin(birds[base + 4] * 2 * t + birds[base + 5]);
}

function segmentDistance(px: number, py: number, ax: number, ay: number, bx: number, by: number) {
  const dx = bx - ax, dy = by - ay, length = dx * dx + dy * dy;
  let u = length ? ((px - ax) * dx + (py - ay) * dy) / length : 0;
  if (u < 0) u = 0; else if (u > 1) u = 1;
  const ex = ax + dx * u - px, ey = ay + dy * u - py;
  return Math.sqrt(ex * ex + ey * ey);
}

/**
 * What a plane at (x, y) at time t would hit: a CRASH kind, or -1 for clear air. The landing place is not checked here
 * (stepGame handles it, since landing on top is the goal). Shared by the step, the edge warning and the bots.
 */
export function hitAt(course: Course, x: number, y: number, t: number) {
  const r = PLANE_R;
  if (y - r <= 0) return course.floor === WATER ? CRASH.water : course.floor === STREET ? CRASH.street : CRASH.floor;
  const rects = course.rects;
  for (let index = 0; index < course.rectCount; index++) {
    const base = index * RECT;
    if (x + r > rects[base] && x - r < rects[base + 2] && y + r > rects[base + 1] && y - r < rects[base + 3]) {
      const art = rects[base + 4];
      return art === A.fan || art === A.rod ? CRASH.fan : CRASH.solid;
    }
  }
  const strings = course.strings;
  for (let index = 0; index < course.stringCount; index++) {
    const base = index * STRING, kx = kiteX(strings, index, t), ky = kiteY(strings, index, t);
    const dx = x - kx, dy = y - ky;
    if (dx * dx + dy * dy < (KITE_R + r) * (KITE_R + r)) return CRASH.string;
    if (segmentDistance(x, y, kx, ky, tailX(strings, index, t), ky - strings[base + 2]) < STRING_R + r) return CRASH.string;
  }
  const birds = course.birds;
  for (let index = 0; index < course.birdCount; index++) {
    const dx = x - birdX(birds, index, t), dy = y - birdY(birds, index, t);
    if (dx * dx + dy * dy < (BIRD_R + r) * (BIRD_R + r)) return CRASH.bird;
  }
  return -1;
}

/** The air's push at (x, y) and t, written into game.wx / game.wy / game.windArt. */
function airAt(game: Game, x: number, y: number, t: number) {
  const winds = game.course.winds;
  let wx = 0, wy = 0, art = -1;
  for (let index = 0; index < game.course.windCount; index++) {
    const base = index * WINDF;
    if (x < winds[base] || x > winds[base + 2] || y < winds[base + 1] || y > winds[base + 3]) continue;
    const level = windLevel(winds, index, t);
    if (!level) continue;
    let push = level;
    if (winds[base + 9] === WIND.warm && y > SKY_CAP - 120) push *= (SKY_CAP - y) / 120;
    wx += winds[base + 4] * push; wy += winds[base + 5] * push;
    if (art < 0 || winds[base + 9] === WIND.bell) art = winds[base + 9];
  }
  if (y > SKY_CAP) wy -= (y - SKY_CAP) * 4;
  game.wx = wx; game.wy = wy; game.windArt = art;
}

function crash(game: Game, kind: number) {
  game.state = DOWN; game.downAt = game.t; game.downKind = kind; game.downX = game.x; game.downY = game.y;
  game.left--; game.crashes++; game.streak = 0; game.hold = false;
  emit(game, EV.crash, game.x, game.y, kind);
}

function rethrow(game: Game) {
  const course = game.course, base = game.checkpoint * 2;
  game.x = course.checkpoints[base]; game.y = course.checkpoints[base + 1]; game.prevY = game.y;
  game.v = RETHROW_SPEED; game.a = RETHROW_PITCH; game.stalled = false; game.state = FLYING; game.wet = 0;
  // Candies flown past before the fall can be caught again from here.
  for (let index = 0; index < course.candyCount; index++) if (game.taken[index] === 2 && course.candies[index * 2] > game.x) game.taken[index] = 0;
  emit(game, EV.rethrow, game.x, game.y, game.left);
}

/** The edge warning: probe the plane's line for the next 0.6 s; the sooner it would hit, the stronger the glow. */
function dangerAhead(game: Game) {
  const course = game.course, vx = game.v * Math.cos(game.a) + game.wx, vy = game.v * Math.sin(game.a) + game.wy;
  game.danger = 0; game.dangerEdge = 0;
  for (let k = 1; k <= 6; k++) {
    const dt = k * 0.1, px = game.x + vx * dt, py = game.y + vy * dt - (game.stalled ? 30 * dt : 0);
    const kind = hitAt(course, px, py, game.t + dt);
    if (kind >= 0) {
      game.danger = 1 - (k - 1) / 6;
      game.dangerEdge = kind === CRASH.floor || kind === CRASH.street || kind === CRASH.water ? 1 : kind === CRASH.fan ? 3 : 2;
      return;
    }
  }
  if (game.stalled) { game.danger = 0.45; game.dangerEdge = 3; }
}

/** Advances the flight by dt seconds with the nose held up (`hold`) or let go. */
export function stepGame(game: Game, hold: boolean, dt: number) {
  if (game.over) return;
  const course = game.course;
  game.t += dt;
  const t = game.t, beats = course.beats;
  // Finale beats: a warning a second ahead, then the beat itself.
  while (game.warned < beats.length && beats[game.warned] >= 0 && t >= beats[game.warned] - WARN_AHEAD) { emit(game, EV.warn, game.x, game.y, game.warned); game.warned++; }
  while (game.beatsHeard < beats.length && beats[game.beatsHeard] >= 0 && t >= beats[game.beatsHeard]) { emit(game, EV.beat, game.x, game.y, game.beatsHeard); game.beatsHeard++; }

  if (game.state === DOWN) {
    if (t - game.downAt >= DOWN_TIME) { if (game.left > 0) rethrow(game); else game.over = 2; }
    return;
  }
  if (game.state === LANDED) {
    // It skids along the top and settles; the run ends once it has stopped.
    game.slide *= Math.max(0, 1 - 5 * dt);
    game.landX += game.slide * dt;
    if (t - game.landT > 0.9) game.over = 1;
    return;
  }

  game.hold = hold;
  // The nose: up while held, down when let go, forced down in a stall until the speed comes back.
  if (game.v < STALL && !game.stalled) { game.stalled = true; emit(game, EV.stall, game.x, game.y, 0); }
  else if (game.stalled && game.v > RECOVER) game.stalled = false;
  const target = game.stalled ? STALL_PITCH : hold ? PITCH_UP : PITCH_DOWN;
  const rate = TURN * Math.min(1, 0.5 + game.v / 160) * dt;
  let turn = (target - game.a) * Math.min(1, EASE * dt);
  if (turn > rate) turn = rate; else if (turn < -rate) turn = -rate;
  game.a += turn;
  game.v += (-G * Math.sin(game.a) - DRAG * game.v * game.v - PAPER - INDUCED / (game.v * game.v)) * dt;

  const wasArt = game.windArt;
  airAt(game, game.x, game.y, t);
  if (game.windArt >= 0 && game.windArt !== wasArt) emit(game, EV.wind, game.x, game.y, game.windArt);
  // Rain soaks in: the paper gets heavier while wet and dries slowly outside.
  if (game.windArt === WIND.rain) { game.wet = Math.min(1, game.wet + dt * 1.4); game.v -= RAIN_DRAG * dt; }
  else game.wet = Math.max(0, game.wet - dt * 0.5);
  if (game.v < MIN_SPEED) game.v = MIN_SPEED;

  game.prevY = game.y;
  game.x += (game.v * Math.cos(game.a) + game.wx) * dt;
  game.y += (game.v * Math.sin(game.a) + game.wy - (game.stalled ? STALL_SINK : 0) - game.wet * 8) * dt;
  game.airTime += dt;
  if (game.x > game.maxX) game.maxX = game.x;
  if (game.y > game.highest) game.highest = game.y;
  while (game.checkpoint + 1 < course.checkpointCount && course.checkpoints[(game.checkpoint + 1) * 2] <= game.x) {
    game.checkpoint++;
    emit(game, EV.checkpoint, game.x, game.y, game.checkpoint);
  }

  // The far wall (the board, a neighbour's wall, the high bank) stops a plane that overshoots: it knocks the nose
  // straight down and the plane drops, usually onto the landing place below it.
  if (game.x + PLANE_R > course.length) {
    game.x = course.length - PLANE_R - 0.5;
    game.a = -1.3; game.v = 45; game.stalled = true;
    emit(game, EV.bump, game.x, game.y, 1);
  }
  // The ceiling knocks the nose down and costs speed; it is not a crash.
  if (game.y > course.ceiling - PLANE_R) {
    game.y = course.ceiling - PLANE_R;
    if (game.a > -0.25) game.a = -0.25;
    game.v *= 0.85;
    if (t - game.bumpAt > 0.3) emit(game, EV.bump, game.x, game.y, 0);
    game.bumpAt = t;
  }

  // The landing place: down onto its top is a landing (the middle is the bullseye); into its side is a crash.
  const pad = course.pad, px0 = padX(pad, t), px1 = px0 + (pad.x1 - pad.x0);
  if (game.x + PLANE_R > px0 && game.x - PLANE_R < px1 && game.y - PLANE_R < pad.y && game.y + PLANE_R > pad.y - pad.depth) {
    if (game.prevY - PLANE_R >= pad.y - 2 && game.x >= px0 && game.x <= px1) {
      const centre = (px0 + px1) / 2;
      game.landing = Math.abs(game.x - centre) <= pad.bull ? 2 : 1;
      game.state = LANDED; game.landT = t; game.landX = game.x - px0; game.touchX = game.landX; game.y = pad.y + PLANE_R;
      game.slide = Math.min(90, game.v * Math.cos(game.a) * 0.6);
      emit(game, EV.land, game.x, game.y, game.landing);
      return;
    }
    crash(game, CRASH.pad);
    return;
  }

  const kind = hitAt(course, game.x, game.y, t);
  if (kind >= 0) { crash(game, kind); return; }

  // Candies: through one is a catch; one left behind breaks the streak.
  const candies = course.candies, reach = CANDY_R + PLANE_R;
  for (let index = 0; index < course.candyCount; index++) {
    if (game.taken[index]) continue;
    const dx = game.x - candies[index * 2], dy = game.y - candies[index * 2 + 1];
    if (dx * dx + dy * dy < reach * reach) {
      game.taken[index] = 1; game.candies++; game.streak++;
      if (game.streak > game.bestStreak) game.bestStreak = game.streak;
      emit(game, EV.candy, candies[index * 2], candies[index * 2 + 1], game.streak);
    } else if (dx > reach + 30) { game.taken[index] = 2; game.streak = 0; }
  }
  if (game.probe) dangerAhead(game);
}

// The afternoon's step, 60 times a second, and the clap. Allocation-free (npm run lint:games checks it): everything here
// mutates the typed arrays afternoon.ts made. A bird flies in → sits and pecks → is shooed (a শালিক hops aside first; a boss
// takes several claps and moves to a new spot after each).
import { BOSS_FLY, BOSS_PECK, BOSS_R, FIELD, FIRST_PECK, HAT_X, HAT_Y, HIT_R, HOP, IMMUNE, NEAR_R, PARROT_FLY, PERCH, TAPPABLE, TO_HAT, W, clampX, clampY, nearScarecrow } from "./field";
import { BOSS, MUNIA } from "./levels";
import {
  DUSK, EV_BOSS_GONE, EV_BOSS_HIT, EV_BOSS_IN, EV_DUSK_HELD, EV_HOP, EV_LAND, EV_MISS, EV_NEAR, EV_PECK, EV_SHOO, EV_TENTH, FLYING, GONE, HOPPING, LOST, ON,
  PERCHED, SHOOED, SITTING, WAIT,
} from "./states";
import type { Game } from "./afternoon";

/** A number in [0, 1) from the seed and three small keys: a boss's next spot is as replayable as its first. */
export function hash01(seed: number, a: number, b: number, c: number) {
  let h = (seed ^ Math.imul(a + 1, 0x9e3779b1) ^ Math.imul(b + 7, 0x85ebca6b) ^ Math.imul(c + 13, 0xc2b2ae35)) >>> 0;
  h = Math.imul(h ^ (h >>> 16), 0x7feb352d);
  h = Math.imul(h ^ (h >>> 15), 0x846ca68b);
  return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
}

function push(game: Game, kind: number, x: number, y: number, n: number) {
  const event = game.events[game.eventCount % game.events.length];
  event.kind = kind; event.x = x; event.y = y; event.t = game.t; event.n = n;
  game.eventCount++;
}

/** How far along its current flight a bird is, 0 to 1. */
export const flight = (game: Game, i: number) => Math.min(1, Math.max(0, (game.t - game.t0[i]) / game.fly[i]));

/** Where a hopping শালিক is now along its hop (x, or y with `axis` 1); a sitting or flying bird is at its spot. */
export function posOf(game: Game, i: number, axis: number) {
  const to = axis ? game.y[i] : game.x[i];
  if (game.state[i] !== HOPPING) return to;
  const from = axis ? game.fromY[i] : game.fromX[i], u = Math.min(1, Math.max(0, (game.t - game.moveAt[i]) / HOP));
  return from + (to - from) * u;
}

/** Can a clap reach this bird now? Sitting, hopping, or far enough into its flight that its shadow marks the spot. */
export function tappable(game: Game, i: number) {
  const state = game.state[i];
  if (game.immune[i] > game.t) return false;
  return state === SITTING || state === HOPPING || (state === FLYING && flight(game, i) >= TAPPABLE);
}

/** Advances the afternoon by `dt` seconds. */
export function stepGame(game: Game, dt: number) {
  if (game.over !== ON) return;
  game.t += dt;
  const t = game.t, n = game.n, boss = game.boss;
  let alive = 0;
  for (let i = 0; i < n; i++) {
    let state = game.state[i];
    if (state === WAIT) {
      if (t < game.t0[i]) { alive++; continue; }
      state = game.state[i] = FLYING;
      if (i === boss) push(game, EV_BOSS_IN, game.x[i], game.y[i], game.hp[i]);
    }
    if (state === PERCHED && t >= game.moveAt[i]) {
      // Off the মাথাল and down into the paddy.
      state = game.state[i] = FLYING;
      game.fromX[i] = HAT_X; game.fromY[i] = HAT_Y; game.via[i] = 1;
    }
    if (state === FLYING && t >= game.land[i]) {
      state = game.state[i] = SITTING;
      game.nextPeck[i] = game.land[i] + (i === boss ? BOSS_PECK : FIRST_PECK);
      push(game, EV_LAND, game.x[i], game.y[i], game.kind[i]);
    }
    if (state === HOPPING && t >= game.moveAt[i] + HOP) {
      state = game.state[i] = SITTING;
      game.nextPeck[i] = t + FIRST_PECK;
    }
    if (state === SITTING) {
      while (game.grain > 0 && t >= game.nextPeck[i]) {
        game.lastPeck[i] = game.nextPeck[i];
        game.nextPeck[i] += game.every[i];
        game.ate[i]++;
        game.pecks++;
        game.grain = Math.max(0, game.grain - game.bite);
        push(game, EV_PECK, game.x[i], game.y[i], game.kind[i]);
        const tenth = Math.ceil(game.grain / 10);
        if (tenth < game.tenth) { game.tenth = tenth; push(game, EV_TENTH, game.x[i], game.y[i], tenth); }
      }
    }
    if (state === WAIT || state === FLYING || state === SITTING || state === HOPPING || state === PERCHED) alive++;
  }
  if (game.grain <= 0) { game.grain = 0; game.over = LOST; return; }
  const bossAlive = boss >= 0 && game.state[boss] !== SHOOED;
  const dusk = t >= game.row.length;
  const cleared = t > game.lastLand + 0.25 && alive === (bossAlive ? 1 : 0);
  if (!dusk && !(cleared && !bossAlive)) return;
  // Dusk: every bird still about flies home, unless the boss is still at the grain. Then only it stays, and dusk waits for it.
  for (let i = 0; i < n; i++) {
    if (i === boss && bossAlive) continue;
    const state = game.state[i];
    if (state === WAIT || state === FLYING || state === SITTING || state === HOPPING) { game.state[i] = GONE; game.shooAt[i] = t; }
  }
  if (bossAlive) {
    if (!game.duskHeld) { game.duskHeld = true; push(game, EV_DUSK_HELD, game.x[boss], game.y[boss], game.hp[boss]); }
    return;
  }
  game.over = DUSK;
}

/** The boss's পাল for landing `leg`: just after the boss lands, each escort lands well apart from it (a মুনিয়া escort as one flock). */
export function sendEscorts(game: Game, leg: number) {
  const per = game.perLeg, b = game.boss;
  if (!per || game.escort < 0 || leg >= game.row.boss) return;
  const first = game.escort + leg * per, flock = game.kind[first] === MUNIA, spread = game.row.spread;
  let cx = 0, cy = 0;
  for (let m = 0; m < per; m++) {
    const i = first + m;
    let x = 0, y = 0;
    if (flock && m > 0) {
      const angle = (m / per) * Math.PI * 2 + hash01(game.seed, 900 + leg, m, 5) * 0.6, r = spread * (0.65 + hash01(game.seed, 900 + leg, m, 6) * 0.35);
      x = clampX(cx + Math.cos(angle) * r); y = clampY(cy + Math.sin(angle) * r * 0.75);
      if (nearScarecrow(x, y)) { x = clampX(cx - (x - cx)); y = clampY(cy - (y - cy)); }
    } else {
      for (let k = 0; k < 8; k++) {
        x = FIELD.left + 12 + hash01(game.seed, 900 + leg, m * 8 + k, 1) * (FIELD.right - FIELD.left - 24);
        y = FIELD.top + 8 + hash01(game.seed, 900 + leg, m * 8 + k, 2) * (FIELD.bottom - FIELD.top - 16);
        let far = Math.hypot(x - game.x[b], y - game.y[b]) > 90 && !nearScarecrow(x, y);
        for (let j = first; j < i && far; j++) if (Math.hypot(x - game.x[j], y - game.y[j]) < 72) far = false;
        if (far) break;
      }
      cx = x; cy = y;
    }
    game.x[i] = x; game.y[i] = y;
    game.t0[i] = game.land[b] - game.fly[i] + 0.35 + m * (flock ? 0.06 : 0.45);
    game.land[i] = game.t0[i] + game.fly[i];
    game.side[i] = hash01(game.seed, 900 + leg, m, 3) < 0.5 ? -1 : 1; game.flee[i] = game.side[i] === -1 ? 1 : -1;
    game.skyY[i] = 40 + hash01(game.seed, 900 + leg, m, 4) * 90;
    game.nextPeck[i] = game.land[i] + FIRST_PECK;
    if (game.land[i] > game.lastLand) game.lastLand = game.land[i];
  }
}

/** A new spot for the boss, well away from where it sat. */
function moveBoss(game: Game, i: number) {
  const fromX = posOf(game, i, 0), fromY = posOf(game, i, 1);
  let x = fromX, y = fromY;
  for (let k = 0; k < 6; k++) {
    x = FIELD.left + 20 + hash01(game.seed, 700 + game.leg[i], k, 1) * (FIELD.right - FIELD.left - 40);
    y = FIELD.top + 10 + hash01(game.seed, 700 + game.leg[i], k, 2) * (FIELD.bottom - FIELD.top - 20);
    if (Math.hypot(x - fromX, y - fromY) > 110 && !nearScarecrow(x, y)) break;
  }
  game.fromX[i] = fromX; game.fromY[i] = fromY; game.x[i] = x; game.y[i] = y;
  const world = game.row.world, t = game.t;
  game.immune[i] = t + IMMUNE;
  if (world === 1) {
    // The ঝুঁটি শালিক: up onto the কাকতাড়ুয়ার মাথাল, a rest out of reach, then down again.
    game.state[i] = PERCHED; game.moveAt[i] = t + TO_HAT + PERCH;
    game.fly[i] = BOSS_FLY; game.t0[i] = game.moveAt[i]; game.land[i] = game.moveAt[i] + BOSS_FLY;
    sendEscorts(game, game.leg[i]);
    return;
  }
  game.state[i] = FLYING; game.t0[i] = t;
  if (world === 2) {
    // The ডাকাত টিয়া: away, then a fast swoop in from the far side.
    game.side[i] = x < W / 2 ? 1 : -1; game.via[i] = 0; game.fly[i] = PARROT_FLY; game.skyY[i] = 40 + hash01(game.seed, 800 + game.leg[i], 0, 3) * 60;
  } else { game.via[i] = 1; game.fly[i] = BOSS_FLY; }
  game.land[i] = t + game.fly[i];
  sendEscorts(game, game.leg[i]);
}

/** A শালিক's hop aside after the first clap: away from the hand, still on the paddy. */
function hopAside(game: Game, i: number, cx: number, cy: number) {
  const fromX = posOf(game, i, 0), fromY = posOf(game, i, 1);
  let dx = fromX - cx, dy = fromY - cy;
  const length = Math.hypot(dx, dy);
  if (length < 1) { dx = game.side[i]; dy = 0; } else { dx /= length; dy /= length; }
  const reach = 62 + hash01(game.seed, 600 + i, game.ate[i], 4) * 22;
  let x = clampX(fromX + dx * reach), y = clampY(fromY + dy * reach * 0.7);
  if (Math.hypot(x - fromX, y - fromY) < 40 || nearScarecrow(x, y)) { x = clampX(fromX - dx * reach); y = clampY(fromY - dy * reach * 0.7); }
  game.fromX[i] = fromX; game.fromY[i] = fromY; game.x[i] = x; game.y[i] = y;
  game.state[i] = HOPPING; game.moveAt[i] = game.t;
  game.flee[i] = dx >= 0 ? 1 : -1;
}

/** A clap at (x, y). Reaches every bird within HIT_R of the tap. Returns how many it reached. */
export function clap(game: Game, x: number, y: number) {
  if (game.over !== ON) return 0;
  game.claps++;
  let hits = 0, nearest = Infinity;
  const t = game.t, boss = game.boss;
  for (let i = 0; i < game.n; i++) {
    if (!tappable(game, i)) {
      if (game.state[i] === FLYING || game.state[i] === PERCHED) { const d = Math.hypot(x - game.x[i], y - game.y[i]); if (d < nearest) nearest = d; }
      continue;
    }
    const bx = posOf(game, i, 0), by = posOf(game, i, 1);
    const d = Math.hypot(x - bx, y - by) - (i === boss ? BOSS_R : 0);
    if (d > HIT_R) { if (d < nearest) nearest = d; continue; }
    hits++;
    if (game.kind[i] === BOSS) {
      game.hp[i]--; game.bossHits++; game.leg[i]++;
      if (game.hp[i] === 0) {
        game.state[i] = SHOOED; game.shooAt[i] = t; game.flee[i] = bx >= x ? 1 : -1; game.shooed++;
        game.x[i] = bx; game.y[i] = by;
        push(game, EV_BOSS_GONE, bx, by, 0);
      } else {
        push(game, EV_BOSS_HIT, bx, by, game.hp[i]);
        moveBoss(game, i);
      }
    } else if (game.hp[i] > 1) {
      game.hp[i]--;
      push(game, EV_HOP, bx, by, game.hp[i]);
      hopAside(game, i, x, y);
    } else {
      game.hp[i] = 0;
      game.state[i] = SHOOED; game.shooAt[i] = t; game.flee[i] = bx >= x ? 1 : -1; game.shooed++;
      game.x[i] = bx; game.y[i] = by;
    }
  }
  if (hits) {
    game.combo += hits;
    if (game.combo > game.bestCombo) game.bestCombo = game.combo;
    if (hits > game.bestMulti) game.bestMulti = hits;
    push(game, EV_SHOO, x, y, hits);
    return hits;
  }
  game.combo = 0; game.misses++;
  push(game, nearest <= NEAR_R ? EV_NEAR : EV_MISS, x, y, 0);
  return 0;
}

/** Birds still to come or on the field (the boss counted). */
export function remaining(game: Game) {
  let left = 0;
  for (let i = 0; i < game.n; i++) { const s = game.state[i]; if (s !== SHOOED && s !== GONE) left++; }
  return left;
}

/**
 * Keyboard play: from the hand at (x, y), the nearest bird a clap could reach soon in direction (dx, dy), or −1.
 * Ahead counts, sideways drift costs double, so the hand hops to the bird the arrow points at.
 */
export function nextBird(game: Game, x: number, y: number, dx: number, dy: number) {
  let found = -1, best = Infinity;
  for (let i = 0; i < game.n; i++) {
    const state = game.state[i];
    if (state !== SITTING && state !== HOPPING && state !== FLYING) continue;
    const vx = game.x[i] - x, vy = game.y[i] - y, ahead = vx * dx + vy * dy;
    if (ahead <= 4) continue;
    const cost = ahead + 2 * Math.abs(vx * dy - vy * dx);
    if (cost < best) { best = cost; found = i; }
  }
  return found;
}

/** Birds sitting at the grain now (for the rustle). */
export function eating(game: Game) {
  let count = 0;
  for (let i = 0; i < game.n; i++) if (game.state[i] === SITTING) count++;
  return count;
}

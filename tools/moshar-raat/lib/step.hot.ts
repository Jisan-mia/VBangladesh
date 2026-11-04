// The night's step, 60 times a second, and the bat's swing. Allocation-free (npm run lint:games checks it): everything
// here mutates the typed arrays game.ts made. Each mosquito flies legs: in → hover (its kind's pattern) → the tell → the dive.
import { BOSS, FAST, GHOST, SWARM } from "./levels";
import {
  BITE_X, BITE_Y, BOSS_R, DASH, ENTER, ENTER_FAST, FACE_R, HEAD_X, HEAD_Y, HIT_R, HOPS, IMMUNE, MIN_DIVE, NEAR_R, NET_TOP, RETREAT, SWARM_BITE,
  TELL, TELL_BOSS, TELL_FAST,
} from "./room";
import {
  BIT, DIVING, ENTERING, EV_BITE, EV_BOSS_DOWN, EV_BOSS_HIT, EV_BOSS_IN, EV_DAWN_HELD, EV_MISS, EV_NEAR, EV_SLAP, EV_ZAP, FLY, GONE, HOVER, LOST, ON,
  TELLING, WAIT, WON, ZAPPED,
} from "./states";
import type { Game } from "./game";

const TAU = Math.PI * 2;

/** A number in [0, 1) from the seed and three small keys: a boss's next leg is as replayable as the first. */
export function hash01(seed: number, a: number, b: number, c: number) {
  let h = (seed ^ Math.imul(a + 1, 0x9e3779b1) ^ Math.imul(b + 7, 0x85ebca6b) ^ Math.imul(c + 13, 0xc2b2ae35)) >>> 0;
  h = Math.imul(h ^ (h >>> 16), 0x7feb352d);
  h = Math.imul(h ^ (h >>> 15), 0x846ca68b);
  return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
}

const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const easeOut = (t: number) => 1 - (1 - t) * (1 - t);
const easeInOut = (t: number) => (t < 0.5 ? 2 * t * t : 1 - 2 * (1 - t) * (1 - t));

/** The flight pattern a mosquito flies: a boss flies its world's kind. */
export const patternOf = (game: Game, i: number) => (game.kind[i] === BOSS ? game.row.bossKind : game.kind[i]);
/** Swarm members share their leader's dice, so the ঝাঁক stays together. */
const keyOf = (game: Game, i: number) => (game.kind[i] === SWARM ? 500 + game.group[i] : i);

function hopX(game: Game, i: number, k: number) { return k === 0 ? game.hx[i] : 50 + hash01(game.seed, keyOf(game, i), game.leg[i] * 8 + k, 11) * 260; }
function hopY(game: Game, i: number, k: number) {
  return k === 0 ? game.hy[i] : 10 + hash01(game.seed, keyOf(game, i), game.leg[i] * 8 + k, 12) * (game.row.net.length ? 230 : 270);
}

/** Where the hover pattern puts mosquito `i`, `s` seconds into its hover. Writes game.qx / game.qy. */
export function hover(game: Game, i: number, s: number) {
  const pattern = patternOf(game, i), hx = game.hx[i], hy = game.hy[i], r = game.r[i], f = game.f[i], ph = game.ph[i];
  if (pattern === FAST) {
    const loiter = game.loiter[i], seg = loiter / HOPS;
    if (s >= loiter) { game.qx = hopX(game, i, HOPS); game.qy = hopY(game, i, HOPS); return; }
    const k = Math.min(HOPS - 1, Math.floor(Math.max(0, s) / seg)), u = s - k * seg, rest = seg - DASH;
    if (u < rest) {
      game.qx = hopX(game, i, k) + Math.sin(s * 21 + ph) * 1.2;
      game.qy = hopY(game, i, k) + Math.cos(s * 17 + ph) * 1.2;
    } else {
      const p = easeInOut((u - rest) / DASH);
      game.qx = lerp(hopX(game, i, k), hopX(game, i, k + 1), p);
      game.qy = lerp(hopY(game, i, k), hopY(game, i, k + 1), p);
    }
    return;
  }
  if (pattern === SWARM) {
    const angle = game.ox[i] + s * 1.6, spread = game.oy[i];
    game.qx = hx + Math.sin(s * 0.9 + ph) * (40 + r) + Math.cos(angle) * spread;
    game.qy = hy + Math.sin(s * 1.9 + ph) * 16 + Math.sin(angle) * spread * 0.7;
    return;
  }
  game.qx = hx + Math.cos(s * f + ph) * r + Math.sin(s * 7.3 + ph * 2) * 5;
  game.qy = hy + Math.sin(s * f * 1.3 + ph) * r * 0.6 + Math.cos(s * 8.1 + ph) * 4;
}

/**
 * A new leg for mosquito `i` starting at time `t` from (fromX, fromY): where it hovers, for how long, its tell and its dive.
 * The first leg starts at its arrival; a boss gets a new one (`retreat`) after every hit and every bite.
 */
export function setLeg(game: Game, i: number, t: number, fromX: number, fromY: number, retreat: boolean) {
  const row = game.row, kind = game.kind[i], pattern = patternOf(game, i), key = keyOf(game, i), leg = game.leg[i], seed = game.seed;
  const net = row.net.length > 0, boss = kind === BOSS;
  const progress = Math.min(1, Math.max(0, t / row.length));
  let loiter = lerp(row.loiter[0], row.loiter[1], hash01(seed, key, leg, 0));
  let hx = 60 + hash01(seed, key, leg, 1) * 240, hy = 10 + hash01(seed, key, leg, 2) * (net ? 230 : 270);
  if (pattern === SWARM) { hx = 110 + hash01(seed, key, leg, 1) * 140; hy = 30 + hash01(seed, key, leg, 2) * (net ? 200 : 230); }
  if (boss) { hy = 0 + hash01(seed, key, leg, 2) * 170; loiter += 1; }
  if (pattern === FAST) loiter = Math.max(loiter * 1.6, 2.1) * (boss ? 1.2 : 1);
  // A ঝাপসা মশা lingers longer, faded, so its blinks (and the whine) have time to give it away.
  if (pattern === GHOST) loiter = Math.max(loiter * 1.5, 1.8);
  game.hx[i] = hx; game.hy[i] = hy;
  // A boss circles wide and quick, so it is hit best in its tell, before the dive.
  game.r[i] = boss ? 36 + hash01(seed, key, leg, 3) * 22 : 14 + hash01(seed, key, leg, 3) * 22;
  game.f[i] = (1.6 + hash01(seed, key, leg, 4) * 1.6) * (boss ? 1.4 : 1);
  game.ph[i] = hash01(seed, key, leg, 5) * TAU;
  game.loiter[i] = loiter;
  game.enter[i] = retreat ? RETREAT : pattern === FAST ? ENTER_FAST : ENTER;
  game.tell[i] = boss ? TELL_BOSS : pattern === FAST ? TELL_FAST : TELL;
  game.wob[i] = pattern === FAST ? 0 : 6 + hash01(seed, key, leg, 7) * 8;
  game.wf[i] = 3 + hash01(seed, key, leg, 6) * 3;
  if (kind === SWARM) {
    const size = Math.max(1, row.swarm), m = game.member[i];
    game.ox[i] = (m / size) * TAU + game.ph[i]; game.oy[i] = m === 0 ? 0 : 10 + (m % 2) * 4;
  }
  game.tx[i] = net ? row.net[Math.floor(hash01(seed, key, leg, 8) * row.net.length)] : BITE_X;
  game.ty[i] = net ? NET_TOP : BITE_Y;
  game.fx[i] = fromX; game.fy[i] = fromY; game.legAt[i] = t;
  hover(game, i, loiter);
  game.sx[i] = game.qx; game.sy[i] = game.qy;
  const speed = lerp(row.speed[0], row.speed[1], progress) * (pattern === FAST ? 1.5 : kind === SWARM ? 0.9 : 1) * (boss ? 0.9 : 1);
  game.speed[i] = speed;
  game.dive[i] = Math.max(MIN_DIVE, Math.hypot(game.tx[i] - game.sx[i], game.ty[i] - game.sy[i]) / speed);
  game.biteAt[i] = t + game.enter[i] + loiter + game.tell[i] + game.dive[i];
}

/** Puts mosquito `i` where it is now, and how visible it is (a ঝাপসা মশা fades while it hovers). */
export function place(game: Game, i: number) {
  const tau = game.t - game.legAt[i], enter = game.enter[i], loiter = game.loiter[i], tell = game.tell[i], ghost = patternOf(game, i) === GHOST;
  game.px[i] = game.x[i]; game.py[i] = game.y[i];
  let vis = 1;
  if (tau < enter) {
    const p = easeOut(Math.max(0, tau) / enter);
    hover(game, i, 0);
    game.x[i] = game.fx[i] + (game.qx - game.fx[i]) * p; game.y[i] = game.fy[i] + (game.qy - game.fy[i]) * p;
    game.part[i] = ENTERING;
    vis = 1 - 0.8 * p;
  } else if (tau < enter + loiter) {
    const s = tau - enter;
    hover(game, i, s);
    game.x[i] = game.qx; game.y[i] = game.qy;
    game.part[i] = HOVER;
    // A blink every 1.3 s, the first 0.5 s into the hover.
    const blink = (s + 0.8) % 1.3;
    vis = 0.1 + 0.9 * (blink < 0.36 ? Math.sin((blink / 0.36) * Math.PI) : 0);
  } else if (tau < enter + loiter + tell) {
    game.x[i] = game.sx[i] + Math.sin(game.t * 31 + game.ph[i]) * 1.5;
    game.y[i] = game.sy[i] + Math.cos(game.t * 27) * 1.2;
    game.part[i] = TELLING;
    vis = 0.55;
  } else {
    const d = tau - enter - loiter - tell, p = Math.min(1, d / game.dive[i]);
    const dx = game.tx[i] - game.sx[i], dy = game.ty[i] - game.sy[i], length = Math.hypot(dx, dy) || 1;
    // A zigzag across the line of flight that settles as it nears.
    const side = Math.sin(d * game.wf[i] + game.ph[i]) * game.wob[i] * (1 - p);
    game.x[i] = game.sx[i] + dx * p - (dy / length) * side;
    game.y[i] = game.sy[i] + dy * p + (dx / length) * side;
    game.part[i] = DIVING;
    vis = 0.5 + 0.5 * p;
  }
  game.vis[i] = ghost ? (game.kind[i] === BOSS ? Math.max(0.18, vis) : vis) : 1;
}

function push(game: Game, kind: number, x: number, y: number, n: number) {
  const event = game.events[game.eventCount % game.events.length];
  event.kind = kind; event.x = x; event.y = y; event.t = game.t; event.n = n;
  game.eventCount++;
}

/** Mosquito `i` reached what it was after. A boss bites and backs off for another go; a whole ঝাঁক landing is one bite. */
function bite(game: Game, i: number) {
  const kind = game.kind[i], x = game.tx[i], y = game.ty[i];
  game.combo = 0;
  if (kind === BOSS) {
    game.bites++;
    push(game, EV_BITE, x, y, game.bites);
    game.leg[i]++;
    setLeg(game, i, game.t, x, y, true);
    place(game, i);
    return;
  }
  game.state[i] = BIT; game.ended[i] = game.t; game.x[i] = x; game.y[i] = y;
  if (kind === SWARM) {
    const g = game.group[i];
    if (game.t - game.groupBit[g] <= SWARM_BITE) return;
    game.groupBit[g] = game.t;
  }
  game.bites++;
  push(game, EV_BITE, x, y, game.bites);
}

/** Advances the night by `dt` seconds. */
export function stepGame(game: Game, dt: number) {
  if (game.over !== ON) return;
  game.t += dt;
  const n = game.n, t = game.t;
  let flying = 0, near = -1, nearD = Infinity;
  for (let i = 0; i < n; i++) {
    if (game.state[i] === WAIT) {
      if (t < game.at[i]) continue;
      game.state[i] = FLY;
      game.x[i] = game.fx[i]; game.y[i] = game.fy[i];
      if (game.kind[i] === BOSS) push(game, EV_BOSS_IN, game.fx[i], game.fy[i], game.hp[i]);
    }
    if (game.state[i] !== FLY) continue;
    if (t >= game.biteAt[i]) { bite(game, i); if (game.state[i] !== FLY) continue; }
    else place(game, i);
    if (game.kind[i] !== BOSS) flying++;
    const d = Math.hypot(game.x[i] - game.tx[i], game.y[i] - game.ty[i]);
    if (d < nearD) { nearD = d; near = i; }
  }
  game.near = near; game.nearD = nearD;
  if (game.bites >= game.hearts) { game.over = LOST; return; }
  const boss = game.boss, bossAlive = boss >= 0 && (game.state[boss] === WAIT || game.state[boss] === FLY);
  const dawn = t >= game.row.length;
  if (!dawn && !(t > game.lastAt && flying === 0 && !bossAlive)) return;
  // Dawn: every mosquito still about flies off, unless the boss is still up. Then only it stays, and dawn waits for it.
  for (let i = 0; i < n; i++) {
    if (i === boss && bossAlive) continue;
    if (game.state[i] === FLY || game.state[i] === WAIT) { game.state[i] = GONE; game.ended[i] = t; }
  }
  if (bossAlive) {
    if (!game.dawnHeld) { game.dawnHeld = true; push(game, EV_DAWN_HELD, game.x[boss], game.y[boss], game.hp[boss]); }
    return;
  }
  game.over = WON;
}

/** A swing of the bat at (x, y). Zaps every flying mosquito under the head, checked along the step it just flew, so a fast one is never missed by a frame. Returns the hits. */
export function swing(game: Game, x: number, y: number) {
  if (game.over !== ON) return 0;
  game.swings++;
  let hits = 0, zapped = 0, nearest = Infinity;
  const t = game.t;
  for (let i = 0; i < game.n; i++) {
    if (game.state[i] !== FLY || game.immune[i] > t) continue;
    // Distance from the tap to the segment the mosquito flew this step.
    const ax = game.px[i], ay = game.py[i], bx = game.x[i], by = game.y[i], vx = bx - ax, vy = by - ay;
    const length2 = vx * vx + vy * vy, u = length2 > 0 ? Math.max(0, Math.min(1, ((x - ax) * vx + (y - ay) * vy) / length2)) : 1;
    const boss = game.kind[i] === BOSS;
    const d = Math.hypot(x - (ax + vx * u), y - (ay + vy * u)) - (boss ? BOSS_R : 0);
    if (d > HIT_R) { if (d < nearest) nearest = d; continue; }
    hits++;
    if (boss) {
      game.hp[i]--; game.bossHits++;
      if (game.hp[i] === 0) { game.state[i] = ZAPPED; game.ended[i] = t; zapped++; push(game, EV_BOSS_DOWN, game.x[i], game.y[i], 0); }
      else {
        push(game, EV_BOSS_HIT, game.x[i], game.y[i], game.hp[i]);
        game.leg[i]++;
        setLeg(game, i, t, game.x[i], game.y[i], true);
        game.immune[i] = t + IMMUNE;
      }
    } else { game.state[i] = ZAPPED; game.ended[i] = t; zapped++; }
  }
  game.zaps += zapped;
  if (hits) {
    game.combo += hits;
    if (game.combo > game.bestCombo) game.bestCombo = game.combo;
    if (hits > game.bestMulti) game.bestMulti = hits;
    push(game, EV_ZAP, x, y, hits);
    return hits;
  }
  game.combo = 0; game.misses++;
  if (game.row.face && Math.hypot(x - HEAD_X, y - HEAD_Y) <= FACE_R) {
    game.bites++; game.slaps++;
    push(game, EV_SLAP, HEAD_X, HEAD_Y, game.bites);
    if (game.bites >= game.hearts) game.over = LOST;
    return 0;
  }
  push(game, nearest <= NEAR_R ? EV_NEAR : EV_MISS, x, y, 0);
  return 0;
}

/** How many of the night's mosquitoes are still to come or flying (the boss counted). */
export function remaining(game: Game) {
  let left = 0;
  for (let i = 0; i < game.n; i++) if (game.state[i] === WAIT || game.state[i] === FLY) left++;
  return left;
}

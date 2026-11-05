// The suds, per frame, with no allocation: bubbles rise out of the middle of the pool, wobble, and pop (or get popped).
import { BUBBLES, RINGS, type Foam } from "./foam";

/** Pop rings last this long, in seconds. */
export const RING_LIFE = 0.28;

// A tiny inline generator (mulberry32) over the foam's own seed, so the same seed gives the same suds.
function next(foam: Foam): number {
  let t = (foam.seed = (foam.seed + 0x6d2b79f5) | 0);
  t = Math.imul(t ^ (t >>> 15), t | 1);
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
}

function ring(foam: Foam, x: number, y: number) {
  for (let slot = 0; slot < RINGS; slot++) {
    if (foam.rage[slot] < 0) { foam.rx[slot] = x; foam.ry[slot] = y; foam.rage[slot] = 0; return; }
  }
}

function pop(foam: Foam, slot: number) {
  foam.alive[slot] = 0;
  foam.popped++;
  ring(foam, foam.x[slot], foam.y[slot]);
}

/** One new bubble near the hands (or brush), in the pool's 200 box. Returns false when the pool is full. */
export function spawn(foam: Foam, big: number): boolean {
  for (let slot = 0; slot < BUBBLES; slot++) {
    if (foam.alive[slot]) continue;
    const angle = next(foam) * 6.2832, reach = 8 + next(foam) * 46;
    foam.x[slot] = 100 + Math.cos(angle) * reach;
    foam.y[slot] = 104 + Math.sin(angle) * reach * 0.8;
    foam.r[slot] = 3 + next(foam) * (4 + big * 6);
    foam.vy[slot] = 6 + next(foam) * 10;
    foam.life[slot] = 1.4 + next(foam) * 1.8;
    foam.age[slot] = 0;
    foam.wob[slot] = next(foam) * 6.2832;
    foam.alive[slot] = 1;
    return true;
  }
  return false;
}

/** A handful at once, for a step change. */
export function burst(foam: Foam, count: number, big: number) {
  for (let n = 0; n < count; n++) if (!spawn(foam, big)) return;
}

/**
 * `rate` bubbles a second are born, `drift` scales how fast they rise and wobble (0 = hold still, as in ধীরে খেলো).
 * A bubble stays inside the pool: it pops by itself at the edge or when its life ends.
 */
export function stepFoam(foam: Foam, dt: number, rate: number, drift: number, big: number) {
  foam.carry += rate * dt;
  while (foam.carry >= 1) { foam.carry -= 1; spawn(foam, big); }
  for (let slot = 0; slot < BUBBLES; slot++) {
    if (!foam.alive[slot]) continue;
    foam.age[slot] += dt;
    foam.y[slot] -= foam.vy[slot] * dt * drift;
    foam.x[slot] += Math.sin(foam.age[slot] * 3 + foam.wob[slot]) * 9 * dt * drift;
    const dx = foam.x[slot] - 100, dy = foam.y[slot] - 100;
    if (foam.age[slot] >= foam.life[slot] || dx * dx + dy * dy > 78 * 78) pop(foam, slot);
  }
  for (let slot = 0; slot < RINGS; slot++) {
    if (foam.rage[slot] < 0) continue;
    foam.rage[slot] += dt;
    if (foam.rage[slot] > RING_LIFE) foam.rage[slot] = -1;
  }
}

/** A finger at (x, y) in the pool's box pops the biggest bubble under it. Returns true when one popped. */
export function popAt(foam: Foam, x: number, y: number): boolean {
  let best = -1, bestRadius = 0;
  for (let slot = 0; slot < BUBBLES; slot++) {
    if (!foam.alive[slot]) continue;
    const dx = x - foam.x[slot], dy = y - foam.y[slot], reach = foam.r[slot] + 9;
    if (dx * dx + dy * dy <= reach * reach && foam.r[slot] > bestRadius) { best = slot; bestRadius = foam.r[slot]; }
  }
  if (best < 0) return false;
  pop(foam, best);
  return true;
}

/** How many bubbles are up. */
export function alive(foam: Foam): number {
  let count = 0;
  for (let slot = 0; slot < BUBBLES; slot++) count += foam.alive[slot];
  return count;
}

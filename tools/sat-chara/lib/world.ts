// The সাত চাড়া world: constants, the layout a level is made of, and the world the physics steps, built once per round.
// Side view of a lane in scene units (480×320, y down) and seconds. Setup may allocate; the per-step code is physics.hot.ts.

export const W = 480;
export const H = 320;
export const GROUND = 290;
/** The house wall at the far end: stones and the ball bounce back off it. */
export const WALL_X = 470;
export const STONES = 7;

export const BALL_R = 8;
export const HAND_X = 46;
export const HAND_Y = 236;
export const ANGLE_MIN = -12 * Math.PI / 180;
export const ANGLE_MAX = 75 * Math.PI / 180;
export const POWER_MIN = 0.1;
export const SPEED_MIN = 150;
export const SPEED_MAX = 620;

export const STEP = 1 / 60;
export const SUB = 4;
export const G = 640;
/** A throw always settles before this (7 s); tests check real throws settle long before it. */
export const MAX_STEPS = 420;
/** Scene units in one হাত (a forearm, about 45 cm): the lane is about 30 হাত long. */
export const HAAT = 15;

export const STANDING = 0;
export const FLYING = 1;
export const LYING = 2;

/** A heavy piece (a thick bit of a কলসির কানা) weighs this many ordinary ones. */
export const HEAVY_MASS = 2;

/** A stone's centre and size; `heavy` for a কলসির কানা. */
export type Stone = { x: number; y: number; w: number; h: number; heavy?: boolean };
/** [x0, y0, x1, y1]. */
export type Box = readonly [number, number, number, number];
/** 0 a brick, 1 a veranda step (reaches the wall), 2 a জলচৌকি (a low wooden stool). */
export type BlockLook = 0 | 1 | 2;
/** মিঠু: stands at `x`, `tall` units high, and every `period` steps hops `hop` units for `air` steps, starting `phase` steps in. */
export type Guard = { x: number; tall: number; hop: number; period: number; air: number; phase: number };
/** টুনি: `delay` steps after a ball settles she puts one fallen piece back, then one every `every` steps, at most `most` per gap. */
export type Rebuild = { delay: number; every: number; most: number };
/** A clothesline from x0 to x1 at height y: a ball that meets it drops. */
export type Line = { x0: number; x1: number; y: number };

export type Layout = {
  stones: readonly Stone[];
  blocks: readonly Box[];
  looks?: readonly BlockLook[];
  mud?: readonly (readonly [number, number])[];
  line?: Line;
  guard?: Guard;
  rebuild?: Rebuild;
};

export function createWorld(layout: Layout) {
  const n = STONES;
  const w = {
    x: new Float64Array(n), y: new Float64Array(n), w: new Float64Array(n), h: new Float64Array(n),
    a: new Float64Array(n), vx: new Float64Array(n), vy: new Float64Array(n), va: new Float64Array(n),
    /** Mass: 1, or HEAVY_MASS for a কলসির কানা. */
    m: new Float64Array(n),
    /** Where each stone stood at the start (টুনি puts it back here), and its pose just before she did (for the drawing). */
    hx: new Float64Array(n), hy: new Float64Array(n),
    fx: new Float64Array(n), fy: new Float64Array(n), fa: new Float64Array(n),
    /** The clock step a stone was put back (−1 never), for the lift-back drawing. */
    backAt: new Int32Array(n).fill(-1),
    state: new Uint8Array(n),
    /** The throw (0, 1, 2) that brought the stone down, or −1 while it stands. */
    downAt: new Int8Array(n).fill(-1),
    /** Up to 4 stones each stone rests on (−1 = empty slot); `onFixed` is 1 when it rests on the ground or a block. */
    sup: new Int8Array(n * 4).fill(-1),
    onFixed: new Uint8Array(n),
    /** Stone indices from the bottom up: the order টুনি stacks them. */
    order: new Uint8Array(n),
    blocks: new Float64Array(layout.blocks.length * 4),
    looks: new Uint8Array(layout.blocks.length),
    mud: new Float64Array((layout.mud?.length ?? 0) * 2),
    hasLine: layout.line ? 1 : 0, lineX0: layout.line?.x0 ?? 0, lineX1: layout.line?.x1 ?? 0, lineY: layout.line?.y ?? 0,
    hasGuard: layout.guard ? 1 : 0,
    guardX: layout.guard?.x ?? 0, guardTall: layout.guard?.tall ?? 0, guardHop: layout.guard?.hop ?? 0,
    guardPeriod: layout.guard?.period ?? 1, guardAir: layout.guard?.air ?? 0, guardPhase: layout.guard?.phase ?? 0,
    hasRebuild: layout.rebuild ? 1 : 0,
    rebuildDelay: layout.rebuild?.delay ?? 0, rebuildEvery: layout.rebuild?.every ?? 1, rebuildMost: layout.rebuild?.most ?? 0,
    bx: HAND_X, by: HAND_Y, bvx: 0, bvy: 0, spin: 0,
    /** 0 in the hand, 1 in flight, 2 done (stopped, out, or caught). */
    ball: 0, rest: 0,
    /** 1 while মিঠু holds the ball he caught. */
    held: 0,
    throwNo: 0, steps: 0,
    /** Steps since the round began (aiming included): মিঠু's hop and টুনি's hands follow it. */
    clock: 0,
    /** Steps spent aiming since the last ball settled, and pieces টুনি put back in this gap. */
    idle: 0, backNow: 0,
    /** Counters the screen turns into sounds, puffs and stats. */
    knocks: 0, kicks: 0, ballHits: 0, grazes: 0, lands: 0, thuds: 0, bounces: 0, splats: 0, lineHits: 0, caught: 0, restacked: 0,
    landX: 0, landY: 0, hitX: 0, hitY: 0, grazeI: -1,
    /** The furthest any stone came to rest from where it stood (scene units). */
    maxFly: 0,
    dirty: false,
  };
  layout.stones.forEach((stone, i) => {
    w.x[i] = w.hx[i] = stone.x; w.y[i] = w.hy[i] = stone.y; w.w[i] = stone.w; w.h[i] = stone.h;
    w.m[i] = stone.heavy ? HEAVY_MASS : 1;
  });
  layout.blocks.forEach((block, i) => { w.blocks.set(block, i * 4); w.looks[i] = layout.looks?.[i] ?? (block[2] >= WALL_X - 0.5 ? 1 : 0); });
  layout.mud?.forEach(([x0, x1], i) => { w.mud[i * 2] = x0; w.mud[i * 2 + 1] = x1; });
  for (let i = 0; i < n; i++) {
    const bottom = w.y[i] + w.h[i] / 2, left = w.x[i] - w.w[i] / 2, right = w.x[i] + w.w[i] / 2;
    if (Math.abs(bottom - GROUND) < 0.6) w.onFixed[i] = 1;
    for (let b = 0; b < w.blocks.length; b += 4) {
      if (Math.abs(bottom - w.blocks[b + 1]) < 0.6 && Math.min(right, w.blocks[b + 2]) - Math.max(left, w.blocks[b]) > 0.5) w.onFixed[i] = 1;
    }
    let slot = 0;
    for (let j = 0; j < n && slot < 4; j++) {
      if (j === i) continue;
      const top = w.y[j] - w.h[j] / 2, overlap = Math.min(right, w.x[j] + w.w[j] / 2) - Math.max(left, w.x[j] - w.w[j] / 2);
      if (Math.abs(top - bottom) < 0.6 && overlap > 0.5) w.sup[i * 4 + slot++] = j;
    }
  }
  [...Array(n).keys()].sort((p, q) => w.hy[q] - w.hy[p] || w.hx[p] - w.hx[q]).forEach((index, k) => { w.order[k] = index; });
  return w;
}
export type World = ReturnType<typeof createWorld>;

export const clampAngle = (angle: number) => Math.min(ANGLE_MAX, Math.max(ANGLE_MIN, angle));
export const clampPower = (power: number) => Math.min(1, Math.max(POWER_MIN, power));
export const speedOf = (power: number) => SPEED_MIN + (SPEED_MAX - SPEED_MIN) * clampPower(power);
export const powerOf = (speed: number) => (speed - SPEED_MIN) / (SPEED_MAX - SPEED_MIN);

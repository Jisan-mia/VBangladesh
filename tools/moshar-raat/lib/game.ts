// One night: who flies in when, from where, of what kind, with every mosquito's state in preallocated typed arrays.
// Pure and seeded (makeRng only): the same seed and রাত replay the same mosquitoes on every phone. step.hot.ts moves it.
import { makeRng, pick } from "../../../shared/game-core";
import { BOSS, FAST, GHOST, PLAIN, SWARM, countOf, levelOf, needZaps, type Level } from "./levels";
import { setLeg } from "./step.hot";

export * from "./states";
import { LOST, ON, WON } from "./states";

export type GameEvent = { kind: number; x: number; y: number; t: number; n: number };
const EVENTS = 24;

export type Game = {
  level: number; seed: number; row: Level; hearts: number; n: number; count: number; need: number;
  kind: Uint8Array; state: Uint8Array; door: Uint8Array; part: Uint8Array; hp: Uint8Array; leg: Uint8Array;
  /** Swarm id (−1 for a lone mosquito) and the member's place in it. */
  group: Int16Array; member: Uint8Array;
  at: Float32Array; legAt: Float32Array;
  fx: Float32Array; fy: Float32Array; hx: Float32Array; hy: Float32Array; r: Float32Array; f: Float32Array; ph: Float32Array;
  loiter: Float32Array; enter: Float32Array; tell: Float32Array; dive: Float32Array; speed: Float32Array;
  sx: Float32Array; sy: Float32Array; tx: Float32Array; ty: Float32Array; biteAt: Float32Array; wob: Float32Array; wf: Float32Array;
  ox: Float32Array; oy: Float32Array;
  x: Float32Array; y: Float32Array; px: Float32Array; py: Float32Array; vis: Float32Array; ended: Float32Array; immune: Float32Array;
  /** The last bite of each ঝাঁক (a whole swarm landing is one bite). */
  groupBit: Float32Array;
  /** Scratch for hover(): the point it worked out. */
  qx: number; qy: number;
  t: number; zaps: number; bites: number; slaps: number; combo: number; bestCombo: number; bestMulti: number; swings: number; misses: number;
  boss: number; bossHits: number; lastAt: number; dawnHeld: boolean;
  /** The mosquito nearest its target right now (−1 for none) and how far it is. */
  near: number; nearD: number;
  over: number;
  events: GameEvent[]; eventCount: number;
};

/** The night's units, in arrival order: lone mosquitoes of each kind, ঝাঁক, the boss at its time. The first is plain. */
function units(row: Level, rng: () => number) {
  const lone: number[] = [];
  for (let i = 0; i < row.plain; i++) lone.push(PLAIN);
  for (let i = 0; i < row.fast; i++) lone.push(FAST);
  for (let i = 0; i < row.ghost; i++) lone.push(GHOST);
  for (let i = 0; i < row.swarms; i++) lone.push(SWARM);
  for (let i = lone.length - 1; i > 0; i--) { const j = pick(rng, i + 1); [lone[i], lone[j]] = [lone[j], lone[i]]; }
  // The first two arrivals are plain when there are plain ones, so every night opens with something easy.
  for (let lead = 0; lead < 2; lead++) {
    const plain = lone.indexOf(PLAIN, lead);
    if (plain > lead && row.plain > lead) [lone[lead], lone[plain]] = [lone[plain], lone[lead]];
  }
  if (row.boss) lone.splice(Math.max(1, Math.round(lone.length * row.bossAt)), 0, BOSS);
  return lone;
}

export function createGame(level: number, seed: number, hearts: number): Game {
  const row = levelOf(level), rng = makeRng((seed ^ Math.imul(level, 0x9e3779b1)) >>> 0), list = units(row, rng);
  const n = countOf(level);
  const f32 = () => new Float32Array(n);
  const game: Game = {
    level, seed, row, hearts, n, count: n, need: needZaps(level),
    kind: new Uint8Array(n), state: new Uint8Array(n), door: new Uint8Array(n), part: new Uint8Array(n), hp: new Uint8Array(n), leg: new Uint8Array(n),
    group: new Int16Array(n).fill(-1), member: new Uint8Array(n),
    at: f32(), legAt: f32(), fx: f32(), fy: f32(), hx: f32(), hy: f32(), r: f32(), f: f32(), ph: f32(),
    loiter: f32(), enter: f32(), tell: f32(), dive: f32(), speed: f32(), sx: f32(), sy: f32(), tx: f32(), ty: f32(), biteAt: f32(), wob: f32(), wf: f32(),
    ox: f32(), oy: f32(), x: f32(), y: f32(), px: f32(), py: f32(), vis: new Float32Array(n).fill(1), ended: f32(), immune: f32(),
    groupBit: new Float32Array(Math.max(1, row.swarms)).fill(-9),
    qx: 0, qy: 0,
    t: 0, zaps: 0, bites: 0, slaps: 0, combo: 0, bestCombo: 0, bestMulti: 0, swings: 0, misses: 0,
    boss: -1, bossHits: 0, lastAt: 0, dawnHeld: false, near: -1, nearD: Infinity, over: ON,
    events: Array.from({ length: EVENTS }, () => ({ kind: 0, x: 0, y: 0, t: -9, n: 0 })), eventCount: 0,
  };
  // Arrivals spread over the night, the last a few seconds before dawn so it can still be caught.
  const span = Math.max(1, row.length - 4.6), gap = list.length > 1 ? span / (list.length - 1) : 0;
  let i = 0, swarmId = 0;
  list.forEach((kind, unit) => {
    const at = Math.max(0.5, 0.5 + unit * gap + (unit ? (rng() - 0.5) * gap * 0.4 : 0));
    const door = pick(rng, row.entries);
    const size = kind === SWARM ? row.swarm : 1, id = kind === SWARM ? swarmId++ : -1;
    for (let m = 0; m < size; m++, i++) {
      game.kind[i] = kind; game.door[i] = door; game.group[i] = id; game.member[i] = m;
      game.at[i] = at + m * 0.07;
      game.hp[i] = kind === BOSS ? row.boss : 1;
      if (kind === BOSS) game.boss = i;
      // Where it comes in, then the first leg from there.
      const spawnX = door === 0 ? 48 + rng() * 48 : door === 1 ? -14 : 334 + rng() * 10;
      const spawnY = door === 0 ? 108 + rng() * 54 : door === 1 ? 300 + rng() * 110 : 152 + rng() * 14;
      setLeg(game, i, game.at[i], spawnX, spawnY, false);
    }
  });
  game.lastAt = n ? Math.max(...Array.from(game.at)) : 0;
  return game;
}

/** ★ the night is over before the bites run out · ★ three in four zapped · ★ not one bite. 0 for a lost night. */
export function starsOf(level: number, zaps: number, bites: number, won = true) {
  if (!won) return 0;
  return 1 + (zaps >= needZaps(level) ? 1 : 0) + (bites === 0 ? 1 : 0);
}
export const gameStars = (game: Game) => starsOf(game.level, game.zaps, game.bites, game.over === WON);

/** Seconds left until dawn, rounded up, for the HUD. */
export const toDawn = (game: Game) => Math.max(0, Math.ceil(game.row.length - game.t));

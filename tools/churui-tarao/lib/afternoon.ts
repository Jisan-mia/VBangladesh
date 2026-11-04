// One afternoon: who flies in when, from which side, of what kind and where it lands, with every bird's state in
// preallocated typed arrays. Pure and seeded (makeRng only): the same seed and ক্ষেত replay the same birds on every phone.
// step.hot.ts moves it.
import { makeRng, starsFor } from "../../../shared/game-core";
import { FIELD, FIRST_PECK, LOOKBACK, MIN_GAP, SPREAD, TOGETHER, clampX, clampY, nearScarecrow } from "./field";
import { biteOf, levelOf, BOSS, ESCORTS, HP, MUNIA, PACE, SHALIK, SPARROW, type Level } from "./levels";
import { sendEscorts } from "./step.hot";

export * from "./states";
import { LOST } from "./states";

/** The field starts full: grain is a plain percent. */
export const GRAIN = 100;

export type GameEvent = { kind: number; x: number; y: number; t: number; n: number };
const EVENTS = 32;

export type Game = {
  level: number; seed: number; mode: number; row: Level; bite: number;
  /** Birds in the afternoon (a boss counted once). */
  n: number;
  kind: Uint8Array; state: Uint8Array; hp: Uint8Array; leg: Uint8Array; via: Uint8Array;
  /** The side it flies in from (−1 left, 1 right) and the way it flees. */
  side: Int8Array; flee: Int8Array;
  /** Flock id (−1 for a bird on its own). */
  group: Int16Array;
  ate: Uint16Array;
  /** When it sets off, lands, how long it flies; where it sits; where a hop or a boss's move starts; how high it flies in. */
  t0: Float64Array; land: Float64Array; fly: Float64Array; x: Float64Array; y: Float64Array; fromX: Float64Array; fromY: Float64Array; skyY: Float64Array;
  nextPeck: Float64Array; lastPeck: Float64Array; every: Float64Array; shooAt: Float64Array; moveAt: Float64Array; immune: Float64Array;
  t: number; grain: number; shooed: number; claps: number; misses: number; combo: number; bestCombo: number; bestMulti: number; pecks: number;
  boss: number; bossHits: number; lastLand: number; duskHeld: boolean;
  /** The boss's পাল: the first escort's slot (−1 for none) and how many land with it each time. */
  escort: number; perLeg: number;
  /** The lowest tenth of grain the afternoon has dropped into (for the bottom-edge pulse). */
  tenth: number;
  over: number;
  events: GameEvent[]; eventCount: number;
};

type Unit = { kind: number; size: number; at: number; side: number };

/** How many sparrows and শালিক land together this far (0..1) into the afternoon: singles, then pairs, then threes. */
export function groupSize(progress: number, most: number, roll: number) {
  if (most <= 1 || progress < 0.22) return 1;
  if (most === 2 || progress < 0.55) return 2;
  return roll < 0.55 ? 3 : 2;
}

/** The afternoon's arrivals: lone birds and groups, মুনিয়া flocks, the boss at its time. The first two are lone sparrows. */
function units(row: Level, rng: () => number): Unit[] {
  const list: Unit[] = [], end = row.length - 2.4, bossAt = row.boss ? Math.min(end, row.length * row.bossAt) : Infinity;
  let bossDone = row.boss === 0;
  for (let t = 1; t < end;) {
    const progress = t / row.length;
    const side = row.sides === 1 ? -1 : rng() < 0.5 ? -1 : 1;
    if (!bossDone && t >= bossAt) {
      list.push({ kind: BOSS, size: 1, at: t, side });
      bossDone = true;
      t += 2.4;
      continue;
    }
    let unit: Unit;
    if (row.munia > 0 && list.length >= 2 && rng() < row.munia) unit = { kind: MUNIA, size: row.flock, at: t, side };
    else unit = { kind: SPARROW, size: list.length < 2 ? 1 : groupSize(progress, row.group, rng()), at: t, side };
    list.push(unit);
    const pace = row.gap[0] + (row.gap[1] - row.gap[0]) * progress;
    const factor = unit.kind === MUNIA ? 1.25 + row.flock * 0.12 : unit.size === 1 ? 1 : unit.size === 2 ? 1.45 : 1.8;
    t += pace * factor * (0.85 + rng() * 0.3);
  }
  if (!bossDone) list.push({ kind: BOSS, size: 1, at: Math.min(end, bossAt), side: -1 });
  return list;
}

export function createGame(level: number, seed: number, mode: number): Game {
  const row = levelOf(level), rng = makeRng((seed ^ Math.imul(level, 0x9e3779b1)) >>> 0), list = units(row, rng);
  let n = 0;
  for (const unit of list) n += unit.size;
  const perLeg = row.boss ? ESCORTS[row.world].count : 0, regular = n;
  n += row.boss * perLeg;
  const f64 = () => new Float64Array(n);
  const game: Game = {
    level, seed, mode, row, bite: biteOf(mode), n,
    kind: new Uint8Array(n), state: new Uint8Array(n), hp: new Uint8Array(n), leg: new Uint8Array(n), via: new Uint8Array(n),
    side: new Int8Array(n), flee: new Int8Array(n), group: new Int16Array(n).fill(-1), ate: new Uint16Array(n),
    t0: f64(), land: f64(), fly: f64(), x: f64(), y: f64(), fromX: f64(), fromY: f64(), skyY: f64(),
    nextPeck: f64(), lastPeck: new Float64Array(n).fill(-9), every: f64(), shooAt: new Float64Array(n).fill(-9), moveAt: f64(), immune: f64(),
    t: 0, grain: GRAIN, shooed: 0, claps: 0, misses: 0, combo: 0, bestCombo: 0, bestMulti: 0, pecks: 0,
    boss: -1, bossHits: 0, lastLand: 0, duskHeld: false, escort: perLeg ? regular : -1, perLeg, tenth: 10, over: 0,
    events: Array.from({ length: EVENTS }, () => ({ kind: 0, x: 0, y: 0, t: -9, n: 0 })), eventCount: 0,
  };

  // Rejection sampling: birds arriving close together sit MIN_GAP apart; among the spots that do, the one farthest from
  // everything that landed lately wins, so a crowded moment still spreads out.
  let placed = 0;
  const place = (at: number, gap: number) => {
    let bestX = 180, bestY = (FIELD.top + FIELD.bottom) / 2, bestScore = -1;
    for (let tries = 0; tries < 40 && bestScore < 1000 + SPREAD; tries++) {
      const x = FIELD.left + 8 + rng() * (FIELD.right - FIELD.left - 16), y = FIELD.top + 6 + rng() * (FIELD.bottom - FIELD.top - 12);
      if (nearScarecrow(x, y)) continue;
      let near = 999, recent = 999;
      for (let j = 0; j < placed; j++) {
        const d = Math.hypot(game.x[j] - x, game.y[j] - y), ago = at - game.land[j];
        if (ago < TOGETHER) near = Math.min(near, d);
        if (ago < LOOKBACK) recent = Math.min(recent, d);
      }
      const score = near >= gap ? 1000 + Math.min(recent, SPREAD) : near;
      if (score > bestScore) { bestX = x; bestY = y; bestScore = score; }
    }
    return [bestX, bestY] as const;
  };

  let flockId = 0;
  for (const unit of list) {
    const flock = unit.kind === MUNIA ? flockId++ : -1;
    const [cx, cy] = unit.kind === MUNIA ? place(unit.at, MIN_GAP + row.spread) : [0, 0];
    for (let m = 0; m < unit.size; m++) {
      const i = placed;
      let kind = unit.kind;
      if (kind === SPARROW && placed >= 2 && rng() < row.shalik) kind = SHALIK;
      const at = unit.at + (unit.kind === MUNIA ? m * 0.06 : m * (0.22 + rng() * 0.14));
      let x: number, y: number;
      if (unit.kind === MUNIA) {
        // A flock sits around one spot: one in the middle, the rest in a ring.
        const angle = (m / unit.size) * Math.PI * 2 + rng() * 0.6, r = m === 0 ? 0 : row.spread * (0.65 + rng() * 0.35);
        x = clampX(cx + Math.cos(angle) * r); y = clampY(cy + Math.sin(angle) * r * 0.75);
        // A bird of the ring that would sit at the কাকতাড়ুয়ার feet sits on the other side of the flock instead.
        if (nearScarecrow(x, y)) { x = clampX(cx - (x - cx)); y = clampY(cy - (y - cy)); }
      } else [x, y] = place(at, MIN_GAP);
      game.kind[i] = kind; game.group[i] = flock; game.side[i] = unit.side; game.flee[i] = unit.side === -1 ? 1 : -1;
      game.hp[i] = kind === BOSS ? row.boss : HP[kind];
      game.fly[i] = kind === BOSS ? row.fly * 1.3 : unit.kind === MUNIA ? row.fly * 0.9 : row.fly;
      game.land[i] = at; game.t0[i] = at - game.fly[i];
      game.x[i] = x; game.y[i] = y; game.skyY[i] = 40 + rng() * 90;
      game.every[i] = row.every * PACE[kind];
      game.nextPeck[i] = at + FIRST_PECK;
      if (kind === BOSS) game.boss = i;
      if (at > game.lastLand) game.lastLand = at;
      placed++;
    }
  }
  // The পাল's slots wait until the boss lands (each landing sends its own); the first lands with its arrival.
  for (let i = regular; i < n; i++) {
    const kind = ESCORTS[row.world].kind, leg = Math.floor((i - regular) / perLeg);
    game.kind[i] = kind; game.hp[i] = HP[kind]; game.every[i] = row.every * PACE[kind];
    game.group[i] = kind === MUNIA ? flockId + leg : -1;
    game.t0[i] = Infinity; game.land[i] = Infinity; game.fly[i] = row.fly;
  }
  if (perLeg) sendEscorts(game, 0);
  return game;
}

/** ★ the grain left at dusk reaches the pass mark · ★★ and ★★★ the higher marks. 0 for a lost ক্ষেত. */
export function starsOf(level: number, grain: number, over = 1) {
  const { pass, two, three } = levelOf(level);
  if (over === LOST || grain < pass) return 0;
  return starsFor(grain, three, two);
}
export const gameStars = (game: Game) => starsOf(game.level, game.grain, game.over);

/** The next mark above `grain` (pass, ★★ or ★★★), or null at ★★★. */
export function nextMark(level: number, grain: number) {
  const { pass, two, three } = levelOf(level);
  return grain < pass ? pass : grain < two ? two : grain < three ? three : null;
}

/** Seconds left until dusk, rounded up, for the HUD. */
export const toDusk = (game: Game) => Math.max(0, Math.ceil(game.row.length - game.t));

/** Kinds by name, for readers that don't import levels.ts. */
export { SPARROW, SHALIK, MUNIA, BOSS };

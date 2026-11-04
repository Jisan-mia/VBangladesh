// The balloon, the street and everything on it: pure rules, no drawing, no clock but the game's own.
// Same seed + same mode + same presses = the same run on every phone. The per-step rules live in step.hot.ts.
import { makeRng } from "../../../shared/game-core";
import { levelDef, MODE_INFO, type LevelDef, type Mode } from "./levels";

/** The street in its own units. VW is the nominal view: crows enter at its right edge. The lane is VH high. */
export const VW = 360, VH = 520;
/** The pavement (falling onto it pops) and the mesh of cables over the lane (rising into it pops too). */
export const GROUND = 480, CEIL = 24;
/** The balloon's spot across the screen; the street scrolls under it. */
export const BX = 96, START_Y = 252;
/** Drawn radius, the smaller radius that touches (a near miss should feel like one), and the wider one that scrapes. */
export const R = 15, HIT = 11.5, GRAZE = 19;
/**
 * A balloon is all drag. Let go and it settles into a sink of SINK / DRAG (130 u/s); hold and it settles into a climb of
 * (LIFT − SINK) / DRAG (160 u/s), each within about a third of a second. A fresh press adds a small kick upwards.
 */
export const SINK = 390, LIFT = 870, DRAG = 3, KICK = 40, MAX_RISE = 230;
/** "ধীরে খেলো" slows the whole clock, so the street keeps the exact shape it has at full speed. */
export const SLOW = 0.7;
export const POP_TIME = 0.6, END_TIME = 1.4;
export const FIRST_X = 270;
/** A crow's body that pops the balloon (drawn a little bigger, so a near miss looks like one). */
export const CROW_R = 7, BOSS_R = 12;
/** Seconds of edge warning before a crow flies in or a gust starts (× the mode's warn). */
export const CROW_WARN = 0.9, BOSS_WARN = 1.2, GUST_WARN = 0.9;
/** A crow appears this far right of the street's left edge, just outside the nominal view. */
export const SPAWN = VW + 24;
/** A diver starts this much above where it aims, and comes down onto it. */
export const DIVE = 52;
const CROW_SPEED = 140, BOSS_SPEED = 158;
/** In the plan only: a flock of three flyers. */
const FLOCK = 9;
/** How fast the next gap may sit higher or lower, in units a second: well under a held climb or a free sink. */
const CLIMB = 96, DROP = 96;
const TAU = Math.PI * 2;

export const READY = 0, FLY = 1, POP = 2, END = 3, OVER = 4;
/** Why a balloon popped. */
export const NONE = 0, WIRE = 1, STREET = 2, CROW = 3, MESH = 4;
export const FLYER = 0, DIVER = 1, BOSS_CROW = 2;
export const PENDING = 0, WARN = 1, FLYING = 2, GONE = 3;
/** What happened during a step, for the component's sounds and juice. */
export const E = { START: 1, PASS: 2, SCRAPE: 3, POP: 4, CROW_WARN: 5, CROW_PASS: 6, GUST_WARN: 7, GUST_END: 8, KNOT: 9, BOSS: 10, RESPAWN: 11, WIN: 12, OVER: 13 } as const;
export const EVENTS = 24;

/**
 * One crossing over the lane. Above the gap a loop of slack cable hangs from the roofs; below it, wires are strung
 * between two poles. Both sag and tilt alike, so the gap is a slanted channel, narrowest in the middle. A swinging
 * crossing's middle rises and falls with the street (`swing` units, `freq` radians a unit), so it is the same at any speed.
 */
export type Gate = {
  x: number; w: number; y: number; gap: number; k: number; sagTop: number; sagLow: number;
  swing: number; freq: number; phase: number;
  /** One of a finale tangle's knots. */
  knot: boolean;
  /** Decoration only: crows perched on the pole wire (0-2), where, and a caught kite (-1 for none, else its colour). */
  perch: number; sitters: number; kite: number;
};

/** A crow, as planned: when it is called (street distance `at`), where it should meet the balloon (`hit`), at what height. */
export type CrowPlan = { kind: number; at: number; hit: number; y: number; speed: number; r: number; warn: number };
/** A gust over a stretch of street: it swells and fades (sin²) between `at` and `at + length`. + pushes down. */
export type Gust = { at: number; length: number; strength: number; boss: boolean };

export type Game = {
  seed: number; level: number; mode: Mode; def: LevelDef;
  /** Crossings to clear (all of them; যত দূর পারো never ends). */
  goal: number; endless: boolean;
  gates: readonly Gate[];
  /** Each crossing's middle right now (swinging ones move). */
  cy: Float64Array;
  crows: readonly CrowPlan[];
  cState: Uint8Array; cX: Float64Array; cY: Float64Array; cTy: Float64Array; cT: Float64Array;
  gusts: readonly Gust[];
  gState: Uint8Array;
  phase: number;
  /** A fresh balloon waiting after a pop (the street rolled back). */
  respawn: boolean;
  dist: number; y: number; vy: number;
  /** The game's own clock, and seconds of flying (the time on the card). */
  time: number; flyTime: number;
  hold: boolean; puffAt: number; popAt: number; popped: number; endAt: number;
  balloons: number; lost: number;
  score: number; next: number;
  /** Crossings scraped, the last one scraped, clean crossings in a row and the best run. */
  grazes: number; grazedAt: number; streak: number; bestStreak: number;
  crowsDodged: number; gustsRidden: number;
  /** The wind's push right now, a gust coming (−1 up, +1 down, 0 none) and the balloon's clearance to the nearest wire. */
  wind: number; gustSoon: number; near: number;
  /** A finale's notches left of `bossMax`. */
  bossLeft: number; bossMax: number;
  won: boolean;
  ev: Uint8Array; evX: Float32Array; evY: Float32Array; evCount: number;
};

/* ---------- geometry ---------- */

/** The lowest cable of the hanging loop above the gap at u from −1 (left edge) to 1 (right edge), for a middle at `cy`. */
export const topWire = (gate: Gate, cy: number, u: number) => cy - gate.gap / 2 + gate.k * u - gate.sagTop * u * u;
/** The top wire between the two poles below the gap. */
export const lowWire = (gate: Gate, cy: number, u: number) => cy + gate.gap / 2 + gate.k * u - gate.sagLow * u * u;
/** The middle of the gap at u: what a player aims for. */
export const midline = (gate: Gate, cy: number, u: number) => cy + gate.k * u - (gate.sagTop + gate.sagLow) / 2 * u * u;
/** A crossing's middle at a street distance. */
export const gateY = (gate: Gate, dist: number) => gate.swing ? gate.y + gate.swing * Math.sin(gate.phase + dist * gate.freq) : gate.y;

/** True when a circle at (bx, by) touches the crossing: above the hanging loop or below the pole wire, anywhere across it. */
export function touchesGate(gate: Gate, cy: number, bx: number, by: number, radius: number) {
  const from = Math.max(bx - radius, gate.x - gate.w), to = Math.min(bx + radius, gate.x + gate.w);
  if (from > to) return false;
  for (let i = 0; i <= 8; i++) {
    const px = from + (to - from) * i / 8, dx = px - bx;
    const half = Math.sqrt(Math.max(0, radius * radius - dx * dx)), u = (px - gate.x) / gate.w;
    if (by - half < topWire(gate, cy, u) || by + half > lowWire(gate, cy, u)) return true;
  }
  return false;
}

/** How far the balloon's edge is from the nearest wire (the crossing it is in or about to enter, and the mesh overhead). */
export function clearance(game: Game) {
  const bx = game.dist + BX;
  let best = game.y - HIT - CEIL;
  for (let i = Math.max(0, game.next - 1); i <= game.next && i < game.gates.length; i++) {
    const gate = game.gates[i];
    if (bx < gate.x - gate.w - 30 || bx > gate.x + gate.w + 10) continue;
    const u = Math.max(-1, Math.min(1, (bx - gate.x) / gate.w)), cy = game.cy[i];
    const free = Math.min(game.y - topWire(gate, cy, u), lowWire(gate, cy, u) - game.y) - HIT;
    if (free < best) best = free;
  }
  return Math.max(0, best);
}

/** Where a player should be at street x (world units): the gap's middle inside a crossing, a straight line between them. */
export function racingLine(game: Game, x: number) {
  const gates = game.gates;
  let i = game.next > 0 ? game.next - 1 : 0;
  while (i < gates.length - 1 && gates[i].x + gates[i].w < x) i++;
  const gate = gates[i];
  if (x >= gate.x - gate.w) return midline(gate, gateY(gate, x - BX), Math.min(1, (x - gate.x) / gate.w));
  const before = i > 0 ? gates[i - 1] : null;
  const fromX = before ? before.x + before.w : BX, fromY = before ? midline(before, gateY(before, x - BX), 1) : START_Y;
  const toX = gate.x - gate.w, toY = midline(gate, gateY(gate, x - BX), -1);
  return fromY + (toY - fromY) * Math.max(0, Math.min(1, (x - fromX) / Math.max(1, toX - fromX)));
}

/** The street's speed: steady on a level; যত দূর পারো speeds up a little with every crossing. */
export const speedOf = (game: Pick<Game, "def" | "endless" | "next">) => game.def.speed + (game.endless ? Math.min(28, game.next * 0.35) : 0);

/* ---------- the course ---------- */

const gapOf = (def: LevelDef, index: number, endless: boolean, mode: Mode) =>
  (endless ? Math.max(def.floor, def.gap - index * 0.6) : Math.max(def.floor, def.gap - Math.max(0, index - 2) * 1.6)) + MODE_INFO[mode].gap;

/** যত দূর পারো's features by crossing: tilt, swing and what may come in the stretch after it. */
const endlessTilt = (index: number) => Math.min(24, 8 + index * 0.25);
const endlessSwing = (index: number) => index >= 30 ? Math.min(26, 12 + (index - 30) * 0.5) : 0;

/** Every crossing. Always draws eleven numbers each, so the mode changes the gap sizes but never which wires come. */
export function makeGates(seed: number, value: number, mode: Mode): Gate[] {
  const def = levelDef(value), endless = value === 0, rng = makeRng(seed), gates: Gate[] = [];
  let prev: Gate | null = null;
  for (let index = 0; index < def.crossings; index++) {
    const r = Array.from({ length: 11 }, rng);
    const knot = !endless && def.knots > 0 && index >= def.crossings - def.knots;
    const early = index < 2, closeTwin = def.pairs && index % 2 === 1;
    const gap = gapOf(def, index, endless, mode) + (knot ? 6 : 0);
    const w = knot ? 40 + r[1] * 6 : 44 + r[1] * 18;
    const spacing = !prev ? 0
      : knot && prev.knot ? prev.w + w + 22 + r[0] * 10
      : closeTwin ? prev.w + w + 46 + r[0] * 18
      : (early ? 215 : 184 + r[0] * 56) + (endless ? Math.min(30, index) : def.space);
    const x = prev ? prev.x + spacing : FIRST_X;
    const tiltMax = endless ? endlessTilt(index) : def.tilt;
    const k = (r[2] * 2 - 1) * (early || knot ? Math.min(6, tiltMax) : tiltMax);
    const sagTop = 12 + r[4] * 14, sagLow = 3 + r[5] * 8, bend = (sagTop + sagLow) / 2;
    const swingMax = endless ? endlessSwing(index) : def.swing;
    const swing = swingMax && index > 0 && !knot ? swingMax * (0.75 + 0.25 * r[9]) : 0;
    let lo = CEIL + 30 + gap / 2 + Math.abs(k) + swing, hi = GROUND - 58 - gap / 2 - Math.abs(k) - swing;
    const from = prev ? prev.y : START_Y;
    const reach = index === 0 ? 14 : knot ? 26 : early ? Math.min(def.reach, 60) : endless ? 140 : def.reach;
    lo = Math.max(lo, from - reach); hi = Math.min(hi, from + reach);
    if (prev) {
      // Never an impossible climb: the time from the last gap's exit to this one's entry, less a breath to react.
      const seconds = Math.max(0, (x - prev.x - (prev.w + w) / 2) / (def.speed + (endless ? Math.min(28, index * 0.35) : 0)) - 0.25);
      const exit = prev.y + prev.k - (prev.sagTop + prev.sagLow) / 2, rate = swing || prev.swing ? 0.8 : 1;
      lo = Math.max(lo, exit - CLIMB * rate * seconds + k + bend + prev.swing);
      hi = Math.min(hi, exit + DROP * rate * seconds + k + bend - prev.swing);
    }
    // An S-bend: the twin sits on the far side from its partner.
    const pick = closeTwin ? (from - lo > hi - from ? 0.15 + 0.15 * r[3] : 0.85 - 0.15 * r[3]) : r[3];
    const y = hi < lo ? (lo + hi) / 2 : lo + pick * (hi - lo);
    const gate: Gate = {
      x, w, y, gap, k, sagTop, sagLow, swing, freq: TAU / (260 + r[9] * 120), phase: r[10] * TAU, knot,
      perch: r[7], sitters: knot ? 0 : r[6] < 0.2 ? 2 : r[6] < 0.55 ? 1 : 0, kite: r[8] < 0.3 ? Math.floor(r[8] * 30) % 3 : -1,
    };
    gates.push(gate);
    prev = gate;
  }
  return gates;
}

/** The open street between crossing i and i + 1 (world x), or null when they're too close for a crow. */
function stretch(gates: readonly Gate[], index: number) {
  const a = gates[index], b = gates[index + 1];
  if (!a || !b || a.knot || b.knot) return null;
  const from = a.x + a.w, to = b.x - b.w;
  if (to - from < 90) return null;
  // The meeting point sits mid-stretch: out of the last crossing to move, and time to get back on line for the next.
  const x = from + (to - from) * 0.5, exit = midline(a, a.y, 1), entry = midline(b, b.y, -1);
  return { x, line: exit + (entry - exit) * 0.5 };
}

const clampY = (y: number) => Math.max(CEIL + 26, Math.min(GROUND - 32, y));

/** The crows, each timed to meet the balloon in the middle of an open stretch, never inside a crossing. */
export function makeCrows(seed: number, value: number, mode: Mode, gates: readonly Gate[]): CrowPlan[] {
  const def = levelDef(value), endless = value === 0, info = MODE_INFO[mode], rng = makeRng(seed * 31 + 7 + value);
  const plans: CrowPlan[] = [];
  const add = (kind: number, index: number, offset: number) => {
    const spot = stretch(gates, index);
    if (!spot) return;
    const boss = kind === BOSS_CROW;
    const v = def.speed + (endless ? Math.min(28, index * 0.35) : 0), speed = (boss ? BOSS_SPEED : CROW_SPEED) * info.crow;
    const warn = (boss ? BOSS_WARN : CROW_WARN) * info.warn, hit = spot.x - BX;
    const at = hit - v * (warn + (SPAWN - BX) / (v + speed));
    const base = spot.line + offset;
    if (kind === FLOCK) {
      // A flock: three crows, the middle one on your line, the holes 90 apart (wider on সহজ).
      const middle = spot.line + (rng() * 2 - 1) * 22;
      for (const dy of [-1, 0, 1]) {
        const y = middle + dy * (90 + info.gap * 0.5);
        if (y >= CEIL + 26 && y <= GROUND - 32) plans.push({ kind: FLYER, at, hit, y, speed, r: CROW_R * info.body, warn });
      }
      return;
    }
    plans.push({ kind, at, hit, y: clampY(base), speed, r: (boss ? BOSS_R : CROW_R) * info.body, warn });
  };
  if (endless) {
    for (let index = 8; index < gates.length - 1; index++) {
      const roll = rng(), offset = (rng() < 0.5 ? -1 : 1) * (8 + rng() * 12), chance = Math.min(0.55, 0.25 + index * 0.004);
      if (roll > chance) continue;
      add(index >= 26 && roll < chance * 0.3 ? DIVER : index >= 20 && roll < chance * 0.55 ? FLOCK : FLYER, index, offset);
      index++; // never two stretches in a row
    }
    return plans;
  }
  // The level's new kind of crow comes first, then the others in turn.
  const bossKind = def.boss === "goda";
  const main: number[] = [], rest: number[] = [];
  const push = (list: number[], kind: number, count: number) => { for (let i = 0; i < count; i++) list.push(kind); };
  if (def.swoops) push(main, bossKind ? BOSS_CROW : DIVER, def.swoops);
  if (def.flocks) push(def.swoops ? rest : main, FLOCK, def.flocks);
  if (def.flyers) push(def.swoops || def.flocks ? rest : main, FLYER, def.flyers);
  const order: number[] = [];
  while (main.length || rest.length) { if (main.length) order.push(main.shift()!); if (rest.length) order.push(rest.shift()!); }
  if (!order.length) return plans;
  const spots: number[] = [];
  for (let index = 1; index < gates.length - 1; index++) if (stretch(gates, index)) spots.push(index);
  order.forEach((kind, at) => {
    const index = spots[Math.min(spots.length - 1, Math.floor((at + 0.5) * spots.length / order.length))];
    // Just off your line: one way round is short, the other long.
    const offset = (rng() < 0.5 ? -1 : 1) * (8 + rng() * 12);
    if (index === undefined) return;
    add(kind, index, offset);
  });
  return plans;
}

/** The gusts, pushing the way the street goes (so a gust is a push to ride, never a wall), from their own dice. */
export function makeGusts(seed: number, value: number, mode: Mode, gates: readonly Gate[]): Gust[] {
  const def = levelDef(value), endless = value === 0, info = MODE_INFO[mode], rng = makeRng(seed * 17 + 3 + value);
  const gusts: Gust[] = [];
  if (!def.gust && !endless && def.boss !== "jhor") return gusts;
  const last = gates[gates.length - 1], start = gates[endless ? Math.min(gates.length - 1, 16) : 0];
  const direction = (at: number, spread: number) => {
    const index = gates.findIndex(gate => gate.x > at + spread);
    if (index <= 0) return rng() < 0.5 ? -1 : 1;
    const dy = midline(gates[index], gates[index].y, -1) - midline(gates[index - 1], gates[index - 1].y, 1);
    return Math.abs(dy) > 60 ? Math.sign(dy) : rng() < 0.5 ? -1 : 1;
  };
  const bosses: Gust[] = [];
  if (def.boss === "jhor") {
    for (const share of [0.3, 0.56, 0.82]) {
      const at = FIRST_X + (last.x - FIRST_X) * share - 150;
      bosses.push({ at, length: 300, strength: direction(at, 150) * 250 * info.gust, boss: true });
    }
  }
  const push = endless ? 0 : def.gust * info.gust, every = endless ? 600 : def.every;
  for (let at = start.x + start.w + 40 + rng() * 120; at < last.x - 60; at += every * (0.8 + rng() * 0.5)) {
    const length = 140 + rng() * 90, roll = rng();
    const strength = (endless ? Math.min(240, 140 + gates.findIndex(gate => gate.x > at) * 0.8) * info.gust : push) * (0.65 + 0.35 * roll);
    if (bosses.some(boss => at < boss.at + boss.length + 60 && at + length > boss.at - 60)) continue;
    gusts.push({ at, length, strength: direction(at, length / 2) * strength, boss: false });
  }
  return [...gusts, ...bosses].sort((a, b) => a.at - b.at);
}

export function createGame(seed: number, value = 1, mode: Mode = "n"): Game {
  const def = levelDef(value), endless = value === 0;
  const gates = makeGates(seed, value, mode);
  const crows = makeCrows(seed, value, mode, gates);
  const gusts = makeGusts(seed, value, mode, gates);
  const balloons = MODE_INFO[mode].balloons;
  const bossMax = def.boss === "jot" ? def.knots : def.boss === "goda" ? def.swoops : def.boss === "jhor" ? gusts.filter(gust => gust.boss).length : 0;
  const game: Game = {
    seed, level: endless ? 0 : value, mode, def, goal: gates.length, endless, gates, cy: new Float64Array(gates.length),
    crows, cState: new Uint8Array(crows.length), cX: new Float64Array(crows.length), cY: new Float64Array(crows.length), cTy: new Float64Array(crows.length), cT: new Float64Array(crows.length),
    gusts, gState: new Uint8Array(gusts.length),
    phase: READY, respawn: false, dist: 0, y: START_Y, vy: 0, time: 0, flyTime: 0,
    hold: false, puffAt: -1, popAt: -1, popped: NONE, endAt: -1,
    balloons, lost: 0, score: 0, next: 0, grazes: 0, grazedAt: -1, streak: 0, bestStreak: 0, crowsDodged: 0, gustsRidden: 0,
    wind: 0, gustSoon: 0, near: Infinity, bossLeft: bossMax, bossMax, won: false,
    ev: new Uint8Array(EVENTS), evX: new Float32Array(EVENTS), evY: new Float32Array(EVENTS), evCount: 0,
  };
  for (let i = 0; i < gates.length; i++) game.cy[i] = gateY(gates[i], 0);
  return game;
}

export function emit(game: Game, kind: number, x: number, y: number) {
  if (game.evCount >= EVENTS) return;
  game.ev[game.evCount] = kind; game.evX[game.evCount] = x; game.evY[game.evCount] = y;
  game.evCount++;
}

/**
 * A spare balloon after a pop: the street rolls back to just past the last crossing passed, the balloon waits at the next
 * gap's height for a press. Crows that would meet it before it could see them fly off (a finale's swoop counts as gone);
 * gusts still ahead blow again.
 */
export function respawn(game: Game) {
  const before = game.next > 0 ? game.gates[game.next - 1] : null, ahead = game.gates[Math.min(game.gates.length - 1, game.next)];
  game.dist = before ? before.x + before.w + 16 - BX : 0;
  for (let i = 0; i < game.gates.length; i++) game.cy[i] = gateY(game.gates[i], game.dist);
  game.y = before ? Math.max(CEIL + 40, Math.min(GROUND - 40, midline(ahead, gateY(ahead, game.dist), -1))) : START_Y;
  // Marked held, so a finger still down from the pop must lift and press again.
  game.vy = 0; game.phase = READY; game.respawn = true; game.hold = true;
  const v = speedOf(game);
  for (let i = 0; i < game.crows.length; i++) {
    const plan = game.crows[i], soon = game.dist + v * (plan.warn + (SPAWN - BX) / (v + plan.speed)) + 30;
    if (plan.hit < game.dist) { game.cState[i] = GONE; continue; }
    if (plan.hit < soon) {
      if (game.cState[i] !== GONE && plan.kind === BOSS_CROW) game.bossLeft = Math.max(0, game.bossLeft - 1);
      game.cState[i] = GONE;
    } else game.cState[i] = PENDING;
  }
  for (let i = 0; i < game.gusts.length; i++) {
    const gust = game.gusts[i];
    if (gust.at + gust.length > game.dist) game.gState[i] = PENDING;
  }
  game.wind = 0; game.gustSoon = 0;
  emit(game, E.RESPAWN, BX, game.y);
}

/** A deep copy (tests and the solver branch on it). Plans and crossings never change, so they're shared. */
export function cloneGame(game: Game): Game {
  return {
    ...game, cy: game.cy.slice(), cState: game.cState.slice(), cX: game.cX.slice(), cY: game.cY.slice(), cTy: game.cTy.slice(), cT: game.cT.slice(),
    gState: game.gState.slice(), ev: game.ev.slice(), evX: game.evX.slice(), evY: game.evY.slice(),
  };
}

/** Tenths of a second, for the card and the link. */
export const tenthsOf = (seconds: number) => Math.max(1, Math.round(seconds * 10));

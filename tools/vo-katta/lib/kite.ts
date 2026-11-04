// Rules for ভো-কাট্টা: your kite, the rival kites from the other roofs, the strings between them and the প্যাঁচ.
// Pure and seeded (makeRng only). createGame sets up an evening; step.hot.ts advances it 60 times a second.
// A string is a quadratic curve from a hand on a roof up to the kite: it sags and leans downwind when slack and runs
// nearly straight when taut. When two strings cross they hook, and the tug decides whose string gives.
import { makeRng } from "../../../shared/game-core";
import { LEVELS, levelDef, MODE_INFO, RIVALS, type LevelDef, type Mode, type RivalDef, type RivalKind } from "./levels";

/** The sky is always 360 × 500 world units, scaled to the screen, so every phone plays the same sky. */
export const W = 360;
export const H = 500;
/** Where kites may fly: above the roofs, inside the edges. The sky reaches above the world's top (y < 0) so a kite can fly high. */
export const SKY = { left: 22, right: 338, top: -70, bottom: 322 } as const;
/** The highest point every screen must show (a little above SKY.top), so the whole sky is always in view. */
export const VIEW_TOP = -110;
/** Your hand on the near roof, and where a fresh kite of yours settles. */
export const HAND = { x: 172, y: 432 } as const;
export const HOME = { x: 160, y: 100 } as const;
/** The rival roofs; the hands sit just above each parapet. Homes are where that roof's kites like to hover. */
export const ROOFS = [
  { x: 300, y: 402, hx: [232, 304], hy: [10, 150] },
  { x: 50, y: 394, hx: [58, 140], hy: [0, 140] },
  { x: 250, y: 380, hx: [196, 300], hy: [-30, 110] },
] as const;

/* ---- the tension and the tug ---- */
/** The green band of the tension meter. */
export const LO = 0.45;
export const HI = 0.8;
/** টান fills the meter in about 0.9 s; letting go empties it a little slower. */
export const PULL = 1.1;
export const EASE = 0.9;
const SLACK_EDGE = 0.3;
const OVER_EDGE = 0.25;
/** Moving your kite while hooked and taut rubs the strings: up to this much extra edge. */
export const SAW_MAX = 0.35;
export const SAW_SPEED = 240;
export const TUG_RATE = 1.0;
/** While hooked, both kites stay this close to the hook (or as far as they already were when it caught). */
export const REACH = 120;

/* ---- your kite's flight ---- */
/** How hard the kite heads for your aim: weak when slack, strong when taut. */
export const FOLLOW_MIN = 0.6;
export const FOLLOW_T = 6.4;
/** Top speed: lazy when slack, quick when taut. */
export const SPEED_MIN = 60;
export const SPEED_T = 220;
/** How quickly the kite's velocity turns to what the string and wind ask (1/s). */
export const RESPONSE = 7;
/** A slack kite drifts downwind and sinks; a taut one climbs a little. */
export const DRIFT = 0.9;
export const SINK = 26;
export const LIFT = 10;

/* ---- rivals ---- */
const RIVAL_FOLLOW = 8;
export const ATTACK_TIME = 2.4;
export const ATTACK_BOOST = 1.7;
export const CHARGE_WARN = 0.8;
export const YANK_WARN = 0.65;
/** A yank adds this much to your tension. With your tension above YANK_SAFE when it lands, your string loses YANK_COST of tug. */
export const YANK_ADD = 0.42;
export const YANK_SAFE = 0.55;
export const YANK_COST = 0.32;
export const YANK_GIFT = 0.05;
const DODGE_NEAR = 125;
/** After a champion loses a notch, or after cutting you, a rival keeps away this long. */
export const BACKOFF = 1.6;

/* ---- the evening ---- */
export const FALL_TIME = 1.5;
export const RISE_TIME = 0.95;
/** The cut you made last lingers this long before the result, so its kite can tumble. */
export const END_TIME = 1.3;
/** A cut freezes the sky to HIT_SCALE speed for HIT_STOP seconds (never in slow mode). */
export const HIT_STOP = 0.28;
export const HIT_SCALE = 0.3;
/** Slow mode runs the same game at this speed, with calmer wind. */
export const SLOW = 0.7;
export const CALM = 0.5;

/* ---- weather ---- */
export const GUST_WARN = 0.9;
export const GUST_TIME = 0.45;
export const GUST_FORCE = 420;
export const LANTERNS = 4;
/** Lantern fields: x, y, vx, vy, state (0 none, 1 rising, 2 tangled you). */
export const LF = 5;
export const LANTERN_R = 9;
export const TANGLE_TIME = 1.0;

export const SEGMENTS = 10;
const TAU = Math.PI * 2;

/** Kite states. */
export const FLY = 0, RISE = 1, FALL = 2, GONE = 3;

/** Events the step leaves for the component (sound, juice), in order, with where they happened. */
export const E = {
  START: 1, HOOK: 2, CUT: 3, LOST: 4, RISE: 5, CHARGE: 6, YANK_WARN: 7, YANK_HIT: 8, YANK_OK: 9,
  NOTCH: 10, GUST_WARN: 11, GUST: 12, TANGLE: 13, WIN: 14, FAIL: 15, SPAWN: 16,
} as const;
export const EVENTS = 32;

export type Kite = {
  x: number; y: number; vx: number; vy: number;
  /** Tension, 0 (slack) to 1. */
  t: number;
  state: number;
  /** Seconds left of a rise or a fall. */
  timer: number;
  /** The hand on the roof holding the string. */
  hx: number; hy: number;
  spin: number;
  /** The sampled string, hand to kite (x0, y0, x1, y1, …). */
  line: Float32Array;
};

export type Rival = Kite & {
  slot: number;
  /** Which rival of the level's list this is (−1: the slot is empty). */
  entry: number;
  kind: RivalKind;
  def: RivalDef;
  roof: number;
  homeX: number; homeY: number; phase: number; w1: number; w2: number;
  age: number;
  chargeIn: number; chargeWarn: number; attackLeft: number; ax: number; ay: number;
  yankIn: number; yankWarn: number; yankLeft: number;
  notches: number;
  backoff: number;
  /** Seconds it has been running from you (for the dodger's tell). */
  fleeing: number;
};

/** Where each rival on the list likes to hover (as fractions of its roof's range) and its rhythm, drawn from the seed up front so a link replays the same sky. */
export type Plan = { fx: number; fy: number; phase: number; w1: number; w2: number };

export type Phase = "ready" | "fly" | "end" | "over";

export type Game = {
  seed: number; level: number; mode: Mode;
  def: LevelDef;
  rng: () => number;
  plans: Plan[];
  windBase: number; wind1: number; wind2: number; wind: number;
  phase: Phase;
  won: boolean;
  endLeft: number;
  /** Seconds of play (from the first touch), and of sky (the wind's clock). */
  time: number; total: number;
  slowmo: number;
  you: Kite;
  /** Where your kite is heading. */
  aimX: number; aimY: number;
  pulling: boolean;
  /** Seconds left of a lantern tangle: no টান. */
  tangle: number;
  rivals: [Rival, Rival];
  /** The next rival on the list to rise. */
  next: number;
  cuts: number; lost: number;
  /** Spare kites left on the নাটাই, counting the one in the air. */
  kites: number;
  /** The rival slot hooked with you, or −1. */
  hooked: number;
  hookX: number; hookY: number; reach: number;
  /** −1 means your string gives, +1 means theirs does. */
  tug: number;
  tugTime: number;
  gustIn: number; gustWarn: number; gustLeft: number; gustSide: number;
  lanterns: Float32Array; lanternIn: number;
  /** The lantern your string is close to (for its dashed ring), or −1. */
  nearLantern: number;
  // Stats for the end screen.
  fastest: number; yanks: number; yankHits: number; streak: number; bestStreak: number; gusts: number; tangles: number;
  /** Events: kind, where, and the rival slot they belong to (−1 for none). */
  ev: Uint8Array; evX: Float32Array; evY: Float32Array; evSlot: Int8Array; evCount: number;
  at: Float32Array;
};

export const clamp = (value: number, low: number, high: number) => value < low ? low : value > high ? high : value;

function kite(x: number, y: number, hx: number, hy: number, state: number): Kite {
  return { x, y, vx: 0, vy: 0, t: 0.3, state, timer: 0, hx, hy, spin: 0, line: new Float32Array((SEGMENTS + 1) * 2) };
}

function emptyRival(slot: number): Rival {
  return {
    ...kite(0, 0, 0, 0, GONE), slot, entry: -1, kind: "pichchi", def: RIVALS.pichchi, roof: 0,
    homeX: 0, homeY: 0, phase: 0, w1: 0, w2: 0, age: 0,
    chargeIn: 0, chargeWarn: 0, attackLeft: 0, ax: 0, ay: 0, yankIn: 0, yankWarn: 0, yankLeft: 0, notches: 1, backoff: 0, fleeing: 0,
  };
}

/** Which roof a rival rises from: the champion from the far roof, a pair from one roof per slot, the rest taking turns. */
export function roofFor(def: LevelDef, entry: number, slot: number) {
  if (def.finale && entry === def.roster.length - 1) return 2;
  if (def.pair) return slot;
  return entry % 3;
}

/** Puts the next rival on the list into a slot: hovering at once on a fresh evening, rising from its roof after that. */
export function launchRival(game: Game, slot: number, entry: number, rising: boolean) {
  const r = game.rivals[slot], plan = game.plans[entry], at = roofFor(game.def, entry, slot), roof = ROOFS[at], kind = game.def.roster[entry];
  r.entry = entry; r.kind = kind; r.def = RIVALS[kind]; r.roof = at;
  r.homeX = roof.hx[0] + plan.fx * (roof.hx[1] - roof.hx[0]); r.homeY = roof.hy[0] + plan.fy * (roof.hy[1] - roof.hy[0]);
  r.phase = plan.phase; r.w1 = plan.w1; r.w2 = plan.w2;
  r.hx = roof.x; r.hy = roof.y; r.age = 0; r.spin = 0; r.vx = r.vy = 0; r.t = 0.35;
  r.chargeIn = r.def.charge ? 1.6 + r.def.charge * 0.5 : 0; r.chargeWarn = 0; r.attackLeft = 0;
  r.yankIn = 0; r.yankWarn = 0; r.yankLeft = 0;
  r.notches = r.def.notches; r.backoff = 0; r.fleeing = 0;
  if (rising) { r.state = RISE; r.timer = RISE_TIME; r.x = roof.x; r.y = roof.y; }
  else { r.state = FLY; r.timer = 0; r.x = r.homeX; r.y = r.homeY; }
}

export function createGame(seed: number, level = 1, mode: Mode = "n"): Game {
  const rng = makeRng(seed), def = levelDef(level);
  const windBase = (rng() * 2 - 1) * 12, wind1 = rng() * TAU, wind2 = rng() * TAU;
  const plans: Plan[] = def.roster.map(() => ({ fx: rng(), fy: rng(), phase: rng() * TAU, w1: rng() * TAU, w2: rng() * TAU }));
  const game: Game = {
    seed, level: LEVELS.indexOf(def) + 1, mode, def,
    // Everything decided during play (gust sides, lantern spots, yank rhythm) comes from a second stream, so the sky stays the seed's.
    rng: makeRng(seed ^ 0x5bd1e995),
    plans, windBase, wind1, wind2, wind: 0,
    phase: "ready", won: false, endLeft: 0, time: 0, total: 0, slowmo: 0,
    you: kite(HOME.x, HOME.y, HAND.x, HAND.y, FLY), aimX: HOME.x, aimY: HOME.y, pulling: false, tangle: 0,
    rivals: [emptyRival(0), emptyRival(1)], next: 0,
    cuts: 0, lost: 0, kites: MODE_INFO[mode].kites,
    hooked: -1, hookX: 0, hookY: 0, reach: REACH, tug: 0, tugTime: 0,
    gustIn: 5, gustWarn: 0, gustLeft: 0, gustSide: 1,
    lanterns: new Float32Array(LANTERNS * LF), lanternIn: 2.5, nearLantern: -1,
    fastest: Infinity, yanks: 0, yankHits: 0, streak: 0, bestStreak: 0, gusts: 0, tangles: 0,
    ev: new Uint8Array(EVENTS), evX: new Float32Array(EVENTS), evY: new Float32Array(EVENTS), evSlot: new Int8Array(EVENTS), evCount: 0,
    at: new Float32Array(2),
  };
  launchRival(game, 0, 0, false);
  game.next = 1;
  if (def.pair && def.roster.length > 1) { launchRival(game, 1, 1, false); game.next = 2; }
  game.gustIn = 4 + game.rng() * 2.5;
  game.wind = windAt(game, 0, false);
  curve(game.you, game.wind, game.you.line);
  for (const r of game.rivals) if (r.state !== GONE) curve(r, game.wind, r.line);
  return game;
}

/** Sideways wind in units a second: a seeded lean plus two slow gusts, × the level's wind. Calmer in slow mode. */
export const windAt = (game: Pick<Game, "windBase" | "wind1" | "wind2" | "def">, total: number, slow: boolean) =>
  (game.windBase + 7 * Math.sin(total * 0.29 + game.wind1) + 4 * Math.sin(total * 0.71 + game.wind2)) * game.def.wind * (slow ? CALM : 1);

/** How hard a string saws at this tension: full in the green band, a little when slack, barely when too tight. */
export const edge = (tension: number) => tension < LO ? SLACK_EDGE * tension / LO : tension <= HI ? 1 : OVER_EDGE;
export const zone = (tension: number) => tension < LO ? "slack" : tension <= HI ? "good" : "tight";

/** The string's bend: a slack string sags and leans downwind, a taut one runs nearly straight. */
export const sagOf = (k: Kite) => 4 + 0.2 * Math.hypot(k.x - k.hx, k.y - k.hy) * (1 - k.t);
export const controlX = (k: Kite, wind: number) => (k.hx + k.x) / 2 + wind * 0.9 * (1 - k.t);
export const controlY = (k: Kite) => (k.hy + k.y) / 2 + sagOf(k);

/** Samples the string from the hand to the kite into SEGMENTS straight pieces. */
export function curve(k: Kite, wind: number, out: Float32Array) {
  const cx = controlX(k, wind), cy = controlY(k);
  for (let i = 0; i <= SEGMENTS; i++) {
    const u = i / SEGMENTS, a = (1 - u) * (1 - u), b = 2 * (1 - u) * u, c = u * u;
    out[i * 2] = a * k.hx + b * cx + c * k.x;
    out[i * 2 + 1] = a * k.hy + b * cy + c * k.y;
  }
}

/** Where along segment A (0–1) it crosses segment B, or −1. Touching ends count; parallel lines never cross. */
export function segmentsCross(ax: number, ay: number, bx: number, by: number, cx: number, cy: number, dx: number, dy: number) {
  const rx = bx - ax, ry = by - ay, sx = dx - cx, sy = dy - cy;
  const denominator = rx * sy - ry * sx;
  if (denominator === 0) return -1;
  const qx = cx - ax, qy = cy - ay;
  const t = (qx * sy - qy * sx) / denominator, u = (qx * ry - qy * rx) / denominator;
  return t >= 0 && t <= 1 && u >= 0 && u <= 1 ? t : -1;
}

/** True when two sampled strings cross; the first crossing goes into `at`. */
export function linesCross(a: Float32Array, b: Float32Array, at: Float32Array) {
  for (let i = 0; i < SEGMENTS; i++) {
    const ax = a[i * 2], ay = a[i * 2 + 1], bx = a[i * 2 + 2], by = a[i * 2 + 3];
    for (let j = 0; j < SEGMENTS; j++) {
      const t = segmentsCross(ax, ay, bx, by, b[j * 2], b[j * 2 + 1], b[j * 2 + 2], b[j * 2 + 3]);
      if (t < 0) continue;
      at[0] = ax + (bx - ax) * t;
      at[1] = ay + (by - ay) * t;
      return true;
    }
  }
  return false;
}

/** The distance from a point to a sampled string. */
export function distanceToLine(line: Float32Array, px: number, py: number) {
  let best = Infinity;
  for (let i = 0; i < SEGMENTS; i++) {
    const ax = line[i * 2], ay = line[i * 2 + 1], dx = line[i * 2 + 2] - ax, dy = line[i * 2 + 3] - ay;
    const length = dx * dx + dy * dy, u = length ? clamp(((px - ax) * dx + (py - ay) * dy) / length, 0, 1) : 0;
    const ex = ax + dx * u - px, ey = ay + dy * u - py, d = ex * ex + ey * ey;
    if (d < best) best = d;
  }
  return Math.sqrt(best);
}

/** Keeps the aim (or a kite) within the sky, and within REACH of the hook while hooked. */
export function steerTo(game: Game, x: number, y: number) {
  game.aimX = clamp(x, SKY.left, SKY.right);
  game.aimY = clamp(y, SKY.top, SKY.bottom);
  if (game.hooked < 0) return;
  const dx = game.aimX - game.hookX, dy = game.aimY - game.hookY, d = Math.hypot(dx, dy);
  if (d > game.reach) { game.aimX = game.hookX + (dx * game.reach) / d; game.aimY = game.hookY + (dy * game.reach) / d; }
}
export const steerBy = (game: Game, dx: number, dy: number) => steerTo(game, game.aimX + dx, game.aimY + dy);

/** Pushes an event for the component. A full queue drops the newest, never the step. */
export function emit(game: Game, kind: number, x: number, y: number, slot = -1) {
  if (game.evCount >= EVENTS) return;
  game.ev[game.evCount] = kind; game.evX[game.evCount] = x; game.evY[game.evCount] = y; game.evSlot[game.evCount] = slot;
  game.evCount++;
}

/** Rivals still to cut, counting the ones in the sky. */
export const rivalsLeft = (game: Game) => game.def.roster.length - game.cuts;
/** The champion in the sky, if any (for the boss bar). */
export function bossInSky(game: Game) {
  for (const r of game.rivals) if (r.entry >= 0 && r.state !== GONE && r.def.notches > 1) return r;
  return null;
}
export const tenthsOf = (seconds: number) => Math.max(1, Math.round(seconds * 10));

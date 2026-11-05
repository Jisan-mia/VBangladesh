// The spinning top, in game seconds. Pure and seeded: the same seed lays the same floor (what slides in, and when) and the
// same gusts on every phone, and the same seed plus the same throw and touches gives the same spin. No DOM, no Math.random,
// no Date.now. step.hot.ts moves it a step at a time; the functions here are what a hand does to it (wind, throw, nudge, lift).
import { makeRng } from "../../../shared/game-core";
import { BONUS } from "./badges";
import { fromSide, K_RIDGE, LEVEL_COUNT, levelDef, MODE_INFO, type LevelDef, type Mode } from "./levels";

export const DT = 1 / 60;
export const MAX_TIME = 90;
/** ধীরে খেলো runs the top at this speed, and the touch windows shrink by the same. */
export const SLOW = 0.8;
/** Seconds a thing on the floor is on its way before it lands. */
export const LEAD = 1.1;
/** A good or fair touch this close before a knock braces the top: the knock counts for a third. */
export const BRACE = 0.3;
/** The throw drops the top to the ground in this long (drawing only; the spin runs from the throw). */
export const DROP = 0.2;
/** The fall and the palm trick play out for this long before the result. */
export const SETTLE = 1.1;
/** Lifting opens below this spin, and works only while the wobble is under PICK_STEADY. */
export const PICK_SPIN = 0.32, PICK_STEADY = 0.6;
/** "ঠিক সময়ে" at this lean (|lean| of the swing), "চলবে" above OK_SWAY. */
export const OK_SWAY = 0.6;
/** Touches closer together than this count once; every touch costs a little spin. */
export const NUDGE_GAP = 0.22, NUDGE_COST = 0.008;
/** Winding: the bar fills in this long, a turn of string every WRAP_GAP; shorter than MIN_WIND is no throw. */
export const WIND_PERIOD = 0.8, WRAP_GAP = 0.16, MIN_WIND = 0.12;
export const MAX_BUMPS = 96;
const TAU = Math.PI * 2;

export const P_READY = 0, P_SPIN = 1, P_FALL = 2, P_PALM = 3, P_DONE = 4;
export const F_NONE = 0, F_WOBBLE = 1, F_SLOW = 2, F_DROP = 3;
/** Events the step leaves for the page to turn into sound and juice. a/b are numbers whose meaning depends on the type. */
export const E_WIND = 1, E_THROW = 2, E_LAND = 3, E_NUDGE = 4, E_BUMP = 5, E_LIFTABLE = 6, E_FALL = 7, E_PALM = 8, E_DONE = 9;
export const NUDGE_GOOD = 0, NUDGE_OK = 1, NUDGE_MISS = 2;
const EV_CAP = 24;

export type Top = {
  seed: number; level: number; mode: Mode; def: LevelDef; slow: boolean;
  /** The mode's wobble growth, and the touch windows (|lean| at least) and gaps, already scaled for ধীরে খেলো. */
  grow: number; good: number; ok: number; gap: number; brace: number;
  phase: number;
  /** Winding the string: held seconds and turns of string so far. */
  winding: boolean; held: number; wraps: number;
  power: number; straight: number;
  /** Spin left (1 = a full throw, 0 = stopped), wobble (1 = falls), spin seconds, the lean's swing phase, the painted turn. */
  omega: number; wobble: number; t: number; sway: number; turn: number;
  landed: boolean; liftable: boolean;
  lastNudge: number; lastSoft: number;
  nudges: number; goodN: number; okN: number; missN: number; combo: number; bestCombo: number;
  /** Knocks that landed, how many were braced; the same for the finale's burst only. */
  faced: number; braced: number; waveFaced: number; waveBraced: number;
  bonus: number; fall: number; endT: number;
  /** The floor's timeline, sorted by time. */
  n: number; next: number;
  at: Float32Array; size: Float32Array; kind: Uint8Array; side: Int8Array; drag: Float32Array; wave: Uint8Array;
  /** The gusts' phases and rate. */
  ga: number; gb: number; gr: number;
  evN: number; evType: Uint8Array; evA: Float32Array; evB: Float32Array;
};

type Item = { at: number; size: number; kind: number; side: number; drag: number; wave: number };

/** The floor for a seed: what lands and when (nothing in the first 2 s, so every throw gets a clean start) and the gusts' rhythm. */
export function lay(top: Top) {
  const rng = makeRng(top.seed * 31 + top.level), def = top.def, items: Item[] = [];
  for (const source of def.sources) {
    const gap = 10 / source.per10;
    for (let at = 2 + rng() * gap; at < MAX_TIME; at += gap * (0.4 + 1.2 * rng())) {
      items.push({ at, size: source.size * (0.6 + 0.8 * rng()), kind: source.kind, side: fromSide(source.kind) ? (rng() < 0.5 ? -1 : 1) : 0, drag: source.drag ?? 0, wave: 0 });
    }
  }
  if (def.ridge > 0) for (let at = 2 + rng() * def.ridge; at < MAX_TIME; at += def.ridge * (0.85 + 0.3 * rng())) items.push({ at, size: 0.05, kind: K_RIDGE, side: 0, drag: 0, wave: 0 });
  const wave = def.wave;
  if (wave) {
    let side = rng() < 0.5 ? -1 : 1;
    for (let at = 4 + rng() * wave.every * 0.5; at < MAX_TIME; at += wave.every * (0.85 + 0.3 * rng())) {
      for (let i = 0; i < wave.count; i++) items.push({ at: at + i * wave.gap, size: wave.size * (0.85 + 0.3 * rng()), kind: wave.kind, side, drag: 0, wave: 1 });
      side = wave.flip ? -side : (rng() < 0.5 ? -1 : 1);
    }
  }
  items.sort((a, b) => a.at - b.at);
  top.n = Math.min(MAX_BUMPS, items.length);
  for (let i = 0; i < top.n; i++) {
    const item = items[i];
    top.at[i] = item.at; top.size[i] = item.size; top.kind[i] = item.kind; top.side[i] = item.side; top.drag[i] = item.drag; top.wave[i] = item.wave;
  }
  top.ga = rng() * TAU; top.gb = rng() * TAU; top.gr = 0.7 + rng() * 0.5;
}

/** Edge windows for the mode, narrowed for ধীரे খেলো so they last the same real time (the swing runs 0.8× as fast). */
export function setSlow(top: Top, slow: boolean) {
  top.slow = slow;
  const shrink = slow ? SLOW : 1, base = MODE_INFO[top.mode].good;
  top.good = Math.cos(Math.acos(base) * shrink);
  top.ok = Math.cos(Math.acos(OK_SWAY) * shrink);
  top.gap = NUDGE_GAP * shrink; top.brace = BRACE * shrink;
}

export function createTop(seed: number, level = 1, mode: Mode = "n", slow = false): Top {
  const def = levelDef(level), at = Math.max(1, Math.min(LEVEL_COUNT, Math.floor(level) || 1));
  const top: Top = {
    seed, level: at, mode, def, slow,
    grow: MODE_INFO[mode].grow, good: 0, ok: 0, gap: NUDGE_GAP, brace: BRACE,
    phase: P_READY, winding: false, held: 0, wraps: 0, power: 0, straight: 0,
    omega: 0, wobble: 0, t: 0, sway: 0, turn: 0, landed: false, liftable: false, lastNudge: -9, lastSoft: -9,
    nudges: 0, goodN: 0, okN: 0, missN: 0, combo: 0, bestCombo: 0, faced: 0, braced: 0, waveFaced: 0, waveBraced: 0,
    bonus: 0, fall: F_NONE, endT: 0, n: 0, next: 0,
    at: new Float32Array(MAX_BUMPS), size: new Float32Array(MAX_BUMPS), kind: new Uint8Array(MAX_BUMPS), side: new Int8Array(MAX_BUMPS),
    drag: new Float32Array(MAX_BUMPS), wave: new Uint8Array(MAX_BUMPS), ga: 0, gb: 0, gr: 1,
    evN: 0, evType: new Uint8Array(EV_CAP), evA: new Float32Array(EV_CAP), evB: new Float32Array(EV_CAP),
  };
  setSlow(top, slow);
  lay(top);
  return top;
}

export function emit(top: Top, type: number, a: number, b: number) {
  if (top.evN >= EV_CAP) return;
  top.evType[top.evN] = type; top.evA[top.evN] = a; top.evB[top.evN] = b;
  top.evN++;
}

export const clamp01 = (value: number) => Math.max(0, Math.min(1, Number.isFinite(value) ? value : 0));

/** How hard the wind pushes at time t, 0..1. */
export function gust(top: Top, t: number) {
  return Math.max(0, (Math.sin(t * top.gr + top.ga) + 0.6 * Math.sin(t * top.gr * 2.7 + top.gb) - 0.2) / 1.4);
}

/** How fast the lean swings (radians a second): it quickens as the top slows, like a real top's precession. */
export const swayRate = (omega: number) => 2.6 + 3.4 * (1 - clamp01(omega));

/** The lean right now, -1..1 (times the wobble for the drawn tilt). A slope pushes it one way. */
export const lean = (top: Top) => Math.max(-1, Math.min(1, Math.sin(top.sway) + top.def.slope));

/** The hold-to-wind bar: fills in 0.8 s, then slips back, and again (ping-pong). */
export const windPower = (held: number) => { const x = (held / WIND_PERIOD) % 2; return x <= 1 ? x : 2 - x; };
/** Winding throws straighter the tighter it is: the very top of the bar is a perfect throw. */
export const windStraight = (power: number) => 0.8 + 0.2 * clamp01(power);

// ---- what a hand does ----

/** The button, Space or Enter went down in the hand. */
export function beginWind(top: Top) {
  if (top.phase !== P_READY || top.winding) return false;
  top.winding = true; top.held = 0; top.wraps = 0;
  return true;
}
/** Let go: throws if the string was wound long enough. 1 thrown, 0 too short, -1 nothing was held. */
export function endWind(top: Top) {
  if (!top.winding) return -1;
  top.winding = false;
  if (top.held < MIN_WIND) { top.held = 0; top.wraps = 0; return 0; }
  const power = windPower(top.held);
  return throwTop(top, power, windStraight(power)) ? 1 : 0;
}
/** Leaving (blur, hide, the menu, the level list): the hold is dropped, nothing is thrown. */
export function cancelWind(top: Top) { top.winding = false; top.held = 0; top.wraps = 0; }

/** The throw: a harder pull spins longer, a straighter pull starts steadier. */
export function throwTop(top: Top, power: number, straight: number) {
  if (top.phase !== P_READY) return false;
  top.power = clamp01(power); top.straight = clamp01(straight);
  top.omega = 0.42 + 0.58 * top.power;
  top.wobble = 0.04 + 0.46 * (1 - top.straight) ** 1.3;
  top.winding = false; top.held = 0; top.wraps = 0;
  top.phase = P_SPIN;
  emit(top, E_THROW, top.power, top.straight);
  return true;
}

/**
 * A touch while it spins: at the lean's edge it steadies the top a lot, mid-swing a little, at the centre it knocks it.
 * Returns NUDGE_GOOD / NUDGE_OK / NUDGE_MISS, or -1 when it doesn't count (not spinning, or too soon after the last).
 */
export function nudge(top: Top) {
  if (top.phase !== P_SPIN || top.t - top.lastNudge < top.gap) return -1;
  top.lastNudge = top.t;
  top.nudges++;
  top.omega -= NUDGE_COST;
  const edge = Math.abs(lean(top));
  let result = NUDGE_MISS;
  if (edge >= top.good) {
    top.wobble *= 0.5; top.goodN++; top.combo++; top.bestCombo = Math.max(top.bestCombo, top.combo); top.lastSoft = top.t;
    result = NUDGE_GOOD;
  } else if (edge >= top.ok) {
    top.wobble *= 0.85; top.okN++; top.lastSoft = top.t;
    result = NUDGE_OK;
  } else {
    top.wobble = Math.min(0.99, top.wobble + 0.14); top.missN++; top.combo = 0;
  }
  emit(top, E_NUDGE, result, top.combo);
  return result;
}

export const canLift = (top: Top) => top.phase === P_SPIN && top.omega < PICK_SPIN;
/** Safe to lift: the top is steady enough to land on the palm. */
export const liftSafe = (top: Top) => canLift(top) && top.wobble < PICK_STEADY;

/** The palm trick. A steady top hops onto the palm for the bonus; a wobbly one slips and falls. 1 palm, 0 dropped, -1 not yet. */
export function lift(top: Top) {
  if (!canLift(top)) return -1;
  top.endT = 0;
  if (top.wobble < PICK_STEADY) { top.bonus = BONUS; top.phase = P_PALM; emit(top, E_PALM, 0, 0); return 1; }
  top.phase = P_FALL; top.fall = F_DROP;
  emit(top, E_FALL, F_DROP, 0);
  return 0;
}

/** Drops everything a hand was doing when the page stops stepping (blur, hide, pause, the list). */
export function releaseInput(top: Top) { cancelWind(top); }

// ---- the score ----

/** The score in tenths of a second: the spin plus the palm bonus. */
export const scoreOf = (top: Top) => Math.floor(top.t * 10 + 1e-9) + top.bonus;
export const isOver = (top: Top) => top.phase === P_FALL || top.phase === P_PALM || top.phase === P_DONE;

/** Throw quality from a downward swipe, in stage heights and seconds. `tail` is the last ~120 ms of the pull (a flick at the end counts). */
export function swipeThrow(dx: number, dy: number, seconds: number, tail: { dy: number; seconds: number } | null, wiggle = 0) {
  if (!(dy >= 0.12) || dy < Math.abs(dx) * 0.7) return null;
  const overall = dy / Math.max(0.04, seconds), late = tail && tail.seconds > 0.02 ? tail.dy / tail.seconds : 0;
  const speed = Math.max(overall, late);
  const power = clamp01((speed - 0.7) / 3.3);
  const straight = clamp01(1 - Math.atan2(Math.abs(dx), dy) / (Math.PI / 4) - wiggle * 1.5);
  return { power, straight };
}

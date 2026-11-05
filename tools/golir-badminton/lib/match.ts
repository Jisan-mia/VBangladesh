// The match rules, pure: serves, your swing (judged at the moment the finger touches), the rival's reach and returns, wind,
// the finales' named moves and the score. step.hot.ts walks the clock; this file runs at the moments things are struck.
// The same seed and the same swings give the same match on every phone, so tests and bots can replay it.
import { makeRng } from "../../../shared/game-core";
import {
  BACK_L, DT, HIGH_Y, LOW_Y, RIVAL_HOME, YOU_HOME,
  fly, makeAir, makePath, smash, smashInAir, strike, strikeInAir, windAt, type Air, type Path,
} from "./physics";
import {
  levelDef, MODE_INFO, CLEAR, DRIVE, DROP, FLOAT, JUMP, LIFT, SERVE, SMASH, type LevelDef, type Mode,
} from "./levels";

/** Phases. */
export const GAP = 0, FLY = 1, DONE = 2;
/** Your swing: a tap (a high shot), a pull down (a smash) or a pull towards the net (a drop). */
export const HIGH = 0, DOWN = 1, SOFT = 2;
/** Grades of a swing. */
export const PERFECT = 0, EARLY = 1, LATE = 2, WHIFF = 3, NONE = 4;
/** Inside this share of the window either side, a swing is right on time (the ring is gold). */
export const PERFECT_SHARE = 0.4;
/** Seconds between a point and the next serve. */
export const GAP_TIME = 1.05;
/** The longest a touch may hold the shuttle on the racket while it decides tap or pull (steps). */
export const HOLD_MAX = 12;
/** In fog the ring shows only this long before contact. */
export const FOG_RING = 0.45;

/** Why a point ended. */
export const R_MISS = 0, R_WHIFF = 1, R_YOU_NET = 2, R_YOU_OUT = 3, R_REACH = 4, R_BEAT = 5, R_RIVAL_NET = 6, R_RIVAL_OUT = 7;

/** Events for the page (sounds, calls, juice), cleared by the page each frame. */
export const E_SERVE = 1, E_HIT = 2, E_WHIFF = 3, E_NET = 4, E_LAND = 5, E_DONE = 6, E_SPECIAL = 7, E_TURN = 8, E_HELD = 9;
const EVENTS = 16;

export type Stats = {
  hits: number; perfect: number; early: number; late: number; whiffs: number;
  smashes: number; smashWins: number; dropWins: number; leftOut: number;
  faults: number; misses: number; longest: number; specials: number; held: number;
};
const zeroStats = (): Stats => ({ hits: 0, perfect: 0, early: 0, late: 0, whiffs: 0, smashes: 0, smashWins: 0, dropWins: 0, leftOut: 0, faults: 0, misses: 0, longest: 0, specials: 0, held: 0 });

export type Match = {
  def: LevelDef; level: number; mode: Mode; seed: number; rng: () => number;
  /** Timing window half-width in game seconds (mode and ধীরে খেলো applied), and this shuttle's (a fast one is tighter). */
  window: number; win: number;
  phase: number;
  /** Seconds into the gap, and step index along the path in flight. */
  t: number; i: number;
  clock: number;
  path: Path; air: Air;
  /** The shot in flight, and the point at which it was struck. */
  kind: number; fromX: number; fromY: number;
  // ---- you ----
  /** You already swung at this shuttle (or it is past you). */
  swung: boolean;
  /** A finger is down on it: the step index it touched at, and the steps it has held the shuttle on the racket. */
  pressAt: number; hold: number;
  /** It is past the latest moment you could hit it. */
  past: boolean;
  /** The last swing: its grade and what it played (for the loss line). */
  grade: number; played: number;
  // ---- the rival ----
  /** For your shot in flight: they get there in time, they return it, what they will play, and the pose they show. */
  goes: boolean; returns: boolean; plan: number; pose: number; aim: number; fail: number;
  /** A drop that shows the pose of a clear. */
  feinted: boolean;
  /** The ball coming at you is their block of your smash: you are still off balance, so less time and a shorter lift. */
  scramble: boolean;
  /** The finale's bar (0..1), and how many shots of the three-shot set are left. */
  meter: number; triple: number;
  /** The shot in flight is the named move, and whether it would land out (the ঘূর্ণি that you should leave). */
  special: boolean; specialOut: boolean;
  // ---- the court ----
  youX: number; youTo: number; rivalX: number; rivalTo: number;
  /** Clock time the rival may set off, and their running speed this shot. */
  rivalGo: number;
  youSwingAt: number; rivalSwingAt: number;
  us: number; them: number; server: number;
  /** Your hits in this rally. */
  rally: number;
  /** The side the wind blows now (+1 towards the rival), turned every `turn` points. */
  windSign: number;
  winner: number;
  reason: number;
  stats: Stats;
  evN: number; evType: Uint8Array; evA: Int16Array; evB: Int16Array;
};

export function emit(m: Match, type: number, a = 0, b = 0) {
  if (m.evN >= EVENTS) return;
  m.evType[m.evN] = type; m.evA[m.evN] = a; m.evB[m.evN] = b; m.evN++;
}

/** Fills the air: a steady push for wind levels and a seeded schedule of gusts. */
function makeWeather(m: Match) {
  const def = m.def, air = m.air;
  air.base = def.wind * m.windSign;
  air.gusts = 0;
  if (!def.gusts) return;
  let at = 4 + m.rng() * 3;
  while (air.gusts < air.gustAt.length) {
    air.gustAt[air.gusts] = at;
    air.gustLen[air.gusts] = 1.3 + m.rng() * 0.8;
    air.gustPow[air.gusts] = (m.rng() < 0.5 ? -1 : 1) * def.gust * (0.75 + 0.25 * m.rng());
    at += air.gustLen[air.gusts] + (0.6 + m.rng() * 0.8) / def.gusts;
    air.gusts++;
  }
}

export function createMatch(seed: number, value: number, mode: Mode = "n", slow = false): Match {
  const def = levelDef(value);
  const m: Match = {
    def, level: value, mode, seed, rng: makeRng((seed ^ Math.imul(value, 0x9e3779b1)) >>> 0),
    window: def.window * MODE_INFO[mode].window * (slow ? 0.8 : 1), win: 0,
    phase: GAP, t: GAP_TIME * 0.3, i: 0, clock: 0,
    path: makePath(), air: makeAir(),
    kind: SERVE, fromX: RIVAL_HOME, fromY: LOW_Y,
    swung: false, pressAt: -1, hold: 0, past: false, grade: NONE, played: HIGH,
    goes: true, returns: true, plan: CLEAR, pose: CLEAR, aim: 0, fail: 0, feinted: false, scramble: false,
    meter: 0, triple: 0, special: false, specialOut: false,
    youX: YOU_HOME, youTo: YOU_HOME, rivalX: def.home, rivalTo: def.home, rivalGo: 0, youSwingAt: -9, rivalSwingAt: -9,
    us: 0, them: 0, server: 1, rally: 0, windSign: 1, winner: -1, reason: R_MISS, stats: zeroStats(),
    evN: 0, evType: new Uint8Array(EVENTS), evA: new Int16Array(EVENTS), evB: new Int16Array(EVENTS),
  };
  m.windSign = m.rng() < 0.5 ? -1 : 1;
  makeWeather(m);
  m.path.n = 0;
  return m;
}

/** The wind right now (units a second, + towards the rival). */
export const windNow = (m: Match) => windAt(m.air, m.clock);

/** Seconds until the shuttle reaches you, or null when nothing is coming for you to hit. */
export function timeToContact(m: Match) {
  const p = m.path;
  if (m.phase !== FLY || p.from !== 1 || m.swung || m.past || p.contactAt < 0) return null;
  return (p.contactAt - m.i) * DT;
}

/** Whether the timing ring shows: always, except in fog until near the end. */
export function ringShows(m: Match) {
  const left = timeToContact(m);
  return left !== null && left > -m.win && (!m.def.fog || left <= FOG_RING);
}

// ---------- striking ----------

const deg = Math.PI / 180;
/** × the window, by the shot coming at you: a smash or a flat drive leaves less time to judge it. */
const WINDOW_BY_KIND = [1, 0.72, 0.9, 0.8, 1, 1, 0.62, 1];
const clamp = (value: number, low: number, high: number) => Math.min(high, Math.max(low, value));

/** Sets the shot in flight and where everybody goes. */
function launched(m: Match, kind: number) {
  const p = m.path;
  m.phase = FLY; m.i = 0; m.kind = kind; m.fromX = p.x[0]; m.fromY = p.y[0];
  m.swung = false; m.pressAt = -1; m.hold = 0; m.past = false;
  m.win = m.window * WINDOW_BY_KIND[kind] * (m.scramble && p.from === 1 ? 0.8 : 1);
  if (p.from === 1) {
    // Coming to you: you run to meet it (you always get there; the game is the timing and the choice).
    m.youTo = p.contactAt >= 0 && !p.out ? clamp(p.x[p.contactAt] - 10, 30, 168) : YOU_HOME;
    m.rivalTo = m.def.home; m.rivalGo = m.clock + 0.1; m.grade = NONE;
  } else {
    m.youTo = YOU_HOME;
  }
}

/** The rival's serve or yours: a high serve to the back. */
function serve(m: Match) {
  m.rally = 0; m.special = false; m.specialOut = false;
  emit(m, E_SERVE, m.server);
  if (m.server === 1) {
    m.rivalSwingAt = m.clock;
    strikeInAir(m.path, 1, m.rivalX - 8, LOW_Y, 62 * deg, 56 + m.rng() * 24, m.clock, m.air);
    launched(m, SERVE);
  } else {
    m.youSwingAt = m.clock;
    strikeInAir(m.path, 0, m.youX + 8, LOW_Y, 62 * deg, 300, m.clock, m.air);
    launched(m, SERVE);
    decide(m, SERVE, PERFECT);
  }
}

/** How hard your shot is to return: their chance by kind, easier off a mistimed swing, lower as the rally tires them. */
export function returnChance(m: Match, kind: number, grade: number) {
  const def = m.def, guard = def.guard;
  let chance = kind === SMASH ? guard.smash : kind === DROP ? guard.drop : kind === LIFT ? guard.lift : guard.clear;
  // A smash from the back has slowed by the time it gets there (the drag): it is far easier to get back.
  if (kind === SMASH) chance += (1 - chance) * clamp((112 - m.fromX) / 56, 0, 1) * 0.75;
  if (grade !== PERFECT) chance += (1 - chance) * 0.55;
  chance -= Math.max(0, m.rally - def.steady) * def.tire;
  chance += MODE_INFO[m.mode].guard;
  return clamp(chance, 0.04, 0.99);
}

/**
 * Your shot has left the racket: can they get there, will they return it, and with what. Every random choice is drawn
 * here in a fixed order, whatever the answer, so the match stays the same for the same swings.
 */
function decide(m: Match, kind: number, grade: number) {
  const def = m.def, p = m.path, rng = m.rng;
  const rollReturn = rng(), rollFail = rng(), rollShot = rng(), rollAim = rng(), rollFeint = rng(), rollWind = rng();
  const steady = m.rally <= def.steady;
  m.goes = false; m.returns = false; m.feinted = false; m.fail = 0;
  if (p.netAt >= 0 || p.out || p.contactAt < 0) { m.rivalTo = clamp(p.landX + 12, 200, 340); m.rivalGo = m.clock + def.react; return; }
  // A smash is blocked on reflex, with the racket out; anything else needs them to see it, set off and run. Running in to
  // the net is their own speed; back or across, everyone manages at least a jog.
  const cx = p.x[p.contactAt], fast = kind === SMASH, available = p.contactAt * DT - (fast ? 0.05 : def.react);
  const distance = Math.max(0, Math.abs(cx + 10 - m.rivalX) - def.reach * (fast ? 1.8 : 1));
  const speed = cx + 10 < m.rivalX ? def.run : Math.max(def.run, 260);
  m.goes = steady || kind === SERVE || distance <= speed * Math.max(0, available);
  m.rivalTo = clamp(cx + 10, 196, 344); m.rivalGo = m.clock + def.react;
  if (!m.goes) return;
  m.returns = steady || kind === SERVE || rollReturn < returnChance(m, kind, grade);
  if (!m.returns) {
    // A hard shot beats them (a swing and a miss); otherwise it's their own error, into the net or long.
    m.fail = kind === SMASH || kind === DROP ? R_BEAT : rollFail < 0.55 ? R_RIVAL_NET : R_RIVAL_OUT;
    m.plan = CLEAR; m.pose = CLEAR;
    return;
  }
  // What they play back.
  const high = p.high;
  let plan = CLEAR;
  if (m.triple > 0) plan = m.triple === 3 ? CLEAR : m.triple === 2 ? DROP : high ? SMASH : DRIVE;
  else if (def.special && m.meter >= 1 && (def.special !== "jump" || high)) plan = def.special === "jump" ? JUMP : def.special === "float" ? FLOAT : CLEAR;
  // A ball you didn't time (short, flat or a lift), high on their side: they smash it.
  else if (high && (kind === CLEAR || kind === LIFT) && grade !== PERFECT && rollShot < def.kill) plan = SMASH;
  // A smash got back is blocked short, to the net, or lifted high to the back.
  else if (kind === SMASH) plan = rollShot < 0.6 ? DROP : LIFT;
  else {
    const w = high ? def.high : def.low;
    const lob = high ? def.high.clear : def.low.lift, total = lob + w.drop + (high ? def.high.smash : 0) + w.drive;
    let roll = rollShot * total;
    if ((roll -= lob) < 0) plan = high ? CLEAR : LIFT;
    else if ((roll -= w.drop) < 0) plan = DROP;
    else if (high && (roll -= def.high.smash) < 0) plan = SMASH;
    else plan = DRIVE;
  }
  if (plan === SMASH && !high) plan = DRIVE;
  m.plan = plan;
  m.aim = rollAim;
  m.feinted = plan === DROP && (m.triple === 2 || rollFeint < def.feint);
  m.pose = m.feinted ? CLEAR : plan === JUMP ? JUMP : plan;
  // The rival reads the wind this time, or aims as in still air.
  m.fail = rollWind < def.windSense ? 0 : 1;
}

/** Their return, struck at the contact point. */
function rivalStrikes(m: Match) {
  const def = m.def, p = m.path, i = p.contactAt;
  const x = p.x[i], y = p.y[i], plan = m.plan, aim = m.aim, still = m.fail === 1;
  m.rivalSwingAt = m.clock;
  m.special = false; m.specialOut = false;
  const target = (from: number, to: number) => from + (to - from) * aim;
  const hit = (angle: number, tx: number) => still ? strike(m.path, 1, x, y, angle * deg, tx, m.clock, m.air) : strikeInAir(m.path, 1, x, y, angle * deg, tx, m.clock, m.air);
  // A rally speeds up a little as it goes on.
  const urgency = 1 + Math.min(0.12, m.rally * 0.01);
  if (plan === JUMP) {
    smash(m.path, 1, x, y - 10, def.smashSpeed * 1.3, target(110, 140), m.clock, m.air);
    m.special = true; m.meter = 0; m.stats.specials++; emit(m, E_SPECIAL, JUMP);
  } else if (plan === FLOAT) {
    m.specialOut = aim < 0.5;
    // A towering lob, and the gust that carries it: it lands just inside the back line, or just past it.
    const g = m.air.gusts < m.air.gustAt.length ? m.air.gusts++ : m.air.gusts - 1;
    m.air.gustAt[g] = m.clock + 0.25; m.air.gustLen[g] = 1.9; m.air.gustPow[g] = -38;
    strikeInAir(m.path, 1, x, y, 74 * deg, m.specialOut ? BACK_L - 14 : BACK_L + 18, m.clock, m.air);
    m.special = true; m.meter = 0; m.stats.specials++; emit(m, E_SPECIAL, FLOAT);
  } else if (plan === SMASH) {
    smash(m.path, 1, x, y, def.smashSpeed * urgency, target(96, 140), m.clock, m.air);
  } else if (plan === DROP) {
    if (y < HIGH_Y + 20) hit(12, target(150, 164)); else hit(x < 232 ? 66 : 52, target(150, 162));
  } else if (plan === DRIVE) {
    hit(y < HIGH_Y + 20 ? 3 : 14, target(70, 120));
  } else {
    hit(y < HIGH_Y + 20 ? 46 : x < 232 ? 74 : 60, target(48, 80));
  }
  if (m.triple > 0) {
    m.special = true;
    if (m.triple === 3) { m.stats.specials++; m.meter = 0; emit(m, E_SPECIAL, 3); }
    m.triple--;
  } else if (!m.special && m.def.special) {
    m.meter = Math.min(1, m.meter + def.fill);
    if (m.def.special === "triple" && m.meter >= 1) m.triple = 3;
  }
  m.scramble = m.kind === SMASH && plan === DROP;
  emit(m, E_HIT, 1, plan);
  launched(m, plan);
}

/** Their error at the contact point: a frame into the net, or a long one past your back line. */
function rivalErrs(m: Match) {
  const p = m.path, i = p.contactAt, x = p.x[i], y = p.y[i];
  m.rivalSwingAt = m.clock;
  if (m.fail === R_RIVAL_NET) fly(m.path, 1, x, y, -260, 60, m.clock, m.air);
  else strike(m.path, 1, x, y, 40 * deg, BACK_L - 30, m.clock, m.air);
  emit(m, E_HIT, 1, m.fail === R_RIVAL_NET ? DROP : CLEAR);
  launched(m, m.fail === R_RIVAL_NET ? DROP : CLEAR);
}

/** The rival reaches the contact point of your shot. */
export function atRival(m: Match) {
  if (!m.goes) return;
  if (m.returns) rivalStrikes(m);
  else if (m.fail === R_BEAT) { m.rivalSwingAt = m.clock; m.goes = false; }
  else rivalErrs(m);
}

// ---------- your swing ----------

/** Where your touch fell in the window: −1 the earliest that still hits, 0 right on time, 1 the latest. */
export const offsetOf = (m: Match, index: number) => (index - m.path.contactAt) * DT / m.win;

/**
 * A finger (or key) touches: judged right now. Returns 0 when it doesn't count (nothing coming, or far too soon: a practice
 * swing), 1 when it holds the shuttle on the racket until `release` says which shot, 2 when it swung and missed.
 */
export function press(m: Match) {
  m.youSwingAt = m.clock;
  const p = m.path;
  if (m.phase !== FLY || p.from !== 1 || m.swung || m.past || m.pressAt >= 0 || p.contactAt < 0) return 0;
  const offset = offsetOf(m, m.i);
  if (offset < -2) return 0;
  if (offset < -1) {
    m.swung = true; m.grade = WHIFF; m.stats.whiffs++;
    emit(m, E_WHIFF);
    return 2;
  }
  m.pressAt = m.i; m.hold = 0;
  return 1;
}

/** The touch decided: a tap (HIGH), a pull down (DOWN) or a pull towards the net (SOFT). Plays the shot judged at the touch. */
export function release(m: Match, swing: number) {
  if (m.pressAt < 0) return;
  const p = m.path, at = m.pressAt, offset = offsetOf(m, at);
  m.pressAt = -1; m.hold = 0; m.swung = true;
  const grade = Math.abs(offset) <= PERFECT_SHARE ? PERFECT : offset < 0 ? EARLY : LATE;
  const x = p.x[at], y = p.y[at], high = p.high && y < HIGH_Y + 26;
  const was = m.kind, special = m.special;
  m.grade = grade; m.played = swing;
  m.youSwingAt = m.clock;
  const s = m.stats;
  s.hits++;
  if (grade === PERFECT) s.perfect++; else if (grade === EARLY) s.early++; else s.late++;
  let kind = CLEAR;
  if (swing === DOWN) {
    kind = SMASH; s.smashes++;
    const speed = grade === PERFECT ? 1350 : 1050, target = grade === LATE ? 236 : grade === EARLY ? 300 : 262;
    // A smash comes down from overhead. Off a low ball it can't clear the net.
    // Fast enough that the wind hardly matters: your smash goes where you meant.
    if (high) smashInAir(m.path, 0, x, y, speed, target, m.clock, m.air);
    else smash(m.path, 0, x, y + 10, speed * 0.7, 196, m.clock, m.air);
  } else if (swing === SOFT) {
    kind = DROP;
    const tx = grade === PERFECT ? 208 : grade === EARLY ? 236 : 198;
    // Off a low ball close to the net it has to go up steeply to get over the tape.
    const steep = x > 128 ? 14 : 0;
    // A touch shot: you feel the wind on it and allow for it. Only the high shots are yours to judge against the wind.
    strikeInAir(m.path, 0, x, y, (high ? (grade === LATE ? 4 : 12) : (grade === LATE ? 40 : 54) + steep) * deg, tx, m.clock, m.air);
  } else if (high) {
    kind = CLEAR;
    if (grade === PERFECT) strike(m.path, 0, x, y, 42 * deg, 318, m.clock, m.air);
    else if (grade === EARLY) strike(m.path, 0, x, y, 52 * deg, 270, m.clock, m.air);
    else strike(m.path, 0, x, y, 30 * deg, 282, m.clock, m.air);
  } else {
    kind = LIFT;
    // Scrambling up from their block, a lift only gets to mid-court.
    if (m.scramble && grade === PERFECT) m.grade = EARLY;
    const steep = x > 128 ? 16 : 0;
    strike(m.path, 0, x, y, ((m.grade === PERFECT ? 58 : 64) + steep) * deg, m.grade === PERFECT ? 310 : 262, m.clock, m.air);
  }
  m.rally++;
  s.longest = Math.max(s.longest, m.rally);
  // A named move hit back: the jump smash, a ঘূর্ণি that was landing in, or the last of the three.
  if (special && (was === JUMP || (was === FLOAT && !m.specialOut) || (was !== FLOAT && m.triple === 0))) { s.held++; emit(m, E_HELD, was); }
  emit(m, E_HIT, 0, kind | (grade << 4));
  m.scramble = false;
  launched(m, kind);
  decide(m, kind, m.grade);
}

// ---------- points ----------

export function point(m: Match, winner: number, reason: number) {
  const s = m.stats;
  if (winner === 0) {
    m.us++;
    if (reason === R_BEAT || reason === R_REACH) { if (m.kind === SMASH) s.smashWins++; else if (m.kind === DROP) s.dropWins++; }
    if (reason === R_RIVAL_OUT) s.leftOut++;
    // The ঘূর্ণি that would land out, left alone: held.
    if (m.special && m.specialOut && m.kind === FLOAT && reason === R_RIVAL_OUT) { s.held++; emit(m, E_HELD, FLOAT); }
  } else {
    m.them++;
    if (reason === R_YOU_NET || reason === R_YOU_OUT) s.faults++; else if (reason === R_MISS || reason === R_WHIFF) s.misses++;
  }
  if (m.triple > 0 && winner === 0) m.triple = 0;
  m.server = winner; m.reason = reason;
  m.special = false; m.specialOut = false; m.pressAt = -1; m.hold = 0;
  m.youTo = YOU_HOME; m.rivalTo = m.def.home;
  emit(m, E_LAND, winner, reason);
  const def = m.def;
  if (m.us >= def.points || m.them >= def.points) {
    m.phase = DONE; m.winner = m.us >= def.points ? 0 : 1;
    emit(m, E_DONE, m.winner);
    return;
  }
  if (def.turn && (m.us + m.them) % def.turn === 0) {
    m.windSign = -m.windSign; m.air.base = def.wind * m.windSign;
    emit(m, E_TURN, m.windSign);
  }
  m.phase = GAP; m.t = 0;
}

/** The gap ran out: serve. */
export function serveNow(m: Match) { serve(m); }

/** Where the shuttle is this step (for drawing): on the path, at the landing spot during a gap, or in the server's hand. */
export function shuttleX(m: Match) {
  const p = m.path;
  if (m.phase === FLY) return p.x[Math.min(m.i, p.n - 1)];
  if (p.n > 0 && (m.phase === DONE || m.t < 0.55)) return p.x[p.n - 1];
  return m.server === 1 ? m.rivalX - 12 : m.youX + 12;
}
export function shuttleY(m: Match) {
  const p = m.path;
  if (m.phase === FLY) return p.y[Math.min(m.i, p.n - 1)];
  if (p.n > 0 && (m.phase === DONE || m.t < 0.55)) return p.y[p.n - 1];
  return LOW_Y + 26;
}

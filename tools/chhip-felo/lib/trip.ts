// One level's fishing trip as a pure, seeded state machine: aim and cast, watch the float, strike on the real dip,
// reel with the line in the green while the fish shows its personality. step.hot.ts advances it 60 times a second;
// the moments between (a cast landing, a strike, a fish landed or lost) live here.
// Every clock is game time. Slow mode only feeds smaller steps, so turning it on mid-cast never moves a bite.
// Every random choice comes from the trip's seed, one generator per cast, so a friend's link replays the same water.
import { makeRng } from "../../../shared/game-core";
import { bossOf, levelDef, LEVELS, MODE_INFO, type LevelDef, type Mode } from "./levels";
import { FISH, fight, rollFish, rollGrams, T, type Boss } from "./species";

export const P = { AIM: 0, FLY: 1, WAIT: 2, REEL: 3, CATCH: 4, MISS: 5, OVER: 6 } as const;
/** Why a fish got away. */
export const MISS = { EARLY: 1, NIBBLE: 2, LATE: 3, SNAP: 4, SLIP: 5, SNAG: 6, LEAP: 7, TEAR: 8 } as const;
export const TRICK = { NONE: 0, SURGE: 1, JUMP: 2, RUSH: 3 } as const;
/** Events a step leaves for the component (sound, juice, words), in order, with one number each (a miss or a trick). */
export const E = {
  CHARGE: 1, SHORT: 2, CAST: 3, LAND: 4, NIBBLE: 5, DIP: 6, HUSH: 7, HOOK: 8, TELL: 9, SURGE: 10, JUMP: 11, RUSH: 12,
  NOTCH: 13, CAUGHT: 14, MISS: 15, NEXT: 16, WIN: 17, FAIL: 18, BOSS: 19, RIDDEN: 20,
} as const;
export const EVENTS = 16;
export const MAX_FISH = 8;

/** Seconds: a full swing of the cast ring (out and back), the float's flight, how long a catch or a miss shows. */
export const SWING = 1.6, FLIGHT = 0.55, SHOW_CATCH = 1.3, SHOW_MISS = 1.25, SKIP_AFTER = 0.35, NIBBLE_TIME = 0.3;
/** A tap shorter than this cast power is not a cast. */
export const MIN_POWER = 0.06;
/** How close a cast must land to the bubbles: 1 on top of them, 0 a quarter of the water away or more. */
export const NEAR = 0.25;
export const PAD_R = 0.065;
/* ---- the reel ---- */
/** Holding tightens the line this much a second; lifting slackens it. */
export const RISE = 0.8, FALL = 0.85, START_T = 0.45;
export const GREEN_MID = 0.5;
export const RED = 0.92, SOFT_RED = 0.8, SNAP_AFTER = 0.45, SOFT_SNAP = 0.32;
export const SLIP_AFTER = 2.2, SLIPPERY = 0.8;
/** A rushing fish spits the hook from a slack line this many times sooner. */
export const RUSH_SLIP = 2;
/** The warning before a trick, and the tricks themselves. */
/** A surge pulls hardest at its start and fades out; a rush slackens the line while it lasts. */
export const TELL = 0.55, SURGE_TIME = 0.75, SURGE_ADD = 1.6, RUSH_TIME = 0.8, RUSH_DROP = 0.6;
export const JUMP_SAFE = 0.62, JUMP_KICK = 0.28, JUMP_GIFT = 0.06;
/** Seconds in the green for each notch of a boss's দম. */
export const BOSS_SEGMENT = 2.1;
/** The strike freezes the water to HIT_SCALE speed for HIT_STOP seconds (never in slow mode). */
export const HIT_STOP = 0.12, HIT_SCALE = 0.3;

export type Trip = {
  seed: number; level: number; mode: Mode; def: LevelDef; boss: Boss | null;
  /** Baits beyond the fish needed. */
  spare: number;
  phase: number; t: number; time: number; cast: number; rng: () => number;
  /** The last step's finger (or Space), so a step can tell a press from a hold. */
  wasHeld: boolean;
  /** No hit-stop (slow mode). */
  calm: boolean; stop: number;
  /* aim */
  charging: boolean; charge: number; power: number;
  /** The bubbles: distance 0 (by the bank) .. 1 (far water), and side −1..1. Lily pads on the cast's line (−1 for none). */
  spot: number; side: number; pads: Float32Array; landed: number; accuracy: number;
  /* the wait */
  biteAt: number; window: number; fakes: Float32Array; fakeCount: number;
  /* the fish on the line */
  fish: number; grams: number; isBoss: boolean; traits: number;
  tension: number; progress: number; slack: number; strain: number; holding: boolean;
  lo: number; hi: number; red: number; snapAfter: number; slipAfter: number; need: number; wobble: number;
  trick: number; trickAt: number; warnFor: number; warned: boolean; surgeEnd: number; rushEnd: number; riding: number;
  /** A boss's notches of দম left (kept when it gets away). */
  bossLeft: number;
  /* the basket and the stats */
  catches: number; catchFish: Int16Array; catchGrams: Int32Array; lost: number; miss: number; won: boolean; bossLanded: boolean;
  casts: number; surges: number; jumps: number; rushes: number; fastest: number;
  ev: Uint8Array; evArg: Int16Array; evCount: number;
};

const castRng = (seed: number, cast: number) => makeRng((seed ^ Math.imul(cast + 1, 0x9e3779b1)) >>> 0);

export function emit(trip: Trip, kind: number, arg = 0) {
  if (trip.evCount >= EVENTS) return;
  trip.ev[trip.evCount] = kind; trip.evArg[trip.evCount] = arg; trip.evCount++;
}

/** A fresh cast: new bubbles (and lily pads), the ring back at the bank. */
export function beginCast(trip: Trip) {
  const rng = castRng(trip.seed, trip.cast);
  trip.rng = rng;
  trip.phase = P.AIM; trip.t = 0; trip.charging = false; trip.charge = 0; trip.power = 0;
  // The bubbles stay in reach: never at the bank's edge, never right at the far bank.
  trip.spot = 0.3 + rng() * 0.55;
  // Mostly to the right, so the bubbles don't sit behind the rod on the left.
  trip.side = -0.3 + rng() * 0.95;
  const near = trip.spot - (0.16 + rng() * 0.05), far = trip.spot + (0.16 + rng() * 0.06);
  trip.pads[0] = trip.def.pads && near > 0.06 ? near : -1;
  trip.pads[1] = trip.def.pads && far < 0.97 ? far : -1;
  trip.landed = 0; trip.accuracy = 0; trip.fakeCount = 0; trip.holding = false;
  trip.trick = TRICK.NONE; trip.surgeEnd = 0; trip.rushEnd = 0; trip.riding = TRICK.NONE;
}

export function createTrip(seed: number, level: number, mode: Mode = "n"): Trip {
  const def = levelDef(level), boss = bossOf(def);
  const trip: Trip = {
    seed, level: LEVELS.indexOf(def) + 1, mode, def, boss, spare: MODE_INFO[mode].spare,
    phase: P.AIM, t: 0, time: 0, cast: 0, rng: castRng(seed, 0), wasHeld: false, calm: false, stop: 0,
    charging: false, charge: 0, power: 0, spot: 0.5, side: 0, pads: new Float32Array(2).fill(-1), landed: 0, accuracy: 0,
    biteAt: 0, window: 0, fakes: new Float32Array(4), fakeCount: 0,
    fish: 0, grams: 0, isBoss: false, traits: 0,
    tension: 0, progress: 0, slack: 0, strain: 0, holding: false,
    lo: 0.3, hi: 0.7, red: RED, snapAfter: SNAP_AFTER, slipAfter: SLIP_AFTER, need: 2, wobble: 0,
    trick: TRICK.NONE, trickAt: 0, warnFor: TELL, warned: false, surgeEnd: 0, rushEnd: 0, riding: TRICK.NONE,
    bossLeft: boss ? boss.notches : 0,
    catches: 0, catchFish: new Int16Array(MAX_FISH), catchGrams: new Int32Array(MAX_FISH), lost: 0, miss: 0, won: false, bossLanded: false,
    casts: 0, surges: 0, jumps: 0, rushes: 0, fastest: Infinity,
    ev: new Uint8Array(EVENTS), evArg: new Int16Array(EVENTS), evCount: 0,
  };
  beginCast(trip);
  return trip;
}

/** Triangle wave: the ring goes out to the far water and comes back, so holding too long is never the best cast. */
export const swing = (seconds: number) => {
  const phase = (seconds / SWING) % 1;
  return phase < 0.5 ? phase * 2 : 2 - phase * 2;
};
export const accuracyOf = (landed: number, spot: number) => Math.max(0, 1 - Math.abs(landed - spot) / NEAR);
export const onPad = (trip: Pick<Trip, "pads">, at: number) => (trip.pads[0] >= 0 && Math.abs(at - trip.pads[0]) < PAD_R) || (trip.pads[1] >= 0 && Math.abs(at - trip.pads[1]) < PAD_R);
/** The next bite is the level's boss. */
export const bossBite = (trip: Pick<Trip, "boss" | "catches" | "def">) => trip.boss !== null && trip.catches === trip.def.need - 1;
/** Baits left beyond the one on the hook. */
export const baitsLeft = (trip: Pick<Trip, "spare" | "lost">) => Math.max(0, trip.spare - trip.lost);

function cast(trip: Trip) {
  trip.charging = false;
  if (trip.power < MIN_POWER) { emit(trip, E.SHORT); return; }
  trip.landed = trip.power;
  trip.phase = P.FLY; trip.t = 0; trip.casts++;
  emit(trip, E.CAST);
}

/** The float lands: the cast's whole story is rolled now, in a fixed order, so a friend's same casts give the same fish. */
export function land(trip: Trip) {
  const { def, rng } = trip, a = accuracyOf(trip.landed, trip.spot);
  trip.accuracy = a;
  if (onPad(trip, trip.landed)) { endCast(trip, MISS.SNAG); return; }
  const boss = bossBite(trip) ? trip.boss : null;
  trip.isBoss = boss !== null;
  trip.fish = boss ? boss.fish : trip.catches === 0 && def.first >= 0 ? def.first : rollFish(def.pool, a, rng);
  trip.grams = rollGrams(boss ? boss.grams : FISH[trip.fish].grams, a, rng);
  trip.traits = boss ? boss.traits | T.NIBBLE : FISH[trip.fish].traits;
  // Nibbles first, each with room to tell it from the real dip. Nibblers (and a wily boss) always taste the bait.
  let count = 0;
  if (def.fakes > 0) count = trip.traits & T.NIBBLE ? 1 + Math.floor(rng() * def.fakes) : Math.floor(rng() * def.fakes);
  if (def.waves && def.fakes > 0) count++;
  count = Math.min(4, count);
  let at = 0.5 + rng() * 0.35;
  for (let index = 0; index < count; index++) { trip.fakes[index] = at; at += 0.75 + rng() * 0.45; }
  trip.fakeCount = count;
  const base = (def.forgiving ? 0.55 + rng() * 0.5 : 1.0 + rng() * 1.3) - a * 0.4;
  trip.biteAt = count ? Math.max(base, at + 0.1) : Math.max(0.6, base);
  trip.window = def.window * MODE_INFO[trip.mode].window * (1 - 0.15 * fight(trip.grams)) * (boss ? 1.15 : 1);
  trip.phase = P.WAIT; trip.t = 0;
  emit(trip, E.LAND);
  if (boss) emit(trip, E.BOSS);
}

function pickTrick(trip: Trip) {
  const has = trip.traits;
  let count = 0;
  if (has & T.SURGE) count++;
  if (has & T.JUMP) count++;
  if (has & T.RUSH) count++;
  if (!count) return TRICK.NONE;
  let pick = Math.floor(trip.rng() * count);
  if (has & T.SURGE) { if (pick === 0) return TRICK.SURGE; pick--; }
  if (has & T.JUMP) { if (pick === 0) return TRICK.JUMP; pick--; }
  return TRICK.RUSH;
}

/** The next trick, `after` seconds from now, warned TELL seconds ahead. */
export function scheduleTrick(trip: Trip, after: number) {
  trip.trick = pickTrick(trip);
  trip.trickAt = trip.t + after;
  trip.warned = false;
}
export const trickGap = (trip: Trip) => trip.isBoss ? 1.45 + trip.rng() * 0.9 : 1.5 + trip.rng() * 1.1;

function startReel(trip: Trip) {
  const f = fight(trip.grams), slippery = (trip.traits & T.SLIP) !== 0, soft = (trip.traits & T.SOFT) !== 0, info = MODE_INFO[trip.mode];
  trip.phase = P.REEL; trip.t = 0;
  trip.tension = START_T; trip.slack = 0; trip.strain = 0; trip.holding = true;
  const half = 0.2 - 0.07 * f + info.band + (trip.isBoss ? 0.02 : 0);
  trip.lo = GREEN_MID - half + (slippery ? 0.04 : 0); trip.hi = GREEN_MID + half;
  trip.red = soft ? SOFT_RED : RED; trip.snapAfter = soft ? SOFT_SNAP : SNAP_AFTER; trip.slipAfter = slippery ? SLIPPERY : SLIP_AFTER;
  trip.wobble = (0.15 + 0.2 * f) * trip.def.pull;
  trip.warnFor = TELL * info.warn * (trip.isBoss ? 1.2 : 1);
  if (trip.isBoss && trip.boss) {
    trip.need = BOSS_SEGMENT * trip.boss.notches;
    trip.progress = (trip.boss.notches - trip.bossLeft) / trip.boss.notches;
  } else { trip.need = (1.5 + 1.6 * f) * trip.def.reel; trip.progress = 0; }
  trip.surgeEnd = 0; trip.rushEnd = 0; trip.riding = TRICK.NONE;
  scheduleTrick(trip, 0.9 + trip.rng() * 0.6);
  if (!trip.calm) trip.stop = HIT_STOP;
}

export function endCast(trip: Trip, miss: number) {
  trip.holding = false; trip.t = 0; trip.trick = TRICK.NONE; trip.riding = TRICK.NONE;
  if (!miss) {
    if (trip.catches < MAX_FISH) { trip.catchFish[trip.catches] = trip.fish; trip.catchGrams[trip.catches] = trip.grams; }
    trip.catches++;
    if (trip.isBoss) { trip.bossLanded = true; trip.bossLeft = 0; }
    trip.phase = P.CATCH; trip.miss = 0;
    emit(trip, E.CAUGHT);
  } else {
    trip.lost++; trip.miss = miss; trip.phase = P.MISS;
    emit(trip, E.MISS, miss);
  }
}

/** After a catch or a miss shows: the next cast, or the end of the level. */
export function next(trip: Trip) {
  if (trip.catches >= trip.def.need) { trip.phase = P.OVER; trip.won = true; trip.t = 0; emit(trip, E.WIN); return; }
  if (trip.lost > trip.spare) { trip.phase = P.OVER; trip.won = false; trip.t = 0; emit(trip, E.FAIL); return; }
  trip.cast++;
  beginCast(trip);
  emit(trip, E.NEXT);
}

/** Finger (or Space) down. */
export function press(trip: Trip) {
  switch (trip.phase) {
    case P.AIM: trip.charging = true; trip.charge = 0; trip.power = 0; emit(trip, E.CHARGE); return;
    case P.WAIT: {
      const now = trip.t;
      if (now >= trip.biteAt && now <= trip.biteAt + trip.window) { startReel(trip); emit(trip, E.HOOK); return; }
      // Level 1 teaches: an early tap only gets a word, never loses the fish.
      if (trip.def.forgiving && now < trip.biteAt) { emit(trip, E.HUSH); return; }
      let nibbling = false;
      for (let index = 0; index < trip.fakeCount; index++) if (now >= trip.fakes[index] && now <= trip.fakes[index] + NIBBLE_TIME + 0.15) nibbling = true;
      endCast(trip, nibbling ? MISS.NIBBLE : now < trip.biteAt ? MISS.EARLY : MISS.LATE);
      return;
    }
    case P.REEL: trip.holding = true; return;
    case P.CATCH: case P.MISS: if (trip.t > SKIP_AFTER) next(trip); return;
    default: return;
  }
}

/** Finger (or Space) up. */
export function release(trip: Trip) {
  if (trip.phase === P.AIM && trip.charging) cast(trip);
  else if (trip.phase === P.REEL) trip.holding = false;
}

/** What the float is doing now, for drawing: 0 resting, up to 1 for a nibble's twitch, 2 under. */
export function floatState(trip: Trip) {
  if (trip.phase === P.REEL) return 2;
  if (trip.phase !== P.WAIT) return 0;
  const now = trip.t;
  if (now >= trip.biteAt) return 2;
  for (let index = 0; index < trip.fakeCount; index++) {
    const at = trip.fakes[index];
    if (now >= at && now <= at + NIBBLE_TIME) return Math.sin(((now - at) / NIBBLE_TIME) * Math.PI);
  }
  return 0;
}

export function basketGrams(trip: Pick<Trip, "catches" | "catchGrams">) {
  let sum = 0;
  for (let index = 0; index < Math.min(MAX_FISH, trip.catches); index++) sum += trip.catchGrams[index];
  return sum;
}
/** The heaviest fish in the basket, as an index into FISH (-1 for none), and its weight. */
export function biggestOf(trip: Pick<Trip, "catches" | "catchGrams" | "catchFish">) {
  let fish = -1, grams = 0;
  for (let index = 0; index < Math.min(MAX_FISH, trip.catches); index++) if (trip.catchGrams[index] > grams) { grams = trip.catchGrams[index]; fish = trip.catchFish[index]; }
  return { fish, grams };
}

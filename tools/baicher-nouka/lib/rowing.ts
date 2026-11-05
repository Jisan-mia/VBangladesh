// The race: its state, a new race from a seed, lane changes and taps on the beat. The per-step rules are in step.hot.ts.
// No DOM, no React and no clock of its own, so a challenge link replays the same river and the tests can race it headless.
import { makeRng, pick } from "../../../shared/game-core";
import { BOAT_LEN, FRONT_Y, LANES, NARROW_LANES, PLAYER_LANE, SIDE_GAP, clamp, laneX, makeBeats, makeCourse, narrowAt, planOf, type Gust, type Patch, type Plan, type Seg } from "./course";
import { isLevel, LEGACY_LEVEL, levelDef, MODE_INFO, OLD_COUNT, type LevelDef, type Mode } from "./levels";

/** Two boats closer than this side to side would clash oars, so the one behind waits. Lanes are 60 apart. */
export const SIDE = SIDE_GAP;
/** The closest a bow may follow another boat's stern. */
export const FOLLOW = 12;

/** Speeds in units a second. You row at CRUISE; each beat you catch adds a burst that fades, and a run of beats adds a little more. */
export const CRUISE = 165, BOOST_T = 1.2, STREAK_STEP = 3, STREAK_MAX = 6;
/** The old drum's bursts; the new races size a stroke by the beat's gap so every tempo adds the same speed on average. */
export const OLD_BURST = 80, OLD_PERFECT_BURST = 105;
export const NEW_PERFECT = 52, GOOD_SHARE = 0.76, ACCENT = 1.6;
/** How quickly a boat reaches the speed it's rowing for (per second): a long boat has weight. */
export const GRIP = 4;
/** The beat counts within ±WINDOW seconds (× the mode), and within ±PERFECT it's "দারুণ!". */
export const WINDOW = 0.25, PERFECT = 0.09;
/** A tap far off the beat breaks the rhythm: the rowers fumble for a moment. Mild, but it stops button-mashing. */
export const STUMBLE_T = 0.35, STUMBLE_LOW = 0.8;
/** Hitting a কচুরিপানা patch drags the boat down to SLOW_LOW of its speed; it recovers over SLOW_T. */
export const SLOW_T = 1.2, SLOW_LOW = 0.35;
/** A fast lane's current, and the champion's last pull. */
export const CURRENT_MUL = 1.3, SURGE_MUL = 1.15, SURGE_T = 5;
/** Seconds of count-in before the new races start (the old ones start at once). */
export const LEAD = 1.8;
/** Slow mode runs the whole race at this speed; the tap windows stay the same in milliseconds. */
export const SLOW_TIME = 0.8;

/** Free-run finishing times (seconds, for the old 9000-unit course) for the three rivals, fastest first, how often each misses a patch. */
export const PACE = [[42.5, 44.5], [46, 48.5], [49.5, 52]] as const;
export const MISS = [0.06, 0.12, 0.2] as const;
/** Old boats pick any style; the new ones have one each so a boat reads the same every race: red bolts then tires, green holds, yellow closes. */
export const STYLE = [[1.07, 1, 0.94], [1, 1, 1], [0.95, 0.99, 1.07]] as const;
export const KIND_STYLE = [[1, 1, 1], [1.12, 1, 0.88], [1, 1, 1], [0.9, 1, 1.12]] as const;
export const BOSS_STYLE = [1.05, 1, 0.97] as const;
const RIVAL_LANES = [[0, 3, 4], [0, 1, 4]] as const;

export type Boat = {
  lane: number; x: number; y: number; speed: number;
  /** Seconds of কচুরিপানা drag left, seconds held behind another boat, seconds before a rival may change lanes again, finish time or -1. */
  slow: number; held: number; cool: number; done: number;
  /** Rivals only: pace, style per third of the course, a seeded sway, which patch rows it fails to see, which side it prefers. */
  base: number; style: readonly number[]; phase: number; miss: Uint8Array; pref: number;
  /** 0 you, 1 red, 2 green, 3 yellow. The champion is a boat too, with `boss` set. Seconds of last pull left, and narrow stretches already passed. */
  kind: number; boss: boolean; surge: number; nar: number;
};

/** What happened, for the scene's pops, the edge and the sounds. `n` and `v` depend on the type. */
export const HIT = 0, OFF = 1, MISSED = 2, BEAT = 3, PATCH = 4, BLOCKED = 5, GUST = 6, GUST_WARN = 7, SURGE_WARN = 8, SURGE = 9, NARROW_WARN = 10, SHOVED = 11;
export type RaceEvent = { type: number; t: number; n: number; v: number };
const EVENTS = 16;

export type Race = {
  seed: number; level: number; old: boolean; mode: Mode; def: LevelDef; plan: Plan;
  patches: Patch[]; rows: number; beats: number[]; accents: Uint8Array;
  narrows: Seg[]; currents: Seg[]; gusts: Gust[]; gustNext: number; gustWarned: number; narrowWarned: number;
  /** Per beat: 0 still to come, 2 দারুণ, 1 তালে, -1 missed. */
  marks: Int8Array;
  /** boats[0] is you. */
  boats: Boat[]; order: Uint8Array;
  /** The champion's boat index, or -1; where its last pulls start, the next one and whether it has been warned. */
  boss: number; surgeAt: number[]; surgeNext: number; surgeWarned: boolean;
  t: number; next: number; tick: number;
  /** This phone's touch lag in seconds of real time: a tap counts as made this much earlier. */
  lag: number;
  /** 1, or SLOW_TIME. Game seconds pass this fast per second of real time. */
  scale: number;
  /** Tap windows in real seconds (the mode's width). */
  window: number; perfectWindow: number;
  burst: number;
  boost: number; streak: number; bestStreak: number; stumble: number;
  hits: number; perfect: number; offbeats: number; patchHits: number; gustsFaced: number;
  /** The place you held longest was at the back: seconds spent last, for the edge and the stats. */
  lastFor: number;
  firstPatch: number; over: boolean; rank: number; tenths: number;
  events: RaceEvent[]; eventCount: number;
};

const boat = (lane: number, kind: number): Boat => ({
  lane, x: laneX(lane), y: 0, speed: 0, slow: 0, held: 0, cool: 0, done: -1,
  base: 0, style: KIND_STYLE[1], phase: 0, miss: new Uint8Array(0), pref: 1, kind, boss: false, surge: 0, nar: 0,
});

/** A new race from one seed, the race number and the mode: the same river, the same rivals and the same drum on every phone. */
export function createRace(seed: number, level: number, mode: Mode = "n", old = false, lag = 0, scale = 1): Race {
  if (!isLevel(level, old)) level = old ? LEGACY_LEVEL : 1;
  const def = levelDef(level, old), plan = planOf(def, old), info = MODE_INFO[mode];
  const rng = makeRng(seed), rng2 = makeRng(seed * 7 + 13);
  const { patches, rows, narrows, currents, gusts } = makeCourse(rng, plan, rng2);
  const { beats, accents } = makeBeats(rng, plan);
  const lanes = RIVAL_LANES[pick(rng, RIVAL_LANES.length)];
  const boats = [boat(PLAYER_LANE, 0), boat(lanes[0], 1), boat(lanes[1], 2), boat(lanes[2], 3)];
  // Which rival (red, green or yellow) is the quick one changes with the seed.
  const slots = [1, 2, 3];
  for (let index = slots.length - 1; index > 0; index--) { const other = pick(rng, index + 1); [slots[index], slots[other]] = [slots[other], slots[index]]; }
  PACE.forEach(([low, high], rank) => {
    const rival = boats[slots[rank]];
    const time = (low + rng() * (high - low)) * def.k * (old ? 1 : info.rival) * (plan.course / 9000);
    let style: readonly number[] = STYLE[pick(rng, STYLE.length)];
    rival.phase = rng() * 6.283;
    rival.pref = rng() < 0.5 ? -1 : 1;
    rival.miss = new Uint8Array(rows);
    for (let row = 1; row < rows; row++) rival.miss[row] = rng() < MISS[rank] ? 1 : 0;
    if (!old) style = KIND_STYLE[rival.kind];
    if (!old && rank === 0 && def.boss) { rival.boss = true; style = BOSS_STYLE; rival.miss.fill(0); }
    rival.style = style;
    rival.base = plan.course / (3 * time) * (1 / style[0] + 1 / style[1] + 1 / style[2]);
  });
  const boss = boats.findIndex(it => it.boss);
  const surgeAt = !def.boss ? [] : def.world >= 2 ? [0.42, 0.66, 0.86] : [0.55, 0.82];
  const burst = old ? OLD_PERFECT_BURST : NEW_PERFECT * def.gap;
  return {
    seed, level, old, mode, def, plan, patches, rows, beats, accents, narrows, currents, gusts, gustNext: 0, gustWarned: -1, narrowWarned: -1,
    marks: new Int8Array(beats.length), boats, order: Uint8Array.from([0, 1, 2, 3]),
    boss, surgeAt: surgeAt.map(share => share * plan.course), surgeNext: 0, surgeWarned: false,
    t: old ? 0 : -LEAD, next: 0, tick: 0, lag, scale, window: WINDOW * (old ? 1 : info.window), perfectWindow: PERFECT * (old ? 1 : info.window), burst,
    boost: 0, streak: 0, bestStreak: 0, stumble: 0,
    hits: 0, perfect: 0, offbeats: 0, patchHits: 0, gustsFaced: 0, lastFor: 0,
    firstPatch: 0, over: false, rank: 0, tenths: 0,
    events: Array.from({ length: EVENTS }, () => ({ type: 0, t: 0, n: 0, v: 0 })), eventCount: 0,
  };
}

export function emit(race: Race, type: number, n: number, v: number) {
  const event = race.events[race.eventCount++ % EVENTS];
  event.type = type; event.t = race.t; event.n = n; event.v = v;
}

/** Are the banks closed to `lane` for a boat whose bow is at `y`? (A stretch stays closed until the stern is clear.) */
export function closed(race: Race, y: number, lane: number) {
  if (lane !== 0 && lane !== LANES - 1) return false;
  for (let index = 0; index < race.narrows.length; index++) if (y >= race.narrows[index].y0 && y - BOAT_LEN <= race.narrows[index].y1) return true;
  return false;
}

/** Is there room for boat `index` in `lane` right now: nobody beside it there, nor heading there? */
export function roomIn(race: Race, index: number, lane: number) {
  const me = race.boats[index], x = laneX(lane);
  for (let other = 0; other < race.boats.length; other++) {
    if (other === index) continue;
    const them = race.boats[other];
    if (Math.abs(them.x - x) >= SIDE && Math.abs(laneX(them.lane) - x) >= SIDE) continue;
    if (them.y > me.y - BOAT_LEN - FOLLOW && them.y - BOAT_LEN < me.y + FOLLOW) return false;
  }
  return true;
}

/** A tap on the left (-1) or right (+1): head one lane over, unless a boat is alongside there or the bank is closed. Two quick taps cross two lanes. */
export function steer(race: Race, towards: -1 | 1) {
  const you = race.boats[0], lane = you.lane + towards;
  if (race.over || race.t < 0 || lane < 0 || lane >= LANES) return false;
  if (closed(race, you.y, lane) || !roomIn(race, 0, lane)) { emit(race, BLOCKED, towards, 0); return false; }
  you.lane = lane;
  return true;
}

/**
 * A tap on the drum, `extra` seconds of real time after the last step (the tap's own timestamp, so a frame boundary never moves it).
 * It counts as made `race.lag` earlier (this phone's touch lag). Returns 2 for দারুণ, 1 for তালে, 0 for a tap that does nothing
 * (before the start, or a second tap on a beat already caught), -1 for a tap off the beat.
 */
export function tapBeat(race: Race, extra = 0) {
  if (race.over || race.t < 0) return 0;
  const at = race.t + (clamp(extra, 0, 0.05) - race.lag) * race.scale, window = race.window * race.scale, perfect = race.perfectWindow * race.scale;
  let best = -1, gap = Infinity;
  for (let index = Math.max(0, race.next - 1); index <= Math.min(race.beats.length - 1, race.next + 1); index++) {
    const distance = Math.abs(at - race.beats[index]);
    if (distance < gap) { gap = distance; best = index; }
  }
  if (best < 0) return 0;
  const delta = (at - race.beats[best]) / race.scale;
  if (gap <= window) {
    if (race.marks[best] !== 0) return 0;
    const rating = gap <= perfect ? 2 : 1;
    race.marks[best] = rating;
    const power = race.burst * (rating === 2 ? 1 : GOOD_SHARE) * (rating === 2 && race.accents[best] ? ACCENT : 1);
    race.boost += race.old ? (rating === 2 ? OLD_PERFECT_BURST : OLD_BURST) : power;
    race.streak = Math.min(STREAK_MAX, race.streak + 1);
    if (race.streak > race.bestStreak) race.bestStreak = race.streak;
    race.hits++;
    if (rating === 2) race.perfect++;
    emit(race, HIT, rating + (race.accents[best] ? 2 : 0), delta);
    return rating;
  }
  race.stumble = STUMBLE_T;
  race.streak = 0;
  race.offbeats++;
  emit(race, OFF, best, delta);
  return -1;
}

/** Your place right now: 1 plus every rival ahead of you (or already in). */
export function placeNow(race: Race) {
  if (race.over) return race.rank;
  let place = 1;
  for (let index = 1; index < race.boats.length; index++) if (race.boats[index].done >= 0 || race.boats[index].y > race.boats[0].y) place++;
  return place;
}

/** The beat the ring is closing in on: the next one not yet caught or missed (still inside its window counts); -1 if none. */
export function pending(race: Race) {
  const window = race.window * race.scale;
  for (let index = Math.max(0, race.next - 1); index < race.beats.length; index++) {
    if (race.beats[index] - race.t < -window) continue;
    if (race.marks[index] !== 0) continue;
    return index;
  }
  return -1;
}

/** The index of the last beat at or before `t`, or -1 before the first. */
export function beatBefore(race: Race, t: number) {
  let index = Math.min(race.tick, race.beats.length) - 1;
  while (index >= 0 && race.beats[index] > t) index--;
  while (index + 1 < race.beats.length && race.beats[index + 1] <= t) index++;
  return index;
}

/** The race number a link without one means, and how many races the old ladder had. */
export { LEGACY_LEVEL, OLD_COUNT, NARROW_LANES, narrowAt, laneX, FRONT_Y };

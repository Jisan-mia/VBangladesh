// The race as plain functions: the seeded river (where the কচুরিপানা float), the drum's beat, three rival boats,
// lane changes, taps on the beat and the clock. No DOM and no React, so a challenge link replays the same river
// and the tests can race it headless.
import { makeRng, pick } from "../../../shared/game-core";

/** The play field in logical units; the canvas scales it to the phone. The river runs up the screen in five lanes. */
export const W = 360, H = 470;
export const LANES = 5, LANE_W = 60, BANK = (W - LANES * LANE_W) / 2;
export const laneX = (lane: number) => BANK + LANE_W * (lane + 0.5);
const ALL = (1 << LANES) - 1;
/** A long racing boat, bow to stern, and its hull's width at the waist. */
export const BOAT_LEN = 104, HULL_W = 18;
/** Two boats closer than this side to side would clash oars, so the one behind waits. Lanes are 60 apart. */
export const SIDE = 46;
/** The closest a bow may follow another boat's stern. */
export const FOLLOW = 12;
/** Where your bow sits on screen. */
export const FRONT_Y = 310;
/** From the start rope to the finish rope. */
export const COURSE = 9000;
/** You start in the middle lane with a free lane beside you, so the first patch can always be dodged. */
export const PLAYER_LANE = 2;
const RIVAL_LANES = [[0, 3, 4], [0, 1, 4]] as const;

/** Speeds in units a second. You row at CRUISE; each beat you catch adds a burst that fades, and a run of beats adds a little more. */
export const CRUISE = 165, BURST = 80, PERFECT_BURST = 105, BOOST_T = 1.2, STREAK_STEP = 3, STREAK_MAX = 6;
/** Nobody goes faster than this; the river's gaps are laid out for it. */
export const VMAX = 340;
/** How quickly a boat reaches the speed it's rowing for (per second): a long boat has weight. */
export const GRIP = 4;
/** The beat counts within ±WINDOW seconds, and within ±PERFECT it's "দারুণ!". */
export const WINDOW = 0.25, PERFECT = 0.09;
/** A tap far off the beat breaks the rhythm: the rowers fumble for a moment. Mild, but it stops button-mashing. */
export const STUMBLE_T = 0.35, STUMBLE_LOW = 0.8;
/** Hitting a কচুরিপানা patch drags the boat down to SLOW_LOW of its speed; it recovers over SLOW_T. */
export const SLOW_T = 0.9, SLOW_LOW = 0.45;
/** One lane change takes this long. */
export const SWITCH_T = 0.2;
const SIDE_SPEED = LANE_W / SWITCH_T;
/** Time a person needs to see a patch and start moving, a cheap phone's touch lag included. */
export const SLACK = 0.45;
export const PATCH_W = 44;
/** The first patch, in your own lane, a few beats in. The last stretch before the finish is open water. */
export const FIRST_ROW = 820, CLEAR_END = 480;

/** The drum: a line of the chant is four beats at one tempo; later lines may quicken. */
export const FIRST_BEAT = 1.6, BEATS_PER_LINE = 4;
const TEMPO = [2.2, 2.0, 1.8, 1.6] as const;

/** Free-run finishing times (seconds) for the three rivals, fastest first, how often each one misses seeing a patch, and pace styles. */
const PACE = [[42.5, 44.5], [46, 48.5], [49.5, 52]] as const;
const MISS = [0.06, 0.12, 0.2] as const;
const STYLE = [[1.07, 1, 0.94], [1, 1, 1], [0.95, 0.99, 1.07]] as const;

const clamp = (value: number, low: number, high: number) => Math.min(high, Math.max(low, value));
const lerp = (from: number, to: number, amount: number) => from + (to - from) * amount;

export type Patch = { lane: number; x: number; y: number; len: number; row: number; look: number; hitBy: number; hitAt: number; side: number };

export type Boat = {
  lane: number; x: number; y: number; speed: number;
  /** Seconds of কচুরিপানা drag left, seconds held behind another boat, seconds before a rival may change lanes again, finish time or -1. */
  slow: number; held: number; cool: number; done: number;
  /** Rivals only: pace, style per third of the course, a seeded sway, which patch rows it fails to see, which side it prefers. */
  base: number; style: readonly number[]; phase: number; miss: Uint8Array; pref: number;
};

/** What happened, for the scene's pops and the drum sounds. `n` and `v` depend on the type. */
export const HIT = 0, OFF = 1, MISSED = 2, BEAT = 3, PATCH = 4, BLOCKED = 5;
export type RaceEvent = { type: number; t: number; n: number; v: number };

export type Race = {
  seed: number; patches: Patch[]; rows: number; beats: number[];
  /** Per beat: 0 still to come, 2 দারুণ, 1 তালে, -1 missed. */
  marks: Int8Array;
  /** boats[0] is you. */
  boats: Boat[]; order: Uint8Array;
  t: number; next: number; tick: number;
  /** This phone's touch lag in game seconds: a tap counts as made this much earlier. */
  lag: number;
  boost: number; streak: number; stumble: number;
  hits: number; perfect: number; offbeats: number; patchHits: number;
  firstPatch: number; over: boolean; rank: number; tenths: number;
  events: RaceEvent[]; eventCount: number;
};

/** True when from every lane in `from` (a bitmask) some lane in `to` is at most `reach` lanes away. */
export function fair(from: number, to: number, reach: number) {
  for (let lane = 0; lane < LANES; lane++) {
    if (!(from & (1 << lane))) continue;
    let ok = false;
    for (let other = 0; other < LANES; other++) if (to & (1 << other) && Math.abs(other - lane) <= reach) ok = true;
    if (!ok) return false;
  }
  return true;
}

/** How many lanes a person can cross in `time` seconds and still be safe. */
export const reachIn = (time: number) => clamp(Math.floor((time - SLACK) / SWITCH_T + 1e-9), 0, LANES - 1);

const rotate = (mask: number) => ((mask << 1) | (mask >> (LANES - 1))) & ALL;

/**
 * The river's কচুরিপানা, row by row. A row covers one lane early on and sometimes two later, never more, and the gap before
 * it is timed for the fastest anyone can row: from every open lane of the last row an open lane of this one is in reach.
 */
export function makeCourse(rng: () => number) {
  const patches: Patch[] = [];
  let y = FIRST_ROW, row = 0, open = ALL, end = 0;
  while (y < COURSE - CLEAR_END) {
    const progress = y / COURSE;
    let blocked: number;
    if (row === 0) blocked = 1 << PLAYER_LANE;
    else {
      const reach = reachIn((y - end - BOAT_LEN) / VMAX);
      const first = pick(rng, LANES);
      blocked = 1 << first;
      if (row >= 3 && rng() < 0.12 + 0.4 * progress) blocked |= 1 << ((first + 1 + pick(rng, LANES - 1)) % LANES);
      for (let tries = 0; tries < LANES && !fair(open, ALL & ~blocked, reach); tries++) blocked = rotate(blocked);
      if (!fair(open, ALL & ~blocked, reach)) blocked = 1 << first;
    }
    let rowEnd = y, stagger = 0;
    for (let lane = 0; lane < LANES; lane++) {
      if (!(blocked & (1 << lane))) continue;
      const len = 44 + pick(rng, 3) * 8;
      patches.push({ lane, x: laneX(lane), y: y + stagger, len, row, look: pick(rng, 3), hitBy: -1, hitAt: 0, side: 1 });
      rowEnd = Math.max(rowEnd, y + stagger + len);
      stagger = 10 + pick(rng, 3) * 10;
    }
    open = ALL & ~blocked;
    end = rowEnd;
    row++;
    // Seconds (at top speed) from this row's far end until the next row: roomy at first, tighter near the finish.
    const gap = lerp(1.2, 0.7, clamp(progress * 1.4, 0, 1)) * (1 + 0.35 * rng());
    y = end + BOAT_LEN + gap * VMAX;
  }
  return { patches, rows: row };
}

/** The beat times in seconds from the start: the first line steady and slow, later lines quicker. */
export function makeBeats(rng: () => number) {
  const beats: number[] = [];
  let t = FIRST_BEAT;
  for (let line = 0; t < 100; line++) {
    const quickest = line === 0 ? 0 : line < 3 ? 1 : line < 5 ? 2 : 3;
    const gap = TEMPO[line === 0 ? 0 : quickest - pick(rng, 2)];
    for (let k = 0; k < BEATS_PER_LINE; k++) { beats.push(t); t += gap; }
  }
  return beats;
}

const boat = (lane: number): Boat => ({
  lane, x: laneX(lane), y: 0, speed: 0, slow: 0, held: 0, cool: 0, done: -1,
  base: 0, style: STYLE[1], phase: 0, miss: new Uint8Array(0), pref: 1,
});

/** A new race from one seed: the same river, the same rivals and the same drum on every phone. */
export function createRace(seed: number, lag = 0): Race {
  const rng = makeRng(seed);
  const { patches, rows } = makeCourse(rng);
  const beats = makeBeats(rng);
  const boats = [boat(PLAYER_LANE), ...RIVAL_LANES[pick(rng, RIVAL_LANES.length)].map(lane => boat(lane))];
  // Which rival (red, green or yellow) is the quick one changes with the seed.
  const slots = [1, 2, 3];
  for (let index = slots.length - 1; index > 0; index--) { const other = pick(rng, index + 1); [slots[index], slots[other]] = [slots[other], slots[index]]; }
  PACE.forEach(([low, high], rank) => {
    const rival = boats[slots[rank]];
    const time = low + rng() * (high - low), style = STYLE[pick(rng, STYLE.length)];
    rival.style = style;
    rival.base = COURSE / (3 * time) * (1 / style[0] + 1 / style[1] + 1 / style[2]);
    rival.phase = rng() * 6.283;
    rival.pref = rng() < 0.5 ? -1 : 1;
    rival.miss = new Uint8Array(rows);
    for (let row = 1; row < rows; row++) rival.miss[row] = rng() < MISS[rank] ? 1 : 0;
  });
  return {
    seed, patches, rows, beats, marks: new Int8Array(beats.length), boats, order: Uint8Array.from([0, 1, 2, 3]),
    t: 0, next: 0, tick: 0, lag, boost: 0, streak: 0, stumble: 0,
    hits: 0, perfect: 0, offbeats: 0, patchHits: 0, firstPatch: 0, over: false, rank: 0, tenths: 0,
    events: Array.from({ length: 12 }, () => ({ type: 0, t: 0, n: 0, v: 0 })), eventCount: 0,
  };
}

function emit(race: Race, type: number, n: number, v: number) {
  const event = race.events[race.eventCount++ % race.events.length];
  event.type = type; event.t = race.t; event.n = n; event.v = v;
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

/** A tap on the left (-1) or right (+1): head one lane over, unless a boat is alongside there. Two quick taps cross two lanes. */
export function steer(race: Race, towards: -1 | 1) {
  const you = race.boats[0], lane = you.lane + towards;
  if (race.over || lane < 0 || lane >= LANES) return false;
  if (!roomIn(race, 0, lane)) { emit(race, BLOCKED, towards, 0); return false; }
  you.lane = lane;
  return true;
}

/**
 * A tap on the drum. It counts as made `race.lag` seconds earlier (this phone's touch lag). Returns 2 for দারুণ, 1 for তালে,
 * 0 for a second tap on a beat already caught (no harm done), -1 for a tap off the beat.
 */
export function tapBeat(race: Race) {
  if (race.over) return 0;
  const at = race.t - race.lag;
  let best = -1, gap = Infinity;
  for (let index = Math.max(0, race.next - 1); index <= Math.min(race.beats.length - 1, race.next + 1); index++) {
    const distance = Math.abs(at - race.beats[index]);
    if (distance < gap) { gap = distance; best = index; }
  }
  if (best < 0) return 0;
  const delta = at - race.beats[best];
  if (gap <= WINDOW) {
    if (race.marks[best] !== 0) return 0;
    const rating = gap <= PERFECT ? 2 : 1;
    race.marks[best] = rating;
    race.boost += rating === 2 ? PERFECT_BURST : BURST;
    race.streak = Math.min(STREAK_MAX, race.streak + 1);
    race.hits++;
    if (rating === 2) race.perfect++;
    emit(race, HIT, rating, delta);
    return rating;
  }
  race.stumble = STUMBLE_T;
  race.streak = 0;
  race.offbeats++;
  emit(race, OFF, best, delta);
  return -1;
}

/** Distance from `y` to the nearest live patch in `lane` within `look` (one alongside counts as 0); `look` if none. Rivals skip rows they miss. */
function clearAhead(race: Race, lane: number, y: number, look: number, rival: Boat | null) {
  let nearest = look;
  for (let index = race.firstPatch; index < race.patches.length; index++) {
    const patch = race.patches[index];
    if (patch.y > y + look) break;
    if (patch.lane !== lane || patch.hitBy >= 0 || patch.y + patch.len < y - BOAT_LEN) continue;
    if (rival && rival.miss[patch.row]) continue;
    nearest = Math.min(nearest, Math.max(0, patch.y - y));
  }
  return nearest;
}

/** A rival looks ahead: a patch it has seen or a slower boat in its lane sends it to the clearer side, if there's room. */
function steerRival(race: Race, index: number) {
  const rival = race.boats[index];
  if (rival.cool > 0 || rival.x !== laneX(rival.lane)) return;
  const look = rival.speed + 60;
  let here = clearAhead(race, rival.lane, rival.y, look, rival);
  for (let other = 0; other < race.boats.length; other++) {
    const them = race.boats[other];
    if (other === index || Math.abs(them.x - rival.x) >= SIDE || them.y <= rival.y) continue;
    if (them.y - BOAT_LEN - rival.y < look * 0.6 && them.speed < rival.speed - 5) here = Math.min(here, them.y - BOAT_LEN - rival.y);
  }
  if (here >= look) return;
  let best = -1, bestClear = here + 1;
  for (const towards of [rival.pref, -rival.pref]) {
    const lane = rival.lane + towards;
    if (lane < 0 || lane >= LANES || !roomIn(race, index, lane)) continue;
    const clear = clearAhead(race, lane, rival.y, look * 1.5, rival);
    if (clear > bestClear) { best = lane; bestClear = clear; }
  }
  if (best >= 0) { rival.lane = best; rival.cool = 0.6; }
}

/** The speed a boat is rowing for right now. */
function wanted(race: Race, index: number) {
  const it = race.boats[index];
  let speed: number;
  if (it.done >= 0) speed = index === 0 ? CRUISE * 0.3 : it.base * 0.8;
  else if (index === 0) speed = (CRUISE + STREAK_STEP * race.streak + race.boost) * (race.stumble > 0 ? STUMBLE_LOW : 1);
  else speed = it.base * it.style[Math.min(2, Math.floor(it.y / (COURSE / 3)))] * (1 + 0.03 * Math.sin(race.t * 0.9 + it.phase));
  if (it.slow > 0) speed *= lerp(SLOW_LOW, 1, 1 - it.slow / SLOW_T);
  return Math.min(VMAX, speed);
}

/**
 * Advances the race by `dt` game seconds (the caller slows time for slow mode). Mutates `race` and allocates nothing:
 * it runs 60 times a second on cheap phones. After you finish, the other boats keep rowing in (for the scene) but
 * nothing counts any more.
 */
export function stepRace(race: Race, dt: number) {
  race.t += dt;
  const boats = race.boats;

  if (!race.over) {
    // The drum: a beat sounds, and a beat whose window has passed uncaught is a miss.
    while (race.tick < race.beats.length && race.t >= race.beats[race.tick]) emit(race, BEAT, race.tick++, 0);
    while (race.next < race.beats.length && race.t - race.lag > race.beats[race.next] + WINDOW) {
      if (race.marks[race.next] === 0) { race.marks[race.next] = -1; race.streak = 0; emit(race, MISSED, race.next, 0); }
      race.next++;
    }
    race.boost *= Math.exp(-dt / BOOST_T);
    if (race.stumble > 0) race.stumble -= dt;
    for (let index = 1; index < boats.length; index++) { if (boats[index].cool > 0) boats[index].cool -= dt; if (boats[index].done < 0) steerRival(race, index); }
  }

  const grip = Math.min(1, GRIP * dt);
  for (let index = 0; index < boats.length; index++) {
    const it = boats[index];
    if (it.slow > 0) it.slow -= dt;
    it.speed += (wanted(race, index) - it.speed) * grip;
    it.y += it.speed * dt;
    const target = laneX(it.lane), move = SIDE_SPEED * dt;
    it.x = Math.abs(target - it.x) <= move ? target : it.x + Math.sign(target - it.x) * move;
  }

  // Front boat first; a boat that would run into the stern ahead of it waits there (and so must row around it).
  const order = race.order;
  for (let i = 1; i < order.length; i++) for (let j = i; j > 0 && boats[order[j]].y > boats[order[j - 1]].y; j--) { const swap = order[j]; order[j] = order[j - 1]; order[j - 1] = swap; }
  for (let i = 0; i < order.length; i++) {
    const it = boats[order[i]];
    let held = false;
    for (let j = 0; j < i; j++) {
      const ahead = boats[order[j]];
      if (Math.abs(ahead.x - it.x) < SIDE && it.y > ahead.y - BOAT_LEN - FOLLOW) { it.y = ahead.y - BOAT_LEN - FOLLOW; it.speed = Math.min(it.speed, ahead.speed); held = true; }
    }
    it.held = held ? it.held + dt : 0;
  }

  if (race.over) return;

  // কচুরিপানা: the first boat into a patch is dragged down and scatters it.
  const front = boats[order[0]].y;
  for (let index = race.firstPatch; index < race.patches.length; index++) {
    const patch = race.patches[index];
    if (patch.y > front) break;
    if (patch.hitBy >= 0) continue;
    for (let who = 0; who < boats.length; who++) {
      const it = boats[who];
      if (it.y <= patch.y || it.y - BOAT_LEN >= patch.y + patch.len || Math.abs(it.x - patch.x) >= (HULL_W + PATCH_W) / 2) continue;
      patch.hitBy = who; patch.hitAt = race.t; patch.side = it.x >= patch.x ? -1 : 1;
      it.slow = SLOW_T; it.speed *= SLOW_LOW;
      if (who === 0) { race.boost = 0; race.streak = 0; race.patchHits++; }
      emit(race, PATCH, who, index);
      break;
    }
  }
  const rear = boats[order[order.length - 1]].y - BOAT_LEN;
  while (race.firstPatch < race.patches.length && race.patches[race.firstPatch].y + race.patches[race.firstPatch].len < rear - 200) race.firstPatch++;

  // The finish rope: the exact moment each bow crossed it, so two boats in the same step are still told apart.
  for (let index = 0; index < boats.length; index++) {
    const it = boats[index];
    if (it.done < 0 && it.y >= COURSE) it.done = race.t - (it.y - COURSE) / Math.max(1, it.speed);
  }
  const you = boats[0];
  if (you.done >= 0) {
    let rank = 1;
    for (let index = 1; index < boats.length; index++) if (boats[index].done >= 0 && boats[index].done < you.done) rank++;
    race.rank = rank;
    race.tenths = Math.round(you.done * 10);
    race.over = true;
  }
}

/** Your place right now: 1 plus every rival ahead of you (or already in). */
export function placeNow(race: Race) {
  if (race.over) return race.rank;
  let place = 1;
  for (let index = 1; index < race.boats.length; index++) if (race.boats[index].done >= 0 || race.boats[index].y > race.boats[0].y) place++;
  return place;
}

/** The index of the last beat at or before `t`, or -1 before the first. */
export function beatBefore(race: Race, t: number) {
  let index = Math.min(race.tick, race.beats.length) - 1;
  while (index >= 0 && race.beats[index] > t) index--;
  while (index + 1 < race.beats.length && race.beats[index + 1] <= t) index++;
  return index;
}

/** "তাল মেলাও": a steady pulse to tap along with, once, so a phone's touch lag can be measured. */
export const CALIB_BEATS = [1.2, 2.1, 3.0, 3.9, 4.8, 5.7, 6.6, 7.5] as const;
export const MIN_LAG = -0.1, MAX_LAG = 0.3;

/** The median gap between each tap and its nearest pulse, in seconds; null unless at least four taps landed near a pulse. */
export function lagFrom(taps: readonly number[], beats: readonly number[] = CALIB_BEATS) {
  const gaps: number[] = [];
  for (const tap of taps) {
    let gap = Infinity;
    for (const beat of beats) if (Math.abs(tap - beat) < Math.abs(gap)) gap = tap - beat;
    if (Math.abs(gap) <= 0.4) gaps.push(gap);
  }
  if (gaps.length < 4) return null;
  gaps.sort((a, b) => a - b);
  const middle = gaps.length >> 1;
  const median = gaps.length % 2 ? gaps[middle] : (gaps[middle - 1] + gaps[middle]) / 2;
  return Math.round(clamp(median, MIN_LAG, MAX_LAG) * 100) / 100;
}

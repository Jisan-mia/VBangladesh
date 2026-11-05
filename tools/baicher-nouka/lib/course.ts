// The river as plain functions: the seeded course (where the কচুরিপানা float, where a current runs, where the banks close, where a
// gust comes) and the drum's beat times. No DOM, no React. With the old plan (links without `v=2`) every number is drawn from the
// seed in the order the first version drew them, so an old link still opens the same river.
import { pick } from "../../../shared/game-core";
import type { LevelDef } from "./levels";

/** The play field in logical units; the canvas scales it to the phone. The river runs up the screen in five lanes. */
export const W = 360, H = 500;
export const LANES = 5, LANE_W = 60, BANK = (W - LANES * LANE_W) / 2;
export const laneX = (lane: number) => BANK + LANE_W * (lane + 0.5);
export const ALL = (1 << LANES) - 1;
/** While the banks close only the middle three lanes are open. */
export const NARROW_LANES = 0b01110;
/** A long racing boat, bow to stern, and its hull's width at the waist. */
export const BOAT_LEN = 104, HULL_W = 18;
/** Where your bow sits on screen. */
export const FRONT_Y = 340;
/** Nobody goes faster than this; the river's gaps are laid out for it. */
export const VMAX = 340;
/** Time a person needs to see a patch and start moving, a cheap phone's touch lag included. One lane change takes SWITCH_T. */
export const SLACK = 0.45, SWITCH_T = 0.2;
export const PATCH_W = 44;
/** Two boats closer than this side to side clash oars. */
export const SIDE_GAP = 46;
/** You start in the middle lane with a free lane beside you, so the first patch can always be dodged. */
export const PLAYER_LANE = 2;

export const clamp = (value: number, low: number, high: number) => Math.min(high, Math.max(low, value));
export const lerp = (from: number, to: number, amount: number) => from + (to - from) * amount;

export type Patch = { lane: number; x: number; y: number; len: number; row: number; look: number; hitBy: number; hitAt: number; side: number };
/** A stretch of river (y0 to y1, bow positions): a current runs in `lane`, or the banks close (lane unused). */
export type Seg = { y0: number; y1: number; lane: number };
/** A crosswind that shoves your boat one lane over (dir -1 left, 1 right) when your bow reaches y. */
export type Gust = { y: number; dir: -1 | 1 };

export type Plan = {
  course: number; firstRow: number; clearEnd: number; patches: 0 | 1 | 2; roomy: number;
  legacy: boolean; current: boolean; narrow: boolean; gusts: boolean;
  gap: number; quicken: readonly [number, number] | null; accent: boolean;
};
export const planOf = (def: LevelDef, old: boolean): Plan => old
  ? { course: def.course, firstRow: 820, clearEnd: 480, patches: 2, roomy: 0, legacy: true, current: false, narrow: false, gusts: false, gap: 0, quicken: null, accent: false }
  : { course: def.course, firstRow: def.firstRow, clearEnd: def.clearEnd, patches: def.patches, roomy: def.roomy, legacy: false, current: def.current, narrow: def.narrow, gusts: def.gusts, gap: def.gap, quicken: def.quicken, accent: def.accent };

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
/** The lanes a boat could be in if it were in one of `mask` and the banks closed: the edge lanes squeeze in. */
const squeeze = (mask: number) => (mask & NARROW_LANES) | (mask & 1 ? 0b10 : 0) | (mask & 0b10000 ? 0b1000 : 0);
/** The lanes a crosswind can move a boat from `mask` to (it stays when it is against the bank). */
const gusted = (mask: number, dir: number) => mask | (dir > 0 ? (mask << 1) & ALL : mask >> 1);

/** Is the narrow part of the river at bow position `y`? */
export function narrowAt(narrows: readonly Seg[], y: number) {
  for (let index = 0; index < narrows.length; index++) if (y >= narrows[index].y0 && y <= narrows[index].y1) return true;
  return false;
}

/**
 * The river's কচুরিপানা, row by row. A row covers one lane early on and sometimes two later, never more, and the gap before
 * it is timed for the fastest anyone can row: from every open lane of the last row an open lane of this one is in reach.
 * New plans also lay out currents, narrow stretches (rows there cover one of the three open lanes) and gusts (each with
 * a roomier gap, and fair from every lane the gust can shove you to). `rng2` feeds only those, so the old river never changes.
 */
export function makeCourse(rng: () => number, plan: Plan, rng2: () => number) {
  const patches: Patch[] = [], narrows: Seg[] = [], currents: Seg[] = [], gusts: Gust[] = [];
  const total = plan.course;
  if (plan.narrow) {
    narrows.push({ y0: total * 0.28, y1: total * 0.48, lane: 0 });
    if (total >= 5000) narrows.push({ y0: total * 0.66, y1: total * 0.8, lane: 0 });
  }
  if (plan.current) {
    for (const at of [0.14, 0.4, 0.64]) {
      const lane = plan.narrow ? 1 + pick(rng2, 3) : pick(rng2, LANES);
      currents.push({ y0: total * at, y1: total * (at + 0.17), lane });
    }
  }
  if (plan.patches === 0) return { patches, rows: 0, narrows, currents, gusts };

  let y = plan.firstRow, row = 0, open = ALL, end = 0, prevAllowed = ALL;
  let gust: Gust | null = null;
  while (y < total - plan.clearEnd) {
    // Keep rows out of a narrow stretch's mouth and neck.
    for (const n of narrows) {
      if (y > n.y0 - 220 && y < n.y0 + 200) y = n.y0 + 200;
      else if (y > n.y0 && y < n.y1 && y + 90 > n.y1 - 80) y = n.y1 + 80;
    }
    if (y >= total - plan.clearEnd) break;
    const progress = y / total;
    const allowed = narrowAt(narrows, y) ? NARROW_LANES : ALL;
    let from = open;
    if (gust) from = gusted(from, gust.dir);
    if (allowed !== ALL && prevAllowed === ALL) from = squeeze(from);
    let blocked: number;
    if (row === 0) blocked = 1 << PLAYER_LANE;
    else {
      const reach = gust ? reachIn((y - gust.y) / VMAX) : reachIn((y - end - BOAT_LEN) / VMAX);
      if (allowed === ALL) {
        const first = pick(rng, LANES);
        blocked = 1 << first;
        if (row >= 3 && plan.patches === 2 && rng() < 0.12 + 0.4 * progress) blocked |= 1 << ((first + 1 + pick(rng, LANES - 1)) % LANES);
        for (let tries = 0; tries < LANES && !fair(from, ALL & ~blocked, reach); tries++) blocked = rotate(blocked);
        if (!fair(from, ALL & ~blocked, reach)) blocked = 1 << first;
      } else {
        const first = 1 + pick(rng, 3);
        blocked = 1 << first;
        for (let tries = 0; tries < 3 && !fair(from, allowed & ~blocked, reach); tries++) blocked = 1 << (1 + ((Math.log2(blocked) - 1 + 1) % 3));
      }
    }
    let rowEnd = y, stagger = 0;
    for (let lane = 0; lane < LANES; lane++) {
      if (!(blocked & (1 << lane))) continue;
      const len = 44 + pick(rng, 3) * 8;
      patches.push({ lane, x: laneX(lane), y: y + stagger, len, row, look: pick(rng, 3), hitBy: -1, hitAt: 0, side: 1 });
      rowEnd = Math.max(rowEnd, y + stagger + len);
      stagger = 10 + pick(rng, 3) * 10;
    }
    open = allowed & ~blocked;
    end = rowEnd;
    prevAllowed = allowed;
    row++;
    // Seconds (at top speed) from this row's far end until the next row: roomy at first, tighter near the finish.
    let gap = lerp(1.2, 0.7, clamp(progress * 1.4, 0, 1)) * (1 + 0.35 * rng()) + plan.roomy;
    gust = null;
    if (plan.gusts && rng2() < 0.6) {
      const dir: -1 | 1 = rng2() < 0.5 ? -1 : 1;
      gap = Math.max(gap, 1.75);
      const at = end + BOAT_LEN + 0.25 * gap * VMAX;
      let clear = true;
      for (const n of narrows) if (at > n.y0 - 150 && at < n.y1 + 50) clear = false;
      if (clear) gust = { y: at, dir };
      if (gust) gusts.push(gust);
    }
    y = end + BOAT_LEN + gap * VMAX;
  }
  return { patches, rows: row, narrows, currents, gusts };
}

/** The old plan's drum: a line of four beats at one tempo; later lines may quicken. */
export const FIRST_BEAT = 1.6, BEATS_PER_LINE = 4;
const TEMPO = [2.2, 2.0, 1.8, 1.6] as const;
/** The new drum starts this long after the count-in ends. */
export const FIRST_BEAT_NEW = 1.4;

/** The beat times in seconds from the start (and which are the big strokes). The old plan draws from the seed; new ones are steady. */
export function makeBeats(rng: () => number, plan: Plan) {
  const beats: number[] = [];
  if (plan.legacy) {
    let t = FIRST_BEAT;
    for (let line = 0; t < 100; line++) {
      const quickest = line === 0 ? 0 : line < 3 ? 1 : line < 5 ? 2 : 3;
      const gap = TEMPO[line === 0 ? 0 : quickest - pick(rng, 2)];
      for (let k = 0; k < BEATS_PER_LINE; k++) { beats.push(t); t += gap; }
    }
    return { beats, accents: new Uint8Array(beats.length) };
  }
  const limit = plan.course / 120 + 12;
  let t = FIRST_BEAT_NEW;
  for (let index = 0; t < limit; index++) {
    beats.push(t);
    t += plan.quicken && index >= plan.quicken[0] ? plan.quicken[1] : plan.gap;
  }
  const accents = new Uint8Array(beats.length);
  if (plan.accent) for (let index = 3; index < beats.length; index += 4) accents[index] = 1;
  return { beats, accents };
}

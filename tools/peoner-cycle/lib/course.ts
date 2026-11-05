// Lays out one route from its level data and a seed: rows of things on the road, the gates, letters lying about, and
// the moving or special things (vans, mud, crossing goats and cows, dogs, gusts). Only the seed and the route decide
// it, never the real speed, so slow mode and a friend's phone get the very same road. Runs once per ride (not hot).
//
// Fairness: every gap before a row is timed for the fastest the bike can be there, so from any lane the bike could be
// in, an open lane is in reach (SLACK to see it, plus one switch a lane). Special things get the room they need.
import { makeRng, pick } from "../../../shared/game-core";
import {
  farthest, fair, laneX, reachIn, BIKE_LEN, CART, COW, DELIVER_AFTER, DELIVER_BEFORE, DOG_BACK, DOG_V, GOAT, LANES, LETTER, MUD_T,
  PUDDLE, SLACK, SPEC, SWITCH_T, UNIT, VAN, VAN_TRIG, VAN_V, WALK_COW, WALK_GOAT,
} from "./geometry";
import { levelOf, type LevelSpec } from "./levels";

/** One thing on the road. `y` is its near edge at the start; vans move towards you, crossing animals walk to `to`. */
export type Thing = {
  kind: number; lane: number; to: number; x: number; w: number; y: number; len: number;
  /** Units a second towards the bike (vans), and how close the bike must be before it sets off (vans, walkers). */
  vy: number; trigger: number;
  row: number; look: number; boss: number;
};
/** A gate on the verge: side 0 left, 1 right. The letter goes over while the bike passes `y` in the lane beside it. */
export type House = { side: number; y: number; look: number; boss: number };
export type Zone = { y0: number; y1: number };
export type Gust = { y: number; dir: number; lanes: number; boss: number };
/** A dog barks and sets off from behind once the bike's front reaches `at`. */
export type Dog = { at: number };

export type Course = {
  seed: number; level: number; world: number; spec: LevelSpec;
  /** Where the place's banner stands, in units. */
  end: number;
  things: Thing[]; houses: House[]; mud: Zone[]; gusts: Gust[]; dogs: Dog[];
  /** Units of road you can see ahead (Infinity in daylight). */
  sight: number;
  bossCount: number;
};

/** The first row: a puddle in your own lane. */
export const FIRST_Y = 520;
/** The last stretch before the place stays clear, in seconds. */
const FINISH_CLEAR = 1.5;
/** A van's row leaves room for a slowed bike (after a bump the meeting point comes this much closer). */
const VAN_PAD = 130;
/** A single thing stands in the middle lane this often: the lane you start in is never a place to wait. */
const CENTER = 0.45;
const HOUSE = 1, VAN_PLAN = 2, MUD_PLAN = 3, WALK_PLAN = 4, DOG_PLAN = 5, GUST_PLAN = 6;

const clamp = (value: number, low: number, high: number) => Math.min(high, Math.max(low, value));
const lerp = (from: number, to: number, amount: number) => from + (to - from) * amount;

/** The fastest the bike can be at `y` on this route: the ramp from start speed to top speed. */
export const speedAt = (spec: LevelSpec, end: number, y: number) => lerp(spec.speed[0], spec.speed[1], clamp(y / end, 0, 1));

function chooseKind(rng: () => number, kinds: number) {
  const roll = rng();
  if (kinds === 0) return PUDDLE;
  if (kinds === 1) return roll < 0.55 ? PUDDLE : GOAT;
  return roll < 0.3 ? PUDDLE : roll < 0.52 ? GOAT : roll < 0.78 ? CART : COW;
}

type Plan = { at: number; type: number; boss: number; side: number };

export function makeCourse(seed: number, level: number): Course {
  const spec = levelOf(level), rng = makeRng(seed), end = spec.meters * UNIT;
  const v = (y: number) => speedAt(spec, end, y + 200);
  const boss = spec.boss;
  const bossFrom = boss ? 0.6 : 0.92;

  // ---- where the special things go: spread evenly along the route, nudged by the seed ----
  const plans: Plan[] = [];
  const spread = (count: number, type: number, from: number, to: number, isBoss = 0) => {
    for (let index = 0; index < count; index++) plans.push({ at: lerp(from, to, (index + 0.3 + 0.4 * rng()) / count) * end, type, boss: isBoss, side: 0 });
  };
  const bossHouses = boss?.kind === "house" ? boss.count : 0;
  spread(spec.houses - bossHouses, HOUSE, level === 1 ? 0.2 : 0.1, bossFrom);
  spread(spec.vans, VAN_PLAN, 0.2, bossFrom);
  spread(spec.mud, MUD_PLAN, 0.15, bossFrom - 0.05);
  spread(spec.walkers, WALK_PLAN, 0.2, bossFrom);
  spread(spec.dogs, DOG_PLAN, 0.2, bossFrom);
  spread(spec.gusts, GUST_PLAN, 0.2, bossFrom);
  if (boss) spread(boss.count, boss.kind === "house" ? HOUSE : boss.kind === "walker" ? WALK_PLAN : GUST_PLAN, bossFrom, 0.9, 1);
  plans.sort((a, b) => a.at - b.at);
  // Gates alternate more often than not; in the হাট they strictly alternate.
  let side = pick(rng, 2);
  for (const plan of plans) if (plan.type === HOUSE) { side = plan.boss || rng() < 0.65 ? 1 - side : side; plan.side = side; }

  const things: Thing[] = [], houses: House[] = [], mud: Zone[] = [], gusts: Gust[] = [], dogs: Dog[] = [];
  const add = (kind: number, lane: number, y: number, row: number, extra?: Partial<Thing>) => {
    const thing: Thing = { kind, lane, to: lane, x: laneX(lane), w: SPEC[kind].w, y, len: SPEC[kind].len, vy: 0, trigger: 0, row, look: pick(rng, 3), boss: 0, ...extra };
    things.push(thing);
    return thing;
  };
  const inMud = (y: number) => mud.some(zone => y >= zone.y0 - BIKE_LEN && y <= zone.y1 + BIKE_LEN);
  const switchAt = (from: number, to: number) => (inMud(from) || inMud(to) ? MUD_T : SWITCH_T);

  // ---- the first row: a puddle in your own lane ----
  add(PUDDLE, 1, FIRST_Y, 0);
  let cursor = FIRST_Y + SPEC[PUDDLE].len, open = 0b101, rows = 1, planIndex = 0;

  /** Seconds before the next thing, from the route's gap curve and the seed. */
  const gapNow = () => {
    let gap = lerp(spec.gap[0], spec.gap[1], clamp(cursor / end, 0, 1)) * (1 + 0.35 * rng());
    if (rng() < 0.1) gap *= 1.5;
    return gap;
  };
  /** The near edge of the next thing `gap` seconds after the last one's far end, at least `need` seconds on. */
  const nextY = (gap: number, need = 0) => cursor + BIKE_LEN + Math.max(gap, need) * v(cursor);

  /** One lane blocked, the middle one most often, whichever keeps every open lane in reach of an open one; none if none does. */
  const single = (reach: number) => {
    const first = rng() < CENTER ? 1 : rng() < 0.5 ? 0 : 2;
    for (let tries = 0; tries < LANES; tries++) {
      const lane = (first + tries) % LANES;
      if (fair(open, 0b111 & ~(1 << lane), reach)) return 1 << lane;
    }
    return 0;
  };

  /** A row of things. With a gate, the gate's lane stays open (so riding it is safe) and the gap leaves time to get there. */
  function row(gate?: Plan) {
    const gateLane = gate ? (gate.side ? LANES - 1 : 0) : -1;
    const need = gate ? SLACK + farthest(open, gateLane) * switchAt(cursor, cursor + 300) + 0.15 : 0;
    const gap = gapNow(), y = nextY(gap, need) + (gate ? DELIVER_BEFORE : 0);
    const reach = reachIn((y - cursor - BIKE_LEN) / v(cursor), switchAt(cursor, y));
    let blocked: number;
    if (gate) {
      // Beside a gate: one thing in another lane at most, never in the gate's lane, and none in the হাট's rush.
      blocked = gate.boss || rng() < 0.35 ? 0 : 1 << ((gateLane + 1 + pick(rng, 2)) % LANES);
      houses.push({ side: gate.side, y, look: pick(rng, 3), boss: gate.boss });
    } else if (rows >= 2 && rng() < spec.pairs) {
      // A two-lane row: one lane stays open, and it must be in reach from every lane the bike could be in.
      let free = pick(rng, LANES), tries = 0;
      while (tries < LANES && !fair(open, 1 << free, reach)) { free = (free + 1) % LANES; tries++; }
      blocked = tries < LANES ? 0b111 & ~(1 << free) : single(reach);
    } else blocked = single(reach);
    // A letter lying in the gap, always in a lane this row leaves open, so taking it is safe.
    if (rng() < spec.letters) {
      let lane = pick(rng, LANES);
      while (blocked & (1 << lane)) lane = (lane + 1) % LANES;
      add(LETTER, lane, (cursor + y) / 2 - SPEC[LETTER].len / 2, rows);
    }
    let far = gate ? y + DELIVER_AFTER : y, count = 0;
    for (let lane = 0; lane < LANES; lane++) {
      if (!(blocked & (1 << lane))) continue;
      // In a pair, the second one stands a little further on: a road, not a wall.
      const thing = add(chooseKind(rng, spec.kinds), lane, y + (count++ > 0 ? pick(rng, 3) * 12 : 0), rows);
      far = Math.max(far, thing.y + thing.len);
    }
    cursor = far;
    open = 0b111 & ~blocked;
    rows++;
  }

  function special(plan: Plan) {
    const gap = gapNow();
    if (plan.type === HOUSE) {
      row(plan);
    } else if (plan.type === VAN_PLAN) {
      let lane = pick(rng, LANES);
      for (let tries = 0; tries < LANES && !(open & (1 << lane)); tries++) lane = (lane + 1) % LANES;
      const meet = nextY(gap) + VAN_PAD, speed = speedAt(spec, end, meet);
      add(VAN, lane, meet + (VAN_TRIG * VAN_V) / (speed + VAN_V), rows, { vy: VAN_V, trigger: VAN_TRIG });
      cursor = meet + SPEC[VAN].len;
      open = 0b111 & ~(1 << lane);
      rows++;
    } else if (plan.type === MUD_PLAN) {
      const y0 = cursor + BIKE_LEN, y1 = y0 + 2.6 * v(cursor);
      mud.push({ y0, y1 });
    } else if (plan.type === WALK_PLAN) {
      const from = pick(rng, LANES), to = from === 1 ? (rng() < 0.5 ? 0 : 2) : 1, free = 3 - from - to;
      const need = SLACK + farthest(open, free) * switchAt(cursor, cursor + 400) + 0.1;
      const y = nextY(gap, need);
      const kind = plan.boss ? WALK_COW : rng() < 0.6 ? WALK_GOAT : WALK_COW;
      add(kind, from, y, rows, { to, trigger: 420, boss: plan.boss });
      cursor = y + SPEC[kind].len;
      open = 0b111 & ~(1 << to);
      rows++;
    } else if (plan.type === DOG_PLAN) {
      const at = cursor + BIKE_LEN + 0.2 * v(cursor);
      dogs.push({ at });
      cursor = at + (DOG_BACK / DOG_V + 1) * v(cursor);
      open = 0b111;
    } else if (plan.type === GUST_PLAN) {
      const y = nextY(gap, 1.1);
      gusts.push({ y, dir: rng() < 0.5 ? -1 : 1, lanes: plan.boss ? 2 : 1, boss: plan.boss });
      cursor = y + 0.35 * v(y) * (plan.boss ? 2 : 1);
      open = 0b111;
    }
  }

  // ---- walk the route: a special when its place comes up, a row otherwise, then the clear run to the place ----
  for (let guard = 0; guard < 400; guard++) {
    const plan = plans[planIndex];
    const reachNext = cursor + BIKE_LEN + spec.gap[0] * v(cursor);
    if (plan && plan.at <= reachNext + 120) { special(plan); planIndex++; continue; }
    if (planIndex >= plans.length && reachNext + 60 > end - FINISH_CLEAR * v(end)) break;
    if (reachNext + 60 > end - FINISH_CLEAR * v(end)) { special(plan); planIndex++; continue; }
    row();
  }
  const finish = Math.max(end, cursor + FINISH_CLEAR * v(end));
  things.sort((a, b) => a.y - b.y);
  // Mud never runs past the place.
  for (const zone of mud) zone.y1 = Math.min(zone.y1, finish - 40);

  return {
    seed, level, world: spec.world, spec, end: finish, things, houses, mud, gusts, dogs,
    sight: spec.sight || Infinity,
    bossCount: spec.boss?.count ?? 0,
  };
}

/** Exposed for tests and the bots: is `y` inside a mud stretch? */
export const mudAt = (course: Course, y: number) => course.mud.some(zone => y >= zone.y0 && y <= zone.y1);

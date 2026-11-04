// The shoot-out rules, pure and seeded. Goal units: x from -1 (left post) to 1 (right post), y from 0 (grass) to 1 (crossbar).
// Every random thing in a match is drawn up front from the seed, one plan per round, so a challenge link replays the very same
// keeper, the same wind and the same opponent kicks whatever the player does. Resolvers write into an `out` object (no
// allocation per kick: the step code calls them).
import { makeRng, pick, starsFor } from "../../../shared/game-core";
import { levelOf, type Format, type Level } from "./levels";

/** Plans drawn per match. shortcut: a shoot-out tied after 30 rounds reuses plans from round 1; that is ~1 in 10⁸, upgrade never. */
export const MAX_ROUNDS = 30;

/** 0 = screen left, 1 = centre, 2 = screen right. */
export type Zone = 0 | 1 | 2;
export const Outcome = { Goal: 0, Saved: 1, Post: 2, Bar: 3, Wide: 4, Over: 5 } as const;
export type Outcome = typeof Outcome[keyof typeof Outcome];
export type Shot = { x: number; y: number; power: number; curve: number };
export type KickResult = {
  outcome: Outcome;
  /** Where the ball ends, in goal units (for the animation). */
  bx: number; by: number;
  /** Where the keeper dived. */
  keeper: Zone;
  /** A goal the glove nearly reached, or a miss that shaved the frame: the near-miss line. */
  close: boolean;
};
export const makeResult = (): KickResult => ({ outcome: Outcome.Goal, bx: 0, by: 0, keeper: 1, close: false });

/** Their keeper on one of your kicks: his dive (unless he reads a soft shot), the lean he shows first, and the wind. */
export type KeeperPlan = { u: number; zone: Zone; lean: -1 | 0 | 1; wind: number };
/** One opponent kick, decided before the run-up. `lean` is where the shoulders lean (-1 left, 0 straight, 1 right). */
export type ShotPlan = { zone: Zone; high: boolean; miss: boolean; missKind: number; corner: boolean; lean: -1 | 0 | 1; jitter: number };
export type Plans = { keeper: KeeperPlan[]; shots: ShotPlan[] };

const ZONES: readonly Zone[] = [0, 1, 2];
export const zoneOf = (x: number): Zone => x < -0.33 ? 0 : x > 0.33 ? 2 : 1;
const sideOf = (zone: Zone) => (zone - 1) as -1 | 0 | 1;
/** A lean that isn't `truth`: one of the other two. */
const other = (truth: -1 | 0 | 1, coin: number) => (truth === 0 ? (coin ? 1 : -1) : coin ? -truth : 0) as -1 | 0 | 1;
/** Where a diving keeper's hands reach the middle of, per zone. */
export const DIVE = [[-0.6, 0.38], [0, 0.42], [0.6, 0.38]] as const;

/** Same seed, same match: the keeper's dives and leans, the wind, and the opponent's kicks for every round. */
export function makePlans(level: number, seed: number): Plans {
  const data = levelOf(level), keeperRng = makeRng(seed), shotRng = makeRng(seed + 7919);
  const keeper: KeeperPlan[] = [], shots: ShotPlan[] = [];
  for (let round = 0; round < MAX_ROUNDS; round++) {
    // A fixed number of draws per round, so each round's plan never depends on an earlier one.
    const u = keeperRng(), zone = ZONES[pick(keeperRng, 3)], honestKeeper = keeperRng() < data.keeper.tell, coin = pick(keeperRng, 2);
    const wind = data.wind ? (keeperRng() * 2 - 1) * data.wind : (keeperRng(), 0);
    keeper.push({ u, zone, lean: data.keeper.tell ? (honestKeeper ? sideOf(zone) : other(sideOf(zone), coin)) : 0, wind: Math.round(wind * 100) / 100 });
    const shotZone = ZONES[pick(shotRng, 3)], high = shotRng() < 0.4, miss = shotRng() < data.shooter.miss, missKind = pick(shotRng, 3);
    const corner = shotZone !== 1 && shotRng() < data.shooter.corner, honest = shotRng() < data.shooter.honest, fake = pick(shotRng, 2), jitter = shotRng();
    shots.push({ zone: shotZone, high, miss, missKind, corner, lean: honest ? sideOf(shotZone) : other(sideOf(shotZone), fake), jitter });
  }
  return { keeper, shots };
}

/** Very hard kicks rise: above 85% power the ball climbs, up to 0.15 of the goal. */
export const rise = (power: number) => Math.max(0, power - 0.85);
/** How far the wind carries a kick: a soft one drifts the whole wind, a full-power one about half. */
export const drift = (wind: number, power: number) => wind * (1.2 - 0.7 * power);

/** Harder kicks shrink the dive; curl shrinks it more. A soft kick gives the keeper time. */
export function reachFor(level: Level, shot: Shot) {
  return level.keeper.reach * (1.25 - 0.45 * shot.power) * (1 - 0.3 * Math.min(1, Math.abs(shot.curve)));
}
/** The keeper reads a soft shot (power under 0.6) at his read rate; a hard one never. */
export const readsShot = (level: Level, plan: KeeperPlan, power: number) => power < 0.6 && plan.u < level.keeper.read;

/** One of your kicks against this match's keeper, wind included. Writes `out` and returns it. */
export function resolveShot(level: number, plan: KeeperPlan, shot: Shot, out: KickResult): KickResult {
  const data = levelOf(level);
  const x = shot.x + drift(plan.wind, shot.power), y = Math.max(0.04, shot.y + rise(shot.power)), ax = Math.abs(x);
  const zone: Zone = readsShot(data, plan, shot.power) ? zoneOf(x) : plan.zone;
  out.bx = x; out.by = y; out.keeper = zone; out.close = false;
  if (ax > 0.95 && ax <= 1.07 && y <= 1.07) { out.outcome = Outcome.Post; out.close = true; return out; }
  if (y > 0.96 && y <= 1.08 && ax <= 1.07) { out.outcome = Outcome.Bar; out.close = true; return out; }
  if (ax > 1.07) { out.outcome = Outcome.Wide; out.close = ax < 1.2; return out; }
  if (y > 1.08) { out.outcome = Outcome.Over; out.close = y < 1.2; return out; }
  const kx = DIVE[zone][0], ky = DIVE[zone][1], reach = reachFor(data, shot);
  const distance = Math.hypot((x - kx) / 1.3, (y - ky) / 1.6);
  if (distance <= reach) { out.outcome = Outcome.Saved; out.bx = (x + kx) / 2; out.by = (y + ky) / 2; return out; }
  out.outcome = Outcome.Goal; out.close = distance <= reach * 1.25;
  return out;
}

/** Where an opponent's kick is going: the plan's side, or, when a watching kicker saw you move first, away from your dive. */
export function kickZone(level: number, plan: ShotPlan, dive: Zone | null, early: boolean): Zone {
  if (!early || !levelOf(level).shooter.watch || dive === null) return plan.zone;
  if (dive === 1) return plan.zone === 1 ? (plan.jitter < 0.5 ? 0 : 2) : plan.zone;
  return dive === 0 ? 2 : 0;
}

/** Where an opponent's kick goes, in goal units, written into `out.bx/by`. */
export function shotTarget(plan: ShotPlan, zone: Zone, out: KickResult) {
  const side = zone === 0 ? -1 : zone === 2 ? 1 : plan.jitter < 0.5 ? -1 : 1;
  if (plan.miss) {
    if (plan.missKind === 0) { out.bx = side * (1.2 + plan.jitter * 0.15); out.by = 0.3 + plan.jitter * 0.3; }
    else if (plan.missKind === 1) { out.bx = (zone - 1) * 0.55; out.by = 1.25 + plan.jitter * 0.1; }
    else { out.bx = side; out.by = 0.45; }
    return out;
  }
  if (plan.corner && zone !== 1) { out.bx = side * 0.88; out.by = 0.86; return out; }
  out.bx = zone === 1 ? (plan.jitter - 0.5) * 0.4 : side * (0.5 + plan.jitter * 0.3);
  out.by = plan.high ? 0.55 + plan.jitter * 0.15 : 0.12 + plan.jitter * 0.12;
  return out;
}

/** One opponent kick against your dive (`null`: you stayed in the middle). A top corner beats even the right dive. */
export function resolveSave(level: number, plan: ShotPlan, dive: Zone | null, early: boolean, out: KickResult): KickResult {
  const zone = kickZone(level, plan, dive, early), keeper: Zone = dive ?? 1;
  shotTarget(plan, zone, out);
  out.keeper = keeper; out.close = false;
  if (plan.miss) { out.outcome = plan.missKind === 0 ? Outcome.Wide : plan.missKind === 1 ? Outcome.Over : Outcome.Post; out.close = plan.missKind === 2; return out; }
  if (keeper === zone && !(plan.corner && zone !== 1)) {
    out.outcome = Outcome.Saved; out.bx = (out.bx + DIVE[keeper][0]) / 2; out.by = (out.by + DIVE[keeper][1]) / 2;
    return out;
  }
  out.outcome = Outcome.Goal; out.close = keeper === zone;
  return out;
}

export type Tally = { goals: number; conceded: number; usTaken: number; themTaken: number };

/** Who kicks next: a shots drill is all ours, a saves drill all theirs, a shoot-out alternates with us first. */
export function nextSide(format: Format, taken: number): 0 | 1 {
  if (format === "shots") return 0;
  if (format === "saves") return 1;
  return (taken % 2) as 0 | 1;
}

/** Over? A drill after its kicks; a shoot-out when one side can't catch up, or after a sudden-death round that isn't level. */
export function decided(format: Format, kicks: number, t: Tally) {
  if (format === "shots") return t.usTaken >= kicks;
  if (format === "saves") return t.themTaken >= kicks;
  const { goals: us, conceded: them, usTaken, themTaken } = t;
  if (usTaken <= kicks && themTaken <= kicks) {
    if (us > them + kicks - themTaken || them > us + kicks - usTaken) return true;
    return usTaken === kicks && themTaken === kicks && us !== them;
  }
  return usTaken === themTaken && us !== them;
}
/** Past the regulation kicks: one kick each, the first to fall behind loses. */
export const suddenDeath = (level: Level, t: Tally) => level.format === "shootout" && t.usTaken >= level.kicks && t.themTaken >= level.kicks;

/** The score a link and a card carry: a drill is [made, missed] of its three kicks; a shoot-out is [our goals, theirs]. */
export function linkScore(level: number, t: Tally): [number, number] {
  const data = levelOf(level);
  if (data.format === "shots") return [t.goals, t.usTaken - t.goals];
  if (data.format === "saves") return [t.themTaken - t.conceded, t.conceded];
  return [t.goals, t.conceded];
}
/**
 * Stars: a drill gives one per kick made (or kept out). A five-kick shoot-out goes by margin, 1 → 1, 2 → 2, 3 → 3 (the most it
 * allows). A three-kick one can only be won by 2 at most: 2–0 is 3 stars, 3–1 is 2, any one-goal win 1. 0 is a loss.
 */
export function starsOf(level: number, us: number, them: number, kicks = levelOf(level).kicks, format = levelOf(level).format) {
  if (format !== "shootout") return Math.max(0, Math.min(3, us));
  if (us <= them) return 0;
  if (kicks === 3) return us - them >= 2 ? (them === 0 ? 3 : 2) : 1;
  return starsFor(us - them, 3, 2);
}

/** Every final score a shoot-out of `kicks` each can end on, as "us-them", found by walking the rules themselves. */
export function finalScores(kicks: number, maxRounds = MAX_ROUNDS) {
  const finals = new Set<string>(), seen = new Set<string>();
  const queue: Tally[] = [{ goals: 0, conceded: 0, usTaken: 0, themTaken: 0 }];
  while (queue.length) {
    const t = queue.pop()!, key = `${t.goals},${t.conceded},${t.usTaken},${t.themTaken}`;
    if (seen.has(key)) continue;
    seen.add(key);
    if (decided("shootout", kicks, t)) { finals.add(`${t.goals}-${t.conceded}`); continue; }
    if (t.usTaken >= maxRounds && t.themTaken >= maxRounds) continue;
    const ours = t.usTaken === t.themTaken;
    for (const scored of [true, false]) {
      queue.push(ours ? { ...t, usTaken: t.usTaken + 1, goals: t.goals + (scored ? 1 : 0) } : { ...t, themTaken: t.themTaken + 1, conceded: t.conceded + (scored ? 1 : 0) });
    }
  }
  return finals;
}

const finals = new Map<number, Set<string>>();
/** True for a winning score this match can really end on (no 9–0, no 3–2 after five kicks each, a drill adds up to its kicks). */
export function realWin(level: number, us: number, them: number, kicks = levelOf(level).kicks, format = levelOf(level).format) {
  if (!Number.isInteger(us) || !Number.isInteger(them) || us < 0 || them < 0) return false;
  if (format !== "shootout") return us >= 1 && us + them === kicks;
  if (!finals.has(kicks)) finals.set(kicks, finalScores(kicks));
  return us > them && finals.get(kicks)!.has(`${us}-${them}`);
}

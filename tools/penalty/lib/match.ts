// The shootout rules, pure and seeded. Goal units: x from -1 (left post) to 1 (right post), y from 0 (grass) to 1 (crossbar).
// Every random thing in a match is drawn up front from the seed, one plan per round, so a challenge link replays
// the very same keeper guesses and the very same opponent kicks whatever the player does.
import { makeRng, pick, starsFor } from "../../../shared/game-core";
import { opponentOf, type Keeper } from "./teams";

export const KICKS = 5;
/** Plans drawn per match. shortcut: a shootout tied after 30 rounds reuses plans from round 1; that is ~1 in 10⁸, upgrade never. */
export const MAX_ROUNDS = 30;

/** 0 = screen left, 1 = centre, 2 = screen right. */
export type Zone = 0 | 1 | 2;
export type Shot = { x: number; y: number; power: number; curve: number };
export type Outcome = "goal" | "saved" | "post" | "bar" | "wide" | "over";
export type KickResult = {
  outcome: Outcome;
  /** Where the ball ends, in goal units (for the animation). */
  bx: number; by: number;
  /** Where the keeper dived. */
  keeper: Zone;
  /** A goal the keeper's glove nearly reached, or a miss that just shaved the frame: the near-miss line. */
  close: boolean;
};
export type Kick = { side: 0 | 1; scored: boolean; result: KickResult };

/** The keeper's coin for one of your kicks. */
export type KeeperPlan = { u: number; zone: Zone };
/** One opponent kick, decided before the run-up. `lean` is where the run-up leans (-1 left, 0 straight, 1 right). */
export type ShotPlan = { zone: Zone; high: boolean; miss: boolean; missKind: number; corner: boolean; lean: -1 | 0 | 1; jitter: number };
export type Plans = { keeper: KeeperPlan[]; shots: ShotPlan[] };

const ZONES: readonly Zone[] = [0, 1, 2];
export const zoneOf = (x: number): Zone => x < -0.33 ? 0 : x > 0.33 ? 2 : 1;
/** Where a diving keeper's hands reach the middle of, per zone. */
export const DIVE = [[-0.6, 0.38], [0, 0.42], [0.6, 0.38]] as const;

/** Same seed, same match: the keeper's guesses and the opponent's kicks for every round. */
export function makePlans(level: number, seed: number): Plans {
  const shooter = opponentOf(level).shooter;
  const keeperRng = makeRng(seed), shotRng = makeRng(seed + 7919);
  const keeper: KeeperPlan[] = [], shots: ShotPlan[] = [];
  for (let round = 0; round < MAX_ROUNDS; round++) {
    keeper.push({ u: keeperRng(), zone: ZONES[pick(keeperRng, 3)] });
    // A fixed number of draws per kick, so each round's plan never depends on an earlier one.
    const zone = ZONES[pick(shotRng, 3)], high = shotRng() < 0.4, miss = shotRng() < shooter.miss, missKind = pick(shotRng, 3);
    const corner = zone !== 1 && shotRng() < shooter.corner, honest = shotRng() < shooter.honest, fake = pick(shotRng, 2), jitter = shotRng();
    const truth = (zone - 1) as -1 | 0 | 1;
    const lie = (truth === 0 ? (fake ? 1 : -1) : fake ? -truth : 0) as -1 | 0 | 1;
    shots.push({ zone, high, miss, missKind, corner, lean: honest ? truth : lie, jitter });
  }
  return { keeper, shots };
}

/** Harder kicks shrink the dive; curl shrinks it more. A soft kick gives the keeper time. */
export function reachFor(keeper: Keeper, shot: Pick<Shot, "power" | "curve">) {
  return keeper.reach * (1.25 - 0.45 * shot.power) * (1 - 0.3 * Math.min(1, Math.abs(shot.curve)));
}
/** Very hard kicks rise: above 85% power the ball climbs, up to 0.15 of the goal. */
export const rise = (power: number) => Math.max(0, power - 0.85);

/** One of your kicks against this level's keeper. */
export function resolveShot(level: number, plan: KeeperPlan, shot: Shot): KickResult {
  const x = shot.x, y = Math.max(0.04, shot.y + rise(shot.power)), ax = Math.abs(x);
  const keeper = opponentOf(level).keeper, shotZone = zoneOf(x);
  const zone: Zone = plan.u < keeper.read ? shotZone : plan.zone;
  const base = { bx: x, by: y, keeper: zone };
  if (ax > 0.95 && ax <= 1.07 && y <= 1.07) return { ...base, outcome: "post", close: true };
  if (y > 0.96 && y <= 1.08 && ax <= 1.07) return { ...base, outcome: "bar", close: true };
  if (ax > 1.07) return { ...base, outcome: "wide", close: ax < 1.2 };
  if (y > 1.08) return { ...base, outcome: "over", close: y < 1.2 };
  const [kx, ky] = DIVE[zone], reach = reachFor(keeper, shot);
  const distance = Math.hypot((x - kx) / 1.3, (y - ky) / 1.6);
  if (distance <= reach) return { ...base, bx: (x + kx) / 2, by: (y + ky) / 2, outcome: "saved", close: false };
  return { ...base, outcome: "goal", close: distance <= reach * 1.25 };
}

/** Where an opponent's kick goes, in goal units. */
export function shotTarget(plan: ShotPlan): { x: number; y: number } {
  const side = plan.zone === 0 ? -1 : plan.zone === 2 ? 1 : plan.jitter < 0.5 ? -1 : 1;
  if (plan.miss) {
    if (plan.missKind === 0) return { x: side * (1.2 + plan.jitter * 0.15), y: 0.3 + plan.jitter * 0.3 };
    if (plan.missKind === 1) return { x: (plan.zone - 1) * 0.55, y: 1.25 + plan.jitter * 0.1 };
    return { x: side, y: 0.45 };
  }
  if (plan.corner) return { x: side * 0.88, y: 0.86 };
  const x = plan.zone === 1 ? (plan.jitter - 0.5) * 0.4 : side * (0.5 + plan.jitter * 0.3);
  return { x, y: plan.high ? 0.55 + plan.jitter * 0.15 : 0.12 + plan.jitter * 0.12 };
}

/** One opponent kick against your dive (`null`: you stayed in the middle). A top-corner kick beats even the right dive. */
export function resolveSave(plan: ShotPlan, dive: Zone | null): KickResult {
  const { x, y } = shotTarget(plan), keeper = dive ?? 1;
  const base = { bx: x, by: y, keeper };
  if (plan.miss) return { ...base, outcome: plan.missKind === 0 ? "wide" : plan.missKind === 1 ? "over" : "post", close: plan.missKind === 2 };
  if (keeper === plan.zone && !plan.corner) {
    const [kx, ky] = DIVE[keeper];
    return { ...base, bx: (x + kx) / 2, by: (y + ky) / 2, outcome: "saved", close: false };
  }
  return { ...base, outcome: "goal", close: keeper === plan.zone };
}

export type Tally = { us: number; them: number; usTaken: number; themTaken: number };

export function tally(kicks: readonly Kick[]): Tally {
  const t = { us: 0, them: 0, usTaken: 0, themTaken: 0 };
  for (const kick of kicks) {
    if (kick.side === 0) { t.usTaken++; if (kick.scored) t.us++; }
    else { t.themTaken++; if (kick.scored) t.them++; }
  }
  return t;
}

/** Over when one side can't catch up within five kicks each, or, in sudden death, after a round that isn't level. */
export function decided({ us, them, usTaken, themTaken }: Tally) {
  if (usTaken <= KICKS && themTaken <= KICKS) {
    if (us > them + KICKS - themTaken || them > us + KICKS - usTaken) return true;
    return usTaken === KICKS && themTaken === KICKS && us !== them;
  }
  return usTaken === themTaken && us !== them;
}

/** We kick first in every round. */
export const nextSide = (kicks: readonly Kick[]) => (kicks.length % 2) as 0 | 1;
/** 0-based round of the next kick. */
export const roundOf = (kicks: readonly Kick[]) => Math.floor(kicks.length / 2);
export const suddenDeath = (kicks: readonly Kick[]) => roundOf(kicks) >= KICKS;

/** Stars for a win by goal margin: 1 goal → 1, 2 → 2, 3 → 3 (the most a shootout allows). A loss is 0. */
export const starsOf = (us: number, them: number) => us > them ? starsFor(us - them, 3, 2) : 0;

/**
 * Every final score a shootout can end on, as "us-them", found by walking the rules themselves.
 * Links are checked against it, so a forged 9–0 never gets a preview.
 */
export function finalScores(maxRounds = MAX_ROUNDS) {
  const finals = new Set<string>(), seen = new Set<string>();
  const queue: Tally[] = [{ us: 0, them: 0, usTaken: 0, themTaken: 0 }];
  while (queue.length) {
    const t = queue.pop()!, key = `${t.us},${t.them},${t.usTaken},${t.themTaken}`;
    if (seen.has(key)) continue;
    seen.add(key);
    if (decided(t)) { finals.add(`${t.us}-${t.them}`); continue; }
    if (t.usTaken >= maxRounds && t.themTaken >= maxRounds) continue;
    const ours = t.usTaken === t.themTaken;
    for (const scored of [true, false]) {
      queue.push(ours ? { ...t, usTaken: t.usTaken + 1, us: t.us + (scored ? 1 : 0) } : { ...t, themTaken: t.themTaken + 1, them: t.them + (scored ? 1 : 0) });
    }
  }
  return finals;
}

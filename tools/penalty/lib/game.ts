// One match as a plain, mutable state: who kicks, the ball's flight, the score, the tells on show and the stats for the end
// screen. Made once per match (createGame allocates; nothing after it does). The per-step clock is in step.hot.ts; the
// actions here (shoot, dive, aim) are what a finger or a key does. No DOM, no Math.random: the same seed and inputs give
// the same match on every phone, which is what the bots in tests/ play.
import { BALL_R, GX, GW, GY, GTOP, SPOT_X, SPOT_Y, spotShot, toScreenX, toScreenY } from "./swipe";
import { levelOf, type Level } from "./levels";
import { decided, makePlans, makeResult, nextSide, resolveSave, resolveShot, Outcome, MAX_ROUNDS, type KickResult, type Plans, type Shot, type Tally, type Zone } from "./rules";

export const Stage = { Aim: 0, Fly: 1, After: 2, Ready: 3, Run: 4, Over: 5 } as const;
export type Stage = typeof Stage[keyof typeof Stage];

/** Seconds at normal speed; ধীরে খেলো runs the match clock at SLOW. */
export const READY = 0.7, RUN = 1.6, AFTER = 1.15, DRILL_AFTER = 0.95, METER_PERIOD = 1.5, SLOW = 0.6;
/** Their keeper starts to lean this long into your aim, over LEAN_FOR. */
export const KEEPER_LEAN_AT = 0.5, LEAN_FOR = 0.3;
/** The kicker's planted foot shows its side at this share of the run-up (always true). */
export const FOOT_AT = 0.78;
/** The ball freezes on the boot for this long when struck (hit-stop). */
export const HIT_STOP = 0.06;
/** A scuffed kick when the shot clock runs out. */
export const SCUFF = 0.25;
export const MAX_KICKS = MAX_ROUNDS * 2;

/** What happened during a step, for the sounds and the call line. The component reads and clears it. */
export const Ev = { Kick: 1, Goal: 2, Save: 4, Frame: 8, Miss: 16, TheirTurn: 32, YourTurn: 64, RunUp: 128, Over: 256, Tick: 512, Land: 1024 } as const;

function makeGame(level: number, seed: number, slow: boolean) {
  const data = levelOf(level);
  return {
    level, seed, data: data as Level, plans: makePlans(level, seed) as Plans, slow, calm: slow,
    stage: Stage.Aim as Stage, side: nextSide(data.format, 0) as 0 | 1, t: 0, clock: 0, played: 0,
    // aiming (board units for the crosshair)
    aimX: GX, aimY: GY - 26, aimed: false, meter: false, meterFrom: 0, power: 0.5, shotLeft: data.clock,
    // the kick in the air
    shot: { x: 0, y: 0.5, power: 0.5, curve: 0 } as Shot, result: makeResult() as KickResult, scuffed: false,
    dive: -1, pickedAt: -1, early: false, decisive: false, danger: false, hold: 0,
    fromX: SPOT_X, fromY: SPOT_Y, ctrlX: SPOT_X, ctrlY: SPOT_Y, toX: SPOT_X, toY: SPOT_Y, endX: SPOT_X, endY: SPOT_Y,
    flyTime: 0.5, ballX: SPOT_X, ballY: SPOT_Y, ballR: BALL_R, spin: 0,
    // the record
    sides: new Int8Array(MAX_KICKS), outcomes: new Int8Array(MAX_KICKS), closes: new Uint8Array(MAX_KICKS), count: 0,
    tally: { goals: 0, conceded: 0, usTaken: 0, themTaken: 0 } as Tally,
    frame: 0, stops: 0, onTarget: 0, hardest: 0,
    events: 0,
  };
}
export type Game = ReturnType<typeof makeGame>;

export function createGame(level: number, seed: number, slow = false): Game {
  const g = makeGame(level, seed, slow);
  begin(g);
  return g;
}

/** 0-based round of the next kick. */
export const roundOf = (g: Game) => Math.min(MAX_ROUNDS - 1, g.side === 0 ? g.tally.usTaken : g.tally.themTaken) % MAX_ROUNDS;
/** The round of the kick on screen: the one coming, in the air, or just landed. */
export const kickRound = (g: Game) => Math.max(0, Math.min(MAX_ROUNDS - 1, (g.side === 0 ? g.tally.usTaken : g.tally.themTaken) - (g.stage === Stage.After || g.stage === Stage.Over ? 1 : 0)));
export const playing = (g: Game) => g.stage !== Stage.Over;
export const keeping = (g: Game) => g.side === 1 && (g.stage === Stage.Ready || g.stage === Stage.Run);
export const aiming = (g: Game) => g.side === 0 && g.stage === Stage.Aim;
/** The match clock's scale: ধীরে খেলো stretches every wait. */
export const pace = (g: Game) => g.slow ? SLOW : 1;

/** Their keeper's lean while you aim: 0 → 1 as it shows (0 when he shows none). */
export function keeperLean(g: Game) {
  if (!g.data.keeper.tell || g.side !== 0 || g.stage !== Stage.Aim) return 0;
  return Math.min(1, Math.max(0, (g.t - KEEPER_LEAN_AT) / LEAN_FOR));
}
/** The kicker's progress through the run-up, 0 → 1 (1 from the kick on). */
export function runUp(g: Game) {
  if (g.side !== 1) return 1;
  return g.stage === Stage.Ready ? 0 : g.stage === Stage.Run ? Math.min(1, g.t / RUN) : 1;
}
/** How much of the shoulder lean shows, 0 → 1. */
export const leanShown = (g: Game) => g.side === 1 ? Math.min(1, Math.max(0, (runUp(g) - g.data.shooter.tellAt) / 0.18)) : 0;
/** The planted foot is down and points the true way. */
export const footShown = (g: Game) => g.side === 1 && runUp(g) >= FOOT_AT;
/** The kick that's coming could end the match against us: the edge glows. */
export function canLose(format: Level["format"], kicks: number, t: Tally, side: 0 | 1) {
  if (format === "shots" || format === "saves") return false;
  const next = { goals: t.goals, conceded: t.conceded, usTaken: t.usTaken, themTaken: t.themTaken };
  if (side === 0) next.usTaken++; else { next.themTaken++; next.conceded++; }
  return decided(format, kicks, next) && next.conceded > next.goals;
}
function canEnd(format: Level["format"], kicks: number, t: Tally, side: 0 | 1) {
  for (const scored of [true, false]) {
    const next = { goals: t.goals, conceded: t.conceded, usTaken: t.usTaken, themTaken: t.themTaken };
    if (side === 0) { next.usTaken++; if (scored) next.goals++; } else { next.themTaken++; if (scored) next.conceded++; }
    if (decided(format, kicks, next)) return true;
  }
  return false;
}

/** Sets up the ball's path from the spot to (x, y) in goal units, bending by `curve`. */
function flight(g: Game, x: number, y: number, curve: number, power: number) {
  const tx = toScreenX(x), ty = toScreenY(y);
  const mx = (SPOT_X + tx) / 2, my = (SPOT_Y + ty) / 2, dx = tx - SPOT_X, dy = ty - SPOT_Y, length = Math.hypot(dx, dy) || 1;
  // The swipe bowed right of travel → the ball's path bows right too, then comes back to the target.
  g.fromX = SPOT_X; g.fromY = SPOT_Y; g.toX = tx; g.toY = ty; g.endX = tx; g.endY = ty;
  g.ctrlX = mx + (-dy / length) * curve * 70; g.ctrlY = my + (dx / length) * curve * 70 - 14;
  g.flyTime = (0.62 - 0.24 * power) * (g.decisive && !g.calm ? 1.6 : 1);
  g.ballX = SPOT_X; g.ballY = SPOT_Y; g.ballR = BALL_R;
}
/** Where the ball rolls after it lands. */
function after(g: Game, outcome: Outcome, keeper: Zone, x: number) {
  if (outcome === Outcome.Post) { g.endX = g.toX + Math.sign(x || 1) * 34; g.endY = g.toY + 46; }
  else if (outcome === Outcome.Bar) { g.endX = g.toX + x * 20; g.endY = g.toY - 30; }
  else if (outcome === Outcome.Saved) { g.endX = g.toX + (keeper === 1 ? (x < 0 ? -18 : 18) : keeper === 0 ? -24 : 24); g.endY = g.toY + 34; }
  else if (outcome === Outcome.Goal) { g.endX = g.toX; g.endY = g.toY + 6; }
}

/** Your kick. Refused unless you're aiming. */
export function shoot(g: Game, shot: Shot) {
  if (!aiming(g)) return false;
  g.shot.x = shot.x; g.shot.y = shot.y; g.shot.power = shot.power; g.shot.curve = shot.curve;
  const res = resolveShot(g.level, g.plans.keeper[roundOf(g)], g.shot, g.result);
  const drifted = res.outcome === Outcome.Saved ? shot.curve : Math.max(-1, Math.min(1, shot.curve - (res.bx - shot.x) * 2));
  flight(g, res.bx, Math.max(0.04, res.by), drifted, shot.power);
  after(g, res.outcome, res.keeper, res.bx);
  g.meter = false;
  g.hardest = Math.max(g.hardest, shot.power);
  g.stage = Stage.Fly; g.t = 0; g.hold = HIT_STOP;
  g.events |= Ev.Kick;
  return true;
}
/** The shot clock ran out: a soft scuff towards wherever you were aiming. */
export function scuff(g: Game) {
  g.scuffed = true;
  return shoot(g, spotShot(g.aimX, g.aimY, SCUFF));
}

/** Tap path: the first press starts the power bar, the second kicks at its level. */
export function pressKick(g: Game) {
  if (!aiming(g)) return false;
  if (g.meter) return shoot(g, spotShot(g.aimX, g.aimY, g.power));
  g.meter = true; g.meterFrom = g.clock; g.aimed = true;
  return true;
}
/** Arrow keys and taps on the goal move the crosshair (board units). */
export function moveAim(g: Game, x: number, y: number) {
  if (!aiming(g)) return;
  g.aimX = Math.min(GX + GW * 1.3, Math.max(GX - GW * 1.3, x));
  g.aimY = Math.min(GY - 4, Math.max(GTOP - 24, y));
  g.aimed = true;
}

/** Your dive while their kicker runs up. You may change it until the kick; the first pick's time is what a watching kicker saw. */
export function dive(g: Game, zone: Zone) {
  if (!keeping(g)) return false;
  if (g.pickedAt < 0) { g.pickedAt = runUp(g); g.early = leanShown(g) <= 0; }
  if (g.dive === zone) return false;
  g.dive = zone;
  return true;
}

/** Their kicker strikes: resolve against your dive (step code, once per kick). */
export function theirKick(g: Game) {
  const plan = g.plans.shots[roundOf(g)];
  const res = resolveSave(g.level, plan, g.dive < 0 ? null : (g.dive as Zone), g.early, g.result);
  flight(g, res.bx, res.by, 0, 0.7);
  after(g, res.outcome, res.keeper, res.bx);
  g.stage = Stage.Fly; g.t = 0; g.hold = HIT_STOP;
  g.events |= Ev.Kick;
}

/** The ball has landed: record the kick and its stats. */
export function land(g: Game) {
  const res = g.result, ours = g.side === 0, scored = res.outcome === Outcome.Goal;
  const i = Math.min(MAX_KICKS - 1, g.count);
  g.sides[i] = g.side; g.outcomes[i] = res.outcome; g.closes[i] = res.close ? 1 : 0; g.count = i + 1;
  if (ours) { g.tally.usTaken++; if (scored) g.tally.goals++; if (scored || res.outcome === Outcome.Saved) g.onTarget++; if (res.outcome === Outcome.Post || res.outcome === Outcome.Bar) g.frame++; }
  else { g.tally.themTaken++; if (scored) g.tally.conceded++; else g.stops++; }
  g.events |= Ev.Land | (scored ? Ev.Goal : res.outcome === Outcome.Saved ? Ev.Save : res.outcome === Outcome.Post || res.outcome === Outcome.Bar ? Ev.Frame : Ev.Miss);
  g.stage = Stage.After; g.t = 0;
}

/** After the ball settles: the match is over (once, and for good), or the next kick is set up. */
export function next(g: Game) {
  if (g.stage === Stage.Over) return;
  if (decided(g.data.format, g.data.kicks, g.tally)) { g.stage = Stage.Over; g.t = 0; g.events |= Ev.Over; return; }
  const taken = g.tally.usTaken + g.tally.themTaken;
  g.side = nextSide(g.data.format, taken);
  g.decisive = canEnd(g.data.format, g.data.kicks, g.tally, g.side);
  g.danger = canLose(g.data.format, g.data.kicks, g.tally, g.side);
  g.dive = -1; g.pickedAt = -1; g.early = false; g.scuffed = false;
  g.ballX = SPOT_X; g.ballY = SPOT_Y; g.ballR = BALL_R; g.spin = 0;
  g.t = 0;
  if (g.side === 0) {
    g.stage = Stage.Aim; g.meter = false; g.aimed = false; g.shotLeft = g.data.clock;
    g.events |= Ev.YourTurn;
  } else {
    g.stage = Stage.Ready;
    g.events |= Ev.TheirTurn;
  }
}

/** The first kick's flags (the match may open on a decisive kick only in sudden death, which it never does). */
export function begin(g: Game) {
  g.danger = canLose(g.data.format, g.data.kicks, g.tally, g.side);
  g.decisive = canEnd(g.data.format, g.data.kicks, g.tally, g.side);
  if (g.side === 1) g.stage = Stage.Ready;
}

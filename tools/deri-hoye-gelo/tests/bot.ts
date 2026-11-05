// Headless players for tuning and fairness tests. The bot plays the way a thumb does: it sees a thing only once it is on
// screen (or its edge pointer shows), reacts a moment later, times its jump with a small error, ducks under hanging
// things, and sometimes misses one altogether. The skilled bot also goes for the high pages.
import { makeRng } from "../../../shared/game-core";
import { ACTIVATE, AHEAD, GRAVITY, HALF, HOLD_GRAVITY, HOLD_MAX, HOLD_START, isOver, JUMP_V, KID_X, MUD, PAGE, TIFFIN, W } from "../lib/course";
import { createRun, grounded, OVER, pieceAt, pressDuck, pressJump, releaseDuck, releaseJump, RUN, type Run } from "../lib/game";
import type { Mode } from "../lib/levels";
import { LEAD, POINTER_SPEED, stepRun } from "../lib/step.hot";

export type Skill = {
  name: string;
  /** Seconds from a thing coming into sight (on screen, or its edge pointer) to the bot acting on it. */
  react: number;
  /** ± seconds of error on each jump's timing (drawn once per thing). */
  error: number;
  /** Chance to miss a thing altogether. */
  miss: number;
  /** Holds the jump over wide things; jumps for high pages. */
  hold: number; pages: number;
  /** Deliberately walks into this many of the first things (to test what the bell allows for). */
  crash?: number;
};
export const SKILLED: Skill = { name: "skilled", react: 0.14, error: 0.012, miss: 0, hold: 1, pages: 1 };
export const CASUAL: Skill = { name: "casual", react: 0.3, error: 0.085, miss: 0.03, hold: 0.6, pages: 0.4 };

const DT = 1 / 60;
const LIMIT = 60 * 240;

/** The kid's height step by step after a takeoff, with a tap or a full hold. */
function arc(hold: boolean) {
  const out: number[] = [];
  let y = 0, vy = JUMP_V, air = 0, held = 0;
  // The takeoff step itself moves once, as stepRun does.
  for (let i = 0; i < 200; i++) {
    let g = GRAVITY;
    if (hold && vy > 0 && air >= HOLD_START && held < HOLD_MAX) { g *= HOLD_GRAVITY; held += DT; }
    vy -= g * DT; y += vy * DT; air += DT;
    if (y <= 0) break;
    out.push(y);
  }
  return out;
}
const TAP = arc(false), HOLD = arc(true);
/** [first, last] seconds after takeoff that the feet are above `h`. */
function above(h: number, hold: boolean): [number, number] {
  const path = hold ? HOLD : TAP;
  let first = -1, last = -1;
  for (let i = 0; i < path.length; i++) if (path[i] > h) { if (first < 0) first = i; last = i; }
  return [(first + 1) * DT, (last + 1) * DT];
}

export type Outcome = { won: boolean; time: number; stumbles: number; pages: number; meters: number; hits: number[]; run: Run; /** The orange "running late" edge showed at some step. */ lateSeen: boolean; lateAt: number };
type Plan = { seen: number; error: number; skip: boolean; hold: boolean; done: boolean };
type Hands = { holdUntil: number; duckFor: number; plans: Map<number, Plan>; rng: () => number; crashed: number };

/** Plays one level. "idle" presses once to start, then never again; "masher" taps every nine steps. */
export function play(seed: number, level: number, mode: Mode, skill: Skill | "idle" | "masher", slow = false): Outcome {
  const run = createRun(seed, level, mode);
  const hands: Hands = { holdUntil: -1, duckFor: -1, plans: new Map(), rng: makeRng(seed * 31 + level * 7 + 3), crashed: 0 };
  let steps = 0, seen = 0;
  const hits: number[] = [];
  let lateSeen = false, lateAt = -1;
  pressJump(run); stepRun(run, DT, slow); releaseJump(run); run.evCount = 0;
  while (run.phase !== OVER && steps++ < LIMIT) {
    if (run.phase === RUN && skill === "masher") { if (steps % 9 === 0) pressJump(run); else releaseJump(run); }
    else if (run.phase === RUN && typeof skill !== "string") {
      drive(run, skill, hands);
      if (run.t > hands.holdUntil && run.jumpHeld) releaseJump(run);
    }
    stepRun(run, DT, slow);
    run.evCount = 0;
    if (run.stumbles > seen) { seen = run.stumbles; hits.push(run.hitKind); }
    if (run.late && !lateSeen) { lateSeen = true; lateAt = run.stumbles; }
  }
  return { won: run.endKind === 1, time: run.endAt, stumbles: run.stumbles, pages: run.pages, meters: run.meters, hits, run, lateSeen, lateAt };
}

function drive(run: Run, skill: Skill, hands: Hands) {
  const back = run.d + KID_X - HALF, front = run.d + KID_X + HALF;
  // Keep ducking until the hanging thing is behind.
  if (hands.duckFor >= 0) {
    const piece = pieceAt(run, hands.duckFor);
    if (piece.x + piece.w >= back - 2 && piece.state === AHEAD) return;
    releaseDuck(run); hands.duckFor = -1;
  }
  for (let index = run.first; index < run.count; index++) {
    const piece = pieceAt(run, index);
    if (piece.state !== AHEAD || piece.w <= 0 || piece.x + piece.w < back || piece.kind === TIFFIN) continue;
    if (piece.kind === PAGE && piece.y < 30) continue;
    const rolling = piece.vx > 0 && piece.x - run.d < ACTIVATE;
    const pointer = (piece.vx > 0 || run.nominal >= POINTER_SPEED) && (piece.x - run.d - W) / (run.nominal + (rolling ? piece.vx : 0)) < LEAD;
    if (piece.x - run.d >= W && !pointer) return;
    let plan = hands.plans.get(index);
    if (!plan) {
      const walkIn = piece.kind !== PAGE && hands.crashed < (skill.crash ?? 0) && !piece.boss;
      if (walkIn) hands.crashed++;
      plan = { seen: run.t, error: (hands.rng() * 2 - 1) * skill.error, skip: walkIn || hands.rng() < (piece.kind === PAGE ? 1 - skill.pages : skill.miss), hold: hands.rng() < skill.hold, done: false };
      hands.plans.set(index, plan);
    }
    if (plan.skip || plan.done) continue;
    if (run.t - plan.seen < skill.react) return;
    const closing = Math.max(1, run.speed + (rolling ? piece.vx : 0));
    const tf = (piece.x - front) / closing, tb = (piece.x + piece.w - back) / closing;
    if (isOver(piece.kind)) {
      if (tf <= 0.09 + plan.error) { pressDuck(run); hands.duckFor = index; plan.done = true; }
      return;
    }
    const useHold = (piece.kind === MUD || piece.w >= 48) && plan.hold;
    const [t1, t2] = above(piece.kind === PAGE ? 46 : piece.h + 1, useHold);
    if (((tb - t2) + (tf - t1)) / 2 + plan.error > 0) return;
    if (!grounded(run) && run.y > 30) return;
    pressJump(run); plan.done = true;
    hands.holdUntil = useHold ? run.t + 0.3 : run.t;
    return;
  }
}

export const percentile = (sorted: number[], p: number) => sorted[Math.min(sorted.length - 1, Math.floor(sorted.length * p))];

// The walk's state and its constants. stepGame (step.hot.ts) moves it; session.ts decides when it may move.
import { CX, makeField, PX_PER_M, SLIP_NONE, type Field } from "./field";
import { livesOf, specOfRun, type LevelSpec, type Run } from "./levels";

/** Holding a side (a finger on half the field, an arrow key) moves the feet sideways up to this fast. */
export const TAP_SPEED = 80;
/** A press gives the feet this speed at once, so the very next step already shows it. */
export const KICK = 36;
/** The feet speed up over about this long while a side is held, and stop this quickly when it's let go (rain: slower). */
export const SPEED_UP = 0.08;
export const SLOW_DOWN = 0.05;
export const SLOW_DOWN_RAIN = 0.16;
/** While dragging, the feet chase the finger at most this fast. */
export const DRAG_SPEED = 300;
export const SLIP_TIME = 0.9;
/** After stepping back on, this many px are walked before the next slip counts. */
export const GRACE = 40;
export const STRIDE = 13;
/** A rising chime every 20 dry metres. */
export const STREAK = 20 * PX_PER_M;
/** The gust arrow lights this many px before a gust (about 0.9 s); gusts keep more than this apart, so a warning never overlaps the gust before. */
export const GUST_WARN = 70;
/** Slow mode: the walk, the wind and the pull run at this pace; the feet keep their speed. */
export const SLOW_PACE = 0.6;

export const PH_READY = 0, PH_WALK = 1, PH_SLIP = 2, PH_DONE = 3, PH_FELL = 4;

/** What happened this step, as bits: sounds and juice read them, then the caller clears `events`. */
export const E_STEP = 1, E_SLIP = 2, E_BACK = 4, E_NEAR = 8, E_STREAK = 16, E_BLEAT = 32, E_BIRDS = 64, E_DONE = 128, E_FELL = 256;
export const E_WOBBLE = 512, E_GUST_WARN = 1024, E_GUST = 2048, E_PASS = 4096;

export type Game = {
  run: Run;
  spec: LevelSpec;
  field: Field;
  /** Slips that end the field. */
  lives: number;
  phase: number;
  /** Distance walked, px. */
  d: number;
  /** The feet, board x. */
  x: number;
  /** Holding a side: -1 left, 1 right, 0 none. */
  dir: number;
  /** Sideways speed from holding, px per second. */
  vel: number;
  /** Dragging: where the finger wants the feet (board x); only read while `dragging`. */
  target: number;
  dragging: boolean;
  clock: number;
  slips: number;
  slipAt: number;
  slipX: number;
  slipSide: number;
  slipReason: number;
  /** Index of the obstacle the last slip happened at, or -1. */
  slipObs: number;
  graceTo: number;
  /** Where the current dry stretch began (px), and the longest dry stretch in this field. */
  dryFrom: number;
  bestDry: number;
  streak: number;
  /** The feet reached the outer fifth and haven't come back yet. */
  close: boolean;
  nearAt: number;
  nears: number;
  wobbling: boolean;
  wobbleAt: number;
  /** Where the feet are on the ridge: -1 at the left edge, 1 at the right. */
  edge: number;
  /** The walker's lean for drawing, -1..1. */
  lean: number;
  /** A gust is coming (warning) or blowing: its direction, else 0. */
  gustWarn: number;
  gustNow: number;
  gustsRidden: number;
  nextGust: number;
  nextStep: number;
  foot: number;
  nextGoat: number;
  nextBok: number;
  nextPass: number;
  passed: number;
  /** Metres for the E_STREAK event. */
  streakM: number;
  events: number;
};

export function createGame(run: Run): Game {
  const spec = specOfRun(run), field = makeField(spec, run.seed);
  return {
    run, spec, field, lives: livesOf(run), phase: PH_READY, d: 0, x: CX, dir: 0, vel: 0, target: CX, dragging: false, clock: 0,
    slips: 0, slipAt: -9, slipX: CX, slipSide: 1, slipReason: SLIP_NONE, slipObs: -1, graceTo: 0,
    dryFrom: 0, bestDry: 0, streak: 0, close: false, nearAt: -9, nears: 0, wobbling: false, wobbleAt: -9, edge: 0, lean: 0,
    gustWarn: 0, gustNow: 0, gustsRidden: 0, nextGust: 0, nextStep: STRIDE, foot: 0, nextGoat: 0, nextBok: 0, nextPass: 0, passed: 0, streakM: 0, events: 0,
  };
}

export const start = (game: Game) => { if (game.phase === PH_READY) game.phase = PH_WALK; };

/** Moves the dragged target by a finger's movement, in board px. */
export function dragBy(game: Game, dx: number) {
  game.target = Math.min(356, Math.max(4, (game.dragging ? game.target : game.x) + dx));
  game.dragging = true;
}

/** Hands off: no held side, no drag. */
export function releaseAll(game: Game) { game.dir = 0; game.dragging = false; }

export const metres = (px: number) => Math.round(px / PX_PER_M);
/** A field is over once it is cleared or lost. */
export const isOver = (game: Game) => game.phase === PH_DONE || game.phase === PH_FELL;

// One run on the way to school: the kid, the road ring, the bell and the counts. Pure and deterministic: the same seed,
// level, mode and presses give the same run on every phone. The per-step rules live in step.hot.ts.
import {
  blank, DUCK_H, DUCK_MIN, isOver, isPickup, KID_H, makeRoad, nextPiece, REWIND, speedAt, speedOf, TOP, UNIT, type Piece, type Road,
} from "./course";
import { LEVEL_COUNT, levelDef, MODE_INFO, type LevelDef, type Mode } from "./levels";

/** Slow mode runs the whole clock at this: the same road and the same bell, only slower. */
export const SLOW = 0.7;
/** A stumble: stopped this long, then back to speed over RISE. Nothing can trip the kid again for SAFE. */
export const STOP = 0.45, RISE = 0.5, SAFE = 1.1;
/** About the seconds one stumble costs, and the bell's spare on top of the mode's stumbles. */
export const STUMBLE_COST = STOP + RISE / 2, SPARE = 0.6;
/** The run is over this long after the gate, the bell or a crash, so the moment can play before the end screen. */
export const END_TIME = 1.3;
/** "Running late": at full speed from here, the gate is less than this much ahead of the bell. */
export const LATE_MARGIN = 1.2;

export const READY = 0, RUN = 1, END = 2, OVER = 3;
/** How a run ended. */
export const ARRIVED = 1, LATE = 2, CRASHED = 3;
/** What happened during a step, for the component's sounds and juice. */
export const E = {
  START: 1, JUMP: 2, LAND: 3, STUMBLE: 4, PAGE: 5, TIFFIN: 6, SAVED: 7, MILESTONE: 8, GATE_M: 9, BOSS: 10,
  ARRIVE: 11, LATE: 12, CRASH: 13, OVER: 14, TICK: 15, WARN: 16,
} as const;
export const EVENTS = 24;
const RING = 16;

export type Run = {
  seed: number; level: number; mode: Mode; def: LevelDef; endless: boolean;
  road: Road; ring: Piece[]; first: number; count: number;
  /** Distance in units, the run's clock (it starts on the first press), the speed now and the speed it would be without a stumble. */
  d: number; t: number; speed: number; nominal: number;
  y: number; vy: number; air: number; hold: number; ducking: boolean;
  jumpHeld: boolean; jumpAt: number; duckHeld: boolean; duckUntil: number;
  phase: number; endKind: number; endAt: number;
  /** The bell, in run seconds (Infinity on the endless road), and whether the kid is running late right now. */
  bell: number; late: boolean; tickAt: number;
  /** Seconds a clean run still needs from each whole মিটার to the gate (empty on the endless road). */
  remain: Float32Array;
  /** The gate in মিটার, the মিটার run, whether the endless road's gate is behind. */
  gateM: number; meters: number; gate: boolean;
  stumbles: number; stumbleAt: number; safeUntil: number; hitKind: number;
  pages: number; tiffin: boolean; saves: number;
  bossLeft: number; bossMax: number;
  jumps: number; ducks: number; cleared: number; streak: number; bestStreak: number;
  ev: Uint8Array; evX: Float32Array; evCount: number;
};

/** Seconds a clean run needs from the first press to the gate, stepped exactly as the run steps. */
export function cleanTime(def: LevelDef) {
  const end = def.gate * UNIT, dt = 1 / 60;
  let d = 0, t = 0;
  while (d < end) { d += speedOf(def, d / UNIT) * dt; t += dt; }
  return t;
}

const TABLES = new Map<LevelDef, Float32Array>();
/** Seconds a clean run needs from each whole মিটার to the gate, as the run steps (built once per level). */
export function remainTable(def: LevelDef) {
  let table = TABLES.get(def);
  if (!table) {
    table = new Float32Array(def.gate + 2);
    for (let meters = def.gate - 1; meters >= 0; meters--) table[meters] = table[meters + 1] + UNIT / speedOf(def, meters + 0.5);
    TABLES.set(def, table);
  }
  return table;
}

/** The bell for a level and mode: a clean run's time, the mode's stumbles and a little spare. */
export const bellOf = (level: number, mode: Mode) => level === 0 ? Infinity : cleanTime(levelDef(level)) + MODE_INFO[mode].stumbles * STUMBLE_COST + SPARE;

export function createRun(seed: number, level: number, mode: Mode = "n"): Run {
  const def = levelDef(level), endless = level === 0;
  return {
    seed, level: endless ? 0 : Math.max(1, Math.min(LEVEL_COUNT, Math.round(level))), mode, def, endless,
    road: makeRoad(seed, endless ? null : def), ring: Array.from({ length: RING }, blank), first: 0, count: 0,
    d: 0, t: 0, speed: 0, nominal: endless ? speedAt(0) : speedOf(def, 0),
    y: 0, vy: 0, air: -1, hold: 0, ducking: false, jumpHeld: false, jumpAt: -9, duckHeld: false, duckUntil: -9,
    phase: READY, endKind: 0, endAt: 0,
    bell: bellOf(endless ? 0 : level, mode), late: false, tickAt: -1, remain: endless ? new Float32Array(0) : remainTable(def),
    gateM: def.gate, meters: 0, gate: false,
    stumbles: 0, stumbleAt: -9, safeUntil: -9, hitKind: -1,
    pages: 0, tiffin: false, saves: 0,
    bossLeft: endless ? 0 : def.finale?.count ?? 0, bossMax: endless ? 0 : def.finale?.count ?? 0,
    jumps: 0, ducks: 0, cleared: 0, streak: 0, bestStreak: 0,
    ev: new Uint8Array(EVENTS), evX: new Float32Array(EVENTS), evCount: 0,
  };
}

export const pieceAt = (run: Run, index: number) => run.ring[index % RING];
export const grounded = (run: Run) => run.air < 0;
/** The endless road's top speed, for the edge pointers. */
export const TOP_SPEED = TOP;

/** Lays the road a little past the right edge. */
export function layRoad(run: Run, ahead: number) {
  while (run.road.hasQueued || run.road.end < run.d + ahead) nextPiece(run.road, run.ring[run.count++ % RING]);
}

/** A jump always wins over a duck: it stands the kid up. */
export function pressJump(run: Run) { run.jumpHeld = true; run.jumpAt = run.t; run.duckHeld = false; run.duckUntil = -9; }
export function releaseJump(run: Run) { run.jumpHeld = false; }
export function pressDuck(run: Run) {
  run.duckHeld = true; run.duckUntil = run.t + DUCK_MIN; run.jumpAt = -9;
  if (!grounded(run) && run.air < REWIND && run.vy > 0) { run.y = 0; run.vy = 0; run.air = -1; }
}
export function releaseDuck(run: Run) { run.duckHeld = false; }
/** Away, paused or a new screen: nothing stays held, no jump waits in the buffer, no duck tap lingers. */
export function releaseAll(run: Run) { run.jumpHeld = false; run.duckHeld = false; run.jumpAt = -9; run.duckUntil = -9; }

/** The kid's top edge right now, in units above the ground. */
export const kidTop = (run: Run) => run.y + (run.ducking ? DUCK_H : KID_H);

/** Does the kid's body touch `piece` right now? (Only the vertical test: the caller has checked they overlap sideways.) */
export function touches(run: Run, piece: Piece) {
  if (isPickup(piece.kind)) return run.y < piece.y + piece.h && kidTop(run) > piece.y;
  return isOver(piece.kind) ? kidTop(run) > piece.h : run.y < piece.h;
}

export function emit(run: Run, type: number, x: number) {
  if (run.evCount >= EVENTS) return;
  run.ev[run.evCount] = type; run.evX[run.evCount] = x; run.evCount++;
}

/** Tenths of a second the run took (the time on the card). */
export const tenthsOf = (seconds: number) => Math.max(1, Math.round(seconds * 10));

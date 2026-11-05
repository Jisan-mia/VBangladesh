// The rules of the stall: pots on ropes, a cloth ball you aim and throw, and a bamboo লাঠি that sends it back (or, once
// শেষ ডাক rings, catches it for another aimed throw). Pure and seeded: the same seed and inputs give the same game on every
// phone. Units are world units (the stall is W × H) and seconds. step.hot.ts advances a Game; this file builds one.
import { makeRng, pick } from "../../../shared/game-core";
import { defOf, MODE_INFO, type Kind, type LevelDef, type Mode, type Run } from "./levels";

export const W = 360;
export const H = 600;
/** Bamboo poles on both sides. */
export const WALL = 12;
export const COLS = 7;
export const CELL = (W - WALL * 2) / COLS;
/** The first rope hangs this far under the awning; the ropes are ROW_GAP apart. */
export const ROPE_DROP = 14;
export const ROW_GAP = 44;
export const POT_W = 36;
export const POT_H = 34;
/** How far a pot hangs below its rope. */
export const POT_DROP = 6;
export const BALL_R = 8;
export const STICK_W = 76;
export const STICK_H = 12;
/** The লাঠি's top surface, and the floor under it. */
export const STICK_Y = 548;
export const FLOOR_Y = STICK_Y + STICK_H + 6;
/** Arrow keys move the লাঠি this fast (units a second) and turn the aim this fast (radians a second). */
export const STICK_SPEED = 430;
export const AIM_SPEED = 1.6;
export const BASE_SPEED = 250;
export const ROW_BONUS = 16;
export const MAX_SPEED = 330;
/** "ধীরে খেলো" runs the ball and the stall's clock at this speed. */
export const SLOW = 0.7;
/** The furthest a bounce or an aim leans from straight up, so the ball never skims sideways for ever. */
export const MAX_ANGLE = (62 * Math.PI) / 180;
/** The old game's fixed launch lean (old stalls still start from it). */
export const OLD_LAUNCH = (18 * Math.PI) / 180;
export const DESIGNS = 6;
/** A firecracker pot cracks every pot whose middle is within this distance of its own. */
export const BLAST = CELL * 1.6;
/** The মটকা slides along its rope at this many radians a second. */
export const BOSS_SPEED = 0.7;
/** The stall's end plays out for this long (the last pot's crash, or the last ball rolling away) before the end screen. */
export const END_TIME = { clear: 1.4, out: 0.9 } as const;
/** Throws sooner than this after the ball comes to rest are ignored, so a held finger never throws twice. */
export const MIN_REST = 0.12;
/** The preview's dots: at most this many points. */
export const TRACE_MAX = 160;
/** The short arrow on কঠিন. */
export const SHORT_TRACE = 70;

export const MAX_POTS = 64;
/** Pot kinds. */
export const K_PLAIN = 0, K_TOUGH = 1, K_CRACKER = 2, K_BAMBOO = 3, K_BOSS = 4;

/* Events a step raises (bit flags in game.events; the component reads and clears them). */
export const E_THROW = 1, E_STICK = 2, E_WALL = 4, E_CRACK = 8, E_BREAK = 16, E_BOSS_HIT = 32, E_BLAST = 64, E_KNOT = 128,
  E_LOST = 256, E_CATCH = 512, E_LASTCALL = 1024, E_CLEAR = 2048, E_OUT = 4096, E_OVER = 8192, E_BOSS_BREAK = 16384;

export type Phase = "aim" | "fly" | "end" | "over";
export type End = "" | "clear" | "out";

export type Game = {
  def: LevelDef; seed: number; kind: Kind; level: number; mode: Mode;
  /** Pots: rest-left, top, width, height, kind, hits left, design, rope (for the sway). */
  n: number;
  px: Float32Array; py: Float32Array; pw: Float32Array; ph: Float32Array;
  kinds: Uint8Array; hits: Int8Array; maxHits: Int8Array; design: Uint8Array; rope: Int8Array;
  /** Breakable pots still hanging on each rope. */
  ropeLeft: Int16Array; ropes: number;
  /** The মটকা's index, or -1. */
  boss: number;
  total: number; broken: number; ropesCleared: number;
  ceiling: number;
  /** The ball, its unit direction, the লাঠি's centre and width. */
  x: number; y: number; dx: number; dy: number;
  stick: number; stickW: number;
  /** The aim, radians from straight up (negative leans left), and where the ball sits on the লাঠি. */
  aim: number; offset: number;
  phase: Phase; end: End;
  /** Seconds in the current phase, and of the stall's clock (the sway, the wind and the মটকা run on it). */
  timer: number; clock: number; windPhase: number;
  /** Balls left (counting the one in play), balls lost, throws, points. */
  balls: number; lost: number; throws: number; score: number;
  /** Pots broken since the ball last left the লাঠি, the most in one flight, seconds of play, and seconds since the ball
   *  last touched a pot or the লাঠি. */
  flight: number; bestFlight: number; time: number; idle: number;
  /** Seconds since the ball last hurt a pot. A ball that rallies this long without one gets a nudge off the লাঠি, so it can't loop for ever. */
  dry: number;
  /** শেষ ডাক has rung: the লাঠি catches the ball. */
  catching: boolean;
  /** Bit flags raised since the component last read them, and the pots broken (or hit) in that time. */
  events: number;
  hitList: Int16Array; hitN: number;
  /** The preview: points (x, y pairs), how many, and the pot it hits first (-1 none). */
  trace: Float32Array; traceN: number; target: number;
};

const levelDef = (run: Pick<Run, "kind" | "level">) => defOf(run);

/** The লাঠি's width for a stall and mode. */
export const stickWidth = (def: LevelDef, mode: Mode) => STICK_W * def.stick * (def.old ? 1 : MODE_INFO[mode].stick);
/** The y of rope `r` in a stall. */
export const ropeY = (game: Pick<Game, "ceiling">, r: number) => game.ceiling + ROPE_DROP + r * ROW_GAP;

export function createGame(run: Run): Game {
  const def = levelDef(run), mode: Mode = run.kind === "old" ? "n" : run.mode;
  const rng = makeRng(run.seed);
  const px = new Float32Array(MAX_POTS), py = new Float32Array(MAX_POTS), pw = new Float32Array(MAX_POTS), ph = new Float32Array(MAX_POTS);
  const kinds = new Uint8Array(MAX_POTS), hits = new Int8Array(MAX_POTS), maxHits = new Int8Array(MAX_POTS), design = new Uint8Array(MAX_POTS), rope = new Int8Array(MAX_POTS);
  const ropes = def.rows.length, ropeLeft = new Int16Array(ropes + 1);
  const ceiling = def.top;
  let n = 0, boss = -1;
  const plain: number[] = [];
  for (let r = 0; r < ropes; r++) {
    for (let c = 0; c < COLS; c++) {
      const cell = def.rows[r][c];
      if (cell === ".") continue;
      if (cell === "m") {
        // Only the block's top-left cell makes the মটকা.
        if ((r > 0 && def.rows[r - 1][c] === "m") || (c > 0 && def.rows[r][c - 1] === "m")) continue;
        boss = n;
        px[n] = WALL + c * CELL + 6; pw[n] = CELL * 3 - 12;
        py[n] = ceiling + ROPE_DROP + r * ROW_GAP + POT_DROP; ph[n] = ROW_GAP + POT_H - 2;
        kinds[n] = K_BOSS; hits[n] = maxHits[n] = def.boss; rope[n] = r;
        ropeLeft[r]++;
        n++;
        continue;
      }
      px[n] = WALL + c * CELL + (CELL - POT_W) / 2; pw[n] = POT_W;
      py[n] = ceiling + ROPE_DROP + r * ROW_GAP + POT_DROP; ph[n] = POT_H;
      rope[n] = r;
      if (cell === "B") { kinds[n] = K_BAMBOO; hits[n] = maxHits[n] = 1; }
      else { kinds[n] = K_PLAIN; hits[n] = maxHits[n] = 1; plain.push(n); ropeLeft[r]++; }
      n++;
    }
  }
  // The seed paints the pots (neighbours on a rope never match), then picks the thick and the firecracker ones,
  // then the wind's phase. The old stalls had exactly this order, so an old link lays out the same stall.
  for (let i = 0; i < n; i++) {
    let d = pick(rng, DESIGNS);
    while (i > 0 && rope[i - 1] === rope[i] && d === design[i - 1]) d = pick(rng, DESIGNS);
    design[i] = d;
  }
  const order = plain.slice();
  for (let i = order.length - 1; i > 0; i--) { const j = pick(rng, i + 1); [order[i], order[j]] = [order[j], order[i]]; }
  for (let k = 0; k < Math.min(def.tough, order.length); k++) { kinds[order[k]] = K_TOUGH; hits[order[k]] = maxHits[order[k]] = 2; }
  for (let k = def.tough; k < Math.min(def.tough + def.crackers, order.length); k++) kinds[order[k]] = K_CRACKER;
  const windPhase = rng() * Math.PI * 2;

  let total = 0;
  for (let i = 0; i < n; i++) if (kinds[i] !== K_BAMBOO) total++;
  const stickW = stickWidth(def, mode);
  const game: Game = {
    def, seed: run.seed, kind: run.kind, level: run.level, mode,
    n, px, py, pw, ph, kinds, hits, maxHits, design, rope, ropeLeft, ropes, boss,
    total, broken: 0, ropesCleared: 0, ceiling,
    x: W / 2, y: STICK_Y - BALL_R, dx: 0, dy: -1, stick: W / 2, stickW,
    aim: 0, offset: 0, phase: "aim", end: "", timer: 0, clock: 0, windPhase,
    balls: def.old ? 3 : MODE_INFO[mode].balls, lost: 0, throws: 0, score: 0, flight: 0, bestFlight: 0, time: 0, idle: 0, dry: 0,
    catching: def.catchAt >= total,
    events: 0, hitList: new Int16Array(MAX_POTS * 2), hitN: 0,
    trace: new Float32Array(TRACE_MAX * 2), traceN: 0, target: -1,
  };
  game.aim = def.old ? OLD_LAUNCH : directAim(game);
  return game;
}
/** A game from a stall number, for tests. */
export const createLevel = (seed: number, level: number, mode: Mode = "n", kind: Kind = "level") => createGame({ seed, kind, level, mode });

/** The ball's speed now: a little faster per emptied rope, plus the stall's own `speed`, up to a cap (also raised by it). */
export function speedOf(game: Pick<Game, "def" | "ropesCleared" | "mode">, slow: boolean) {
  const bonus = game.def.speed, mode = game.def.old ? 1 : MODE_INFO[game.mode].speed;
  return Math.min(MAX_SPEED + bonus, BASE_SPEED + bonus + game.ropesCleared * ROW_BONUS) * mode * (slow ? SLOW : 1);
}

/** How far rope `r` hangs off centre at `clock`: ropes sway in the breeze, neighbouring ropes the other way. */
export function swayAt(def: LevelDef, clock: number, r: number) {
  return def.sway ? def.sway * Math.sin(clock * def.swaySpeed + r * 2.1) : 0;
}
/** The মটকা's slide along its rope at `clock`. */
export const bossSlide = (def: LevelDef, clock: number) => def.bossMove ? def.bossMove * Math.sin(clock * BOSS_SPEED) : 0;
/** Sideways wind on the ball at `clock`: gusts that come and go, never constant. */
export function windAt(game: Pick<Game, "def" | "windPhase">, clock: number) {
  return game.def.wind ? game.def.wind * Math.sin(clock * 0.3 + game.windPhase) : 0;
}
/** Pot `i`'s left edge at `clock`. */
export function potLeftAt(game: Game, i: number, clock: number) {
  return game.px[i] + (game.kinds[i] === K_BOSS ? bossSlide(game.def, clock) : 0) + swayAt(game.def, clock, game.rope[i]);
}
export const alive = (game: Game, i: number) => game.hits[i] > 0;
export const breakable = (game: Game, i: number) => game.kinds[i] !== K_BAMBOO;
/** Breakable pots still hanging. */
export const left = (game: Game) => game.total - game.broken;

/** The bounce off the লাঠি: straight up from the middle, leaning up to MAX_ANGLE towards either end. */
export function bounceAngle(ballX: number, stickX: number, stickW: number) {
  return Math.max(-1, Math.min(1, (ballX - stickX) / (stickW / 2))) * MAX_ANGLE;
}
export const clampAim = (aim: number) => Math.max(-MAX_ANGLE, Math.min(MAX_ANGLE, aim));
/** The aim from the resting ball towards a point above it. */
export function aimToward(game: Pick<Game, "x" | "y">, x: number, y: number) {
  return clampAim(Math.atan2(x - game.x, Math.max(8, game.y - y)));
}

/** The straight aim at the lowest pot still hanging (the one nearest the ball breaking ties); step.hot.ts suggest() starts here. */
export function directAim(game: Game) {
  let best = -1, bestY = -1, bestGap = Infinity;
  for (let i = 0; i < game.n; i++) {
    if (!alive(game, i) || !breakable(game, i)) continue;
    const bottom = game.py[i] + game.ph[i], cx = potLeftAt(game, i, game.clock) + game.pw[i] / 2, gap = Math.abs(cx - game.x);
    if (bottom > bestY + 0.5 || (Math.abs(bottom - bestY) <= 0.5 && gap < bestGap)) { best = i; bestY = bottom; bestGap = gap; }
  }
  if (best < 0) return 0;
  return aimToward(game, potLeftAt(game, best, game.clock) + game.pw[best] / 2, game.py[best] + game.ph[best] * 0.6);
}

/** Pot centre at the game's clock (draw, bots and tests). */
export const potCentre = (game: Game, i: number) => potLeftAt(game, i, game.clock) + game.pw[i] / 2;

/** Stars this round earns. */
export const clearedOf = (game: Game) => game.end === "clear";

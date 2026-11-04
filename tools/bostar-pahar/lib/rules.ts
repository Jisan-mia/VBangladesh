// The rules: a sack swings on the crane's rope, a tap drops it straight down, and it must sit on the sack below while the
// pile sways like a damped spring. Pure and seeded: the same seed and taps give the same pile on every phone.
// Units are one sack width and seconds of game time. step.hot.ts advances a Game; this file builds one and does the maths.
import { makeRng, pick } from "../../../shared/game-core";
import { defOf, LEVELS, MODE_INFO, OLD_GHATS, type Kind, type LevelDef, type Mode, type Run } from "./levels";

/** Landing this close to the middle of the sack below is "ঠিক মাঝে". */
export const PERFECT = 0.12;
/** Past this the landing still sits, but it is called wide. */
export const WIDE = 0.3;
/** More than half the sack hanging off the one below, and it slides down. */
export const SLIP = 0.5;
/** Each "ঠিক মাঝে" nudges the pile this far back toward the plumb line. */
export const STRAIGHTEN = 0.1;
/** Half the play area's width, in sacks. The swing always stays inside it. */
export const HALF_VIEW = 3.25;
export const DROP_TIME = 0.22;
export const SETTLE_TIME = 0.42;
/** The missed sack tips off for this long before the next one (or the end). */
export const FALL_TIME = 0.85;
/** How long the pile topples, the truck drives off, or the launch leaves, before the end screen. */
export const END_TIME = { topple: 1.3, clear: 1.2, late: 1.2 } as const;
/** Taps sooner than this after a sack appears are ignored, so a double tap never drops one at the far end. */
export const MIN_SWING = 0.15;
/** "ধীরে খেলো" runs the whole game at this speed; the ঠিক মাঝে window shrinks with it, so it lasts as many milliseconds. */
export const SLOW = 0.75;
/** Past this share of the lean limit the edge glows and the pile creaks. */
export const DANGER = 0.65;
/** Sack looks: 0 and 1 are rice sacks with a green or blue print, 2 is jute. */
export const KINDS = 3;
export const JUTE = 2;
/** The most sacks a pile can hold (the link caps the count at 999). */
export const MAX_PILE = 1000;

/* The pile's sway: a damped spring whose period grows with the pile. */
export const SWAY_BASE = 1.0, SWAY_GROW = 0.06, SWAY_DAMP = 0.11;
/** Sway speed per sack width a landing misses the middle by. */
export const KICK = 3.1;
/** A jute sack lands this much heavier. */
export const HEAVY = 1.7;
/** Gusts: a warning this long before, then a shove of GUST_KICK × the level's strength; one every GUST_MIN…GUST_MIN+GUST_SPREAD seconds. */
export const GUST_WARN = 1, GUST_MIN = 3.6, GUST_SPREAD = 2.4, GUST_KICK = 1.6;
/** A slipping sack brushes the top one on its way down. */
export const BRUSH = 0.45;
/** How hard the pontoon's rocking pushes the pile's sway. */
export const ROCK = 0.35;
/** Load-shedding: dark for DARK_TIME every DARK_MIN…DARK_MIN+DARK_SPREAD seconds. */
export const DARK_TIME = 1.4, DARK_MIN = 3.2, DARK_SPREAD = 2.2;
/** The rolling trolley's and the pontoon's periods. */
export const ROLL_T = 3.4, PONTOON_T = 2.9;

export type Swing = {
  /** Seconds for one full swing there and back. */
  period: number;
  /** How far either side of the pulley the sack swings. */
  amp: number;
  /** Where the trolley stops, as a fraction of `amp` away from the top sack. */
  shift: number;
  /** Starts at the left (-π/2) or right (π/2) end of the swing. */
  phase: number;
  kind: number;
};

/** The old game's swing for the sack at `index`: gentle at first, faster and wider as the pile grows; every 8th a breather.
 *  Old links and খোলা ঘাট use it; the rng calls stay in the old order, so old links replay exactly. */
export function oldSwingInto(seed: number, index: number, out: Swing) {
  const rng = makeRng((seed ^ Math.imul(index + 1, 0x9e3779b1)) >>> 0);
  const breather = index % 8 === 7 ? 1.3 : 1;
  const base = index < 29 ? 2.7 - 0.055 * index : Math.max(0.9, 1.105 - 0.008 * (index - 29));
  out.period = Math.max(0.9, base * (0.92 + 0.16 * rng())) * breather;
  out.amp = Math.min(1.5, 1.05 + 0.018 * index) * (0.95 + 0.1 * rng());
  out.shift = index < 3 ? 0 : (rng() * 2 - 1) * 0.4 * Math.min(1, (index - 2) / 10);
  out.phase = rng() < 0.5 ? -Math.PI / 2 : Math.PI / 2;
  out.kind = index === 0 ? 0 : pick(rng, KINDS);
  return out;
}
/** The old game's swing, as a fresh object (tests and the card). */
export const swingOf = (seed: number, index: number) => oldSwingInto(seed, index, { period: 0, amp: 0, shift: 0, phase: 0, kind: 0 });

/** A level's swing for the sack at `index`: the level's period eases from its first to its last value over the goal. */
export function levelSwingInto(seed: number, index: number, def: LevelDef, speed: number, out: Swing) {
  const rng = makeRng((seed ^ Math.imul(index + 1, 0x9e3779b1)) >>> 0);
  const k = def.goal > 1 ? Math.min(1, index / (def.goal - 1)) : 0;
  out.period = (def.period[0] + (def.period[1] - def.period[0]) * k) * (0.92 + 0.16 * rng()) / speed;
  out.amp = def.amp * (0.95 + 0.1 * rng());
  const side = rng() * 2 - 1;
  out.shift = index === 0 ? 0 : side * def.shift;
  out.phase = rng() < 0.5 ? -Math.PI / 2 : Math.PI / 2;
  const kind = rng();
  out.kind = index === 0 ? 0 : def.heavy && kind < 0.4 ? JUTE : kind < 0.7 ? 0 : 1;
  return out;
}

/** Where the trolley stops for a swing: near the top sack, never so far out that the sack leaves the screen.
 *  `margin` is any extra room the rolling trolley needs. */
export function placePivot(top: number, swing: Swing, margin = 0) {
  const limit = HALF_VIEW - 0.5 - swing.amp - margin;
  return Math.max(-limit, Math.min(limit, top + swing.amp * swing.shift));
}

export type Phase = "ready" | "swing" | "drop" | "settle" | "fall" | "end" | "over";
export type Verdict = "perfect" | "good" | "wide" | "slip" | "lean";
/** How a round ended: the truck filled, the pile toppled, the last spare sack went in the river, or the horn blew. */
export type End = "clear" | "topple" | "spent" | "late";

/* Events of the last step or tap, as bits, so the component reacts without diffing (it clears `events` after reading). */
export const E_LAND = 1, E_PERFECT = 2, E_SLIP = 4, E_TOPPLE = 8, E_CLEAR = 16, E_LATE = 32, E_GUST_WARN = 64, E_GUST = 128;
export const E_DANGER = 256, E_DARK = 512, E_LIGHT = 1024, E_NEXT = 2048, E_OVER = 4096, E_DROP = 8192;

export type Game = {
  seed: number; kind: Kind; level: number; mode: Mode;
  def: LevelDef;
  /** Old links: the old rules exactly (a stiff pile, one slip ends the run). */
  old: boolean;
  /** Old links start the swings this far along the seed's list (the old ghat's offset). */
  from: number;
  spares: number;
  /** How far the top may lean before the pile topples: the level's limit, a little more on সহজ. */
  limit: number;
  phase: Phase;
  end: End | null;
  /** Seconds the current sack has swung. */
  t: number;
  /** Seconds into the current drop, settle, fall or ending. */
  timer: number;
  /** Seconds since the first drop (the round's time), and the finale's seconds left. */
  time: number;
  left: number;
  started: boolean;
  /** Sacks in the pile, the bottom one (already on the truck) included, and each one's rest position from the plumb line. */
  n: number;
  xs: Float64Array;
  kinds: Uint8Array;
  /** Sacks hung so far (the next swing's index). */
  hung: number;
  swing: Swing;
  pivot: number;
  /** Seconds the trolley has rolled and the pontoon has rocked. */
  rollT: number;
  truckX: number;
  /** The pile's sway: the top sack's displacement and speed. */
  sway: number;
  swayV: number;
  /** Where the sack was let go, and the last landing's verdict and distance from the middle of the sack below. */
  dropX: number;
  verdict: Verdict | null;
  offset: number;
  perfect: number; combo: number; bestCombo: number;
  /** Sacks that went in the river. */
  lost: number;
  /** Gusts weathered, the most tension the pile took (share of the limit), and whether it is in danger now. */
  gusted: number;
  peak: number;
  danger: boolean;
  /** Seconds to the next gust (and its side, ±1); seconds to the next blackout, and how long the lights stay out. */
  gustAt: number;
  gustSide: number;
  /** The side the last gust shoved toward. */
  gustHit: number;
  darkAt: number;
  darkLeft: number;
  rng: () => number;
  events: number;
};

/** The swing for the sack at `index` on this run, written into `game.swing`. */
export function hangSwing(game: Game, index: number) {
  if (game.old) oldSwingInto(game.seed, index + game.from, game.swing);
  else if (game.kind === "endless") oldSwingInto(game.seed, index, game.swing);
  else levelSwingInto(game.seed, index, game.def, MODE_INFO[game.mode].speed, game.swing);
  if (!game.old && game.kind === "endless") game.swing.period /= MODE_INFO[game.mode].speed;
}

export function createGame(seed: number, kind: Kind = "level", level = 1, mode: Mode = "n"): Game {
  const old = kind === "old", def = defOf({ kind, level });
  const rng = makeRng((seed ^ 0x2545f491 ^ Math.imul(level, 0x27d4eb2d)) >>> 0);
  const game: Game = {
    seed, kind, level, mode, def, old, from: old ? OLD_GHATS[level - 1].offset : 0,
    spares: kind === "level" ? MODE_INFO[mode].spares : 0, limit: def.limit * (old ? 1 : MODE_INFO[mode].limit),
    phase: "ready", end: null, t: 0, timer: 0, time: 0, left: def.clock, started: false,
    n: 1, xs: new Float64Array(MAX_PILE), kinds: new Uint8Array(MAX_PILE), hung: 0,
    swing: { period: 1, amp: 1, shift: 0, phase: 0, kind: 0 }, pivot: 0, rollT: 0, truckX: 0, sway: 0, swayV: 0,
    dropX: 0, verdict: null, offset: 0, perfect: 0, combo: 0, bestCombo: 0, lost: 0, gusted: 0, peak: 0, danger: false,
    gustAt: GUST_MIN + GUST_SPREAD * rng(), gustSide: rng() < 0.5 ? -1 : 1, gustHit: 1, darkAt: DARK_MIN + DARK_SPREAD * rng(), darkLeft: 0,
    rng, events: 0,
  };
  hangSwing(game, 0);
  game.pivot = placePivot(0, game.swing, def.roll);
  return game;
}
export const createRun = (run: Run) => createGame(run.seed, run.kind, run.level, run.mode);

/** Sacks stacked on the truck (the bottom one was already there). */
export const scoreOf = (game: Game) => game.n - 1;
/** The top sack's rest position and how far it leans from the plumb line (+ is right). */
export const topX = (game: Game) => game.xs[game.n - 1];
export const leanOf = (game: Game) => game.xs[game.n - 1] - game.xs[0];
/** The pile's tension: the top's lean plus its sway, signed. Past the limit it topples. */
export const tensionOf = (game: Game) => game.n > 1 ? game.xs[game.n - 1] - game.xs[0] + game.sway : 0;
/** Tension as a share of the limit, 0..1+. */
export const strainOf = (game: Game) => Math.abs(tensionOf(game)) / game.limit;
/** Where the trolley is now (it rolls on a moving-trolley level). */
export const pivotOf = (game: Game) => game.pivot + game.def.roll * Math.sin((2 * Math.PI * game.rollT) / ROLL_T);
/** Where the hanging sack is right now. */
export const swingX = (game: Game) => pivotOf(game) + game.swing.amp * Math.sin((2 * Math.PI * game.t) / game.swing.period + game.swing.phase);
/** Where the top sack is on screen right now: the truck's roll, its rest position and the sway. */
export const topWorld = (game: Game) => game.truckX + game.xs[game.n - 1] + (game.n > 1 ? game.sway : 0);
/** The sway's angular frequency for a pile of `n`: a tall pile sways slower. */
export const swayOmega = (n: number) => (2 * Math.PI) / (SWAY_BASE + SWAY_GROW * (n - 1));
/** The ঠিক মাঝে window in sack widths: narrower in slow mode, so it lasts as many milliseconds. */
export const perfectWindow = (slow: boolean) => slow ? PERFECT * SLOW : PERFECT;
/** True while the lights are out on a load-shedding level. */
export const isDark = (game: Game) => game.darkLeft > 0;
/** The round's goal reached: the truck is full. */
export const filled = (game: Game) => game.def.goal > 0 && game.n - 1 >= game.def.goal;
export const levelOf = (level: number) => LEVELS[level - 1];

/**
 * Where a sack let go at `x` (in the pile's frame: screen x minus the truck's roll and the sway) ends up on a pile whose top
 * sack rests at `top` over a bottom sack at `base`, with the pile swayed `sway` and a lean limit of `limit`.
 * With no sway and a limit of 1 this is exactly the old game's rule.
 */
export function judge(top: number, base: number, x: number, sway = 0, limit = 1, window = PERFECT): { verdict: Verdict; x: number } {
  const off = Math.abs(x - top);
  if (off > SLIP) return { verdict: "slip", x };
  if (off <= window) {
    const lean = top - base;
    return { verdict: "perfect", x: top - Math.sign(lean) * Math.min(Math.abs(lean), STRAIGHTEN) };
  }
  return { verdict: Math.abs(x - base + sway) > limit ? "lean" : off > WIDE ? "wide" : "good", x };
}

// The rules: a sack swings on the crane's rope, a tap drops it straight down, and it must sit on the sack below.
// Pure and seeded: the same seed gives the same swings on every phone. Units are one sack width and seconds.
import { makeRng, pick, starsFor, type LevelStars } from "../../../shared/game-core";

/** Landing this close to the middle of the sack below is "ঠিক মাঝে". */
export const PERFECT = 0.12;
/** Past this the landing still sits, but it is called wide. */
export const WIDE = 0.3;
/** More than half the sack hanging off the one below, and it slides down. */
export const SLIP = 0.5;
/** The top sack may lean at most one sack width from the ওলন (the plumb line over the bottom sack). */
export const LEAN_MAX = 1;
/** Each "ঠিক মাঝে" nudges the pile this far back toward the plumb line. */
export const STRAIGHTEN = 0.1;
/** Half the play area's width, in sacks. The swing always stays inside it. */
export const HALF_VIEW = 3.25;
export const DROP_TIME = 0.22, SLOW_DROP = 0.3;
export const SETTLE_TIME = 0.42, SLOW_SETTLE = 0.6;
/** The missed sack tips off for this long before the run is over. */
export const FALL_TIME = 0.85;
/** "ধীরে খেলো" swings at this fraction of the speed. */
export const SLOW_SWING = 0.6;
/** Taps sooner than this after a sack appears are ignored, so a double tap never drops one at the far end. */
export const MIN_SWING = 0.15;
/** Sack looks: 0 and 1 are rice sacks with a green or blue print, 2 is jute. */
export const KINDS = 3;

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

/** The swing for the sack at `index` (0 is the first one you drop). Gentle at first, faster and wider as the pile grows; every 8th is a breather.
 *  At the fastest the sack crosses the pile at about 11 sack widths a second: still a ±45 ms window to stay on. */
export function swingOf(seed: number, index: number): Swing {
  const rng = makeRng((seed ^ Math.imul(index + 1, 0x9e3779b1)) >>> 0);
  const breather = index % 8 === 7 ? 1.3 : 1;
  // Quick to rise over the first 30 sacks, then a slow creep so long runs still end.
  const base = index < 29 ? 2.7 - 0.055 * index : Math.max(0.9, 1.105 - 0.008 * (index - 29));
  const period = Math.max(0.9, base * (0.92 + 0.16 * rng())) * breather;
  const amp = Math.min(1.5, 1.05 + 0.018 * index) * (0.95 + 0.1 * rng());
  const shift = index < 3 ? 0 : (rng() * 2 - 1) * 0.4 * Math.min(1, (index - 2) / 10);
  const phase = rng() < 0.5 ? -Math.PI / 2 : Math.PI / 2;
  const kind = index === 0 ? 0 : pick(rng, KINDS);
  return { period, amp, shift, phase, kind };
}

/** Where the trolley stops for a swing: near the top sack, never so far out that the sack leaves the screen.
 *  While the pile stands (|top| ≤ LEAN_MAX) the clamp only pulls toward the top sack, so the swing always passes over it. */
export function placePivot(top: number, swing: Swing) {
  const limit = HALF_VIEW - 0.5 - swing.amp;
  return Math.max(-limit, Math.min(limit, top + swing.amp * swing.shift));
}

/**
 * The ghats (levels). Each one starts the swings `offset` sacks further along (faster, wider, off-centre sooner) and asks
 * for a taller load: `goal` sacks fill the truck (1 star, the next ghat opens), `stars` are the heights for 2 and 3.
 * The run goes on after the goal, as before. Ghat 1 is the original game, so old links replay unchanged.
 */
export const GHATS = [
  { name: "সদরঘাট", offset: 0, goal: 5, stars: [12, 20] },
  { name: "বাদামতলী", offset: 1, goal: 7, stars: [13, 22] },
  { name: "নারায়ণগঞ্জ", offset: 2, goal: 8, stars: [14, 24] },
  { name: "চাঁদপুর", offset: 4, goal: 9, stars: [16, 26] },
  { name: "মাওয়া", offset: 5, goal: 10, stars: [16, 26] },
  { name: "আরিচা", offset: 6, goal: 10, stars: [17, 26] },
  { name: "ভৈরব", offset: 8, goal: 10, stars: [16, 25] },
  { name: "বরিশাল", offset: 9, goal: 10, stars: [16, 24] },
  { name: "খুলনা", offset: 10, goal: 10, stars: [16, 23] },
  { name: "চিলমারী", offset: 12, goal: 10, stars: [15, 22] },
] as const satisfies ReadonlyArray<{ name: string; offset: number; goal: number; stars: readonly [number, number] }>;
export const LEVEL_COUNT = GHATS.length;
export const isLevel = (level: number) => Number.isInteger(level) && level >= 1 && level <= LEVEL_COUNT;
/** Stars for a load: none below the goal, then by height. */
export const starsOf = (sacks: number, level: number) => {
  const ghat = GHATS[level - 1];
  return sacks < ghat.goal ? 0 : starsFor(sacks, ghat.stars[1], ghat.stars[0]);
};
/** The next height that earns something (the goal, then 2 and 3 stars), or 0 at three stars. */
export const nextMark = (sacks: number, level: number) => {
  const ghat = GHATS[level - 1];
  return [ghat.goal, ghat.stars[0], ghat.stars[1]].find(mark => sacks < mark) ?? 0;
};
/** Before ghats, this phone kept only a best count for the one game there was (now ghat 1). Its stars, or 0 when there is nothing to move. */
export function migrateBest(stars: LevelStars, oldBest: string | null) {
  const sacks = Number(oldBest);
  if (Object.keys(stars).length || oldBest === null || !Number.isInteger(sacks) || sacks < 0) return 0;
  return starsOf(sacks, 1);
}

export type Phase = "ready" | "swing" | "drop" | "settle" | "fall" | "over";
export type Verdict = "perfect" | "good" | "wide" | "slip" | "lean";

export type Game = {
  seed: number;
  level: number;
  /** Swings are taken from this far along the seed's list (the ghat's offset). */
  from: number;
  phase: Phase;
  /** Seconds the current sack has swung (slower in "ধীরে খেলো"). */
  t: number;
  /** Seconds into the current drop, settle or fall. */
  timer: number;
  /** Each sack in the pile, in sack widths from the bottom one (xs[0] = 0 is already on the truck). */
  xs: number[];
  kinds: number[];
  swing: Swing;
  pivot: number;
  /** Where the sack was let go (and, after a miss, where it tips off). */
  dropX: number;
  perfect: number;
  combo: number;
  bestCombo: number;
  verdict: Verdict | null;
  /** The last landing's distance from the middle of the sack below. */
  offset: number;
};

export function newGame(seed: number, level = 1): Game {
  const from = GHATS[level - 1].offset, swing = swingOf(seed, from);
  return { seed, level, from, phase: "ready", t: 0, timer: 0, xs: [0], kinds: [0], swing, pivot: placePivot(0, swing), dropX: 0, perfect: 0, combo: 0, bestCombo: 0, verdict: null, offset: 0 };
}

export const scoreOf = (game: Game) => game.xs.length - 1;
export const topX = (game: Game) => game.xs[game.xs.length - 1];
/** How far the top sack leans from the plumb line, in sack widths (+ is right). */
export const leanOf = (game: Game) => topX(game) - game.xs[0];
/** Where the hanging sack is right now. */
export const swingX = (game: Game) => game.pivot + game.swing.amp * Math.sin((2 * Math.PI * game.t) / game.swing.period + game.swing.phase);

/** Where a sack let go at `x` ends up on a pile whose top sack is at `top` over a bottom sack at `base`. */
export function judge(top: number, base: number, x: number): { verdict: Verdict; x: number } {
  const off = Math.abs(x - top);
  if (off > SLIP) return { verdict: "slip", x };
  if (off <= PERFECT) {
    const lean = top - base;
    return { verdict: "perfect", x: top - Math.sign(lean) * Math.min(Math.abs(lean), STRAIGHTEN) };
  }
  return { verdict: Math.abs(x - base) > LEAN_MAX ? "lean" : off > WIDE ? "wide" : "good", x };
}

/** One tap: drop the hanging sack. Returns false when a tap does nothing right now. Mutates `game`. */
export function tap(game: Game) {
  if ((game.phase !== "ready" && game.phase !== "swing") || game.t < MIN_SWING) return false;
  game.dropX = swingX(game);
  game.phase = "drop";
  game.timer = 0;
  return true;
}

function land(game: Game) {
  const top = topX(game);
  const { verdict, x } = judge(top, game.xs[0], game.dropX);
  game.verdict = verdict;
  game.offset = game.dropX - top;
  game.timer = 0;
  if (verdict === "slip" || verdict === "lean") { game.combo = 0; game.phase = "fall"; return; }
  if (verdict === "perfect") { game.perfect++; game.combo++; game.bestCombo = Math.max(game.bestCombo, game.combo); }
  else game.combo = 0;
  game.xs.push(x);
  game.kinds.push(game.swing.kind);
  // The next swing is known now, so the trolley can roll to it while this sack settles.
  game.swing = swingOf(game.seed, game.xs.length - 1 + game.from);
  game.pivot = placePivot(x, game.swing);
  game.phase = "settle";
}

/** Advances the game by `dt` real seconds. Mutates `game`; allocates only when a sack lands. */
export function step(game: Game, dt: number, slow: boolean) {
  switch (game.phase) {
    case "ready": case "swing":
      game.t += dt * (slow ? SLOW_SWING : 1);
      return;
    case "drop":
      game.timer += dt;
      if (game.timer >= (slow ? SLOW_DROP : DROP_TIME)) land(game);
      return;
    case "settle":
      game.timer += dt;
      if (game.timer >= (slow ? SLOW_SETTLE : SETTLE_TIME)) { game.phase = "swing"; game.t = 0; }
      return;
    case "fall":
      game.timer += dt;
      if (game.timer >= FALL_TIME) game.phase = "over";
      return;
  }
}

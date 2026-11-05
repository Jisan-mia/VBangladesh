// One run's state, made once per floor (or per old link's endless stairs). step.hot.ts mutates it without allocating.
import { makeStairs, speedAt as oldSpeedAt, startRowOf, type OldLedge } from "./legacy";
import { makeLedge, CONCRETE, FIRST_Y, GAP, H, PARAPET, PLANK, W, WEIGHTY, INSTANT, type Feel, type Ledge } from "./physics";

/** Event bits for one step: sounds and juice read them. */
export const LAND = 1, PICK = 2, HURT = 4, WIN = 8, OVER = 16, BONUS = 32, CRACKED = 64, GUST = 128, SURGED = 256;
/** What cost a chance. */
export const TOP_HIT = 1, BOTTOM_HIT = 2, CACTUS = 3;

export type Game = {
  seed: number;
  rows: Ledge[];
  /** Steps to the landing (the last row), or 0 for an old link's endless stairs. */
  steps: number;
  feel: Feel;
  /** The first row that may still be on screen. */
  lo: number;
  x: number; y: number; vx: number; vy: number; roll: number;
  /** The row index the marble rolls on, or -1 in the air; the row it just left (no landing back on it mid-drop). */
  on: number; skip: number;
  cam: number; speed: number; wind: number;
  start: number; deepest: number;
  picks: number; chances: number; most: number; falls: number; streak: number; bestStreak: number;
  t: number; wait: number;
  /** 0 rolling, 1 the floor's landing reached, 2 out of chances. */
  over: 0 | 1 | 2;
  events: number; hurt: number;
  /** The last landing's speed (for the টক's weight and the squash), the squash left (0..1), the last pick's spot. */
  impact: number; squash: number; pickX: number; pickY: number;
};

export function createGame(seed: number, rows: Ledge[], steps: number, chances: number, feel: Feel = WEIGHTY): Game {
  const first = rows[0];
  return {
    seed, rows, steps, feel, lo: 0,
    x: (first.x0 + first.x1) / 2, y: first.y - 11, vx: 0, vy: 0, roll: 0, on: 0, skip: -1,
    cam: first.y - FIRST_Y, speed: first.speed, wind: 0,
    start: first.row, deepest: first.row,
    picks: 0, chances, most: chances, falls: 0, streak: 0, bestStreak: 0,
    t: 0, wait: 0, over: 0, events: 0, hurt: 0, impact: 0, squash: 0, pickX: 0, pickY: 0,
  };
}

/** Steps down so far. */
export const stepsOf = (game: Game) => game.deepest - game.start;
/** Stars for a finished floor: none unless the landing was reached; then 3 with no fall, 2 with one, 1 with more. */
export const starsOf = (game: Game) => game.over !== 1 ? 0 : Math.max(1, 3 - game.falls);
export const fallStars = (falls: number) => Math.max(1, 3 - falls);

// ---- an old link's endless stairs ----
const OLD_KINDS = { parapet: PARAPET, concrete: CONCRETE, bamboo: PLANK } as const;
/** The old ledge in the new world: same row, same x, same pot and marble, its old stage's speed. */
function fromOld(old: OldLedge): Ledge {
  const ledge = makeLedge(old.row, old.x0, old.x1, old.y, OLD_KINDS[old.kind], oldSpeedAt(old.row));
  ledge.pot = old.pot; ledge.pick = old.pick;
  return ledge;
}
export type Endless = { game: Game; old: OldLedge[]; next: (prev: OldLedge) => OldLedge };

/** The friend's old staircase from stage 1..8, played with the old instant roll until the chances run out. */
export function createEndless(seed: number, stage: number, chances: number): Endless {
  const stairs = makeStairs(seed, stage), old = [stairs.first];
  const game = createGame(seed, [fromOld(stairs.first)], 0, chances, INSTANT);
  const endless = { game, old, next: stairs.next };
  extend(endless);
  game.x = W / 2;
  return endless;
}
/** Adds old rows until they reach below the board. Called between steps, never inside one. */
export function extend(endless: Endless) {
  const { game, old } = endless;
  while (old[old.length - 1].y - game.cam < H + 2 * GAP) {
    const made = endless.next(old[old.length - 1]);
    old.push(made);
    game.rows.push(fromOld(made));
  }
}
export const oldStartRow = startRowOf;

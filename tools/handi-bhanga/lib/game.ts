// Rules and physics for হাঁড়িভাঙা: 5 rows of 7 clay pots on a fair-stall rope, a cloth ball and a bamboo লাঠি.
// The seed picks which pots are tough (two hits) and how each is painted. The ball moves in small substeps, one axis at a time, so even a fast ball never slips through a pot.
import { makeRng, pick } from "../../../shared/game-core";
import { possessive } from "../../../shared/bangla";
import { bn, CHANCES, CHANCE_POINTS, POTS, POT_POINTS } from "./link";

/** The board is always 360 × 500 world units, scaled to the screen. */
export const W = 360;
export const H = 500;
/** Bamboo poles on both sides and the stall's awning on top. */
export const WALL = 12;
export const TOP = 44;
export const COLS = 7;
export const ROWS = 5;
export const CELL = (W - WALL * 2) / COLS;
export const ROPE_Y = 58;
export const ROW_GAP = 44;
export const POT_W = 36;
export const POT_H = 34;
/** How far a pot hangs below its rope. */
export const POT_DROP = 6;
export const BALL_R = 8;
export const STICK_W = 76;
export const STICK_H = 12;
/** The stick's top surface. */
export const STICK_Y = 452;
/** Buttons and arrow keys move the stick this fast (units a second). */
export const STICK_SPEED = 430;
export const BASE_SPEED = 250;
export const ROW_BONUS = 16;
export const MAX_SPEED = 330;
export const SLOW = 0.7;
/** The furthest a stick bounce leans from straight up, so the ball can never skim sideways for ever. */
export const MAX_ANGLE = (62 * Math.PI) / 180;
const LAUNCH_ANGLE = (18 * Math.PI) / 180;
export const TOUGH = 8;
export const DESIGNS = 6;

export const potLeft = (index: number) => WALL + (index % COLS) * CELL + (CELL - POT_W) / 2;
export const potTop = (index: number) => ROPE_Y + Math.floor(index / COLS) * ROW_GAP + POT_DROP;
const LAST_ROW_BOTTOM = potTop(POTS - 1) + POT_H;

export type Game = {
  /** Hits left per pot; 0 means broken. */
  hits: Int8Array;
  tough: Uint8Array;
  design: Uint8Array;
  x: number; y: number;
  /** The ball's direction as a unit vector; its speed comes from speed(). */
  dx: number; dy: number;
  /** The stick's centre. */
  stick: number;
  /** The ball sits on the stick, waiting for a tap. */
  resting: boolean;
  /** Balls left, counting the one in play. */
  chances: number;
  broken: number;
  rowsCleared: number;
  score: number;
  over: boolean;
  won: boolean;
};

export type GameEvent = "crack" | "break" | "stick" | "wall" | "lost" | "win" | "over";
export type Listener = (event: GameEvent, pot: number) => void;
const quiet: Listener = () => {};

export function createGame(seed: number): Game {
  const rng = makeRng(seed);
  const design = new Uint8Array(POTS);
  for (let i = 0; i < POTS; i++) {
    // Neighbours on a rope never wear the same painting.
    let d = pick(rng, DESIGNS);
    while (i % COLS > 0 && d === design[i - 1]) d = pick(rng, DESIGNS);
    design[i] = d;
  }
  const order = Array.from({ length: POTS }, (_, i) => i);
  for (let i = POTS - 1; i > 0; i--) { const j = pick(rng, i + 1); [order[i], order[j]] = [order[j], order[i]]; }
  const tough = new Uint8Array(POTS);
  for (let k = 0; k < TOUGH; k++) tough[order[k]] = 1;
  const hits = Int8Array.from(tough, t => t ? 2 : 1);
  return { hits, tough, design, x: W / 2, y: STICK_Y - BALL_R, dx: 0, dy: -1, stick: W / 2, resting: true, chances: CHANCES, broken: 0, rowsCleared: 0, score: 0, over: false, won: false };
}

export const speed = (rowsCleared: number, slow: boolean) => Math.min(MAX_SPEED, BASE_SPEED + rowsCleared * ROW_BONUS) * (slow ? SLOW : 1);

export function moveStick(game: Game, x: number) {
  game.stick = Math.max(WALL + STICK_W / 2, Math.min(W - WALL - STICK_W / 2, x));
  if (game.resting) game.x = game.stick;
}

/** Held ◀ ▶ buttons or arrow keys: -1 left, 1 right. */
export const nudge = (game: Game, dir: number, dt: number) => moveStick(game, game.stick + dir * STICK_SPEED * dt);

/** The sideways part of a launch: it leans towards the middle of the stall. */
export const launchDir = (stick: number) => Math.sin(LAUNCH_ANGLE) * (stick <= W / 2 ? 1 : -1);

/** Sends a resting ball up. */
export function launch(game: Game) {
  if (!game.resting || game.over) return false;
  game.resting = false;
  game.dx = launchDir(game.stick);
  game.dy = -Math.cos(LAUNCH_ANGLE);
  return true;
}

/** The direction a stick bounce sends the ball: straight up from the middle, leaning up to MAX_ANGLE towards either end. */
export function bounceAngle(ballX: number, stickX: number) {
  return Math.max(-1, Math.min(1, (ballX - stickX) / (STICK_W / 2))) * MAX_ANGLE;
}

export function overlaps(game: Game, index: number) {
  const left = potLeft(index), top = potTop(index);
  const nx = Math.max(left, Math.min(left + POT_W, game.x)) - game.x;
  const ny = Math.max(top, Math.min(top + POT_H, game.y)) - game.y;
  return nx * nx + ny * ny < BALL_R * BALL_R;
}

function hit(game: Game, index: number, on: Listener) {
  if (--game.hits[index] > 0) { on("crack", index); return; }
  game.broken++;
  game.score += POT_POINTS;
  on("break", index);
  const row = index - (index % COLS);
  let left = 0;
  for (let i = row; i < row + COLS; i++) left += game.hits[i];
  if (left === 0) game.rowsCleared++;
  if (game.broken === POTS) {
    game.won = true;
    game.over = true;
    game.score += game.chances * CHANCE_POINTS;
    on("win", index);
  }
}

/** Hits every live pot the ball now overlaps; true if it touched any. */
function hitPots(game: Game, on: Listener) {
  if (game.y - BALL_R > LAST_ROW_BOTTOM) return false;
  let touched = false;
  for (let i = 0; i < POTS; i++) {
    if (game.hits[i] > 0 && overlaps(game, i)) { touched = true; hit(game, i, on); }
  }
  return touched;
}

function lose(game: Game, on: Listener) {
  game.chances--;
  on("lost", -1);
  if (game.chances <= 0) { game.over = true; on("over", -1); return; }
  game.resting = true;
  game.x = game.stick;
  game.y = STICK_Y - BALL_R;
}

function substep(game: Game, distance: number, on: Listener) {
  const mx = game.dx * distance, px = game.x;
  game.x += mx;
  if (game.x - BALL_R < WALL) { game.x = WALL + BALL_R; game.dx = Math.abs(game.dx); on("wall", -1); }
  else if (game.x + BALL_R > W - WALL) { game.x = W - WALL - BALL_R; game.dx = -Math.abs(game.dx); on("wall", -1); }
  if (hitPots(game, on)) { game.x = px; game.dx = mx > 0 ? -Math.abs(game.dx) : Math.abs(game.dx); }
  if (game.over) return;

  const my = game.dy * distance, py = game.y;
  game.y += my;
  if (game.y - BALL_R < TOP) { game.y = TOP + BALL_R; game.dy = Math.abs(game.dy); on("wall", -1); }
  if (hitPots(game, on)) { game.y = py; game.dy = my > 0 ? -Math.abs(game.dy) : Math.abs(game.dy); return; }
  if (my <= 0) return;
  // Forgiving: the stick still catches a ball that was a little past its top edge, and a little past either end.
  if (game.y + BALL_R >= STICK_Y && py + BALL_R <= STICK_Y + STICK_H / 2 && Math.abs(game.x - game.stick) <= STICK_W / 2 + BALL_R * 0.6) {
    const angle = bounceAngle(game.x, game.stick);
    game.dx = Math.sin(angle);
    game.dy = -Math.cos(angle);
    game.y = STICK_Y - BALL_R;
    on("stick", -1);
  } else if (game.y - BALL_R > H) lose(game, on);
}

/** Advances the ball by dt seconds in substeps of at most half its radius, whatever the speed or dt. */
export function step(game: Game, dt: number, slow: boolean, on: Listener = quiet) {
  if (game.over) return;
  if (game.resting) { game.x = game.stick; game.y = STICK_Y - BALL_R; return; }
  const distance = speed(game.rowsCleared, slow) * dt;
  const count = Math.max(1, Math.ceil(distance / (BALL_R * 0.5)));
  for (let i = 0; i < count && !game.resting && !game.over; i++) substep(game, distance / count, on);
}

export const bands = [
  { below: 100, line: "হাত গরম হলো, এবার আসল খেলা!" },
  { below: 250, line: "মেলার দোকানি একটু চিন্তায় পড়ে গেছে!" },
  { below: 400, line: "আর কয়েকটা হলেই দোকান সাফ!" },
  { below: 500, line: "সব হাঁড়ি ভাঙা শেষ! মেলা জমে গেছে।" },
  { below: Infinity, line: "একটা চান্সও যায়নি, পুরো দোকান সাফ!" },
] as const;
export const humanLine = (score: number) => bands.find(band => score < band.below)!.line;

export function compareLine(score: number, target: number, name: string) {
  const who = name || "বন্ধু", gap = score - target;
  if (gap > 0) return `${possessive(who)} চেয়ে ${bn(gap)} বেশি!`;
  if (gap === 0) return `একদম সমান! ${who}ও ${bn(target)}।`;
  if (-gap <= 50) return `আর একটু হলেই! মাত্র ${bn(-gap)} কম।`;
  return `${who} এখনো ${bn(-gap)} এগিয়ে। আরেকবার?`;
}

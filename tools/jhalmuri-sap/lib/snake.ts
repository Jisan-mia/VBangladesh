// Rules for ঝালমুড়ি সাপ: a 12×16 board fenced with tin, food from a seeded ঠোঙা, buffered turns that can never fold the snake back on itself.
import { makeRng, pick } from "../../../shared/game-core";
import { possessive } from "../../../shared/bangla";
import { bn, POINTS } from "./link";
import { levelOf, wallCells, COLS, ROWS } from "./levels";

export { COLS, ROWS };
export const CELLS = COLS * ROWS;

/** 0 up, 1 right, 2 down, 3 left: clockwise, so +1 is a right turn and +2 is a U-turn. */
export type Dir = 0 | 1 | 2 | 3;
export const DX = [0, 1, 0, -1] as const;
export const DY = [-1, 0, 1, 0] as const;

export type Kind = "muri" | "chanachur" | "peyaj" | "morich" | "tetul";
export const FOODS: readonly Kind[] = ["muri", "chanachur", "peyaj", "morich", "tetul"];
// Repeats set how often each food comes out of the ঠোঙা: mostly মুড়ি and চানাচুর, তেঁতুল now and then.
const BAG: readonly Kind[] = ["muri", "muri", "muri", "chanachur", "chanachur", "chanachur", "peyaj", "peyaj", "morich", "morich", "tetul"];

export const BONUS_POINTS = 30;
/** A golden chilli turns up after every 4th food and stays for 45 moves. */
export const BONUS_EVERY = 4;
export const BONUS_LIFE = 45;
export const LEVEL_EVERY = 5;
const QUEUE = 3;

export type Game = {
  rng: () => number;
  /** Cell indices (y * COLS + x), head first. */
  body: number[];
  dir: Dir;
  /** Turns waiting for the next moves; each one is checked against the one before it. */
  queue: Dir[];
  food: number;
  kind: Kind;
  bonus: number;
  bonusLife: number;
  eaten: number;
  golden: number;
  score: number;
  moves: number;
  over: boolean;
  won: boolean;
  /** 1 on a tin wall cell (levels only; the classic board has none). */
  wall: Uint8Array;
  /** Bites that clear the level; 0 in the classic endless game. */
  goal: number;
  /** Bites in a row, each within COMBO_MOVES of the last. */
  combo: number;
  lastBite: number;
};

export type StepEvent = "move" | "eat" | "bonus" | "crash" | "win" | "none";

export const cellOf = (x: number, y: number) => y * COLS + x;
export const START: readonly number[] = [cellOf(5, 11), cellOf(5, 12), cellOf(5, 13)];

/** Bites closer together than this (in moves) keep the combo going. */
export const COMBO_MOVES = 16;

/** Level 0 is the classic endless game; levels 1–12 add a goal and tin walls. The food draws are the same either way. */
export function createGame(seed: number, level = 0): Game {
  const wall = new Uint8Array(CELLS);
  if (level) for (const cell of wallCells(level)) wall[cell] = 1;
  const game: Game = {
    rng: makeRng(seed), body: [...START], dir: 0, queue: [], food: -1, kind: "muri", bonus: -1, bonusLife: 0, eaten: 0, golden: 0, score: 0, moves: 0, over: false, won: false,
    wall, goal: level ? levelOf(level).goal : 0, combo: 0, lastBite: -99,
  };
  placeFood(game);
  return game;
}

const taken = (game: Game, cell: number) => cell === game.food || cell === game.bonus || game.wall[cell] === 1 || game.body.includes(cell);

/** The seeded cell, or the next free one after it, so a friend's food lands in the same place unless their snake is lying there. */
function freeFrom(game: Game, start: number) {
  for (let offset = 0; offset < CELLS; offset++) {
    const cell = (start + offset) % CELLS;
    if (!taken(game, cell)) return cell;
  }
  return -1;
}

// Every food draws exactly two numbers and every golden chilli one, so the seed alone fixes what comes out of the ঠোঙা and in which order.
function placeFood(game: Game) {
  game.kind = BAG[pick(game.rng, BAG.length)];
  const start = pick(game.rng, CELLS);
  game.food = -1;
  game.food = freeFrom(game, start);
  if (game.food < 0) { game.over = true; game.won = true; }
}

function placeBonus(game: Game) {
  const start = pick(game.rng, CELLS);
  game.bonus = -1;
  game.bonus = freeFrom(game, start);
  game.bonusLife = game.bonus < 0 ? 0 : BONUS_LIFE;
}

/** The heading the snake will have once every waiting turn is done. */
export const heading = (game: Game): Dir => game.queue.length ? game.queue[game.queue.length - 1] : game.dir;

/** Queues an absolute turn (swipe, arrow key). Ignores a repeat, a U-turn against the last queued heading, or a full queue. */
export function turn(game: Game, dir: Dir) {
  const last = heading(game);
  if (game.over || dir === last || (dir + 2) % 4 === last || game.queue.length >= QUEUE) return false;
  game.queue.push(dir);
  return true;
}

/** A tap on the left (-1) or right (+1) half: turn to the snake's own left or right. */
export const turnSide = (game: Game, side: -1 | 1) => turn(game, ((heading(game) + side + 4) % 4) as Dir);

export function step(game: Game): StepEvent {
  if (game.over) return "none";
  const turned = game.queue.shift();
  if (turned !== undefined) game.dir = turned;
  const head = game.body[0];
  const x = head % COLS + DX[game.dir], y = Math.floor(head / COLS) + DY[game.dir];
  if (x < 0 || x >= COLS || y < 0 || y >= ROWS) { game.over = true; return "crash"; }
  const next = cellOf(x, y);
  if (game.wall[next]) { game.over = true; return "crash"; }
  const eats = next === game.food, golden = next === game.bonus, grows = eats || golden;
  // The tail slides out of its cell this move, unless the snake is growing.
  const hit = game.body.indexOf(next);
  if (hit >= 0 && (grows || hit !== game.body.length - 1)) { game.over = true; return "crash"; }
  game.body.unshift(next);
  if (!grows) game.body.pop();
  game.moves++;
  if (game.bonus >= 0 && !golden && --game.bonusLife <= 0) game.bonus = -1;
  if (golden) { game.bonus = -1; game.golden++; game.score += BONUS_POINTS; }
  if (grows) { game.combo = game.moves - game.lastBite <= COMBO_MOVES ? game.combo + 1 : 1; game.lastBite = game.moves; }
  if (eats) {
    game.eaten++;
    game.score += POINTS;
    if (game.goal && game.eaten >= game.goal) { game.over = true; game.won = true; game.food = -1; game.bonus = -1; return "win"; }
    placeFood(game);
    if (!game.over && game.eaten % BONUS_EVERY === 0) placeBonus(game);
  }
  if (game.won) return "win";
  return golden ? "bonus" : eats ? "eat" : "move";
}

/** Milliseconds per move: a gentle crawl at first, a little quicker every 5 foods. ধীরে খেলো starts slower and never passes 240ms. */
export function interval(eaten: number, slow: boolean) {
  const level = Math.floor(eaten / LEVEL_EVERY);
  return slow ? Math.max(240, 320 - level * 8) : Math.max(100, 220 - level * 12);
}

/** The classic game's speed step, shown as "গতি ৩": one up every 5 bites until the snake can't go faster (step 11). */
export const speedStep = (eaten: number) => Math.min(11, 1 + Math.floor(eaten / LEVEL_EVERY));

export const bands = [
  { min: 0, line: "ঠোঙা তো সবে খুলল!" },
  { min: 300, line: "ঝাল সামলে ভালোই খেয়েছ।" },
  { min: 901, line: "ঠোঙা প্রায় খালি!" },
] as const;
export const humanLine = (score: number) => bands.findLast(band => score >= band.min)!.line;

/** After a friend's challenge: kind either way. */
export function compareLine(score: number, target: number, name: string) {
  const who = name || "বন্ধু";
  if (score > target) return `${possessive(who)} চেয়ে ${bn(score - target)} বেশি!`;
  if (score === target) return `একদম সমান! ${who}ও ${bn(target)}।`;
  const gap = target - score;
  if (gap <= Math.max(50, Math.round(target * 0.15))) return `আর একটু হলেই! মাত্র ${bn(gap)} কম।`;
  return `${who} এখনো ${bn(gap)} এগিয়ে। আরেকবার?`;
}

/** The line under a level result: one picture for a clear, the bites left for a crash. */
export function levelLine(level: number, stars: number, eaten: number) {
  if (stars === 3) return "সবগুলো সোনালি মরিচ পেটে। ঝাল একদম ঠিকঠাক।";
  if (stars) return "ঠোঙা খালি। সোনালি মরিচ কিছু রয়ে গেল।";
  return `লেভেল ${bn(level)}: ${bn(levelOf(level).goal)}টার মধ্যে ${bn(eaten)}টা খাওয়া হলো।`;
}

/** What one more try would change, with the exact number; "" when there's nothing close to chase. */
export function nearMiss({ level, won, eaten, golden, score, best }: { level: number; won: boolean; eaten: number; golden: number; score: number; best: number | null }) {
  if (level) {
    const goal = levelOf(level).goal;
    if (!won) return `আর ${bn(goal - eaten)}টা খেলেই লেভেল ${bn(level)} পার।`;
    const offered = Math.floor((goal - 1) / BONUS_EVERY), half = Math.ceil(offered / 2);
    if (golden >= offered) return "";
    const next = golden >= half ? 3 : offered === half ? 3 : 2, need = (next === 3 ? offered : half) - golden;
    return `আর ${bn(need)}টা সোনালি মরিচ পেলেই ${bn(next)} তারা।`;
  }
  if (best === null || score >= best || best - score > Math.max(60, Math.round(best * 0.25))) return "";
  return `আর ${bn(best - score)} পয়েন্ট হলেই নতুন সেরা।`;
}

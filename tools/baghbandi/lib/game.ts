// বাঘবন্দি on a 5×5 lined board: our rules, the bot and the replay check.
// Pure and server-safe: share.ts replays a shared move list through this file to verify a friend's result.
//
// আমাদের নিয়ম. Sources disagree on the details, so we picked one set and keep to it everywhere:
// - Banglapedia, "Folk Games" (https://en.banglapedia.org/index.php/Folk_Games): two tigers (bagh) and twenty goats (bakri), the goats
//   set in four groups of five; a tiger jumps a goat into an empty point and takes it; the goats win by blocking the tigers.
// - Wikipedia, "Bagh bandi" (https://en.wikipedia.org/wiki/Bagh_bandi): the alquerque board (diagonals through every other point);
//   tigers on the 2nd and 4th points of the middle column; four piles of five goats on the 1st and 3rd points of the 2nd and 4th
//   columns; goats move first; a goat steps off the top of a pile or one point along a line, never onto another goat; a tiger leaps
//   one goat (only the top of a pile) in a straight line to the empty point beyond; captures are not compulsory; one capture a turn
//   ("another source" allows several); goats win by pinning both tigers, tigers by taking "enough" goats.
// - Asia News Network, "Roots and rules: The folk games of Bangladesh" (https://asianews.network/roots-and-rules-the-folk-games-of-bangladesh/):
//   two tigers against twenty goats, on a board scratched into any surface.
// - Datta (1935), Journal of the Asiatic Society of Bengal, as summarised on the Ludii portal: a Basirhat variant with 32 goats and
//   chained captures. We don't follow it.
// Where the sources are silent or split, we chose: no placement phase (the four piles are the opening); one jump a turn; the tigers win
// once they have taken TIGER_GOAL goats. (The goats can never be boxed in: the board stays connected with any two points removed, and
// there are always empty points, so some goat always touches one; the tests check this.) So no game runs forever, the tigers get MAX_MOVES moves
// in all (both sides together) to make their goal; if they can't, the goats have held out and win. No draws: in bot play a draw-at-cap
// rule ended most games in a draw, and a hunt against the clock gives the tiger a reason to hunt.
import { makeRng, starsFor, type LevelStars } from "../../../shared/game-core";

export const SIZE = 5;
export const POINTS = SIZE * SIZE;
export const GOATS = 20;
/** Taking this many goats wins for the tigers: with only 12 left the goats can rarely close a ring round two tigers. */
export const TIGER_GOAL = 8;
/** Moves by both sides together. Fits one link field (one character a move) and ends every game. */
export const MAX_MOVES = 120;

/** 0: ছাগল · 1: বাঘ. */
export type Side = 0 | 1;
export const GOAT: Side = 0, TIGER: Side = 1;
/** 0: two people on one phone · 1: you're the tiger, the bot herds the goats · 2: you're the goats, the bot plays the tigers. */
export type Mode = 0 | 1 | 2;
export const humanSide = (mode: Mode): Side | null => mode === 1 ? TIGER : mode === 2 ? GOAT : null;

const DIRECTIONS = [[0, -1], [1, -1], [1, 0], [1, 1], [0, 1], [-1, 1], [-1, 0], [-1, -1]] as const;
export const point = (col: number, row: number) => row * SIZE + col;
/** Points where col + row is even carry the diagonals, as on any alquerque board. */
export const hasDiagonals = (at: number) => (at % SIZE + Math.floor(at / SIZE)) % 2 === 0;
function walk(at: number, direction: number, distance: number) {
  const [dx, dy] = DIRECTIONS[direction];
  if (dx && dy && !hasDiagonals(at)) return -1;
  const col = at % SIZE + dx * distance, row = Math.floor(at / SIZE) + dy * distance;
  return col >= 0 && col < SIZE && row >= 0 && row < SIZE ? point(col, row) : -1;
}
/** STEP[at][direction]: the neighbour along a line, or -1. JUMP: the point two along, where a leap lands. */
export const STEP = Array.from({ length: POINTS }, (_, at) => DIRECTIONS.map((_, direction) => walk(at, direction, 1)));
const JUMP = Array.from({ length: POINTS }, (_, at) => DIRECTIONS.map((_, direction) => walk(at, direction, 2)));
/** Every line segment once, for drawing: [from, to]. */
export const LINES: Array<[number, number]> = STEP.flatMap((steps, at) => [2, 3, 4, 5].flatMap(direction => steps[direction] >= 0 ? [[at, steps[direction]] as [number, number]] : []));

export const START_PILES = [point(1, 0), point(3, 0), point(1, 2), point(3, 2)];
export const START_TIGERS = [point(2, 1), point(2, 3)];

/** A goat step, a tiger step, or a tiger leap (`over` is the goat it takes, else -1). */
export type Move = { from: number; to: number; over: number };

export type Game = {
  seed: number;
  mode: Mode;
  /** The bot's level, 1..BOT_LEVELS.length (LEGACY_LEVEL in a game against nobody). */
  level: number;
  /** Goats standing on each point: 0, 1, or more for a pile that hasn't been unstacked yet. */
  goats: number[];
  /** Where each tiger stands. Slot order never changes, so the board can animate the one that moved. */
  tigers: number[];
  /** The link: each move is its place in legalMoves() of the position it was played from. */
  moves: number[];
  log: Move[];
  turn: Side;
  taken: number;
  winner: Side | null;
  /** How it ended: the goats pinned both tigers, the tigers made their goal, or the goats held out to the last move. */
  ending: Ending | null;
  over: boolean;
};
export type Ending = "trap" | "hunt" | "hold";

/**
 * Bot levels, one ladder for each side you play. A level sets both bots: the goats you hunt as the tiger (`safe`, `noise`, `careful`)
 * and the tiger you box in as the goats (`miss`: how often it lets a jump go, `room`, `threat`, `tnoise`). Tuned in headless runs so
 * level 1 is nearly a sure win and each step is a little harder. Level 7 is the bot from before levels, so old links replay unchanged.
 */
type BotLevel = { careful: number; safe: number; noise: number; miss: number; room: number; threat: number; tnoise: number };
const BOT = { careful: 0.5, safe: 100, noise: 2, miss: 0, room: 1, threat: 0, tnoise: 6 };
export const BOT_LEVELS: readonly BotLevel[] = [
  { ...BOT, careful: 0, safe: 0, noise: 30, miss: 1, room: 0, tnoise: 10 },
  { ...BOT, careful: 0, safe: 2, noise: 20, miss: 0.85, room: 0, tnoise: 10 },
  { ...BOT, careful: 0, safe: 3, noise: 16, miss: 0.7, tnoise: 10 },
  { ...BOT, careful: 0, safe: 4, noise: 14, miss: 0.5 },
  { ...BOT, careful: 0, safe: 5, noise: 10, miss: 0.3 },
  { ...BOT, careful: 0, safe: 30, noise: 6, miss: 0.12 },
  BOT,
  { ...BOT, careful: 1, threat: 3 },
];
export const LEGACY_LEVEL = 7;
export const isLevel = (level: number) => Number.isInteger(level) && level >= 1 && level <= BOT_LEVELS.length;

export function createGame(seed: number, mode: Mode, level = LEGACY_LEVEL): Game {
  const goats = Array<number>(POINTS).fill(0);
  for (const at of START_PILES) goats[at] = GOATS / START_PILES.length;
  return { seed, mode, level: isLevel(level) ? level : LEGACY_LEVEL, goats, tigers: START_TIGERS.slice(), moves: [], log: [], turn: GOAT, taken: 0, winner: null, ending: null, over: false };
}

/** Every legal move for one side, in a fixed order (by point, then direction) so a move's index means the same on every phone. */
export function movesFor(goats: readonly number[], tigers: readonly number[], side: Side): Move[] {
  const list: Move[] = [];
  const empty = (at: number) => at >= 0 && goats[at] === 0 && tigers[0] !== at && tigers[1] !== at;
  for (let at = 0; at < POINTS; at++) {
    if (side === GOAT ? goats[at] === 0 : tigers[0] !== at && tigers[1] !== at) continue;
    for (let direction = 0; direction < 8; direction++) {
      const next = STEP[at][direction];
      if (next < 0) continue;
      if (empty(next)) list.push({ from: at, to: next, over: -1 });
      else if (side === TIGER && goats[next] > 0 && empty(JUMP[at][direction])) list.push({ from: at, to: JUMP[at][direction], over: next });
    }
  }
  return list;
}

export const legalMoves = (game: Game) => game.over ? [] : movesFor(game.goats, game.tigers, game.turn);

function apply(game: Game, move: Move, index: number): Game {
  const goats = game.goats.slice(), tigers = game.tigers.slice();
  let taken = game.taken;
  if (game.turn === GOAT) { goats[move.from]--; goats[move.to] = 1; }
  else {
    tigers[tigers.indexOf(move.from)] = move.to;
    if (move.over >= 0) { goats[move.over]--; taken++; }
  }
  const turn: Side = game.turn === GOAT ? TIGER : GOAT;
  const moves = [...game.moves, index];
  const ending: Ending | null = taken >= TIGER_GOAL ? "hunt"
    : turn === TIGER && !movesFor(goats, tigers, TIGER).length ? "trap"
    : moves.length >= MAX_MOVES ? "hold" : null;
  const winner = ending === null ? null : ending === "hunt" ? TIGER : GOAT;
  return { ...game, goats, tigers, taken, turn, moves, log: [...game.log, move], winner, ending, over: ending !== null };
}

/** Plays the move at `index` in legalMoves(game). Null for anything illegal, or once the game is over. */
export function play(game: Game, index: number): Game | null {
  if (!Number.isInteger(index)) return null;
  const move = legalMoves(game)[index];
  return move ? apply(game, move, index) : null;
}

/** For taps: the index of the move from one point to another, or -1. */
export const findMove = (game: Game, from: number, to: number) => legalMoves(game).findIndex(move => move.from === from && move.to === to);

/** Goats a tiger could take right now (each goat counted once), as if it were the tigers' turn. */
export function threatened(goats: readonly number[], tigers: readonly number[]) {
  return [...new Set(movesFor(goats, tigers, TIGER).flatMap(move => move.over >= 0 ? [move.over] : []))];
}

const moved = (tigers: readonly number[], move: Move) => tigers.map(at => at === move.from ? move.to : at);

/**
 * The bot's move, as an index into legalMoves(game). Deterministic: a position in a given game always gets the same reply, so a shared
 * move list can be re-checked. Simple on purpose; the game's level (BOT_LEVELS) sets how sharp it is. At level 7, the bot from before
 * levels: the tigers always take a goat when they can, else keep the most room to roam. The goats never leave a free jump while a safe
 * move exists, squeeze the tigers' room, and about half the time also look one tiger step ahead for a double threat.
 */
export function botMove(game: Game) {
  const list = legalMoves(game), bot = BOT_LEVELS[game.level - 1] ?? BOT;
  const rng = makeRng((game.seed ^ Math.imul(game.moves.length + 1, 0x9e3779b1)) >>> 0);
  const careful = rng() < bot.careful;
  const previous = game.log[game.log.length - 2];
  let best = 0, bestScore = -Infinity;
  list.forEach((move, index) => {
    const after = apply(game, move, index);
    let score: number;
    if (after.winner === game.turn) score = 1e6;
    else if (game.turn === TIGER) {
      // A missed jump draws from the rng only on levels that miss, so level 7 makes the very same moves as before levels.
      score = (move.over >= 0 && !(bot.miss && rng() < bot.miss) ? 1000 : 0) + bot.room * movesFor(after.goats, after.tigers, TIGER).length + rng() * bot.tnoise;
      if (bot.threat) score += bot.threat * threatened(after.goats, after.tigers).length;
    } else {
      const replies = movesFor(after.goats, after.tigers, TIGER);
      score = -bot.safe * threatened(after.goats, after.tigers).length - 3 * replies.length + rng() * bot.noise;
      if (careful && replies.some(reply => reply.over < 0 && threatened(after.goats, moved(after.tigers, reply)).length >= 2)) score -= 40;
      if (game.goats[move.from] > 1) score += 2;
      if (previous && previous.from === move.to && previous.to === move.from) score -= 5;
    }
    if (score > bestScore) { best = index; bestScore = score; }
  });
  return best;
}

const botTurn = (game: Game) => game.mode !== 0 && game.turn !== humanSide(game.mode);
export const isBotTurn = (game: Game) => !game.over && botTurn(game);

/** Rebuilds a game from its move list, checking every move is legal and every bot move is the bot's own reply. Null if anything is off. */
export function replay(seed: number, mode: Mode, moves: readonly number[], level = LEGACY_LEVEL): Game | null {
  let game: Game | null = createGame(seed, mode, level);
  for (const index of moves) {
    if (!game || game.over) return null;
    if (botTurn(game) && index !== botMove(game)) return null;
    game = play(game, index);
  }
  return game;
}

/** Against the bot there's something to take back once the person has moved: the goats move first, so a tiger has moved after two. */
export const canUndo = (game: Game) => !game.over && game.moves.length > (game.mode === 1 ? 1 : 0);

/** Takes back the last move; against the bot, the person's last move and the bot's reply to it. */
export function undo(game: Game): Game {
  let count = game.moves.length;
  if (game.mode !== 0) {
    const mine = humanSide(game.mode) === GOAT ? 0 : 1;
    // Move i was played by the goats when i is even.
    while (count && (count - 1) % 2 !== mine) count--;
  }
  if (count) count--;
  return replay(game.seed, game.mode, game.moves.slice(0, count), game.level) ?? game;
}

/** Your stars for a game against the bot (0 unless you won): the tiger by how few moves it took, the goats for a trap or for goats kept. */
export const TIGER_STARS = [40, 70] as const, GOAT_STARS_KEPT = 3;
export function winStars(game: Game) {
  if (!game.over || game.mode === 0 || game.winner !== humanSide(game.mode)) return 0;
  if (game.winner === TIGER) return starsFor(game.moves.length, TIGER_STARS[0], TIGER_STARS[1], true);
  return game.ending === "trap" ? 3 : game.taken <= GOAT_STARS_KEPT ? 2 : 1;
}

/** Where to start: the furthest open level you haven't three-starred (level 1 for someone new). */
export function openingLevel(stars: LevelStars, unlocked: number) {
  let level = unlocked;
  while (level > 1 && stars[level] === 3) level--;
  return stars[level] === 3 ? unlocked : level;
}

/** The levels key for a side (`ektukhani-levels-…`), and the best-score key this phone kept per side before levels. */
export const ladderSlug = (side: Side) => side === TIGER ? "baghbandi-bagh" : "baghbandi-chhagol";

/**
 * Before levels, this phone kept only a best score per side (goats taken as the tiger, goats kept as the goats). A best that only a win
 * over the old bot can give becomes one star on level 7, once: returns the levels JSON to save, or null when there's nothing to move.
 */
export function migrateBest(side: Side, best: string | null, levels: string | null) {
  if (levels !== null || best === null || !Number.isFinite(Number(best))) return null;
  const score = Number(best);
  const won = side === TIGER ? score >= TIGER_GOAL : score > GOATS - TIGER_GOAL;
  return won ? JSON.stringify({ [LEGACY_LEVEL]: 1 }) : null;
}

/** Board units: points at 50, 150, …, 450 on a 500 × 500 yard. */
export const UNIT = 100;
export const MARGIN = 50;
export const BOARD = 2 * MARGIN + (SIZE - 1) * UNIT;
export const spot = (at: number): [number, number] => [MARGIN + UNIT * (at % SIZE), MARGIN + UNIT * Math.floor(at / SIZE)];

/** The point under a touch, in board units: anywhere in its square counts, so every point is a full-cell target. */
export function pointAt(x: number, y: number) {
  const col = Math.floor(x / UNIT), row = Math.floor(y / UNIT);
  return col >= 0 && col < SIZE && row >= 0 && row < SIZE ? point(col, row) : -1;
}

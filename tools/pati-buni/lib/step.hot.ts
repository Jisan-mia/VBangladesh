// The frame's rules, 60 times a second: deal, fall, slide, turn, lock, weave, rise, roll. Allocation-free (npm run lint:games
// checks it): it only mutates the Game made by game.ts. খোলা পাটি takes exactly the original game's paths (the same deal,
// fall curve, lock wait, kicks and points), so old links replay the same strips.
import { pick } from "../../../shared/game-core";
import { CLEAR, EVENT_RING, LOCK, OVER, RISE, ROLL, SPAWN, STUCK, SUI_IN, WIN } from "./events";
import { ROLL_ROWS } from "./levels";
import { MAT_ROWS, ROW_POINTS } from "./link";
import { ACROSS, BOX, CELLS, COLOUR, COLS, GOLD, OLD, ROWS, SIZE, SUI, TURNS, WET, colourOf } from "./pieces";
import type { Game } from "./game";

/** Tried in order when a turn bumps a wall or the stack: in place, a step either side, one up, then two either side. */
const KICKS = Int8Array.of(0, 0, -1, 0, 1, 0, 0, -1, -2, 0, 2, 0);
/** A strip resting on the stack may still slide or turn; each move restarts the lock wait, up to this many times. */
const MAX_RESETS = 12;
export const LEVEL_EVERY = 10;
export const SOFT_MS = 40;
export const lockMs = (slow: boolean) => slow ? 800 : 480;
/** The weave: the original 420 ms in খোলা পাটি; the পাটি give the bloom a little longer. */
export const clearMs = (game: Game) => game.row.goal ? (game.slow ? 820 : 600) : game.slow ? 640 : 420;

function emit(game: Game, type: number, a: number, b: number, c: number) {
  const at = (game.eventCount++ % EVENT_RING) * 4, events = game.events;
  events[at] = type; events[at + 1] = a; events[at + 2] = b; events[at + 3] = c;
}

/** Milliseconds per row. খোলা পাটি: the original 700, about 13% quicker every ten rows, never under 70 (ধীরে খেলো: 1000,
 *  never under 520). A পাটি eases from its start speed to its end speed as the goal fills; ধীরে খেলো is 1.6× slower. */
export function dropMs(game: Game) {
  const row = game.row;
  if (!row.goal) {
    const steps = Math.floor(game.rows / LEVEL_EVERY);
    return game.slow ? Math.max(520, Math.round(1000 * 0.92 ** steps)) : Math.max(70, Math.round(700 * 0.87 ** steps));
  }
  const t = Math.min(1, game.rows / row.goal), ms = row.fall[0] + (row.fall[1] - row.fall[0]) * t;
  return Math.round(game.slow ? Math.max(520, ms * 1.6) : ms);
}

/** The deepest empty cell in a column (−1 when it is full): where a সুই comes to rest. */
export function deepest(board: Uint8Array, x: number) {
  for (let y = ROWS - 1; y >= 0; y--) if (!board[y * COLS + x]) return y;
  return -1;
}

/** Whether strip `kind` at turn and (x, y) fits the frame. A সুই passes through the weave down to its column's deepest hole. */
export function fits(board: Uint8Array, kind: number, turn: number, x: number, y: number) {
  if (kind === SUI) return x >= 0 && x < COLS && y >= 0 && deepest(board, x) >= y;
  const cells = TURNS[kind][turn];
  for (let i = 0; i < cells.length; i += 2) {
    const cx = x + cells[i], cy = y + cells[i + 1];
    if (cx < 0 || cx >= COLS || cy < 0 || cy >= ROWS || board[cy * COLS + cx]) return false;
  }
  return true;
}

const active = (game: Game) => game.live && !game.over && !game.clearCount;
const grounded = (game: Game) => game.kind === SUI ? game.y >= deepest(game.board, game.x) : !fits(game.board, game.kind, game.turn, game.x, game.y + 1);

function settle(game: Game) {
  if (grounded(game) && game.resets < MAX_RESETS) { game.lock = 0; game.resets++; }
}

/** The next strip: the fixed opening first, then the shuffled bundle; every `sui` strips a সুই; wet or gold by chance. */
function deal(game: Game) {
  const row = game.row;
  game.nextWet = false; game.nextGold = false;
  if (row.sui && game.openAt >= game.opening.length && --game.suiIn <= 0) { game.suiIn = row.sui; game.next = SUI; return; }
  if (game.openAt < game.opening.length) game.next = game.opening[game.openAt++];
  else {
    if (game.deckAt >= game.deckLen) {
      const deck = game.deck;
      deck.set(game.bundle);
      for (let i = game.deckLen - 1; i > 0; i--) { const j = pick(game.rng, i + 1), swap = deck[i]; deck[i] = deck[j]; deck[j] = swap; }
      game.deckAt = 0;
    }
    game.next = game.deck[game.deckAt++];
  }
  if (row.wet) game.nextWet = game.rng() < row.wet;
  if (row.gold) game.nextGold = !game.nextWet && game.rng() < row.gold;
}
/** The waiting strip enters at the top centre with its whole box inside the frame, and the one after it is dealt. */
function enter(game: Game) {
  game.kind = game.next; game.wet = game.nextWet; game.gold = game.nextGold;
  game.turn = 0; game.x = Math.floor((COLS - BOX[game.kind]) / 2); game.y = 0;
  game.fall = 0; game.lock = 0; game.resets = 0;
  deal(game);
}

/** Rolls the bottom four rows away (they score nothing): a গোটানো. */
function roll(game: Game) {
  game.board.copyWithin(ROLL_ROWS * COLS, 0, CELLS - ROLL_ROWS * COLS);
  game.board.fill(0, 0, ROLL_ROWS * COLS);
  game.rolls--; game.rollsUsed++;
  emit(game, ROLL, game.rolls, 0, 0);
}

/** The frame is full: roll up if a গোটানো is left, else the run ends. */
function full(game: Game) {
  if (game.rolls > 0) { roll(game); return true; }
  game.live = false; game.over = 2;
  emit(game, OVER, 0, 0, 0);
  return false;
}

/** Pushes the whole weave up a row and slides a torn old row in underneath, with one hole. False if it topped out. */
function rise(game: Game) {
  const board = game.board;
  let spill = false;
  for (let x = 0; x < COLS; x++) if (board[x]) spill = true;
  board.copyWithin(0, COLS, CELLS);
  const y = ROWS - 1, hole = pick(game.rng, COLS);
  for (let x = 0; x < COLS; x++) board[y * COLS + x] = x === hole ? 0 : (((x + game.rises) % 3 === 0 ? 4 : 1) | OLD | ((x + y) % 2 ? 0 : ACROSS));
  game.rises++;
  emit(game, RISE, hole, 0, 0);
  return !spill;
}

/** After a lock or a weave: a rising row if one is due, then the next strip, rolling up while the frame is too full for it. */
function spawn(game: Game) {
  if (game.row.rise && game.riseIn <= 0) {
    game.riseIn = game.row.rise;
    if (!rise(game) && !full(game)) return;
  }
  enter(game);
  while (!fits(game.board, game.kind, 0, game.x, game.y)) if (!full(game)) return;
  game.live = true;
  emit(game, SPAWN, game.kind, 0, 0);
}

/** Deals the first strip of a new run (the frame is never full at the start). */
export function begin(game: Game) {
  deal(game);
  enter(game);
  game.live = fits(game.board, game.kind, 0, game.x, game.y);
}

export function move(game: Game, dx: number) {
  if (!active(game) || !fits(game.board, game.kind, game.turn, game.x + dx, game.y)) return false;
  game.x += dx;
  settle(game);
  return true;
}

/** A clockwise quarter turn, nudged off a wall or the stack when it would overlap. A wet strip never turns. */
export function rotate(game: Game) {
  if (!active(game)) return false;
  if (game.wet) { emit(game, STUCK, 0, 0, 0); return false; }
  if (game.kind === SUI) return false;
  const turn = (game.turn + 1) % 4;
  for (let k = 0; k < KICKS.length; k += 2) {
    if (!fits(game.board, game.kind, turn, game.x + KICKS[k], game.y + KICKS[k + 1])) continue;
    game.turn = turn; game.x += KICKS[k]; game.y += KICKS[k + 1];
    settle(game);
    return true;
  }
  return false;
}

/** One woven row's colours: 2 bits per column, column 0 lowest (gold counts as হলুদ). */
export function rowPattern(board: Uint8Array, y: number) {
  let pattern = 0;
  for (let x = 0; x < COLS; x++) {
    const colour = colourOf(board[y * COLS + x]);
    pattern |= ((colour === GOLD ? 2 : colour) - 1) << (x * 2);
  }
  return pattern;
}

function lockPiece(game: Game, hard: boolean) {
  const board = game.board, kind = game.kind;
  if (kind === SUI) {
    board[game.y * COLS + game.x] = 1 | ACROSS;
    game.suis++;
    emit(game, SUI_IN, game.x, game.y, 0);
  } else {
    const cells = TURNS[kind][game.turn], colour = game.gold ? GOLD : COLOUR[kind], flags = game.wet ? WET : 0;
    for (let i = 0; i < SIZE[kind]; i++) {
      const cx = game.x + cells[i * 2], cy = game.y + cells[i * 2 + 1];
      board[cy * COLS + cx] = colour | flags | ((((cells[i * 2] + cells[i * 2 + 1]) & 1) === 0) ? ACROSS : 0);
    }
  }
  game.live = false;
  game.strips++;
  if (game.row.rise) game.riseIn--;
  emit(game, LOCK, kind, hard ? 1 : 0, 0);
  game.clearCount = 0; game.clearGold = false;
  for (let y = ROWS - 1; y >= 0 && game.clearCount < 4; y--) {
    let filled = true, gold = false;
    for (let x = 0; x < COLS && filled; x++) { const cell = board[y * COLS + x]; filled = cell !== 0; if (colourOf(cell) === GOLD) gold = true; }
    if (!filled) continue;
    game.clearing[game.clearCount++] = y;
    if (gold) { game.clearGold = true; game.goldRows++; }
  }
  if (!game.clearCount) { game.streak = 0; spawn(game); return; }
  // The lowest row was woven first.
  for (let i = 0; i < game.clearCount; i++) game.woven[game.wovenCount++ % MAT_ROWS] = rowPattern(board, game.clearing[i]);
  game.rows += game.clearCount;
  game.score += ROW_POINTS[game.clearCount] * (game.clearGold ? 2 : 1);
  if (game.clearCount > game.bestClear) game.bestClear = game.clearCount;
  game.streak++;
  if (game.streak > game.bestStreak) game.bestStreak = game.streak;
  game.clearLeft = clearMs(game);
  emit(game, CLEAR, game.clearCount, game.clearGold ? 1 : 0, game.clearing[0]);
}

function isClearing(game: Game, y: number) {
  for (let i = 0; i < game.clearCount; i++) if (game.clearing[i] === y) return true;
  return false;
}

/** Woven rows roll away and everything above slides down. */
function collapse(game: Game) {
  const board = game.board;
  let write = ROWS - 1;
  for (let read = ROWS - 1; read >= 0; read--) {
    if (isClearing(game, read)) continue;
    if (write !== read) board.copyWithin(write * COLS, read * COLS, read * COLS + COLS);
    write--;
  }
  board.fill(0, 0, (write + 1) * COLS);
  game.clearCount = 0;
}

/** Where the strip would land straight down (its y), for the glow on the warp threads. */
export function landing(game: Game) {
  if (game.kind === SUI) return deepest(game.board, game.x);
  let y = game.y;
  while (fits(game.board, game.kind, game.turn, game.x, y + 1)) y++;
  return y;
}

/** Drops the strip straight down and locks it. */
export function hardDrop(game: Game) {
  if (!active(game)) return false;
  game.y = landing(game);
  lockPiece(game, true);
  return true;
}

/** Advances the frame by `ms`: the weave, then gravity (faster while `soft` is held), then the lock wait once the strip rests. */
export function tick(game: Game, ms: number, soft: boolean) {
  if (game.over) return;
  game.t += ms;
  if (game.clearCount) {
    game.clearLeft -= ms;
    if (game.clearLeft > 0) return;
    collapse(game);
    if (game.row.goal && game.rows >= game.row.goal) { game.over = 1; emit(game, WIN, 0, 0, 0); return; }
    spawn(game);
    return;
  }
  if (!game.live) return;
  if (!grounded(game)) {
    const every = soft ? Math.min(SOFT_MS, dropMs(game)) : dropMs(game);
    game.fall += ms;
    while (game.fall >= every && !grounded(game)) { game.y++; game.fall -= every; game.lock = 0; }
    if (grounded(game)) game.fall = 0;
    return;
  }
  game.lock += ms;
  if (game.lock >= lockMs(game.slow)) lockPiece(game, false);
}

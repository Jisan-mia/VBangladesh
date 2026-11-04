// Dots and boxes on a 5×5 grid of needle holes (4×4 boxes): the rules, the bot, hit-testing and the replay check.
// Pure and server-safe: share.ts replays a shared move list through this file to verify a friend's result.
import { makeRng, pick } from "../../../shared/game-core";

export const SIZE = 4;
export const BOX_COUNT = SIZE * SIZE;
export const EDGE_COUNT = 2 * SIZE * (SIZE + 1);
/** Edges are numbered in reading order: a row of 4 horizontal gaps, then the 5 vertical gaps under it. So ±1 walks the board and ±9 moves a row. */
export const ROW_SPAN = 2 * SIZE + 1;

/** 0: two people on one phone · 1: সহজ বট · 2: কঠিন বট. The bot always plays second. */
export type Level = 0 | 1 | 2;
export type Player = 0 | 1;
export type Edge = { horizontal: boolean; row: number; col: number; boxes: number[] };

export const EDGES: Edge[] = [];
for (let row = 0; row <= SIZE; row++) {
  for (let col = 0; col < SIZE; col++) EDGES.push({ horizontal: true, row, col, boxes: [row > 0 ? (row - 1) * SIZE + col : -1, row < SIZE ? row * SIZE + col : -1].filter(box => box >= 0) });
  if (row < SIZE) for (let col = 0; col <= SIZE; col++) EDGES.push({ horizontal: false, row, col, boxes: [col > 0 ? row * SIZE + col - 1 : -1, col < SIZE ? row * SIZE + col : -1].filter(box => box >= 0) });
}
export const BOX_EDGES: number[][] = Array.from({ length: BOX_COUNT }, (_, box) => EDGES.flatMap((edge, id) => edge.boxes.includes(box) ? [id] : []));

export type Game = {
  seed: number;
  level: Level;
  /** The two stitches already on the cloth when the game opens; the seed picks them. */
  opening: number[];
  /** Every stitch after the opening, in order, and who made it. */
  moves: number[];
  by: Player[];
  drawn: boolean[];
  /** Who closed each box, or -1. */
  owner: number[];
  turn: Player;
  score: [number, number];
  /** Boxes the last stitch closed (0, 1 or 2). */
  lastClosed: number;
  over: boolean;
};

/** A fresh cloth: two seeded stitches that don't touch the same box, so nothing is half-done, and the first player to move. */
export function createGame(seed: number, level: Level): Game {
  const rng = makeRng(seed);
  const first = pick(rng, EDGE_COUNT);
  let second = pick(rng, EDGE_COUNT);
  while (second === first || EDGES[second].boxes.some(box => EDGES[first].boxes.includes(box))) second = pick(rng, EDGE_COUNT);
  const drawn = Array<boolean>(EDGE_COUNT).fill(false);
  drawn[first] = drawn[second] = true;
  return { seed, level, opening: [first, second], moves: [], by: [], drawn, owner: Array<number>(BOX_COUNT).fill(-1), turn: 0, score: [0, 0], lastClosed: 0, over: false };
}

const sides = (drawn: readonly boolean[], box: number) => BOX_EDGES[box].reduce((count, edge) => count + (drawn[edge] ? 1 : 0), 0);
/** How many boxes this stitch would close. */
export const closes = (drawn: readonly boolean[], edge: number) => EDGES[edge].boxes.filter(box => sides(drawn, box) === 3).length;
/** A stitch that gives no box its third side, so the other player can't take anything from it. */
export const isSafe = (drawn: readonly boolean[], edge: number) => EDGES[edge].boxes.every(box => sides(drawn, box) < 2);

/** Stitches one gap. Closing a box scores it and keeps the turn. Returns null for anything illegal. */
export function play(game: Game, edge: number): Game | null {
  if (game.over || !Number.isInteger(edge) || edge < 0 || edge >= EDGE_COUNT || game.drawn[edge]) return null;
  const drawn = game.drawn.slice();
  drawn[edge] = true;
  const owner = game.owner.slice();
  let closed = 0;
  for (const box of EDGES[edge].boxes) if (sides(drawn, box) === 4) { owner[box] = game.turn; closed++; }
  const score: [number, number] = [game.score[0], game.score[1]];
  score[game.turn] += closed;
  const over = score[0] + score[1] === BOX_COUNT;
  return { ...game, moves: [...game.moves, edge], by: [...game.by, game.turn], drawn, owner, score, lastClosed: closed, over, turn: closed || over ? game.turn : game.turn === 0 ? 1 : 0 };
}

const open = (drawn: readonly boolean[]) => drawn.flatMap((done, edge) => done ? [] : [edge]);

/** Boxes the next player can take in a row after this position, taking every box with three sides. */
function giveaway(drawn: readonly boolean[]) {
  const board = drawn.slice();
  let taken = 0;
  for (let found = true; found;) {
    found = false;
    for (let edge = 0; edge < EDGE_COUNT; edge++) {
      if (board[edge]) continue;
      const count = closes(board, edge);
      if (count) { taken += count; board[edge] = true; found = true; }
    }
  }
  return taken;
}

/** Open boxes joined through unstitched shared sides: the chains and loops of the endgame. */
function regions(drawn: readonly boolean[], taken: readonly boolean[]) {
  const seen = taken.slice(), groups: number[] = [];
  for (let start = 0; start < BOX_COUNT; start++) {
    if (seen[start]) continue;
    seen[start] = true;
    let size = 0;
    for (const queue = [start]; queue.length;) {
      const box = queue.pop()!;
      size++;
      for (const edge of BOX_EDGES[box]) {
        if (drawn[edge]) continue;
        for (const next of EDGES[edge].boxes) if (!seen[next]) { seen[next] = true; queue.push(next); }
      }
    }
    groups.push(size);
  }
  return groups;
}

/**
 * কঠিন only, in the endgame (no safe stitch left): when the chain being taken is down to its last two boxes and a long chain is still to come,
 * stitch the far end instead and hand those two over. The other player takes them and must then open the long chain.
 */
function doubleDeal(drawn: readonly boolean[], owner: readonly number[]) {
  const ready = owner.flatMap((who, box) => who < 0 && sides(drawn, box) === 3 ? [box] : []);
  if (ready.length !== 1) return -1;
  const first = ready[0];
  const middle = BOX_EDGES[first].find(edge => !drawn[edge])!;
  const second = EDGES[middle].boxes.find(box => box !== first);
  if (second === undefined || sides(drawn, second) !== 2) return -1;
  const far = BOX_EDGES[second].find(edge => !drawn[edge] && edge !== middle)!;
  const beyond = EDGES[far].boxes.find(box => box !== second);
  if (beyond !== undefined && sides(drawn, beyond) >= 2) return -1;
  const taken = owner.map((who, box) => who >= 0 || box === first || box === second);
  return regions(drawn, taken).some(size => size >= 3) ? far : -1;
}

/**
 * The bot's stitch. Deterministic: the same position in the same game always gets the same reply, so a shared move list can be re-checked.
 * সহজ takes a box when it can, else a random safe stitch, else any stitch. কঠিন also opens the smallest chain when it must, hands over
 * a two-box chain the hard way, and gives up two boxes to keep control when a long chain is still to come.
 */
export function botMove(game: Game, level: 1 | 2) {
  const rng = makeRng((game.seed ^ Math.imul(game.moves.length + 1, 0x9e3779b1)) >>> 0);
  const free = open(game.drawn);
  const takes = free.filter(edge => closes(game.drawn, edge) > 0);
  const safe = free.filter(edge => isSafe(game.drawn, edge));
  if (level === 2 && takes.length && !safe.length) {
    const deal = doubleDeal(game.drawn, game.owner);
    if (deal >= 0) return deal;
  }
  if (takes.length) return takes.find(edge => closes(game.drawn, edge) === 2) ?? takes[pick(rng, takes.length)];
  if (safe.length) return safe[pick(rng, safe.length)];
  if (level === 1) return free[pick(rng, free.length)];
  let best = -1, bestGift = Infinity, bestSplit = -1;
  for (const edge of free) {
    const after = game.drawn.slice();
    after[edge] = true;
    // Fewest boxes handed over; on a tie, the stitch that gives two separate three-sided boxes, so they can't be handed back.
    const gift = giveaway(after), split = EDGES[edge].boxes.filter(box => sides(after, box) === 3).length;
    if (gift < bestGift || (gift === bestGift && split > bestSplit)) { best = edge; bestGift = gift; bestSplit = split; }
  }
  return best;
}

/** Rebuilds a game from its move list, checking every stitch is legal and every bot stitch is the bot's own reply. Null if anything is off. */
export function replay(seed: number, level: Level, moves: readonly number[]): Game | null {
  let game: Game | null = createGame(seed, level);
  for (const edge of moves) {
    if (!game || game.over) return null;
    if (level && game.turn === 1 && edge !== botMove(game, level)) return null;
    game = play(game, edge);
  }
  return game;
}

export const canUndo = (game: Game) => !game.over && game.by.some(who => game.level === 0 || who === 0);

/** Takes back the last stitch; against the bot, also the bot's replies to it. */
export function undo(game: Game): Game {
  let count = game.moves.length;
  if (game.level) while (count && game.by[count - 1] === 1) count--;
  if (count) count--;
  return replay(game.seed, game.level, game.moves.slice(0, count)) ?? game;
}

/** Stitches the bot made since the person's last one (or the last stitch, for two people): highlighted so nobody misses a move. */
export function recent(game: Game) {
  if (!game.level) return game.moves.slice(-1);
  let from = game.moves.length;
  while (from && game.by[from - 1] === 1) from--;
  return game.moves.slice(from);
}

/** Board units: holes at 50, 150, …, 450 on a 500 × 500 cloth. */
export const UNIT = 100;
export const MARGIN = 50;
export const BOARD = 2 * MARGIN + SIZE * UNIT;

export function midpoint(edge: number): [number, number] {
  const { horizontal, row, col } = EDGES[edge];
  return horizontal ? [MARGIN + UNIT * (col + 0.5), MARGIN + UNIT * row] : [MARGIN + UNIT * col, MARGIN + UNIT * (row + 0.5)];
}

/** The open gap nearest a touch, in board units. Within `reach` of its middle, so a tap on a finished stitch doesn't jump to a neighbour. */
export function nearestGap(x: number, y: number, drawn: readonly boolean[], reach = 62) {
  let best = -1, bestDistance = reach;
  for (let edge = 0; edge < EDGE_COUNT; edge++) {
    if (drawn[edge]) continue;
    const [mx, my] = midpoint(edge), distance = Math.hypot(x - mx, y - my);
    if (distance < bestDistance) { best = edge; bestDistance = distance; }
  }
  return best;
}

/** The safe gap nearest the middle: where the first-screen hint pulses. */
export function hintGap(game: Game) {
  let best = -1, bestDistance = Infinity;
  for (const edge of open(game.drawn)) {
    if (!isSafe(game.drawn, edge)) continue;
    const [mx, my] = midpoint(edge), distance = Math.hypot(mx - BOARD / 2, my - BOARD / 2 - UNIT / 2);
    if (distance < bestDistance) { best = edge; bestDistance = distance; }
  }
  return best;
}

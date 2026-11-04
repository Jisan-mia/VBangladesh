// Dots and boxes on a quilt of any size: the cloth's geometry, the rules, the bots, the replay check and the end-of-game numbers.
// Pure and server-safe (share.ts replays a shared move list through it). No DOM, no Math.random, no clock: makeRng only.
//
// The old 4×4 game (`legacySetup`, bots "legacy" 1 and 2) is the same game, stitch for stitch, as before the rewrite, so old
// challenge links replay unchanged (tests/legacy.ts keeps the old file and the tests compare them over hundreds of games).
import { makeRng, pick } from "../../../shared/game-core";

export type Player = 0 | 1;

/** Board units: needle holes 100 apart, 50 from the cloth's edge. */
export const UNIT = 100;
export const MARGIN = 50;

export type Geometry = {
  cols: number;
  rows: number;
  boxes: number;
  edges: number;
  /** Edges are numbered in reading order: a row of `cols` horizontal gaps, then the `cols + 1` vertical gaps under it. ±span moves a row. */
  span: number;
  width: number;
  height: number;
  horizontal: Uint8Array;
  row: Uint8Array;
  col: Uint8Array;
  /** Two entries per edge: the boxes it borders, -1 for none. */
  edgeBox: Int16Array;
  /** Four entries per box, in edge order as the old game listed them: top, left, right, bottom. */
  boxEdge: Int16Array;
  midX: Float32Array;
  midY: Float32Array;
};

const geometries = new Map<string, Geometry>();
export function geometry(cols: number, rows: number): Geometry {
  const key = `${cols}x${rows}`;
  const known = geometries.get(key);
  if (known) return known;
  const span = 2 * cols + 1, edges = rows * span + cols, boxes = cols * rows;
  const g: Geometry = {
    cols, rows, boxes, edges, span, width: 2 * MARGIN + cols * UNIT, height: 2 * MARGIN + rows * UNIT,
    horizontal: new Uint8Array(edges), row: new Uint8Array(edges), col: new Uint8Array(edges),
    edgeBox: new Int16Array(2 * edges).fill(-1), boxEdge: new Int16Array(4 * boxes), midX: new Float32Array(edges), midY: new Float32Array(edges),
  };
  for (let row = 0, id = 0; row <= rows; row++) {
    for (let col = 0; col < cols; col++, id++) {
      g.horizontal[id] = 1; g.row[id] = row; g.col[id] = col;
      g.edgeBox[2 * id] = row > 0 ? (row - 1) * cols + col : -1;
      g.edgeBox[2 * id + 1] = row < rows ? row * cols + col : -1;
      g.midX[id] = MARGIN + UNIT * (col + 0.5); g.midY[id] = MARGIN + UNIT * row;
    }
    if (row === rows) break;
    for (let col = 0; col <= cols; col++, id++) {
      g.row[id] = row; g.col[id] = col;
      g.edgeBox[2 * id] = col > 0 ? row * cols + col - 1 : -1;
      g.edgeBox[2 * id + 1] = col < cols ? row * cols + col : -1;
      g.midX[id] = MARGIN + UNIT * col; g.midY[id] = MARGIN + UNIT * (row + 0.5);
    }
  }
  for (let box = 0; box < boxes; box++) {
    const row = Math.floor(box / cols), col = box % cols;
    g.boxEdge[4 * box] = row * span + col;
    g.boxEdge[4 * box + 1] = row * span + cols + col;
    g.boxEdge[4 * box + 2] = row * span + cols + col + 1;
    g.boxEdge[4 * box + 3] = (row + 1) * span + col;
  }
  geometries.set(key, g);
  return g;
}

/** The boxes an edge borders (one on the rim, two inside). */
export function boxesOf(g: Geometry, edge: number) {
  const a = g.edgeBox[2 * edge], b = g.edgeBox[2 * edge + 1];
  return a < 0 ? [b] : b < 0 ? [a] : [a, b];
}
export const edgesOf = (g: Geometry, box: number) => [g.boxEdge[4 * box], g.boxEdge[4 * box + 1], g.boxEdge[4 * box + 2], g.boxEdge[4 * box + 3]];

/**
 * Who sews the other side. "legacy" 1 and 2 are the old সহজ and কঠিন bots, unchanged. A "tuned" bot rolls its seeded dice
 * on each choice: `take` a box it could close, `safe` a stitch that gives nothing away when there is one, `smallest` the
 * stitch that gives away least when there isn't, `deal` hand back the last two boxes of a chain to keep control, and
 * `gold` takes a জরির ঘর before a plain one.
 */
export type Bot =
  | { kind: "legacy"; level: 1 | 2 }
  | { kind: "tuned"; take: number; safe: number; smallest: number; deal: number; gold: boolean };

export type Setup = {
  cols: number;
  rows: number;
  /** জরির ঘর: boxes worth two flowers. */
  gold?: readonly number[];
  /** Stitches on the cloth at the start: a fixed list, or how many the seed places (no two on the same box). */
  opening: readonly number[] | number;
  /** A lesson's boxes already closed at the start, and by whom. */
  owned?: readonly (readonly [number, Player])[];
  /** Who sews first: 0 is you (or the first of two people), 1 the bot. */
  first?: Player;
  bot: Bot | null;
};

export type Game = {
  seed: number;
  setup: Setup;
  geo: Geometry;
  /** The stitches already on the cloth when the game opens. */
  opening: number[];
  /** Every stitch after the opening, in order, and who made it. */
  moves: number[];
  by: Player[];
  drawn: boolean[];
  /** Who closed each box, or -1. */
  owner: number[];
  /** Flowers: one per box, two per জরির ঘর. */
  score: [number, number];
  turn: Player;
  /** Boxes the last stitch closed (0, 1 or 2). */
  lastClosed: number;
  over: boolean;
};

/** The old game: a 4×4 cloth, two seeded stitches, you first. 0 two people, 1 সহজ, 2 কঠিন. */
export const legacySetup = (level: 0 | 1 | 2): Setup => LEGACY[level];
const LEGACY: readonly Setup[] = [
  { cols: 4, rows: 4, opening: 2, bot: null },
  { cols: 4, rows: 4, opening: 2, bot: { kind: "legacy", level: 1 } },
  { cols: 4, rows: 4, opening: 2, bot: { kind: "legacy", level: 2 } },
];

export const worth = (setup: Setup, box: number) => setup.gold?.includes(box) ? 2 : 1;
export const totalPoints = (setup: Setup) => setup.cols * setup.rows + (setup.gold?.length ?? 0);

const sides = (g: Geometry, drawn: readonly boolean[], box: number) => {
  const at = 4 * box;
  return (drawn[g.boxEdge[at]] ? 1 : 0) + (drawn[g.boxEdge[at + 1]] ? 1 : 0) + (drawn[g.boxEdge[at + 2]] ? 1 : 0) + (drawn[g.boxEdge[at + 3]] ? 1 : 0);
};
export const sidesOf = sides;

/** How many boxes this stitch would close. */
export function closes(g: Geometry, drawn: readonly boolean[], edge: number) {
  let count = 0;
  for (let k = 0; k < 2; k++) { const box = g.edgeBox[2 * edge + k]; if (box >= 0 && sides(g, drawn, box) === 3) count++; }
  return count;
}
/** A stitch that gives no box its third side, so the other side can't take anything from it. */
export function isSafe(g: Geometry, drawn: readonly boolean[], edge: number) {
  for (let k = 0; k < 2; k++) { const box = g.edgeBox[2 * edge + k]; if (box >= 0 && sides(g, drawn, box) >= 2) return false; }
  return true;
}

/** The opening: a fixed list, or `count` seeded stitches, no two touching the same box (the old game's draws, exactly). */
function placeOpening(seed: number, g: Geometry, opening: Setup["opening"]) {
  if (typeof opening !== "number") return [...opening];
  const rng = makeRng(seed), placed: number[] = [];
  for (let n = 0; n < opening; n++) {
    let edge = pick(rng, g.edges);
    while (placed.some(other => other === edge || boxesOf(g, edge).some(box => boxesOf(g, other).includes(box)))) edge = pick(rng, g.edges);
    placed.push(edge);
  }
  return placed;
}

/** A fresh cloth for this setup and seed. */
export function begin(seed: number, setup: Setup): Game {
  const geo = geometry(setup.cols, setup.rows);
  const opening = placeOpening(seed, geo, setup.opening);
  const drawn = Array<boolean>(geo.edges).fill(false);
  for (const edge of opening) drawn[edge] = true;
  const owner = Array<number>(geo.boxes).fill(-1), score: [number, number] = [0, 0];
  for (const [box, who] of setup.owned ?? []) {
    owner[box] = who;
    score[who] += worth(setup, box);
    for (const edge of edgesOf(geo, box)) drawn[edge] = true;
  }
  return { seed, setup, geo, opening, moves: [], by: [], drawn, owner, score, turn: setup.first ?? 0, lastClosed: 0, over: owner.every(who => who >= 0) };
}

/** Stitches one gap. Closing a box scores it and keeps the turn. Returns null for anything illegal. */
export function play(game: Game, edge: number): Game | null {
  const g = game.geo;
  if (game.over || !Number.isInteger(edge) || edge < 0 || edge >= g.edges || game.drawn[edge]) return null;
  const drawn = game.drawn.slice();
  drawn[edge] = true;
  const owner = game.owner.slice();
  const score: [number, number] = [game.score[0], game.score[1]];
  let closed = 0;
  for (const box of boxesOf(g, edge)) if (sides(g, drawn, box) === 4) { owner[box] = game.turn; score[game.turn] += worth(game.setup, box); closed++; }
  const over = owner.every(who => who >= 0);
  return { ...game, moves: [...game.moves, edge], by: [...game.by, game.turn], drawn, owner, score, lastClosed: closed, over, turn: closed || over ? game.turn : game.turn === 0 ? 1 : 0 };
}

export const openGaps = (drawn: readonly boolean[]) => drawn.flatMap((done, edge) => done ? [] : [edge]);

/** Flowers the next player can take in a row from here, taking every box with three sides. */
export function giveaway(game: Pick<Game, "geo" | "setup">, drawn: readonly boolean[]) {
  const g = game.geo, board = drawn.slice();
  let taken = 0;
  for (let found = true; found;) {
    found = false;
    for (let edge = 0; edge < g.edges; edge++) {
      if (board[edge]) continue;
      let gain = 0;
      for (let k = 0; k < 2; k++) { const box = g.edgeBox[2 * edge + k]; if (box >= 0 && sides(g, board, box) === 3) gain += worth(game.setup, box); }
      if (gain) { taken += gain; board[edge] = true; found = true; }
    }
  }
  return taken;
}

/**
 * For every gap: the flowers the other side could take right after you stitch it (0 for a stitch that closes a box, since you
 * sew again), or -1 for a gap already stitched. This is what the warning shows.
 */
export function gifts(game: Game) {
  const out = Array<number>(game.geo.edges).fill(-1);
  for (let edge = 0; edge < game.geo.edges; edge++) {
    if (game.drawn[edge]) continue;
    if (closes(game.geo, game.drawn, edge) || isSafe(game.geo, game.drawn, edge)) { out[edge] = 0; continue; }
    const after = game.drawn.slice();
    after[edge] = true;
    out[edge] = giveaway(game, after);
  }
  return out;
}
/** The least any stitch here gives away. */
export const leastGift = (all: readonly number[]) => all.reduce((least, gift) => gift >= 0 && gift < least ? gift : least, Infinity);
/** A stitch that gives away more than you must: the first tap arms it, the second sews. */
export const needsSecondTap = (all: readonly number[], edge: number) => all[edge] > 0 && all[edge] > leastGift(all);

/** Open boxes joined through unstitched shared sides: the chains and loops of the endgame. */
function regions(g: Geometry, drawn: readonly boolean[], taken: readonly boolean[]) {
  const seen = taken.slice(), groups: number[] = [];
  for (let start = 0; start < g.boxes; start++) {
    if (seen[start]) continue;
    seen[start] = true;
    let size = 0;
    for (const queue = [start]; queue.length;) {
      const box = queue.pop()!;
      size++;
      for (const edge of edgesOf(g, box)) {
        if (drawn[edge]) continue;
        for (const next of boxesOf(g, edge)) if (!seen[next]) { seen[next] = true; queue.push(next); }
      }
    }
    groups.push(size);
  }
  return groups;
}

/**
 * In the endgame (no safe stitch left): when the chain being taken is down to its last two boxes and a long chain is still to
 * come, stitch the far end instead and hand those two over. The other side takes them and must then open the long chain.
 */
function doubleDeal(g: Geometry, drawn: readonly boolean[], owner: readonly number[]) {
  const ready = owner.flatMap((who, box) => who < 0 && sides(g, drawn, box) === 3 ? [box] : []);
  if (ready.length !== 1) return -1;
  const first = ready[0];
  const middle = edgesOf(g, first).find(edge => !drawn[edge])!;
  const second = boxesOf(g, middle).find(box => box !== first);
  if (second === undefined || sides(g, drawn, second) !== 2) return -1;
  const far = edgesOf(g, second).find(edge => !drawn[edge] && edge !== middle)!;
  const beyond = boxesOf(g, far).find(box => box !== second);
  if (beyond !== undefined && sides(g, drawn, beyond) >= 2) return -1;
  const taken = owner.map((who, box) => who >= 0 || box === first || box === second);
  return regions(g, drawn, taken).some(size => size >= 3) ? far : -1;
}

/** The stitch that gives away least; on a tie, the one giving two separate three-sided boxes, so they can't be handed back. */
function leastBad(game: Game, free: readonly number[]) {
  let best = -1, bestGift = Infinity, bestSplit = -1;
  for (const edge of free) {
    const after = game.drawn.slice();
    after[edge] = true;
    const gift = giveaway(game, after), split = boxesOf(game.geo, edge).filter(box => sides(game.geo, after, box) === 3).length;
    if (gift < bestGift || (gift === bestGift && split > bestSplit)) { best = edge; bestGift = gift; bestSplit = split; }
  }
  return best;
}

/** Each bot stitch has its own dice, from the game's seed and the move count, so a shared move list can be re-checked. */
const moveRng = (game: Game) => makeRng((game.seed ^ Math.imul(game.moves.length + 1, 0x9e3779b1)) >>> 0);

/** The old bots, unchanged: সহজ takes a box, else a random safe stitch, else any; কঠিন also opens the smallest chain and double-deals. */
function legacyBot(game: Game, level: 1 | 2) {
  const g = game.geo, rng = moveRng(game);
  const free = openGaps(game.drawn);
  const takes = free.filter(edge => closes(g, game.drawn, edge) > 0);
  const safe = free.filter(edge => isSafe(g, game.drawn, edge));
  if (level === 2 && takes.length && !safe.length) {
    const deal = doubleDeal(g, game.drawn, game.owner);
    if (deal >= 0) return deal;
  }
  if (takes.length) return takes.find(edge => closes(g, game.drawn, edge) === 2) ?? takes[pick(rng, takes.length)];
  if (safe.length) return safe[pick(rng, safe.length)];
  if (level === 1) return free[pick(rng, free.length)];
  return leastBad(game, free);
}

function tunedBot(game: Game, bot: Extract<Bot, { kind: "tuned" }>) {
  const g = game.geo, rng = moveRng(game);
  const free = openGaps(game.drawn);
  const takes = free.filter(edge => closes(g, game.drawn, edge) > 0);
  const safe = free.filter(edge => isSafe(g, game.drawn, edge));
  if (bot.deal && takes.length && !safe.length && rng() < bot.deal) {
    const deal = doubleDeal(g, game.drawn, game.owner);
    if (deal >= 0) return deal;
  }
  if (takes.length && rng() < bot.take) {
    const two = takes.find(edge => closes(g, game.drawn, edge) === 2);
    if (two !== undefined) return two;
    if (bot.gold) { const rich = takes.find(edge => boxesOf(g, edge).some(box => sides(g, game.drawn, box) === 3 && worth(game.setup, box) === 2)); if (rich !== undefined) return rich; }
    return takes[pick(rng, takes.length)];
  }
  if (safe.length && rng() < bot.safe) return safe[pick(rng, safe.length)];
  if (!safe.length && rng() < bot.smallest) return leastBad(game, free);
  return free[pick(rng, free.length)];
}

/** The bot's stitch for this position. Deterministic: the same position in the same game always gets the same reply. */
export function botMove(game: Game) {
  const bot = game.setup.bot;
  if (!bot) return -1;
  return bot.kind === "legacy" ? legacyBot(game, bot.level) : tunedBot(game, bot);
}
export const isBotTurn = (game: Game) => game.setup.bot !== null && game.turn === 1 && !game.over;

/** Rebuilds a game from its move list, checking every stitch is legal and every bot stitch is the bot's own reply. Null if anything is off. */
export function replay(seed: number, setup: Setup, moves: readonly number[]): Game | null {
  let game: Game | null = begin(seed, setup);
  for (const edge of moves) {
    if (!game || game.over) return null;
    if (isBotTurn(game) && edge !== botMove(game)) return null;
    game = play(game, edge);
  }
  return game;
}

/** Your own stitches so far: against a bot, only player 0's. */
export const ownStitches = (game: Game) => game.setup.bot ? game.by.filter(who => who === 0).length : game.moves.length;
export const canUndo = (game: Game) => !game.over && (game.setup.bot ? game.by.includes(0) : game.moves.length > 0);

/** Takes back the last stitch; against the bot, also the bot's replies to it. */
export function undo(game: Game): Game {
  let count = game.moves.length;
  if (game.setup.bot) while (count && game.by[count - 1] === 1) count--;
  if (count) count--;
  return replay(game.seed, game.setup, game.moves.slice(0, count)) ?? game;
}

/** Stitches the other side made since the mover's last one (or the last stitch, for two people): highlighted so nobody misses a move. */
export function recent(game: Game) {
  if (!game.setup.bot) return game.moves.slice(-1);
  let from = game.moves.length;
  while (from && game.by[from - 1] === 1) from--;
  return game.moves.slice(from);
}

/** Where the first-screen hint pulses: a box to close if there is one, else the safe gap nearest the middle, else the least gift. */
export function hintGap(game: Game) {
  const g = game.geo, free = openGaps(game.drawn);
  const near = (list: number[]) => {
    let best = -1, bestDistance = Infinity;
    for (const edge of list) {
      const distance = Math.hypot(g.midX[edge] - g.width / 2, g.midY[edge] - g.height / 2 - UNIT / 2);
      if (distance < bestDistance) { best = edge; bestDistance = distance; }
    }
    return best;
  };
  const takes = free.filter(edge => closes(g, game.drawn, edge));
  if (takes.length) return near(takes);
  const safe = free.filter(edge => isSafe(g, game.drawn, edge));
  if (safe.length) return near(safe);
  const all = gifts(game), least = leastGift(all);
  return near(free.filter(edge => all[edge] === least));
}

export type QuiltStats = {
  /** Flowers each side took in its single best turn. */
  run: [number, number];
  /** Flowers each side handed over: what the other side took in the turn right after. */
  handed: [number, number];
  stitches: [number, number];
};

/** The real numbers of a game, rebuilt from its moves. */
export function quiltStats(game: Game): QuiltStats {
  const run: [number, number] = [0, 0], handed: [number, number] = [0, 0], stitches: [number, number] = [0, 0];
  let current = begin(game.seed, game.setup), turnGain = 0, mover: Player = current.turn, before: Player | null = null;
  const close = () => {
    run[mover] = Math.max(run[mover], turnGain);
    // The turn before handed these over, unless they came off the opening.
    if (before !== null && before !== mover) handed[before] += turnGain;
  };
  for (const edge of game.moves) {
    if (current.turn !== mover) { close(); before = mover; mover = current.turn; turnGain = 0; }
    const ahead = current.score[mover];
    current = play(current, edge)!;
    stitches[mover]++;
    turnGain += current.score[mover] - ahead;
  }
  close();
  return { run, handed, stitches };
}

/** The boxes the other side could take in a row right after this stitch (empty if it closes a box, so you sew again). */
export function takenAfter(game: Game, edge: number) {
  const g = game.geo, out: number[] = [];
  if (edge < 0 || game.drawn[edge] || closes(g, game.drawn, edge)) return out;
  const board = game.drawn.slice();
  board[edge] = true;
  for (let found = true; found;) {
    found = false;
    for (let e = 0; e < g.edges; e++) {
      if (board[e]) continue;
      let gain = false;
      for (let k = 0; k < 2; k++) { const box = g.edgeBox[2 * e + k]; if (box >= 0 && sides(g, board, box) === 3) { out.push(box); gain = true; } }
      if (gain) { board[e] = true; found = true; }
    }
  }
  return out;
}

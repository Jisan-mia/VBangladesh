// The rules of সাপলুডু as pure functions: a seeded dice sequence, a roll, a choice between two pieces, and a replay.
// One engine plays every board: the classic 100 squares (সবাই মিলে, and every old link) and the একা ladder's boards.
// No DOM, no Math.random, no clock. Server-safe.
import { makeRng, pick } from "../../../shared/game-core";
import { boardJumpFrom, boardLadder, CLASSIC, LAST, span, type Board } from "./board";
import { CLASSIC_RULES, levelOf, type Rules } from "./levels";

export type Players = 1 | 2 | 3 | 4;
export type Pieces = 1 | 2;
/** A solo race always gets two pieces, so there is something to decide; 2–4 players pick one or two. */
export const piecesFor = (players: Players, two: boolean): Pieces => players === 1 || two ? 2 : 1;

/** The dice for a seed: roll k is the same on every phone, whoever rolls it. */
export function makeDice(seed: number) {
  const rng = makeRng(seed), rolls: number[] = [];
  return (index: number) => {
    while (rolls.length <= index) rolls.push(1 + pick(rng, 6));
    return rolls[index];
  };
}

/**
 * Who plays where, by which rules. `level` 0 is the classic board. `until`: "first" ends the race when anyone gets home
 * (the classic game); "me" plays on until seat 0 (you) is home, placing rivals as they arrive (the একা ladder).
 * `bots` is a bit mask of computer seats (seat 0 is always a person).
 */
export type Setup = { level: number; board: Board; rules: Rules; players: Players; pieces: Pieces; until: "first" | "me"; bots: number };

export const classicSetup = (players: Players, pieces: Pieces, bots = 0): Setup =>
  ({ level: 0, board: CLASSIC, rules: CLASSIC_RULES, players, pieces, until: "first", bots: bots & ((1 << players) - 2) });

export function levelSetup(id: number): Setup {
  const level = levelOf(id);
  return { level: level.id, board: level.board, rules: level.rules, players: (1 + level.rivals) as Players, pieces: level.pieces, until: "me", bots: (1 << (1 + level.rivals)) - 2 };
}

export const isBot = (setup: Setup, seat: number) => seat > 0 && ((setup.bots >> seat) & 1) === 1;

/**
 * What one roll did. `stuck`: no piece could move (it would pass the last square). `voided`: a third six in a row (house
 * rule), so nothing moved. `again`: a six, so the same player rolls again. `home`: this move brought the piece home.
 */
export type Move = { player: number; piece: number; die: number; from: number; to: number; end: number; jump: number; stuck: boolean; again: boolean; home: boolean; voided: boolean };

export type Game = {
  seed: number;
  setup: Setup;
  players: Players;
  pieces: Pieces;
  /** Square of each piece, player by player (player p's piece k is at p * pieces + k). 0 is the start, beside square 1. */
  pos: number[];
  turn: number;
  /** Dice used so far, which is also the index of the next roll. */
  rolls: number;
  /** Rolls per player: the চাল count. */
  moves: number[];
  bites: number[];
  climbs: number[];
  sixes: number[];
  /** Squares gained on ladders and lost to snakes, per player. */
  gained: number[];
  lost: number[];
  /** Per player, the longest ladder climbed and the longest snake slid (jump ids on the board), or -1. */
  bestLadder: number[];
  worstSnake: number[];
  /** Sixes in a row in the current turn. */
  streak: number;
  /** A roll waiting for the player to pick a piece (0 when none). */
  die: number;
  /** Every choice made (0 or 1), in order, by every seat. A link carries these so the game can be replayed and checked. */
  choices: number[];
  phase: "play" | "choose" | "over";
  /** The first seat home, once the race is over. */
  winner: number;
  /** Seats in the order they got home. */
  home: number[];
  last: Move | null;
};

export function startGame(seed: number, setup: Setup): Game {
  const { players, pieces } = setup;
  const zeros = () => Array<number>(players).fill(0), none = () => Array<number>(players).fill(-1);
  return {
    seed, setup, players, pieces, pos: Array<number>(players * pieces).fill(0), turn: 0, rolls: 0,
    moves: zeros(), bites: zeros(), climbs: zeros(), sixes: zeros(), gained: zeros(), lost: zeros(), bestLadder: none(), worstSnake: none(),
    streak: 0, die: 0, choices: [], phase: "play", winner: -1, home: [], last: null,
  };
}

/** The classic board, as every old link was played. */
export const newGame = (seed: number, players: Players, pieces: Pieces) => startGame(seed, classicSetup(players, pieces));

/** Where a piece on `from` ends after rolling `die`: past the last square it doesn't move (null) when `exact`, else it gets home. */
export function landingOn(board: Board, rules: Rules, from: number, die: number) {
  let to = from + die;
  if (to > board.last) {
    if (rules.exact) return null;
    to = board.last;
  }
  const jump = boardJumpFrom(board, to);
  return { to, end: jump >= 0 ? board.jumps[jump].to : to, jump };
}
/** The classic board's landing (exact 100). */
export const landing = (from: number, die: number) => landingOn(CLASSIC, CLASSIC_RULES, from, die);

/** The current player's pieces that can move with `die`. Two pieces on the same square are one option (the first one moves). */
export function options(game: Game, die: number) {
  const base = game.turn * game.pieces, list: number[] = [];
  for (let piece = 0; piece < game.pieces; piece++) {
    const at = game.pos[base + piece];
    if (landingOn(game.setup.board, game.setup.rules, at, die) && !list.some(other => game.pos[base + other] === at)) list.push(piece);
  }
  return list;
}

/** The next seat after `seat` that is still racing. */
function nextSeat(game: Game, seat: number, home: readonly number[]) {
  for (let step = 1; step <= game.players; step++) {
    const next = (seat + step) % game.players;
    if (!home.includes(next)) return next;
  }
  return seat;
}

function move(game: Game, piece: number, die: number): Game {
  const { board, rules, until } = game.setup;
  const player = game.turn, slot = player * game.pieces + piece, from = game.pos[slot];
  const land = landingOn(board, rules, from, die)!;
  const pos = game.pos.slice(); pos[slot] = land.end;
  const bites = game.bites.slice(), climbs = game.climbs.slice(), gained = game.gained.slice(), lost = game.lost.slice();
  const bestLadder = game.bestLadder.slice(), worstSnake = game.worstSnake.slice();
  if (land.jump >= 0 && boardLadder(board, land.jump)) {
    climbs[player]++; gained[player] += span(board, land.jump);
    if (bestLadder[player] < 0 || span(board, land.jump) > span(board, bestLadder[player])) bestLadder[player] = land.jump;
  } else if (land.jump >= 0) {
    bites[player]++; lost[player] += span(board, land.jump);
    if (worstSnake[player] < 0 || span(board, land.jump) > span(board, worstSnake[player])) worstSnake[player] = land.jump;
  }
  const atHome = land.end === board.last;
  const home = atHome ? [...game.home, player] : game.home;
  const over = atHome && (until === "first" || player === 0);
  const again = rules.six && die === 6 && !atHome;
  return {
    ...game, pos, bites, climbs, gained, lost, bestLadder, worstSnake, die: 0, home,
    streak: again ? game.streak + 1 : 0,
    turn: over || again ? player : nextSeat(game, player, home),
    phase: over ? "over" : "play", winner: over ? home[0] : -1,
    last: { player, piece, die, from, to: land.to, end: land.end, jump: land.jump, stuck: false, again, home: atHome, voided: false },
  };
}

/** Rolls `die` for whoever's turn it is. Moves by itself unless two pieces could go; then waits for choose(). */
export function roll(game: Game, die: number): Game {
  if (game.phase !== "play" || !Number.isInteger(die) || die < 1 || die > 6) return game;
  const { rules } = game.setup, player = game.turn;
  const moves = game.moves.slice(); moves[player]++;
  const sixes = game.sixes.slice(); if (die === 6) sixes[player]++;
  const rolled = { ...game, moves, sixes, rolls: game.rolls + 1 };
  const at = game.pos[player * game.pieces];
  const still = (again: boolean, voided: boolean): Game => ({
    ...rolled, streak: again ? game.streak + 1 : 0, turn: again ? player : nextSeat(game, player, game.home),
    last: { player, piece: 0, die, from: at, to: at, end: at, jump: -1, stuck: true, again, home: false, voided },
  });
  if (rules.triple && die === 6 && game.streak >= 2) return still(false, true);
  const can = options(game, die);
  if (can.length === 0) return still(rules.six && die === 6, false);
  if (can.length === 1) return move(rolled, can[0], die);
  return { ...rolled, phase: "choose", die, last: null };
}

/** Moves piece 0 or 1 with the waiting roll. Anything else is ignored. */
export function choose(game: Game, piece: number): Game {
  if (game.phase !== "choose" || !options(game, game.die).includes(piece)) return game;
  return { ...move(game, piece, game.die), choices: [...game.choices, piece] };
}

/** No game is longer than this many rolls in a link (a real one is far shorter). */
export const MAX_ROLLS = 2000;

/**
 * Plays a seed to the end with the given choices. Null if a choice is missing or impossible, if choices are left over,
 * or if it runs past MAX_ROLLS.
 */
export function replaySetup(setup: Setup, seed: number, choices: readonly number[]): Game | null {
  const dice = makeDice(seed);
  let game = startGame(seed, setup), used = 0;
  while (game.phase !== "over") {
    if (game.rolls >= MAX_ROLLS) return null;
    if (game.phase === "choose") {
      if (used >= choices.length) return null;
      const next = choose(game, choices[used++]);
      if (next === game) return null;
      game = next;
    } else game = roll(game, dice(game.rolls));
  }
  return used === choices.length ? game : null;
}
export const replay = (seed: number, players: Players, pieces: Pieces, choices: readonly number[]) => replaySetup(classicSetup(players, pieces), seed, choices);

/** Choices packed four to a hex digit; the replay knows how many there are, so the padding must be zero. */
export function choicesText(choices: readonly number[]) {
  let text = "";
  for (let i = 0; i < choices.length; i += 4) {
    let nibble = 0;
    for (let k = 0; k < 4; k++) nibble = nibble * 2 + (choices[i + k] ?? 0);
    text += nibble.toString(16);
  }
  return text;
}
export function readChoices(text: string) {
  if (!/^[0-9a-f]*$/.test(text)) return null;
  return [...text].flatMap(digit => { const nibble = parseInt(digit, 16); return [3, 2, 1, 0].map(bit => (nibble >> bit) & 1); });
}

/** Where each waiting option would end: [piece, to, end] for the current player. */
export function previews(game: Game) {
  const { board, rules } = game.setup, base = game.turn * game.pieces;
  return options(game, game.die).map(piece => {
    const at = game.pos[base + piece], land = landingOn(board, rules, at, game.die)!;
    return { piece, at, to: land.to, end: land.end, jump: land.jump };
  });
}

/** The careful pick: the piece that ends highest (takes a ladder, dodges a snake). The RECOMMENDED card, and মিনু আপা. */
export function smartPick(game: Game) {
  let best = -1, bestEnd = -1;
  for (const option of previews(game)) if (option.end > bestEnd) { best = option.piece; bestEnd = option.end; }
  return best;
}

/** How fewer rolls ranks a solo race on the big board: 0 is a lucky sprint, 4 a long, patient climb. */
export function band(moves: number) {
  if (moves <= 14) return 0;
  if (moves <= 20) return 1;
  if (moves <= 28) return 2;
  if (moves <= 40) return 3;
  return 4;
}

/** Your place when you got home (1 = first), or 0 while you aren't home. */
export const placeOf = (game: Game, seat = 0) => game.home.indexOf(seat) + 1;

/** Stars for a finished একা race: ★ home, ★ first home, ★ first within the level's par rolls. */
export function starsOf(game: Game) {
  if (game.phase !== "over" || !game.setup.level) return 0;
  const place = placeOf(game);
  if (!place) return 0;
  if (place > 1) return 1;
  return game.moves[0] <= levelOf(game.setup.level).par ? 3 : 2;
}

/** The highest square each seat's leading piece reached. */
export function leadSquare(game: Game, seat: number) {
  let best = 0;
  for (let piece = 0; piece < game.pieces; piece++) best = Math.max(best, game.pos[seat * game.pieces + piece]);
  return best;
}

/** The classic last square, for old callers. */
export { LAST };

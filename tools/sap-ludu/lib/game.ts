// The rules of সাপলুডু as pure functions: a seeded dice sequence, a roll, a choice between two pieces, and a replay. Server-safe.
import { makeRng, pick } from "../../../shared/game-core";
import { JUMPS, LAST, isLadder, jumpFrom } from "./board";

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

/** What one roll did. `stuck`: no piece could move (it would pass 100). `again`: a six, so the same player rolls again. */
export type Move = { player: number; piece: number; die: number; from: number; to: number; end: number; jump: number; stuck: boolean; again: boolean };

export type Game = {
  seed: number;
  players: Players;
  pieces: Pieces;
  /** Square of each piece, player by player (player p's piece k is at p * pieces + k). 0 is the start, beside square 1. */
  pos: number[];
  turn: number;
  /** Dice used so far, which is also the index of the next roll. */
  rolls: number;
  /** Rolls per player: the চাল count on the card. */
  moves: number[];
  bites: number[];
  climbs: number[];
  /** Per player, the longest ladder climbed and the longest snake slid (jump ids), or -1. */
  bestLadder: number[];
  worstSnake: number[];
  /** A roll waiting for the player to pick a piece (0 when none). */
  die: number;
  /** Every choice made (0 or 1), in order. A link carries these so the game can be replayed and checked. */
  choices: number[];
  phase: "play" | "choose" | "over";
  winner: number;
  last: Move | null;
};

export function newGame(seed: number, players: Players, pieces: Pieces): Game {
  const zeros = () => Array<number>(players).fill(0), none = () => Array<number>(players).fill(-1);
  return {
    seed, players, pieces, pos: Array<number>(players * pieces).fill(0), turn: 0, rolls: 0,
    moves: zeros(), bites: zeros(), climbs: zeros(), bestLadder: none(), worstSnake: none(),
    die: 0, choices: [], phase: "play", winner: -1, last: null,
  };
}

const span = (id: number) => Math.abs(JUMPS[id].to - JUMPS[id].from);

/** Where a piece on `from` ends after rolling `die`: past 100 it doesn't move (null). */
export function landing(from: number, die: number) {
  const to = from + die;
  if (to > LAST) return null;
  const jump = jumpFrom(to);
  return { to, end: jump >= 0 ? JUMPS[jump].to : to, jump };
}

/**
 * The current player's pieces that can move with `die`. Two pieces on the same square are one option (the first one moves).
 * House rule: you must land exactly on 100; a roll that would pass it doesn't move that piece.
 */
export function options(game: Game, die: number) {
  const base = game.turn * game.pieces, list: number[] = [];
  for (let piece = 0; piece < game.pieces; piece++) {
    const at = game.pos[base + piece];
    if (landing(at, die) && !list.some(other => game.pos[base + other] === at)) list.push(piece);
  }
  return list;
}

function move(game: Game, piece: number, die: number): Game {
  const player = game.turn, slot = player * game.pieces + piece, from = game.pos[slot];
  const land = landing(from, die)!;
  const pos = game.pos.slice(); pos[slot] = land.end;
  const bites = game.bites.slice(), climbs = game.climbs.slice(), bestLadder = game.bestLadder.slice(), worstSnake = game.worstSnake.slice();
  if (land.jump >= 0 && isLadder(land.jump)) {
    climbs[player]++;
    if (bestLadder[player] < 0 || span(land.jump) > span(bestLadder[player])) bestLadder[player] = land.jump;
  } else if (land.jump >= 0) {
    bites[player]++;
    if (worstSnake[player] < 0 || span(land.jump) > span(worstSnake[player])) worstSnake[player] = land.jump;
  }
  const won = land.end === LAST, again = die === 6 && !won;
  return {
    ...game, pos, bites, climbs, bestLadder, worstSnake, die: 0,
    turn: won || again ? player : (player + 1) % game.players,
    phase: won ? "over" : "play", winner: won ? player : -1,
    last: { player, piece, die, from, to: land.to, end: land.end, jump: land.jump, stuck: false, again },
  };
}

/** Rolls `die` for whoever's turn it is. Moves by itself unless two pieces could go; then waits for choose(). */
export function roll(game: Game, die: number): Game {
  if (game.phase !== "play" || !Number.isInteger(die) || die < 1 || die > 6) return game;
  const moves = game.moves.slice(); moves[game.turn]++;
  const rolled = { ...game, moves, rolls: game.rolls + 1 };
  const can = options(game, die);
  if (can.length === 0) {
    const again = die === 6, slot = game.turn * game.pieces, at = game.pos[slot];
    return { ...rolled, turn: again ? game.turn : (game.turn + 1) % game.players, last: { player: game.turn, piece: 0, die, from: at, to: at, end: at, jump: -1, stuck: true, again } };
  }
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
export function replay(seed: number, players: Players, pieces: Pieces, choices: readonly number[]): Game | null {
  const dice = makeDice(seed);
  let game = newGame(seed, players, pieces), used = 0;
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

/** A careful player: moves the piece that ends highest (takes a ladder, dodges a snake). Used by tests and the hint. */
export function smartPick(game: Game) {
  const base = game.turn * game.pieces;
  let best = -1, bestEnd = -1;
  for (const piece of options(game, game.die)) {
    const end = landing(game.pos[base + piece], game.die)!.end;
    if (end > bestEnd) { best = piece; bestEnd = end; }
  }
  return best;
}

/** Score bands for a solo race, by rolls to reach 100: 0 is a lucky sprint, 4 a long, patient climb. */
export function band(moves: number) {
  if (moves <= 14) return 0;
  if (moves <= 20) return 1;
  if (moves <= 28) return 2;
  if (moves <= 40) return 3;
  return 4;
}

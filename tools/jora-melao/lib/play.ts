// The rules of জোড়া মেলাও as pure functions: deal a seeded board, peek, flip, turn a miss back (and let the birds fly),
// score. No DOM, no clock: lib/session.ts adds the timers. Server-safe, so a friend's link can replay a game here.
import { makeRng, pick } from "../../../shared/game-core";
import { oldDeal, type OldSize } from "./legacy";
import { cardsOf, type Spec } from "./levels";
import { worldSet } from "./pictures";

export type Players = 1 | 2;

export type Game = {
  seed: number;
  spec: Spec;
  players: Players;
  /** The picture on each place (an id in pictures.ts). The birds can swap two places while the cards are face down. */
  board: number[];
  /** A pair lying face up until your first tap, or null. */
  demo: [number, number] | null;
  /** Face-up cards that aren't matched yet: none, the first of a move, or a missed pair waiting to turn back. */
  open: number[];
  /** Per place: -1 while hidden, else who matched it (0, or 1 for the second player). */
  found: number[];
  /** Per place: the card here has been face up before. Travels with the card when the birds swap. */
  seen: boolean[];
  turn: 0 | 1;
  pairs: [number, number];
  moves: number;
  misses: number;
  /** Times the birds have flown. */
  flights: number;
  streak: number;
  bestStreak: number;
  /** Matches where you had already seen the second card before this move. */
  remembered: number;
  /** Every card flipped, in order. A link carries these so the friend's page can re-check the moves. */
  flips: number[];
  phase: "ready" | "peek" | "play" | "over";
  /** What the latest move did, for the "মিলেছে!" pop. */
  last: "match" | "miss" | null;
  /** The places swapped by the latest settle, for the flight: [a, b, a, b …]. */
  flown: number[];
  /** 3 or 2: the star a miss has just made out of reach (0 otherwise). */
  cracked: 0 | 2 | 3;
};

function shuffle<T>(rng: () => number, items: T[]) {
  for (let i = items.length - 1; i > 0; i--) {
    const j = pick(rng, i + 1);
    [items[i], items[j]] = [items[j], items[i]];
  }
  return items;
}

/** The pictures of a board: the world's look-alike pairs first, then plain ones, each twice, shuffled. */
export function dealBoard(seed: number, spec: Spec) {
  const rng = makeRng(seed);
  const set = worldSet(spec.world);
  const twins = shuffle(rng, set.twins.slice()).slice(0, spec.alike);
  const used = new Set<number>(twins.flatMap(([twin, base]) => [twin, base]));
  const plain = shuffle(rng, set.base.filter(id => !used.has(id))).slice(0, spec.pairs - 2 * spec.alike);
  const pictures = [...used, ...plain];
  const board = shuffle(rng, pictures.flatMap(id => [id, id]));
  let demo: [number, number] | null = null;
  if (spec.demo) {
    const shown = pictures[pick(rng, pictures.length)], first = board.indexOf(shown);
    demo = [first, board.indexOf(shown, first + 1)];
  }
  return { board, demo };
}

function fresh(seed: number, spec: Spec, players: Players, board: number[], demo: [number, number] | null): Game {
  return {
    seed, spec, players, board, demo, open: [], found: board.map(() => -1), seen: board.map(() => false), turn: 0, pairs: [0, 0],
    moves: 0, misses: 0, flights: 0, streak: 0, bestStreak: 0, remembered: 0, flips: [], phase: "ready", last: null, flown: [], cracked: 0,
  };
}

/** The same seed and board always give the same pictures in the same places, on every phone. */
export function newGame(seed: number, spec: Spec, players: Players = 1): Game {
  const { board, demo } = dealBoard(seed, spec);
  return fresh(seed, spec, players, board, demo);
}

/**
 * A board from before the rewrite (links without `v`): the old deal of the old toys, no twists. A legacy spec is the
 * toy table with the old size.
 */
export function legacyGame(seed: number, size: OldSize, players: Players): Game {
  const { board, demo } = oldDeal(seed, size);
  const spec: Spec = { world: 0, pairs: size / 2, alike: 0, demo: true, peek: 0, every: 0, flyers: 0, three: 0, two: 0 };
  return fresh(seed, spec, players, board, [demo[0], demo[1]]);
}

export const pairsOf = (game: Game) => game.spec.pairs;
export const placesOf = (game: Game) => cardsOf(game.spec);
const see = (game: Game, places: readonly number[]) => {
  const seen = game.seen.slice();
  for (const place of places) seen[place] = true;
  return seen;
};

/** The first tap on the start card: every card shows for the peek, or play begins. */
export function begin(game: Game): Game {
  if (game.phase !== "ready") return game;
  if (game.spec.peek > 0) return { ...game, phase: "peek", seen: game.board.map(() => true) };
  return { ...game, phase: "play", seen: game.demo ? see(game, game.demo) : game.seen };
}
/** The peek is over: the cards turn down and play begins. */
export const endPeek = (game: Game): Game => game.phase === "peek" ? { ...game, phase: "play" } : game;

/** Is the card in place `index` face up on screen? */
export const isUp = (game: Game, index: number) =>
  game.found[index] >= 0 || game.open.includes(index) || game.phase === "peek"
  || (game.phase === "play" && game.demo !== null && game.flips.length === 0 && game.demo.includes(index));

/** Places two cards fly between, picked from the seeded stream of this flight. Cards you have seen go first. */
export function flightPlaces(game: Game, pairsOfPlaces: number): number[] {
  const rng = makeRng((Math.imul(game.seed, 7919) + Math.imul(game.flights + 1, 104729)) >>> 0);
  const taken = new Set<number>(game.open);
  const out: number[] = [];
  for (let k = 0; k < pairsOfPlaces; k++) {
    const free = () => game.board.map((_, place) => place).filter(place => game.found[place] < 0 && !taken.has(place));
    const first = free();
    if (first.length < 2) break;
    const known = first.filter(place => game.seen[place]);
    const a = (known.length >= 2 ? known : first)[pick(rng, (known.length >= 2 ? known : first).length)];
    taken.add(a);
    const rest = free().filter(place => game.board[place] !== game.board[a]);
    if (!rest.length) { taken.delete(a); break; }
    const knownRest = rest.filter(place => game.seen[place]);
    const pool = knownRest.length ? knownRest : rest;
    const b = pool[pick(rng, pool.length)];
    taken.add(b);
    out.push(a, b);
  }
  return out;
}

/** The stars a clear in `moves` would earn on this board (any clear: 1; 0 on a board outside the ladder). */
export function starsOf(spec: Spec, moves: number) {
  if (!spec.three) return 0;
  return moves <= spec.three ? 3 : moves <= spec.two ? 2 : 1;
}
/** Moves fewer that would have earned the next star (0 at three stars). */
export function movesToNextStar(spec: Spec, moves: number) {
  const stars = starsOf(spec, moves);
  if (!stars || stars === 3) return 0;
  return moves - (stars === 2 ? spec.three : spec.two);
}
/** The most stars still within reach: finish every pair that is left without another miss. */
export function reachable(game: Game): number {
  if (!game.spec.three) return 0;
  return starsOf(game.spec, game.moves + (pairsOf(game) - game.pairs[0] - game.pairs[1]));
}
/** The star the next miss would take (3 or 2), or 0 when a miss costs nothing: the edge glow's whole rule. */
export function atStake(game: Game): 0 | 2 | 3 {
  if (!game.spec.three || game.phase !== "play") return 0;
  const best = reachable(game), left = pairsOf(game) - game.pairs[0] - game.pairs[1];
  if (best === 3 && game.moves + left === game.spec.three) return 3;
  if (best === 2 && game.moves + left === game.spec.two) return 2;
  return 0;
}

/** Turns a missed pair back face down. If the birds are due, they fly now (a miss is the only time they do). */
export function settle(game: Game): Game {
  if (game.open.length !== 2) return game;
  const due = game.spec.every > 0 && game.misses > 0 && game.misses % game.spec.every === 0 && game.phase === "play";
  if (!due) return { ...game, open: [], last: null, flown: [] };
  const places = flightPlaces(game, game.spec.flyers);
  const board = game.board.slice(), seen = game.seen.slice();
  for (let i = 0; i < places.length; i += 2) {
    const a = places[i], b = places[i + 1];
    [board[a], board[b]] = [board[b], board[a]];
    [seen[a], seen[b]] = [seen[b], seen[a]];
  }
  return { ...game, board, seen, open: [], last: null, flown: places, flights: game.flights + (places.length ? 1 : 0) };
}

/**
 * Flips the card in place `index`. Returns the same object when the tap does nothing (a matched card, the card already
 * up, game over, the peek). While a miss shows, a tap on a board where the birds fly only turns it back (the cards may
 * move); elsewhere it turns it back and flips the card.
 */
export function flip(game: Game, index: number): Game {
  if (game.phase !== "play" || !Number.isInteger(index) || index < 0 || index >= game.board.length || game.found[index] >= 0) return game;
  if (game.open.includes(index)) return game.open.length === 2 ? settle(game) : game;
  if (game.open.length === 2 && game.spec.every > 0) return settle(game);
  const before = settle(game);
  const flips = [...before.flips, index];
  const wasSeen = before.seen[index];
  const seen = see(before, [index]);
  if (before.open.length === 0) return { ...before, open: [index], flips, seen, last: null, flown: [], cracked: 0 };

  const other = before.open[0], moves = before.moves + 1;
  if (before.board[other] !== before.board[index]) {
    const turn = before.players === 2 ? (1 - before.turn) as 0 | 1 : 0;
    const next: Game = { ...before, seen, open: [other, index], flips, moves, misses: before.misses + 1, streak: 0, turn, last: "miss", flown: [], cracked: 0 };
    const lost = reachable(before) - reachable(next);
    return lost > 0 ? { ...next, cracked: reachable(before) as 2 | 3 } : next;
  }
  const found = before.found.slice();
  found[other] = found[index] = before.turn;
  const pairs: [number, number] = [...before.pairs];
  pairs[before.turn]++;
  const over = pairs[0] + pairs[1] === pairsOf(before);
  const streak = before.streak + 1;
  return {
    ...before, seen, open: [], found, pairs, flips, moves, streak, bestStreak: Math.max(before.bestStreak, streak),
    remembered: before.remembered + (wasSeen ? 1 : 0), last: "match", flown: [], cracked: 0, phase: over ? "over" : "play",
  };
}

/**
 * Plays a link's flips on its board. Null when any flip is not a real flip (a matched card, a repeat, off the board).
 * A missed pair is turned back before each flip, as the timer or a tap on it would have done on the phone.
 */
export function replay(start: Game, flips: readonly number[]): Game | null {
  let game = endPeek(begin(start));
  for (const index of flips) {
    const next = flip(settle(game), index);
    if (next.flips.length !== game.flips.length + 1) return null;
    game = next;
  }
  return game;
}

/** One base-32 digit per flip (the same as hex below 16, so old links read the same). */
export const flipsText = (flips: readonly number[]) => flips.map(index => index.toString(32)).join("");
export const readFlips = (text: string) => /^[0-9a-v]*$/.test(text) ? [...text].map(digit => parseInt(digit, 32)) : null;

/** Score bands for one player, by how many moves per pair: 0 is a flawless game, 5 is a long, patient one. */
export function band(moves: number, pairs: number) {
  const perPair = moves / pairs;
  if (perPair <= 1) return 0;
  if (perPair <= 1.5) return 1;
  if (perPair <= 2) return 2;
  if (perPair <= 2.75) return 3;
  if (perPair <= 3.5) return 4;
  return 5;
}

// One round of the game, with no React: which shadows hang on the wall, which toys stand on the shelf, whether a toy put on a
// shadow fits, the hint, and the stars. Pure and deterministic (makeRng only): the same seed and level give the same walls.
// Spec: ai_docs/statecharts/chhaya-melao/Chhaya.tla. Nothing here has a clock; nothing is lost on a slip.
import { makeRng, starsFor } from "../../../shared/game-core";
import { levelOf, matchesOf, type Turn } from "./levels";
import { FAMILIES, SHAPES, shapeOf, type Family, type Shape } from "./shapes";

export type Shadow = { id: string; turn: Turn };
/** One wall: the shadows on it, and the toys on the shelf (the shadows' toys plus any spares), in shelf order. */
export type Board = { shadows: Shadow[]; toys: string[] };

export type Round = {
  level: number; seed: number;
  /** Which wall of the round this is, from 0. */
  index: number;
  board: Board;
  /** Per shadow: its toy has been put on it. */
  placed: boolean[];
  /** Slips since the last match (two bring the hint), and the exact wrong pairs tried since then (a repeat counts once). */
  misses: number; tried: string[];
  /** Matches made, matches that counted toward the stars (a last toy on a last shadow is forced, so it doesn't count), matches on the first try, slipped ones. */
  matches: number; scored: number; firstTry: number; slips: number;
  /** Matches in a row that took a slip / went clean: three slips take a spare toy away, five clean put one on. */
  missRun: number; rightRun: number;
  /** Every toy used as a shadow so far, so a round never repeats one when it can help it. */
  used: string[];
};

export type Outcome = "match" | "miss" | "same" | "ignored";
export type Placed = { round: Round; outcome: Outcome };

export const MAX_TOYS = 4;

/** Toys on the shelf: the level's number; one fewer after three slipped matches in a row, one more after five clean ones. Never fewer than the shadows (or 2), never over 4. */
export function toyCount(base: number, shadows: number, missRun: number, rightRun: number) {
  const wanted = missRun >= 3 ? base - 1 : rightRun >= 5 ? base + 1 : base;
  return Math.max(shadows, 2, Math.min(MAX_TOYS, wanted));
}

export function shuffle<T>(list: readonly T[], rng: () => number): T[] {
  const out = [...list];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

const inFamily = (family: Family) => SHAPES.filter(shape => shape.family === family);
/** Prefer a toy not used yet this round; when every one is used, any. */
const fresh = (list: readonly Shape[], used: readonly string[]) => { const unused = list.filter(shape => !used.includes(shape.id)); return unused.length ? unused : list; };

const LEANS = [-40, -25, 25, 40];
const TURNS: readonly Turn[] = [{ deg: 90, flip: false }, { deg: 180, flip: false }, { deg: -90, flip: false }, { deg: 0, flip: true }];
const NO_TURN: Turn = { deg: 0, flip: false };
function turnFor(kind: "none" | "lean" | "turns", rng: () => number): Turn {
  if (kind === "lean") return { deg: LEANS[Math.floor(rng() * LEANS.length)], flip: false };
  if (kind === "turns") return TURNS[Math.floor(rng() * TURNS.length)];
  return NO_TURN;
}

/**
 * The wall at `index` of a round. Toys that look alike never share a shelf unless the level asks for look-alikes: otherwise each
 * shadow's toy comes from its own family and the spares from the other families; on a look-alike level everything is one family.
 */
export function makeBoard(level: number, seed: number, index: number, used: readonly string[], toys: number): Board {
  const spec = levelOf(level), count = spec.shadows;
  const rng = makeRng((seed * 2654435761 + index * 40503 + 17) >>> 0);
  let targets: Shape[], spares: Shape[];
  if (spec.kin) {
    const pool = spec.families ?? FAMILIES;
    // A family with enough toys for the shadows and spares, ideally ones not used yet.
    const roomy = shuffle(pool, rng).filter(family => inFamily(family).length >= toys);
    const family = roomy.sort((a, b) => fresh(inFamily(b), used).length - fresh(inFamily(a), used).length)[0] ?? pool[0];
    const all = shuffle(inFamily(family), rng);
    targets = []; 
    for (const shape of fresh(all, used)) if (targets.length < count) targets.push(shape);
    for (const shape of all) if (targets.length < count && !targets.includes(shape)) targets.push(shape);
    spares = all.filter(shape => !targets.includes(shape)).slice(0, toys - count);
  } else {
    // Families that still have an unused toy come first, so a round only repeats a toy once every family is used up.
    const mixed = shuffle(FAMILIES, rng), hasFresh = (family: Family) => inFamily(family).some(shape => !used.includes(shape.id));
    const families = [...mixed.filter(hasFresh), ...mixed.filter(family => !hasFresh(family))];
    targets = families.slice(0, count).map(family => shuffle(fresh(inFamily(family), used), rng)[0]);
    const others = families.slice(count);
    spares = [];
    for (let at = 0; at < toys - count; at++) spares.push(shuffle(inFamily(others[at % others.length]).filter(shape => !targets.includes(shape) && !spares.includes(shape)), rng)[0]);
  }
  const shelf = shuffle([...targets, ...spares].map(shape => shape.id), rng);
  return { shadows: targets.map(shape => ({ id: shape.id, turn: turnFor(spec.turn, rng) })), toys: shelf };
}

export function createRound(level: number, seed: number): Round {
  const spec = levelOf(level);
  const board = makeBoard(level, seed, 0, [], spec.toys);
  return {
    level, seed, index: 0, board, placed: board.shadows.map(() => false), misses: 0, tried: [], matches: 0, scored: 0, firstTry: 0, slips: 0,
    missRun: 0, rightRun: 0, used: board.shadows.map(shadow => shadow.id),
  };
}

export const total = (round: Round) => matchesOf(round.level);
export const boardsOf = (round: Round) => levelOf(round.level).boards;
export const boardDone = (round: Round) => round.placed.every(Boolean);
/** The wall on screen is the round's last one (and is finished or not). */
export const onLastBoard = (round: Round) => round.index === boardsOf(round) - 1;
/** The round is complete: the last wall's last shadow is matched. */
export const isDone = (round: Round) => onLastBoard(round) && boardDone(round);
export const toyPlaced = (round: Round, toy: string) => round.board.shadows.some((shadow, slot) => round.placed[slot] && shadow.id === toy);
/** Toys still on the shelf, in shelf order. */
export const shelfToys = (round: Round) => round.board.toys.filter(toy => !toyPlaced(round, toy));

/** Put `toy` on shadow `slot`. A match records itself; a miss only counts a slip (and a repeat of the same wrong pair counts nothing). */
export function place(round: Round, toy: string, slot: number): Placed {
  const shadow = round.board.shadows[slot];
  if (!shadow || round.placed[slot] || toyPlaced(round, toy) || !round.board.toys.includes(toy)) return { round, outcome: "ignored" };
  if (shadow.id !== toy) {
    const pair = `${toy}@${slot}`;
    if (round.tried.includes(pair)) return { round, outcome: "same" };
    return { round: { ...round, misses: round.misses + 1, tried: [...round.tried, pair] }, outcome: "miss" };
  }
  const clean = round.misses === 0;
  // The last toy on the last open shadow can only be right, so it earns and costs nothing.
  const forced = shelfToys(round).length === 1 && round.placed.filter(done => !done).length === 1;
  const placed = round.placed.map((done, at) => done || at === slot);
  return {
    round: {
      ...round, placed, misses: 0, tried: [], matches: round.matches + 1, scored: round.scored + (forced ? 0 : 1), firstTry: round.firstTry + (clean && !forced ? 1 : 0), slips: round.slips + (clean ? 0 : 1),
      rightRun: forced ? round.rightRun : clean ? round.rightRun + 1 : 0, missRun: forced ? round.missRun : clean ? 0 : round.missRun + 1,
    },
    outcome: "match",
  };
}

/**
 * After two slips the quiet hint: the first open shadow and its toy get a ring together. -1 when there is none yet. With only one wrong
 * toy on the shelf there is only one wrong pair to try, so one slip is enough.
 */
export const hintSlot = (round: Round) => round.misses >= Math.min(2, shelfToys(round).length - 1) ? round.placed.findIndex(done => !done) : -1;

/** The next wall of the round. Only after this one is finished. */
export function nextBoard(round: Round): Round {
  if (!boardDone(round) || onLastBoard(round)) return round;
  const spec = levelOf(round.level), index = round.index + 1;
  const board = makeBoard(round.level, round.seed, index, round.used, toyCount(spec.toys, spec.shadows, round.missRun, round.rightRun));
  return { ...round, index, board, placed: board.shadows.map(() => false), misses: 0, tried: [], used: [...round.used, ...board.shadows.map(shadow => shadow.id)] };
}

/** Stars are a record only: 3 for all but one scored match on the first try, 2 for half, 1 for finishing. */
export const starsOf = (firstTry: number, count: number) => starsFor(firstTry, count - 1, Math.ceil(count / 2));

export type Result = { level: number; stars: number; ids: string[]; count: number; scored: number; firstTry: number; slips: number };
export const resultOf = (round: Round): Result => ({ level: round.level, stars: starsOf(round.firstTry, round.scored), ids: round.used, count: total(round), scored: round.scored, firstTry: round.firstTry, slips: round.slips });

/** The objects of a result, by id (for the card and the end screen). */
export const shapesOf = (ids: readonly string[]) => ids.map(id => shapeOf(id)).filter((shape): shape is Shape => !!shape);

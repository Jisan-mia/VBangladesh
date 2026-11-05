// One run of the garden: a level or খোলা বাগান. Swipes, weather (rain, hail, gusts, crows), weeds, ফেরত নাও,
// মালির থলে, stars. Pure and deterministic: every random choice comes from makeRng(seed, move number), so a link's moves
// replay to the same board on every phone. A Game is never changed in place; each swipe returns a new one.
import { makeRng, starsFor } from "../../../shared/game-core";
import { canMove, slide, spawn, topStage, CROW, STONE, TOP, WEED, type Dir, type Slide } from "./board";
import { OLD_LEVELS } from "./legacy";
import { LEVELS, MODE_INFO, type Mode } from "./levels";

export type Kind = "level" | "garden";
/** What a run is played on. Old links (v 1) replay the pre-rewrite rules: the old table, no weather, no weeds, no offers. */
export type Spec = {
  size: number; stones: readonly number[]; target: number; count: number; tight: boolean;
  rain: number; hail: number; gust: number; crow: number; weeds: number; undo: boolean; offers: boolean; legacy: boolean; bot: number;
};
export type Run = { v: 1 | 2; kind: Kind; level: number; seed: number; mode: Mode };

export const CROW_STAY = 4;
export const GARDEN_SIZE = 4;
export const OFFER_STAGES = [4, 5, 6, 7, 8] as const;
/** What মালির থলে can hold; a pick is written into links as its index here. */
export const POOL = ["undo", "manure", "spade", "rain"] as const;
export type Offer = typeof POOL[number];
export const MANURE_DROPS = 6;
export const SPADE_LIFTS = 3;

export function specOf(run: Pick<Run, "v" | "kind" | "level" | "mode">): Spec {
  const none = { rain: 0, hail: 0, gust: 0, crow: 0, weeds: 0, count: 1 };
  if (run.kind === "garden") {
    return { ...none, size: GARDEN_SIZE, stones: [], target: 0, tight: false, undo: true, offers: run.v === 2, legacy: run.v === 1, bot: 0, weeds: run.v === 2 && run.mode === "h" ? 0.06 : 0 };
  }
  if (run.v === 1) {
    const old = OLD_LEVELS[run.level - 1];
    return { ...none, size: old.size, stones: old.stones, target: old.target, tight: old.tight, undo: true, offers: false, legacy: true, bot: old.bot };
  }
  const level = LEVELS[run.level - 1];
  return { ...level, offers: false, legacy: false };
}
/** A level's plot is the same on every phone; the garden takes the run's seed. */
export const plotSeed = (run: Run) => run.kind === "garden" ? run.seed : run.v === 1 ? OLD_LEVELS[run.level - 1].seed : LEVELS[run.level - 1].seed;

export type Game = {
  run: Run; spec: Spec; seed: number; size: number; cells: number[]; moves: Dir[];
  score: number;
  /** The biggest stage on the board so far (it drops back on ফেরত নাও). */
  top: number;
  /** The biggest stage this run ever reached. ফেরত নাও never lowers it, so a redo never celebrates twice. */
  peak: number;
  /** Plates grown to the goal stage or past it. */
  made: number;
  won: boolean; over: boolean; end: "" | "goal" | "full" | "moves" | "stop";
  undos: number; undosUsed: number; prev: Game | null;
  merges: number; streak: number; bestStreak: number; pairs: number; bestSwipe: { points: number; at: number; pairs: number };
  /** Drops still to fall as চারা (সার). */
  boost: number;
  offers: number; offer: Offer[] | null; picks: string;
  hailCell: number; hailAt: number; gustDir: number; gustAt: number; shadow: number; crowCell: number; crowLeft: number;
  /** What the last swipe did, for the drawing and the sounds. */
  last: Slide | null; gust: Slide | null; spawned: { cell: number; stage: number } | null;
  rained: number[]; hailHit: { cell: number; from: number; to: number } | null; crowLanded: number; crowGone: number; shooed: number;
  events: number;
};

export const E_MERGE = 1, E_PEAK = 2, E_RAIN = 4, E_HAIL = 8, E_GUST = 16, E_CROW = 32, E_SHOO = 64, E_FLY = 128, E_PULL = 256,
  E_WON = 512, E_OVER = 1024, E_OFFER = 2048, E_UNDO = 4096, E_PICK = 8192;

const PRIME = { hail: 0x85ebca6b, gust: 0xc2b2ae35, crow: 0x27d4eb2f, weed: 0x165667b1, offer: 0x9e3779b1 } as const;
const roll = (seed: number, kind: keyof typeof PRIME, n: number) => makeRng((seed ^ Math.imul(n + 7, PRIME[kind]) ^ 0x5bd1e995) >>> 0);
const choose = (rng: () => number, cells: number[]) => cells.length ? cells[Math.floor(rng() * cells.length)] : -1;

// ---- limits and stars ----
const parOf = (spec: Spec) => spec.bot;
export const threeStar = (spec: Spec) => parOf(spec) + Math.ceil(parOf(spec) * (spec.tight ? 0.15 : 0.25));
export const twoStar = (spec: Spec) => parOf(spec) + Math.ceil(parOf(spec) * (spec.tight ? 0.35 : 0.55));
const baseLimit = (spec: Spec) => Math.max(10, parOf(spec) + Math.ceil(parOf(spec) * (spec.tight ? 0.7 : 1)) + 4);
/** The move limit of a level in a mode: miss the goal by then and it isn't cleared. 0 in the garden. */
export function limitOf(spec: Spec, mode: Mode) {
  if (!spec.target) return 0;
  if (spec.legacy || mode === "n") return baseLimit(spec);
  return mode === "e" ? Math.ceil(baseLimit(spec) * 1.5) : Math.max(10, twoStar(spec) + 2);
}
export const undosOf = (spec: Spec, mode: Mode) => mode === "h" ? 0 : mode === "e" ? 5 : spec.undo ? 2 : 0;
export const levelStars = (spec: Spec, mode: Mode, count: number) => Math.min(MODE_INFO[mode].maxStars, starsFor(count, threeStar(spec), twoStar(spec), true));
/** The garden: ★ for পাকা আম, ★★ for a ঝুড়ি, ★★★ for the whole বাগান. */
export const gardenStars = (top: number) => Math.max(0, Math.min(3, top - (TOP - 3)));
export const starsOf = (game: Game) => game.run.kind === "garden" ? gardenStars(game.top) : game.won ? levelStars(game.spec, game.run.mode, game.moves.length) : 0;
/** Moves fewer that would have earned the next star in a cleared level (0 at the top). */
export function shortBy(game: Game) {
  const earned = starsOf(game), count = game.moves.length;
  if (!game.won || earned >= MODE_INFO[game.run.mode].maxStars) return 0;
  return count - (earned === 2 ? threeStar(game.spec) : twoStar(game.spec));
}

// ---- the start ----
export function createGame(run: Run): Game {
  const spec = specOf(run), seed = plotSeed(run), size = spec.size;
  const cells = Array<number>(size * size).fill(0);
  for (const cell of spec.stones) cells[cell] = STONE;
  for (const index of [0, 1]) { const placed = spawn(cells, seed, index, true)!; cells[placed.cell] = placed.stage; }
  const game: Game = {
    run, spec, seed, size, cells, moves: [], score: 0, top: 1, peak: 1, made: 0, won: false, over: false, end: "",
    undos: undosOf(spec, run.mode), undosUsed: 0, prev: null,
    merges: 0, streak: 0, bestStreak: 0, pairs: 0, bestSwipe: { points: 0, at: 0, pairs: 0 },
    boost: 0, offers: 0, offer: null, picks: "",
    hailCell: -1, hailAt: 0, gustDir: -1, gustAt: 0, shadow: -1, crowCell: -1, crowLeft: 0,
    last: null, gust: null, spawned: null, rained: [], hailHit: null, crowLanded: -1, crowGone: -1, shooed: -1, events: 0,
  };
  announce(game, 0);
  return game;
}

/** After move `n`, warn of what comes next: hail and gusts two moves ahead, a crow's shadow one move ahead. */
function announce(game: Game, n: number) {
  const { spec, cells, seed } = game;
  if (spec.hail && (n + 2) % spec.hail === 0) {
    const open: number[] = [];
    for (let cell = 0; cell < cells.length; cell++) if (cells[cell] !== STONE && cells[cell] !== CROW) open.push(cell);
    game.hailAt = n + 2;
    game.hailCell = choose(roll(seed, "hail", n + 2), open);
  }
  if (spec.gust && (n + 2) % spec.gust === 0) {
    game.gustAt = n + 2;
    game.gustDir = Math.floor(roll(seed, "gust", n + 2)() * 4);
  }
  if (spec.crow && (n + 1) % spec.crow === 0 && game.crowLeft === 0) {
    const empty: number[] = [];
    for (let cell = 0; cell < cells.length; cell++) if (cells[cell] === 0) empty.push(cell);
    game.shadow = choose(roll(seed, "crow", n + 1), empty);
  }
}

const strip = (game: Game): Game => game.prev ? { ...game, prev: null } : game;

/** One swipe. Null when the run is over, an offer waits, or nothing would move (no move counted). */
export function move(game: Game, dir: Dir): Game | null {
  if (game.over || game.offer) return null;
  const done = slide(game.cells, game.size, dir);
  if (!done) return null;
  const { spec, seed, size } = game, moves = [...game.moves, dir], n = moves.length;
  let cells = done.cells, points = done.points, events = done.grown.length ? E_MERGE : 0;
  if (done.pulled.length) events |= E_PULL;
  const grownStages: number[] = done.grown.map(item => item.stage);
  let { crowCell, crowLeft, shadow, hailCell, hailAt, gustDir, gustAt, boost } = game;
  let crowLanded = -1, crowGone = -1, shooed = -1, hailHit: Game["hailHit"] = null, gust: Slide | null = null;
  const rained: number[] = [];

  // the crow that sat through this swipe counts down, then flies off
  if (crowLeft > 0 && --crowLeft === 0) { cells[crowCell] = 0; crowGone = crowCell; crowCell = -1; events |= E_FLY; }
  // a crow whose shadow was on the board lands, unless a plate is there now
  if (shadow >= 0) {
    if (cells[shadow] === 0) { cells[shadow] = CROW; crowCell = shadow; crowLeft = CROW_STAY; crowLanded = shadow; events |= E_CROW; }
    else { shooed = shadow; events |= E_SHOO; }
    shadow = -1;
  }
  // hail on its marked plate: one stage smaller, an আঁটি or a weed gone
  if (hailAt === n) {
    const from = cells[hailCell];
    if (from !== STONE && from !== CROW) {
      const to = from >= 2 ? from - 1 : 0;
      cells[hailCell] = to;
      hailHit = { cell: hailCell, from, to };
      events |= E_HAIL;
    }
    hailAt = 0; hailCell = -1;
  }
  // a gust slides everything once more, its way
  if (gustAt === n) {
    gust = slide(cells, size, gustDir as Dir);
    if (gust) { cells = gust.cells; points += gust.points; for (const item of gust.grown) grownStages.push(item.stage); if (gust.grown.length) events |= E_MERGE; if (gust.pulled.length) events |= E_PULL; }
    events |= E_GUST;
    gustAt = 0; gustDir = -1;
  }
  // rain: every আঁটি becomes a চারা
  if (spec.rain && n % spec.rain === 0) {
    for (let cell = 0; cell < cells.length; cell++) if (cells[cell] === 1) { cells[cell] = 2; rained.push(cell); grownStages.push(2); }
    events |= E_RAIN;
  }
  // the next drop: the old rule (one in eight a চারা), then a weed or সার on top of it
  let spawned = spawn(cells, seed, n + 1);
  if (spawned) {
    if (spec.weeds && roll(seed, "weed", n + 1)() < spec.weeds) spawned = { ...spawned, stage: WEED };
    else if (boost > 0 && spawned.stage === 1) { spawned = { ...spawned, stage: 2 }; boost--; }
    cells[spawned.cell] = spawned.stage;
  }

  const top = Math.max(game.top, topStage(cells)), peak = Math.max(game.peak, top);
  if (peak > game.peak) events |= E_PEAK;
  const pairs = done.grown.length + (gust?.grown.length ?? 0);
  const streak = done.grown.length ? game.streak + 1 : 0;
  const made = game.made + (spec.target ? grownStages.filter(stage => stage >= spec.target).length : 0);
  const swipePoints = done.points;
  const won = !!spec.target && (spec.legacy ? top >= spec.target : made >= spec.count);
  const limit = limitOf(spec, game.run.mode);
  const stuck = !canMove(cells, size);
  let over = won || stuck || (!!spec.target && n >= limit);
  const end: Game["end"] = won ? "goal" : stuck ? "full" : over ? "moves" : "";

  const next: Game = {
    ...game, cells, moves, score: game.score + points, top, peak, made, won, over, end, prev: strip(game),
    merges: game.merges + pairs, streak, bestStreak: Math.max(game.bestStreak, streak), pairs: game.pairs + done.pulled.length + (gust?.pulled.length ?? 0),
    bestSwipe: swipePoints > game.bestSwipe.points ? { points: swipePoints, at: n, pairs: done.grown.length } : game.bestSwipe,
    boost, hailCell, hailAt, gustDir, gustAt, shadow, crowCell, crowLeft,
    last: done, gust, spawned, rained, hailHit, crowLanded, crowGone, shooed, events: 0,
  };
  // মালির থলে: a new stage from মুকুল up in the garden. It waits even on a full bed (a কোদাল may free it).
  if (spec.offers && peak > game.peak && peak >= OFFER_STAGES[0] && peak <= OFFER_STAGES[OFFER_STAGES.length - 1] && !won) {
    next.offer = offerFor(next);
    next.over = false; next.end = "";
    over = false;
    events |= E_OFFER;
  }
  announce(next, n);
  next.events = events | (won ? E_WON : 0) | (over ? E_OVER : 0);
  return next;
}

/** ফেরত নাও: the board before the last swipe. The peak, the take-backs used and the offers stay as they are. */
export function takeBack(game: Game): Game | null {
  if (!game.prev || game.undos <= 0 || game.over || game.offer) return null;
  return {
    ...game.prev, prev: null, undos: game.undos - 1, undosUsed: game.undosUsed + 1, peak: game.peak,
    last: null, gust: null, spawned: null, rained: [], hailHit: null, crowLanded: -1, crowGone: -1, shooed: -1, events: E_UNDO,
  };
}

/** এখানেই থামো (the garden only): the run ends where it is. */
export function stopHere(game: Game): Game | null {
  if (game.run.kind !== "garden" || game.over || game.offer || !game.moves.length) return null;
  return { ...game, over: true, end: "stop", prev: null, events: E_OVER };
}

// ---- মালির থলে ----
const lowest = (cells: readonly number[], count: number) =>
  cells.map((stage, cell) => ({ stage, cell })).filter(({ stage }) => stage > 0 || stage === WEED)
    .sort((a, b) => (a.stage === WEED ? -1 : a.stage) - (b.stage === WEED ? -1 : b.stage) || a.cell - b.cell).slice(0, count).map(({ cell }) => cell);
export const emptyOf = (cells: readonly number[]) => cells.filter(cell => cell === 0).length;
export const seedsOf = (cells: readonly number[]) => cells.filter(cell => cell === 1).length;

/** The sensible pick for this board: room first, then a safety net, then rain on a bed of আঁটি, else সার. */
export function recommend(game: Game, options: readonly Offer[] = POOL): Offer {
  const wanted: Offer = emptyOf(game.cells) <= 3 ? "spade" : game.undos === 0 && game.run.mode !== "h" ? "undo" : seedsOf(game.cells) >= 4 ? "rain" : "manure";
  return options.includes(wanted) ? wanted : options.includes("spade") ? "spade" : options[0];
}
/** Three of the pool, never leaving out the recommended one. কঠিন has no take-backs, so no ফেরত. */
function offerFor(game: Game): Offer[] {
  const pool = POOL.filter(item => !(item === "undo" && game.run.mode === "h"));
  if (pool.length <= 3) return pool;
  const keep = recommend(game, pool), others = pool.filter(item => item !== keep);
  const drop = others[Math.floor(roll(game.seed, "offer", game.offers)() * others.length)];
  return pool.filter(item => item !== drop);
}
/** What a pick would do, as numbers before → after. */
export function offerEffect(game: Game, item: Offer): { from: number; to: number } {
  switch (item) {
    case "undo": return { from: game.undos, to: game.undos + 2 };
    case "manure": return { from: game.boost, to: game.boost + MANURE_DROPS };
    case "spade": { const empty = emptyOf(game.cells); return { from: empty, to: empty + lowest(game.cells, SPADE_LIFTS).length }; }
    default: { const seeds = seedsOf(game.cells); return { from: seeds, to: 0 }; }
  }
}
/** Takes option `index` (0–2) of the waiting offer. A pick can't be taken back. */
export function pickOffer(game: Game, index: number): Game | null {
  if (!game.offer || !Number.isInteger(index) || index < 0 || index >= game.offer.length) return null;
  const item = game.offer[index], cells = game.cells.slice();
  let { undos, boost } = game;
  const rained: number[] = [];
  if (item === "undo") undos += 2;
  else if (item === "manure") boost += MANURE_DROPS;
  else if (item === "spade") for (const cell of lowest(cells, SPADE_LIFTS)) cells[cell] = 0;
  else for (let cell = 0; cell < cells.length; cell++) if (cells[cell] === 1) { cells[cell] = 2; rained.push(cell); }
  const stuck = !canMove(cells, game.size);
  return {
    ...game, cells, undos, boost, offer: null, offers: game.offers + 1, picks: game.picks + String(POOL.indexOf(item)), prev: null,
    over: stuck, end: stuck ? "full" : "", last: null, gust: null, spawned: null, rained, hailHit: null, crowLanded: -1, crowGone: -1, shooed: -1,
    events: E_PICK | (item === "rain" ? E_RAIN : 0) | (stuck ? E_OVER : 0),
  };
}
/** The pick written in a link, as the option index of the waiting offer, or -1. */
export const pickIndexOf = (game: Game, digit: string) => game.offer ? game.offer.indexOf(POOL[Number(digit)] as Offer) : -1;

/**
 * Plays `dirs` from the start, applying `picks` (pool indices) at each offer. Null unless every move moves and every pick
 * is used exactly; a level must reach its goal on exactly the last move.
 */
export function playMoves(start: Game, dirs: readonly Dir[], picks = ""): Game | null {
  let game: Game | null = start, used = 0;
  const pickNow = () => {
    if (!game?.offer) return true;
    if (used >= picks.length) return false;
    const index = pickIndexOf(game, picks[used++]);
    game = index >= 0 ? pickOffer(game, index) : null;
    return game !== null;
  };
  for (const dir of dirs) {
    if (!pickNow()) return null;
    game = move(game!, dir);
    if (!game) return null;
  }
  if (used < picks.length && !pickNow()) return null;
  if (used !== picks.length) return null;
  if (start.spec.target && !game!.won) return null;
  return game;
}

/** Cleared level stars and whether it's the goal: for the HUD and the words. */
export const goalOf = (game: Game) => ({ stage: game.spec.target, count: game.spec.count, made: Math.min(game.made, game.spec.count) });
export const movesLeft = (game: Game) => game.spec.target ? Math.max(0, limitOf(game.spec, game.run.mode) - game.moves.length) : 0;
/** Danger: the last 5 moves of a level, or a bed with at most two empty plates and at most two swipes that move. */
export function danger(game: Game) {
  if (game.over || game.offer) return false;
  if (game.spec.target && movesLeft(game) <= 5) return true;
  if (emptyOf(game.cells) > 2) return false;
  let ways = 0;
  for (const dir of [0, 1, 2, 3] as Dir[]) if (slide(game.cells, game.size, dir)) ways++;
  return ways <= 2;
}

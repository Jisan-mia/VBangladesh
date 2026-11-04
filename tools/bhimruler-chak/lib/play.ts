// One round in the orchard: entering, clearing, গামছা, the hint, the stings the hornets forgive, winning and stars. Pure: the
// component renders this state and plays sounds; tests/bot.ts plays it headless.
import { starsFor } from "../../../shared/game-core";
import { flood, generate, lesson, proveSafe, watched, MANGO, type Lesson, type Orchard, type Via } from "./orchard";
import { levelOf } from "./levels";
import { legacyOrchard, legacySpec } from "./legacy";

export const COVERED = 0, OPEN = 1, TIED = 2, STUNG = 3;
export type Status = "ready" | "playing" | "won" | "lost";

/** What a round is laid from: a ladder level, or a level from before the rewrite (an old friend link). */
export type Puzzle = {
  level: number; legacy: boolean; seed: number; orchard: Orchard; fair: boolean;
  /** Seconds for three stars (twice that for two), and how many stings are forgiven before the swarm. */
  par: number; forgive: number;
};

export type Round = {
  puzzle: Puzzle;
  cells: Uint8Array;
  status: Status;
  hints: number;
  /** Nests you set off and lived (each a STUNG cell), and the last one hit. */
  stings: number;
  hit: number;
  /** Taps, ties and hints since entering (0 means you're still looking at the first opening). */
  moves: number;
  lesson: Lesson | null;
};

export type Move = { round: Round; opened: Array<[cell: number, ring: number]>; stung: number[]; lost: boolean; won: boolean };

/** The ladder's orchard for a level and a seed (or the old orchard an old link names). */
export function puzzleOf(level: number, seed: number, legacy = false, first = -1): Puzzle | null {
  if (legacy) {
    const spec = legacySpec(level);
    if (!spec || first < 0 || first >= spec.cols * spec.rows) return null;
    const { orchard, fair } = legacyOrchard(level, seed, first);
    return { level, legacy, seed, orchard, fair, par: spec.par, forgive: 0 };
  }
  const info = levelOf(level);
  if (!info) return null;
  const { orchard, fair } = generate(info, seed, { see: info.see, teach: level === 1 });
  return { level, legacy, seed, orchard, fair, par: info.par, forgive: info.forgive };
}

export const newRound = (puzzle: Puzzle): Round => ({
  puzzle, cells: new Uint8Array(puzzle.orchard.cols * puzzle.orchard.rows), status: "ready", hints: 0, stings: 0, hit: -1, moves: 0, lesson: null,
});

const openOf = (cells: Uint8Array) => cells.map(state => (state === OPEN ? 1 : 0));
export const openCount = (cells: Uint8Array) => cells.reduce((sum, state) => sum + (state === OPEN ? 1 : 0), 0);
export const tiedCount = (cells: Uint8Array) => cells.reduce((sum, state) => sum + (state === TIED || state === STUNG ? 1 : 0), 0);
export const safeCount = (o: Orchard) => o.cols * o.rows - o.nests;
/** Nests not yet under a গামছা (or stung): can go below zero if you tie too many. */
export const nestsLeft = (round: Round) => round.puzzle.orchard.nests - tiedCount(round.cells);

/** বাগানে ঢোকো: the path's bush opens with everything around it. Level 1 also finds its lesson in that opening. */
export function enter(round: Round): Move | null {
  if (round.status !== "ready") return null;
  const o = round.puzzle.orchard, cells = round.cells.slice(), open = new Uint8Array(cells.length);
  const opened = flood(o, open, o.start);
  for (const [cell] of opened) cells[cell] = OPEN;
  const teach = round.puzzle.level === 1 && !round.puzzle.legacy ? lesson(o, open) : null;
  // Never on a generated orchard (the generator leaves work after the entry); an old link's orchard could, so it counts.
  const won = openCount(cells) >= safeCount(o);
  if (won) for (let at = 0; at < cells.length; at++) if (o.nest[at]) cells[at] = TIED;
  return { round: { ...round, cells, status: won ? "won" : "playing", lesson: teach }, opened, stung: [], lost: false, won };
}

/**
 * A tap on a bush. A covered bush clears (a 0 opens everything it watches); a nest stings you, and the stings past what the
 * level forgives bring the swarm. Tapping a cleared number whose nests all have a গামছা clears its other bushes at once.
 * Null when the tap changes nothing (a tied bush, a mango, an unready number).
 */
export function dig(round: Round, cell: number): Move | null {
  if (round.status !== "playing" || cell < 0 || cell >= round.cells.length) return null;
  const o = round.puzzle.orchard, state = round.cells[cell];
  if (state === TIED || state === STUNG) return null;
  let targets = [cell];
  if (state === OPEN) {
    if (o.kind[cell] === MANGO || !o.count[cell]) return null;
    const around = watched(o, cell);
    let tied = 0;
    targets = [];
    for (const other of around) { if (round.cells[other] === TIED || round.cells[other] === STUNG) tied++; else if (round.cells[other] === COVERED) targets.push(other); }
    if (tied !== o.count[cell] || !targets.length) return null;
  }
  const cells = round.cells.slice(), open = openOf(cells), opened: Array<[number, number]> = [], stung: number[] = [];
  for (const target of targets) {
    if (o.nest[target]) { cells[target] = STUNG; stung.push(target); continue; }
    for (const pair of flood(o, open, target)) { cells[pair[0]] = OPEN; opened.push(pair); }
  }
  const stings = round.stings + stung.length, hit = stung.length ? stung[0] : round.hit, moves = round.moves + 1;
  if (stings > round.puzzle.forgive) return { round: { ...round, cells, stings, hit, moves, status: "lost" }, opened, stung, lost: true, won: false };
  const next = { ...round, cells, stings, hit, moves };
  if (openCount(cells) < safeCount(o)) return { round: next, opened, stung, lost: false, won: false };
  // Cleared: every nest left gets its গামছা.
  for (let at = 0; at < cells.length; at++) if (o.nest[at] && cells[at] === COVERED) cells[at] = TIED;
  return { round: { ...next, status: "won" }, opened, stung, lost: false, won: true };
}

/** Ties or unties a গামছা on a covered bush. */
export function tie(round: Round, cell: number): Round | null {
  if (round.status !== "playing" || cell < 0 || cell >= round.cells.length) return null;
  const state = round.cells[cell];
  if (state !== COVERED && state !== TIED) return null;
  const cells = round.cells.slice();
  cells[cell] = state === TIED ? COVERED : TIED;
  return { ...round, cells, moves: round.moves + 1 };
}

export type Hint = { cell: number; via: Via; clues: number[]; nests: number[] };

/** A bush logic proves safe from what is cleared now (your গামছা aren't trusted), with the numbers that prove it. */
export function findHint(round: Round): Hint | null {
  if (round.status !== "playing") return null;
  const o = round.puzzle.orchard, open = openOf(round.cells);
  const proved = round.puzzle.fair ? proveSafe(o, open) : null;
  if (proved && proved.cell >= 0) return proved;
  // Only for an orchard that isn't fully logical (never seen): any safe bush beside the cleared ground, else any safe bush.
  let fallback = -1;
  for (let cell = 0; cell < open.length; cell++) {
    if (open[cell] || o.nest[cell]) continue;
    if (neighbourOpen(o, open, cell)) return { cell, via: "single", clues: [], nests: [] };
    if (fallback < 0) fallback = cell;
  }
  return fallback >= 0 ? { cell: fallback, via: "single", clues: [], nests: [] } : null;
}
const neighbourOpen = (o: Orchard, open: Uint8Array, cell: number) => {
  const c = cell % o.cols, r = Math.floor(cell / o.cols);
  for (let dr = -1; dr <= 1; dr++) for (let dc = -1; dc <= 1; dc++) {
    const rr = r + dr, cc = c + dc;
    if (rr >= 0 && rr < o.rows && cc >= 0 && cc < o.cols && open[rr * o.cols + cc]) return true;
  }
  return false;
};

/** Takes the hint: unties a wrong গামছা on that bush if there is one, clears it, and counts the hint. */
export function takeHint(round: Round): (Move & { hint: Hint }) | null {
  const hint = findHint(round);
  if (!hint) return null;
  const cells = round.cells.slice();
  cells[hint.cell] = COVERED;
  const move = dig({ ...round, cells, hints: round.hints + 1 }, hint.cell);
  return move && { ...move, hint };
}

/** Wrong গামছা after a round: tied on a bush with no nest. */
export const wrongTies = (round: Round) => {
  const out: number[] = [];
  for (let cell = 0; cell < round.cells.length; cell++) if (round.cells[cell] === TIED && !round.puzzle.orchard.nest[cell]) out.push(cell);
  return out;
};

/** Level 1's three steps: 1 enter, 2 tie the lesson's nest, 3 clear the bushes it makes safe. 0 once done. */
export function lessonStep(round: Round) {
  if (round.puzzle.legacy || round.puzzle.level !== 1) return 0;
  if (round.status === "ready") return 1;
  const teach = round.lesson;
  if (round.status !== "playing" || !teach || teach.safe.every(cell => round.cells[cell] === OPEN)) return 0;
  return round.cells[teach.nest] === TIED || round.cells[teach.nest] === STUNG ? 3 : 2;
}

// ---- stars ----

export const twoStarTime = (par: number) => par * 2;

/** 3 stars within par, 2 within twice par, else 1. Each hint and each sting lowers the ceiling a star. */
export const starsEarned = (seconds: number, hints: number, stings: number, par: number) =>
  Math.max(1, Math.min(starsFor(seconds, par, twoStarTime(par), true), 3 - hints - stings));

/** What the next star needed, exactly: seconds to shave, and hints or stings to do without. Null at three stars. */
export function nextStar(seconds: number, hints: number, stings: number, par: number) {
  const stars = starsEarned(seconds, hints, stings, par);
  if (stars >= 3) return null;
  const goal = stars + 1, limit = goal === 3 ? par : twoStarTime(par), extra = Math.max(0, hints + stings - (3 - goal));
  return { goal, seconds: Math.max(0, seconds - limit), help: extra };
}

/** The stars the clock still allows right now (for the HUD's star track): time, hints and stings so far. */
export const onTrack = (seconds: number, hints: number, stings: number, par: number) => starsEarned(seconds, hints, stings, par);

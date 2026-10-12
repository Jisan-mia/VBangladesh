// One round in the orchard: tapping, গামছা marks, hints, winning and stars. Pure: the component only renders this state.
import { starsFor } from "../../../shared/game-core";
import { flood, generate, lesson, neighbours, solve, type Board } from "./board";
import { specOf, type Spec } from "./levels";

export const COVERED = 0, OPEN = 1, MARKED = 2;
export type Status = "ready" | "playing" | "won" | "lost";
export type Lesson = NonNullable<ReturnType<typeof lesson>>;
export type Game = {
  spec: Spec; seed: number; board: Board | null; fair: boolean; first: number;
  cells: Uint8Array; status: Status; hit: number; hints: number; lesson: Lesson | null;
};

export const newGame = (level: number, seed: number): Game => {
  const spec = specOf(level);
  return { spec, seed, board: null, fair: true, first: -1, cells: new Uint8Array(spec.cols * spec.rows), status: "ready", hit: -1, hints: 0, lesson: null };
};

/** The first tap lays the board around itself (so it is always safe and opens an area). Level 1 also gets its lesson. */
function laid(game: Game, first: number): Game {
  const { cols, rows, nests, level } = game.spec;
  const { board, fair } = generate(cols, rows, nests, game.seed, first, level === 1);
  let teach: Lesson | null = null;
  if (level === 1) { const open = new Uint8Array(cols * rows); flood(board, open, first); teach = lesson(board, open); }
  return { ...game, board, fair, first, status: "playing", lesson: teach };
}

const cleared = (board: Board, cells: Uint8Array) => cells.every((state, cell) => board.nest[cell] || state === OPEN);
export const openCount = (cells: Uint8Array) => cells.reduce((sum, state) => sum + (state === OPEN ? 1 : 0), 0);
export const markCount = (game: Game) => game.cells.reduce((sum, state) => sum + (state === MARKED ? 1 : 0), 0);
/** Nests not yet covered by a গামছা (can go below zero if you tie too many). */
export const marksLeft = (game: Game) => game.spec.nests - markCount(game);

export type Move = { game: Game; opened: Array<[cell: number, ring: number]>; boom: boolean };

/**
 * Taps a cell. A covered bush clears (and a 0 opens everything around it); a nest ends the round. Tapping an open number
 * whose nests all have a গামছা clears its other neighbours at once. Null when the tap changes nothing.
 */
export function dig(game: Game, cell: number): Move | null {
  if (game.status === "won" || game.status === "lost" || game.cells[cell] === MARKED || cell < 0 || cell >= game.cells.length) return null;
  const start = game.board ? game : laid(game, cell), board = start.board!;
  let targets = [cell];
  if (start.cells[cell] === OPEN) {
    const near = neighbours(board.cols, board.rows)[cell];
    const tied = near.filter(other => start.cells[other] === MARKED).length;
    targets = near.filter(other => start.cells[other] === COVERED);
    if (!board.count[cell] || tied !== board.count[cell] || !targets.length) return null;
  }
  const cells = start.cells.slice();
  const hit = targets.find(target => board.nest[target]);
  if (hit !== undefined) return { game: { ...start, cells, status: "lost", hit }, opened: [], boom: true };
  const opened = targets.flatMap(target => flood(board, cells, target));
  if (!cleared(board, cells)) return { game: { ...start, cells }, opened, boom: false };
  // Cleared: every nest left gets its গামছা.
  board.nest.forEach((nest, at) => { if (nest) cells[at] = MARKED; });
  return { game: { ...start, cells, status: "won" }, opened, boom: false };
}

/** Ties or unties a গামছা on a covered bush. Only once the board exists (after the first tap). */
export function toggleMark(game: Game, cell: number): Game | null {
  if (game.status !== "playing" || game.cells[cell] === OPEN || cell < 0 || cell >= game.cells.length) return null;
  const cells = game.cells.slice();
  cells[cell] = cells[cell] === MARKED ? COVERED : MARKED;
  return { ...game, cells };
}

/** A bush that logic proves safe from what's open now (your গামছা marks aren't trusted). */
export function safeHint(game: Game) {
  if (game.status !== "playing" || !game.board) return -1;
  const board = game.board, open = game.cells.map(state => (state === OPEN ? 1 : 0));
  const proved = game.fair ? solve(board, open, true).firstSafe : -1;
  if (proved >= 0) return proved;
  // Only for a board that isn't fully logical (never seen): any safe bush next to the open area, else any safe bush.
  const near = neighbours(board.cols, board.rows);
  let fallback = -1;
  for (let cell = 0; cell < open.length; cell++) {
    if (open[cell] || board.nest[cell]) continue;
    if (near[cell].some(other => open[other])) return cell;
    if (fallback < 0) fallback = cell;
  }
  return fallback;
}

/** Opens the hinted bush (untying a wrong গামছা first) and counts the hint. */
export function takeHint(game: Game): (Move & { cell: number }) | null {
  const cell = safeHint(game);
  if (cell < 0) return null;
  const untied = { ...game, cells: game.cells.slice(), hints: game.hints + 1 };
  untied.cells[cell] = COVERED;
  const move = dig(untied, cell);
  return move && { ...move, cell };
}

/** Wrong গামছা after a round: tied on a bush with no nest. */
export const wrongMarks = (game: Game) => game.board ? [...game.cells.keys()].filter(cell => game.cells[cell] === MARKED && !game.board!.nest[cell]) : [];

/** Level 1's three steps: 1 tap anywhere, 2 tie the lesson's nest, 3 clear the bushes that nest makes safe. 0 once done. */
export function lessonStep(game: Game) {
  if (game.spec.level !== 1) return 0;
  if (game.status === "ready") return 1;
  const teach = game.lesson;
  if (game.status !== "playing" || !teach || teach.safe.every(cell => game.cells[cell] === OPEN)) return 0;
  return game.cells[teach.nest] === MARKED ? 3 : 2;
}

// ---- stars ----

export const twoStarTime = (par: number) => par * 2;

/** 3 stars within par, 2 within twice par, else 1. Each hint lowers the ceiling a star (one hint: at most 2). */
export const starsEarned = (seconds: number, hints: number, par: number) =>
  Math.max(1, Math.min(starsFor(seconds, par, twoStarTime(par), true), 3 - hints));

/** What the next star needed, exactly: seconds to shave and hints to skip. Null at three stars. */
export function nextStar(seconds: number, hints: number, par: number) {
  const stars = starsEarned(seconds, hints, par);
  if (stars >= 3) return null;
  const goal = stars + 1, limit = goal === 3 ? par : twoStarTime(par);
  return { goal, seconds: Math.max(0, seconds - limit), hints: Math.max(0, hints - (3 - goal)) };
}

/** Where a visit starts: the first open level not yet at three stars (level 1 for a new player). */
export function startLevel(stars: Record<number, number>, unlocked: number) {
  for (let level = 1; level <= unlocked; level++) if ((stars[level] ?? 0) < 3) return level;
  return unlocked;
}

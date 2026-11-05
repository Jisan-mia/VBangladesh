// A round of দাঁড়িপাল্লা as one mutable Run: the pans, what the child put on, the pace, the stars. Everything that happens on its
// own (the balanced moment's hold, the end screen's wait, the idle ghost finger) runs on the page's fixed-step clock (clock.hot.ts),
// so a pause or a blur stops it with no timers. Deterministic: the seed picks every pan (makeRng only).
import { makeRng } from "../../../shared/game-core";
import { levelOf, starsOf } from "./levels";
import { fewestPieces, makePuzzle, PAN_MAX, sum, type FruitId, type Pace, type Piece, type Puzzle } from "./puzzle";

/** How long a level pan holds before পরের পাল্লা appears, and before a finished round shows its end page. */
export const HOLD_MS = 900;
export const END_MS = 1800;
/** The question after a weighing waits this long, so the balanced pan is seen first. */
export const ASK_MS = 600;
export const IDLE_MS = 8000;
/** A piece flies to the pan this long; the pan feels it land at the end. */
export const FLY_MS = 220;

export const ST = { BALANCE: 0, ASK: 1, DONE: 2 } as const;
export type Stage = 0 | 1 | 2;
/** Events the page reads after a press or a step. */
export const EV = { DONE: 1, WON: 2, READY: 3, CARD: 4, IDLE: 5 } as const;
export type Outcome = "ignore" | "full" | "added" | "over" | "removed" | "level" | "right" | "again";

export type Run = {
  level: number; seed: number; index: number; puzzle: Puzzle; pace: Pace;
  /** Pieces the child put on the right pan, in order. */
  added: Piece[];
  stage: Stage;
  /** The ★ value being tried (guess), or the fruit's answer once found. */
  guess: number | null;
  tries: number; clean: boolean; missRun: number; cleanRun: number;
  misses: number; solved: number; exact: number;
  /** Degrees the beam should lean now: positive lowers the right pan. */
  tilt: number;
  /** ms since the pan was level (stage DONE) or since the weighing ended (stage ASK). */
  holdT: number;
  /** The question's numbers may be tapped / পরের পাল্লা may be pressed. */
  askReady: boolean; ready: boolean;
  /** The last pan is level: the round is won, stars set, the end page comes after END_MS. */
  over: boolean; ended: boolean; endT: number; stars: number;
  idleT: number;
  nev: number; evs: Int8Array;
};

export function push(run: Run, code: number) { if (run.nev < run.evs.length) run.evs[run.nev++] = code; }

const puzzleRng = (seed: number, index: number) => makeRng(seed + index * 7919);
const firstFruit = (puzzle: Puzzle): FruitId | undefined => { const piece = puzzle.left.find(each => each.kind === "fruit"); return piece?.kind === "fruit" ? piece.fruit : undefined; };
export const startStage = (puzzle: Puzzle): Stage => (puzzle.kind === "guess" ? ST.ASK : ST.BALANCE);

export function newRun(level: number, seed: number): Run {
  const puzzle = makePuzzle(level, 0, puzzleRng(seed, 0), 0);
  const run: Run = {
    level, seed, index: 0, puzzle, pace: 0, added: [], stage: startStage(puzzle), guess: null, tries: 0, clean: true, missRun: 0, cleanRun: 0,
    misses: 0, solved: 0, exact: 0, tilt: 0, holdT: 0, askReady: puzzle.kind === "guess", ready: false, over: false, ended: false, endT: 0, stars: 0, idleT: 0,
    nev: 0, evs: new Int8Array(16),
  };
  run.tilt = tiltFor(run);
  return run;
}

/** Left and right totals as they weigh now. A picture equation's ★ weighs what is being tried; before a try the pan is held level. */
export function totals(run: Run) {
  const { puzzle } = run;
  if (puzzle.kind === "guess") {
    const right = sum(puzzle.start);
    if (run.guess === null) return { left: right, right };
    return { left: puzzle.left.reduce((total, piece) => total + (piece.kind === "star" ? run.guess! : piece.value), 0), right };
  }
  return { left: sum(puzzle.left), right: sum(puzzle.start) + sum(run.added) };
}

/** The beam's tilt in degrees: a difference of 1 still shows; big ones level off at 14°. */
export const MAX_TILT = 14;
export function tiltFor(run: Run) {
  const { left, right } = totals(run);
  return MAX_TILT * Math.tanh((right - left) / 3);
}

function miss(run: Run) {
  const missRun = run.missRun + 1, down = missRun >= 3;
  run.misses += 1; run.clean = false; run.cleanRun = 0;
  run.missRun = down ? 0 : missRun;
  if (down) run.pace = Math.max(-1, run.pace - 1) as Pace;
}

/** The pan is done. The last one wins the round at this very moment: the page saves its stars now, not after a delay. */
function finishPan(run: Run) {
  run.cleanRun = run.clean ? run.cleanRun + 1 : 0;
  if (run.cleanRun >= 5) { run.cleanRun = 0; run.pace = Math.min(1, run.pace + 1) as Pace; }
  if (run.clean) { run.exact += 1; run.missRun = 0; }
  run.solved += 1; run.stage = ST.DONE; run.holdT = 0; run.ready = false;
  push(run, EV.DONE);
  if (run.index + 1 >= levelOf(run.level).puzzles) { run.over = true; run.endT = END_MS; run.stars = starsOf(run.misses); push(run, EV.WON); }
}

/** A weighing that ends level: a filled pan is done; an unknown is asked about next. */
function balanced(run: Run) {
  if (run.puzzle.kind === "find") { run.stage = ST.ASK; run.holdT = 0; run.askReady = false; } else finishPan(run);
}

const touched = (run: Run) => { run.idleT = 0; };

/** Puts tray piece `index` on the child's pan. Going past the other side on a puzzle with a known target is a miss. */
export function put(run: Run, index: number): Outcome {
  const piece = run.puzzle.tray[index];
  if (run.stage !== ST.BALANCE || !piece) return "ignore";
  touched(run);
  if (run.puzzle.start.length + run.added.length >= PAN_MAX) return "full";
  const before = totals(run);
  run.added.push(piece);
  const after = totals(run);
  run.tilt = tiltFor(run);
  if (after.right === after.left) { balanced(run); return "level"; }
  // Only crossing over counts as a miss; adding more to a pan that's already heavy just repeats the hint.
  if (after.right > after.left && before.right <= before.left && run.puzzle.kind === "fill") miss(run);
  return after.right > after.left ? "over" : "added";
}

/** Takes the piece last put on the pan off. Fixed pieces never come off. */
export function lift(run: Run): Outcome {
  if (run.stage !== ST.BALANCE || run.added.length === 0) return "ignore";
  touched(run);
  run.added.pop();
  run.tilt = tiltFor(run);
  const after = totals(run);
  if (after.right === after.left) { balanced(run); return "level"; }
  return "removed";
}

/** A number tapped: the fruit's weight (find), or a try for ★ (guess). Two wrong tries make the right one glow. */
export function choose(run: Run, value: number): Outcome {
  if (run.stage !== ST.ASK || !run.askReady || !run.puzzle.choices.includes(value)) return "ignore";
  touched(run);
  if (value === run.puzzle.answer) { run.guess = value; run.tilt = tiltFor(run); finishPan(run); return "right"; }
  run.tries += 1; miss(run);
  if (run.puzzle.kind === "guess") { run.guess = value; run.tilt = tiltFor(run); }
  return "again";
}
export const glows = (run: Run) => run.tries >= 2;

/** The next pan of the round. Only once the level pan has held, and never on the last pan: a round never moves on to a level by itself. */
export function next(run: Run): boolean {
  if (run.stage !== ST.DONE || !run.ready || run.over) return false;
  const index = run.index + 1, puzzle = makePuzzle(run.level, run.pace, puzzleRng(run.seed, index), index, firstFruit(run.puzzle));
  run.index = index; run.puzzle = puzzle; run.added = []; run.stage = startStage(puzzle); run.guess = null; run.tries = 0; run.clean = true;
  run.askReady = puzzle.kind === "guess"; run.ready = false; run.holdT = 0; run.idleT = 0; run.tilt = tiltFor(run);
  return true;
}

/** Where the ghost finger points: the next useful tray piece, the piece to lift off, or the right number. */
export function hint(run: Run): { tray: number } | { pan: number } | { choice: number } | null {
  if (run.stage === ST.ASK) return run.askReady ? { choice: run.puzzle.answer } : null;
  if (run.stage !== ST.BALANCE) return null;
  const { left, right } = totals(run), missing = left - right;
  if (missing < 0) return { pan: run.added.length - 1 };
  const values = run.puzzle.tray.map(piece => piece.value);
  // The biggest piece that still leaves a reachable rest.
  const best = values.map((value, index) => ({ value, index })).filter(({ value }) => value <= missing && fewestPieces(missing - value, values) < Infinity).sort((a, b) => b.value - a.value)[0];
  return best ? { tray: best.index } : null;
}

export type Result = { level: number; stars: number; solved: number; exact: number; misses: number };
export const resultOf = (run: Run): Result => ({ level: run.level, stars: run.stars, solved: run.solved, exact: run.exact, misses: run.misses });

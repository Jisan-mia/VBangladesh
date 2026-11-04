// One round, as pure rules: stitching with refusal (a wrong cell is never kept), locked stitches, undo, the hint, the
// line counts, and how big the board can be. The component feeds it fingers; tests replay every path against it.
import { applyHint, doneLines, isSolved, mistakes, newGame, puzzleOf, starsFor, undo as undoGame, type Game, type Mark } from "./game";
import { givenOf } from "./levels";

export type Play = Game & {
  /** Cells নানি already stitched: locked, part of the picture. */
  given: readonly number[];
  /** Fills placed, including ones wiped again. */
  stitches: number;
  /** The most cells one drag filled. */
  longest: number;
};

export function startPlay(level: number): Play {
  const base = newGame(level), given = givenOf(level), cells = base.cells.slice();
  for (const index of given) cells[index] = 1;
  return { ...base, cells, given, stitches: 0, longest: 0 };
}

export type Stitched = {
  play: Play;
  /** Cells that changed. */
  moved: number;
  /** The cell that was refused (a fill outside the picture, a ✕ inside it), or -1. */
  refused: number;
  /** True when that refusal was the first on this cell, so it counts as a mistake. */
  mistake: boolean;
};

/**
 * Sets `to` on these cells, in order. The first cell that contradicts the picture is refused: it stays as it was, the
 * mistake is counted once for that cell, and the rest of the cells are not touched (the thread snaps). Locked stitches
 * are skipped. `record` saves one undo step for the whole stroke; `strokeSoFar` is how many cells this drag had filled
 * before this call, for the longest-drag stat.
 */
export function stitch(play: Play, indices: readonly number[], to: Mark, record: boolean, strokeSoFar = 0): Stitched {
  if (isSolved(play)) return { play, moved: 0, refused: -1, mistake: false };
  const { solution } = puzzleOf(play.level), cells = play.cells.slice(), locked = play.given;
  let moved = 0, filled = 0, refused = -1, mistake = false, wrong = play.wrong;
  for (const index of indices) {
    if (!Number.isInteger(index) || index < 0 || index >= cells.length || cells[index] === to || locked.includes(index)) continue;
    if ((to === 1 && !solution[index]) || (to === 2 && solution[index])) {
      refused = index;
      if (!wrong.includes(index)) { wrong = [...wrong, index]; mistake = true; }
      break;
    }
    cells[index] = to;
    moved++;
    if (to === 1) filled++;
  }
  if (!moved && refused < 0) return { play, moved: 0, refused: -1, mistake: false };
  const next: Play = moved
    ? { ...play, cells, wrong, stitches: play.stitches + filled, longest: Math.max(play.longest, to === 1 ? strokeSoFar + filled : 0), history: record ? [...play.history, play.cells].slice(-200) : play.history }
    : { ...play, wrong };
  return { play: next, moved, refused, mistake };
}

/** The cells a stroke covers, from where it started towards the cell under the finger, along the start's row or column. */
export function strokeOrder(size: number, start: number, current: number, axis: "row" | "col") {
  const out: number[] = [], startRow = Math.floor(start / size), startCol = start % size;
  const to = axis === "row" ? current % size : Math.floor(current / size), from = axis === "row" ? startCol : startRow;
  const step = to >= from ? 1 : -1;
  for (let at = from; at !== to + step; at += step) out.push(axis === "row" ? startRow * size + at : at * size + startCol);
  return out;
}

export function takeBack(play: Play): Play {
  const back = undoGame(play);
  return back === play ? play : { ...play, cells: back.cells, history: back.history };
}

export function giveHint(play: Play) {
  const helped = applyHint(play);
  return helped ? { play: { ...play, cells: helped.game.cells, history: helped.game.history, hints: helped.game.hints, wrong: helped.game.wrong }, index: helped.index } : null;
}

export const linesTotal = (level: number) => puzzleOf(level).size * 2;
export const linesDone = (play: Game) => doneLines(play);
export const stars = (play: Game) => starsFor(mistakes(play), play.hints > 0);
/** How many more mistakes until a star falls (0: the next one costs a star); null at the last star. */
export function mistakesToDrop(play: Game): number | null {
  const wrong = mistakes(play), hinted = play.hints > 0, earned = starsFor(wrong, hinted);
  if (earned <= 1) return null;
  if (earned === 3) return 1;
  return Math.max(1, 3 - wrong);
}

/**
 * The biggest cell that lets the whole board (clues and cells, inside the cloth's padding) fit `width` × `height`,
 * between 16 and 56 px. The clue size follows the cell size.
 */
export function fitBoard(width: number, height: number, size: number, rowClues: number, colClues: number) {
  const padX = 20, padY = 22;
  const measure = (cell: number) => {
    const font = Math.max(11, Math.min(18, Math.round(cell * 0.46)));
    const clueW = Math.ceil(rowClues * font * 0.95 + 14), clueH = Math.ceil(colClues * font * 1.18 + 8);
    return { cell, font, clueW, clueH, w: clueW + size * cell + (size - 1) + padX, h: clueH + size * cell + (size - 1) + padY };
  };
  let fit = measure(16);
  for (let cell = 56; cell >= 16; cell--) {
    const got = measure(cell);
    if (got.w <= width && got.h <= height) { fit = got; break; }
  }
  return { cell: fit.cell, font: fit.font, clueW: fit.clueW, clueH: fit.clueH, width: fit.w, height: fit.h };
}

// One round as pure data: the table (game.ts) plus the stats the end screen counts up, and the one function that
// decides what a drop does. The component only feeds it board points and plays back what it says.
import { cellAt, fitsCut, frameDone, isDone, isUpright, judgeDrop, makePuzzle, placePiece, reslot, startTable, turnPiece, type Puzzle, type Table } from "./game";

export type Play = {
  puzzle: Puzzle;
  table: Table;
  /** Drops that missed (a wrong cell, or the right cell still turned). */
  wrong: number;
  /** The current run of right drops, and the longest one. */
  streak: number;
  best: number;
  /** Quarter turns made. */
  turned: number;
};

export function startPlay(level: number, slots: number): Play {
  const puzzle = makePuzzle(level);
  return { puzzle, table: startTable(puzzle, slots), wrong: 0, streak: 0, best: 0, turned: 0 };
}

/**
 * What a drop did:
 * - snap: home and upright, the piece is in;
 * - turn: home but still turned;
 * - fits: another empty cell whose knobs fit (only the picture is wrong);
 * - wrong: an empty cell with other knobs, or a filled one;
 * - away: off the board (back to the tray, no mistake);
 * - none: nothing to drop (already in, or not on the table).
 */
export type Landed = "snap" | "turn" | "fits" | "wrong" | "away" | "none";
export type Dropped = { play: Play; landed: Landed; cell: number; done: boolean; frame: boolean };

export function dropPiece(play: Play, id: number, x: number, y: number, size: number): Dropped {
  const { table, puzzle } = play, n = puzzle.n;
  if (id < 0 || id >= table.placed.length || table.placed[id] || isDone(table)) return { play, landed: "none", cell: -1, done: isDone(table), frame: false };
  const judged = judgeDrop(n, id, table.turns[id], x, y, size), cell = cellAt(n, x, y, size);
  if (judged === "snap") {
    const next = placePiece(table, id), streak = play.streak + 1;
    return {
      play: { ...play, table: next, streak, best: Math.max(play.best, streak) },
      landed: "snap", cell: id, done: isDone(next), frame: !frameDone(table, n) && frameDone(next, n),
    };
  }
  if (judged === "away") return { play: { ...play, streak: 0 }, landed: "away", cell: -1, done: false, frame: false };
  const landed: Landed = judged === "turn" ? "turn" : cell >= 0 && !table.placed[cell] && fitsCut(puzzle.edges, n, id, table.turns[id], cell) ? "fits" : "wrong";
  return { play: { ...play, streak: 0, wrong: play.wrong + 1 }, landed, cell: judged === "turn" ? id : cell, done: false, frame: false };
}

/** A quarter turn clockwise, on a turned level only. */
export function turnOne(play: Play, id: number): Play {
  if (!play.puzzle.rotate || id < 0 || play.table.placed[id]) return play;
  return { ...play, table: turnPiece(play.table, id), turned: play.turned + 1 };
}

export const upright = (play: Play, id: number) => isUpright(play.table.turns[id]);
export const left = (play: Play) => play.table.placed.filter(placed => !placed).length;
export const resize = (play: Play, slots: number): Play => (play.table.slots.length === slots ? play : { ...play, table: reslot(play.table, slots) });

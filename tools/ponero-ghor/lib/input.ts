// Setup for the hot drag code: the one drag object (made once, mutated by drag.hot.ts), and which ঘুঁটি a press would move.
import { lineTo, type Board, type Dir } from "./board";

export type Drag = {
  /** The pointer's id, or -1 when nothing is held. */
  id: number;
  cell: number;
  /** 0: the line moves along x, 1: along y, -1: the press isn't in the gap's line. */
  axis: number;
  /** +1 or -1: the way the line moves toward the gap, in screen terms. */
  sign: number;
  count: number;
  x0: number; y0: number; x: number; y: number;
  offset: number; lastOffset: number; lastT: number; speed: number; moved: number;
};

export const makeDrag = (): Drag => ({ id: -1, cell: -1, axis: -1, sign: 1, count: 0, x0: 0, y0: 0, x: 0, y: 0, offset: 0, lastOffset: 0, lastT: 0, speed: 0, moved: 0 });

/** The line a press on `cell` would drag: its axis, the way it moves, and the cells of the ঘুঁটি in it (nearest the gap last). */
export function lineOf(board: Board, cell: number): { axis: 0 | 1; sign: 1 | -1; cells: number[]; steps: Dir[] } | null {
  const steps = lineTo(board, cell);
  if (!steps) return null;
  const { size, gap } = board;
  const sameRow = Math.floor(cell / size) === Math.floor(gap / size);
  const stride = sameRow ? 1 : size, sign: 1 | -1 = cell < gap ? 1 : -1;
  const cells: number[] = [];
  for (let at = cell; at !== gap; at += stride * sign) cells.push(at);
  return { axis: sameRow ? 0 : 1, sign, cells, steps };
}

/** Which cell a point falls in, given the plate's well box; -1 outside it. */
export function cellAt(size: number, x: number, y: number, left: number, top: number, width: number, height: number) {
  const col = Math.floor(((x - left) / width) * size), row = Math.floor(((y - top) / height) * size);
  return col < 0 || col >= size || row < 0 || row >= size ? -1 : row * size + col;
}

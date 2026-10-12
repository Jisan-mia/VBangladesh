// Jigsaw outlines: one bezier knob per shared side, traced onto any canvas-like context. Pure (no DOM), so tests can trace onto a recorder.
import { sidesOf, type Edges } from "./game";

/** How far a tab reaches past the cell edge, and the room each piece's canvas keeps around its cell, in cells. */
export const TAB = 0.235;
export const MARGIN = 0.26;
/** A piece's canvas side, in cells. */
export const SPAN = 1 + 2 * MARGIN;

type Point = readonly [number, number];
// One side from (0,0) to (1,0); v points out of the piece. A narrow neck, then a round head.
const KNOB: readonly (readonly Point[])[] = [
  [[0.37, 0]],
  [[0.41, 0], [0.43, 0.04], [0.41, 0.08]],
  [[0.33, 0.14], [0.36, TAB], [0.5, TAB]],
  [[0.64, TAB], [0.67, 0.14], [0.59, 0.08]],
  [[0.57, 0.04], [0.59, 0], [0.63, 0]],
  [[1, 0]],
];

export type Tracer = {
  moveTo(x: number, y: number): void;
  lineTo(x: number, y: number): void;
  bezierCurveTo(ax: number, ay: number, bx: number, by: number, x: number, y: number): void;
  closePath(): void;
};

/** Traces the outline of the piece for `cell`, with its cell's top-left at (x, y) and cells `size` wide. Clockwise from the top-left corner. */
export function tracePiece(context: Tracer, edges: Edges, n: number, cell: number, x: number, y: number, size: number) {
  const sides = sidesOf(edges, n, cell);
  const corners: Point[] = [[x, y], [x + size, y], [x + size, y + size], [x, y + size]];
  context.moveTo(x, y);
  sides.forEach((side, index) => {
    const [ax, ay] = corners[index], [bx, by] = corners[(index + 1) % 4];
    const dx = (bx - ax) / size, dy = (by - ay) / size;
    // Clockwise on a y-down screen, "out" is the direction turned a quarter to the left.
    const at = ([u, v]: Point) => [ax + size * (u * dx + v * side * dy), ay + size * (u * dy - v * side * dx)] as const;
    if (!side) { context.lineTo(bx, by); return; }
    for (const segment of KNOB) {
      if (segment.length === 1) context.lineTo(...at(segment[0]));
      else { const [p, q, r] = segment.map(at); context.bezierCurveTo(p[0], p[1], q[0], q[1], r[0], r[1]); }
    }
  });
  context.closePath();
}

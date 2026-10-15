// The dig: a 360×240 sand box on a coarse grid. Brushing clears cells; a bone is found once most of the sand over it is gone.
import { makeRng, pick } from "../../../shared/game-core";
import type { BoneKind } from "./art";

export const DIG = { width: 360, height: 240, cell: 10 } as const;
export const COLS = DIG.width / DIG.cell, ROWS = DIG.height / DIG.cell;
/** A finger stroke clears this radius; a tap clears a bigger circle, so two or three taps find a bone. A key press (no finger) clears more. */
export const BRUSH_R = 22, TAP_R = 28, KEY_R = 40;
/** How much of a bone's sand must be gone before it lifts out. */
export const FOUND_AT = 0.75;
const HALF = { w: 36, h: 24 };

export type Buried = { kind: BoneKind; x: number; y: number; rot: number };
export type Sand = Uint8Array;

export const freshSand = (): Sand => new Uint8Array(COLS * ROWS);

/** Clears every cell whose centre lies within r of (x, y). Returns a new grid. */
export function brush(sand: Sand, x: number, y: number, r: number): Sand {
  const next = sand.slice();
  const c0 = Math.max(0, Math.floor((x - r) / DIG.cell)), c1 = Math.min(COLS - 1, Math.floor((x + r) / DIG.cell));
  const r0 = Math.max(0, Math.floor((y - r) / DIG.cell)), r1 = Math.min(ROWS - 1, Math.floor((y + r) / DIG.cell));
  for (let row = r0; row <= r1; row++) for (let col = c0; col <= c1; col++) {
    const cx = (col + 0.5) * DIG.cell, cy = (row + 0.5) * DIG.cell;
    if ((cx - x) ** 2 + (cy - y) ** 2 <= r * r) next[row * COLS + col] = 1;
  }
  return next;
}

/** Share of the sand cleared over a bone (its box is about 60×44). */
export function uncovered(sand: Sand, bone: Pick<Buried, "x" | "y">) {
  let cells = 0, clear = 0;
  for (let row = 0; row < ROWS; row++) for (let col = 0; col < COLS; col++) {
    const cx = (col + 0.5) * DIG.cell, cy = (row + 0.5) * DIG.cell;
    if (Math.abs(cx - bone.x) <= HALF.w && Math.abs(cy - bone.y) <= HALF.h) { cells++; clear += sand[row * COLS + col]; }
  }
  return cells ? clear / cells : 0;
}

const SPOTS: readonly (readonly [number, number])[] = [[70, 62], [182, 56], [292, 66], [122, 124], [242, 124], [70, 186], [182, 190], [292, 184]];

/** Where this round's bones lie: one per spot, spots and tilts from a seed, never two in one place. */
export function buryBones(kinds: readonly BoneKind[], seed: number): Buried[] {
  const rng = makeRng(seed), spots = [...SPOTS];
  for (let i = spots.length - 1; i > 0; i--) { const j = pick(rng, i + 1); [spots[i], spots[j]] = [spots[j], spots[i]]; }
  return kinds.map((kind, index) => {
    const [x, y] = spots[index % spots.length];
    return { kind, x: x + pick(rng, 13) - 6, y: y + pick(rng, 9) - 4, rot: pick(rng, 51) - 25 };
  });
}

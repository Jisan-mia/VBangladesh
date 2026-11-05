// The brush, per pointer move: allocation-free. It takes strokes into the pit's cells and says what just showed.
import { BONE_HALF, COLS, coverage, DECOY_HALF, FOUND_AT, PIT, ROWS, type Pit } from "./pit";

/**
 * One brush stamp at (x, y) with radius r, as part of stroke number `stroke`. A cell takes one stroke per stroke number, so deep
 * sand (depth 2) needs the child to lift the finger and brush it again. Rocks take nothing. Fills pit.changed / pit.fresh*.
 * Returns how many cells took a stroke.
 */
export function stamp(pit: Pit, x: number, y: number, r: number, stroke: number): number {
  const cell = PIT.cell;
  const c0 = Math.max(0, Math.floor((x - r) / cell)), c1 = Math.min(COLS - 1, Math.floor((x + r) / cell));
  const r0 = Math.max(0, Math.floor((y - r) / cell)), r1 = Math.min(ROWS - 1, Math.floor((y + r) / cell));
  const r2 = r * r;
  pit.nChanged = 0; pit.nFreshBone = 0; pit.nFreshDecoy = 0; pit.hitRock = false; pit.sx = x; pit.sy = y; pit.sr = r;
  for (let row = r0; row <= r1; row++) {
    for (let col = c0; col <= c1; col++) {
      const dx = (col + 0.5) * cell - x, dy = (row + 0.5) * cell - y;
      if (dx * dx + dy * dy > r2) continue;
      const i = row * COLS + col;
      if (pit.blocked[i] === 1) { pit.hitRock = true; continue; }
      const have = pit.cells[i];
      if (have >= pit.depth || (have > 0 && pit.last[i] === stroke)) continue;
      pit.cells[i] = have + 1; pit.last[i] = stroke;
      pit.changed[pit.nChanged] = i; pit.changedTo[pit.nChanged] = have + 1; pit.nChanged++;
    }
  }
  if (pit.nChanged === 0) return 0;
  for (let b = 0; b < pit.bones.length; b++) {
    if (pit.foundBone[b] === 1) continue;
    const bone = pit.bones[b];
    if (Math.abs(bone.x - x) > r + BONE_HALF.w || Math.abs(bone.y - y) > r + BONE_HALF.h) continue;
    if (coverage(pit, bone.x, bone.y, BONE_HALF.w, BONE_HALF.h) >= FOUND_AT) { pit.foundBone[b] = 1; pit.freshBone[pit.nFreshBone++] = b; }
  }
  for (let d = 0; d < pit.decoys.length; d++) {
    if (pit.foundDecoy[d] === 1) continue;
    const decoy = pit.decoys[d];
    if (Math.abs(decoy.x - x) > r + DECOY_HALF.w || Math.abs(decoy.y - y) > r + DECOY_HALF.h) continue;
    if (coverage(pit, decoy.x, decoy.y, DECOY_HALF.w, DECOY_HALF.h) >= FOUND_AT) { pit.foundDecoy[d] = 1; pit.freshDecoy[pit.nFreshDecoy++] = d; }
  }
  return pit.nChanged;
}

/**
 * A stroke from (x0, y0) to (x1, y1): stamps every 5 units along it so a quick swipe leaves a clean path, and calls `after(pit)` once
 * per stamp that changed something (so the caller can paint exactly those cells and see what just showed). Returns the total cells changed.
 */
export function sweep(pit: Pit, x0: number, y0: number, x1: number, y1: number, r: number, stroke: number, after: (pit: Pit) => void): number {
  const length = Math.hypot(x1 - x0, y1 - y0), steps = Math.max(1, Math.ceil(length / 5));
  let total = 0;
  for (let s = 1; s <= steps; s++) {
    const t = s / steps, changed = stamp(pit, x0 + (x1 - x0) * t, y0 + (y1 - y0) * t, r, stroke);
    total += changed;
    if (changed > 0 || pit.hitRock) after(pit);
  }
  return total;
}

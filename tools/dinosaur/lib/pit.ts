// The pit: a 360×320 box of sand on a 5-unit grid. Bones, rocks and not-bones lie under it, placed from a seed.
// The pure data and the placement live here; the per-stroke arithmetic (allocation-free) is in pit.hot.ts.
import { makeRng, pick } from "../../../shared/game-core";
import type { BoneKind } from "./art";
import { DECOY_KINDS, type DecoyKind } from "./things";

export const PIT = { width: 360, height: 320, cell: 5 } as const;
export const COLS = PIT.width / PIT.cell, ROWS = PIT.height / PIT.cell;
/** A finger stroke clears this radius; a tap a bigger circle; a key press (no finger) the biggest. */
export const BRUSH_R = 22, TAP_R = 28, KEY_R = 40;
/** How much of an object's sand must be gone before it shows. */
export const FOUND_AT = 0.75;
export const BONE_HALF = { w: 36, h: 24 } as const;
export const DECOY_HALF = { w: 22, h: 17 } as const;
export const MAX_BONES = 6, MAX_DECOYS = 3;

export type Buried = { kind: BoneKind; x: number; y: number; rot: number };
export type Rock = { x: number; y: number; r: number; rot: number };
export type Decoy = { kind: DecoyKind; x: number; y: number; rot: number };

/** What one pit holds. `depth` is how many separate strokes a patch of sand needs: 1, or 2 for deep sand. */
export type PitSpec = { depth: 1 | 2; rocks: number; decoys: number };

export type Pit = {
  depth: 1 | 2;
  bones: Buried[]; rocks: Rock[]; decoys: Decoy[];
  /** Per 5-unit cell: strokes so far (0..depth), the stroke that made the last one, and 1 under a rock. */
  cells: Uint8Array; last: Uint16Array; blocked: Uint8Array;
  /** 1 once a bone or a not-bone has shown. */
  foundBone: Uint8Array; foundDecoy: Uint8Array;
  /** Out of the last stamp: the cells that took a stroke (and the level each reached), what just showed, and whether a rock was touched. */
  changed: Int32Array; changedTo: Uint8Array; nChanged: number;
  freshBone: Int8Array; nFreshBone: number; freshDecoy: Int8Array; nFreshDecoy: number;
  hitRock: boolean;
  /** The last stamp's centre and radius, for painting it. */
  sx: number; sy: number; sr: number;
};

const SPOTS: readonly (readonly [number, number])[] = [
  [66, 50], [180, 46], [294, 52], [66, 126], [180, 122], [294, 128], [66, 202], [180, 198], [294, 204], [66, 274], [180, 276], [294, 272],
];

/** Where this pit's things lie: one spot each from a shuffle by the seed, a little jitter, never two in one place. */
export function makePit(kinds: readonly BoneKind[], spec: PitSpec, seed: number): Pit {
  const rng = makeRng(seed), spots = [...SPOTS];
  for (let i = spots.length - 1; i > 0; i--) { const j = pick(rng, i + 1); [spots[i], spots[j]] = [spots[j], spots[i]]; }
  let at = 0;
  const bones = kinds.map(kind => { const [x, y] = spots[at++]; return { kind, x: x + pick(rng, 13) - 6, y: y + pick(rng, 9) - 4, rot: pick(rng, 51) - 25 }; });
  const rocks = Array.from({ length: spec.rocks }, () => { const [x, y] = spots[at++]; return { x: x + pick(rng, 9) - 4, y: y + pick(rng, 9) - 4, r: 22 + pick(rng, 5), rot: pick(rng, 41) - 20 }; });
  const decoys = Array.from({ length: spec.decoys }, (_, i) => { const [x, y] = spots[at++]; return { kind: DECOY_KINDS[(pick(rng, 3) + i) % 3], x: x + pick(rng, 9) - 4, y: y + pick(rng, 7) - 3, rot: pick(rng, 61) - 30 }; });
  const blocked = new Uint8Array(COLS * ROWS);
  for (const rock of rocks) for (let row = 0; row < ROWS; row++) for (let col = 0; col < COLS; col++) {
    const dx = ((col + 0.5) * PIT.cell - rock.x) / rock.r, dy = ((row + 0.5) * PIT.cell - rock.y) / (rock.r * 0.8);
    if (dx * dx + dy * dy <= 1) blocked[row * COLS + col] = 1;
  }
  return {
    depth: spec.depth, bones, rocks, decoys,
    cells: new Uint8Array(COLS * ROWS), last: new Uint16Array(COLS * ROWS), blocked,
    foundBone: new Uint8Array(bones.length), foundDecoy: new Uint8Array(decoys.length),
    changed: new Int32Array(COLS * ROWS), changedTo: new Uint8Array(COLS * ROWS), nChanged: 0,
    freshBone: new Int8Array(MAX_BONES), nFreshBone: 0, freshDecoy: new Int8Array(MAX_DECOYS), nFreshDecoy: 0, hitRock: false, sx: 0, sy: 0, sr: 0,
  };
}

/** Share of the cells in a box (centre, half sizes) that have taken all their strokes: 0..1. */
export function coverage(pit: Pit, x: number, y: number, halfW: number, halfH: number): number {
  const c0 = Math.max(0, Math.floor((x - halfW) / PIT.cell)), c1 = Math.min(COLS - 1, Math.floor((x + halfW) / PIT.cell));
  const r0 = Math.max(0, Math.floor((y - halfH) / PIT.cell)), r1 = Math.min(ROWS - 1, Math.floor((y + halfH) / PIT.cell));
  let total = 0, clear = 0;
  for (let row = r0; row <= r1; row++) for (let col = c0; col <= c1; col++) { total++; if (pit.cells[row * COLS + col] >= pit.depth) clear++; }
  return total ? clear / total : 0;
}

/** How much of the pit's sand is gone, 0..1: for the tests' bots. */
export function cleared(pit: Pit): number {
  let clear = 0;
  for (let i = 0; i < pit.cells.length; i++) if (pit.cells[i] >= pit.depth) clear++;
  return clear / pit.cells.length;
}
export const allBonesFound = (pit: Pit) => pit.foundBone.every(Boolean);

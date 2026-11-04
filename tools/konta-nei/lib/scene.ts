// Fills the scene buffers draw.hot.ts reads: where each sprite starts and ends for the look, the question and the reveal.
// Runs once per phase change (not per frame), so it may allocate; the buffers themselves are made once.
import { shelfGeometry, slotsFor, spriteBox } from "./art";
import { ITEM_IDS, type ItemId } from "./items";
import type { Scene } from "./draw.hot";
import type { Round } from "./shelf";

const MAX = 16;
export function makeScene(): Scene {
  return {
    n: 0, sprite: new Int16Array(MAX),
    x0: new Float32Array(MAX), y0: new Float32Array(MAX), x1: new Float32Array(MAX), y1: new Float32Array(MAX),
    a0: new Float32Array(MAX), a1: new Float32Array(MAX), delay: new Float32Array(MAX), bounce: new Uint8Array(MAX),
    rings: 0, rx: new Float32Array(4), ry: new Float32Array(4), rgood: new Uint8Array(4),
  };
}

/** A sprite's slot in the sprite table. */
export const spriteOf = (id: ItemId) => ITEM_IDS.indexOf(id);

/** The shelf's measurements for one canvas size: sprite and ring boxes, and where they stand. */
export type Frame = { width: number; height: number; base: number; sw: number; sh: number; floor: number; rw: number; rh: number; ringTop: number };
export function frameOf(width: number, height: number, base: number): Frame {
  const g = shelfGeometry(width, height, base), box = spriteBox(width, height, base);
  return {
    width, height, base, sw: box.w, sh: box.h, floor: box.floor,
    rw: g.cell * 0.92 + 6, rh: g.itemSize * 1.08 + g.plank * 0.96 + 6, ringTop: g.itemSize * 1.08 + 3,
  };
}

function put(s: Scene, id: ItemId, x0: number, y0: number, x1: number, y1: number, a0 = 1, a1 = 1, delay = 0, bounce = false) {
  const i = s.n++;
  s.sprite[i] = spriteOf(id);
  s.x0[i] = x0; s.y0[i] = y0; s.x1[i] = x1; s.y1[i] = y1;
  s.a0[i] = a0; s.a1[i] = a1; s.delay[i] = delay; s.bounce[i] = bounce ? 1 : 0;
}

/** Things standing still in their places. */
function still(s: Scene, items: readonly (ItemId | null)[], f: Frame) {
  s.n = 0; s.rings = 0;
  const slots = slotsFor(items.length, f.width, f.height, f.base);
  items.forEach((id, index) => {
    if (!id) return;
    const x = slots[index].cx - f.sw / 2, y = slots[index].floor - f.floor;
    put(s, id, x, y, x, y);
  });
}

/** The look: the shelf as it stands. */
export const fillLook = (s: Scene, round: Round, f: Frame) => still(s, round.shelf, f);
/** The question: the shelf as the eyes open on it. */
export const fillAsk = (s: Scene, round: Round, f: Frame) => still(s, round.after, f);

/**
 * The reveal: moved things slide back to where they stood, newcomers lift away, and the gone things drop into their
 * places with a bounce. A ring marks each gone place: green when you found it, red-orange when it slipped past.
 */
export function fillReveal(s: Scene, round: Round, f: Frame, found: readonly ItemId[]) {
  s.n = 0; s.rings = 0;
  const now = slotsFor(round.after.length, f.width, f.height, f.base), was = slotsFor(round.shelf.length, f.width, f.height, f.base);
  round.after.forEach((id, index) => {
    if (!id) return;
    const x0 = now[index].cx - f.sw / 2, y0 = now[index].floor - f.floor, from = round.from[index];
    if (from >= 0) put(s, id, x0, y0, was[from].cx - f.sw / 2, was[from].floor - f.floor);
    else put(s, id, x0, y0, x0, y0 - f.sh * 0.5, 1, 0);
  });
  round.slots.forEach(slot => {
    const id = round.shelf[slot], x = was[slot].cx - f.sw / 2, y = was[slot].floor - f.floor;
    put(s, id, x, y - f.sh * 0.6, x, y, 0, 1, 0.35, true);
    const r = s.rings++;
    s.rx[r] = was[slot].cx - f.rw / 2; s.ry[r] = was[slot].floor - f.ringTop; s.rgood[r] = found.includes(id) ? 1 : 0;
  });
}

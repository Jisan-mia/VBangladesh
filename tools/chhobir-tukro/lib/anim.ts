// Setup for the hot table code: the one animation state (typed arrays, made once per level and mutated by table.hot.ts),
// the table's geometry for a given box, and the modes a piece can be in. Pure: no DOM.
import { SPAN } from "./pieces";

/** Where a piece is: waiting behind the tray, resting in (or gliding to) its slot, in your hand, sliding home, or in. */
export const Mode = { Waiting: 0, Tray: 1, Held: 2, Snap: 3, In: 4 } as const;

export const MAX_PIECES = 36;
export const MAX_DUST = 40;
export const MAX_FLASH = 4;

/** What a cell flash means: a piece went in, a wrong cell, the right cell but still turned, knobs that fit the wrong cell, the whole frame. */
export const Flash = { Good: 1, Wrong: 2, Turn: 3, Fits: 4 } as const;

export type Anim = {
  count: number;
  mode: Uint8Array;
  /** Shown: centre (CSS px on the table canvas), scale (1 = board size) and angle (radians). */
  x: Float32Array; y: Float32Array; s: Float32Array; r: Float32Array;
  /** Scale speed: the scale is a soft spring, so a picked piece pops a little past its size and settles. */
  sv: Float32Array;
  /** Where each is going. */
  tx: Float32Array; ty: Float32Array; ts: Float32Array; tr: Float32Array;
  /** Snap tweens: where it started, and progress 0..1. */
  fx: Float32Array; fy: Float32Array; fs: Float32Array; ft: Float32Array;
  /** ms to wait before moving (the scatter's stagger), and a shake still to run (ms). */
  wait: Float32Array; shake: Float32Array;
  /** The held piece's smoothed speed (px/ms), for its tilt. */
  vx: number;
  held: number;
  /** The tray slot of the piece picked by a tap (-1 = none), ringed on the tray. */
  selected: number;
  /** Pieces whose snap finished this step: the component bakes them into the board and puffs dust. */
  landed: Int16Array; landedCount: number;
  dx: Float32Array; dy: Float32Array; dvx: Float32Array; dvy: Float32Array; dlife: Float32Array;
  flashCell: Int16Array; flashKind: Uint8Array; flashT: Float32Array;
  /** The light that sweeps the painting when it is whole (ms left, 0 = none). */
  sweep: number;
  /** The board cursor for the keyboard (-1 = none). */
  cursor: number;
  /** ধীরে খেলো: no overshoot, tilt, shake or dust; things move quickly to where they go. */
  calm: boolean;
};

export function makeAnim(count: number): Anim {
  const f = () => new Float32Array(MAX_PIECES);
  return {
    count, mode: new Uint8Array(MAX_PIECES),
    x: f(), y: f(), s: f(), r: f(), sv: f(), tx: f(), ty: f(), ts: f(), tr: f(), fx: f(), fy: f(), fs: f(), ft: f(), wait: f(), shake: f(),
    vx: 0, held: -1, selected: -1, landed: new Int16Array(MAX_PIECES), landedCount: 0,
    dx: new Float32Array(MAX_DUST), dy: new Float32Array(MAX_DUST), dvx: new Float32Array(MAX_DUST), dvy: new Float32Array(MAX_DUST), dlife: new Float32Array(MAX_DUST),
    flashCell: new Int16Array(MAX_FLASH).fill(-1), flashKind: new Uint8Array(MAX_FLASH), flashT: new Float32Array(MAX_FLASH),
    sweep: 0, cursor: -1, calm: false,
  };
}

/**
 * The table for a box `width` × `height` (CSS px): the board on top, the tray under it, both as wide as the board.
 * The tray takes 3 rows when the box is tall enough (a phone held upright), else 2.
 */
export type Layout = {
  width: number; height: number; n: number;
  board: number; cell: number; ox: number; oy: number;
  cols: number; rows: number; slots: number; slot: number; trayTop: number;
  /** A piece sprite's side (CSS px, at board scale), and the scale it rests at in a tray slot. */
  piece: number; trayScale: number;
  /** How far above a finger a carried piece floats, so the finger never hides it. */
  lift: number;
};

const COLS: Record<number, number> = { 3: 4, 4: 5, 5: 6, 6: 6 };
const GAP = 10;

export function layoutFor(width: number, height: number, n: number): Layout {
  const w = Math.max(240, width), h = Math.max(240, height);
  const cols = w < 330 && n > 4 ? 5 : COLS[n] ?? 6;
  const fit = (rows: number) => Math.min(w - 6, 620, (h - GAP - 4) / (1 + rows / cols));
  const two = fit(2), three = fit(3), rows = three >= two - 0.5 ? 3 : 2;
  const board = Math.floor(rows === 3 ? three : two), slot = board / cols, cell = board / n;
  const used = board + GAP + rows * slot, oy = Math.max(2, (h - used) / 2);
  const piece = SPAN * cell;
  return {
    width: w, height: h, n, board, cell, ox: (w - board) / 2, oy, cols, rows, slots: cols * rows, slot,
    trayTop: oy + board + GAP, piece, trayScale: Math.min(1, (0.94 * slot) / piece), lift: Math.min(40, cell * 0.55),
  };
}

/** A tray slot's centre on the table canvas. */
export const slotX = (l: Layout, slot: number) => l.ox + (slot % l.cols + 0.5) * l.slot;
export const slotY = (l: Layout, slot: number) => l.trayTop + (Math.floor(slot / l.cols) + 0.5) * l.slot;
/** A piece's home centre on the table canvas. */
export const homeX = (l: Layout, id: number) => l.ox + (id % l.n + 0.5) * l.cell;
export const homeY = (l: Layout, id: number) => l.oy + (Math.floor(id / l.n) + 0.5) * l.cell;
/** The tray slot under a table point, or -1. */
export function slotAt(l: Layout, x: number, y: number) {
  const col = Math.floor((x - l.ox) / l.slot), row = Math.floor((y - l.trayTop) / l.slot);
  return col < 0 || col >= l.cols || row < 0 || row >= l.rows ? -1 : row * l.cols + col;
}

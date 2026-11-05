// The table's animation state: seven pieces, a few dust specks and flashes, all in typed arrays made once. The frame code
// (table.hot.ts) mutates these in place and allocates nothing. Everything is in the view frame's units (the picture's own
// units), so the pure rules in game.ts and this cosmetic layer talk about the same places. What a drop means is never decided here.

export const PIECES = 7;
export const MAX_DUST = 32;
export const MAX_FLASH = 8;
export const MAX_SPOTS = 7;
export const SPOT_STRIDE = 8;

/** Tray: resting in the tray at tray size. Held: in the hand. Snap: sliding into its spot. In: placed. Loose: put down on the board, not in a spot. */
export const Mode = { Tray: 0, Held: 1, Snap: 2, In: 3, Loose: 4 } as const;
export const Ghost = { Off: 0, Drag: 1, Tap: 2 } as const;

export type Anim = {
  mode: Uint8Array;
  /** Where each piece is shown now, its angle, and its scale (1 = board size) with the spring's speed; fl is the mirror (1 or -1, in between while flipping). */
  x: Float32Array; y: Float32Array; r: Float32Array; s: Float32Array; sv: Float32Array; fl: Float32Array;
  /** Where each piece is headed. */
  tx: Float32Array; ty: Float32Array; tr: Float32Array; ts: Float32Array; tfl: Float32Array;
  /** A snap's start and progress. */
  fx: Float32Array; fy: Float32Array; fs: Float32Array; ft: Float32Array;
  shake: Float32Array; wait: Float32Array; pop: Float32Array;
  /** Pieces that finished sliding in on the last step. */
  landed: Int8Array; landedCount: number;
  held: number; selected: number; vx: number;
  calm: boolean;
  /** Dust: position, speed and life (ms left). */
  dx: Float32Array; dy: Float32Array; dvx: Float32Array; dvy: Float32Array; dlife: Float32Array;
  /** A gold flash over a piece that just went in: which piece and the ms left. */
  flashPiece: Int8Array; flashT: Float32Array;
  /** Light sweeping over the finished picture (ms left). */
  sweep: number;
  /** The empty spots still shown as lines: corners (x,y pairs), how many corners, and which piece's colour tints each. */
  spotPts: Float32Array; spotN: Uint8Array; spotColor: Uint8Array; spots: number;
  /** The spot that glows as a hint, as corners (hintN = 0 when none). */
  hintPts: Float32Array; hintN: number;
  /** The ghost finger: what it shows, where from and to (view units), and its clock. */
  ghost: number; gx0: number; gy0: number; gx1: number; gy1: number; gt: number;
  /** The animation clock, for pulses. */
  clock: number;
  /** Keyboard moves answer at once: while this many ms are left, pieces follow, turn and glide with no easing delay. */
  quick: number;
  /** How the empty spots are drawn: 0 tinted in the piece's colour, 1 plain lines, 2 faint lines, 3 none. */
  lines: number;
};

export function makeAnim(): Anim {
  const f = (n = PIECES) => new Float32Array(n);
  return {
    mode: new Uint8Array(PIECES).fill(Mode.Tray),
    x: f(), y: f(), r: f(), s: new Float32Array(PIECES).fill(1), sv: f(), fl: new Float32Array(PIECES).fill(1),
    tx: f(), ty: f(), tr: f(), ts: new Float32Array(PIECES).fill(1), tfl: new Float32Array(PIECES).fill(1),
    fx: f(), fy: f(), fs: f(), ft: f(),
    shake: f(), wait: f(), pop: f(),
    landed: new Int8Array(PIECES), landedCount: 0,
    held: -1, selected: -1, vx: 0,
    calm: false,
    dx: f(MAX_DUST), dy: f(MAX_DUST), dvx: f(MAX_DUST), dvy: f(MAX_DUST), dlife: f(MAX_DUST),
    flashPiece: new Int8Array(MAX_FLASH).fill(-1), flashT: f(MAX_FLASH),
    sweep: 0,
    spotPts: f(MAX_SPOTS * SPOT_STRIDE), spotN: new Uint8Array(MAX_SPOTS), spotColor: new Uint8Array(MAX_SPOTS), spots: 0,
    hintPts: f(SPOT_STRIDE), hintN: 0,
    ghost: Ghost.Off, gx0: 0, gy0: 0, gx1: 0, gy1: 0, gt: 0,
    clock: 0, quick: 0, lines: 0,
  };
}

/** The table's geometry in screen px, made from the stage size and the round's box (see layoutFor). */
export type Px = {
  /** Canvas size in CSS px. */
  w: number; h: number;
  /** CSS px per unit. */
  u: number;
  /** View (x, y) → px: px = o + (v - b) * u. */
  ox: number; oy: number; bx: number; by: number;
  /** How far the tray (and everything resting in it) is pushed down on a tall stage, in units. */
  shift: number;
  /** The tray's top in the model/view frame (before the shift). */
  trayTop: number;
  /** Pointer pick radius, in units (at least 44 px). */
  pick: number;
};

/** The largest size the picture and tray fit at, centred; a tall stage pushes the tray down instead of leaving a gap above the picture. */
export function layoutFor(w: number, h: number, box: readonly [number, number, number, number], trayTop: number): Px {
  const [left, top, bw, bh] = box;
  const u = Math.max(8, Math.min(w / bw, h / bh));
  const spare = h / u - bh, shift = Math.max(0, Math.min(spare * 0.55, 3.5));
  const used = (bh + shift) * u;
  return { w, h, u, ox: (w - bw * u) / 2, oy: (h - used) / 2, bx: left, by: top, shift, trayTop, pick: Math.max(1, 44 / u) };
}

/** View → px, and back. */
export const pxX = (p: Px, x: number) => p.ox + (x - p.bx) * p.u;
export const pxY = (p: Px, y: number) => p.oy + (y - p.by) * p.u;
export const unX = (p: Px, x: number) => (x - p.ox) / p.u + p.bx;
export const unY = (p: Px, y: number) => (y - p.oy) / p.u + p.by;

/** The y a point has in the round's own frame: the tray is pushed down by `shift` on screen, and the gap above it counts as the tray. */
export const modelY = (p: Px, y: number) => y < p.trayTop - 0.2 ? y : Math.max(p.trayTop - 0.1, y - p.shift);
export const screenY = (p: Px, y: number, inTray: boolean) => inTray ? y + p.shift : y;

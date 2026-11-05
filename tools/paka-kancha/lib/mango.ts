// The three mangoes, drawn once as 40×40 paths so the board (SVG) and the card (canvas Path2D) match.
// They differ by shape, not only colour: a whole ripe mango with a leaf, a mango cut in half, a small hollow raw one.

export const BODY = 'M21 6C30 5 36 13 35 23C34 32 27 37 19 37C12 37 8 33 9 28C10 24 14 23 15 19C16 14 15 9 21 6Z';
export const LEAF = 'M21 7C22 2 28 0 34 2C32 7 26 9 21 7Z';
export const STEM = 'M21 7L19 2';
export const HALF = 'M13 5C26 5 35 12 35 21C35 30 26 37 13 37Z';
export const HALF_SKIN = 'M13 5C26 5 35 12 35 21C35 30 26 37 13 37';
export const SEED = 'M13 11C19 13 20 29 13 31Z';
/** The red blush on the ripe mango's shoulder (sits inside BODY). */
export const BLUSH = { cx: 27, cy: 15, rx: 5, ry: 4, angle: -0.5 } as const;
/** The raw mango is the same body, shrunk around the centre. */
export const RAW_SCALE = 0.78;

export const colors = {
  ripe: '#f5a011', ripeEdge: '#b9620a', blush: '#e2522b', leaf: '#3d8a3c', stem: '#6b4a2b',
  flesh: '#ffd45e', fleshEdge: '#d99a1e', skin: '#5f9e36', seed: '#fbe8a6',
  raw: '#4f7f2c', rawFill: '#eef4e2',
} as const;


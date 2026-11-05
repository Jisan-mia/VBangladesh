// All the art is drawn in code, once per round and size, at the phone's pixel ratio: the world's backdrop with the picture's
// shadow and the tray, one sprite per piece (with a lift shadow), and the ghost finger. The frame code only copies these.
import { PIECE_COLOR, toView, type Round } from './game';
import type { WorldId } from './levels';
import { localCorners, corners, SET, type Point } from './tangram';
import { pxX, pxY, type Px } from './anim';

export type Palette = {
  sky0: string; sky1: string; hill: string; hill2: string; sun: string; shadow: string; tray: string; trayEdge: string; line: string; faint: string;
  hint: string; flash: string; dust: string; ring: string; night: boolean;
};

export const PALETTES: readonly Palette[] = [
  { sky0: '#cfeee6', sky1: '#fbf3da', hill: '#a8d8c6', hill2: '#8cc5b0', sun: '#ffd9a0', shadow: '#3a5760', tray: '#eadfbd', trayEdge: '#cbbb91', line: '#ffffff', faint: 'rgba(255,255,255,.4)', hint: '#ffd166', flash: '#ffe08a', dust: '#8a7a55', ring: '#1f7a73', night: false },
  { sky0: '#fff1bd', sky1: '#ffe6a6', hill: '#e8cf86', hill2: '#d9b868', sun: '#fffbe0', shadow: '#5a4630', tray: '#f4e5b9', trayEdge: '#d4bd82', line: '#ffffff', faint: 'rgba(255,255,255,.5)', hint: '#e8590c', flash: '#fff3b0', dust: '#8a7040', ring: '#b5701b', night: false },
  { sky0: '#ffd3c1', sky1: '#fbe6cc', hill: '#ecaa97', hill2: '#d98d7d', sun: '#ffe0b0', shadow: '#5b3b4f', tray: '#f3e0cf', trayEdge: '#d6b8a0', line: '#ffffff', faint: 'rgba(255,255,255,.45)', hint: '#ffd166', flash: '#ffe9b0', dust: '#8a6a60', ring: '#b8456b', night: false },
  { sky0: '#1c2247', sky1: '#394286', hill: '#2c3470', hill2: '#232a5c', sun: '#f3efc8', shadow: '#0c0f2a', tray: '#3b4378', trayEdge: '#5a63a6', line: '#dfe3ff', faint: 'rgba(223,227,255,.45)', hint: '#ffd166', flash: '#fff0b0', dust: '#aab0e0', ring: '#9aa5ff', night: true },
] as const;

export const paletteOf = (world: WorldId): Palette => PALETTES[world];

/** Pieces are 'wood': the base colour, a lighter top-left, a thin darker edge. */
const lighten = (hex: string, amount: number) => {
  const n = parseInt(hex.slice(1), 16), mix = (c: number) => Math.round(c + (255 - c) * amount);
  return `rgb(${mix(n >> 16)},${mix((n >> 8) & 255)},${mix(n & 255)})`;
};

export type Scene = {
  back: HTMLCanvasElement;
  sprites: HTMLCanvasElement[]; shadows: HTMLCanvasElement[];
  finger: HTMLCanvasElement;
  /** Sprite half-sides in sprite px, and the sprite density (px per unit). */
  half: Float32Array; density: number;
  fills: string[]; strokes: string[];
  p: Palette;
};

const make = (width: number, height: number) => { const canvas = document.createElement('canvas'); canvas.width = Math.max(1, Math.round(width)); canvas.height = Math.max(1, Math.round(height)); return canvas; };
const trace = (c: CanvasRenderingContext2D, points: readonly Point[], map: (p: Point) => Point) => {
  c.beginPath();
  points.forEach((point, index) => { const [x, y] = map(point); if (index) c.lineTo(x, y); else c.moveTo(x, y); });
  c.closePath();
};

function paintBack(c: CanvasRenderingContext2D, round: Round, px: Px, p: Palette, world: WorldId) {
  const { w, h } = px;
  const sky = c.createLinearGradient(0, 0, 0, h);
  sky.addColorStop(0, p.sky0); sky.addColorStop(1, p.sky1);
  c.fillStyle = sky; c.fillRect(0, 0, w, h);
  // A sun or moon, and two soft hills, so each world has its own light. Drawn low and pale: the shadow stays the loudest thing.
  c.fillStyle = p.sun; c.globalAlpha = p.night ? 0.9 : 0.8;
  c.beginPath(); c.arc(w * (world === 1 ? 0.5 : 0.8), h * (world === 0 ? 0.3 : world === 2 ? 0.34 : 0.14), Math.min(w, h) * (world === 1 ? 0.1 : 0.075), 0, Math.PI * 2); c.fill();
  c.globalAlpha = 1;
  if (p.night) {
    c.fillStyle = '#ffffff';
    for (let star = 0; star < 26; star++) { const x = (star * 97 % 89) / 89 * w, y = (star * 53 % 61) / 61 * h * 0.55; c.globalAlpha = 0.25 + (star % 4) * 0.12; c.fillRect(x, y, 2, 2); }
    c.globalAlpha = 1;
  }
  const hill = (base: number, amp: number, phase: number, color: string) => {
    c.fillStyle = color; c.beginPath(); c.moveTo(0, h);
    for (let x = 0; x <= w; x += 8) c.lineTo(x, h * base + Math.sin(x / w * Math.PI * 2 + phase) * amp);
    c.lineTo(w, h); c.closePath(); c.fill();
  };
  hill(0.82, h * 0.02, 0.6 + world, p.hill);
  hill(0.9, h * 0.018, 2.1 + world, p.hill2);

  // The tray: a shallow wooden dish under the picture.
  const [left, , width] = round.layout.box, trayTop = round.layout.trayTop, bottom = round.layout.box[1] + round.layout.box[3];
  const x = pxX(px, left + 0.2), y = pxY(px, trayTop - 0.3) + px.shift * px.u, wide = (width - 0.4) * px.u, tall = (bottom - trayTop + 0.1) * px.u;
  c.fillStyle = 'rgba(0,0,0,.14)'; c.beginPath(); c.roundRect(x, y + 4, wide, tall, 8); c.fill();
  c.fillStyle = p.tray; c.beginPath(); c.roundRect(x, y, wide, tall, 8); c.fill();
  c.strokeStyle = p.trayEdge; c.lineWidth = 3; c.stroke();

  // The shadow of the picture.
  c.fillStyle = p.shadow; c.strokeStyle = p.shadow; c.lineWidth = 0.06 * px.u; c.lineJoin = 'round';
  for (const pose of round.solution) {
    trace(c, corners(pose), point => { const v = toView(round.upright, point); return [pxX(px, v[0]), pxY(px, v[1])]; });
    c.fill(); c.stroke();
  }
}

/** One piece's sprite (centred on its centroid) and its lift shadow. */
function paintSprite(kind: 'L' | 'M' | 'S' | 'Q' | 'P', color: string, density: number, dpr: number, side: number) {
  const sprite = make(side, side), c = sprite.getContext('2d')!;
  const shape = localCorners(kind, 0, false), map = (point: Point): Point => [side / 2 + point[0] * density, side / 2 + point[1] * density];
  trace(c, shape, map);
  const grad = c.createLinearGradient(0, 0, side, side);
  grad.addColorStop(0, lighten(color, 0.32)); grad.addColorStop(0.55, color); grad.addColorStop(1, color);
  c.fillStyle = grad; c.fill();
  c.lineJoin = 'round'; c.lineWidth = Math.max(2, 0.05 * density); c.strokeStyle = '#ffffff'; c.stroke();
  // A thin inner edge, so a piece looks cut from painted wood.
  c.save(); c.clip(); c.lineWidth = Math.max(2, 0.09 * density); c.strokeStyle = 'rgba(0,0,0,.16)'; c.stroke(); c.restore();

  const shadow = make(side, side), s = shadow.getContext('2d')!;
  // The blurred shadow: draw the shape far off-canvas and let shadowOffset bring only its blur back.
  s.shadowColor = 'rgba(0,0,0,.55)'; s.shadowBlur = Math.max(4, 0.22 * density); s.shadowOffsetX = side; s.shadowOffsetY = 0;
  trace(s, shape, point => { const m = map(point); return [m[0] - side, m[1]]; });
  s.fillStyle = '#000'; s.fill();
  void dpr;
  return { sprite, shadow };
}

function paintFinger(dpr: number) {
  const size = Math.round(64 * dpr), canvas = make(size, size * 1.25), c = canvas.getContext('2d')!;
  c.scale(size / 48, size / 48);
  c.translate(4, 2);
  c.fillStyle = '#fff'; c.strokeStyle = '#2e2a3a'; c.lineWidth = 2.5; c.lineJoin = 'round';
  c.fill(new Path2D('M14 10a6 6 0 0 1 12 0v20l4-2a6 6 0 0 1 6 2l6 6a8 8 0 0 1 2 6v8c0 6-5 12-12 12H22c-5 0-9-3-11-7L4 40a5 5 0 0 1 8-6l2 3z'));
  c.stroke(new Path2D('M14 10a6 6 0 0 1 12 0v20l4-2a6 6 0 0 1 6 2l6 6a8 8 0 0 1 2 6v8c0 6-5 12-12 12H22c-5 0-9-3-11-7L4 40a5 5 0 0 1 8-6l2 3z'));
  return canvas;
}

/** Bake everything for this round at this size. `dpr` is capped at 2. */
export function bakeScene(round: Round, px: Px, dpr: number): Scene {
  const world = round.spec.world, p = paletteOf(world);
  const back = make(px.w * dpr, px.h * dpr), c = back.getContext('2d')!;
  c.scale(dpr, dpr);
  paintBack(c, round, px, p, world);
  const density = px.u * dpr, side = Math.ceil(2 * (2.2 * Math.SQRT2 * 0.75 + 0.3) * density);
  const sprites: HTMLCanvasElement[] = [], shadows: HTMLCanvasElement[] = [];
  const half = new Float32Array(SET.length);
  SET.forEach((kind, id) => {
    const baked = paintSprite(kind, PIECE_COLOR[id], density, dpr, side);
    sprites.push(baked.sprite); shadows.push(baked.shadow); half[id] = side / 2;
  });
  return {
    back, sprites, shadows, finger: paintFinger(dpr), half, density,
    fills: PIECE_COLOR.map(color => `${color}c0`), strokes: PIECE_COLOR.map(color => color),
    p,
  };
}

// Drawings for ভো-কাট্টা, all in code: the three evenings' skies, Old Dhaka's rooftops, the kite sprites, a lantern, the
// words that pop, the title kite and the story panels. Everything here runs once per layout (never per frame), so it may
// allocate; draw.hot.ts only blits what this builds.
// The kites themselves come from ঘুড়ি আর ফানুস (drawKite), so a kite looks the same in both tools.
import { BODY_FONT, DISPLAY_FONT } from "../../../shared/card-canvas";
import { drawKite } from "../../ghuri/lib/draw-card";
import { H, HAND, HI, LO, ROOFS, VIEW_TOP, W } from "./kite";
import { RIVALS, type RivalKind, type WorldId } from "./levels";

const RIVAL_ORDER: readonly RivalKind[] = ["pichchi", "hamla", "jhotka", "palai", "boltu", "minu", "kalu"];
import type { Look } from "./link";

type Ctx = CanvasRenderingContext2D;

export type Palette = {
  sky: readonly [string, string, string, string];
  sun: string; glow: string;
  far: string; mid: string; near: string; window: string; lit: number;
  /** Your string and the rivals', each with a halo that keeps it readable on this sky. */
  you: string; youHalo: string; rival: string; rivalHalo: string;
  ink: string; cream: string;
  /** The edge-of-sky tint for the CSS around the canvas. */
  edge: string;
};

/** One palette per evening: a bright winter afternoon, a foggy dusk, the night of lights. */
export const PALETTES: readonly Palette[] = [
  { sky: ["#6fb0de", "#a9d0e8", "#f1dcab", "#f6c477"], sun: "#fff6d2", glow: "rgba(255,240,190,0.55)", far: "#c4a48c", mid: "#94654f", near: "#4a2c27", window: "#f7d690", lit: 0.35,
    you: "#fffaf0", youHalo: "rgba(40,28,44,0.55)", rival: "#23345f", rivalHalo: "rgba(255,255,255,0.5)", ink: "#241a2e", cream: "#fff6e6", edge: "#c4501b" },
  { sky: ["#221c44", "#59345f", "#c2603e", "#efa45c"], sun: "#ffd79a", glow: "rgba(255,215,150,0.55)", far: "#6a4466", mid: "#38203d", near: "#1f1226", window: "#ffc867", lit: 0.75,
    you: "#fff5df", youHalo: "rgba(18,8,28,0.6)", rival: "#b8e0ff", rivalHalo: "rgba(18,8,28,0.6)", ink: "#241a2e", cream: "#fff1d6", edge: "#ef8a4a" },
  { sky: ["#070c26", "#141c48", "#2c2a5c", "#5d3a5c"], sun: "#fdf1cc", glow: "rgba(255,236,200,0.28)", far: "#2a2546", mid: "#18132b", near: "#0b0815", window: "#ffcf6b", lit: 0.92,
    you: "#fff1d6", youHalo: "rgba(6,4,16,0.7)", rival: "#9fd6ff", rivalHalo: "rgba(6,4,16,0.7)", ink: "#141026", cream: "#fff1d6", edge: "#7c8cff" },
];

export const FONT_SMALL = `700 11px ${BODY_FONT}, sans-serif`;
export const FONT_TAG = `800 13px ${BODY_FONT}, sans-serif`;
const POP_FONT = (size: number) => `800 ${size}px ${DISPLAY_FONT}, sans-serif`;

/** The meter and the tug bar along the bottom of the sky, over your roof (world units). */
export const METER = { x: 60, y: 474, w: 278, h: 16 } as const;
export const TUG = { x: 84, y: 452, w: 192, h: 9 } as const;
export const meterX = (tension: number) => METER.x + tension * METER.w;
/** The wind flag's pole on your roof. */
export const POLE = { x: 240, top: 404, bottom: 446 } as const;
/** Where each roof's flyer stands (feet), under its hand. */
export const FLYERS = [{ x: ROOFS[0].x - 2, y: ROOFS[0].y + 16 }, { x: ROOFS[1].x - 2, y: ROOFS[1].y + 16 }, { x: ROOFS[2].x - 2, y: ROOFS[2].y + 16 }, { x: HAND.x - 2, y: 446 }] as const;

/* ---------- the sky ---------- */

export function paintSky(c: Ctx, width: number, height: number, horizon: number, world: WorldId, k: number) {
  const p = PALETTES[world];
  const sky = c.createLinearGradient(0, 0, 0, horizon);
  sky.addColorStop(0, p.sky[0]); sky.addColorStop(0.45, p.sky[1]); sky.addColorStop(0.82, p.sky[2]); sky.addColorStop(1, p.sky[3]);
  c.fillStyle = sky; c.fillRect(0, 0, width, height);
  // A fixed sequence, so every phone draws the same stars, clouds and far kites.
  let seed = 977 + world * 31;
  const next = () => (seed = (seed * 1103515245 + 12345) % 2147483648) / 2147483648;
  if (world === 2) {
    for (let i = 0; i < 90; i++) {
      const x = next() * width, y = next() * horizon * 0.8, r = (0.5 + next() * 1.1) * k;
      c.globalAlpha = 0.35 + next() * 0.6; c.fillStyle = "#fff8e6";
      c.beginPath(); c.arc(x, y, r, 0, Math.PI * 2); c.fill();
    }
    c.globalAlpha = 1;
  }
  if (world === 0) {
    // Soft winter clouds.
    for (let i = 0; i < 5; i++) {
      const x = next() * width, y = (0.12 + next() * 0.4) * horizon, rx = (40 + next() * 50) * k;
      const g = c.createRadialGradient(x, y, 0, x, y, rx);
      g.addColorStop(0, "rgba(255,255,255,0.55)"); g.addColorStop(1, "rgba(255,255,255,0)");
      c.save(); c.translate(x, y); c.scale(1, 0.32); c.translate(-x, -y);
      c.fillStyle = g; c.beginPath(); c.arc(x, y, rx, 0, Math.PI * 2); c.fill();
      c.restore();
    }
  }
  // The sun high in the afternoon, low at dusk; the moon at night.
  const sx = width * (world === 0 ? 0.78 : world === 1 ? 0.24 : 0.8), sy = world === 0 ? horizon * 0.26 : world === 1 ? horizon - 26 * k : horizon * 0.18;
  const size = (world === 2 ? 15 : 21) * k;
  const glow = c.createRadialGradient(sx, sy, 0, sx, sy, size * 4);
  glow.addColorStop(0, p.glow); glow.addColorStop(1, "rgba(255,240,200,0)");
  c.fillStyle = glow; c.fillRect(sx - size * 4, sy - size * 4, size * 8, size * 8);
  c.fillStyle = p.sun; c.beginPath(); c.arc(sx, sy, size, 0, Math.PI * 2); c.fill();
  if (world === 2) { c.fillStyle = p.sky[1]; c.beginPath(); c.arc(sx + size * 0.45, sy - size * 0.2, size * 0.86, 0, Math.PI * 2); c.fill(); }
  // Tiny kites of far roofs, dim and low so nobody mistakes them for a rival.
  c.strokeStyle = world === 0 ? "rgba(40,40,70,0.18)" : "rgba(255,240,220,0.14)"; c.lineWidth = 0.6 * k;
  c.fillStyle = world === 0 ? "rgba(60,50,80,0.25)" : "rgba(40,20,50,0.35)";
  for (let i = 0; i < 7; i++) {
    const x = next() * width, y = (0.55 + next() * 0.3) * horizon, r = (2.6 + next() * 1.6) * k;
    c.beginPath(); c.moveTo(x, y + r); c.quadraticCurveTo(x + 9 * k, y + 28 * k, x + 4 * k, y + 54 * k); c.stroke();
    c.beginPath(); c.moveTo(x, y - r); c.lineTo(x + 0.9 * r, y); c.lineTo(x, y + r); c.lineTo(x - 0.9 * r, y); c.closePath(); c.fill();
  }
}

/* ---------- the rooftops ---------- */

/** A rooftop flyer without arms (the arms are drawn live, so they can follow the string and jump). */
export function person(c: Ctx, x: number, feet: number, scale = 1) {
  c.save();
  c.translate(x, feet); c.scale(scale, scale);
  c.fillRect(-3.4, -9, 2.6, 9); c.fillRect(0.8, -9, 2.6, 9);
  c.beginPath(); c.roundRect(-4.6, -17.5, 9.2, 10, 3); c.fill();
  c.beginPath(); c.arc(0, -20.5, 3.2, 0, Math.PI * 2); c.fill();
  c.restore();
}

function windows(c: Ctx, x: number, top: number, width: number, rows: number, seed: number, p: Palette) {
  for (let row = 0; row < rows; row++) for (let col = 0; col * 14 + 10 < width; col++) {
    const lit = ((row * 7 + col * 3 + seed) % 10) / 10 < p.lit;
    c.fillStyle = lit ? p.window : "rgba(0,0,0,0.18)";
    c.fillRect(x + 6 + col * 14, top + 10 + row * 16, 5, 7);
  }
}

function building(c: Ctx, x: number, top: number, width: number, color: string, seed: number, p: Palette) {
  c.fillStyle = color;
  c.fillRect(x, top, width, H - top);
  c.fillRect(x - 2, top - 3, width + 4, 4);
  windows(c, x, top + 4, width, 4, seed, p);
}

function tank(c: Ctx, x: number, top: number) {
  c.fillRect(x, top - 16, 18, 11);
  c.fillRect(x + 2, top - 6, 2, 6); c.fillRect(x + 14, top - 6, 2, 6);
}

/** A row of মরিচবাতি along a parapet (night only). */
function lights(c: Ctx, x0: number, x1: number, y: number) {
  const colors = ["#ff6b6b", "#ffd166", "#06d6a0", "#7aa2ff"];
  c.strokeStyle = "rgba(255,255,255,0.18)"; c.lineWidth = 0.6;
  c.beginPath(); c.moveTo(x0, y); for (let x = x0; x <= x1; x += 12) c.quadraticCurveTo(x + 6, y + 3, x + 12, y); c.stroke();
  for (let x = x0, i = 0; x <= x1; x += 6, i++) { c.fillStyle = colors[i % 4]; c.beginPath(); c.arc(x, y + 1.5, 1.2, 0, Math.PI * 2); c.fill(); }
}

/** Every rooftop in world units: a far hazy row, the three rival roofs with their people, and your roof up front. */
export function paintRoofs(c: Ctx, world: WorldId, extraLeft: number, extraRight: number) {
  const p = PALETTES[world];
  // The far skyline continues off both sides of the world on wide screens.
  c.fillStyle = p.far;
  for (let x = -extraLeft - 40, i = 0; x < W + extraRight + 40; i++) {
    const width = 36 + ((i * 37) % 26), top = 338 + ((i * 53) % 28);
    c.fillRect(x, top, width, H - top);
    if (i % 3 === 0) tank(c, x + width * 0.4, top);
    x += width - 4;
  }
  person(c, 140, 342, 0.65); person(c, 300, 344, 0.6); person(c, 60, 348, 0.62);
  if (world !== 2) {
    const fog = c.createLinearGradient(0, 320, 0, 420);
    const tint = world === 0 ? "255,246,230" : "255,232,218";
    fog.addColorStop(0, `rgba(${tint},0)`); fog.addColorStop(0.55, `rgba(${tint},${world === 0 ? 0.25 : 0.32})`); fog.addColorStop(1, `rgba(${tint},0.08)`);
    c.fillStyle = fog; c.fillRect(-extraLeft, 320, W + extraLeft + extraRight, 100);
  }
  const [r1, r2, r3] = ROOFS;
  // Wider screens get more of the middle row, so the sides never end in a hard edge.
  for (let x = -extraLeft; x < -4; x += 60) building(c, x, 392 + ((x * 7) % 14), 56, p.mid, 5, p);
  for (let x = W + 4; x < W + extraRight; x += 60) building(c, x, 388 + ((x * 3) % 16), 56, p.mid, 6, p);
  building(c, 214, r3.y + 16, 70, p.mid, 1, p);
  c.fillStyle = p.mid; tank(c, 260, r3.y + 16);
  building(c, -4, r2.y + 16, 104, p.mid, 2, p);
  building(c, 252, r1.y + 16, 112, p.mid, 3, p);
  c.fillStyle = p.mid;
  person(c, 84, r2.y + 16, 0.85);
  person(c, 336, r1.y + 16, 0.85);
  c.strokeStyle = p.mid; c.lineWidth = 1;
  for (const [x0, x1, y] of [[256, 362, r1.y + 10], [-2, 100, r2.y + 10], [214, 284, r3.y + 10]]) {
    c.beginPath(); c.moveTo(x0, y); c.lineTo(x1, y);
    for (let x = x0; x <= x1; x += 8) { c.moveTo(x, y); c.lineTo(x, y + 6); }
    c.stroke();
  }
  if (world === 2) { lights(c, 256, 360, r1.y + 9); lights(c, -2, 98, r2.y + 9); lights(c, 216, 282, r3.y + 9); }
  // Your roof and the dark faces of the nearest houses.
  c.fillStyle = p.near;
  c.fillRect(-extraLeft, 458, W + extraLeft + extraRight, H - 458);
  c.fillRect(92, 448, 166, 12);
  c.fillRect(88, 444, 174, 5);
  person(c, 118, 448, 0.9);
  c.fillRect(POLE.x - 1, POLE.top, 2.4, POLE.bottom - POLE.top);
  if (world === 2) lights(c, 90, 260, 445);
}

/** The meter's fixed parts, painted once: the label and three zones, each with its name (not only a colour). */
function paintMeter(c: Ctx, p: Palette) {
  const { x, y, w, h } = METER;
  c.fillStyle = "rgba(10,6,18,0.55)";
  c.beginPath(); c.roundRect(14, y - 6, W - 22, h + 12, 10); c.fill();
  c.font = `800 12px ${BODY_FONT}, sans-serif`; c.textBaseline = "middle"; c.textAlign = "left";
  c.fillStyle = p.cream;
  c.fillText("টান", 24, y + h / 2 + 1);
  const zones: Array<[number, number, string, string]> = [[0, LO, "#6c6788", "ঢিল"], [LO, HI, "#3aa565", "ঠিক টান"], [HI, 1, "#d0473a", "বেশি"]];
  for (const [from, to, color, label] of zones) {
    c.fillStyle = color;
    c.beginPath(); c.roundRect(x + from * w + 1, y, (to - from) * w - 2, h, 5); c.fill();
    c.fillStyle = "#fff"; c.font = FONT_SMALL; c.textAlign = "center";
    c.fillText(label, x + ((from + to) / 2) * w, y + h / 2 + 1);
  }
  c.textAlign = "left"; c.textBaseline = "alphabetic";
}

/** A strip of soft fog wisps, W wide, drawn twice side by side so it can drift and wrap. */
function paintFog(c: Ctx) {
  for (const [x, y, rx, ry, a] of [[40, 30, 70, 14, 0.2], [150, 22, 90, 12, 0.16], [262, 34, 80, 15, 0.2], [330, 18, 60, 10, 0.12]]) {
    const g = c.createRadialGradient(x, y, 0, x, y, rx);
    g.addColorStop(0, `rgba(255,236,224,${a})`); g.addColorStop(1, "rgba(255,236,224,0)");
    c.fillStyle = g;
    c.save(); c.translate(x, y); c.scale(1, ry / rx); c.translate(-x, -y);
    c.beginPath(); c.arc(x, y, rx, 0, Math.PI * 2); c.fill();
    c.restore();
  }
}

/* ---------- sprites ---------- */

export const KITE_R = 17;
/** A kite sprite's box in world units, and where the kite's centre sits in it. */
export const SPRITE_W = KITE_R * 2.2 + 4, SPRITE_H = KITE_R * 2.4 + 8, SPRITE_CY = KITE_R + 4;

function sprite(width: number, height: number, k: number, paint: (c: Ctx) => void) {
  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, Math.ceil(width * k)); canvas.height = Math.max(1, Math.ceil(height * k));
  const c = canvas.getContext("2d")!;
  c.setTransform(k, 0, 0, k, 0, 0);
  paint(c);
  return canvas;
}

/** The words that pop in the sky, pre-rendered so a frame never builds text. */
export const WORDS = ["ভো-কাট্টা!", "কেটে গেল!", "আরেক দাগ!", "ঝটকা!", "আসছে!", "জট!", "ঢিল দাও!", ...RIVAL_ORDER.map(kind => RIVALS[kind].name)] as const;
export const WORD = { CUT: 0, LOST: 1, NOTCH: 2, YANK: 3, CHARGE: 4, TANGLE: 5, SLACK: 6 } as const;
/** The word that names a rival kind, shown beside its kite as it rises. */
export const nameWord = (kind: RivalKind) => 7 + RIVAL_ORDER.indexOf(kind);
const WORD_SIZE = [30, 22, 22, 15, 14, 15, 15, 13, 13, 13, 13, 14, 14, 14];
const WORD_FILL = ["#ffc867", "#ffb2a6", "#ffe08a", "#ffb547", "#ff8a7a", "#d8d0ff", "#c8f2d4", "#fff1d6", "#ffd0c8", "#ffe2b0", "#d6ecff", "#ffd166", "#ffd166", "#ffd166"];

export type Layers = {
  /** Canvas size in CSS px, the device ratio, and the world's scale and offset inside it. */
  width: number; height: number; dpr: number; scale: number; ox: number; oy: number;
  world: WorldId;
  palette: Palette;
  sky: HTMLCanvasElement;
  roofs: HTMLCanvasElement;
  meter: HTMLCanvasElement;
  fog: HTMLCanvasElement | null;
  /** One sprite per ready look, then yours last. */
  kites: HTMLCanvasElement[];
  lantern: HTMLCanvasElement;
  words: HTMLCanvasElement[];
  /** Each word's size in world units. */
  wordW: Float32Array; wordH: Float32Array;
};

/** The world fills the width on a tall sky (more sky above) and the height from VIEW_TOP to the roofs on a wide one (more roofs to the sides). */
export function fit(width: number, height: number) {
  const scale = Math.min(width / W, height / (H - VIEW_TOP));
  return { scale, ox: (width - W * scale) / 2, oy: height - H * scale };
}

export function buildLayers(width: number, height: number, dpr: number, world: WorldId, looks: readonly Look[]): Layers {
  const { scale, ox, oy } = fit(width, height), k = scale * dpr, p = PALETTES[world];
  const full = (paint: (c: Ctx) => void) => {
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(width * dpr); canvas.height = Math.round(height * dpr);
    const c = canvas.getContext("2d")!;
    c.setTransform(dpr, 0, 0, dpr, 0, 0);
    paint(c);
    return canvas;
  };
  const sky = full(c => paintSky(c, width, height, oy + 392 * scale, world, scale));
  const roofs = full(c => { c.translate(ox, oy); c.scale(scale, scale); paintRoofs(c, world, ox / scale, ox / scale); });
  const meter = full(c => { c.translate(ox, oy); c.scale(scale, scale); paintMeter(c, p); });
  const fog = world === 1 ? sprite(W, 60, k, paintFog) : null;
  const kites = looks.map(look => sprite(SPRITE_W, SPRITE_H, k, c => drawKite(c, { ...look, text: "" }, SPRITE_W / 2, SPRITE_CY, KITE_R, 0)));
  const lantern = sprite(30, 40, k, c => {
    const g = c.createRadialGradient(15, 20, 0, 15, 20, 15);
    g.addColorStop(0, "rgba(255,200,110,0.7)"); g.addColorStop(1, "rgba(255,200,110,0)");
    c.fillStyle = g; c.fillRect(0, 0, 30, 40);
    c.fillStyle = "#ffe2a8";
    c.beginPath(); c.moveTo(9, 10); c.quadraticCurveTo(15, 4, 21, 10); c.lineTo(20, 27); c.lineTo(10, 27); c.closePath(); c.fill();
    c.fillStyle = "#ff9a3c"; c.beginPath(); c.arc(15, 25, 2.4, 0, Math.PI * 2); c.fill();
  });
  const wordW = new Float32Array(WORDS.length), wordH = new Float32Array(WORDS.length);
  const words = WORDS.map((text, index) => {
    const size = WORD_SIZE[index], measure = document.createElement("canvas").getContext("2d")!;
    measure.font = POP_FONT(size);
    const w = measure.measureText(text).width + size * 0.6, h = size * 1.6;
    wordW[index] = w; wordH[index] = h;
    return sprite(w, h, k, c => {
      c.font = POP_FONT(size); c.textAlign = "center"; c.textBaseline = "middle"; c.lineJoin = "round";
      c.lineWidth = size / 5; c.strokeStyle = p.ink; c.strokeText(text, w / 2, h / 2);
      c.fillStyle = WORD_FILL[index]; c.fillText(text, w / 2, h / 2);
    });
  });
  return { width, height, dpr, scale, ox, oy, world, palette: p, sky, roofs, meter, fog, kites, lantern, words, wordW, wordH };
}

/* ---------- the title kite and the story ---------- */

/** The title's start button: your kite, big on the evening's sky, its string down to the নাটাই, with খেলো on the paper. */
export const TITLE_ASPECT = 1.05;
export function drawTitle(canvas: HTMLCanvasElement, width: number, dpr: number, world: WorldId, look: Look, label: string) {
  const height = Math.round(width * TITLE_ASPECT), p = PALETTES[world];
  canvas.width = Math.round(width * dpr); canvas.height = Math.round(height * dpr);
  const c = canvas.getContext("2d")!;
  c.setTransform(dpr, 0, 0, dpr, 0, 0);
  const k = width / 360;
  c.save();
  c.beginPath(); c.roundRect(0, 0, width, height, 22 * k); c.clip();
  paintSky(c, width, height, height * 0.92, world, k);
  c.save(); c.translate(0, height - 120 * k); c.scale(k, k); c.translate(0, -380); paintRoofs(c, world, 0, 0); c.restore();
  // The string, from the নাটাই at the bottom left up to the kite.
  const kx = width * 0.56, ky = height * 0.4, r = width * 0.3;
  c.strokeStyle = p.youHalo; c.lineWidth = 5 * k; c.lineCap = "round";
  c.beginPath(); c.moveTo(width * 0.16, height - 26 * k); c.quadraticCurveTo(width * 0.2, height * 0.62, kx, ky + r * 0.9); c.stroke();
  c.strokeStyle = p.you; c.lineWidth = 2.4 * k; c.stroke();
  // The নাটাই: a wooden spool with its two handles.
  c.save(); c.translate(width * 0.16, height - 22 * k); c.rotate(-0.4);
  c.fillStyle = "#b07a3c"; c.fillRect(-20 * k, -9 * k, 40 * k, 18 * k);
  c.fillStyle = "#e9d3a8"; c.fillRect(-16 * k, -6 * k, 32 * k, 12 * k);
  c.fillStyle = "#7a4a1e"; c.fillRect(-26 * k, -2.5 * k, 52 * k, 5 * k);
  c.restore();
  drawKite(c, { ...look, text: "" }, kx, ky, r, 0.1);
  // The tail: two paper ribbons.
  c.fillStyle = "#ffd166";
  c.beginPath(); c.moveTo(kx + 0.12 * r, ky + 1.15 * r); c.quadraticCurveTo(kx + 0.5 * r, ky + 1.5 * r, kx + 0.2 * r, ky + 1.9 * r); c.lineTo(kx + 0.12 * r, ky + 1.86 * r); c.quadraticCurveTo(kx + 0.38 * r, ky + 1.5 * r, kx + 0.04 * r, ky + 1.2 * r); c.fill();
  // খেলো on a cream band across the paper.
  c.save(); c.translate(kx, ky); c.rotate(0.1);
  const size = Math.round(r * 0.42);
  c.font = POP_FONT(size);
  const tw = c.measureText(label).width + size * 0.9;
  c.fillStyle = "rgba(255,248,232,0.96)"; c.shadowColor = "rgba(20,10,30,0.35)"; c.shadowBlur = 10 * k; c.shadowOffsetY = 3 * k;
  c.beginPath(); c.roundRect(-tw / 2, -size * 0.72, tw, size * 1.44, size * 0.4); c.fill();
  c.shadowColor = "transparent";
  c.fillStyle = "#c4501b"; c.textAlign = "center"; c.textBaseline = "middle";
  c.fillText(label, 0, size * 0.04);
  c.restore();
  c.restore();
}

/** Three story panels drawn in code, 3:2. */
export function drawStory(canvas: HTMLCanvasElement, width: number, dpr: number, panel: number, look: Look, rivalLook: Look) {
  const height = Math.round((width * 2) / 3);
  canvas.width = Math.round(width * dpr); canvas.height = Math.round(height * dpr);
  const c = canvas.getContext("2d")!;
  c.setTransform(dpr, 0, 0, dpr, 0, 0);
  const k = width / 360, world: WorldId = panel === 0 ? 0 : 1, p = PALETTES[world];
  paintSky(c, width, height, height * 0.95, world, k);
  c.save(); c.translate(0, height - 130 * k); c.scale(k, k); c.translate(0, -370); paintRoofs(c, world, 0, 0); c.restore();
  const string = (x0: number, y0: number, x1: number, y1: number, color: string, halo: string) => {
    c.strokeStyle = halo; c.lineWidth = 3.4 * k; c.beginPath(); c.moveTo(x0, y0); c.quadraticCurveTo((x0 + x1) / 2 + 12 * k, (y0 + y1) / 2 + 18 * k, x1, y1); c.stroke();
    c.strokeStyle = color; c.lineWidth = 1.5 * k; c.stroke();
  };
  if (panel === 0) {
    // Kites over every roof.
    const spots: Array<[number, number, number, number]> = [[0.2, 0.22, 0, 0.9], [0.42, 0.14, 2, 1], [0.66, 0.26, 4, 0.85], [0.84, 0.12, 1, 0.8], [0.3, 0.42, 5, 0.7], [0.56, 0.4, 3, 0.75]];
    for (const [fx, fy, look, size] of spots) {
      const x = fx * width, y = fy * height, r = 15 * k * size;
      string(x - 20 * k, height - 30 * k, x, y + r, p.you, p.youHalo);
      drawKite(c, { ...LOOK_SET[look], text: "" }, x, y, r, (fx - 0.5) * 0.4);
    }
  } else if (panel === 1) {
    // The next roof calls across.
    const hx = width * 0.78, hy = height - 52 * k;
    string(hx, hy, width * 0.7, height * 0.22, p.rival, p.rivalHalo);
    drawKite(c, { ...rivalLook, text: "" }, width * 0.7, height * 0.22, 22 * k, 0.2);
    c.fillStyle = p.near; person(c, hx, height - 34 * k, 1.6 * k);
    c.fillStyle = "#fff"; c.beginPath(); c.roundRect(width * 0.3, height * 0.46, width * 0.38, 34 * k, 14 * k); c.fill();
    c.beginPath(); c.moveTo(width * 0.6, height * 0.46 + 32 * k); c.lineTo(width * 0.7, height * 0.46 + 46 * k); c.lineTo(width * 0.56, height * 0.46 + 32 * k); c.fill();
    c.fillStyle = "#241a2e"; c.font = POP_FONT(Math.round(18 * k)); c.textAlign = "center"; c.textBaseline = "middle";
    c.fillText("প্যাঁচ খেলবা?", width * 0.49, height * 0.46 + 17 * k);
  } else {
    // Two strings crossed, and the meter's green band.
    const meet = { x: width * 0.5, y: height * 0.42 };
    string(width * 0.22, height - 30 * k, width * 0.72, height * 0.16, p.you, p.youHalo);
    string(width * 0.86, height - 40 * k, width * 0.26, height * 0.2, p.rival, p.rivalHalo);
    drawKite(c, { ...look, text: "" }, width * 0.72, height * 0.16, 20 * k, 0.1);
    drawKite(c, { ...rivalLook, text: "" }, width * 0.26, height * 0.2, 18 * k, -0.2);
    c.strokeStyle = "#fff1d6"; c.lineWidth = 2.5 * k; c.beginPath(); c.arc(meet.x, meet.y, 10 * k, 0, Math.PI * 2); c.stroke();
    const mx = width * 0.14, my = height - 24 * k, mw = width * 0.72, mh = 12 * k;
    c.fillStyle = "rgba(10,6,18,0.6)"; c.beginPath(); c.roundRect(mx - 6 * k, my - 6 * k, mw + 12 * k, mh + 12 * k, 8 * k); c.fill();
    [[0, LO, "#6c6788"], [LO, HI, "#3aa565"], [HI, 1, "#d0473a"]].forEach(([from, to, color]) => {
      c.fillStyle = color as string; c.beginPath(); c.roundRect(mx + (from as number) * mw, my, ((to as number) - (from as number)) * mw - 2, mh, 4 * k); c.fill();
    });
    c.fillStyle = "#fff"; c.fillRect(mx + 0.62 * mw - 2 * k, my - 5 * k, 4 * k, mh + 10 * k);
  }
}

const LOOK_SET: readonly Look[] = [
  { pattern: "pankhiraj", color: "red" }, { pattern: "chokhdar", color: "yellow" }, { pattern: "choshmadar", color: "green" },
  { pattern: "maladar", color: "blue" }, { pattern: "daba", color: "pink" }, { pattern: "tekka", color: "black" },
];

/* ---------- the frame's own animation state (pools made once; draw.hot.ts mutates them) ---------- */

export const SNAPS = 4, SF = 6;
export const BITS = 28, BF = 7;
export const FIREWORKS = 3, FWF = 4;

/** Everything the frame animates on its own clock (the game's state is read, never written). */
export type Fx = {
  clock: number;
  slow: boolean;
  /** Your sprite's index in layers.kites. */
  you: number;
  shake: number;
  /** Seconds left of your roof's cheer. */
  jump: number;
  popWord: number; popAge: number; popX: number; popY: number;
  /** A small word that follows a rival kite (its tell), by slot. */
  tagWord: number; tagAge: number; tagSlot: number;
  snaps: Float32Array; bits: Float32Array; fire: Float32Array;
  fireIn: number; seed: number;
};

export function makeFx(you: number): Fx {
  return {
    clock: 0, slow: false, you, shake: 0, jump: 0,
    popWord: 0, popAge: 9, popX: 0, popY: 0, tagWord: 0, tagAge: 9, tagSlot: 0,
    snaps: new Float32Array(SNAPS * SF), bits: new Float32Array(BITS * BF), fire: new Float32Array(FIREWORKS * FWF),
    fireIn: 1.5, seed: 12345,
  };
}

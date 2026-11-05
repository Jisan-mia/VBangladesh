// Drawings for ছিপ ফেলো, all in code: the four waters, the fish, a lily pad, the shadows, the dusk, the words that pop,
// the title picture and the story panels. Everything here runs once per layout or once per event (never per frame), so it
// may allocate; draw.hot.ts only blits what this builds.
import { BODY_FONT, DISPLAY_FONT } from "../../../shared/card-canvas";
import type { WorldId } from "./levels";
import { FISH, type Fish } from "./species";

type Ctx = CanvasRenderingContext2D;
const TAU = Math.PI * 2;

export type Palette = {
  sky: readonly [string, string]; sun: string; water: readonly [string, string]; far: string; trees: string; bank: string; grass: string; earth: string;
  /** The tint of light on the water, and the CSS edge colour around the pond. */
  shine: string; ink: string;
};
/** One palette per water: a green midday pond, a golden বিল, a blue river evening, a grey monsoon হাওর. */
export const PALETTES: readonly Palette[] = [
  { sky: ["#f9eccc", "#d8ecdf"], sun: "#fff6d6", water: ["#2d6a5b", "#4f8f78"], far: "#6f9a52", trees: "#4f7a3c", bank: "#6f9a52", grass: "#7ea24c", earth: "#8b6a3c", shine: "rgba(255,255,255,0.18)", ink: "#17302a" },
  { sky: ["#fbd59a", "#f7e8c4"], sun: "#fff1c4", water: ["#55785a", "#87a776"], far: "#9fb066", trees: "#6f8a48", bank: "#a3b26a", grass: "#9db35c", earth: "#94713f", shine: "rgba(255,240,200,0.22)", ink: "#2c2a17" },
  { sky: ["#f2c2a2", "#c3d9e9"], sun: "#ffe2c4", water: ["#2c5a7a", "#5b91b0"], far: "#8fae86", trees: "#5f7f78", bank: "#93ad8a", grass: "#86a77a", earth: "#7d6545", shine: "rgba(255,230,210,0.2)", ink: "#162a3a" },
  { sky: ["#93a8ab", "#c6d3cf"], sun: "#e8efe9", water: ["#36605f", "#64908b"], far: "#6f8f80", trees: "#4d6a5c", bank: "#7f9a7c", grass: "#7a9873", earth: "#6c5c45", shine: "rgba(230,245,240,0.16)", ink: "#15282a" },
];

/** The world box every phone plays in: at least 360 × 480 units, wider or taller to fill the stage. */
export const MIN_W = 360, MIN_H = 480;
export type Layout = {
  /** World units across and down, the CSS px per unit, and the device pixel ratio. */
  ww: number; wh: number; s: number; dpr: number;
  waterTop: number; bankY: number;
  /** The rod tip at rest; the meter on the right edge; the basket on the bank. */
  tipX: number; tipY: number; meterX: number; meterTop: number; meterH: number; basketX: number; basketY: number;
};
export function layoutOf(width: number, height: number, dpr: number): Layout {
  const s = Math.min(width / MIN_W, height / MIN_H), ww = width / s, wh = height / s;
  const waterTop = Math.round(wh * 0.15), bankY = wh - 62;
  return {
    ww, wh, s, dpr, waterTop, bankY,
    tipX: ww * 0.38, tipY: waterTop + (bankY - waterTop) * 0.6,
    meterX: ww - 24, meterTop: waterTop + 36, meterH: Math.min(240, (bankY - waterTop) * 0.56),
    basketX: ww - 46, basketY: bankY + 34,
  };
}
/** Distance 0 (by the bank) .. 1 (far water) to a height, and the side −1..1 to an x; far things are smaller. */
export const yOf = (L: Layout, d: number) => L.bankY - 20 - d * (L.bankY - 20 - (L.waterTop + 28));
export const xOf = (L: Layout, side: number, d: number) => L.ww / 2 + side * L.ww * 0.34 * (1 - 0.42 * d);
export const sizeAt = (d: number) => 1 - 0.48 * d;

/** A canvas `w × h` world units big, at the layout's resolution, with a context drawing in world units. */
function sprite(L: Pick<Layout, "s" | "dpr">, w: number, h: number) {
  const canvas = document.createElement("canvas"), k = L.s * L.dpr;
  canvas.width = Math.max(1, Math.ceil(w * k)); canvas.height = Math.max(1, Math.ceil(h * k));
  const c = canvas.getContext("2d")!;
  c.setTransform(k, 0, 0, k, 0, 0);
  return { canvas, c };
}

function blob(c: Ctx, x: number, y: number, rx: number, ry: number, fill: string, turn = 0) {
  c.beginPath(); c.ellipse(x, y, rx, ry, turn, 0, TAU); c.fillStyle = fill; c.fill();
}
/** A fixed sequence, so every phone draws the same trees and sparkles. */
function seq(seed: number) { let v = seed; return () => (v = (v * 1103515245 + 12345) % 2147483648) / 2147483648; }

function coconut(c: Ctx, x: number, base: number, tall: number, lean: number, color: string, leaves: string) {
  c.strokeStyle = color; c.lineWidth = 2.6; c.lineCap = "round";
  c.beginPath(); c.moveTo(x, base); c.quadraticCurveTo(x + lean * 0.4, base - tall * 0.6, x + lean, base - tall); c.stroke();
  c.strokeStyle = leaves; c.lineWidth = 2;
  for (let i = 0; i < 7; i++) {
    const angle = -Math.PI + i * (Math.PI / 6), tx = x + lean, ty = base - tall;
    c.beginPath(); c.moveTo(tx, ty); c.quadraticCurveTo(tx + Math.cos(angle) * 10, ty - 6, tx + Math.cos(angle) * 17, ty + 5); c.stroke();
  }
}

/** A woven bamboo basket (খালুই). */
export function drawBasket(c: Ctx, x: number, y: number, s: number) {
  c.fillStyle = "#b9853f";
  c.beginPath(); c.moveTo(x - 22 * s, y - 16 * s); c.lineTo(x + 22 * s, y - 16 * s); c.quadraticCurveTo(x + 24 * s, y + 14 * s, x, y + 14 * s); c.quadraticCurveTo(x - 24 * s, y + 14 * s, x - 22 * s, y - 16 * s); c.fill();
  c.strokeStyle = "#8a5c26"; c.lineWidth = 1.4 * s;
  for (let i = 1; i < 4; i++) { c.beginPath(); c.moveTo(x - 22 * s + i * 1.5 * s, y - 16 * s + i * 7 * s); c.lineTo(x + 22 * s - i * 1.5 * s, y - 16 * s + i * 7 * s); c.stroke(); }
  blob(c, x, y - 16 * s, 22 * s, 4 * s, "#8a5c26");
}

/** A lily pad with its notch, flat on the water; `flower` adds a শাপলা. */
export function drawPad(c: Ctx, x: number, y: number, r: number, flower: string | null) {
  c.beginPath(); c.ellipse(x, y, r, r * 0.4, 0, 0.35, TAU - 0.12); c.lineTo(x, y); c.closePath();
  c.fillStyle = "#4f8f3e"; c.fill();
  c.strokeStyle = "#3d7431"; c.lineWidth = Math.max(0.6, r * 0.06); c.stroke();
  if (!flower) return;
  for (let i = 0; i < 6; i++) blob(c, x + Math.cos(i * 1.05) * r * 0.24, y - r * 0.12 + Math.sin(i * 1.05) * r * 0.1, r * 0.22, r * 0.12, flower, i * 1.05);
  blob(c, x, y - r * 0.14, r * 0.1, r * 0.07, "#f2c94c");
}

/** The far bank, the water and the near bank of one water, drawn once per layout. */
export function paintWater(c: Ctx, L: Layout, world: WorldId) {
  const p = PALETTES[world], { ww, wh, waterTop: top, bankY } = L, rnd = seq(41 + world * 17);
  let g = c.createLinearGradient(0, 0, 0, top);
  g.addColorStop(0, p.sky[0]); g.addColorStop(1, p.sky[1]);
  c.fillStyle = g; c.fillRect(0, 0, ww, top + 2);
  if (world !== 3) { c.globalAlpha = 0.8; blob(c, ww * 0.78, top * 0.42, 14, 14, p.sun); c.globalAlpha = 1; }
  else for (let i = 0; i < 4; i++) { c.globalAlpha = 0.5; blob(c, ww * (0.15 + i * 0.25), top * (0.3 + (i % 2) * 0.15), 38, 11, "#7d9396"); c.globalAlpha = 1; }
  // The far bank.
  c.fillStyle = p.far; c.fillRect(0, top - 16, ww, 18);
  for (let x = 6; x < ww; x += 22 + rnd() * 20) blob(c, x, top - 15, 10 + rnd() * 9, 6 + rnd() * 4, p.trees);
  if (world === 0) { coconut(c, ww * 0.16, top - 10, 42, 6, "#5b4a2a", p.trees); coconut(c, ww * 0.58, top - 10, 50, -7, "#5b4a2a", p.trees); coconut(c, ww * 0.82, top - 10, 38, 5, "#5b4a2a", p.trees); }
  else if (world === 1) for (const x of [ww * 0.28, ww * 0.31]) { c.strokeStyle = "#5b4a2a"; c.lineWidth = 2; c.beginPath(); c.moveTo(x, top - 10); c.lineTo(x + 2, top - 46); c.stroke(); blob(c, x + 2, top - 48, 10, 6, p.trees); }
  else if (world === 2) {
    // A sail boat far off.
    const bx = ww * 0.62, by = top + 10;
    c.fillStyle = "#5a4630"; c.beginPath(); c.moveTo(bx - 18, by); c.lineTo(bx + 18, by); c.lineTo(bx + 12, by + 5); c.lineTo(bx - 12, by + 5); c.closePath(); c.fill();
    c.strokeStyle = "#5a4630"; c.lineWidth = 1; c.beginPath(); c.moveTo(bx, by); c.lineTo(bx, by - 26); c.stroke();
    c.fillStyle = "#efe2c4"; c.beginPath(); c.moveTo(bx + 1, by - 25); c.lineTo(bx + 15, by - 3); c.lineTo(bx + 1, by - 3); c.closePath(); c.fill();
  } else {
    // A হাওর village on a mound, far across the water.
    for (const x of [ww * 0.2, ww * 0.26, ww * 0.7]) { c.fillStyle = "#5e5440"; c.beginPath(); c.moveTo(x - 8, top - 10); c.lineTo(x, top - 19); c.lineTo(x + 8, top - 10); c.closePath(); c.fill(); }
  }
  // The water.
  g = c.createLinearGradient(0, top, 0, bankY);
  g.addColorStop(0, p.water[0]); g.addColorStop(1, p.water[1]);
  c.fillStyle = g; c.fillRect(0, top, ww, bankY - top + 8);
  c.strokeStyle = p.shine; c.lineWidth = 1;
  for (let i = 0; i < 16; i++) { const y = top + 16 + rnd() * (bankY - top - 30), x = rnd() * ww; c.beginPath(); c.moveTo(x, y); c.lineTo(x + 12 + rnd() * 18, y); c.stroke(); }
  if (world === 2) { c.strokeStyle = "rgba(255,255,255,0.1)"; c.lineWidth = 1.3; for (let i = 0; i < 12; i++) { const y = top + 24 + i * (bankY - top - 40) / 12, x = rnd() * ww * 0.8; c.beginPath(); c.moveTo(x, y); c.lineTo(x + 40 + rnd() * 30, y); c.stroke(); } }
  // Decorative pads hug the edges, away from every cast's line.
  if (world === 1) for (const [x, y, r, flower] of [[ww * 0.06, top + 40, 11, "#f2a5c0"], [ww * 0.94, top + 70, 12, "#ffffff"], [ww * 0.04, bankY - 60, 13, null], [ww * 0.96, bankY - 120, 10, "#f2a5c0"]] as const) drawPad(c, x, y, r, flower);
  if (world === 0) for (const [x, y] of [[ww * 0.05, bankY - 30], [ww * 0.95, bankY - 50], [ww * 0.06, top + 50], [ww * 0.94, top + 36]] as const) blob(c, x, y, 10, 4, "#5f9a4c", 0.2);
  // The near bank: an earth lip and grass; brick steps of a ঘাট on the pond; the basket waits on the right.
  c.fillStyle = p.earth; c.beginPath(); c.moveTo(0, bankY - 4); c.quadraticCurveTo(ww / 2, bankY - 12, ww, bankY - 2); c.lineTo(ww, wh); c.lineTo(0, wh); c.closePath(); c.fill();
  c.fillStyle = p.grass; c.beginPath(); c.moveTo(0, bankY + 8); c.quadraticCurveTo(ww / 2, bankY, ww, bankY + 10); c.lineTo(ww, wh); c.lineTo(0, wh); c.closePath(); c.fill();
  c.strokeStyle = "rgba(0,0,0,0.12)"; c.lineWidth = 1.3;
  for (let x = 6; x < ww; x += 12) { c.beginPath(); c.moveTo(x, bankY + 12); c.lineTo(x + 3, bankY + 4); c.lineTo(x + 6, bankY + 12); c.stroke(); }
  if (world === 0) for (let i = 0; i < 3; i++) { c.fillStyle = i % 2 ? "#a4553c" : "#b8634a"; c.fillRect(ww * 0.06 + i * 6, bankY - 2 + i * 9, ww * 0.26 - i * 12, 8); }
  drawBasket(c, L.basketX, L.basketY, 1);
}

/** A fish in profile facing right, `len` long, centred on (cx, cy). `flat` paints a silhouette in one colour. */
export function drawFish(c: Ctx, cx: number, cy: number, len: number, fish: Fish, flat?: string) {
  const L = fish.look, h = len / L.long, nose = cx + len * 0.5, tailBase = cx - len * 0.3, tailEnd = cx - len * 0.5;
  const top = cy - h / 2, bottom = cy + h / 2, hump = (L.hump ?? 0) * h, head = L.head ?? 0;
  const body = () => {
    c.beginPath();
    c.moveTo(nose, cy + h * 0.06);
    c.bezierCurveTo(nose - len * (0.06 - head * 0.1), top - h * head * 0.3, cx + len * 0.12, top - hump, tailBase, cy - h * 0.14);
    c.lineTo(tailBase, cy + h * 0.14);
    c.bezierCurveTo(cx, bottom + h * 0.05, nose - len * 0.12, bottom, nose, cy + h * 0.06);
    c.closePath();
  };
  const fin = flat ?? L.fin;
  c.fillStyle = fin; c.beginPath();
  if (L.tail === "fork") {
    c.moveTo(tailBase + len * 0.02, cy); c.lineTo(tailEnd, cy - h * 0.5); c.quadraticCurveTo(tailEnd + len * 0.07, cy, tailEnd, cy + h * 0.5); c.closePath();
  } else {
    const spread = Math.max(h * 0.5, len * 0.08);
    c.moveTo(tailBase + len * 0.03, cy - h * 0.12);
    c.quadraticCurveTo(tailEnd - len * 0.01, cy - spread, tailEnd, cy);
    c.quadraticCurveTo(tailEnd - len * 0.01, cy + spread, tailBase + len * 0.03, cy + h * 0.12);
    c.closePath();
  }
  c.fill();
  c.beginPath();
  if (L.long < 4.4) { c.moveTo(cx + len * 0.08, top - hump * 0.5 + h * 0.22); c.lineTo(cx - len * 0.04, top - hump * 0.7 - h * 0.16); c.lineTo(cx - len * 0.2, top + h * 0.3); }
  else { c.moveTo(cx + len * 0.12, top + h * 0.1); c.quadraticCurveTo(cx - len * 0.05, top - h * 0.28, tailBase, cy - h * 0.12); }
  c.closePath(); c.fill();
  if (flat) c.fillStyle = flat;
  else { const g = c.createLinearGradient(0, top, 0, bottom); g.addColorStop(0, L.body); g.addColorStop(0.55, L.body); g.addColorStop(1, L.belly); c.fillStyle = g; }
  body(); c.fill();
  if (flat) return;
  if (L.mark) {
    c.save(); body(); c.clip();
    c.fillStyle = L.markColor ?? "#000"; c.globalAlpha = 0.6;
    if (L.mark === "bars") for (let i = 0; i < 5; i++) c.fillRect(cx + len * (0.22 - i * 0.12), top - hump, len * 0.04, h + hump);
    else if (L.mark === "stripe") c.fillRect(tailBase, cy - h * 0.06, len * 0.8, h * 0.1);
    else for (let i = 0; i < 9; i++) { c.beginPath(); c.arc(cx + len * (0.25 - (i % 5) * 0.11 - (i > 4 ? 0.05 : 0)), cy + h * (i > 4 ? 0.12 : -0.14), Math.max(1, h * 0.07), 0, TAU); c.fill(); }
    c.restore();
  }
  if (L.spot) { c.fillStyle = "#26231f"; c.beginPath(); c.arc(L.spot === "tail" ? tailBase + len * 0.08 : nose - len * 0.22, cy - h * 0.06, Math.max(1.2, h * 0.1), 0, TAU); c.fill(); }
  c.fillStyle = fin; c.beginPath(); c.ellipse(nose - len * 0.26, cy + h * 0.18, len * 0.06, h * 0.1, 0.5, 0, TAU); c.fill();
  c.strokeStyle = "rgba(0,0,0,0.25)"; c.lineWidth = Math.max(0.8, len * 0.008);
  c.beginPath(); c.arc(nose - len * 0.36, cy, h * 0.34, -0.9, 0.9); c.stroke();
  const eye = Math.max(1.4, h * 0.1);
  blob(c, nose - len * 0.08, cy - h * 0.12, eye, eye, "#ffffff");
  blob(c, nose - len * 0.075, cy - h * 0.12, eye * 0.55, eye * 0.55, "#141414");
  c.strokeStyle = "rgba(0,0,0,0.45)";
  c.beginPath(); c.moveTo(nose, cy + h * 0.06); c.lineTo(nose - len * (0.04 + head * 0.12), cy + h * 0.1); c.stroke();
  if (L.whiskers) {
    c.strokeStyle = "rgba(30,25,20,0.7)"; c.lineWidth = Math.max(0.7, len * 0.006);
    for (let i = 0; i < L.whiskers; i++) {
      const down = i % 2 ? 1 : -0.4, reach = i < 2 ? 0.22 : 0.14;
      c.beginPath(); c.moveTo(nose - len * 0.02, cy + h * 0.08);
      c.quadraticCurveTo(nose + len * reach * 0.6, cy + h * 0.1 * down, nose + len * reach * 0.4, cy + h * (0.35 + 0.25 * down)); c.stroke();
    }
  }
}

/* ---------- sprites for the frame ---------- */

export const WORD = { SURGE: 0, JUMP: 1, RUSH: 2, CAUGHT: 3, SNAP: 4, AWAY: 5, NOTCH: 6, BOSS: 7, HOOK: 8, NEW: 9 } as const;
const WORDS = ["ঘাই!", "লাফ!", "ছুটে আসছে!", "ধরা পড়ল!", "ছিঁড়ল!", "ফসকাল", "দম ভাঙল!", "", "লেগেছে!", "অ্যালবামে নতুন"];
const WORD_COLORS = ["#ffb547", "#ffd166", "#9fd8ff", "#ffffff", "#ff7a6b", "#d8e6e2", "#ffd166", "#ffffff", "#ffffff", "#ffd166"];

/** A word that pops over the water, pre-rendered (`width` and `height` in world units on the canvas). */
export type Word = { canvas: HTMLCanvasElement; w: number; h: number };
export function wordSprite(L: Pick<Layout, "s" | "dpr">, text: string, color: string, size: number): Word {
  const probe = document.createElement("canvas").getContext("2d")!;
  probe.font = `800 ${size}px ${DISPLAY_FONT}, sans-serif`;
  const w = Math.ceil(probe.measureText(text).width + 12), h = Math.ceil(size * 1.5);
  const { canvas, c } = sprite(L, w, h);
  c.font = probe.font; c.textAlign = "center"; c.textBaseline = "middle";
  c.lineJoin = "round"; c.lineWidth = 4; c.strokeStyle = "rgba(12,24,20,0.7)";
  c.strokeText(text, w / 2, h / 2); c.fillStyle = color; c.fillText(text, w / 2, h / 2);
  return { canvas, w, h };
}

/** The caught fish's tag: name and weight on a small paper, made when it's caught. */
export function tagSprite(L: Pick<Layout, "s" | "dpr">, name: string, weight: string, note: string): Word {
  const probe = document.createElement("canvas").getContext("2d")!;
  probe.font = `800 15px ${DISPLAY_FONT}, sans-serif`;
  const a = probe.measureText(name).width;
  probe.font = `600 12px ${BODY_FONT}, sans-serif`;
  const b = probe.measureText(weight).width, n = note ? probe.measureText(note).width : 0;
  const w = Math.ceil(Math.max(a, b, n) + 22), h = note ? 58 : 42;
  const { canvas, c } = sprite(L, w, h);
  c.fillStyle = "rgba(255,250,238,0.96)";
  c.beginPath(); c.roundRect(1, 1, w - 2, h - 2, 10); c.fill();
  c.textAlign = "center"; c.textBaseline = "middle";
  c.fillStyle = "#17302a"; c.font = `800 15px ${DISPLAY_FONT}, sans-serif`; c.fillText(name, w / 2, 14);
  c.fillStyle = "#4d6660"; c.font = `600 12px ${BODY_FONT}, sans-serif`; c.fillText(weight, w / 2, 30);
  if (note) { c.fillStyle = "#b26a00"; c.fillText(note, w / 2, 46); }
  return { canvas, w, h };
}

export type Layers = Layout & {
  world: WorldId; dark: boolean;
  bg: HTMLCanvasElement;
  pad: HTMLCanvasElement;
  /** A soft dark oval for fish under the water, 100 × 40 units. */
  shadow: HTMLCanvasElement;
  /** Dusk: a dark sheet twice the world's size with a soft hole in its middle, blitted around the float. */
  dusk: HTMLCanvasElement | null;
  words: Word[];
  /** Fish sprites (120 units long), made on first use. */
  fish: (HTMLCanvasElement | null)[];
  /** The tag of the fish just caught. */
  tag: Word | null;
};

export function buildLayers(width: number, height: number, dpr: number, world: WorldId, dark: boolean): Layers {
  const L = layoutOf(width, height, dpr);
  const bg = sprite(L, L.ww, L.wh);
  paintWater(bg.c, L, world);
  const pad = sprite(L, 40, 18);
  drawPad(pad.c, 20, 9, 18, world === 1 ? "#f2a5c0" : null);
  const shadow = sprite(L, 100, 40);
  const g = shadow.c.createRadialGradient(50, 20, 2, 50, 20, 48);
  g.addColorStop(0, "rgba(8,22,18,0.62)"); g.addColorStop(0.6, "rgba(8,22,18,0.32)"); g.addColorStop(1, "rgba(8,22,18,0)");
  shadow.c.fillStyle = g; shadow.c.save(); shadow.c.scale(1, 0.4); shadow.c.beginPath(); shadow.c.arc(50, 50, 50, 0, TAU); shadow.c.restore(); shadow.c.fill();
  let dusk: HTMLCanvasElement | null = null;
  if (dark) {
    const sheet = sprite({ s: L.s, dpr: Math.min(1, dpr) }, L.ww * 2, L.wh * 2);
    const hole = sheet.c.createRadialGradient(L.ww, L.wh, 18, L.ww, L.wh, 120);
    hole.addColorStop(0, "rgba(6,14,22,0)"); hole.addColorStop(0.5, "rgba(6,14,22,0.55)"); hole.addColorStop(1, "rgba(6,14,22,0.86)");
    sheet.c.fillStyle = hole; sheet.c.fillRect(0, 0, L.ww * 2, L.wh * 2);
    dusk = sheet.canvas;
  }
  const words = WORDS.map((text, index) => wordSprite(L, text || " ", WORD_COLORS[index], index === WORD.NEW ? 13 : 20));
  return { ...L, world, dark, bg: bg.canvas, pad: pad.canvas, shadow: shadow.canvas, dusk, words, fish: FISH.map(() => null), tag: null };
}

/** The sprite of a fish, 120 units long, facing right; made once per layout. */
export function fishSprite(layers: Layers, index: number) {
  const made = layers.fish[index];
  if (made) return made;
  const { canvas, c } = sprite(layers, 130, 70);
  drawFish(c, 65, 35, 120, FISH[index]);
  layers.fish[index] = canvas;
  return canvas;
}

/** The boss's name over its shadow when it arrives. */
export function bossWord(layers: Layers, name: string) { layers.words[WORD.BOSS] = wordSprite(layers, name, "#ffd166", 22); }

/* ---------- the title picture and the story ---------- */

export const TITLE_ASPECT = 0.82;
/** The start button: the water, a giant float in its rings, and ছিপ ফেলো on a bamboo plank. */
export function drawTitle(canvas: HTMLCanvasElement, width: number, dpr: number, world: WorldId, label: string) {
  const height = Math.round(width * TITLE_ASPECT);
  canvas.width = Math.round(width * dpr); canvas.height = Math.round(height * dpr);
  const c = canvas.getContext("2d")!, k = width / 300, p = PALETTES[world];
  c.setTransform(dpr * k, 0, 0, dpr * k, 0, 0);
  const W = 300, H = 300 * TITLE_ASPECT;
  c.save(); c.beginPath(); c.roundRect(0, 0, W, H, 22); c.clip();
  let g = c.createLinearGradient(0, 0, 0, H);
  g.addColorStop(0, p.water[0]); g.addColorStop(1, p.water[1]);
  c.fillStyle = g; c.fillRect(0, 0, W, H);
  c.strokeStyle = p.shine; c.lineWidth = 1.2;
  const rnd = seq(7 + world);
  for (let i = 0; i < 14; i++) { const y = 10 + rnd() * (H - 20), x = rnd() * W; c.beginPath(); c.moveTo(x, y); c.lineTo(x + 14 + rnd() * 20, y); c.stroke(); }
  // A fish's shadow circling below, and the rings around the float.
  c.globalAlpha = 0.35; blob(c, W * 0.3, H * 0.66, 38, 10, "#06140f", -0.2); c.globalAlpha = 1;
  const fx = W * 0.56, fy = H * 0.5;
  c.strokeStyle = "rgba(255,255,255,0.55)";
  for (const [r, w] of [[24, 2], [44, 1.6], [66, 1.1]] as const) { c.lineWidth = w; c.beginPath(); c.ellipse(fx, fy + 12, r, r * 0.32, 0, 0, TAU); c.stroke(); }
  // The line from above, then the float: a black tip, a red cap over a white শোলা band.
  c.strokeStyle = "rgba(255,255,255,0.8)"; c.lineWidth = 0.9; c.beginPath(); c.moveTo(fx, -4); c.quadraticCurveTo(fx - 20, fy * 0.5, fx, fy - 42); c.stroke();
  c.fillStyle = "#1d1d1d"; c.fillRect(fx - 1.6, fy - 44, 3.2, 12);
  c.fillStyle = "#d6352b"; c.beginPath(); c.ellipse(fx, fy - 20, 9, 14, 0, 0, TAU); c.fill();
  c.fillStyle = "#f4f1ea"; c.fillRect(fx - 6, fy - 8, 12, 18);
  c.globalAlpha = 0.4; blob(c, fx, fy + 11, 16, 4, "#ffffff"); c.globalAlpha = 1;
  // The plank.
  const py = H - 58;
  c.fillStyle = "#c79a52"; c.beginPath(); c.roundRect(30, py, W - 60, 40, 9); c.fill();
  c.strokeStyle = "#8a6a2a"; c.lineWidth = 1.4;
  for (const x of [64, W - 64]) { c.beginPath(); c.moveTo(x, py + 4); c.lineTo(x, py + 36); c.stroke(); }
  g = c.createLinearGradient(0, py, 0, py + 40); g.addColorStop(0, "rgba(255,255,255,0.25)"); g.addColorStop(1, "rgba(0,0,0,0.12)");
  c.fillStyle = g; c.beginPath(); c.roundRect(30, py, W - 60, 40, 9); c.fill();
  c.fillStyle = "#2b1d0b"; c.font = `800 25px ${DISPLAY_FONT}, sans-serif`; c.textAlign = "center"; c.textBaseline = "middle";
  c.fillText(label, W / 2, py + 21);
  c.restore();
}

/** The first-run story's panels, drawn in code at 3:2. */
export function drawStory(canvas: HTMLCanvasElement, width: number, dpr: number, panel: number) {
  const height = Math.round((width * 2) / 3);
  canvas.width = Math.round(width * dpr); canvas.height = Math.round(height * dpr);
  const c = canvas.getContext("2d")!, k = width / 300, p = PALETTES[0];
  c.setTransform(dpr * k, 0, 0, dpr * k, 0, 0);
  const W = 300, H = 200;
  c.save(); c.beginPath(); c.roundRect(0, 0, W, H, 16); c.clip();
  let g = c.createLinearGradient(0, 0, 0, H);
  g.addColorStop(0, p.sky[0]); g.addColorStop(0.32, p.sky[1]); g.addColorStop(0.33, p.water[0]); g.addColorStop(1, p.water[1]);
  c.fillStyle = g; c.fillRect(0, 0, W, H);
  c.fillStyle = p.far; c.fillRect(0, 54, W, 12);
  coconut(c, 46, 60, 40, 5, "#5b4a2a", p.trees); coconut(c, 236, 60, 46, -6, "#5b4a2a", p.trees);
  blob(c, 250, 22, 12, 12, p.sun);
  if (panel === 0) {
    // The ঘাট: brick steps into the water, a lone float waiting.
    for (let i = 0; i < 5; i++) { c.fillStyle = i % 2 ? "#a4553c" : "#b8634a"; c.fillRect(20 + i * 12, 120 + i * 16, 150 - i * 24, 16); }
    c.fillStyle = "#d6352b"; c.beginPath(); c.ellipse(220, 130, 4, 6, 0, 0, TAU); c.fill();
    c.fillStyle = "#f4f1ea"; c.fillRect(217, 135, 6, 6);
  } else if (panel === 1) {
    // নানা's bamboo rod held out over the steps, the float hanging from it.
    c.strokeStyle = "#8a6a2a"; c.lineWidth = 6; c.lineCap = "round";
    c.beginPath(); c.moveTo(40, 196); c.quadraticCurveTo(120, 110, 230, 70); c.stroke();
    c.strokeStyle = "#d4ac55"; c.lineWidth = 4; c.beginPath(); c.moveTo(40, 196); c.quadraticCurveTo(120, 110, 230, 70); c.stroke();
    c.strokeStyle = "rgba(255,255,255,0.8)"; c.lineWidth = 0.8; c.beginPath(); c.moveTo(230, 70); c.lineTo(232, 124); c.stroke();
    c.fillStyle = "#d6352b"; c.beginPath(); c.ellipse(232, 128, 4, 6, 0, 0, TAU); c.fill();
    c.fillStyle = "#f4f1ea"; c.fillRect(229, 133, 6, 6);
    // An old hand around the butt, in a white পাঞ্জাবি sleeve.
    blob(c, 52, 182, 16, 11, "#b7835a", -0.6); c.fillStyle = "#f3efe6"; c.beginPath(); c.moveTo(0, 200); c.lineTo(34, 172); c.lineTo(52, 196); c.lineTo(20, 200); c.closePath(); c.fill();
  } else {
    // Something huge turns under the water.
    c.globalAlpha = 0.55; blob(c, 150, 140, 92, 24, "#06140f", -0.08); c.globalAlpha = 1;
    c.strokeStyle = "rgba(255,255,255,0.55)";
    for (const [r, w] of [[20, 2], [40, 1.5], [62, 1]] as const) { c.lineWidth = w; c.beginPath(); c.ellipse(200, 104, r, r * 0.3, 0, 0, TAU); c.stroke(); }
  }
  c.restore();
}

/* ---------- juice state, made once; draw.hot.ts mutates it ---------- */
export const RIPPLES = 12, POPS = 5, RAIN = 70;
export type Fx = {
  /** x, y, age, strength per ripple; word, x, y, age per pop (age < 0: free). */
  ripples: Float32Array; next: number; pops: Float32Array; popNext: number;
  /** Seconds left of a shake, a rod whip, a leap out of the water (and where it leapt). */
  shake: number; whip: number; leap: number; leapX: number; leapY: number;
  clock: number; slow: boolean;
  /** Where the float and the fish were last drawn, so events can ripple there. */
  floatX: number; floatY: number; fishX: number; fishY: number;
  /** Where a caught fish left the water. */
  catchX: number; catchY: number;
  rain: Float32Array;
};
export function makeFx(): Fx {
  const rain = new Float32Array(RAIN * 2), rnd = seq(5);
  for (let i = 0; i < RAIN; i++) { rain[i * 2] = rnd(); rain[i * 2 + 1] = rnd(); }
  return {
    ripples: new Float32Array(RIPPLES * 4).fill(-1), next: 0, pops: new Float32Array(POPS * 4).fill(-1), popNext: 0,
    shake: 0, whip: 0, leap: 0, leapX: 0, leapY: 0, clock: 0, slow: false,
    floatX: 0, floatY: 0, fishX: 0, fishY: 0, catchX: 0, catchY: 0, rain,
  };
}

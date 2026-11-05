// The field's still layers, one palette per world, painted once by scene.ts and by the share card: the sky, the village
// line, the paddy rows, the front clumps, the mist, the edge glows. All in field units; the caller sets the transform.
import { drawPaddy, type PaddyColors } from "./art";
import { H, HORIZON, W } from "./field";
import type { Look } from "./levels";

export type Palette = {
  sky: readonly [string, string, string]; sun: string; glow: string; cloud: readonly [string, string];
  village: readonly [string, string, string]; roof: string;
  field: readonly [string, string, string]; ridge: string; rows: string; far: string; paddy: PaddyColors;
  /** The tint that comes on towards dusk, the HUD's pill and ink, the gold for highlights, the danger glow's colour. */
  dusk: readonly [string, string]; pill: string; ink: string; gold: string;
  mist: boolean;
};

export const PALETTES: Record<Look, Palette> = {
  // হেমন্তের সোনালি বিকেল: the sun low over the village.
  amon: {
    sky: ["#f39a6b", "#f8b878", "#ffe0a0"], sun: "#fff6d6", glow: "#fff4c8", cloud: ["#f7c0a2aa", "#ffd9b8cc"],
    village: ["#a07c4e", "#8a6a40", "#7a5e3c"], roof: "#b9a58a",
    field: ["#f0c35c", "#e2a83e", "#c4862a"], ridge: "#b98a4e", rows: "#c8902e66", far: "#ffd46a99",
    paddy: ["#9c9a36", "#a8963a", "#b9a446", "#f3c650", "#e2a93a"],
    dusk: ["#6a2c5a", "#a0484033"], pill: "#3a2112b8", ink: "#fff6dc", gold: "#ffd257", mist: false,
  },
  // অগ্রহায়ণের সকাল: pale sky, a white sun through the mist, the paddy a softer gold.
  kuasha: {
    sky: ["#a9bcc4", "#cdd8d6", "#eef0e2"], sun: "#ffffff", glow: "#fffdf0", cloud: ["#ffffff66", "#ffffff88"],
    village: ["#9aa6a0", "#8a9690", "#7c8882"], roof: "#c4cac4",
    field: ["#dcc472", "#c9ab52", "#a98a3a"], ridge: "#a8946a", rows: "#9a8a4a55", far: "#f4e8a088",
    paddy: ["#8a9a52", "#9a9850", "#aaa65a", "#ecd27a", "#d6b452"],
    dusk: ["#3a4a6a", "#6a6a8a33"], pill: "#26323ab8", ink: "#f4f6ee", gold: "#ffe08a", mist: true,
  },
  // মোড়লের ক্ষেত at dusk: rose and violet over a deep red-gold field.
  morol: {
    sky: ["#6a4a8a", "#d06a7a", "#ffb07a"], sun: "#ffd8a0", glow: "#ffc890", cloud: ["#c06a8aaa", "#f0a090cc"],
    village: ["#6a4a5a", "#5a3e4c", "#4c3442"], roof: "#8a6a6a",
    field: ["#e8a84a", "#cc8432", "#9e5e22"], ridge: "#8e5a3a", rows: "#a0602a66", far: "#ffc06a88",
    paddy: ["#7a7a2e", "#8e7430", "#a08438", "#f0b444", "#d48a2e"],
    dusk: ["#2a1a4a", "#5a2a5a40"], pill: "#2a1630c0", ink: "#fff0e4", gold: "#ffc857", mist: false,
  },
};

/** The sky, the sun, the village line and the paddy rows, over field x from `left` to `right` and y from `top` to the bottom. */
export function paintField(context: CanvasRenderingContext2D, p: Palette, left: number, top: number, right: number) {
  const wide = right - left;
  const sky = context.createLinearGradient(0, top, 0, HORIZON);
  sky.addColorStop(0, p.sky[0]); sky.addColorStop(0.55, p.sky[1]); sky.addColorStop(1, p.sky[2]);
  context.fillStyle = sky; context.fillRect(left, top, wide, HORIZON - top + 4);
  const glow = context.createRadialGradient(84, HORIZON - 26, 10, 84, HORIZON - 26, 130);
  glow.addColorStop(0, p.glow); glow.addColorStop(0.3, p.glow + "99"); glow.addColorStop(1, p.glow + "00");
  context.fillStyle = glow; context.fillRect(left, HORIZON - 160, wide, 160);
  context.fillStyle = p.sun;
  context.beginPath(); context.arc(84, HORIZON - 24, 22, 0, Math.PI * 2); context.fill();
  for (const [x, y, w] of [[230, HORIZON - 120, 70], [300, HORIZON - 92, 52], [60, HORIZON - 100, 46], [170, HORIZON - 142, 40], [-60, HORIZON - 130, 60], [420, HORIZON - 116, 60]]) {
    context.fillStyle = p.cloud[0]; context.beginPath(); context.ellipse(x, y, w, 7, 0, 0, Math.PI * 2); context.fill();
    context.fillStyle = p.cloud[1]; context.beginPath(); context.ellipse(x - 6, y - 3, w * 0.7, 4, 0, 0, Math.PI * 2); context.fill();
  }

  // The village line: round trees, palms, a bamboo clump and a tin-roofed hut, repeated out to whatever width shows.
  const base = HORIZON - 2;
  for (let shift = Math.floor((left - 40) / W) * W; shift < right + 40; shift += W) {
    context.fillStyle = p.village[0];
    for (const [x, r] of [[20, 14], [140, 18], [176, 13], [236, 16], [330, 20], [356, 14]]) { context.beginPath(); context.arc(x + shift, base - r * 0.5, r, 0, Math.PI * 2); context.fill(); }
    context.fillStyle = p.village[1];
    for (const [x, peak] of [[46, 44], [118, 52], [262, 40], [318, 48]]) {
      const top2 = base - peak;
      context.fillRect(x + shift - 1.2, top2, 2.4, peak);
      for (let leaf = 0; leaf < 7; leaf++) { const a = -Math.PI / 2 + (leaf - 3) * 0.48; context.beginPath(); context.ellipse(x + shift + Math.cos(a) * 9, top2 + Math.sin(a) * 6 + 3, 11, 2.4, a, 0, Math.PI * 2); context.fill(); }
    }
    context.strokeStyle = p.village[1]; context.lineWidth = 1.8;
    context.beginPath(); for (let x = 196; x < 214; x += 3) { context.moveTo(x + shift, base); context.quadraticCurveTo(x + shift + 3, base - 26, x + shift + 11, base - 44 + (x % 7)); } context.stroke();
    context.fillStyle = p.village[2]; context.fillRect(shift + 60, base - 16, 30, 16);
    context.fillStyle = p.roof;
    context.beginPath(); context.moveTo(shift + 54, base - 14); context.lineTo(shift + 64, base - 26); context.lineTo(shift + 86, base - 26); context.lineTo(shift + 96, base - 14); context.closePath(); context.fill();
  }

  // The field: far rows hazy and fine, near rows deeper.
  const field = context.createLinearGradient(0, HORIZON - 4, 0, H);
  field.addColorStop(0, p.field[0]); field.addColorStop(0.35, p.field[1]); field.addColorStop(1, p.field[2]);
  context.fillStyle = field; context.fillRect(left, HORIZON - 4, wide, H - HORIZON + 8);
  // An আল (earthen ridge) runs across the far field.
  context.fillStyle = p.ridge;
  context.beginPath(); context.moveTo(left, HORIZON + 16); context.quadraticCurveTo(180, HORIZON + 4, right, HORIZON + 12); context.lineTo(right, HORIZON + 17); context.quadraticCurveTo(180, HORIZON + 9, left, HORIZON + 21); context.closePath(); context.fill();
  context.strokeStyle = p.rows; context.lineWidth = 1;
  context.beginPath();
  for (let y = HORIZON; y < H; y += 3 + (y - HORIZON) * 0.06) { context.moveTo(left, y); context.lineTo(right, y + 2); }
  context.stroke();
  context.fillStyle = p.far;
  for (let index = 0; index < 220; index++) {
    const x = left + ((index * 47) % Math.max(1, Math.ceil(wide))), y = HORIZON + ((index * 29) % 40);
    context.beginPath(); context.ellipse(x, y, 1.6, 1, 0.4, 0, Math.PI * 2); context.fill();
  }
  for (let row = 0; row < 12; row++) {
    const y = HORIZON + 30 + row * 21, size = 14 + row * 4, step = 22 + row * 3.2;
    for (let index = 0, x = left + ((row * 37) % 17) - 10; x < right + 20; index++, x += step * (0.75 + ((index * 13 + row * 7) % 10) / 20)) {
      context.save(); context.translate(x, y + ((index * 7 + row * 3) % 6) - 3); drawPaddy(context, size, (((index * 5 + row) % 5) - 2) * 0.14, index + row * 11, p.paddy); context.restore();
    }
  }
}

/** The nearest clumps, drawn over the birds so they sit down in the paddy: an 80-unit strip from `left` to `right`. */
export function paintFront(context: CanvasRenderingContext2D, p: Palette, left: number, right: number) {
  for (let index = 0, x = left - 6; x < right + 30; index++, x += 30) {
    context.save(); context.translate(x + (index % 3) * 7, 76 + (index % 2) * 4); drawPaddy(context, 36 + ((index * 5) % 3) * 6, (((index * 3) % 5) - 2) * 0.16, index * 7 + 3, p.paddy); context.restore();
  }
}

/** Soft bands of mist across the far field and the low sky (কুয়াশার সকাল only). */
export function paintMist(context: CanvasRenderingContext2D, left: number, top: number, right: number) {
  const wide = right - left;
  const haze = context.createLinearGradient(0, top, 0, H);
  haze.addColorStop(0, "#f4f6f000"); haze.addColorStop(0.45, "#f4f6f0aa"); haze.addColorStop(0.62, "#f4f6f066"); haze.addColorStop(1, "#f4f6f010");
  context.fillStyle = haze; context.fillRect(left, top, wide, H - top);
  context.fillStyle = "#ffffff55";
  for (const [x, y, w] of [[60, 200, 120], [240, 236, 150], [140, 300, 170], [320, 330, 110], [-40, 262, 130], [420, 280, 130]]) {
    context.beginPath(); context.ellipse(x, y, w, 14, 0, 0, Math.PI * 2); context.fill();
  }
}

/** A glow around the whole edge in `color`, or only along the bottom edge (`bottom`), for `width` × `height` CSS px. */
export function paintEdge(context: CanvasRenderingContext2D, width: number, height: number, color: string, bottom = false) {
  const edge = Math.min(width, height) * 0.16;
  const clear = color.slice(0, 7) + "00";
  const band = (x0: number, y0: number, x1: number, y1: number, x: number, y: number, w: number, h: number) => {
    const g = context.createLinearGradient(x0, y0, x1, y1);
    g.addColorStop(0, color); g.addColorStop(1, clear);
    context.fillStyle = g; context.fillRect(x, y, w, h);
  };
  band(0, height, 0, height - edge * 1.4, 0, height - edge * 1.4, width, edge * 1.4);
  if (bottom) return;
  band(0, 0, 0, edge, 0, 0, width, edge);
  band(0, 0, edge, 0, 0, 0, edge, height);
  band(width, 0, width - edge, 0, width - edge, 0, edge, height);
}

// All the art, drawn in code: one palette per পাড়া, the layers pre-rendered once per size (sky, flats, shops, the cable
// mesh), the sprites (the balloon, the crows, the edge pointer), and the pieces the card, the title and the story reuse.
// Browser only. Everything draws in street units; the caller scales the context.
import { makeRng } from "../../../shared/game-core";
import { CEIL, GROUND, lowWire, R, topWire, VH, VW, type Gate } from "./belun";
import type { WorldId } from "./levels";

export type Palette = {
  sky: readonly [string, string, string];
  /** The sun (afternoon), the low sun behind the towers (dusk) or the moon behind clouds (night). */
  sun: string; sunGlow: string; night: boolean;
  walls: readonly string[]; window: string; lit: string; litShare: number; tank: string; haze: string;
  shopWall: readonly [string, string]; shutter: string; stripes: readonly string[];
  signs: readonly (readonly [string, string, string])[];
  wire: readonly string[]; bundle: string; thread: string; pole: string; poleSide: string;
  /** A soft halo behind the wires and crows on a dark sky, so they still read at a glance. */
  halo: string;
  asphalt: string; kerb: string; lane: string;
  crow: string; nape: string;
  /** The edge pointer's tab. */
  tab: string; tabInk: string;
};

export const PALETTES: readonly Palette[] = [
  {
    sky: ["#f7b98a", "#fbd6a8", "#fde9cc"], sun: "#fffaf0", sunGlow: "#fff1d0", night: false,
    walls: ["#e3a98a", "#d9b79a", "#c9a48f", "#e8c3a0", "#cfae9b", "#dba487"], window: "#6f5a4f55", lit: "#ffe9a8", litShare: 0, tank: "#3b3a3f", haze: "#fde3c266",
    shopWall: ["#efe2cf", "#e6d3bc"], shutter: "#4b3f3a", stripes: ["#d9473a", "#2f7a4b", "#2b5a8a", "#e0a526"],
    signs: [["চা-নাশতা", "#2f7a4b", "#fff6e0"], ["ফটোকপি", "#f2c230", "#9b1f1f"], ["টেইলার্স", "#2b5a8a", "#ffffff"], ["বাখরখানি", "#c2412d", "#ffe28a"], ["ফার্মেসি", "#ffffff", "#1d7a46"], ["জুতা ঘর", "#7d3c98", "#ffffff"]],
    wire: ["#241d1c", "#3a302c", "#2c2522", "#4a3b33"], bundle: "#241d1c", thread: "#fff6ea", pole: "#b3aa9e", poleSide: "#8d857a", halo: "",
    asphalt: "#5d5651", kerb: "#cfc4b6", lane: "#e9e1d4", crow: "#241d1c", nape: "#7d7873", tab: "#241d1ce6", tabInk: "#fff6ea",
  },
  {
    sky: ["#5b3a6e", "#c4607a", "#f4a66a"], sun: "#ffe0b0", sunGlow: "#ffb98066", night: false,
    walls: ["#8a6a86", "#9b7a8f", "#7b6280", "#a1848f", "#86708e"], window: "#3b2a4566", lit: "#ffd27a", litShare: 0.35, tank: "#2c2433", haze: "#c4607a33",
    shopWall: ["#d7c2c8", "#cdb4bd"], shutter: "#3b2f3d", stripes: ["#e0435b", "#2a9d8f", "#f4a261", "#3d5a99"],
    signs: [["মোবাইল সার্ভিসিং", "#1f2b4d", "#ffd166"], ["বিরিয়ানি ঘর", "#c2412d", "#fff3c4"], ["লন্ড্রি", "#3d8fb5", "#ffffff"], ["কাপড়ের দোকান", "#7d3c98", "#ffe6f0"], ["মিষ্টিমুখ", "#f2c230", "#7a1d1d"], ["হার্ডওয়্যার", "#2f7a4b", "#ffffff"]],
    wire: ["#1d1622", "#2e2433", "#251c2a", "#3b2e40"], bundle: "#1d1622", thread: "#ffe9f0", pole: "#a59aa6", poleSide: "#7f7482", halo: "",
    asphalt: "#4a4250", kerb: "#bfb2bf", lane: "#e4d9e6", crow: "#17121b", nape: "#6c6470", tab: "#1d1622e6", tabInk: "#ffe9f0",
  },
  {
    sky: ["#070d22", "#13213f", "#24365a"], sun: "#dfe8ff", sunGlow: "#9fb4e633", night: true,
    walls: ["#1d2a44", "#22314f", "#18233a", "#273855"], window: "#0d152a", lit: "#f6d98a", litShare: 0.22, tank: "#0e1424", haze: "#24365a40",
    shopWall: ["#2a3550", "#253048"], shutter: "#141b2c", stripes: ["#c2412d", "#2a9d8f", "#d9a12b", "#3d5a99"],
    signs: [["ব্যাংক", "#1f6f5c", "#e8fff6"], ["চা-বিস্কুট", "#c2412d", "#fff3c4"], ["প্রিন্টার্স", "#2b5a8a", "#ffffff"], ["হোটেল", "#e9e1cf", "#a3172f"], ["ফটোস্ট্যাট", "#f2c230", "#7a1d1d"], ["বই ঘর", "#5a3d8a", "#ffffff"]],
    wire: ["#c9d4ea", "#aebbd6", "#d9e2f4", "#9aa8c4"], bundle: "#dfe7f7", thread: "#ffffff", pole: "#6d7a96", poleSide: "#4f5b75", halo: "#070d22",
    asphalt: "#1b2236", kerb: "#3f4a63", lane: "#7d8aa6", crow: "#0b0f1c", nape: "#59627a", tab: "#dfe7f7ee", tabInk: "#0b1430",
  },
];

/** The background strips repeat every TILE units. */
export const TILE = 480;
/** The flats layer covers the lane from FAR_TOP down to the pavement. */
export const FAR_TOP = 90;
export const SHOPS_H = 104;
/** The cable mesh tile: from MESH_TOP to MESH_TOP + MESH_H, over the lane. */
export const MESH_TOP = -14, MESH_H = CEIL + 22;

type Ctx = CanvasRenderingContext2D;
const TAU = Math.PI * 2;

/** A fresh canvas of `width` × `height` units at `scale` pixels a unit, painted once. */
export function layer(width: number, height: number, scale: number, paint: (c: Ctx) => void) {
  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, Math.ceil(width * scale));
  canvas.height = Math.max(1, Math.ceil(height * scale));
  const c = canvas.getContext("2d")!;
  c.scale(scale, scale);
  paint(c);
  return canvas;
}

/* ---------- the static sky ---------- */

/** The sky from `top` (units, may be negative: the extra sky over a tall phone) to the pavement, the sun or moon, and the asphalt. */
export function paintSky(c: Ctx, width: number, top: number, bottom: number, world: WorldId) {
  const p = PALETTES[world];
  const sky = c.createLinearGradient(0, top, 0, GROUND);
  sky.addColorStop(0, p.sky[0]); sky.addColorStop(0.55, p.sky[1]); sky.addColorStop(1, p.sky[2]);
  c.fillStyle = sky;
  c.fillRect(0, top, width, GROUND - top);
  // The sun or moon sits high, over the cable mesh, never behind a crossing; dusk's low sun sits behind the towers.
  const sx = width * (world === 1 ? 0.24 : 0.78), sy = world === 1 ? GROUND - 190 : Math.min(-10, top + 70);
  const glow = c.createRadialGradient(sx, sy, 0, sx, sy, world === 1 ? 120 : 80);
  glow.addColorStop(0, p.sunGlow); glow.addColorStop(1, `${p.sunGlow.slice(0, 7)}00`);
  c.fillStyle = glow; c.fillRect(0, top, width, GROUND - top);
  c.fillStyle = p.sun;
  c.beginPath(); c.arc(sx, sy, world === 1 ? 26 : 18, 0, TAU); c.fill();
  if (p.night) {
    // Clouds over the moon and a few stars between them.
    const rng = makeRng(77);
    c.fillStyle = "#ffffff";
    for (let i = 0; i < 40; i++) { c.globalAlpha = 0.25 + rng() * 0.5; c.fillRect(rng() * width, top + rng() * (GROUND - top - 220), 1.2, 1.2); }
    c.globalAlpha = 1;
    c.fillStyle = "#1b2a4dd9";
    for (let i = 0; i < 5; i++) { c.beginPath(); c.ellipse(sx - 40 + i * 26 + rng() * 10, sy + 10 + rng() * 14, 34, 11, 0, 0, TAU); c.fill(); }
  } else {
    // Far-off kites over the roofs (afternoon) or a line of birds going home (dusk), up in the open sky.
    const rng = makeRng(31 + world);
    for (let i = 0; i < 4; i++) {
      const x = 30 + rng() * (width - 60), y = top + 24 + rng() * Math.max(10, -top - 70);
      if (world === 0) {
        c.fillStyle = ["#ec5b2f", "#1f9a8a", "#7b4bb5", "#f2bd2c"][i];
        c.beginPath(); c.moveTo(x, y - 6); c.lineTo(x + 4.5, y); c.lineTo(x, y + 6); c.lineTo(x - 4.5, y); c.closePath(); c.fill();
        c.strokeStyle = "#6b5a4e80"; c.lineWidth = 0.6; c.beginPath(); c.moveTo(x, y + 6); c.quadraticCurveTo(x - 8, y + 18, x - 14, y + 34); c.stroke();
      } else {
        c.strokeStyle = "#2a183099"; c.lineWidth = 1.2;
        for (let b = 0; b < 3; b++) { const bx = x + b * 9, by = y + b * 4; c.beginPath(); c.moveTo(bx - 4, by - 2); c.quadraticCurveTo(bx, by + 1, bx, by); c.quadraticCurveTo(bx, by + 1, bx + 4, by - 2); c.stroke(); }
      }
    }
  }
  c.fillStyle = p.kerb; c.fillRect(0, GROUND, width, 7);
  c.fillStyle = p.asphalt; c.fillRect(0, GROUND + 7, width, bottom - GROUND - 7);
}

/** Flats in the haze: balconies, window grids, water tanks; lit windows at dusk and at night. Wraps at `width`. */
export function paintFar(c: Ctx, width: number, world: WorldId) {
  const p = PALETTES[world], rng = makeRng(20261 + world), hazed: number[] = [];
  for (let x = 0; x < width;) {
    const w = Math.min(width - x, 40 + Math.floor(rng() * 42)), h = (world === 2 ? 170 : 130) + Math.floor(rng() * (world === 2 ? 170 : 140)), top = GROUND - h;
    c.fillStyle = p.walls[Math.floor(rng() * p.walls.length)];
    c.fillRect(x, top, w, h);
    hazed.push(x, top - 11, w, h + 11);
    c.fillStyle = "#00000014";
    c.fillRect(x + w - 4, top, 4, h);
    for (let floor = top + 12; floor < GROUND - 70; floor += 16) {
      for (let wx = x + 6; wx < x + w - 10; wx += 11) {
        c.fillStyle = rng() < p.litShare ? p.lit : p.window;
        c.fillRect(wx, floor, 6, 7);
      }
      if (!p.night) { c.fillStyle = "#ffffff40"; c.fillRect(x + 3, floor + 9, w - 7, 1.5); }
    }
    if (rng() < 0.7) {
      c.fillStyle = p.tank;
      const tx = x + 6 + rng() * Math.max(1, w - 20);
      c.fillRect(tx, top - 9, 11, 9);
      c.fillRect(tx + 1, top - 10, 9, 1.5);
    }
    x += w;
  }
  // Haze: the far flats sit back in the dusty air (only the buildings, so no band shows in the sky).
  c.fillStyle = p.haze;
  for (let i = 0; i < hazed.length; i += 4) c.fillRect(hazed[i], hazed[i + 1], hazed[i + 2], hazed[i + 3]);
}

/** The shop row along the pavement: shutters, striped awnings, hand-painted signboards. Wraps at `width`. y 0 is SHOPS_H above the pavement. */
export function paintShops(c: Ctx, width: number, world: WorldId) {
  const p = PALETTES[world], rng = makeRng(5150 + world), each = width / p.signs.length, base = SHOPS_H;
  p.signs.forEach(([name, board, letters], index) => {
    const x = index * each;
    c.fillStyle = p.shopWall[index % 2];
    c.fillRect(x, base - 96, each, 96);
    c.fillStyle = p.shutter; c.fillRect(x + 6, base - 44, each - 12, 44);
    c.fillStyle = p.night ? "#f6d98a55" : "#9c948b"; c.fillRect(x + 6, base - 50, each - 12, 7);
    c.fillStyle = "#c9a36b"; c.fillRect(x + 12, base - 22, each - 24, 4);
    const stripe = p.stripes[Math.floor(rng() * p.stripes.length)];
    for (let sx = x + 3; sx < x + each - 3; sx += 8) {
      c.fillStyle = Math.round((sx - x) / 8) % 2 ? stripe : "#fbf3e3";
      c.beginPath(); c.moveTo(sx, base - 56); c.lineTo(sx + 8, base - 56); c.lineTo(sx + 9, base - 49); c.lineTo(sx - 1, base - 49); c.fill();
    }
    c.fillStyle = board;
    c.fillRect(x + 4, base - 80, each - 8, 21);
    c.strokeStyle = "#00000026"; c.lineWidth = 1; c.strokeRect(x + 4.5, base - 79.5, each - 9, 20);
    c.fillStyle = letters;
    c.textAlign = "center"; c.textBaseline = "middle";
    let size = 11;
    c.font = `700 ${size}px "Bangla"`;
    while (c.measureText(name).width > each - 14 && size > 6) { size -= 0.5; c.font = `700 ${size}px "Bangla"`; }
    c.fillText(name, x + each / 2, base - 69);
    if (p.night || world === 1) { c.fillStyle = "#ffe9a833"; c.fillRect(x + 4, base - 80, each - 8, 21); }
  });
  c.textAlign = "left"; c.textBaseline = "alphabetic";
}

/** Strokes the parabola through (left, a), (mid, b), (right, c) as one quadratic curve (exact for a parabola). */
export function sag(c: Ctx, left: number, right: number, a: number, b: number, d: number) {
  c.beginPath();
  c.moveTo(left, a);
  c.quadraticCurveTo((left + right) / 2, 2 * b - (a + d) / 2, right, d);
  c.stroke();
}

/** The mesh of cables strung over the lane, wall to wall: the lane's ceiling. y is street units. Wraps at `width`. */
export function paintMesh(c: Ctx, width: number, world: WorldId) {
  const p = PALETTES[world], rng = makeRng(4040 + world);
  c.lineCap = "round";
  // Each row's spans divide the tile exactly, so the mesh wraps without a seam.
  for (let j = 0; j < 6; j++) {
    const base = CEIL - 3 - j * 4.2, count = Math.max(1, Math.round(width / (96 + j * 14))), span = width / count, shift = (j * 17) % span;
    for (let x = shift - span; x < width + span; x += span) {
      const drop = 5 + ((Math.round((x - shift) / span) % count + count) % count * 7 + j * 3) % 9;
      if (p.halo) { c.strokeStyle = p.halo; c.lineWidth = 3.4; sag(c, x, x + span, base, base + drop, base); }
      c.strokeStyle = p.wire[j % p.wire.length]; c.lineWidth = j ? 1.2 + rng() * 0.8 : 2.4;
      sag(c, x, x + span, base, base + drop, base);
    }
  }
  // A few loose loops and a stray kite string hanging from the mesh.
  for (let i = 0; i < 4; i++) {
    const x = 40 + i * 120 + rng() * 40;
    c.strokeStyle = p.wire[1]; c.lineWidth = 1.3;
    c.beginPath(); c.ellipse(x, CEIL - 1, 6, 4, 0.2, 0, TAU); c.stroke();
    c.strokeStyle = p.thread; c.lineWidth = 0.8;
    c.beginPath(); c.moveTo(x + 30, CEIL - 6); c.quadraticCurveTo(x + 36, CEIL + 4, x + 33, CEIL + 9); c.stroke();
  }
  c.lineCap = "butt";
}

/* ---------- pieces ---------- */

const TIED: ReadonlyArray<readonly [number, number, string]> = [[-14, -138, "#f2bd2c"], [12, -142, "#1f9a8a"], [-2, -156, "#e2364f"], [-20, -118, "#7b4bb5"], [18, -120, "#ec5b2f"]];

/** The বেলুনওয়ালা's bamboo stick with its bunch of balloons, where the runaway came from. `gone` leaves the red one's knot empty. */
export function drawStick(c: Ctx, x: number, ground: number, gone = true) {
  c.strokeStyle = "#a8834a"; c.lineWidth = 3;
  c.beginPath(); c.moveTo(x, ground + 4); c.lineTo(x + 2, ground - 112); c.stroke();
  c.lineWidth = 0.8; c.strokeStyle = "#5b4a3e";
  for (const [dx, dy, color] of TIED) {
    if (gone && color === "#e2364f") continue;
    c.beginPath(); c.moveTo(x + 2, ground - 110); c.lineTo(x + dx, ground + dy + 11); c.stroke();
  }
  for (const [dx, dy, color] of TIED) {
    if (gone && color === "#e2364f") continue;
    c.fillStyle = color;
    c.beginPath(); c.ellipse(x + dx, ground + dy, 10, 11.5, 0, 0, TAU); c.fill();
    c.fillStyle = "#ffffff66";
    c.beginPath(); c.ellipse(x + dx - 3.5, ground + dy - 4, 2.5, 3.5, -0.5, 0, TAU); c.fill();
  }
}

/** A perched house crow (grey nape and all), or a flying one when `flap` is a number. Facing left by default (towards the balloon). */
export function drawCrow(c: Ctx, x: number, y: number, facing: 1 | -1, flap: number | null, world: WorldId, size = 1) {
  const p = PALETTES[world];
  c.save();
  c.translate(x, y);
  c.scale(facing * size, size);
  if (p.halo) { c.shadowColor = "#dfe7f7"; c.shadowBlur = 4; }
  c.fillStyle = p.crow;
  if (flap === null) {
    c.beginPath(); c.moveTo(-5, -5); c.lineTo(-13, -1); c.lineTo(-11, -4.5); c.fill();
    c.beginPath(); c.ellipse(-1, -6, 7, 4.6, -0.3, 0, TAU); c.fill();
    c.beginPath(); c.arc(5, -11, 3.4, 0, TAU); c.fill();
    c.shadowBlur = 0;
    c.fillStyle = p.nape;
    c.beginPath(); c.ellipse(3.2, -8.6, 2.6, 2.8, 0.4, 0, TAU); c.fill();
    c.fillStyle = p.crow;
    c.beginPath(); c.moveTo(7.8, -12); c.lineTo(12, -10.4); c.lineTo(7.8, -9.6); c.fill();
    c.strokeStyle = p.crow; c.lineWidth = 1;
    c.beginPath(); c.moveTo(-1, -2); c.lineTo(-1, 0.5); c.moveTo(2, -2); c.lineTo(2, 0.5); c.stroke();
    c.fillStyle = "#fff"; c.beginPath(); c.arc(6, -11.6, 0.8, 0, TAU); c.fill();
  } else {
    const lift = Math.sin(flap) * 7;
    c.beginPath(); c.ellipse(0, 0, 7.5, 3.8, -0.1, 0, TAU); c.fill();
    c.beginPath(); c.arc(-7.5, -1.5, 3.2, 0, TAU); c.fill();
    c.beginPath(); c.moveTo(-10, -2.2); c.lineTo(-14, -1); c.lineTo(-10, -0.2); c.fill();
    c.beginPath(); c.moveTo(6, -1); c.lineTo(13, 1.5); c.lineTo(6, 2.4); c.fill();
    c.beginPath(); c.moveTo(-3, -1); c.lineTo(1, -13 + lift * 1.3); c.lineTo(4, -1); c.fill();
    c.beginPath(); c.moveTo(-2, 1); c.lineTo(2, 8 - lift * 0.4); c.lineTo(4, 1); c.fill();
    c.shadowBlur = 0;
    c.fillStyle = p.nape;
    c.beginPath(); c.ellipse(-5.5, -1.2, 2.2, 2.4, 0, 0, TAU); c.fill();
    c.fillStyle = "#fff"; c.beginPath(); c.arc(-8.5, -2.4, 0.8, 0, TAU); c.fill();
  }
  c.restore();
}

const KITES = ["#ec5b2f", "#1f9a8a", "#f2bd2c"];
function drawKite(c: Ctx, x: number, y: number, color: string) {
  c.save();
  c.translate(x, y); c.rotate(-0.5);
  c.fillStyle = color;
  c.beginPath(); c.moveTo(0, -11); c.lineTo(8, 0); c.lineTo(0, 11); c.lineTo(-8, 0); c.closePath(); c.fill();
  c.strokeStyle = "#00000040"; c.lineWidth = 0.8;
  c.beginPath(); c.moveTo(0, -11); c.lineTo(0, 11); c.moveTo(-8, 0); c.lineTo(8, 0); c.stroke();
  c.strokeStyle = color; c.lineWidth = 1.2;
  c.beginPath(); c.moveTo(0, 11); c.quadraticCurveTo(5, 15, 1, 19); c.stroke();
  c.restore();
}

/** The balloon: knot, a soft highlight, a light rim on a dark sky. (0, 0) is its centre; R is its radius. */
export function paintBalloon(c: Ctx, world: WorldId, body = "#e2364f", light = "#ff8f9b", deep = "#a3172f") {
  const shine = c.createRadialGradient(-5, -7, 1, 0, 0, R * 1.25);
  shine.addColorStop(0, light); shine.addColorStop(0.45, body); shine.addColorStop(1, deep);
  c.fillStyle = deep;
  c.beginPath(); c.moveTo(0, R * 1.12); c.lineTo(3.5, R * 1.2 + 4); c.lineTo(-3.5, R * 1.2 + 4); c.fill();
  c.fillStyle = shine;
  c.beginPath(); c.ellipse(0, 0, R, R * 1.17, 0, 0, TAU); c.fill();
  c.strokeStyle = PALETTES[world].night ? "#ffd0d6" : deep; c.lineWidth = 1.2; c.stroke();
  c.fillStyle = "#ffffffa6";
  c.beginPath(); c.ellipse(-5.5, -7, 3, 5.5, 0.45, 0, TAU); c.fill();
}

/**
 * One crossing at screen x `sx` with its middle at `cy`: poles and taut wires below the gap, a hanging loop of cables
 * above it reaching up to the mesh, a stray kite string, maybe a caught kite. Used by the card, the title and the story;
 * the game's own frame draws the same shapes in draw.hot.ts.
 */
export function drawGate(c: Ctx, gate: Gate, cy: number, sx: number, world: WorldId) {
  const p = PALETTES[world], left = sx - gate.w, right = sx + gate.w;
  for (let side = -1; side <= 1; side += 2) {
    const px = side < 0 ? left : right, top = lowWire(gate, cy, side) - 5;
    c.fillStyle = p.pole; c.fillRect(px - 3.5, top, 7, GROUND - top + 3);
    c.fillStyle = p.poleSide; c.fillRect(px + 1, top, 2.5, GROUND - top + 3);
  }
  for (let j = 3; j >= 0; j--) {
    c.strokeStyle = p.wire[j]; c.lineWidth = j ? 1.5 : 2.4;
    const drop = j * 9;
    sag(c, left, right, lowWire(gate, cy, -1) + drop, lowWire(gate, cy, 0) + drop + j * 3, lowWire(gate, cy, 1) + drop);
  }
  const a0 = topWire(gate, cy, -1), b0 = topWire(gate, cy, 0), c0 = topWire(gate, cy, 1);
  for (let j = 5; j >= 0; j--) {
    c.strokeStyle = p.wire[j % 4]; c.lineWidth = j ? 1.3 : 2.4;
    const lift = j * 8;
    sag(c, left, right, a0 - lift, b0 - lift, c0 - lift);
  }
  c.strokeStyle = p.bundle; c.lineWidth = 5; c.lineCap = "round";
  c.beginPath();
  c.moveTo(left + 3, CEIL - 4); c.lineTo(left + 3, a0 - 3);
  c.moveTo(right - 3, CEIL - 4); c.lineTo(right - 3, c0 - 3);
  c.stroke();
  c.lineCap = "butt";
  c.strokeStyle = p.thread; c.lineWidth = 0.9;
  c.beginPath(); c.moveTo(left + 3, a0 - 40); c.lineTo(right - 3, c0 - 12); c.stroke();
  if (gate.kite >= 0) drawKite(c, sx + gate.w * 0.35, topWire(gate, cy, 0.35) - 24, KITES[gate.kite]);
}

/* ---------- the layers ---------- */

export type Layers = {
  /** CSS pixels of the canvas, the device-pixel ratio, CSS pixels a unit and the lane's top in CSS pixels. */
  width: number; height: number; dpr: number; scale: number; oy: number;
  /** Units visible across, and above the lane's top (the extra sky on a tall phone). */
  viewW: number; above: number;
  world: WorldId;
  sky: HTMLCanvasElement; far: HTMLCanvasElement; shops: HTMLCanvasElement; mesh: HTMLCanvasElement;
  balloon: HTMLCanvasElement; crows: HTMLCanvasElement; perched: HTMLCanvasElement; pointer: HTMLCanvasElement; pointerBoss: HTMLCanvasElement; stick: HTMLCanvasElement;
};

/** Balloon sprite: 2.6 R wide, 3.2 R high, centre at (1.3 R, 1.3 R). */
export const BALLOON_W = R * 2.6, BALLOON_H = R * 3.2, BALLOON_CX = R * 1.3, BALLOON_CY = R * 1.3;
/** Crow atlas: four flying frames, each CROW_CELL units square. */
export const CROW_CELL = 32, CROW_FRAMES = 4;
export const POINTER_W = 34, POINTER_H = 24;
const HUD_ROOM = 46;

/** Everything that never changes, at the canvas's real pixel scale. Rebuild when the size, the world or the fonts change. */
export function buildLayers(width: number, height: number, dpr: number, world: WorldId): Layers {
  // A tall phone shows the lane a little bigger (cropping some street ahead, never the lane's height); the rest is sky.
  // At least HUD_ROOM px stay above the lane's top for the corner HUD, so it never sits on the cable mesh.
  const scale = Math.min((width / VW) * 1.22, (height - HUD_ROOM) / VH), oy = height - VH * scale, px = scale * dpr;
  const viewW = width / scale, above = oy / scale;
  const sky = document.createElement("canvas");
  sky.width = Math.round(width * dpr); sky.height = Math.round(height * dpr);
  const s = sky.getContext("2d")!;
  s.setTransform(px, 0, 0, px, 0, oy * dpr);
  paintSky(s, viewW + 2, -above - 2, VH + 2, world);
  const p = PALETTES[world];
  return {
    width, height, dpr, scale, oy, viewW, above, world, sky,
    far: layer(TILE, GROUND - FAR_TOP, px * 0.75, c => { c.translate(0, -FAR_TOP); paintFar(c, TILE, world); }),
    shops: layer(TILE, SHOPS_H, px, c => paintShops(c, TILE, world)),
    mesh: layer(TILE, MESH_H, px, c => { c.translate(0, -MESH_TOP); paintMesh(c, TILE, world); }),
    balloon: layer(BALLOON_W, BALLOON_H, px * 1.25, c => { c.translate(BALLOON_CX, BALLOON_CY); paintBalloon(c, world); }),
    crows: layer(CROW_CELL * CROW_FRAMES, CROW_CELL, px * 1.4, c => {
      for (let f = 0; f < CROW_FRAMES; f++) drawCrow(c, CROW_CELL * f + CROW_CELL / 2, CROW_CELL / 2, 1, (f / CROW_FRAMES) * TAU, world);
    }),
    perched: layer(20, 20, px * 1.4, c => drawCrow(c, 10, 18, -1, null, world)),
    pointer: layer(POINTER_W, POINTER_H, px, c => paintPointer(c, p.tab, p.tabInk, world)),
    pointerBoss: layer(POINTER_W, POINTER_H, px, c => paintPointer(c, "#c23d31ee", "#fff6ea", world)),
    stick: layer(60, 170, px, c => drawStick(c, 30, 160)),
  };
}

/** The edge pointer: a tab with a crow's head and a chevron pointing in, at the height the crow will come. */
function paintPointer(c: Ctx, tab: string, ink: string, world: WorldId) {
  c.fillStyle = tab;
  c.beginPath(); c.roundRect(1, 1, POINTER_W - 2, POINTER_H - 2, 9); c.fill();
  c.fillStyle = ink;
  c.beginPath(); c.moveTo(6, POINTER_H / 2); c.lineTo(12, POINTER_H / 2 - 6); c.lineTo(12, POINTER_H / 2 + 6); c.closePath(); c.fill();
  c.save(); c.translate(23, POINTER_H / 2 + 1);
  c.fillStyle = PALETTES[world].night ? "#0b0f1c" : ink;
  c.beginPath(); c.arc(0, -2, 4.6, 0, TAU); c.fill();
  c.beginPath(); c.moveTo(-3.5, -3.4); c.lineTo(-9, -1.6); c.lineTo(-3.5, -0.4); c.fill();
  c.beginPath(); c.ellipse(2, 4, 5.5, 3.4, 0.4, 0, TAU); c.fill();
  c.fillStyle = tab; c.beginPath(); c.arc(-1.6, -3, 1, 0, TAU); c.fill();
  c.restore();
}

/* ---------- the frame's own animations (pools made once; draw.hot.ts mutates them) ---------- */

export const BITS = 24, BF = 6;
export const PUFFS = 6, PF = 3;
export const SPARKS = 12, SF = 5;
export const RAIN = 46;
export type Fx = {
  seed: number; slow: boolean;
  shake: number;
  /** Lightning: seconds of flash left, and until the next one. */
  flash: number; nextFlash: number;
  /** Rubber bits after a pop: x, y, vx, vy, age, spin. */
  bits: Float32Array;
  /** Air puffs under the knot after a press: x, y, age. */
  puffs: Float32Array;
  /** Rubber sparks off a scrape: x, y, vx, vy, age. */
  sparks: Float32Array;
  rain: Float32Array;
  /** A word over the street (ফটাস!, ঘষা, কা!): which, its age and where. */
  word: number; wordAge: number; wordX: number; wordY: number;
  /** The crossing that shivers after a scrape, and for how long. */
  shiver: number; shiverAge: number;
  /** The balloon's own squash after a press and its wobble. */
  squash: number;
};

export function makeFx(): Fx {
  const fx: Fx = {
    seed: 12345, slow: false, shake: 0, flash: 0, nextFlash: 4,
    bits: new Float32Array(BITS * BF), puffs: new Float32Array(PUFFS * PF), sparks: new Float32Array(SPARKS * SF), rain: new Float32Array(RAIN * 2),
    word: -1, wordAge: 9, wordX: 0, wordY: 0, shiver: -1, shiverAge: 9, squash: 0,
  };
  const rng = makeRng(99);
  for (let i = 0; i < RAIN; i++) { fx.rain[i * 2] = rng() * 640; fx.rain[i * 2 + 1] = rng() * 640 - 120; }
  return fx;
}

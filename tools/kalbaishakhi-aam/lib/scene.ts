// Sets up the yard for one stage size and world: every still thing is painted once into offscreen canvases here, and the
// strings the HUD needs are made here too, so draw.hot.ts only stamps sprites. Ambient motion (rain, leaves) uses its own
// small noise, never the storm's: the storm stays the same on every phone.
import { DISPLAY_FONT } from "../../../shared/card-canvas";
import { drawBigBranch, drawBranch, drawDalaBack, drawDalaFront, drawGold, drawHail, drawHeart, drawMango, PALETTES, pileSlots, type Look, type Palette } from "./art";
import { lightningTimes, type Storm } from "./gen";
import { bn } from "./link";
import { BASKET_Y, H, SPAWN_Y, W } from "./physics";
import type { Game } from "./game";

export type Sprite = { canvas: HTMLCanvasElement; w: number; h: number };
export type Popup = { x: number; t: number; text: string; color: string };

export const LEAVES = 9, RAIN = 44, DALA = 96, MANGO = 20, BRANCH_LEN = 42, BIG_LEN = 96, HAIL_SIZE = 11, PILE = 15;
export const SLOTS = pileSlots(PILE, DALA);
export const MAX_NUMBER = 3000;
/** Bangla numerals for every score, second and streak the HUD can show, made once. */
export const NUMBERS: string[] = [];
export const STREAKS: string[] = [];
export const PLUS = ["+৫", "+১০", "", "+২৫", "", ""];
export const MINUS = ["−৫", "−১০", "", "−২৫", "", ""];
export const FONT_HUD = `800 19px ${DISPLAY_FONT}`;
export const FONT_POP = `800 20px ${DISPLAY_FONT}`;
export const FONT_SMALL = `700 13px ${DISPLAY_FONT}`;
export const FONT_NAME = `800 14px ${DISPLAY_FONT}`;
function numbers() {
  if (NUMBERS.length) return;
  for (let value = 0; value <= MAX_NUMBER; value++) NUMBERS.push(bn(value));
  for (let value = 0; value <= 300; value++) STREAKS.push(`টানা ${bn(value)}`);
}

export type Scene = {
  context: CanvasRenderingContext2D; k: number; cssWidth: number; cssHeight: number;
  /** The scene's logical height (450 or taller), how far the field sits below the top, and how far the canopy is lifted
   *  on a tall stage (the fall is drawn longer to meet the rim at the same moment; the rules never see it). */
  hs: number; oy: number; lift: number; stretch: number;
  look: Look; palette: Palette;
  bg: Sprite; trunk: Sprite; clouds: Sprite; canopy: Sprite; leaf: Sprite;
  /** One sprite per drop kind: green, ripe, twig, gold, hail, big branch. */
  kinds: Sprite[];
  dalaBack: Sprite; dalaFront: Sprite; hearts: [Sprite, Sprite];
  /** Edge glows: orange for the last জান, red for a hit, pale blue for hail coming, amber for the tree's shake. */
  edgeOrange: Sprite; edgeRed: Sprite; edgeIce: Sprite; edgeTop: Sprite;
  clock: number; wind: number; leaves: Float32Array; rain: Float32Array; noise: number;
  popups: Popup[]; seen: number; catchAt: number; hitAt: number; knockAt: number; knockKind: number; knockX: number;
  game: Game | null; bolts: number[]; boltsFor: Storm | null;
};

/** Paints `w`×`h` logical units into a canvas at `k` device pixels per unit, with `origin` at the given logical point. */
function sprite(w: number, h: number, k: number, paint: (context: CanvasRenderingContext2D) => void, origin: [number, number] = [w / 2, h / 2]): Sprite {
  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, Math.ceil(w * k)); canvas.height = Math.max(1, Math.ceil(h * k));
  const context = canvas.getContext("2d")!;
  context.setTransform(k, 0, 0, k, origin[0] * k, origin[1] * k);
  paint(context);
  return { canvas, w, h };
}

function paintBackground(context: CanvasRenderingContext2D, p: Palette, oy: number) {
  const sky = context.createLinearGradient(0, -oy, 0, 300);
  sky.addColorStop(0, p.sky[0]); sky.addColorStop(0.42 + 0.3 * oy / (oy + 300), p.sky[1]); sky.addColorStop(0.86, p.sky[2]); sky.addColorStop(1, p.sky[3]);
  context.fillStyle = sky; context.fillRect(0, -oy, W, 302 + oy);
  const puffs = [[20, 196, 46], [80, 182, 54], [150, 192, 48], [215, 176, 58], [290, 188, 52], [350, 200, 44]];
  context.fillStyle = p.clouds;
  for (const [x, y, r] of puffs) { context.beginPath(); context.arc(x, y, r, 0, Math.PI * 2); context.fill(); }
  context.fillRect(0, 196, W, 26);
  context.fillStyle = p.cloudLight;
  for (const [x, y, r] of puffs) { context.beginPath(); context.ellipse(x, y + r * 0.62, r * 0.8, r * 0.18, 0, 0, Math.PI * 2); context.fill(); }
  const glow = context.createLinearGradient(0, 214, 0, 300);
  glow.addColorStop(0, p.glow + "00"); glow.addColorStop(1, p.glow);
  context.fillStyle = glow; context.fillRect(0, 214, W, 88);

  // The village line: palms, a bamboo clump, round trees and a tin-roofed hut.
  context.fillStyle = p.village;
  for (const [x, top] of [[30, 256], [205, 250], [245, 262]]) {
    context.fillRect(x - 1.5, top, 3, 302 - top);
    for (let leaf = 0; leaf < 6; leaf++) { const a = -Math.PI / 2 + (leaf - 2.5) * 0.55; context.beginPath(); context.ellipse(x + Math.cos(a) * 9, top + Math.sin(a) * 5 + 3, 11, 2.6, a, 0, Math.PI * 2); context.fill(); }
  }
  for (const [x, r] of [[60, 18], [96, 24], [140, 20], [176, 16], [340, 22]]) { context.beginPath(); context.arc(x, 300 - r * 0.7, r, 0, Math.PI * 2); context.fill(); }
  context.strokeStyle = p.village; context.lineWidth = 2;
  for (let x = 118; x < 132; x += 3) { context.beginPath(); context.moveTo(x, 300); context.quadraticCurveTo(x + 4, 268, x + 12, 250 + (x % 7)); context.stroke(); }
  context.fillStyle = p.hut; context.fillRect(276, 280, 46, 22);
  context.fillStyle = p.roof;
  context.beginPath(); context.moveTo(268, 283); context.lineTo(282, 266); context.lineTo(318, 266); context.lineTo(330, 283); context.closePath(); context.fill();
  context.fillStyle = "#00000055"; context.fillRect(293, 288, 10, 14);
  if (p === PALETTES.night) { context.fillStyle = "#ffcf6a"; context.fillRect(295, 290, 6, 7); }

  const field = context.createLinearGradient(0, 300, 0, 372);
  field.addColorStop(0, p.field[0]); field.addColorStop(1, p.field[1]);
  context.fillStyle = field; context.fillRect(0, 300, W, 76);
  context.strokeStyle = "#ffffff1c"; context.lineWidth = 1;
  context.beginPath(); for (let y = 306; y < 370; y += 7 + (y - 300) * 0.08) { context.moveTo(0, y); context.lineTo(W, y); } context.stroke();
  const yard = context.createLinearGradient(0, 366, 0, H);
  yard.addColorStop(0, p.yard[0]); yard.addColorStop(1, p.yard[1]);
  context.fillStyle = yard;
  context.beginPath(); context.moveTo(0, 372);
  for (let x = 0; x <= W; x += 30) context.quadraticCurveTo(x + 15, 364 + (x % 60 ? 3 : -2), x + 30, 370);
  context.lineTo(W, H); context.lineTo(0, H); context.closePath(); context.fill();
  context.fillStyle = "#00000018";
  for (let index = 0; index < 26; index++) { const x = (index * 97) % W, y = 384 + ((index * 53) % 62); context.beginPath(); context.ellipse(x, y, 3 + (index % 3), 1.2, 0, 0, Math.PI * 2); context.fill(); }
}

function paintTrunk(context: CanvasRenderingContext2D, p: Palette, oy: number) {
  context.fillStyle = p.trunk;
  context.beginPath();
  context.moveTo(44, 404); context.quadraticCurveTo(62, 396, 64, 340); context.lineTo(68, 120 - oy); context.lineTo(90, 120 - oy); context.lineTo(90, 340);
  context.quadraticCurveTo(92, 394, 112, 404); context.quadraticCurveTo(78, 398, 44, 404); context.fill();
  context.strokeStyle = "#00000040"; context.lineWidth = 1.4;
  context.beginPath(); context.moveTo(72, 150); context.lineTo(70, 360); context.moveTo(83, 170); context.lineTo(85, 330); context.moveTo(77, 230); context.lineTo(76, 300); context.stroke();
  context.fillStyle = "#00000022";
  context.beginPath(); context.ellipse(78, 405, 44, 5, 0, 0, Math.PI * 2); context.fill();
}

function paintClouds(context: CanvasRenderingContext2D, p: Palette) {
  context.fillStyle = p.clouds;
  context.globalAlpha = 0.5;
  for (let index = 0; index < 14; index++) {
    const x = index * 52 + (index % 3) * 9, y = 40 + ((index * 37) % 34), r = 22 + ((index * 13) % 16);
    context.beginPath(); context.ellipse(x, y, r * 1.5, r * 0.62, 0, 0, Math.PI * 2); context.fill();
    context.beginPath(); context.ellipse(x - W * 2, y, r * 1.5, r * 0.62, 0, 0, Math.PI * 2); context.fill();
  }
  context.globalAlpha = 1;
}

/** The canopy from the top of a tall stage down to its hanging lower edge at about y = 140. */
function paintCanopy(context: CanvasRenderingContext2D, p: Palette, oy: number) {
  const top = -oy - 20;
  context.fillStyle = p.canopy[0];
  context.fillRect(-30, top, W + 60, 40 + oy);
  // Sky through the leaves, higher up the tall stages.
  context.fillStyle = p.sky[1];
  for (let y = top + 30, row = 0; y < -30; y += 46, row++) {
    for (let x = (row % 2) * 40; x < W; x += 92) { context.beginPath(); context.ellipse(x + ((row * 37 + x) % 30), y, 9, 6, 0.4, 0, Math.PI * 2); context.fill(); }
  }
  for (let layer = 0, y0 = top; y0 < -10; layer = (layer + 1) % 3, y0 += 34) {
    context.fillStyle = p.canopy[layer];
    for (let index = 0; index < 10; index++) { context.beginPath(); context.arc(-30 + index * 44 + ((index * 23 + y0) % 26 + 26) % 26, y0 + ((index * 17) % 20), 24 + (index % 3) * 4, 0, Math.PI * 2); context.fill(); }
  }
  for (let layer = 0; layer < 4; layer++) {
    for (let index = 0; index < 11; index++) {
      const x = -30 + index * 40 + ((index * 17 + layer * 23) % 22), y = -10 + layer * 30 + ((index * 29 + layer * 11) % 26) - (layer === 3 ? 6 : 0);
      context.fillStyle = p.canopy[layer];
      context.beginPath(); context.arc(x, y, 30 - layer * 3 + ((index * 7) % 9), 0, Math.PI * 2); context.fill();
    }
  }
  context.fillStyle = p.canopy[3];
  for (let index = 0; index < 24; index++) {
    const x = -20 + index * 17, y = 112 + ((index * 31) % 24), a = 1.2 + ((index * 7) % 5) * 0.12;
    context.beginPath(); context.ellipse(x, y, 13, 3.4, a, 0, Math.PI * 2); context.fill();
  }
  context.fillStyle = p.leaf;
  for (let index = 0; index < 18; index++) { const x = -6 + index * 22, y = 40 + ((index * 41) % 70); context.beginPath(); context.ellipse(x, y, 9, 2.6, 0.5 + (index % 4) * 0.3, 0, Math.PI * 2); context.fill(); }
}

/** An edge glow: transparent in the middle, `color` along all four sides (or only the top). */
function paintEdge(context: CanvasRenderingContext2D, hs: number, color: string, topOnly = false) {
  const depth = 46;
  const sides: Array<[number, number, number, number, number, number, number, number]> = topOnly
    ? [[0, 0, 0, depth * 1.6, 0, 0, W, depth * 1.6]]
    : [[0, 0, 0, depth, 0, 0, W, depth], [0, hs, 0, hs - depth, 0, hs - depth, W, depth], [0, 0, depth, 0, 0, 0, depth, hs], [W, 0, W - depth, 0, W - depth, 0, depth, hs]];
  for (const [x0, y0, x1, y1, rx, ry, rw, rh] of sides) {
    const gradient = context.createLinearGradient(x0, y0, x1, y1);
    gradient.addColorStop(0, color); gradient.addColorStop(1, color.slice(0, 7) + "00");
    context.fillStyle = gradient; context.fillRect(rx, ry, rw, rh);
  }
}

export function makeScene(canvas: HTMLCanvasElement, cssWidth: number, cssHeight: number, look: Look, dark: boolean, previous?: Scene | null): Scene {
  numbers();
  const ratio = Math.min(2, window.devicePixelRatio || 1);
  canvas.width = Math.round(cssWidth * ratio); canvas.height = Math.round(cssHeight * ratio);
  const k = cssWidth / W * ratio, hs = Math.max(H, cssHeight / cssWidth * W), oy = hs - H;
  const lift = Math.min(190, oy * 0.6), extend = oy - lift;
  const p = PALETTES[look];
  let noise = 7;
  const next = () => { noise = (Math.imul(noise, 1103515245) + 12345) >>> 0; return (noise >>> 8) / 16777216; };
  const leaves = new Float32Array(LEAVES * 6), rain = new Float32Array(RAIN * 3);
  for (let index = 0; index < LEAVES; index++) leaves.set([next() * W, 60 + next() * 300, 0, 0, next() * 6, (next() - 0.5) * 4], index * 6);
  for (let index = 0; index < RAIN; index++) rain.set([next() * W, next() * hs - oy, 9 + next() * 9], index * 3);
  return {
    context: canvas.getContext("2d")!, k, cssWidth, cssHeight, hs, oy, lift, stretch: (BASKET_Y - SPAWN_Y + lift) / (BASKET_Y - SPAWN_Y), look, palette: p,
    bg: sprite(W, hs, k, context => paintBackground(context, p, oy), [0, oy]),
    trunk: sprite(90, 305 + oy, k, context => paintTrunk(context, p, oy), [-30, -110 + oy]),
    clouds: sprite(W * 2, 90, k, context => paintClouds(context, p), [0, 0]),
    canopy: sprite(W + 60, 160 + extend, k, context => paintCanopy(context, p, extend), [30, 20 + extend]),
    leaf: sprite(12, 6, k, context => { context.fillStyle = p.leaf; context.beginPath(); context.ellipse(0, 0, 5.5, 2.2, 0, 0, Math.PI * 2); context.fill(); }),
    kinds: [
      sprite(MANGO * 1.1, MANGO * 1.5, k, context => drawMango(context, MANGO, false)),
      sprite(MANGO * 1.1, MANGO * 1.5, k, context => drawMango(context, MANGO, true)),
      sprite(BRANCH_LEN * 1.1, BRANCH_LEN * 0.8, k, context => drawBranch(context, BRANCH_LEN)),
      sprite(MANGO * 1.3, MANGO * 1.6, k, context => drawGold(context, MANGO * 1.05)),
      sprite(HAIL_SIZE * 1.3, HAIL_SIZE * 1.3, k, context => drawHail(context, HAIL_SIZE)),
      sprite(BIG_LEN * 1.1, BIG_LEN * 0.6, k, context => drawBigBranch(context, BIG_LEN)),
    ],
    dalaBack: sprite(DALA * 1.1, DALA * 0.3, k, context => drawDalaBack(context, DALA)),
    dalaFront: sprite(DALA * 1.1, DALA * 0.44, k, context => drawDalaFront(context, DALA), [DALA * 0.55, DALA * 0.14]),
    hearts: [sprite(18, 18, k, context => drawHeart(context, 15, false)), sprite(18, 18, k, context => drawHeart(context, 15, true))],
    edgeOrange: sprite(W, hs, k / 2, context => paintEdge(context, hs, "#ff8a1fd0"), [0, 0]),
    edgeRed: sprite(W, hs, k / 2, context => paintEdge(context, hs, "#e5302ad8"), [0, 0]),
    edgeIce: sprite(W, hs, k / 2, context => paintEdge(context, hs, "#cfe8ffd0"), [0, 0]),
    edgeTop: sprite(W, 80, k / 2, context => paintEdge(context, 80, "#ffc24ad0", true), [0, 0]),
    clock: previous?.clock ?? 0, wind: previous?.wind ?? 0, leaves, rain, noise,
    popups: Array.from({ length: 6 }, () => ({ x: 0, t: -9, text: "", color: "" })),
    seen: 0, catchAt: -9, hitAt: -9, knockAt: -9, knockKind: 0, knockX: 0, game: null, bolts: [], boltsFor: null,
  };
}

/** A new run on this scene: forget the last run's pops and work out this storm's lightning once. */
export function bindGame(scene: Scene, game: Game | null) {
  scene.game = game; scene.seen = 0; scene.catchAt = -9; scene.hitAt = -9; scene.knockAt = -9;
  for (const popup of scene.popups) popup.t = -9;
  if (game && scene.boltsFor !== game.storm) { scene.bolts = lightningTimes(game.storm); scene.boltsFor = game.storm; }
  if (!game) { scene.bolts = []; scene.boltsFor = null; }
}

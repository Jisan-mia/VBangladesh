// The things in the game, drawn in code from plain shapes: the wooden top, its string, the palm, and what lands on it (a leaf,
// a pebble, a hen, a wet patch, a crack, a broom). Browser-only (they make offscreen canvases); the frame in draw.hot.ts
// copies the pre-rendered sprites and never builds a path of its own.
// IP: no names, logos, characters, sounds or look from any spinning-top toy brand, battle-top cartoon or arena game; no
// launchers or battle rings. The wooden লাটিম, palm, hens and brooms are drawn fresh from plain shapes.
import { KINDS } from "./levels";

export const PAL = {
  ink: "#2b1d12", accent: "#b5441b", wood: "#d29a5c", woodDark: "#8f5a2b", woodLight: "#f0c58a", nail: "#5f646b",
  red: "#c8352b", green: "#2f8a4c", yellow: "#f2b632", blue: "#2a6fb0", skinDark: "#9c6340",
  good: "#3aa35b", warn: "#e0a21b", bad: "#c8352b",
};
const SPOTS = [PAL.red, PAL.blue, PAL.green, PAL.yellow];
const SKIN = "#e3a97c";

/** The body's outline, tip at (0, 0), height s, upright. */
function bodyPath(context: CanvasRenderingContext2D, s: number) {
  context.beginPath();
  context.moveTo(-0.045 * s, -0.12 * s);
  context.quadraticCurveTo(-0.34 * s, -0.24 * s, -0.36 * s, -0.6 * s);
  context.bezierCurveTo(-0.37 * s, -0.88 * s, 0.37 * s, -0.88 * s, 0.36 * s, -0.6 * s);
  context.quadraticCurveTo(0.34 * s, -0.24 * s, 0.045 * s, -0.12 * s);
  context.closePath();
}

/** The still parts of the top (nail, wood, painted rings, knob). Drawn once into a sprite for the scene; straight onto the card. */
export function paintTop(context: CanvasRenderingContext2D, s: number) {
  context.fillStyle = PAL.nail;
  context.beginPath(); context.moveTo(-0.022 * s, -0.13 * s); context.lineTo(0.022 * s, -0.13 * s); context.lineTo(0.004 * s, 0); context.lineTo(-0.004 * s, 0); context.closePath(); context.fill();
  const shade = context.createLinearGradient(-0.36 * s, 0, 0.36 * s, 0);
  shade.addColorStop(0, PAL.wood); shade.addColorStop(0.3, PAL.woodLight); shade.addColorStop(1, PAL.woodDark);
  bodyPath(context, s);
  context.fillStyle = shade; context.fill();
  context.save();
  bodyPath(context, s); context.clip();
  context.lineWidth = 0.045 * s;
  const rings: readonly (readonly [number, string])[] = [[-0.3, PAL.green], [-0.42, PAL.red], [-0.53, PAL.yellow], [-0.64, PAL.red]];
  for (const [y, color] of rings) {
    context.strokeStyle = color;
    context.beginPath(); context.ellipse(0, y * s, 0.42 * s, 0.07 * s, 0, 0, Math.PI); context.stroke();
  }
  context.fillStyle = "#f6d7a8";
  context.beginPath(); context.ellipse(-0.04 * s, -0.75 * s, 0.2 * s, 0.05 * s, 0, 0, Math.PI * 2); context.fill();
  context.restore();
  context.strokeStyle = PAL.woodDark; context.lineWidth = Math.max(1, 0.012 * s);
  bodyPath(context, s); context.stroke();
  context.fillStyle = PAL.woodDark;
  context.beginPath(); context.ellipse(0, -0.83 * s, 0.07 * s, 0.035 * s, 0, 0, Math.PI * 2); context.fill();
  context.fillRect(-0.05 * s, -0.92 * s, 0.1 * s, 0.09 * s);
  context.fillStyle = PAL.wood;
  context.beginPath(); context.ellipse(0, -0.92 * s, 0.05 * s, 0.022 * s, 0, 0, Math.PI * 2); context.fill();
}

/** The painted dots that show the turn. Fast spin smears them into a faint ring; slow spin shows each dot go round. */
export function paintSpots(context: CanvasRenderingContext2D, s: number, turn: number, speed: number) {
  const y = -0.47 * s, half = 0.31 * s, blur = Math.max(0, Math.min(1, (speed - 0.35) / 0.5));
  if (blur > 0) {
    context.globalAlpha = 0.45 * blur; context.strokeStyle = PAL.blue; context.lineWidth = 0.05 * s;
    context.beginPath(); context.ellipse(0, y, half, 0.06 * s, 0, 0, Math.PI); context.stroke();
  }
  context.globalAlpha = 1 - 0.75 * blur;
  for (let index = 0; index < 4; index++) {
    const angle = turn + index * Math.PI / 2, depth = Math.cos(angle);
    if (depth < 0.1) continue;
    context.fillStyle = SPOTS[index];
    context.beginPath(); context.ellipse(Math.sin(angle) * half * 0.92, y + depth * 0.035 * s, 0.055 * s * depth, 0.06 * s, 0, 0, Math.PI * 2); context.fill();
  }
  context.globalAlpha = 1;
}

/** A sprite of the still top: tip at (size*0.4, size*0.98) in a size*0.8 × size canvas. */
export function topSprite(size: number, ratio: number) {
  const canvas = document.createElement("canvas");
  canvas.width = Math.ceil(size * 0.8 * ratio); canvas.height = Math.ceil(size * 1.0 * ratio);
  const context = canvas.getContext("2d");
  if (context) { context.scale(ratio, ratio); context.translate(size * 0.4, size * 0.98); paintTop(context, size); }
  return canvas;
}

/** One outlined, round-ended stroke: an arm, a finger. */
function limb(context: CanvasRenderingContext2D, s: number, x1: number, y1: number, x2: number, y2: number, width: number, color: string) {
  context.lineCap = "round";
  context.strokeStyle = PAL.skinDark; context.lineWidth = width + Math.max(2, 0.03 * s);
  context.beginPath(); context.moveTo(x1, y1); context.lineTo(x2, y2); context.stroke();
  context.strokeStyle = color; context.lineWidth = width;
  context.beginPath(); context.moveTo(x1, y1); context.lineTo(x2, y2); context.stroke();
}

/** An open palm held flat, the arm in a blue sleeve coming up from the bottom left. (x, y) is where the top sits. */
export function paintPalm(context: CanvasRenderingContext2D, x: number, y: number, s: number) {
  limb(context, s, x - 0.2 * s, y + 0.14 * s, x - 0.75 * s, y + 1.4 * s, 0.28 * s, SKIN);
  limb(context, s, x - 0.62 * s, y + 1.05 * s, x - 1.1 * s, y + 2.2 * s, 0.4 * s, PAL.blue);
  for (let index = 0; index < 4; index++) limb(context, s, x + 0.2 * s, y + 0.02 * s + index * 0.055 * s, x + 0.62 * s - index * 0.05 * s, y - 0.06 * s + index * 0.07 * s, 0.085 * s, SKIN);
  limb(context, s, x - 0.28 * s, y + 0.06 * s, x - 0.44 * s, y - 0.1 * s, 0.1 * s, SKIN);
  context.fillStyle = SKIN; context.strokeStyle = PAL.skinDark; context.lineWidth = Math.max(2, 0.03 * s);
  context.beginPath(); context.ellipse(x, y + 0.08 * s, 0.36 * s, 0.13 * s, 0, 0, Math.PI * 2); context.fill(); context.stroke();
  context.beginPath(); context.ellipse(x, y + 0.06 * s, 0.22 * s, 0.05 * s, 0, 0.3, Math.PI - 0.3); context.stroke();
}

/**
 * The string wound round a top that hangs ready to throw: `turns` coils from the tip up (the more you wind, the more
 * coils), and the loose end curling off the crown, `reach` (0–1) long when a finger has pulled it.
 */
export function paintString(context: CanvasRenderingContext2D, s: number, turns: number, reach: number) {
  context.strokeStyle = "#f4ead2"; context.lineWidth = Math.max(1.4, 0.02 * s); context.lineCap = "round";
  const coils = Math.max(2, Math.min(9, 2 + turns * 0.6));
  for (let index = 0; index < coils; index++) {
    const y = -0.18 * s - index * 0.07 * s, half = 0.1 * s + index * 0.036 * s;
    context.beginPath(); context.ellipse(0, y, half, 0.03 * s, -0.12, 0, Math.PI); context.stroke();
  }
  context.beginPath(); context.moveTo(0, -0.92 * s); context.quadraticCurveTo(0.1 * s, -1.2 * s - reach * 0.2 * s, 0.02 * s, -1.45 * s - reach * 0.5 * s); context.stroke();
}

function sprite(width: number, height: number, ratio: number, paint: (c: CanvasRenderingContext2D) => void) {
  const canvas = document.createElement("canvas");
  canvas.width = Math.ceil(width * ratio); canvas.height = Math.ceil(height * ratio);
  const c = canvas.getContext("2d");
  if (c) { c.scale(ratio, ratio); paint(c); }
  return canvas;
}

/** A hen facing right, about 2u wide: cream body, red comb, yellow beak and legs. */
function hen(c: CanvasRenderingContext2D, u: number) {
  c.lineCap = "round"; c.lineJoin = "round";
  c.strokeStyle = "#d9a21c"; c.lineWidth = Math.max(1.5, u * 0.06);
  c.beginPath(); c.moveTo(u * 0.9, u * 1.0); c.lineTo(u * 0.85, u * 1.28); c.moveTo(u * 1.2, u * 1.0); c.lineTo(u * 1.25, u * 1.28); c.stroke();
  c.fillStyle = "#c98a3c";
  c.beginPath(); c.moveTo(u * 0.35, u * 0.42); c.quadraticCurveTo(u * 0.0, u * 0.1, u * 0.12, u * 0.0); c.quadraticCurveTo(u * 0.3, u * 0.2, u * 0.5, u * 0.3); c.closePath(); c.fill();
  c.fillStyle = "#f3e2c0"; c.strokeStyle = "#a8742e"; c.lineWidth = Math.max(1.2, u * 0.04);
  c.beginPath(); c.ellipse(u * 1.0, u * 0.7, u * 0.68, u * 0.42, 0, 0, Math.PI * 2); c.fill(); c.stroke();
  c.fillStyle = "#e1c48c";
  c.beginPath(); c.ellipse(u * 0.9, u * 0.78, u * 0.38, u * 0.22, -0.2, 0, Math.PI * 2); c.fill();
  c.fillStyle = "#f3e2c0";
  c.beginPath(); c.arc(u * 1.55, u * 0.36, u * 0.24, 0, Math.PI * 2); c.fill(); c.stroke();
  c.fillStyle = "#c8352b";
  c.beginPath(); c.arc(u * 1.5, u * 0.12, u * 0.09, 0, Math.PI * 2); c.arc(u * 1.62, u * 0.1, u * 0.09, 0, Math.PI * 2); c.fill();
  c.beginPath(); c.arc(u * 1.66, u * 0.52, u * 0.07, 0, Math.PI * 2); c.fill();
  c.fillStyle = "#f2b632";
  c.beginPath(); c.moveTo(u * 1.76, u * 0.34); c.lineTo(u * 1.98, u * 0.42); c.lineTo(u * 1.76, u * 0.5); c.closePath(); c.fill();
  c.fillStyle = PAL.ink;
  c.beginPath(); c.arc(u * 1.6, u * 0.32, u * 0.04, 0, Math.PI * 2); c.fill();
}

/** A broom lying sideways, the bristles at the right: a long cane handle, a binding, a fan of straw. */
function broom(c: CanvasRenderingContext2D, u: number) {
  c.lineCap = "round";
  c.strokeStyle = "#7a4d24"; c.lineWidth = Math.max(3, u * 0.12);
  c.beginPath(); c.moveTo(0, u * 0.5); c.lineTo(u * 1.7, u * 0.6); c.stroke();
  c.fillStyle = "#d8b25a"; c.strokeStyle = "#a07b2a"; c.lineWidth = Math.max(1, u * 0.03);
  c.beginPath(); c.moveTo(u * 1.6, u * 0.55); c.lineTo(u * 2.4, u * 0.05); c.lineTo(u * 2.5, u * 0.62); c.lineTo(u * 2.4, u * 1.15); c.closePath(); c.fill(); c.stroke();
  c.beginPath();
  for (let i = 1; i < 6; i++) { c.moveTo(u * 1.7, u * 0.58); c.lineTo(u * 2.45, u * (0.05 + i * 0.2)); }
  c.stroke();
  c.fillStyle = "#c8352b"; c.fillRect(u * 1.55, u * 0.42, u * 0.14, u * 0.34);
}

function leaf(c: CanvasRenderingContext2D, u: number) {
  c.fillStyle = "#7a9a35"; c.strokeStyle = "#4f6a1e"; c.lineWidth = Math.max(1, u * 0.05);
  c.beginPath(); c.moveTo(0, u * 0.35); c.quadraticCurveTo(u * 0.55, -u * 0.1, u * 1.1, u * 0.35); c.quadraticCurveTo(u * 0.55, u * 0.8, 0, u * 0.35); c.fill(); c.stroke();
  c.beginPath(); c.moveTo(u * 0.05, u * 0.35); c.lineTo(u * 1.05, u * 0.35); c.stroke();
}
function pebble(c: CanvasRenderingContext2D, u: number) {
  c.fillStyle = "#8f877a"; c.strokeStyle = "#5e574d"; c.lineWidth = Math.max(1, u * 0.05);
  c.beginPath(); c.ellipse(u * 0.6, u * 0.45, u * 0.6, u * 0.42, 0, 0, Math.PI * 2); c.fill(); c.stroke();
  c.fillStyle = "#b3aa9a";
  c.beginPath(); c.ellipse(u * 0.45, u * 0.3, u * 0.22, u * 0.12, -0.4, 0, Math.PI * 2); c.fill();
}
function puddle(c: CanvasRenderingContext2D, u: number) {
  c.fillStyle = "#6f9cb8"; c.strokeStyle = "#4b7893"; c.lineWidth = Math.max(1, u * 0.04);
  c.beginPath(); c.ellipse(u * 1.2, u * 0.45, u * 1.2, u * 0.4, 0, 0, Math.PI * 2); c.fill(); c.stroke();
  c.strokeStyle = "#e8f3f8"; c.lineWidth = Math.max(1.5, u * 0.06);
  c.beginPath(); c.arc(u * 1.0, u * 0.45, u * 0.55, Math.PI * 1.1, Math.PI * 1.6); c.stroke();
}
function crack(c: CanvasRenderingContext2D, u: number) {
  c.strokeStyle = "#3b1510"; c.lineWidth = Math.max(2, u * 0.1); c.lineCap = "round"; c.lineJoin = "round";
  c.beginPath(); c.moveTo(0, u * 0.5); c.lineTo(u * 0.5, u * 0.3); c.lineTo(u * 0.8, u * 0.62); c.lineTo(u * 1.3, u * 0.35); c.lineTo(u * 1.7, u * 0.6); c.lineTo(u * 2.2, u * 0.4); c.stroke();
  c.lineWidth = Math.max(1, u * 0.05);
  c.beginPath(); c.moveTo(u * 0.8, u * 0.62); c.lineTo(u * 0.95, u * 0.95); c.moveTo(u * 1.3, u * 0.35); c.lineTo(u * 1.4, u * 0.05); c.stroke();
}
function ridge(c: CanvasRenderingContext2D, u: number) {
  const lighter = c.createLinearGradient(0, 0, 0, u * 0.5);
  lighter.addColorStop(0, "#f2f5f7"); lighter.addColorStop(1, "#8793a0");
  c.fillStyle = lighter; c.beginPath(); c.roundRect(0, 0, u * 4, u * 0.45, u * 0.2); c.fill();
}

/** The things that land on the top, one sprite per kind, drawn facing right (side things flip for the left). `unit` is in px. */
export function makeThings(unit: number, ratio: number) {
  const out: HTMLCanvasElement[] = [];
  const sizes: readonly (readonly [number, number])[] = [[1.1, 0.8], [1.2, 0.9], [2.0, 1.3], [2.4, 0.9], [2.2, 1.0], [4, 0.5], [2.5, 1.2]];
  const paints = [leaf, pebble, hen, puddle, crack, ridge, broom];
  for (let kind = 0; kind < KINDS; kind++) {
    const [w, h] = sizes[kind], paint = paints[kind];
    out.push(sprite(w * unit + 2, h * unit + 2, ratio, c => { c.translate(1, 1); paint(c, unit); }));
  }
  return out;
}
/** The sprites' logical sizes in units, for drawing. */
export const THING_W = [1.1, 1.2, 2.0, 2.4, 2.2, 4, 2.5];
export const THING_H = [0.8, 0.9, 1.3, 0.9, 1.0, 0.5, 1.2];

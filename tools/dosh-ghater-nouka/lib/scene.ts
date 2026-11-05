// The three worlds' backdrops, drawn in code and pre-rendered once: a static sky (sun or moon, clouds or stars) and a
// repeating strip of far hills, trees and huts that the river scrolls past at a slower speed. Fixed geometry, no randomness.
import type { WorldId } from "./levels";

export type Palette = { skyTop: string; skyMid: string; skyLow: string; sun: string; hill: string; hillFar: string; tree: string; hut: string; roof: string; bank: string; water: string; waterLow: string; wave: string; tile: string; tileEdge: string; step: string; ink: string; accent: string; deep: string; soft: string; edge: string };

export const PALETTE: Record<WorldId, Palette> = {
  0: { skyTop: "#ffc58f", skyMid: "#ffe2b8", skyLow: "#fff4df", sun: "#ff9b4a", hill: "#9cc57a", hillFar: "#c2dca2", tree: "#4f7f3d", hut: "#e9d3a5", roof: "#b5562b", bank: "#a9d27a", water: "#5fb3b9", waterLow: "#3f8f9c", wave: "#8fd0d2", tile: "#fff8e8", tileEdge: "#f0d3a2", step: "#d98b5f", ink: "#3a2a1a", accent: "#c4631f", deep: "#7d3510", soft: "#fff1d6", edge: "#f0d3a2" },
  1: { skyTop: "#7cc8ee", skyMid: "#b9e4f7", skyLow: "#eaf8ff", sun: "#ffe066", hill: "#82c46c", hillFar: "#b4dc9e", tree: "#3f8a3a", hut: "#f2e6c8", roof: "#2a7aa8", bank: "#93d066", water: "#3aa0cf", waterLow: "#1f78a8", wave: "#7cc6e6", tile: "#ffffff", tileEdge: "#b7dbe9", step: "#e0a15f", ink: "#16384a", accent: "#1f6f8b", deep: "#134a5e", soft: "#e7f3f8", edge: "#b7dbe9" },
  2: { skyTop: "#43347a", skyMid: "#c0587a", skyLow: "#ffb26b", sun: "#f5efe0", hill: "#403b66", hillFar: "#6a4a7c", tree: "#2d2a4e", hut: "#6b5a7a", roof: "#2d2a4e", bank: "#5f8460", water: "#2e4688", waterLow: "#1c2a5e", wave: "#6b82c4", tile: "#fdf0d5", tileEdge: "#e6c9a0", step: "#c97c54", ink: "#2a2244", accent: "#a8326a", deep: "#6a1f47", soft: "#fdeaf2", edge: "#f1c3d7" },
};

/** Round-up size of the repeating strip, in CSS pixels. */
export const FAR_W = 480, FAR_H = 120;

function ctxOf(canvas: HTMLCanvasElement, w: number, h: number) {
  const ratio = Math.min(2, window.devicePixelRatio || 1);
  canvas.width = Math.round(w * ratio); canvas.height = Math.round(h * ratio);
  const c = canvas.getContext("2d")!;
  c.setTransform(ratio, 0, 0, ratio, 0, 0);
  return c;
}

/** The sky behind everything: a gradient, the sun or moon, and clouds or stars. */
export function drawSky(canvas: HTMLCanvasElement, world: WorldId, w: number, h: number) {
  const c = ctxOf(canvas, w, h), p = PALETTE[world];
  const g = c.createLinearGradient(0, 0, 0, h);
  g.addColorStop(0, p.skyTop); g.addColorStop(0.55, p.skyMid); g.addColorStop(1, p.skyLow);
  c.fillStyle = g; c.fillRect(0, 0, w, h);
  if (world === 2) {
    c.fillStyle = "#fff8";
    for (let i = 0; i < 26; i++) { const x = (i * 83 + 17) % w, y = ((i * 47) % (h * 0.55)) + 6; c.beginPath(); c.arc(x, y, i % 4 === 0 ? 1.6 : 1, 0, 6.3); c.fill(); }
    // A crescent: the moon's disc with a second disc cut out of it.
    c.save(); c.beginPath(); c.rect(0, 0, w, h); c.arc(w * 0.78 + 9, h * 0.3 - 5, 17, 0, 6.3, true); c.clip("evenodd");
    c.fillStyle = p.sun; c.beginPath(); c.arc(w * 0.78, h * 0.3, 20, 0, 6.3); c.fill(); c.restore();
  } else {
    const sx = world === 0 ? w * 0.22 : w * 0.8, sy = world === 0 ? Math.max(h * 0.3, h - 340) : h * 0.3, rad = world === 0 ? 34 : 26;
    const glow = c.createRadialGradient(sx, sy, rad * 0.4, sx, sy, rad * 2.8);
    glow.addColorStop(0, world === 0 ? "#ffb36a99" : "#fff4a899"); glow.addColorStop(1, "#fff0");
    c.fillStyle = glow; c.fillRect(0, 0, w, h);
    c.fillStyle = p.sun; c.beginPath(); c.arc(sx, sy, rad, 0, 6.3); c.fill();
    c.fillStyle = world === 0 ? "#ffffffb0" : "#fff";
    const cloud = (x: number, y: number, s: number) => { c.beginPath(); c.arc(x, y, 9 * s, 0, 6.3); c.arc(x + 12 * s, y - 5 * s, 12 * s, 0, 6.3); c.arc(x + 26 * s, y, 9 * s, 0, 6.3); c.rect(x, y - 1 * s, 26 * s, 9 * s); c.fill(); };
    cloud(w * 0.12, h * 0.22, 1); cloud(w * 0.52, h * 0.38, 0.8); if (world === 1) cloud(w * 0.34, h * 0.12, 0.7);
  }
}

const cache = new Map<number, string>();
/** A seamless strip (480 × 120 CSS px at 2×) of hills, a few trees and huts, as a data URL for `background-image`. */
export function farTile(world: WorldId): string {
  const hit = cache.get(world);
  if (hit) return hit;
  const canvas = document.createElement("canvas"), c = ctxOf(canvas, FAR_W, FAR_H), p = PALETTE[world];
  const wave = (base: number, amp: number, period: number, phase: number) => { c.beginPath(); c.moveTo(0, FAR_H); for (let x = 0; x <= FAR_W; x += 8) c.lineTo(x, base - Math.sin((x / FAR_W) * Math.PI * 2 * period + phase) * amp); c.lineTo(FAR_W, FAR_H); c.closePath(); c.fill(); };
  c.fillStyle = p.hillFar; wave(70, 16, 2, 0.4);
  c.fillStyle = p.hill; wave(92, 12, 3, 1.7);
  // Trees: a coconut palm and round mango trees, spaced so the strip tiles.
  const palm = (x: number, y: number) => {
    c.strokeStyle = p.tree; c.lineWidth = 3; c.beginPath(); c.moveTo(x, y); c.quadraticCurveTo(x + 4, y - 22, x + 1, y - 40); c.stroke();
    c.lineWidth = 3.5;
    for (const angle of [-2.6, -1.9, -1.2, -0.5]) { c.beginPath(); c.moveTo(x + 1, y - 40); c.quadraticCurveTo(x + 1 + Math.cos(angle) * 12, y - 40 + Math.sin(angle) * 10, x + 1 + Math.cos(angle) * 22, y - 40 + Math.sin(angle) * 8 + 8); c.stroke(); }
  };
  const mango = (x: number, y: number, s: number) => { c.fillStyle = p.tree; c.beginPath(); c.arc(x, y - 16 * s, 15 * s, 0, 6.3); c.arc(x + 12 * s, y - 10 * s, 11 * s, 0, 6.3); c.arc(x - 12 * s, y - 9 * s, 10 * s, 0, 6.3); c.fill(); c.fillRect(x - 2, y - 8 * s, 4, 10 * s); };
  const hut = (x: number, y: number) => { c.fillStyle = p.hut; c.fillRect(x, y - 14, 26, 14); c.fillStyle = p.roof; c.beginPath(); c.moveTo(x - 4, y - 14); c.lineTo(x + 13, y - 28); c.lineTo(x + 30, y - 14); c.closePath(); c.fill(); if (world === 2) { c.fillStyle = "#ffd36a"; c.fillRect(x + 10, y - 10, 6, 8); } };
  palm(40, 100); mango(120, 104, 1); hut(170, 104); palm(250, 100); mango(310, 106, 0.85); palm(380, 100); hut(410, 104);
  c.fillStyle = p.bank; c.fillRect(0, FAR_H - 12, FAR_W, 12);
  const url = canvas.toDataURL("image/png");
  cache.set(world, url);
  return url;
}

// The three মাঠ, drawn in code: a palette each, the sky and the far strip painted once per size into offscreen canvases (the
// frame in draw.hot.ts copies them and adds the moving parts), plus the title's start art and the story panels.
// IP: no names, logos, characters, sounds or look from any sports brand or other tipcat app; no gun imagery; every figure is
// drawn fresh from plain shapes.
import { DISPLAY_FONT } from "../../../shared/card-canvas";
import { PAL, drawBall, drawBatter, drawKid, LOOKS } from "./art";

export type Palette = {
  skyTop: string; skyLow: string; sun: string; far: string; farDark: string; hut: string; roof: string;
  grass: string; grassLight: string; grassDark: string; dust: string; peg: string;
};
export const PALETTES: readonly Palette[] = [
  { skyTop: "#8fcbe6", skyLow: "#eef6ea", sun: "#fffbe9", far: "#3f6b3a", farDark: "#2f5530", hut: "#a5643a", roof: "#7d8a94",
    grass: "#6aa645", grassLight: "#74b04d", grassDark: "#4f8a36", dust: "#8a6440", peg: "#f4ead0" },
  { skyTop: "#4a3a72", skyLow: "#f3a65e", sun: "#ffd27a", far: "#5d4a6a", farDark: "#3c3150", hut: "#8a5a3a", roof: "#6a5560",
    grass: "#b39a68", grassLight: "#bea574", grassDark: "#8d7650", dust: "#d8c08e", peg: "#fff4dc" },
  { skyTop: "#5b6976", skyLow: "#b7c2c8", sun: "#e6edf0", far: "#2f4f3a", farDark: "#24402f", hut: "#7a5a40", roof: "#55616b",
    grass: "#4f8f4a", grassLight: "#579852", grassDark: "#3b7338", dust: "#6b5a3e", peg: "#e9efe6" },
];
export const WATER = "#3d8fb8", WATER_LIGHT = "#7cc0de", SAND = "#ead39c", SAND_DARK = "#cdb37a", WET = "#5f9a8e", WET_LIGHT = "#9cc9c0";

/** The ground line and pixels per ডাং for a canvas: about six and a half ডাং across near home (the camera zooms out for a high কাঠি). */
export function layoutFor(width: number, height: number) {
  const ground = Math.round(height * 0.78);
  return { ground, unit: Math.max(18, Math.min(width / 6.5, height / 7)) };
}

function offscreen(width: number, height: number, ratio: number, into?: HTMLCanvasElement | null) {
  const canvas = into ?? document.createElement("canvas");
  canvas.width = Math.max(1, Math.round(width * ratio)); canvas.height = Math.max(1, Math.round(height * ratio));
  const c = canvas.getContext("2d")!;
  c.setTransform(ratio, 0, 0, ratio, 0, 0);
  return { canvas, c };
}

/** The sky: a gradient, the sun (or the low মেঘ of the বর্ষা), painted once per size. */
export function paintSky(world: number, width: number, ground: number, ratio: number, into?: HTMLCanvasElement | null) {
  const p = PALETTES[world], { canvas, c } = offscreen(width, ground, ratio, into);
  const gradient = c.createLinearGradient(0, 0, 0, ground);
  gradient.addColorStop(0, p.skyTop); gradient.addColorStop(1, p.skyLow);
  c.fillStyle = gradient; c.fillRect(0, 0, width, ground);
  if (world === 2) {
    c.fillStyle = "#47535e";
    for (let i = 0; i < 7; i++) { c.beginPath(); c.ellipse((i + 0.3) * width / 6, ground * (0.1 + (i % 3) * 0.05), width * 0.16, ground * 0.07, 0, 0, Math.PI * 2); c.fill(); }
    c.fillStyle = "#6c7984";
    for (let i = 0; i < 6; i++) { c.beginPath(); c.ellipse((i + 0.8) * width / 6, ground * (0.2 + (i % 2) * 0.04), width * 0.13, ground * 0.05, 0, 0, Math.PI * 2); c.fill(); }
  } else {
    const sx = world === 1 ? width * 0.7 : width * 0.8, sy = world === 1 ? ground * 0.72 : ground * 0.22;
    c.fillStyle = world === 1 ? "#ffb86b66" : "#fff6d888"; c.beginPath(); c.arc(sx, sy, 38, 0, Math.PI * 2); c.fill();
    c.fillStyle = p.sun; c.beginPath(); c.arc(sx, sy, 22, 0, Math.PI * 2); c.fill();
    if (world === 0) {
      c.fillStyle = "#ffffffb0";
      c.beginPath(); c.ellipse(width * 0.25, ground * 0.2, 46, 12, 0, 0, Math.PI * 2); c.ellipse(width * 0.32, ground * 0.17, 30, 12, 0, 0, Math.PI * 2); c.fill();
    }
  }
  return canvas;
}

/** A wrap-around strip for the far side of the field: trees and huts, the river with a boat, or wet trees under rain. */
export function paintFar(world: number, width: number, ground: number, ratio: number, into?: HTMLCanvasElement | null) {
  const p = PALETTES[world], strip = Math.round(width * 1.6), { canvas, c } = offscreen(strip, ground, ratio, into), base = ground;
  const tree = (x: number, size: number, dark: boolean) => {
    for (const offset of [-strip, 0, strip]) {
      const cx = x + offset;
      c.fillStyle = "#5a4630"; c.fillRect(cx - 2, base - size * 0.9, 4, size * 0.9);
      c.fillStyle = dark ? p.farDark : p.far;
      c.beginPath(); c.arc(cx, base - size * 1.1, size * 0.62, 0, Math.PI * 2); c.arc(cx - size * 0.5, base - size * 0.8, size * 0.45, 0, Math.PI * 2); c.arc(cx + size * 0.5, base - size * 0.85, size * 0.48, 0, Math.PI * 2); c.fill();
    }
  };
  const palm = (x: number, size: number) => {
    c.strokeStyle = "#6e5638"; c.lineWidth = 3; c.lineCap = "round";
    c.beginPath(); c.moveTo(x, base); c.quadraticCurveTo(x + size * 0.15, base - size, x + size * 0.3, base - size * 1.9); c.stroke();
    c.strokeStyle = p.far; c.lineWidth = 4;
    for (let leaf = 0; leaf < 6; leaf++) {
      const a = Math.PI + (leaf / 5) * Math.PI, tx = x + size * 0.3, ty = base - size * 1.9;
      c.beginPath(); c.moveTo(tx, ty); c.quadraticCurveTo(tx + Math.cos(a) * size * 0.5, ty + Math.sin(a) * size * 0.5 - 6, tx + Math.cos(a) * size * 0.8, ty + Math.sin(a) * size * 0.5 + 10); c.stroke();
    }
  };
  const hut = (x: number, size: number) => {
    c.fillStyle = p.hut; c.fillRect(x, base - size * 0.7, size * 1.3, size * 0.7);
    c.fillStyle = "#5b3a22"; c.fillRect(x + size * 0.5, base - size * 0.45, size * 0.28, size * 0.45);
    c.fillStyle = p.roof; c.beginPath(); c.moveTo(x - size * 0.15, base - size * 0.68); c.lineTo(x + size * 0.2, base - size * 1.1); c.lineTo(x + size * 1.1, base - size * 1.1); c.lineTo(x + size * 1.45, base - size * 0.68); c.closePath(); c.fill();
  };
  if (world === 1) {
    // The river behind the চর, the far bank, and two boats with their sails.
    c.fillStyle = p.farDark; c.fillRect(0, base - 34, strip, 12);
    for (let i = 0; i < 8; i++) tree((i + 0.4) * (strip / 8), 14 + (i * 29 % 9), i % 2 === 0);
    const river = c.createLinearGradient(0, base - 22, 0, base);
    river.addColorStop(0, "#d98c63"); river.addColorStop(1, "#7c6a8a");
    c.fillStyle = river; c.fillRect(0, base - 22, strip, 22);
    c.strokeStyle = "#f6c48e88"; c.lineWidth = 1.5;
    for (let i = 0; i < 14; i++) { const x = (i * 97) % strip; c.beginPath(); c.moveTo(x, base - 10 + (i % 3) * 4); c.lineTo(x + 18, base - 10 + (i % 3) * 4); c.stroke(); }
    for (const [x, size] of [[strip * 0.3, 18], [strip * 0.78, 14]] as const) {
      c.fillStyle = "#3a2a22"; c.beginPath(); c.moveTo(x - size, base - 14); c.quadraticCurveTo(x, base - 4, x + size, base - 14); c.closePath(); c.fill();
      c.strokeStyle = "#3a2a22"; c.lineWidth = 2; c.beginPath(); c.moveTo(x, base - 14); c.lineTo(x, base - 14 - size * 1.8); c.stroke();
      c.fillStyle = "#f0d7b0"; c.beginPath(); c.moveTo(x + 1, base - 14 - size * 1.7); c.quadraticCurveTo(x + size * 1.1, base - 14 - size, x + 1, base - 16); c.closePath(); c.fill();
    }
  } else {
    for (let i = 0; i < 9; i++) tree((i + 0.3) * (strip / 9) + Math.sin(i * 7.3) * 14, 22 + (i * 37 % 13), i % 3 === 1);
    hut(strip * 0.18, 30); hut(strip * 0.63, 26);
    palm(strip * 0.42, 34); palm(strip * 0.86, 30);
    if (world === 0) {
      // The school: a long low building with a flag pole.
      const x = strip * 0.05;
      c.fillStyle = "#e8d9b5"; c.fillRect(x, base - 26, 70, 26);
      c.fillStyle = "#b4372a"; c.fillRect(x - 3, base - 30, 76, 5);
      c.fillStyle = "#5b3a22"; for (let w = 0; w < 4; w++) c.fillRect(x + 8 + w * 16, base - 18, 8, 10);
      c.strokeStyle = "#6e5638"; c.lineWidth = 2; c.beginPath(); c.moveTo(x + 84, base); c.lineTo(x + 84, base - 44); c.stroke();
      c.fillStyle = "#1f7a3a"; c.fillRect(x + 85, base - 44, 18, 11);
      c.fillStyle = "#d62828"; c.beginPath(); c.arc(x + 93, base - 38.5, 3.5, 0, Math.PI * 2); c.fill();
    }
  }
  c.fillStyle = p.farDark; c.fillRect(0, base - 5, strip, 5);
  return { canvas, width: strip };
}

// ---- the title: the start action, drawn as the game's own art ----
export const TITLE_ASPECT = 0.82;
/** A patch of the field with the hole, the কাঠি across it and the ডাং leaning in, and the word খেলো on a wooden board. */
export function drawTitleArt(canvas: HTMLCanvasElement, width: number, ratio: number, word: string, world: number) {
  const height = Math.round(width * TITLE_ASPECT), p = PALETTES[world];
  canvas.width = Math.round(width * ratio); canvas.height = Math.round(height * ratio);
  const c = canvas.getContext("2d");
  if (!c) return;
  c.setTransform(ratio, 0, 0, ratio, 0, 0);
  c.clearRect(0, 0, width, height);
  const cx = width / 2, gy = height * 0.66;
  // the grass disc
  c.fillStyle = "#00000022"; c.beginPath(); c.ellipse(cx, gy + 10, width * 0.46, height * 0.2, 0, 0, Math.PI * 2); c.fill();
  c.fillStyle = p.grass; c.beginPath(); c.ellipse(cx, gy, width * 0.46, height * 0.2, 0, 0, Math.PI * 2); c.fill();
  c.fillStyle = p.grassLight; c.beginPath(); c.ellipse(cx - width * 0.06, gy - height * 0.03, width * 0.32, height * 0.11, 0, 0, Math.PI * 2); c.fill();
  // the hole, and the কাঠি lying across it
  c.fillStyle = "#3a2a1a"; c.beginPath(); c.ellipse(cx + width * 0.04, gy + 4, width * 0.07, height * 0.025, 0, 0, Math.PI * 2); c.fill();
  drawBall(c, cx + width * 0.05, gy - 2, width * 0.42, -0.08);
  // the ডাং leaning in, its tip on the কাঠি
  c.strokeStyle = PAL.stick; c.lineCap = "round"; c.lineWidth = width * 0.035;
  c.beginPath(); c.moveTo(cx - width * 0.36, gy - height * 0.5); c.lineTo(cx + width * 0.1, gy - 6); c.stroke();
  c.strokeStyle = PAL.stickDark; c.lineWidth = width * 0.04;
  c.beginPath(); c.moveTo(cx - width * 0.36, gy - height * 0.5); c.lineTo(cx - width * 0.28, gy - height * 0.42); c.stroke();
  // the board with the word
  const bw = width * 0.62, bh = height * 0.24, bx = cx - bw / 2 + width * 0.08, by = height * 0.06;
  c.fillStyle = "#00000030"; c.beginPath(); c.roundRect(bx + 4, by + 6, bw, bh, 16); c.fill();
  c.fillStyle = "#ffd166"; c.beginPath(); c.roundRect(bx, by, bw, bh, 16); c.fill();
  c.strokeStyle = "#b86e00"; c.lineWidth = 3; c.stroke();
  c.fillStyle = "#26301e"; c.font = `800 ${Math.round(bh * 0.62)}px ${DISPLAY_FONT}`; c.textAlign = "center"; c.textBaseline = "middle";
  c.fillText(word, bx + bw / 2, by + bh * 0.54);
  // a kid on the side, watching
  drawKid(c, cx + width * 0.36, gy + 2, width * 0.1, LOOKS[1], "watch", 0, -1);
}

// ---- the story ----
export const STORY_ASPECT = 0.72;
export function drawStoryPanel(canvas: HTMLCanvasElement, width: number, ratio: number, index: number) {
  const height = Math.round(width * STORY_ASPECT), p = PALETTES[0];
  canvas.width = Math.round(width * ratio); canvas.height = Math.round(height * ratio);
  const c = canvas.getContext("2d");
  if (!c) return;
  c.setTransform(ratio, 0, 0, ratio, 0, 0);
  const ground = Math.round(height * 0.72);
  c.drawImage(paintSky(0, width, ground, ratio), 0, 0, width, ground);
  const far = paintFar(0, width, ground, ratio);
  c.drawImage(far.canvas, -width * 0.02, 0, far.width, ground);
  c.fillStyle = p.grass; c.fillRect(0, ground, width, height - ground);
  c.fillStyle = p.grassDark; c.fillRect(0, ground - 1, width, 3);
  const k = width / 7;
  if (index === 0) {
    // the bell has rung: three kids running onto the empty field
    for (let i = 0; i < 3; i++) drawKid(c, width * (0.28 + i * 0.2), ground + 4, k * 0.9, LOOKS[i], "run", i * 0.4, 1);
  } else if (index === 1) {
    c.fillStyle = "#3a2a1a"; c.beginPath(); c.ellipse(width * 0.55, ground + 8, k * 0.5, k * 0.12, 0, 0, Math.PI * 2); c.fill();
    drawBall(c, width * 0.56, ground + 2, k * 2.2, -0.1);
    drawBatter(c, width * 0.3, ground + 6, k * 1.4, 0.75);
  } else {
    c.fillStyle = "#ffd16699"; c.fillRect(width * 0.34, ground - k * 1.6, k * 1.3, k * 0.8);
    c.strokeStyle = "#d98e04"; c.lineWidth = 2; c.beginPath(); c.moveTo(width * 0.34, ground - k * 1.2); c.lineTo(width * 0.34 + k * 1.3, ground - k * 1.2); c.stroke();
    drawBall(c, width * 0.47, ground - k * 1.25, k * 1.6, 1.1);
    drawBatter(c, width * 0.3, ground + 6, k * 1.4, 3.3);
    drawKid(c, width * 0.82, ground + 4, k * 0.8, LOOKS[2], "cheer", 0.3, -1);
  }
}

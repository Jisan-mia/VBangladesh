// The three places, drawn in code: a palette each, the backdrop painted once per size into an offscreen canvas (the frame in
// draw.hot.ts copies it and adds the moving parts), the card's backdrop, the title's start art and the story panels.
// IP: no names, logos, characters, sounds or look from any spinning-top toy brand or battle-top game; drawn fresh from plain shapes.
import { DISPLAY_FONT } from "../../../shared/card-canvas";
import { makeRng } from "../../../shared/game-core";
import { PAL, paintPalm, paintSpots, paintString, paintTop } from "./figures";

export type Palette = { skyTop: string; skyLow: string; floorA: string; floorB: string; wall: string; trim: string; chalk: string; accent: string; deep: string };
export const PALETTES: readonly Palette[] = [
  { skyTop: "#9fd3ea", skyLow: "#eaf3dc", floorA: "#c9895a", floorB: "#b67447", wall: "#8a5a36", trim: "#6f4527", chalk: "#ffffffa0", accent: "#b5441b", deep: "#6f3a1d" },
  { skyTop: "#e8dcc0", skyLow: "#f3ead2", floorA: "#9b3427", floorB: "#b5483a", wall: "#e8dcc0", trim: "#7d4a3a", chalk: "#ffffffa0", accent: "#9b3427", deep: "#5e1c14" },
  { skyTop: "#8cc6e8", skyLow: "#d6eef7", floorA: "#8f9aa5", floorB: "#77828d", wall: "#8f9aa5", trim: "#5c6670", chalk: "#ffffff80", accent: "#2a6fb0", deep: "#2c4a63" },
];

/**
 * The scene's backdrop for a place: the far edge (a mud wall under a mango tree, a lime-washed wall with a lamp, or open sky
 * over the roof), the floor, and the ring the top spins in, chalked on the ground. (cx, cy) is where the top spins.
 */
export function paintBackdrop(c: CanvasRenderingContext2D, world: number, level: number, width: number, height: number, horizon: number, cx: number, cy: number) {
  const rng = makeRng(17 + level), u = Math.min(width, height) / 100, p = PALETTES[world];
  if (world === 0) {
    const sky = c.createLinearGradient(0, 0, 0, horizon);
    sky.addColorStop(0, p.skyTop); sky.addColorStop(1, p.skyLow);
    c.fillStyle = sky; c.fillRect(0, 0, width, horizon);
    c.fillStyle = "#fff6d8c0"; c.beginPath(); c.arc(width * 0.8, horizon * 0.35, 6 * u, 0, Math.PI * 2); c.fill();
    // the mango tree and a mud hut with a thatched roof
    c.fillStyle = "#5a4630"; c.fillRect(width * 0.12, horizon * 0.35, 2.4 * u, horizon * 0.65);
    c.fillStyle = "#3f6b3a";
    for (const [dx, dy, r] of [[0, 0.3, 9], [-7, 0.45, 7], [7, 0.45, 7.5], [1, 0.12, 6.5]] as const) { c.beginPath(); c.arc(width * 0.12 + dx * u, horizon * dy, r * u, 0, Math.PI * 2); c.fill(); }
    c.fillStyle = p.wall; c.fillRect(width * 0.55, horizon * 0.45, width * 0.34, horizon * 0.55);
    c.fillStyle = "#c9a45a"; c.beginPath(); c.moveTo(width * 0.52, horizon * 0.48); c.lineTo(width * 0.72, horizon * 0.1); c.lineTo(width * 0.92, horizon * 0.48); c.closePath(); c.fill();
    c.fillStyle = "#5b3920"; c.fillRect(width * 0.66, horizon * 0.6, width * 0.1, horizon * 0.4);
    c.fillStyle = p.trim; c.fillRect(0, horizon - 2.5 * u, width, 2.5 * u);
    c.fillStyle = p.floorA; c.fillRect(0, horizon, width, height - horizon);
    c.strokeStyle = p.floorB; c.lineWidth = Math.max(1, 0.5 * u);
    for (let i = 0; i < 34; i++) {
      const x = rng() * width, y = horizon + rng() * (height - horizon), r = (8 + rng() * 22) * u;
      c.beginPath(); c.arc(x, y + r, r, -Math.PI * 0.8, -Math.PI * 0.35); c.stroke();
    }
  } else if (world === 1) {
    c.fillStyle = p.wall; c.fillRect(0, 0, width, horizon);
    // a shuttered window with the evening in it, and a lamp
    c.fillStyle = "#f4c978"; c.fillRect(width * 0.14, horizon * 0.2, width * 0.2, horizon * 0.55);
    c.strokeStyle = "#5c7a6a"; c.lineWidth = Math.max(2, 0.9 * u);
    c.strokeRect(width * 0.14, horizon * 0.2, width * 0.2, horizon * 0.55);
    c.beginPath(); c.moveTo(width * 0.24, horizon * 0.2); c.lineTo(width * 0.24, horizon * 0.75); c.stroke();
    const glow = c.createRadialGradient(width * 0.74, horizon * 0.42, 0, width * 0.74, horizon * 0.42, 22 * u);
    glow.addColorStop(0, "#ffe8a0cc"); glow.addColorStop(1, "#ffe8a000");
    c.fillStyle = glow; c.fillRect(width * 0.4, 0, width * 0.6, horizon * 1.6);
    c.strokeStyle = PAL.ink; c.lineWidth = Math.max(1, 0.4 * u);
    c.beginPath(); c.moveTo(width * 0.74, 0); c.lineTo(width * 0.74, horizon * 0.3); c.stroke();
    c.fillStyle = "#f6d27a"; c.beginPath(); c.arc(width * 0.74, horizon * 0.38, 3 * u, 0, Math.PI * 2); c.fill();
    c.fillStyle = p.trim; c.fillRect(0, horizon - 3 * u, width, 3 * u);
    const floor = c.createLinearGradient(0, horizon, 0, height);
    floor.addColorStop(0, p.floorA); floor.addColorStop(1, p.floorB);
    c.fillStyle = floor; c.fillRect(0, horizon, width, height - horizon);
    c.strokeStyle = p.deep; c.lineWidth = Math.max(1, 0.35 * u);
    for (let row = 1; row < 7; row++) { const y = horizon + (height - horizon) * (row / 7) ** 1.4; c.beginPath(); c.moveTo(0, y); c.lineTo(width, y); c.stroke(); }
    for (let col = -4; col <= 4; col++) { c.beginPath(); c.moveTo(cx + col * 9 * u, horizon); c.lineTo(cx + col * 34 * u, height); c.stroke(); }
    c.fillStyle = "#ffffff1f";
    c.beginPath(); c.ellipse(width * 0.3, horizon + (height - horizon) * 0.3, 22 * u, 5 * u, -0.1, 0, Math.PI * 2); c.fill();
  } else {
    const sky = c.createLinearGradient(0, 0, 0, horizon);
    sky.addColorStop(0, p.skyTop); sky.addColorStop(1, p.skyLow);
    c.fillStyle = sky; c.fillRect(0, 0, width, horizon);
    // far trees and two kites
    c.fillStyle = "#3f7a3a";
    for (let i = 0; i < 6; i++) { c.beginPath(); c.ellipse(width * 0.36 + i * 5 * u, horizon * 0.85 + (i % 2) * 2 * u, 6 * u, 3.5 * u, 0.5, 0, Math.PI * 2); c.fill(); }
    for (const [x, y, color] of [[0.2, 0.3, "#d8453a"], [0.78, 0.22, "#f2b632"]] as const) {
      c.fillStyle = color; c.beginPath(); c.moveTo(width * x, horizon * (y - 0.14)); c.lineTo(width * x + 3 * u, horizon * y); c.lineTo(width * x, horizon * (y + 0.2)); c.lineTo(width * x - 3 * u, horizon * y); c.closePath(); c.fill();
      c.strokeStyle = "#ffffffa0"; c.lineWidth = 1; c.beginPath(); c.moveTo(width * x, horizon * (y + 0.2)); c.quadraticCurveTo(width * x + 6 * u, horizon * 0.9, width * x + 2 * u, horizon); c.stroke();
    }
    c.fillStyle = p.trim; c.fillRect(0, horizon - 2 * u, width, 2 * u);
    c.fillStyle = p.floorA; c.fillRect(0, horizon, width, height - horizon);
    for (let col = -14; col <= 14; col++) {
      c.fillStyle = col % 2 ? "#a7b2bc" : p.floorB;
      c.beginPath();
      c.moveTo(cx + col * 4 * u, horizon); c.lineTo(cx + (col + 1) * 4 * u, horizon);
      c.lineTo(cx + (col + 1) * 15 * u, height); c.lineTo(cx + col * 15 * u, height); c.closePath(); c.fill();
    }
    c.fillStyle = "#a0562c38";
    for (let i = 0; i < 5; i++) { c.beginPath(); c.ellipse(rng() * width, horizon + rng() * (height - horizon), (3 + rng() * 5) * u, (1 + rng() * 2) * u, 0, 0, Math.PI * 2); c.fill(); }
  }
  // the ring the top spins in, chalked on the ground
  c.strokeStyle = p.chalk; c.lineWidth = Math.max(1.5, 0.6 * u);
  c.setLineDash([3 * u, 2.5 * u]);
  c.beginPath(); c.ellipse(cx, cy, 30 * u, 9 * u, 0, 0, Math.PI * 2); c.stroke();
  c.setLineDash([]);
}

/** The backdrop for a stage size, painted once into an offscreen canvas (reused when given). */
export function paintStage(world: number, level: number, width: number, height: number, horizon: number, cx: number, cy: number, ratio: number, into?: HTMLCanvasElement | null) {
  const canvas = into ?? document.createElement("canvas");
  canvas.width = Math.max(1, Math.round(width * ratio)); canvas.height = Math.max(1, Math.round(height * ratio));
  const c = canvas.getContext("2d");
  if (c) { c.setTransform(ratio, 0, 0, ratio, 0, 0); paintBackdrop(c, world, level, width, height, horizon, cx, cy); }
  return canvas;
}

// ---- the title: the start action, drawn as the game's own art ----
export const TITLE_ASPECT = 0.92;
/** The place behind, the top with its string wound, and the word on a wooden board. The whole picture is the button. */
export function drawTitleArt(canvas: HTMLCanvasElement, width: number, ratio: number, word: string, world: number) {
  const height = Math.round(width * TITLE_ASPECT), cx = width / 2, cy = height * 0.84;
  canvas.width = Math.round(width * ratio); canvas.height = Math.round(height * ratio);
  const c = canvas.getContext("2d");
  if (!c) return;
  c.setTransform(ratio, 0, 0, ratio, 0, 0);
  c.clearRect(0, 0, width, height);
  c.save();
  c.beginPath(); c.roundRect(0, 0, width, height, 10); c.clip();
  paintBackdrop(c, world, 1, width, height, height * 0.4, cx, cy);
  c.restore();
  // the top, leaning in the hand with its string wound
  const s = width * 0.58;
  c.fillStyle = "#00000030"; c.beginPath(); c.ellipse(cx, cy, s * 0.2, s * 0.05, 0, 0, Math.PI * 2); c.fill();
  c.save(); c.translate(cx, cy); c.rotate(0.1);
  paintTop(c, s); paintString(c, s, 8, 0.5); paintSpots(c, s, 0.6, 0);
  c.restore();
  // the board with the word
  const bw = width * 0.64, bh = height * 0.2, bx = cx - bw / 2, by = height * 0.06;
  c.fillStyle = "#00000030"; c.beginPath(); c.roundRect(bx + 4, by + 6, bw, bh, 8); c.fill();
  c.fillStyle = "#f0c58a"; c.beginPath(); c.roundRect(bx, by, bw, bh, 8); c.fill();
  c.strokeStyle = PAL.woodDark; c.lineWidth = 3; c.stroke();
  c.fillStyle = PAL.ink; c.font = `800 ${Math.round(bh * 0.6)}px ${DISPLAY_FONT}`; c.textAlign = "center"; c.textBaseline = "middle";
  c.fillText(word, cx, by + bh * 0.54);
  c.textBaseline = "alphabetic";
}

// ---- the story ----
export const STORY_ASPECT = 0.72;
export function drawStoryPanel(canvas: HTMLCanvasElement, width: number, ratio: number, index: number) {
  const height = Math.round(width * STORY_ASPECT), cx = width / 2, cy = height * 0.82;
  canvas.width = Math.round(width * ratio); canvas.height = Math.round(height * ratio);
  const c = canvas.getContext("2d");
  if (!c) return;
  c.setTransform(ratio, 0, 0, ratio, 0, 0);
  paintBackdrop(c, 0, 1, width, height, height * 0.4, cx, cy);
  const s = width * 0.42;
  if (index === 0) {
    // noon in the উঠান: the top resting on a palm
    c.save(); c.translate(cx, cy - s * 0.12); paintTop(c, s); c.restore();
    paintPalm(c, cx, cy - s * 0.12, s * 0.8);
  } else if (index === 1) {
    // wind the string, throw: the top with its string and a curl of arrows
    c.save(); c.translate(cx, height * 0.74); c.rotate(0.12); paintTop(c, s); paintString(c, s, 9, 1); c.restore();
    c.strokeStyle = "#ffffffe0"; c.lineWidth = 4; c.lineCap = "round";
    c.beginPath(); c.arc(cx, height * 0.5, s * 0.5, Math.PI * 0.15, Math.PI * 0.85); c.stroke();
    c.beginPath(); c.moveTo(cx - s * 0.45, height * 0.5 + s * 0.2); c.lineTo(cx - s * 0.5, height * 0.5 + s * 0.38); c.lineTo(cx - s * 0.3, height * 0.5 + s * 0.38); c.stroke();
  } else {
    // spinning and leaning, with the dot on its gauge reaching the green
    c.fillStyle = "#00000030"; c.beginPath(); c.ellipse(cx, cy - s * 0.06, s * 0.2, s * 0.05, 0, 0, Math.PI * 2); c.fill();
    c.save(); c.translate(cx, cy - s * 0.06); c.rotate(0.22); paintTop(c, s); paintSpots(c, s, 0.5, 0.9); c.restore();
    const gw = width * 0.7, gx = cx - gw / 2, gy = height * 0.12;
    c.fillStyle = "#0000004d"; c.beginPath(); c.roundRect(gx - 12, gy - 12, gw + 24, 24, 6); c.fill();
    c.fillStyle = "#ffffff4d"; c.fillRect(gx, gy - 2, gw, 4);
    c.fillStyle = PAL.good; c.fillRect(gx - 6, gy - 5, gw * 0.14 + 6, 10); c.fillRect(gx + gw * 0.86, gy - 5, gw * 0.14 + 6, 10);
    c.fillStyle = "#fff"; c.strokeStyle = PAL.ink; c.lineWidth = 2;
    c.beginPath(); c.arc(gx + gw * 0.93, gy, 10, 0, Math.PI * 2); c.fill(); c.stroke();
  }
}

/** Where the top spins, its size, and the far edge, for a stage of this size. */
export function layoutFor(width: number, height: number) {
  return { horizon: height * 0.2, cx: width / 2, cy: height * 0.64, size: Math.min(height * 0.36, width * 0.46) };
}

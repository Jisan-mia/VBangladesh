// The title's start button (the walker on the ridge, a bamboo signboard saying চলো), the three story panels, and the level intro's picture.
// All drawn in code. Nothing here runs per frame.
import { PALETTES } from "./art";
import { drawWalker, drawFrame } from "./draw.hot";
import { centreAt, MIN_H, steadyAt, W } from "./field";
import { defOfLevel, type Scene } from "./levels";
import { createGame, PH_WALK } from "./rules";
import { makeLook, paintLook, sizeLook } from "./scene";

const TAU = Math.PI * 2;
export const TITLE_ASPECT = 1.02;
export const STORY_ASPECT = 2 / 3;
export const PREVIEW_ASPECT = MIN_H / W;

function sized(canvas: HTMLCanvasElement, width: number, height: number, ratio: number) {
  canvas.width = Math.round(width * ratio); canvas.height = Math.round(height * ratio);
  const c = canvas.getContext("2d")!;
  c.setTransform(ratio, 0, 0, ratio, 0, 0);
  c.clearRect(0, 0, width, height);
  return c;
}

/** The sky, sun, a tree line, a hut, and flat paddy below `horizon`, for the title and the story. */
function backdrop(c: CanvasRenderingContext2D, width: number, height: number, horizon: number, scene: Scene, hut = true) {
  const p = PALETTES[scene], u = width / 360;
  const sky = c.createLinearGradient(0, 0, 0, horizon);
  sky.addColorStop(0, p.skyTop); sky.addColorStop(1, p.skyLow);
  c.fillStyle = sky; c.fillRect(0, 0, width, horizon);
  const sunX = width * (scene === "evening" ? 0.24 : 0.78), sunY = horizon - u * (scene === "evening" ? 14 : 62), r = u * (scene === "evening" ? 24 : 16);
  const glow = c.createRadialGradient(sunX, sunY, r * 0.5, sunX, sunY, r * 3.4);
  glow.addColorStop(0, p.glow); glow.addColorStop(1, "rgba(255,255,255,0)");
  c.fillStyle = glow; c.fillRect(sunX - r * 4, sunY - r * 4, r * 8, r * 8);
  c.fillStyle = p.sun; c.beginPath(); c.arc(sunX, sunY, r, 0, TAU); c.fill();
  c.fillStyle = p.treesFar; c.beginPath(); c.moveTo(0, horizon);
  for (let x = 0; x <= width; x += 16 * u) c.lineTo(x, horizon - u * (10 + ((x * 7) % 11)));
  c.lineTo(width, horizon); c.fill();
  c.fillStyle = p.trees; c.beginPath(); c.moveTo(0, horizon);
  for (let x = 0; x <= width; x += 22 * u) c.quadraticCurveTo(x + 11 * u, horizon - u * (14 + ((x * 3) % 12)), x + 22 * u, horizon - 2);
  c.lineTo(width, horizon); c.fill();
  if (hut) {
    const hx = width * 0.2;
    c.fillStyle = "#c08a55"; c.fillRect(hx, horizon - u * 22, u * 34, u * 18);
    c.fillStyle = "#b8893a"; c.beginPath(); c.moveTo(hx - u * 5, horizon - u * 20); c.lineTo(hx + u * 17, horizon - u * 38); c.lineTo(hx + u * 39, horizon - u * 20); c.fill();
  }
  c.fillStyle = p.paddy; c.fillRect(0, horizon, width, height - horizon);
  c.strokeStyle = p.tuft; c.lineWidth = Math.max(1, u * 1.2);
  for (let row = 0; row < 14; row++) {
    const y = horizon + u * 6 + row * row * u * 0.55 + row * u * 5;
    if (y > height) break;
    c.beginPath();
    for (let x = (row % 2) * 6 * u; x < width; x += (7 + row * 1.4) * u) { c.moveTo(x, y); c.lineTo(x - u, y - u * (3 + row * 0.5)); c.moveTo(x, y); c.lineTo(x + u, y - u * (3 + row * 0.5)); }
    c.stroke();
  }
}

/** A clay ridge seen from behind, narrowing to the horizon along a gentle curve. Returns its middle x at height t (0 bottom, 1 horizon). */
function ridge(c: CanvasRenderingContext2D, width: number, height: number, horizon: number, scene: Scene, bend: number, widest: number) {
  const p = PALETTES[scene], mid = (t: number) => width / 2 + Math.sin(t * 2.6) * width * bend * t, wide = (t: number) => widest * (1 - t) ** 1.25 + width * 0.012;
  const fill = (grow: number, color: string, shift = 0) => {
    c.fillStyle = color; c.beginPath();
    for (let i = 0; i <= 24; i++) { const t = i / 24; c.lineTo(mid(t) - wide(t) * grow + shift, height - t * (height - horizon)); }
    for (let i = 24; i >= 0; i--) { const t = i / 24; c.lineTo(mid(t) + wide(t) * grow + shift, height - t * (height - horizon)); }
    c.fill();
  };
  fill(1.12, p.grass); fill(1, p.earth); fill(0.88, p.earthTop); fill(0.36, p.worn);
  return mid;
}

/** The title: a big bamboo signboard with `label`, the walker on the ridge below it. The canvas is the start button; CSS sways it. */
export function drawTitle(canvas: HTMLCanvasElement, width: number, ratio: number, scene: Scene, label: string) {
  const height = Math.round(width * TITLE_ASPECT), c = sized(canvas, width, height, ratio), u = width / 360;
  const horizon = height * 0.5;
  backdrop(c, width, height, horizon, scene);
  const mid = ridge(c, width, height, horizon, scene, 0.14, width * 0.3);
  // The board hangs between two bamboo poles standing in the paddy.
  const bw = width * 0.82, bh = height * 0.27, bx = (width - bw) / 2, by = height * 0.045;
  c.strokeStyle = "#8a6a28"; c.lineWidth = u * 7; c.lineCap = "round";
  c.beginPath(); c.moveTo(bx + bw * 0.1, by + bh * 0.9); c.lineTo(bx + bw * 0.1, horizon + u * 8); c.moveTo(bx + bw * 0.9, by + bh * 0.9); c.lineTo(bx + bw * 0.9, horizon + u * 8); c.stroke();
  c.fillStyle = "rgba(40,30,10,0.22)"; c.beginPath(); c.roundRect(bx + u * 4, by + u * 7, bw, bh, u * 5); c.fill();
  c.fillStyle = "#e0ad4a"; c.beginPath(); c.roundRect(bx, by, bw, bh, u * 5); c.fill();
  c.strokeStyle = "#7a4f1c"; c.lineWidth = u * 5; c.stroke();
  c.strokeStyle = "rgba(122,79,28,0.35)"; c.lineWidth = u * 1.5;
  for (let i = 1; i < 4; i++) { c.beginPath(); c.moveTo(bx + u * 12, by + (bh * i) / 4); c.lineTo(bx + bw - u * 12, by + (bh * i) / 4); c.stroke(); }
  c.fillStyle = "#3a2410"; c.textAlign = "center"; c.textBaseline = "middle";
  c.font = `800 ${Math.round(bh * 0.7)}px "Display", "Bangla", sans-serif`;
  c.fillText(label, width / 2 - u * 18, by + bh * 0.54);
  c.fillStyle = "#3d6b21"; c.beginPath();
  const ax = width / 2 + bw * 0.3, ay = by + bh * 0.52, as = bh * 0.2;
  c.moveTo(ax - as, ay - as * 1.2); c.lineTo(ax + as * 1.1, ay); c.lineTo(ax - as, ay + as * 1.2); c.closePath(); c.fill();
  // The walker, big, near the bottom of the ridge, the tiffin in hand.
  const t = 0.2, scale = u * 2.6;
  c.save(); c.translate(mid(t), height - t * (height - horizon)); c.scale(scale, scale);
  drawWalker(c, 0, 0, 0, 0, 1, false, true, false, 0, 0, 0, 0, false);
  c.restore();
}

export const STORY = [
  "সকাল। নানুবাড়ি মাঠের ওপারে। হাতে পিঠার টিফিন।",
  "সোজা পথ নেই, আছে শুধু সরু আল। দুপাশে কাদা।",
  "আঙুল টেনে পা রাখো আলের মাঝখানে।",
] as const;

/** One story panel, framed like a printed page. */
export function drawStoryPanel(canvas: HTMLCanvasElement, width: number, ratio: number, index: number) {
  const height = Math.round(width * STORY_ASPECT), c = sized(canvas, width, height, ratio), u = width / 360;
  const horizon = height * (index === 1 ? 0.3 : 0.46);
  backdrop(c, width, height, horizon, "morning", index === 0);
  const mid = ridge(c, width, height, horizon, "morning", index === 0 ? 0.2 : 0.1, width * (index === 1 ? 0.2 : 0.16));
  if (index === 0) {
    // A far hut with smoke at the end of the ridge, the walker small and just starting.
    const t = 0.92, hx = mid(t), hy = height - t * (height - horizon);
    c.fillStyle = "#c08a55"; c.fillRect(hx - u * 8, hy - u * 8, u * 16, u * 9);
    c.fillStyle = "#b8893a"; c.beginPath(); c.moveTo(hx - u * 11, hy - u * 7); c.lineTo(hx, hy - u * 16); c.lineTo(hx + u * 11, hy - u * 7); c.fill();
    c.strokeStyle = "rgba(255,255,255,0.7)"; c.lineWidth = u * 2; c.beginPath(); c.moveTo(hx + u * 4, hy - u * 14); c.quadraticCurveTo(hx + u * 10, hy - u * 24, hx + u * 3, hy - u * 32); c.stroke();
    c.save(); const w = mid(0.12); c.translate(w, height - 0.12 * (height - horizon)); c.scale(u * 1.4, u * 1.4); drawWalker(c, 0, 0, 0, 0, 1, false, true, false, 0, 0, 0, 0, false); c.restore();
  } else if (index === 1) {
    // Close: the walker mid-slip into the mud, a splash of drops.
    c.save(); const w = mid(0.18); c.translate(w, height - 0.18 * (height - horizon)); c.scale(u * 2.1, u * 2.1);
    drawWalker(c, 0, 0, 0, 0.4, 1, false, false, false, 0, 0, 0, 0, false);
    c.restore();
    c.fillStyle = "#3b2a18";
    for (let i = 0; i < 6; i++) { c.beginPath(); c.arc(mid(0.2) + u * (28 + i * 7), height * (0.62 - (i % 3) * 0.05), u * (3 - i * 0.2), 0, TAU); c.fill(); }
  } else {
    // A finger dragging left and right over the field, with its trail and arrows.
    const w = mid(0.14);
    c.save(); c.translate(w, height - 0.14 * (height - horizon)); c.scale(u * 1.5, u * 1.5); drawWalker(c, 0, 0, 0, 0, 1, false, true, false, 0, 0, 0, 0, false); c.restore();
    const fy = height * 0.4, fx = w + u * 18;
    c.strokeStyle = "rgba(255,255,255,0.85)"; c.lineWidth = u * 4; c.setLineDash([u * 8, u * 7]);
    c.beginPath(); c.moveTo(fx - u * 70, fy); c.lineTo(fx + u * 70, fy); c.stroke(); c.setLineDash([]);
    for (const dir of [-1, 1]) { c.fillStyle = "rgba(255,255,255,0.9)"; c.beginPath(); c.moveTo(fx + dir * u * 84, fy); c.lineTo(fx + dir * u * 66, fy - u * 12); c.lineTo(fx + dir * u * 66, fy + u * 12); c.closePath(); c.fill(); }
    c.fillStyle = "rgba(255,255,255,0.55)"; c.beginPath(); c.arc(fx, fy, u * 24, 0, TAU); c.fill();
    c.fillStyle = "#f3d1b0"; c.beginPath(); c.arc(fx, fy, u * 13, 0, TAU); c.fill();
    c.strokeStyle = "#b98a63"; c.lineWidth = u * 2; c.stroke();
  }
  c.strokeStyle = "#24301b"; c.lineWidth = 3; c.strokeRect(1.5, 1.5, width - 3, height - 3);
}

/**
 * A small real frame of the field, for the intro card of a level: the walker with the level's new thing ahead of it
 * (a puddle, a goat, the bridge, a gust, the dark, the edge's wobble). Drawn with the game's own art, so it can't drift from it.
 */
export function drawPreview(canvas: HTMLCanvasElement, width: number, ratio: number, level: number) {
  const height = Math.round(width * PREVIEW_ASPECT), c = sized(canvas, width, height, ratio);
  const def = defOfLevel(level), game = createGame({ seed: 7001 + level, kind: "level", level, mode: "n" }), field = game.field;
  // Zoomed in: a window 200 board units wide around the walker, so the new thing is big enough to read.
  const region = 200, scale = width / region, look = makeLook();
  sizeLook(look, MIN_H, scale, ratio);
  look.calm = true;
  paintLook(look, def.scene, def.dark);
  game.phase = PH_WALK;
  game.clock = 1.2;
  // Where to stand: just before the level's new obstacle (so it is ahead of the walker), in a gust, in the strongest steady wind, or on a plain stretch.
  const kindFor = level === 9 ? "bridge" : level === 7 ? "goat" : level === 4 ? "puddle" : "";
  const target = kindFor ? field.obstacles.find(o => o.kind === kindFor) : undefined, gust = field.gusts[0];
  let d = 260;
  if (target) d = target.d - 120;
  else if (level === 12 && gust) d = gust.d + gust.len * 0.4;
  else if (level === 11) { let best = 300; for (let t = 300; t < 700; t += 10) if (Math.abs(steadyAt(field, t)) > Math.abs(steadyAt(field, best))) best = t; d = best; }
  game.d = Math.max(0, d);
  game.x = centreAt(field, game.d);
  if (level === 3) { game.x = centreAt(field, game.d) + def.half * 0.86; game.edge = 0.86; game.lean = 0.5; }
  const radius = 6, left = Math.min(W - region, Math.max(0, game.x - region / 2)), top = look.feetY - (height / scale) * 0.8;
  c.save();
  c.beginPath(); c.roundRect(0, 0, width, height, radius); c.clip();
  c.scale(scale, scale);
  c.translate(-left, -top);
  drawFrame(c, look, game);
  c.restore();
  c.strokeStyle = "#24301b"; c.lineWidth = 3; c.beginPath(); c.roundRect(1.5, 1.5, width - 3, height - 3, radius); c.stroke();
}

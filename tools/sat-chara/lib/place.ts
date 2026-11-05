// The lane's dressing, drawn once into the cached background (setup code, not a hot path): what hangs on each place's wall,
// the wear on its ground, the chalk ring and dust under each pile, and a soft shade around the pile so the clay pieces
// are the brightest, busiest thing in the lane. Every colour is one the place already uses (scene.ts SCENES) or a
// shade of it; the wall items stay above y 175 so they never sit behind the pile.
import { makeRng, pick } from "../../../shared/game-core";
import { GROUND, H, W, WALL_X, type World } from "./world";

type Ctx = CanvasRenderingContext2D;
const TAU = Math.PI * 2;

function rect(c: Ctx, x: number, y: number, w: number, h: number, fill: string) { c.fillStyle = fill; c.fillRect(x, y, w, h); }
function dot(c: Ctx, x: number, y: number, rx: number, ry: number, fill: string) { c.fillStyle = fill; c.beginPath(); c.ellipse(x, y, rx, ry, 0, 0, TAU); c.fill(); }

/** The alley: laundry on a string, a film poster, a window ledge with pots, and a patch where the plaster has fallen off. */
function alleyWall(c: Ctx) {
  // Plaster gone from a corner of the wall, the old bricks showing through in the wall's own dust colour.
  rect(c, 22, 132, 46, 30, "#c9ae86");
  c.fillStyle = "#ecdcbc";
  for (let y = 139, row = 0; y < 162; y += 7, row++) { c.fillRect(22, y, 46, 1.2); for (let x = 22 + (row % 2 ? 11 : 0) + 14; x < 68; x += 22) c.fillRect(x, y - 7, 1.2, 7); }
  c.strokeStyle = "#d8c39c"; c.lineWidth = 2.4; c.strokeRect(21, 131, 48, 32);
  // The window ledge and two pots.
  rect(c, 106, 174, 76, 5, "#d8c39c"); rect(c, 106, 179, 76, 2, "#b9a27c");
  rect(c, 122, 164, 12, 10, "#b45a35"); dot(c, 128, 160, 9, 7, "#4e8a3a");
  rect(c, 152, 166, 12, 8, "#c46d3f"); dot(c, 158, 162, 8, 6, "#5d8f3e"); dot(c, 161, 157, 2.4, 2.4, "#d8473a");
  // A film poster, a little torn.
  rect(c, 214, 100, 36, 50, "#f6e7c8"); rect(c, 214, 100, 36, 50, "rgba(120,80,40,0.08)");
  rect(c, 219, 106, 26, 20, "#4f7f86"); dot(c, 232, 116, 6, 7, "#f7dcae");
  rect(c, 219, 131, 26, 3, "#2b1d14"); rect(c, 222, 138, 20, 2, "#6b4f3a"); rect(c, 222, 142, 14, 2, "#6b4f3a");
  c.fillStyle = "#ecdcbc"; c.beginPath(); c.moveTo(250, 150); c.lineTo(242, 150); c.lineTo(250, 142); c.closePath(); c.fill();
  // Laundry on a string from the window to the meter box.
  c.strokeStyle = "#5a4636"; c.lineWidth = 1.2;
  c.beginPath(); c.moveTo(184, 86); c.quadraticCurveTo(245, 100, 298, 84); c.stroke();
  c.fillStyle = "#2f6f8f"; c.fillRect(200, 91, 17, 24); c.fillRect(196, 91, 5, 9); c.fillRect(216, 91, 5, 9);
  c.fillStyle = "#f6f0e2"; c.fillRect(232, 94, 20, 32); rect(c, 232, 94, 20, 3, "#cfc8b6");
  c.fillStyle = "#c8322b"; c.fillRect(266, 91, 16, 24); rect(c, 266, 97, 16, 2, "rgba(255,255,255,0.5)"); rect(c, 266, 105, 16, 2, "rgba(255,255,255,0.5)");
  // A drainpipe down the corner wall, with its two clamps.
  rect(c, WALL_X - 16, 46, 6, GROUND - 56, "#8c8478"); rect(c, WALL_X - 16, 46, 2, GROUND - 56, "#b3ab9c");
  rect(c, WALL_X - 18, 98, 10, 4, "#6a645a"); rect(c, WALL_X - 18, 198, 10, 4, "#6a645a");
}

/** The school field: stumps and a cycle chalked on the boundary wall, a painted stripe, a water tap and two school bags. */
function schoolWall(c: Ctx) {
  // A painted green stripe along the boundary wall, and the stumps a hundred matches have been bowled at.
  rect(c, 0, 214, W, 14, "#3f7a52"); rect(c, 0, 214, W, 2, "#5b9a6c");
  c.fillStyle = "#2f2a22";
  for (const x of [120, 132, 144]) c.fillRect(x, 172, 3, 42);
  c.fillRect(119, 171, 15, 2.4); c.fillRect(132, 171, 14, 2.4);
  c.strokeStyle = "rgba(255,255,255,0.8)"; c.lineWidth = 1.6; c.beginPath(); c.arc(176, 196, 9, 0, TAU); c.moveTo(173, 193); c.lineTo(173, 193.1); c.moveTo(179, 193); c.lineTo(179, 193.1); c.moveTo(172, 199); c.quadraticCurveTo(176, 203, 181, 199); c.stroke();
  // A school bell on a bracket by the veranda.
  rect(c, 214, 94, 16, 3, "#6a5a3a"); dot(c, 218, 104, 7, 8, "#c99a2e"); rect(c, 211, 111, 14, 2, "#8a6414");
  // A water tap on a post, with a wet patch.
  rect(c, 206, 232, 5, 48, "#6a7a82"); rect(c, 206, 230, 16, 4, "#6a7a82"); rect(c, 220, 234, 3, 6, "#6a7a82");
  dot(c, 221, GROUND - 6, 12, 3, "rgba(60,90,100,0.3)");
  // Two school bags leaning on the wall.
  rect(c, 250, GROUND - 38, 26, 28, "#2f6f8f"); rect(c, 250, GROUND - 38, 26, 5, "#1f4d63"); rect(c, 256, GROUND - 22, 14, 10, "#1f4d63");
  rect(c, 280, GROUND - 32, 22, 22, "#b4472a"); rect(c, 280, GROUND - 32, 22, 4, "#7d2c17"); rect(c, 285, GROUND - 18, 12, 8, "#7d2c17");
}

/** The courtyard: dung cakes drying on the mud wall, a gourd vine along the tin roof, dried chillies and a hurricane lamp's glow. */
function courtyardWall(c: Ctx) {
  // গুঁটে: round dung cakes pressed on the wall in rows, each with a thumb mark.
  for (let row = 0; row < 3; row++) for (let k = 0; k < 6; k++) {
    const x = 330 + k * 20 + (row % 2) * 9, y = 96 + row * 17;
    dot(c, x, y, 8.5, 7.5, "#a17552"); dot(c, x, y, 6.5, 5.5, "#b78f6a"); dot(c, x - 1.5, y - 1, 2.6, 1.8, "#8e6444");
  }
  // A gourd vine along the roof's edge: leaves and two pale gourds.
  c.strokeStyle = "#4a6b34"; c.lineWidth = 1.6; c.beginPath(); c.moveTo(8, 68); c.quadraticCurveTo(120, 76, 250, 66); c.stroke();
  c.fillStyle = "#4e8a3a";
  for (let x = 20; x < 250; x += 26) dot(c, x, 70 + Math.sin(x) * 3, 7, 4.5, "#4e8a3a");
  c.strokeStyle = "#4a6b34"; c.lineWidth = 1; c.beginPath(); c.moveTo(150, 72); c.lineTo(150, 84); c.moveTo(210, 68); c.lineTo(210, 80); c.stroke();
  dot(c, 150, 100, 6.5, 17, "#d8d99a"); dot(c, 148, 96, 1.6, 8, "rgba(255,255,255,0.5)");
  dot(c, 210, 94, 5.5, 14, "#c9cc86"); dot(c, 208, 90, 1.4, 7, "rgba(255,255,255,0.45)");
  // A braid of dried chillies hung by the window.
  c.strokeStyle = "#5a4636"; c.lineWidth = 1; c.beginPath(); c.moveTo(142, 92); c.lineTo(142, 100); c.stroke();
  for (let k = 0; k < 6; k++) dot(c, 142 + (k % 2 ? 3 : -3), 104 + k * 6, 2.6, 4.2, k % 3 ? "#c8322b" : "#a82a22");
  // The hurricane lamp throws a little light on the wall.
  const glow = c.createRadialGradient(201, 136, 2, 201, 136, 46);
  glow.addColorStop(0, "rgba(255,232,168,0.45)"); glow.addColorStop(1, "rgba(255,232,168,0)");
  c.fillStyle = glow; c.fillRect(150, 90, 100, 90);
  // Cracks in the mud plaster.
  c.strokeStyle = "rgba(90,56,34,0.4)"; c.lineWidth = 1;
  c.beginPath(); c.moveTo(262, 70); c.lineTo(268, 92); c.lineTo(262, 106); c.lineTo(270, 126); c.moveTo(268, 92); c.lineTo(280, 100); c.stroke();
  c.beginPath(); c.moveTo(40, 150); c.lineTo(52, 160); c.lineTo(48, 174); c.stroke();
}

/** What the place keeps on its wall, above the pile. */
export function dressWall(c: Ctx, scene: number) {
  if (scene === 0) alleyWall(c);
  else if (scene === 1) schoolWall(c);
  else courtyardWall(c);
}

/** Wear on the ground: pebbles, and each place's own marks (brick wear, grass tufts and a bare path, cracks and broom sweeps). */
export function wearGround(c: Ctx, scene: number) {
  const rng = makeRng(scene * 77 + 13), top = GROUND + 3, depth = H - GROUND - 6;
  if (scene === 0) {
    // Some bricks worn pale, some dark; a puddle stain and a crack.
    for (let k = 0; k < 26; k++) {
      const x = pick(rng, W / 18) * 18 + (pick(rng, 2) * 9), y = GROUND + 1 + pick(rng, 3) * 8;
      rect(c, x + 1, y, 17, 7, k % 3 ? "rgba(0,0,0,0.1)" : "rgba(255,225,190,0.16)");
    }
    dot(c, 120, GROUND + 16, 20, 4, "rgba(70,40,30,0.3)");
    c.strokeStyle = "rgba(60,30,20,0.4)"; c.lineWidth = 1; c.beginPath(); c.moveTo(310, GROUND + 3); c.lineTo(318, GROUND + 11); c.lineTo(312, GROUND + 17); c.stroke();
  } else if (scene === 1) {
    // A bare worn strip down the middle of the field, and tufts of grass.
    dot(c, W / 2, GROUND + 14, 250, 8, "rgba(214,196,120,0.55)");
    c.strokeStyle = "#6f9a42"; c.lineWidth = 1.3;
    for (let k = 0; k < 44; k++) {
      const x = pick(rng, W), y = top + 2 + pick(rng, depth);
      c.beginPath(); c.moveTo(x - 2, y); c.lineTo(x - 3, y - 5); c.moveTo(x, y); c.lineTo(x, y - 6); c.moveTo(x + 2, y); c.lineTo(x + 3.5, y - 5); c.stroke();
    }
  } else {
    // Broom sweeps in the clay, a crack, and a few straws.
    c.strokeStyle = "rgba(160,118,76,0.55)"; c.lineWidth = 1;
    for (let k = 0; k < 7; k++) { const x = 20 + k * 66 + pick(rng, 20); c.beginPath(); c.arc(x, GROUND + 26, 34, Math.PI * 1.15, Math.PI * 1.85); c.stroke(); }
    c.strokeStyle = "rgba(90,56,34,0.45)"; c.beginPath(); c.moveTo(220, GROUND + 3); c.lineTo(228, GROUND + 10); c.lineTo(222, GROUND + 14); c.lineTo(232, GROUND + 20); c.stroke();
    c.strokeStyle = "#d6b25a"; c.lineWidth = 1.2;
    for (let k = 0; k < 9; k++) { const x = pick(rng, W), y = top + 3 + pick(rng, depth); c.beginPath(); c.moveTo(x, y); c.lineTo(x + 6, y - 1.5); c.stroke(); }
  }
  for (let k = 0; k < 18; k++) {
    const x = pick(rng, W), y = top + 2 + pick(rng, depth), r = 1 + rng() * 1.6;
    dot(c, x, y + 0.8, r + 0.4, r * 0.6, "rgba(0,0,0,0.16)"); dot(c, x, y, r + 0.2, r * 0.7, scene === 1 ? "#b9ad82" : "#d9c6a6");
  }
}

/** A chalk ring and a dusting of trampled ground under every pile that stands on the lane, so the eye lands on it. */
export function markPiles(c: Ctx, w: World) {
  const spans: number[] = [];
  for (let i = 0; i < w.x.length; i++) {
    if (!w.onFixed[i] || Math.abs(w.hy[i] + w.h[i] / 2 - GROUND) > 0.6) continue;
    spans.push(w.hx[i] - w.w[i] / 2, w.hx[i] + w.w[i] / 2);
  }
  const pairs: [number, number][] = [];
  for (let i = 0; i < spans.length; i += 2) pairs.push([spans[i], spans[i + 1]]);
  pairs.sort((a, b) => a[0] - b[0]);
  const piles: [number, number][] = [];
  for (const [a, b] of pairs) {
    const last = piles[piles.length - 1];
    if (last && a - last[1] < 14) last[1] = Math.max(last[1], b); else piles.push([a, b]);
  }
  for (const [a, b] of piles) {
    const cx = (a + b) / 2, rx = (b - a) / 2 + 16;
    c.fillStyle = "rgba(255,238,200,0.4)"; c.beginPath(); c.ellipse(cx, GROUND + 4, rx + 6, 8, 0, 0, TAU); c.fill();
    c.strokeStyle = "rgba(255,255,255,0.9)"; c.lineWidth = 2.2; c.setLineDash([7, 5]);
    c.beginPath(); c.ellipse(cx, GROUND + 4, rx, 6.5, 0, 0, TAU); c.stroke(); c.setLineDash([]);
  }
}

/** A soft shade toward the edges of the lane, centred on the piles: the wall and the sky fall back, the clay pieces stand out. */
export function shadeAround(c: Ctx, w: World, extra: number) {
  let sum = 0, n = 0;
  for (let i = 0; i < w.x.length; i++) { sum += w.hx[i]; n++; }
  const cx = n ? sum / n : W * 0.7, shade = c.createRadialGradient(cx, GROUND - 40, 70, cx, GROUND - 40, 330);
  shade.addColorStop(0, "rgba(43,29,20,0)"); shade.addColorStop(1, "rgba(43,29,20,0.16)");
  c.fillStyle = shade; c.fillRect(0, -extra, W, H + extra);
}

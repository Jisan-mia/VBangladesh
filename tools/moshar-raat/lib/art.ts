// The dark bedroom, the cartoon mosquitoes and the electric bat, drawn in board units (W × H from night.ts).
// The room is drawn once into an offscreen canvas; only the window, the mosquitoes, the bat and the sparks move.
import { H, NET_TOP, PILLOW_X, PILLOW_Y, W, type Guard } from "./night";

const TAU = Math.PI * 2;
export const INK = { wall: "#141c36", wallLow: "#0e152b", floor: "#0a0f20", frame: "#33405f", wood: "#6e4528", woodTop: "#8a5a33", kantha: "#8c2f3d", stitch: "#f1d9c4", pillow: "#e8e2d4", skin: "#b07a52", hair: "#17140f" };

function round(c: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  c.beginPath();
  c.moveTo(x + r, y); c.arcTo(x + w, y, x + w, y + h, r); c.arcTo(x + w, y + h, x, y + h, r); c.arcTo(x, y + h, x, y, r); c.arcTo(x, y, x + w, y, r);
  c.closePath();
}

/** The sleeper: a head on the embroidered pillow, the কাঁথা pulled up to the chin. */
function drawBed(c: CanvasRenderingContext2D) {
  c.fillStyle = INK.wood;
  c.fillRect(76, 372, 10, 34); c.fillRect(274, 372, 10, 34);
  c.fillStyle = INK.kantha; round(c, 70, 326, 220, 40, 8); c.fill();
  // The pillow and the head on it.
  c.fillStyle = INK.pillow; round(c, PILLOW_X - 44, PILLOW_Y - 32, 88, 28, 10); c.fill();
  c.fillStyle = "#d77a8c";
  for (const dx of [-32, 32]) { c.beginPath(); c.arc(PILLOW_X + dx, PILLOW_Y - 18, 3.2, 0, TAU); c.fill(); }
  c.fillStyle = "#6e9a5b";
  for (const dx of [-37, -27, 27, 37]) { c.beginPath(); c.ellipse(PILLOW_X + dx, PILLOW_Y - 14, 2.6, 1.3, 0, 0, TAU); c.fill(); }
  c.fillStyle = INK.skin; c.beginPath(); c.arc(PILLOW_X, PILLOW_Y - 18, 12, 0, TAU); c.fill();
  c.fillStyle = INK.hair; c.beginPath(); c.arc(PILLOW_X, PILLOW_Y - 21, 12.5, Math.PI * 1.02, Math.PI * 1.98); c.closePath(); c.fill();
  c.strokeStyle = "#3a2516"; c.lineWidth = 1.4; c.lineCap = "round";
  for (const dx of [-4.5, 4.5]) { c.beginPath(); c.arc(PILLOW_X + dx, PILLOW_Y - 17, 2.4, 0.15 * Math.PI, 0.85 * Math.PI); c.stroke(); }
  // The কাঁথা's top fold, with running stitches.
  c.fillStyle = "#a33a49"; round(c, 72, PILLOW_Y - 8, 216, 16, 6); c.fill();
  c.strokeStyle = INK.stitch; c.lineWidth = 1.2; c.setLineDash([4, 4]);
  for (const y of [PILLOW_Y + 2, PILLOW_Y + 13, PILLOW_Y + 22]) { c.beginPath(); c.moveTo(80, y); c.lineTo(280, y); c.stroke(); }
  c.setLineDash([]);
  // The খাট's front rail.
  c.fillStyle = INK.wood; round(c, 64, 364, 232, 14, 4); c.fill();
  c.fillStyle = INK.woodTop; c.fillRect(68, 364, 224, 3);
  // Zz, quietly.
  c.fillStyle = "rgba(220,228,255,0.45)"; c.font = "700 11px sans-serif"; c.fillText("z", PILLOW_X + 18, PILLOW_Y - 34); c.font = "700 8px sans-serif"; c.fillText("z", PILLOW_X + 26, PILLOW_Y - 42);
}

/** The মশারি over the bed on a net night, with its holes on the top edge. */
function drawNet(c: CanvasRenderingContext2D, holes: readonly number[]) {
  const left = 76, right = 284, bottom = 366;
  c.strokeStyle = "rgba(230,236,255,0.28)"; c.lineWidth = 1;
  c.beginPath(); c.moveTo(left, NET_TOP); c.lineTo(58, 0); c.moveTo(right, NET_TOP); c.lineTo(302, 0); c.stroke();
  c.fillStyle = "rgba(230,236,255,0.09)"; c.fillRect(left, NET_TOP, right - left, bottom - NET_TOP);
  c.strokeStyle = "rgba(230,236,255,0.14)";
  c.beginPath();
  for (let x = left; x <= right; x += 6) { c.moveTo(x, NET_TOP); c.lineTo(x, bottom); }
  for (let y = NET_TOP; y <= bottom; y += 6) { c.moveTo(left, y); c.lineTo(right, y); }
  c.stroke();
  c.strokeStyle = "rgba(240,244,255,0.5)"; c.lineWidth = 1.6; c.strokeRect(left, NET_TOP, right - left, bottom - NET_TOP);
  for (const x of holes) {
    c.fillStyle = INK.wallLow; c.beginPath();
    for (let i = 0; i < 10; i++) { const a = (i / 10) * TAU, r = i % 2 ? 6 : 9; c.lineTo(x + Math.cos(a) * r, NET_TOP + Math.sin(a) * r * 0.8); }
    c.closePath(); c.fill();
    c.strokeStyle = "rgba(240,244,255,0.7)"; c.lineWidth = 1.2; c.stroke();
  }
}

/** Everything that never moves: wall, floor, door, ঘুলঘুলি, clock, coil, bed and (on a net night) the মশারি. */
export function drawRoom(c: CanvasRenderingContext2D, guard: Guard, holes: readonly number[]) {
  const wall = c.createLinearGradient(0, 0, 0, H);
  wall.addColorStop(0, INK.wall); wall.addColorStop(1, INK.wallLow);
  c.fillStyle = wall; c.fillRect(0, 0, W, H);
  c.fillStyle = INK.floor; c.fillRect(0, 394, W, H - 394);
  c.fillStyle = "#1b2442"; c.fillRect(0, 392, W, 3);
  // Window frame (the glass is drawn every frame: it brightens towards dawn).
  c.fillStyle = INK.frame; round(c, 30, 44, 82, 86, 4); c.fill();
  c.fillStyle = "#28324f"; c.fillRect(26, 128, 90, 6);
  // The half-open door on the left.
  c.fillStyle = "#070b18"; c.fillRect(0, 168, 26, 226);
  c.fillStyle = "#1f2a4a"; c.beginPath(); c.moveTo(14, 168); c.lineTo(34, 176); c.lineTo(34, 386); c.lineTo(14, 394); c.closePath(); c.fill();
  c.fillStyle = "#c9a35a"; c.beginPath(); c.arc(29, 290, 2.2, 0, TAU); c.fill();
  // The ঘুলঘুলি high on the right wall.
  c.fillStyle = "#26304e"; round(c, 320, 88, 34, 30, 4); c.fill();
  c.fillStyle = "#060a16";
  for (const x of [328, 337, 346]) { c.beginPath(); c.arc(x, 103, 3.4, Math.PI, 0); c.lineTo(x + 3.4, 111); c.lineTo(x - 3.4, 111); c.closePath(); c.fill(); }
  // The wall clock: just past two.
  c.fillStyle = "#e6e0cf"; c.beginPath(); c.arc(252, 62, 15, 0, TAU); c.fill();
  c.strokeStyle = "#2b2b2b"; c.lineWidth = 2; c.lineCap = "round";
  c.beginPath(); c.moveTo(252, 62); c.lineTo(258, 58); c.moveTo(252, 62); c.lineTo(252, 51); c.stroke();
  // The coil in its tin, an ember and a thread of smoke.
  c.fillStyle = "#3d4660"; c.beginPath(); c.ellipse(320, 402, 16, 4, 0, 0, TAU); c.fill();
  c.strokeStyle = "#3e7a45"; c.lineWidth = 2.2;
  c.beginPath(); for (let a = 0; a < TAU * 2.6; a += 0.3) { const r = 2 + a * 1.5; c.lineTo(320 + Math.cos(a) * r, 398 + Math.sin(a) * r * 0.32); } c.stroke();
  c.fillStyle = "rgba(255,140,60,0.25)"; c.beginPath(); c.arc(331, 397, 6, 0, TAU); c.fill();
  c.fillStyle = "#ff8a3d"; c.beginPath(); c.arc(331, 397, 1.8, 0, TAU); c.fill();
  c.strokeStyle = "rgba(200,210,235,0.12)"; c.lineWidth = 1.5;
  c.beginPath(); c.moveTo(331, 394); c.bezierCurveTo(325, 380, 338, 370, 330, 352); c.stroke();
  drawBed(c);
  if (guard === "net") drawNet(c, holes);
}

// Window glass from night to dawn, made once so a frame never builds a colour string.
const SKY = Array.from({ length: 33 }, (_, i) => {
  const t = i / 32, mix = (a: number, b: number) => Math.round(a + (b - a) * t);
  return `rgb(${mix(29, 244)},${mix(44, 197)},${mix(90, 143)})`;
});

/** The window: sky brightening with `dawn` (0..1), the moon fading, rain on rainy nights, then the grill. */
export function drawWindow(c: CanvasRenderingContext2D, dawn: number, rain: boolean, clock: number) {
  c.fillStyle = SKY[Math.round(Math.min(1, Math.max(0, dawn)) * 32)];
  c.fillRect(36, 50, 70, 74);
  if (dawn < 1) {
    c.globalAlpha = 1 - dawn;
    c.fillStyle = "#f5efd2"; c.beginPath(); c.arc(86, 70, 8, 0, TAU); c.fill();
    c.fillStyle = SKY[Math.round(dawn * 32)]; c.beginPath(); c.arc(90, 67, 7, 0, TAU); c.fill();
    c.fillStyle = "#dfe6ff"; c.fillRect(48, 64, 1.6, 1.6); c.fillRect(62, 96, 1.4, 1.4); c.fillRect(96, 108, 1.4, 1.4);
    c.globalAlpha = 1;
  }
  if (rain) {
    c.strokeStyle = "rgba(200,215,245,0.45)"; c.lineWidth = 1;
    c.beginPath();
    for (let i = 0; i < 9; i++) { const x = 40 + ((i * 23) % 64), y = 50 + ((i * 29 + clock * 150) % 64); c.moveTo(x, y); c.lineTo(x - 3, y + 9); }
    c.stroke();
  }
  c.fillStyle = INK.frame;
  for (const x of [51, 64, 77, 90]) c.fillRect(x, 50, 2, 74);
  c.fillRect(36, 86, 70, 2);
}

/** The dawn bar along the top edge. */
export function drawDawnBar(c: CanvasRenderingContext2D, p: number) {
  c.fillStyle = "rgba(255,255,255,0.08)"; c.fillRect(0, 0, W, 4);
  c.fillStyle = "#f4c58f"; c.fillRect(0, 0, W * Math.min(1, Math.max(0, p)), 4);
}

/**
 * A cartoon mosquito facing `facing` (1 right, -1 left), wings at `wing` (0..1 of a beat).
 * A pale halo keeps it findable in the dark room. Big enough to see on a 5-inch phone.
 */
export function drawBug(c: CanvasRenderingContext2D, x: number, y: number, facing: number, wing: number, alpha = 1) {
  c.save();
  c.globalAlpha = alpha;
  c.translate(x, y);
  c.fillStyle = "rgba(205,220,255,0.1)"; c.beginPath(); c.arc(0, 0, 14, 0, TAU); c.fill();
  c.scale(facing * 1.25, 1.25);
  c.strokeStyle = "#9eabcf"; c.lineWidth = 0.9; c.lineCap = "round";
  c.beginPath();
  c.moveTo(-3, 2); c.lineTo(-6, 8); c.moveTo(0, 2.5); c.lineTo(-1, 9); c.moveTo(2.5, 2); c.lineTo(4, 8);
  c.moveTo(6, 0); c.lineTo(11.5, 3.5);
  c.stroke();
  c.fillStyle = "rgba(236,242,255,0.55)";
  c.beginPath(); c.ellipse(-1, -4.5, 2.6, 2 + wing * 4, -0.5, 0, TAU); c.fill();
  c.beginPath(); c.ellipse(1.5, -4, 2.2, 1.5 + wing * 3.2, 0.35, 0, TAU); c.fill();
  c.fillStyle = "#dde5f7"; c.beginPath(); c.ellipse(-2, 0, 6, 3, 0.2, 0, TAU); c.fill();
  c.strokeStyle = "#8390b4"; c.lineWidth = 1;
  c.beginPath(); c.moveTo(-4, -2.4); c.lineTo(-4.6, 2.2); c.moveTo(-1.4, -2.8); c.lineTo(-1.8, 2.6); c.stroke();
  c.fillStyle = "#eef2fb"; c.beginPath(); c.arc(4.6, -1, 2.7, 0, TAU); c.fill();
  c.fillStyle = "#1a1f33"; c.beginPath(); c.arc(5.4, -1.6, 0.9, 0, TAU); c.fill();
  c.restore();
}

/** A zapped mosquito tumbling to the floor, `p` 0..1 of the fall. No mess, just a grey speck that fades. */
export function drawFallen(c: CanvasRenderingContext2D, x: number, y: number, p: number) {
  c.save();
  c.globalAlpha = 1 - p;
  c.translate(x, y + p * p * 46);
  c.rotate(p * 5);
  c.fillStyle = "#7d859c"; c.beginPath(); c.ellipse(0, 0, 6, 3, 0, 0, TAU); c.fill();
  c.strokeStyle = "#7d859c"; c.lineWidth = 1; c.beginPath(); c.moveTo(-2, 2); c.lineTo(-4, 6); c.moveTo(2, 2); c.lineTo(3, 6); c.stroke();
  c.restore();
}

/** The electric bat with its head centred on (x, y). `glow` 0..1 lights the mesh after a hit. */
export function drawBat(c: CanvasRenderingContext2D, x: number, y: number, glow: number, alpha = 1) {
  c.save();
  c.globalAlpha = alpha;
  c.translate(x, y);
  c.rotate(-0.22);
  // Handle and its button.
  c.fillStyle = "#2a62c4"; round(c, -6, 24, 12, 50, 5); c.fill();
  c.fillStyle = "#1d4a99"; for (let i = 0; i < 4; i++) c.fillRect(-6, 48 + i * 6, 12, 2);
  c.fillStyle = "#e0443e"; c.beginPath(); c.arc(0, 34, 3, 0, TAU); c.fill();
  // Head: mesh, then the glow, then the frame.
  round(c, -31, -25, 62, 50, 14);
  c.fillStyle = "rgba(20,30,60,0.3)"; c.fill();
  if (glow > 0) { c.globalAlpha = alpha * (0.15 + glow * 0.4); c.fillStyle = "#96d7ff"; c.fill(); c.globalAlpha = alpha; }
  c.save(); c.clip();
  c.strokeStyle = glow > 0.05 ? "#d6f0ff" : "#7d93c4"; c.lineWidth = glow > 0.05 ? 1.2 : 0.8;
  c.beginPath();
  for (let i = -28; i <= 28; i += 7) { c.moveTo(i, -25); c.lineTo(i, 25); }
  for (let j = -21; j <= 21; j += 7) { c.moveTo(-31, j); c.lineTo(31, j); }
  c.stroke();
  c.restore();
  round(c, -31, -25, 62, 50, 14);
  c.strokeStyle = "#f2c230"; c.lineWidth = 4; c.stroke();
  c.restore();
}

/** A pulsing ring around what the mosquitoes are after, while one is close. */
export function drawDanger(c: CanvasRenderingContext2D, x: number, y: number, pulse: number) {
  c.globalAlpha = 0.35 + 0.35 * pulse;
  c.strokeStyle = "#ffd278"; c.lineWidth = 2;
  c.beginPath(); c.arc(x, y, 22 + pulse * 6, 0, TAU); c.stroke();
  c.globalAlpha = 1;
}

// The scene, the set, the antenna and six original cartoon "programmes" (para cricket, a natok, a song, a river, a cartoon fish, cooking),
// plus the soft snow. Static layers are pre-rendered once; drawFrame is the only per-frame code.
import { PICTURES, type PictureId } from "./antenna";

export const SCENE_W = 360;
export const SCENE_H = 290;
/** The TV in scene units: drawn at TV_X/TV_Y, 1.08× its own 240×150 units. */
const TV_X = 50, TV_Y = 98, TV_S = 1.08;
/** The screen inside the TV's own units, and in scene units. */
export const TV_SCREEN = { x: 20, y: 28, w: 152, h: 98, r: 14 } as const;
export const SCREEN = { x: TV_X + TV_SCREEN.x * TV_S, y: TV_Y + TV_SCREEN.y * TV_S, w: TV_SCREEN.w * TV_S, h: TV_SCREEN.h * TV_S, r: TV_SCREEN.r * TV_S } as const;
export const POLE_X = 268;
export const ANTENNA_Y = 28;
export const PIC_W = 160, PIC_H = 104;

type Ctx = CanvasRenderingContext2D;

function rect(ctx: Ctx, color: string, x: number, y: number, w: number, h: number) {
  ctx.fillStyle = color;
  ctx.fillRect(x, y, w, h);
}
function circle(ctx: Ctx, color: string, x: number, y: number, r: number) {
  ctx.fillStyle = color;
  ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill();
}
function ellipse(ctx: Ctx, color: string, x: number, y: number, rx: number, ry: number, rotation = 0) {
  ctx.fillStyle = color;
  ctx.beginPath(); ctx.ellipse(x, y, rx, ry, rotation, 0, Math.PI * 2); ctx.fill();
}
function line(ctx: Ctx, color: string, width: number, x1: number, y1: number, x2: number, y2: number) {
  ctx.strokeStyle = color; ctx.lineWidth = width; ctx.lineCap = "round";
  ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke();
}
function rounded(ctx: Ctx, color: string, x: number, y: number, w: number, h: number, r: number) {
  ctx.fillStyle = color;
  ctx.beginPath(); ctx.roundRect(x, y, w, h, r); ctx.fill();
}
function vertical(ctx: Ctx, top: number, bottom: number, from: string, to: string) {
  const gradient = ctx.createLinearGradient(0, top, 0, bottom);
  gradient.addColorStop(0, from); gradient.addColorStop(1, to);
  return gradient;
}

/* ---------- the six programmes, each in its own 160×104 units ---------- */

function cricket(ctx: Ctx) {
  ctx.fillStyle = vertical(ctx, 0, 50, "#8fcbe9", "#d3ecf5"); ctx.fillRect(0, 0, PIC_W, 50);
  rect(ctx, "#7c8a99", 0, 38, PIC_W, 16);
  const crowd = ["#e45b4f", "#f2c14e", "#ffffff", "#5a8fd8"];
  for (let i = 0; i < 48; i++) circle(ctx, crowd[i % 4], ((i * 37) % 158) + 2, 42 + (i % 3) * 4, 1.7);
  rect(ctx, "#4f9a45", 0, 54, PIC_W, 50);
  for (let y = 58; y < PIC_H; y += 12) rect(ctx, "#5aa84f", 0, y, PIC_W, 6);
  line(ctx, "#f3f3ea", 1.2, 0, 54.5, PIC_W, 54.5);
  ctx.fillStyle = "#d8c28a";
  ctx.beginPath(); ctx.moveTo(72, 56); ctx.lineTo(88, 56); ctx.lineTo(104, PIC_H); ctx.lineTo(56, PIC_H); ctx.closePath(); ctx.fill();
  for (const x of [77, 80, 83]) line(ctx, "#f6efd9", 1.4, x, 51, x, 60);
  line(ctx, "#f6efd9", 1.2, 76.5, 51, 83.5, 51);
  // batter, cartoon-round, yellow shirt (no team colours)
  rounded(ctx, "#f4f4ee", 93, 80, 6, 18, 2); rounded(ctx, "#f4f4ee", 101, 80, 6, 18, 2);
  rounded(ctx, "#f2b632", 91, 61, 18, 22, 6);
  line(ctx, "#b9794a", 3, 106, 66, 112, 60);
  line(ctx, "#c9a26b", 5, 111, 61, 124, 40);
  line(ctx, "#5b3a1e", 3, 110, 63, 113, 58);
  circle(ctx, "#b9794a", 100, 54, 7);
  ctx.fillStyle = "#23305a"; ctx.beginPath(); ctx.arc(100, 53, 7.4, Math.PI, 0); ctx.fill();
  rect(ctx, "#23305a", 99, 52, 11, 2.2);
  // ball with a little speed trail
  line(ctx, "rgba(255,255,255,.6)", 1.2, 44, 70, 56, 67);
  line(ctx, "rgba(255,255,255,.4)", 1.2, 46, 74, 56, 70);
  circle(ctx, "#d63a2f", 60, 67, 3);
}

function natok(ctx: Ctx) {
  rect(ctx, "#e9c69c", 0, 0, PIC_W, PIC_H);
  rect(ctx, "#a86d3e", 0, 80, PIC_W, 24);
  rect(ctx, "#8e5a31", 0, 80, PIC_W, 2);
  rect(ctx, "#7a4a2a", 12, 16, 40, 44); rect(ctx, "#a8d6ea", 15, 19, 34, 38);
  line(ctx, "#7a4a2a", 2, 32, 19, 32, 57); line(ctx, "#7a4a2a", 2, 15, 38, 49, 38);
  ctx.fillStyle = "#b84a3a";
  ctx.beginPath(); ctx.moveTo(10, 14); ctx.quadraticCurveTo(22, 36, 14, 64); ctx.lineTo(8, 64); ctx.closePath(); ctx.fill();
  ctx.beginPath(); ctx.moveTo(54, 14); ctx.quadraticCurveTo(42, 36, 50, 64); ctx.lineTo(56, 64); ctx.closePath(); ctx.fill();
  line(ctx, "#5b3a1e", 1, 128, 0, 128, 12);
  ctx.fillStyle = "#f1d27a"; ctx.beginPath(); ctx.moveTo(121, 12); ctx.lineTo(135, 12); ctx.lineTo(140, 22); ctx.lineTo(116, 22); ctx.closePath(); ctx.fill();
  ellipse(ctx, "rgba(255,230,150,.35)", 128, 34, 22, 14);
  // two people talking: she in a red orna, he in a blue shirt
  ctx.fillStyle = "#4a3230";
  ctx.beginPath(); ctx.moveTo(60, 49); ctx.lineTo(74, 49); ctx.lineTo(80, 88); ctx.lineTo(54, 88); ctx.closePath(); ctx.fill();
  ctx.strokeStyle = "#c0392b"; ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(61, 50); ctx.lineTo(76, 70); ctx.stroke();
  circle(ctx, "#a8693f", 67, 41, 7); circle(ctx, "#2a1d17", 61, 38, 4.5);
  ctx.fillStyle = "#2a1d17"; ctx.beginPath(); ctx.arc(67, 40, 7.3, Math.PI * 1.05, Math.PI * 1.95); ctx.fill();
  rounded(ctx, "#2f4f7a", 98, 47, 18, 27, 5);
  rect(ctx, "#1f2533", 99, 72, 7, 16); rect(ctx, "#1f2533", 108, 72, 7, 16);
  circle(ctx, "#b07045", 107, 39, 7);
  ctx.fillStyle = "#1f1714"; ctx.beginPath(); ctx.arc(107, 38, 7.3, Math.PI, 0); ctx.fill();
  ellipse(ctx, "#6e4322", 87, 72, 9, 2.5); rect(ctx, "#6e4322", 86, 72, 2, 14);
  rounded(ctx, "#f6f2e7", 84, 66, 6, 5, 1.5);
}

function gaan(ctx: Ctx) {
  ctx.fillStyle = vertical(ctx, 0, 80, "#2c3e75", "#1c2750"); ctx.fillRect(0, 0, PIC_W, 80);
  ctx.strokeStyle = "rgba(255,255,255,.35)"; ctx.lineWidth = 0.8;
  ctx.beginPath(); ctx.moveTo(0, 10); ctx.quadraticCurveTo(80, 22, PIC_W, 10); ctx.stroke();
  const paper = ["#f2c14e", "#e45b4f", "#f6f2e7", "#6cc3a0"];
  for (let i = 0; i < 9; i++) circle(ctx, paper[i % 4], 8 + i * 18, 12 + Math.sin(i / 8 * Math.PI) * 4.5, 5);
  rect(ctx, "#8a5a2b", 0, 80, PIC_W, 24); rect(ctx, "#6e4520", 0, 80, PIC_W, 2);
  rounded(ctx, "#b3473a", 28, 74, 104, 12, 2); rect(ctx, "#e9b949", 30, 76, 100, 1.5); rect(ctx, "#e9b949", 30, 82.5, 100, 1.5);
  // singer at a harmonium, tabla beside
  ellipse(ctx, "#ece6d6", 58, 74, 15, 5);
  rounded(ctx, "#f3efe2", 49, 48, 18, 24, 6);
  circle(ctx, "#a8693f", 58, 41, 7);
  ctx.fillStyle = "#1f1714"; ctx.beginPath(); ctx.arc(58, 40, 7.4, Math.PI * 1.02, Math.PI * 1.98); ctx.fill();
  rect(ctx, "#6b3a1a", 66, 58, 32, 15); rect(ctx, "#f6f2e7", 68, 59, 28, 4);
  for (let x = 70; x < 96; x += 3) line(ctx, "#2a1d17", 0.6, x, 59, x, 61.5);
  line(ctx, "#a8693f", 2.5, 63, 56, 72, 60);
  ellipse(ctx, "#7a4a2a", 118, 68, 7, 9); ellipse(ctx, "#e6d8b8", 118, 60, 6, 2.2); circle(ctx, "#2a1d17", 118, 60, 1.4);
  ellipse(ctx, "#8d8f92", 134, 69, 9, 8); ellipse(ctx, "#e6d8b8", 134, 62, 7.5, 2.4); circle(ctx, "#2a1d17", 134, 62, 1.8);
  for (const [x, y] of [[84, 34], [100, 26]]) { circle(ctx, "#f2c14e", x, y, 2.4); line(ctx, "#f2c14e", 1.2, x + 2, y, x + 2, y - 10); line(ctx, "#f2c14e", 1.2, x + 2, y - 10, x + 6, y - 7); }
}

function nodi(ctx: Ctx) {
  ctx.fillStyle = vertical(ctx, 0, 58, "#ef8a5d", "#fad59e"); ctx.fillRect(0, 0, PIC_W, 58);
  circle(ctx, "#ffe08a", 114, 48, 14);
  rect(ctx, "#3f6b3a", 0, 54, PIC_W, 7);
  for (const x of [18, 32, 142]) {
    line(ctx, "#2f4f2c", 1.6, x, 56, x + 2, 38);
    ctx.fillStyle = "#2f4f2c";
    for (let f = 0; f < 5; f++) { const a = Math.PI * (0.9 + f * 0.3); ellipse(ctx, "#2f4f2c", x + 2 + Math.cos(a) * 6, 38 + Math.sin(a) * 2.5, 7, 2, a); }
  }
  ctx.fillStyle = vertical(ctx, 60, PIC_H, "#4d7fa8", "#2c5a80"); ctx.fillRect(0, 60, PIC_W, 44);
  for (let i = 0; i < 6; i++) line(ctx, "rgba(255,217,138,.75)", 1.4, 106 + (i % 2) * 3, 64 + i * 5, 122 - (i % 3) * 2, 64 + i * 5);
  for (let i = 0; i < 5; i++) line(ctx, "rgba(255,255,255,.25)", 1, 10 + i * 17, 90 + (i % 2) * 6, 22 + i * 17, 90 + (i % 2) * 6);
  // a sail boat with a boatman
  ctx.fillStyle = "#4a2c17";
  ctx.beginPath(); ctx.moveTo(32, 76); ctx.quadraticCurveTo(64, 94, 98, 74); ctx.quadraticCurveTo(66, 84, 32, 76); ctx.fill();
  line(ctx, "#3a2414", 1.6, 62, 81, 62, 36);
  ctx.fillStyle = "#f2e3c0"; ctx.beginPath(); ctx.moveTo(63, 38); ctx.quadraticCurveTo(84, 54, 64, 77); ctx.closePath(); ctx.fill();
  line(ctx, "#d6c193", 0.8, 64, 50, 75, 52); line(ctx, "#d6c193", 0.8, 64, 63, 76, 64);
  circle(ctx, "#3a2414", 84, 70, 2.6); line(ctx, "#3a2414", 2.4, 84, 72, 85, 79); line(ctx, "#3a2414", 1, 86, 72, 94, 86);
  ctx.strokeStyle = "#4a3a3a"; ctx.lineWidth = 1.1;
  for (const [x, y] of [[30, 18], [42, 25], [52, 16]]) { ctx.beginPath(); ctx.moveTo(x - 4, y - 2); ctx.quadraticCurveTo(x - 1, y - 2, x, y); ctx.quadraticCurveTo(x + 1, y - 2, x + 4, y - 2); ctx.stroke(); }
}

function kartun(ctx: Ctx) {
  rect(ctx, "#bfe6f3", 0, 0, PIC_W, PIC_H);
  circle(ctx, "#ffd75e", 24, 20, 10);
  for (let i = 0; i < 8; i++) { const a = i * Math.PI / 4; line(ctx, "#ffd75e", 1.6, 24 + Math.cos(a) * 13, 20 + Math.sin(a) * 13, 24 + Math.cos(a) * 17, 20 + Math.sin(a) * 17); }
  rect(ctx, "#2b8cc4", 0, 70, PIC_W, 34);
  for (let x = 0; x < PIC_W; x += 16) ellipse(ctx, "#5fb3dd", x + 8, 70, 9, 3.2);
  // a jumping cartoon fish, grinning
  ctx.setLineDash([2, 3]); line(ctx, "rgba(255,255,255,.8)", 1.2, 52, 72, 62, 58); ctx.setLineDash([]);
  ctx.fillStyle = "#7f97a8"; ctx.beginPath(); ctx.moveTo(58, 54); ctx.lineTo(44, 44); ctx.lineTo(48, 62); ctx.closePath(); ctx.fill();
  ellipse(ctx, "#cfd9e0", 84, 46, 27, 13, -0.3);
  ctx.save(); ctx.beginPath(); ctx.ellipse(84, 46, 27, 13, -0.3, 0, Math.PI * 2); ctx.clip();
  ellipse(ctx, "#93a9b8", 80, 33, 30, 10, -0.3); ctx.restore();
  ctx.fillStyle = "#7f97a8"; ctx.beginPath(); ctx.moveTo(78, 37); ctx.lineTo(86, 26); ctx.lineTo(92, 35); ctx.closePath(); ctx.fill();
  circle(ctx, "#ffffff", 101, 38, 5); circle(ctx, "#1d2b2a", 102, 38, 2.4); circle(ctx, "#ffffff", 102.8, 37, 0.8);
  ctx.strokeStyle = "#1d2b2a"; ctx.lineWidth = 1.2; ctx.beginPath(); ctx.arc(100, 45, 4.5, 0.1 * Math.PI, 0.8 * Math.PI); ctx.stroke();
  circle(ctx, "rgba(240,128,128,.55)", 95, 45, 2.2);
  for (const [x, y, r] of [[46, 68, 2], [58, 66, 1.6], [40, 64, 1.2], [118, 56, 2], [124, 46, 1.4], [114, 64, 1.2]]) { ctx.strokeStyle = "#ffffff"; ctx.lineWidth = 0.8; ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.stroke(); }
}

function ranna(ctx: Ctx) {
  rect(ctx, "#f3e6cc", 0, 0, PIC_W, PIC_H);
  for (let x = 0; x <= PIC_W; x += 12) line(ctx, "#e2d2b2", 0.7, x, 0, x, 74);
  for (let y = 0; y <= 74; y += 12) line(ctx, "#e2d2b2", 0.7, 0, y, PIC_W, y);
  rect(ctx, "#7a5232", 0, 74, PIC_W, 30); rect(ctx, "#9a6a40", 0, 74, PIC_W, 3);
  rounded(ctx, "#2f3133", 40, 66, 58, 9, 2);
  for (const x of [52, 60, 68, 76, 84]) ellipse(ctx, x % 16 ? "#f29b38" : "#4c8fe0", x, 64, 2, 3.4);
  ellipse(ctx, "#3a3a3a", 69, 52, 22, 15); ellipse(ctx, "#5a5a5a", 69, 39, 17, 4.5); ellipse(ctx, "#2a2a2a", 69, 39, 14, 3);
  ctx.strokeStyle = "rgba(255,255,255,.85)"; ctx.lineWidth = 1.6;
  for (const x of [60, 70, 80]) { ctx.beginPath(); ctx.moveTo(x, 34); ctx.bezierCurveTo(x - 5, 26, x + 5, 22, x, 13); ctx.stroke(); }
  rounded(ctx, "#c0563b", 110, 40, 22, 34, 6); rounded(ctx, "#efe9dc", 113, 46, 16, 28, 3);
  circle(ctx, "#b07045", 121, 31, 8);
  ctx.fillStyle = "#e9b949"; ctx.beginPath(); ctx.arc(121, 30, 8.4, Math.PI, 0); ctx.fill();
  line(ctx, "#b07045", 3, 112, 50, 98, 46);
  line(ctx, "#6b4a2b", 2, 99, 46, 82, 40);
  for (const [x, color] of [[18, "#e8b923"], [30, "#c0392b"], [146, "#5a9a3a"]] as const) { ellipse(ctx, "#f6f2e7", x, 74, 6, 3); ellipse(ctx, color, x, 73, 4.6, 1.8); }
}

const DRAW: Record<PictureId, (ctx: Ctx) => void> = { cricket, natok, gaan, nodi, kartun, ranna };

/** Draws one programme into the rectangle (clips to it). */
export function drawPicture(ctx: Ctx, id: PictureId, x: number, y: number, w: number, h: number) {
  ctx.save();
  ctx.beginPath(); ctx.rect(x, y, w, h); ctx.clip();
  ctx.translate(x, y); ctx.scale(w / PIC_W, h / PIC_H);
  DRAW[id](ctx);
  ctx.restore();
}

/* ---------- the set, the roof and the antenna ---------- */

/** A 14-inch set in a wooden cabinet, with a crochet cover and a little flower vase on top. Own units: 240×150. */
export function drawTv(ctx: Ctx, x: number, y: number, s: number) {
  ctx.save(); ctx.translate(x, y); ctx.scale(s, s);
  rect(ctx, "#4a2a14", 30, 138, 10, 12); rect(ctx, "#4a2a14", 200, 138, 10, 12);
  ctx.fillStyle = vertical(ctx, 10, 142, "#a9683b", "#7a4322");
  ctx.beginPath(); ctx.roundRect(0, 10, 240, 132, 12); ctx.fill();
  for (let i = 0; i < 7; i++) line(ctx, "rgba(70,35,12,.16)", 1, 4, 30 + i * 16, 236, 26 + i * 16 + (i % 3) * 3);
  rounded(ctx, "#6b3a1d", 188, 20, 44, 112, 8);
  rounded(ctx, "#2a2d2e", 10, 20, 172, 114, 16);
  rounded(ctx, "#3b3f40", 14, 24, 164, 106, 15);
  rounded(ctx, "#56605d", TV_SCREEN.x, TV_SCREEN.y, TV_SCREEN.w, TV_SCREEN.h, TV_SCREEN.r);
  for (const [cy, r] of [[46, 11], [78, 9]]) {
    circle(ctx, "#8b8272", 210, cy + 1.5, r); circle(ctx, "#e3dccb", 210, cy, r);
    line(ctx, "#6b6457", 2, 210, cy, 210, cy - r + 3);
  }
  for (let gy = 98; gy <= 124; gy += 5) line(ctx, "#4a2814", 1.6, 197, gy, 223, gy);
  // কুশিকাটার ঢাকনা: a scalloped white cover hanging over the front edge
  ctx.fillStyle = "#f6f2e7";
  ctx.beginPath(); ctx.moveTo(36, 6); ctx.lineTo(204, 6); ctx.lineTo(204, 15);
  for (let sx = 204; sx > 36; sx -= 12) ctx.arc(sx - 6, 15, 6, 0, Math.PI);
  ctx.closePath(); ctx.fill();
  ctx.strokeStyle = "#d9d0bc"; ctx.lineWidth = 0.8; ctx.stroke();
  for (let hx = 42; hx < 200; hx += 12) circle(ctx, "#ddd3bd", hx, 12, 1.5);
  rounded(ctx, "#3f7fbf", 150, -12, 12, 18, 3);
  line(ctx, "#4c8a3a", 1.2, 156, -12, 151, -24); line(ctx, "#4c8a3a", 1.2, 156, -12, 160, -26);
  circle(ctx, "#e4574a", 151, -25, 3.2); circle(ctx, "#f2c14e", 160, -27, 3.2); circle(ctx, "#ffffff", 156, -20, 2.4);
  ctx.restore();
}

/** Neighbours' flat roofs on the skyline, some with their own antennas. */
function drawSkyline(ctx: Ctx, width: number, base: number, s: number) {
  const blocks = [[0, 30, 46], [44, 18, 38], [80, 40, 52], [130, 24, 34], [200, 34, 60], [258, 20, 40], [300, 30, 70]];
  for (const [bx, bh, bw] of blocks) {
    const x = bx * width / 360, h = bh * s, w = bw * width / 360;
    rect(ctx, "#b8ccd5", x, base - h, w, h);
    rect(ctx, "#a9bfc9", x + w * 0.15, base - h + 6 * s, w * 0.12, 4 * s);
  }
  for (const bx of [60, 150, 330]) {
    const x = bx * width / 360, top = base - 44 * s;
    line(ctx, "#93a8b2", 1 * s, x, base - 20 * s, x, top);
    line(ctx, "#93a8b2", 1 * s, x - 10 * s, top + 2 * s, x + 10 * s, top + 2 * s);
    line(ctx, "#93a8b2", 1 * s, x - 7 * s, top + 6 * s, x + 7 * s, top + 6 * s);
  }
}

function drawCloud(ctx: Ctx, x: number, y: number, s: number) {
  ellipse(ctx, "rgba(255,255,255,.85)", x, y, 22 * s, 7 * s);
  ellipse(ctx, "rgba(255,255,255,.85)", x - 8 * s, y - 4 * s, 10 * s, 7 * s);
  ellipse(ctx, "rgba(255,255,255,.85)", x + 7 * s, y - 6 * s, 12 * s, 8 * s);
}

/** The cousin on the roof holding the bamboo pole, feet at (x, y). Own height ~42 units. */
function drawRoofPerson(ctx: Ctx, x: number, y: number, s: number) {
  ctx.save(); ctx.translate(x, y); ctx.scale(s, s);
  rounded(ctx, "#3b6aa8", -7, -22, 14, 22, 2);
  for (let gy = -20; gy < 0; gy += 5) line(ctx, "#2c4f80", 0.8, -7, gy, 7, gy);
  rounded(ctx, "#e2a43b", -8, -36, 16, 17, 5);
  line(ctx, "#b9794a", 3, -6, -32, -24, -30);
  line(ctx, "#b9794a", 3, -5, -27, -24, -24);
  circle(ctx, "#b9794a", 0, -42, 6.5);
  ctx.fillStyle = "#1f1714"; ctx.beginPath(); ctx.arc(0, -43, 6.8, Math.PI * 1.05, Math.PI * 1.95); ctx.fill();
  ctx.restore();
}

function drawPole(ctx: Ctx, x: number, top: number, bottom: number, s: number) {
  line(ctx, "#b98a4a", 3.4 * s, x, bottom, x, top);
  for (let ny = bottom - 12 * s; ny > top + 4 * s; ny -= 15 * s) line(ctx, "#8f6531", 3.8 * s, x, ny, x, ny - 1.2 * s);
}

function drawGamchha(ctx: Ctx) {
  line(ctx, "#8b8272", 1.2, 16, 86, 16, 56); line(ctx, "#8b8272", 1.2, 150, 86, 150, 56);
  ctx.strokeStyle = "#6b6457"; ctx.lineWidth = 0.8; ctx.beginPath(); ctx.moveTo(16, 57); ctx.quadraticCurveTo(83, 64, 150, 57); ctx.stroke();
  rect(ctx, "#c8322b", 96, 60, 26, 22);
  for (let gx = 99; gx < 122; gx += 5) rect(ctx, "#2f8a4a", gx, 60, 1.6, 22);
  for (let gy = 63; gy < 82; gy += 5) rect(ctx, "#2f8a4a", 96, gy, 26, 1.6);
  rect(ctx, "#f2e8d0", 40, 59, 14, 18);
}

/**
 * The Yagi antenna on its pole, seen from the side with a little tilt so you can tell where it points.
 * `angle` 0 points away from you; it turns clockwise. Runs every frame: paths only, nothing allocated.
 */
export function drawAntenna(ctx: Ctx, cx: number, cy: number, s: number, angle: number) {
  const rad = angle * Math.PI / 180, sin = Math.sin(rad), cos = Math.cos(rad);
  const bx = sin * 56 * s, by = -cos * 56 * s * 0.32, ex = cos * s, ey = sin * s * 0.32;
  ctx.lineCap = "round";
  ctx.strokeStyle = "#5f6a70"; ctx.lineWidth = 2.2 * s;
  ctx.beginPath(); ctx.moveTo(cx - bx, cy - by); ctx.lineTo(cx + bx, cy + by); ctx.stroke();
  ctx.strokeStyle = "#8d989e"; ctx.lineWidth = 1.6 * s;
  ctx.beginPath();
  for (let i = 0; i < 6; i++) {
    const t = -0.9 + i * 0.33, half = 25 - i * 2.6;
    const px = cx + bx * t, py = cy + by * t;
    ctx.moveTo(px - ex * half, py - ey * half); ctx.lineTo(px + ex * half, py + ey * half);
  }
  ctx.stroke();
  ctx.fillStyle = "#2b2b2b";
  ctx.fillRect(cx - bx * 0.57 - 2.5 * s, cy - by * 0.57 - 2 * s, 5 * s, 4 * s);
  ctx.fillStyle = "#5f6a70";
  ctx.beginPath(); ctx.arc(cx, cy, 2.6 * s, 0, Math.PI * 2); ctx.fill();
}

/** Everything that never moves: sky, roofs, the cousin, the pole, the room and the set. Scene units 360×290. */
export function drawSceneBackground(ctx: Ctx) {
  ctx.fillStyle = vertical(ctx, 0, 86, "#a9d8ee", "#e4f3f1"); ctx.fillRect(0, 0, SCENE_W, 86);
  drawCloud(ctx, 196, 18, 1); drawCloud(ctx, 330, 30, 0.8);
  drawSkyline(ctx, SCENE_W, 80, 1);
  drawGamchha(ctx);
  drawRoofPerson(ctx, 296, 86, 1);
  drawPole(ctx, POLE_X, ANTENNA_Y, 86, 1);
  line(ctx, "#2b2b2b", 1.3, POLE_X + 3, ANTENNA_Y + 6, POLE_X + 3, 76);
  rect(ctx, "#cfc6b5", 0, 73, SCENE_W, 13); rect(ctx, "#e1d9c9", 0, 73, SCENE_W, 2.5);
  for (let x = 30; x < SCENE_W; x += 60) rect(ctx, "rgba(120,110,95,.18)", x, 76, 1.2, 10);
  rect(ctx, "#a99f8f", 0, 86, SCENE_W, 9); rect(ctx, "#8f8676", 0, 94, SCENE_W, 1.5);
  rect(ctx, "#d5e8d4", 0, 95.5, SCENE_W, SCENE_H - 95.5);
  rect(ctx, "#c3dcc3", 0, 236, SCENE_W, 54);
  circle(ctx, "#f6f2e7", 24, 124, 10); ctx.strokeStyle = "#7a4a2a"; ctx.lineWidth = 1.6; ctx.beginPath(); ctx.arc(24, 124, 10, 0, Math.PI * 2); ctx.stroke();
  line(ctx, "#2b2b2b", 1.2, 24, 124, 24, 117); line(ctx, "#2b2b2b", 1.2, 24, 124, 29, 126);
  rounded(ctx, "#f6f2e7", 326, 140, 18, 24, 2); rect(ctx, "#2b2b2b", 330, 146, 4, 6); rect(ctx, "#2b2b2b", 337, 146, 4, 6);
  ctx.strokeStyle = "#2b2b2b"; ctx.lineWidth = 1.4;
  ctx.beginPath(); ctx.moveTo(350, 95); ctx.bezierCurveTo(352, 150, 326, 176, 306, 186); ctx.stroke();
  drawTv(ctx, TV_X, TV_Y, TV_S);
  rect(ctx, "#7a4a26", 22, 259, 316, 8); rect(ctx, "#5e3519", 28, 267, 304, 9);
  rect(ctx, "#5e3519", 38, 276, 8, 14); rect(ctx, "#5e3519", 314, 276, 8, 14);
  // whoever is downstairs, watching and shouting up
  ellipse(ctx, "#c25b3c", 22, 296, 30, 22);
  circle(ctx, "#8a5432", 22, 254, 13);
  ctx.fillStyle = "#1f1714"; ctx.beginPath(); ctx.arc(22, 253, 13.6, Math.PI * 0.9, Math.PI * 2.1); ctx.fill();
}

/* ---------- the snow ---------- */

/** One soft, low-contrast snow frame (greys 118–176, a faint row banding). Seeded, so every phone gets the same snow. */
function noiseFrame(seed: number, w: number, h: number) {
  const canvas = document.createElement("canvas");
  canvas.width = w; canvas.height = h;
  const ctx = canvas.getContext("2d")!;
  const image = ctx.createImageData(w, h);
  let state = seed;
  const next = () => (state = (state * 1103515245 + 12345) % 2147483648) / 2147483648;
  for (let y = 0; y < h; y++) {
    const band = (next() - 0.5) * 12;
    for (let x = 0; x < w; x++) {
      const value = 118 + next() * 58 + band, at = (y * w + x) * 4;
      image.data[at] = value - 4; image.data[at + 1] = value; image.data[at + 2] = value + 6; image.data[at + 3] = 255;
    }
  }
  ctx.putImageData(image, 0, 0);
  return canvas;
}

export type Layers = {
  /** Device pixels per scene unit. */
  scale: number;
  bg: HTMLCanvasElement;
  glass: HTMLCanvasElement;
  pictures: Record<PictureId, HTMLCanvasElement>;
  noise: HTMLCanvasElement[];
  mix: HTMLCanvasElement;
  mixCtx: CanvasRenderingContext2D;
};

const NOISE_W = 96, NOISE_H = 62;

function offscreen(w: number, h: number) {
  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, Math.round(w)); canvas.height = Math.max(1, Math.round(h));
  return canvas;
}

/** Pre-renders every static layer once per size, so a frame is a handful of drawImage calls. */
export function buildLayers(cssWidth: number, ratio: number): Layers {
  const scale = cssWidth / SCENE_W * ratio;
  const bg = offscreen(SCENE_W * scale, SCENE_H * scale);
  const bgCtx = bg.getContext("2d")!;
  bgCtx.scale(scale, scale);
  drawSceneBackground(bgCtx);
  const sw = SCREEN.w * scale, sh = SCREEN.h * scale;
  const pictures = {} as Record<PictureId, HTMLCanvasElement>;
  for (const id of PICTURES) {
    pictures[id] = offscreen(sw, sh);
    drawPicture(pictures[id].getContext("2d")!, id, 0, 0, sw, sh);
  }
  const glass = offscreen(sw, sh);
  const glassCtx = glass.getContext("2d")!;
  const vignette = glassCtx.createRadialGradient(sw / 2, sh / 2, sh * 0.3, sw / 2, sh / 2, sw * 0.62);
  vignette.addColorStop(0, "rgba(0,0,0,0)"); vignette.addColorStop(1, "rgba(0,0,0,.38)");
  glassCtx.fillStyle = vignette; glassCtx.fillRect(0, 0, sw, sh);
  const shine = glassCtx.createLinearGradient(0, 0, sw * 0.6, sh * 0.7);
  shine.addColorStop(0, "rgba(255,255,255,.16)"); shine.addColorStop(0.5, "rgba(255,255,255,0)");
  glassCtx.fillStyle = shine; glassCtx.fillRect(0, 0, sw, sh);
  glassCtx.fillStyle = "rgba(0,0,0,.07)";
  for (let y = 0; y < sh; y += 3 * ratio) glassCtx.fillRect(0, y, sw, ratio);
  const mix = offscreen(NOISE_W, NOISE_H);
  return { scale, bg, glass, pictures, noise: [11, 23, 37, 51].map(seed => noiseFrame(seed, NOISE_W, NOISE_H)), mix, mixCtx: mix.getContext("2d")! };
}

/** Seconds per snow crossfade. Each pixel drifts one way per period, far under 3 changes a second. */
export const NOISE_PERIOD = 0.9;

/** `label` is the on-screen channel text, made once per game so a frame builds no strings. */
export type FrameState = { angle: number; quality: number; picture: PictureId; time: number; frozen: boolean; label: string };

/** One frame: background, the screen (picture under soft snow, a faint ghost image when the signal is weak), glass, antenna. */
export function drawFrame(ctx: Ctx, layers: Layers, frame: FrameState) {
  const { scale } = layers;
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.drawImage(layers.bg, 0, 0);
  ctx.setTransform(scale, 0, 0, scale, 0, 0);
  const q = frame.quality, picture = layers.pictures[frame.picture];
  ctx.save();
  ctx.beginPath(); ctx.roundRect(SCREEN.x, SCREEN.y, SCREEN.w, SCREEN.h, SCREEN.r); ctx.clip();
  ctx.drawImage(picture, SCREEN.x, SCREEN.y, SCREEN.w, SCREEN.h);
  if (q < 0.98) {
    ctx.globalAlpha = 0.3 * (1 - q);
    ctx.drawImage(picture, SCREEN.x + (1 - q) * 12, SCREEN.y, SCREEN.w, SCREEN.h);
    const mix = layers.mixCtx;
    if (frame.frozen) { mix.globalAlpha = 1; mix.drawImage(layers.noise[0], 0, 0); }
    else {
      const phase = frame.time / NOISE_PERIOD, step = Math.floor(phase), blend = phase - step;
      mix.globalAlpha = 1; mix.drawImage(layers.noise[step % 4], 0, 0);
      mix.globalAlpha = blend; mix.drawImage(layers.noise[(step + 1) % 4], 0, 0);
    }
    ctx.globalAlpha = Math.pow(1 - q, 0.75);
    ctx.imageSmoothingEnabled = true;
    ctx.drawImage(layers.mix, SCREEN.x, SCREEN.y, SCREEN.w, SCREEN.h);
    ctx.globalAlpha = 1;
  }
  ctx.drawImage(layers.glass, SCREEN.x, SCREEN.y, SCREEN.w, SCREEN.h);
  ctx.font = "700 10px Bangla, sans-serif";
  ctx.textAlign = "left";
  ctx.fillStyle = "rgba(0,0,0,.55)"; ctx.fillText(frame.label, SCREEN.x + 9.6, SCREEN.y + 16.6);
  ctx.fillStyle = "#8dfca6"; ctx.fillText(frame.label, SCREEN.x + 9, SCREEN.y + 16);
  ctx.restore();
  drawAntenna(ctx, POLE_X, ANTENNA_Y, 1.2, frame.angle);
}

/* ---------- pieces the share card reuses ---------- */

export function drawRoofScene(ctx: Ctx, width: number, roof: number, s: number, poleX: number, antennaY: number, angle: number) {
  ctx.fillStyle = vertical(ctx, 0, roof, "#a9d8ee", "#e8f5f2"); ctx.fillRect(0, 0, width, roof);
  drawCloud(ctx, width * 0.62, roof * 0.12, s * 0.9); drawCloud(ctx, width * 0.2, roof * 0.07, s * 0.7);
  drawSkyline(ctx, width, roof - 6 * s, s);
  drawRoofPerson(ctx, poleX + 28 * s, roof, s);
  drawPole(ctx, poleX, antennaY, roof, s);
  line(ctx, "#2b2b2b", 1.3 * s, poleX + 3 * s, antennaY + 6 * s, poleX + 3 * s, roof - 12 * s);
  drawAntenna(ctx, poleX, antennaY, s, angle);
  rect(ctx, "#cfc6b5", 0, roof - 13 * s, width, 13 * s); rect(ctx, "#e1d9c9", 0, roof - 13 * s, width, 2.5 * s);
  rect(ctx, "#a99f8f", 0, roof, width, 9 * s); rect(ctx, "#8f8676", 0, roof + 9 * s, width, 1.5 * s);
}

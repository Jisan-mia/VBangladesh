import { BODY_FONT, DISPLAY_FONT, cardSizes, drawFooterBand, drawPhoto, fitText, renderCard, wrapText, type CardFormat, type Photo } from "../../../shared/card-canvas";
import { bn, type Card, type OccasionId } from "./greeting";

type Ctx = CanvasRenderingContext2D;
type Theme = { bg: string; title: string; sub: string; text: string; name: string; ring: string; band: { band: string; ask: string; site: string } };

const TAU = Math.PI * 2;
/** Scenes are drawn in a 1080×640 box: at the top of a feed card, lower down on a story so it clears the app's top bar. */
const SCENE_HEIGHT = 640;
const STORY_SCENE_TOP = 190;
const ASK = "তুমিও পাঠাও কাউকে";

const themes: Record<OccasionId, Theme> = {
  bijoya: { bg: "#fff6ea", title: "#ae1420", sub: "#8b5a2b", text: "#3a2118", name: "#ae1420", ring: "#ae1420", band: { band: "#7c0d14", ask: "#ffd27a", site: "#ffffff" } },
  nobanno: { bg: "#fbf0cf", title: "#6a3d10", sub: "#8f5d1c", text: "#45301a", name: "#7a4512", ring: "#c98a1b", band: { band: "#5a3910", ask: "#ffd166", site: "#ffffff" } },
  bijoy: { bg: "#006a4e", title: "#ffffff", sub: "#ffd166", text: "#e8f4ee", name: "#ffffff", ring: "#f42a41", band: { band: "#003f2e", ask: "#ffd166", site: "#ffffff" } },
  ekushe: { bg: "#f3efe7", title: "#151515", sub: "#c0182c", text: "#2a2a2a", name: "#151515", ring: "#151515", band: { band: "#151515", ask: "#ffffff", site: "#c9c9c9" } },
  eid: { bg: "#0e3a3b", title: "#f2c66d", sub: "#e8d6a8", text: "#f8efd9", name: "#f2c66d", ring: "#f2c66d", band: { band: "#072425", ask: "#f2c66d", site: "#ffffff" } },
  noboborsho: { bg: "#fffaf2", title: "#c4231b", sub: "#7a3a12", text: "#3b2316", name: "#c4231b", ring: "#c4231b", band: { band: "#8d1811", ask: "#ffd166", site: "#ffffff" } },
  jonmodin: { bg: "#eaf6f1", title: "#c8285a", sub: "#1f6f66", text: "#24343a", name: "#c8285a", ring: "#c8285a", band: { band: "#16423d", ask: "#ffd166", site: "#ffffff" } },
  bibahobarshiki: { bg: "#6b1327", title: "#f6c85f", sub: "#f3d6a4", text: "#fbeee2", name: "#f6c85f", ring: "#f6c85f", band: { band: "#3d0914", ask: "#f6c85f", site: "#ffffff" } },
};

/** Fractional part of a sine hash: steady "random" scatter, the same on every redraw. */
export const noise = (seed: number) => { const value = Math.sin(seed * 12.9898) * 43758.5453; return value - Math.floor(value); };

export function circle(ctx: Ctx, x: number, y: number, r: number) { ctx.beginPath(); ctx.arc(x, y, r, 0, TAU); }
export function paint(ctx: Ctx, fill?: string | CanvasGradient, stroke?: string, width = 4) {
  if (fill) { ctx.fillStyle = fill; ctx.fill(); }
  if (stroke) { ctx.strokeStyle = stroke; ctx.lineWidth = width; ctx.stroke(); }
}
/** A pointed leaf, petal or feather from (x, y), pointing up when angle is 0. */
export function leaf(ctx: Ctx, x: number, y: number, length: number, width: number, angle: number) {
  ctx.save(); ctx.translate(x, y); ctx.rotate(angle);
  ctx.beginPath(); ctx.moveTo(0, 0);
  ctx.quadraticCurveTo(width, -length * 0.45, 0, -length);
  ctx.quadraticCurveTo(-width, -length * 0.45, 0, 0);
  ctx.closePath(); ctx.restore();
}
export function line(ctx: Ctx, points: number[], stroke: string, width: number) {
  ctx.beginPath(); ctx.moveTo(points[0], points[1]);
  for (let i = 2; i < points.length; i += 2) ctx.lineTo(points[i], points[i + 1]);
  ctx.strokeStyle = stroke; ctx.lineWidth = width; ctx.stroke();
}
export function glow(ctx: Ctx, x: number, y: number, r: number, color: string) {
  const gradient = ctx.createRadialGradient(x, y, 0, x, y, r);
  // fade to the same colour at zero alpha; fading to transparent black greys the edge
  gradient.addColorStop(0, color); gradient.addColorStop(1, color.replace(/[\d.]+\)$/, "0)"));
  ctx.fillStyle = gradient; circle(ctx, x, y, r); ctx.fill();
}
function flame(ctx: Ctx, x: number, y: number, s: number) {
  glow(ctx, x, y - 26 * s, 80 * s, "rgba(255,190,70,.55)");
  ctx.beginPath(); ctx.moveTo(x, y);
  ctx.bezierCurveTo(x - 17 * s, y - 12 * s, x - 8 * s, y - 34 * s, x + 3 * s, y - 56 * s);
  ctx.bezierCurveTo(x + 10 * s, y - 34 * s, x + 18 * s, y - 12 * s, x, y);
  paint(ctx, "#f59a1b");
  leaf(ctx, x, y - 4 * s, 30 * s, 7 * s, 0.05); paint(ctx, "#ffe58a");
}
/** Clay প্রদীপ with its flame at the spout. */
function prodip(ctx: Ctx, x: number, y: number, s: number) {
  flame(ctx, x + 48 * s, y - 30 * s, s);
  ctx.beginPath(); ctx.moveTo(x - 52 * s, y - 20 * s);
  ctx.quadraticCurveTo(x - 40 * s, y + 22 * s, x, y + 22 * s);
  ctx.quadraticCurveTo(x + 34 * s, y + 22 * s, x + 44 * s, y - 14 * s);
  ctx.lineTo(x + 58 * s, y - 28 * s); ctx.lineTo(x + 36 * s, y - 22 * s);
  ctx.closePath(); paint(ctx, "#c4622d", "#5a2410", 4 * s);
  ctx.beginPath(); ctx.ellipse(x - 6 * s, y - 20 * s, 46 * s, 9 * s, 0, 0, TAU); paint(ctx, "#8f3b17", "#5a2410", 3 * s);
  line(ctx, [x - 30 * s, y + 4 * s, x + 24 * s, y + 4 * s], "#e7a06b", 3 * s);
}

// ---- শুভ বিজয়া: লালপাড় শাড়ির পাড়, চালচিত্রের আর্চ, কাশফুল, ঢাক, প্রদীপ ----
function kash(ctx: Ctx, x: number, base: number, height: number, lean: number) {
  const tipX = x + lean, tipY = base - height, cx = x + lean * 0.15, cy = base - height * 0.6;
  const at = (t: number) => [(1 - t) ** 2 * x + 2 * (1 - t) * t * cx + t * t * tipX, (1 - t) ** 2 * base + 2 * (1 - t) * t * cy + t * t * tipY];
  ctx.lineCap = "round";
  ctx.beginPath(); ctx.moveTo(x, base); ctx.quadraticCurveTo(cx, cy, tipX, tipY);
  ctx.strokeStyle = "#f1dcae"; ctx.lineWidth = 4; ctx.stroke();
  // A soft mass first, then feathery strokes leaning toward the tip.
  ctx.beginPath();
  for (let t = 0.5; t <= 1.001; t += 0.05) { const [px, py] = at(t); if (t === 0.5) ctx.moveTo(px, py); else ctx.lineTo(px, py); }
  ctx.strokeStyle = "rgba(255,255,255,.2)"; ctx.lineWidth = 30; ctx.stroke();
  ctx.strokeStyle = "rgba(255,255,255,.9)"; ctx.lineWidth = 2.5;
  for (let i = 0; i <= 26; i++) {
    const t = 0.5 + (i / 26) * 0.5, u = (t - 0.5) / 0.5;
    const [px, py] = at(t), [qx, qy] = at(Math.min(1, t + 0.01));
    const angle = Math.atan2(qy - py, qx - px), length = 10 + 40 * Math.sin(Math.PI * Math.min(1, u * 1.1)) * (1 - 0.25 * u);
    for (const side of [-1, 1]) {
      const a = angle + side * (0.55 + noise(i * 7 + side) * 0.2);
      ctx.beginPath(); ctx.moveTo(px, py); ctx.lineTo(px + Math.cos(a) * length, py + Math.sin(a) * length); ctx.stroke();
    }
  }
}
function dhak(ctx: Ctx, x: number, y: number) {
  const ink = "#3a1d10";
  ctx.save(); ctx.translate(x, y); ctx.rotate(-0.1);
  // the white plume (ঢাকের পালক) fans up from the right end
  for (let i = 0; i < 11; i++) {
    const angle = -0.95 + i * 0.15, length = 210 - Math.abs(i - 5) * 13;
    leaf(ctx, 112, -104, length, 24, angle); paint(ctx, "#ffffff", "#d9c7a8", 2);
    ctx.save(); ctx.translate(112, -104); ctx.rotate(angle); line(ctx, [0, 0, 0, -length * 0.92], "#e4d6bd", 2); ctx.restore();
  }
  const top = (px: number) => -98 - 21 * (1 - (px / 170) ** 2);
  ctx.beginPath(); ctx.moveTo(-170, -98); ctx.quadraticCurveTo(0, -140, 170, -98); ctx.lineTo(170, 98); ctx.quadraticCurveTo(0, 140, -170, 98); ctx.closePath();
  paint(ctx, "#e5a845", ink, 5);
  for (const bx of [-128, 128]) { ctx.beginPath(); ctx.rect(bx - 10, top(bx), 20, -2 * top(bx)); paint(ctx, "#b5121b"); }
  ctx.beginPath();
  for (let i = 0; i <= 10; i++) { const px = -140 + i * 28, edge = top(px) + 10; if (i === 0) ctx.moveTo(px, i % 2 ? -edge : edge); else ctx.lineTo(px, i % 2 ? -edge : edge); }
  ctx.strokeStyle = "#5a2d12"; ctx.lineWidth = 4; ctx.lineJoin = "round"; ctx.stroke();
  for (const ex of [-170, 170]) {
    ctx.beginPath(); ctx.ellipse(ex, 0, 32, 100, 0, 0, TAU); paint(ctx, "#f7e9cc", ink, 5);
    ctx.beginPath(); ctx.ellipse(ex, 0, 21, 82, 0, 0, TAU); paint(ctx, undefined, "#c9a77a", 3);
  }
  ctx.lineCap = "round";
  ctx.restore();
}
function bijoya(ctx: Ctx, width: number, frameBottom: number, sceneTop: number) {
  const red = "#b5121b", gold = "#f2c14e";
  const cx = 540, base = 612, r = 330, legs = 190;
  const arch = (inset: number) => { ctx.beginPath(); ctx.moveTo(cx - r + inset, base); ctx.lineTo(cx - r + inset, base - legs); ctx.arc(cx, base - legs, r - inset, Math.PI, 0); ctx.lineTo(cx + r - inset, base); };
  arch(0); ctx.closePath(); paint(ctx, red);
  arch(16); paint(ctx, undefined, gold, 3);
  ctx.fillStyle = "rgba(255,255,255,.85)";
  for (let a = Math.PI + 0.06; a < TAU - 0.03; a += 0.115) { circle(ctx, cx + Math.cos(a) * (r - 32), base - legs + Math.sin(a) * (r - 32), 4); ctx.fill(); }
  ctx.save(); arch(0); ctx.closePath(); ctx.clip();
  for (const [kx, h, lean] of [[300, 330, -34], [338, 380, -12], [262, 262, -52], [366, 290, -4], [780, 330, 34], [742, 380, 12], [818, 262, 52], [714, 290, 4]]) kash(ctx, kx, base, h, lean);
  ctx.restore();
  dhak(ctx, 540, 470);
  line(ctx, [150, base + 2, 930, base + 2], gold, 3);
  prodip(ctx, 268, 600, 1);
  prodip(ctx, 790, 600, 1);
  // লালপাড়: a red border with white dots, like a sari's edge
  const edge = 26;
  ctx.fillStyle = red;
  ctx.fillRect(0, sceneTop, width, edge); ctx.fillRect(0, sceneTop, edge, frameBottom - sceneTop); ctx.fillRect(width - edge, sceneTop, edge, frameBottom - sceneTop);
  ctx.fillStyle = "#ffffff";
  for (let px = 20; px < width; px += 30) { circle(ctx, px, sceneTop + edge / 2, 3.5); ctx.fill(); }
  for (let py = sceneTop + 44; py < frameBottom; py += 30) { circle(ctx, edge / 2, py, 3.5); ctx.fill(); circle(ctx, width - edge / 2, py, 3.5); ctx.fill(); }
  ctx.beginPath(); ctx.moveTo(edge + 9, frameBottom); ctx.lineTo(edge + 9, sceneTop + edge + 9); ctx.lineTo(width - edge - 9, sceneTop + edge + 9); ctx.lineTo(width - edge - 9, frameBottom);
  paint(ctx, undefined, gold, 3);
}

// ---- বিজয় দিবস: সবুজের ওপর লাল সূর্য উঠছে, নদী, শাপলা ----
export function shapla(ctx: Ctx, x: number, y: number, s: number) {
  for (const a of [-1.15, 1.15]) { leaf(ctx, x, y + 4 * s, 42 * s, 13 * s, a); paint(ctx, "#2f9a63", "#0d5a3c", 2.5); }
  for (const a of [-1.0, -0.5, 0, 0.5, 1.0]) { leaf(ctx, x, y, 92 * s, 25 * s, a); paint(ctx, "#f1ebe2", "#b4868f", 2.5); }
  circle(ctx, x, y - 34 * s, 20 * s); paint(ctx, "#f6c443", "#c99412", 2);
  for (const a of [-0.72, -0.24, 0.24, 0.72]) { leaf(ctx, x, y + 6 * s, 80 * s, 24 * s, a); paint(ctx, "#ffffff", "#b4868f", 2.5); }
}
function pad(ctx: Ctx, x: number, y: number, rx: number) {
  ctx.beginPath(); ctx.ellipse(x, y, rx, rx * 0.26, 0, 0.3, TAU - 0.3); ctx.lineTo(x, y); ctx.closePath();
  paint(ctx, "#23895a", "#0b4f35", 3);
}
function palm(ctx: Ctx, x: number, base: number, s: number, color: string) {
  ctx.lineCap = "round";
  ctx.beginPath(); ctx.moveTo(x, base); ctx.quadraticCurveTo(x + 4 * s, base - 60 * s, x + 14 * s, base - 120 * s);
  ctx.strokeStyle = color; ctx.lineWidth = 7 * s; ctx.stroke();
  for (const a of [-1.9, -1.2, -0.5, 0.5, 1.2, 1.9]) { leaf(ctx, x + 14 * s, base - 120 * s, 62 * s, 10 * s, a); paint(ctx, color); }
}
function bijoy(ctx: Ctx, width: number, frameBottom: number, sceneTop: number) {
  const horizon = 498, sunY = horizon - 40;
  ctx.save(); ctx.beginPath(); ctx.rect(0, sceneTop, width, horizon - sceneTop); ctx.clip();
  ctx.fillStyle = "rgba(255,255,255,.07)";
  for (let i = 0; i < 18; i += 1) {
    const a = Math.PI + (i / 18) * Math.PI;
    ctx.beginPath(); ctx.moveTo(540, sunY); ctx.lineTo(540 + Math.cos(a) * 1000, sunY + Math.sin(a) * 1000); ctx.lineTo(540 + Math.cos(a + 0.09) * 1000, sunY + Math.sin(a + 0.09) * 1000); ctx.closePath(); ctx.fill();
  }
  glow(ctx, 540, sunY, 320, "rgba(255,120,110,.32)");
  circle(ctx, 540, sunY, 170); paint(ctx, "#f42a41");
  ctx.restore();
  ctx.lineCap = "round"; ctx.lineJoin = "round";
  for (const [bx, by, bs] of [[250, 210, 1], [310, 175, 0.75], [810, 240, 0.85]]) {
    ctx.beginPath(); ctx.moveTo(bx - 22 * bs, by - 6 * bs); ctx.quadraticCurveTo(bx - 10 * bs, by - 12 * bs, bx, by); ctx.quadraticCurveTo(bx + 10 * bs, by - 12 * bs, bx + 22 * bs, by - 6 * bs);
    ctx.strokeStyle = "#d8efe3"; ctx.lineWidth = 4; ctx.stroke();
  }
  for (const [tx, ts] of [[70, 0.9], [140, 1.15], [205, 0.8], [900, 0.85], [975, 1.2], [1040, 0.9]]) palm(ctx, tx, horizon + 2, ts, "#004d36");
  ctx.fillStyle = "#004d36";
  ctx.beginPath(); ctx.ellipse(130, horizon + 4, 190, 20, 0, Math.PI, TAU); ctx.fill();
  ctx.beginPath(); ctx.ellipse(960, horizon + 4, 200, 22, 0, Math.PI, TAU); ctx.fill();
  ctx.fillStyle = "#00563f"; ctx.fillRect(0, horizon, width, SCENE_HEIGHT - horizon + 20);
  for (let j = 0; j < 5; j++) {
    const w = 320 - j * 58; ctx.fillStyle = `rgba(244,42,65,${0.85 - j * 0.12})`;
    ctx.beginPath(); ctx.roundRect(540 - w / 2 + (j % 2) * 14, horizon + 12 + j * 20, w, 8, 4); ctx.fill();
  }
  ctx.strokeStyle = "rgba(255,255,255,.18)"; ctx.lineWidth = 3;
  for (const [wx, wy, ww] of [[120, 540, 120], [880, 548, 140], [330, 580, 90], [760, 590, 100]]) { ctx.beginPath(); ctx.moveTo(wx, wy); ctx.quadraticCurveTo(wx + ww / 2, wy - 8, wx + ww, wy); ctx.stroke(); }
  pad(ctx, 330, 628, 74); pad(ctx, 120, 636, 64); pad(ctx, 760, 632, 70); pad(ctx, 975, 622, 58);
  shapla(ctx, 220, 612, 1); shapla(ctx, 870, 606, 1.05); shapla(ctx, 660, 634, 0.7);
  // a thin red frame keeps the লাল-সবুজ together
  ctx.beginPath(); ctx.moveTo(28, frameBottom); ctx.lineTo(28, sceneTop + 28); ctx.lineTo(width - 28, sceneTop + 28); ctx.lineTo(width - 28, frameBottom);
  paint(ctx, undefined, "#f42a41", 5);
}

// ---- ঈদ মোবারক: বাঁকা চাঁদ, ফানুস, মসজিদের গম্বুজ, মেহেদির নকশা ----
function lantern(ctx: Ctx, x: number, y: number, s: number, stringTop: number) {
  const gold = "#f2c66d";
  line(ctx, [x, stringTop, x, y - 40 * s], gold, 2);
  glow(ctx, x, y + 70 * s, 150 * s, "rgba(255,190,90,.32)");
  circle(ctx, x, y - 34 * s, 7 * s); paint(ctx, undefined, gold, 3);
  ctx.beginPath(); ctx.moveTo(x - 34 * s, y); ctx.quadraticCurveTo(x, y - 52 * s, x + 34 * s, y); ctx.closePath(); paint(ctx, gold);
  const body = () => { ctx.beginPath(); ctx.moveTo(x - 34 * s, y); ctx.lineTo(x - 50 * s, y + 42 * s); ctx.lineTo(x - 50 * s, y + 108 * s); ctx.lineTo(x - 34 * s, y + 150 * s); ctx.lineTo(x + 34 * s, y + 150 * s); ctx.lineTo(x + 50 * s, y + 108 * s); ctx.lineTo(x + 50 * s, y + 42 * s); ctx.lineTo(x + 34 * s, y); ctx.closePath(); };
  const light = ctx.createRadialGradient(x, y + 75 * s, 4, x, y + 75 * s, 70 * s);
  light.addColorStop(0, "#fff3c4"); light.addColorStop(1, "#f0a53c");
  body(); paint(ctx, light, gold, 4);
  for (const lx of [-17, 17]) line(ctx, [x + lx * s, y + 2 * s, x + lx * 1.2 * s, y + 42 * s, x + lx * 1.2 * s, y + 108 * s, x + lx * s, y + 148 * s], "#c98a2c", 3);
  line(ctx, [x - 50 * s, y + 42 * s, x + 50 * s, y + 42 * s], "#c98a2c", 3);
  line(ctx, [x - 50 * s, y + 108 * s, x + 50 * s, y + 108 * s], "#c98a2c", 3);
  ctx.beginPath(); ctx.moveTo(x - 9 * s, y + 96 * s); ctx.lineTo(x - 9 * s, y + 66 * s); ctx.quadraticCurveTo(x, y + 50 * s, x + 9 * s, y + 66 * s); ctx.lineTo(x + 9 * s, y + 96 * s); ctx.closePath(); paint(ctx, "#c97a26");
  ctx.beginPath(); ctx.moveTo(x - 34 * s, y + 150 * s); ctx.lineTo(x - 18 * s, y + 172 * s); ctx.lineTo(x + 18 * s, y + 172 * s); ctx.lineTo(x + 34 * s, y + 150 * s); ctx.closePath(); paint(ctx, gold);
  leaf(ctx, x, y + 172 * s, 26 * s, 7 * s, Math.PI); paint(ctx, gold);
}
function paisley(ctx: Ctx, x: number, y: number, s: number, angle: number, color: string) {
  ctx.save(); ctx.translate(x, y); ctx.rotate(angle); ctx.scale(s, s);
  const shape = (k: number) => { ctx.beginPath(); ctx.moveTo(0, 40 * k); ctx.bezierCurveTo(-42 * k, 40 * k, -44 * k, -16 * k, -8 * k, -30 * k); ctx.bezierCurveTo(14 * k, -38 * k, 24 * k, -56 * k, 14 * k, -66 * k); ctx.bezierCurveTo(46 * k, -48 * k, 44 * k, 40 * k, 0, 40 * k); };
  ctx.lineWidth = 3 / s; ctx.strokeStyle = color;
  shape(1); ctx.stroke(); shape(0.62); ctx.stroke();
  ctx.fillStyle = color; circle(ctx, 0, 6, 6); ctx.fill();
  for (let i = 0; i < 9; i++) { const a = 1.9 + i * 0.36; circle(ctx, Math.cos(a) * 54, 4 + Math.sin(a) * 50, 3.2); ctx.fill(); }
  ctx.restore();
}
function mehediCorner(ctx: Ctx, x: number, y: number, flip: number, color: string) {
  ctx.save(); ctx.translate(x, y); ctx.scale(flip, 1);
  ctx.beginPath(); ctx.moveTo(0, 0); ctx.bezierCurveTo(40, -30, 90, -20, 150, -60); ctx.strokeStyle = color; ctx.lineWidth = 3; ctx.stroke();
  for (const [lx, ly, a] of [[50, -20, -0.6], [92, -26, 0.9], [128, -44, -0.4]]) { leaf(ctx, lx, ly, 30, 9, a); paint(ctx, undefined, color, 2.5); }
  paisley(ctx, 34, -70, 0.85, -0.5, color);
  ctx.fillStyle = color;
  for (let i = 0; i < 5; i++) { circle(ctx, 160 + i * 18, -64 - i * 6, 3); ctx.fill(); }
  ctx.restore();
}
function eid(ctx: Ctx, width: number, frameBottom: number, sceneTop: number) {
  const gold = "#f2c66d", dark = "#072627";
  const sky = ctx.createLinearGradient(0, sceneTop, 0, SCENE_HEIGHT);
  sky.addColorStop(0, "#0e3a3b"); sky.addColorStop(1, "#18595a");
  ctx.fillStyle = sky; ctx.fillRect(0, sceneTop, width, SCENE_HEIGHT - sceneTop);
  for (let i = 0; i < 46; i++) {
    const sx = noise(i) * width, sy = sceneTop + 40 + noise(i + 99) * (440 - sceneTop), big = noise(i + 7) > 0.82;
    ctx.fillStyle = `rgba(255,240,200,${0.35 + noise(i + 3) * 0.5})`;
    if (big) { leaf(ctx, sx, sy + 9, 18, 4, 0); ctx.fill(); leaf(ctx, sx - 9, sy, 18, 4, Math.PI / 2); ctx.fill(); }
    else { circle(ctx, sx, sy, 2.2); ctx.fill(); }
  }
  const mx = 800, my = 190, mr = 86;
  glow(ctx, mx, my, 230, "rgba(242,198,109,.28)");
  ctx.save(); circle(ctx, mx, my, mr); ctx.clip();
  ctx.beginPath(); ctx.arc(mx, my, mr, 0, TAU); ctx.moveTo(mx + 36 + mr * 0.84, my - 24); ctx.arc(mx + 36, my - 24, mr * 0.84, 0, TAU);
  ctx.fillStyle = gold; ctx.fill("evenodd"); ctx.restore();
  lantern(ctx, 170, 210, 0.9, sceneTop);
  lantern(ctx, 330, 120, 0.7, sceneTop);
  lantern(ctx, 960, 330, 0.62, sceneTop);
  // mosque silhouette along the horizon, its windows lit
  ctx.fillStyle = dark;
  const dome = (dx: number, base: number, w: number, h: number) => {
    ctx.beginPath(); ctx.moveTo(dx - w / 2, base);
    ctx.bezierCurveTo(dx - w / 2 - w * 0.1, base - h * 0.6, dx - w * 0.12, base - h * 0.62, dx, base - h);
    ctx.bezierCurveTo(dx + w * 0.12, base - h * 0.62, dx + w / 2 + w * 0.1, base - h * 0.6, dx + w / 2, base); ctx.closePath(); ctx.fill();
    ctx.fillRect(dx - 2.5, base - h - 26, 5, 28); circle(ctx, dx, base - h - 30, 6); ctx.fill();
  };
  ctx.fillRect(390, 520, 300, 130); dome(540, 524, 220, 170);
  ctx.fillRect(300, 560, 100, 90); dome(350, 562, 92, 80);
  ctx.fillRect(680, 560, 100, 90); dome(730, 562, 92, 80);
  for (const tx of [262, 818]) {
    ctx.fillRect(tx - 14, 380, 28, 270); ctx.fillRect(tx - 22, 430, 44, 12); ctx.fillRect(tx - 20, 380, 40, 10);
    ctx.beginPath(); ctx.moveTo(tx - 16, 382); ctx.lineTo(tx, 330); ctx.lineTo(tx + 16, 382); ctx.closePath(); ctx.fill();
  }
  ctx.fillRect(0, 610, width, 40);
  ctx.fillStyle = "#f4c26b";
  const lit = (wx: number, wy: number, w: number, h: number) => { ctx.beginPath(); ctx.moveTo(wx - w / 2, wy + h); ctx.lineTo(wx - w / 2, wy + w / 2); ctx.arc(wx, wy + w / 2, w / 2, Math.PI, 0); ctx.lineTo(wx + w / 2, wy + h); ctx.closePath(); ctx.fill(); };
  for (const wx of [450, 500, 580, 630]) lit(wx, 560, 22, 40);
  lit(540, 548, 34, 62); lit(350, 590, 18, 30); lit(730, 590, 18, 30);
  // মেহেদি: a fine gold frame with flourishes in the lower corners
  ctx.beginPath(); ctx.moveTo(30, frameBottom); ctx.lineTo(30, sceneTop + 30); ctx.lineTo(width - 30, sceneTop + 30); ctx.lineTo(width - 30, frameBottom);
  paint(ctx, undefined, "rgba(242,198,109,.7)", 2.5);
  mehediCorner(ctx, 52, frameBottom - 40, 1, "rgba(242,198,109,.8)");
  mehediCorner(ctx, width - 52, frameBottom - 40, -1, "rgba(242,198,109,.8)");
}

// ---- শুভ নববর্ষ: আমপাতার তোরণ, আলপনা, জোড়া ইলিশ ----
function toran(ctx: Ctx, width: number, y: number) {
  ctx.beginPath(); ctx.moveTo(-20, y); ctx.quadraticCurveTo(width / 2, y + 60, width + 20, y);
  ctx.strokeStyle = "#7a4a22"; ctx.lineWidth = 4; ctx.stroke();
  for (let i = 0; i <= 18; i++) {
    const t = i / 18, px = -20 + t * (width + 40), py = y + 60 * 2 * t * (1 - t);
    if (i % 3 === 1) { circle(ctx, px, py + 12, 14); paint(ctx, "#f39c12", "#c76a05", 3); circle(ctx, px, py + 12, 5); paint(ctx, "#c76a05"); continue; }
    const angle = Math.PI + (noise(i) - 0.5) * 0.3;
    leaf(ctx, px, py, 96, 25, angle); paint(ctx, i % 2 ? "#2f7d4a" : "#3c9a5c", "#1d5530", 2.5);
    ctx.save(); ctx.translate(px, py); ctx.rotate(angle); line(ctx, [0, 0, 0, -86], "#a9d5b5", 2); ctx.restore();
  }
}
function ilish(ctx: Ctx, x: number, y: number, s: number, flip: number) {
  const red = "#c4231b";
  ctx.save(); ctx.translate(x, y); ctx.scale(s * flip, s);
  ctx.beginPath(); ctx.moveTo(90, 0);
  ctx.bezierCurveTo(60, -38, -30, -44, -70, -10); ctx.lineTo(-104, -34); ctx.quadraticCurveTo(-94, 0, -104, 34); ctx.lineTo(-70, 10);
  ctx.bezierCurveTo(-30, 44, 60, 38, 90, 0); ctx.closePath();
  paint(ctx, "#ffffff", red, 5);
  ctx.beginPath(); ctx.moveTo(-70, -10); ctx.lineTo(-104, -34); ctx.quadraticCurveTo(-94, 0, -104, 34); ctx.lineTo(-70, 10); ctx.closePath(); paint(ctx, red);
  ctx.beginPath(); ctx.moveTo(46, -26); ctx.quadraticCurveTo(36, 0, 46, 26); ctx.strokeStyle = red; ctx.lineWidth = 4; ctx.stroke();
  circle(ctx, 66, -6, 6); paint(ctx, red);
  ctx.lineWidth = 2.5;
  for (let sx = -50; sx <= 26; sx += 16) for (const sy of [-12, 6]) { ctx.beginPath(); ctx.arc(sx, sy, 8, -1.2, 1.2); ctx.stroke(); }
  ctx.restore();
}
function noboborsho(ctx: Ctx, width: number, frameBottom: number, sceneTop: number, year: number) {
  const red = "#c4231b", deep = "#8d1811";
  const cx = 540, cy = 390;
  ctx.fillStyle = red;
  for (let i = 0; i < 24; i++) { const a = (i / 24) * TAU; circle(ctx, cx + Math.cos(a) * 252, cy + Math.sin(a) * 252, 6); ctx.fill(); }
  for (let i = 0; i < 8; i++) { const a = (i / 8) * TAU + TAU / 16; leaf(ctx, cx + Math.cos(a) * 262, cy + Math.sin(a) * 262, 34, 11, a + Math.PI / 2); paint(ctx, red); }
  circle(ctx, cx, cy, 232); paint(ctx, red);
  ctx.strokeStyle = "#ffffff"; ctx.lineCap = "round"; ctx.lineJoin = "round";
  circle(ctx, cx, cy, 216); ctx.lineWidth = 5; ctx.stroke();
  for (let i = 0; i < 16; i++) {
    const a = (i / 16) * TAU, d = TAU / 32;
    ctx.beginPath(); ctx.moveTo(cx + Math.cos(a - d) * 152, cy + Math.sin(a - d) * 152);
    ctx.quadraticCurveTo(cx + Math.cos(a - d * 0.9) * 214, cy + Math.sin(a - d * 0.9) * 214, cx + Math.cos(a) * 206, cy + Math.sin(a) * 206);
    ctx.quadraticCurveTo(cx + Math.cos(a + d * 0.9) * 214, cy + Math.sin(a + d * 0.9) * 214, cx + Math.cos(a + d) * 152, cy + Math.sin(a + d) * 152);
    ctx.lineWidth = 5; ctx.stroke();
    ctx.fillStyle = "#ffffff"; circle(ctx, cx + Math.cos(a) * 178, cy + Math.sin(a) * 178, 5); ctx.fill();
  }
  circle(ctx, cx, cy, 150); ctx.lineWidth = 4; ctx.stroke();
  for (let i = 0; i < 36; i++) { const a = (i / 36) * TAU; circle(ctx, cx + Math.cos(a) * 134, cy + Math.sin(a) * 134, 4); ctx.fillStyle = "#ffffff"; ctx.fill(); }
  circle(ctx, cx, cy, 116); paint(ctx, "#fffaf2");
  circle(ctx, cx, cy, 104); paint(ctx, undefined, red, 3);
  fitText(ctx, [{ text: bn(year - 593), color: deep, weight: 800, display: true }], cx, cy + 34, 96, 176, "center");
  ilish(ctx, 165, 600, 0.9, 1);
  ilish(ctx, 915, 600, 0.9, -1);
  toran(ctx, width, sceneTop + 26);
  ctx.beginPath(); ctx.moveTo(26, frameBottom); ctx.lineTo(26, sceneTop + 20); ctx.moveTo(width - 26, sceneTop + 20); ctx.lineTo(width - 26, frameBottom);
  paint(ctx, undefined, red, 6);
}

// ---- শুভ নবান্ন: সোনালি মাঠ, নুয়ে পড়া ধানের শীষ, কুলা, পিঠা ----
function paddy(ctx: Ctx, x: number, base: number, height: number, bend: number) {
  const tipX = x + bend, tipY = base - height + Math.abs(bend) * 0.5, cx = x + bend * 0.1, cy = base - height;
  ctx.lineCap = "round";
  leaf(ctx, x, base, height * 0.75, 9, bend * 0.004 - 0.1); paint(ctx, "#a7a33a");
  ctx.beginPath(); ctx.moveTo(x, base); ctx.quadraticCurveTo(cx, cy, tipX, tipY);
  ctx.strokeStyle = "#b08a2a"; ctx.lineWidth = 4; ctx.stroke();
  for (let i = 0; i < 12; i++) {
    const t = 0.6 + (i / 12) * 0.4;
    const px = (1 - t) ** 2 * x + 2 * (1 - t) * t * cx + t * t * tipX, py = (1 - t) ** 2 * base + 2 * (1 - t) * t * cy + t * t * tipY;
    const side = i % 2 ? 1 : -1;
    ctx.beginPath(); ctx.ellipse(px + side * 8, py + 6, 10, 5.5, side * 0.9 + (bend > 0 ? 0.6 : -0.6), 0, TAU); paint(ctx, "#e2a72e", "#9c6a14", 2);
  }
}
function nobanno(ctx: Ctx, width: number, frameBottom: number, sceneTop: number) {
  ctx.fillStyle = "#fdf4d8"; ctx.fillRect(0, sceneTop, width, 470 - sceneTop);
  glow(ctx, 800, 170, 200, "rgba(246,178,74,.35)");
  circle(ctx, 800, 170, 74); paint(ctx, "#f6b24a");
  const band = (y: number, amp: number, color: string, stripe: string) => {
    ctx.beginPath(); ctx.moveTo(0, y); ctx.bezierCurveTo(300, y - amp, 700, y + amp, width, y - amp * 0.4); ctx.lineTo(width, SCENE_HEIGHT + 10); ctx.lineTo(0, SCENE_HEIGHT + 10); ctx.closePath(); paint(ctx, color);
    ctx.strokeStyle = stripe; ctx.lineWidth = 2.5;
    for (let px = 14; px < width; px += 26) { const top = y + 14 + Math.sin(px / 140) * amp * 0.3; ctx.beginPath(); ctx.moveTo(px, top); ctx.lineTo(px + 6, top + 14); ctx.stroke(); }
  };
  band(400, 26, "#ecc65f", "rgba(160,110,20,.25)");
  band(468, 32, "#e3ab36", "rgba(150,95,15,.3)");
  band(548, 22, "#d4931f", "rgba(120,70,10,.3)");
  // কুলা with a heap of new paddy
  ctx.save(); ctx.translate(540, 470); ctx.rotate(-0.08);
  const kula = () => { ctx.beginPath(); ctx.moveTo(-200, 40); ctx.quadraticCurveTo(-214, -112, 0, -122); ctx.quadraticCurveTo(214, -112, 200, 40); ctx.closePath(); };
  kula(); paint(ctx, "#d9a85b");
  ctx.save(); kula(); ctx.clip(); ctx.strokeStyle = "rgba(122,78,26,.45)"; ctx.lineWidth = 3;
  for (let k = -360; k < 360; k += 18) { line(ctx, [k, -140, k + 180, 60], "rgba(122,78,26,.45)", 3); line(ctx, [k, 60, k + 180, -140], "rgba(122,78,26,.3)", 3); }
  ctx.restore();
  kula(); paint(ctx, undefined, "#6b4419", 7);
  for (let i = 0; i < 70; i++) { const gx = (noise(i) - 0.5) * 300, gy = 20 - noise(i + 50) * 70 * (1 - Math.abs(gx) / 170); ctx.beginPath(); ctx.ellipse(gx, gy, 9, 5, noise(i + 9) * 3, 0, TAU); paint(ctx, "#eab43d", "#9c6a14", 1.5); }
  ctx.restore();
  // a clay plate of ভাপা পিঠা in front
  ctx.beginPath(); ctx.ellipse(540, 596, 170, 34, 0, 0, TAU); paint(ctx, "#b4532a", "#5e2810", 4);
  ctx.beginPath(); ctx.ellipse(540, 588, 140, 22, 0, 0, TAU); paint(ctx, "#cf6b3a");
  for (const [px, py] of [[470, 572], [610, 572], [540, 576], [505, 540], [575, 540], [540, 508]]) {
    ctx.beginPath(); ctx.ellipse(px, py, 46, 22, 0, 0, TAU); paint(ctx, "#fff8ea", "#c9b490", 2.5);
    ctx.beginPath(); ctx.ellipse(px, py - 6, 20, 8, 0, 0, TAU); paint(ctx, "#8a4b14");
  }
  for (const [px, h, b] of [[70, 330, 60], [110, 380, 80], [150, 300, 50], [190, 350, 70], [890, 350, -70], [930, 300, -50], [970, 380, -80], [1010, 330, -60]]) paddy(ctx, px, SCENE_HEIGHT + 6, h, b);
  // a woven-mat edge so the field ends on purpose
  ctx.fillStyle = "#7a4e17"; ctx.fillRect(0, SCENE_HEIGHT, width, 18);
  ctx.fillStyle = "#e2a72e";
  for (let px = 0; px < width; px += 24) { ctx.beginPath(); ctx.moveTo(px, SCENE_HEIGHT + 15); ctx.lineTo(px + 12, SCENE_HEIGHT + 3); ctx.lineTo(px + 24, SCENE_HEIGHT + 15); ctx.closePath(); ctx.fill(); }
  ctx.beginPath(); ctx.moveTo(26, frameBottom); ctx.lineTo(26, sceneTop + 26); ctx.lineTo(width - 26, sceneTop + 26); ctx.lineTo(width - 26, frameBottom);
  paint(ctx, undefined, "#9c6a14", 4);
}

// ---- অমর একুশে: লাল সূর্য, শহীদ মিনার, বর্ণমালা ----
function frame(ctx: Ctx, x: number, bottom: number, w: number, h: number, bars: number) {
  const post = Math.max(12, w * 0.13);
  ctx.fillRect(x - w / 2, bottom - h, post, h); ctx.fillRect(x + w / 2 - post, bottom - h, post, h); ctx.fillRect(x - w / 2, bottom - h, w, post);
  for (let i = 1; i <= bars; i++) ctx.fillRect(x - w / 2 + post + (i * (w - 2 * post)) / (bars + 1) - 2.5, bottom - h + post, 5, h - post);
}
/** The শহীদ মিনার silhouette, centred on x 540 with its steps' top at y 566 (the profile frame scales it down). */
export function shaheedMinar(ctx: Ctx, color: string) {
  const ground = 566;
  ctx.fillStyle = color;
  frame(ctx, 300, ground, 78, 178, 2); frame(ctx, 780, ground, 78, 178, 2);
  frame(ctx, 405, ground, 92, 246, 2); frame(ctx, 675, ground, 92, 246, 2);
  frame(ctx, 540, ground, 132, 236, 3);
  // the centre frame's head bows forward, like a mother over her sons
  ctx.save(); ctx.translate(540 - 66, ground - 236); ctx.rotate(0.24); frame(ctx, 66, 0, 132, 104, 3); ctx.restore();
  for (const [sx, sw, sy] of [[170, 740, 600], [220, 640, 583], [266, 548, 566]]) ctx.fillRect(sx, sy, sw, 18);
}
function ekushe(ctx: Ctx, width: number, frameBottom: number, sceneTop: number) {
  const black = "#151515";
  ctx.fillStyle = "#e3ddd0";
  ctx.textAlign = "center";
  [["অ", 120, 150, -0.2], ["আ", 960, 120, 0.15], ["ক", 90, 380, 0.1], ["খ", 1000, 360, -0.12], ["ম", 210, 250, 0.18], ["ব", 880, 250, -0.2], ["ল", 150, 520, -0.1], ["ঙ", 940, 500, 0.2]].forEach(([letter, lx, ly, a]) => {
    ctx.save(); ctx.translate(Number(lx), Number(ly)); ctx.rotate(Number(a)); ctx.font = `700 96px ${DISPLAY_FONT}`; ctx.fillText(String(letter), 0, 0); ctx.restore();
  });
  circle(ctx, 540, 330, 178); paint(ctx, "#c8102e");
  shaheedMinar(ctx, black);
  // wreaths laid at the foot
  for (const fx of [400, 540, 680]) {
    for (let i = 0; i < 12; i++) { const a = (i / 12) * TAU; circle(ctx, fx + Math.cos(a) * 26, 632 + Math.sin(a) * 11, 7); paint(ctx, "#c8102e", "#7d0a1a", 1.5); }
  }
  ctx.beginPath(); ctx.moveTo(26, frameBottom); ctx.lineTo(26, sceneTop + 26); ctx.lineTo(width - 26, sceneTop + 26); ctx.lineTo(width - 26, frameBottom);
  paint(ctx, undefined, black, 3);
}

// ---- শুভ জন্মদিন: কাগজের শিকল, বেলুন, মোমবাতির কেক, মায়ের রাঁধা পায়েস ----
const PARTY = ["#c8285a", "#f6b93b", "#1f8a80", "#ee7d3b", "#4fa3d9"];
/** Interlocked paper loops along a hanging curve, the kind cut from coloured paper for a home birthday. */
function paperChain(ctx: Ctx, x1: number, x2: number, y: number, sag: number, seed: number) {
  const cx = (x1 + x2) / 2, cy = y + sag * 2;
  const steps = Math.round((x2 - x1) / 30);
  ctx.lineWidth = 7;
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    const px = (1 - t) ** 2 * x1 + 2 * (1 - t) * t * cx + t * t * x2, py = (1 - t) ** 2 * y + 2 * (1 - t) * t * cy + t * t * y;
    const angle = Math.atan2(2 * (1 - t) * (cy - y) + 2 * t * (y - cy), 2 * (1 - t) * (cx - x1) + 2 * t * (x2 - cx));
    ctx.beginPath(); ctx.ellipse(px, py, 22, i % 2 ? 5 : 13, angle, 0, TAU);
    ctx.strokeStyle = PARTY[(i + seed) % PARTY.length]; ctx.stroke();
  }
}
function balloon(ctx: Ctx, x: number, y: number, color: string, tilt: number) {
  ctx.lineCap = "round";
  ctx.beginPath(); ctx.moveTo(x, y + 70); ctx.bezierCurveTo(x - 16, y + 104, x + 16, y + 134, x - 4, y + 176);
  ctx.strokeStyle = "rgba(36,52,58,.45)"; ctx.lineWidth = 2.5; ctx.stroke();
  ctx.save(); ctx.translate(x, y); ctx.rotate(tilt);
  ctx.beginPath(); ctx.moveTo(0, 64); ctx.bezierCurveTo(-62, 40, -58, -68, 0, -68); ctx.bezierCurveTo(58, -68, 62, 40, 0, 64); ctx.closePath(); paint(ctx, color);
  ctx.beginPath(); ctx.moveTo(-8, 74); ctx.lineTo(0, 62); ctx.lineTo(8, 74); ctx.closePath(); paint(ctx, color);
  ctx.beginPath(); ctx.ellipse(-22, -30, 9, 19, 0.5, 0, TAU); paint(ctx, "rgba(255,255,255,.5)");
  ctx.restore();
}
/** A round cake tier: side first, then the top, then cream dripping over the front edge. */
function tier(ctx: Ctx, cx: number, top: number, bottom: number, rx: number, ry: number, side: string, cream: string, seed: number) {
  ctx.beginPath(); ctx.moveTo(cx - rx, top); ctx.lineTo(cx - rx, bottom); ctx.ellipse(cx, bottom, rx, ry, 0, Math.PI, 0, true); ctx.lineTo(cx + rx, top); ctx.closePath();
  paint(ctx, side, "#7a3b2a", 4);
  ctx.fillStyle = cream;
  ctx.beginPath(); ctx.ellipse(cx, top + 10, rx, ry, 0, 0, TAU); ctx.fill();
  for (let i = 1; i < 12; i++) {
    const x = cx - rx + (2 * rx * i) / 12, edge = top + 10 + ry * Math.sqrt(1 - ((x - cx) / rx) ** 2);
    ctx.beginPath(); ctx.roundRect(x - 8, edge - 12, 16, 22 + noise(seed + i) * 26, 8); ctx.fill();
  }
  ctx.beginPath(); ctx.ellipse(cx, top, rx, ry, 0, 0, TAU); paint(ctx, cream, "#7a3b2a", 4);
}
function candle(ctx: Ctx, x: number, base: number) {
  ctx.save(); ctx.beginPath(); ctx.roundRect(x - 8, base - 74, 16, 74, 3); ctx.clip();
  ctx.fillStyle = "#ffffff"; ctx.fillRect(x - 8, base - 74, 16, 74);
  ctx.strokeStyle = "#c8285a"; ctx.lineWidth = 5;
  for (let sy = base - 84; sy < base + 10; sy += 16) { ctx.beginPath(); ctx.moveTo(x - 10, sy + 10); ctx.lineTo(x + 10, sy); ctx.stroke(); }
  ctx.restore();
  line(ctx, [x, base - 74, x, base - 84], "#3a2a20", 3);
  flame(ctx, x, base - 82, 0.7);
}
function payesh(ctx: Ctx, x: number, y: number) {
  ctx.lineCap = "round";
  for (const dx of [-28, 0, 28]) { ctx.beginPath(); ctx.moveTo(x + dx, y - 32); ctx.bezierCurveTo(x + dx - 16, y - 62, x + dx + 16, y - 84, x + dx, y - 116); ctx.strokeStyle = "rgba(31,111,102,.25)"; ctx.lineWidth = 6; ctx.stroke(); }
  ctx.beginPath(); ctx.ellipse(x, y + 74, 42, 9, 0, 0, TAU); paint(ctx, "#b9c4c7", "#6f7e82", 3);
  ctx.beginPath(); ctx.ellipse(x, y, 96, 74, 0, 0, Math.PI); ctx.closePath(); paint(ctx, "#d9e1e3", "#6f7e82", 4);
  line(ctx, [x - 70, y + 34, x + 70, y + 34], "rgba(255,255,255,.7)", 4);
  ctx.beginPath(); ctx.ellipse(x, y, 96, 20, 0, 0, TAU); paint(ctx, "#f6e8c8", "#6f7e82", 4);
  for (const [px, py] of [[-44, -4], [-8, 7], [30, -7], [56, 4], [-66, 6], [12, -10]]) { ctx.beginPath(); ctx.ellipse(x + px, y + py, 6, 4, 0.4, 0, TAU); paint(ctx, "#7a3b1d"); }
  for (const [px, py] of [[-24, 2], [44, -2]]) { ctx.beginPath(); ctx.arc(x + px, y + py, 7, 0.3, Math.PI + 0.6); paint(ctx, undefined, "#d9a85b", 5); }
  leaf(ctx, x + 6, y + 4, 48, 12, 1.25); paint(ctx, "#6f8f3a", "#4f6b26", 2);
}
function giftBox(ctx: Ctx, x: number, base: number) {
  const w = 124, h = 94;
  ctx.beginPath(); ctx.rect(x - w / 2, base - h, w, h); paint(ctx, "#1f8a80", "#145c55", 4);
  ctx.beginPath(); ctx.rect(x - w / 2 - 8, base - h - 26, w + 16, 28); paint(ctx, "#27a396", "#145c55", 4);
  ctx.fillStyle = "#f6b93b"; ctx.fillRect(x - 10, base - h - 26, 20, h + 26);
  for (const side of [-1, 1]) { ctx.beginPath(); ctx.ellipse(x + side * 22, base - h - 38, 24, 13, side * 0.5, 0, TAU); paint(ctx, "#f6b93b", "#c98a12", 3); }
  circle(ctx, x, base - h - 32, 9); paint(ctx, "#e0a12a", "#c98a12", 3);
}
function jonmodin(ctx: Ctx, width: number, frameBottom: number, sceneTop: number) {
  // confetti first, so everything else sits on top of it
  for (let i = 0; i < 30; i++) {
    const cx = 60 + noise(i + 11) * (width - 120), cy = sceneTop + 150 + noise(i + 37) * (420 - sceneTop - 150);
    ctx.save(); ctx.translate(cx, cy); ctx.rotate(noise(i) * TAU); ctx.fillStyle = PARTY[i % PARTY.length];
    if (i % 3) ctx.fillRect(-7, -3, 14, 6); else { circle(ctx, 0, 0, 4.5); ctx.fill(); }
    ctx.restore();
  }
  paperChain(ctx, -20, 560, sceneTop + 34, 70, 0);
  paperChain(ctx, 520, width + 20, sceneTop + 34, 70, 2);
  // a paper rosette where the chains meet
  for (let i = 0; i < 16; i++) { ctx.beginPath(); ctx.moveTo(540, sceneTop + 40); ctx.arc(540, sceneTop + 40, 46, (i / 16) * TAU, ((i + 1) / 16) * TAU); ctx.closePath(); paint(ctx, i % 2 ? "#f6b93b" : "#ee7d3b"); }
  circle(ctx, 540, sceneTop + 40, 16); paint(ctx, "#c8285a");
  balloon(ctx, 130, 300, "#4fa3d9", -0.15); balloon(ctx, 236, 232, "#c8285a", -0.05);
  balloon(ctx, 848, 232, "#f6b93b", 0.05); balloon(ctx, 954, 300, "#1f8a80", 0.15);
  // the table: a yellow cloth with a কাঁথা running stitch and a scalloped edge
  ctx.fillStyle = "#f9d77e"; ctx.fillRect(0, 566, width, SCENE_HEIGHT - 566);
  for (let px = 0; px < width + 36; px += 36) { circle(ctx, px, SCENE_HEIGHT, 18); ctx.fill(); }
  ctx.setLineDash([18, 12]); line(ctx, [0, 604, width, 604], "#c8285a", 4); ctx.setLineDash([]);
  ctx.beginPath(); ctx.ellipse(540, 570, 236, 30, 0, 0, TAU); paint(ctx, "#ffffff", "#9fb3b0", 3);
  tier(ctx, 540, 444, 560, 176, 32, "#fff5ec", "#f48fb1", 3);
  tier(ctx, 540, 354, 444, 112, 22, "#f7a8bf", "#fff5ec", 9);
  for (let i = 0; i < 18; i++) { ctx.fillStyle = PARTY[i % PARTY.length]; ctx.fillRect(390 + noise(i + 5) * 300, 470 + noise(i + 70) * 70, 10, 4); }
  for (const x of [496, 540, 584]) candle(ctx, x, 356);
  giftBox(ctx, 236, 568);
  payesh(ctx, 852, 498);
  ctx.beginPath(); ctx.moveTo(26, frameBottom); ctx.lineTo(26, sceneTop + 26); ctx.lineTo(width - 26, sceneTop + 26); ctx.lineTo(width - 26, frameBottom);
  paint(ctx, undefined, "#c8285a", 4);
}

// ---- শুভ বিবাহবার্ষিকী: গাঁদা ফুলের মালা, মরিচ বাতি, দুই কাপ চা, রজনীগন্ধা ----
function marigolds(ctx: Ctx, x: number, top: number, bottom: number, seed: number) {
  line(ctx, [x, top, x, bottom], "#2f5a22", 2);
  let i = 0;
  for (let y = top + 16; y < bottom; y += 27, i++) {
    circle(ctx, x, y, 15); paint(ctx, (i + seed) % 3 === 2 ? "#f9c22e" : "#f28c1b");
    ctx.strokeStyle = "rgba(140,50,0,.45)"; ctx.lineWidth = 2;
    for (let k = 0; k < 6; k++) { const a = (k / 6) * TAU + noise(seed * 31 + i); ctx.beginPath(); ctx.arc(x + Math.cos(a) * 7, y + Math.sin(a) * 7, 6, a - 1, a + 1); ctx.stroke(); }
  }
  leaf(ctx, x, bottom, 30, 9, Math.PI); paint(ctx, "#3d8b3d");
}
function fairyLights(ctx: Ctx, x1: number, x2: number, y: number, sag: number, seed: number) {
  const cx = (x1 + x2) / 2, cy = y + sag * 2;
  ctx.beginPath(); ctx.moveTo(x1, y); ctx.quadraticCurveTo(cx, cy, x2, y);
  ctx.strokeStyle = "rgba(20,4,8,.55)"; ctx.lineWidth = 2; ctx.stroke();
  const steps = Math.round((x2 - x1) / 42);
  for (let i = 1; i < steps; i++) {
    const t = i / steps, px = (1 - t) ** 2 * x1 + 2 * (1 - t) * t * cx + t * t * x2, py = (1 - t) ** 2 * y + 2 * (1 - t) * t * cy + t * t * y + 7;
    glow(ctx, px, py, 24, noise(seed + i) > 0.5 ? "rgba(255,214,120,.5)" : "rgba(255,160,110,.45)");
    circle(ctx, px, py, 5); paint(ctx, "#fff1c2");
  }
}
function teacup(ctx: Ctx, x: number, base: number, flip: number) {
  const gold = "#c9a24a", china = "#fffaf3";
  ctx.beginPath(); ctx.ellipse(x, base, 104, 21, 0, 0, TAU); paint(ctx, china, gold, 3);
  ctx.beginPath(); ctx.ellipse(x, base - 3, 52, 9, 0, 0, TAU); paint(ctx, undefined, "rgba(201,162,74,.6)", 2);
  ctx.beginPath(); ctx.ellipse(x + flip * 68, base - 58, 24, 22, 0, 0, TAU); paint(ctx, undefined, gold, 15); ctx.strokeStyle = china; ctx.lineWidth = 9; ctx.stroke();
  ctx.beginPath(); ctx.moveTo(x - 68, base - 98); ctx.bezierCurveTo(x - 68, base - 30, x - 44, base - 8, x, base - 8); ctx.bezierCurveTo(x + 44, base - 8, x + 68, base - 30, x + 68, base - 98); ctx.closePath();
  paint(ctx, china, gold, 3);
  ctx.fillStyle = "#b5162e";
  for (let i = 0; i < 7; i++) { leaf(ctx, x - 42 + i * 14, base - 50, 12, 4, 0); ctx.fill(); }
  ctx.beginPath(); ctx.ellipse(x, base - 98, 68, 14, 0, 0, TAU); paint(ctx, china, gold, 4);
  ctx.beginPath(); ctx.ellipse(x, base - 96, 57, 10, 0, 0, TAU); paint(ctx, "#a8612a");
}
function heart(ctx: Ctx, cx: number, cy: number, s: number) {
  ctx.beginPath(); ctx.moveTo(cx, cy + s * 0.9);
  ctx.bezierCurveTo(cx - s * 1.5, cy - s * 0.1, cx - s * 0.7, cy - s * 1.3, cx, cy - s * 0.45);
  ctx.bezierCurveTo(cx + s * 0.7, cy - s * 1.3, cx + s * 1.5, cy - s * 0.1, cx, cy + s * 0.9);
  ctx.closePath();
}
function rajanigandha(ctx: Ctx, x: number, base: number, flip: number) {
  ctx.lineCap = "round";
  for (const [lean, h] of [[-26, 230], [4, 270], [30, 210]]) {
    const tipX = x + lean * flip, tipY = base - h;
    ctx.beginPath(); ctx.moveTo(x, base - 40); ctx.quadraticCurveTo(x + lean * flip * 0.2, base - h * 0.6, tipX, tipY);
    ctx.strokeStyle = "#4f8a3a"; ctx.lineWidth = 4; ctx.stroke();
    for (let i = 0; i < 9; i++) {
      const t = 0.45 + (i / 9) * 0.55, px = (1 - t) ** 2 * x + 2 * (1 - t) * t * (x + lean * flip * 0.2) + t * t * tipX, py = (1 - t) ** 2 * (base - 40) + 2 * (1 - t) * t * (base - h * 0.6) + t * t * tipY;
      leaf(ctx, px, py, 26 - i, 8, (i % 2 ? 0.7 : -0.7)); paint(ctx, "#fffaf0", "#d9cdb4", 1.5);
    }
  }
  ctx.beginPath(); ctx.moveTo(x - 20, base - 60); ctx.quadraticCurveTo(x - 46, base - 10, x - 30, base); ctx.lineTo(x + 30, base); ctx.quadraticCurveTo(x + 46, base - 10, x + 20, base - 60); ctx.closePath();
  paint(ctx, "rgba(190,230,235,.35)", "rgba(255,255,255,.7)", 3);
}
function bibahobarshiki(ctx: Ctx, width: number, frameBottom: number, sceneTop: number) {
  const gold = "#f6c85f";
  fairyLights(ctx, -20, width + 20, sceneTop + 30, 70, 1);
  fairyLights(ctx, -20, width + 20, sceneTop + 70, 55, 7);
  for (const [mx, end, seed] of [[64, 330, 0], [118, 250, 1], [172, 190, 2], [width - 64, 330, 1], [width - 118, 250, 2], [width - 172, 190, 0]]) marigolds(ctx, mx, sceneTop, end, seed);
  // the rug: a deep red কাঁথা with gold running stitches
  ctx.fillStyle = "#8f1d33"; ctx.fillRect(0, 584, width, SCENE_HEIGHT - 584);
  ctx.setLineDash([16, 10]); line(ctx, [0, 600, width, 600], gold, 3); line(ctx, [0, 626, width, 626], gold, 3); ctx.setLineDash([]);
  rajanigandha(ctx, 190, 590, -1);
  rajanigandha(ctx, 890, 590, 1);
  // steam from the two cups meets in a heart
  const steam = "rgba(255,240,222,.6)";
  ctx.lineCap = "round";
  ctx.beginPath(); ctx.moveTo(452, 470); ctx.bezierCurveTo(424, 430, 486, 412, 470, 372); ctx.bezierCurveTo(462, 352, 500, 352, 522, 362); ctx.strokeStyle = steam; ctx.lineWidth = 6; ctx.stroke();
  ctx.beginPath(); ctx.moveTo(628, 470); ctx.bezierCurveTo(656, 430, 594, 412, 610, 372); ctx.bezierCurveTo(618, 352, 580, 352, 558, 362); ctx.stroke();
  heart(ctx, 540, 300, 62); paint(ctx, "#f6c85f", steam, 6);
  teacup(ctx, 455, 578, -1);
  teacup(ctx, 625, 578, 1);
  ctx.beginPath(); ctx.moveTo(30, frameBottom); ctx.lineTo(30, sceneTop + 30); ctx.lineTo(width - 30, sceneTop + 30); ctx.lineTo(width - 30, frameBottom);
  paint(ctx, undefined, "rgba(246,200,95,.7)", 2.5);
}

function divider(ctx: Ctx, y: number, color: string) {
  line(ctx, [420, y, 512, y], color, 2.5); line(ctx, [568, y, 660, y], color, 2.5);
  ctx.beginPath(); ctx.moveTo(540, y - 12); ctx.lineTo(552, y); ctx.lineTo(540, y + 12); ctx.lineTo(528, y); ctx.closePath(); ctx.fillStyle = color; ctx.fill();
}

const layouts = {
  feed: { title: 112, sub: 36, message: 42, lineHeight: 64, name: 40, photo: 64, gap: 26 },
  story: { title: 132, sub: 42, message: 50, lineHeight: 76, name: 48, photo: 84, gap: 36 },
} as const;

type Words = { lines: string[]; sender: string; senderHeight: number; height: number };

function measureWords(ctx: Ctx, card: Card, format: CardFormat, photo?: Photo | null): Words {
  const size = layouts[format];
  ctx.font = `500 ${size.message}px ${BODY_FONT}`;
  const lines = card.message ? wrapText(ctx, card.message, 880, 4) : [];
  const sender = card.name ? `— ${card.name}` : "";
  const senderHeight = photo ? size.photo * 2 : sender ? size.name * 1.3 : 0;
  const height = size.title + size.gap + size.sub + (lines.length ? size.gap * 1.3 + lines.length * size.lineHeight : 0) + (senderHeight ? size.gap * 1.4 + senderHeight : 0);
  return { lines, sender, senderHeight, height };
}

function drawWords(ctx: Ctx, card: Card, theme: Theme, format: CardFormat, words: Words, top: number, photo?: Photo | null) {
  const size = layouts[format];
  const { lines, sender, senderHeight } = words;
  let y = top + size.title * 0.8;
  fitText(ctx, [{ text: card.title, color: theme.title, weight: 800, display: true }], 540, y, size.title, 940, "center");
  y += size.gap + size.sub * 0.9;
  if (card.subtitle) fitText(ctx, [{ text: card.subtitle, color: theme.sub, weight: 600 }], 540, y, size.sub, 900, "center");
  else divider(ctx, y - size.sub * 0.3, theme.sub);
  y += size.sub * 0.1 + size.gap * 1.3;
  for (const text of lines) { y += size.lineHeight; fitText(ctx, [{ text, color: theme.text, weight: 500 }], 540, y - size.lineHeight * 0.28, size.message, 900, "center"); }
  if (!senderHeight) return;
  const middle = y + size.gap * 1.4 + senderHeight / 2;
  ctx.font = `700 ${size.name}px ${DISPLAY_FONT}`;
  const nameWidth = sender ? Math.min(ctx.measureText(sender).width, photo ? 700 : 900) : 0;
  const rowWidth = (photo ? size.photo * 2 + (sender ? 24 : 0) : 0) + nameWidth;
  let x = 540 - rowWidth / 2;
  if (photo) { drawPhoto(ctx, photo, x + size.photo, middle, size.photo, theme.ring); ctx.lineWidth = 6; ctx.strokeStyle = theme.ring; circle(ctx, x + size.photo, middle, size.photo); ctx.stroke(); x += size.photo * 2 + 24; }
  if (sender) fitText(ctx, [{ text: sender, color: theme.name, weight: 700, display: true }], x, middle + size.name * 0.32, size.name, nameWidth);
}

export function drawCard(canvas: HTMLCanvasElement, card: Card, format: CardFormat, site: string, photo?: Photo | null) {
  const { width, height } = cardSizes[format];
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("এই ব্রাউজারে ছবি বানানো যাচ্ছে না।");
  const theme = themes[card.occasion];
  const story = format === "story";
  const footerTop = story ? height - 240 : height - 96;
  ctx.fillStyle = theme.bg; ctx.fillRect(0, 0, width, height);
  // Art and words move as one block: short messages leave the spare room split above and below, long ones nudge the art up.
  const words = measureWords(ctx, card, format, photo);
  const gap = story ? 56 : 30, minTop = story ? STORY_SCENE_TOP : 0;
  const spare = footerTop - (story ? 40 : 24) - minTop - SCENE_HEIGHT - gap - words.height;
  const offset = minTop + (spare >= 0 ? spare * 0.5 : Math.max(spare, -60));
  ctx.save(); ctx.translate(0, offset);
  // Scene coordinates: the canvas top is at -offset and the footer at footerTop - offset.
  const sceneTop = -offset, frameBottom = footerTop - offset;
  if (card.occasion === "bijoya") bijoya(ctx, width, frameBottom, sceneTop);
  else if (card.occasion === "bijoy") bijoy(ctx, width, frameBottom, sceneTop);
  else if (card.occasion === "eid") eid(ctx, width, frameBottom, sceneTop);
  else if (card.occasion === "noboborsho") noboborsho(ctx, width, frameBottom, sceneTop, card.year);
  else if (card.occasion === "nobanno") nobanno(ctx, width, frameBottom, sceneTop);
  else if (card.occasion === "jonmodin") jonmodin(ctx, width, frameBottom, sceneTop);
  else if (card.occasion === "bibahobarshiki") bibahobarshiki(ctx, width, frameBottom, sceneTop);
  else ekushe(ctx, width, frameBottom, sceneTop);
  ctx.restore();
  ctx.textAlign = "left";
  drawWords(ctx, card, theme, format, words, offset + SCENE_HEIGHT + gap, photo);
  drawFooterBand(ctx, format, ASK, site, theme.band);
}

export const cardBlob = (card: Card, format: CardFormat, site: string, photo?: Photo | null) => renderCard(canvas => drawCard(canvas, card, format, site, photo));

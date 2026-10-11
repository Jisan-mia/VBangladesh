import { DISPLAY_FONT, drawPhoto, fitText, renderCard, type Photo } from "../../../shared/card-canvas";
import { circle, paint, shaheedMinar, shapla } from "./draw-card";
import type { FrameCard, FrameId } from "./greeting";

type Ctx = CanvasRenderingContext2D;
type Look = { bg: string; ring: string; tint: string; shade: string; ribbon: string; fold: string; ink: string; sub: string; edge: string };

const TAU = Math.PI * 2;
export const FRAME_SIZE = 1080;
const C = FRAME_SIZE / 2;
// Facebook shows a profile picture cropped to the inscribed circle, so everything that matters stays within radius 540.
const PHOTO_R = 385;
const RIBBON = { top: 772, height: 104, left: 210, right: 870, tail: 62, drop: 22 };

const looks: Record<FrameId, Look> = {
  // Flag green and red as commonly specified from the Flag Rules 1972 (bottle green #006a4e, red #f42a41).
  // the ground is a shade deeper than the flag's own green, so the small flag on top stays readable
  bijoy: { bg: "#00563f", ring: "#f42a41", tint: "#d7e9e1", shade: "#a9c9bb", ribbon: "#f42a41", fold: "#a8162a", ink: "#ffffff", sub: "#ffd166", edge: "rgba(255,255,255,.4)" },
  ekushe: { bg: "#f3efe7", ring: "#151515", tint: "#e6e0d5", shade: "#c9c1b2", ribbon: "#151515", fold: "#3a3a3a", ink: "#ffffff", sub: "#b3122a", edge: "#151515" },
  khela: { bg: "#00754a", ring: "#ffd166", tint: "#e2efe8", shade: "#b5d0c2", ribbon: "#ffd166", fold: "#c9961f", ink: "#00553a", sub: "#ffffff", edge: "rgba(255,255,255,.5)" },
};

/** The national flag: 10:6, disc radius one-fifth of the length, centred 9/20 of the length from the hoist (Bangladesh Flag Rules, 1972). */
function flag(ctx: Ctx, cx: number, cy: number, length: number) {
  const height = length * 0.6, x = cx - length / 2, y = cy - height / 2;
  ctx.beginPath(); ctx.roundRect(x - 6, y - 6, length + 12, height + 12, 6); paint(ctx, "#ffffff");
  ctx.fillStyle = "#006a4e"; ctx.fillRect(x, y, length, height);
  circle(ctx, x + (length * 9) / 20, cy, length / 5); paint(ctx, "#f42a41");
}

function ball(ctx: Ctx, x: number, y: number, r: number) {
  circle(ctx, x, y, r); paint(ctx, "#c8102e", "#6d0918", 4);
  ctx.save(); circle(ctx, x, y, r); ctx.clip();
  ctx.strokeStyle = "#fff3d6"; ctx.lineWidth = 3;
  for (const off of [-7, 7]) {
    const big = r * 2.4 + off;
    ctx.beginPath(); ctx.arc(x - r * 2.4, y - r * 0.4, big, -0.5, 0.5); ctx.stroke();
    for (let a = -0.36; a <= 0.36; a += 0.09) {
      const px = x - r * 2.4 + Math.cos(a) * big, py = y - r * 0.4 + Math.sin(a) * big;
      ctx.beginPath(); ctx.moveTo(px - Math.cos(a) * 5, py - Math.sin(a) * 5); ctx.lineTo(px + Math.cos(a) * 5, py + Math.sin(a) * 5); ctx.stroke();
    }
  }
  ctx.beginPath(); ctx.ellipse(x - r * 0.4, y - r * 0.45, r * 0.32, r * 0.18, -0.6, 0, TAU); paint(ctx, "rgba(255,255,255,.35)");
  ctx.restore();
}

function stumps(ctx: Ctx, x: number, y: number) {
  for (const dx of [-24, 0, 24]) { ctx.beginPath(); ctx.roundRect(x + dx - 6, y - 40, 12, 86, 5); paint(ctx, "#fff3d6", "#c9b48a", 2); }
  for (const dx of [-13, 13]) { ctx.beginPath(); ctx.roundRect(x + dx - 13, y - 50, 26, 8, 4); paint(ctx, "#fff3d6", "#c9b48a", 2); }
}

function back(ctx: Ctx, id: FrameId) {
  if (id === "bijoy") {
    // the card's sunrise rays, now around the photo
    ctx.fillStyle = "rgba(255,255,255,.07)";
    for (let i = 0; i < 24; i++) { const a = (i / 24) * TAU; ctx.beginPath(); ctx.moveTo(C, C); ctx.lineTo(C + Math.cos(a) * 800, C + Math.sin(a) * 800); ctx.lineTo(C + Math.cos(a + 0.12) * 800, C + Math.sin(a + 0.12) * 800); ctx.closePath(); ctx.fill(); }
  } else if (id === "ekushe") {
    // বর্ণমালা around the ring, kept clear of the মিনার on top and the ribbon below
    ctx.fillStyle = "#d6cfc0"; ctx.textAlign = "center"; ctx.font = `700 66px ${DISPLAY_FONT}`;
    for (const [letter, degrees, tilt] of [["অ", 155, -0.2], ["আ", 180, 0.12], ["ক", 205, -0.1], ["খ", 230, 0.18], ["গ", -50, -0.18], ["ম", -25, 0.1], ["ব", 0, -0.12], ["ল", 25, 0.2]] as const) {
      const a = (degrees * Math.PI) / 180;
      ctx.save(); ctx.translate(C + Math.cos(a) * 468, C + Math.sin(a) * 468); ctx.rotate(tilt); ctx.fillText(letter, 0, 22); ctx.restore();
    }
    ctx.textAlign = "left";
  } else {
    // a fan's red-green scarf
    ctx.save(); ctx.translate(C, C); ctx.rotate(-Math.PI / 4); ctx.fillStyle = "#e5283f";
    for (let k = -900; k < 900; k += 150) ctx.fillRect(k, -900, 64, 1800);
    ctx.restore();
  }
}

function front(ctx: Ctx, id: FrameId) {
  if (id === "bijoy") {
    flag(ctx, C, 80, 120);
    shapla(ctx, 140, 330, 0.5);
    shapla(ctx, 940, 330, 0.5);
  } else if (id === "ekushe") {
    // a small, plain শহীদ মিনার with its red sun, above the photo and never on it
    circle(ctx, C, 54, 40); paint(ctx, "#c8102e");
    // drawn four times a pixel apart: at a third of its size the card's thin bars would vanish
    for (const [dx, dy] of [[-1.5, 0], [1.5, 0], [0, -1.5], [0, 1.5]]) {
      ctx.save(); ctx.translate(C + dx, 138 + dy); ctx.scale(0.325, 0.325); ctx.translate(-540, -618); shaheedMinar(ctx, "#151515"); ctx.restore();
    }
  } else {
    ball(ctx, 902, 236, 46);
    stumps(ctx, 178, 236);
  }
}

function ribbon(ctx: Ctx, look: Look, text: string) {
  const { top, height, left, right, tail, drop } = RIBBON;
  for (const side of [-1, 1]) {
    const edge = side < 0 ? left : right, inner = edge - side * 34, outer = edge + side * tail;
    ctx.beginPath(); ctx.moveTo(inner, top + drop); ctx.lineTo(outer, top + drop); ctx.lineTo(outer - side * 22, top + drop + height / 2); ctx.lineTo(outer, top + drop + height); ctx.lineTo(inner, top + drop + height); ctx.closePath();
    paint(ctx, look.fold);
    // the shadowed turn where the band folds back into its tail
    ctx.beginPath(); ctx.moveTo(edge, top + height); ctx.lineTo(inner, top + height); ctx.lineTo(inner, top + height + drop); ctx.closePath(); paint(ctx, "rgba(0,0,0,.4)");
  }
  ctx.beginPath(); ctx.rect(left, top, right - left, height); paint(ctx, look.ribbon);
  ctx.setLineDash([12, 8]);
  for (const y of [top + 10, top + height - 10]) { ctx.beginPath(); ctx.moveTo(left + 14, y); ctx.lineTo(right - 14, y); ctx.strokeStyle = look.ink; ctx.globalAlpha = 0.45; ctx.lineWidth = 2.5; ctx.stroke(); ctx.globalAlpha = 1; }
  ctx.setLineDash([]);
  fitText(ctx, [{ text, color: look.ink, weight: 800, display: true }], C, top + height * 0.68, 60, right - left - 70, "center");
}

export function drawFrame(canvas: HTMLCanvasElement, card: FrameCard, photo?: Photo | null) {
  canvas.width = FRAME_SIZE;
  canvas.height = FRAME_SIZE;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("এই ব্রাউজারে ছবি বানানো যাচ্ছে না।");
  const look = looks[card.frame];
  ctx.fillStyle = look.bg; ctx.fillRect(0, 0, FRAME_SIZE, FRAME_SIZE);
  back(ctx, card.frame);
  if (photo) drawPhoto(ctx, photo, C, C, PHOTO_R, look.ring);
  else {
    // a quiet head-and-shoulders, so the frame looks finished before a photo is picked
    ctx.save(); circle(ctx, C, C, PHOTO_R); ctx.clip();
    ctx.fillStyle = look.tint; ctx.fillRect(C - PHOTO_R, C - PHOTO_R, PHOTO_R * 2, PHOTO_R * 2);
    ctx.fillStyle = look.shade; circle(ctx, C, 468, 112); ctx.fill();
    ctx.beginPath(); ctx.ellipse(C, 872, 255, 250, 0, 0, TAU); ctx.fill();
    ctx.restore();
  }
  circle(ctx, C, C, PHOTO_R + 7); paint(ctx, undefined, look.ring, 14);
  if (card.frame === "ekushe") { circle(ctx, C, C, PHOTO_R + 21); paint(ctx, undefined, "#c8102e", 4); }
  circle(ctx, C, C, 528); paint(ctx, undefined, look.edge, 4);
  front(ctx, card.frame);
  ribbon(ctx, look, card.ribbon);
  if (card.sub) fitText(ctx, [{ text: card.sub, color: look.sub, weight: 700 }], C, 978, 32, 520, "center");
}

export const frameBlob = (card: FrameCard, photo?: Photo | null) => renderCard(canvas => drawFrame(canvas, card, photo));

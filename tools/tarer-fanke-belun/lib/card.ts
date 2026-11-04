// The share card: the level's own lane and light, the balloon slipping through a crossing, the count, the পাড়া,
// the stars and one stats line. Shared card helpers draw the footer, so every card on the site reads the same.
import { cardSizes, drawFooterBand, fitText, renderCard, wrapText, BODY_FONT, type CardFormat } from "../../../shared/card-canvas";
import { GROUND, lowWire, topWire, type Gate } from "./belun";
import { drawGate, paintBalloon, paintFar, paintMesh, paintShops, paintSky, drawStick, PALETTES, SHOPS_H } from "./art";
import { levelDef, MODE_INFO, type Mode } from "./levels";
import { bn, humanLine, seconds } from "./link";

export type Card = { score: number; name: string; level: number; mode: Mode; stars: number; won: boolean; lost: number; grazes: number; tenths: number; slow: boolean };

const INK = ["#241d1c", "#2a1830", "#0b1430"], DEEP = ["#8f1d33", "#7d1f45", "#a3172f"], ACCENT = "#c92a43";
/** Card art is drawn in street units, three pixels each (1080 / 360). */
const UNIT = 3;

function star(c: CanvasRenderingContext2D, x: number, y: number, r: number, on: boolean) {
  c.beginPath();
  for (let i = 0; i < 10; i++) { const a = -Math.PI / 2 + i * Math.PI / 5, d = i % 2 ? r * 0.45 : r; c.lineTo(x + Math.cos(a) * d, y + Math.sin(a) * d); }
  c.closePath();
  c.fillStyle = on ? "#f2a900" : "#ffffff88"; c.fill();
  c.lineWidth = 4; c.strokeStyle = on ? "#a86f00" : "#6a524866"; c.stroke();
}

export function drawCard(canvas: HTMLCanvasElement, card: Card, format: CardFormat, site: string) {
  const { width, height } = cardSizes[format];
  canvas.width = width; canvas.height = height;
  const c = canvas.getContext("2d");
  if (!c) throw new Error("এই ব্রাউজারে ছবি বানানো যাচ্ছে না।");
  const def = levelDef(card.level), world = def.world, p = PALETTES[world], night = p.night;
  const story = format === "story", footer = story ? height - 260 : height - 96;
  // The lane stands on the footer band: its pavement sits just above it.
  const unitsHigh = footer / UNIT, top = GROUND + 30 - unitsHigh;
  c.save();
  c.scale(UNIT, UNIT);
  c.translate(0, -top);
  paintSky(c, width / UNIT, top, GROUND + 40, world);
  c.save(); c.translate(0, 0); paintFar(c, width / UNIT, world); c.restore();
  c.save(); c.translate(0, GROUND - SHOPS_H); paintShops(c, 480, world); c.restore();
  paintMesh(c, width / UNIT, world);
  if (world === 0) drawStick(c, 150, GROUND);
  const first: Gate = { x: 0, w: 50, y: GROUND - 230, gap: 132, k: -10, sagTop: 22, sagLow: 6, swing: 0, freq: 0, phase: 0, knot: false, perch: 0.75, sitters: 0, kite: 0 };
  const second: Gate = { ...first, w: 52, y: GROUND - 270, gap: 124, k: 14, sagTop: 26, sagLow: 8, kite: -1 };
  drawGate(c, second, second.y, 316, world);
  drawGate(c, first, first.y, 226, world);
  const u = -0.15, mid = (topWire(first, first.y, u) + lowWire(first, first.y, u)) / 2;
  c.save(); c.translate(226 + u * first.w, mid - 2); c.scale(1.5, 1.5);
  c.strokeStyle = night ? "#d8c9c0" : "#6b5a4e"; c.lineWidth = 0.8;
  c.beginPath(); c.moveTo(0, 21); c.quadraticCurveTo(-5, 30, -2, 38); c.quadraticCurveTo(2, 45, -3, 52); c.stroke();
  paintBalloon(c, world);
  c.restore();
  c.restore();

  // Text sits on the open sky at the left, clear of the crossings and of the story's top bar.
  const ink = night ? "#f4f1ea" : INK[world], deep = night ? "#ffb3bf" : DEEP[world], muted = night ? "#c9d4ea" : "#6a5248";
  const y0 = story ? 360 : 150, gap = story ? 1.18 : 1, at = (offset: number) => y0 + offset * gap;
  fitText(c, [{ text: "তারের ফাঁকে বেলুন", color: deep, weight: 800, display: true }], 70, at(0), 60, 420);
  if (card.name) fitText(c, [{ text: card.name, color: ink, weight: 700, display: true }], 72, at(72), 50, 450);
  const count = card.level ? `${bn(card.score)}/${bn(def.crossings)}` : `${bn(card.score)}টা`;
  fitText(c, [{ text: count, color: night ? "#ff8f9b" : ACCENT, weight: 800, display: true }], 64, at(290), 190, 470);
  fitText(c, [{ text: card.level && card.won ? "ফাঁক পার, বেলুন আস্ত" : "ফাঁক পার করেছে", color: ink, weight: 700, display: true }], 72, at(360), 46, 450);
  c.font = `600 36px ${BODY_FONT}`;
  wrapText(c, humanLine({ level: card.level, won: card.won, lost: card.lost, grazes: card.grazes, score: card.score }), 440, 2).forEach((line, index) => {
    fitText(c, [{ text: line, color: ink, weight: 600 }], 72, at(432) + index * 50, 36, 440);
  });
  const extras = [card.tenths ? `${seconds(card.tenths)} সেকেন্ড` : "", card.mode !== "n" ? MODE_INFO[card.mode].name : "", card.slow ? "ধীরে খেলায়" : ""].filter(Boolean).join(" · ");
  fitText(c, [{ text: `নিজের ফোনে খেলা${extras ? ` · ${extras}` : ""}`, color: muted, weight: 600 }], 72, at(546), 26, 420);
  fitText(c, [{ text: card.level ? `লেভেল ${bn(card.level)} · ${def.name}` : "যত দূর পারো", color: deep, weight: 700, display: true }], 72, at(610), 40, 330);
  if (card.level && card.stars) for (let i = 0; i < 3; i++) star(c, 104 + i * 70, at(672), 28, i < card.stars);
  drawFooterBand(c, format, "তুমি কয়টা পার হবে?", site, { band: night ? "#070d22" : INK[world], ask: "#ffd166", site: "#ffffff" });
}

export const cardBlob = (card: Card, format: CardFormat, site: string) => renderCard(canvas => drawCard(canvas, card, format, site));

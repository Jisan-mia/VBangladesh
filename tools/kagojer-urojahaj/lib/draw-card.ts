// The result card: the wave's sky, a big ruled-paper plane on a dotted flight line, popped-cloud puffs, রোদ, and the score.
import { cardSizes, drawFooterBand, fitText, renderCard, roundedRect, type CardFormat } from "../../../shared/card-canvas";
import { PAL, paintCloud, paintFarClouds, paintPlane, paintSky, paintStorm, paintSun } from "./art";
import { HITS_MAX } from "./game";
import { isStorm, worldOf } from "./levels";
import { bn, cardStars, humanLine, levelLabel, type Card } from "./result";
import { makeWave } from "./wave";

const layouts = {
  feed: { panel: 48, title: 128, score: 318, line: 408, stats: 470, panelH: 470, plane: 860, size: 380 },
  story: { panel: 270, title: 350, score: 540, line: 630, stats: 692, panelH: 480, plane: 1220, size: 470 },
} as const;

export function drawCard(canvas: HTMLCanvasElement, card: Card, format: CardFormat, site: string) {
  const { width, height } = cardSizes[format], at = layouts[format];
  canvas.width = width; canvas.height = height;
  const context = canvas.getContext("2d");
  if (!context) throw new Error("এই ব্রাউজারে ছবি বানানো যাচ্ছে না।");
  const storm = isStorm(card.level), soaked = card.hits >= HITS_MAX, wave = makeWave(card.seed, card.level), stars = cardStars(card);
  paintSky(context, worldOf(card.level).id, storm, width, height);
  paintFarClouds(context, width, height, storm);

  // Leftover weather round the plane: a storm or two clouds, and the রোদ that came out.
  const cx = width / 2, py = at.plane;
  context.save(); context.translate(width * 0.8, py - at.size * 0.85);
  if (storm) paintStorm(context, 420, 180); else paintCloud(context, "dark", 230, 150, true);
  context.restore();
  context.save(); context.translate(width * 0.17, py - at.size * 0.35); paintCloud(context, "puff", 200, 130); context.restore();
  for (let index = 0; index < Math.min(6, Math.max(1, card.suns)); index++) {
    context.save(); context.translate(width * (0.14 + index * 0.13), py + at.size * 0.62 + (index % 2) * 40); paintSun(context, 30); context.restore();
  }

  // The flight line, then the plane climbing up and to the right.
  context.strokeStyle = "#ffffffc0"; context.lineWidth = 9; context.lineCap = "round"; context.setLineDash([2, 26]);
  context.beginPath(); context.moveTo(-20, py + at.size * 0.75); context.bezierCurveTo(width * 0.2, py + at.size * 0.5, cx - at.size * 0.6, py + at.size * 0.35, cx - at.size * 0.15, py + at.size * 0.1); context.stroke();
  context.setLineDash([]);
  context.save(); context.translate(cx, py); context.rotate(0.55);
  context.fillStyle = "#1f2a4426"; context.beginPath(); context.ellipse(18, 40, at.size * 0.35, at.size * 0.08, 0, 0, Math.PI * 2); context.fill();
  paintPlane(context, at.size, soaked ? 0.9 : card.hits / HITS_MAX * 0.6);
  context.restore();

  // The panel.
  context.fillStyle = "#fbfaf3f2"; roundedRect(context, 60, at.panel, width - 120, at.panelH, 36); context.fill();
  // Ruled lines and a red margin, like the page the plane was folded from.
  context.strokeStyle = "#9cc4e855"; context.lineWidth = 3;
  for (let y = at.panel + 96; y < at.panel + at.panelH - 20; y += 64) { context.beginPath(); context.moveTo(72, y); context.lineTo(width - 72, y); context.stroke(); }
  context.strokeStyle = "#e07f7f66"; context.beginPath(); context.moveTo(140, at.panel + 14); context.lineTo(140, at.panel + at.panelH - 14); context.stroke();
  fitText(context, [
    { text: "কাগজের উড়োজাহাজ", color: PAL.accent, weight: 800, display: true },
    ...(card.name ? [{ text: ` · ${card.name}`, color: PAL.ink, weight: 700, display: true }] : []),
    ...(stars ? [{ text: "  ", color: PAL.ink }, ...[0, 1, 2].map(star => ({ text: "★", color: star < stars ? "#e39b00" : "#cfc6b4", weight: 700 }))] : []),
  ], cx, at.title, 54, 880, "center");
  fitText(context, [{ text: bn(card.score), color: PAL.ink, weight: 800, display: true }, { text: " পয়েন্ট", color: PAL.accent, weight: 800, display: true }], cx, at.score, 160, 860, "center");
  fitText(context, [{ text: humanLine(card, wave.goal), color: PAL.ink, weight: 600 }], cx, at.line, 42, 880, "center");
  const dry = card.hits === 0 ? "একবারও ভেজেনি" : soaked ? "ভিজে গেছে" : `ভিজেছে ${bn(card.hits)} বার`;
  fitText(context, [
    { text: levelLabel(card.level), color: "#5a6478", weight: 600 },
    { text: `  ·  মেঘ ফাটল ${bn(card.popped)}টা  ·  রোদ ${bn(card.suns)}  ·  `, color: "#5a6478", weight: 600 },
    { text: dry, color: card.hits ? "#5a6478" : "#2f8a4c", weight: 700 },
  ], cx, at.stats, 32, 900, "center");

  drawFooterBand(context, format, "তোমার প্লেন শুকনো থাকবে?", site, { band: "#1f2a44", ask: "#ffd23f", site: "#ffffff" });
}

export const cardBlob = (card: Card, format: CardFormat, site: string) => renderCard(canvas => drawCard(canvas, card, format, site));

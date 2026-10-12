// The result card: the stage's ground, the top spinning on its ring (or on a palm), the seconds big, and the milestones.
import { cardSizes, drawFooterBand, fitText, renderCard, roundedRect, type CardFormat } from "../../../shared/card-canvas";
import { PAL, paintGround, paintPalm, paintSpots, paintTop } from "./art";
import { BADGES, LEVELS, starsOf, type Badge } from "./game";
import { bn, humanLine, secs, stageLabel, type Card } from "./result";

const layouts = {
  feed: { panel: 48, title: 128, score: 330, line: 420, stage: 478, panelH: 470, horizon: 600, cy: 1080, size: 400, chips: 1150 },
  story: { panel: 270, title: 350, score: 560, line: 652, stage: 710, panelH: 480, horizon: 900, cy: 1440, size: 470, chips: 1530 },
} as const;

export function drawCard(canvas: HTMLCanvasElement, card: Card, format: CardFormat, site: string) {
  const { width, height } = cardSizes[format], at = layouts[format];
  canvas.width = width; canvas.height = height;
  const context = canvas.getContext("2d");
  if (!context) throw new Error("এই ব্রাউজারে ছবি বানানো যাচ্ছে না।");
  const level = LEVELS[card.level - 1], cx = width / 2;
  paintGround(context, level.surface, card.level, width, height, at.horizon, cx, at.cy);

  // Motion rings round the spinning top.
  context.strokeStyle = "#ffffffb0"; context.lineCap = "round";
  for (let ring = 0; ring < 3; ring++) {
    context.lineWidth = 10 - ring * 3;
    context.beginPath(); context.ellipse(cx, at.cy - at.size * 0.5, at.size * (0.55 + ring * 0.12), at.size * (0.16 + ring * 0.04), 0, Math.PI * (1.08 + ring * 0.05), Math.PI * (1.6 + ring * 0.05)); context.stroke();
    context.beginPath(); context.ellipse(cx, at.cy - at.size * 0.5, at.size * (0.55 + ring * 0.12), at.size * (0.16 + ring * 0.04), 0, Math.PI * (0.08 + ring * 0.05), Math.PI * (0.55 + ring * 0.05)); context.stroke();
  }
  const topY = card.palm ? at.cy - at.size * 0.1 : at.cy;
  context.fillStyle = "#00000040"; context.beginPath(); context.ellipse(cx, at.cy, at.size * 0.18, at.size * 0.05, 0, 0, Math.PI * 2); context.fill();
  context.save(); context.translate(cx, topY); paintTop(context, at.size); paintSpots(context, at.size, 0.5, 0.6); context.restore();
  if (card.palm) paintPalm(context, cx, topY, at.size * 0.85);

  context.fillStyle = "#fff8ecf2"; roundedRect(context, 60, at.panel, width - 120, at.panelH, 36); context.fill();
  const earned = starsOf(card.score, card.level);
  fitText(context, [
    { text: "লাটিম", color: PAL.accent, weight: 800, display: true },
    ...(card.name ? [{ text: ` · ${card.name}`, color: PAL.ink, weight: 700, display: true }] : []),
    { text: ` · লেভেল ${bn(card.level)}`, color: PAL.ink, weight: 700, display: true },
    ...(earned ? [{ text: " ", color: PAL.ink }, ...[0, 1, 2].map(star => ({ text: "★", color: star < earned ? "#e39b00" : "#cfc6b4", weight: 700 }))] : []),
  ], cx, at.title, 54, 900, "center");
  fitText(context, [{ text: secs(card.score), color: PAL.ink, weight: 800, display: true }, { text: " সেকেন্ড", color: PAL.accent, weight: 800, display: true }], cx, at.score, 170, 880, "center");
  fitText(context, [{ text: humanLine(card.score), color: PAL.ink, weight: 600 }], cx, at.line, 44, 900, "center");
  fitText(context, [{ text: stageLabel(card.level), color: "#6b5a48", weight: 600 }, ...(card.palm ? [{ text: " · হাতে তুলে +৫", color: PAL.green, weight: 700 }] : [])], cx, at.stage, 34, 900, "center");

  // Milestones as chips, centred.
  // The best time milestone only, plus the skill ones: three chips at most, so one row always fits.
  const time: Badge | null = card.badges.includes("t30") ? "t30" : card.badges.includes("t20") ? "t20" : card.badges.includes("t10") ? "t10" : null;
  const chips = [time, ...card.badges.filter(id => id === "combo5" || id === "still")].flatMap(id => id ? [BADGES[id]] : []);
  if (chips.length) {
    context.font = `700 32px "Bangla"`;
    const widths = chips.map(text => context.measureText(text).width + 56), total = widths.reduce((sum, w) => sum + w, 0) + (chips.length - 1) * 16;
    let x = cx - Math.min(total, width - 80) / 2;
    chips.forEach((text, index) => {
      context.fillStyle = "#fff8ec"; roundedRect(context, x, at.chips, widths[index], 64, 32); context.fill();
      context.fillStyle = "#e39b00"; context.beginPath(); context.arc(x + 28, at.chips + 32, 10, 0, Math.PI * 2); context.fill();
      fitText(context, [{ text, color: PAL.ink, weight: 700 }], x + 46, at.chips + 43, 32, widths[index] - 56);
      x += widths[index] + 16;
    });
  }

  drawFooterBand(context, format, "তোমার লাটিম কতক্ষণ ঘুরবে?", site, { band: "#2b1d12", ask: "#ffd166", site: "#ffffff" });
}

export const cardBlob = (card: Card, format: CardFormat, site: string) => renderCard(canvas => drawCard(canvas, card, format, site));

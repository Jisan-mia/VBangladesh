// The result card: the flight's world, a big ruled-paper plane on its dotted flight line coming down onto the red ring,
// the লজেন্স it caught, and a panel of ruled exercise-book paper with the points and the flight's stats.
import { cardSizes, drawFooterBand, fitText, renderCard, roundedRect, type CardFormat } from "../../../shared/card-canvas";
import { levelOf, WORLDS } from "./levels";
import { bn, levelLabel, sharedStars, type Flight } from "./link";
import { PALETTES, PAPER, paintCandy, paintPlane } from "./paint";

const layouts = {
  feed: { panel: 48, title: 128, score: 300, line: 392, stats: 456, panelH: 460, plane: 900, size: 360, ground: 1130 },
  story: { panel: 270, title: 350, score: 524, line: 616, stats: 680, panelH: 470, plane: 1300, size: 440, ground: 1600 },
} as const;

function headline(flight: Flight) {
  if (flight.landing === 2) return "ঠিক মাঝখানে নামল";
  if (flight.landing === 1) return "প্লেন নামল";
  return "নামার আগেই পাতা শেষ";
}

export function drawCard(canvas: HTMLCanvasElement, flight: Flight, format: CardFormat, site: string) {
  const { width, height } = cardSizes[format], at = layouts[format];
  canvas.width = width; canvas.height = height;
  const context = canvas.getContext("2d");
  if (!context) throw new Error("এই ব্রাউজারে ছবি বানানো যাচ্ছে না।");
  const world = WORLDS[levelOf(flight.level).world], p = PALETTES[world.look], stars = sharedStars(flight);
  const sky = context.createLinearGradient(0, 0, 0, height);
  sky.addColorStop(0, p.sky[0]); sky.addColorStop(0.6, p.sky[1]); sky.addColorStop(1, p.sky[2]);
  context.fillStyle = sky; context.fillRect(0, 0, width, height);
  context.fillStyle = p.ground; context.fillRect(0, at.ground, width, height - at.ground);
  context.fillStyle = p.solid; context.fillRect(width * 0.58, at.ground - 90, width * 0.36, 90);
  context.fillStyle = p.solidDark; context.fillRect(width * 0.58, at.ground - 90, width * 0.36, 14);
  // The red ring on the landing place.
  context.strokeStyle = "#e63946"; context.lineWidth = 10;
  context.beginPath(); context.ellipse(width * 0.76, at.ground - 92, 90, 16, 0, 0, Math.PI * 2); context.stroke();

  // The flight line from the left edge down to the landing place, and the candies along it.
  const cx = width * 0.42, py = at.plane;
  context.strokeStyle = "#ffffffd0"; context.lineWidth = 9; context.lineCap = "round"; context.setLineDash([2, 26]);
  context.beginPath(); context.moveTo(-20, py + at.size * 0.2); context.bezierCurveTo(width * 0.12, py - at.size * 0.5, cx - at.size * 0.4, py - at.size * 0.35, cx - at.size * 0.2, py - 10); context.stroke();
  context.beginPath(); context.moveTo(cx + at.size * 0.35, py + 30); context.quadraticCurveTo(width * 0.66, py + 80, width * 0.76, at.ground - 100); context.stroke();
  context.setLineDash([]);
  for (let index = 0; index < Math.min(6, Math.max(1, flight.candies)); index++) {
    context.save(); context.translate(width * (0.04 + index * 0.042), py - at.size * (0.12 + 0.28 * Math.sin((Math.PI * (index + 1)) / 7))); paintCandy(context, 20); context.restore();
  }
  context.save(); context.translate(cx, py); context.rotate(0.16);
  context.fillStyle = "#1f2a4422"; context.beginPath(); context.ellipse(10, at.size * 0.32, at.size * 0.35, at.size * 0.05, 0, 0, Math.PI * 2); context.fill();
  paintPlane(context, at.size);
  context.restore();

  // The panel: ruled paper with a red margin, like the page the plane was folded from.
  context.fillStyle = "#fbfaf3f2"; roundedRect(context, 60, at.panel, width - 120, at.panelH, 36); context.fill();
  context.strokeStyle = PAPER.rule + "77"; context.lineWidth = 3;
  for (let y = at.panel + 96; y < at.panel + at.panelH - 20; y += 64) { context.beginPath(); context.moveTo(72, y); context.lineTo(width - 72, y); context.stroke(); }
  context.strokeStyle = PAPER.margin + "77"; context.beginPath(); context.moveTo(140, at.panel + 14); context.lineTo(140, at.panel + at.panelH - 14); context.stroke();
  fitText(context, [
    { text: "কাগজের উড়োজাহাজ", color: "#2f6fb3", weight: 800, display: true },
    ...(flight.name ? [{ text: ` · ${flight.name}`, color: "#1f2a44", weight: 700, display: true }] : []),
    ...(stars ? [{ text: "  ", color: "#1f2a44" }, ...[0, 1, 2].map(star => ({ text: "★", color: star < stars ? "#e39b00" : "#cfc6b4", weight: 700 }))] : []),
  ], width / 2, at.title, 54, 880, "center");
  fitText(context, [{ text: bn(flight.score), color: "#1f2a44", weight: 800, display: true }, { text: " পয়েন্ট", color: "#2f6fb3", weight: 800, display: true }], width / 2, at.score, 150, 860, "center");
  fitText(context, [{ text: headline(flight), color: flight.landing ? "#2f8a4c" : "#1f2a44", weight: 700 }], width / 2, at.line, 44, 880, "center");
  fitText(context, [
    { text: levelLabel(flight.level), color: "#5a6478", weight: 600 },
    { text: `  ·  লজেন্স ${bn(flight.candies)}টা`, color: "#5a6478", weight: 600 },
  ], width / 2, at.stats, 32, 900, "center");
  drawFooterBand(context, format, "তোমার প্লেন কতদূর যাবে?", site, { band: "#1f2a44", ask: "#ffd23f", site: "#ffffff" });
}

export const cardBlob = (flight: Flight, format: CardFormat, site: string) => renderCard(canvas => drawCard(canvas, flight, format, site));

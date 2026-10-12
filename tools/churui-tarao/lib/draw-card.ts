import { cardSizes, drawFooterBand, fitText, renderCard, wrapText, BODY_FONT, type CardFormat } from "../../../shared/card-canvas";
import { drawPaddy, drawScarecrow, drawSparrow, WINGS_DOWN, WINGS_UP } from "./art";
import { bn, humanLine, starsOf, type Shared } from "./game";

const INK = "#4a2410", CREAM = "#fff7e4", GOLD = "#ffe08a";

/** The field at golden hour, the কাকতাড়ুয়া standing guard, sparrows flying off, and the grain saved, big. */
export function drawCard(canvas: HTMLCanvasElement, shared: Shared, format: CardFormat, site: string) {
  const { width, height } = cardSizes[format];
  canvas.width = width; canvas.height = height;
  const context = canvas.getContext("2d");
  if (!context) throw new Error("এই ব্রাউজারে ছবি বানানো যাচ্ছে না।");
  // Feed positions; the story stretches them into its taller area (its footer band starts at 1660).
  const y = (feedY: number) => format === "feed" ? feedY : 120 + feedY * 1.228;
  const cx = width / 2, horizon = y(560);

  const sky = context.createLinearGradient(0, 0, 0, horizon);
  sky.addColorStop(0, "#e9836a"); sky.addColorStop(0.5, "#f6b072"); sky.addColorStop(1, "#ffe0a0");
  context.fillStyle = sky; context.fillRect(0, 0, width, horizon + 4);
  const glow = context.createRadialGradient(220, horizon - 50, 20, 220, horizon - 50, 380);
  glow.addColorStop(0, "#fff4c8"); glow.addColorStop(0.35, "#ffe29a88"); glow.addColorStop(1, "#ffd28a00");
  context.fillStyle = glow; context.fillRect(0, 0, width, horizon);
  context.fillStyle = "#fff6d6";
  context.beginPath(); context.arc(220, horizon - 44, 62, 0, Math.PI * 2); context.fill();

  // The village line.
  context.fillStyle = "#a07c4e";
  for (const [x, r] of [[60, 40], [400, 52], [500, 38], [700, 46], [1000, 56]]) { context.beginPath(); context.arc(x, horizon - r * 0.4, r, 0, Math.PI * 2); context.fill(); }
  context.fillStyle = "#8a6a40";
  for (const [x, top] of [[130, horizon - 130], [330, horizon - 150], [760, horizon - 120], [930, horizon - 140]]) {
    context.fillRect(x - 4, top, 8, horizon - top);
    for (let leaf = 0; leaf < 7; leaf++) { const a = -Math.PI / 2 + (leaf - 3) * 0.48; context.beginPath(); context.ellipse(x + Math.cos(a) * 26, top + Math.sin(a) * 17 + 8, 32, 7, a, 0, Math.PI * 2); context.fill(); }
  }

  const field = context.createLinearGradient(0, horizon, 0, height);
  field.addColorStop(0, "#f0c35c"); field.addColorStop(0.4, "#e0a63c"); field.addColorStop(1, "#bd8028");
  context.fillStyle = field; context.fillRect(0, horizon, width, height - horizon);
  context.strokeStyle = "#c8902e55"; context.lineWidth = 3;
  context.beginPath();
  for (let line = horizon + 6; line < height; line += 10 + (line - horizon) * 0.06) { context.moveTo(0, line); context.lineTo(width, line + 6); }
  context.stroke();
  for (let row = 0; row < 6; row++) {
    const rowY = horizon + 50 + row * (y(1240) - horizon - 50) / 5.5, size = 50 + row * 22, step = 70 + row * 18;
    for (let index = 0, x = (row * 41) % 50 - 30; x < width + 40; index++, x += step * (0.75 + ((index * 13 + row * 7) % 10) / 20)) {
      context.save(); context.translate(x, rowY + ((index * 7) % 5) * 4); drawPaddy(context, size, (((index * 5 + row) % 5) - 2) * 0.14, index + row * 11); context.restore();
    }
  }

  // The কাকতাড়ুয়া, pleased or fretting by how much was saved.
  context.save(); context.translate(810, y(1130)); drawScarecrow(context, y(1130) - y(560) + 70, shared.saved >= 70 ? 0 : shared.saved >= 40 ? 1 : 2); context.restore();

  // Sparrows flying off, up and away from the field: up to seven, as many as were shooed.
  const flock: Array<[number, number, number, number]> = [[90, 230, 70, 1], [960, 180, 64, -1], [150, 420, 56, 1], [1000, 400, 60, -1], [60, 560, 50, 1], [880, 300, 48, -1], [240, 160, 46, 1]];
  for (let index = 0; index < Math.min(flock.length, shared.shooed); index++) {
    const [x, at, size, facing] = flock[index];
    context.save(); context.translate(x, y(at)); context.scale(facing, 1); context.rotate(-0.2); drawSparrow(context, size, index % 2 ? WINGS_UP : WINGS_DOWN); context.restore();
  }

  // The title row also carries the field (level) and its stars, once there is more than the first field.
  const earned = starsOf(shared.saved, shared.level);
  fitText(context, [
    { text: "চড়ুই তাড়াও", color: INK, weight: 800, display: true },
    ...(shared.name ? [{ text: ` · ${shared.name}`, color: "#7a3a14", weight: 700, display: true }] : []),
    { text: ` · লেভেল ${bn(shared.level)}`, color: "#7a3a14", weight: 700, display: true },
    ...(earned ? [{ text: " ", color: INK }, ...[0, 1, 2].map(star => ({ text: "★", color: star < earned ? "#c98200" : "#fff7e4b0", weight: 700 }))] : []),
  ], cx, y(140), 52, 860, "center");
  fitText(context, [{ text: `${bn(shared.saved)}%`, color: "#5a2a10", weight: 800, display: true }], cx, y(330), 200, 700, "center");
  fitText(context, [{ text: "ধান বাঁচল", color: INK, weight: 800, display: true }], cx, y(410), 64, 700, "center");
  // The sparrows shooed, on a little paddy-gold ribbon.
  context.font = `700 40px ${BODY_FONT}`;
  const ribbon = `${bn(shared.shooed)}টা চড়ুই হুশ!`, ribbonWidth = Math.min(640, context.measureText(ribbon).width + 70);
  context.fillStyle = "#4a2410d9";
  context.beginPath(); context.roundRect(cx - ribbonWidth / 2, y(450), ribbonWidth, 64, 32); context.fill();
  fitText(context, [{ text: ribbon, color: GOLD, weight: 700 }], cx, y(450) + 45, 40, ribbonWidth - 40, "center");

  // The human line on a cream slip at the field's edge.
  context.font = `700 42px ${BODY_FONT}`;
  const lines = wrapText(context, humanLine(shared.saved), 560, 3);
  const slipTop = y(1250) - 70 - lines.length * 56;
  context.fillStyle = "#fff7e4ee";
  context.beginPath(); context.roundRect(64, slipTop, 620, lines.length * 56 + 44, 24); context.fill();
  lines.forEach((line, index) => fitText(context, [{ text: line, color: INK, weight: 700 }], 96, slipTop + 66 + index * 56, 42, 560));
  drawFooterBand(context, format, "তুমি কত বাঁচাবে?", site, { band: "#3a1d0e", ask: GOLD, site: CREAM });
}

export const cardBlob = (shared: Shared, format: CardFormat, site: string) => renderCard(canvas => drawCard(canvas, shared, format, site));

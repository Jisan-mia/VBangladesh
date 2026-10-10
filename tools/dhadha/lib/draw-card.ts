import { BODY_FONT, cardSizes, DISPLAY_FONT, drawFooterBand, fitText, renderCard, wrapText, type CardFormat } from "../../../shared/card-canvas";
import { dayLabel, humanLine, resultLine, riddleById, type Shared } from "./dhadha";

// কুপির আলোয় নানির শোলক: a dark night, a tin kupi lamp on an earthen ledge, and the riddle in নানি's speech bubble.
const FLAME = "#ffc35a";
const BUBBLE = "#fff1d6";
const INK = "#2b1a10";

function drawNight(context: CanvasRenderingContext2D, width: number, height: number) {
  const sky = context.createLinearGradient(0, 0, 0, height);
  sky.addColorStop(0, "#0e0b18");
  sky.addColorStop(0.7, "#22160f");
  sky.addColorStop(1, "#3a2414");
  context.fillStyle = sky;
  context.fillRect(0, 0, width, height);
  // Fixed stars, so the same card always looks the same.
  context.fillStyle = "#ffffff";
  for (let index = 0; index < 46; index++) {
    const x = (index * 397) % width, y = (index * 233) % Math.round(height * 0.55);
    context.globalAlpha = 0.25 + ((index * 7) % 10) / 20;
    context.beginPath(); context.arc(x, y, 1.5 + (index % 3), 0, Math.PI * 2); context.fill();
  }
  context.globalAlpha = 1;
}

function drawKupi(context: CanvasRenderingContext2D, x: number, base: number, scale: number) {
  const flameY = base - 230 * scale;
  const glow = context.createRadialGradient(x, flameY, 10, x, flameY, 460 * scale);
  glow.addColorStop(0, "rgba(255,190,90,.5)");
  glow.addColorStop(0.35, "rgba(255,150,60,.16)");
  glow.addColorStop(1, "rgba(255,150,60,0)");
  context.fillStyle = glow;
  context.fillRect(x - 480 * scale, flameY - 480 * scale, 960 * scale, 480 * scale + (base - flameY) + 20);
  context.save();
  context.translate(x, base);
  context.scale(scale, scale);
  // the pool of light on the ledge
  context.fillStyle = "rgba(255,170,80,.28)";
  context.beginPath(); context.ellipse(0, 2, 150, 16, 0, 0, Math.PI * 2); context.fill();
  // tin body with a shoulder, two soldered bands, neck and wick
  const tin = context.createLinearGradient(-58, 0, 58, 0);
  tin.addColorStop(0, "#463d35"); tin.addColorStop(0.35, "#a39787"); tin.addColorStop(0.6, "#6e6359"); tin.addColorStop(1, "#382f29");
  context.fillStyle = tin;
  context.beginPath();
  context.moveTo(-58, 0); context.lineTo(-52, -80); context.quadraticCurveTo(-50, -96, -30, -100);
  context.lineTo(-12, -122); context.lineTo(12, -122); context.lineTo(30, -100);
  context.quadraticCurveTo(50, -96, 52, -80); context.lineTo(58, 0); context.closePath();
  context.fill();
  context.fillStyle = "#2b241f";
  context.fillRect(-56, -22, 112, 6);
  context.fillRect(-53, -78, 106, 5);
  context.fillStyle = "#5a5047";
  context.fillRect(-10, -140, 20, 20);
  context.fillStyle = "#1d1712";
  context.fillRect(-3, -154, 6, 16);
  const flame = context.createLinearGradient(0, -290, 0, -150);
  flame.addColorStop(0, "#fff6d8");
  flame.addColorStop(0.5, FLAME);
  flame.addColorStop(1, "#e2601d");
  context.fillStyle = flame;
  context.beginPath();
  context.moveTo(0, -292);
  context.bezierCurveTo(30, -238, 36, -178, 0, -152);
  context.bezierCurveTo(-36, -178, -30, -238, 0, -292);
  context.fill();
  context.fillStyle = "#fffbea";
  context.beginPath();
  context.moveTo(0, -232); context.bezierCurveTo(12, -205, 12, -178, 0, -168); context.bezierCurveTo(-12, -178, -12, -205, 0, -232);
  context.fill();
  context.restore();
}

/** Splits a riddle line at the comma nearest its middle, the way it would be recited, then wraps what still doesn't fit. */
function breakLine(context: CanvasRenderingContext2D, line: string, maxWidth: number): string[] {
  if (context.measureText(line).width <= maxWidth) return [line];
  const commas = [...line.matchAll(/,\s*/g)].map(match => match.index! + 1).filter(index => index < line.length - 2);
  if (!commas.length) return wrapText(context, line, maxWidth, 3);
  const cut = commas.reduce((best, index) => (Math.abs(index - line.length / 2) < Math.abs(best - line.length / 2) ? index : best));
  return [line.slice(0, cut), line.slice(cut)].flatMap(part => wrapText(context, part.trim(), maxWidth, 2));
}
/** True when every row is a whole line or a comma half of one, i.e. nothing broke mid-phrase. */
function fitsWhole(rows: readonly string[], lines: readonly string[]) {
  const pieces = new Set(lines.flatMap(line => [line, ...[...line.matchAll(/,\s*/g)].flatMap(match => [line.slice(0, match.index! + 1).trim(), line.slice(match.index! + 1).trim()])]));
  return rows.every(row => pieces.has(row));
}

function drawBubble(context: CanvasRenderingContext2D, lines: readonly string[], top: number, maxHeight: number, tailX: number, maxSize: number) {
  const left = 84, width = 912, pad = 60;
  // Biggest size at which the riddle fits, preferring one where lines break only at commas, as it would be recited.
  const layout = (size: number) => {
    context.font = `700 ${size}px ${DISPLAY_FONT}`;
    const rows = lines.flatMap(line => breakLine(context, line, width - pad * 2));
    return { size, rows, fits: rows.length * size * 1.5 + pad * 2 <= maxHeight };
  };
  const sizes = Array.from({ length: (maxSize - 38) / 2 + 1 }, (_, index) => maxSize - index * 2);
  const { size, rows } = sizes.map(layout).find(option => option.fits && (option.size < 48 || fitsWhole(option.rows, lines))) ?? layout(38);
  const lineHeight = size * 1.5;
  const height = rows.length * lineHeight + pad * 2;
  context.fillStyle = BUBBLE;
  context.beginPath();
  context.roundRect(left, top, width, height, 44);
  context.moveTo(tailX + 20, top + height - 2);
  context.lineTo(tailX - 40, top + height + 76);
  context.lineTo(tailX + 110, top + height - 2);
  context.fill();
  context.fillStyle = INK;
  context.textAlign = "center";
  context.font = `700 ${size}px ${DISPLAY_FONT}`;
  rows.forEach((row, index) => context.fillText(row, left + width / 2, top + pad + size * 1.02 + index * lineHeight));
  context.textAlign = "left";
  return top + height + 76;
}

const layouts = {
  feed: { top: 70, bubbleTop: 196, bubbleMax: 600, maxSize: 68, kupiScale: 1.15 },
  story: { top: 300, bubbleTop: 430, bubbleMax: 820, maxSize: 78, kupiScale: 1.3 },
} as const;

export function drawCard(canvas: HTMLCanvasElement, shared: Shared, format: CardFormat, site: string, today: string) {
  const { width, height } = cardSizes[format];
  const layout = layouts[format];
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext("2d");
  if (!context) throw new Error("এই ব্রাউজারে ছবি বানানো যাচ্ছে না।");
  const riddle = riddleById(shared.id);
  if (!riddle) throw new RangeError("এই ধাঁধাটা তালিকায় নেই।");

  drawNight(context, width, height);
  const footerTop = format === "story" ? height - 260 : height - 96;
  // The earthen ledge (দাওয়া) the lamp sits on.
  const ledge = footerTop - 70;
  context.fillStyle = "#4a2d18";
  context.fillRect(0, ledge, width, footerTop - ledge);
  context.fillStyle = "#5e3a20";
  context.fillRect(0, ledge, width, 8);

  fitText(context, [{ text: "নানির শোলক", color: "#c9b28f", weight: 600 }], 84, layout.top, 30, 400);
  fitText(context, [{ text: dayLabel(shared.date, today), color: FLAME, weight: 800, display: true }], 84, layout.top + 78, 60, 912);
  const tailEnd = drawBubble(context, riddle.lines, layout.bubbleTop, layout.bubbleMax, 200, layout.maxSize);
  drawKupi(context, 200, ledge + 6, layout.kupiScale);
  // The result sits beside the lamp, centred in the space between the bubble's tail and the ledge.
  const middle = Math.max(tailEnd + 70, (tailEnd + ledge) / 2);
  fitText(context, [{ text: resultLine(shared.tries, shared.name), color: "#ffffff", weight: 800, display: true }], 380, middle - 10, 52, 620);
  context.font = `500 32px ${BODY_FONT}`;
  wrapText(context, humanLine(shared.tries), 620, 2).forEach((line, index) => fitText(context, [{ text: line, color: "#e8d7bd", weight: 500 }], 380, middle + 56 + index * 46, 32, 620));
  drawFooterBand(context, format, "উত্তর কমেন্টে লেখো!", site, { band: "#0b0811", ask: FLAME, site: "#ffffff" });
}

export const cardBlob = (shared: Shared, format: CardFormat, site: string, today: string) => renderCard(canvas => drawCard(canvas, shared, format, site, today));

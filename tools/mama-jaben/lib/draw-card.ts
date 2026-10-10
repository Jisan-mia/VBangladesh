import { cardSizes, drawFooterBand, fitText, loadCardFonts, renderCard, roundedRect, wrapText, DISPLAY_FONT, type CardFormat } from "../../../shared/card-canvas";
import { FARE_NOTE, bn, type CardContent, type Tier } from "./haggle";

const NIGHT = "#173c4a";
const NIGHT_DEEP = "#102b36";
const CREAM = "#f6efdc";
const AMBER = "#f0b429";
const TEAL = "#24607a";
const INK = "#17323d";
const RED = "#b8461f";
const MUTED = "#9fb7c0";
const stampInk: Record<Tier, string> = { fair: "#2e7d4f", mama: "#a8620c", dildar: TEAL, gone: RED };

const layouts = {
  feed: { kicker: 70, title: 132, plate: 236, plateH: 566, bubble: 846, line: 1010, gap: 58 },
  story: { kicker: 318, title: 392, plate: 500, plateH: 620, bubble: 1170, line: 1350, gap: 64 },
} as const;

/** A tin plate: brushed metal, a painted teal border, a cream field with chipped corners, four rivets. */
function drawPlate(context: CanvasRenderingContext2D, x: number, y: number, width: number, height: number) {
  const tin = context.createLinearGradient(x, y, x + width, y + height);
  tin.addColorStop(0, "#eef1f2");
  tin.addColorStop(0.35, "#c3cace");
  tin.addColorStop(0.6, "#e2e6e8");
  tin.addColorStop(1, "#b2bbc0");
  context.save();
  context.shadowColor = "#0008";
  context.shadowBlur = 30;
  context.shadowOffsetY = 14;
  context.fillStyle = tin;
  roundedRect(context, x, y, width, height, 22);
  context.fill();
  context.restore();
  // Brushed streaks, fixed positions so every card is identical for the same result.
  context.save();
  roundedRect(context, x, y, width, height, 22);
  context.clip();
  for (let i = 0; i < 70; i++) {
    context.fillStyle = i % 3 ? "#ffffff22" : "#5a666c18";
    context.fillRect(x, y + ((i * 53) % height), width, 1 + (i % 2));
  }
  context.restore();

  const inset = 30;
  context.fillStyle = TEAL;
  roundedRect(context, x + inset, y + inset, width - inset * 2, height - inset * 2, 16);
  context.fill();
  context.fillStyle = CREAM;
  roundedRect(context, x + inset + 16, y + inset + 16, width - (inset + 16) * 2, height - (inset + 16) * 2, 10);
  context.fill();
  // Paint chipped off at the edges shows the tin underneath.
  context.fillStyle = "#c7ced2";
  for (const [fx, fy, r] of [[0.06, 0.9, 16], [0.94, 0.12, 12], [0.5, 0.06, 9], [0.97, 0.7, 10], [0.03, 0.35, 8]]) {
    context.beginPath();
    context.ellipse(x + width * fx, y + height * fy, r * 1.6, r, 0.4, 0, Math.PI * 2);
    context.fill();
  }
  for (const [rx, ry] of [[x + 18, y + 18], [x + width - 18, y + 18], [x + 18, y + height - 18], [x + width - 18, y + height - 18]]) {
    const rivet = context.createRadialGradient(rx - 3, ry - 3, 1, rx, ry, 11);
    rivet.addColorStop(0, "#ffffff");
    rivet.addColorStop(1, "#7d878d");
    context.fillStyle = rivet;
    context.beginPath(); context.arc(rx, ry, 10, 0, Math.PI * 2); context.fill();
    context.fillStyle = "#a5532a55";
    context.beginPath(); context.arc(rx + 9, ry + 8, 6, 0, Math.PI * 2); context.fill();
  }
}

/** A faint rickshaw wheel low on the card, half hidden by the edge. */
function drawWheel(context: CanvasRenderingContext2D, cx: number, cy: number, r: number) {
  context.save();
  context.strokeStyle = "#ffffff14";
  context.lineWidth = 22;
  context.beginPath(); context.arc(cx, cy, r, 0, Math.PI * 2); context.stroke();
  context.lineWidth = 4;
  for (let i = 0; i < 18; i++) {
    const angle = (i / 18) * Math.PI * 2;
    context.beginPath(); context.moveTo(cx, cy); context.lineTo(cx + Math.cos(angle) * r, cy + Math.sin(angle) * r); context.stroke();
  }
  context.beginPath(); context.arc(cx, cy, 30, 0, Math.PI * 2); context.stroke();
  context.restore();
}

/** The rickshaw's back rail the plate hangs from, with two wire hooks. */
function drawRail(context: CanvasRenderingContext2D, x: number, y: number, width: number) {
  context.strokeStyle = "#8d989e";
  context.lineWidth = 5;
  for (const hx of [x + width * 0.22, x + width * 0.78]) {
    context.beginPath(); context.moveTo(hx, y - 34); context.lineTo(hx, y + 14); context.stroke();
  }
  context.fillStyle = "#0c222b";
  roundedRect(context, x - 20, y - 48, width + 40, 18, 9);
  context.fill();
}

function drawStamp(context: CanvasRenderingContext2D, text: string, tier: Tier, cx: number, cy: number) {
  const color = stampInk[tier];
  context.save();
  context.translate(cx, cy);
  context.rotate(-0.2);
  context.globalAlpha = 0.86;
  context.strokeStyle = color;
  context.lineWidth = 7;
  context.beginPath(); context.arc(0, 0, 92, 0, Math.PI * 2); context.stroke();
  context.lineWidth = 3;
  context.beginPath(); context.arc(0, 0, 78, 0, Math.PI * 2); context.stroke();
  const words = text.split(" ");
  const lines = words.length > 1 ? [words.slice(0, -1).join(" "), words[words.length - 1]] : [text];
  lines.forEach((line, index) => fitText(context, [{ text: line, color, weight: 800, display: true }], 0, (index - (lines.length - 1) / 2) * 44 + 14, 40, 132, "center"));
  context.restore();
}

export function drawCard(canvas: HTMLCanvasElement, card: CardContent, format: CardFormat, site: string) {
  const { width, height } = cardSizes[format];
  const layout = layouts[format];
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext("2d");
  if (!context) throw new Error("এই ব্রাউজারে ছবি বানানো যাচ্ছে না।");

  const sky = context.createLinearGradient(0, 0, 0, height);
  sky.addColorStop(0, NIGHT);
  sky.addColorStop(1, NIGHT_DEEP);
  context.fillStyle = sky;
  context.fillRect(0, 0, width, height);
  // The street lamp's glow from the corner.
  const glow = context.createRadialGradient(width - 120, 40, 10, width - 120, 40, 520);
  glow.addColorStop(0, "#f0b42955");
  glow.addColorStop(1, "#f0b42900");
  context.fillStyle = glow;
  context.fillRect(0, 0, width, height);

  drawWheel(context, width - 60, height - (format === "story" ? 360 : 230), 300);
  fitText(context, [{ text: "মামা, যাবেন?", color: AMBER, weight: 700, display: true }], 84, layout.kicker, 32, 600);
  fitText(context, [{ text: card.title, color: CREAM, weight: 800, display: true }], 84, layout.title, 66, 912);

  const px = 84;
  const pw = 912;
  const py = layout.plate;
  const ph = layout.plateH;
  drawRail(context, px, py, pw);
  drawPlate(context, px, py, pw, ph);
  const cx = width / 2;
  const story = format === "story";
  fitText(context, [{ text: card.route, color: INK, weight: 800, display: true }], cx, py + 128, 62, 740, "center");
  context.fillStyle = TEAL;
  context.fillRect(px + 140, py + 162, pw - 280, 6);
  if (card.fare) {
    fitText(context, [{ text: bn(card.fare), color: RED, weight: 800, display: true }], cx, py + (story ? 380 : 350), story ? 240 : 220, 560, "center");
    fitText(context, [{ text: "টাকায় রাজি", color: INK, weight: 700, display: true }], cx, py + (story ? 468 : 434), 70, 520, "center");
  } else {
    fitText(context, [{ text: card.headline, color: RED, weight: 800, display: true }], cx, py + (story ? 350 : 322), 104, 700, "center");
  }
  fitText(context, [{ text: card.rounds, color: TEAL, weight: 700 }], cx, py + ph - (story ? 64 : 58), 40, 300, "center");
  drawStamp(context, card.stamp, card.tier, px + pw - 140, py + ph - 128);

  // Mama's last word in a speech bubble, tail pointing back up at the plate.
  const bubbleY = layout.bubble;
  context.font = `600 40px ${DISPLAY_FONT}`;
  const quote = `“${card.mama}”`;
  const bubbleW = Math.min(912, context.measureText(quote).width + 80 + 120);
  context.fillStyle = "#ffffff";
  roundedRect(context, 84, bubbleY, bubbleW, 104, 26);
  context.fill();
  context.beginPath(); context.moveTo(130, bubbleY + 2); context.lineTo(150, bubbleY - 26); context.lineTo(180, bubbleY + 2); context.fill();
  fitText(context, [{ text: quote, color: INK, weight: 600, display: true }, { text: "  — মামা", color: TEAL, weight: 600 }], 124, bubbleY + 66, 40, bubbleW - 80);

  let y = layout.line;
  context.font = `700 46px ${DISPLAY_FONT}`;
  for (const row of wrapText(context, card.line, 912, 2)) {
    fitText(context, [{ text: row, color: CREAM, weight: 700, display: true }], 84, y, 46, 912);
    y += layout.gap;
  }
  if (card.compare) { fitText(context, [{ text: card.compare, color: AMBER, weight: 700 }], 84, y + 8, 40, 912); y += layout.gap; }
  fitText(context, [{ text: FARE_NOTE, color: MUTED, weight: 500 }], 84, y + 24, 26, 912);

  drawFooterBand(context, format, "তুমি কত টাকায় রাজি করাতে পারবে?", site, { band: "#0b2029", ask: AMBER, site: "#ffffff" });
}

export async function prepareCard(sample: string) {
  await loadCardFonts(sample);
}

export function cardBlob(card: CardContent, format: CardFormat, site: string) {
  return renderCard(canvas => drawCard(canvas, card, format, site));
}

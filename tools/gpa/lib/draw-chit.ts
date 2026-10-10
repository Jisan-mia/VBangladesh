import { BODY_FONT, DISPLAY_FONT, cardSizes, drawFooterBand, fitText, renderCard, roundedRect, wrapText, type CardFormat } from "../../../shared/card-canvas";
import { bnGpa, chitHeading, humanLine, score, thanks, type Result } from "./gpa";

const INK = "#22306b";
const INK_SOFT = "#5b6596";
const RED_PEN = "#d1372b";
const GREEN = "#1f6f5c";
const PAPER = "#fffdf4";

// Deterministic speckle so the cork looks the same in the preview and the download.
function cork(context: CanvasRenderingContext2D, width: number, height: number) {
  context.fillStyle = "#c79560";
  context.fillRect(0, 0, width, height);
  let seed = 7;
  const random = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
  const tones = ["#a8733f", "#d9ae7a", "#b9834d", "#e4c093", "#9a6534"];
  for (let i = 0; i < 4200; i++) {
    context.fillStyle = tones[i % tones.length];
    const size = 2 + random() * 5;
    context.fillRect(random() * width, random() * height, size, size * (0.5 + random()));
  }
  // Wooden frame of the school notice board.
  context.strokeStyle = "#6b3f1f";
  context.lineWidth = 44;
  context.strokeRect(0, 0, width, height);
  context.strokeStyle = "#8a5630";
  context.lineWidth = 6;
  context.strokeRect(25, 25, width - 50, height - 50);
}

function pin(context: CanvasRenderingContext2D, x: number, y: number, color = RED_PEN, radius = 22) {
  context.fillStyle = "#00000033";
  context.beginPath(); context.ellipse(x + 8, y + 10, radius, radius * 0.8, 0, 0, Math.PI * 2); context.fill();
  context.fillStyle = color;
  context.beginPath(); context.arc(x, y, radius, 0, Math.PI * 2); context.fill();
  context.fillStyle = "#ffffff66";
  context.beginPath(); context.arc(x - radius * 0.35, y - radius * 0.35, radius * 0.3, 0, Math.PI * 2); context.fill();
}

/** Faded notices behind the chit, so it reads as a real board; blank on purpose (no board name, roll or seal). */
function oldNotice(context: CanvasRenderingContext2D, x: number, y: number, width: number, height: number, angle: number, fill: string) {
  context.save();
  context.translate(x, y); context.rotate(angle);
  context.fillStyle = "#00000022"; context.fillRect(-width / 2 + 8, -height / 2 + 10, width, height);
  context.fillStyle = fill; context.fillRect(-width / 2, -height / 2, width, height);
  context.strokeStyle = "#00000018"; context.lineWidth = 8;
  for (let line = -height / 2 + 60; line < height / 2 - 30; line += 34) {
    context.beginPath(); context.moveTo(-width / 2 + 34, line); context.lineTo(width / 2 - 34 - ((line * 7) % 60), line); context.stroke();
  }
  context.restore();
  pin(context, x, y - height / 2 + 26, "#2f6fb5", 15);
}

function ribbon(context: CanvasRenderingContext2D, x: number, y: number, radius: number, top: string, bottom: string) {
  context.fillStyle = GREEN;
  for (const side of [-1, 1]) {
    context.beginPath();
    context.moveTo(x + side * radius * 0.2, y);
    context.lineTo(x + side * radius * 0.85, y + radius * 2.1);
    context.lineTo(x + side * radius * 0.5, y + radius * 1.85);
    context.lineTo(x + side * radius * 0.25, y + radius * 2.15);
    context.lineTo(x - side * radius * 0.2, y + radius * 0.4);
    context.fill();
  }
  context.fillStyle = "#e6b422";
  context.beginPath();
  for (let i = 0; i < 24; i++) {
    const angle = (i / 24) * Math.PI * 2, r = i % 2 ? radius : radius * 0.9;
    context.lineTo(x + Math.cos(angle) * r, y + Math.sin(angle) * r);
  }
  context.fill();
  context.fillStyle = GREEN;
  context.beginPath(); context.arc(x, y, radius * 0.74, 0, Math.PI * 2); context.fill();
  if (top) fitText(context, [{ text: top, color: "#fff7d6", weight: 600 }], x, y - radius * 0.1, radius * 0.3, radius * 1.2, "center");
  fitText(context, [{ text: bottom, color: "#ffffff", weight: 800, display: true }], x, y + radius * (top ? 0.38 : 0.14), radius * (top ? 0.48 : 0.36), radius * 1.25, "center");
}

const layouts = {
  feed: { cx: 540, cy: 640, w: 780, h: 900, scale: 1 },
  story: { cx: 540, cy: 950, w: 900, h: 1080, scale: 1.25 },
} as const;

export function drawChit(canvas: HTMLCanvasElement, result: Result, format: CardFormat, site: string) {
  const { width, height } = cardSizes[format];
  const layout = layouts[format];
  const s = layout.scale;
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext("2d");
  if (!context) throw new Error("এই ব্রাউজারে ছবি বানানো যাচ্ছে না।");
  const value = score(result);

  cork(context, width, height);
  if (format === "feed") {
    oldNotice(context, 170, 150, 300, 230, -0.08, "#f3efe4");
    oldNotice(context, 930, 1110, 280, 260, 0.07, "#fbe7a1");
  } else {
    oldNotice(context, 180, 330, 300, 260, -0.08, "#f3efe4");
    oldNotice(context, 920, 1530, 280, 240, 0.06, "#fbe7a1");
  }

  // The chit, slightly crooked, pinned at the top.
  const { w, h } = layout;
  context.save();
  context.translate(layout.cx, layout.cy);
  context.rotate(-0.035);
  context.fillStyle = "#00000040";
  context.fillRect(-w / 2 + 14, -h / 2 + 18, w, h);
  context.fillStyle = PAPER;
  context.fillRect(-w / 2, -h / 2, w, h);
  context.strokeStyle = "#cfdcf0"; context.lineWidth = 2;
  for (let y = -h / 2 + 120; y < h / 2 - 20; y += 52 * s) { context.beginPath(); context.moveTo(-w / 2, y); context.lineTo(w / 2, y); context.stroke(); }
  context.strokeStyle = "#efa9a1"; context.lineWidth = 3;
  context.beginPath(); context.moveTo(-w / 2 + 70, -h / 2); context.lineTo(-w / 2 + 70, h / 2); context.stroke();

  const textWidth = w - 180;
  let y = -h / 2 + 150 * s;
  const name = result.name || "আমার রেজাল্ট";
  fitText(context, [{ text: name, color: INK, weight: 800, display: true }], 30, y, 70 * s, textWidth, "center");
  y += 66 * s;
  fitText(context, [{ text: chitHeading(result), color: INK_SOFT, weight: 600 }], 30, y, 38 * s, textWidth, "center");

  if (value.failed) {
    y += 150 * s;
    context.font = `800 ${100 * s}px ${DISPLAY_FONT}`;
    for (const line of wrapText(context, "পরের বার দেখিয়ে দেব", textWidth, 2)) {
      fitText(context, [{ text: line, color: INK, weight: 800, display: true }], 30, y, 100 * s, textWidth, "center");
      y += 116 * s;
    }
    y += 10 * s;
    fitText(context, [{ text: humanLine(value), color: RED_PEN, weight: 700 }], 30, y, 44 * s, textWidth, "center");
  } else {
    y += 110 * s;
    fitText(context, [{ text: "জিপিএ", color: INK_SOFT, weight: 700 }], 30, y, 46 * s, textWidth, "center");
    y += 235 * s;
    fitText(context, [{ text: bnGpa(value.gpa), color: INK, weight: 800, display: true }], 30, y, 230 * s, textWidth, "center");
    // The teacher's red-pen circle round the number.
    context.strokeStyle = RED_PEN; context.lineWidth = 7; context.lineCap = "round";
    context.beginPath(); context.ellipse(30, y - 76 * s, 280 * s, 122 * s, -0.05, 0.15, Math.PI * 2 - 0.05); context.stroke();
    y += 120 * s;
    context.font = `600 ${44 * s}px ${BODY_FONT}`;
    for (const line of wrapText(context, humanLine(value), textWidth, 2)) {
      fitText(context, [{ text: line, color: INK, weight: 600 }], 30, y, 44 * s, textWidth, "center");
      y += 60 * s;
    }
  }

  const line = thanks.find(item => item.id === result.thanks);
  if (line) {
    y += 30 * s;
    context.font = `700 ${36 * s}px ${BODY_FONT}`;
    const chip = Math.min(textWidth, context.measureText(line.label).width + 70 * s);
    roundedRect(context, 30 - chip / 2, y - 50 * s, chip, 72 * s, 36 * s);
    context.fillStyle = "#fde7a6"; context.fill();
    fitText(context, [{ text: line.label, color: "#6b3f1f", weight: 700 }], 30, y, 36 * s, chip - 40, "center");
  }
  context.restore();

  pin(context, layout.cx - 10, layout.cy - h / 2 + 30, RED_PEN, 26 * s);
  if (!value.failed) ribbon(context, layout.cx + w / 2 - 60, layout.cy - h / 2 + 40, 92 * s, value.gpa >= 5 ? "জিপিএ" : "", value.gpa >= 5 ? "৫.০০" : "অভিনন্দন");
  drawFooterBand(context, format, "তোমার রেজাল্টের দিনটা কেমন ছিল?", site, { band: "#3d2614", ask: "#ffd166", site: "#ffffff" });
}

export const chitBlob = (result: Result, format: CardFormat, site: string) => renderCard(canvas => drawChit(canvas, result, format, site));

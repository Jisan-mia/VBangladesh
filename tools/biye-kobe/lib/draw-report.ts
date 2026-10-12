import { BODY_FONT, DISPLAY_FONT, cardSizes, drawFooterBand, fitText, renderCard, roundedRect, wrapText, type CardFormat } from "../../../shared/card-canvas";
import { bn, questions, QUESTION_COUNT, type Report } from "./report";

const INK = "#2b2420";
const MUTED = "#7a6a58";
const RED = "#a8322d";
const STAMP = "#5b3f9e";
const PAPER = "#fbf6e8";
const FOLDER = "#d9bb7c";
const FOLDER_EDGE = "#b08e4c";

// The ghotok's cloth jhola under the file: a gamchha-style check.
function drawCloth(context: CanvasRenderingContext2D, width: number, height: number) {
  context.fillStyle = "#7e2622";
  context.fillRect(0, 0, width, height);
  context.globalAlpha = 0.55;
  context.fillStyle = "#2c5a36";
  for (let x = 30; x < width; x += 180) context.fillRect(x, 0, 56, height);
  for (let y = 30; y < height; y += 180) context.fillRect(0, y, width, 56);
  context.globalAlpha = 0.28;
  context.fillStyle = "#f3e2c0";
  for (let x = 120; x < width; x += 180) context.fillRect(x, 0, 6, height);
  for (let y = 120; y < height; y += 180) context.fillRect(0, y, width, 6);
  context.globalAlpha = 1;
}

function drawFolder(context: CanvasRenderingContext2D, x: number, y: number, width: number, height: number) {
  context.save();
  context.shadowColor = "rgba(0,0,0,.35)"; context.shadowBlur = 30; context.shadowOffsetY = 12;
  context.fillStyle = FOLDER;
  roundedRect(context, x + 40, y - 46, 330, 70, 16); context.fill();
  roundedRect(context, x, y, width, height, 14); context.fill();
  context.restore();
  context.strokeStyle = FOLDER_EDGE; context.lineWidth = 3;
  roundedRect(context, x, y, width, height, 14); context.stroke();
  fitText(context, [{ text: "ঘটকের ফাইল", color: "#5a4420", weight: 700, display: true }], x + 205, y - 6, 34, 290, "center");
}

// লাল ফিতা: every Bangladeshi office file is tied with one.
function drawRibbon(context: CanvasRenderingContext2D, x: number, y: number) {
  context.fillStyle = RED;
  context.fillRect(x - 14, y - 70, 28, 140);
  context.strokeStyle = RED; context.lineWidth = 12; context.lineCap = "round";
  context.beginPath(); context.ellipse(x - 30, y - 6, 30, 16, -0.4, 0, Math.PI * 2); context.stroke();
  context.beginPath(); context.ellipse(x + 26, y + 10, 28, 15, 0.5, 0, Math.PI * 2); context.stroke();
  context.beginPath(); context.moveTo(x, y); context.lineTo(x - 22, y + 70); context.moveTo(x, y); context.lineTo(x + 18, y + 76); context.stroke();
  context.fillStyle = "#7d201c"; context.beginPath(); context.arc(x, y, 13, 0, Math.PI * 2); context.fill();
}

// The ghotok's black umbrella, folded, crook handle up.
function drawUmbrella(context: CanvasRenderingContext2D, x: number, y: number, scale: number) {
  context.save();
  context.translate(x, y); context.rotate(-0.42); context.scale(scale, scale);
  context.fillStyle = "#1f1b1a";
  context.beginPath(); context.moveTo(-16, 0); context.quadraticCurveTo(-26, 120, -4, 250); context.lineTo(4, 250); context.quadraticCurveTo(26, 120, 16, 0); context.closePath(); context.fill();
  context.strokeStyle = "#3a3330"; context.lineWidth = 2;
  context.beginPath(); context.moveTo(-6, 20); context.lineTo(-2, 240); context.moveTo(6, 20); context.lineTo(2, 240); context.stroke();
  context.fillStyle = "#c9c2b8"; context.fillRect(-3, 250, 6, 36);
  context.strokeStyle = "#6b3f1f"; context.lineWidth = 11; context.lineCap = "round";
  context.beginPath(); context.moveTo(0, 0); context.lineTo(0, -40); context.arc(-24, -40, 24, 0, Math.PI, true); context.stroke();
  context.restore();
}

function drawStamp(context: CanvasRenderingContext2D, x: number, y: number, size: number) {
  context.save();
  context.translate(x, y); context.rotate(-0.16);
  context.globalAlpha = 0.86;
  context.strokeStyle = STAMP;
  context.lineWidth = 6; roundedRect(context, -size * 1.6, -size * 0.75, size * 3.2, size * 1.5, 18); context.stroke();
  context.lineWidth = 2.5; roundedRect(context, -size * 1.6 + 12, -size * 0.75 + 12, size * 3.2 - 24, size * 1.5 - 24, 10); context.stroke();
  fitText(context, [{ text: "ঘটকের সিল", color: STAMP, weight: 800, display: true }], 0, size * 0.32, size, size * 2.7, "center");
  context.restore();
}

function label(context: CanvasRenderingContext2D, text: string, x: number, y: number, size: number) {
  fitText(context, [{ text, color: RED, weight: 700 }], x, y, size, 600);
}

function lines(context: CanvasRenderingContext2D, text: string, x: number, y: number, size: number, step: number, maxWidth: number, maxLines: number, color: string, display = false) {
  context.font = `${display ? 800 : 600} ${size}px ${display ? DISPLAY_FONT : BODY_FONT}`;
  const rows = wrapText(context, text, maxWidth, maxLines);
  rows.forEach((row, index) => fitText(context, [{ text: row, color, weight: display ? 800 : 600, display }], x, y + index * step, size, maxWidth));
  return y + (rows.length - 1) * step;
}

const layouts = {
  feed: { folder: [56, 108, 968, 1110], title: 74, timing: 64, body: 38, label: 28, gap: 1 },
  story: { folder: [56, 330, 968, 1300], title: 84, timing: 72, body: 42, label: 30, gap: 1 },
} as const;

export function drawReport(canvas: HTMLCanvasElement, report: Report, format: CardFormat, site: string) {
  const { width, height } = cardSizes[format];
  const layout = layouts[format];
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext("2d");
  if (!context) throw new Error("এই ব্রাউজারে ছবি বানানো যাচ্ছে না।");
  const [fx, fy, fw, fh] = layout.folder;
  const g = layout.gap;
  drawCloth(context, width, height);
  drawFolder(context, fx, fy, fw, fh);

  // The typed sheet, tilted a hair as if just pulled from the file.
  const left = fx + 64, right = fx + fw - 64, textWidth = right - left - 30;
  context.save();
  context.translate(width / 2, fy + fh / 2); context.rotate(-0.008); context.translate(-width / 2, -(fy + fh / 2));
  context.fillStyle = PAPER;
  context.shadowColor = "rgba(60,40,10,.25)"; context.shadowBlur = 14; context.shadowOffsetY = 4;
  context.fillRect(fx + 34, fy + 30, fw - 68, fh - 60);
  context.shadowColor = "transparent";

  let y = fy + 92;
  fitText(context, [{ text: "ঘটক অফিস · গোপন রিপোর্ট", color: MUTED, weight: 600 }], left, y, 26, 440);
  fitText(context, [{ text: `ফাইল নং ঘ-${report.fileNo}`, color: MUTED, weight: 600 }], right, y, 26, 360, "right");
  y += 26;
  context.strokeStyle = INK; context.lineWidth = 3;
  context.beginPath(); context.moveTo(left, y); context.lineTo(right, y); context.moveTo(left, y + 8); context.lineTo(right, y + 8); context.stroke();
  y += 90 * g;
  fitText(context, [{ text: "কবে বিয়ে হবে?", color: INK, weight: 800, display: true }], left, y, layout.title, textWidth);
  // The story's lower half holds the interview sheet, so its stamp goes beside the title.
  if (format === "story") drawStamp(context, right - 130, y - 24, 56);

  y += 80 * g;
  fitText(context, [{ text: "নাম:", color: MUTED, weight: 600 }], left, y, layout.body - 4, 120);
  context.strokeStyle = "#b9a98f"; context.lineWidth = 2; context.setLineDash([4, 8]);
  context.beginPath(); context.moveTo(left + 96, y + 10); context.lineTo(right, y + 10); context.stroke(); context.setLineDash([]);
  if (report.name) fitText(context, [{ text: report.name, color: INK, weight: 700 }], left + 104, y, layout.body + 4, textWidth - 110);

  y += 84 * g;
  label(context, "সম্ভাব্য সময়", left, y, layout.label);
  y += layout.timing + 14;
  if (report.timing) y = lines(context, report.timing.text, left, y, layout.timing, layout.timing * 1.28, textWidth, 3, INK, true);
  else fitText(context, [{ text: "ঘটক এখনো লিখছেন…", color: "#b3a48c", weight: 700, display: true }], left, y, layout.timing - 8, textWidth);

  y += 78 * g;
  label(context, "কারণ", left, y, layout.label);
  y += layout.body + 14;
  const reason = report.timing ? report.reason : `আর ${bn(QUESTION_COUNT - report.answered)}টা প্রশ্নের উত্তর বাকি`;
  y = lines(context, reason, left, y, layout.body, layout.body * 1.4, textWidth, 2, report.timing ? INK : "#b3a48c");

  if (report.line) {
    y += 70 * g;
    label(context, "ঘটকের মন্তব্য", left, y, layout.label);
    y += layout.body + 10;
    y = lines(context, report.line, left, y, layout.body - 4, (layout.body - 4) * 1.4, textWidth, 2, "#4a3d33");
  }

  // The story is the whole file: the six answers typed out as the interview sheet.
  if (format === "story") {
    y += 64;
    label(context, "জিজ্ঞাসাবাদ", left, y, layout.label);
    context.strokeStyle = "#e3d8c2"; context.lineWidth = 2;
    questions.forEach((question, index) => {
      const answer = report.answers[index];
      const rowY = y + 56 + index * 52;
      fitText(context, [{ text: `${bn(index + 1)}. ${question.short}:`, color: MUTED, weight: 600 }], left, rowY, 30, 300);
      fitText(context, [{ text: answer === null || answer === undefined ? "…" : question.chips[answer], color: INK, weight: 700 }], left + 310, rowY, 32, textWidth - 310);
      context.beginPath(); context.moveTo(left, rowY + 18); context.lineTo(right, rowY + 18); context.stroke();
    });
  }

  const bottom = fy + fh - 60;
  if (format === "feed") drawStamp(context, left + 150, bottom - 92, 58);
  context.restore();

  drawRibbon(context, fx + fw - 6, fy + fh * 0.42);
  drawUmbrella(context, fx + fw - 120, fy + fh - 300, format === "story" ? 1.05 : 0.95);
  drawFooterBand(context, format, "তোমার রিপোর্টে কী লেখা?", site, { band: "#2a1714", ask: "#f6c85f", site: "#ffffff" });
}

export const cardBlob = (report: Report, format: CardFormat, site: string) => renderCard(canvas => drawReport(canvas, report, format, site));

import { cardSizes, drawFooterBand, fitText, renderCard, wrapText, DISPLAY_FONT, type CardFormat } from "../../../shared/card-canvas";
import { countdown, type CardView, type Sheet } from "./chithi";

export const colors = {
  desk: "#1e3460", cream: "#fdf3dc", envelope: "#f0c04a", envelopeBack: "#d49b2e", envelopeEdge: "#b98322",
  paper: "#e8f1fc", rule: "#b3cae8", margin: "#e3877e", ink: "#1d3a8a", inkSoft: "#4a5f99", red: "#c8352e", blue: "#2a4b9b", seal: "#b3261e",
} as const;

const FOOTER = { band: "#14244a", ask: "#f0c04a", site: "#ffffff" };

/** Red-and-blue airmail chevrons round the card's edge. */
function drawAirmail(context: CanvasRenderingContext2D, width: number, height: number, band: number) {
  context.save();
  context.beginPath();
  context.rect(0, 0, width, height);
  context.rect(band, band, width - band * 2, height - band * 2);
  context.clip("evenodd");
  context.fillStyle = "#fffaf0";
  context.fillRect(0, 0, width, height);
  context.translate(width / 2, height / 2);
  context.rotate(-Math.PI / 4);
  const step = 36, reach = width + height;
  for (let x = -reach, index = 0; x < reach; x += step * 2, index++) {
    context.fillStyle = index % 2 ? colors.blue : colors.red;
    context.fillRect(x, -reach, step, reach * 2);
  }
  context.restore();
}

/** A perforated stamp: white paper with scalloped edges bitten out in the envelope's colour, and a little picture. */
function drawStamp(context: CanvasRenderingContext2D, x: number, y: number, width: number, height: number, kind: "shapla" | "ilish", turn: number) {
  context.save();
  context.translate(x + width / 2, y + height / 2);
  context.rotate(turn);
  context.translate(-width / 2, -height / 2);
  context.shadowColor = "rgba(80,50,0,.25)"; context.shadowBlur = 6; context.shadowOffsetY = 3;
  context.fillStyle = "#fffdf6";
  context.fillRect(0, 0, width, height);
  context.shadowColor = "transparent";
  context.fillStyle = colors.envelope;
  const bite = 6, gap = 17;
  for (let px = gap / 2; px < width; px += gap) for (const py of [0, height]) { context.beginPath(); context.arc(px, py, bite, 0, Math.PI * 2); context.fill(); }
  for (let py = gap / 2; py < height; py += gap) for (const px of [0, width]) { context.beginPath(); context.arc(px, py, bite, 0, Math.PI * 2); context.fill(); }
  const inset = 14, innerW = width - inset * 2, innerH = height - inset * 2 - 26;
  context.fillStyle = kind === "shapla" ? "#2f7d57" : "#3a6fb5";
  context.fillRect(inset, inset, innerW, innerH);
  const cx = width / 2, cy = inset + innerH / 2;
  if (kind === "shapla") {
    // The water lily, Bangladesh's national flower, on a green pond.
    context.fillStyle = "#f4f7ef";
    for (let petal = 0; petal < 7; petal++) {
      context.save(); context.translate(cx, cy + 10); context.rotate(-Math.PI / 2 + (petal - 3) * 0.38);
      context.beginPath(); context.ellipse(0, -22, 8, 22, 0, 0, Math.PI * 2); context.fill(); context.restore();
    }
    context.fillStyle = "#f2c94c"; context.beginPath(); context.arc(cx, cy + 6, 7, 0, Math.PI * 2); context.fill();
    context.fillStyle = "#1f5e40"; context.beginPath(); context.ellipse(cx, cy + 22, 36, 8, 0, 0, Math.PI * 2); context.fill();
  } else {
    // An ilish, silver on river blue.
    context.fillStyle = "#e6ecf3";
    context.beginPath(); context.ellipse(cx - 4, cy, 30, 13, 0, 0, Math.PI * 2); context.fill();
    context.beginPath(); context.moveTo(cx + 22, cy); context.lineTo(cx + 40, cy - 13); context.lineTo(cx + 40, cy + 13); context.closePath(); context.fill();
    context.fillStyle = "#1d2b53"; context.beginPath(); context.arc(cx - 24, cy - 3, 3, 0, Math.PI * 2); context.fill();
    context.strokeStyle = "#ffffff99"; context.lineWidth = 2;
    context.beginPath(); context.moveTo(cx - 28, cy + 6); context.quadraticCurveTo(cx, cy + 12, cx + 22, cy + 3); context.stroke();
  }
  fitText(context, [{ text: kind === "shapla" ? "৳ ১০" : "৳ ২৫", color: "#1d2b53", weight: 700 }], width / 2, height - inset - 4, 20, innerW, "center");
  context.restore();
}

/** Round postmark and wavy cancel lines across the stamps. */
function drawPostmark(context: CanvasRenderingContext2D, cx: number, cy: number, date: string) {
  context.save();
  context.strokeStyle = "rgba(29,43,83,.55)"; context.lineWidth = 3;
  context.beginPath(); context.arc(cx, cy, 64, 0, Math.PI * 2); context.stroke();
  context.beginPath(); context.arc(cx, cy, 52, 0, Math.PI * 2); context.stroke();
  fitText(context, [{ text: "একটুখানি ডাক", color: "rgba(29,43,83,.7)", weight: 700 }], cx, cy - 4, 18, 90, "center");
  if (date) fitText(context, [{ text: date, color: "rgba(29,43,83,.7)", weight: 600 }], cx, cy + 20, 15, 92, "center");
  for (let line = 0; line < 4; line++) {
    const y = cy - 30 + line * 20;
    context.beginPath(); context.moveTo(cx + 66, y);
    for (let x = cx + 66; x < cx + 300; x += 30) context.quadraticCurveTo(x + 7.5, y - 8, x + 15, y), context.quadraticCurveTo(x + 22.5, y + 8, x + 30, y);
    context.stroke();
  }
  context.restore();
}

type Row = { text: string; align: "left" | "right" };

/** Wraps the letter into ruled rows, shrinking the hand until it fits the visible part of the sheet. */
function layoutSheet(context: CanvasRenderingContext2D, sheet: Sheet, width: number, height: number) {
  for (let size = 48; ; size -= 2) {
    context.font = `500 ${size}px ${DISPLAY_FONT}`;
    const rows: Row[] = [{ text: sheet.greeting, align: "left" }];
    for (const paragraph of sheet.body) for (const text of wrapText(context, paragraph, width, 8)) rows.push({ text, align: "left" });
    rows.push({ text: sheet.signoff, align: "right" }, { text: sheet.signer, align: "right" });
    const line = Math.round(size * 1.55);
    if (rows.length * line <= height || size <= 22) return { size, line, rows };
  }
}

/** The blue letter pad, tilted a little, with the letter in a rounded hand. top/height: the sheet; visible: how much shows above the envelope. */
function drawSheet(context: CanvasRenderingContext2D, sheet: Sheet, x: number, top: number, width: number, height: number, visible: number) {
  const textLeft = 96, textWidth = width - textLeft - 56, firstLine = 168;
  const { size, line, rows } = layoutSheet(context, sheet, textWidth, visible - firstLine - 20);
  context.save();
  context.translate(x + width / 2, top + height / 2);
  context.rotate(-0.026);
  context.translate(-width / 2, -height / 2);
  context.shadowColor = "rgba(0,0,0,.28)"; context.shadowBlur = 30; context.shadowOffsetY = 10;
  context.fillStyle = colors.paper;
  context.fillRect(0, 0, width, height);
  context.shadowColor = "transparent";
  // Torn-off pad: a row of tiny holes along the top edge.
  context.fillStyle = "#c9d9ee";
  for (let px = 24; px < width; px += 22) { context.beginPath(); context.arc(px, 14, 3, 0, Math.PI * 2); context.fill(); }
  context.strokeStyle = colors.rule; context.lineWidth = 2;
  for (let y = firstLine + 12; y < height; y += line) { context.beginPath(); context.moveTo(24, y); context.lineTo(width - 24, y); context.stroke(); }
  context.strokeStyle = colors.margin; context.lineWidth = 3;
  context.beginPath(); context.moveTo(textLeft - 22, 30); context.lineTo(textLeft - 22, height); context.stroke();
  if (sheet.date) fitText(context, [{ text: sheet.date, color: colors.inkSoft, weight: 500, display: true }], width - 56, firstLine - line * 0.9, Math.min(30, size), 360, "right");
  rows.forEach((row, index) => {
    const y = firstLine + index * line;
    const bold = index === 0 || index >= rows.length - 2;
    fitText(context, [{ text: row.text, color: colors.ink, weight: bold ? 700 : 500, display: true }], row.align === "right" ? width - 56 : textLeft, y, size, textWidth, row.align);
  });
  context.restore();
}

/** An opened yellow envelope: back and open flap behind the sheet, then the front pocket in front of it. */
function drawEnvelopeBack(context: CanvasRenderingContext2D, x: number, top: number, width: number, height: number) {
  context.fillStyle = colors.envelopeBack;
  context.fillRect(x, top, width, height);
  context.fillStyle = "#e2ac3c";
  context.beginPath(); context.moveTo(x, top); context.lineTo(x + width / 2, top - height * 0.62); context.lineTo(x + width, top); context.closePath(); context.fill();
  context.strokeStyle = colors.envelopeEdge; context.lineWidth = 3; context.stroke();
}

function drawPocket(context: CanvasRenderingContext2D, view: CardView, x: number, top: number, width: number, height: number) {
  context.save();
  context.shadowColor = "rgba(0,0,0,.25)"; context.shadowBlur = 18; context.shadowOffsetY = -4;
  context.fillStyle = colors.envelope;
  context.fillRect(x, top, width, height);
  context.restore();
  context.strokeStyle = "rgba(150,100,20,.35)"; context.lineWidth = 3;
  context.beginPath(); context.moveTo(x, top); context.lineTo(x + width * 0.36, top + height * 0.6); context.moveTo(x + width, top); context.lineTo(x + width * 0.64, top + height * 0.6); context.stroke();
  drawStamp(context, x + width - 150, top + 30, 112, 136, "shapla", 0.05);
  drawStamp(context, x + width - 278, top + 40, 112, 136, "ilish", -0.06);
  drawPostmark(context, x + width - 330, top + 90, view.sheet.date);
  fitText(context, [{ text: view.to, color: colors.ink, weight: 700, display: true }], x + 50, top + 92, 42, width - 440);
  if (view.from) fitText(context, [{ text: view.from, color: colors.inkSoft, weight: 600, display: true }], x + 50, top + 144, 30, width - 440);
  fitText(context, [{ text: view.human, color: "#6b4a10", weight: 600 }], x + 50, top + height - 34, 28, width - 100);
}

/** A closed envelope for a sealed future letter: flap down, a red seal with the open date. */
function drawSealed(context: CanvasRenderingContext2D, view: CardView, x: number, top: number, width: number, height: number) {
  const seal = view.seal!;
  context.save();
  context.translate(x + width / 2, top + height / 2);
  context.rotate(-0.03);
  context.translate(-width / 2, -height / 2);
  context.shadowColor = "rgba(0,0,0,.35)"; context.shadowBlur = 34; context.shadowOffsetY = 12;
  context.fillStyle = colors.envelope;
  context.fillRect(0, 0, width, height);
  context.shadowColor = "transparent";
  context.fillStyle = "#e9b641";
  context.beginPath(); context.moveTo(0, 0); context.lineTo(width / 2, height * 0.56); context.lineTo(width, 0); context.closePath(); context.fill();
  context.strokeStyle = "rgba(150,100,20,.45)"; context.lineWidth = 3; context.stroke();
  context.beginPath(); context.moveTo(0, height); context.lineTo(width * 0.4, height * 0.5); context.moveTo(width, height); context.lineTo(width * 0.6, height * 0.5); context.stroke();
  drawStamp(context, width - 150, 34, 112, 136, "shapla", 0.05);
  fitText(context, [{ text: view.to, color: colors.ink, weight: 700, display: true }], 50, height - 92, 40, width * 0.6);
  if (view.from) fitText(context, [{ text: view.from, color: colors.inkSoft, weight: 600, display: true }], 50, height - 44, 30, width * 0.6);
  // The seal, like a sticker pressed onto the flap's tip.
  const cx = width / 2, cy = height * 0.56;
  context.fillStyle = colors.seal;
  context.beginPath();
  for (let point = 0; point <= 24; point++) {
    const angle = (point / 24) * Math.PI * 2, radius = point % 2 ? 118 : 128;
    context.lineTo(cx + Math.cos(angle) * radius, cy + Math.sin(angle) * radius);
  }
  context.fill();
  context.strokeStyle = "#ffffff88"; context.lineWidth = 3;
  context.beginPath(); context.arc(cx, cy, 100, 0, Math.PI * 2); context.stroke();
  fitText(context, [{ text: "খুলবে", color: "#ffe9c2", weight: 700 }], cx, cy - 18, 30, 170, "center");
  fitText(context, [{ text: seal.label, color: "#ffffff", weight: 800, display: true }], cx, cy + 30, 38, 180, "center");
  context.restore();
}

const layouts = {
  feed: { header: 142, sheetTop: 196, sheetHeight: 860, pocketTop: 972, envelopeTop: 930, envelopeBottom: 1226, sealTop: 220, sealHeight: 560, count: 960, after: 66 },
  story: { header: 330, sheetTop: 392, sheetHeight: 1100, pocketTop: 1398, envelopeTop: 1350, envelopeBottom: 1640, sealTop: 420, sealHeight: 640, count: 1240, after: 76 },
} as const;

export function drawCard(canvas: HTMLCanvasElement, view: CardView, format: CardFormat, site: string) {
  const { width, height } = cardSizes[format];
  const layout = layouts[format];
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext("2d");
  if (!context) throw new Error("এই ব্রাউজারে ছবি বানানো যাচ্ছে না।");
  context.fillStyle = colors.desk;
  context.fillRect(0, 0, width, height);
  drawAirmail(context, width, height, 22);
  fitText(context, [{ text: view.header, color: colors.cream, weight: 700, display: true }], width / 2, layout.header, 52, 880, "center");

  if (view.seal) {
    drawSealed(context, view, 110, layout.sealTop, 860, layout.sealHeight);
    let y = layout.count;
    fitText(context, [{ text: countdown(view.seal.days), color: colors.envelope, weight: 800, display: true }], width / 2, y, 112, 900, "center");
    y += layout.after + 10;
    fitText(context, [{ text: `খামটা খুলবে ${view.seal.label}`, color: colors.cream, weight: 700, display: true }], width / 2, y, 44, 900, "center");
    if (view.seal.written) { y += layout.after - 10; fitText(context, [{ text: view.seal.written, color: "#c9d4ee", weight: 500 }], width / 2, y, 30, 900, "center"); }
    y += layout.after - 4;
    fitText(context, [{ text: view.human, color: colors.cream, weight: 600 }], width / 2, y, 32, 900, "center");
  } else {
    const left = 92, envelopeWidth = width - left * 2;
    drawEnvelopeBack(context, left, layout.envelopeTop, envelopeWidth, layout.envelopeBottom - layout.envelopeTop);
    drawSheet(context, view.sheet, 150, layout.sheetTop, 780, layout.sheetHeight, layout.pocketTop - layout.sheetTop - 10);
    drawPocket(context, view, left, layout.pocketTop, envelopeWidth, layout.envelopeBottom - layout.pocketTop);
  }
  drawFooterBand(context, format, "তুমি শেষ কবে চিঠি লিখেছ?", site, FOOTER);
}

export const cardBlob = (view: CardView, format: CardFormat, site: string) => renderCard(canvas => drawCard(canvas, view, format, site));

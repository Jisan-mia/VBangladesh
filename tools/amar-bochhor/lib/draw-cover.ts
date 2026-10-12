import { BODY_FONT, DISPLAY_FONT, cardSizes, drawFooterBand, drawPhoto, fitText, renderCard, roundedRect, wrapText, type CardFormat, type Photo } from "../../../shared/card-canvas";
import { bn, daysIn, editorial, fridaysIn, owner, pickLabel, prompts, WORD, type Cover } from "./barshiki";

// A school বার্ষিকী cover: peacock-blue card stock, turmeric-yellow print, a pasted white সূচিপত্র, two staples on the spine.
const BLUE = "#0e5a73";
const BLUE_DEEP = "#083f51";
const YELLOW = "#f4b52e";
const INK = "#13262e";
const MUTED = "#5e7177";
const DOTS = "#b6c5ca";
// Decorative page numbers for the সূচিপত্র; the last one is the year's 52nd week.
const pages = ["৩", "১৪", "২৭", "৪১", "৫২"];

const layouts = {
  feed: { strip: 118, owner: 238, ownerSize: 60, title: 392, titleSize: 158, seal: 300, sealR: 124, issue: 462, issueSize: 30, panel: 506, row: 78, rowFirst: 156, label: 26, value: 40, editorial: 1086, lineSize: 42, lineGap: 54 },
  story: { strip: 318, owner: 452, ownerSize: 66, title: 628, titleSize: 176, seal: 520, sealR: 136, issue: 712, issueSize: 34, panel: 776, row: 96, rowFirst: 178, label: 30, value: 46, editorial: 1468, lineSize: 48, lineGap: 62 },
} as const;

function drawCoverStock(context: CanvasRenderingContext2D, width: number, height: number, frameBottom: number) {
  context.fillStyle = BLUE;
  context.fillRect(0, 0, width, height);
  // Halftone dots in the top corner, like a cheap two-colour press run.
  context.fillStyle = "rgba(244,181,46,.16)";
  for (let y = 60; y < 560; y += 22) for (let x = width - 460; x < width - 50; x += 22) {
    const fade = 1 - Math.hypot(x - (width - 60), y - 60) / 520;
    if (fade > 0) { context.beginPath(); context.arc(x, y, 1 + fade * 5, 0, Math.PI * 2); context.fill(); }
  }
  // Double yellow frame with diamond corners.
  context.strokeStyle = YELLOW;
  context.lineWidth = 5;
  context.strokeRect(36, 36, width - 72, frameBottom - 36);
  context.lineWidth = 2;
  context.strokeRect(50, 50, width - 100, frameBottom - 64);
  context.fillStyle = YELLOW;
  for (const [x, y] of [[43, 43], [width - 43, 43], [43, frameBottom - 7], [width - 43, frameBottom - 7]]) {
    context.beginPath(); context.moveTo(x, y - 14); context.lineTo(x + 14, y); context.lineTo(x, y + 14); context.lineTo(x - 14, y); context.closePath(); context.fill();
  }
  // Two staples on the spine.
  for (const y of [height * 0.24, height * 0.6]) {
    context.fillStyle = "#c9d3d6";
    roundedRect(context, 12, y, 10, 74, 4); context.fill();
    context.fillStyle = "#7d9096";
    context.fillRect(20, y + 4, 2, 66);
  }
}

function drawSeal(context: CanvasRenderingContext2D, year: number, cx: number, cy: number, r: number, photo?: Photo | null) {
  if (photo) {
    drawPhoto(context, photo, cx, cy, r, YELLOW);
    context.strokeStyle = YELLOW; context.lineWidth = 8;
    context.beginPath(); context.arc(cx, cy, r, 0, Math.PI * 2); context.stroke();
    context.fillStyle = YELLOW;
    roundedRect(context, cx - 104, cy + r - 34, 208, 72, 14); context.fill();
    fitText(context, [{ text: bn(year), color: BLUE_DEEP, weight: 800, display: true }], cx, cy + r + 20, 54, 180, "center");
    return;
  }
  context.fillStyle = YELLOW;
  context.beginPath(); context.arc(cx, cy, r, 0, Math.PI * 2); context.fill();
  context.strokeStyle = BLUE;
  context.lineWidth = 3;
  context.setLineDash([10, 8]);
  context.beginPath(); context.arc(cx, cy, r - 16, 0, Math.PI * 2); context.stroke();
  context.setLineDash([]);
  fitText(context, [{ text: "সংখ্যা", color: BLUE, weight: 700 }], cx, cy - r * 0.3, r * 0.24, r * 1.2, "center");
  fitText(context, [{ text: bn(year), color: BLUE_DEEP, weight: 800, display: true }], cx, cy + r * 0.42, r * 0.66, r * 1.6, "center");
}

function textWidth(context: CanvasRenderingContext2D, text: string, size: number, weight: number, display = false) {
  context.font = `${weight} ${size}px ${display ? DISPLAY_FONT : BODY_FONT}`;
  return context.measureText(text).width;
}

function drawContents(context: CanvasRenderingContext2D, cover: Cover, top: number, layout: (typeof layouts)[CardFormat]) {
  const left = 84, right = 996, height = layout.rowFirst + layout.row * (prompts.length - 1) + 44;
  // A shadow edge, then the pasted white sheet.
  context.fillStyle = BLUE_DEEP;
  roundedRect(context, left + 10, top + 12, right - left, height, 10); context.fill();
  context.fillStyle = "#ffffff";
  roundedRect(context, left, top, right - left, height, 10); context.fill();
  fitText(context, [{ text: "সূচিপত্র", color: BLUE, weight: 800, display: true }], left + 34, top + layout.rowFirst - 86, layout.value, 400);
  fitText(context, [{ text: "পৃষ্ঠা", color: MUTED, weight: 600 }], right - 30, top + layout.rowFirst - 86, layout.label - 2, 120, "right");
  context.fillStyle = BLUE;
  context.fillRect(left + 34, top + layout.rowFirst - 62, right - left - 64, 3);
  prompts.forEach((prompt, index) => {
    const y = top + layout.rowFirst + index * layout.row;
    const labelSize = fitText(context, [{ text: prompt.label, color: MUTED, weight: 600 }], left + 34, y, layout.label, 280);
    const labelEnd = left + 34 + textWidth(context, prompt.label, labelSize, 600);
    fitText(context, [{ text: pages[index], color: BLUE, weight: 800, display: true }], right - 30, y, layout.label + 4, 70, "right");
    const value = pickLabel(cover, index);
    const valueRight = right - 110;
    const valueSize = fitText(context, [{ text: value, color: INK, weight: 700, display: true }], valueRight, y, layout.value, valueRight - labelEnd - 40, "right");
    const valueStart = valueRight - textWidth(context, value, valueSize, 700, true);
    if (index === WORD) {
      // The word of the year gets a highlighter stroke; multiply keeps the ink on top.
      context.save();
      context.globalCompositeOperation = "multiply";
      context.fillStyle = YELLOW;
      context.fillRect(valueStart - 10, y - valueSize * 0.38, valueRight - valueStart + 20, valueSize * 0.46);
      context.restore();
    }
    // Dotted leaders, like every printed সূচিপত্র.
    context.fillStyle = DOTS;
    for (let x = labelEnd + 18; x < valueStart - 14; x += 14) { context.beginPath(); context.arc(x, y - 8, 2.6, 0, Math.PI * 2); context.fill(); }
    for (let x = valueRight + 22; x < right - 76; x += 14) { context.beginPath(); context.arc(x, y - 8, 2.6, 0, Math.PI * 2); context.fill(); }
  });
}

export function drawCover(canvas: HTMLCanvasElement, cover: Cover, format: CardFormat, site: string, photo?: Photo | null) {
  const { width, height } = cardSizes[format];
  const layout = layouts[format];
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext("2d");
  if (!context) throw new Error("এই ব্রাউজারে ছবি বানানো যাচ্ছে না।");
  const footer = format === "story" ? height - 260 : height - 96;
  drawCoverStock(context, width, height, footer - 26);

  fitText(context, [{ text: `বার্ষিক প্রকাশনা · বর্ষ ${bn(cover.year)} · মূল্য: ফ্রি`, color: YELLOW, weight: 600 }], 84, layout.strip, layout.issueSize - 4, 620);
  context.fillStyle = YELLOW;
  context.fillRect(84, layout.strip + 24, 620, 3);
  fitText(context, [{ text: owner(cover.name), color: "#ffffff", weight: 700, display: true }], 84, layout.owner, layout.ownerSize, 600);
  fitText(context, [{ text: "বার্ষিকী", color: YELLOW, weight: 800, display: true }], 78, layout.title, layout.titleSize, 620);
  drawSeal(context, cover.year, 860, layout.seal, layout.sealR, photo);
  fitText(context, [{ text: `${bn(daysIn(cover.year))} দিন · ${bn(fridaysIn(cover.year))}টা শুক্রবার`, color: "#ffffff", weight: 500 }], 84, layout.issue, layout.issueSize, 640);

  drawContents(context, cover, layout.panel, layout);

  fitText(context, [{ text: "সম্পাদকীয়", color: YELLOW, weight: 700 }], 84, layout.editorial, layout.label, 400);
  context.font = `700 ${layout.lineSize}px ${DISPLAY_FONT}`;
  wrapText(context, editorial(cover), 912, 2).forEach((line, index) => {
    fitText(context, [{ text: line, color: "#ffffff", weight: 700, display: true }], 84, layout.editorial + layout.lineGap * (index + 1), layout.lineSize, 912);
  });

  drawFooterBand(context, format, "তোমার বছরের শব্দ কী?", site, { band: "#062f3d", ask: YELLOW, site: "#ffffff" });
}

export const coverBlob = (cover: Cover, format: CardFormat, site: string, photo?: Photo | null) => renderCard(canvas => drawCover(canvas, cover, format, site, photo));

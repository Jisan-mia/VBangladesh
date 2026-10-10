import { cardSizes, drawFooterBand, fitText, renderCard, wrapText, BODY_FONT, DISPLAY_FONT, type CardFormat } from "../../../shared/card-canvas";
import { possessive } from "../../../shared/bangla";
import { PRINT, printFor } from "./art";
import { STYLES, answerFor, chainText, cleanName, humanLine, phrase, type Step, type Style } from "./kin";

// A page from the family album: cream card, silhouette prints held by black photo corners, captions in fountain-pen blue.
const PAPER = "#f3ead8";
const INK = "#1f3566";
const MUTED = "#6f6253";
const ROSE = "#a3324f";
const CORNER = "#2b211c";

export type CardData = { chain: Step[]; style: Style; name: string };

const layouts = {
  feed: { head: 92, strip: 160, maxPrint: 196, caption: 32, chainSize: 48, termSize: 168, boxSize: 46, noteSize: 31, lineSize: 42, gap: 1 },
  story: { head: 318, strip: 404, maxPrint: 204, caption: 34, chainSize: 54, termSize: 184, boxSize: 50, noteSize: 34, lineSize: 46, gap: 1.45 },
} as const;

function corners(context: CanvasRenderingContext2D, x: number, y: number, w: number, h: number) {
  const s = 26;
  context.fillStyle = CORNER;
  for (const [cx, cy, dx, dy] of [[x, y, 1, 1], [x + w, y, -1, 1], [x, y + h, 1, -1], [x + w, y + h, -1, -1]] as const) {
    context.beginPath();
    context.moveTo(cx - dx * 5, cy - dy * 5);
    context.lineTo(cx + dx * s, cy - dy * 5);
    context.lineTo(cx - dx * 5, cy + dy * s);
    context.closePath();
    context.fill();
  }
}

function drawPrint(context: CanvasRenderingContext2D, prefix: readonly Step[], x: number, y: number, w: number, tilt: number) {
  const print = printFor(prefix);
  const h = w * (PRINT.height / PRINT.width);
  const pad = 10;
  context.save();
  context.translate(x + w / 2, y + h / 2);
  context.rotate(tilt);
  context.translate(-w / 2, -h / 2);
  context.shadowColor = "rgba(43,33,28,.22)";
  context.shadowBlur = 14;
  context.shadowOffsetY = 5;
  context.fillStyle = "#fffdf7";
  context.fillRect(-pad, -pad, w + pad * 2, h + pad * 2);
  context.shadowColor = "transparent";
  context.save();
  context.scale(w / PRINT.width, h / PRINT.height);
  context.fillStyle = print.bg;
  context.fillRect(0, 0, PRINT.width, PRINT.height);
  if (print.small) { context.translate(6, 10); context.scale(0.8, 0.8); }
  for (const shape of print.shapes) {
    if (shape.stroke) { context.strokeStyle = print.fg; context.lineWidth = 1.4; context.stroke(new Path2D(shape.d)); }
    else { context.fillStyle = shape.tone === "fg" ? print.fg : print.face; context.fill(new Path2D(shape.d)); }
  }
  context.restore();
  if (print.sex === "me") { context.strokeStyle = ROSE; context.lineWidth = 3; context.setLineDash([8, 7]); context.strokeRect(-pad + 4, -pad + 4, w + pad * 2 - 8, h + pad * 2 - 8); context.setLineDash([]); }
  corners(context, -pad, -pad, w + pad * 2, h + pad * 2);
  context.restore();
  return h;
}

function arrow(context: CanvasRenderingContext2D, x1: number, x2: number, y: number) {
  context.save();
  context.strokeStyle = INK;
  context.lineWidth = 3;
  context.lineCap = "round";
  context.setLineDash([2, 7]);
  context.beginPath(); context.moveTo(x1, y); context.lineTo(x2 - 6, y); context.stroke();
  context.setLineDash([]);
  context.beginPath(); context.moveTo(x2 - 14, y - 8); context.lineTo(x2 - 4, y); context.lineTo(x2 - 14, y + 8); context.stroke();
  context.restore();
}

function lines(context: CanvasRenderingContext2D, text: string, size: number, width: number, max: number, display = false, weight = 600) {
  context.font = `${weight} ${size}px ${display ? DISPLAY_FONT : BODY_FONT}`;
  return wrapText(context, text, width, max);
}

/** The two family styles side by side, equal boxes: the word, or what people say when that style has no word. */
function drawHomes(context: CanvasRenderingContext2D, chain: readonly Step[], style: Style, x: number, y: number, width: number, size: number) {
  const cells = STYLES.map(item => { const term = answerFor(chain, item.id).term; return { label: item.home, value: term ? term.replace(/ \/ /g, " বা ") : phrase(chain, item.id), said: !term, mine: item.id === style }; });
  const same = cells[0].value === cells[1].value;
  const shown = same ? [{ ...cells[0], label: cells[0].said ? "দুই ঘরেই বলে" : "দুই ঘরেই একই ডাক", mine: true }] : cells;
  const gap = 20, h = size * 2.7, w = (width - gap * (shown.length - 1)) / shown.length;
  shown.forEach((cell, index) => {
    const bx = x + index * (w + gap);
    context.fillStyle = "#fffdf7";
    context.beginPath(); context.roundRect(bx, y, w, h, 18); context.fill();
    context.strokeStyle = cell.mine ? INK : "#c9b48a";
    context.lineWidth = 3;
    context.setLineDash(cell.mine ? [] : [10, 8]);
    context.stroke();
    context.setLineDash([]);
    fitText(context, [{ text: cell.label, color: MUTED, weight: 600 }], bx + 26, y + size * 0.95, size * 0.58, w - 52);
    fitText(context, [{ text: cell.said && !same ? `বলে: ${cell.value}` : cell.value, color: INK, weight: 800, display: true }], bx + 26, y + size * 2.05, cell.said ? size * 0.8 : size, w - 52);
  });
}

export function drawCard(canvas: HTMLCanvasElement, data: CardData, format: CardFormat, site: string) {
  const { width, height } = cardSizes[format];
  const L = layouts[format];
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext("2d");
  if (!context) throw new Error("এই ব্রাউজারে ছবি বানানো যাচ্ছে না।");
  const left = 84, inner = width - 168;
  const { chain, style } = data;
  const answer = answerFor(chain, style);

  const paper = context.createRadialGradient(width / 2, height * 0.4, width * 0.15, width / 2, height * 0.45, width);
  paper.addColorStop(0, "#f8f1e2");
  paper.addColorStop(1, "#e6d8bb");
  context.fillStyle = paper;
  context.fillRect(0, 0, width, height);
  // The album's punched spine on the left edge.
  context.fillStyle = "#d9c7a3";
  context.fillRect(0, 0, 34, height);
  context.fillStyle = PAPER;
  for (let y = 70; y < height - 120; y += 120) { context.beginPath(); context.arc(17, y, 7, 0, Math.PI * 2); context.fill(); }

  const name = cleanName(data.name);
  fitText(context, [{ text: name ? `${possessive(name)} পারিবারিক অ্যালবাম` : "পারিবারিক অ্যালবাম", color: MUTED, weight: 600 }], left, L.head, 30, inner - 260);
  fitText(context, [{ text: "কে কী হয়?", color: ROSE, weight: 800, display: true }], width - 84, L.head, 34, 250, "right");
  context.fillStyle = INK;
  context.fillRect(left, L.head + 22, inner, 2);

  // The strip: আমি, then everyone the chain passes through.
  const count = chain.length + 1;
  const gap = 34;
  const w = Math.min(L.maxPrint, (inner - 20 - gap * (count - 1)) / count);
  const total = count * w + gap * (count - 1);
  const startX = left + (inner - total) / 2;
  let captionBottom: number = L.strip;
  for (let index = 0; index < count; index++) {
    const x = startX + index * (w + gap);
    const prefix = chain.slice(0, index);
    const h = drawPrint(context, prefix, x, L.strip, w, index % 2 ? 0.025 : -0.02);
    if (index > 0) arrow(context, x - gap + 4, x - 4, L.strip + h / 2);
    const label = index === 0 ? "আমি" : phrase(prefix, style);
    const captionLines = lines(context, label, L.caption, w + 28, 2, true, 700);
    captionLines.forEach((line, row) => fitText(context, [{ text: line, color: index === chain.length && index > 0 ? ROSE : INK, weight: 700, display: true }], x + w / 2, L.strip + h + 60 + row * L.caption * 1.25, L.caption, w + 28, "center"));
    captionBottom = Math.max(captionBottom, L.strip + h + 60 + (captionLines.length - 1) * L.caption * 1.25);
  }

  const bandTop = format === "story" ? height - 260 : height - 96;
  const lineY = bandTop - L.lineSize * 1.6;
  if (!chain.length) {
    fitText(context, [{ text: "তুমি নিজেই!", color: ROSE, weight: 800, display: true }], left, (captionBottom + lineY) / 2 + L.termSize * 0.3, L.termSize, inner);
  } else {
    // Measure the block first, then centre it between the strip and the human line so short answers don't leave a hole.
    const chainLines = lines(context, `${chainText(chain, style)} =`, L.chainSize, inner, 2, false, 600);
    const big = answer.unnamed ? "আলাদা নাম নেই" : answer.said;
    const size = answer.term ? L.termSize : L.termSize * 0.6;
    const note = [answer.entry?.note, answer.entry?.book && `বইয়ের ভাষায়: ${answer.entry.book}।`].filter(Boolean).join(" ");
    const noteLines = note ? lines(context, note, L.noteSize, inner, 2) : [];
    const chainH = (chainLines.length - 1) * L.chainSize * 1.3;
    const bigH = size * 1.02 + size * 0.42 + 36 * L.gap;
    const boxH = L.boxSize * 2.7;
    const noteH = noteLines.length ? L.noteSize * 1.7 * L.gap + (noteLines.length - 1) * L.noteSize * 1.45 : 0;
    const top = captionBottom + 60 * L.gap + L.chainSize;
    const room = lineY - L.lineSize * 2 - top;
    let y = top + Math.max(0, (room - (chainH + bigH + boxH + noteH)) / 2);
    chainLines.forEach((line, row) => fitText(context, [{ text: line, color: INK, weight: 600 }], left, y + row * L.chainSize * 1.3, L.chainSize, inner));
    y += chainH + size * 1.02;
    fitText(context, [{ text: big, color: answer.term || answer.unnamed ? ROSE : INK, weight: 800, display: true }], left, y, size, inner);
    // Leave room for the vowel signs that hang below the big word (ফু, শু).
    y += size * 0.42 + 36 * L.gap;
    drawHomes(context, chain, style, left, y, inner, L.boxSize);
    y += boxH;
    if (noteLines.length) {
      y += L.noteSize * 1.7 * L.gap;
      noteLines.forEach((line, row) => fitText(context, [{ text: line, color: MUTED, weight: 500 }], left, y + row * L.noteSize * 1.45, L.noteSize, inner));
    }
  }

  // The human line sits just above the footer band, in pen.
  fitText(context, [{ text: humanLine(chain, style), color: INK, weight: 700, display: true }], left, lineY, L.lineSize, inner);
  drawFooterBand(context, format, "তোমাদের বাসায় কী ডাকে?", site, { band: INK, ask: "#f4e2a8", site: "#fffdf7" });
}

export const cardBlob = (data: CardData, format: CardFormat, site: string) => renderCard(canvas => drawCard(canvas, data, format, site));

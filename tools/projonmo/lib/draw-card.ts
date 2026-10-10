import { BODY_FONT, cardSizes, DISPLAY_FONT, drawFooterBand, fitText, renderCard, wrapText, type CardFormat } from "../../../shared/card-canvas";
import { bn, entriesOf, humanLine, marks, setById, split, splitText, verdict, PER_SET, type Kind, type Shared } from "./words";

// A dictionary page: thin bible paper, two columns, the kid's highlighter on Gen Z words and Abbu's fountain-pen ink on the elders' ones.
const PAPER = "#f7f5ee";
const INK = "#1b1d24";
const MUTED = "#6a6658";
const RULE = "#cfc8b4";
export const BLUE = "#1f4aa8";
export const LIME = "#d8f04a";

export type CardData = Shared & { friend?: Shared | null };

const layouts = {
  feed: { head: 80, name: 196, nameSize: 76, split: 290, splitSize: 56, bar: 320, verdict: 428, cols: 516, rows: 598, rowGap: 84, wordSize: 40, note: 1030, line: 1088, lineGap: 58, lineSize: 42, friend: 1216 },
  story: { head: 300, name: 420, nameSize: 84, split: 520, splitSize: 62, bar: 552, verdict: 672, cols: 774, rows: 864, rowGap: 100, wordSize: 44, note: 1384, line: 1450, lineGap: 62, lineSize: 46, friend: 1590 },
} as const;

function textWidth(context: CanvasRenderingContext2D, text: string, size: number, weight = 700, display = true) {
  context.font = `${weight} ${size}px ${display ? DISPLAY_FONT : BODY_FONT}`;
  return context.measureText(text).width;
}

function mark(context: CanvasRenderingContext2D, x: number, y: number, right: boolean, color: string) {
  context.save();
  context.strokeStyle = color;
  context.lineWidth = 6;
  context.lineCap = "round";
  context.lineJoin = "round";
  context.beginPath();
  if (right) { context.moveTo(x - 16, y); context.lineTo(x - 4, y + 12); context.lineTo(x + 18, y - 16); }
  else { context.moveTo(x - 13, y - 13); context.lineTo(x + 13, y + 13); context.moveTo(x + 13, y - 13); context.lineTo(x - 13, y + 13); }
  context.stroke();
  context.restore();
}

export function drawCard(canvas: HTMLCanvasElement, data: CardData, format: CardFormat, site: string) {
  const { width, height } = cardSizes[format];
  const L = layouts[format];
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext("2d");
  if (!context) throw new Error("এই ব্রাউজারে ছবি বানানো যাচ্ছে না।");
  const entries = entriesOf(data.set);
  const hits = marks(data.set, data.answers);
  const result = split(data.set, data.answers);
  const done = data.answers.length === PER_SET;
  const left = 84, right = width - 84, inner = right - left;

  context.fillStyle = PAPER;
  context.fillRect(0, 0, width, height);
  // The page curves into the binding on the left.
  const gutter = context.createLinearGradient(0, 0, 60, 0);
  gutter.addColorStop(0, "#d9d3c2");
  gutter.addColorStop(1, "#f7f5ee00");
  context.fillStyle = gutter;
  context.fillRect(0, 0, 60, height);

  // Thumb-index tabs on the fore-edge, the current one marked with highlighter, and a ribbon bookmark.
  ["অ", "ক", "ট", "প", "স"].forEach((letter, index) => {
    const y = (format === "story" ? 420 : 200) + index * 104;
    context.fillStyle = index === 3 ? LIME : "#e6e1d2";
    context.fillRect(width - 26, y, 26, 92);
    fitText(context, [{ text: letter, color: INK, weight: 700 }], width - 13, y + 56, 20, 22, "center");
  });
  context.fillStyle = BLUE;
  context.beginPath();
  context.moveTo(1006, 0); context.lineTo(1034, 0); context.lineTo(1034, 150); context.lineTo(1020, 136); context.lineTo(1006, 150); context.closePath();
  context.fill();

  fitText(context, [{ text: "প্রজন্মের অভিধান", color: MUTED, weight: 600 }], left, L.head, 28, 420);
  fitText(context, [{ text: `২০২৭ সংস্করণ · ${setById(data.set).label}`, color: MUTED, weight: 600 }], right - 20, L.head, 28, 420, "right");
  context.fillStyle = INK;
  context.fillRect(left, L.head + 18, inner, 3);
  context.fillRect(left, L.head + 26, inner, 1.5);

  fitText(context, [{ text: data.name || "আমার ফল", color: INK, weight: 800, display: true }], left, L.name, L.nameSize, inner);

  if (done) {
    // "৭০% জেন-জি" on a highlighter stroke, then "৩০% আব্বু-আম্মু" in fountain-pen blue.
    const genz = `${bn(result.genzPct)}% জেন-জি`, elder = `${bn(result.elderPct)}% আব্বু-আম্মু`, dot = "  ·  ";
    let size = L.splitSize;
    while (size > 24 && textWidth(context, genz + dot + elder, size, 800) > inner - 24) size -= 2;
    const genzWidth = textWidth(context, genz, size, 800);
    context.fillStyle = LIME;
    context.fillRect(left - 8, L.split - size * 0.78, genzWidth + 16, size * 0.98);
    fitText(context, [{ text: genz, color: INK, weight: 800, display: true }, { text: dot, color: MUTED, weight: 700, display: true }, { text: elder, color: BLUE, weight: 800, display: true }], left, L.split, size, inner);
  } else {
    fitText(context, [{ text: `${bn(data.answers.length)}/১০ শব্দ দেখা হয়েছে`, color: MUTED, weight: 700, display: true }], left, L.split, L.splitSize - 8, inner);
  }

  // The split bar: highlighter for Gen Z, ink for the elders.
  const barY = L.bar, barH = 26;
  context.fillStyle = "#e6e1d2";
  context.fillRect(left, barY, inner, barH);
  if (done) {
    const cut = Math.round(inner * result.genzPct / 100);
    context.fillStyle = LIME;
    context.fillRect(left, barY, cut, barH);
    context.fillStyle = BLUE;
    context.fillRect(left + cut, barY, inner - cut, barH);
  }
  context.strokeStyle = INK; context.lineWidth = 2;
  context.strokeRect(left, barY, inner, barH);

  fitText(context, [{ text: done ? verdict(result) : "অভিধান এখনো খোলা", color: INK, weight: 800, display: true }], left, L.verdict, 50, inner - 230);
  if (done) fitText(context, [{ text: `দশে ${bn(result.total)} ঠিক`, color: MUTED, weight: 700 }], right, L.verdict, 32, 220, "right");

  // Two columns, like a dictionary page.
  const colGap = 56, colW = (inner - colGap) / 2;
  context.fillStyle = RULE;
  context.fillRect(left + colW + colGap / 2 - 1, L.cols - 30, 2, L.rows + L.rowGap * 4 + 30 - (L.cols - 30));
  (["genz", "elder"] as Kind[]).forEach((kind, column) => {
    const x = left + column * (colW + colGap);
    const color = kind === "genz" ? INK : BLUE;
    if (kind === "genz") { context.fillStyle = LIME; context.fillRect(x, L.cols - 24, 22, 22); }
    else { context.fillStyle = BLUE; context.fillRect(x, L.cols - 24, 22, 22); }
    fitText(context, [{ text: kind === "genz" ? "জেন-জির শব্দ" : "আব্বু-আম্মুর কথা", color, weight: 700 }], x + 34, L.cols, 30, colW - 34);
    context.fillStyle = INK;
    context.fillRect(x, L.cols + 16, colW, 2);
    entries.map((entry, index) => ({ entry, hit: hits[index] })).filter(({ entry }) => entry.kind === kind).forEach(({ entry, hit }, row) => {
      const y = L.rows + row * L.rowGap;
      const label = entry.short ?? entry.word;
      const maxWidth = colW - 52;
      let size = L.wordSize;
      while (size > 20 && textWidth(context, label, size) > maxWidth) size -= 1;
      const w = textWidth(context, label, size);
      if (hit && kind === "genz") { context.fillStyle = LIME; context.fillRect(x - 6, y - size * 0.8, w + 12, size); }
      fitText(context, [{ text: label, color: hit === false ? MUTED : INK, weight: 700, display: true }], x, y, size, maxWidth);
      if (hit && kind === "elder") {
        // Abbu's fountain pen: a slightly wavy underline.
        context.save();
        context.strokeStyle = BLUE; context.lineWidth = 4; context.lineCap = "round";
        context.beginPath();
        for (let step = 0; step <= 12; step++) { const px = x + (w * step) / 12, py = y + 12 + Math.sin(step * 1.3) * 2.5; if (step) context.lineTo(px, py); else context.moveTo(px, py); }
        context.stroke();
        context.restore();
      }
      if (hit === false) { context.fillStyle = MUTED; context.fillRect(x, y - size * 0.3, w, 2.5); }
      if (hit === null) fitText(context, [{ text: "…", color: MUTED, weight: 700 }], x + colW - 18, y, 32, 30, "center");
      else mark(context, x + colW - 18, y - size * 0.32, hit, hit ? (kind === "genz" ? INK : BLUE) : "#a2392c");
    });
  });

  fitText(context, [{ text: "দ্রষ্টব্য", color: BLUE, weight: 700 }], left, L.note, 30, inner);
  context.font = `700 ${L.lineSize}px ${DISPLAY_FONT}`;
  const lines = done ? wrapText(context, humanLine(data.set, data.answers), inner, 2) : ["বাকি শব্দগুলোর মানে বললেই কার্ড পুরো হবে।"];
  lines.forEach((line, index) => fitText(context, [{ text: line, color: INK, weight: 700, display: true }], left, L.line + index * L.lineGap, L.lineSize, inner));

  const friend = data.friend && data.friend.set === data.set ? data.friend : null;
  if (friend && done) {
    const theirs = split(friend.set, friend.answers);
    fitText(context, [{ text: `${friend.name || "বন্ধু"}: ${splitText(theirs)}`, color: BLUE, weight: 700 }, { text: ` · আমি ${bn(result.genzPct)}% জেন-জি`, color: INK, weight: 600 }], left, L.friend, 34, inner);
  }

  drawFooterBand(context, format, "তুমি কোন প্রজন্মের ভাষা বোঝো?", site, { band: INK, ask: LIME, site: PAPER });
}

export const cardBlob = (data: CardData, format: CardFormat, site: string) => renderCard(canvas => drawCard(canvas, data, format, site));

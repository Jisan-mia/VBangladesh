import { cardSizes, drawFooterBand, drawPhoto, fitText, renderCard, roundedRect, type CardFormat, type Photo } from "../../../shared/card-canvas";
import { bn, chapters, memories, type CardContent } from "./postcard";

const INK = "#1d2b53";
const RED = "#d23a2c";
const MUTED = "#6a7590";
const RULE = "#dfe7f4";
const tint = { khela: "#fde4ad", porda: "#d6e5fb", khabar: "#fbd6d0", school: "#d8efd6", bari: "#eadff6", utsob: "#ffdfc0" } as const;
// Short labels keep the six-column grid readable when the image is shown at phone-feed size.
const cardLabels: Record<string, string> = { kite: "ঘুড়ি", cricket: "ক্রিকেট", antenna: "অ্যান্টেনা", doraemon: "ডোরেমন", "chips-toy": "চিপসের খেলনা", "nokia-snake": "সাপ খেলা", ittadi: "ইত্যাদি", meena: "মীনা", jhalmuri: "ঝালমুড়ি", achar: "আচার", pitha: "পিঠা", "ice-cream": "আইসক্রিম", "hawai-mithai": "হাওয়াই মিঠাই", molat: "মলাট", feather: "বইয়ে পালক", "new-books": "নতুন বই", tiffin: "টিফিন ভাগ", slate: "স্লেট-চক", assembly: "অ্যাসেম্বলি", hurricane: "হারিকেন", landphone: "ল্যান্ডফোন", "paper-boat": "কাগজের নৌকা", stories: "নানির গল্প", letter: "চিঠি", salami: "সালামি", dhak: "পূজার ঢাক", fair: "নাগরদোলা", nanabari: "নানাবাড়ি", pond: "পুকুরে সাঁতার", "eid-moon": "চাঁদ দেখা" };
// One row per chapter, whatever order the memories array is in.
const cardOrder = chapters.flatMap(chapter => memories.filter(memory => memory.chapter === chapter.id));

function drawPaper(context: CanvasRenderingContext2D, width: number, height: number) {
  context.fillStyle = "#fffdf8";
  context.fillRect(0, 0, width, height);
  context.strokeStyle = RULE;
  context.lineWidth = 2;
  for (let y = 96; y < height; y += 54) {
    context.beginPath(); context.moveTo(0, y); context.lineTo(width, y); context.stroke();
  }
  context.strokeStyle = "#f2b3ad";
  context.lineWidth = 3;
  for (const x of [52, 60]) { context.beginPath(); context.moveTo(x, 0); context.lineTo(x, height); context.stroke(); }
}

function drawLabel(context: CanvasRenderingContext2D, card: CardContent, x: number, y: number, photo?: Photo | null) {
  const height = 132, inset = photo ? 128 : 0, width = 300 + inset;
  x -= inset;
  context.fillStyle = "#ffffff";
  roundedRect(context, x, y, width, height, 18);
  context.fill();
  context.strokeStyle = INK;
  context.lineWidth = 3;
  context.stroke();
  if (photo) drawPhoto(context, photo, x + 70, y + height / 2, 50);
  x += inset;
  const rows: Array<[string, string]> = [["নাম", card.name], ["দশক", card.decade]];
  rows.forEach(([key, value], index) => {
    const rowY = y + 54 + index * 52;
    fitText(context, [{ text: key + ":", color: MUTED, weight: 500 }], x + 22, rowY, 26, 70);
    context.strokeStyle = "#9aa6c2";
    context.lineWidth = 2;
    context.setLineDash([4, 6]);
    context.beginPath(); context.moveTo(x + 92, rowY + 8); context.lineTo(x + 278, rowY + 8); context.stroke();
    context.setLineDash([]);
    if (value) fitText(context, [{ text: value, color: INK, weight: 700 }], x + 96, rowY, 30, 178);
  });
}

function drawTick(context: CanvasRenderingContext2D, x: number, y: number) {
  context.strokeStyle = RED;
  context.lineWidth = 5;
  context.lineCap = "round";
  context.lineJoin = "round";
  context.beginPath(); context.moveTo(x, y); context.lineTo(x + 9, y + 10); context.lineTo(x + 28, y - 12); context.stroke();
}

function drawGrid(context: CanvasRenderingContext2D, card: CardContent, top: number, rowHeight: number) {
  const left = 84, right = 1036, gap = 10, columns = 6;
  const cellWidth = (right - left - gap * (columns - 1)) / columns;
  cardOrder.forEach((memory, index) => {
    const x = left + (index % columns) * (cellWidth + gap);
    const y = top + Math.floor(index / columns) * (rowHeight + gap);
    const picked = card.selected.has(memory.id);
    roundedRect(context, x, y, cellWidth, rowHeight, 16);
    if (picked) {
      context.fillStyle = tint[memory.chapter];
      context.fill();
    } else {
      context.fillStyle = "rgba(255,255,255,.85)";
      context.fill();
      context.strokeStyle = "#cdd6e6";
      context.lineWidth = 2;
      context.setLineDash([7, 7]);
      context.stroke();
      context.setLineDash([]);
    }
    const icon = Math.min(60, rowHeight * 0.46);
    context.save();
    context.translate(x + cellWidth / 2 - icon / 2, y + rowHeight * 0.12);
    context.scale(icon / 48, icon / 48);
    context.strokeStyle = picked ? INK : "#c3cbda";
    context.lineWidth = picked ? 2.1 : 1.8;
    context.lineCap = "round";
    context.lineJoin = "round";
    context.stroke(new Path2D(memory.drawing));
    context.restore();
    fitText(context, [{ text: cardLabels[memory.id] ?? memory.label, color: picked ? INK : "#a7b0c2", weight: picked ? 700 : 500 }], x + cellWidth / 2, y + rowHeight - 20, 24, cellWidth - 12, "center");
    if (picked) drawTick(context, x + cellWidth - 38, y + 24);
  });
}

const layouts = {
  feed: { top: 48, title: 84, gridGap: 50, row: 128, lineGap: 54, matchGap: 48, line: 34 },
  story: { top: 250, title: 92, gridGap: 54, row: 160, lineGap: 70, matchGap: 56, line: 40 },
} as const;

export function drawCard(canvas: HTMLCanvasElement, card: CardContent, format: CardFormat, site: string, photo?: Photo | null) {
  const { width, height } = cardSizes[format];
  const layout = layouts[format];
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext("2d");
  if (!context) throw new Error("এই ব্রাউজারে ছবি বানানো যাচ্ছে না।");
  drawPaper(context, width, height);
  if (format === "story") fitText(context, [{ text: "ছোটবেলার খাতা · একটুখানি", color: MUTED, weight: 600 }], width / 2, 170, 30, 900, "center");
  drawLabel(context, card, 736, layout.top, photo);
  fitText(context, [{ text: "আমার ছোটবেলা", color: INK, weight: 800, display: true }], 84, layout.top + 104, layout.title, photo ? 500 : 620);
  fitText(context, [{ text: `${bn(card.total)}টার মধ্যে `, color: INK }, { text: `${bn(card.count)}টা`, color: RED, weight: 800, display: true }, { text: " আমার ছোটবেলায় ছিল", color: INK }], 84, layout.top + 196, 40, 952);
  const gridTop = layout.top + 196 + layout.gridGap;
  drawGrid(context, card, gridTop, layout.row);
  let y = gridTop + chapters.length * (layout.row + 10) - 10 + layout.lineGap;
  fitText(context, [{ text: card.line, color: INK, weight: 600, display: true }], 84, y, layout.line, 952);
  if (card.match) { y += layout.matchGap; fitText(context, [{ text: card.match, color: RED, weight: 700 }], 84, y, layout.line - 2, 952); }
  drawFooterBand(context, format, "তোমার কয়টা মেলে?", site);
}

export const cardBlob = (card: CardContent, format: CardFormat, site: string, photo?: Photo | null) => renderCard(canvas => drawCard(canvas, card, format, site, photo));

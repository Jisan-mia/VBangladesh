import { cardSizes, drawFooterBand, fitText, renderCard, wrapText, DISPLAY_FONT, type CardFormat } from "../../../shared/card-canvas";
import { idiomSvg } from "./art";
import { bn, humanLine, marks, questionsOf, rank, scoreOf, setById, PER_SET, type IdiomId, type SetId, type Shared } from "./idioms";

// A page torn from an old grammar book: yellowed newsprint, ink plates, and the teacher's red pen over the top.
const PAPER = "#f2e4c4";
const INK = "#2a2018";
const MUTED = "#6e5d44";
const RED = "#c62f22";

export type CardData = Shared & { friend?: Shared | null };

const plates = new Map<IdiomId, HTMLImageElement>();
/** The plates are the page's own SVGs; they must be decoded before the synchronous draw. */
export function loadPlates(set: SetId) {
  return Promise.all(questionsOf(set).map(({ id }) => {
    if (plates.get(id)?.complete) return undefined;
    const image = new Image();
    image.src = "data:image/svg+xml;charset=utf-8," + encodeURIComponent(idiomSvg(id, 400));
    return image.decode().then(() => { plates.set(id, image); }).catch(() => undefined);
  }));
}

const layouts = {
  feed: { head: 84, title: 196, nameLabel: 268, name: 330, score: 468, scoreSize: 112, rank: 562, grid: 616, rowGap: 188, cellH: 164, remark: 1034, line: 1094, lineGap: 56, lineSize: 44, match: 1214 },
  story: { head: 300, title: 410, nameLabel: 490, name: 556, score: 704, scoreSize: 120, rank: 806, grid: 870, rowGap: 214, cellH: 186, remark: 1346, line: 1410, lineGap: 58, lineSize: 46, match: 1560 },
} as const;

function tick(context: CanvasRenderingContext2D, x: number, y: number, right: boolean) {
  context.save();
  context.strokeStyle = RED;
  context.lineWidth = 8;
  context.lineCap = "round";
  context.lineJoin = "round";
  context.beginPath();
  if (right) { context.moveTo(x - 22, y); context.lineTo(x - 6, y + 16); context.lineTo(x + 24, y - 22); }
  else { context.moveTo(x - 18, y - 18); context.lineTo(x + 18, y + 18); context.moveTo(x + 18, y - 18); context.lineTo(x - 18, y + 18); }
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
  const hits = marks(data.set, data.answers);
  const score = scoreOf(data.set, data.answers);
  const done = data.answers.length === PER_SET;
  const left = 84, right = width - 84, inner = right - left;

  const paper = context.createRadialGradient(width / 2, height * 0.42, width * 0.2, width / 2, height * 0.42, width * 0.95);
  paper.addColorStop(0, "#f6ead0");
  paper.addColorStop(1, "#e2cd9f");
  context.fillStyle = paper;
  context.fillRect(0, 0, width, height);
  // Foxing: the brown age spots of cheap paper.
  context.fillStyle = "#b8945a1c";
  for (const [x, y, r] of [[930, 160, 26], [140, 1180, 34], [990, 760, 18], [60, 520, 14], [700, 120, 10]] as const) { context.beginPath(); context.arc(x, y * (height / 1350), r, 0, Math.PI * 2); context.fill(); }

  fitText(context, [{ text: "বাংলা ব্যাকরণ · বাগধারা", color: MUTED, weight: 600 }], left, L.head, 28, 520);
  fitText(context, [{ text: setById(data.set).label, color: MUTED, weight: 600 }], right, L.head, 28, 300, "right");
  context.fillStyle = INK;
  context.fillRect(left, L.head + 18, inner, 3);
  context.fillRect(left, L.head + 26, inner, 1.5);

  fitText(context, [{ text: "বাগধারার ছবি", color: INK, weight: 800, display: true }], left, L.title, 84, inner);

  fitText(context, [{ text: "নাম", color: MUTED, weight: 600 }], left, L.nameLabel, 28, 200);
  fitText(context, [{ text: data.name || "আমার বাগধারা-পরীক্ষা", color: INK, weight: 800, display: true }], left, L.name, 58, inner);
  const scoreText = done ? `১০-এ ${bn(score)}` : `${bn(data.answers.length)}/১০ চলছে`;
  const used = fitText(context, [{ text: scoreText, color: RED, weight: 800, display: true }], left + 24, L.score, L.scoreSize, inner - 48);
  if (done) {
    // The teacher's ring around the marks.
    context.font = `800 ${used}px ${DISPLAY_FONT}`;
    const w = context.measureText(scoreText).width;
    context.save();
    context.strokeStyle = RED; context.lineWidth = 5;
    context.beginPath(); context.ellipse(left + 24 + w / 2, L.score - used * 0.34, w / 2 + 30, used * 0.52, -0.04, 0.2, Math.PI * 2.05); context.stroke();
    context.restore();
  }
  fitText(context, [{ text: done ? rank(score) : "বাকি পাতাগুলো খেলা হয়নি", color: INK, weight: 800, display: true }], left, L.rank, 46, inner);

  const cell = inner / 5;
  questionsOf(data.set).forEach((question, index) => {
    const x = left + (index % 5) * cell, y = L.grid + Math.floor(index / 5) * L.rowGap;
    context.fillStyle = "#fffaf0";
    context.fillRect(x + 6, y, cell - 12, L.cellH);
    context.strokeStyle = INK; context.lineWidth = 2;
    context.strokeRect(x + 6, y, cell - 12, L.cellH);
    const image = plates.get(question.id);
    const w = cell - 24, h = w * 0.7;
    if (image) context.drawImage(image, x + 12, y + (L.cellH - h) / 2, w, h);
    fitText(context, [{ text: bn(index + 1), color: MUTED, weight: 700 }], x + 14, y + 26, 22, 40);
    const hit = hits[index];
    if (hit !== null) tick(context, x + cell - 30, y + L.cellH - 22, hit);
  });

  fitText(context, [{ text: done ? "টিচারের মন্তব্য" : "খাতা এখনো জমা হয়নি", color: RED, weight: 700 }], left, L.remark, 30, inner);
  context.font = `700 ${L.lineSize}px ${DISPLAY_FONT}`;
  const lines = done ? wrapText(context, humanLine(data.set, data.answers), inner, 2) : ["বাকিগুলো পারলেই কার্ড পুরো হবে।"];
  lines.forEach((line, index) => fitText(context, [{ text: line, color: INK, weight: 700, display: true }], left, L.line + index * L.lineGap, L.lineSize, inner));

  const friend = data.friend && data.friend.set === data.set ? data.friend : null;
  if (friend && done) {
    const friendScore = scoreOf(friend.set, friend.answers);
    fitText(context, [{ text: `${friend.name || "বন্ধু"} পেরেছিল ${bn(friendScore)}টা`, color: RED, weight: 700 }, { text: score > friendScore ? " · আমি এগিয়ে!" : score === friendScore ? " · সমানে সমান!" : " · এবার হার মানলাম", color: INK, weight: 600 }], left, L.match, 34, inner);
  }

  drawFooterBand(context, format, "তুমি কয়টা পারবে?", site, { band: INK, ask: "#f2c46a", site: PAPER });
}

export const cardBlob = async (data: CardData, format: CardFormat, site: string) => {
  await loadPlates(data.set);
  return renderCard(canvas => drawCard(canvas, data, format, site));
};

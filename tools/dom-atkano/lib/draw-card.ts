import { cardSizes, drawFooterBand, fitText, renderCard, roundedRect, wrapText, BODY_FONT, DISPLAY_FONT, type CardFormat } from "../../../shared/card-canvas";
import { bn, humanLine, marks, questionsOf, rank, scoreOf, setById, PER_SET, type Shared } from "./quiz";

// The hand-turned stadium scoreboard: black-green board, white tin number plates, painted yellow labels.
const FRAME = "#2d332f";
const BOARD = "#17201b";
const PLATE = "#f4f1e8";
const PLATE_INK = "#141a16";
const PAINT = "#f5c518";
const CHALK = "#e9efe9";
const MUTED = "#8d9c93";
const OFF = "#26312b";

export type CardData = Shared & { friend?: Shared | null };

const layouts = {
  feed: { title: 128, rule: 166, nameLabel: 238, name: 312, plateTop: 362, plateH: 280, rankLabel: 424, rank: 506, tally: 578, rowLabel: 728, row: 756, rowH: 118, years: 914, line: 1010, lineGap: 58, match: 1134, ground: 1222, lineSize: 44 },
  story: { title: 330, rule: 372, nameLabel: 452, name: 530, plateTop: 590, plateH: 300, rankLabel: 660, rank: 750, tally: 830, rowLabel: 1000, row: 1030, rowH: 124, years: 1196, line: 1300, lineGap: 64, match: 1460, ground: 1640, lineSize: 48 },
} as const;

function plate(context: CanvasRenderingContext2D, x: number, y: number, width: number, height: number, text: string, size: number) {
  context.fillStyle = PLATE;
  roundedRect(context, x, y, width, height, 10);
  context.fill();
  // The two hooks every hanging plate has.
  context.fillStyle = "#9aa39d";
  for (const hx of [x + width * 0.25, x + width * 0.75]) { context.beginPath(); context.arc(hx, y + 16, 6, 0, Math.PI * 2); context.fill(); }
  fitText(context, [{ text, color: PLATE_INK, weight: 800, display: true }], x + width / 2, y + height * 0.74, size, width - 24, "center");
}

function stumps(context: CanvasRenderingContext2D, right: number, ground: number, height: number) {
  context.strokeStyle = CHALK;
  context.lineCap = "round";
  context.lineWidth = 10;
  for (let i = 0; i < 3; i++) { const x = right - i * 34; context.beginPath(); context.moveTo(x, ground); context.lineTo(x, ground - height); context.stroke(); }
  context.lineWidth = 7;
  context.beginPath(); context.moveTo(right - 70, ground - height - 9); context.lineTo(right - 36, ground - height - 9); context.stroke();
  context.beginPath(); context.moveTo(right - 32, ground - height - 9); context.lineTo(right + 2, ground - height - 9); context.stroke();
  context.strokeStyle = "#3d4a42";
  context.lineWidth = 4;
  context.beginPath(); context.moveTo(right - 160, ground + 4); context.lineTo(right + 40, ground + 4); context.stroke();
}

export function drawCard(canvas: HTMLCanvasElement, data: CardData, format: CardFormat, site: string) {
  const { width, height } = cardSizes[format];
  const L = layouts[format];
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext("2d");
  if (!context) throw new Error("এই ব্রাউজারে ছবি বানানো যাচ্ছে না।");
  const footerTop = format === "story" ? height - 260 : height - 96;
  const right = width - 84;
  const hits = marks(data.set, data.answers);
  const score = scoreOf(data.set, data.answers);
  const done = data.answers.length === PER_SET;

  context.fillStyle = FRAME;
  context.fillRect(0, 0, width, height);
  context.fillStyle = BOARD;
  roundedRect(context, 28, 28, width - 56, footerTop - 48, 18);
  context.fill();
  context.fillStyle = "#56605a";
  for (const [x, y] of [[48, 48], [width - 48, 48], [48, footerTop - 40], [width - 48, footerTop - 40]]) { context.beginPath(); context.arc(x, y, 7, 0, Math.PI * 2); context.fill(); }

  fitText(context, [{ text: "দম আটকানো ম্যাচ", color: CHALK, weight: 800, display: true }], 84, L.title, 62, 600);
  fitText(context, [{ text: `ক্রিকেট কুইজ · ${setById(data.set).label}`, color: PAINT, weight: 600 }], right, L.title - 6, 28, 330, "right");
  context.fillStyle = PAINT;
  context.fillRect(84, L.rule, width - 168, 4);

  fitText(context, [{ text: "নাম", color: MUTED, weight: 600 }], 84, L.nameLabel, 26, 200);
  fitText(context, [{ text: data.name || "আমার স্কোর", color: CHALK, weight: 800, display: true }], 84, L.name, 60, width - 168);

  const plateW = format === "story" ? 220 : 200;
  plate(context, 84, L.plateTop, plateW, L.plateH, bn(score), L.plateH * 0.7);
  fitText(context, [{ text: "/", color: CHALK, weight: 700, display: true }], 84 + plateW + 34, L.plateTop + L.plateH * 0.72, L.plateH * 0.5, 60, "center");
  plate(context, 84 + plateW + 68, L.plateTop, plateW, L.plateH, bn(PER_SET), L.plateH * 0.7);

  const colX = 84 + plateW * 2 + 110;
  const colW = right - colX;
  fitText(context, [{ text: done ? "উপাধি" : "চলছে…", color: MUTED, weight: 600 }], colX, L.rankLabel, 28, colW);
  context.font = `800 ${format === "story" ? 68 : 60}px ${DISPLAY_FONT}`;
  const rankLines = wrapText(context, done ? rank(score) : `প্রশ্ন ${bn(data.answers.length)}/১০`, colW, 2);
  rankLines.forEach((line, index) => fitText(context, [{ text: line, color: PAINT, weight: 800, display: true }], colX, L.rank + index * (format === "story" ? 76 : 66), format === "story" ? 68 : 60, colW));
  fitText(context, [{ text: `১০টার মধ্যে ${bn(score)}টা ঠিক`, color: CHALK, weight: 600 }], colX, L.tally + (rankLines.length - 1) * (format === "story" ? 76 : 66), 30, colW);

  fitText(context, [{ text: "১০টা মুহূর্ত, সাদা মানে মনে আছে", color: MUTED, weight: 600 }], 84, L.rowLabel, 26, width - 168);
  const gap = 12;
  const cell = (width - 168 - gap * (PER_SET - 1)) / PER_SET;
  questionsOf(data.set).forEach((question, index) => {
    const x = 84 + index * (cell + gap);
    const mark = hits[index];
    roundedRect(context, x, L.row, cell, L.rowH, 8);
    if (mark) {
      context.fillStyle = PLATE; context.fill();
      context.strokeStyle = PLATE_INK; context.lineWidth = 7; context.lineCap = "round"; context.lineJoin = "round";
      const cx = x + cell / 2, cy = L.row + L.rowH / 2;
      context.beginPath(); context.moveTo(cx - 18, cy + 2); context.lineTo(cx - 5, cy + 15); context.lineTo(cx + 20, cy - 14); context.stroke();
    } else if (mark === false) {
      context.fillStyle = OFF; context.fill();
      context.fillStyle = "#56605a"; context.fillRect(x + cell / 2 - 14, L.row + L.rowH / 2 - 3, 28, 6);
    } else {
      context.strokeStyle = "#3d4a42"; context.lineWidth = 3; context.setLineDash([8, 8]); context.stroke(); context.setLineDash([]);
    }
    fitText(context, [{ text: question.year, color: question.kind === "heart" ? "#f0a18f" : MUTED, weight: 600 }], x + cell / 2, L.years, 24, cell + 6, "center");
  });

  context.font = `700 ${L.lineSize}px ${DISPLAY_FONT}`;
  const lines = done ? wrapText(context, humanLine(data.set, data.answers), width - 168 - (format === "feed" ? 140 : 0), 2) : ["বাকিগুলোর উত্তর দিলেই স্কোরকার্ড পুরো হবে।"];
  lines.forEach((line, index) => fitText(context, [{ text: line, color: CHALK, weight: 700, display: true }], 84, L.line + index * L.lineGap, L.lineSize, width - 168));

  const friend = data.friend && data.friend.set === data.set ? data.friend : null;
  if (friend && done) {
    const friendScore = scoreOf(friend.set, friend.answers);
    context.font = `600 34px ${BODY_FONT}`;
    fitText(context, [{ text: `${friend.name || "বন্ধু"} পেয়েছিল ${bn(friendScore)}`, color: PAINT, weight: 700 }, { text: score > friendScore ? " · আমি এগিয়ে!" : score === friendScore ? " · সমানে সমান!" : " · এবার হার মানলাম", color: CHALK, weight: 600 }], 84, L.match, 34, width - 168 - 200);
  }

  stumps(context, right - 10, L.ground, format === "story" ? 150 : 130);
  drawFooterBand(context, format, "তুমি কয়টা পারবে?", site, { band: "#0e1511", ask: PAINT, site: "#ffffff" });
}

export const cardBlob = (data: CardData, format: CardFormat, site: string) => renderCard(canvas => drawCard(canvas, data, format, site));

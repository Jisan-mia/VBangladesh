import { BODY_FONT, DISPLAY_FONT, cardSizes, drawFooterBand, fitText, renderCard, type CardFormat } from "../../../shared/card-canvas";
import { bn, bnPoint, gpaOf, gradeLabel, gradePoint, ke, possessive, sameCount, ITEMS_PER_PACK, type Grade, type Grades, type Pack, type Score } from "./grades";

export type SheetCard = {
  pack: Pack;
  grades: Grades;
  name: string;
  /** The national average per item, or null where too few have graded it. */
  national: readonly (Grade | null)[];
  score: Score | null;
  line: string;
  friend: { name: string; grades: readonly Grade[] } | null;
};

const PAPER = "#fffdf5";
const WAVE = "#a9cdb6";
const PRINT = "#1f5c45";
const SOFT = "#6c8f7f";
const TINT = "#eef5ee";
const INK = "#1d2433";
const RED = "#cf2229";
const BLUE = "#2346a8";

/** The security-print border every board certificate has: two families of fine crossing waves. */
function drawGuilloche(context: CanvasRenderingContext2D, width: number, height: number) {
  context.fillStyle = "#e3f0e6";
  context.fillRect(0, 0, width, height);
  context.strokeStyle = WAVE;
  context.lineWidth = 1.4;
  for (const phase of [0, Math.PI]) {
    for (let base = -20; base < height + 20; base += 13) {
      context.beginPath();
      for (let x = 0; x <= width; x += 6) {
        const y = base + Math.sin(x / 34 + phase + base / 60) * 9;
        if (x) context.lineTo(x, y); else context.moveTo(x, y);
      }
      context.stroke();
    }
  }
}

/** A red-pen loop around a grade: drawn past its start so it overlaps like a real hand. */
function penRing(context: CanvasRenderingContext2D, cx: number, cy: number, rx: number, ry: number, seed: number) {
  context.save();
  context.strokeStyle = RED;
  context.lineCap = "round";
  for (const [lineWidth, alpha, shift] of [[5, 0.92, 0], [2.4, 0.45, 2.5]] as const) {
    context.lineWidth = lineWidth;
    context.globalAlpha = alpha;
    context.beginPath();
    const start = -2.4 + (seed % 5) * 0.12;
    for (let step = 0; step <= 56; step++) {
      const t = step / 56, angle = start + (Math.PI * 2 + 0.55) * t;
      const grow = 1 + 0.09 * t + 0.025 * Math.sin(angle * 3 + seed);
      const x = cx + shift + Math.cos(angle) * rx * grow, y = cy + Math.sin(angle) * ry * grow;
      if (step) context.lineTo(x, y); else context.moveTo(x, y);
    }
    context.stroke();
  }
  context.restore();
}

/** Handwritten-looking text: display weight, a slight tilt. */
function pen(context: CanvasRenderingContext2D, text: string, x: number, y: number, size: number, color: string, tilt = -0.07, maxWidth = 400) {
  context.save();
  context.translate(x, y);
  context.rotate(tilt);
  context.font = `800 ${size}px ${DISPLAY_FONT}`;
  while (context.measureText(text).width > maxWidth && size > 16) context.font = `800 ${--size}px ${DISPLAY_FONT}`;
  context.textAlign = "center";
  context.fillStyle = color;
  context.fillText(text, 0, size * 0.34);
  context.restore();
}

function printed(context: CanvasRenderingContext2D, text: string, x: number, y: number, size: number, color: string, align: CanvasTextAlign, maxWidth: number, weight = 600) {
  context.font = `${weight} ${size}px ${BODY_FONT}`;
  while (context.measureText(text).width > maxWidth && size > 14) context.font = `${weight} ${--size}px ${BODY_FONT}`;
  context.textAlign = align;
  context.fillStyle = color;
  context.fillText(text, x, y);
}

function stamp(context: CanvasRenderingContext2D, lines: string[], cx: number, cy: number, story: boolean) {
  const width = story ? 400 : 370, height = lines.length > 1 ? (story ? 128 : 116) : (story ? 96 : 88);
  context.save();
  context.translate(cx, cy);
  context.rotate(-0.08);
  context.globalAlpha = 0.88;
  context.strokeStyle = RED;
  context.lineWidth = 5;
  context.strokeRect(-width / 2, -height / 2, width, height);
  context.lineWidth = 2;
  context.strokeRect(-width / 2 + 9, -height / 2 + 9, width - 18, height - 18);
  const [head, sub] = lines;
  fitText(context, [{ text: head, color: RED, weight: 800, display: true }], 0, sub ? -6 : (story ? 16 : 14), story ? 46 : 42, width - 44, "center");
  if (sub) fitText(context, [{ text: sub, color: RED, weight: 600 }], 0, story ? 42 : 38, story ? 30 : 27, width - 44, "center");
  context.restore();
}

export function drawSheet(canvas: HTMLCanvasElement, card: SheetCard, format: CardFormat, site: string) {
  const { width, height } = cardSizes[format];
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext("2d");
  if (!context) return;
  const story = format === "story";
  // Story text stays between storySafe.top (250) and the footer band (1660).
  const footerTop = story ? height - 260 : height - 96;
  const left = 84, right = width - 84, center = width / 2;

  drawGuilloche(context, width, footerTop);
  const inset = 40;
  context.fillStyle = PAPER;
  context.fillRect(inset, story ? 200 : inset, width - inset * 2, footerTop - inset - (story ? 200 : inset));
  context.strokeStyle = PRINT;
  context.lineWidth = 3;
  context.strokeRect(inset + 10, (story ? 200 : inset) + 10, width - inset * 2 - 20, footerTop - inset - (story ? 200 : inset) - 20);
  context.lineWidth = 1;
  context.strokeRect(inset + 17, (story ? 200 : inset) + 17, width - inset * 2 - 34, footerTop - inset - (story ? 200 : inset) - 34);

  const top = story ? 300 : 116;
  printed(context, `দেশি পরীক্ষা · বিষয়: ${card.pack.label}`, center, top, story ? 32 : 28, SOFT, "center", right - left);
  const who = card.name ? `${possessive(card.name)} রেজাল্ট শিট` : "আমার রেজাল্ট শিট";
  fitText(context, [{ text: who, color: PRINT, weight: 800, display: true }], center, top + (story ? 84 : 74), story ? 72 : 64, right - left, "center");

  // Columns: serial, subject, grade, point, and a third for the friend's grade or the national average.
  const third = card.friend ? (card.friend.name || "বন্ধু") : card.national.some(Boolean) ? "দেশের গড়" : "";
  const cols = third
    ? { serial: left, subject: left + 76, grade: 560, point: 730, third: 850, end: right }
    : { serial: left, subject: left + 76, grade: 610, point: 800, third: right, end: right };
  const tableTop = top + (story ? 136 : 116);
  const headHeight = story ? 66 : 58;
  const rowHeight = story ? 96 : 80;
  const tableBottom = tableTop + headHeight + rowHeight * ITEMS_PER_PACK;

  context.fillStyle = PRINT;
  context.fillRect(left, tableTop, right - left, headHeight);
  const headY = tableTop + headHeight * 0.66, headSize = story ? 30 : 27;
  printed(context, "ক্রমিক", (cols.serial + cols.subject) / 2, headY, headSize - 4, "#ffffff", "center", cols.subject - cols.serial - 10);
  printed(context, "বিষয়", cols.subject + 18, headY, headSize, "#ffffff", "left", cols.grade - cols.subject - 30);
  printed(context, "গ্রেড", (cols.grade + cols.point) / 2, headY, headSize, "#ffffff", "center", cols.point - cols.grade - 10);
  printed(context, "পয়েন্ট", (cols.point + cols.third) / 2, headY, headSize, "#ffffff", "center", cols.third - cols.point - 10);
  if (third) printed(context, third, (cols.third + cols.end) / 2, headY, headSize, card.friend ? "#cfe0ff" : "#ffffff", "center", cols.end - cols.third - 14);

  card.pack.items.forEach((item, index) => {
    const y = tableTop + headHeight + index * rowHeight, mid = y + rowHeight / 2;
    if (index % 2) { context.fillStyle = TINT; context.fillRect(left, y, right - left, rowHeight); }
    printed(context, bn(index + 1), (cols.serial + cols.subject) / 2, mid + 11, story ? 34 : 30, SOFT, "center", 60);
    printed(context, item.name, cols.subject + 18, mid + 13, story ? 44 : 38, INK, "left", cols.grade - cols.subject - 30);
    const grade = card.grades[index];
    const gradeX = (cols.grade + cols.point) / 2;
    if (grade) {
      pen(context, gradeLabel[grade], gradeX, mid, story ? 56 : 48, RED);
      penRing(context, gradeX, mid, story ? 62 : 54, story ? 36 : 30, index * 7 + gradePoint[grade]);
      printed(context, bnPoint(gradePoint[grade]), (cols.point + cols.third) / 2, mid + 12, story ? 36 : 32, INK, "center", 120, 500);
    } else {
      printed(context, "—", gradeX, mid + 12, 34, SOFT, "center", 80);
      printed(context, "—", (cols.point + cols.third) / 2, mid + 12, 34, SOFT, "center", 80);
    }
    if (card.friend) {
      const theirs = card.friend.grades[index];
      pen(context, gradeLabel[theirs], (cols.third + cols.end) / 2 - (grade ? 14 : 0), mid, story ? 48 : 42, BLUE, 0.05);
      if (grade === theirs) printed(context, "✓", cols.end - 22, mid + 12, story ? 34 : 30, BLUE, "center", 40, 700);
    } else if (third) {
      const national = card.national[index];
      printed(context, national ? gradeLabel[national] : "—", (cols.third + cols.end) / 2, mid + 13, story ? 40 : 36, national ? PRINT : SOFT, "center", 120, 700);
    }
  });

  // The printed grid: rules between rows and columns, and a heavier outer frame.
  context.strokeStyle = PRINT;
  context.globalAlpha = 0.35;
  context.lineWidth = 1.5;
  for (let index = 1; index < ITEMS_PER_PACK; index++) {
    const y = tableTop + headHeight + index * rowHeight;
    context.beginPath(); context.moveTo(left, y); context.lineTo(right, y); context.stroke();
  }
  for (const x of [cols.subject, cols.grade, cols.point, ...(third ? [cols.third] : [])]) {
    context.beginPath(); context.moveTo(x, tableTop + headHeight); context.lineTo(x, tableBottom); context.stroke();
  }
  context.globalAlpha = 1;
  context.lineWidth = 3;
  context.strokeRect(left, tableTop, right - left, tableBottom - tableTop);

  // মন্তব্য: the examiner's remark, in the same red pen.
  const remarkY = tableBottom + (story ? 70 : 58);
  printed(context, "মন্তব্য:", left, remarkY, story ? 32 : 28, PRINT, "left", 140);
  context.font = `600 ${story ? 32 : 28}px ${BODY_FONT}`;
  const labelWidth = context.measureText("মন্তব্য:").width + 18;
  fitText(context, [{ text: card.line, color: RED, weight: 700, display: true }], left + labelWidth, remarkY + 2, story ? 42 : 36, right - left - labelWidth);
  context.strokeStyle = SOFT;
  context.setLineDash([3, 7]);
  context.lineWidth = 2;
  context.beginPath(); context.moveTo(left + labelWidth, remarkY + 16); context.lineTo(right, remarkY + 16); context.stroke();
  context.setLineDash([]);

  // The result row: GPA box on the left, a red stamp (or the examiner's signature) on the right.
  const rowTop = remarkY + (story ? 52 : 42), boxHeight = story ? 124 : 108;
  context.strokeStyle = PRINT;
  context.lineWidth = 3;
  context.strokeRect(left, rowTop, 330, boxHeight);
  printed(context, "জিপিএ", left + 22, rowTop + (story ? 44 : 38), story ? 28 : 25, PRINT, "left", 200);
  const gpa = card.grades.every(Boolean) ? gpaOf(card.grades) : null;
  fitText(context, [{ text: gpa === null ? "—" : bnPoint(gpa), color: gpa === null ? SOFT : RED, weight: 800, display: true }], left + 22, rowTop + boxHeight - (story ? 22 : 18), story ? 64 : 56, 180);
  printed(context, "৫-এর মধ্যে", left + 308, rowTop + boxHeight - (story ? 26 : 22), story ? 24 : 22, SOFT, "right", 110, 500);

  const friendMatch = card.friend ? `দুজনের মিল ${bn(sameCount(card.grades, card.friend.grades))}/${bn(ITEMS_PER_PACK)}` : "";
  const nationMatch = card.score ? `দেশের সাথে মিল ${bn(card.score.match)}/${bn(card.score.of)}` : "";
  const stampX = (left + 330 + right) / 2 + 10, stampY = rowTop + boxHeight / 2;
  if (friendMatch || nationMatch) stamp(context, friendMatch ? [friendMatch, ...(nationMatch ? [nationMatch] : [])] : [nationMatch, "যারা গ্রেড দিয়েছে তাদের সাথে"], stampX, stampY, story);
  else {
    if (card.name) pen(context, card.name, stampX, stampY - 8, story ? 50 : 44, RED, -0.05, 360);
    else {
      // No name: an anonymous red scribble, the way every examiner signs.
      const y = stampY - 6;
      context.strokeStyle = RED; context.lineWidth = 4; context.lineCap = "round";
      context.beginPath(); context.moveTo(stampX - 120, y + 12);
      context.bezierCurveTo(stampX - 95, y - 40, stampX - 70, y + 34, stampX - 40, y - 6);
      context.bezierCurveTo(stampX - 12, y - 44, stampX + 14, y + 30, stampX + 46, y - 4);
      context.bezierCurveTo(stampX + 76, y - 30, stampX + 96, y + 16, stampX + 132, y + 2);
      context.stroke();
    }
    context.strokeStyle = INK; context.lineWidth = 2;
    context.beginPath(); context.moveTo(stampX - 170, stampY + 24); context.lineTo(stampX + 170, stampY + 24); context.stroke();
    printed(context, "পরীক্ষকের স্বাক্ষর", stampX, stampY + (story ? 58 : 52), story ? 26 : 23, SOFT, "center", 340, 500);
  }

  printed(context, "গ্রেড পয়েন্ট স্কুলের মতো: A+ ৫ · A ৪ · B ৩ · C ২ · F ০", center, footerTop - (story ? 84 : 72), story ? 24 : 21, SOFT, "center", right - left, 500);
  drawFooterBand(context, format, `তুমি ${ke(card.pack.items[0].name)} কত দেবে?`, site, { band: "#173f31", ask: "#ffd166", site: "#ffffff" });
}

export const cardBlob = (card: SheetCard, format: CardFormat, site: string) => renderCard(canvas => drawSheet(canvas, card, format, site));

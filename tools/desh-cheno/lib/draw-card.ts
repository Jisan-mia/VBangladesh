import { cardSizes, drawFooterBand, fitText, renderCard, roundedRect, wrapText, BODY_FONT, type CardFormat } from "../../../shared/card-canvas";
import { drawDoodle, starPath } from "./doodles";
import { badge, bn, cardTitle, humanLine, isRight, scoreLine, scoreOf, setById, type Result } from "./game";

// A sky-blue chart paper taped to a pale classroom wall: marker headings, gold star stickers for right answers.
const c = { wall: "#e3ebe1", wallLine: "#d3ddd0", paper: "#cfe8f7", paperEdge: "#a9cde6", ink: "#183a6b", red: "#d62839", gold: "#f5b301", goldLine: "#9a6a00", empty: "#7f9fbf", note: "#fff1a6", tape: "rgba(244,231,180,.85)", green: "#006a4e", flagRed: "#f42a41" };

const layouts = {
  feed: { chart: { x: 56, y: 44, w: 968, h: 1166 }, title: 150, label: 214, name: 340, score: 496, note: 540, stars: [728, 872], radius: 62, line: 1004, corners: [40, 40, 1150] },
  story: { chart: { x: 56, y: 280, w: 968, h: 1340 }, title: 150, label: 214, name: 370, score: 560, note: 610, stars: [850, 1020], radius: 72, line: 1160, corners: [40, 40, 1320] },
} as const;

function tape(context: CanvasRenderingContext2D, x: number, y: number, angle: number) {
  context.save();
  context.translate(x, y); context.rotate(angle);
  context.fillStyle = c.tape;
  context.fillRect(-70, -20, 140, 40);
  context.restore();
}

/** Marker underline with a little wobble, like a teacher's double underline. */
function wobble(context: CanvasRenderingContext2D, x1: number, x2: number, y: number, color: string) {
  context.strokeStyle = color; context.lineWidth = 6; context.lineCap = "round";
  for (const offset of [0, 14]) {
    context.beginPath(); context.moveTo(x1, y + offset);
    for (let x = x1; x <= x2; x += 40) context.quadraticCurveTo(x + 20, y + offset + (offset ? -4 : 4), x + 40, y + offset);
    context.stroke();
  }
}

export function drawCard(canvas: HTMLCanvasElement, result: Result, format: CardFormat, site: string) {
  const { width, height } = cardSizes[format];
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext("2d");
  if (!context) throw new Error("এই ব্রাউজারে ছবি বানানো যাচ্ছে না।");
  const quiz = setById(result.set)!;
  const score = scoreOf(result.set, result.picks);
  const layout = layouts[format];
  const { chart } = layout;
  const cx = chart.w / 2;

  // Wall, with faint brush strokes.
  context.fillStyle = c.wall; context.fillRect(0, 0, width, height);
  context.strokeStyle = c.wallLine; context.lineWidth = 2;
  for (let x = 30; x < width; x += 64) { context.beginPath(); context.moveTo(x, 0); context.lineTo(x + 18, height); context.stroke(); }

  context.save();
  context.translate(chart.x + chart.w / 2, chart.y + chart.h / 2);
  context.rotate(-0.008);
  context.translate(-chart.w / 2, -chart.h / 2);

  // The sheet.
  context.fillStyle = "rgba(24,58,107,.18)"; context.fillRect(10, 14, chart.w, chart.h);
  context.fillStyle = c.paper; context.fillRect(0, 0, chart.w, chart.h);
  context.strokeStyle = c.paperEdge; context.lineWidth = 3; context.strokeRect(0, 0, chart.w, chart.h);

  // Hand-drawn border: red marker, or red-green for the Victory Day set.
  const inset = 26;
  context.lineWidth = quiz.victory ? 14 : 6;
  context.setLineDash([30, 16]);
  context.strokeStyle = quiz.victory ? c.green : c.red;
  roundedRect(context, inset, inset, chart.w - inset * 2, chart.h - inset * 2, 18); context.stroke();
  if (quiz.victory) {
    context.lineDashOffset = 23; context.strokeStyle = c.flagRed;
    roundedRect(context, inset, inset, chart.w - inset * 2, chart.h - inset * 2, 18); context.stroke();
    context.lineDashOffset = 0;
  }
  context.setLineDash([]);

  // Corner doodles, as if drawn by the class.
  const [left, top, bottom] = layout.corners;
  drawDoodle(context, quiz.victory ? "potaka" : "shapla", left + 10, top + 10, 120, -0.1);
  drawDoodle(context, "doyel", chart.w - left - 140, top + 6, 130, 0.08);
  drawDoodle(context, "ilish", left - 10, bottom - 140, 120, -0.12);
  drawDoodle(context, quiz.victory ? "shapla" : "kathal", chart.w - left - 100, bottom - 140, 110, 0.1);

  // Heading with a double underline.
  const title = cardTitle(result.set);
  const used = fitText(context, [{ text: title, color: c.red, weight: 800, display: true }], cx, layout.title, quiz.victory ? 64 : 84, quiz.victory ? 560 : 640, "center");
  context.font = `800 ${used}px ${BODY_FONT}`;
  const half = Math.min(quiz.victory ? 280 : 320, context.measureText(title).width / 2);
  wobble(context, cx - half, cx + half, layout.title + 22, c.red);
  fitText(context, [{ text: quiz.victory ? `লাল-সবুজের ${bn(10)}টা প্রশ্ন` : `${quiz.label} · ${bn(10)}টা প্রশ্ন`, color: c.ink, weight: 600 }], cx, layout.label + 20, 34, 620, "center");

  fitText(context, [{ text: result.name || "আমার চার্ট", color: c.ink, weight: 800, display: true }], cx, layout.name, 96, 700, "center");
  fitText(context, [{ text: scoreLine(score), color: c.red, weight: 800, display: true }], cx, layout.score, 150, 700, "center");

  // The badge on a yellow sticky note.
  const label = badge(score);
  context.font = `800 44px ${BODY_FONT}`;
  const noteW = Math.min(620, context.measureText(label).width + 90);
  context.save();
  context.translate(cx, layout.note + 40); context.rotate(0.025);
  context.fillStyle = "rgba(24,58,107,.15)"; context.fillRect(-noteW / 2 + 6, -34, noteW, 80);
  context.fillStyle = c.note; context.fillRect(-noteW / 2, -40, noteW, 80);
  fitText(context, [{ text: label, color: c.ink, weight: 800, display: true }], 0, 16, 44, noteW - 40, "center");
  context.restore();

  // Ten stars: gold sticker = right, an empty outline = missed.
  const gap = Math.min(170, layout.radius * 2.7);
  quiz.questions.forEach((question, index) => {
    const row = Math.floor(index / 5), col = index % 5;
    const sx = cx + (col - 2) * gap, sy = layout.stars[row];
    const right = isRight(question, result.picks[index]);
    const path = new Path2D(starPath(sx, sy, layout.radius));
    context.lineJoin = "round";
    if (right) {
      context.save(); context.translate(4, 6); context.fillStyle = "rgba(24,58,107,.2)"; context.fill(path); context.restore();
      context.fillStyle = c.gold; context.fill(path);
      context.strokeStyle = c.goldLine; context.lineWidth = 4; context.stroke(path);
    } else {
      context.setLineDash([12, 9]); context.strokeStyle = c.empty; context.lineWidth = 5; context.stroke(path); context.setLineDash([]);
    }
    fitText(context, [{ text: bn(index + 1), color: right ? c.ink : c.empty, weight: 700 }], sx, sy + 16, 30, layout.radius * 0.7, "center");
  });

  context.font = `600 44px ${BODY_FONT}`;
  wrapText(context, humanLine(result), 660, 3).forEach((line, index) => {
    fitText(context, [{ text: line, color: c.ink, weight: 600 }], cx, layout.line + index * 58, 44, 660, "center");
  });
  context.restore();

  // Tape over the top corners, on top of the rotated sheet.
  tape(context, chart.x + 40, chart.y + 6, -0.6);
  tape(context, chart.x + chart.w - 40, chart.y + 6, 0.6);

  drawFooterBand(context, format, "তুমি দেশকে কতটা চেনো?", site, { band: c.ink, ask: "#ffd166", site: "#ffffff" });
}

export const cardBlob = (result: Result, format: CardFormat, site: string) => renderCard(canvas => drawCard(canvas, result, format, site));

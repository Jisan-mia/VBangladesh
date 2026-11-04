import { cardSizes, DISPLAY_FONT, drawFooterBand, fitText, renderCard, wrapText, type CardFormat } from "../../../shared/card-canvas";
import { CHITS, makeClass, REPLIES } from "./class";
import { benchesOf, bn, seconds, type Shared } from "./challenge";
import { drawCeilingFan, drawTeacherWriting } from "./draw.hot";
import { levelDef, WORLDS } from "./levels";
import { cardLine, caughtFact } from "./lines";
import { CHALK, paintPaper, PALETTES, PEN } from "./scene";

// Feed and story share one drawing; the story moves things into its taller safe area.
const LAYOUT = {
  feed: { board: [56, 60, 968, 560], kicker: 140, name: 246, time: 430, sub: 518, wall: 690, desk: 740, paper: [150, 786, 780, 300], human: 1158, pencil: 1214 },
  story: { board: [56, 290, 968, 600], kicker: 390, name: 500, time: 700, sub: 800, wall: 980, desk: 1040, paper: [150, 1110, 780, 330], human: 1590, pencil: 1500 },
} as const;

function chalk(ctx: CanvasRenderingContext2D, text: string, x: number, y: number, size: number, maxWidth: number, weight = 700, align: "left" | "center" = "left") {
  // Two passes, the second faint and offset, so it reads as chalk rather than print.
  ctx.globalAlpha = 0.3;
  fitText(ctx, [{ text, color: CHALK, weight, display: true }], x + 2, y + 2, size, maxWidth, align);
  ctx.globalAlpha = 0.92;
  const used = fitText(ctx, [{ text, color: CHALK, weight, display: true }], x, y, size, maxWidth, align);
  ctx.globalAlpha = 1;
  return used;
}

function star(ctx: CanvasRenderingContext2D, x: number, y: number, r: number, on: boolean) {
  ctx.beginPath();
  for (let i = 0; i < 10; i++) { const a = -Math.PI / 2 + i * Math.PI / 5, d = i % 2 ? r * 0.45 : r; ctx.lineTo(x + Math.cos(a) * d, y + Math.sin(a) * d); }
  ctx.closePath();
  ctx.fillStyle = on ? "#ffd166" : "rgba(244,241,232,.18)"; ctx.fill();
  ctx.lineWidth = 3; ctx.strokeStyle = on ? "#f4f1e8" : "rgba(244,241,232,.35)"; ctx.stroke();
}

/** Where on the ladder, for the card's chalk line. */
export const cardWhere = (shared: Pick<Shared, "level" | "old">) => shared.old ? `ক্লাস ${bn(shared.level)}` : `${WORLDS[levelDef(shared.level).world].name} · লেভেল ${bn(shared.level)}`;

/** A blackboard with the time in chalk, and the opened chit on the desk below it. `stars` 0 draws none (an old link). */
export function drawCard(canvas: HTMLCanvasElement, shared: Shared, format: CardFormat, site: string, stars = 0) {
  const { width, height } = cardSizes[format];
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("এই ব্রাউজারে ছবি বানানো যাচ্ছে না।");
  const at = LAYOUT[format];
  const klass = makeClass(shared.seed, shared.level, shared.mode, shared.old), p = PALETTES[klass.world];

  ctx.fillStyle = p.wall; ctx.fillRect(0, 0, width, at.wall);
  ctx.fillStyle = p.dado; ctx.fillRect(0, at.wall, width, at.desk - at.wall);
  ctx.fillStyle = p.dadoLine; ctx.fillRect(0, at.wall - 6, width, 8);
  if (format === "story") {
    ctx.fillStyle = p.ceiling; ctx.fillRect(0, 0, width, 70);
    ctx.fillStyle = p.wallLine; ctx.fillRect(0, 66, width, 6);
    drawCeilingFan(ctx, width / 2, 0, 4);
  }

  const [bx, by, bw, bh] = at.board;
  ctx.fillStyle = "#8a5a34"; ctx.fillRect(bx - 16, by - 16, bw + 32, bh + 32);
  ctx.fillStyle = p.board; ctx.fillRect(bx, by, bw, bh);
  ctx.fillStyle = "rgba(255,255,255,.05)";
  for (const [dx, dy, r] of [[180, 380, 150], [700, 150, 190], [820, 440, 120]]) { ctx.beginPath(); ctx.ellipse(bx + dx, by + dy, r, r * 0.42, -0.3, 0, Math.PI * 2); ctx.fill(); }
  ctx.fillStyle = "#74492a"; ctx.fillRect(bx - 10, by + bh + 14, bw + 20, 18);
  ctx.fillStyle = CHALK; ctx.fillRect(bx + 80, by + bh + 6, 34, 10); ctx.fillRect(bx + 130, by + bh + 8, 18, 8);
  ctx.fillStyle = "#6b4b2e"; ctx.fillRect(bx + bw - 170, by + bh - 6, 92, 22);
  ctx.fillStyle = "#9c9c94"; ctx.fillRect(bx + bw - 170, by + bh + 14, 92, 6);

  // The teacher writes on the right of the board, back to the class; the chalk text keeps to the left of them.
  drawTeacherWriting(ctx, klass.teacher, klass.world, bx + bw - 200 - 180 * 2.5, by + bh - 198 * 2.5, 2.5);
  const left = bx + 56, inner = bw - 112 - 250;
  const kickerSize = chalk(ctx, "স্যার ঘুরলেই থামো", left, at.kicker, 40, inner, 600);
  ctx.font = `600 ${kickerSize}px ${DISPLAY_FONT}`;
  ctx.globalAlpha = 0.7; ctx.fillStyle = CHALK; ctx.fillRect(left, at.kicker + 14, ctx.measureText("স্যার ঘুরলেই থামো").width, 4); ctx.globalAlpha = 1;
  chalk(ctx, shared.name || "চিরকুট পৌঁছে গেছে", left, at.name, 76, inner, 800);
  const number = seconds(shared.tenths);
  const numberSize = chalk(ctx, number, left - 4, at.time, 170, 520, 800);
  ctx.font = `800 ${numberSize}px ${DISPLAY_FONT}`;
  const numberWidth = ctx.measureText(number).width;
  chalk(ctx, "সেকেন্ডে", left + numberWidth + 18, at.time, 58, inner - numberWidth - 18);
  chalk(ctx, `${cardWhere(shared)} · ${bn(benchesOf(shared))} বেঞ্চ পার · ${caughtFact(shared.catches)}`, left, at.sub, 40, inner, 600);
  if (stars) for (let i = 0; i < 3; i++) star(ctx, left + inner - 130 + i * 52, at.kicker - 14, 21, i < stars);

  // The desk.
  ctx.fillStyle = "#8b5a33"; ctx.fillRect(0, at.desk, width, height - at.desk);
  ctx.fillStyle = "#a46c3f"; ctx.fillRect(0, at.desk, width, 14);
  ctx.strokeStyle = "rgba(60,30,10,.18)"; ctx.lineWidth = 3;
  for (let gy = at.desk + 60; gy < height; gy += 74) { ctx.beginPath(); ctx.moveTo(0, gy); ctx.bezierCurveTo(width * 0.3, gy - 14, width * 0.6, gy + 16, width, gy - 4); ctx.stroke(); }

  // A pencil beside the chit.
  ctx.save();
  ctx.translate(width - 250, at.pencil); ctx.rotate(-0.1);
  ctx.fillStyle = "#f2c230"; ctx.fillRect(-150, -11, 270, 22);
  ctx.fillStyle = "#e8a0a8"; ctx.fillRect(-180, -11, 30, 22);
  ctx.fillStyle = "#c9c9c9"; ctx.fillRect(-152, -11, 6, 22);
  ctx.fillStyle = "#f1d7a8"; ctx.beginPath(); ctx.moveTo(120, -11); ctx.lineTo(160, 0); ctx.lineTo(120, 11); ctx.closePath(); ctx.fill();
  ctx.fillStyle = "#333"; ctx.beginPath(); ctx.moveTo(148, -3.3); ctx.lineTo(160, 0); ctx.lineTo(148, 3.3); ctx.closePath(); ctx.fill();
  ctx.restore();

  // The opened chit and the reply.
  const [px, py, pw, ph] = at.paper;
  ctx.save();
  ctx.translate(px + pw / 2, py + ph / 2); ctx.rotate(-0.035);
  paintPaper(ctx, -pw / 2, -ph / 2, pw, ph, 3);
  const note = CHITS[klass.chit], room = pw - 140;
  ctx.font = `700 64px ${DISPLAY_FONT}`;
  const lines = wrapText(ctx, note, room, 2);
  lines.forEach((line, index) => fitText(ctx, [{ text: line, color: PEN, weight: 700, display: true }], -pw / 2 + 96, -ph / 2 + (lines.length === 1 ? 140 : 112) + index * 80, 64, room));
  fitText(ctx, [{ text: `— ${REPLIES[klass.reply]}`, color: "#b03a2e", weight: 700, display: true }], pw / 2 - 60, ph / 2 - 44, 54, pw - 200, "right");
  ctx.restore();

  fitText(ctx, [{ text: cardLine(stars, klass.teacher), color: "#fff6e0", weight: 700, display: true }], width / 2, at.human, 46, width - 140, "center");
  drawFooterBand(ctx, format, "তুমি কত সেকেন্ডে পারবে?", site, { band: "#24382f", ask: "#ffd166", site: "#ffffff" });
}

export const cardBlob = (shared: Shared, format: CardFormat, site: string, stars = 0) => renderCard(canvas => drawCard(canvas, shared, format, site, stars));

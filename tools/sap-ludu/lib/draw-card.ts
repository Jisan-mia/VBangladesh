// The share card: the board with everyone's pieces where they finished, the winner's rolls, and the snakes and ladders they met.
import { cardSizes, drawFooterBand, fitText, renderCard, roundedRect, type CardFormat } from "../../../shared/card-canvas";
import { SIZE } from "./board";
import { drawBoard, drawPieces, SEATS } from "./draw-board";
import { biteText, bn, headline, highlights, humanLine, scoreboard, winnerMoves, type Result } from "./result";

export const PAPER = "#fff4dc", INK = "#3a2412", ACCENT = "#1f6f5c", DEEP = "#7a1f2b";
const MUTED = "#7a5a3a";

const layouts = {
  feed: { title: 118, sub: 168, head: 262, headSize: 78, stats: 330, boardTop: 386, board: 700, line1: 1164, line2: 1220 },
  story: { title: 330, sub: 382, head: 484, headSize: 86, stats: 560, boardTop: 622, board: 850, line1: 1556, line2: 1616 },
} as const;

export function drawCard(canvas: HTMLCanvasElement, result: Result, format: CardFormat, site: string) {
  const { width, height } = cardSizes[format];
  canvas.width = width; canvas.height = height;
  const context = canvas.getContext("2d");
  if (!context) throw new Error("এই ব্রাউজারে ছবি বানানো যাচ্ছে না।");
  const at = layouts[format], { card, game } = result, solo = card.players === 1, seat = SEATS[game.winner];

  context.fillStyle = PAPER; context.fillRect(0, 0, width, height);
  // A soft checker in the corners, like the printed back of a board.
  context.fillStyle = "#f6e3b8";
  for (let x = 0; x < width; x += 60) for (let y = 0; y < height; y += 60) if ((x + y) / 60 % 2 === 0) context.fillRect(x, y, 60, 60);
  context.fillStyle = PAPER; roundedRect(context, 40, format === "story" ? 230 : 34, width - 80, height - (format === "story" ? 500 : 140), 40); context.fill();

  fitText(context, [{ text: "সাপলুডু", color: DEEP, weight: 800, display: true }], width / 2, at.title, 72, 800, "center");
  fitText(context, [{ text: solo ? "একা দৌড় · দুই গুটি · ঠিক ১০০-তে" : `এক ফোনে ${bn(card.players)} জন${card.pieces === 2 ? " · দুই গুটি" : ""}`, color: MUTED, weight: 600 }], width / 2, at.sub, 32, 800, "center");
  fitText(context, [{ text: headline(result), color: solo ? INK : seat.color, weight: 800, display: true }], width / 2, at.head, at.headSize, width - 140, "center");
  fitText(context, [
    { text: bn(winnerMoves(game)), color: ACCENT, weight: 800, display: true },
    { text: ` চালে · ${biteText(game.bites[game.winner])}`, color: INK, weight: 700, display: true },
  ], width / 2, at.stats, 44, width - 140, "center");

  const size = at.board, cell = size / SIZE, left = (width - size) / 2, top = at.boardTop, frame = 16;
  context.fillStyle = "#00000022"; roundedRect(context, left - frame, top - frame + 8, size + frame * 2, size + frame * 2, 22); context.fill();
  context.fillStyle = DEEP; roundedRect(context, left - frame, top - frame, size + frame * 2, size + frame * 2, 22); context.fill();
  context.save(); roundedRect(context, left, top, size, size, 8); context.clip();
  drawBoard(context, cell, left, top);
  drawPieces(context, game.pos, game.pieces, cell, left, top);
  context.restore();

  const first = solo ? highlights(game).join("  ·  ") || "সাপও না, সিঁড়িও না, সোজা দৌড়!" : scoreboard(result);
  fitText(context, [{ text: first, color: MUTED, weight: 600 }], width / 2, at.line1, 34, width - 140, "center");
  fitText(context, [{ text: humanLine(result), color: INK, weight: 700, display: true }], width / 2, at.line2, 42, width - 140, "center");
  drawFooterBand(context, format, solo ? "একই ছক্কায় তুমি কত চালে পারবে?" : "তোমাদের বাসায় কার ভাগ্য ভালো?", site, { band: DEEP, ask: "#ffd43b", site: "#ffffff" });
}

export const cardBlob = (result: Result, format: CardFormat, site: string) => renderCard(canvas => drawCard(canvas, result, format, site));

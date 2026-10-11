import { cardSizes, drawFooterBand, fitText, renderCard, roundedRect, type CardFormat, type Segment } from "../../../shared/card-canvas";
import { borderPath, FLOWERS, HEART, palette, STITCH } from "./art";
import { BOARD, BOX_COUNT, EDGE_COUNT, EDGES, MARGIN, SIZE, UNIT } from "./game";
import { bn, cardNames, humanLine, initials, levelName, type Shared } from "./link";

export type CardData = Pick<Shared, "level" | "score" | "name" | "other"> & { owner: readonly number[] };

let shapes: { flowers: Path2D[]; border: Path2D } | null = null;

/** The finished quilt at any size: the same cloth, stitches, flowers and initials as the live board. */
export function drawQuilt(c: CanvasRenderingContext2D, data: CardData, x: number, y: number, size: number) {
  shapes ??= { flowers: FLOWERS.map(d => new Path2D(d)), border: new Path2D(borderPath(BOARD)) };
  const marks = initials(cardNames(data.level, data.name, data.other));
  c.save();
  c.translate(x, y);
  c.scale(size / BOARD, size / BOARD);
  c.save();
  c.shadowColor = "rgba(58,44,37,0.28)"; c.shadowBlur = 24; c.shadowOffsetY = 10;
  c.fillStyle = palette.cloth; roundedRect(c, 0, 0, BOARD, BOARD, 16); c.fill();
  c.restore();
  c.lineCap = "round";
  c.strokeStyle = palette.ripple; c.lineWidth = 1.6; c.setLineDash([8, 4]);
  for (let row = 0, at = 8; at < BOARD - 4; row++, at += 8) {
    c.lineDashOffset = row % 2 ? 6 : 0;
    c.beginPath(); c.moveTo(6, at); c.lineTo(BOARD - 6, at); c.stroke();
  }
  c.lineDashOffset = 0;
  c.strokeStyle = palette.border; c.lineWidth = 3.5; c.setLineDash([9, 7]); c.stroke(shapes.border);

  for (let box = 0; box < BOX_COUNT; box++) {
    const who = data.owner[box];
    if (who !== 0 && who !== 1) continue;
    c.save();
    c.translate(MARGIN + UNIT * (box % SIZE + 0.5), MARGIN + UNIT * (Math.floor(box / SIZE) + 0.5));
    c.setLineDash([]);
    c.fillStyle = palette.tints[who]; roundedRect(c, -43, -43, 86, 86, 6); c.fill();
    c.fillStyle = palette.players[who]; c.fill(shapes.flowers[who]);
    c.save(); c.scale(0.78, 0.78);
    c.strokeStyle = "rgba(255,255,255,0.55)"; c.lineWidth = 2 / 0.78; c.setLineDash([3.5 / 0.78, 3.5 / 0.78]); c.stroke(shapes.flowers[who]);
    c.restore();
    c.beginPath(); c.arc(0, 0, HEART, 0, Math.PI * 2);
    c.fillStyle = palette.heart; c.fill();
    c.strokeStyle = palette.players[who]; c.lineWidth = 2.2; c.setLineDash([3, 3]); c.stroke();
    const mark = marks[who];
    c.fillStyle = palette.ink; c.textAlign = "center"; c.textBaseline = "middle";
    c.font = `700 ${mark.length > 2 ? 15 : 21}px Display, Bangla, sans-serif`;
    c.fillText(mark, 0, 1.5);
    c.restore();
  }

  for (let edge = 0; edge < EDGE_COUNT; edge++) {
    // A card is always a finished quilt: every gap is stitched.
    const { horizontal, row, col } = EDGES[edge];
    c.save();
    c.translate(MARGIN + UNIT * col, MARGIN + UNIT * row);
    if (!horizontal) c.rotate(Math.PI / 2);
    c.setLineDash([...STITCH.dash]);
    c.strokeStyle = palette.thread; c.lineWidth = STITCH.width;
    c.beginPath(); c.moveTo(STITCH.from, 0); c.lineTo(STITCH.to, 0); c.stroke();
    c.strokeStyle = palette.shine; c.lineWidth = 1.8;
    c.beginPath(); c.moveTo(STITCH.from, -1.6); c.lineTo(STITCH.to, -1.6); c.stroke();
    c.restore();
  }
  c.setLineDash([]);
  for (let i = 0; i < (SIZE + 1) ** 2; i++) {
    const hx = MARGIN + UNIT * (i % (SIZE + 1)), hy = MARGIN + UNIT * Math.floor(i / (SIZE + 1));
    c.fillStyle = palette.hole; c.beginPath(); c.arc(hx, hy, 8.5, 0, Math.PI * 2); c.fill();
    c.fillStyle = palette.thread; c.beginPath(); c.arc(hx, hy, 4.6, 0, Math.PI * 2); c.fill();
  }
  c.restore();
}

/** A folded-out quilt on a warm cloth: the score line in the two thread colours above it, the kind line below. */
export function drawCard(canvas: HTMLCanvasElement, data: CardData, format: CardFormat, site: string) {
  const { width, height } = cardSizes[format];
  canvas.width = width;
  canvas.height = height;
  const c = canvas.getContext("2d");
  if (!c) throw new Error("এই ব্রাউজারে ছবি বানানো যাচ্ছে না।");
  const story = format === "story";
  const cx = width / 2;
  c.fillStyle = "#f1e2c8";
  c.fillRect(0, 0, width, height);
  // Faint running-stitch rows across the backing cloth.
  c.strokeStyle = "#e6d2b0"; c.lineWidth = 3; c.lineCap = "round"; c.setLineDash([16, 12]);
  for (let row = 0, at = 30; at < height; row++, at += 34) { c.lineDashOffset = row % 2 ? 14 : 0; c.beginPath(); c.moveTo(0, at); c.lineTo(width, at); c.stroke(); }
  c.setLineDash([]);

  const names = cardNames(data.level, data.name, data.other);
  const kicker = data.level ? `ছক-জোড়া · ${levelName(data.level)} বটের সাথে` : "ছক-জোড়া · দুজনে এক ফোনে";
  fitText(c, [{ text: kicker, color: palette.muted, weight: 700, display: true }], cx, story ? 345 : 108, story ? 44 : 40, 900, "center");
  const line: Segment[] = [
    { text: `${names[0]} `, color: palette.players[0], weight: 700, display: true },
    { text: bn(data.score[0]), color: palette.players[0], weight: 800, display: true },
    { text: "  —  ", color: palette.ink, weight: 600 },
    { text: `${names[1]} `, color: palette.players[1], weight: 700, display: true },
    { text: bn(data.score[1]), color: palette.players[1], weight: 800, display: true },
  ];
  fitText(c, line, cx, story ? 460 : 205, story ? 96 : 84, 960, "center");

  const size = story ? 920 : 820;
  drawQuilt(c, data, cx - size / 2, story ? 530 : 258, size);
  fitText(c, [{ text: humanLine(data.level, data.score, names), color: palette.ink, weight: 700 }], cx, story ? 1540 : 1170, story ? 54 : 48, 940, "center");
  if (story) fitText(c, [{ text: "চালগুলো মিলিয়ে দেখা ফল", color: palette.muted, weight: 600 }], cx, 1610, 34, 900, "center");
  drawFooterBand(c, format, "এবার তুমি আমাকে হারাও!", site, { band: palette.thread, ask: palette.heart, site: "#ffffff" });
}

export const cardBlob = (data: CardData, format: CardFormat, site: string) => renderCard(canvas => drawCard(canvas, data, format, site));

// The share card: the finished quilt on its world's look, the score in the two thread colours, the kind line. Drawn on a canvas
// with the same cloth, stitches, motifs and initials as the live board.
import { cardSizes, drawFooterBand, fitText, renderCard, roundedRect, type CardFormat, type Segment } from "../../../shared/card-canvas";
import { borderRect, LOOKS, MARKS, MOTIFS, STITCH } from "./art";
import { MARGIN, UNIT, totalPoints, worth } from "./quilt";
import { levelOf, worldOf } from "./levels";
import { bn, cardNames, humanLine, initials, possessiveName, type Shared } from "./challenge";

const paths = new Map<string, Path2D>();
const path = (d: string) => { let p = paths.get(d); if (!p) { p = new Path2D(d); paths.set(d, p); } return p; };

/** The world a shared game is drawn in: its level's world, or the first for two people. */
export const worldOfShared = (shared: Shared) => shared.level ? worldOf(shared.level) - 1 : 0;

/** The finished quilt, `size` pixels across its longer side, with its top-left corner at (x, y). */
export function drawQuilt(c: CanvasRenderingContext2D, shared: Shared, x: number, y: number, size: number) {
  const { game } = shared, g = game.geo, world = worldOfShared(shared), look = LOOKS[world];
  const marks = initials(cardNames(shared.level, shared.name, shared.other));
  const scale = size / Math.max(g.width, g.height);
  c.save();
  c.translate(x + (size - g.width * scale) / 2, y + (size - g.height * scale) / 2);
  c.scale(scale, scale);
  c.save();
  c.shadowColor = "rgba(30,24,20,0.3)"; c.shadowBlur = 24; c.shadowOffsetY = 10;
  c.fillStyle = look.cloth; roundedRect(c, 0, 0, g.width, g.height, 16); c.fill();
  c.restore();
  c.lineCap = "round";
  c.strokeStyle = look.ripple; c.lineWidth = 1.6; c.setLineDash([8, 4]);
  for (let row = 0, at = 8; at < g.height - 4; row++, at += 8) {
    c.lineDashOffset = row % 2 ? 6 : 0;
    c.beginPath(); c.moveTo(6, at); c.lineTo(g.width - 6, at); c.stroke();
  }
  c.lineDashOffset = 0;
  c.strokeStyle = look.border; c.lineWidth = 3.5; c.setLineDash([9, 7]); c.stroke(path(borderRect(g.width, g.height)));

  for (let box = 0; box < g.boxes; box++) {
    const who = game.owner[box];
    if (who !== 0 && who !== 1) continue;
    const gold = worth(game.setup, box) === 2, [mx, my, mr] = MARKS[world][who], d = MOTIFS[world][who];
    c.save();
    c.translate(MARGIN + UNIT * (box % g.cols + 0.5), MARGIN + UNIT * (Math.floor(box / g.cols) + 0.5));
    c.setLineDash([]);
    c.fillStyle = look.tints[who]; roundedRect(c, -43, -43, 86, 86, 6); c.fill();
    if (gold) { c.strokeStyle = look.gold; c.lineWidth = 4; c.setLineDash([7, 5]); c.beginPath(); c.arc(0, 0, 44, 0, Math.PI * 2); c.stroke(); c.setLineDash([]); }
    c.fillStyle = look.players[who]; c.fill(path(d));
    c.save(); c.scale(0.78, 0.78);
    c.strokeStyle = "rgba(255,255,255,0.55)"; c.lineWidth = 2 / 0.78; c.setLineDash([3.5 / 0.78, 3.5 / 0.78]); c.stroke(path(d));
    c.restore();
    c.beginPath(); c.arc(mx, my, mr, 0, Math.PI * 2);
    c.fillStyle = look.heart; c.fill();
    c.strokeStyle = look.players[who]; c.lineWidth = 2.2; c.setLineDash([3, 3]); c.stroke();
    const mark = marks[who];
    c.fillStyle = look.ink; c.textAlign = "center"; c.textBaseline = "middle";
    c.font = `700 ${Math.round((mark.length > 2 ? 15 : 21) * mr / 17)}px Display, Bangla, sans-serif`;
    c.fillText(mark, mx, my + 1.5);
    c.restore();
  }

  // A card is always a finished quilt: every gap is stitched.
  for (let edge = 0; edge < g.edges; edge++) {
    c.save();
    c.translate(MARGIN + UNIT * g.col[edge], MARGIN + UNIT * g.row[edge]);
    if (!g.horizontal[edge]) c.rotate(Math.PI / 2);
    c.setLineDash([...STITCH.dash]);
    c.strokeStyle = look.thread; c.lineWidth = STITCH.width;
    c.beginPath(); c.moveTo(STITCH.from, 0); c.lineTo(STITCH.to, 0); c.stroke();
    c.strokeStyle = look.shine; c.lineWidth = 1.8;
    c.beginPath(); c.moveTo(STITCH.from, -1.6); c.lineTo(STITCH.to, -1.6); c.stroke();
    c.restore();
  }
  c.setLineDash([]);
  for (let r = 0; r <= g.rows; r++) for (let col = 0; col <= g.cols; col++) {
    const hx = MARGIN + UNIT * col, hy = MARGIN + UNIT * r;
    c.fillStyle = look.hole; c.beginPath(); c.arc(hx, hy, 8.5, 0, Math.PI * 2); c.fill();
    c.fillStyle = look.thread; c.beginPath(); c.arc(hx, hy, 4.6, 0, Math.PI * 2); c.fill();
  }
  c.restore();
}

/** The kicker over the score: the game, then the level and who sewed against you, or "দুজনে". */
export function cardKicker(shared: Shared) {
  if (!shared.level) return `ছক-জোড়া · দুজনে, ${bn(shared.size)}×${bn(shared.size)} কাঁথা`;
  const info = levelOf(shared.level)!;
  return `ছক-জোড়া · লেভেল ${bn(shared.level)} · ${possessiveName(info.rival)} সাথে`;
}

/** A folded-out quilt on its world's ground: the score line above it, the kind line below. */
export function drawCard(canvas: HTMLCanvasElement, shared: Shared, format: CardFormat, site: string) {
  const { width, height } = cardSizes[format];
  canvas.width = width;
  canvas.height = height;
  const c = canvas.getContext("2d");
  if (!c) throw new Error("এই ব্রাউজারে ছবি বানানো যাচ্ছে না।");
  const story = format === "story", cx = width / 2, world = worldOfShared(shared), look = LOOKS[world], night = world === 2;
  c.fillStyle = night ? "#232a40" : world === 1 ? "#dcebe2" : "#f1e2c8";
  c.fillRect(0, 0, width, height);
  // Faint running-stitch rows across the backing cloth.
  c.strokeStyle = night ? "#2e3651" : world === 1 ? "#cadfd2" : "#e6d2b0"; c.lineWidth = 3; c.lineCap = "round"; c.setLineDash([16, 12]);
  for (let row = 0, at = 30; at < height; row++, at += 34) { c.lineDashOffset = row % 2 ? 14 : 0; c.beginPath(); c.moveTo(0, at); c.lineTo(width, at); c.stroke(); }
  c.setLineDash([]);
  const ink = night ? "#f6ead2" : look.ink, muted = night ? "#c9bfa6" : look.muted;

  const names = cardNames(shared.level, shared.name, shared.other), score = shared.game.score;
  const p0 = night ? "#ff8a73" : look.players[0], p1 = night ? "#93a6ff" : look.players[1];
  fitText(c, [{ text: cardKicker(shared), color: muted, weight: 700, display: true }], cx, story ? 345 : 108, story ? 44 : 40, 940, "center");
  const line: Segment[] = [
    { text: `${names[0]} `, color: p0, weight: 700, display: true },
    { text: bn(score[0]), color: p0, weight: 800, display: true },
    { text: "  —  ", color: ink, weight: 600 },
    { text: `${names[1]} `, color: p1, weight: 700, display: true },
    { text: bn(score[1]), color: p1, weight: 800, display: true },
  ];
  fitText(c, line, cx, story ? 460 : 205, story ? 96 : 84, 960, "center");

  const size = story ? 920 : 820;
  drawQuilt(c, shared, cx - size / 2, story ? 530 : 258, size);
  fitText(c, [{ text: humanLine(shared.level, score, names, totalPoints(shared.game.setup)), color: ink, weight: 700 }], cx, story ? 1540 : 1170, story ? 54 : 48, 940, "center");
  if (story) fitText(c, [{ text: "চালগুলো মিলিয়ে দেখা ফল", color: muted, weight: 600 }], cx, 1610, 34, 900, "center");
  drawFooterBand(c, format, "এবার তুমি আমাকে হারাও!", site, { band: look.thread, ask: look.heart, site: "#ffffff" });
}

export const cardBlob = (shared: Shared, format: CardFormat, site: string) => renderCard(canvas => drawCard(canvas, shared, format, site));

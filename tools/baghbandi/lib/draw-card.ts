import { cardSizes, drawFooterBand, fitText, renderCard, roundedRect, type CardFormat } from "../../../shared/card-canvas";
import { palette, PILE_OFFSETS, SEED, SEED_FACE, SEED_SHINE, TIGER_EYES, TIGER_STONE, TIGER_STRIPES } from "./art";
import { BOARD, GOAT, LINES, POINTS, spot, type Game } from "./game";
import { bn, cardNames, detail, headline, humanLine, type Shared } from "./link";

let shapes: { stone: Path2D; stripes: Path2D; seed: Path2D; face: Path2D; shine: Path2D } | null = null;

function seed(c: CanvasRenderingContext2D) {
  c.fillStyle = palette.seed; c.fill(shapes!.seed);
  c.strokeStyle = palette.ink; c.lineWidth = 2; c.stroke(shapes!.seed);
  c.fillStyle = palette.seedFace; c.fill(shapes!.face);
  c.strokeStyle = palette.seedShine; c.lineWidth = 3; c.stroke(shapes!.shine);
}

/** The final position at any size: the same clay, scratched lines, seeds and striped stones as the live board. */
export function drawYard(c: CanvasRenderingContext2D, game: Game, x: number, y: number, size: number) {
  shapes ??= { stone: new Path2D(TIGER_STONE), stripes: new Path2D(TIGER_STRIPES), seed: new Path2D(SEED), face: new Path2D(SEED_FACE), shine: new Path2D(SEED_SHINE) };
  c.save();
  c.translate(x, y);
  c.scale(size / BOARD, size / BOARD);
  c.save();
  c.shadowColor = "rgba(59,38,20,0.3)"; c.shadowBlur = 24; c.shadowOffsetY = 10;
  c.fillStyle = palette.clay; roundedRect(c, 0, 0, BOARD, BOARD, 18); c.fill();
  c.restore();
  c.lineCap = "round"; c.lineJoin = "round";
  c.strokeStyle = palette.claySwirl; c.lineWidth = 5;
  c.stroke(new Path2D("M24 120Q70 40 170 26M330 474Q430 460 478 380M20 330Q30 420 120 470M380 24Q460 40 478 140"));
  for (const [from, to] of LINES) {
    const [x1, y1] = spot(from), [x2, y2] = spot(to);
    c.strokeStyle = palette.grooveLight; c.lineWidth = 4;
    c.beginPath(); c.moveTo(x1 + 1.6, y1 + 1.8); c.lineTo(x2 + 1.6, y2 + 1.8); c.stroke();
    c.strokeStyle = palette.groove; c.lineWidth = 4.5;
    c.beginPath(); c.moveTo(x1, y1); c.lineTo(x2, y2); c.stroke();
  }
  c.fillStyle = palette.pit;
  for (let at = 0; at < POINTS; at++) { const [px, py] = spot(at); c.beginPath(); c.arc(px, py, 7, 0, Math.PI * 2); c.fill(); }

  game.goats.forEach((count, at) => {
    if (!count) return;
    const [px, py] = spot(at);
    c.save(); c.translate(px, py);
    if (count === 1) seed(c);
    else {
      for (const [ox, oy] of PILE_OFFSETS.slice(0, Math.min(3, count))) { c.save(); c.translate(ox, oy); c.scale(0.8, 0.8); seed(c); c.restore(); }
      c.fillStyle = palette.badge; c.strokeStyle = palette.ink; c.lineWidth = 2.5;
      c.beginPath(); c.arc(25, -25, 15, 0, Math.PI * 2); c.fill(); c.stroke();
      c.fillStyle = palette.ink; c.textAlign = "center"; c.textBaseline = "middle"; c.font = "800 21px Display, Bangla, sans-serif";
      c.fillText(bn(count), 25, -23);
    }
    c.restore();
  });
  for (const at of game.tigers) {
    const [px, py] = spot(at);
    c.save(); c.translate(px, py);
    c.fillStyle = palette.tiger; c.fill(shapes.stone);
    c.strokeStyle = palette.tigerEdge; c.lineWidth = 4; c.stroke(shapes.stone);
    c.strokeStyle = palette.stripe; c.lineWidth = 5; c.stroke(shapes.stripes);
    for (const [ex, ey] of TIGER_EYES) {
      c.fillStyle = palette.eye; c.beginPath(); c.arc(ex, ey, 5.5, 0, Math.PI * 2); c.fill();
      c.fillStyle = palette.stripe; c.beginPath(); c.arc(ex, ey + 1, 2.6, 0, Math.PI * 2); c.fill();
    }
    c.restore();
  }
  c.restore();
}

/** Who played what, for the card's top line. */
function kicker({ mode, name, other }: Shared) {
  const [goats, tigers] = cardNames(mode, name, other);
  if (mode === 0 && !(goats && tigers)) return "বাঘবন্দি · দুজনে এক ফোনে";
  return `বাঘবন্দি · ${goats || "ছাগল"} ছাগল, ${tigers || "বাঘ"} বাঘ`;
}

/** The final yard on a sunlit courtyard: who won and in how many moves above it, the kind line below. */
export function drawCard(canvas: HTMLCanvasElement, data: Shared, format: CardFormat, site: string) {
  const { width, height } = cardSizes[format];
  canvas.width = width;
  canvas.height = height;
  const c = canvas.getContext("2d");
  if (!c) throw new Error("এই ব্রাউজারে ছবি বানানো যাচ্ছে না।");
  const story = format === "story";
  const cx = width / 2;
  c.fillStyle = "#f4e4c6";
  c.fillRect(0, 0, width, height);
  // Broom strokes across the swept courtyard.
  c.strokeStyle = "#eedcb8"; c.lineWidth = 6; c.lineCap = "round";
  for (let i = 0, at = 60; at < height; i++, at += 150) {
    c.beginPath(); c.moveTo(i % 2 ? 80 : -40, at); c.quadraticCurveTo(cx, at - 70, width + (i % 2 ? 40 : -80), at + 20); c.stroke();
  }

  const game = data.game;
  const color = game.winner === GOAT ? palette.seed : palette.tigerEdge;
  fitText(c, [{ text: kicker(data), color: palette.muted, weight: 700, display: true }], cx, story ? 330 : 105, story ? 44 : 40, 940, "center");
  fitText(c, [{ text: headline(game), color, weight: 800, display: true }], cx, story ? 448 : 200, story ? 100 : 88, 960, "center");
  fitText(c, [{ text: detail(game), color: palette.ink, weight: 600 }], cx, story ? 526 : 268, story ? 46 : 42, 940, "center");
  const size = story ? 880 : 760;
  drawYard(c, game, cx - size / 2, story ? 585 : 310, size);
  fitText(c, [{ text: humanLine(game), color: palette.ink, weight: 700, display: true }], cx, story ? 1548 : 1150, story ? 58 : 52, 940, "center");
  if (story) fitText(c, [{ text: "চালগুলো মিলিয়ে দেখা ফল", color: palette.muted, weight: 600 }], cx, 1608, 34, 900, "center");
  drawFooterBand(c, format, "তুমি বাঘ হয়ে পারবে?", site, { band: palette.ink, ask: "#f2b33d", site: "#ffffff" });
}

export const cardBlob = (data: Shared, format: CardFormat, site: string) => renderCard(canvas => drawCard(canvas, data, format, site));

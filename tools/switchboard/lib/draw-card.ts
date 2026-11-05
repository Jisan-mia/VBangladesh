// The share card: the cleared board, every bulb lit, in its house's palette, with its tapes and line switches.
import { cardSizes, drawFooterBand, fitText, renderCard, roundedRect, type CardFormat } from "../../../shared/card-canvas";
import { cleanName } from "../../../shared/game-core";
import { isTaped, type Board } from "./board";
import { artFor, BULB, BULB_COLOURS, TAPE, TAPE_PATH, type Art } from "./art";
import { isFinale, levelOf, worldOf } from "./levels";
import { bn, cardLine, levelLabel, parOf, type Shared } from "./link";
import { puzzleOf } from "./play";

let paths: Record<keyof typeof BULB | "tape", Path2D> | null = null;
const path2d = () => paths ??= { rays: new Path2D(BULB.rays), glass: new Path2D(BULB.glass), filament: new Path2D(BULB.filament), base: new Path2D(BULB.base), tape: new Path2D(TAPE_PATH) };

/** The wooden board with every bulb lit: how a cleared board always looks. Returns its height. */
export function drawBoard(c: CanvasRenderingContext2D, board: Board, x: number, y: number, width: number, art: Art) {
  const { size } = board, rows = board.lines.some(line => line.kind === "row"), cols = board.lines.some(line => line.kind === "col");
  const pad = width * 0.06, inner = width - pad * 2;
  const cell = inner / (size + (rows ? 0.7 : 0)), gx = rows ? cell * 0.7 : 0, gy = cols ? cell * 0.7 : 0;
  const height = pad * 2 + gy + cell * size * 1.12;
  const p = path2d();
  c.save();
  c.fillStyle = art.woodDark; roundedRect(c, x + 6, y + 10, width, height, 26); c.fill();
  const wood = c.createLinearGradient(x, y, x + width, y + height);
  wood.addColorStop(0, art.woodLight); wood.addColorStop(1, art.wood);
  c.fillStyle = wood; roundedRect(c, x, y, width, height, 26); c.fill();
  c.strokeStyle = "rgba(40,20,8,0.16)"; c.lineWidth = 3;
  for (let line = 1; line < 9; line++) {
    const at = y + (height / 9) * line;
    c.beginPath(); c.moveTo(x + 18, at); c.bezierCurveTo(x + width * 0.3, at - 10, x + width * 0.7, at + 12, x + width - 18, at - 4); c.stroke();
  }
  for (const [sx, sy] of [[x + 24, y + 24], [x + width - 24, y + 24], [x + 24, y + height - 24], [x + width - 24, y + height - 24]]) {
    c.fillStyle = art.brass; c.beginPath(); c.arc(sx, sy, 9, 0, Math.PI * 2); c.fill();
    c.strokeStyle = art.brassDark; c.lineWidth = 3; c.beginPath(); c.moveTo(sx - 5, sy); c.lineTo(sx + 5, sy); c.stroke();
  }
  const left = x + pad + gx, top = y + pad + gy, r = cell * 0.18;
  const centre = (index: number) => ({ cx: left + cell * (index % size + 0.5), top: top + cell * 1.12 * Math.floor(index / size) });
  // The strings of fairy lights behind each line, then the line switches in the gutter.
  for (const line of board.lines) {
    c.strokeStyle = "#2b1a0e"; c.lineWidth = 3; c.beginPath();
    if (line.kind === "row") { const yy = top + cell * 1.12 * line.at + cell * 0.28; c.moveTo(left - gx * 0.3, yy); c.lineTo(left + cell * size - cell * 0.2, yy); }
    else { const xx = left + cell * (line.at + 0.5); c.moveTo(xx, top - gy * 0.3); c.lineTo(xx, top + cell * 1.12 * size - cell * 0.5); }
    c.stroke();
    const sw = line.kind === "row" ? { x: x + pad + gx * 0.12, y: top + cell * 1.12 * line.at + cell * 0.12, w: gx * 0.62, h: cell * 0.9 } : { x: left + cell * line.at + cell * 0.08, y: y + pad + gy * 0.1, w: cell * 0.84, h: gy * 0.62 };
    c.fillStyle = art.brassDark; roundedRect(c, sw.x, sw.y + 3, sw.w, sw.h, 10); c.fill();
    c.fillStyle = art.brass; roundedRect(c, sw.x, sw.y, sw.w, sw.h, 10); c.fill();
    c.fillStyle = art.woodDark;
    if (line.kind === "row") roundedRect(c, sw.x + sw.w * 0.32, sw.y + sw.h * 0.2, sw.w * 0.36, sw.h * 0.6, 5);
    else roundedRect(c, sw.x + sw.w * 0.2, sw.y + sw.h * 0.32, sw.w * 0.6, sw.h * 0.36, 5);
    c.fill();
  }
  for (let index = 0; index < size * size; index++) {
    const { cx, top: cellTop } = centre(index), by = cellTop + cell * 0.28, sy = cellTop + cell * 0.88;
    const glow = c.createRadialGradient(cx, by, r * 0.4, cx, by, r * 2.4);
    glow.addColorStop(0, "rgba(255,233,160,0.85)"); glow.addColorStop(1, "rgba(255,233,160,0)");
    c.fillStyle = glow; c.beginPath(); c.arc(cx, by, r * 2.4, 0, Math.PI * 2); c.fill();
    c.save();
    c.translate(cx, by); c.scale(r / 12, r / 12); c.translate(-20, -19);
    c.lineCap = "round"; c.lineJoin = "round";
    c.strokeStyle = BULB_COLOURS.glow; c.lineWidth = 2.4; c.stroke(p.rays);
    c.fillStyle = BULB_COLOURS.glass; c.fill(p.glass); c.strokeStyle = BULB_COLOURS.glassEdge; c.lineWidth = 1.6; c.stroke(p.glass);
    c.strokeStyle = BULB_COLOURS.filament; c.lineWidth = 1.1; c.stroke(p.filament);
    c.fillStyle = BULB_COLOURS.base; c.fill(p.base); c.strokeStyle = art.woodDark; c.lineWidth = 1; c.stroke(p.base);
    c.restore();
    const plate = c.createRadialGradient(cx - r * 0.3, sy - r * 0.3, r * 0.1, cx, sy, r * 1.15);
    plate.addColorStop(0, art.brassLight); plate.addColorStop(1, art.brass);
    c.fillStyle = plate; c.beginPath(); c.arc(cx, sy, r * 1.15, 0, Math.PI * 2); c.fill();
    c.strokeStyle = art.brassDark; c.lineWidth = 2.5; c.stroke();
    c.fillStyle = art.woodDark; roundedRect(c, cx - r * 0.2, sy - r * 0.75, r * 0.4, r * 0.8, r * 0.2); c.fill();
    if (isTaped(board, index)) {
      c.save();
      c.translate(cx - r * 1.3, sy - r * 1.3); c.scale(r * 2.6 / 40, r * 2.6 / 40);
      c.fillStyle = TAPE.fill; c.fill(p.tape); c.strokeStyle = TAPE.edge; c.lineWidth = 1.2; c.stroke(p.tape);
      c.restore();
    }
  }
  c.restore();
  return height;
}

export function drawCard(canvas: HTMLCanvasElement, shared: Shared, stars: number, format: CardFormat, site: string) {
  const { width, height } = cardSizes[format];
  canvas.width = width; canvas.height = height;
  const c = canvas.getContext("2d");
  if (!c) throw new Error("এই ব্রাউজারে ছবি বানানো যাচ্ছে না।");
  const puzzle = puzzleOf(shared.level, shared.legacy);
  if (!puzzle) return;
  const art = artFor(shared.legacy ? 0 : worldOf(shared.level) - 1);
  const story = format === "story", cx = width / 2, top = story ? 250 : 0;
  c.fillStyle = art.wall; c.fillRect(0, 0, width, height);
  c.fillStyle = art.wallLine;
  for (let at = 60; at < height; at += 90) c.fillRect(0, at, width, 3);

  const name = cleanName(shared.name), moves = shared.moves.length, par = parOf(shared.level, shared.legacy);
  const finale = !shared.legacy && isFinale(shared.level) ? levelOf(shared.level).finale : "";
  fitText(c, [{ text: `সুইচবোর্ড · ${levelLabel(shared.level, shared.legacy)}`, color: art.muted, weight: 700, display: true }], cx, top + 100, 38, 940, "center");
  fitText(c, [
    ...(name ? [{ text: `${name}: `, color: art.accent, weight: 800, display: true }] : []),
    { text: `${bn(moves)} চালে সব বাতি জ্বলল`, color: art.ink, weight: 800, display: true },
  ], cx, top + 194, 74, 960, "center");
  c.font = `700 64px sans-serif`; c.textAlign = "center";
  for (let index = 0; index < 3; index++) { c.fillStyle = index < stars ? BULB_COLOURS.star : BULB_COLOURS.starOff; c.fillText("★", cx + (index - 1) * 78, top + 282); }

  const boardWidth = story ? 760 : puzzle.board.size === 5 ? 640 : 600;
  const boardTop = top + 318, boardHeight = drawBoard(c, puzzle.board, cx - boardWidth / 2, boardTop, boardWidth, art);
  if (finale) {
    // The finale stamp: a tilted ink stamp on the board's corner.
    c.save();
    c.translate(cx + boardWidth / 2 - 70, boardTop + 30); c.rotate(-0.16);
    c.strokeStyle = "#c0392b"; c.lineWidth = 6; roundedRect(c, -150, -38, 300, 76, 14); c.stroke();
    c.fillStyle = "rgba(255,250,240,0.9)"; roundedRect(c, -147, -35, 294, 70, 12); c.fill();
    fitText(c, [{ text: finale, color: "#c0392b", weight: 800, display: true }], 0, 14, 38, 270, "center");
    c.restore();
  }
  const after = boardTop + boardHeight;
  fitText(c, [{ text: cardLine(moves, par, shared.hinted), color: art.ink, weight: 700 }], cx, after + 86, story ? 50 : 42, 940, "center");
  fitText(c, [{ text: `সেরা ${bn(par)} চাল${shared.hinted ? " · একটা হিন্ট নেওয়া" : ""}`, color: art.muted, weight: 600 }], cx, after + 142, 32, 900, "center");
  drawFooterBand(c, format, "তুমি কয় চালে পারবে?", site, { band: art.band, ask: BULB_COLOURS.glow, site: "#ffffff" });
}

export const cardBlob = (shared: Shared, stars: number, format: CardFormat, site: string) => renderCard(canvas => drawCard(canvas, shared, stars, format, site));

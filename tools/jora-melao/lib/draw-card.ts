// The share card: paper bunting from a village fair, the finished board of toys, and the moves (or the two players' pairs).
import { cardSizes, drawFooterBand, fitText, renderCard, roundedRect, type CardFormat } from "../../../shared/card-canvas";
import { ART, drawToy } from "./art";
import { COLS, TOYS, newGame, pairsOf, readFlips, replay, rowsOf, starsOf } from "./game";
import { bn, humanLine, playerName, sizeLabel, winnerTitle, type Card } from "./result";

export const INK = "#2b2118", ACCENT = "#17707a", DEEP = "#0e4c53", PAPER = "#fbf4e6";
export const PLAYER_COLORS = ["#d9480f", "#3b5bdb"] as const;
const MUTED = "#7a6650", JUTE = "#e3c99a", JUTE_DARK = "#cfb07a";
const FLAGS = ["#e03131", "#f2a516", "#17707a", "#e64980", "#2f9e44", "#3b5bdb"];

const layouts = {
  feed: { title: 196, sub: 248, name: 322, score: 438, scoreSize: 132, boardTop: 470, tile: 146, gap: 14, line: 1205 },
  story: { title: 380, sub: 434, name: 520, score: 690, scoreSize: 168, boardTop: 742, tile: 178, gap: 16, line: 1614 },
} as const;

/** A sagging string of triangle paper flags across the top, the way a মেলা or a wedding gate is decorated. */
export function bunting(context: CanvasRenderingContext2D, width: number, top: number, sag: number) {
  const at = (t: number) => ({ x: -20 + (width + 40) * t, y: top + 4 * sag * t * (1 - t) });
  context.strokeStyle = "#8a6a45"; context.lineWidth = 3;
  context.beginPath(); context.moveTo(-20, top); context.quadraticCurveTo(width / 2, top + 2 * sag, width + 20, top); context.stroke();
  const count = Math.round(width / 78);
  for (let i = 0; i <= count; i++) {
    const { x, y } = at(i / count);
    context.fillStyle = FLAGS[i % FLAGS.length];
    context.beginPath(); context.moveTo(x - 26, y); context.lineTo(x + 26, y); context.lineTo(x, y + 58); context.closePath(); context.fill();
  }
}

export function drawCard(canvas: HTMLCanvasElement, card: Card, format: CardFormat, site: string) {
  const { width, height } = cardSizes[format];
  canvas.width = width; canvas.height = height;
  const context = canvas.getContext("2d");
  if (!context) throw new Error("এই ব্রাউজারে ছবি বানানো যাচ্ছে না।");
  const at = layouts[format], story = format === "story", two = card.players === 2;

  context.fillStyle = PAPER; context.fillRect(0, 0, width, height);
  bunting(context, width, story ? 200 : 26, story ? 30 : 34);

  fitText(context, [{ text: "জোড়া মেলাও", color: DEEP, weight: 800, display: true }], width / 2, at.title, 76, 800, "center");
  const stars = card.level ? starsOf(card.level, card.moves) : 0;
  fitText(context, [
    { text: `${card.level ? `লেভেল ${bn(card.level)}` : "মেলার খেলনা"} · ${sizeLabel(card.size)} · ${bn(pairsOf(card.size))} জোড়া`, color: MUTED, weight: 600 },
    ...(stars ? [{ text: "  ", color: MUTED, weight: 600 }, ...[0, 1, 2].map(index => ({ text: "★", color: index < stars ? "#e39b00" : "#cdbb98", weight: 700 }))] : []),
  ], width / 2, at.sub, 32, 800, "center");
  if (two) {
    fitText(context, [{ text: winnerTitle(card), color: INK, weight: 700, display: true }], width / 2, at.name, 56, 900, "center");
    fitText(context, [
      { text: playerName(card.names, 0), color: PLAYER_COLORS[0], weight: 800, display: true },
      { text: ` ${bn(card.pairs[0])}`, color: INK, weight: 800, display: true },
      { text: "  —  ", color: MUTED, weight: 700, display: true },
      { text: playerName(card.names, 1), color: PLAYER_COLORS[1], weight: 800, display: true },
      { text: ` ${bn(card.pairs[1])}`, color: INK, weight: 800, display: true },
    ], width / 2, at.score - 10, at.scoreSize * 0.72, width - 120, "center");
  } else {
    if (card.names[0]) fitText(context, [{ text: card.names[0], color: INK, weight: 700, display: true }], width / 2, at.name, 56, 900, "center");
    fitText(context, [{ text: bn(card.moves), color: ACCENT, weight: 800, display: true }, { text: " চালে", color: INK, weight: 800, display: true }], width / 2, at.score, at.scoreSize, width - 120, "center");
  }

  // The finished board: every toy where it lay. In a two-player game each card wears the colour of whoever matched it.
  const board = newGame(card.seed, card.size, card.players).board;
  const found = two && card.flips ? replay(card.seed, card.size, card.players, readFlips(card.flips) ?? [])?.found : undefined;
  // Room for four rows of full-size tiles; a five-row board shrinks its tiles to fit the same height.
  const rows = rowsOf(card.size), room = 4 * at.tile + 3 * at.gap, tile = Math.min(at.tile, (room - (rows - 1) * at.gap) / rows);
  const span = COLS * tile + (COLS - 1) * at.gap, pad = at.gap + 6, boardH = rows * tile + (rows - 1) * at.gap;
  const left = (width - span) / 2, top = at.boardTop + pad + (room - boardH) / 2;
  context.fillStyle = JUTE; roundedRect(context, left - pad, top - pad, span + pad * 2, boardH + pad * 2, 28); context.fill();
  context.strokeStyle = JUTE_DARK; context.lineWidth = 4; context.stroke();
  board.forEach((toy, index) => {
    const x = left + (index % COLS) * (tile + at.gap), y = top + Math.floor(index / COLS) * (tile + at.gap);
    const art = ART[TOYS[toy]], owner = found?.[index] ?? -1;
    context.fillStyle = "#00000014"; roundedRect(context, x, y + 5, tile, tile, 20); context.fill();
    context.fillStyle = art.tint; roundedRect(context, x, y, tile, tile, 20); context.fill();
    context.strokeStyle = owner >= 0 ? PLAYER_COLORS[owner] : "#fffaf0"; context.lineWidth = owner >= 0 ? 7 : 5;
    roundedRect(context, x + 2, y + 2, tile - 4, tile - 4, 18); context.stroke();
    drawToy(context, TOYS[toy], x + tile * 0.12, y + tile * 0.12, tile * 0.76);
  });

  fitText(context, [{ text: humanLine(card), color: INK, weight: 700, display: true }], width / 2, at.line, story ? 48 : 44, width - 120, "center");
  drawFooterBand(context, format, two ? "তোমাদের বাসায় কে জিতবে?" : "তুমি কত চালে পারবে?", site, { band: DEEP, ask: "#ffd166", site: "#ffffff" });
}

export const cardBlob = (card: Card, format: CardFormat, site: string) => renderCard(canvas => drawCard(canvas, card, format, site));

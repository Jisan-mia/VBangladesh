// The share card: the finished board of pictures on the table's mat, the moves and the stars (or the two players' pairs),
// in the palette of the table it was played on. Browser only (canvas).
import { cardSizes, drawFooterBand, fitText, renderCard, roundedRect, type CardFormat } from "../../../shared/card-canvas";
import { colsOf, isFinale, rowsOfCards, WORLDS } from "./levels";
import { bn, gameOf, humanLine, levelTitle, pairCount, playerName, starsOfCard, winnerTitle, worldOfCard, type Card } from "./link";
import { readFlips, replay } from "./play";
import { drawPicture, PICTURES } from "./pictures";

export const INK = "#2b2118";
export const PLAYER_COLORS = ["#d9480f", "#3b5bdb"] as const;
const MUTED = "#7a6650";

/** One palette per table: paper, deep (title and band), accent, the mat the cards lie on, and the bunting. */
export const PALETTES = [
  { paper: "#fbf4e6", deep: "#0e4c53", accent: "#17707a", mat: "#e3c99a", matDark: "#cfb07a", flags: ["#e03131", "#f2a516", "#17707a", "#e64980", "#2f9e44", "#3b5bdb"] },
  { paper: "#fff8e1", deep: "#6b4a00", accent: "#c27a00", mat: "#d8c27a", matDark: "#b89d4a", flags: ["#f2a516", "#7cb342", "#e8590c", "#f6d860", "#2f9e44", "#d9480f"] },
  { paper: "#eef1f8", deep: "#1c2c52", accent: "#3b5bdb", mat: "#b4c3dd", matDark: "#8ea3c6", flags: ["#3b5bdb", "#748ffc", "#1c2c52", "#a5d8ff", "#4dabf7", "#f2a516"] },
] as const;

const layouts = {
  feed: { title: 196, sub: 248, name: 322, score: 438, scoreSize: 132, boardTop: 470, tile: 146, gap: 14, line: 1205 },
  story: { title: 380, sub: 434, name: 520, score: 690, scoreSize: 168, boardTop: 742, tile: 178, gap: 16, line: 1614 },
} as const;

/** A sagging string of triangle paper flags across the top, the way a মেলা or a wedding gate is decorated. */
export function bunting(context: CanvasRenderingContext2D, width: number, top: number, sag: number, flags: readonly string[]) {
  const at = (t: number) => ({ x: -20 + (width + 40) * t, y: top + 4 * sag * t * (1 - t) });
  context.strokeStyle = "#8a6a45"; context.lineWidth = 3;
  context.beginPath(); context.moveTo(-20, top); context.quadraticCurveTo(width / 2, top + 2 * sag, width + 20, top); context.stroke();
  const count = Math.round(width / 78);
  for (let i = 0; i <= count; i++) {
    const { x, y } = at(i / count);
    context.fillStyle = flags[i % flags.length];
    context.beginPath(); context.moveTo(x - 26, y); context.lineTo(x + 26, y); context.lineTo(x, y + 58); context.closePath(); context.fill();
  }
}

/** The pictures where they lay at the end (the birds move cards), and who matched each in a two-player game. */
function finalBoard(card: Card) {
  const start = gameOf(card), flips = card.flips ? readFlips(card.flips) : null;
  const end = flips ? replay(start, flips) : null;
  return { board: (end ?? start).board, found: card.players === 2 ? end?.found : undefined };
}

export function drawCard(canvas: HTMLCanvasElement, card: Card, format: CardFormat, site: string) {
  const { width, height } = cardSizes[format];
  canvas.width = width; canvas.height = height;
  const context = canvas.getContext("2d");
  if (!context) throw new Error("এই ব্রাউজারে ছবি বানানো যাচ্ছে না।");
  const at = layouts[format], story = format === "story", two = card.players === 2;
  const world = worldOfCard(card), pal = PALETTES[world];

  context.fillStyle = pal.paper; context.fillRect(0, 0, width, height);
  bunting(context, width, story ? 200 : 26, story ? 30 : 34, pal.flags);

  fitText(context, [{ text: "জোড়া মেলাও", color: pal.deep, weight: 800, display: true }], width / 2, at.title, 76, 800, "center");
  const stars = starsOfCard(card);
  const where = card.v === 2 && card.level ? (isFinale(card.level) ? `${levelTitle(card.level)} · লেভেল ${bn(card.level)}` : `${levelTitle(card.level)} · ${WORLDS[world].short}`) : card.v === 1 ? "পুরোনো বোর্ড" : "মেলার খেলনা";
  fitText(context, [
    { text: `${where} · ${bn(pairCount(card))} জোড়া`, color: MUTED, weight: 600 },
    ...(stars ? [{ text: "  ", color: MUTED, weight: 600 }, ...[0, 1, 2].map(index => ({ text: "★", color: index < stars ? "#e39b00" : "#cdbb98", weight: 700 }))] : []),
  ], width / 2, at.sub, 32, width - 100, "center");
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
    fitText(context, [{ text: bn(card.moves), color: pal.accent, weight: 800, display: true }, { text: " চালে", color: INK, weight: 800, display: true }], width / 2, at.score, at.scoreSize, width - 120, "center");
  }

  // The finished board: every picture where it lay. In a two-player game each card wears the colour of whoever matched it.
  const { board, found } = finalBoard(card);
  const cols = colsOf(card.cards), rows = rowsOfCards(card.cards);
  const room = 4 * at.tile + 3 * at.gap, tile = Math.min(at.tile, (room - (rows - 1) * at.gap) / rows);
  const span = cols * tile + (cols - 1) * at.gap, pad = at.gap + 6, boardH = rows * tile + (rows - 1) * at.gap;
  const left = (width - span) / 2, top = at.boardTop + pad + (room - boardH) / 2;
  context.fillStyle = pal.mat; roundedRect(context, left - pad, top - pad, span + pad * 2, boardH + pad * 2, 28); context.fill();
  context.strokeStyle = pal.matDark; context.lineWidth = 4; context.stroke();
  board.forEach((id, index) => {
    const x = left + (index % cols) * (tile + at.gap), y = top + Math.floor(index / cols) * (tile + at.gap);
    const owner = found?.[index] ?? -1, r = tile * 0.14;
    context.fillStyle = "#00000014"; roundedRect(context, x, y + 5, tile, tile, r); context.fill();
    context.fillStyle = PICTURES[id].tint; roundedRect(context, x, y, tile, tile, r); context.fill();
    context.strokeStyle = owner >= 0 ? PLAYER_COLORS[owner] : "#fffaf0"; context.lineWidth = owner >= 0 ? 7 : 5;
    roundedRect(context, x + 2, y + 2, tile - 4, tile - 4, r - 2); context.stroke();
    drawPicture(context, id, x + tile * 0.1, y + tile * 0.1, tile * 0.8);
  });

  // A finale clear wears a stamp on the corner of the mat.
  if (card.v === 2 && card.level && isFinale(card.level)) {
    context.save();
    context.translate(left + span - 150, top + boardH + pad - 6); context.rotate(-0.14);
    context.strokeStyle = "#c92a2a"; context.lineWidth = 6; context.fillStyle = "#fffaf0ee";
    roundedRect(context, -150, -40, 300, 80, 16); context.fill(); context.stroke();
    fitText(context, [{ text: "শেষ বোর্ড পার", color: "#c92a2a", weight: 900, display: true }], 0, 16, 40, 270, "center");
    context.restore();
  }

  fitText(context, [{ text: humanLine(card), color: INK, weight: 700, display: true }], width / 2, at.line, story ? 48 : 44, width - 120, "center");
  drawFooterBand(context, format, two ? "তোমাদের বাসায় কে জিতবে?" : "তুমি কত চালে পারবে?", site, { band: pal.deep, ask: "#ffd166", site: "#ffffff" });
}

export const cardBlob = (card: Card, format: CardFormat, site: string) => renderCard(canvas => drawCard(canvas, card, format, site));

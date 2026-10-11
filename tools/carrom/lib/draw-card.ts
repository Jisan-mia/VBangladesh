import { possessive } from "../../../shared/bangla";
import { cardSizes, drawFooterBand, fitText, renderCard, type CardFormat, type Segment } from "../../../shared/card-canvas";
import { paintBoard, paintDisc, palette } from "./art";
import { bn, duoLine, humanLine, piecesLine, playerName, SIDE_OF, type Shared } from "./link";
import { CENTRE, COIN_R, RAIL, TOTAL } from "./physics";
import { formation, PER_SIDE, QUEEN_POINTS, STRIKES } from "./rules";

/**
 * The board seen from above with the pieces you pocketed set back into the opening flower, so the card reads
 * like "how much of the board did you clear?". Empty spots stay as faint rings.
 */
export function drawCard(canvas: HTMLCanvasElement, card: Shared, format: CardFormat, site: string) {
  const { width, height } = cardSizes[format];
  canvas.width = width;
  canvas.height = height;
  const c = canvas.getContext("2d");
  if (!c) throw new Error("এই ব্রাউজারে ছবি বানানো যাচ্ছে না।");
  const story = format === "story";
  const footer = story ? height - 260 : height - 96;
  c.fillStyle = "#f4e6cf";
  c.fillRect(0, 0, width, height);
  c.fillStyle = "#ead5b4";
  for (let k = 0; k < 9; k++) { c.beginPath(); c.arc(width / 2, story ? 1030 : 700, 420 + k * 70, 0, Math.PI * 2); c.lineWidth = 2; c.strokeStyle = "#e9d6b6"; c.stroke(); }

  const top = story ? 300 : 62;
  const duo = card.mode === "duo";
  fitText(c, [{ text: duo ? "ক্যারম · দুজনে এক বোর্ড" : `ক্যারম · ${bn(STRIKES)} চাল`, color: palette.accent, weight: 700, display: true }], 84, top + 44, 42, 900);
  const head: Segment[] = duo
    ? [{ text: `${playerName(card.winner, card.name)} জিতল!`, color: palette.ink, weight: 800, display: true }]
    : [
      ...(card.name ? [{ text: `${card.name} `, color: palette.ink, weight: 800, display: true }] : []),
      { text: `${bn(card.points)}`, color: palette.red, weight: 800, display: true },
      { text: " পয়েন্ট", color: palette.ink, weight: 800, display: true },
    ];
  fitText(c, head, 84, top + 150, 104, 912);
  const sub = duo
    ? `${bn(card.points)} পয়েন্ট · ${possessiveOther(card)} বাকি ছিল ${bn(card.points - (card.queen ? QUEEN_POINTS : 0))}টা গুটি${card.queen ? ", কুইন কভার" : ""}`
    : `${bn(STRIKES)} চালে ${piecesLine(card.points, card.queen)}`;
  fitText(c, [{ text: sub, color: "#6b4f38", weight: 600 }], 86, top + 222, 44, 912);

  // The board, with the opening flower drawn about twice life size so every spot reads on a phone feed.
  const size = story ? 960 : 840, bx = (width - size) / 2, by = story ? 580 : 318, k = size / TOTAL, grow = 2.1;
  c.save();
  c.translate(bx, by); c.scale(k, k);
  c.fillStyle = "rgba(60,30,8,.25)";
  c.beginPath(); c.roundRect(10, 18, TOTAL, TOTAL, 22); c.fill();
  paintBoard(c);
  c.translate(RAIL + CENTRE, RAIL + CENTRE);
  c.fillStyle = "rgba(246,232,200,.55)";
  c.beginPath(); c.arc(0, 0, (2 * (2 * COIN_R + 0.6) + COIN_R) * grow + 14, 0, Math.PI * 2); c.fill();
  const spots = formation();
  const coins = card.points - (card.queen ? QUEEN_POINTS : 0);
  const filled = (index: number, side: number) => {
    if (side === 2) return card.queen;
    if (card.mode === "solo") return index <= coins;
    const rank = spots.slice(1, index + 1).filter(spot => spot.side === side).length;
    return rank <= (side === card.winner ? PER_SIDE : PER_SIDE - coins);
  };
  spots.forEach((spot, index) => {
    const x = (spot.x - CENTRE) * grow, y = (spot.y - CENTRE) * grow, r = COIN_R * grow;
    if (filled(index, spot.side)) { paintDisc(c, spot.side === 2 ? "queen" : spot.side === 0 ? "white" : "black", x, y, r); return; }
    c.strokeStyle = "rgba(42,26,16,.4)"; c.lineWidth = 2.5; c.setLineDash([6, 6]);
    c.beginPath(); c.arc(x, y, r - 2, 0, Math.PI * 2); c.stroke();
    c.setLineDash([]);
  });
  c.restore();

  const line = duo ? duoLine(card.points) : humanLine(card.points);
  fitText(c, [{ text: line, color: palette.ink, weight: 600 }], width / 2, footer - (story ? 70 : 40), story ? 46 : 40, 960, "center");
  drawFooterBand(c, format, duo ? "তোমাদের বোর্ডে কে জিতবে?" : "তুমি কয়টা পারবে?", site, { band: palette.ink, ask: "#f2c46b", site: "#ffffff" });
}

const possessiveOther = (card: Extract<Shared, { mode: "duo" }>) => card.other ? possessive(card.other) : SIDE_OF[(1 - card.winner) as 0 | 1];

export const cardBlob = (card: Shared, format: CardFormat, site: string) => renderCard(canvas => drawCard(canvas, card, format, site));

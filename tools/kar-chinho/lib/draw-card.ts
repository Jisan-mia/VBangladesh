// The "আব্বু-আম্মুকে দেখাও" card: the round's ten finished words with their pictures and a line for the parent.
// No name, no photo, no stars (what was done, never a grade). Drawn on the phone; saving it is behind the parent gate.
import { cardSizes, drawFooterBand, fitText, renderCard } from "../../../shared/card-canvas";
import { drawWordPicture } from "./art";
import { ALL_SIGNS, levelOf, signsOf } from "./levels";
import { bn, dotted, type Item } from "./words";

const colors = { bg: "#fff7e8", rule: "#f1e3c4", ink: "#3b2a17", muted: "#7a6a52", accent: "#a8326a", band: "#5c1d3c", ask: "#ffd9ea" };

export type CardRound = { level: number; items: readonly Item[] };

export const cardLine = (round: CardRound) => `আজ ${bn(round.items.length)}টা কার-চিহ্ন বসালাম`;
const signLine = (round: CardRound) => {
  const level = levelOf(round.level);
  if (level.kar) return `${level.title} ${dotted(level.kar)}`;
  return level.id === ALL_SIGNS ? "সব কার একসাথে" : `${level.title} · ${signsOf(level.id).map(dotted).join(" ")}`;
};

export function drawCard(canvas: HTMLCanvasElement, round: CardRound, site: string) {
  const { width, height } = cardSizes.feed;
  canvas.width = width; canvas.height = height;
  const c = canvas.getContext("2d");
  if (!c) throw new Error("এই ব্রাউজারে ছবি বানানো যাচ্ছে না।");
  const cx = width / 2;
  c.fillStyle = colors.bg; c.fillRect(0, 0, width, height);
  c.strokeStyle = colors.rule; c.lineWidth = 3;
  for (let y = 120; y < height - 100; y += 72) { c.beginPath(); c.moveTo(0, y); c.lineTo(width, y); c.stroke(); }

  fitText(c, [{ text: "কার-চিহ্ন বসাও", color: colors.muted, weight: 700, display: true }], cx, 104, 40, 900, "center");
  fitText(c, [{ text: cardLine(round), color: colors.ink, weight: 800, display: true }], cx, 214, 76, 960, "center");
  fitText(c, [{ text: signLine(round), color: colors.accent, weight: 800, display: true }], cx, 316, 64, 900, "center");

  // Two rows of five: picture over the finished word.
  const cols = 5, cell = (width - 80) / cols, top = 400, rowHeight = 390;
  round.items.forEach((item, i) => {
    const x = 40 + cell * (i % cols + 0.5), y = top + Math.floor(i / cols) * rowHeight;
    c.fillStyle = "#ffffff"; c.beginPath(); c.roundRect(x - cell / 2 + 10, y, cell - 20, rowHeight - 30, 24); c.fill();
    drawWordPicture(c, item.pic, x, y + 135, 180);
    fitText(c, [{ text: item.word, color: colors.ink, weight: 800, display: true }], x, y + 310, 60, cell - 36, "center");
  });

  drawFooterBand(c, "feed", "শব্দগুলো ওর সাথে একবার জোরে পড়ো", site, { band: colors.band, ask: colors.ask, site: "#ffffff" });
}

export const cardBlob = (round: CardRound, site: string) => renderCard(canvas => drawCard(canvas, round, site));

// The "আব্বু-আম্মুকে দেখাও" card: the round's words with their pictures and parts (ক্ষ = ক + ষ). No name, no photo, no stars
// (what was done, never a grade). Drawn on the phone; saving it is behind the parent gate.
import { cardSizes, drawFooterBand, fitText, renderCard } from "../../../shared/card-canvas";
import { drawWordPicture } from "./art";
import { levelOf } from "./levels";
import { cardLine, type Step } from "./round";
import { equation } from "./words";

const colors = { bg: "#eef6f2", tile: "#ffffff", ink: "#1d3a33", muted: "#4f6b64", accent: "#1f6f5c", band: "#134a3d", ask: "#ffd98a" };

export type CardRound = { level: number; steps: readonly Step[] };

export function drawCard(canvas: HTMLCanvasElement, round: CardRound, site: string) {
  const { width, height } = cardSizes.feed;
  canvas.width = width; canvas.height = height;
  const c = canvas.getContext("2d");
  if (!c) throw new Error("এই ব্রাউজারে ছবি বানানো যাচ্ছে না।");
  const cx = width / 2;
  c.fillStyle = colors.bg; c.fillRect(0, 0, width, height);

  fitText(c, [{ text: "যুক্তবর্ণ ভাঙি-জুড়ি", color: colors.muted, weight: 700, display: true }], cx, 104, 40, 900, "center");
  fitText(c, [{ text: cardLine(round.steps), color: colors.ink, weight: 800, display: true }], cx, 214, 76, 960, "center");
  fitText(c, [{ text: levelOf(round.level).title, color: colors.accent, weight: 800, display: true }], cx, 316, 56, 900, "center");

  // Rows of three (six words) or four (a finale): picture, the word, and its parts. The footer band starts 96 px from the bottom.
  const items = round.steps.map(step => step.word), cols = items.length > 6 ? 4 : 3, rows = Math.ceil(items.length / cols);
  const cell = (width - 80) / cols, top = 380, rowHeight = Math.min(450, (height - 96 - 24 - top) / rows);
  const art = Math.min(190, cell - 40, rowHeight * 0.44), small = cols === 4;
  items.forEach((item, i) => {
    const x = 40 + cell * (i % cols + 0.5), y = top + Math.floor(i / cols) * rowHeight;
    c.fillStyle = colors.tile; c.beginPath(); c.roundRect(x - cell / 2 + 10, y, cell - 20, rowHeight - 24, 28); c.fill();
    drawWordPicture(c, item.pic, x, y + rowHeight * 0.33, art);
    fitText(c, [{ text: item.word, color: colors.ink, weight: 800, display: true }], x, y + rowHeight * 0.69, small ? 52 : 62, cell - 40, "center");
    fitText(c, [{ text: equation(item.parts), color: colors.accent, weight: 700, display: true }], x, y + rowHeight * 0.88, small ? 38 : 44, cell - 40, "center");
  });

  drawFooterBand(c, "feed", "সাইনবোর্ডে একটা যুক্তবর্ণ একসাথে খুঁজে দেখো", site, { band: colors.band, ask: colors.ask, site: "#ffffff" });
}

export const cardBlob = (round: CardRound, site: string) => renderCard(canvas => drawCard(canvas, round, site));
export const cardFontSample = (round: CardRound) =>
  `যুক্তবর্ণ ভাঙি-জুড়ি ${cardLine(round.steps)} ${levelOf(round.level).title} ${round.steps.map(step => `${step.word.word} ${equation(step.word.parts)}`).join(" ")} সাইনবোর্ডে একটা যুক্তবর্ণ একসাথে খুঁজে দেখো ০১২৩৪৫৬৭৮৯ = +`;

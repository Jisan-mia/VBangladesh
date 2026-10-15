// The "আব্বু-আম্মুকে দেখাও" card: today's count, and the last round's six words with their pictures and parts (ক্ষ = ক + ষ).
// No name, no photo, no stars. Drawn on the phone; saving it is behind the parent gate.
import { cardSizes, drawFooterBand, fitText, renderCard } from "../../../shared/card-canvas";
import { drawWordPicture } from "./art";
import { cardLine, equation, type Mode, type Word } from "./words";

const colors = { bg: "#eef6f2", tile: "#ffffff", ink: "#1d3a33", muted: "#4f6b64", accent: "#1f6f5c", band: "#134a3d", ask: "#ffd98a" };

export type Today = { count: number; modes: Mode[]; items: readonly Word[] };

export function drawCard(canvas: HTMLCanvasElement, today: Today, site: string) {
  const { width, height } = cardSizes.feed;
  canvas.width = width; canvas.height = height;
  const c = canvas.getContext("2d");
  if (!c) throw new Error("এই ব্রাউজারে ছবি বানানো যাচ্ছে না।");
  const cx = width / 2;
  c.fillStyle = colors.bg; c.fillRect(0, 0, width, height);

  fitText(c, [{ text: "যুক্তবর্ণ ভাঙি-জুড়ি", color: colors.muted, weight: 700, display: true }], cx, 110, 40, 900, "center");
  fitText(c, [{ text: cardLine(today.count, today.modes), color: colors.ink, weight: 800, display: true }], cx, 220, 76, 960, "center");

  // Two rows of three: picture, the word, and its parts.
  const cols = 3, cell = (width - 80) / cols, top = 300, rowHeight = 450;
  today.items.slice(0, 6).forEach((item, i) => {
    const x = 40 + cell * (i % cols + 0.5), y = top + Math.floor(i / cols) * rowHeight;
    c.fillStyle = colors.tile; c.beginPath(); c.roundRect(x - cell / 2 + 12, y, cell - 24, rowHeight - 28, 28); c.fill();
    drawWordPicture(c, item.pic, x, y + 135, 190);
    fitText(c, [{ text: item.word, color: colors.ink, weight: 800, display: true }], x, y + 310, 64, cell - 48, "center");
    fitText(c, [{ text: equation(item.parts), color: colors.accent, weight: 700, display: true }], x, y + 385, 46, cell - 48, "center");
  });

  drawFooterBand(c, "feed", "সাইনবোর্ডে একটা যুক্তবর্ণ একসাথে খুঁজে দেখো", site, { band: colors.band, ask: colors.ask, site: "#ffffff" });
}

export const cardBlob = (today: Today, site: string) => renderCard(canvas => drawCard(canvas, today, site));
export const cardFontSample = (today: Today) =>
  `যুক্তবর্ণ ভাঙি-জুড়ি ${cardLine(today.count, today.modes)} ${today.items.map(item => `${item.word} ${equation(item.parts)}`).join(" ")} সাইনবোর্ডে একটা যুক্তবর্ণ একসাথে খুঁজে দেখো ০১২৩৪৫৬৭৮৯ = +`;

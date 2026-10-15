// The "আব্বু-আম্মুকে দেখাও" card: the letters written today, drawn from their own strokes on a খাতা page.
// No name, no photo, no score. Drawn on the phone; saving it sits behind the parent gate.
import { cardSizes, drawFooterBand, fitText, renderCard } from "../../../shared/card-canvas";
import { drawPicture } from "../../o-te-ojogor/lib/art";
import { cardLine } from "./levels";
import { strokesOf } from "./strokes";

const colors = { bg: "#fff8ea", rule: "#eadfc4", margin: "#e7a59a", ink: "#3a2a16", muted: "#7a6648", accent: "#9a4b12", band: "#5a2c0b", ask: "#ffd58a" };
export const ASK = "এবার খাতায় পেনসিলে একসাথে লেখো";

/** One letter from its strokes, `size` px across, centred at (cx, cy). */
export function drawLetter(c: CanvasRenderingContext2D, char: string, cx: number, cy: number, size: number, color = colors.accent) {
  const k = size / 100;
  c.save();
  c.translate(cx - size / 2, cy - size / 2);
  c.strokeStyle = color; c.lineWidth = 7 * k; c.lineCap = "round"; c.lineJoin = "round";
  for (const stroke of strokesOf(char)) {
    c.beginPath();
    if (stroke.dot) { c.fillStyle = color; c.arc(stroke.line[0][0] * k, stroke.line[0][1] * k, 4.5 * k, 0, Math.PI * 2); c.fill(); continue; }
    stroke.line.forEach(([x, y], i) => i ? c.lineTo(x * k, y * k) : c.moveTo(x * k, y * k));
    c.stroke();
  }
  c.restore();
}

/** The picture a letter turns into; "plate" is ০'s empty plate. Drawings come from অ-তে অজগর. */
export function drawPic(c: CanvasRenderingContext2D, pic: string, x: number, y: number, size: number) {
  if (pic !== "plate") { drawPicture(c, pic, x, y, size); return; }
  const r = size * 0.4;
  c.save();
  c.fillStyle = "#e9eef3"; c.beginPath(); c.ellipse(x, y, r, r * 0.5, 0, 0, Math.PI * 2); c.fill();
  c.strokeStyle = "#9fb0c2"; c.lineWidth = size * 0.04; c.beginPath(); c.ellipse(x, y, r * 0.65, r * 0.3, 0, 0, Math.PI * 2); c.stroke();
  c.restore();
}

export function drawCard(canvas: HTMLCanvasElement, letters: readonly string[], site: string) {
  const { width, height } = cardSizes.feed;
  canvas.width = width; canvas.height = height;
  const c = canvas.getContext("2d");
  if (!c) throw new Error("এই ব্রাউজারে ছবি বানানো যাচ্ছে না।");

  c.fillStyle = colors.bg; c.fillRect(0, 0, width, height);
  c.strokeStyle = colors.rule; c.lineWidth = 3;
  for (let y = 300; y < height - 96; y += 80) { c.beginPath(); c.moveTo(0, y); c.lineTo(width, y); c.stroke(); }
  c.strokeStyle = colors.margin; c.beginPath(); c.moveTo(80, 0); c.lineTo(80, height); c.stroke();

  fitText(c, [{ text: "বর্ণ লিখি", color: colors.muted, weight: 700, display: true }], width / 2 + 40, 110, 42, 860, "center");
  fitText(c, [{ text: cardLine(letters), color: colors.ink, weight: 800, display: true }], width / 2 + 40, 210, 62, 900, "center");

  const shown = letters.slice(-12), cols = shown.length <= 4 ? 2 : shown.length <= 9 ? 3 : 4, rows = Math.ceil(shown.length / cols);
  const top = 270, bottom = height - 130, cell = Math.min((width - 180) / cols, (bottom - top) / Math.max(rows, 1));
  shown.forEach((char, i) => {
    const row = Math.floor(i / cols), inRow = Math.min(cols, shown.length - row * cols);
    const cx = width / 2 + 40 + (i % cols - (inRow - 1) / 2) * cell, cy = top + (bottom - top - rows * cell) / 2 + (row + 0.5) * cell;
    drawLetter(c, char, cx, cy, cell * 0.86);
  });

  drawFooterBand(c, "feed", ASK, site, { band: colors.band, ask: colors.ask, site: "#ffffff" });
}

export const cardBlob = (letters: readonly string[], site: string) => renderCard(canvas => drawCard(canvas, letters, site));
export const cardFontSample = (letters: readonly string[]) => `বর্ণ লিখি ${cardLine(letters)} ${ASK} ০১২৩৪৫৬৭৮৯`;

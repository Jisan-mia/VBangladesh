// The "আব্বু-আম্মুকে দেখাও" card: a phone whose screen shows eleven dots and whose keys are blank, so no digit is ever drawn.
// No name, no number, no stars. Saving it is behind the parent gate.
import { cardSizes, drawFooterBand, fitText, renderCard } from "../../../shared/card-canvas";
import { cardLine, type Who } from "./play";

const colors = { bg: "#eef6f2", ink: "#16332a", muted: "#4d6b60", accent: "#0f7a5a", phone: "#16332a", screen: "#dff3ea", key: "#ffffff", band: "#0d3b2e", ask: "#ffd98a" };
export const CARD_ASK = "নম্বরটা আজ ওর মুখে একবার শুনে নাও";

export function drawCard(canvas: HTMLCanvasElement, who: Who, site: string) {
  const { width, height } = cardSizes.feed;
  canvas.width = width; canvas.height = height;
  const c = canvas.getContext("2d");
  if (!c) throw new Error("এই ব্রাউজারে ছবি বানানো যাচ্ছে না।");
  const cx = width / 2;
  c.fillStyle = colors.bg; c.fillRect(0, 0, width, height);
  fitText(c, [{ text: "আম্মুর নম্বর", color: colors.muted, weight: 700, display: true }], cx, 110, 44, 900, "center");
  fitText(c, [{ text: cardLine(who), color: colors.accent, weight: 800, display: true }], cx, 215, 72, 980, "center");

  // The phone: a screen of eleven dots in the 5-3-3 rhythm, and the pad below.
  const left = 290, top = 290, w = 500, h = 860;
  c.fillStyle = colors.phone; c.beginPath(); c.roundRect(left, top, w, h, 64); c.fill();
  c.fillStyle = colors.screen; c.beginPath(); c.roundRect(left + 34, top + 60, w - 68, 150, 28); c.fill();
  const dots = [0, 1, 2, 3, 4, null, 5, 6, 7, null, 8, 9, 10], gap = (w - 120) / dots.length;
  dots.forEach((dot, index) => {
    if (dot === null) { c.fillStyle = colors.muted; c.fillRect(left + 60 + gap * index + gap / 2 - 9, top + 133, 18, 5); return; }
    c.fillStyle = colors.accent; c.beginPath(); c.arc(left + 60 + gap * (index + 0.5), top + 135, 11, 0, Math.PI * 2); c.fill();
  });
  const keys = [1, 2, 3, 4, 5, 6, 7, 8, 9, -1, 0, -2], size = 118, keyGap = 22;
  keys.forEach((key, index) => {
    const x = left + 51 + (index % 3) * (size + keyGap), y = top + 250 + Math.floor(index / 3) * (size + keyGap);
    if (key === -1) return;
    c.fillStyle = key === -2 ? "#2fbf71" : colors.key; c.beginPath(); c.arc(x + size / 2, y + size / 2, size / 2, 0, Math.PI * 2); c.fill();
    if (key === -2) drawHandset(c, x + size / 2, y + size / 2);
  });
  drawFooterBand(c, "feed", CARD_ASK, site, { band: colors.band, ask: colors.ask, site: "#ffffff" });
}

function drawHandset(c: CanvasRenderingContext2D, x: number, y: number) {
  c.save(); c.translate(x, y); c.rotate(-Math.PI / 4);
  c.fillStyle = "#ffffff"; c.beginPath(); c.roundRect(-30, -9, 60, 18, 9); c.fill();
  c.beginPath(); c.roundRect(-34, -9, 20, 30, 8); c.roundRect(14, -9, 20, 30, 8); c.fill();
  c.restore();
}

export const cardBlob = (who: Who, site: string) => renderCard(canvas => drawCard(canvas, who, site));
export const cardFontSample = `আম্মুর আব্বুর নম্বর আজ মুখস্থ করলাম ${CARD_ASK}`;

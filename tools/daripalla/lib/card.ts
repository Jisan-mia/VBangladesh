import { cardSizes, drawFooterBand, fitText, renderCard } from "../../../shared/card-canvas";
import { cardLines, type Today } from "./text";

const colors = { bg: "#fbf1de", ink: "#3a2a1a", muted: "#7a6450", accent: "#9a4b12", wood: "#9a6a2c", woodDark: "#7a5222", iron: "#555b66", ironTop: "#6b7280", string: "#8a5d22", pan: "#c9a46a", slate: "#2f3b34", chalk: "#fff8e6", band: "#3a2316", ask: "#ffd166" };
export const CARD_ASK = "বাজারে দোকানির পাল্লাটা একসাথে দেখো।";
const CARD_HOW = "দুই দিক সমান ভারী হলে কাঁটা সোজা থাকে।";

function weight(c: CanvasRenderingContext2D, cx: number, base: number, size: number, label: string) {
  const top = base - size, half = size * 0.5;
  c.strokeStyle = "#3b3f47"; c.lineWidth = size * 0.07; c.lineCap = "round";
  c.beginPath(); c.arc(cx, top + size * 0.02, size * 0.12, Math.PI, 0); c.stroke();
  c.fillStyle = colors.iron;
  c.beginPath(); c.moveTo(cx - half * 0.66, top + size * 0.1); c.lineTo(cx + half * 0.66, top + size * 0.1); c.lineTo(cx + half, base); c.lineTo(cx - half, base); c.closePath(); c.fill();
  c.fillStyle = colors.ironTop; c.fillRect(cx - half * 0.68, top + size * 0.1, half * 1.36, size * 0.1);
  fitText(c, [{ text: label, color: "#ffffff", weight: 800, display: true }], cx, base - size * 0.18, size * 0.5, size * 0.9, "center");
}

/** A level shop balance, the size of the card's middle. */
function balance(c: CanvasRenderingContext2D, cx: number, beamY: number) {
  const arm = 300, hang = 236;
  c.fillStyle = colors.wood; c.beginPath(); c.roundRect(cx - 14, beamY, 28, 340, 10); c.fill();
  c.fillStyle = colors.woodDark; c.beginPath(); c.ellipse(cx, beamY + 340, 150, 30, 0, Math.PI, 0); c.fill();
  c.strokeStyle = colors.string; c.lineWidth = 8; c.lineJoin = "round";
  c.beginPath(); c.moveTo(cx - 34, beamY - 6); c.lineTo(cx - 28, beamY - 84); c.lineTo(cx + 28, beamY - 84); c.lineTo(cx + 34, beamY - 6); c.stroke();
  // The needle points straight up: level.
  c.fillStyle = colors.accent; c.beginPath(); c.moveTo(cx - 9, beamY); c.lineTo(cx, beamY - 76); c.lineTo(cx + 9, beamY); c.fill();
  c.fillStyle = colors.woodDark; c.beginPath(); c.roundRect(cx - arm - 20, beamY - 10, 2 * arm + 40, 22, 11); c.fill();
  for (const side of [-1, 1]) {
    const x = cx + side * arm, plate = beamY + hang;
    c.strokeStyle = colors.string; c.lineWidth = 4;
    c.beginPath(); c.moveTo(x - 120, plate); c.lineTo(x, beamY + 4); c.lineTo(x + 120, plate); c.stroke();
    c.fillStyle = colors.pan; c.beginPath(); c.ellipse(x, plate, 140, 26, 0, 0, Math.PI); c.fill();
    c.fillStyle = colors.string; c.fillRect(x - 140, plate - 4, 280, 8);
  }
  weight(c, cx - arm, beamY + hang - 4, 130, "৭");
  weight(c, cx + arm - 62, beamY + hang - 4, 100, "৪");
  weight(c, cx + arm + 52, beamY + hang - 4, 80, "৩");
}

/** What the child did today, for the parent: a level balance, today's last sum, and today's counts. No name, no photo. */
export function drawCard(canvas: HTMLCanvasElement, today: Today, site: string) {
  const { width, height } = cardSizes.feed;
  canvas.width = width; canvas.height = height;
  const c = canvas.getContext("2d");
  if (!c) throw new Error("এই ব্রাউজারে ছবি বানানো যাচ্ছে না।");
  const cx = width / 2, lines = cardLines(today);
  c.fillStyle = colors.bg; c.fillRect(0, 0, width, height);
  fitText(c, [{ text: "দাঁড়িপাল্লা", color: colors.muted, weight: 700, display: true }], cx, 110, 44, 900, "center");
  fitText(c, [{ text: lines[0] ?? "আজ পাল্লা সমান করলাম", color: colors.accent, weight: 800, display: true }], cx, 230, 76, 960, "center");
  balance(c, cx, 400);
  if (today.last) {
    c.fillStyle = colors.slate; c.beginPath(); c.roundRect(150, 830, width - 300, 130, 24); c.fill();
    fitText(c, [{ text: today.last, color: colors.chalk, weight: 800, display: true }], cx, 918, 76, width - 360, "center");
  }
  const below = lines.length > 1 ? lines.slice(1) : [CARD_HOW];
  below.forEach((line, index) => fitText(c, [{ text: line, color: lines.length > 1 ? colors.ink : colors.muted, weight: 800, display: true }], cx, 1060 + index * 80, 52, 960, "center"));
  drawFooterBand(c, "feed", CARD_ASK, site, { band: colors.band, ask: colors.ask, site: "#ffffff" });
}

export const cardBlob = (today: Today, site: string) => renderCard(canvas => drawCard(canvas, today, site));
export const cardFontSample = `দাঁড়িপাল্লা আজ ০১২৩৪৫৬৭৮৯বার পাল্লা সমান করলাম টা ফলের ওজন বের ছবির অঙ্ক মেলালাম কলা আনারস কমলা ডাব + = ★ ${CARD_ASK} ${CARD_HOW}`;

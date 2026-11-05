import { cardSizes, drawFooterBand, fitText, renderCard } from "../../../shared/card-canvas";
import { cardLines, type Today } from "./today";

const colors = { bg: "#fff4e3", night: "#1f2c5c", ink: "#3a2a1a", muted: "#7a6450", accent: "#c4511f", sun: "#ffc93c", ray: "#f4a21b", moon: "#ffe28a", band: "#3a2316", ask: "#ffd166" };
export const CARD_ASK = "মুখে মুখে খেলো: তুমি বলো দিন, ও বলবে রাত।";
const CARD_HOW = "সূর্য এলে চাঁদে চাপা, ঘণ্টা বাজলে নিয়ম বদল।";

function arrows(c: CanvasRenderingContext2D, cx: number, cy: number) {
  c.save();
  c.strokeStyle = colors.accent; c.lineWidth = 16; c.lineCap = "round"; c.lineJoin = "round";
  c.beginPath();
  c.moveTo(cx - 70, cy - 30); c.lineTo(cx + 70, cy - 30); c.moveTo(cx + 40, cy - 60); c.lineTo(cx + 70, cy - 30); c.lineTo(cx + 40, cy);
  c.moveTo(cx + 70, cy + 40); c.lineTo(cx - 70, cy + 40); c.moveTo(cx - 40, cy + 10); c.lineTo(cx - 70, cy + 40); c.lineTo(cx - 40, cy + 70);
  c.stroke();
  c.restore();
}

/** What the child did today, for the parent: a sun and a moon facing each other, and today's lines. No name, no photo. */
export function drawCard(canvas: HTMLCanvasElement, today: Today, site: string) {
  const { width, height } = cardSizes.feed;
  canvas.width = width; canvas.height = height;
  const c = canvas.getContext("2d");
  if (!c) throw new Error("এই ব্রাউজারে ছবি বানানো যাচ্ছে না।");
  const cx = width / 2, lines = cardLines(today);
  c.fillStyle = colors.bg; c.fillRect(0, 0, width, height);
  // The right half is night: the moon sits in it.
  c.fillStyle = colors.night; c.beginPath(); c.roundRect(cx + 20, 400, 400, 400, 48); c.fill();
  fitText(c, [{ text: "উল্টো খেলা", color: colors.muted, weight: 700, display: true }], cx, 120, 44, 900, "center");
  fitText(c, [{ text: lines[0] ?? "আজ সূর্য দেখে চাঁদে চাপলাম", color: colors.accent, weight: 800, display: true }], cx, 270, 80, 960, "center");

  // Sun, left.
  const sx = cx - 240, sy = 600;
  c.fillStyle = colors.ray;
  for (let index = 0; index < 12; index++) { c.save(); c.translate(sx, sy); c.rotate(index * Math.PI / 6); c.beginPath(); c.roundRect(-12, -170, 24, 56, 12); c.fill(); c.restore(); }
  c.fillStyle = colors.sun; c.strokeStyle = colors.ray; c.lineWidth = 10;
  c.beginPath(); c.arc(sx, sy, 100, 0, Math.PI * 2); c.fill(); c.stroke();
  // Moon, right: a crescent cut from a circle.
  const mx = cx + 220, my = 600;
  c.fillStyle = colors.moon; c.beginPath(); c.arc(mx, my, 120, 0, Math.PI * 2); c.fill();
  // The bite stays inside the night square, so it needs no clip (a clip leaves a faint ring).
  c.fillStyle = colors.night; c.beginPath(); c.arc(mx + 55, my - 45, 98, 0, Math.PI * 2); c.fill();
  c.fillStyle = colors.moon;
  for (const [x, y] of [[cx + 330, 470], [cx + 360, 710], [cx + 90, 450]]) { c.beginPath(); c.arc(x, y, 9, 0, Math.PI * 2); c.fill(); }
  arrows(c, cx - 10, 600);

  const below = lines.length > 1 ? lines.slice(1) : [CARD_HOW];
  below.forEach((line, index) => fitText(c, [{ text: line, color: lines.length > 1 ? colors.ink : colors.muted, weight: 800, display: true }], cx, 960 + index * 84, 52, 960, "center"));
  drawFooterBand(c, "feed", CARD_ASK, site, { band: colors.band, ask: colors.ask, site: "#ffffff" });
}

export const cardBlob = (today: Today, site: string) => renderCard(canvas => drawCard(canvas, today, site));
export const cardFontSample = `উল্টো খেলা আজ ০১২৩৪৫৬৭৮৯টা ছবিতে খেললাম কার্ড রং আর আকারে সাজালাম ঘণ্টা বাজল বার, নিয়ম বদলে নিলাম ${CARD_ASK} ${CARD_HOW}`;

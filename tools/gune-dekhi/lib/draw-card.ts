import { cardSizes, drawFooterBand, fitText, renderCard } from "../../../shared/card-canvas";
import { cardLines, type Today } from "./game";
import { FISH_BODY, FISH_EYE, FISH_FIN, FISH_TAIL, FISH_TINTS } from "./shapes";

const colors = { bg: "#eef7f4", ink: "#1f3a3d", muted: "#5a7275", accent: "#0f7c78", pond: "#8fd0d6", pondEdge: "#4fa9b2", band: "#123b40", ask: "#ffd166" };
export const CARD_ASK = "খাওয়ার সময় একসাথে গুনে দেখো, প্লেটে কয়টা?";
const CARD_MORE = "পুকুরে ২০টা আঁকা গেল, বাকিগুলো পানির নিচে।";
const CARD_HOW = "এক এক করে ছুঁয়ে গোনা, শেষ নম্বরটাই মোট।";

function fish(c: CanvasRenderingContext2D, x: number, y: number, size: number, tint: number, flip: boolean) {
  const [body, line] = FISH_TINTS[tint % FISH_TINTS.length], scale = size / 100;
  c.save();
  c.translate(x, y); c.scale(flip ? -scale : scale, scale); c.translate(-50, -32);
  c.fillStyle = line; c.fill(new Path2D(FISH_TAIL)); c.fill(new Path2D(FISH_FIN));
  c.fillStyle = body; c.strokeStyle = line; c.lineWidth = 3;
  const shape = new Path2D(FISH_BODY); c.fill(shape); c.stroke(shape);
  c.fillStyle = "#1f2a30"; c.beginPath(); c.arc(FISH_EYE.x, FISH_EYE.y, FISH_EYE.r, 0, Math.PI * 2); c.fill();
  c.restore();
}

/** What the child did today, for the parent: fish counted, patterns seen, ponds compared. No name, no photo. */
export function drawCard(canvas: HTMLCanvasElement, today: Today, site: string) {
  const { width, height } = cardSizes.feed;
  canvas.width = width; canvas.height = height;
  const c = canvas.getContext("2d");
  if (!c) throw new Error("এই ব্রাউজারে ছবি বানানো যাচ্ছে না।");
  const cx = width / 2, lines = cardLines(today);
  c.fillStyle = colors.bg; c.fillRect(0, 0, width, height);
  fitText(c, [{ text: "গুনে দেখি", color: colors.muted, weight: 700, display: true }], cx, 120, 44, 900, "center");
  fitText(c, [{ text: lines[0] ?? "আজ পুকুরে মাছ দেখলাম", color: colors.accent, weight: 800, display: true }], cx, 260, 96, 960, "center");

  // The pond holds exactly the number on the card (a child will count them), up to 20.
  const total = today.fish || today.seen || today.ponds, shown = Math.max(1, Math.min(20, total)), cols = 5, rows = Math.ceil(shown / cols);
  c.fillStyle = colors.pond; c.strokeStyle = colors.pondEdge; c.lineWidth = 10;
  c.beginPath(); c.ellipse(cx, 660, 470, 320, 0, 0, Math.PI * 2); c.fill(); c.stroke();
  for (let index = 0; index < shown; index++) {
    const row = Math.floor(index / cols), inRow = Math.min(cols, shown - row * cols), col = index % cols;
    fish(c, cx + (col - (inRow - 1) / 2) * 150, 660 + (row - (rows - 1) / 2) * 130, 116, index, row % 2 === 1);
  }
  const below = [...(total > 20 ? [CARD_MORE] : []), ...lines.slice(1), ...(lines.length < 2 && total <= 20 ? [CARD_HOW] : [])];
  below.forEach((line, index) => fitText(c, [{ text: line, color: lines.includes(line) ? colors.ink : colors.muted, weight: 800, display: true }], cx, 1060 + index * 66, 48, 960, "center"));
  drawFooterBand(c, "feed", CARD_ASK, site, { band: colors.band, ask: colors.ask, site: "#ffffff" });
}

export const cardBlob = (today: Today, site: string) => renderCard(canvas => drawCard(canvas, today, site));
export const cardFontSample = `গুনে দেখি আজ ০১২৩৪৫৬৭৮৯টা মাছ গুনলাম নকশা এক নজরে চিনলাম জোড়া পুকুর মেলালাম দেখলাম ${CARD_ASK} ${CARD_MORE} ${CARD_HOW}`;

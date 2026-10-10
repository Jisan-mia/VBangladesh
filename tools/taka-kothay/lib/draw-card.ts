import { BODY_FONT, DISPLAY_FONT, cardSizes, drawFooterBand, fitText, renderCard, storySafe, wrapText, type CardFormat } from "../../../shared/card-canvas";
import { banglaAmount, englishAmount, figures } from "./number-words";
import { humanLine, type Primer } from "./primer";

// A page torn from a ধারাপাত: yellowed newsprint, faint blue rules, a red double margin, and the sum in fountain-pen ink.
const PAPER = "#f3e2a0";
const PAPER_EDGE = "#dcc274";
const RULE = "rgba(92, 122, 170, 0.32)";
const MARGIN = "#d0443a";
const INK = "#1f2b5c";
const PRINT = "#2a2622";
const RED_PEN = "#c0302a";
const BAND = { band: "#7d1d17", ask: "#ffe08a", site: "#ffffff" };

const LEFT = 196;
const RIGHT = 1000;

const layouts = {
  feed: { kicker: 128, figure: 318, figureSize: 168, words: 420, wordSizes: [92, 44], englishHeight: 200, note: 64, ruleTop: 176 },
  story: { kicker: storySafe.top + 90, figure: storySafe.top + 300, figureSize: 184, words: storySafe.top + 420, wordSizes: [104, 48], englishHeight: 260, note: 110, ruleTop: storySafe.top + 20 },
} as const;

/** Largest size (down to min) whose wrapped lines fit the height; at the floor, wrapText's "…" keeps it on the page. */
function wrapToFit(context: CanvasRenderingContext2D, text: string, font: (size: number) => string, maxWidth: number, [max, min]: readonly [number, number], height: number, leading: number) {
  for (let size = max; size >= min; size -= 2) {
    context.font = font(size);
    const lines = wrapText(context, text, maxWidth, 99);
    if (lines.length * size * leading <= height) return { size, lines };
  }
  context.font = font(min);
  return { size: min, lines: wrapText(context, text, maxWidth, Math.max(1, Math.floor(height / (min * leading)))) };
}

function paper(context: CanvasRenderingContext2D, width: number, height: number, ruleTop: number, ruleBottom: number) {
  const glow = context.createRadialGradient(width / 2, height * 0.42, height * 0.2, width / 2, height / 2, height * 0.78);
  glow.addColorStop(0, PAPER);
  glow.addColorStop(1, PAPER_EDGE);
  context.fillStyle = glow;
  context.fillRect(0, 0, width, height);
  // Newsprint flecks, seeded so the same card always looks the same.
  let seed = 1971;
  const next = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
  for (let i = 0; i < 700; i++) {
    context.fillStyle = next() > 0.5 ? "rgba(110, 80, 30, 0.10)" : "rgba(255, 255, 255, 0.22)";
    context.fillRect(next() * width, next() * height, 1 + next() * 3, 1 + next() * 2);
  }
  context.strokeStyle = RULE;
  context.lineWidth = 2;
  for (let y = ruleTop; y < ruleBottom; y += 74) {
    context.beginPath(); context.moveTo(0, y); context.lineTo(width, y); context.stroke();
  }
  context.strokeStyle = MARGIN;
  context.lineWidth = 3;
  for (const x of [140, 150]) {
    context.beginPath(); context.moveTo(x, 0); context.lineTo(x, ruleBottom); context.stroke();
  }
}

/** The teacher's red tick in the margin, beside her note. */
function tick(context: CanvasRenderingContext2D, x: number, y: number) {
  context.strokeStyle = RED_PEN;
  context.lineWidth = 9;
  context.lineCap = "round";
  context.lineJoin = "round";
  context.beginPath(); context.moveTo(x, y - 18); context.lineTo(x + 18, y + 4); context.lineTo(x + 56, y - 46); context.stroke();
}

export function drawCard(canvas: HTMLCanvasElement, primer: Primer, format: CardFormat, site: string) {
  const { width, height } = cardSizes[format];
  const layout = layouts[format];
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext("2d");
  if (!context) throw new Error("এই ব্রাউজারে ছবি বানানো যাচ্ছে না।");
  const footerTop = format === "story" ? height - 260 : height - 96;
  paper(context, width, height, layout.ruleTop, footerTop);
  context.textBaseline = "alphabetic";
  const maxWidth = RIGHT - LEFT;

  fitText(context, [{ text: "ধারাপাত", color: RED_PEN, weight: 800, display: true }, { text: "  ·  টাকা কথায় লিখি", color: PRINT, weight: 600 }], LEFT, layout.kicker, 38, maxWidth);
  fitText(context, [{ text: "৳ ", color: PRINT, weight: 700, display: true }, { text: figures(primer.amount), color: PRINT, weight: 800, display: true }], LEFT, layout.figure, layout.figureSize, maxWidth);
  fitText(context, [{ text: "= কথায়", color: RED_PEN, weight: 700 }], LEFT, layout.figure + 70, 34, maxWidth);

  const noteY = footerTop - layout.note;
  const english = wrapToFit(context, englishAmount(primer.amount, { international: primer.international }), size => `600 ${size}px ${BODY_FONT}`, maxWidth, [40, 26], layout.englishHeight, 1.4);
  const englishHeight = english.lines.length * Math.round(english.size * 1.4);
  const wordsHeight = noteY - 140 - layout.words - englishHeight;
  const words = wrapToFit(context, banglaAmount(primer.amount, { formal: primer.formal }), size => `700 ${size}px ${DISPLAY_FONT}`, maxWidth, layout.wordSizes, wordsHeight, 1.32);
  const lineHeight = Math.round(words.size * 1.32);
  let y = layout.words + words.size;
  context.fillStyle = INK;
  context.font = `700 ${words.size}px ${DISPLAY_FONT}`;
  for (const line of words.lines) { context.fillText(line, LEFT, y); y += lineHeight; }

  y += Math.round(english.size * 0.3);
  context.fillStyle = "#4b4a5e";
  context.font = `600 ${english.size}px ${BODY_FONT}`;
  for (const line of english.lines) { context.fillText(line, LEFT, y); y += Math.round(english.size * 1.4); }

  tick(context, 56, noteY);
  fitText(context, [{ text: humanLine(primer), color: RED_PEN, weight: 700 }], LEFT, noteY, 44, maxWidth);

  drawFooterBand(context, format, "এই সংখ্যাটা কথায় লিখতে পারবে?", site, BAND);
}

export const cardBlob = (primer: Primer, format: CardFormat, site: string) => renderCard(canvas => drawCard(canvas, primer, format, site));

import { BODY_FONT, cardSizes, drawFooterBand, fitText, renderCard, roundedRect, wrapText, type CardFormat } from "../../../shared/card-canvas";
import { ARCH, archPieces, drawPieces } from "./arch";
import { bn, cardHeadline, momentLabel, yearLabel, type MomentId } from "./mondop";

export type CardContent = {
  name: string;
  year: number;
  count: number;
  moments: readonly MomentId[];
  pandals: string;
  line: string;
  /** "শুভ বিজয়া" or "শুভ শারদীয়া". */
  signOff: string;
  /** "রিমা ১১টা · আমি ৭টা", or empty. */
  friend: string;
};

const PAPER = "#fdf6ea";
const INK = "#3b1209";
const RED = "#b3171f";
const MUTED = "#7a4a35";
const PILL = "#fbe2a6";

const layouts = {
  feed: { kicker: 100, title: 196, titleSize: 92, archTop: 226, archScale: 0.9 },
  story: { kicker: 330, title: 436, titleSize: 104, archTop: 480, archScale: 1 },
} as const;

/** The red saree border along the top, with a row of small ochre dots. */
function drawBorder(context: CanvasRenderingContext2D, width: number) {
  context.fillStyle = RED;
  context.fillRect(0, 0, width, 34);
  context.fillStyle = "#f1bd45";
  context.fillRect(0, 34, width, 6);
  for (let x = 18; x < width; x += 36) { context.beginPath(); context.arc(x, 17, 5, 0, Math.PI * 2); context.fill(); }
}

/** Packs moment labels into rows of pills at most `maxWidth` wide; extra rows past `maxRows` are dropped. */
function pillRows(context: CanvasRenderingContext2D, labels: readonly string[], maxWidth: number, maxRows: number) {
  context.font = `600 30px ${BODY_FONT}`;
  const rows: string[][] = [];
  const widthOf = (row: string[]) => row.reduce((sum, label) => sum + context.measureText(label).width + 44, 0) + (row.length - 1) * 14;
  for (const label of labels) {
    const last = rows.at(-1);
    if (last && widthOf([...last, label]) <= maxWidth) last.push(label);
    else if (rows.length < maxRows) rows.push([label]);
  }
  return { rows, widthOf };
}

export function drawCard(canvas: HTMLCanvasElement, card: CardContent, format: CardFormat, site: string) {
  const { width, height } = cardSizes[format];
  const layout = layouts[format];
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext("2d");
  if (!context) throw new Error("এই ব্রাউজারে ছবি বানানো যাচ্ছে না।");
  const middle = width / 2;

  context.fillStyle = PAPER;
  context.fillRect(0, 0, width, height);
  const scale = layout.archScale;
  const archLeft = middle - (ARCH.width * scale) / 2;
  const archBottom = layout.archTop + ARCH.height * scale;
  // A soft lamp-light glow behind the arch.
  const glow = context.createRadialGradient(middle, layout.archTop + ARCH.cy * scale, 60, middle, layout.archTop + ARCH.cy * scale, 620);
  glow.addColorStop(0, "#ffe6a8");
  glow.addColorStop(1, "rgba(253,246,234,0)");
  context.fillStyle = glow;
  context.fillRect(0, layout.archTop - 80, width, ARCH.height * scale + 80);
  drawBorder(context, width);

  fitText(context, [{ text: `দুর্গাপূজা ${yearLabel(card.year)} · মণ্ডপ ঘুরি`, color: RED, weight: 600 }], middle, layout.kicker, 32, 900, "center");
  fitText(context, [{ text: cardHeadline(card.name), color: INK, weight: 800, display: true }], middle, layout.title, layout.titleSize, 920, "center");

  context.save();
  context.translate(archLeft, layout.archTop);
  context.scale(scale, scale);
  drawPieces(context, archPieces(card.count));
  context.restore();
  const inArch = (y: number) => layout.archTop + y * scale;
  fitText(context, [{ text: bn(card.count), color: RED, weight: 800, display: true }], middle, inArch(ARCH.cy - 88), 180 * scale, 360 * scale, "center");
  fitText(context, [{ text: "টা মণ্ডপ", color: INK, weight: 700, display: true }], middle, inArch(ARCH.cy - 28), 50 * scale, 360 * scale, "center");

  // The block under the arch is measured first, then centred in the space above the footer.
  const footerTop = format === "story" ? height - 260 : height - 96;
  context.font = `700 44px ${BODY_FONT}`;
  const lines = wrapText(context, card.line, 900, 2);
  const { rows, widthOf } = pillRows(context, card.moments.map(momentLabel), 940, format === "story" ? 3 : 2);
  context.font = `500 30px ${BODY_FONT}`;
  const pandals = card.pandals ? wrapText(context, `মণ্ডপ: ${card.pandals}`, 900, 2) : [];
  const blocks = 76 + lines.length * 58 + (rows.length ? 20 + rows.length * 66 : 0) + (pandals.length ? 16 + pandals.length * 44 : 0) + (card.friend ? 62 : 0);
  let y = archBottom + Math.max(34, (footerTop - archBottom - blocks) / 2) + 54;

  fitText(context, [{ text: card.signOff, color: RED, weight: 800, display: true }], middle, y, 62, 900, "center");
  y += 22;
  for (const line of lines) { y += 58; fitText(context, [{ text: line, color: INK, weight: 700, display: true }], middle, y, 44, 900, "center"); }
  if (rows.length) y += 20;
  for (const row of rows) {
    context.font = `600 30px ${BODY_FONT}`;
    let x = middle - widthOf(row) / 2;
    for (const label of row) {
      const pill = context.measureText(label).width + 44;
      context.fillStyle = PILL;
      roundedRect(context, x, y + 8, pill, 54, 27);
      context.fill();
      context.fillStyle = INK;
      context.textAlign = "left";
      context.fillText(label, x + 22, y + 46);
      x += pill + 14;
    }
    y += 66;
  }
  if (pandals.length) y += 16;
  for (const line of pandals) { y += 44; fitText(context, [{ text: line, color: MUTED, weight: 500 }], middle, y, 30, 900, "center"); }
  if (card.friend) fitText(context, [{ text: card.friend, color: RED, weight: 700, display: true }], middle, y + 58, 40, 900, "center");

  drawFooterBand(context, format, "তুমি কয়টা মণ্ডপ ঘুরলে?", site, { band: "#7a0c11", ask: "#ffd166", site: "#ffffff" });
}

export const cardBlob = (card: CardContent, format: CardFormat, site: string) => renderCard(canvas => drawCard(canvas, card, format, site));

import { BODY_FONT, DISPLAY_FONT, cardSizes, drawFooterBand, fitText, renderCard, roundedRect, wrapText, type CardFormat } from "../../../shared/card-canvas";
import { bn, possessive, RECIPE_ASK, recipeLine, whoseWord, type RecipeCard } from "./recipe";

const INK = "#22305c";
const CHILI = "#b4432a";
const BROWN = "#7a4b2b";
const MUTED = "#8a7d66";
const MORE = "#9a6510";
export const MORE_NOTE = "…আরও আছে, পুরোটা লিংকে";

const left = 186, right = 1010, width = right - left;
// Every line of text sits on a notebook rule: rule k is at RULE_TOP + k * RULE, text baselines 12px above it.
const RULE_TOP = 150, RULE = 58;
const onRule = (k: number) => RULE_TOP + k * RULE - 12;
const layouts = {
  feed: { metaY: 92, titleK: 2, title: 92, story: 34, storyLines: 2, item: 32, rows: 4, step: 32, stepLines: 2, stain: [1010, 330] },
  story: { metaY: 312, titleK: 5, title: 104, story: 37, storyLines: 4, item: 36, rows: 6, step: 36, stepLines: 3, stain: [1000, 600] },
} as const;

function drawPaper(context: CanvasRenderingContext2D, w: number, h: number, stain: readonly number[]) {
  context.fillStyle = "#fcf5e3";
  context.fillRect(0, 0, w, h);
  // Pages yellow at the edges first.
  const age = context.createRadialGradient(w / 2, h / 2, h * 0.3, w / 2, h / 2, h * 0.8);
  age.addColorStop(0, "rgba(160,120,40,0)");
  age.addColorStop(1, "rgba(160,120,40,0.18)");
  context.fillStyle = age;
  context.fillRect(0, 0, w, h);
  context.strokeStyle = "#cdd8ea";
  context.lineWidth = 2;
  for (let y = RULE_TOP; y < h; y += RULE) { context.beginPath(); context.moveTo(0, y); context.lineTo(w, y); context.stroke(); }
  context.strokeStyle = "#e5968a";
  context.lineWidth = 3;
  for (const x of [140, 149]) { context.beginPath(); context.moveTo(x, 0); context.lineTo(x, h); context.stroke(); }
  drawStain(context, stain[0], stain[1], 92);
}

/** A dried turmeric splash running off the page edge: uneven translucent blobs, a broken darker rim, two drops. */
function drawStain(context: CanvasRenderingContext2D, cx: number, cy: number, r: number) {
  context.fillStyle = "rgba(228,160,28,0.09)";
  for (const [dx, dy, s] of [[0, 0, 1], [0.3, -0.25, 0.7], [-0.35, 0.2, 0.62], [0.1, 0.45, 0.5], [-0.5, -0.3, 0.38], [-0.2, -0.55, 0.3], [0.55, 0.3, 0.42]]) {
    context.beginPath(); context.ellipse(cx + dx * r, cy + dy * r, s * r, s * r * 0.82, dx * 2, 0, Math.PI * 2); context.fill();
  }
  context.strokeStyle = "rgba(200,128,18,0.2)";
  context.lineWidth = 3;
  for (const [start, end, scale] of [[2.1, 3.3, 1.02], [3.5, 4.4, 0.96], [4.6, 5.3, 1.05]]) { context.beginPath(); context.ellipse(cx, cy, r * scale, r * scale * 0.84, 0.3, start, end); context.stroke(); }
  context.fillStyle = "rgba(220,145,24,0.22)";
  for (const [dx, dy, s] of [[-1.35, 0.7, 0.08], [-1.15, 1.0, 0.045]]) { context.beginPath(); context.arc(cx + dx * r, cy + dy * r, s * r, 0, Math.PI * 2); context.fill(); }
}

function drawStamp(context: CanvasRenderingContext2D, text: string, x: number, y: number) {
  context.save();
  context.font = `700 34px ${DISPLAY_FONT}`;
  const w = Math.min(context.measureText(text).width, 300) + 44;
  context.translate(x - w / 2, y);
  context.rotate(-0.07);
  context.strokeStyle = CHILI;
  context.lineWidth = 4;
  roundedRect(context, -w / 2, -38, w, 64, 12);
  context.stroke();
  fitText(context, [{ text, color: CHILI, weight: 700, display: true }], 0, 6, 34, 300, "center");
  context.restore();
}

/** One line of at most `max` px: wraps to a single line at a slightly smaller size, then fits. */
function drawLine(context: CanvasRenderingContext2D, text: string, x: number, y: number, size: number, max: number, color: string, weight = 500) {
  context.font = `${weight} ${Math.round(size * 0.86)}px ${BODY_FONT}`;
  const line = wrapText(context, text, max, 1)[0] ?? "";
  fitText(context, [{ text: line, color, weight }], x, y, size, max);
  return line.endsWith("…") && !text.endsWith("…");
}

export function drawCard(canvas: HTMLCanvasElement, card: RecipeCard, format: CardFormat, site: string) {
  const { width: w, height: h } = cardSizes[format];
  const layout = layouts[format];
  canvas.width = w;
  canvas.height = h;
  const context = canvas.getContext("2d");
  if (!context) throw new Error("এই ব্রাউজারে ছবি বানানো যাচ্ছে না।");
  drawPaper(context, w, h, layout.stain);
  const footerTop = drawFooterBand(context, format, RECIPE_ASK, site);
  const humanK = Math.floor((footerTop - 40 - onRule(0)) / RULE);
  const noteK = humanK - 1;
  let truncated = false;

  const meta = ["আমাদের রান্নাখাতা", card.servings && `${possessive(card.servings)} রান্না`].filter(Boolean).join(" · ");
  fitText(context, [{ text: meta, color: MUTED, weight: 600 }], left, layout.metaY, 26, card.learnedFrom ? 470 : width);
  const who = whoseWord(card.learnedFrom);
  if (who) drawStamp(context, `${who} রেসিপি`, right, layout.metaY - 4);

  // Dish name: up to two lines in the display face, two rules each.
  context.font = `800 ${layout.title}px ${DISPLAY_FONT}`;
  const titleLines = wrapText(context, card.title || "তোমার রান্নার নাম", width, 2);
  let k = layout.titleK;
  let titleWidth = 0;
  for (const [index, line] of titleLines.entries()) {
    if (index) k += 2;
    fitText(context, [{ text: line, color: card.title ? INK : MUTED, weight: 800, display: true }], left, onRule(k), layout.title, width);
    titleWidth = Math.max(titleWidth, Math.min(width, context.measureText(line).width));
  }
  // A turmeric underline, drawn by hand.
  const underline = onRule(k) + 20;
  context.strokeStyle = "#e0a12a";
  context.lineWidth = 6;
  context.lineCap = "round";
  context.beginPath();
  context.moveTo(left, underline);
  for (let x = left, up = true; x < left + Math.max(titleWidth, 160); x += 24, up = !up) context.quadraticCurveTo(x + 12, underline + (up ? -8 : 8), x + 24, underline);
  context.stroke();
  k += 2;

  if (card.memory) {
    context.font = `500 ${layout.story}px ${BODY_FONT}`;
    const lines = wrapText(context, `“${card.memory}”`, width, layout.storyLines);
    if (lines.at(-1)?.endsWith("…")) truncated = true;
    for (const line of lines) fitText(context, [{ text: line, color: BROWN, weight: 500 }], left, onRule(k++), layout.story, width);
  }

  if (card.ingredients.length) {
    k += 1;
    fitText(context, [{ text: "যা যা লাগবে", color: CHILI, weight: 700, display: true }, { text: `  ${bn(card.ingredients.length)}টা`, color: MUTED, weight: 600 }], left, onRule(k++), layout.item + 6, width);
    const fits = layout.rows * 2;
    const shown = card.ingredients.length > fits ? [...card.ingredients.slice(0, fits - 1), `+ আরও ${bn(card.ingredients.length - fits + 1)}টা`] : card.ingredients;
    if (shown.length < card.ingredients.length) truncated = true;
    const rows = Math.ceil(shown.length / 2);
    const columnWidth = (width - 36) / 2;
    shown.forEach((item, index) => {
      const x = left + Math.floor(index / rows) * (columnWidth + 36), y = onRule(k + index % rows);
      const extra = item.startsWith("+ ");
      if (!extra) { context.fillStyle = "#e0a12a"; context.beginPath(); context.arc(x + 7, y - layout.item * 0.32, 6, 0, Math.PI * 2); context.fill(); }
      if (drawLine(context, item, x + (extra ? 0 : 26), y, layout.item, columnWidth - 26, extra ? MORE : INK, extra ? 600 : 500)) truncated = true;
    });
    k += rows;
  }

  if (card.steps.length) {
    fitText(context, [{ text: "যেভাবে রাঁধবে", color: CHILI, weight: 700, display: true }], left, onRule(k++), layout.step + 6, width);
    for (const [index, step] of card.steps.entries()) {
      context.font = `500 ${layout.step}px ${BODY_FONT}`;
      const lines = wrapText(context, step, width - 52, layout.stepLines);
      // Keep the last free rule for the "rest is in the link" note whenever something is left out.
      const lastFree = index === card.steps.length - 1 && !truncated ? noteK : noteK - 1;
      if (k + lines.length - 1 > lastFree) { truncated = true; break; }
      if (lines.at(-1)?.endsWith("…")) truncated = true;
      fitText(context, [{ text: bn(index + 1), color: CHILI, weight: 700, display: true }], left, onRule(k), layout.step + 2, 44);
      for (const line of lines) fitText(context, [{ text: line, color: INK, weight: 500 }], left + 52, onRule(k++), layout.step, width - 52);
    }
  }

  if (truncated) fitText(context, [{ text: MORE_NOTE, color: MORE, weight: 700 }], left, onRule(Math.min(k, noteK)), layout.step - 2, width);
  fitText(context, [{ text: recipeLine(card), color: INK, weight: 700, display: true }], left, onRule(humanK), format === "story" ? 40 : 34, width);
}

export const cardBlob = (card: RecipeCard, format: CardFormat, site: string) => renderCard((canvas) => drawCard(canvas, card, format, site));

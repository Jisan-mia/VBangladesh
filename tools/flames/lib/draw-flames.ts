import { cardSizes, DISPLAY_FONT, drawFooterBand, fitText, renderCard, roundedRect, type CardFormat } from "../../../shared/card-canvas";
import { bn, cleanName, humanLine, outcome, outcomes, play, type Pair } from "./flames";

// খাতার শেষ পাতা: the cheap newsprint khata's back page, stitched at the spine, where two names were written in blue ballpoint,
// the shared letters slashed in red, F-L-A-M-E-S struck one by one and the last one ringed.
const PAPER = "#f3ead0";
const RULE = "rgba(70,120,150,0.28)";
const MARGIN = "rgba(214,90,80,0.55)";
const INK = "#2848a8";
const RED = "#cc2f2f";
const PENCIL = "#6f6a5c";

type Layout = { header: number; a: number; plus: number; b: number; left: number; flames: number; equation: number; result: number; line: number; rulesFrom: number };
const layouts: Record<CardFormat, Layout> = {
  feed: { header: 116, a: 300, plus: 384, b: 480, left: 584, flames: 748, equation: 920, result: 1050, line: 1150, rulesFrom: 150 },
  // Story text stays between storySafe.top (250) and the footer band (top 1660).
  story: { header: 340, a: 540, plus: 640, b: 750, left: 880, flames: 1080, equation: 1270, result: 1420, line: 1530, rulesFrom: 380 },
};

function drawPaper(context: CanvasRenderingContext2D, width: number, height: number, layout: Layout) {
  context.fillStyle = PAPER;
  context.fillRect(0, 0, width, height);
  // Newsprint flecks at fixed spots so every card of the same game is identical.
  context.fillStyle = "rgba(120,100,60,0.10)";
  for (let i = 0; i < 90; i++) { const x = (i * 397) % width, y = (i * 613) % height; context.fillRect(x, y, 3, 2); }
  context.strokeStyle = RULE;
  context.lineWidth = 2;
  for (let y = layout.rulesFrom; y < height; y += 76) { context.beginPath(); context.moveTo(0, y); context.lineTo(width, y); context.stroke(); }
  context.strokeStyle = MARGIN;
  context.lineWidth = 3;
  context.beginPath(); context.moveTo(112, 0); context.lineTo(112, height); context.stroke();
  // The spine: a shadow and the binding thread.
  const spine = context.createLinearGradient(0, 0, 60, 0);
  spine.addColorStop(0, "rgba(80,60,30,0.28)");
  spine.addColorStop(1, "rgba(80,60,30,0)");
  context.fillStyle = spine;
  context.fillRect(0, 0, 60, height);
  context.strokeStyle = "rgba(90,70,40,0.55)";
  context.lineWidth = 4;
  context.setLineDash([26, 34]);
  context.beginPath(); context.moveTo(34, 0); context.lineTo(34, height); context.stroke();
  context.setLineDash([]);
}

/** A quick ballpoint slash, slightly tilted, across a letter. */
function slash(context: CanvasRenderingContext2D, x1: number, x2: number, y: number, width = 7) {
  context.strokeStyle = RED;
  context.lineWidth = width;
  context.lineCap = "round";
  context.beginPath(); context.moveTo(x1, y + 7); context.lineTo(x2, y - 7); context.stroke();
}

/** One name as spaced letters, the struck ones slashed. */
function drawName(context: CanvasRenderingContext2D, units: string[], struck: Set<number>, baseline: number, size: number) {
  const font = (px: number) => `800 ${px}px ${DISPLAY_FONT}`;
  const maxWidth = 820;
  let px = size, widths: number[] = [], total = 0;
  for (; px > 30; px -= 2) {
    context.font = font(px);
    widths = units.map(unit => context.measureText(unit).width);
    total = widths.reduce((sum, w) => sum + w, 0) + px * 0.4 * (units.length - 1);
    if (total <= maxWidth) break;
  }
  context.font = font(px);
  context.textAlign = "left";
  let x = 600 - total / 2;
  units.forEach((unit, index) => {
    context.fillStyle = INK;
    context.fillText(unit, x, baseline);
    const reach = Math.max(widths[index] / 2 + 8, px * 0.32);
    if (struck.has(index)) slash(context, x + widths[index] / 2 - reach, x + widths[index] / 2 + reach, baseline - px * 0.32);
    x += widths[index] + px * 0.4;
  });
}

export function drawFlames(canvas: HTMLCanvasElement, pair: Pair, format: CardFormat, site: string) {
  const { width, height } = cardSizes[format];
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext("2d");
  if (!context) throw new Error("এই ব্রাউজারে ছবি বানানো যাচ্ছে না।");
  const layout = layouts[format];
  const game = play(pair);
  const won = outcome(game);

  drawPaper(context, width, height, layout);
  fitText(context, [{ text: "খাতার শেষ পাতা · ফ্লেমস", color: PENCIL, weight: 600 }], 150, layout.header, 34, 520);

  drawName(context, game.a, new Set(game.pairs.map(([i]) => i)), layout.a, 104);
  fitText(context, [{ text: "+", color: PENCIL, weight: 700, display: true }], 600, layout.plus, 64, 100, "center");
  drawName(context, game.b, new Set(game.pairs.map(([, j]) => j)), layout.b, 104);

  const leftText = game.left ? `বাকি রইল ${bn(game.left)}টা অক্ষর` : "সব অক্ষর কেটে গেল!";
  fitText(context, [{ text: leftText, color: PENCIL, weight: 700 }], 600, layout.left, 40, 760, "center");

  // F L A M E S across the page, struck in order, the last one ringed.
  outcomes.forEach((item, index) => {
    const cx = 225 + index * 150;
    fitText(context, [{ text: item.letter, color: INK, weight: 800, display: true }], cx, layout.flames, 112, 130, "center");
    const ringed = index === game.result;
    fitText(context, [{ text: item.label, color: ringed ? RED : PENCIL, weight: ringed ? 800 : 600 }], cx, layout.flames + 58, 26, 142, "center");
    const order = game.struck.indexOf(index);
    if (order >= 0) {
      slash(context, cx - 44, cx + 44, layout.flames - 38, 8);
      fitText(context, [{ text: bn(order + 1), color: RED, weight: 700 }], cx + 50, layout.flames - 78, 30, 40, "center");
    }
    if (ringed) {
      context.strokeStyle = RED;
      context.lineWidth = 6;
      for (const tilt of [-0.12, 0.08]) { context.beginPath(); context.ellipse(cx, layout.flames - 40, 66, 70, tilt, 0, Math.PI * 2); context.stroke(); }
    }
  });

  fitText(context, [{ text: `${cleanName(pair.a)} + ${cleanName(pair.b)} =`, color: INK, weight: 700, display: true }], 600, layout.equation, 64, 860, "center");
  fitText(context, [{ text: won.label, color: RED, weight: 800, display: true }], 600, layout.result, 132, 860, "center");
  // A ballpoint underline under the answer, as wide as the word (fitText leaves its font set).
  const half = Math.min(440, context.measureText(won.label).width / 2 + 40);
  context.strokeStyle = RED;
  context.lineWidth = 5;
  context.beginPath(); context.moveTo(600 - half, layout.result + 26); context.quadraticCurveTo(600, layout.result + 44, 600 + half, layout.result + 20); context.stroke();
  fitText(context, [{ text: humanLine(game), color: INK, weight: 600 }], 600, layout.line, 40, 860, "center");

  drawFooterBand(context, format, "তোমাদের কী আসে?", site, { band: "#1b2f73", ask: "#ffd166", site: "#ffffff" });
}

export function flamesBlob(pair: Pair, format: CardFormat, site: string) {
  return renderCard(canvas => drawFlames(canvas, pair, format, site));
}

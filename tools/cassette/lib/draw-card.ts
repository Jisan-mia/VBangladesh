import { DISPLAY_FONT, cardSizes, drawFooterBand, fitText, renderCard, roundedRect, type CardFormat } from "../../../shared/card-canvas";
import { SIDE, bn, credit, inlays, seasonLabel, shownTitle, songs, type Tape } from "./cassette";

export type CardContent = Tape & { line: string; match: string };

const SHELL = "#1d1c20";
const INK = "#1c3ca6";
const INK_SOFT = "#3f5bb5";
const RED_INK = "#b8261f";

type Layout = { cx: number; cy: number; tape: number; top: number; height: number; sideA: number; sideB: number; step: number; size: number; line: number; match: number };
const layouts: Record<CardFormat, Layout> = {
  feed: { cx: 560, cy: 236, tape: 640, top: 380, height: 850, sideA: 500, sideB: 834, step: 54, size: 38, line: 1170, match: 1214 },
  story: { cx: 560, cy: 520, tape: 700, top: 660, height: 975, sideA: 806, sideB: 1176, step: 60, size: 42, line: 1556, match: 1606 },
};

/** A শীতলপাটি under everything: a basket weave of cane strips. */
function drawMat(context: CanvasRenderingContext2D, width: number, height: number) {
  const cell = 40;
  for (let y = 0, row = 0; y < height; y += cell, row++) {
    for (let x = 0, col = 0; x < width; x += cell, col++) {
      const across = (row + col) % 2 === 0;
      context.fillStyle = across ? "#d9b57c" : "#cba46a";
      context.fillRect(x, y, cell, cell);
      context.strokeStyle = "rgba(110,70,25,.2)";
      context.lineWidth = 2;
      context.beginPath();
      for (const offset of [13, 27]) {
        if (across) { context.moveTo(x, y + offset); context.lineTo(x + cell, y + offset); }
        else { context.moveTo(x + offset, y); context.lineTo(x + offset, y + cell); }
      }
      context.stroke();
    }
  }
  // the red woven border every পাটি has along its edge
  for (const y of [18, height - 58]) {
    context.fillStyle = "#9c2f22";
    context.fillRect(0, y, width, 40);
    context.fillStyle = "#d9b57c";
    for (let x = 0; x < width; x += 40) { context.beginPath(); context.moveTo(x, y + 20); context.lineTo(x + 20, y + 6); context.lineTo(x + 40, y + 20); context.lineTo(x + 20, y + 34); context.closePath(); context.fill(); }
  }
}

/** Ballpoint: a faint second pass a hair off, so the line has the uneven pressure of a pen rather than print. */
function pen(context: CanvasRenderingContext2D, draw: () => void, x: number, y: number, seed: number) {
  context.save();
  context.translate(x, y);
  context.rotate((((seed * 7919) % 9) - 4) * 0.0014);
  context.globalAlpha = 0.3;
  context.translate(0.9, 0.7);
  draw();
  context.translate(-0.9, -0.7);
  context.globalAlpha = 1;
  draw();
  context.restore();
}

const hand = (size: number, weight = 500) => `${weight} ${size}px ${DISPLAY_FONT}`;

/** One track: "৩. গান — শিল্পী", the credit smaller; both shrink together until the line fits. */
function drawTrack(context: CanvasRenderingContext2D, index: number, song: number, x: number, y: number, size: number, maxWidth: number) {
  const { title } = songs[song];
  const head = `${bn((index % SIDE) + 1)}. ${title}`;
  const by = `  — ${credit(songs[song])}`;
  // A long credit gives way first (down to half the title's size), then both shrink together.
  let s = size, ratio = 0.66;
  const widths = () => { context.font = hand(s); const a = context.measureText(head).width; context.font = hand(s * ratio); return [a, context.measureText(by).width]; };
  let [a, b] = widths();
  while (a + b > maxWidth && ratio > 0.5) { ratio -= 0.02; [a, b] = widths(); }
  while (a + b > maxWidth && s > 18) { s -= 1; [a, b] = widths(); }
  pen(context, () => {
    context.textAlign = "left";
    context.font = hand(s); context.fillStyle = INK; context.fillText(head, 0, 0);
    context.font = hand(s * ratio); context.fillStyle = INK_SOFT; context.fillText(by, a, 0);
  }, x, y, index + 3);
}

/** "সাইড A" with the letter circled by hand, and a wobbly underline. */
function drawSide(context: CanvasRenderingContext2D, letter: "A" | "B", x: number, y: number, size: number) {
  pen(context, () => {
    context.textAlign = "left";
    context.font = hand(size, 700); context.fillStyle = INK;
    context.fillText("সাইড", 0, 0);
    const word = context.measureText("সাইড").width + size * 0.7;
    context.fillText(letter, word, 0);
    const letterWidth = context.measureText(letter).width;
    context.strokeStyle = INK; context.lineWidth = 3;
    context.beginPath();
    context.ellipse(word + letterWidth / 2, -size * 0.32, letterWidth * 0.5 + size * 0.36, size * 0.58, -0.12, 0.2, Math.PI * 2.05);
    context.stroke();
    context.beginPath();
    context.moveTo(0, size * 0.32);
    context.bezierCurveTo(word * 0.4, size * 0.4, word * 0.8, size * 0.24, word + letterWidth + size * 0.5, size * 0.34);
    context.stroke();
  }, x, y, letter === "A" ? 1 : 2);
}

function drawJCard(context: CanvasRenderingContext2D, card: CardContent, layout: Layout) {
  const inlay = inlays.find(item => item.id === card.color) ?? inlays[0];
  const x = 70, width = 940;
  context.save();
  context.translate(540, layout.top + layout.height / 2);
  context.rotate(0.012);
  context.translate(-540, -(layout.top + layout.height / 2));
  context.shadowColor = "rgba(60,35,10,.35)"; context.shadowBlur = 22; context.shadowOffsetY = 10;
  context.fillStyle = inlay.paper;
  context.fillRect(x, layout.top, width, layout.height);
  context.shadowColor = "transparent";
  // printed rules, the faint lines a blank inlay comes with
  context.strokeStyle = inlay.rule; context.lineWidth = 2; context.globalAlpha = 0.55;
  for (const [start, count] of [[layout.sideA + layout.step + 12, SIDE], [layout.sideB + layout.step + 12, SIDE]] as const) {
    for (let row = 0; row < count; row++) { const y = start + row * layout.step; context.beginPath(); context.moveTo(x + 50, y); context.lineTo(x + width - 50, y); context.stroke(); }
  }
  context.globalAlpha = 1;
  // the fold where the inlay bends round the case's spine
  context.strokeStyle = "rgba(0,0,0,.12)"; context.lineWidth = 3;
  context.beginPath(); context.moveTo(x, layout.top + 54); context.lineTo(x + width, layout.top + 54); context.stroke();

  const left = x + 60, maxWidth = width - 120;
  drawSide(context, "A", left, layout.sideA, layout.size + 4);
  card.slots.slice(0, SIDE).forEach((song, index) => drawTrack(context, index, song, left, layout.sideA + layout.step * (index + 1), layout.size, maxWidth));
  drawSide(context, "B", left, layout.sideB, layout.size + 4);
  card.slots.slice(SIDE).forEach((song, index) => drawTrack(context, SIDE + index, song, left, layout.sideB + layout.step * (index + 1), layout.size, maxWidth));
  pen(context, () => fitText(context, [{ text: card.line, color: RED_INK, weight: 600, display: true }], 0, 0, layout.size + 3, maxWidth), left, layout.line, 9);
  if (card.match) pen(context, () => fitText(context, [{ text: card.match, color: INK, weight: 600, display: true }], 0, 0, layout.size - 5, maxWidth), left, layout.match, 11);
  context.restore();
}

/** The hub you'd stick a pencil in to wind the tape back: a white ring with six teeth. */
function drawHub(context: CanvasRenderingContext2D, x: number, y: number, radius: number) {
  context.fillStyle = "#f4f1ea";
  context.beginPath(); context.arc(x, y, radius, 0, Math.PI * 2); context.fill();
  context.fillStyle = "#2a2520";
  context.beginPath(); context.arc(x, y, radius * 0.62, 0, Math.PI * 2); context.fill();
  context.fillStyle = "#f4f1ea";
  for (let tooth = 0; tooth < 6; tooth++) {
    const angle = (tooth * Math.PI) / 3;
    context.save(); context.translate(x, y); context.rotate(angle);
    context.fillRect(radius * 0.4, -radius * 0.1, radius * 0.24, radius * 0.2);
    context.restore();
  }
}

/** A plain wooden pencil, red and black stripes, pushed into the left hub. Drawn along +x from the hub. */
function drawPencil(context: CanvasRenderingContext2D, x: number, y: number, angle: number, length: number) {
  const half = 15;
  context.save();
  context.translate(x, y);
  context.rotate(angle);
  context.shadowColor = "rgba(0,0,0,.35)"; context.shadowBlur = 12; context.shadowOffsetY = 8;
  context.fillStyle = "#b8261f";
  context.fillRect(0, -half, length - 74, half * 2);
  context.shadowColor = "transparent";
  context.fillStyle = "#1a1a1a";
  context.fillRect(0, -half / 3, length - 74, (half * 2) / 3);
  context.fillStyle = "rgba(255,255,255,.18)";
  context.fillRect(0, -half, length - 74, 4);
  // sharpened end: shaved wood, then the lead
  context.fillStyle = "#e7c793";
  context.beginPath(); context.moveTo(length - 74, -half); context.quadraticCurveTo(length - 66, 0, length - 74, half); context.lineTo(length - 16, 4.5); context.lineTo(length - 16, -4.5); context.closePath(); context.fill();
  context.fillStyle = "#2b2b2b";
  context.beginPath(); context.moveTo(length - 16, -4.5); context.lineTo(length, 0); context.lineTo(length - 16, 4.5); context.closePath(); context.fill();
  // the end that went into the hub
  context.fillStyle = "rgba(0,0,0,.45)";
  context.beginPath(); context.ellipse(0, 0, 8, half, 0, 0, Math.PI * 2); context.fill();
  context.restore();
}

function drawCassette(context: CanvasRenderingContext2D, card: CardContent, layout: Layout) {
  const inlay = inlays.find(item => item.id === card.color) ?? inlays[0];
  const w = layout.tape, h = Math.round(w * 0.63);
  context.save();
  context.translate(layout.cx, layout.cy);
  context.rotate(-0.06);
  context.shadowColor = "rgba(40,20,5,.45)"; context.shadowBlur = 26; context.shadowOffsetY = 14;
  context.fillStyle = SHELL;
  roundedRect(context, -w / 2, -h / 2, w, h, 24);
  context.fill();
  context.shadowColor = "transparent";
  context.strokeStyle = "rgba(255,255,255,.09)"; context.lineWidth = 3;
  roundedRect(context, -w / 2 + 6, -h / 2 + 6, w - 12, h - 12, 20);
  context.stroke();
  for (const [sx, sy] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) {
    const x = sx * (w / 2 - 24), y = sy * (h / 2 - 24);
    context.fillStyle = "#57565c"; context.beginPath(); context.arc(x, y, 8, 0, Math.PI * 2); context.fill();
    context.strokeStyle = "#2a292e"; context.lineWidth = 2; context.beginPath(); context.moveTo(x - 5, y); context.lineTo(x + 5, y); context.stroke();
  }

  // the label you write the tape's name on
  const lx = -w / 2 + 34, ly = -h / 2 + 26, lw = w - 68, lh = h * 0.64;
  context.fillStyle = inlay.paper;
  roundedRect(context, lx, ly, lw, lh, 10);
  context.fill();
  context.fillStyle = "rgba(255,255,255,.55)";
  context.fillRect(lx + 12, ly + 14, lw - 24, lh * 0.36);
  context.strokeStyle = inlay.rule; context.lineWidth = 2;
  context.beginPath(); context.moveTo(lx + 92, ly + lh * 0.3); context.lineTo(lx + lw - 24, ly + lh * 0.3); context.stroke();
  fitText(context, [{ text: "A", color: SHELL, weight: 800, display: true }], lx + 26, ly + lh * 0.3, 64, 60);
  pen(context, () => fitText(context, [{ text: shownTitle(card), color: INK, weight: 600, display: true }], 0, 0, w * 0.075, lw - 130), lx + 96, ly + lh * 0.28, 5);
  const season = seasonLabel(card.when);
  if (season) pen(context, () => fitText(context, [{ text: season, color: INK_SOFT, weight: 500, display: true }], 0, 0, w * 0.04, 260, "right"), lx + lw - 26, ly + lh * 0.46, 6);

  // the window, with the tape wound mostly onto the left reel
  const wx = -w * 0.3, wy = ly + lh * 0.52, ww = w * 0.6, wh = lh * 0.4;
  const hubY = wy + wh / 2, hubX = w * 0.19, hub = wh * 0.3;
  context.save();
  roundedRect(context, wx, wy, ww, wh, 14);
  context.clip();
  context.fillStyle = "#3b322d";
  context.fillRect(wx, wy, ww, wh);
  context.fillStyle = "#5a3522";
  context.beginPath(); context.arc(-hubX, hubY, wh * 0.7, 0, Math.PI * 2); context.fill();
  context.beginPath(); context.arc(hubX, hubY, wh * 0.42, 0, Math.PI * 2); context.fill();
  context.fillStyle = "rgba(255,255,255,.1)";
  context.fillRect(wx, wy, ww, wh * 0.28);
  context.restore();
  context.strokeStyle = "rgba(0,0,0,.4)"; context.lineWidth = 3;
  roundedRect(context, wx, wy, ww, wh, 14);
  context.stroke();
  drawHub(context, -hubX, hubY, hub);
  drawHub(context, hubX, hubY, hub);

  // the trapezoid along the bottom edge, where the heads touch the tape
  context.fillStyle = "#29282d";
  context.beginPath(); context.moveTo(-w * 0.36, h / 2); context.lineTo(-w * 0.3, h / 2 - h * 0.18); context.lineTo(w * 0.3, h / 2 - h * 0.18); context.lineTo(w * 0.36, h / 2); context.closePath(); context.fill();
  context.fillStyle = "#0e0e10";
  for (const x of [-0.13, 0.13]) { context.beginPath(); context.arc(w * x, h / 2 - h * 0.09, 8, 0, Math.PI * 2); context.fill(); }
  for (const x of [-0.23, 0.23]) context.fillRect(w * x - 7, h / 2 - h * 0.12, 14, 14);

  drawPencil(context, -hubX, hubY, Math.PI + 0.42, w * 0.56);
  context.restore();
}

export function drawCard(canvas: HTMLCanvasElement, card: CardContent, format: CardFormat, site: string) {
  const { width, height } = cardSizes[format];
  const layout = layouts[format];
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext("2d");
  if (!context) throw new Error("এই ব্রাউজারে ছবি বানানো যাচ্ছে না।");
  drawMat(context, width, height);
  drawJCard(context, card, layout);
  drawCassette(context, card, layout);
  const inlay = inlays.find(item => item.id === card.color) ?? inlays[0];
  drawFooterBand(context, format, "তোমার ক্যাসেটে কোন গান?", site, { band: SHELL, ask: inlay.paper, site: "#ffffff" });
}

export const cardBlob = (card: CardContent, format: CardFormat, site: string) => renderCard(canvas => drawCard(canvas, card, format, site));

import { cardSizes, drawFooterBand, fitText, renderCard, roundedRect, type CardFormat } from "../../../shared/card-canvas";
import { bn, humanLine, modeOf, triesText, type Shared } from "./game";

const NIGHT = "#0c1a2b";
const BOARD = "#d8ae72";
const BOARD_EDGE = "#a5783f";
const MARKER = "#17110b";
const RED = "#c42a1c";
const BLUE = "#1f3f8a";
const crowdColors = ["#1b3147", "#233d57", "#2b4966", "#1f3a4f", "#30506b"];

const layouts = {
  feed: { placardTop: 104, placardHeight: 660, line: 846, crowdTop: 890, kicker: 0 },
  story: { placardTop: 380, placardHeight: 720, line: 1236, crowdTop: 1300, kicker: 310 },
} as const;

function drawFloodlights(context: CanvasRenderingContext2D, width: number, y: number) {
  for (const x of [84, width - 84]) {
    const glow = context.createRadialGradient(x, y, 10, x, y, 420);
    glow.addColorStop(0, "#fff6d6aa");
    glow.addColorStop(0.25, "#ffe9a62e");
    glow.addColorStop(1, "#ffe9a600");
    context.fillStyle = glow;
    context.fillRect(x - 420, y - 420, 840, 840);
    context.fillStyle = "#3a4a5c";
    roundedRect(context, x - 70, y - 40, 140, 80, 8);
    context.fill();
    context.fillStyle = "#fffbe8";
    for (let row = 0; row < 3; row++) for (let col = 0; col < 4; col++) { roundedRect(context, x - 60 + col * 31, y - 32 + row * 24, 24, 17, 4); context.fill(); }
  }
}

function drawCrowd(context: CanvasRenderingContext2D, width: number, top: number, bottom: number) {
  for (let row = 0, y = top + 30; y < bottom + 40; row++, y += 62) {
    const radius = 22 + row * 2;
    for (let index = 0, x = (row % 2) * 34 - 10; x < width + 40; index++, x += 68) {
      const color = crowdColors[(index * 7 + row * 3) % crowdColors.length];
      context.fillStyle = color;
      context.beginPath(); context.ellipse(x, y + radius * 1.9, radius * 1.45, radius * 1.1, 0, 0, Math.PI * 2); context.fill();
      context.beginPath(); context.arc(x, y, radius, 0, Math.PI * 2); context.fill();
      // A few small placards and raised hands make it read as a crowd, not a pattern.
      if ((index * 5 + row * 11) % 17 === 0 && y < bottom - 60) {
        context.save(); context.translate(x, y - 40); context.rotate(((index % 3) - 1) * 0.12);
        context.fillStyle = "#6b4a26"; context.fillRect(-3, 0, 6, 40);
        context.fillStyle = (index + row) % 2 ? "#d8ae72" : "#ece6d6"; context.fillRect(-30, -34, 60, 38);
        context.strokeStyle = (index + row) % 2 ? RED : BLUE; context.lineWidth = 5; context.beginPath(); context.moveTo(-18, -16); context.quadraticCurveTo(0, -24, 18, -14); context.stroke();
        context.restore();
      }
      else if ((index * 3 + row * 7) % 11 === 0) { context.strokeStyle = color; context.lineWidth = 12; context.lineCap = "round"; context.beginPath(); context.moveTo(x + radius, y + 10); context.lineTo(x + radius + 14, y - 46); context.stroke(); }
    }
  }
}

function drawTape(context: CanvasRenderingContext2D, x: number, y: number, angle: number) {
  context.save();
  context.translate(x, y);
  context.rotate(angle);
  context.fillStyle = "#f4ead0cc";
  context.fillRect(-60, -18, 120, 36);
  context.restore();
}

function drawPlacard(context: CanvasRenderingContext2D, shared: Shared, centreX: number, top: number, height: number) {
  const width = 820, left = -width / 2;
  const mode = modeOf(shared.mode);
  context.save();
  context.translate(centreX, top + height / 2);
  context.rotate(-0.035);
  const y0 = -height / 2;
  context.shadowColor = "#00000080"; context.shadowBlur = 40; context.shadowOffsetY = 18;
  context.fillStyle = BOARD;
  context.fillRect(left, y0, width, height);
  context.shadowColor = "transparent";
  // Corrugation shows faintly through the cardboard.
  context.fillStyle = "#7a52200f";
  for (let x = left + 10; x < width / 2; x += 18) context.fillRect(x, y0, 6, height);
  context.strokeStyle = BOARD_EDGE; context.lineWidth = 6;
  context.strokeRect(left + 3, y0 + 3, width - 6, height - 6);
  drawTape(context, left + 30, y0 + 10, -0.6);
  drawTape(context, -left - 30, y0 + 10, 0.6);

  const inner = width - 120;
  fitText(context, [{ text: mode.ask, color: "#4a3418", weight: 600 }], 0, y0 + 96, 44, inner, "center");
  fitText(context, [{ text: mode.placard[0], color: MARKER, weight: 800, display: true }], 0, y0 + 230, 118, inner, "center");
  const bigSize = fitText(context, [{ text: mode.placard[1], color: RED, weight: 800, display: true }], 0, y0 + 380, 150, inner, "center");
  // Marker underline under the shout.
  context.strokeStyle = RED; context.lineWidth = 12; context.lineCap = "round";
  const reach = Math.min(inner / 2, bigSize * 2.4);
  context.beginPath(); context.moveTo(-reach, y0 + 412); context.quadraticCurveTo(0, y0 + 432, reach, y0 + 404); context.stroke();

  let signY = y0 + height - 70;
  if (shared.mode === "over12") {
    const size = 64, gap = 20, total = shared.runs.length * size + (shared.runs.length - 1) * gap;
    shared.runs.forEach((run, index) => {
      const x = -total / 2 + index * (size + gap) + size / 2, y = y0 + 500;
      context.strokeStyle = run === 6 || run === 4 ? RED : MARKER; context.lineWidth = 5;
      context.beginPath(); context.arc(x, y, size / 2, 0, Math.PI * 2); context.stroke();
      fitText(context, [{ text: bn(run as number), color: run === 6 || run === 4 ? RED : MARKER, weight: 800, display: true }], x, y + 16, 44, size - 12, "center");
    });
    signY = y0 + height - 46;
  }
  const sign = `— ${shared.name ? `${shared.name}, ` : ""}${triesText(shared.tries)}`;
  fitText(context, [{ text: sign, color: BLUE, weight: 700, display: true }], 0, signY, 58, inner, "center");
  context.restore();
}

export function drawCard(canvas: HTMLCanvasElement, shared: Shared, format: CardFormat, site: string) {
  const { width, height } = cardSizes[format];
  const layout = layouts[format];
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext("2d");
  if (!context) throw new Error("এই ব্রাউজারে ছবি বানানো যাচ্ছে না।");
  const sky = context.createLinearGradient(0, 0, 0, height);
  sky.addColorStop(0, NIGHT); sky.addColorStop(1, "#16304a");
  context.fillStyle = sky;
  context.fillRect(0, 0, width, height);
  drawFloodlights(context, width, format === "story" ? 150 : 60);
  if (layout.kicker) fitText(context, [{ text: "শেষ বলে ছয় · একটুখানি", color: "#ffcf4a", weight: 700 }], width / 2, layout.kicker, 34, 800, "center");

  const footerTop = format === "story" ? height - 260 : height - 96;
  // Without the over's run circles the placard is shorter, so the signature sits close under the shout.
  const placardHeight = layout.placardHeight - (shared.mode === "last5" ? 90 : 0);
  const placardTop = layout.placardTop + (layout.placardHeight - placardHeight) / 2;
  context.fillStyle = "#8a5a2b";
  context.fillRect(width / 2 - 18, placardTop + placardHeight - 20, 36, footerTop - placardTop - placardHeight);
  drawCrowd(context, width, layout.crowdTop, footerTop);
  drawPlacard(context, shared, width / 2, placardTop, placardHeight);

  context.shadowColor = "#000000"; context.shadowBlur = 18;
  fitText(context, [{ text: humanLine(shared.tries), color: "#ffffff", weight: 700, display: true }], width / 2, layout.line, 46, 960, "center");
  context.shadowColor = "transparent"; context.shadowBlur = 0;
  drawFooterBand(context, format, "তুমি কয় চেষ্টায় পারবে?", site, { band: "#08121d", ask: "#ffcf4a", site: "#ffffff" });
}

export const cardBlob = (shared: Shared, format: CardFormat, site: string) => renderCard(canvas => drawCard(canvas, shared, format, site));

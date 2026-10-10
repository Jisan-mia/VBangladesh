import { cardSizes, drawFooterBand, fitText, renderCard, wrapText, DISPLAY_FONT, type CardFormat } from "../../../shared/card-canvas";
import { stallSvg } from "./art";
import { bn, humanLine, marks, rank, scoreOf, setById, PER_SET, type Shared } from "./pitha";

// A winter dawn at the pitha stall: misty blue sky warming to clay, soil underfoot, bamboo ডালা for every answer.
const INK = "#4a2a14";
const CLAY = "#b4532a";
const MUTED = "#7a5a44";
const SOIL = "#8a5a3a";

export type CardData = Shared & { friend?: Shared | null };

let stall: HTMLImageElement | null = null;
/** The stall drawing is the same SVG the page shows; it has to be decoded before a synchronous draw. */
export function loadStall() {
  if (stall?.complete) return Promise.resolve();
  const image = new Image();
  image.src = "data:image/svg+xml;charset=utf-8," + encodeURIComponent(stallSvg("bhapa", true).replace("<svg ", '<svg width="960" height="438" '));
  return image.decode().then(() => { stall = image; }).catch(() => undefined);
}

const layouts = {
  feed: { title: 132, stall: { x: 480, y: 200, w: 600 }, nameLabel: 262, name: 330, score: 478, scoreSize: 128, rank: 552, colW: 380, rowLabel: 664, rows: [784, 914], perRow: 5, rx: 70, line: 1048, lineGap: 60, lineSize: 46, match: 1178 },
  story: { title: 330, stall: { x: 0, y: 380, w: 1080 }, nameLabel: 930, name: 994, score: 1112, scoreSize: 112, rank: 1180, colW: 912, rowLabel: 1244, rows: [1326, 1428], perRow: 5, rx: 62, line: 1522, lineGap: 54, lineSize: 42, match: 1630 },
} as const;

/** One bamboo ডালা: full of pitha when the answer was right, empty when not, dashed while still to play. */
function basket(context: CanvasRenderingContext2D, cx: number, cy: number, rx: number, state: boolean | null) {
  const ry = rx * 0.36;
  context.lineWidth = 3;
  context.strokeStyle = INK;
  if (state === null) {
    context.setLineDash([8, 8]);
    context.beginPath(); context.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2); context.strokeStyle = "#a88a70"; context.stroke();
    context.setLineDash([]);
    return;
  }
  context.fillStyle = "#4a2a1426";
  context.beginPath(); context.ellipse(cx, cy + 5, rx + 3, ry + 2, 0, 0, Math.PI * 2); context.fill();
  context.fillStyle = "#d7b169";
  context.beginPath(); context.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2); context.fill(); context.stroke();
  context.fillStyle = "#e4c47f";
  context.beginPath(); context.ellipse(cx, cy, rx * 0.84, ry * 0.76, 0, 0, Math.PI * 2); context.fill();
  context.strokeStyle = "#c49a50"; context.lineWidth = 1.6;
  for (let i = -2; i <= 2; i++) { const x = cx + i * rx * 0.3; context.beginPath(); context.moveTo(x - 6, cy - ry * 0.6); context.lineTo(x + 6, cy + ry * 0.6); context.stroke(); }
  if (!state) return;
  const r = rx * 0.34;
  for (const [dx, dy] of [[-0.36, -0.05], [0.36, -0.05], [0, -0.38]] as const) {
    const x = cx + dx * rx, y = cy + dy * rx;
    context.fillStyle = "#fbf8f0"; context.strokeStyle = INK; context.lineWidth = 2.5;
    context.beginPath(); context.moveTo(x - r, y); context.quadraticCurveTo(x - r, y - r * 0.95, x, y - r); context.quadraticCurveTo(x + r, y - r * 0.95, x + r, y);
    context.quadraticCurveTo(x, y + r * 0.35, x - r, y); context.closePath(); context.fill(); context.stroke();
    context.fillStyle = "#8b4513";
    context.beginPath(); context.ellipse(x, y - r * 0.58, r * 0.36, r * 0.16, 0, 0, Math.PI * 2); context.fill();
  }
}

export function drawCard(canvas: HTMLCanvasElement, data: CardData, format: CardFormat, site: string) {
  const { width, height } = cardSizes[format];
  const L = layouts[format];
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext("2d");
  if (!context) throw new Error("এই ব্রাউজারে ছবি বানানো যাচ্ছে না।");
  const footerTop = format === "story" ? height - 260 : height - 96;
  const right = width - 84;
  const hits = marks(data.set, data.answers);
  const score = scoreOf(data.set, data.answers);
  const done = data.answers.length === PER_SET;

  const sky = context.createLinearGradient(0, 0, 0, footerTop);
  sky.addColorStop(0, "#d3dde6");
  sky.addColorStop(0.55, "#f2e1cd");
  sky.addColorStop(1, "#ecc9a3");
  context.fillStyle = sky;
  context.fillRect(0, 0, width, footerTop);
  context.fillStyle = SOIL;
  context.fillRect(0, footerTop - 26, width, 26);

  fitText(context, [{ text: "পিঠা চেনো?", color: INK, weight: 800, display: true }], 84, L.title, 76, 520);
  fitText(context, [{ text: `শীতের পিঠা কুইজ · ${setById(data.set).label}`, color: MUTED, weight: 600 }], format === "story" ? 84 : right, L.title + (format === "story" ? 58 : -8), 28, 420, format === "story" ? "left" : "right");

  if (stall) context.drawImage(stall, L.stall.x, L.stall.y, L.stall.w, L.stall.w * 146 / 320);

  fitText(context, [{ text: "নাম", color: MUTED, weight: 600 }], 84, L.nameLabel, 28, 200);
  fitText(context, [{ text: data.name || "আমার পিঠা-পরীক্ষা", color: INK, weight: 800, display: true }], 84, L.name, 58, L.colW);
  fitText(context, [{ text: done ? `১০-এ ${bn(score)}` : `${bn(data.answers.length)}/১০ চলছে`, color: INK, weight: 800, display: true }], 84, L.score, L.scoreSize, L.colW);
  fitText(context, [{ text: done ? rank(score) : "বাকিগুলো খেলা হয়নি", color: CLAY, weight: 800, display: true }], 84, L.rank, 52, L.colW);

  fitText(context, [{ text: "১০টা পিঠা · ভরা ডালা মানে চিনেছি", color: MUTED, weight: 600 }], 84, L.rowLabel, 28, width - 168);
  const cell = (width - 168) / L.perRow;
  hits.forEach((hit, index) => {
    const row = Math.floor(index / L.perRow), col = index % L.perRow;
    basket(context, 84 + cell * (col + 0.5), L.rows[row], L.rx, hit);
  });

  context.font = `700 ${L.lineSize}px ${DISPLAY_FONT}`;
  const lines = done ? wrapText(context, humanLine(data.set, data.answers), width - 168, 2) : ["বাকিগুলো চিনলেই কার্ড পুরো হবে।"];
  lines.forEach((line, index) => fitText(context, [{ text: line, color: INK, weight: 700, display: true }], 84, L.line + index * L.lineGap, L.lineSize, width - 168));

  const friend = data.friend && data.friend.set === data.set ? data.friend : null;
  if (friend && done) {
    const friendScore = scoreOf(friend.set, friend.answers);
    fitText(context, [{ text: `${friend.name || "বন্ধু"} চিনেছিল ${bn(friendScore)}টা`, color: CLAY, weight: 700 }, { text: score > friendScore ? " · আমি এগিয়ে!" : score === friendScore ? " · সমানে সমান!" : " · এবার হার মানলাম", color: INK, weight: 600 }], 84, L.match, 34, width - 168);
  }

  drawFooterBand(context, format, "তুমি কয়টা চিনবে?", site, { band: "#3b2414", ask: "#ffd38a", site: "#ffffff" });
}

export const cardBlob = async (data: CardData, format: CardFormat, site: string) => {
  await loadStall();
  return renderCard(canvas => drawCard(canvas, data, format, site));
};

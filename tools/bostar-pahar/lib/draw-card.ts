// The result card: the ghat, the truck with this run's pile (the same sack kinds as the seed gave), and a truck-art signboard with the count.
import { cardSizes, drawFooterBand, fitText, renderCard, roundedRect, wrapText, type CardFormat } from "../../../shared/card-canvas";
import { makeRng } from "../../../shared/game-core";
import { LOAD_TOP, PAL, SACK_H, WORKERS, drawBank, drawCloud, drawLaunch, drawLoad, drawSack, drawTruckBack, drawTruckFront, drawWorker, type Pose } from "./art";
import { GHATS, starsOf, swingOf } from "./game";
import { bn, ghatLabel, humanLine, type Card } from "./result";

const BAND = { band: PAL.accentDeep, ask: "#ffd166", site: "#ffffff" };
const layouts = {
  feed: { jib: 24, ground: 1222, bank: 890, ghat: 1010, board: 90, title: 166, name: 228, count: 440, unit: 530, line: 606, chips: 760 },
  story: { jib: 214, ground: 1624, bank: 1290, ghat: 1410, board: 300, title: 376, name: 438, count: 650, unit: 740, line: 816, chips: 970 },
} as const;
/** Past this many sacks the pile is drawn as this many: thinner sacks would only be stripes. */
const MAX_DRAWN = 90;
const TRUCK_U = 120, TRUCK_X = 300, BOARD_X = 590, BOARD_W = 460;

function flower(c: CanvasRenderingContext2D, x: number, y: number, r: number) {
  c.fillStyle = PAL.pink;
  c.beginPath();
  for (let index = 0; index < 5; index++) { const a = (index / 5) * Math.PI * 2; c.moveTo(x + Math.cos(a) * r * 1.6, y + Math.sin(a) * r); c.arc(x + Math.cos(a) * r, y + Math.sin(a) * r, r * 0.6, 0, Math.PI * 2); }
  c.fill();
  c.fillStyle = PAL.board; c.beginPath(); c.arc(x, y, r * 0.5, 0, Math.PI * 2); c.fill();
}

function chip(c: CanvasRenderingContext2D, text: string, y: number, color: string) {
  const width = BOARD_W - 80, x = BOARD_X + 40;
  c.fillStyle = "#ffffff"; roundedRect(c, x, y, width, 66, 33); c.fill();
  c.strokeStyle = color; c.lineWidth = 3; c.stroke();
  c.fillStyle = color; c.beginPath(); c.arc(x + 38, y + 33, 13, 0, Math.PI * 2); c.fill();
  fitText(c, [{ text, color: PAL.ink, weight: 700, display: true }], x + 64, y + 45, 34, width - 84);
}

export function drawCard(canvas: HTMLCanvasElement, card: Card, format: CardFormat, site: string) {
  const { width, height } = cardSizes[format];
  const L = layouts[format];
  canvas.width = width; canvas.height = height;
  const c = canvas.getContext("2d");
  if (!c) throw new Error("এই ব্রাউজারে ছবি বানানো যাচ্ছে না।");
  const footerTop = format === "story" ? height - 260 : height - 96;

  const sky = c.createLinearGradient(0, 0, 0, L.bank);
  sky.addColorStop(0, "#86c3e2"); sky.addColorStop(0.72, "#d3eaf3"); sky.addColorStop(1, "#ffdcb4");
  c.fillStyle = sky; c.fillRect(0, 0, width, L.bank);
  c.fillStyle = "rgba(255,243,214,0.6)"; c.beginPath(); c.arc(560, L.bank - 90, 100, 0, Math.PI * 2); c.fill();
  c.fillStyle = PAL.sun; c.beginPath(); c.arc(560, L.bank - 90, 60, 0, Math.PI * 2); c.fill();
  drawCloud(c, 330, L.board + 330, 300);
  drawCloud(c, -60, L.board + 620, 260);
  drawBank(c, width, L.bank - 26, 62);
  c.fillStyle = PAL.water; c.fillRect(0, L.bank, width, L.ghat - L.bank);
  c.fillStyle = PAL.waterLight;
  for (let row = 0; row < 5; row++) for (let x = (row * 61) % 120 - 40; x < width; x += 150) c.fillRect(x, L.bank + 14 + row * 22, 60, 4);
  drawLaunch(c, 20, L.ghat - 34, 420, "এমভি একটুখানি");
  c.fillStyle = PAL.ghatLight; c.fillRect(0, L.ghat, width, 10);
  c.fillStyle = PAL.ghatDark; c.fillRect(0, L.ghat + 10, width, 10);
  c.fillStyle = PAL.ghat; c.fillRect(0, L.ghat + 20, width, footerTop - L.ghat - 20);

  const u = TRUCK_U, floor = L.ground - 0.95 * u, bedTop = floor - LOAD_TOP * u;
  c.fillStyle = "rgba(40,30,20,0.25)"; c.beginPath(); c.ellipse(TRUCK_X + 0.5 * u, L.ground, 2.6 * u, 0.12 * u, 0, 0, Math.PI * 2); c.fill();
  drawTruckBack(c, TRUCK_X, floor, u);
  drawLoad(c, TRUCK_X, floor, u);

  // The pile: the run's own sack kinds (they come from the seed), stacked with a gentle hand-made lean.
  const drawn = Math.min(MAX_DRAWN, card.sacks + 1), roomTop = L.jib + 50 + (drawn <= 16 ? 220 : 60);
  const sh = Math.min(u * SACK_H * 0.95, (bedTop - roomTop) / drawn), sw = sh / SACK_H;
  const rng = makeRng((card.seed ^ 0x5bd1e995) >>> 0), offset = GHATS[card.level - 1].offset;
  let lean = 0;
  for (let index = 0; index < drawn; index++) {
    if (index > 0) lean = Math.max(-0.45, Math.min(0.45, lean + (rng() - 0.5) * 0.3));
    drawSack(c, TRUCK_X + lean * sw, bedTop - (index + 0.5) * sh, sw, sh, index === 0 ? 0 : swingOf(card.seed, index - 1 + offset).kind);
  }
  drawTruckFront(c, TRUCK_X, floor, u, "আবার দেখা হবে");

  // The crane: a jib across the top and, when there is room, the next sack already on the hook.
  c.fillStyle = PAL.crane; c.strokeStyle = PAL.craneDark; c.lineWidth = 3;
  c.fillRect(0, L.jib, width, 10); c.fillRect(0, L.jib + 36, width, 10);
  c.beginPath(); for (let x = 0; x < width; x += 40) { c.moveTo(x, L.jib + 10); c.lineTo(x + 20, L.jib + 36); c.lineTo(x + 40, L.jib + 10); } c.strokeStyle = PAL.crane; c.lineWidth = 6; c.stroke();
  const hookX = TRUCK_X + lean * sw + 0.6 * sw, towerTop = bedTop - drawn * sh;
  const room = towerTop - (L.jib + 46);
  const hang = Math.max(1, Math.min(sw, 150)), hangH = hang * SACK_H;
  const hookY = room > hangH * 3 ? towerTop - hangH * 2.4 - 40 : L.jib + 46 + Math.max(24, room * 0.4);
  c.strokeStyle = PAL.rope; c.lineWidth = 5;
  c.beginPath(); c.moveTo(hookX, L.jib + 46); c.lineTo(hookX, hookY); c.stroke();
  if (room > hangH * 3) {
    c.lineWidth = 3;
    c.beginPath(); c.moveTo(hookX - hang * 0.34, hookY + 26 + hangH * 0.08); c.lineTo(hookX, hookY); c.lineTo(hookX + hang * 0.34, hookY + 26 + hangH * 0.08); c.stroke();
    drawSack(c, hookX, hookY + 26 + hangH * 0.6, hang, hangH, swingOf(card.seed, card.sacks + offset).kind);
  }
  c.fillStyle = PAL.steel; c.fillRect(hookX - 9, hookY - 12, 18, 14);
  c.strokeStyle = PAL.steel; c.lineWidth = 5; c.beginPath(); c.arc(hookX, hookY + 8, 9, -Math.PI / 2, Math.PI * 0.9); c.stroke();

  const happy = card.sacks >= 8;
  const poseA: Pose = happy ? "clap" : card.sacks > 0 ? "count" : "laugh", poseB: Pose = happy ? "cheer" : card.sacks > 0 ? "point" : "laugh";
  drawWorker(c, 790, L.ground + 18, 236, WORKERS[1], poseA, 0.15, -1);
  drawWorker(c, 940, L.ground + 26, 246, WORKERS[0], poseB, 0.2, -1);

  // A truck-art signboard with the count.
  const boardTop = L.board, boardBottom = L.chips + (card.perfect > 0 ? 176 : 20);
  c.fillStyle = PAL.red; roundedRect(c, BOARD_X - 12, boardTop - 12, BOARD_W + 24, boardBottom - boardTop + 24, 34); c.fill();
  c.fillStyle = "#fff4cf"; roundedRect(c, BOARD_X, boardTop, BOARD_W, boardBottom - boardTop, 24); c.fill();
  c.strokeStyle = PAL.green; c.lineWidth = 4; roundedRect(c, BOARD_X + 14, boardTop + 14, BOARD_W - 28, boardBottom - boardTop - 28, 16); c.stroke();
  for (const [fx, fy] of [[BOARD_X + 34, boardTop + 34], [BOARD_X + BOARD_W - 34, boardTop + 34], [BOARD_X + 34, boardBottom - 34], [BOARD_X + BOARD_W - 34, boardBottom - 34]]) flower(c, fx, fy, 11);
  const mid = BOARD_X + BOARD_W / 2, inner = BOARD_W - 96;
  fitText(c, [{ text: "বস্তার পাহাড়", color: PAL.accent, weight: 800, display: true }], mid, L.title, 62, inner, "center");
  // The name (if any), the ghat and its stars share one line under the title.
  const earned = starsOf(card.sacks, card.level);
  fitText(c, [
    { text: `${card.name ? `${card.name} · ` : ""}${ghatLabel(card.level)}`, color: PAL.ink, weight: 700, display: true },
    ...(earned ? [{ text: "  ", color: PAL.ink, weight: 700 }, ...[0, 1, 2].map(star => ({ text: "★", color: star < earned ? "#e39b00" : "#c9b98f", weight: 700 }))] : []),
  ], mid, L.name, 40, inner, "center");
  fitText(c, [{ text: bn(card.sacks), color: PAL.ink, weight: 800, display: true }, { text: "টা", color: PAL.red, weight: 800, display: true }], mid, L.count, 210, inner, "center");
  fitText(c, [{ text: "বস্তা", color: PAL.red, weight: 800, display: true }], mid, L.unit, 84, inner, "center");
  c.font = `600 40px "Bangla"`;
  wrapText(c, humanLine(card.sacks), inner, 3).forEach((line, index) => fitText(c, [{ text: line, color: PAL.ink, weight: 600 }], mid, L.line + index * 52, 40, inner, "center"));
  if (card.perfect > 0) {
    chip(c, `ঠিক মাঝে ${bn(card.perfect)} বার`, L.chips, PAL.accent);
    chip(c, `টানা ${bn(card.streak)} বার ঠিক মাঝে`, L.chips + 82, PAL.red);
  }

  drawFooterBand(c, format, "তুমি কয়টা তুলবে?", site, BAND);
}

export const cardBlob = (card: Card, format: CardFormat, site: string) => renderCard(canvas => drawCard(canvas, card, format, site));

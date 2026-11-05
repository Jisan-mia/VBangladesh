import { cardSizes, drawFooterBand, fitText, renderCard, wrapText, BODY_FONT, type CardFormat } from "../../../shared/card-canvas";
import { C, LOOKS, drawBell, drawFerry, drawKid, drawMango, drawNouka, drawPana, drawSteps, drawTree, drawVela } from "./art";
import { FINALES, WORLDS, worldOf } from "./levels";
import { bn, detailLine, humanLine, secs, PLACES, type Shared } from "./result";
import { makeRiver, starsOf } from "./river";

const INK = "#22302c", ACCENT = "#1f6f78", DEEP = "#164f56", PAPER = "#fbf3e2", CELL = 120;

function at(context: CanvasRenderingContext2D, x: number, y: number, paint: () => void, scale = CELL) {
  context.save(); context.translate(x, y); context.scale(scale, scale); paint(); context.restore();
}

/** The river from the far ghat down to the near bank: the kid on a ভেলা mid-river, a mango riding a নৌকা, কচুরিপানা, and a ferry from river 13 on. */
function paintRiver(context: CanvasRenderingContext2D, top: number, water: number, level: number) {
  const width = 1080, bottom = top + (water + 2) * CELL, look = LOOKS[WORLDS[worldOf(level)].look], flow = look.water;
  context.fillStyle = look.grass; context.fillRect(0, top, width, CELL); context.fillRect(0, bottom - CELL, width, CELL);
  context.fillStyle = flow; context.fillRect(0, top + CELL, width, water * CELL);
  for (let row = 0; row < water; row++) {
    context.fillStyle = row % 2 ? "rgba(0,30,40,0.07)" : "rgba(255,255,255,0.07)";
    context.fillRect(0, top + (row + 1) * CELL, width, CELL);
  }
  context.fillStyle = look.mud; context.fillRect(0, top + CELL * 0.84, width, CELL * 0.16); context.fillRect(0, bottom - CELL, width, CELL * 0.16);
  at(context, 3 * CELL, top + CELL * 0.52, () => drawSteps(context, 3, 0.5, true));
  at(context, 3 * CELL, bottom - CELL - 2, () => drawSteps(context, 3, 0.5, false));
  at(context, 6.75 * CELL, top + CELL * 0.55, () => drawBell(context, 0.25));
  at(context, 8.5 * CELL, top + CELL * 0.6, () => drawTree(context, 0.8));
  at(context, 8.3 * CELL, bottom - CELL * 0.1, () => drawTree(context, 0.7));
  context.strokeStyle = C.ripple; context.lineWidth = 5; context.lineCap = "round";
  context.beginPath();
  for (let row = 0; row < water; row++) for (let k = 0; k < 4; k++) {
    const x = (k * 2.4 + row * 0.9 + 0.3) * CELL, y = top + (row + 1.25 + (k % 3) * 0.25) * CELL;
    context.moveTo(x, y); context.lineTo(x + CELL * 0.35, y);
  }
  context.stroke();
  const lane = (row: number) => top + (row + 1) * CELL;
  at(context, 0.6 * CELL, lane(0), () => drawPana(context, 2));
  at(context, 5 * CELL, lane(0), () => drawNouka(context, 3));
  at(context, 7.3 * CELL, lane(0) + CELL * 0.1, () => { context.translate(0, 0.25); drawMango(context); }, CELL * 1.3);
  at(context, 2.6 * CELL, lane(1), () => drawVela(context, 2));
  at(context, 6.6 * CELL, lane(1), () => drawPana(context, 2));
  if (water > 2) {
    if (level >= 13) {
      context.strokeStyle = "rgba(255,255,255,0.6)"; context.lineWidth = 7;
      context.beginPath(); context.moveTo(4.6 * CELL, lane(2) + CELL * 0.25); context.lineTo(2.2 * CELL, lane(2) - CELL * 0.2); context.moveTo(4.6 * CELL, lane(2) + CELL * 0.75); context.lineTo(2.2 * CELL, lane(2) + CELL * 1.2); context.stroke();
      at(context, 4.6 * CELL, lane(2), () => drawFerry(context, 5, 1));
    } else {
      at(context, 0.4 * CELL, lane(2), () => drawVela(context, 2));
      at(context, 4.4 * CELL, lane(2), () => drawNouka(context, 3));
    }
  }
  if (water > 3) { at(context, 1.5 * CELL, lane(3), () => drawNouka(context, 3)); at(context, 6.2 * CELL, lane(3), () => drawPana(context, 2)); }
  // The kid, mid-hop off the raft, with a dotted arc to where they'll land.
  context.strokeStyle = "rgba(255,255,255,0.85)"; context.lineWidth = 6; context.setLineDash([4, 14]);
  context.beginPath(); context.moveTo(3.6 * CELL, lane(1) + CELL * 0.75); context.quadraticCurveTo(4.6 * CELL, lane(0) - CELL * 0.1, 5.8 * CELL, lane(0) + CELL * 0.7); context.stroke();
  context.setLineDash([]);
  at(context, 3.6 * CELL, lane(1) + CELL * 0.82, () => drawKid(context), CELL * 1.35);
}

/** The result card: the river and its far ghat, the kid hopping, the time big, the stars, the mangoes and a kind line. */
export function drawCard(canvas: HTMLCanvasElement, shared: Shared, format: CardFormat, site: string) {
  const { width, height } = cardSizes[format];
  canvas.width = width; canvas.height = height;
  const context = canvas.getContext("2d");
  if (!context) throw new Error("এই ব্রাউজারে ছবি বানানো যাচ্ছে না।");
  const story = format === "story";
  context.fillStyle = PAPER; context.fillRect(0, 0, width, height);
  const head = story ? 300 : 70, riverTop = story ? 760 : 490, water = story ? 4 : 3;
  const river = makeRiver(shared.level), stars = starsOf(river, shared.tenths / 10, shared.mangoes);

  fitText(context, [
    { text: "নদী পার", color: ACCENT, weight: 800, display: true },
    ...(shared.name ? [{ text: ` · ${shared.name}`, color: INK, weight: 700, display: true }] : []),
    { text: shared.level in FINALES ? ` · ${FINALES[shared.level]}` : ` · নদী ${bn(shared.level)}`, color: INK, weight: 700, display: true },
  ], 80, head + 50, 58, width - 160);
  fitText(context, [{ text: `ওপারে ${PLACES[shared.level - 1]}`, color: "#8a5a2b", weight: 700 }], 80, head + 120, 40, width - 160);
  fitText(context, [{ text: secs(shared.tenths), color: INK, weight: 800, display: true }, { text: " সেকেন্ড", color: INK, weight: 700, display: true }], 80, head + 290, 170, width - 160);
  fitText(context, [0, 1, 2].map(star => ({ text: "★", color: star < stars ? "#e39b00" : "#d8c9a8", weight: 700 })), width - 80, head + 120, 74, 300, "right");
  fitText(context, [{ text: detailLine(shared), color: DEEP, weight: 700 }], 80, head + 388, 44, width - 160);

  paintRiver(context, riverTop, water, shared.level);

  const footer = story ? height - 260 : height - 96, riverEnd = riverTop + (water + 2) * CELL;
  const panelY = riverEnd + (story ? 30 : 20), panelH = footer - panelY - (story ? 40 : 22);
  context.fillStyle = "#fffaf0"; context.beginPath(); context.roundRect(60, panelY, width - 120, panelH, 26); context.fill();
  context.strokeStyle = "#ead9b8"; context.lineWidth = 3; context.stroke();
  context.font = `700 46px ${BODY_FONT}`;
  const lines = wrapText(context, humanLine(shared), 880, 2);
  lines.forEach((text, index) => fitText(context, [{ text, color: INK, weight: 700 }], width / 2, panelY + panelH / 2 + 16 + (index - (lines.length - 1) / 2) * 58, 46, 900, "center"));
  drawFooterBand(context, format, "তুমি কত সেকেন্ডে পার হবে?", site, { band: DEEP, ask: "#ffd166", site: "#fffaf0" });
}

export const cardBlob = (shared: Shared, format: CardFormat, site: string) => renderCard(canvas => drawCard(canvas, shared, format, site));

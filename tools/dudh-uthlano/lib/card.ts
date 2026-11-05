// The share card: a tiled kitchen wall with the average, a big ডেকচি steaming on the gas, and the round's pots on the counter with
// their marks. Drawn client-side so Bangla shaping comes from the browser.
import { cardSizes, drawFooterBand, fitText, renderCard, wrapText, BODY_FONT, type CardFormat } from "../../../shared/card-canvas";
import { drawPotBack, drawPotFront, SHAPES } from "./art";
import { bn, potsPlain, spillCountOf, whereText, type Shared } from "./challenge";
import { drawFlame, drawMilk, drawSpill, drawSteam } from "./draw.hot";
import { humanLine } from "./lines";
import { levelDef, starsOf, worldOf } from "./levels";
import { oldPots } from "./legacy";
import { makePots, type Vessel } from "./pot";

const INK = "#2a211c", MUTED = "#6b5b4e", ACCENT = "#b6462b", DEEP = "#7d2c19", CABINET = "#f7f0e3";
const WALLS = [["#dcefe8", "#c4e0d6", "#4f5c57"], ["#ecc79a", "#d9ab78", "#a8703f"], ["#33426a", "#2a3857", "#1d242a"]] as const;

/** Draws one of the game's pots at card size: (x, y) is where the pot's centre line meets its rim. */
function pot(context: CanvasRenderingContext2D, vessel: Vessel, x: number, y: number, scale: number, level: number, spilled: boolean, stove: boolean) {
  context.save();
  context.translate(x - 168 * scale, y - SHAPES[vessel].rimY * scale);
  context.scale(scale, scale);
  if (stove) {
    context.fillStyle = "#24292d"; context.beginPath(); context.roundRect(76, 204, 204, 22, 6); context.fill();
    context.fillStyle = "#121517"; context.beginPath(); context.ellipse(168, 216, 52, 9, 0, 0, Math.PI * 2); context.fill();
  }
  drawPotBack(context, vessel);
  drawMilk(context, vessel, spilled ? 1 : level, 0, false);
  drawPotFront(context, vessel);
  if (spilled) drawSpill(context, vessel, 1);
  if (stove) { drawFlame(context, "gas", 0, 1, false); drawSteam(context, vessel, 0, 0.9, false); }
  context.restore();
}

function star(context: CanvasRenderingContext2D, x: number, y: number, r: number, on: boolean) {
  context.beginPath();
  for (let i = 0; i < 10; i++) { const a = -Math.PI / 2 + i * Math.PI / 5, d = i % 2 ? r * 0.45 : r; context.lineTo(x + Math.cos(a) * d, y + Math.sin(a) * d); }
  context.closePath();
  context.fillStyle = on ? "#f2a900" : "#2a211c1f"; context.fill();
  context.lineWidth = 4; context.strokeStyle = on ? "#8a5a00" : "#2a211c2e"; context.stroke();
}

export function drawCard(canvas: HTMLCanvasElement, shared: Shared, format: CardFormat, site: string) {
  const { width, height } = cardSizes[format];
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext("2d");
  if (!context) throw new Error("এই ব্রাউজারে ছবি বানানো যাচ্ছে না।");
  const story = format === "story", { level, old } = shared;
  // Feed positions; the story stretches them into its taller safe area (290 to ~1610, clear of storySafe).
  const y = (feedY: number) => story ? 290 + (feedY - 100) * 1.22 : feedY;
  const counter = y(770);
  const [wall, tile, top] = WALLS[old ? 0 : worldOf(level).scene], night = !old && worldOf(level).scene === 2;
  const ink = night ? "#f4efe2" : INK, muted = night ? "#b8c0d6" : MUTED, accent = night ? "#ffd166" : ACCENT, deep = night ? "#ffe3a0" : DEEP;

  context.fillStyle = wall;
  context.fillRect(0, 0, width, counter);
  context.strokeStyle = tile;
  context.lineWidth = 3;
  for (let row = 0, rowTop = 0; rowTop < counter; row++, rowTop += 90) {
    context.beginPath(); context.moveTo(0, rowTop); context.lineTo(width, rowTop); context.stroke();
    for (let x = (row % 2) * 45; x < width; x += 90) { context.beginPath(); context.moveTo(x, rowTop); context.lineTo(x, Math.min(counter, rowTop + 90)); context.stroke(); }
  }
  context.fillStyle = top; context.fillRect(0, counter, width, 30);
  context.fillStyle = CABINET; context.fillRect(0, counter + 30, width, height - counter - 30);

  const spills = spillCountOf(shared.spills), count = shared.scores.length, stars = starsOf(shared.total, shared.mode, shared.slow);
  fitText(context, [{ text: "দুধ উথলানোর আগে", color: deep, weight: 800, display: true }], 84, y(150), 62, 520);
  if (shared.name) fitText(context, [{ text: shared.name, color: ink, weight: 700, display: true }], 86, y(228), 54, 470);
  fitText(context, [{ text: `${bn(shared.total)}%`, color: accent, weight: 800, display: true }], 78, y(480), 230, 440);
  fitText(context, [{ text: `${potsPlain(count)} পাতিলের গড়, কিনারার কত কাছে`, color: muted, weight: 600 }], 86, y(540), 32, 420);
  fitText(context, [{ text: whereText(shared), color: ink, weight: 700 }], 86, y(shared.name ? 290 : 228), 34, 470);
  for (let i = 0; i < 3; i++) star(context, 880 + (i - 1) * 72, y(112), 30, i < stars);
  fitText(context, [{ text: spills ? `${bn(spills)}টা উথলে গেছে` : "একটাও উথলায়নি!", color: spills ? deep : ink, weight: 700 }], 86, y(600), 40, 420);

  const pots = old ? oldPots(shared.seed, level) : makePots(shared.seed, level);
  pot(context, "dekchi", 800, y(330), story ? 2.1 : 2.2, spills === count ? 1 : shared.total / 100, spills === count, true);

  // Five pots fill the counter at 210 apart; more pots stand closer and a little smaller.
  const gap = Math.min(210, 840 / Math.max(1, count - 1)), small = (story ? 0.86 : 0.78) * Math.min(1, gap / 210 + 0.12), left = width / 2 - gap * (count - 1) / 2;
  pots.forEach((each, index) => {
    const x = left + index * gap;
    pot(context, each.vessel, x, counter - (215 - SHAPES[each.vessel].rimY) * small, small, shared.scores[index] / 100, shared.spills[index], false);
    const boss = !old && levelDef(level).boss !== null && index === count - 1;
    fitText(context, [{ text: shared.spills[index] ? "উথলেছে" : `${bn(shared.scores[index])}%${boss ? " ×২" : ""}`, color: shared.spills[index] ? accent : ink, weight: 800, display: true }], x, y(880), shared.spills[index] ? 38 : 50, gap - 16, "center");
  });

  context.font = `600 44px ${BODY_FONT}`;
  const line = humanLine(shared.scores, shared.spills, shared.total);
  wrapText(context, line, 900, 2).forEach((text, index) => {
    fitText(context, [{ text, color: INK, weight: 600 }], width / 2, y(990) + index * (story ? 66 : 60), 44, 920, "center");
  });
  fitText(context, [{ text: `নিজের ফোনে খেলা${shared.slow ? ", ধীরে খেলায়" : ""} · লিংকে একই ${potsPlain(count)}টা পাতিল`, color: MUTED, weight: 500 }], width / 2, y(1160), 28, 900, "center");
  drawFooterBand(context, format, "তুমি কত পারবে?", site, { band: INK, ask: "#ffd166", site: "#ffffff" });
}

export const cardBlob = (shared: Shared, format: CardFormat, site: string) => renderCard(canvas => drawCard(canvas, shared, format, site));

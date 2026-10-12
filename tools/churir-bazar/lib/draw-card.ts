import { cardSizes, drawFooterBand, fitText, renderCard, type CardFormat } from "../../../shared/card-canvas";
import { cleanName } from "../../../shared/game-core";
import { drawRod, GOLD, VELVET } from "./art";
import { RAINBOW, SPARKLE } from "./board";
import { levelOf, levelStars } from "./game";
import { bn, goalsShort, STAR_LINES, worldOf, WORLDS, type Shared } from "./link";

export type CardData = Pick<Shared, "level" | "score" | "count" | "name">;

/** The card: a velvet stall with a rod of bangles for each colour in the level, the goal colours stacked tallest. */
export function drawCard(canvas: HTMLCanvasElement, data: CardData, format: CardFormat, site: string) {
  const { width, height } = cardSizes[format];
  canvas.width = width;
  canvas.height = height;
  const c = canvas.getContext("2d");
  if (!c) throw new Error("এই ব্রাউজারে ছবি বানানো যাচ্ছে না।");
  const story = format === "story", cx = width / 2, y0 = story ? 290 : 0;
  const spec = levelOf(data.level), world = worldOf(data.level), [light, dark] = VELVET[world];
  const velvet = c.createRadialGradient(cx, height * 0.35, 80, cx, height * 0.4, height * 0.8);
  velvet.addColorStop(0, light); velvet.addColorStop(1, dark);
  c.fillStyle = velvet;
  c.fillRect(0, 0, width, height);

  const name = cleanName(data.name), stars = levelStars(data.level, data.score);
  fitText(c, [{ text: `চুড়ির বাজার · ${WORLDS[world]} · লেভেল ${bn(data.level)}`, color: GOLD, weight: 700, display: true }], cx, y0 + 96, 40, 940, "center");
  fitText(c, [
    { text: name ? `${name} ` : "", color: "#fff6e6", weight: 700, display: true },
    { text: `${bn(data.score)} পয়েন্ট`, color: GOLD, weight: 800, display: true },
  ], cx, y0 + 200, 92, 960, "center");
  fitText(c, [0, 1, 2].map(index => ({ text: "★", color: index < stars ? "#ffc533" : "rgba(255,255,255,0.22)", weight: 700 })), cx, y0 + 282, 64, 600, "center");

  // the stall: a shelf with a rod per colour; the level's goals stand tallest
  const goals = new Map(spec.goals.map(([target, count]) => [target, count]));
  const pieces: number[] = Array.from({ length: spec.colours }, (_, colour) => colour);
  if (goals.has(SPARKLE)) pieces.push(SPARKLE + 3);
  if (goals.has(RAINBOW)) pieces.push(RAINBOW);
  const shelf = y0 + (story ? 1060 : 900), step = Math.min(200, 960 / pieces.length), rodWidth = step * 0.8;
  c.fillStyle = "rgba(0,0,0,0.25)";
  c.fillRect(60, shelf + 22, width - 120, 26);
  c.fillStyle = "#6b4220";
  c.fillRect(60, shelf + 6, width - 120, 22);
  pieces.forEach((piece, index) => {
    const goal = piece >= RAINBOW ? goals.get(RAINBOW) : piece >= SPARKLE ? goals.get(SPARKLE) : goals.get(piece);
    const x = cx + (index - (pieces.length - 1) / 2) * step;
    drawRod(c, piece, x, shelf, rodWidth, goal ? (piece >= SPARKLE ? 11 + goal * 2 : 14 + Math.min(6, Math.round(goal / 4))) : 7 + ((index * 5) % 4));
  });

  const below = shelf + 120;
  fitText(c, [{ text: `${goalsShort(data.level)} · ${bn(data.count)} চালে পার`, color: "#fff6e6", weight: 700 }], cx, below, 46, 940, "center");
  fitText(c, [{ text: STAR_LINES[stars], color: "#f6dcae", weight: 600 }], cx, below + 72, 42, 940, "center");
  drawFooterBand(c, format, "তুমি কত পয়েন্ট পাবে?", site, { band: "#1c0910", ask: GOLD, site: "#ffffff" });
}

export const cardBlob = (data: CardData, format: CardFormat, site: string) => renderCard(canvas => drawCard(canvas, data, format, site));

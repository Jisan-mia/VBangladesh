import { cardSizes, drawFooterBand, fitText, renderCard, type CardFormat } from "../../../shared/card-canvas";
import { cleanName } from "../../../shared/game-core";
import { drawRod, GOLD, VELVET } from "./art";
import { DUST_GOAL, FREE_GOAL, RAINBOW, SPARKLE } from "./board";
import type { Shared } from "./challenge";
import { finaleName, worldOf, WORLDS } from "./ladder";
import { specOf } from "./rules";
import { bn, goalsShort, STAR_LINES } from "./words";

export type CardData = Pick<Shared, "v" | "level" | "mode" | "gift" | "score" | "count" | "stars" | "name">;

/** The card: a velvet stall with a rod of bangles for each colour in the level, the goal colours stacked tallest. A finale gets a stamp. */
export function drawCard(canvas: HTMLCanvasElement, data: CardData, format: CardFormat, site: string) {
  const { width, height } = cardSizes[format];
  canvas.width = width;
  canvas.height = height;
  const c = canvas.getContext("2d");
  if (!c) throw new Error("এই ব্রাউজারে ছবি বানানো যাচ্ছে না।");
  const story = format === "story", cx = width / 2, y0 = story ? 290 : 0;
  const spec = specOf(data), world = worldOf(data.level), [light, dark] = VELVET[world], finale = data.v === 2 ? finaleName(data.level) : "";
  const velvet = c.createRadialGradient(cx, height * 0.35, 80, cx, height * 0.4, height * 0.8);
  velvet.addColorStop(0, light); velvet.addColorStop(1, dark);
  c.fillStyle = velvet;
  c.fillRect(0, 0, width, height);

  const name = cleanName(data.name), stars = data.stars;
  fitText(c, [{ text: `চুড়ির বাজার · ${WORLDS[world].name} · লেভেল ${bn(data.level)}`, color: GOLD, weight: 700, display: true }], cx, y0 + 96, 40, 940, "center");
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
  fitText(c, [{ text: `${goalsShort(data)} · ${bn(data.count)} চালে পার`, color: "#fff6e6", weight: 700 }], cx, below, 46, 940, "center");
  const notes = [goals.has(FREE_GOAL) ? "তালা খুলে" : "", goals.has(DUST_GOAL) ? "ধুলো মুছে" : ""].filter(Boolean);
  fitText(c, [{ text: notes.length ? `${notes.join(", ")} ${STAR_LINES[stars]}` : STAR_LINES[stars], color: "#f6dcae", weight: 600 }], cx, below + 72, 40, 940, "center");
  if (finale) {
    // a red wax stamp for a finale
    c.save();
    c.translate(width - 190, y0 + 400); c.rotate(-0.22);
    c.strokeStyle = "#e5534b"; c.lineWidth = 7; c.beginPath(); c.arc(0, 0, 104, 0, Math.PI * 2); c.stroke();
    c.lineWidth = 3; c.beginPath(); c.arc(0, 0, 92, 0, Math.PI * 2); c.stroke();
    c.restore();
    fitText(c, [{ text: finale, color: "#e5534b", weight: 800, display: true }], width - 190, y0 + 412, 34, 170, "center");
  }
  drawFooterBand(c, format, "তুমি কত পয়েন্ট পাবে?", site, { band: "#1c0910", ask: GOLD, site: "#ffffff" });
}

export const cardBlob = (data: CardData, format: CardFormat, site: string) => renderCard(canvas => drawCard(canvas, data, format, site));
export const cardKicker = (data: CardData) => `লেভেল ${bn(data.level)}${data.v === 2 && finaleName(data.level) ? ` · ${finaleName(data.level)}` : ""}`;

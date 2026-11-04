// The share card: the evening's own sky over Old Dhaka, your kite high on its string, the kites you cut tumbling away,
// the count, the পাড়া and the stars. Shared card helpers draw the footer, so every card on the site reads the same.
import { cardSizes, drawFooterBand, fitText, renderCard, type CardFormat, type Segment } from "../../../shared/card-canvas";
import { drawKite } from "../../ghuri/lib/draw-card";
import { HAND } from "./kite";
import { levelDef, WORLDS } from "./levels";
import { bn, humanLine, LOOKS, seconds, type Look } from "./link";
import { paintRoofs, paintSky, PALETTES } from "./sky";

export type Card = { cuts: number; name: string; look: Look; level: number; stars: number; tenths: number; won: boolean; lost: number };

/** Where the cut kites tumble on a feed card: x, y, size, spin. The first ones sit nearest the hook. */
const FALLEN: ReadonlyArray<readonly [number, number, number, number]> = [
  [470, 420, 62, -0.9], [250, 520, 56, 2.2], [110, 390, 48, 1.4], [560, 640, 50, -2.6], [360, 700, 44, 0.5], [120, 660, 42, 2.9],
];

export function drawCard(canvas: HTMLCanvasElement, card: Card, format: CardFormat, site: string) {
  const { width, height } = cardSizes[format];
  canvas.width = width;
  canvas.height = height;
  const c = canvas.getContext("2d");
  if (!c) throw new Error("এই ব্রাউজারে ছবি বানানো যাচ্ছে না।");
  const def = levelDef(card.level), world = def.world, p = PALETTES[world];
  const story = format === "story";
  const footer = story ? height - 260 : height - 96;
  // Feed positions; the story stretches them into its taller sky, clear of storySafe.
  const y = (feedY: number) => story ? 330 + (feedY - 150) * 1.4 : feedY;
  // The world's rooftops at 3×, standing on the footer band.
  const k = 3, top = footer - 500 * k;
  paintSky(c, width, height, top + 430 * k, world, k);
  c.save(); c.translate(0, top); c.scale(k, k); paintRoofs(c, world, 0, 0); c.restore();

  const shown = Math.min(card.cuts, FALLEN.length);
  for (let i = 0; i < shown; i++) {
    const [fx, fy, r, spin] = FALLEN[i];
    const look = LOOKS[(i + 1 + LOOKS.findIndex(item => item.color === card.look.color)) % LOOKS.length];
    const cy = y(fy);
    c.save();
    c.translate(fx, cy); c.rotate(spin);
    c.beginPath(); c.moveTo(0, r * 0.4); c.quadraticCurveTo(r * 0.5, r * 1.4, -r * 0.1, r * 2.3);
    c.strokeStyle = p.rivalHalo; c.lineWidth = 5.2; c.stroke();
    c.strokeStyle = p.rival; c.lineWidth = 3; c.stroke();
    c.restore();
    drawKite(c, { ...look, text: "" }, fx, cy, r, spin);
  }

  // Your kite, high and taut, its string down to your hand on the roof.
  const kx = 790, ky = y(500), kr = story ? 150 : 128;
  const hx = HAND.x * k, hy = top + HAND.y * k;
  c.beginPath(); c.moveTo(hx, hy); c.quadraticCurveTo((hx + kx) / 2 + 40, (hy + ky) / 2 + 60, kx, ky + kr * 0.2);
  c.strokeStyle = p.youHalo; c.lineWidth = 6.2; c.stroke();
  c.strokeStyle = p.you; c.lineWidth = 4; c.stroke();
  drawKite(c, { ...card.look, text: "" }, kx, ky, kr, 0.18);

  const light = world === 0 ? p.ink : p.cream, accent = world === 0 ? "#c4501b" : p.window;
  c.shadowColor = world === 0 ? "rgba(255,255,255,.6)" : "rgba(20,8,30,.55)"; c.shadowBlur = 16; c.shadowOffsetY = 4;
  fitText(c, [{ text: card.won ? "ভো-কাট্টা!" : "সন্ধ্যা নামল!", color: light, weight: 800, display: true }], 84, y(170), 132, 900);
  const count: Segment[] = [];
  if (card.name) count.push({ text: `${card.name} `, color: light, weight: 700, display: true });
  count.push({ text: `${bn(card.cuts)}টা`, color: accent, weight: 800, display: true }, { text: card.name ? " ঘুড়ি কাটল" : " ঘুড়ি কাটলাম", color: light, weight: 700, display: true });
  fitText(c, count, 86, y(268), 70, 900);
  fitText(c, [
    { text: `${def.name} · ${WORLDS[world].name}`, color: light, weight: 700, display: true },
    ...(card.stars ? [{ text: "  ", color: light }, ...[0, 1, 2].map(star => ({ text: "★", color: star < card.stars ? accent : world === 0 ? "#24203a44" : "#ffffff66", weight: 700 }))] : []),
  ], 88, y(340), 46, 900);
  if (card.won) fitText(c, [{ text: `${seconds(card.tenths)} সেকেন্ডে`, color: light, weight: 600 }], 88, y(398), 38, 900);
  c.shadowColor = "transparent";

  // The line sits on the near roof, which is dark on every evening.
  fitText(c, [{ text: humanLine(card.won, card.lost, card.cuts), color: p.cream, weight: 600 }], width / 2, footer - 40, story ? 44 : 40, 960, "center");
  drawFooterBand(c, format, "তুমি কয়টা কাটবে?", site, { band: p.ink, ask: p.window, site: "#ffffff" });
}

export const cardBlob = (card: Card, format: CardFormat, site: string) => renderCard(canvas => drawCard(canvas, card, format, site));

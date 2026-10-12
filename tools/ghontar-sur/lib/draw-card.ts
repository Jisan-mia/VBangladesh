import { cardSizes, drawFooterBand, fitText, renderCard, type CardFormat } from "../../../shared/card-canvas";
import { cleanName } from "../../../shared/game-core";
import { levelsCleared } from "./game";
import { bn, cardLine, dayLabel, isDailySeed, levelLabel, type Shared } from "./link";

export const palette = { wall: "#f4e5c8", wallLine: "#ead6b2", ink: "#3a2316", muted: "#7a5640", clay: "#b9653b", clayDark: "#7e3d1f", clayLight: "#d98a5c", bamboo: "#c9a24a", bambooDark: "#8f6d22", star: "#f2a900", starOff: "#dccbaa", band: "#3a2316", ask: "#ffd27a" };

/** Each pot's own colour (a painted band, and the whole pot when it plays): teal, marigold, magenta, indigo. */
export const POT_COLORS = ["#13917f", "#e3940a", "#c8326b", "#3f56c8"] as const;

/** A কলসি in a 100×116 box, shared with the live pots: the body, two painted bands and a shine. */
export const POT = {
  body: "M36 4H64Q68 4 68 8Q68 12 64 12H61Q61 20 70 25Q96 38 96 68Q96 112 50 112Q4 112 4 68Q4 38 30 25Q39 20 39 12H36Q32 12 32 8Q32 4 36 4Z",
  bands: "M9 50Q50 62 91 50M5 84Q50 98 95 84",
  shine: "M21 46Q14 60 19 78",
};
/** Pot sizes left to right: the biggest pot sounds lowest. */
export const POT_SCALE = [1, 0.9, 0.8, 0.7] as const;

let paths: Record<keyof typeof POT, Path2D> | null = null;

/** Draws pot `index` with its bottom centre at (cx, bottom), `width` wide. */
function drawPot(c: CanvasRenderingContext2D, index: number, cx: number, bottom: number, width: number) {
  paths ??= { body: new Path2D(POT.body), bands: new Path2D(POT.bands), shine: new Path2D(POT.shine) };
  const scale = width / 100;
  c.save();
  c.translate(cx - width / 2, bottom - 112 * scale);
  c.scale(scale, scale);
  c.fillStyle = palette.clay; c.fill(paths.body);
  c.save(); c.clip(paths.body);
  c.fillStyle = palette.clayDark; c.globalAlpha = 0.35; c.beginPath(); c.ellipse(64, 80, 40, 38, 0, 0, Math.PI * 2); c.fill();
  c.restore();
  c.strokeStyle = POT_COLORS[index]; c.lineWidth = 6; c.lineCap = "round"; c.stroke(paths.bands);
  c.strokeStyle = "rgba(255,255,255,0.35)"; c.lineWidth = 4; c.stroke(paths.shine);
  c.strokeStyle = palette.clayDark; c.lineWidth = 2.5; c.stroke(paths.body);
  c.fillStyle = "#fff"; c.beginPath(); c.arc(50, 68, 15, 0, Math.PI * 2); c.fill();
  c.strokeStyle = POT_COLORS[index]; c.lineWidth = 3.5; c.stroke();
  c.fillStyle = POT_COLORS[index]; c.font = `800 22px "Display", "Bangla"`; c.textAlign = "center"; c.textBaseline = "middle";
  c.fillText(bn(index + 1), 50, 69);
  c.restore();
}

/** Paper flags (নিশান) strung across the top, as at a village fair. */
function drawBunting(c: CanvasRenderingContext2D, width: number, y: number) {
  c.strokeStyle = palette.bambooDark; c.lineWidth = 3;
  c.beginPath(); c.moveTo(0, y); c.quadraticCurveTo(width / 2, y + 60, width, y); c.stroke();
  for (let flag = 0; flag < 14; flag++) {
    const x = 40 + flag * 75, t = x / width, sag = y + 120 * t * (1 - t);
    c.fillStyle = POT_COLORS[flag % 4];
    c.beginPath(); c.moveTo(x - 24, sag); c.lineTo(x + 24, sag); c.lineTo(x, sag + 52); c.closePath(); c.fill();
  }
}

export function drawCard(canvas: HTMLCanvasElement, shared: Shared, stars: number, format: CardFormat, site: string) {
  const { width, height } = cardSizes[format];
  canvas.width = width; canvas.height = height;
  const c = canvas.getContext("2d");
  if (!c) throw new Error("এই ব্রাউজারে ছবি বানানো যাচ্ছে না।");
  const story = format === "story", cx = width / 2, top = story ? 250 : 0;
  c.fillStyle = palette.wall; c.fillRect(0, 0, width, height);
  c.fillStyle = palette.wallLine;
  for (let at = 40; at < height; at += 70) c.fillRect(0, at, width, 2);
  drawBunting(c, width, top + 18);

  const name = cleanName(shared.name), cleared = levelsCleared(shared.score);
  const where = isDailySeed(shared.seed) ? `রোজের সুর · ${dayLabel(shared.seed)}` : cleared ? levelLabel(cleared) + " পার" : "চার কলসির সুর";
  fitText(c, [{ text: `ঘণ্টার সুর · ${where}`, color: palette.muted, weight: 700, display: true }], cx, top + 190, 40, 940, "center");
  fitText(c, [
    ...(name ? [{ text: `${name}: `, color: palette.clayDark, weight: 800, display: true }] : []),
    { text: `${bn(shared.score)}টা সুর`, color: palette.ink, weight: 800, display: true },
  ], cx, top + 310, 120, 960, "center");
  fitText(c, [{ text: "মনে রেখে বাজালাম", color: palette.ink, weight: 700, display: true }], cx, top + 384, 52, 900, "center");
  if (stars > 0) {
    c.font = `700 64px sans-serif`; c.textAlign = "center"; c.textBaseline = "alphabetic";
    for (let index = 0; index < 3; index++) { c.fillStyle = index < stars ? palette.star : palette.starOff; c.fillText("★", cx + (index - 1) * 78, top + 470); }
  }

  // Four pots on a bamboo shelf.
  const shelf = top + (story ? 1060 : 900) - (stars > 0 ? 0 : 70), span = 960, slot = span / 4;
  for (let index = 0; index < 4; index++) drawPot(c, index, cx - span / 2 + slot * (index + 0.5), shelf, slot * 0.95 * POT_SCALE[index]);
  for (const [y, h] of [[shelf, 22], [shelf + 30, 16]]) {
    c.fillStyle = palette.bamboo; c.fillRect(70, y, width - 140, h);
    c.fillStyle = palette.bambooDark; for (let knot = 150; knot < width - 100; knot += 190) c.fillRect(knot, y, 6, h);
  }
  fitText(c, [{ text: cardLine(shared.score), color: palette.ink, weight: 700 }], cx, shelf + 150, story ? 50 : 46, 940, "center");
  drawFooterBand(c, format, "তুমি কয়টা সুর মনে রাখতে পারবে?", site, { band: palette.band, ask: palette.ask, site: "#ffffff" });
}

export const cardBlob = (shared: Shared, stars: number, format: CardFormat, site: string) => renderCard(canvas => drawCard(canvas, shared, stars, format, site));

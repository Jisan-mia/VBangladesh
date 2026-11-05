import { cardSizes, drawFooterBand, fitText, renderCard, type CardFormat } from "../../../shared/card-canvas";
import { cleanName } from "../../../shared/game-core";
import { BELL, BELL_COLORS, BELL_SCALE, palette } from "./art";
import { finaleName } from "./levels";
import { bn, cardLine, dayLabel, isDailySeed, levelLabel, type Shared } from "./links";

export type CardData = Shared & { stars: number; bells: number };

let paths: Record<"body" | "band" | "shine" | "rope" | "clapper", Path2D> | null = null;

/** Draws bell `index` hanging from (cx, top), `width` wide, lit or not. */
function drawBell(c: CanvasRenderingContext2D, index: number, cx: number, top: number, width: number) {
  paths ??= { body: new Path2D(BELL.body), band: new Path2D(BELL.band), shine: new Path2D(BELL.shine), rope: new Path2D(BELL.rope), clapper: new Path2D(BELL.clapper) };
  const scale = width / 100;
  c.save();
  c.translate(cx - width / 2, top);
  c.scale(scale, scale);
  c.lineCap = "round";
  c.strokeStyle = palette.beamDark; c.lineWidth = 3; c.stroke(paths.rope);
  c.fillStyle = palette.brass; c.fill(paths.body);
  c.save(); c.clip(paths.body);
  c.fillStyle = palette.brassDark; c.globalAlpha = 0.3; c.beginPath(); c.ellipse(70, 80, 38, 44, 0, 0, Math.PI * 2); c.fill();
  c.restore();
  c.strokeStyle = BELL_COLORS[index]; c.lineWidth = 7; c.stroke(paths.band);
  c.strokeStyle = "rgba(255,255,255,0.45)"; c.lineWidth = 4; c.stroke(paths.shine);
  c.strokeStyle = palette.brassDark; c.lineWidth = 2.5; c.stroke(paths.body);
  c.strokeStyle = palette.brassDark; c.lineWidth = 3; c.stroke(paths.clapper);
  c.fillStyle = palette.brassDark; c.beginPath(); c.arc(50, 123, 6, 0, Math.PI * 2); c.fill();
  c.fillStyle = "#fff"; c.beginPath(); c.arc(50, 68, 13, 0, Math.PI * 2); c.fill();
  c.strokeStyle = BELL_COLORS[index]; c.lineWidth = 3.5; c.stroke();
  c.fillStyle = BELL_COLORS[index]; c.font = `800 20px "Display", "Bangla"`; c.textAlign = "center"; c.textBaseline = "middle";
  c.fillText(bn(index + 1), 50, 69);
  c.restore();
}

/** Paper flags (নিশান) strung across the top, as at a village fair. */
function drawBunting(c: CanvasRenderingContext2D, width: number, y: number) {
  c.strokeStyle = palette.beamDark; c.lineWidth = 3;
  c.beginPath(); c.moveTo(0, y); c.quadraticCurveTo(width / 2, y + 60, width, y); c.stroke();
  for (let flag = 0; flag < 14; flag++) {
    const x = 40 + flag * 75, t = x / width, sag = y + 120 * t * (1 - t);
    c.fillStyle = BELL_COLORS[flag % 5];
    c.beginPath(); c.moveTo(x - 24, sag); c.lineTo(x + 24, sag); c.lineTo(x, sag + 52); c.closePath(); c.fill();
  }
}

function where(data: CardData) {
  if (data.level) return levelLabel(data.level);
  return isDailySeed(data.seed) ? `রোজের সুর · ${dayLabel(data.seed)}` : "অন্তহীন সুর";
}

/** The card: bells on a bamboo beam, the score, the stars and one line about the tune. */
export function drawCard(canvas: HTMLCanvasElement, data: CardData, format: CardFormat, site: string) {
  const { width, height } = cardSizes[format];
  canvas.width = width; canvas.height = height;
  const c = canvas.getContext("2d");
  if (!c) throw new Error("এই ব্রাউজারে ছবি বানানো যাচ্ছে না।");
  const story = format === "story", cx = width / 2, top = story ? 250 : 0, name = cleanName(data.name);
  c.fillStyle = palette.paper; c.fillRect(0, 0, width, height);
  c.fillStyle = palette.paperLine;
  for (let at = 40; at < height; at += 70) c.fillRect(0, at, width, 2);
  drawBunting(c, width, top + 18);

  const finale = data.level ? finaleName(data.level) : "";
  fitText(c, [{ text: `ঘণ্টার সুর · ${where(data)}`, color: palette.muted, weight: 700, display: true }], cx, top + 190, 40, 940, "center");
  fitText(c, [
    ...(name ? [{ text: `${name}: `, color: palette.brassDark, weight: 800, display: true }] : []),
    { text: data.level ? `${bn(data.score)} পয়েন্ট` : `${bn(data.score)}টা সুর`, color: palette.ink, weight: 800, display: true },
  ], cx, top + 310, 120, 960, "center");
  fitText(c, [{ text: finale ? `‘${finale}’` : data.level ? "ঘণ্টার সুর মিলিয়ে বাজালাম" : "মনে রেখে বাজালাম", color: palette.ink, weight: 700, display: true }], cx, top + 384, 52, 900, "center");
  if (data.stars > 0) {
    c.font = `700 64px sans-serif`; c.textAlign = "center"; c.textBaseline = "alphabetic";
    for (let index = 0; index < 3; index++) { c.fillStyle = index < data.stars ? palette.star : palette.starOff; c.fillText("★", cx + (index - 1) * 78, top + 470); }
  }

  // The rack: a bamboo beam with the level's bells hanging from it.
  const beam = top + (story ? 640 : 560) - (data.stars > 0 ? 0 : 60), span = 920, slot = span / data.bells;
  c.fillStyle = palette.beam; c.fillRect(60, beam, width - 120, 26);
  c.fillStyle = palette.beamDark; for (let knot = 140; knot < width - 90; knot += 190) c.fillRect(knot, beam, 6, 26);
  for (let index = 0; index < data.bells; index++) drawBell(c, index, cx - span / 2 + slot * (index + 0.5), beam + 26, slot * 0.95 * BELL_SCALE[index]);
  fitText(c, [{ text: cardLine(data.level, data.score, data.stars), color: palette.ink, weight: 700 }], cx, beam + 430, story ? 50 : 46, 940, "center");
  drawFooterBand(c, format, "তুমি কয়টা সুর মনে রাখতে পারবে?", site, { band: palette.band, ask: palette.ask, site: "#ffffff" });
}

export const cardBlob = (data: CardData, format: CardFormat, site: string) => renderCard(canvas => drawCard(canvas, data, format, site));

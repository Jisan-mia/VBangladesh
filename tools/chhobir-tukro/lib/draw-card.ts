import { cardSizes, drawFooterBand, fitText, renderCard, roundedRect, type CardFormat } from "../../../shared/card-canvas";
import { cleanName } from "../../../shared/game-core";
import { makePuzzle, pieceCount, starsFor } from "./game";
import { isFinale } from "./levels";
import { cardLine, levelLabel, paintingName, type Shared } from "./link";
import { drawPainting, paintingFor } from "./painting";
import { tracePiece } from "./pieces";

export const palette = { table: "#2c3e3a", grain: "#30433c", paper: "#fbf4e4", ink: "#f8efdc", muted: "#cbd9cf", star: "#f2b52c", starOff: "#53675e", band: "#1a2623", ask: "#ffd98a" };

/** The finished painting on a dark table, its seams still faintly showing, so it reads as a jigsaw done by hand. */
export function drawCard(canvas: HTMLCanvasElement, shared: Shared, format: CardFormat, site: string) {
  const { width, height } = cardSizes[format];
  canvas.width = width; canvas.height = height;
  const c = canvas.getContext("2d");
  if (!c) throw new Error("এই ব্রাউজারে ছবি বানানো যাচ্ছে না।");
  const story = format === "story", cx = width / 2, top = story ? 250 : 0;
  c.fillStyle = palette.table; c.fillRect(0, 0, width, height);
  c.fillStyle = palette.grain;
  for (let at = 0; at < height; at += 46) c.fillRect(0, at, width, 10);

  const name = cleanName(shared.name), stars = starsFor(shared.level, shared.seconds), bn = new Intl.NumberFormat("bn-BD").format;
  fitText(c, [{ text: `ছবির টুকরো · ${levelLabel(shared.level)}`, color: palette.muted, weight: 700, display: true }], cx, top + 88, 38, 960, "center");
  fitText(c, [
    ...(name ? [{ text: `${name}: `, color: palette.ask, weight: 800, display: true }] : []),
    { text: `${bn(pieceCount(shared.level))} টুকরো জোড়া লাগালাম`, color: palette.ink, weight: 800, display: true },
  ], cx, top + 166, 66, 960, "center");
  c.font = "700 54px sans-serif"; c.textAlign = "center";
  for (let index = 0; index < 3; index++) { c.fillStyle = index < stars ? palette.star : palette.starOff; c.fillText("★", cx + (index - 1) * 66, top + 234); }
  fitText(c, [{ text: cardLine(shared), color: palette.ink, weight: 600 }], cx, top + 292, story ? 40 : 36, 960, "center");

  // The painting on a cream mount with a soft drop shadow.
  const side = story ? 900 : 760, x = cx - side / 2, y = top + (story ? 360 : 330), mat = 22;
  c.fillStyle = "rgba(0,0,0,0.3)"; roundedRect(c, x - mat + 10, y - mat + 14, side + mat * 2, side + mat * 2, 14); c.fill();
  c.fillStyle = palette.paper; roundedRect(c, x - mat, y - mat, side + mat * 2, side + mat * 2, 14); c.fill();
  drawPainting(c, paintingFor(shared.level), x, y, side);
  const puzzle = makePuzzle(shared.level), cell = side / puzzle.n;
  c.save();
  c.beginPath(); c.rect(x, y, side, side); c.clip();
  c.strokeStyle = "rgba(255,255,255,0.22)"; c.lineWidth = 2;
  c.beginPath();
  for (let id = 0; id < puzzle.n ** 2; id++) tracePiece(c, puzzle.edges, puzzle.n, id, x + (id % puzzle.n) * cell, y + Math.floor(id / puzzle.n) * cell, cell);
  c.stroke();
  c.restore();
  if (isFinale(shared.level)) {
    // A finale's stamp: a tilted red seal in the painting's corner.
    c.save(); c.translate(x + side - 110, y + 100); c.rotate(-0.18);
    c.strokeStyle = "#c8452c"; c.lineWidth = 6; roundedRect(c, -96, -40, 192, 80, 12); c.stroke();
    fitText(c, [{ text: "শেষ ছবি", color: "#c8452c", weight: 800, display: true }], 0, 14, 40, 170, "center");
    c.restore();
  }
  fitText(c, [{ text: `‘${paintingName(shared.level)}’`, color: palette.muted, weight: 600 }], cx, y + side + mat + 54, 34, 900, "center");
  drawFooterBand(c, format, "তুমি কত সময়ে পারবে?", site, { band: palette.band, ask: palette.ask, site: "#ffffff" });
}

export const cardBlob = (shared: Shared, format: CardFormat, site: string) => renderCard(canvas => drawCard(canvas, shared, format, site));

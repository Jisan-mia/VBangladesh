import { cardSizes, drawFooterBand, fitText, renderCard, roundedRect, type CardFormat } from "../../../shared/card-canvas";
import { cleanName } from "../../../shared/game-core";
import { puzzleOf, starsFor } from "./game";
import { cardLine, levelLabel, pictureName, type Shared } from "./link";

export const palette = { cloth: "#f6efe1", weave: "#ece2cd", ink: "#3a2e22", muted: "#7a6650", thread: "#b5452b", star: "#f2a900", starOff: "#d9cbb0", band: "#3a2e22", ask: "#ffd8a8" };

/** The revealed picture as a stitched কাঁথা patch: every cell a little block of thread, a running stitch around the edge. */
export function drawPicture(c: CanvasRenderingContext2D, level: number, x: number, y: number, side: number) {
  const { size, picture } = puzzleOf(level), pad = side * 0.06, cell = (side - pad * 2) / size, gap = Math.max(1, cell * 0.08);
  c.save();
  c.fillStyle = "#e3d6bc"; roundedRect(c, x + 6, y + 10, side, side, 22); c.fill();
  c.fillStyle = picture.bg; roundedRect(c, x, y, side, side, 22); c.fill();
  picture.art.forEach((row, r) => [...row].forEach((letter, col) => {
    if (letter === ".") return;
    c.fillStyle = picture.colors[letter];
    roundedRect(c, x + pad + col * cell + gap / 2, y + pad + r * cell + gap / 2, cell - gap, cell - gap, cell * 0.16); c.fill();
  }));
  c.setLineDash([18, 12]); c.lineWidth = 5; c.strokeStyle = palette.thread;
  roundedRect(c, x + pad * 0.45, y + pad * 0.45, side - pad * 0.9, side - pad * 0.9, 16); c.stroke();
  c.restore();
}

export function drawCard(canvas: HTMLCanvasElement, shared: Shared, format: CardFormat, site: string) {
  const { width, height } = cardSizes[format];
  canvas.width = width; canvas.height = height;
  const c = canvas.getContext("2d");
  if (!c) throw new Error("এই ব্রাউজারে ছবি বানানো যাচ্ছে না।");
  const story = format === "story", cx = width / 2, top = story ? 250 : 0;
  c.fillStyle = palette.cloth; c.fillRect(0, 0, width, height);
  c.fillStyle = palette.weave;
  for (let at = 0; at < height; at += 14) c.fillRect(0, at, width, 2);

  const name = cleanName(shared.name), stars = starsFor(shared.mistakes, shared.hinted);
  fitText(c, [{ text: `ছবি ফোটাও · ${levelLabel(shared.level)}`, color: palette.muted, weight: 700, display: true }], cx, top + 104, 40, 940, "center");
  fitText(c, [
    ...(name ? [{ text: `${name}: `, color: palette.thread, weight: 800, display: true }] : []),
    { text: `${pictureName(shared.level)} ফুটল`, color: palette.ink, weight: 800, display: true },
  ], cx, top + 200, 76, 960, "center");
  c.font = "700 64px sans-serif"; c.textAlign = "center";
  for (let index = 0; index < 3; index++) { c.fillStyle = index < stars ? palette.star : palette.starOff; c.fillText("★", cx + (index - 1) * 78, top + 290); }

  const side = story ? 760 : 640;
  drawPicture(c, shared.level, cx - side / 2, top + 330, side);
  const after = top + 330 + side;
  fitText(c, [{ text: cardLine(shared), color: palette.ink, weight: 700 }], cx, after + 96, story ? 50 : 44, 940, "center");
  fitText(c, [{ text: puzzleOf(shared.level).picture.line, color: palette.muted, weight: 600 }], cx, after + 156, 34, 900, "center");
  drawFooterBand(c, format, "তুমি কত সময়ে পারবে?", site, { band: palette.band, ask: palette.ask, site: "#ffffff" });
}

export const cardBlob = (shared: Shared, format: CardFormat, site: string) => renderCard(canvas => drawCard(canvas, shared, format, site));

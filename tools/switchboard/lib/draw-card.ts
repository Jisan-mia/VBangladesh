import { cardSizes, drawFooterBand, fitText, renderCard, roundedRect, type CardFormat } from "../../../shared/card-canvas";
import { cleanName } from "../../../shared/game-core";
import { sizeOf } from "./game";
import { bn, cardLine, levelLabel, parOf, type Shared } from "./link";

export const palette = { wall: "#f2e6cc", wallLine: "#e8d8b8", ink: "#3b2614", muted: "#7a5a3c", wood: "#8a4f22", woodDark: "#5e3314", glass: "#ffd54a", glow: "#ffe9a0", brass: "#c99a3e", brassDark: "#8a6420", star: "#f2a900", starOff: "#d8c9a8", band: "#3b2614" };

/** The bulb's SVG paths, shared with the live board. */
export const BULB = {
  rays: "M20 1v4M5 8l3 3M35 8l-3 3M1 22h4M35 22h4",
  glass: "M20 7a12 12 0 0 0-7 21.6c1.6 1.3 2.4 2.8 2.4 4.4h9.2c0-1.6.8-3.1 2.4-4.4A12 12 0 0 0 20 7Z",
  filament: "M16.5 32v-7l2-3 1.5 3 1.5-3 2 3v7",
  base: "M15.4 34h9.2v3h-9.2zM16 38.5h8v2.5l-2 2h-4l-2-2z",
};
let bulb: Record<keyof typeof BULB, Path2D> | null = null;

/** The wooden board with every bulb lit: how a cleared level always looks. */
export function drawBoard(c: CanvasRenderingContext2D, size: number, x: number, y: number, width: number) {
  const pad = width * 0.07, cell = (width - pad * 2) / size, height = pad * 2 + cell * size * 1.12;
  c.save();
  c.fillStyle = palette.woodDark; roundedRect(c, x + 6, y + 10, width, height, 26); c.fill();
  const wood = c.createLinearGradient(x, y, x + width, y + height);
  wood.addColorStop(0, "#a3602b"); wood.addColorStop(1, palette.wood);
  c.fillStyle = wood; roundedRect(c, x, y, width, height, 26); c.fill();
  c.strokeStyle = "rgba(60,30,10,0.18)"; c.lineWidth = 3;
  for (let line = 1; line < 9; line++) {
    const at = y + (height / 9) * line;
    c.beginPath(); c.moveTo(x + 18, at); c.bezierCurveTo(x + width * 0.3, at - 10, x + width * 0.7, at + 12, x + width - 18, at - 4); c.stroke();
  }
  for (const [sx, sy] of [[x + 26, y + 26], [x + width - 26, y + 26], [x + 26, y + height - 26], [x + width - 26, y + height - 26]]) {
    c.fillStyle = palette.brass; c.beginPath(); c.arc(sx, sy, 10, 0, Math.PI * 2); c.fill();
    c.strokeStyle = palette.brassDark; c.lineWidth = 3; c.beginPath(); c.moveTo(sx - 6, sy); c.lineTo(sx + 6, sy); c.stroke();
  }
  const r = cell * 0.18;
  for (let index = 0; index < size * size; index++) {
    const cx = x + pad + cell * (index % size + 0.5), top = y + pad + cell * 1.12 * Math.floor(index / size);
    const by = top + cell * 0.28, sy = top + cell * 0.88;
    const glow = c.createRadialGradient(cx, by, r * 0.4, cx, by, r * 2.4);
    glow.addColorStop(0, "rgba(255,233,160,0.85)"); glow.addColorStop(1, "rgba(255,233,160,0)");
    c.fillStyle = glow; c.beginPath(); c.arc(cx, by, r * 2.4, 0, Math.PI * 2); c.fill();
    // The same pear-shaped bulb as the live board (its 40×48 SVG paths), centred on the glass.
    c.save();
    c.translate(cx, by); c.scale(r / 12, r / 12); c.translate(-20, -19);
    bulb ??= { rays: new Path2D(BULB.rays), glass: new Path2D(BULB.glass), filament: new Path2D(BULB.filament), base: new Path2D(BULB.base) };
    c.lineCap = "round"; c.lineJoin = "round";
    c.strokeStyle = palette.glow; c.lineWidth = 2.4; c.stroke(bulb.rays);
    c.fillStyle = palette.glass; c.fill(bulb.glass); c.strokeStyle = "#a86f00"; c.lineWidth = 1.6; c.stroke(bulb.glass);
    c.strokeStyle = "#a4460c"; c.lineWidth = 1.1; c.stroke(bulb.filament);
    c.fillStyle = "#b9b2a3"; c.fill(bulb.base); c.strokeStyle = palette.woodDark; c.lineWidth = 1; c.stroke(bulb.base);
    c.restore();
    const plate = c.createRadialGradient(cx - r * 0.3, sy - r * 0.3, r * 0.1, cx, sy, r * 1.15);
    plate.addColorStop(0, "#f0cf7a"); plate.addColorStop(1, palette.brass);
    c.fillStyle = plate; c.beginPath(); c.arc(cx, sy, r * 1.15, 0, Math.PI * 2); c.fill();
    c.strokeStyle = palette.brassDark; c.lineWidth = 2.5; c.stroke();
    c.fillStyle = palette.woodDark; roundedRect(c, cx - r * 0.2, sy - r * 0.75, r * 0.4, r * 0.8, r * 0.2); c.fill();
  }
  c.restore();
  return height;
}

export function drawCard(canvas: HTMLCanvasElement, shared: Shared, stars: number, format: CardFormat, site: string) {
  const { width, height } = cardSizes[format];
  canvas.width = width; canvas.height = height;
  const c = canvas.getContext("2d");
  if (!c) throw new Error("এই ব্রাউজারে ছবি বানানো যাচ্ছে না।");
  const story = format === "story", cx = width / 2, top = story ? 250 : 0;
  c.fillStyle = palette.wall; c.fillRect(0, 0, width, height);
  c.fillStyle = palette.wallLine;
  for (let at = 60; at < height; at += 90) c.fillRect(0, at, width, 3);

  const name = cleanName(shared.name), moves = shared.moves.length, par = parOf(shared.level);
  fitText(c, [{ text: `সুইচবোর্ড · ${levelLabel(shared.level)}`, color: palette.muted, weight: 700, display: true }], cx, top + 104, 40, 940, "center");
  fitText(c, [
    ...(name ? [{ text: `${name}: `, color: palette.wood, weight: 800, display: true }] : []),
    { text: `${bn(moves)} চালে সব বাতি জ্বলল`, color: palette.ink, weight: 800, display: true },
  ], cx, top + 200, 76, 960, "center");
  c.font = `700 64px sans-serif`; c.textAlign = "center";
  for (let index = 0; index < 3; index++) { c.fillStyle = index < stars ? palette.star : palette.starOff; c.fillText("★", cx + (index - 1) * 78, top + 290); }

  const boardWidth = story ? 760 : 660;
  const boardHeight = drawBoard(c, sizeOf(shared.level), cx - boardWidth / 2, top + 330, boardWidth);
  const after = top + 330 + boardHeight;
  fitText(c, [{ text: cardLine(moves, par, shared.hinted), color: palette.ink, weight: 700 }], cx, after + 90, story ? 50 : 44, 940, "center");
  fitText(c, [{ text: `সেরা ${bn(par)} চাল${shared.hinted ? " · একটা হিন্ট নেওয়া" : ""}`, color: palette.muted, weight: 600 }], cx, after + 150, 34, 900, "center");
  drawFooterBand(c, format, "তুমি কয় চালে পারবে?", site, { band: palette.band, ask: palette.glow, site: "#ffffff" });
}

export const cardBlob = (shared: Shared, stars: number, format: CardFormat, site: string) => renderCard(canvas => drawCard(canvas, shared, stars, format, site));

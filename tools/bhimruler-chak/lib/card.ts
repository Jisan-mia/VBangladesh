import { cardSizes, drawFooterBand, fitText, renderCard, type CardFormat } from "../../../shared/card-canvas";
import { cleanName } from "../../../shared/game-core";
import { artFor, FIXED } from "./art";
import { humanLine, levelLabel, sharedStars, sizeLabel, timeText, type Shared } from "./challenge";
import { isFinale, levelName, worldOf } from "./levels";

/** The orchard in its world's light (lib/art.ts): sky, grass, leaf green, ripe mango, a red-and-white checked গামছা. */
let palette = { ...artFor(1), ...FIXED };

function blob(c: CanvasRenderingContext2D, x: number, y: number, rx: number, ry: number, fill: string, turn = 0) {
  c.beginPath(); c.ellipse(x, y, rx, ry, turn, 0, Math.PI * 2); c.fillStyle = fill; c.fill();
}

function star(c: CanvasRenderingContext2D, cx: number, cy: number, r: number, fill: string) {
  c.beginPath();
  for (let i = 0; i < 10; i++) {
    const angle = -Math.PI / 2 + i * Math.PI / 5, radius = i % 2 ? r * 0.45 : r;
    c.lineTo(cx + Math.cos(angle) * radius, cy + Math.sin(angle) * radius);
  }
  c.closePath(); c.fillStyle = fill; c.fill();
}

/** A cartoon hornet: round, striped, two little wings and a dot of an eye. Nobody gets stung on this card. */
function hornet(c: CanvasRenderingContext2D, x: number, y: number, s: number, turn: number) {
  c.save(); c.translate(x, y); c.rotate(turn);
  blob(c, -s * 0.15, -s * 0.55, s * 0.42, s * 0.26, "rgba(255,255,255,0.85)", -0.5);
  blob(c, s * 0.25, -s * 0.55, s * 0.42, s * 0.26, "rgba(255,255,255,0.85)", 0.5);
  c.save();
  c.beginPath(); c.ellipse(0, 0, s * 0.7, s * 0.45, 0, 0, Math.PI * 2); c.clip();
  c.fillStyle = "#f5b700"; c.fillRect(-s, -s, s * 2, s * 2);
  c.fillStyle = "#2b2416"; c.fillRect(-s * 0.32, -s, s * 0.18, s * 2); c.fillRect(s * 0.05, -s, s * 0.18, s * 2);
  c.restore();
  blob(c, s * 0.72, -s * 0.05, s * 0.28, s * 0.28, "#2b2416");
  blob(c, s * 0.8, -s * 0.12, s * 0.07, s * 0.07, "#ffffff");
  c.restore();
}

/** The nest with a গামছা tied round it: a checked band of red and white. */
function tiedNest(c: CanvasRenderingContext2D, x: number, y: number, s: number) {
  c.strokeStyle = palette.bark; c.lineWidth = s * 0.08;
  c.beginPath(); c.moveTo(x, y - s * 1.2); c.lineTo(x, y - s * 0.8); c.stroke();
  blob(c, x, y, s * 0.72, s * 0.9, palette.nest);
  c.strokeStyle = palette.nestLine; c.lineWidth = s * 0.05;
  for (let i = -2; i <= 2; i++) { c.beginPath(); c.ellipse(x, y + i * s * 0.3, s * 0.72 * Math.cos(i * 0.32), s * 0.08, 0, 0, Math.PI); c.stroke(); }
  c.save(); c.translate(x, y + s * 0.05); c.rotate(-0.12);
  const w = s * 1.7, h = s * 0.42;
  c.beginPath(); c.rect(-w / 2, -h / 2, w, h); c.clip();
  c.fillStyle = palette.gamchha; c.fillRect(-w / 2, -h / 2, w, h);
  c.fillStyle = "rgba(255,255,255,0.55)";
  for (let at = -w / 2; at < w / 2; at += h / 2) c.fillRect(at, -h / 2, h / 6, h);
  for (let at = -h / 2; at < h / 2; at += h / 2) c.fillRect(-w / 2, at, w, h / 6);
  c.restore();
  // The knot's two loose ends.
  blob(c, x + w / 2 - s * 0.05, y + s * 0.22, s * 0.16, s * 0.34, palette.gamchha, 0.5);
  blob(c, x + w / 2 + s * 0.12, y + s * 0.18, s * 0.12, s * 0.3, palette.gamchha, -0.3);
}

/** A mango tree with the tied nest on a low branch, hornets circling, and a basket of mangoes underneath. */
export function drawOrchard(c: CanvasRenderingContext2D, cx: number, top: number, s: number) {
  const ground = top + s * 1.0;
  blob(c, cx, ground + s * 0.02, s * 0.78, s * 0.06, "rgba(36,48,28,0.18)");
  c.fillStyle = palette.bark;
  c.beginPath(); c.moveTo(cx - s * 0.09, ground); c.lineTo(cx - s * 0.05, top + s * 0.45); c.lineTo(cx + s * 0.05, top + s * 0.45); c.lineTo(cx + s * 0.1, ground); c.closePath(); c.fill();
  c.strokeStyle = palette.bark; c.lineWidth = s * 0.04; c.lineCap = "round";
  c.beginPath(); c.moveTo(cx, top + s * 0.55); c.quadraticCurveTo(cx + s * 0.25, top + s * 0.48, cx + s * 0.42, top + s * 0.42); c.stroke();
  for (const [dx, dy, r, fill] of [[-0.38, 0.28, 0.3, palette.leaf], [0.36, 0.26, 0.3, palette.leaf], [0, 0.12, 0.36, palette.leafLight], [-0.2, 0.36, 0.26, palette.leafLight], [0.22, 0.38, 0.24, palette.leaf], [0.02, 0.32, 0.3, palette.leafLight]] as const) {
    blob(c, cx + dx * s, top + dy * s, r * s, r * s * 0.86, fill);
  }
  for (const [dx, dy] of [[-0.42, 0.36], [-0.14, 0.18], [0.14, 0.42], [0.32, 0.16], [-0.3, 0.48], [0.05, 0.05]] as const) {
    blob(c, cx + dx * s, top + dy * s, s * 0.045, s * 0.06, palette.mango, 0.4);
    blob(c, cx + dx * s + s * 0.012, top + dy * s + s * 0.02, s * 0.02, s * 0.025, palette.mangoBlush, 0.4);
  }
  tiedNest(c, cx + s * 0.42, top + s * 0.62, s * 0.13);
  for (const [dx, dy, turn] of [[0.62, 0.48, -0.3], [0.68, 0.72, 0.4], [0.26, 0.82, -0.2], [0.58, 0.9, 0.2]] as const) hornet(c, cx + dx * s, top + dy * s, s * 0.05, turn);
  c.strokeStyle = "rgba(36,48,28,0.35)"; c.lineWidth = 3; c.setLineDash([6, 10]);
  c.beginPath(); c.ellipse(cx + s * 0.48, top + s * 0.7, s * 0.24, s * 0.16, 0.2, 0, Math.PI * 2); c.stroke();
  c.setLineDash([]);
  // The basket: a woven half-moon of mangoes.
  const bx = cx - s * 0.42, by = ground - s * 0.04;
  for (const [dx, dy] of [[-0.08, -0.07], [0.02, -0.09], [0.1, -0.06], [-0.03, -0.12], [0.06, -0.13]] as const) blob(c, bx + dx * s, by + dy * s, s * 0.05, s * 0.04, palette.mango, 0.3);
  c.fillStyle = "#b07a3c";
  c.beginPath(); c.moveTo(bx - s * 0.17, by - s * 0.07); c.lineTo(bx + s * 0.19, by - s * 0.07); c.lineTo(bx + s * 0.14, by + s * 0.04); c.lineTo(bx - s * 0.12, by + s * 0.04); c.closePath(); c.fill();
  c.strokeStyle = "#8a5a28"; c.lineWidth = 3;
  for (let i = 1; i < 4; i++) { c.beginPath(); c.moveTo(bx - s * 0.17 + i * s * 0.01, by - s * 0.07 + i * s * 0.028); c.lineTo(bx + s * 0.19 - i * s * 0.012, by - s * 0.07 + i * s * 0.028); c.stroke(); }
}

/** A finale's stamp: a tilted red seal with the finale's name. */
function stamp(c: CanvasRenderingContext2D, x: number, y: number, label: string) {
  c.save(); c.translate(x, y); c.rotate(-0.16);
  c.strokeStyle = FIXED.danger; c.lineWidth = 6; c.globalAlpha = 0.9;
  c.beginPath(); c.roundRect(-150, -46, 300, 92, 18); c.stroke();
  fitText(c, [{ text: label, color: FIXED.danger, weight: 800, display: true }], 0, 14, 40, 270, "center");
  c.restore();
}

export function drawCard(canvas: HTMLCanvasElement, shared: Shared, format: CardFormat, site: string) {
  const { width, height } = cardSizes[format];
  canvas.width = width; canvas.height = height;
  const c = canvas.getContext("2d");
  if (!c) throw new Error("এই ব্রাউজারে ছবি বানানো যাচ্ছে না।");
  const story = format === "story", cx = width / 2, top = story ? 250 : 0, stars = sharedStars(shared);
  palette = { ...artFor(shared.legacy ? 1 : worldOf(shared.level)), ...FIXED };
  const dusk = !shared.legacy && worldOf(shared.level) === 3;
  const sky = c.createLinearGradient(0, 0, 0, height);
  sky.addColorStop(0, dusk ? "#3b2f55" : palette.sky); sky.addColorStop(0.6, dusk ? palette.sky : palette.sky);
  c.fillStyle = sky; c.fillRect(0, 0, width, height);
  // The canopy reaches 0.24·s above the scene's top, so the scene starts below the stars.
  const s = story ? 680 : 560, sceneTop = top + 310 + s * 0.24, groundY = sceneTop + s * 1.0;
  c.fillStyle = palette.grass; c.fillRect(0, groundY - 30, width, height - groundY + 30);
  c.fillStyle = palette.grassDeep;
  for (let x = 20; x < width; x += 46) { c.beginPath(); c.moveTo(x, groundY - 30); c.lineTo(x + 8, groundY - 52); c.lineTo(x + 16, groundY - 30); c.fill(); }

  const name = cleanName(shared.name);
  const ink = dusk ? "#2a2238" : palette.ink, finale = !shared.legacy && isFinale(shared.level);
  fitText(c, [{ text: `ভিমরুলের চাক · ${finale ? levelName(shared.level) : levelLabel(shared.level, shared.legacy)}`, color: dusk ? "#fbeedd" : palette.muted, weight: 700, display: true }], cx, top + 100, 40, 940, "center");
  fitText(c, [
    { text: name ? `${name} ` : "", color: dusk ? "#fbeedd" : ink, weight: 800, display: true },
    { text: `${timeText(shared.seconds)}ে`, color: dusk ? "#ffc27a" : palette.gamchha, weight: 800, display: true },
    { text: name ? " বাগান সাফ করেছে" : " বাগান সাফ করলাম", color: dusk ? "#fbeedd" : ink, weight: 800, display: true },
  ], cx, top + 196, 72, 980, "center");
  for (let i = 0; i < 3; i++) star(c, cx + (i - 1) * 84, top + 266, 32, i < stars ? palette.star : palette.starOff);

  drawOrchard(c, cx + s * 0.04, sceneTop, s);
  if (finale) stamp(c, cx - s * 0.36, sceneTop + s * 0.12, levelName(shared.level));
  const after = groundY + (story ? 70 : 40);
  fitText(c, [{ text: humanLine(stars, shared.hints, shared.stings), color: ink, weight: 800, display: true }], cx, after + 40, story ? 54 : 46, 940, "center");
  fitText(c, [{ text: sizeLabel(shared.level, shared.legacy), color: ink, weight: 600 }], cx, after + (story ? 112 : 98), story ? 36 : 32, 900, "center");
  drawFooterBand(c, format, "তুমি কত সময়ে পারবে?", site, { band: palette.band, ask: palette.ask, site: "#ffffff" });
}

export const cardBlob = (shared: Shared, format: CardFormat, site: string) => renderCard(canvas => drawCard(canvas, shared, format, site));

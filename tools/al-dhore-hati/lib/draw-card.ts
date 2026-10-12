import { cardSizes, drawFooterBand, fitText, renderCard, roundedRect, type CardFormat } from "../../../shared/card-canvas";
import { cleanName } from "../../../shared/game-core";
import { drawScene, makeLayers } from "./art";
import { levelSpec } from "./levels";
import { bn, humanLine, levelLabel, slipText, type Shared } from "./link";
import { centreAt, makeField, safeOffset, starsOf, W } from "./walk";

const colors = { bg: "#f4eedc", ink: "#24301b", muted: "#5d6450", accent: "#3d6b21", star: "#f2a900", starOff: "#ddd4bb", band: "#24301b", ask: "#ffd23f" };

function star(c: CanvasRenderingContext2D, cx: number, cy: number, r: number, fill: string) {
  c.beginPath();
  for (let i = 0; i < 10; i++) {
    const angle = -Math.PI / 2 + i * Math.PI / 5, radius = i % 2 ? r * 0.45 : r;
    c.lineTo(cx + Math.cos(angle) * radius, cy + Math.sin(angle) * radius);
  }
  c.closePath(); c.fillStyle = fill; c.fill();
}

export function drawCard(canvas: HTMLCanvasElement, shared: Shared, format: CardFormat, site: string) {
  const { width, height } = cardSizes[format];
  canvas.width = width; canvas.height = height;
  const c = canvas.getContext("2d");
  if (!c) throw new Error("এই ব্রাউজারে ছবি বানানো যাচ্ছে না।");
  const story = format === "story", cx = width / 2, top = story ? 250 : 0, stars = starsOf(shared.slips, true);
  const name = cleanName(shared.name), metres = levelSpec(shared.level).metres;
  c.fillStyle = colors.bg; c.fillRect(0, 0, width, height);

  fitText(c, [{ text: `আল ধরে হাঁটি · ${levelLabel(shared.level)}`, color: colors.muted, weight: 700, display: true }], cx, top + 84, 36, 960, "center");
  fitText(c, [
    { text: name ? `${name} ` : "", color: colors.ink, weight: 800, display: true },
    { text: `${bn(metres)} মিটার`, color: colors.accent, weight: 800, display: true },
    { text: name ? " আল পার হলো" : " আল পার হলাম", color: colors.ink, weight: 800, display: true },
  ], cx, top + 168, 60, 980, "center");
  fitText(c, [{ text: slipText(shared.slips), color: colors.accent, weight: 800, display: true }], cx, top + 262, 74, 900, "center");
  for (let i = 0; i < 3; i++) star(c, cx + (i - 1) * 76, top + 326, 28, i < stars ? colors.star : colors.starOff);

  // The last stretch of the field, the village road ahead: board rows 10..370.
  const k = story ? 2.3 : 2.0, shownH = 360, fromY = 10, sceneW = W * k, sceneH = shownH * k, sx = (width - sceneW) / 2, sy = top + 372;
  const field = makeField(shared.level, shared.seed), d = field.length - 250;
  c.save();
  roundedRect(c, sx, sy, sceneW, sceneH, 28); c.clip();
  c.translate(sx, sy - fromY * k); c.scale(k, k);
  drawScene(c, makeLayers(field.spec.scene, k), { field, d, clock: 0.6, calm: true, wind: 0, walker: { x: centreAt(field, d) + safeOffset(field, d), d, slip: 0, side: 1, ghost: false, calm: true } });
  c.restore();

  const after = sy + sceneH;
  fitText(c, [{ text: humanLine(shared), color: colors.ink, weight: 800, display: true }], cx, after + (story ? 84 : 58), story ? 50 : 42, 960, "center");
  const sub = shared.slips === 0 ? "পুরো খেত শুকনো পায়ে" : `টানা সবচেয়ে বেশি ${bn(shared.dry)} মিটার শুকনো পায়ে`;
  fitText(c, [{ text: sub, color: colors.muted, weight: 600 }], cx, after + (story ? 144 : 106), story ? 36 : 30, 900, "center");
  drawFooterBand(c, format, "তুমি কয়বার পিছলাবে?", site, { band: colors.band, ask: colors.ask, site: "#ffffff" });
}

export const cardBlob = (shared: Shared, format: CardFormat, site: string) => renderCard(canvas => drawCard(canvas, shared, format, site));

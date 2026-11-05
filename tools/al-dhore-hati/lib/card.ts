import { cardSizes, drawFooterBand, fitText, renderCard, roundedRect, type CardFormat } from "../../../shared/card-canvas";
import { cleanName } from "../../../shared/game-core";
import { drawFrame } from "./draw.hot";
import { centreAt, MIN_H, safeOffset, W } from "./field";
import { legacySpec, specOf, starsOf } from "./levels";
import { bn, humanLine, levelLabel, playLabel, slipText, type Card } from "./link";
import { createGame, PH_WALK } from "./rules";
import { makeLook, paintLook, sizeLook } from "./scene";

const colors = { bg: "#f4eedc", ink: "#24301b", muted: "#5d6450", accent: "#3d6b21", star: "#f2a900", starOff: "#ddd4bb", band: "#24301b", ask: "#ffd23f" };

function star(c: CanvasRenderingContext2D, cx: number, cy: number, r: number, fill: string) {
  c.beginPath();
  for (let i = 0; i < 10; i++) {
    const angle = -Math.PI / 2 + i * Math.PI / 5, radius = i % 2 ? r * 0.45 : r;
    c.lineTo(cx + Math.cos(angle) * radius, cy + Math.sin(angle) * radius);
  }
  c.closePath(); c.fillStyle = fill; c.fill();
}

/** Stars a card shows: a new link's by its mode, an old link's by the old rule (three slips, no mode). */
export const cardStars = (card: Pick<Card, "slips" | "mode" | "kind">) => starsOf(card.slips, true, card.kind === "old" ? "n" : card.mode);

export function drawCard(canvas: HTMLCanvasElement, card: Card, format: CardFormat, site: string) {
  const { width, height } = cardSizes[format];
  canvas.width = width; canvas.height = height;
  const c = canvas.getContext("2d");
  if (!c) throw new Error("এই ব্রাউজারে ছবি বানানো যাচ্ছে না।");
  const story = format === "story", cx = width / 2, top = story ? 250 : 0, stars = cardStars(card);
  const name = cleanName(card.name), spec = card.kind === "old" ? legacySpec(card.level) : specOf(card.level, card.mode);
  c.fillStyle = colors.bg; c.fillRect(0, 0, width, height);

  fitText(c, [{ text: `আল ধরে হাঁটি · ${playLabel(card)}`, color: colors.muted, weight: 700, display: true }], cx, top + 84, 36, 960, "center");
  fitText(c, [
    { text: name ? `${name} ` : "", color: colors.ink, weight: 800, display: true },
    { text: `${bn(spec.metres)} মিটার`, color: colors.accent, weight: 800, display: true },
    { text: name ? " আল পার হলো" : " আল পার হলাম", color: colors.ink, weight: 800, display: true },
  ], cx, top + 168, 60, 980, "center");
  fitText(c, [{ text: slipText(card.slips), color: colors.accent, weight: 800, display: true }], cx, top + 262, 74, 900, "center");
  for (let i = 0; i < 3; i++) star(c, cx + (i - 1) * 76, top + 326, 28, i < stars ? colors.star : colors.starOff);

  // The last stretch of the field, with the walker on the dry lane: board rows 10..370.
  const k = story ? 2.3 : 2.0, shownH = 360, fromY = 10, sceneW = W * k, sceneH = shownH * k, sx = (width - sceneW) / 2, sy = top + 372;
  const game = createGame({ seed: card.seed, kind: card.kind, level: card.level, mode: card.mode }), field = game.field;
  const look = makeLook();
  sizeLook(look, MIN_H, k, 1);
  look.calm = true;
  paintLook(look, spec.scene, spec.dark);
  game.phase = PH_WALK;
  game.d = field.length - 250;
  game.clock = 0.6;
  game.x = centreAt(field, game.d) + safeOffset(field, game.d);
  c.save();
  roundedRect(c, sx, sy, sceneW, sceneH, 10); c.clip();
  c.translate(sx, sy - fromY * k); c.scale(k, k);
  drawFrame(c, look, game);
  c.restore();

  const after = sy + sceneH;
  fitText(c, [{ text: humanLine(card), color: colors.ink, weight: 800, display: true }], cx, after + (story ? 84 : 58), story ? 50 : 42, 960, "center");
  const sub = card.slips === 0 ? "পুরো খেত শুকনো পায়ে" : `টানা সবচেয়ে বেশি ${bn(card.dry)} মিটার শুকনো পায়ে`;
  fitText(c, [{ text: sub, color: colors.muted, weight: 600 }], cx, after + (story ? 144 : 106), story ? 36 : 30, 900, "center");
  drawFooterBand(c, format, "তুমি কয়বার পিছলাবে?", site, { band: colors.band, ask: colors.ask, site: "#ffffff" });
}

export const cardBlob = (card: Card, format: CardFormat, site: string) => renderCard(canvas => drawCard(canvas, card, format, site));
export { levelLabel };

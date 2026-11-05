// The share card: the রাত and its name, the count, the stars, the bat crackling over two falling mosquitoes in this world's
// room, the card's own line and the tally. Drawn with the same paint as the game.
import { cardSizes, drawFooterBand, fitText, renderCard, DISPLAY_FONT, type CardFormat } from "../../../shared/card-canvas";
import { possessive } from "../../../shared/bangla";
import { cleanName } from "../../../shared/game-core";
import { levelOf, WORLDS } from "./levels";
import { bn, humanLine, levelTitle, tallyLine } from "./lines";
import { BOSS_LOOKS, BUG_LOOKS, PALETTES, paintBat, paintBug, paintGlass, paintRoom, paintSpeck } from "./paint";
import { starsOf } from "./game";
import { W } from "./room";
import type { Shared } from "./challenge";

const colors = { ink: "#f3efe3", muted: "#aab4d0", accent: "#ffd166", star: "#f2c230", starOff: "#3a4466", band: "#0a0f20", ask: "#ffd166" };

function star(c: CanvasRenderingContext2D, cx: number, cy: number, r: number, fill: string) {
  c.beginPath();
  for (let i = 0; i < 10; i++) {
    const angle = -Math.PI / 2 + i * Math.PI / 5, radius = i % 2 ? r * 0.45 : r;
    c.lineTo(cx + Math.cos(angle) * radius, cy + Math.sin(angle) * radius);
  }
  c.closePath(); c.fillStyle = fill; c.fill();
}

/** The moment: the bat's mesh lit over the bed, two mosquitoes tumbling, one more (or the boss) still coming. */
function drawMoment(c: CanvasRenderingContext2D, level: number) {
  const row = levelOf(level), p = PALETTES[WORLDS[row.world].look], bx = 112, by = 372;
  paintRoom(c, p, row.net, -40, 120, W + 40);
  paintGlass(c, p, false);
  c.save(); c.translate(266, 364); c.scale(-1, 1); paintBug(c, row.boss ? BOSS_LOOKS[row.world] : BUG_LOOKS[0], 0.7, false); c.restore();
  c.save(); c.translate(54, 412); paintBug(c, BUG_LOOKS[row.world === 1 ? 1 : row.world === 2 ? 2 : 0], 0.2, true); c.restore();
  c.save(); c.translate(bx, by); paintBat(c, true); c.restore();
  c.lineCap = "round"; c.lineWidth = 2;
  for (let i = 0; i < 12; i++) {
    const a = (i / 12) * Math.PI * 2 + 0.2, inner = 36 + (i % 3) * 3, outer = inner + 10 + (i % 2) * 8;
    c.strokeStyle = i % 2 ? "#ffe27a" : "#d6f0ff";
    c.beginPath(); c.moveTo(bx + Math.cos(a) * inner, by + Math.sin(a) * inner * 0.82); c.lineTo(bx + Math.cos(a) * outer, by + Math.sin(a) * outer * 0.82); c.stroke();
  }
  for (const [x, y, r] of [[bx - 8, by + 14, 0.4], [bx + 16, by + 4, 1.4]] as const) { c.save(); c.translate(x, y); c.rotate(r); paintSpeck(c); c.restore(); }
  c.fillStyle = "#ffe27a"; c.font = `800 24px ${DISPLAY_FONT}`; c.textAlign = "left";
  c.fillText("চট!", bx + 52, by - 22);
}

export function drawCard(canvas: HTMLCanvasElement, shared: Shared, format: CardFormat, site: string) {
  const { width, height } = cardSizes[format];
  canvas.width = width; canvas.height = height;
  const c = canvas.getContext("2d");
  if (!c) throw new Error("এই ব্রাউজারে ছবি বানানো যাচ্ছে না।");
  const story = format === "story", cx = width / 2, top = story ? 250 : 0, name = cleanName(shared.name);
  const row = levelOf(shared.level), p = PALETTES[WORLDS[row.world].look];
  const stars = starsOf(shared.level, shared.zaps, shared.bites);
  c.fillStyle = p.wall[1]; c.fillRect(0, 0, width, height);

  fitText(c, [{ text: `মশার রাত · ${levelTitle(shared.level)}`, color: colors.muted, weight: 700, display: true }], cx, top + 92, 38, 960, "center");
  fitText(c, [{ text: `${name ? possessive(name) : "আমার"} ব্যাটে এক রাতে`, color: colors.ink, weight: 800, display: true }], cx, top + 182, 58, 960, "center");
  fitText(c, [{ text: `${bn(shared.zaps)}টা মশা`, color: colors.accent, weight: 800, display: true }], cx, top + 312, 128, 980, "center");
  for (let i = 0; i < 3; i++) star(c, cx + (i - 1) * 84, top + 384, 32, i < stars ? colors.star : colors.starOff);

  // The room, cropped to the bed and the air above it: field y from `fromY` to the floor.
  const shownH = story ? 250 : 200, fromY = 520 - shownH, k = width / W, sceneTop = top + (story ? 450 : 430);
  c.save();
  c.beginPath(); c.rect(0, sceneTop, width, shownH * k); c.clip();
  c.translate(0, sceneTop - fromY * k); c.scale(k, k);
  drawMoment(c, shared.level);
  c.restore();

  const after = sceneTop + shownH * k;
  fitText(c, [{ text: humanLine(shared), color: colors.ink, weight: 800, display: true }], cx, after + (story ? 100 : 72), story ? 52 : 44, 960, "center");
  fitText(c, [{ text: tallyLine(shared), color: colors.muted, weight: 600 }], cx, after + (story ? 168 : 130), story ? 38 : 32, 940, "center");
  drawFooterBand(c, format, "তোমার ব্যাটে কয়টা পড়বে?", site, { band: colors.band, ask: colors.ask, site: "#ffffff" });
}

export const cardBlob = (shared: Shared, format: CardFormat, site: string) => renderCard(canvas => drawCard(canvas, shared, format, site));

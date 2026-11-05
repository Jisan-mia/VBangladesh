// The share card: the winning kick in the top corner, their keeper flat the other way, on the match's own ground.
import { cardSizes, drawFooterBand, fitText, renderCard, type CardFormat } from "../../../shared/card-canvas";
import { possessive } from "../../../shared/bangla";
import { cleanName } from "../../../shared/game-core";
import { GH, GW, GX, GY } from "./swipe";
import { drawBall, drawField, drawKeeper, drawRipple, paletteFor, seatCrowd, drawFan } from "./scene";
import { cupRound, levelOf } from "./levels";
import { humanLine, levelLabel, score, sharedStars, bn } from "./lines";
import type { Shared } from "./challenge";

const colors = { bg: "#f4ecd6", ink: "#1f2a1c", muted: "#5d6b4f", accent: "#1f6f43", star: "#f2a900", starOff: "#ddd3b8", band: "#173d27", ask: "#ffd23f" };

function star(c: CanvasRenderingContext2D, cx: number, cy: number, r: number, fill: string) {
  c.beginPath();
  for (let i = 0; i < 10; i++) {
    const angle = -Math.PI / 2 + i * Math.PI / 5, radius = i % 2 ? r * 0.45 : r;
    c.lineTo(cx + Math.cos(angle) * radius, cy + Math.sin(angle) * radius);
  }
  c.closePath(); c.fillStyle = fill; c.fill();
}

/** The winning kick: ball in the top corner, the net rippling, their keeper flat on the grass the other way, the crowd up. */
function drawMoment(c: CanvasRenderingContext2D, level: number) {
  const palette = paletteFor(level), data = levelOf(level);
  drawField(c, palette, 40, 0);
  const n = 90, cx = new Float32Array(n), cy = new Float32Array(n), cr = new Float32Array(n), cs = new Uint8Array(n), cp = new Float32Array(n);
  const count = seatCrowd(palette, 40, cx, cy, cr, cs, cp);
  for (let i = 0; i < count; i++) drawFan(c, cx[i], cy[i], cr[i], palette.shirts[cs[i]], 2 + (i % 3), i % 2 === 1);
  drawKeeper(c, GX - 58, GY + 2, -1.4, -15, 0, data.team.keeperKit, data.keeper.tall ? 1.28 : 1);
  const bx = GX + 0.78 * GW, by = GY - 0.74 * GH;
  drawRipple(c, bx, by, 0.55);
  drawBall(c, bx, by, 6, 0.4, 0);
}

/** The big line on the card: the score for a shoot-out, "৩/৩" for a drill. */
const bigScore = (shared: Shared) => !shared.legacy && levelOf(shared.level).format !== "shootout" ? `${bn(shared.us)}/৩` : score(shared.us, shared.them);

export function drawCard(canvas: HTMLCanvasElement, shared: Shared, format: CardFormat, site: string) {
  const { width, height } = cardSizes[format];
  canvas.width = width; canvas.height = height;
  const c = canvas.getContext("2d");
  if (!c) throw new Error("এই ব্রাউজারে ছবি বানানো যাচ্ছে না।");
  const story = format === "story", cx = width / 2, top = story ? 250 : 0, stars = sharedStars(shared);
  c.fillStyle = colors.bg; c.fillRect(0, 0, width, height);
  const name = cleanName(shared.name), team = levelOf(shared.level).team.name, drill = !shared.legacy && levelOf(shared.level).format;
  fitText(c, [{ text: `পেনাল্টি কিক · ${cupRound(shared.level)}`, color: colors.muted, weight: 700, display: true }], cx, top + 92, 38, 960, "center");
  const verb = drill === "shots" ? (name ? " জাল কাঁপাল" : " জাল কাঁপালাম") : drill === "saves" ? (name ? " শট ঠেকাল" : " শট ঠেকালাম") : (name ? " হারাল" : " হারালাম");
  fitText(c, [
    { text: name ? `${name} ` : "", color: colors.ink, weight: 800, display: true },
    { text: drill === "shots" || drill === "saves" ? possessive(team) : `${team}কে`, color: colors.accent, weight: 800, display: true },
    { text: verb, color: colors.ink, weight: 800, display: true },
  ], cx, top + 178, 62, 980, "center");
  fitText(c, [{ text: bigScore(shared), color: colors.accent, weight: 800, display: true }], cx, top + 330, 150, 700, "center");
  for (let i = 0; i < 3; i++) star(c, cx + (i - 1) * 80, top + 398, 30, i < stars ? colors.star : colors.starOff);

  // The goal mouth, zoomed: board x 30–330, y 20–196.
  const fromX = 30, fromY = 20, shownW = 300, shownH = 176, k = width / shownW, sceneTop = top + 450;
  c.save();
  c.beginPath(); c.rect(0, sceneTop, width, shownH * k); c.clip();
  c.translate(-fromX * k, sceneTop - fromY * k); c.scale(k, k);
  drawMoment(c, shared.level);
  c.restore();

  const after = sceneTop + shownH * k;
  fitText(c, [{ text: humanLine(shared), color: colors.ink, weight: 800, display: true }], cx, after + (story ? 110 : 52), story ? 56 : 44, 960, "center");
  drawFooterBand(c, format, "তুমি কয় গোলে জিতবে?", site, { band: colors.band, ask: colors.ask, site: "#ffffff" });
}

export const cardBlob = (shared: Shared, format: CardFormat, site: string) => renderCard(canvas => drawCard(canvas, shared, format, site));
export const cardLabel = (shared: Shared) => `${levelLabel(shared.level)}, ${levelOf(shared.level).team.name}`;

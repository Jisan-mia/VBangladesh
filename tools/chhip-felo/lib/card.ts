// The share card: the basket's weight, the stars, and the biggest fish held up over the world's water.
import { cardSizes, drawFooterBand, fitText, renderCard, type CardFormat } from "../../../shared/card-canvas";
import { possessive } from "../../../shared/bangla";
import { cleanName } from "../../../shared/game-core";
import { drawBasket, drawFish, PALETTES } from "./art";
import type { Shared } from "./challenge";
import { bossOf, levelDef, starsOf } from "./levels";
import { bn, humanLine, levelLabel, weightText, worldName } from "./lines";
import { FISH } from "./species";

export const palette = { ink: "#17302a", muted: "#4d6660", red: "#c2352b", star: "#f2a900", starOff: "#d6d0bd", band: "#17463c", ask: "#ffd166" };

function star(c: CanvasRenderingContext2D, cx: number, cy: number, r: number, fill: string) {
  c.beginPath();
  for (let i = 0; i < 10; i++) {
    const angle = -Math.PI / 2 + (i * Math.PI) / 5, radius = i % 2 ? r * 0.45 : r;
    c.lineTo(cx + Math.cos(angle) * radius, cy + Math.sin(angle) * radius);
  }
  c.closePath(); c.fillStyle = fill; c.fill();
}

export function drawCard(canvas: HTMLCanvasElement, shared: Shared, format: CardFormat, site: string) {
  const { width, height } = cardSizes[format];
  canvas.width = width; canvas.height = height;
  const c = canvas.getContext("2d");
  if (!c) throw new Error("এই ব্রাউজারে ছবি বানানো যাচ্ছে না।");
  const def = levelDef(shared.level), p = PALETTES[def.world], story = format === "story", cx = width / 2, top = story ? 250 : 0;
  const stars = starsOf(shared.won, shared.lost, shared.mode), name = cleanName(shared.name), boss = shared.boss ? bossOf(def) : null;
  c.fillStyle = p.sky[0]; c.fillRect(0, 0, width, height);
  fitText(c, [{ text: `ছিপ ফেলো · ${worldName(shared.level)} · ${levelLabel(shared.level)}`, color: palette.muted, weight: 700, display: true }], cx, top + 96, 38, 960, "center");
  fitText(c, [{ text: boss ? `${name ? possessive(name) : "আমার"} ছিপে ${boss.name}` : name ? `${possessive(name)} ঝুড়িতে` : "আমার ঝুড়িতে", color: palette.ink, weight: 800, display: true }], cx, top + 186, 60, 960, "center");
  fitText(c, [{ text: shared.catches ? weightText(shared.grams) : "আজ খালি", color: palette.red, weight: 800, display: true }], cx, top + 292, 100, 980, "center");
  if (!shared.old) for (let i = 0; i < 3; i++) star(c, cx + (i - 1) * 84, top + 366, 32, i < stars ? palette.star : palette.starOff);

  const waterTop = top + (story ? 520 : 470), waterBottom = waterTop + (story ? 560 : 440);
  const g = c.createLinearGradient(0, waterTop, 0, waterBottom);
  g.addColorStop(0, p.water[0]); g.addColorStop(1, p.water[1]);
  c.fillStyle = g; c.fillRect(0, waterTop, width, waterBottom - waterTop);
  c.strokeStyle = "rgba(255,255,255,0.22)"; c.lineWidth = 4;
  for (let i = 0; i < 7; i++) { const y = waterTop + 60 + i * 52, x = 80 + ((i * 263) % 760); c.beginPath(); c.moveTo(x, y); c.lineTo(x + 90, y); c.stroke(); }
  c.fillStyle = p.grass; c.fillRect(0, waterBottom, width, 60);
  c.fillStyle = p.earth; c.fillRect(0, waterBottom, width, 14);
  drawBasket(c, width - 150, waterBottom + 10, 3.4);

  const fishY = waterTop + (story ? 210 : 170);
  if (shared.catches && FISH[shared.big]) {
    const fish = FISH[shared.big];
    c.fillStyle = "rgba(255,255,255,0.75)";
    for (const [dx, dy, r] of [[-200, 140, 10], [-90, 170, 8], [40, 150, 12], [170, 175, 9], [250, 130, 7]] as const) { c.beginPath(); c.ellipse(cx + dx, fishY + dy, r * 0.7, r, 0, 0, Math.PI * 2); c.fill(); }
    c.save(); c.translate(cx, fishY); c.rotate(-0.12);
    drawFish(c, 0, 0, (story ? 720 : 640) * (boss ? 1.08 : 1), fish);
    c.restore();
    fitText(c, [{ text: boss ? boss.name : `সবচেয়ে বড়: ${fish.name}`, color: "#ffffff", weight: 800, display: true }], cx, waterBottom - 50, story ? 54 : 46, 900, "center");
  } else {
    c.strokeStyle = "rgba(255,255,255,0.6)"; c.lineWidth = 5;
    for (const r of [60, 110, 160]) { c.beginPath(); c.ellipse(cx, fishY + 60, r, r * 0.3, 0, 0, Math.PI * 2); c.stroke(); }
    c.fillStyle = "#f4f1ea"; c.fillRect(cx - 16, fishY - 10, 32, 60);
    c.fillStyle = palette.red; c.beginPath(); c.ellipse(cx, fishY - 30, 22, 36, 0, 0, Math.PI * 2); c.fill();
  }
  const after = waterBottom + (story ? 150 : 120);
  fitText(c, [{ text: humanLine(shared), color: palette.ink, weight: 800, display: true }], cx, after, story ? 50 : 44, 960, "center");
  const tally = shared.old ? `${bn(shared.catches)}টা মাছ` : `${bn(shared.catches)}টা মাছ · ${bn(shared.lost)}টা টোপ গেছে`;
  fitText(c, [{ text: tally, color: palette.muted, weight: 600 }], cx, after + (story ? 76 : 66), story ? 38 : 34, 900, "center");
  drawFooterBand(c, format, "তুমি কত কেজি তুলবে?", site, { band: palette.band, ask: palette.ask, site: "#ffffff" });
}

export const cardBlob = (shared: Shared, format: CardFormat, site: string) => renderCard(canvas => drawCard(canvas, shared, format, site));

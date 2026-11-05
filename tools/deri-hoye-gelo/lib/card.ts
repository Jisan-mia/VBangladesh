// The share card: the world's lane and light, the kid mid-leap over that world's obstacle, the মিটার big in the sky,
// the level and its stars, and one stats line. The shared helpers draw the footer, so every card on the site reads the same.
import { cardSizes, drawFooterBand, fitText, renderCard, wrapText, BODY_FONT, type CardFormat } from "../../../shared/card-canvas";
import {
  drawBike, drawCow, drawGateFrame, drawGateLeaf, drawKid, drawMilestone, drawMud, jumpUpPose, paintBrickTile, paintPavement, paintTown,
  paintVillageLane, paintWetDirt, paintWorldSky, STRIP_H, TILE, WORLD_ART,
} from "./art";
import { girlFor, GATE_M } from "./course";
import { levelDef, MODE_INFO, type Mode } from "./levels";
import { bn, headline, humanLine, seconds } from "./link";

export type Card = { seed: number; meters: number; name: string; level: number; mode: Mode; stars: number; won: boolean; stumbles: number; pages: number; tenths: number; slow: boolean };

const NAVY = "#1f2a44", RED = "#b23a2e", CREAM = "#fff7e6";

function star(c: CanvasRenderingContext2D, x: number, y: number, r: number, on: boolean) {
  c.beginPath();
  for (let i = 0; i < 10; i++) { const a = -Math.PI / 2 + i * Math.PI / 5, d = i % 2 ? r * 0.45 : r; c.lineTo(x + Math.cos(a) * d, y + Math.sin(a) * d); }
  c.closePath();
  c.fillStyle = on ? "#ffc93c" : "#ffffff88"; c.fill();
  c.lineWidth = 4; c.strokeStyle = on ? "#a86f00" : "#1f2a4455"; c.stroke();
}

export function drawCard(canvas: HTMLCanvasElement, card: Card, format: CardFormat, site: string) {
  const { width, height } = cardSizes[format];
  canvas.width = width; canvas.height = height;
  const c = canvas.getContext("2d");
  if (!c) throw new Error("এই ব্রাউজারে ছবি বানানো যাচ্ছে না।");
  const def = levelDef(card.level), world = card.level ? def.world : 0, night = world === 2;
  const story = format === "story";
  const top = story ? 250 : 0, ground = story ? 1390 : 980, footer = story ? height - 260 : height - 96, cx = width / 2;
  const scale = 3;

  // The world's sky (the text sits on it), its far strip and its road.
  c.save(); c.scale(width / 360, (ground - 90) / 360); paintWorldSky(c, 360, 360, world); c.restore();
  const far = 3.4;
  c.save(); c.translate(-260, ground - 92 - STRIP_H * far); c.scale(far, far);
  if (world === 1) paintTown(c, 720, STRIP_H, `700 7.5px ${BODY_FONT}`); else paintVillageLane(c);
  if (WORLD_ART[world].wash) { c.globalCompositeOperation = "source-atop"; c.fillStyle = WORLD_ART[world].wash; c.fillRect(0, 0, 720, STRIP_H); c.globalCompositeOperation = "source-over"; }
  c.restore();
  const tile = 5;
  for (let x = 0; x < width; x += TILE * tile) {
    c.save(); c.translate(x, ground - 90); c.scale(tile, tile);
    if (world === 1) paintPavement(c, TILE); else if (world === 2) paintWetDirt(c, TILE); else paintBrickTile(c);
    c.restore();
  }
  c.fillStyle = WORLD_ART[world].verge; c.fillRect(0, ground - 90 + 62 * tile - 2, width, Math.max(0, footer - (ground - 90 + 62 * tile - 2)));

  // The gate if you made it (shut behind you), else a road stone with how far it still was.
  const gate = card.level ? def.gate : GATE_M;
  if (card.won || (!card.level && card.meters >= GATE_M)) {
    c.save(); c.translate(860, ground - 70); c.scale(3.2, 3.2); drawGateFrame(c, "স্কুল", `700 9px ${BODY_FONT}`);
    c.save(); c.translate(-48, 0); c.scale(0.9, 1); drawGateLeaf(c); c.restore();
    c.save(); c.translate(48, 0); c.scale(-0.9, 1); drawGateLeaf(c); c.restore();
    c.restore();
  } else {
    c.save(); c.translate(905, ground - 64); c.scale(7, 7); drawMilestone(c); c.restore();
    fitText(c, [{ text: "গেট", color: "#3a3226", weight: 700 }], 905, ground - 64 - 60, 34, 90, "center");
    fitText(c, [{ text: `${bn(Math.max(0, gate - card.meters))} মি`, color: "#3a3226", weight: 800, display: true }], 905, ground - 64 - 18, 30, 92, "center");
  }

  // Speed lines behind the kid, the world's obstacle below, the kid at the top of the leap.
  c.strokeStyle = "#ffffffb3"; c.lineCap = "round";
  for (const [x, y, w] of [[300, ground - 300, 64], [280, ground - 252, 80]] as const) { c.lineWidth = 7; c.beginPath(); c.moveTo(x, y); c.lineTo(x + w, y); c.stroke(); }
  c.save(); c.translate(560, ground); c.scale(5.6, 5.6);
  if (world === 1) drawBike(c); else if (world === 2) { c.scale(1.2, 1.4); drawMud(c, 100); } else drawCow(c);
  c.restore();
  c.fillStyle = "#3a2a1a22"; c.beginPath(); c.ellipse(470, ground + 6, 70, 12, 0, 0, Math.PI * 2); c.fill();
  c.save(); c.translate(470, ground - 236); c.scale(4.9, 4.9); drawKid(c, jumpUpPose, girlFor(card.seed)); c.restore();

  const ink = night ? "#f4f6fb" : NAVY, accent = night ? "#ffd166" : RED;
  fitText(c, [{ text: "দেরি হয়ে গেল!", color: accent, weight: 800, display: true }, ...(card.name ? [{ text: ` · ${card.name}`, color: ink, weight: 700, display: true }] : [])], cx, top + 110, 54, 920, "center");
  fitText(c, [{ text: bn(card.meters), color: ink, weight: 800, display: true }, { text: " মিটার", color: ink, weight: 700, display: true }], cx, top + 262, 150, 940, "center");
  fitText(c, [{ text: headline(card.level, card.won, card.meters), color: accent, weight: 700, display: true }], cx, top + 342, 50, 900, "center");
  fitText(c, [{ text: card.level ? `লেভেল ${bn(card.level)} · ${def.name} · ${def.title}` : "যত দূর পারো", color: ink, weight: 700, display: true }], cx, top + 410, 38, 900, "center");

  const panelY = footer - (story ? 200 : 160), panelH = story ? 170 : 140;
  // The stars sit on the road, above the line of words.
  if (card.level && card.won) for (let i = 0; i < 3; i++) star(c, cx + (i - 1) * 84, panelY - 38, 34, i < card.stars);
  c.fillStyle = "#fff7e6eb";
  c.beginPath(); c.roundRect(70, panelY, width - 140, panelH, 28); c.fill();
  c.font = `700 40px ${BODY_FONT}`;
  const lines = wrapText(c, humanLine({ level: card.level, won: card.won, stumbles: card.stumbles, pages: card.pages, meters: card.meters }), 860, 2);
  lines.forEach((line, index) => fitText(c, [{ text: line, color: NAVY, weight: 700 }], cx, panelY + panelH / 2 - 6 + (index - (lines.length - 1) / 2) * 50, 40, 880, "center"));
  const extras = [card.tenths ? `${seconds(card.tenths)} সেকেন্ড` : "", card.level ? `হোঁচট ${bn(card.stumbles)}` : "", card.level ? `পাতা ${bn(card.pages)}/৩` : "", card.mode !== "n" ? MODE_INFO[card.mode].name : "", card.slow ? "ধীরে খেলায়" : ""].filter(Boolean).join(" · ");
  fitText(c, [{ text: `নিজের ফোনে খেলা${extras ? ` · ${extras}` : ""}`, color: "#5b6478", weight: 600 }], cx, panelY + panelH - 22, 26, 860, "center");
  drawFooterBand(c, format, card.level ? "তুমি ঘণ্টার আগে পারবে?" : "তুমি কত দূর যাবে?", site, { band: NAVY, ask: "#ffd166", site: CREAM });
}

export const cardBlob = (card: Card, format: CardFormat, site: string) => renderCard(canvas => drawCard(canvas, card, format, site));

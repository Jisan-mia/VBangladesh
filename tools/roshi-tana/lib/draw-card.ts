import { cardSizes, drawFooterBand, fitText, renderCard, type CardFormat, type Segment } from "../../../shared/card-canvas";
import { cleanName } from "../../../shared/game-core";
import { drawBackground, drawScene, makeField } from "./art";
import { beatsText, bn, duoLine, duoTeam, duoTitle, humanLine, levelLabel, type DuoWin, type Shared } from "./link";
import { starsOf } from "./rope";
import { teamOf, US } from "./teams";

export const CARD = { bg: "#f7f0dc", ink: "#2a1d14", muted: "#6b5a44", accent: "#c2410c", star: "#f2a900", starOff: "#ddd2b6", band: "#3b2414", ask: "#ffd166" };

export type Card = { kicker: string; title: Segment[]; big: string; stars: number | null; line: string; ask: string; winner: 0 | 1; bottom: string; top: string };

export function soloCard(shared: Shared): Card {
  const name = cleanName(shared.name), team = teamOf(shared.level);
  return {
    kicker: `রশি টানাটানি · ${levelLabel(shared.level)}`,
    title: [
      { text: name ? `${name} ` : "আমরা ", color: CARD.ink, weight: 800, display: true },
      { text: team.obj, color: CARD.accent, weight: 800, display: true },
      { text: name ? " হারাল" : " হারালাম", color: CARD.ink, weight: 800, display: true },
    ],
    big: beatsText(shared.beats), stars: starsOf(shared.level, shared.beats),
    line: `${humanLine(shared)} ${bn(shared.hits)}টা টান ঠিক তালে।`,
    ask: "তুমি কয় টানে পারবে?", winner: 0, bottom: US.shirt, top: team.shirt,
  };
}

export function duoCard(win: DuoWin): Card {
  return {
    kicker: "রশি টানাটানি · দুজনে এক ফোনে",
    title: [{ text: duoTitle(win), color: CARD.accent, weight: 800, display: true }],
    big: beatsText(win.beats), stars: null, line: duoLine(win.beats),
    ask: "তোমরা দুজনে খেলবে?", winner: win.winner, bottom: duoTeam(0).shirt, top: duoTeam(1).shirt,
  };
}

function star(c: CanvasRenderingContext2D, cx: number, cy: number, r: number, fill: string) {
  c.beginPath();
  for (let i = 0; i < 10; i++) {
    const angle = -Math.PI / 2 + i * Math.PI / 5, radius = i % 2 ? r * 0.45 : r;
    c.lineTo(cx + Math.cos(angle) * radius, cy + Math.sin(angle) * radius);
  }
  c.closePath(); c.fillStyle = fill; c.fill();
}

export function drawCard(canvas: HTMLCanvasElement, card: Card, format: CardFormat, site: string) {
  const { width, height } = cardSizes[format];
  canvas.width = width; canvas.height = height;
  const c = canvas.getContext("2d");
  if (!c) throw new Error("এই ব্রাউজারে ছবি বানানো যাচ্ছে না।");
  const story = format === "story", cx = width / 2, top = story ? 250 : 0;
  c.fillStyle = CARD.bg; c.fillRect(0, 0, width, height);
  fitText(c, [{ text: card.kicker, color: CARD.muted, weight: 700, display: true }], cx, top + 92, 38, 960, "center");
  fitText(c, card.title, cx, top + 178, 64, 980, "center");
  fitText(c, [{ text: card.big, color: CARD.accent, weight: 800, display: true }], cx, top + 320, 140, 900, "center");
  if (card.stars !== null) for (let i = 0; i < 3; i++) star(c, cx + (i - 1) * 80, top + 392, 30, i < card.stars ? CARD.star : CARD.starOff);

  // The finish from the side of the field: the rope runs across the card, the winners pulling the ribbon onto their line.
  const sceneTop = top + 440, sceneH = story ? 760 : 560, size = sceneH / 150, field = makeField(sceneH, width, 32 * size, 25 * size, size);
  c.save();
  c.beginPath(); c.rect(0, sceneTop, width, sceneH); c.clip();
  c.translate(0, sceneTop + sceneH); c.rotate(-Math.PI / 2);
  drawBackground(c, field);
  drawScene(c, field, { x: card.winner === 0 ? 1 : -1, lean0: card.winner === 0 ? 1 : 0, lean1: card.winner === 1 ? 1 : 0 }, card.bottom, card.top);
  c.restore();

  fitText(c, [{ text: card.line, color: CARD.ink, weight: 800, display: true }], cx, sceneTop + sceneH + (story ? 120 : 76), story ? 50 : 42, 980, "center");
  drawFooterBand(c, format, card.ask, site, { band: CARD.band, ask: CARD.ask, site: "#ffffff" });
}

export const cardBlob = (card: Card, format: CardFormat, site: string) => renderCard(canvas => drawCard(canvas, card, format, site));

// The share card: a run of steps in the floor's world colours, the marble mid-roll in the player's colour, the floor and its
// stars, the time and one line. An old link's card keeps the old steps format.
import { cardSizes, drawFooterBand, fitText, renderCard, roundedRect, type CardFormat } from "../../../shared/card-canvas";
import { cleanName } from "../../../shared/game-core";
import { STAGE_COUNT, STAGES } from "./legacy";
import { LEVEL_COUNT, levelOf, MARBLES } from "./levels";
import { bn, floorLabel, floorLine, oldLine, reachedStage, seconds, starsOfFalls, type Shared } from "./link";
import { PALETTES, paintLedge, paintMarble, paintPick, paintPot, paintSky, paintWallTile, type Look } from "./art";
import { CONCRETE, PARAPET, PLANK, W } from "./physics";

const colors = { bg: "#f3ede0", ink: "#1f2b2a", muted: "#5b6763", accent: "#2e7d6b", chipOff: "#ddd5c4", band: "#1d3b35", ask: "#ffd166", star: "#e8a317" };
const looks: Look[] = ["roof", "stairs", "scaffold"];
const kinds = [PARAPET, CONCRETE, PLANK];

/** Four steps down to the right, the marble rolling off the second, a pot and two marbles on the way. */
function drawStairs(c: CanvasRenderingContext2D, look: Look, kind: number, colour: number) {
  const p = PALETTES[look];
  paintSky(c, p, 240); paintWallTile(c, look, p);
  const steps = [[18, 138, 72], [104, 224, 118], [168, 288, 164], [236, 356, 210]] as const;
  steps.forEach(([x0, x1, y]) => paintLedge(c, kind, x0, x1 - x0, y, false));
  paintPot(c, 330, 210);
  paintPick(c, 70, 65, 3); paintPick(c, 200, 157, 5);
  paintMarble(c, 232, 104, 0.9, colour, 13);
}

export function drawCard(canvas: HTMLCanvasElement, card: Shared, format: CardFormat, site: string) {
  const { width, height } = cardSizes[format];
  canvas.width = width; canvas.height = height;
  const c = canvas.getContext("2d");
  if (!c) throw new Error("এই ব্রাউজারে ছবি বানানো যাচ্ছে না।");
  const story = format === "story", cx = width / 2, top = story ? 250 : 0, name = cleanName(card.name);
  c.fillStyle = colors.bg; c.fillRect(0, 0, width, height);
  const old = card.v === 1, reached = old ? reachedStage(card.score, card.stage) : 0;
  const world = old ? (reached <= 1 ? 0 : reached <= 4 ? 1 : 2) : levelOf(card.level).world;

  fitText(c, [{ text: old ? `মার্বেল-সিঁড়ি · শুরু ${STAGES[card.stage - 1].name} থেকে` : `মার্বেল-সিঁড়ি · ${floorLabel(card.level)}`, color: colors.muted, weight: 700, display: true }], cx, top + 88, 38, 960, "center");
  fitText(c, [{ text: old ? (name ? `${name} নামল` : "নামলাম") : (name ? `${name} পার করল` : "পার করলাম"), color: colors.ink, weight: 800, display: true }], cx, top + 170, 60, 960, "center");
  if (old) {
    fitText(c, [{ text: bn(card.score), color: colors.accent, weight: 800, display: true }, { text: " ধাপ", color: colors.ink, weight: 800, display: true }], cx, top + 318, 140, 900, "center");
  } else {
    fitText(c, [{ text: seconds(card.tenths), color: colors.accent, weight: 800, display: true }, { text: " সেকেন্ডে", color: colors.ink, weight: 800, display: true }], cx, top + 318, 124, 900, "center");
  }
  const sub = old ? (card.marbles ? `পথে ${bn(card.marbles)}টা মার্বেল কুড়ানো` : `${STAGES[reached].name} পর্যন্ত`)
    : `${"★".repeat(starsOfFalls(card.falls))}${"☆".repeat(3 - starsOfFalls(card.falls))}${card.marbles ? ` · ${bn(card.marbles)}টা মার্বেল কুড়ানো` : ""}`;
  fitText(c, [{ text: sub, color: old ? colors.muted : colors.star, weight: 700 }], cx, top + 386, 38, 900, "center");

  // The scene: the full board width, 200 board units tall (240 on a story), scaled to the card's width.
  const k = width / W, sceneTop = top + (story ? 440 : 420), shown = story ? 240 : 200, from = story ? 0 : 30;
  c.save();
  c.beginPath(); c.rect(0, sceneTop, width, shown * k); c.clip();
  c.translate(0, sceneTop - from * k); c.scale(k, k);
  drawStairs(c, card.v === 2 && card.level === LEVEL_COUNT ? "alley" : looks[world], kinds[world], Math.max(0, Math.min(MARBLES.length - 1, card.colour)));
  c.restore();

  // The chips: the old eight stages (those this run passed through filled), or the floor's world of four.
  const count = old ? STAGE_COUNT : 4, stripTop = sceneTop + shown * k + (story ? 40 : 28), gap = 10, chip = (width - 80 - gap * (count - 1)) / count;
  for (let i = 0; i < count; i++) {
    const x = 40 + i * (chip + gap), level = world * 4 + i + 1;
    const on = old ? i >= card.stage - 1 && i <= reached : level <= card.level;
    c.fillStyle = on ? colors.accent : colors.chipOff;
    roundedRect(c, x, stripTop, chip, story ? 64 : 54, 14); c.fill();
    fitText(c, [{ text: old ? STAGES[i].name : levelOf(level).name, color: on ? "#ffffff" : colors.muted, weight: 700 }], x + chip / 2, stripTop + (story ? 42 : 36), story ? 24 : 21, chip - 12, "center");
  }
  fitText(c, [{ text: old ? oldLine(card.score, card.stage) : floorLine(card.level), color: colors.ink, weight: 800, display: true }], cx, stripTop + (story ? 160 : 108), story ? 50 : 42, 980, "center");
  drawFooterBand(c, format, old ? "তুমি কত ধাপ নামবে?" : "তুমি কত তাড়াতাড়ি নামবে?", site, { band: colors.band, ask: colors.ask, site: "#ffffff" });
}

export const cardBlob = (card: Shared, format: CardFormat, site: string) => renderCard(canvas => drawCard(canvas, card, format, site));

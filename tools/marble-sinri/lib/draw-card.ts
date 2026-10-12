import { cardSizes, drawFooterBand, fitText, renderCard, roundedRect, type CardFormat } from "../../../shared/card-canvas";
import { cleanName } from "../../../shared/game-core";
import { drawBackground, drawLedge, drawMarble, drawPick, drawPot } from "./art";
import { STAGE_COUNT, STAGES, type Kind } from "./game";
import { bn, humanLine, reachedStage, type Card } from "./result";

const colors = { bg: "#f3ede0", ink: "#1f2b2a", muted: "#5b6763", accent: "#2e7d6b", chipOff: "#ddd5c4", band: "#1d3b35", ask: "#ffd166" };

/** A run of steps down to the right, the marble rolling off the third, a pot and two marbles on the way. */
function drawStairs(c: CanvasRenderingContext2D, stage: number, colour: number) {
  drawBackground(c, stage);
  const kinds: Kind[] = [STAGES[Math.max(0, stage - 1)].kind, STAGES[stage].kind, STAGES[stage].kind, STAGES[Math.min(STAGE_COUNT - 1, stage + 1)].kind];
  const steps = [[18, 138, 72], [104, 224, 118], [168, 288, 164], [236, 356, 210]] as const;
  steps.forEach(([x0, x1, y], index) => drawLedge(c, kinds[index], x0, x1, y));
  drawPot(c, 320, 210);
  drawPick(c, 70, 72, 3);
  drawPick(c, 200, 164, 5);
  drawMarble(c, 232, 104, 0.9, colour, 13);
}

export function drawCard(canvas: HTMLCanvasElement, card: Card, format: CardFormat, site: string) {
  const { width, height } = cardSizes[format];
  canvas.width = width; canvas.height = height;
  const c = canvas.getContext("2d");
  if (!c) throw new Error("এই ব্রাউজারে ছবি বানানো যাচ্ছে না।");
  const story = format === "story", cx = width / 2, top = story ? 250 : 0, reached = reachedStage(card.score, card.stage), name = cleanName(card.name);
  c.fillStyle = colors.bg; c.fillRect(0, 0, width, height);

  fitText(c, [{ text: `মার্বেল-সিঁড়ি · শুরু ${STAGES[card.stage - 1].name} থেকে`, color: colors.muted, weight: 700, display: true }], cx, top + 88, 38, 960, "center");
  fitText(c, [
    { text: name ? `${name} ` : "", color: colors.ink, weight: 800, display: true },
    { text: name ? "নামল" : "নামলাম", color: colors.ink, weight: 800, display: true },
  ], cx, top + 170, 60, 960, "center");
  fitText(c, [
    { text: bn(card.score), color: colors.accent, weight: 800, display: true },
    { text: " ধাপ", color: colors.ink, weight: 800, display: true },
  ], cx, top + 318, 140, 900, "center");
  fitText(c, [{ text: card.marbles ? `পথে ${bn(card.marbles)}টা মার্বেল কুড়ানো` : `${STAGES[reached].name} পর্যন্ত`, color: colors.muted, weight: 700 }], cx, top + 386, 38, 900, "center");

  // The scene: the full board width, 200 board units tall (240 on a story), scaled to the card's width.
  const k = width / 360, sceneTop = top + (story ? 440 : 420), shown = story ? 240 : 200, from = story ? 0 : 30;
  c.save();
  c.beginPath(); c.rect(0, sceneTop, width, shown * k); c.clip();
  c.translate(0, sceneTop - from * k); c.scale(k, k);
  drawStairs(c, reached, card.colour);
  c.restore();

  // The eight stages: the ones this run passed through are filled.
  const stripTop = sceneTop + shown * k + (story ? 40 : 28), gap = 10, chip = (width - 80 - gap * (STAGE_COUNT - 1)) / STAGE_COUNT;
  for (let i = 0; i < STAGE_COUNT; i++) {
    const x = 40 + i * (chip + gap), on = i >= card.stage - 1 && i <= reached;
    c.fillStyle = on ? colors.accent : colors.chipOff;
    roundedRect(c, x, stripTop, chip, story ? 64 : 54, 14); c.fill();
    fitText(c, [{ text: STAGES[i].name, color: on ? "#ffffff" : colors.muted, weight: 700 }], x + chip / 2, stripTop + (story ? 42 : 36), story ? 24 : 21, chip - 12, "center");
  }
  fitText(c, [{ text: humanLine(card.score, card.stage), color: colors.ink, weight: 800, display: true }], cx, stripTop + (story ? 160 : 108), story ? 50 : 42, 980, "center");
  drawFooterBand(c, format, "তুমি কত ধাপ নামবে?", site, { band: colors.band, ask: colors.ask, site: "#ffffff" });
}

export const cardBlob = (card: Card, format: CardFormat, site: string) => renderCard(canvas => drawCard(canvas, card, format, site));

// The share card: the stage reached, big, on a patch of grass, with the whole road from আঁটি to বাগান underneath.
import { cardSizes, drawFooterBand, fitText, renderCard, type CardFormat, type Segment } from "../../../shared/card-canvas";
import { possessive } from "../../../shared/bangla";
import { cleanName } from "../../../shared/game-core";
import { drawStage, palette } from "./art";
import { stageName, TOP } from "./board";
import type { Shared } from "./challenge";
import { finaleName, levelAt } from "./levels";
import { bn, stageLine } from "./words";

export type CardData = Pick<Shared, "v" | "kind" | "level" | "count" | "score" | "top" | "stars" | "name">;

/** "আঁটি থেকে আম · লেভেল ৮ · শিলাবৃষ্টি" */
export function cardKicker(data: CardData) {
  if (data.kind === "garden") return "আঁটি থেকে আম · খোলা বাগান";
  if (data.v === 1) return `আঁটি থেকে আম · লেভেল ${bn(data.level)}`;
  return `আঁটি থেকে আম · লেভেল ${bn(data.level)} · ${finaleName(data.level) || levelAt(data.level).name}`;
}

export function drawCard(canvas: HTMLCanvasElement, data: CardData, format: CardFormat, site: string) {
  const { width, height } = cardSizes[format];
  canvas.width = width;
  canvas.height = height;
  const c = canvas.getContext("2d");
  if (!c) throw new Error("এই ব্রাউজারে ছবি বানানো যাচ্ছে না।");
  const story = format === "story", cx = width / 2, y0 = story ? 300 : 0, level = data.kind === "level";
  c.fillStyle = palette.paper;
  c.fillRect(0, 0, width, height);
  const name = cleanName(data.name), stage = data.top;
  fitText(c, [{ text: cardKicker(data), color: palette.muted, weight: 700, display: true }], cx, y0 + 96, 40, 940, "center");
  const headline: Segment[] = level
    ? [
      { text: name ? `${name} ` : "", color: palette.ink, weight: 700, display: true },
      { text: `${bn(data.count)} চালে`, color: palette.band, weight: 800, display: true },
      { text: name ? " পার করেছে" : " পার করলাম", color: palette.ink, weight: 700, display: true },
    ]
    : [
      { text: name ? `${possessive(name)} বাগানে ` : "আমার বাগানে ", color: palette.ink, weight: 700, display: true },
      { text: stageName(stage), color: palette.band, weight: 800, display: true },
    ];
  fitText(c, headline, cx, y0 + 196, 88, 960, "center");
  fitText(c, [0, 1, 2].map(index => ({ text: "★", color: index < data.stars ? palette.star : "#d9ceb6", weight: 700 })), cx, y0 + 268, 50, 600, "center");

  const art = story ? 560 : 500, top = y0 + 300;
  c.fillStyle = "#e3edc9";
  c.beginPath(); c.arc(cx, top + art / 2, art / 2 + 26, 0, Math.PI * 2); c.fill();
  drawStage(c, stage, cx - art / 2, top, art);

  const below = top + art + 70;
  fitText(c, [{ text: level ? `${bn(data.count)} চাল · ${stageName(stage)} পর্যন্ত` : `${bn(data.score)} পয়েন্ট · ${bn(data.count)} চাল`, color: palette.ink, weight: 700 }], cx, below, 46, 940, "center");
  const step = 106, size = 92, left = cx - (step * TOP) / 2 + (step - size) / 2, roadY = below + 34;
  for (let index = 0; index < TOP; index++) {
    c.globalAlpha = index < data.top ? 1 : 0.22;
    drawStage(c, index + 1, left + index * step, roadY, size);
  }
  c.globalAlpha = 1;
  fitText(c, [{ text: stageLine(stage), color: palette.muted, weight: 600 }], cx, roadY + size + 62, 44, 940, "center");
  drawFooterBand(c, format, level ? "তুমি কত চালে পারবে?" : "তুমি আঁটি থেকে কতদূর যাবে?", site, { band: palette.band, ask: palette.trim, site: "#ffffff" });
}

export const cardBlob = (data: CardData, format: CardFormat, site: string) => renderCard(canvas => drawCard(canvas, data, format, site));

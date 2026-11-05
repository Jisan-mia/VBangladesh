// The "আব্বু-আম্মুকে দেখাও" card: the picture the ছড়া built, its lines with the rhyme ends in colour, stars, no name. 1080×1350.
import { cardSizes, drawFooterBand, fitText, renderCard, roundedRect, type Segment } from "../../../shared/card-canvas";
import { levelOf, rhymeForLevel, worldOf } from "./levels";
import { bare, groupOf, wordsOf } from "./poems";
import { sceneDocument } from "./scenes";

export type CardData = { level: number; stars: number; hits: number };

const bnDigits = new Intl.NumberFormat("bn-BD", { useGrouping: false });
export const bn = (value: number) => bnDigits.format(value);

/** The words on the card, pure so tests can pin them. */
export function cardText(data: CardData) {
  const level = levelOf(data.level), rhyme = rhymeForLevel(data.level), world = worldOf(data.level);
  return {
    label: `ছড়ার তালে · ${level.finale ?? rhyme.name}`,
    title: `আজ ${bn(rhyme.lines.length)} লাইনের ছড়া তালে তালে বললাম`,
    drum: data.hits ? `ঢোলে ${bn(data.hits)} বার তাল` : "ঢোলের তাল শুনলাম",
    world: world.name,
  };
}

/** The fixed result behind `#og`, for the site's preview image only: it saves nothing and skips the daily limit. */
export const OG_DEMO = { level: 1, stars: 3, hits: 26 };
export const isOgHash = (hash: string) => hash === "#og";

export const FOOTER = "ছড়াটা একসাথে বলো, হাতে তালি দিয়ে";

// One colour per rhyme pair, the same three the screen uses for the beads.
export const RHYME_COLORS = ["#b4441c", "#2f6fd0", "#14705a"] as const;

const colors = { bg: "#fbf3e2", tile: "#fffaf0", edge: "#ecd9b4", ink: "#3a2a1c", accent: "#b4441c", star: "#f2a900", starOff: "#e7dbc2", band: "#4a2412" };

/** Decodes the finished scene from a data: URL (nothing is fetched). */
export async function loadScene(rhymeId: string) {
  const image = new Image();
  image.src = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(sceneDocument(rhymeId))}`;
  await image.decode();
  return image;
}

function star(c: CanvasRenderingContext2D, cx: number, cy: number, r: number, fill: string) {
  c.beginPath();
  for (let i = 0; i < 10; i++) {
    const angle = -Math.PI / 2 + i * Math.PI / 5, radius = i % 2 ? r * 0.45 : r;
    c.lineTo(cx + Math.cos(angle) * radius, cy + Math.sin(angle) * radius);
  }
  c.closePath(); c.fillStyle = fill; c.fill();
}

export function drawCard(canvas: HTMLCanvasElement, data: CardData, scene: HTMLImageElement | null, site: string) {
  const { width, height } = cardSizes.feed;
  canvas.width = width; canvas.height = height;
  const c = canvas.getContext("2d");
  if (!c) throw new Error("এই ব্রাউজারে ছবি বানানো যাচ্ছে না।");
  const text = cardText(data), rhyme = rhymeForLevel(data.level);
  c.fillStyle = colors.bg; c.fillRect(0, 0, width, height);
  fitText(c, [{ text: text.label, color: colors.accent, weight: 700, display: true }], width / 2, 100, 40, 900, "center");
  fitText(c, [{ text: text.title, color: colors.ink, weight: 800, display: true }], width / 2, 182, 56, 960, "center");
  for (let i = 0; i < 3; i++) star(c, width / 2 + (i - 1) * 76, 250, 30, i < data.stars ? colors.star : colors.starOff);

  // The picture the ছড়া built, framed like a printed card.
  roundedRect(c, 120, 300, 840, 535, 8); c.fillStyle = "#fff"; c.fill();
  c.lineWidth = 6; c.strokeStyle = colors.accent; c.stroke();
  if (scene) { c.save(); roundedRect(c, 126, 306, 828, 523, 4); c.clip(); c.drawImage(scene, 126, 306, 828, 517.5); c.restore(); }

  // The lines, with each rhyme pair's ends in its colour.
  const shown = rhyme.lines.slice(0, 4), size = shown.length > 3 ? 54 : 60;
  shown.forEach((line, index) => {
    const words = wordsOf(line), group = groupOf(rhyme, index), segments: Segment[] = [];
    words.forEach((word, at) => {
      if (at) segments.push({ text: " ", color: colors.ink, weight: 700 });
      const last = at === words.length - 1, core = bare(word);
      segments.push({ text: last ? core : word, color: last && group >= 0 ? RHYME_COLORS[group] : colors.ink, weight: last && group >= 0 ? 800 : 700 });
      if (last && word.length > core.length) segments.push({ text: word.slice(core.length), color: colors.ink, weight: 700 });
    });
    fitText(c, segments, width / 2, 910 + index * 76, size, width - 200, "center");
  });
  fitText(c, [{ text: text.drum, color: colors.accent, weight: 800, display: true }], width / 2, 1230, 46, 900, "center");
  drawFooterBand(c, "feed", FOOTER, site, { band: colors.band, ask: "#ffd166", site: "#ffffff" });
}

export async function cardBlob(data: CardData, site: string) {
  const scene = await loadScene(rhymeForLevel(data.level).id);
  return renderCard(canvas => drawCard(canvas, data, scene, site));
}

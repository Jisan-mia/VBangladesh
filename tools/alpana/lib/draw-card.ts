import { cardSizes, drawFooterBand, fitText, renderCard, type CardFormat } from "../../../shared/card-canvas";
import { palettes, type PatternSettings } from "./pattern";
import type { cardText } from "./card";

type CardText = ReturnType<typeof cardText>;

/** Rasterises the on-screen alpana SVG without its flat floor and editing guides, so the card can lay it on a textured floor. */
export async function svgImage(svg: SVGSVGElement, size: number) {
  const copy = svg.cloneNode(true) as SVGSVGElement;
  copy.querySelectorAll("[data-export-ignore],[data-floor]").forEach(node => node.remove());
  copy.setAttribute("width", String(size));
  copy.setAttribute("height", String(size));
  const url = URL.createObjectURL(new Blob([new XMLSerializer().serializeToString(copy)], { type: "image/svg+xml" }));
  try {
    const image = new Image();
    image.src = url;
    await image.decode();
    return image;
  } finally {
    URL.revokeObjectURL(url);
  }
}

// Same floor every time for the same card: a tiny seeded random generator.
function seeded(seed: number) {
  return () => { seed = (seed * 1664525 + 1013904223) >>> 0; return seed / 2 ** 32; };
}

/** A hand-plastered floor: soft uneven patches, then fine grit, then a soft vignette. */
function drawFloor(context: CanvasRenderingContext2D, width: number, height: number, paper: boolean, pass: "patches" | "grit") {
  const random = seeded(pass === "patches" ? 7 : 11);
  if (pass === "patches") {
    for (let index = 0; index < 34; index++) {
      const x = random() * width, y = random() * height, radius = 140 + random() * 360;
      const patch = context.createRadialGradient(x, y, 0, x, y, radius);
      patch.addColorStop(0, index % 3 ? `rgba(40,12,4,${paper ? 0.03 : 0.11})` : `rgba(255,236,205,${paper ? 0.08 : 0.07})`);
      patch.addColorStop(1, "rgba(0,0,0,0)");
      context.fillStyle = patch;
      context.fillRect(x - radius, y - radius, radius * 2, radius * 2);
    }
    return;
  }
  for (let index = 0; index < 5200; index++) {
    context.fillStyle = random() > 0.5 ? `rgba(30,10,0,${paper ? 0.05 : 0.13})` : `rgba(255,245,225,${paper ? 0.1 : 0.07})`;
    const size = 1 + random() * 2.6;
    context.fillRect(random() * width, random() * height, size, size);
  }
  const vignette = context.createRadialGradient(width / 2, height * 0.44, width * 0.3, width / 2, height * 0.44, height * 0.78);
  vignette.addColorStop(0, "rgba(0,0,0,0)");
  vignette.addColorStop(1, paper ? "rgba(110,80,40,.16)" : "rgba(25,8,2,.42)");
  context.fillStyle = vignette;
  context.fillRect(0, 0, width, height);
}

const layouts = {
  feed: { title: 118, titleSize: 74, art: 860, artTop: 168, line: 1112, signature: 1180 },
  story: { title: 360, titleSize: 84, art: 980, artTop: 430, line: 1500, signature: 1580 },
} as const;

export function drawCard(canvas: HTMLCanvasElement, art: CanvasImageSource, settings: PatternSettings, text: CardText, format: CardFormat, site: string) {
  const { width, height } = cardSizes[format];
  const layout = layouts[format];
  const palette = palettes.find(item => item.id === settings.palette)!;
  const paper = palette.id === "paper";
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext("2d");
  if (!context) throw new Error("এই ব্রাউজারে ছবি বানানো যাচ্ছে না।");
  context.fillStyle = palette.background;
  context.fillRect(0, 0, width, height);
  drawFloor(context, width, height, paper, "patches");
  // A faint shadow lifts the lines off the floor, the way dried rice paste sits on clay.
  context.save();
  context.shadowColor = paper ? "rgba(90,50,20,.18)" : "rgba(20,5,0,.45)";
  context.shadowBlur = 5;
  context.shadowOffsetY = 2;
  context.drawImage(art, (width - layout.art) / 2, layout.artTop, layout.art, layout.art);
  context.restore();
  drawFloor(context, width, height, paper, "grit");
  fitText(context, [{ text: text.title, color: palette.ink, weight: 800, display: true }], width / 2, layout.title, layout.titleSize, 920, "center");
  fitText(context, [{ text: text.line, color: palette.ink, weight: 600, display: true }], width / 2, layout.line, format === "story" ? 46 : 42, 940, "center");
  if (text.signature) fitText(context, [{ text: text.signature, color: palette.detail, weight: 700 }], width / 2, layout.signature, format === "story" ? 38 : 34, 900, "center");
  drawFooterBand(context, format, "তুমিও একটা আঁকবে?", site, paper ? undefined : { band: "#2a140d", ask: palette.detail, site: "#fff5e6" });
}

export const cardBlob = (art: CanvasImageSource, settings: PatternSettings, text: CardText, format: CardFormat, site: string) =>
  renderCard(canvas => drawCard(canvas, art, settings, text, format, site));

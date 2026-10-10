import { canvasBlob, cardSizes, drawFooterBand, fitText, loadCardFonts, roundedRect, type CardFormat, type Segment } from "../../../shared/card-canvas";
import { laneLine, roofParts, splitText, supportLine, teamOf, type Shared, type Split } from "./roof";
import { houseSpots, sceneSvg } from "./scene";

const CREAM = "#f6ead2";
const PEACH = "#ffd3a1";

// Ground is where the houses stand; the strip under it (above the footer band) carries the national split.
const layouts = {
  feed: { ground: 1104, poleTop: 486, kicker: 104, line1: 196, line2: 306, size1: 56, size2: 100, human: 386 },
  story: { ground: 1468, poleTop: 730, kicker: 330, line1: 432, line2: 552, size1: 62, size2: 110, human: 640 },
} as const;

export function cardScene(shared: Shared, format: CardFormat) {
  const { width, height } = cardSizes[format];
  const { ground, poleTop } = layouts[format];
  const houses = shared.neighbour ? [{ team: shared.neighbour.team }, { team: shared.own.team }] : [{ team: shared.own.team }];
  return sceneSvg({ width, height, ground, poleTop, houses, id: `card-${format}` });
}

/** The scene is an SVG picture, so it loads first; drawing the card after that is synchronous (and cancellable by the caller). */
export function loadScene(shared: Shared, format: CardFormat) {
  const image = new Image();
  image.src = "data:image/svg+xml;charset=utf-8," + encodeURIComponent(cardScene(shared, format));
  return image.decode().then(() => image);
}

function plate(context: CanvasRenderingContext2D, text: string, cx: number, y: number, maxWidth: number) {
  context.font = `700 28px "Bangla"`;
  const width = Math.min(context.measureText(text).width + 34, maxWidth);
  context.fillStyle = "#fbf6ea";
  roundedRect(context, cx - width / 2, y, width, 46, 8);
  context.fill();
  context.strokeStyle = "#2e190e";
  context.lineWidth = 3;
  context.stroke();
  fitText(context, [{ text, color: "#2e190e", weight: 700 }], cx, y + 33, 28, width - 20, "center");
}

function splitBar(context: CanvasRenderingContext2D, split: Split, top: number) {
  const left = 84, width = 912;
  fitText(context, [{ text: "দেশে এখন: ", color: PEACH, weight: 700 }, { text: splitText(split), color: "#ffffff", weight: 600 }], left, top + 36, 30, width);
  let x = left;
  for (const [percent, color] of [[split.arg, "#74acdf"], [split.bra, "#ffdf00"], [split.other, "#c9d1dc"]] as const) {
    const w = (width * percent) / 100;
    context.fillStyle = color;
    context.fillRect(x, top + 56, w, 24);
    x += w;
  }
  context.strokeStyle = "#0b1530";
  context.lineWidth = 3;
  roundedRect(context, left, top + 56, width, 24, 6);
  context.stroke();
  fitText(context, [{ text: `একটুখানিতে ${new Intl.NumberFormat("bn-BD").format(split.total)} জনের দেওয়া হিসাব, মজার জন্য`, color: CREAM, weight: 500 }], left, top + 116, 22, width);
}

export function drawCard(canvas: HTMLCanvasElement, scene: HTMLImageElement, shared: Shared, format: CardFormat, site: string, split: Split | null) {
  const { width, height } = cardSizes[format];
  const layout = layouts[format];
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext("2d");
  if (!context) throw new Error("এই ব্রাউজারে ছবি বানানো যাচ্ছে না।");
  context.drawImage(scene, 0, 0, width, height);
  context.textBaseline = "alphabetic";

  const { own, neighbour } = shared;
  const glow = (team: typeof own.team) => teamOf(team).glow;
  let first: Segment[], second: Segment[], human: string;
  if (neighbour) {
    const me = own.name || "আমি", them = neighbour.name || "পাশের বাসা";
    if (neighbour.team === own.team) {
      first = [{ text: `${them} আর ${me},`, color: "#ffffff", weight: 700, display: true }];
      second = [{ text: "দুই ছাদেই ", color: "#ffffff", weight: 700, display: true }, { text: teamOf(own.team).label, color: glow(own.team), weight: 800, display: true }];
    } else {
      first = [{ text: `${them} `, color: "#ffffff", weight: 700, display: true }, { text: teamOf(neighbour.team).label + ",", color: glow(neighbour.team), weight: 800, display: true }];
      second = [{ text: `${me} `, color: "#ffffff", weight: 700, display: true }, { text: teamOf(own.team).label, color: glow(own.team), weight: 800, display: true }];
    }
    human = laneLine(own, neighbour);
    fitText(context, [{ text: "পাশাপাশি দুই ছাদ", color: PEACH, weight: 600 }], 84, layout.kicker, 32, 900);
    fitText(context, first, 84, layout.line1 + 14, layout.size2 * 0.82, 912);
    fitText(context, second, 84, layout.line2, layout.size2 * 0.82, 912);
    const spots = houseSpots(width, layout.ground, 2);
    [them, me].forEach((name, index) => plate(context, name, spots[index].cx + spots[index].wallWidth * 0.18, spots[index].wallTop + 10, spots[index].wallWidth * 0.42));
  } else {
    const [whose, rest] = roofParts(own);
    fitText(context, [{ text: "ছাদের পতাকা", color: PEACH, weight: 600 }], 84, layout.kicker, 32, 900);
    fitText(context, [{ text: whose, color: "#ffffff", weight: 600 }], 84, layout.line1, layout.size1, 912);
    fitText(context, [{ text: rest, color: glow(own.team), weight: 800, display: true }], 84, layout.line2, layout.size2, 912);
    human = supportLine(own.year);
  }
  fitText(context, [{ text: human, color: CREAM, weight: 600 }], 84, layout.human, 40, 912);
  if (split) splitBar(context, split, layout.ground);
  drawFooterBand(context, format, "তোমার ছাদে কোন পতাকা?", site);
}

export async function cardBlob(shared: Shared, format: CardFormat, site: string, split: Split | null) {
  const [scene] = await Promise.all([loadScene(shared, format), loadCardFonts("আর্জেন্টিনা ব্রাজিল")]);
  const canvas = document.createElement("canvas");
  drawCard(canvas, scene, shared, format, site, split);
  return canvasBlob(canvas);
}

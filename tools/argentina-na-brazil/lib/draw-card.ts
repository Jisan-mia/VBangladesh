import { canvasBlob, cardSizes, drawFooterBand, fitText, loadCardFonts, roundedRect, type CardFormat, type Segment } from "../../../shared/card-canvas";
import { fanBadge, fanLaneLine, fanLine, fanPair, fanScore, fanTest, scoreLine, type FanTeam } from "./fan";
import { laneLine, roofParts, splitText, supportLine, teamOf, type Roof, type Shared, type Split } from "./roof";
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

/** Name plates on the two walls: the neighbour (who sent the link) left, you right. */
function plates(context: CanvasRenderingContext2D, width: number, ground: number, names: [string, string]) {
  const spots = houseSpots(width, ground, 2);
  names.forEach((name, index) => plate(context, name, spots[index].cx + spots[index].wallWidth * 0.18, spots[index].wallTop + 10, spots[index].wallWidth * 0.42));
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
    plates(context, width, layout.ground, [them, me]);
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

/** The score as bunting: one pennant per question, team colour when right, a dashed empty one when missed. */
function bunting(context: CanvasRenderingContext2D, hits: boolean[], color: string, left: number, top: number, width: number, drop: number) {
  const step = width / hits.length, sag = drop * 0.3;
  context.strokeStyle = CREAM;
  context.lineWidth = 3;
  context.beginPath();
  context.moveTo(left, top);
  context.quadraticCurveTo(left + width / 2, top + sag * 2, left + width, top);
  context.stroke();
  hits.forEach((hit, index) => {
    const cx = left + step * (index + 0.5), t = (cx - left) / width, y = top + sag * 4 * t * (1 - t), half = step * 0.36;
    context.beginPath();
    context.moveTo(cx - half, y);
    context.lineTo(cx + half, y);
    context.lineTo(cx, y + drop);
    context.closePath();
    if (hit) { context.fillStyle = color; context.fill(); }
    context.strokeStyle = hit ? "#0b1530" : CREAM;
    context.lineWidth = hit ? 2 : 2.5;
    context.setLineDash(hit ? [] : [7, 6]);
    context.stroke();
    context.setLineDash([]);
  });
}

const hitsOf = (roof: Roof, seed: number) => fanTest(roof.team as FanTeam, seed).map((round, index) => round.right === roof.quiz?.[index]);

/** The আসল ফ্যান card: same rooftop, the score up top, the eight answers as bunting along the ground. */
export function drawFanCard(canvas: HTMLCanvasElement, scene: HTMLImageElement, shared: Shared, format: CardFormat, site: string) {
  const { width, height } = cardSizes[format];
  const layout = layouts[format];
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext("2d");
  if (!context) throw new Error("এই ব্রাউজারে ছবি বানানো যাচ্ছে না।");
  context.drawImage(scene, 0, 0, width, height);
  context.textBaseline = "alphabetic";

  const { own, neighbour } = shared;
  const seed = shared.seed ?? 0;
  const me = own.name || "আমি", them = neighbour?.name || "পাশের বাসা";
  const score = (roof: Roof) => scoreLine(fanScore(roof.team, seed, roof.quiz ?? []));
  fitText(context, [{ text: "আসল ফ্যান পরীক্ষা", color: PEACH, weight: 600 }], 84, layout.kicker, 32, 900);
  let human: string;
  const rows: { roof: Roof; label: string }[] = [];
  if (neighbour && fanPair(shared)) {
    fitText(context, [{ text: `${them} `, color: "#ffffff", weight: 700, display: true }, { text: `${teamOf(neighbour.team).label} ${score(neighbour)},`, color: teamOf(neighbour.team).glow, weight: 800, display: true }], 84, layout.line1 + 14, layout.size2 * 0.74, 912);
    fitText(context, [{ text: `${me} `, color: "#ffffff", weight: 700, display: true }, { text: `${teamOf(own.team).label} ${score(own)}`, color: teamOf(own.team).glow, weight: 800, display: true }], 84, layout.line2, layout.size2 * 0.74, 912);
    human = fanLaneLine(own, neighbour, seed);
    rows.push({ roof: neighbour, label: them }, { roof: own, label: me });
  } else {
    fitText(context, [{ text: `${me} ${score(own)}`, color: "#ffffff", weight: 700, display: true }], 84, layout.line1 + 8, layout.size1 * 1.3, 912);
    fitText(context, [{ text: fanBadge(own.team, fanScore(own.team, seed, own.quiz ?? [])), color: teamOf(own.team).glow, weight: 800, display: true }], 84, layout.line2, layout.size2 * 0.84, 912);
    human = fanLine(own.team as FanTeam, seed, own.quiz ?? []);
    rows.push({ roof: own, label: "" });
  }
  fitText(context, [{ text: human, color: CREAM, weight: 600 }], 84, layout.human, 40, 912);
  if (neighbour) plates(context, width, layout.ground, [them, me]);
  if (rows.length === 1) bunting(context, hitsOf(own, seed), teamOf(own.team).chip, 84, layout.ground + 30, 912, 72);
  else rows.forEach(({ roof, label }, index) => {
    const top = layout.ground + 24 + index * 66;
    fitText(context, [{ text: label, color: CREAM, weight: 700 }], 84, top + 34, 28, 190);
    bunting(context, hitsOf(roof, seed), teamOf(roof.team).chip, 300, top, 696, 46);
  });
  drawFooterBand(context, format, "তুমি নিজের দলকে কতটা চেনো?", site);
}

export async function fanCardBlob(shared: Shared, format: CardFormat, site: string) {
  const [scene] = await Promise.all([loadScene(shared, format), loadCardFonts("আসল ফ্যান পরীক্ষা ৮-এ ৭")]);
  const canvas = document.createElement("canvas");
  drawFanCard(canvas, scene, shared, format, site);
  return canvasBlob(canvas);
}

export async function cardBlob(shared: Shared, format: CardFormat, site: string, split: Split | null) {
  const [scene] = await Promise.all([loadScene(shared, format), loadCardFonts("আর্জেন্টিনা ব্রাজিল")]);
  const canvas = document.createElement("canvas");
  drawCard(canvas, scene, shared, format, site, split);
  return canvasBlob(canvas);
}

import { cardSizes, drawFooterBand, fitText, renderCard, wrapText, BODY_FONT, type CardFormat } from "../../../shared/card-canvas";
import { drawDalaBack, drawDalaFront, drawMango, pileSlots } from "./art";
import { bn, humanLine, ripeOf, stageOf, CLASSIC_STAGE, type Shared } from "./storm";

const CREAM = "#fff6e2", AMBER = "#ffd27a", INK = "#3a2414";

function star(context: CanvasRenderingContext2D, x: number, y: number, r: number, on: boolean) {
  context.beginPath();
  for (let i = 0; i < 10; i++) { const a = -Math.PI / 2 + i * Math.PI / 5, d = i % 2 ? r * 0.45 : r; context.lineTo(x + Math.cos(a) * d, y + Math.sin(a) * d); }
  context.closePath();
  context.fillStyle = on ? "#ffc93c" : "#fff6e233"; context.fill();
  context.lineWidth = 4; context.strokeStyle = on ? "#a9561a" : "#fff6e244"; context.stroke();
}

/** This phone's extras for its own card (never in the link): the storm's stars and the all-time mango badge. */
export type CardExtra = { stars?: number; milestone?: number };

/** The ডালা heaped with the mangoes from the storm, under the edge of the tree, the count big above it. */
export function drawCard(canvas: HTMLCanvasElement, shared: Shared, format: CardFormat, site: string, extra: CardExtra = {}) {
  const { width, height } = cardSizes[format];
  canvas.width = width; canvas.height = height;
  const context = canvas.getContext("2d");
  if (!context) throw new Error("এই ব্রাউজারে ছবি বানানো যাচ্ছে না।");
  // Feed positions; the story stretches them into its taller area (its footer band starts at 1660).
  const y = (feedY: number) => format === "feed" ? feedY : 120 + feedY * 1.228;
  const cx = width / 2;

  const sky = context.createLinearGradient(0, 0, 0, y(880));
  sky.addColorStop(0, "#2c3847"); sky.addColorStop(0.45, "#59606a"); sky.addColorStop(0.85, "#c08d5a"); sky.addColorStop(1, "#ecb66b");
  context.fillStyle = sky; context.fillRect(0, 0, width, y(890));

  // Storm clouds low on the horizon, lit from beneath.
  context.fillStyle = "#3e4854";
  for (let index = 0; index < 8; index++) { context.beginPath(); context.arc(index * 150 + 20, y(650) + (index % 3) * 26, 120 + (index % 2) * 30, 0, Math.PI * 2); context.fill(); }
  const glow = context.createLinearGradient(0, y(640), 0, y(880));
  glow.addColorStop(0, "#c48d5800"); glow.addColorStop(1, "#f2c27a");
  context.fillStyle = glow; context.fillRect(0, y(640), width, y(880) - y(640));

  // The village line, the paddy, then the courtyard.
  context.fillStyle = "#2f4535";
  for (const [x, r] of [[80, 60], [190, 80], [330, 54], [760, 70], [900, 90], [1040, 60]]) { context.beginPath(); context.arc(x, y(880) - r * 0.6, r, 0, Math.PI * 2); context.fill(); }
  for (const x of [150, 930]) {
    context.fillRect(x - 5, y(740), 10, y(880) - y(740));
    for (let leaf = 0; leaf < 6; leaf++) { const a = -Math.PI / 2 + (leaf - 2.5) * 0.55; context.beginPath(); context.ellipse(x + Math.cos(a) * 32, y(740) + Math.sin(a) * 16 + 8, 38, 9, a, 0, Math.PI * 2); context.fill(); }
  }
  context.fillStyle = "#6f8f38"; context.fillRect(0, y(876), width, y(950) - y(876));
  const yard = context.createLinearGradient(0, y(940), 0, height);
  yard.addColorStop(0, "#d6a266"); yard.addColorStop(1, "#b98249");
  context.fillStyle = yard; context.fillRect(0, y(940), width, height - y(940));

  // The canopy's edge across the top, with mangoes still hanging.
  const shades = ["#24481f", "#2f5a26", "#3b6c2d", "#4c8236"];
  for (let layer = 0; layer < 4; layer++) {
    context.fillStyle = shades[layer];
    for (let index = 0; index < 10; index++) {
      context.beginPath();
      context.arc(-40 + index * 128 + ((index * 37 + layer * 51) % 60), y(-40 + layer * 42 + ((index * 29 + layer * 13) % 40)), 100 - layer * 10, 0, Math.PI * 2);
      context.fill();
    }
  }
  for (const [x, at, ripe] of [[110, 190, true], [930, 200, false], [1010, 150, true]] as const) { context.save(); context.translate(x, y(at)); drawMango(context, 64, ripe); context.restore(); }

  const ripe = Math.max(0, ripeOf(shared.score, shared.count)), green = shared.count - ripe;
  fitText(context, [{ text: "কালবৈশাখী আম", color: AMBER, weight: 800, display: true }, ...(shared.name ? [{ text: ` · ${shared.name}`, color: CREAM, weight: 700, display: true }] : [])], cx, y(300), 50, 900, "center");
  fitText(context, [{ text: `${bn(shared.count)}টা আম`, color: CREAM, weight: 800, display: true }], cx, y(450), 150, 900, "center");
  fitText(context, [{ text: `${bn(shared.score)} পয়েন্ট`, color: AMBER, weight: 700 }, { text: `  ·  পাকা ${bn(ripe)}, কাঁচা ${bn(green)}`, color: "#f3dcc0", weight: 600 }], cx, y(530), 46, 900, "center");

  const stage = shared.stage ?? CLASSIC_STAGE, stars = extra.stars ?? 0;
  // Stars sit on the canopy above the title; the storm and the all-time badge sit just above the heap, which can rise to about y(620).
  if (stars) for (let i = 0; i < 3; i++) star(context, cx + (i - 1) * 74, y(212), 30, i < stars);
  const badge = `ঝড় ${bn(stage)} · ${stageOf(stage).name}${extra.milestone ? ` · মোট ${bn(extra.milestone)}+ আম` : ""}`;
  fitText(context, [{ text: badge, color: "#f3dcc0", weight: 600 }], cx, y(582), 32, 900, "center");

  // The ডালা and its heap: up to fifteen mangoes, ripe and green in the same mix as the score.
  const dala = 600, rimY = y(930), shown = Math.min(15, shared.count);
  context.fillStyle = "#4a2c1430";
  context.beginPath(); context.ellipse(cx, rimY + 170, 300, 34, 0, 0, Math.PI * 2); context.fill();
  context.save(); context.translate(cx, rimY); drawDalaBack(context, dala); context.restore();
  pileSlots(shown, dala).forEach(([dx, dy], index) => {
    const isRipe = Math.floor((index + 1) * ripe / Math.max(1, shared.count)) > Math.floor(index * ripe / Math.max(1, shared.count));
    context.save(); context.translate(cx + dx, rimY + dy - 20); context.rotate(((index * 37) % 9 - 4) * 0.07); drawMango(context, 124, isRipe); context.restore();
  });
  context.save(); context.translate(cx, rimY); drawDalaFront(context, dala); context.restore();

  context.font = `600 44px ${BODY_FONT}`;
  wrapText(context, humanLine(shared.score), 900, 2).forEach((line, index) => {
    fitText(context, [{ text: line, color: INK, weight: 700 }], cx, y(1150) + index * 60, 44, 920, "center");
  });
  drawFooterBand(context, format, "তুমি কয়টা কুড়াতে পারবে?", site, { band: "#2a1d14", ask: AMBER, site: CREAM });
}

export const cardBlob = (shared: Shared, format: CardFormat, site: string, extra: CardExtra = {}) => renderCard(canvas => drawCard(canvas, shared, format, site, extra));

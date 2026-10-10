import { cardSizes, drawFooterBand, fitText, renderCard, roundedRect, wrapText, BODY_FONT, DISPLAY_FONT, type CardFormat } from "../../../shared/card-canvas";
import { bn, cheerLabel, cleanPrice, cleanSticks, colors, headline, LEAF_PATH, plant, pot, relationLabel, stats, stemPath, tally, type Plant, type Quit } from "./dhoyahin";

const INK = "#173226";
const GREEN = "#1e5a2c";
const MUTED = "#5b6b62";
const WALL = "#eef1ef";

function drawBalcony(context: CanvasRenderingContext2D, width: number, ledge: number) {
  const sky = context.createLinearGradient(0, 0, 0, ledge);
  sky.addColorStop(0, "#bfe3f2");
  sky.addColorStop(1, "#f2fafc");
  context.fillStyle = sky;
  context.fillRect(0, 0, width, ledge);
  // The iron grill of a Dhaka balcony: bars, two rails and an arch in every panel.
  context.save();
  context.strokeStyle = "rgba(36,83,63,.16)";
  context.lineWidth = 6;
  const top = ledge - 560;
  for (let x = 0; x <= width; x += 120) {
    context.beginPath(); context.moveTo(x, top); context.lineTo(x, ledge); context.stroke();
    context.beginPath(); context.arc(x + 60, top + 60, 48, Math.PI, 0); context.stroke();
  }
  for (const y of [top, top + 280]) { context.beginPath(); context.moveTo(0, y); context.lineTo(width, y); context.stroke(); }
  context.restore();
  context.fillStyle = "#d9d3c9";
  context.fillRect(0, ledge, width, 40);
  context.fillStyle = "#f6f3ee";
  context.fillRect(0, ledge, width, 8);
  context.fillStyle = WALL;
  context.fillRect(0, ledge + 40, width, 2000);
}

/** Paints the same plant the page's SVG shows; (cx, soil) is where the stem meets the soil. */
export function drawPlant(context: CanvasRenderingContext2D, shape: Plant, cx: number, soil: number, scale: number) {
  context.save();
  context.translate(cx, soil);
  context.scale(scale, scale);
  context.lineCap = "round";
  if (shape.stem > 0) {
    context.strokeStyle = colors.stem; context.lineWidth = 7;
    context.stroke(new Path2D(stemPath(shape.stem)));
  }
  shape.flowers.forEach((flower, index) => {
    const tipX = flower.x + flower.side * flower.stalk, tipY = -(flower.y + 12);
    context.strokeStyle = colors.stem; context.lineWidth = 3;
    context.beginPath(); context.moveTo(flower.x, -flower.y); context.quadraticCurveTo(flower.x + flower.side * flower.stalk * 0.6, -flower.y, tipX, tipY); context.stroke();
    context.fillStyle = colors.petal;
    for (const turn of [0, 72, 144, 216, 288]) {
      const radians = ((turn + index * 11) * Math.PI) / 180;
      context.beginPath(); context.arc(tipX + Math.sin(radians) * 8, tipY - Math.cos(radians) * 8, 7, 0, Math.PI * 2); context.fill();
    }
    context.fillStyle = colors.eye;
    context.beginPath(); context.arc(tipX, tipY, 5, 0, Math.PI * 2); context.fill();
  });
  const leafPath = new Path2D(LEAF_PATH);
  shape.leaves.forEach((leaf, index) => {
    context.save();
    context.translate(leaf.x, -leaf.y);
    context.rotate((-leaf.angle * Math.PI) / 180);
    context.save();
    context.scale(leaf.size, leaf.size);
    context.fillStyle = leaf.fresh ? colors.fresh : index % 3 ? colors.leaf : colors.leafDeep;
    context.fill(leafPath);
    context.restore();
    context.strokeStyle = "#ffffff66"; context.lineWidth = 1.6;
    context.beginPath(); context.moveTo(2, 0); context.lineTo(leaf.size * 0.82, 0); context.stroke();
    context.restore();
  });
  if (shape.seed) {
    context.fillStyle = "#8a5a2b";
    context.beginPath(); context.ellipse(0, -8, 9, 6, 0, 0, Math.PI * 2); context.fill();
  }
  context.fillStyle = colors.clay; context.fill(new Path2D(pot.body));
  context.globalAlpha = 0.35; context.fillStyle = colors.clayDeep; context.fill(new Path2D(pot.shade)); context.globalAlpha = 1;
  context.strokeStyle = colors.lime; context.lineWidth = 4; context.stroke(new Path2D(pot.wave));
  context.fillStyle = colors.lime;
  for (const [x, y] of pot.dots) { context.beginPath(); context.arc(x, y, 5, 0, Math.PI * 2); context.fill(); }
  context.fillStyle = colors.clayDeep; context.fill(new Path2D(pot.rim));
  context.fillStyle = colors.soil; context.fill(new Path2D(pot.soil));
  context.restore();
}

function drawChit(context: CanvasRenderingContext2D, text: string, x: number, y: number, width: number) {
  context.fillStyle = "rgba(255,255,255,.92)";
  roundedRect(context, x, y, width, 92, 14);
  context.fill();
  context.fillStyle = colors.clay;
  context.fillRect(x, y + 14, 8, 64);
  fitText(context, [{ text, color: INK, weight: 700, display: true }], x + 32, y + 60, 40, width - 52);
}

/** A paper tag tied to the pot: the family's reply. */
function drawTag(context: CanvasRenderingContext2D, line: string, from: string, x: number, y: number, knot: { x: number; y: number }) {
  const width = 470;
  context.font = `700 36px ${DISPLAY_FONT}`;
  const lines = wrapText(context, line, width - 70, 2);
  const height = 56 + lines.length * 50 + 44;
  context.strokeStyle = "#8a6b4a"; context.lineWidth = 3;
  context.beginPath(); context.moveTo(x + width - 40, y + 30); context.quadraticCurveTo(knot.x - 40, knot.y - 80, knot.x, knot.y); context.stroke();
  context.save();
  context.translate(x, y);
  context.rotate(-0.035);
  context.shadowColor = "rgba(23,50,38,.18)"; context.shadowBlur = 18; context.shadowOffsetY = 6;
  context.fillStyle = "#fffdf7";
  roundedRect(context, 0, 0, width, height, 12);
  context.fill();
  context.shadowColor = "transparent";
  context.fillStyle = "#c9b79c";
  context.beginPath(); context.arc(width - 40, 30, 9, 0, Math.PI * 2); context.fill();
  lines.forEach((text, index) => fitText(context, [{ text, color: GREEN, weight: 700, display: true }], 34, 74 + index * 50, 36, width - 70));
  context.font = `600 30px ${BODY_FONT}`;
  fitText(context, [{ text: `— ${from}`, color: colors.clay, weight: 700 }], width - 34, 74 + lines.length * 50 + 14, 30, width - 70, "right");
  context.restore();
}

const layouts = {
  feed: { dy: 0, ledge: 1010, line: 1128 },
  story: { dy: 280, ledge: 1380, line: 1492 },
} as const;

export function drawCard(canvas: HTMLCanvasElement, quit: Quit, today: string, format: CardFormat, site: string) {
  const { width, height } = cardSizes[format];
  const { dy, ledge, line } = layouts[format];
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext("2d");
  if (!context) throw new Error("এই ব্রাউজারে ছবি বানানো যাচ্ছে না।");
  const count = tally(quit, today);
  const head = headline(quit, count);
  drawBalcony(context, width, ledge);

  const scale = 1.5, cx = 800, soil = ledge - 157 * scale;
  drawPlant(context, plant(count.days), cx, soil, scale);

  fitText(context, quit.name ? [{ text: quit.name, color: INK, weight: 700, display: true }, { text: "  ·  ধোঁয়াহীন দিন", color: colors.clay, weight: 700 }] : [{ text: "ধোঁয়াহীন দিন", color: colors.clay, weight: 700 }], 84, 130 + dy, 40, 600);
  fitText(context, [{ text: head.big, color: GREEN, weight: 800, display: true }], 84, 330 + dy, 190, 590);
  fitText(context, [{ text: head.sub, color: INK, weight: 600 }], 84, 408 + dy, 42, 560);
  const [first, second] = stats(count, quit.sticks);
  drawChit(context, first, 84, 470 + dy, 540);
  drawChit(context, second, 84, 582 + dy, 540);
  fitText(context, [{ text: `হিসাব: দিনে ${bn(cleanSticks(quit.sticks))}টা × ${bn(cleanPrice(quit.price))} টাকা${count.days > 0 ? ` × ${bn(count.days)} দিন` : ""}`, color: MUTED, weight: 500 }], 92, 718 + dy, 26, 530);
  if (quit.cheer) drawTag(context, cheerLabel(quit.cheer), relationLabel(quit.cheer), 84, 772 + dy, { x: cx - 120, y: soil + 50 });

  context.font = `700 42px ${DISPLAY_FONT}`;
  wrapText(context, count.line, 912, 2).forEach((text, index) => fitText(context, [{ text, color: INK, weight: 700, display: true }], 84, line + index * 60, 42, 912));
  drawFooterBand(context, format, "এই কার্ডটা কাকে দেখাবে?", site, { band: GREEN, ask: "#ffd36b", site: "#ffffff" });
}

export const cardBlob = (quit: Quit, today: string, format: CardFormat, site: string) => renderCard(canvas => drawCard(canvas, quit, today, format, site));

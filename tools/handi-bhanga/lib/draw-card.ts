import { cardSizes, drawFooterBand, fitText, renderCard, type CardFormat, type Segment } from "../../../shared/card-canvas";
import { drawBall, drawBrokenRim, drawPot, drawShard, drawStick, palette, DESIGN_BODY } from "./art";
import { bn, potsFrom, tallyLine, type Shared } from "./link";
import { humanLine } from "./game";

// Which of the five card pots break first, so a half-broken rope looks scattered, not cut from one end.
const BREAK_ORDER = [1, 4, 2, 0, 3];
const CARD_DESIGNS = [0, 3, 1, 4, 5];
const CARD_POTS = BREAK_ORDER.length;

/** A fair-stall card: the awning, a rope of painted pots (as many broken as the score says), shards and the stick on the floor, then the tally. */
export function drawCard(canvas: HTMLCanvasElement, shared: Pick<Shared, "score" | "name">, format: CardFormat, site: string) {
  const { width, height } = cardSizes[format];
  canvas.width = width;
  canvas.height = height;
  const c = canvas.getContext("2d");
  if (!c) throw new Error("এই ব্রাউজারে ছবি বানানো যাচ্ছে না।");
  // Feed positions; the story stretches them into its taller safe area, clear of storySafe and the footer band.
  const y = (feedY: number) => format === "feed" ? feedY : 300 + (feedY - 150) * 1.25;
  const cx = width / 2;

  c.fillStyle = palette.cloth; c.fillRect(0, 0, width, height);
  c.fillStyle = palette.clothStripe;
  for (let x = 36; x < width; x += 144) c.fillRect(x + 72, 0, 72, height);

  // Awning.
  const band = 100;
  for (let x = 0, i = 0; x < width; x += 72, i++) {
    c.fillStyle = i % 2 ? palette.awningLight : palette.awning;
    c.fillRect(x, 0, 72, band);
    c.beginPath(); c.arc(x + 36, band, 36, 0, Math.PI); c.fill();
  }
  c.strokeStyle = palette.awningDeep; c.lineWidth = 4;
  c.beginPath(); for (let x = 0; x < width; x += 72) { c.moveTo(x + 72, band); c.arc(x + 36, band, 36, 0, Math.PI); } c.stroke();
  c.fillStyle = palette.awningDeep; c.fillRect(0, 0, width, 12);
  // Bamboo poles.
  for (const x of [0, width - 30]) {
    c.fillStyle = palette.bamboo; c.fillRect(x, band, 30, height - band);
    c.fillStyle = palette.bambooNode; for (let at = band + 160; at < height; at += 240) c.fillRect(x, at, 30, 6);
  }

  const title: Segment[] = [{ text: "হাঁড়িভাঙা", color: palette.ink, weight: 800, display: true }];
  if (shared.name) title.push({ text: " · ", color: palette.ink, weight: 600 }, { text: shared.name, color: palette.awning, weight: 800, display: true });
  fitText(c, title, cx, y(228), 66, 900, "center");

  // The rope and its pots.
  const rope = y(296), floor = y(570);
  c.strokeStyle = palette.rope; c.lineWidth = 5; c.lineCap = "round";
  c.beginPath(); c.moveTo(30, rope - 6); c.quadraticCurveTo(cx, rope + 22, width - 30, rope - 6); c.stroke();
  const gone = new Set(BREAK_ORDER.slice(0, Math.round(potsFrom(shared.score) / (35 / CARD_POTS))));
  c.fillStyle = palette.ground; c.fillRect(30, floor, width - 60, 100);
  c.fillStyle = "rgba(60,30,0,0.18)"; c.fillRect(30, floor, width - 60, 6);
  for (let i = 0; i < CARD_POTS; i++) {
    const px = cx + (i - 2) * 190, sag = 22 * (1 - ((i - 2) / 2.6) ** 2), top = rope + sag + 26;
    c.strokeStyle = palette.rope; c.lineWidth = 3.5;
    c.beginPath(); c.moveTo(px, rope + sag - 2); c.lineTo(px, top + 2); c.stroke();
    if (!gone.has(i)) { drawPot(c, px, top, 156, CARD_DESIGNS[i], false, false); continue; }
    const body = DESIGN_BODY[CARD_DESIGNS[i]];
    drawBrokenRim(c, px, top, 156, (i % 2 ? 1 : -1) * 0.14, body);
    drawShard(c, px - 46, floor + 40, 24, 0.4 + i, body);
    drawShard(c, px + 34, floor + 62, 19, 1.7 + i, body);
    drawShard(c, px + 2, floor + 30, 15, 2.6 + i, "#c2603a");
  }
  // The stick lying on the floor, the ball beside it.
  c.save();
  c.translate(cx + 300, floor + 76); c.rotate(-0.06);
  drawStick(c, 0, -15, 250, 30);
  c.restore();
  drawBall(c, cx - 400, floor + 58, 28);

  fitText(c, [{ text: tallyLine(shared.score), color: palette.awning, weight: 800, display: true }], cx, y(830), 124, 920, "center");
  fitText(c, [{ text: bn(shared.score), color: palette.ink, weight: 800, display: true }, { text: " পয়েন্ট", color: palette.ink, weight: 700 }], cx, y(955), 86, 800, "center");
  fitText(c, [{ text: humanLine(shared.score), color: palette.ink, weight: 600 }], cx, y(1080), 50, 900, "center");
  drawFooterBand(c, format, "তুমি সব ভাঙতে পারবে?", site, { band: palette.ink, ask: "#f2c26b", site: "#ffffff" });
}

export const cardBlob = (shared: Pick<Shared, "score" | "name">, format: CardFormat, site: string) => renderCard(canvas => drawCard(canvas, shared, format, site));

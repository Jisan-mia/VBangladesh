// The result card: the stall's awning, a rope of five pots broken in proportion to the pots you broke (a finale hangs its
// মটকা in the middle), shards on the floor, the লাঠি, then the stall's name, the tally and the points.
import { cardSizes, drawFooterBand, fitText, renderCard, type CardFormat, type Segment } from "../../../shared/card-canvas";
import { DESIGN_BODY, drawBall, drawBrokenRim, drawPot, drawShard, drawStick, palette } from "./art";
import { bn, cardStars, clearedCard, playLabel, potsIn, tallyLine, type Card } from "./link";
import { LEVELS } from "./levels";
import { LOOKS, drawBossPot } from "./stall-art";
import { cardLine, humanLine } from "./words";

// Which of the five card pots break first, so a half-broken rope looks scattered, not cut from one end.
const BREAK_ORDER = [1, 4, 2, 0, 3];
const CARD_DESIGNS = [0, 3, 1, 4, 5];
const CARD_POTS = BREAK_ORDER.length;

/** The card's one line: by stars on a stall, by score on an old one. */
export const cardText = (card: Card) => card.kind === "old" ? humanLine(card.score) : cardLine(cardStars(card), clearedCard(card));

export function drawCard(canvas: HTMLCanvasElement, card: Card, format: CardFormat, site: string) {
  const { width, height } = cardSizes[format];
  canvas.width = width;
  canvas.height = height;
  const c = canvas.getContext("2d");
  if (!c) throw new Error("এই ব্রাউজারে ছবি বানানো যাচ্ছে না।");
  const def = card.kind === "old" ? null : LEVELS[card.level - 1];
  const look = LOOKS[def ? def.world : 0], finale = Boolean(def?.boss);
  // Feed positions; the story stretches them into its taller safe area, clear of storySafe and the footer band.
  const y = (feedY: number) => format === "feed" ? feedY : 300 + (feedY - 150) * 1.25;
  const cx = width / 2;

  c.fillStyle = look.cloth; c.fillRect(0, 0, width, height);
  c.fillStyle = look.clothStripe;
  for (let x = 36; x < width; x += 144) c.fillRect(x + 72, 0, 72, height);

  // Awning.
  const band = 100;
  for (let x = 0, i = 0; x < width; x += 72, i++) {
    c.fillStyle = i % 2 ? look.awningAlt : look.awning;
    c.fillRect(x, 0, 72, band);
    c.beginPath(); c.arc(x + 36, band, 36, 0, Math.PI); c.fill();
  }
  c.strokeStyle = look.awningDeep; c.lineWidth = 4;
  c.beginPath(); for (let x = 0; x < width; x += 72) { c.moveTo(x + 72, band); c.arc(x + 36, band, 36, 0, Math.PI); } c.stroke();
  c.fillStyle = look.awningDeep; c.fillRect(0, 0, width, 12);
  for (const x of [0, width - 30]) {
    c.fillStyle = palette.bamboo; c.fillRect(x, band, 30, height - band);
    c.fillStyle = palette.bambooNode; for (let at = band + 160; at < height; at += 240) c.fillRect(x, at, 30, 6);
  }

  const stars = cardStars(card);
  const title: Segment[] = [{ text: "হাঁড়িভাঙা", color: palette.ink, weight: 800, display: true }];
  if (card.name) title.push({ text: " · ", color: palette.ink, weight: 600 }, { text: card.name, color: look.awning, weight: 800, display: true });
  if (stars) title.push({ text: "  ", color: palette.ink }, ...[0, 1, 2].map(star => ({ text: "★", color: star < stars ? "#e39b00" : "#c9b98f", weight: 700 })));
  fitText(c, title, cx, y(212), 66, 940, "center");
  fitText(c, [{ text: playLabel(card), color: look.awning, weight: 800, display: true }], cx, y(272), 44, 900, "center");

  // The rope and its pots.
  const rope = y(330), floor = y(580);
  c.strokeStyle = palette.rope; c.lineWidth = 5; c.lineCap = "round";
  c.beginPath(); c.moveTo(30, rope - 6); c.quadraticCurveTo(cx, rope + 22, width - 30, rope - 6); c.stroke();
  const total = potsIn(card), broken = card.pots >= total ? CARD_POTS : card.pots === 0 ? 0 : Math.max(1, Math.round(card.pots / total * CARD_POTS));
  const gone = new Set(BREAK_ORDER.slice(0, Math.min(CARD_POTS, broken)));
  c.fillStyle = look.ground; c.fillRect(30, floor, width - 60, 100);
  c.fillStyle = "rgba(60,30,0,0.18)"; c.fillRect(30, floor, width - 60, 6);
  for (let i = 0; i < CARD_POTS; i++) {
    const px = cx + (i - 2) * 190, sag = 22 * (1 - ((i - 2) / 2.6) ** 2), top = rope + sag + 26;
    c.strokeStyle = palette.rope; c.lineWidth = 3.5;
    c.beginPath(); c.moveTo(px, rope + sag - 2); c.lineTo(px, top + 2); c.stroke();
    if (finale && i === 2) {
      // The মটকা hangs where the middle pot would, cracked by how far you got.
      const wear = gone.has(2) ? 1 : Math.min(0.99, card.pots / Math.max(1, total));
      if (!gone.has(2)) drawBossPot(c, px - 110, top, 220, 190, wear);
      else {
        drawBrokenRim(c, px, top, 156, 0.1, "#e6ad3e");
        drawShard(c, px - 60, floor + 44, 30, 0.4, "#e6ad3e"); drawShard(c, px + 52, floor + 62, 24, 1.7, "#b8452c"); drawShard(c, px, floor + 30, 20, 2.6, "#e6ad3e");
      }
      continue;
    }
    if (!gone.has(i)) { drawPot(c, px, top, 156, CARD_DESIGNS[i], false, false); continue; }
    const body = DESIGN_BODY[CARD_DESIGNS[i]];
    drawBrokenRim(c, px, top, 156, (i % 2 ? 1 : -1) * 0.14, body);
    drawShard(c, px - 46, floor + 40, 24, 0.4 + i, body);
    drawShard(c, px + 34, floor + 62, 19, 1.7 + i, body);
    drawShard(c, px + 2, floor + 30, 15, 2.6 + i, "#c2603a");
  }
  c.save();
  c.translate(cx + 300, floor + 76); c.rotate(-0.06);
  drawStick(c, 0, -15, 250, 30);
  c.restore();
  drawBall(c, cx - 400, floor + 58, 28);

  fitText(c, [{ text: tallyLine(card), color: look.awning, weight: 800, display: true }], cx, y(850), 120, 920, "center");
  fitText(c, [{ text: bn(card.score), color: palette.ink, weight: 800, display: true }, { text: " পয়েন্ট", color: palette.ink, weight: 700 }], cx, y(975), 86, 800, "center");
  fitText(c, [{ text: cardText(card), color: palette.ink, weight: 600 }], cx, y(1090), 50, 900, "center");
  drawFooterBand(c, format, "তুমি সব ভাঙতে পারবে?", site, { band: palette.ink, ask: "#f2c26b", site: "#ffffff" });
}

export const cardBlob = (card: Card, format: CardFormat, site: string) => renderCard(canvas => drawCard(canvas, card, format, site));


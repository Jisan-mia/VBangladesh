import { cardSizes, DISPLAY_FONT, drawFooterBand, fitText, renderCard, storySafe, wrapText, type CardFormat } from "../../../shared/card-canvas";
import { drawings } from "./drawings";
import type { Game } from "./games";
import { bn, bringList, headline, placeOf, type Invite } from "./invite";

// A hand-made notice taped up for the para: white sheet on ballpoint blue, a lime highlighter stroke, a doodle of the game.
const BLUE = "#214bb7";
const INK = "#13235e";
const LIME = "#dce97a";
const MUTED = "#5a6688";

const layouts = {
  feed: { sheet: [52, 44, 976, 1160], kicker: 150, head: 262, art: [318, 370], title: 800, place: 878, facts: 942, bring: 998, line: 1096 },
  story: { sheet: [52, storySafe.top - 40, 976, 1420], kicker: 352, head: 478, art: [548, 470], title: 1130, place: 1218, facts: 1292, bring: 1356, line: 1478 },
} as const;

function drawTape(context: CanvasRenderingContext2D, x: number, y: number, angle: number) {
  context.save();
  context.translate(x, y);
  context.rotate(angle);
  context.fillStyle = "rgba(220,233,122,.85)";
  context.fillRect(-80, -22, 160, 44);
  context.restore();
}

export function drawPoster(canvas: HTMLCanvasElement, invite: Invite, game: Game, format: CardFormat, site: string) {
  const { width, height } = cardSizes[format];
  const layout = layouts[format];
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext("2d");
  if (!context) throw new Error("এই ব্রাউজারে ছবি বানানো যাচ্ছে না।");
  context.fillStyle = BLUE;
  context.fillRect(0, 0, width, height);

  // The sheet sits a little crooked, the way a notice gets taped to a wall.
  const [sx, sy, sw, sh] = layout.sheet;
  context.save();
  context.translate(width / 2, sy + sh / 2);
  context.rotate(-0.012);
  context.translate(-width / 2, -(sy + sh / 2));
  context.fillStyle = "rgba(0,0,0,.18)";
  context.fillRect(sx + 10, sy + 14, sw, sh);
  context.fillStyle = "#ffffff";
  context.fillRect(sx, sy, sw, sh);
  drawTape(context, sx + 70, sy + 6, -0.5);
  drawTape(context, sx + sw - 70, sy + 6, 0.5);

  const center = width / 2, maxText = sw - 120;
  const who = invite.name ? `${invite.name} ডাকছে` : "চলো খেলি!";
  fitText(context, [{ text: who, color: BLUE, weight: 700, display: true }], center, layout.kicker, format === "story" ? 52 : 46, maxText, "center");

  const head = headline(invite);
  context.font = `800 ${format === "story" ? 112 : 104}px ${DISPLAY_FONT}`;
  const headWidth = Math.min(context.measureText(head).width, maxText);
  context.fillStyle = LIME;
  context.fillRect(center - headWidth / 2 - 24, layout.head - 46, headWidth + 48, 62);
  fitText(context, [{ text: head, color: INK, weight: 800, display: true }], center, layout.head, format === "story" ? 112 : 104, maxText, "center");

  const [artTop, artSize] = layout.art;
  const drawing = drawings[game.id];
  if (drawing) {
    context.save();
    context.translate(center - artSize / 2, artTop);
    context.scale(artSize / 100, artSize / 100);
    context.strokeStyle = BLUE;
    context.lineWidth = 2.6;
    context.lineCap = "round";
    context.lineJoin = "round";
    context.stroke(new Path2D(drawing.path));
    for (const label of drawing.labels ?? []) fitText(context, [{ text: label.text, color: BLUE, weight: 600 }], label.x, label.y + label.size * 0.35, label.size, 40, "center");
    context.restore();
  }

  fitText(context, [{ text: game.title, color: BLUE, weight: 800, display: true }], center, layout.title, format === "story" ? 128 : 116, maxText, "center");
  fitText(context, [{ text: "কোথায়: ", color: MUTED, weight: 600 }, { text: placeOf(invite), color: INK, weight: 700 }], center, layout.place, format === "story" ? 52 : 46, maxText, "center");
  fitText(context, [{ text: `${bn(invite.players)} জন · ${game.duration}`, color: MUTED, weight: 600 }], center, layout.facts, 36, maxText, "center");
  fitText(context, [{ text: bringList(game), color: MUTED, weight: 600 }], center, layout.bring, 34, maxText, "center");

  context.font = `600 ${format === "story" ? 46 : 42}px ${DISPLAY_FONT}`;
  wrapText(context, game.line, maxText, 2).forEach((text, index) => fitText(context, [{ text, color: INK, weight: 600, display: true }], center, layout.line + index * 58, format === "story" ? 46 : 42, maxText, "center"));
  context.restore();

  drawFooterBand(context, format, "আসছ তো?", site, { band: INK, ask: LIME, site: "#ffffff" });
}

export const posterBlob = (invite: Invite, game: Game, format: CardFormat, site: string) => renderCard(canvas => drawPoster(canvas, invite, game, format, site));

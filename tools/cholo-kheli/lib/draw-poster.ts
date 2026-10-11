import { cardSizes, DISPLAY_FONT, drawFooterBand, fitText, renderCard, storySafe, wrapText, type CardFormat } from "../../../shared/card-canvas";
import { drawings } from "./drawings";
import type { Game } from "./games";
import { bn, bringList, headline, placeOf, type Invite } from "./invite";
import { championKicker, championNames, champions, championStats, ludoLine, PIECES, playerName, tallyPath, type Ludo } from "./ludo";

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

/** Blue wall with the white sheet taped on. The sheet sits a little crooked, the way a notice gets taped to a wall; its tilt stays on until the caller restores. */
function startSheet(canvas: HTMLCanvasElement, format: CardFormat, sheet: readonly number[]) {
  const { width, height } = cardSizes[format];
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext("2d");
  if (!context) throw new Error("এই ব্রাউজারে ছবি বানানো যাচ্ছে না।");
  context.fillStyle = BLUE;
  context.fillRect(0, 0, width, height);

  const [sx, sy, sw, sh] = sheet;
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
  return context;
}

/** A word on a lime highlighter stroke, the way the poster marks the time. */
function highlighted(context: CanvasRenderingContext2D, text: string, center: number, y: number, size: number, maxText: number) {
  context.font = `800 ${size}px ${DISPLAY_FONT}`;
  const textWidth = Math.min(context.measureText(text).width, maxText);
  context.fillStyle = LIME;
  context.fillRect(center - textWidth / 2 - 24, y - size * 0.44, textWidth + 48, size * 0.6);
  fitText(context, [{ text, color: INK, weight: 800, display: true }], center, y, size, maxText, "center");
}

function drawArt(context: CanvasRenderingContext2D, id: string, center: number, top: number, size: number) {
  const drawing = drawings[id];
  if (!drawing) return;
  context.save();
  context.translate(center - size / 2, top);
  context.scale(size / 100, size / 100);
  context.strokeStyle = BLUE;
  context.lineWidth = 2.6;
  context.lineCap = "round";
  context.lineJoin = "round";
  context.stroke(new Path2D(drawing.path));
  for (const label of drawing.labels ?? []) fitText(context, [{ text: label.text, color: BLUE, weight: 600 }], label.x, label.y + label.size * 0.35, label.size, 40, "center");
  context.restore();
}

export function drawPoster(canvas: HTMLCanvasElement, invite: Invite, game: Game, format: CardFormat, site: string) {
  const { width } = cardSizes[format];
  const layout = layouts[format];
  const context = startSheet(canvas, format, layout.sheet);
  const [, , sw] = layout.sheet;
  const center = width / 2, maxText = sw - 120;
  const who = invite.name ? `${invite.name} ডাকছে` : "চলো খেলি!";
  fitText(context, [{ text: who, color: BLUE, weight: 700, display: true }], center, layout.kicker, format === "story" ? 52 : 46, maxText, "center");

  highlighted(context, headline(invite), center, layout.head, format === "story" ? 112 : 104, maxText);
  drawArt(context, game.id, center, layout.art[0], layout.art[1]);

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

const championLayouts = {
  feed: { sheet: [52, 44, 976, 1160], kicker: 150, name: 284, stats: 368, art: [404, 250], rows: 742, step: 84, line: 1118 },
  story: { sheet: [52, storySafe.top - 40, 976, 1420], kicker: 352, name: 496, stats: 586, art: [628, 330], rows: 1072, step: 104, line: 1508 },
} as const;

/** The champion notice: who won, by how much, and every player's tally marks, best first. */
export function drawChampion(canvas: HTMLCanvasElement, ludo: Ludo, format: CardFormat, site: string) {
  const { width } = cardSizes[format];
  const layout = championLayouts[format];
  const context = startSheet(canvas, format, layout.sheet);
  const center = width / 2, maxText = layout.sheet[2] - 120, story = format === "story";

  fitText(context, [{ text: championKicker(ludo), color: BLUE, weight: 700, display: true }], center, layout.kicker, story ? 54 : 50, maxText, "center");
  highlighted(context, championNames(ludo), center, layout.name, story ? 124 : 116, maxText);
  fitText(context, [{ text: championStats(ludo), color: BLUE, weight: 700, display: true }], center, layout.stats, story ? 54 : 50, maxText, "center");
  drawArt(context, "ludo", center, layout.art[0], layout.art[1]);

  const leaders = champions(ludo.wins);
  const order = ludo.wins.map((_, index) => index).sort((a, b) => ludo.wins[b] - ludo.wins[a]);
  const first = layout.rows + (PIECES.length - order.length) * layout.step / 2;
  order.forEach((player, row) => {
    const y = first + row * layout.step;
    if (leaders.includes(player)) { context.fillStyle = LIME; context.fillRect(130, y - 54, 820, 74); }
    context.beginPath();
    context.arc(166, y - 16, 18, 0, Math.PI * 2);
    context.fillStyle = PIECES[player].color;
    context.fill();
    context.lineWidth = 4;
    context.strokeStyle = INK;
    context.stroke();
    fitText(context, [{ text: playerName(ludo.names, player), color: INK, weight: 700 }], 204, y, story ? 46 : 44, 330, "left");
    context.save();
    context.translate(560, y - 48);
    context.scale(2.6, 2.6);
    context.strokeStyle = BLUE;
    context.lineWidth = 2.2;
    context.lineCap = "round";
    context.stroke(new Path2D(tallyPath(ludo.wins[player])));
    context.restore();
    fitText(context, [{ text: bn(ludo.wins[player]), color: BLUE, weight: 800, display: true }], 930, y, story ? 54 : 50, 80, "right");
  });

  context.font = `600 ${story ? 46 : 42}px ${DISPLAY_FONT}`;
  wrapText(context, ludoLine(ludo.wins), maxText, 2).forEach((text, index) => fitText(context, [{ text, color: INK, weight: 600, display: true }], center, layout.line + index * 58, story ? 46 : 42, maxText, "center"));
  context.restore();

  drawFooterBand(context, format, "তোমাদের বাড়িতে কে জেতে?", site, { band: INK, ask: LIME, site: "#ffffff" });
}

export const championBlob = (ludo: Ludo, format: CardFormat, site: string) => renderCard(canvas => drawChampion(canvas, ludo, format, site));

// The share card: the world's sky over the paddy, the কাকতাড়ুয়া pleased or fretting by how much was saved, as many of the
// world's birds flying off as were shooed (the boss biggest, on a finale), the grain saved big, the ক্ষেত and its stars, the
// card's own line. Drawn with the same paint and art as the game.
import { cardSizes, drawFooterBand, fitText, renderCard, wrapText, BODY_FONT, type CardFormat } from "../../../shared/card-canvas";
import { LOOKS, WINGS_DOWN, WINGS_UP, drawBird, drawScarecrow, type BirdLook } from "./art";
import { HORIZON } from "./field";
import { isFinale, levelOf, WORLDS, type Look } from "./levels";
import { bn, bossName, humanLine, levelLabel } from "./lines";
import { PALETTES, paintField, paintFront, paintMist } from "./paint";
import { starsOf } from "./afternoon";
import type { Shared } from "./challenge";

/** Ink for the words, the slip they sit on, the footer band: one set per world, chosen to read on that sky. */
const INKS: Record<Look, { ink: string; sub: string; slip: string; slipInk: string; band: string; ask: string; site: string }> = {
  amon: { ink: "#4a2410", sub: "#7a3a14", slip: "#fff7e4ee", slipInk: "#4a2410", band: "#3a1d0e", ask: "#ffe08a", site: "#fff7e4" },
  kuasha: { ink: "#1f2c34", sub: "#3b4e58", slip: "#f7faf4ee", slipInk: "#1f2c34", band: "#26323a", ask: "#ffe08a", site: "#f4f6ee" },
  morol: { ink: "#fff0e4", sub: "#ffd9b8", slip: "#2a1630dd", slipInk: "#fff0e4", band: "#2a1630", ask: "#ffc857", site: "#fff0e4" },
};

const SPOTS: ReadonlyArray<readonly [number, number, number, number]> = [[90, 230, 70, 1], [960, 180, 64, -1], [150, 420, 56, 1], [1000, 400, 60, -1], [60, 560, 50, 1], [880, 300, 48, -1], [240, 160, 46, 1]];
const KIND_LOOKS: readonly BirdLook[] = [LOOKS.sparrow, LOOKS.shalik, LOOKS.munia];
const BOSS_LOOKS: readonly BirdLook[] = [LOOKS.godha, LOOKS.jhunti, LOOKS.parrot];

function star(c: CanvasRenderingContext2D, cx: number, cy: number, r: number, fill: string) {
  c.beginPath();
  for (let i = 0; i < 10; i++) {
    const angle = -Math.PI / 2 + i * Math.PI / 5, radius = i % 2 ? r * 0.45 : r;
    c.lineTo(cx + Math.cos(angle) * radius, cy + Math.sin(angle) * radius);
  }
  c.closePath(); c.fillStyle = fill; c.fill();
}

export function drawCard(canvas: HTMLCanvasElement, shared: Shared, format: CardFormat, site: string) {
  const { width, height } = cardSizes[format];
  canvas.width = width; canvas.height = height;
  const c = canvas.getContext("2d");
  if (!c) throw new Error("এই ব্রাউজারে ছবি বানানো যাচ্ছে না।");
  const story = format === "story", cx = width / 2, row = levelOf(shared.level), world = WORLDS[row.world], p = PALETTES[world.look], ink = INKS[world.look];
  // The story's taller area stretches the feed's positions; its footer band starts at 1660.
  const y = (feedY: number) => story ? 120 + feedY * 1.228 : feedY;
  const horizon = y(560), k = story ? 3.2 : 3, bottom = story ? height - 260 : height - 96;

  // The field: the world's paint at card scale, with its horizon where the words leave room for the sky.
  c.save();
  c.translate(0, horizon - HORIZON * k); c.scale(k, k);
  paintField(c, p, 0, -(horizon / k) - 4, width / k);
  if (p.mist) paintMist(c, 0, -(horizon / k) - 4, width / k);
  c.restore();
  c.save(); c.translate(0, bottom - 80 * k); c.scale(k, k); paintFront(c, p, 0, width / k); c.restore();

  // The কাকতাড়ুয়া, pleased or fretting.
  const saved = shared.grain;
  c.save(); c.translate(790, y(1130)); drawScarecrow(c, y(1130) - y(560) - 20, saved >= 70 ? 0 : saved >= 40 ? 1 : 2); c.restore();

  // Birds flying off, up and away from the field: as many as were shooed (seven at most), the boss first on a finale.
  const kinds = Math.min(KIND_LOOKS.length, row.world + 1);
  const finale = isFinale(shared.level);
  for (let index = 0; index < Math.min(SPOTS.length, shared.shooed); index++) {
    const [x, at, size, facing] = SPOTS[index];
    const boss = finale && index === 0;
    c.save(); c.translate(x, y(at)); c.scale(facing, 1); c.rotate(-0.2);
    drawBird(c, boss ? size * 1.5 : size, index % 2 ? WINGS_UP : WINGS_DOWN, boss ? BOSS_LOOKS[row.world] : KIND_LOOKS[index % kinds]);
    c.restore();
  }

  // The title row: the game, the name, the ক্ষেত; the stars under it.
  const earned = starsOf(shared.level, shared.grain);
  const who = shared.name.trim();
  fitText(c, [
    { text: "চড়ুই তাড়াও", color: ink.ink, weight: 800, display: true },
    ...(who ? [{ text: ` · ${who}`, color: ink.sub, weight: 700, display: true }] : []),
    { text: ` · ${levelLabel(shared.level)}`, color: ink.sub, weight: 700, display: true },
  ], cx, y(140), 52, 900, "center");
  for (let i = 0; i < 3; i++) star(c, cx + (i - 1) * 76, y(196), 28, i < earned ? "#f2b01e" : ink.ink + "33");
  fitText(c, [{ text: `${bn(shared.grain)}%`, color: ink.ink, weight: 800, display: true }], cx, y(400), 200, 700, "center");
  fitText(c, [{ text: "ধান বাঁচল", color: ink.ink, weight: 800, display: true }], cx, y(468), 64, 700, "center");

  // The birds shooed, on a little ribbon; a finale's name on top of it.
  c.font = `700 40px ${BODY_FONT}`;
  const ribbon = finale && shared.grain > 0 ? `${bossName(shared.level)} পালাল · ${bn(shared.shooed)}টা হুশ!` : `${bn(shared.shooed)}টা পাখি হুশ!`;
  const ribbonWidth = Math.min(820, c.measureText(ribbon).width + 70), ribbonTop = y(508);
  c.fillStyle = "#3a1d0ed9";
  c.beginPath(); c.roundRect(cx - ribbonWidth / 2, ribbonTop, ribbonWidth, 64, 32); c.fill();
  fitText(c, [{ text: ribbon, color: "#ffe08a", weight: 700 }], cx, ribbonTop + 45, 40, ribbonWidth - 40, "center");

  // The human line on a slip at the field's edge.
  c.font = `700 42px ${BODY_FONT}`;
  const lines = wrapText(c, humanLine(shared), 560, 3);
  const slipTop = bottom - 40 - lines.length * 56 - 44;
  c.fillStyle = ink.slip;
  c.beginPath(); c.roundRect(64, slipTop, 620, lines.length * 56 + 44, 24); c.fill();
  lines.forEach((line, index) => fitText(c, [{ text: line, color: ink.slipInk, weight: 700 }], 96, slipTop + 66 + index * 56, 42, 560));
  drawFooterBand(c, format, "তুমি কত বাঁচাবে?", site, { band: ink.band, ask: ink.ask, site: ink.site });
}

export const cardBlob = (shared: Shared, format: CardFormat, site: string) => renderCard(canvas => drawCard(canvas, shared, format, site));

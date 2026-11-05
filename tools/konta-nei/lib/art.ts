// Drawing: the 20 goods, the shelf, the shopkeeper and his counter. Plain Canvas 2D paths, used by the game and the card.
// The game pre-renders the shop (drawBack) and one sprite per thing (drawSprite) and moves those bitmaps (draw.hot.ts).
import { BODY_FONT } from "../../../shared/card-canvas";
import { itemName, type ItemId } from "./items";

type C = CanvasRenderingContext2D;
const INK = "#3a2a1c";
const TAU = Math.PI * 2;

export const palette = {
  ink: INK, paper: "#f6eedd", muted: "#6d5d4b", wood: "#9a6438", woodDark: "#6e4325", tag: "#fffaf0",
  awning: "#c8402e", star: "#f2b51c", good: "#2f9e5b", bad: "#d4553f",
  walls: ["#3d6e70", "#34507a", "#6b3e3a"],
};

/** One palette per shop: the wall behind the shelf, and the awning's two stripes. */
export const WORLD_ART = [
  { wall: "#3d6e70", awning: "#c8402e", stripe: "#f5efe0", glow: "#ffd166" },
  { wall: "#34507a", awning: "#2e7d4f", stripe: "#f5efe0", glow: "#ffd166" },
  { wall: "#6b3e3a", awning: "#e0a21b", stripe: "#fff4d6", glow: "#ffe08a" },
] as const;

function rr(c: C, x: number, y: number, w: number, h: number, r: number) {
  c.moveTo(x + r, y);
  c.arcTo(x + w, y, x + w, y + h, r); c.arcTo(x + w, y + h, x, y + h, r);
  c.arcTo(x, y + h, x, y, r); c.arcTo(x, y, x + w, y, r);
  c.closePath();
}
const el = (c: C, x: number, y: number, rx: number, ry: number, turn = 0) => { c.moveTo(x + rx * Math.cos(turn), y + rx * Math.sin(turn)); c.ellipse(x, y, rx, ry, turn, 0, TAU); };
/** Fill a path with an ink outline (or without one). */
function shape(c: C, fill: string, path: () => void, outline = true) {
  c.beginPath(); path();
  c.fillStyle = fill; c.fill();
  if (outline) c.stroke();
}
function dots(c: C, color: string, points: readonly number[], r: number) {
  c.beginPath();
  for (let i = 0; i < points.length; i += 2) el(c, points[i], points[i + 1], r, r);
  c.fillStyle = color; c.fill();
}
function line(c: C, color: string, width: number, points: readonly number[]) {
  c.beginPath(); c.moveTo(points[0], points[1]);
  for (let i = 2; i < points.length; i += 2) c.lineTo(points[i], points[i + 1]);
  c.save(); c.strokeStyle = color; c.lineWidth = width; c.stroke(); c.restore();
}

// Each item is drawn in a 100-unit box: x from -45 to 45, standing on y = 0, reaching up to about y = -95.
const DRAW: Record<ItemId, (c: C) => void> = {
  chal(c) { // a jute sack, open at the top
    shape(c, "#c9a46a", () => { c.moveTo(-30, -64); c.quadraticCurveTo(-46, -30, -36, -4); c.quadraticCurveTo(0, 4, 36, -4); c.quadraticCurveTo(46, -30, 30, -64); c.closePath(); });
    for (const y of [-48, -32, -16]) line(c, "#a8834a", 2, [-34, y, 34, y]);
    shape(c, "#a8834a", () => el(c, 0, -64, 31, 9));
    shape(c, "#fbf7ee", () => { c.moveTo(-26, -66); c.quadraticCurveTo(0, -86, 26, -66); c.closePath(); });
    dots(c, "#d9ccb0", [-12, -70, 0, -74, 10, -70, -4, -68, 16, -67], 1.8);
  },
  dal(c) { // a glass jar of orange lentils
    shape(c, "#eaf4f2", () => rr(c, -27, -72, 54, 72, 10));
    c.beginPath(); rr(c, -23, -52, 46, 48, 8); c.fillStyle = "#e8732c"; c.fill();
    dots(c, "#f6a564", [-14, -42, -2, -44, 10, -40, -8, -30, 6, -28, 16, -22, -16, -16, 0, -14, 12, -10], 2.6);
    line(c, "#ffffffcc", 4, [-18, -64, -18, -16]);
    shape(c, "#8e3b22", () => rr(c, -21, -84, 42, 13, 3));
  },
  tel(c) { // a tall bottle of oil
    shape(c, "#f6e9b6", () => { c.moveTo(-7, -86); c.lineTo(-7, -74); c.quadraticCurveTo(-20, -70, -20, -58); c.lineTo(-20, -6); c.quadraticCurveTo(-20, 0, -14, 0); c.lineTo(14, 0); c.quadraticCurveTo(20, 0, 20, -6); c.lineTo(20, -58); c.quadraticCurveTo(20, -70, 7, -74); c.lineTo(7, -86); c.closePath(); });
    c.beginPath(); rr(c, -16, -56, 32, 52, 5); c.fillStyle = "#e7b416"; c.fill();
    shape(c, "#fff6dc", () => rr(c, -20, -40, 40, 15, 1));
    line(c, "#c8402e", 3, [-12, -32.5, 12, -32.5]);
    shape(c, "#c8402e", () => rr(c, -9, -96, 18, 11, 2));
  },
  lobon(c) { // a white pillow packet with a blue band
    shape(c, "#f8f8f4", () => {
      c.moveTo(-24, -66);
      for (let x = -24; x < 24; x += 8) { c.lineTo(x + 4, -72); c.lineTo(x + 8, -66); }
      c.lineTo(26, -4); c.quadraticCurveTo(26, 0, 22, 0); c.lineTo(-22, 0); c.quadraticCurveTo(-26, 0, -26, -4); c.closePath();
    });
    c.beginPath(); c.rect(-25, -46, 50, 20); c.fillStyle = "#2f6fd1"; c.fill();
    dots(c, "#ffffff", [-14, -36, -4, -32, 6, -39, 15, -34], 2.2);
  },
  cha(c) { // a red tin with a tea leaf
    shape(c, "#b03a2e", () => rr(c, -25, -62, 50, 62, 4));
    shape(c, "#7e2a20", () => rr(c, -27, -71, 54, 12, 3));
    shape(c, "#9bd17a", () => { c.moveTo(0, -50); c.quadraticCurveTo(18, -34, 0, -10); c.quadraticCurveTo(-18, -34, 0, -50); });
    line(c, "#4f8a35", 2, [0, -46, 0, -14]);
  },
  biskut(c) { // three round biscuits
    for (const [x, y] of [[-15, -19], [15, -19], [0, -47]]) {
      shape(c, "#d99a4e", () => el(c, x, y, 18, 18));
      c.beginPath(); el(c, x, y, 13, 13); c.save(); c.strokeStyle = "#f0bf7a"; c.lineWidth = 2; c.stroke(); c.restore();
      dots(c, "#a8692c", [x - 5, y - 4, x + 5, y - 4, x, y + 1, x - 5, y + 6, x + 5, y + 6], 1.8);
    }
  },
  dim(c) { // three eggs in a tray
    for (const [x, y] of [[-22, -24], [0, -28], [22, -24]]) shape(c, "#fbf1dc", () => el(c, x, y, 11, 15));
    line(c, "#ffffffcc", 3, [-25, -32, -24, -26]);
    shape(c, "#b9a58a", () => { c.moveTo(-40, -16); c.quadraticCurveTo(-33, -10, -26, -16); c.quadraticCurveTo(-11, -10, 0, -16); c.quadraticCurveTo(11, -10, 26, -16); c.quadraticCurveTo(33, -10, 40, -16); c.lineTo(35, 0); c.lineTo(-35, 0); c.closePath(); });
  },
  peyaj(c) { // a purple-red onion with a green sprout
    line(c, "#5f9e3b", 4, [0, -74, 5, -92]);
    shape(c, "#a8324f", () => { c.moveTo(0, -76); c.quadraticCurveTo(4, -60, 22, -46); c.bezierCurveTo(40, -30, 30, 0, 0, 0); c.bezierCurveTo(-30, 0, -40, -30, -22, -46); c.quadraticCurveTo(-4, -60, 0, -76); c.closePath(); });
    c.save(); c.strokeStyle = "#7d2139"; c.lineWidth = 2;
    c.beginPath(); c.moveTo(-2, -70); c.quadraticCurveTo(-20, -30, -8, -3); c.moveTo(2, -70); c.quadraticCurveTo(20, -30, 8, -3); c.stroke(); c.restore();
    line(c, "#f3c1cf", 3, [-16, -40, -14, -26]);
  },
  alu(c) { // two lumpy potatoes
    shape(c, "#b98446", () => el(c, -12, -17, 24, 16, -0.2));
    shape(c, "#c99556", () => el(c, 14, -34, 21, 15, 0.35));
    dots(c, "#7a5328", [-20, -18, -6, -12, -12, -24, 10, -36, 20, -30], 1.8);
  },
  saban(c) { // a pink bar of soap with bubbles
    shape(c, "#ef8fb0", () => rr(c, -32, -30, 64, 30, 12));
    c.beginPath(); rr(c, -25, -26, 50, 14, 7); c.fillStyle = "#f8bdd2"; c.fill();
    c.save(); c.strokeStyle = "#5d9cc4"; c.lineWidth = 2;
    for (const [x, y, r] of [[-14, -44, 7], [3, -55, 9], [19, -42, 6]]) { c.beginPath(); el(c, x, y, r, r); c.fillStyle = "#ffffffb0"; c.fill(); c.stroke(); }
    c.restore();
  },
  deshlai(c) { // a matchbox, drawer pulled out, one match
    shape(c, "#e6c08a", () => rr(c, 7, -64, 5, 40, 2));
    shape(c, "#c8402e", () => el(c, 9.5, -66, 5, 7));
    shape(c, "#d7b58a", () => rr(c, -30, -38, 40, 12, 2));
    shape(c, "#f4d03f", () => rr(c, -24, -30, 50, 30, 3));
    c.beginPath(); c.rect(-24, -30, 50, 6); c.fillStyle = "#8e3b22"; c.fill();
    shape(c, "#c8402e", () => el(c, 1, -12, 8, 8));
  },
  chini(c) { // white sugar in a clear bag tied at the neck
    shape(c, "#ffffff", () => { c.moveTo(-6, -70); c.quadraticCurveTo(-31, -56, -31, -24); c.quadraticCurveTo(-31, 0, 0, 0); c.quadraticCurveTo(31, 0, 31, -24); c.quadraticCurveTo(31, -56, 6, -70); c.closePath(); });
    dots(c, "#c4d3dd", [-16, -30, -6, -20, 6, -34, 16, -22, -10, -44, 10, -48, 0, -10, 20, -40, -20, -16], 2);
    shape(c, "#ffffff", () => { c.moveTo(-3, -72); c.lineTo(-11, -90); c.lineTo(0, -82); c.lineTo(11, -90); c.lineTo(3, -72); c.closePath(); });
    line(c, "#2f6fd1", 4, [-8, -71, 8, -71]);
  },
  ata(c) { // a tall paper sack of flour with a wheat stalk
    shape(c, "#f1e3c4", () => { c.moveTo(-23, -80); c.lineTo(23, -80); c.lineTo(26, 0); c.lineTo(-26, 0); c.closePath(); });
    shape(c, "#dcc79a", () => rr(c, -24, -88, 48, 11, 2));
    line(c, "#b9852a", 3, [0, -10, 0, -60]);
    c.beginPath();
    for (const y of [-58, -48, -38, -28]) { el(c, -6, y, 4, 7, -0.5); el(c, 6, y, 4, 7, 0.5); }
    c.fillStyle = "#d9a53a"; c.fill();
  },
  muri(c) { // a bamboo basket heaped with puffed rice
    c.beginPath();
    for (const [x, y] of [[-26, -40], [-14, -44], [-2, -46], [10, -45], [22, -41], [-20, -50], [-6, -54], [8, -53], [18, -49], [0, -60], [-12, -58], [12, -59]]) el(c, x, y, 7, 6);
    c.fillStyle = "#fbf6ea"; c.fill();
    c.save(); c.strokeStyle = "#d3c6aa"; c.lineWidth = 1.5; c.stroke(); c.restore();
    shape(c, "#c79a54", () => { c.moveTo(-38, -36); c.lineTo(38, -36); c.lineTo(28, 0); c.lineTo(-28, 0); c.closePath(); });
    c.save(); c.strokeStyle = "#9b7238"; c.lineWidth = 2; c.beginPath();
    for (let x = -36; x <= 30; x += 11) { c.moveTo(x, -34); c.lineTo(x + 8, -2); c.moveTo(x + 8, -34); c.lineTo(x, -2); }
    c.stroke(); c.restore();
    shape(c, "#a97c3c", () => rr(c, -41, -40, 82, 7, 3));
  },
  dudh(c) { // a round tin of milk powder
    shape(c, "#7fb3d5", () => { c.moveTo(-23, -62); c.lineTo(-23, -4); c.ellipse(0, -4, 23, 5, 0, Math.PI, 0, true); c.lineTo(23, -62); c.closePath(); });
    c.beginPath(); c.rect(-23, -46, 46, 26); c.fillStyle = "#ffffff"; c.fill();
    shape(c, "#ffffff", () => { c.moveTo(-6, -42); c.lineTo(6, -42); c.lineTo(4.5, -24); c.lineTo(-4.5, -24); c.closePath(); });
    c.beginPath(); c.rect(-5.4, -36, 10.8, 11); c.fillStyle = "#cfe3f2"; c.fill();
    shape(c, "#d5dde3", () => el(c, 0, -62, 23, 6));
  },
  roshun(c) { // a white bulb of garlic
    line(c, "#cfc5b2", 3, [-3, -64, -5, -78]); line(c, "#cfc5b2", 3, [3, -64, 6, -78]);
    shape(c, "#f4efe4", () => { c.moveTo(0, -64); c.quadraticCurveTo(10, -52, 26, -42); c.bezierCurveTo(44, -24, 28, 0, 0, 0); c.bezierCurveTo(-28, 0, -44, -24, -26, -42); c.quadraticCurveTo(-10, -52, 0, -64); c.closePath(); }); // unslop-ignore: painted object colour in the canvas art, not a page background
    c.save(); c.strokeStyle = "#c2b6a2"; c.lineWidth = 2; c.beginPath();
    c.moveTo(-3, -60); c.quadraticCurveTo(-22, -28, -10, -2); c.moveTo(3, -60); c.quadraticCurveTo(22, -28, 10, -2); c.moveTo(0, -60); c.lineTo(0, -1); c.stroke(); c.restore();
    line(c, "#d9a7b8", 3, [-20, -30, -17, -16]);
  },
  morich(c) { // three dried red chillies
    for (const [x, turn] of [[-15, -0.28], [0, 0], [15, 0.28]]) {
      c.save(); c.translate(x, 0); c.rotate(turn);
      shape(c, "#b3261e", () => { c.moveTo(-6, -64); c.bezierCurveTo(-9, -38, -4, -14, 7, -2); c.bezierCurveTo(7, -18, 7, -42, 6, -64); c.closePath(); });
      shape(c, "#4f8a35", () => rr(c, -5, -72, 10, 9, 2));
      c.restore();
    }
  },
  kola(c) { // a hand of bananas
    for (const [x, turn] of [[-8, -0.32], [2, 0], [12, 0.32]]) {
      c.save(); c.translate(x, -66); c.rotate(turn);
      shape(c, "#f5cf3a", () => { c.moveTo(-4, 0); c.quadraticCurveTo(-30, 30, -8, 62); c.quadraticCurveTo(-2, 64, 0, 58); c.quadraticCurveTo(-14, 30, 6, 2); c.closePath(); });
      c.restore();
    }
    shape(c, "#6e4325", () => rr(c, -4, -76, 14, 12, 3));
  },
  mombati(c) { // a bundle of white candles
    for (const [x, top] of [[-18, -74], [-5, -82], [8, -72]]) {
      line(c, INK, 2.5, [x + 5, top, x + 5, top - 7]);
      shape(c, "#fdfbf3", () => rr(c, x, top, 10, -top, 2));
    }
    shape(c, "#c8402e", () => rr(c, -21, -36, 42, 10, 2));
  },
  narkel(c) { // a brown, hairy coconut
    shape(c, "#7a4a2a", () => el(c, 0, -33, 32, 31));
    c.save(); c.strokeStyle = "#ad7446"; c.lineWidth = 2; c.beginPath();
    for (const [x, y] of [[-20, -20], [-14, -50], [16, -48], [22, -24], [-2, -10], [8, -56], [-24, -36], [24, -38]]) { c.moveTo(x, y); c.lineTo(x + 6, y + 5); }
    c.stroke(); c.restore();
    dots(c, "#3a2416", [-7, -42, 7, -42, 0, -31], 3.4);
  },
};

/** One item standing on `bottom`, about `size` px tall. */
export function drawItem(c: C, id: ItemId, cx: number, bottom: number, size: number) {
  c.save();
  c.translate(cx, bottom);
  c.scale(size / 100, size / 100);
  c.lineWidth = 3.2; c.lineJoin = "round"; c.lineCap = "round"; c.strokeStyle = INK;
  DRAW[id](c);
  c.restore();
}

// ---- the shelf ----
export type Slot = { cx: number; floor: number; width: number };

/** Items per plank for a level's shelf: two planks up to 8 items, three after; as even as possible (7 → 4 + 3). */
export function rowsFor(count: number, planks = count <= 8 ? 2 : 3) {
  const base = Math.floor(count / planks), extra = count % planks;
  return Array.from({ length: planks }, (_, index) => base + (index < extra ? 1 : 0));
}

/** The shelf's measurements for a level with `base` items: planks, columns, and how big an item is drawn. */
export function shelfGeometry(width: number, height: number, base: number) {
  const planks = rowsFor(base).length, cols = Math.max(...rowsFor(base));
  const awning = Math.round(height * 0.065), counter = Math.round(height * 0.27), pad = width * 0.04;
  const rowHeight = (height - awning - counter) / planks, plank = Math.max(17, Math.min(width * 0.073, rowHeight * 0.24)), cell = (width - pad * 2) / cols;
  return { planks, awning, counter, pad, rowHeight, plank, cell, itemSize: Math.min(cell * 0.8, (rowHeight - plank) * 0.86) };
}

/** Where each of `count` places sits on a shelf made for `base` items (a reshuffled shelf has one fewer, same planks). */
export function slotsFor(count: number, width: number, height: number, base = count): Slot[] {
  const g = shelfGeometry(width, height, base), slots: Slot[] = [];
  rowsFor(count, g.planks).forEach((items, row) => {
    const floor = g.awning + (row + 1) * g.rowHeight - g.plank;
    for (let index = 0; index < items; index++) slots.push({ cx: width / 2 + (index - (items - 1) / 2) * g.cell, floor, width: g.cell });
  });
  return slots;
}

export type ShelfView = {
  items: readonly (ItemId | null)[];
  /** how many items the level's shelf holds: sets the planks and columns */
  base: number;
  world: number;
  keeper: "front" | "back";
  /** a ring round one place: green for the item you found, red-orange for one you missed */
  mark?: { slot: number; good: boolean } | null;
  /** a "?" tag in this empty place (the card) */
  ask?: number | null;
  /** "?" tags in these empty places (the card of a finale, where two went) */
  asks?: readonly number[];
  /** no name tags under the things */
  plain?: boolean;
};

function awning(c: C, width: number, height: number, world = 0) {
  const stripe = width / 12, art = WORLD_ART[world] ?? WORLD_ART[0];
  for (let i = 0; i < 12; i++) {
    c.beginPath();
    c.moveTo(i * stripe, 0); c.lineTo((i + 1) * stripe, 0); c.lineTo((i + 1) * stripe, height - stripe / 2);
    c.arc((i + 0.5) * stripe, height - stripe / 2, stripe / 2, 0, Math.PI);
    c.closePath();
    c.fillStyle = i % 2 ? art.stripe : art.awning; c.fill();
  }
}

export function tag(c: C, text: string, cx: number, top: number, height: number, maxWidth: number, color = INK) {
  const size = Math.max(10, Math.round(height * 0.62));
  c.font = `700 ${size}px ${BODY_FONT}`;
  const width = Math.min(maxWidth, c.measureText(text).width + size * 0.9);
  c.beginPath(); rr(c, cx - width / 2, top, width, height, height * 0.22);
  c.fillStyle = palette.tag; c.fill();
  c.lineWidth = 1; c.strokeStyle = "#00000033"; c.stroke();
  c.fillStyle = color; c.textAlign = "center"; c.textBaseline = "middle";
  c.fillText(text, cx, top + height * 0.54, maxWidth - size * 0.4);
}

/** The মামা behind his counter: facing you, or turned to the shelf with his back to you. */
export function drawKeeper(c: C, cx: number, bottom: number, size: number, facing: "front" | "back") {
  c.save();
  c.translate(cx, bottom); c.scale(size / 100, size / 100);
  c.lineWidth = 3; c.lineJoin = "round"; c.strokeStyle = INK;
  shape(c, "#ece5d2", () => { c.moveTo(-44, 0); c.quadraticCurveTo(-42, -44, 0, -48); c.quadraticCurveTo(42, -44, 44, 0); c.closePath(); });
  shape(c, "#b7794f", () => rr(c, -7, -58, 14, 14, 4));
  // গামছা over one shoulder: red with green checks
  const side = facing === "front" ? 1 : -1;
  shape(c, "#c8402e", () => { c.moveTo(side * 6, -47); c.quadraticCurveTo(side * 30, -46, side * 40, -20); c.lineTo(side * 30, -14); c.quadraticCurveTo(side * 24, -36, side * 4, -40); c.closePath(); });
  line(c, "#2e7d4f", 2.5, [side * 18, -45, side * 12, -38]); line(c, "#2e7d4f", 2.5, [side * 30, -38, side * 22, -31]);
  if (facing === "front") {
    shape(c, "#b7794f", () => el(c, 0, -76, 19, 22));
    shape(c, "#1f1a17", () => { c.moveTo(-19, -78); c.quadraticCurveTo(-20, -100, 0, -99); c.quadraticCurveTo(20, -100, 19, -78); c.quadraticCurveTo(12, -90, 0, -89); c.quadraticCurveTo(-12, -90, -19, -78); c.closePath(); }, false);
    dots(c, "#1f1a17", [-7, -78, 7, -78], 2.4);
    shape(c, "#1f1a17", () => { c.moveTo(-10, -66); c.quadraticCurveTo(0, -71, 10, -66); c.quadraticCurveTo(0, -67, -10, -66); c.closePath(); }, false);
    c.beginPath(); c.moveTo(-6, -62); c.quadraticCurveTo(0, -58, 6, -62); c.lineWidth = 2.4; c.stroke();
  } else {
    shape(c, "#b7794f", () => { el(c, -19, -76, 4, 6); el(c, 19, -76, 4, 6); });
    shape(c, "#1f1a17", () => el(c, 0, -78, 19, 22), false);
    shape(c, "#b7794f", () => rr(c, -10, -60, 20, 6, 3), false);
  }
  c.restore();
}

/** The shop without its goods: wall, planks, awning, the মামা and his counter. Pre-rendered once per size and pose. */
export function drawBack(c: C, width: number, height: number, base: number, world: number, keeper: "front" | "back") {
  const g = shelfGeometry(width, height, base);
  c.fillStyle = (WORLD_ART[world] ?? WORLD_ART[0]).wall;
  c.fillRect(0, 0, width, height);
  // planks with a lighter top edge
  for (let row = 0; row < g.planks; row++) {
    const top = g.awning + (row + 1) * g.rowHeight - g.plank;
    c.fillStyle = palette.wood; c.fillRect(0, top, width, g.plank);
    c.fillStyle = "#b67a47"; c.fillRect(0, top, width, Math.max(2, g.plank * 0.18));
    c.fillStyle = "#00000026"; c.fillRect(0, top + g.plank, width, 3);
  }
  awning(c, width, g.awning, world);
  // the counter: the মামা stands behind it, only his head and shoulders above it, never in front of the goods
  const counterTop = height - g.counter * 0.32, size = (g.counter * 0.68 - 4) / 0.79;
  drawKeeper(c, width * 0.17, counterTop + size * 0.2, size, keeper);
  c.fillStyle = palette.woodDark; c.fillRect(0, counterTop, width, height - counterTop);
  c.fillStyle = "#8a5a33"; c.fillRect(0, counterTop, width, Math.max(3, g.counter * 0.06));
  const box = g.counter * 0.42;
  c.lineWidth = 2; c.strokeStyle = INK;
  shape(c, "#5a3a22", () => rr(c, width * 0.8 - box * 0.7, counterTop - box * 0.62, box * 1.4, box * 0.62, 4));
  c.beginPath(); c.rect(width * 0.8 - box * 0.25, counterTop - box * 0.5, box * 0.5, box * 0.1); c.fillStyle = "#d8b25a"; c.fill();
  shape(c, "#2f6fd1", () => rr(c, width * 0.56, counterTop - box * 0.24, box * 0.9, box * 0.24, 2));
}

/** A sprite's box for a shelf: one column wide, the thing plus its tag tall, standing on `floor` px from its top. */
export function spriteBox(width: number, height: number, base: number) {
  const g = shelfGeometry(width, height, base);
  const floor = Math.ceil(g.itemSize * 1.08) + 2;
  return { w: Math.ceil(g.cell), h: Math.ceil(floor + g.plank), floor };
}

/** One thing and its name tag, drawn into a sprite whose box comes from spriteBox. */
export function drawSprite(c: C, id: ItemId, width: number, height: number, base: number, plain: boolean) {
  const g = shelfGeometry(width, height, base), box = spriteBox(width, height, base);
  drawItem(c, id, box.w / 2, box.floor, g.itemSize);
  if (!plain) tag(c, itemName(id), box.w / 2, box.floor + g.plank * 0.18, g.plank * 0.74, g.cell * 0.96);
}

/** A ring round one place: green for a thing you found, red-orange for one you missed. */
export function drawRing(c: C, cx: number, floor: number, width: number, height: number, base: number, good: boolean) {
  const g = shelfGeometry(width, height, base), cell = g.cell;
  c.beginPath(); rr(c, cx - cell * 0.46, floor - g.itemSize * 1.08, cell * 0.92, g.itemSize * 1.08 + g.plank * 0.96, 10);
  c.fillStyle = good ? "#2f9e5b33" : "#d4553f33"; c.fill();
  c.lineWidth = 3.5; c.strokeStyle = good ? "#7fe0a4" : "#ffb199"; c.stroke();
}

/** The whole shop front in a `width` × `height` box at the top-left corner (the card, and anything drawn once). */
export function drawShelf(c: C, width: number, height: number, view: ShelfView) {
  const g = shelfGeometry(width, height, view.base);
  drawBack(c, width, height, view.base, view.world, view.keeper);
  const slots = slotsFor(view.items.length, width, height, view.base), tagHeight = g.plank * 0.74;
  const asks = view.asks ?? (view.ask !== null && view.ask !== undefined ? [view.ask] : []);
  view.items.forEach((id, index) => {
    const slot = slots[index];
    if (view.mark?.slot === index) drawRing(c, slot.cx, slot.floor, width, height, view.base, view.mark.good);
    if (id) {
      drawItem(c, id, slot.cx, slot.floor, g.itemSize);
      if (!view.plain) tag(c, itemName(id), slot.cx, slot.floor + g.plank * 0.18, tagHeight, slot.width * 0.96);
    } else if (asks.includes(index)) {
      tag(c, "?", slot.cx, slot.floor + g.plank * 0.18, tagHeight, slot.width * 0.5, palette.awning);
      c.font = `800 ${Math.round(g.itemSize * 0.7)}px ${BODY_FONT}`;
      c.fillStyle = "#ffffffcc"; c.textAlign = "center"; c.textBaseline = "alphabetic";
      c.fillText("?", slot.cx, slot.floor - g.itemSize * 0.2);
    }
  });
}

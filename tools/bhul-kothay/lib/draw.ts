// Draws a puzzle's picture on a canvas, for the game and for the share card. Browser only (Path2D), called from components and the card.
import { DISPLAY_FONT } from "../../../shared/card-canvas";
import { matrixOf, SCENE_H, SCENE_W, type Item, type Look, type Shape } from "./shapes";

/** Anything with items and the two sides' looks: a ladder puzzle or an old one. */
export type Picture = { items: readonly Item[]; looks: readonly [readonly Look[], readonly Look[]] };

const paths = new Map<string, Path2D>();
const pathOf = (d: string) => { let found = paths.get(d); if (!found) { found = new Path2D(d); paths.set(d, found); } return found; };

function drawShape(c: CanvasRenderingContext2D, shape: Shape) {
  c.globalAlpha = shape.op ?? 1;
  if (shape.k === "t") {
    c.font = `${shape.weight ?? 700} ${shape.size}px ${DISPLAY_FONT}`;
    const width = c.measureText(shape.text).width;
    if (width > shape.max) c.font = `${shape.weight ?? 700} ${(shape.size * shape.max) / width}px ${DISPLAY_FONT}`;
    c.textAlign = "center"; c.textBaseline = "middle"; c.fillStyle = shape.fill ?? "#000";
    c.fillText(shape.text, shape.x, shape.y + shape.size * 0.08);
    return;
  }
  let target: Path2D | null = null;
  c.beginPath();
  if (shape.k === "r") c.roundRect(shape.x, shape.y, shape.w, shape.h, shape.rx ?? 0);
  else if (shape.k === "c") c.arc(shape.x, shape.y, shape.r, 0, Math.PI * 2);
  else if (shape.k === "e") c.ellipse(shape.x, shape.y, shape.rx, shape.ry, 0, 0, Math.PI * 2);
  else target = pathOf(shape.d);
  if (shape.fill && shape.fill !== "none") { c.fillStyle = shape.fill; if (target) c.fill(target); else c.fill(); }
  if (shape.stroke && shape.sw) {
    c.strokeStyle = shape.stroke; c.lineWidth = shape.sw;
    if (target) c.stroke(target); else c.stroke();
  }
}

/** One item as it looks on one side, in scene units on a context already set to scene space. */
export function drawItem(c: CanvasRenderingContext2D, item: Item, look: Look) {
  if (look.hidden) return;
  const [a, b, cc, d, e, f] = matrixOf(item, look);
  c.save();
  c.transform(a, b, cc, d, e, f);
  for (const shape of item.draw(look)) drawShape(c, shape);
  c.restore();
}

/** One side (0 or 1) of the picture, its top-left at (x, y), `scale` canvas units per scene unit; items [from, to) only, if given. */
export function drawScene(c: CanvasRenderingContext2D, picture: Picture, side: 0 | 1, x = 0, y = 0, scale = 1, from = 0, to = picture.items.length) {
  c.save();
  c.translate(x, y); c.scale(scale, scale);
  c.beginPath(); c.rect(0, 0, SCENE_W, SCENE_H); c.clip();
  c.lineJoin = "round"; c.lineCap = "round";
  for (let index = from; index < to; index++) drawItem(c, picture.items[index], picture.looks[side][index]);
  c.restore();
}

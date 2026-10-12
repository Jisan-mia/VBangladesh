// The picture model: every scene is a list of items, each a few flat shapes in its own local space. Pure and server-safe.
// Paths use only absolute M, L, Q, C and Z, so a box can be read straight off their points (the canvas draws them with Path2D).

export const SCENE_W = 360;
export const SCENE_H = 225;

export type Paint = { fill?: string; stroke?: string; sw?: number; op?: number };
export type Shape =
  | ({ k: "r"; x: number; y: number; w: number; h: number; rx?: number } & Paint)
  | ({ k: "c"; x: number; y: number; r: number } & Paint)
  | ({ k: "e"; x: number; y: number; rx: number; ry: number } & Paint)
  | ({ k: "p"; d: string } & Paint)
  /** Centred text; `max` is the widest it may draw (the canvas shrinks it to fit). Never inside a flippable item. */
  | ({ k: "t"; x: number; y: number; text: string; size: number; max: number; weight?: number } & Paint);

/** How an item looks on one side: its colour, how many of its little things, mirrored, shrunk, or not there at all. */
export type Look = { color?: string; count?: number; flip?: boolean; scale?: number; hidden?: boolean };

/** What may change about an item to make a difference. */
export type Can = { color?: readonly string[]; count?: number; flip?: boolean; size?: boolean; missing?: boolean };

export type Item = {
  id: string;
  /** What a person would call it, for the found list and screen readers: "আমের ঝুড়ি". */
  name: string;
  /** The anchor (usually the bottom centre): flips and shrinks happen around it. */
  x: number; y: number; s?: number;
  look: Look;
  draw: (look: Look) => Shape[];
  can?: Can;
};

export type Box = { x: number; y: number; w: number; h: number };
/** [a, d, e, f]: x' = a·x + e, y' = d·y + f (scales and flips only, no rotation). */
export type Matrix = readonly [number, number, number, number];

export function matrixOf(item: Item, look: Look): Matrix {
  const s = (item.s ?? 1) * (look.scale ?? 1);
  return [look.flip ? -s : s, s, item.x, item.y];
}

const PATH_TOKEN = /[MLQCZ]|-?(?:\d+\.?\d*|\.\d+)/g;

/** The points of a path, in order. Throws on anything but absolute M, L, Q, C, Z, so a box can never be wrong. */
export function pathPoints(d: string): [number, number][] {
  const rest = d.replace(PATH_TOKEN, "").trim();
  if (rest.replace(/[\s,]/g, "")) throw new Error(`path has unsupported parts: ${rest}`);
  const numbers = (d.match(PATH_TOKEN) ?? []).filter(token => !/[MLQCZ]/.test(token)).map(Number);
  if (numbers.length % 2) throw new Error(`path has an odd number of coordinates: ${d}`);
  const out: [number, number][] = [];
  for (let index = 0; index < numbers.length; index += 2) out.push([numbers[index], numbers[index + 1]]);
  return out;
}

/** The outline points that bound a shape, in local space (control points included, so the box is never too small). */
export function shapePoints(shape: Shape): [number, number][] {
  const grow = (shape.sw ?? 0) / 2;
  switch (shape.k) {
    case "r": return [[shape.x - grow, shape.y - grow], [shape.x + shape.w + grow, shape.y + shape.h + grow]];
    case "c": return [[shape.x - shape.r - grow, shape.y - shape.r - grow], [shape.x + shape.r + grow, shape.y + shape.r + grow]];
    case "e": return [[shape.x - shape.rx - grow, shape.y - shape.ry - grow], [shape.x + shape.rx + grow, shape.y + shape.ry + grow]];
    case "p": {
      const points = pathPoints(shape.d);
      return grow ? points.flatMap(([x, y]) => [[x - grow, y - grow], [x + grow, y + grow]] as [number, number][]) : points;
    }
    case "t": return [[shape.x - shape.max / 2, shape.y - shape.size * 0.7], [shape.x + shape.max / 2, shape.y + shape.size * 0.5]];
  }
}

export function boxOfPoints(points: readonly (readonly [number, number])[], [a, d, e, f]: Matrix = [1, 1, 0, 0]): Box | null {
  if (!points.length) return null;
  let left = Infinity, top = Infinity, right = -Infinity, bottom = -Infinity;
  for (const [x, y] of points) {
    const px = a * x + e, py = d * y + f;
    if (px < left) left = px; if (px > right) right = px;
    if (py < top) top = py; if (py > bottom) bottom = py;
  }
  return { x: left, y: top, w: right - left, h: bottom - top };
}

export const shapeBox = (shape: Shape, matrix?: Matrix) => boxOfPoints(shapePoints(shape), matrix)!;

/** Where an item sits in the scene with this look; null when it isn't drawn. */
export function itemBox(item: Item, look: Look): Box | null {
  if (look.hidden) return null;
  return boxOfPoints(item.draw(look).flatMap(shapePoints), matrixOf(item, look));
}

export function union(a: Box | null, b: Box | null): Box | null {
  if (!a) return b;
  if (!b) return a;
  const x = Math.min(a.x, b.x), y = Math.min(a.y, b.y);
  return { x, y, w: Math.max(a.x + a.w, b.x + b.w) - x, h: Math.max(a.y + a.h, b.y + b.h) - y };
}

export const overlaps = (a: Box, b: Box, gap = 0) =>
  a.x < b.x + b.w + gap && b.x < a.x + a.w + gap && a.y < b.y + b.h + gap && b.y < a.y + a.h + gap;

export const contains = (box: Box, x: number, y: number, slack = 0) =>
  x >= box.x - slack && x <= box.x + box.w + slack && y >= box.y - slack && y <= box.y + box.h + slack;

/** Grows a box to at least `min` on each side around its centre, keeping it inside the scene. */
export function tapRegion(box: Box, min: number, pad: number): Box {
  const w = Math.min(SCENE_W, Math.max(min, box.w + pad * 2)), h = Math.min(SCENE_H, Math.max(min, box.h + pad * 2));
  const x = Math.max(0, Math.min(SCENE_W - w, box.x + box.w / 2 - w / 2)), y = Math.max(0, Math.min(SCENE_H - h, box.y + box.h / 2 - h / 2));
  return { x, y, w, h };
}

/**
 * A shape as it lands in the scene, written as one string: kind, paint and its points after the item's move, flip and shrink.
 * Points are sorted, so a mirror image of a symmetric shape gives the same key (it looks the same) and an asymmetric one does not.
 */
export function shapeKey(shape: Shape, [a, d, e, f]: Matrix) {
  const points = shapePoints({ ...shape, sw: 0 } as Shape).map(([x, y]) => `${(a * x + e).toFixed(1)},${(d * y + f).toFixed(1)}`).sort();
  const text = shape.k === "t" ? `${shape.text}|${(shape.size * Math.abs(d)).toFixed(1)}` : "";
  return `${shape.k}|${shape.fill ?? ""}|${shape.stroke ?? ""}|${((shape.sw ?? 0) * Math.abs(d)).toFixed(2)}|${shape.op ?? 1}|${text}|${points.join(" ")}`;
}

/** The part of a box you can see in the picture (null when it's all outside). */
export function clipToScene(box: Box): Box | null {
  const x = Math.max(0, box.x), y = Math.max(0, box.y), right = Math.min(SCENE_W, box.x + box.w), bottom = Math.min(SCENE_H, box.y + box.h);
  return right > x && bottom > y ? { x, y, w: right - x, h: bottom - y } : null;
}

/** Every shape of a scene as placed and at least partly in the picture, for comparing two sides: its key and its visible box. */
export function placedShapes(items: readonly Item[], looks: readonly Look[]) {
  const out: { key: string; box: Box; item: number }[] = [];
  items.forEach((item, index) => {
    const look = looks[index];
    if (look.hidden) return;
    const matrix = matrixOf(item, look);
    for (const shape of item.draw(look)) {
      const box = clipToScene(shapeBox(shape, matrix));
      if (box) out.push({ key: shapeKey(shape, matrix), box, item: index });
    }
  });
  return out;
}

/** The shapes found on one side but not the other (as a multiset), with their boxes: what a careful eye can spot. */
export function changedShapes(items: readonly Item[], a: readonly Look[], b: readonly Look[]) {
  const left = placedShapes(items, a), right = placedShapes(items, b);
  const tally = new Map<string, number>();
  for (const shape of left) tally.set(shape.key, (tally.get(shape.key) ?? 0) + 1);
  for (const shape of right) tally.set(shape.key, (tally.get(shape.key) ?? 0) - 1);
  const pickOut = (list: typeof left, sign: number) => list.filter(shape => {
    if (tally.get(shape.key)! * sign <= 0) return false;
    tally.set(shape.key, tally.get(shape.key)! - sign);
    return true;
  });
  return [...pickOut(left, 1), ...pickOut(right, -1)];
}

/** Rough colour distance (0–441) between two #rrggbb colours. */
export function colorDistance(one: string, two: string) {
  const parse = (hex: string) => [1, 3, 5].map(at => parseInt(hex.slice(at, at + 2), 16));
  const [r1, g1, b1] = parse(one), [r2, g2, b2] = parse(two);
  return Math.hypot(r1 - r2, g1 - g2, b1 - b2);
}

// 30 arrangements of the seven stones in three places. Each level adds one thing: distance, a second pile, a pyramid,
// a brick in the way, a step. Stones are 8 units thick; widths shrink toward the top like a real সাত চাড়া pile.
import { makeRng, pick } from "../../../shared/game-core";
import { GROUND, WALL_X, type Layout, type Stone } from "./physics";

export const THICK = 8;
const WIDTHS = [46, 43, 41, 39, 36, 33, 30];

/** A pile at `cx` with `count` stones, or a pyramid (3-2-1-1). */
type Pile = { kind: "pile"; cx: number; count: number } | { kind: "pyramid"; cx: number };
/** A block as [left, width, height], standing on the ground. A block that reaches the wall is a step. */
type Block = readonly [x0: number, width: number, height: number];
type Spec = { piles: readonly Pile[]; blocks?: readonly Block[] };

const pile = (cx: number, count = 7): Pile => ({ kind: "pile", cx, count });
const pyramid = (cx: number): Pile => ({ kind: "pyramid", cx });
const brick = (x0: number, height: number, width = 22): Block => [x0, width, height];
const step = (x0: number, height: number): Block => [x0, WALL_X - x0, height];

const SPECS: readonly Spec[] = [
  // গলির মোড়: open lane, piles further and further away, then pyramids and two piles.
  { piles: [pile(250)] },
  { piles: [pile(300)] },
  { piles: [pile(350)] },
  { piles: [pyramid(330)] },
  { piles: [pile(400)] },
  { piles: [pile(300, 4), pile(372, 3)] },
  { piles: [pyramid(400)] },
  { piles: [pile(430)] },
  { piles: [pile(320, 3), pile(410, 4)] },
  { piles: [pile(290, 4), pile(410, 3)] },
  // স্কুলের মাঠ: a brick in the way, piles on the veranda step or on a brick.
  { piles: [pile(380)], blocks: [brick(280, 14)] },
  { piles: [pile(410)], blocks: [step(360, 22)] },
  { piles: [pile(390)], blocks: [brick(300, 26)] },
  { piles: [pile(380)], blocks: [brick(355, 18, 50)] },
  { piles: [pyramid(410)], blocks: [step(350, 20)] },
  { piles: [pile(420)], blocks: [brick(320, 40)] },
  { piles: [pile(400)], blocks: [brick(300, 24), brick(375, 20, 50)] },
  { piles: [pile(420)], blocks: [brick(310, 30), step(380, 46)] },
  { piles: [pyramid(410)], blocks: [brick(330, 32)] },
  { piles: [pile(300, 4), pile(420, 3)], blocks: [step(380, 24)] },
  // বাড়ির উঠান: further and higher, and the stones split into small piles.
  { piles: [pile(330, 3), pile(400, 2), pile(445, 2)], blocks: [step(380, 26)] },
  { piles: [pile(310, 3), pile(370, 2), pile(430, 2)] },
  { piles: [pyramid(408)], blocks: [step(352, 34)] },
  { piles: [pile(430)], blocks: [step(390, 60)] },
  { piles: [pyramid(410)], blocks: [brick(310, 44), step(352, 40)] },
  { piles: [pile(440)], blocks: [brick(340, 48)] },
  { piles: [pile(330, 4), pile(427, 3)], blocks: [brick(380, 12)] },
  { piles: [pyramid(410)], blocks: [brick(320, 40), step(352, 20)] },
  { piles: [pile(440)], blocks: [brick(300, 36), brick(370, 50)] },
  { piles: [pile(350, 4), pile(440, 3)], blocks: [step(405, 20)] },
];

export const LEVEL_COUNT = SPECS.length;

export const WORLDS = [
  { name: "গলির মোড়", long: "গলির মোড়" },
  { name: "স্কুলের মাঠ", long: "স্কুলের মাঠ" },
  { name: "বাড়ির উঠান", long: "বাড়ির উঠান" },
] as const;

export const isLevel = (level: number) => Number.isInteger(level) && level >= 1 && level <= LEVEL_COUNT;
export const worldIndex = (level: number) => Math.min(WORLDS.length - 1, Math.floor((level - 1) / 10));
export const worldOf = (level: number) => WORLDS[worldIndex(level)];
/** Each level's own seed: it shapes the stones (widths, chips, shades), so a friend's link rebuilds the very same pile. */
export const seedOf = (level: number) => 1000 + level * 7919;

/** Top of whatever stands under x (a block or the ground). */
function floorAt(blocks: Layout["blocks"], left: number, right: number) {
  let top = GROUND;
  for (const [x0, y0, x1] of blocks) if (Math.min(right, x1) - Math.max(left, x0) > 0) top = Math.min(top, y0);
  return top;
}

export function layoutOf(level: number, seed = seedOf(level)): Layout {
  const spec = SPECS[level - 1], rng = makeRng(seed);
  const blocks = (spec.blocks ?? []).map(([x0, width, height]) => [x0, GROUND - height, x0 + width, GROUND] as const);
  const stones: Stone[] = [];
  let next = 0;
  for (const part of spec.piles) {
    if (part.kind === "pyramid") {
      const base = floorAt(blocks, part.cx - 54, part.cx + 54), w = 34;
      const rows: Array<[dx: number, row: number, width: number]> = [[-35, 0, w], [0, 0, w], [35, 0, w], [-17.5, 1, w], [17.5, 1, w], [0, 2, w], [0, 3, 28]];
      for (const [dx, row, width] of rows) stones.push({ x: part.cx + dx, y: base - THICK / 2 - row * THICK, w: width, h: THICK });
      next += 7;
      continue;
    }
    // A pile starts from the widest stone still unused, so two small piles look like one big pile split in two.
    const base = floorAt(blocks, part.cx - 24, part.cx + 24);
    let y = base;
    for (let k = 0; k < part.count; k++) {
      const width = WIDTHS[next + k] + pick(rng, 5) - 2, shift = (pick(rng, 3) - 1) * 0.8;
      stones.push({ x: part.cx + shift, y: y - THICK / 2, w: width, h: THICK });
      y -= THICK;
    }
    next += part.count;
  }
  return { stones, blocks };
}

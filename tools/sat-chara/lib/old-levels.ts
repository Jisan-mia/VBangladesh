// The 30 arrangements of the game before the rewrite, kept so an old friend's link (#s=&t=&l=) still opens the very pile
// they knocked down. Nothing here changes: the same specs, the same seeds, the same widths and shifts.
import { makeRng, pick } from "../../../shared/game-core";
import { GROUND, WALL_X, type Box, type Layout, type Stone } from "./world";

export const OLD_COUNT = 30;
const THICK = 8;
const WIDTHS = [46, 43, 41, 39, 36, 33, 30];

type Pile = { kind: "pile"; cx: number; count: number } | { kind: "pyramid"; cx: number };
type Block = readonly [x0: number, width: number, height: number];
type Spec = { piles: readonly Pile[]; blocks?: readonly Block[] };

const pile = (cx: number, count = 7): Pile => ({ kind: "pile", cx, count });
const pyramid = (cx: number): Pile => ({ kind: "pyramid", cx });
const brick = (x0: number, height: number, width = 22): Block => [x0, width, height];
const step = (x0: number, height: number): Block => [x0, WALL_X - x0, height];

const SPECS: readonly Spec[] = [
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

export const isOldLevel = (level: number) => Number.isInteger(level) && level >= 1 && level <= OLD_COUNT;
/** The old level's seed (the `s` of its links). */
export const oldSeedOf = (level: number) => 1000 + level * 7919;
/** The old game's three places: 1–10, 11–20, 21–30. */
export const oldWorldOf = (level: number) => Math.min(2, Math.floor((level - 1) / 10));

function floorAt(blocks: readonly Box[], left: number, right: number) {
  let top = GROUND;
  for (const [x0, y0, x1] of blocks) if (Math.min(right, x1) - Math.max(left, x0) > 0) top = Math.min(top, y0);
  return top;
}

export function oldLayoutOf(level: number): Layout {
  const spec = SPECS[level - 1], rng = makeRng(oldSeedOf(level));
  const blocks: Box[] = (spec.blocks ?? []).map(([x0, width, height]) => [x0, GROUND - height, x0 + width, GROUND] as const);
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

// The ladder: three places of five levels. Each level adds one thing (distance, a pyramid, two piles, a brick, a step, mud,
// heavy pieces, টুনি who stacks, the clothesline, মিঠু who catches, a stool); each place ends in a named finale.
// Stones are 8 units thick and narrow toward the top like a real pile. tests/levels.test.ts plays every level with bots.
import { makeRng, pick } from "../../../shared/game-core";
import { GROUND, WALL_X, type Box, type BlockLook, type Guard, type Layout, type Line, type Rebuild, type Stone } from "./world";

export const THICK = 8;
const WIDTHS = [46, 43, 41, 39, 36, 33, 30];

type Pile = { kind: "pile"; cx: number; count: number; heavy: number } | { kind: "pyramid"; cx: number };
/** A block standing on the ground: [left, width, height, look]. */
type Block = readonly [x0: number, width: number, height: number, look: BlockLook];

export type LevelDef = {
  name: string;
  /** The one new thing, on the title and in the level list. */
  teach: string;
  /** The line under the lane the moment play starts. */
  hint: string;
  world: 0 | 1 | 2;
  piles: readonly Pile[];
  blocks?: readonly Block[];
  mud?: readonly (readonly [number, number])[];
  line?: Line;
  guard?: Guard;
  rebuild?: Rebuild;
  /** A place's last level: who set it and their record in balls (beating it is ★★★). */
  finale?: { who: string; whose: string; record: number; line: string };
};

const pile = (cx: number, count = 7, heavy = 0): Pile => ({ kind: "pile", cx, count, heavy });
const pyramid = (cx: number): Pile => ({ kind: "pyramid", cx });
const brick = (x0: number, height: number, width = 22): Block => [x0, width, height, 0];
const step = (x0: number, height: number): Block => [x0, WALL_X - x0, height, 1];
const stool = (x0: number, height: number, width: number): Block => [x0, width, height, 2];
const TUNI: Rebuild = { delay: 60, every: 42, most: 3 };
/** টুনি's first day: slower, and two pieces at most. */
const TUNI_FIRST: Rebuild = { delay: 90, every: 54, most: 2 };
/** In the finale she has মিঠু to help, so she stops after two. */
const TUNI_FINAL: Rebuild = { delay: 60, every: 42, most: 2 };
const MITHU = (x: number, phase = 0): Guard => ({ x, tall: 36, hop: 34, period: 96, air: 30, phase });

export const WORLDS = [
  { name: "গলির মোড়", scene: "বিকেলের গলি। দেয়ালে নীল জানালা, মাথার ওপর তার।" },
  { name: "স্কুলের মাঠ", scene: "টিফিনের ছুটি। ঘণ্টা পড়ার আগে একটা খেলা।" },
  { name: "নানুবাড়ির উঠান", scene: "সন্ধ্যার আগে উঠান। মামাতো ভাইবোনরা অন্য দলে।" },
] as const;

export const LEVELS: readonly LevelDef[] = [
  // ---- গলির মোড় ----
  { world: 0, name: "প্রথম চাড়া", teach: "বল পেছনে টেনে ছেড়ে দাও। নিচু করে গড়িয়ে দিলেই সাতটা যায়।", hint: "পেছনে টেনে ছেড়ে দাও", piles: [pile(392)] },
  { world: 0, name: "গোড়ায় লাগাও", teach: "চাড়া এবার কাছে। জোরে সোজা ছুড়লে ওপরে লাগে, গোড়ায় লাগাও।", hint: "চাড়ার গোড়ায় লাগাও", piles: [pile(220)] },
  { world: 0, name: "পিরামিড", teach: "চওড়া পিরামিড। নিচের সারিতে লাগাও, ওপরে লাগলে শুধু মাথা পড়ে।", hint: "নিচের সারিতে লাগাও", piles: [pyramid(326)] },
  { world: 0, name: "দুই ঢিবি", teach: "দুটো ঢিবি। নিচু করে জোরে গড়িয়ে দিলে প্রথমটা ভেঙে বল পরেরটায় যায়।", hint: "নিচু করে জোরে গড়াও", piles: [pile(290, 4), pile(370, 3)] },
  {
    world: 0, name: "বল্টু ভাইয়ের চাড়া", teach: "তিনটা ছোট ঢিবি, শেষটা গলির একেবারে মাথায়।", hint: "তিনটা ঢিবি, তিনটা বল",
    piles: [pile(300, 3), pile(372, 2), pile(440, 2)], finale: { who: "বল্টু ভাই", whose: "বল্টু ভাইয়ের", record: 2, line: "গলির সেরা নিশানা বল্টু ভাইয়ের। তার রেকর্ড ২ বল।" },
  },
  // ---- স্কুলের মাঠ ----
  { world: 1, name: "বারান্দার সিঁড়ি", teach: "চাড়া বারান্দার সিঁড়িতে। উঁচুতে, তাই তাকও একটু উঁচু।", hint: "সিঁড়ির ওপরে তাক করো", piles: [pile(414)], blocks: [step(352, 30)] },
  { world: 1, name: "বৃষ্টির কাদা", teach: "সামনে কাদা। গড়ানো বল কাদায় থেমে যায়, সরাসরি চাড়ায় মারো।", hint: "কাদায় নয়, সরাসরি", piles: [pile(400)], mud: [[226, 378]] },
  { world: 1, name: "ইটের আড়াল", teach: "সামনে ইটের স্তূপ। একটু উঁচু করে ছুড়ে ইটের ওপর দিয়ে পাঠাও।", hint: "ইটের ওপর দিয়ে", piles: [pile(380)], blocks: [brick(250, 20)] },
  { world: 1, name: "কলসির কানা", teach: "নিচের দুটো চাড়া কলসির মোটা কানা, ভারী। আস্তে লাগলে নড়ে না, জোরে মারো।", hint: "জোরে মারো", piles: [pile(350, 7, 2)] },
  {
    world: 1, name: "দপ্তরি চাচার বারান্দা", teach: "উঁচু ইটের ওপারে সিঁড়ি, তার ওপর চাড়া। গোড়ার তিনটা ভারী।", hint: "ইট পেরিয়ে সিঁড়িতে, জোরে",
    piles: [pile(430, 7, 3)], blocks: [brick(320, 40), step(380, 22)], finale: { who: "দপ্তরি চাচা", whose: "দপ্তরি চাচার", record: 2, line: "ঘণ্টা বাজানোর আগে দপ্তরি চাচা নিজে সাজিয়েছেন। তাঁর রেকর্ড ২ বল।" },
  },
  // ---- নানুবাড়ির উঠান ----
  { world: 2, name: "দড়ির গামছা", teach: "মাথার ওপর গামছা শুকাচ্ছে। উঁচু বল দড়িতে আটকায়, নিচু করে ছোড়ো।", hint: "দড়ির নিচ দিয়ে", piles: [pile(392)], blocks: [brick(276, 20)], line: { x0: 150, x1: 440, y: 200 } },
  { world: 2, name: "টুনি সাজায়", teach: "টুনি অন্য দলে। বল থামলে সে পড়া চাড়া আবার সাজায়, তাই দেরি কোরো না।", hint: "টুনি সাজানোর আগেই ছোড়ো", piles: [pile(300, 4), pile(404, 3)], rebuild: TUNI_FIRST },
  { world: 2, name: "জলচৌকি", teach: "চাড়া জলচৌকির ওপর। দুই দিকেই পড়ে, তাই চৌকির ঠিক ওপরে লাগাও।", hint: "চৌকির ওপরে লাগাও", piles: [pile(386)], blocks: [stool(352, 26, 68)] },
  { world: 2, name: "মিঠুর পাহারা", teach: "মিঠু সামনে দাঁড়িয়ে লাফায়, বল পেলেই ধরে। ও নামলে ছোড়ো।", hint: "মিঠু নামলে ছোড়ো", piles: [pile(392)], guard: MITHU(256) },
  {
    world: 2, name: "ঈদের বিকেল", teach: "গামছার নিচে মিঠু পাহারায়, নিচের চাড়াটা ভারী, আর টুনি সাজাতে তৈরি।", hint: "সবাই তোমার দিকে তাকিয়ে",
    piles: [pile(398, 7, 2)], line: { x0: 170, x1: 440, y: 196 }, guard: MITHU(236, 40), rebuild: TUNI_FINAL,
    finale: { who: "টুনি আর মিঠু", whose: "টুনি আর মিঠুর", record: 2, line: "ঈদের বিকেলে মামাতো ভাইবোনরা জোট বেঁধেছে। তাদের রেকর্ড ২ বল।" },
  },
];

export const LEVEL_COUNT = LEVELS.length;
export const isLevel = (level: number) => Number.isInteger(level) && level >= 1 && level <= LEVEL_COUNT;
export const defOf = (level: number) => LEVELS[Math.min(LEVEL_COUNT, Math.max(1, level)) - 1];
export const worldIndex = (level: number) => defOf(level).world;
export const worldOf = (level: number) => WORLDS[worldIndex(level)];
export const isFinale = (level: number) => Boolean(defOf(level).finale);
/** Each level's own seed: it shapes the stones (widths, chips, shades), so a friend's link rebuilds the very same pile. */
export const seedOf = (level: number) => 300_000 + level * 7919;

function floorAt(blocks: readonly Box[], left: number, right: number) {
  let top = GROUND;
  for (const [x0, y0, x1] of blocks) if (Math.min(right, x1) - Math.max(left, x0) > 0) top = Math.min(top, y0);
  return top;
}

export function layoutOf(level: number): Layout {
  const def = defOf(level), rng = makeRng(seedOf(level));
  const blocks: Box[] = (def.blocks ?? []).map(([x0, width, height]) => [x0, GROUND - height, x0 + width, GROUND] as const);
  const stones: Stone[] = [];
  let next = 0;
  for (const part of def.piles) {
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
      const heavy = k < part.heavy, thick = heavy ? THICK + 3 : THICK;
      const width = WIDTHS[next + k] + pick(rng, 5) - 2, shift = (pick(rng, 3) - 1) * 0.8;
      stones.push({ x: part.cx + shift, y: y - thick / 2, w: width, h: thick, heavy });
      y -= thick;
    }
    next += part.count;
  }
  return { stones, blocks, looks: (def.blocks ?? []).map(block => block[3]), mud: def.mud, line: def.line, guard: def.guard, rebuild: def.rebuild };
}

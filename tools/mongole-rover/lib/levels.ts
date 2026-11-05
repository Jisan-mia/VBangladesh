// Twelve Mars maps in five steps: short plans, longer plans, several samples, the repeat block, then a fewest-blocks challenge.
import { parseMap, solve, type Level } from "./rover";

type Spec = { title: string; map: string[]; repeat?: boolean; challenge?: boolean };

// ids 1–12 never change meaning: the saved stars key by them.
const SPECS: Spec[] = [
  { title: "এক ধাপ", map: ["....", "....", ".RS.", "...."] },
  { title: "দুই ধাপ", map: ["....", "..S.", ".R..", "...."] },
  { title: "গর্ত পাশ কাটাও", map: ["....", "..S.", ".C..", ".R.."] },
  { title: "লম্বা পথ", map: [".....", ".S...", "CCC..", ".....", "...R."] },
  { title: "ঘুরপথ", map: [".....", ".S.C.", ".CCC.", ".....", "..R.."] },
  { title: "গর্তের সারি", map: ["..S..", ".CCC.", ".....", ".CCC.", "..R.."] },
  { title: "দুটো পাথর", map: [".....", ".S...", ".C.C.", "...S.", "R...."] },
  { title: "দুই কোণে", map: ["S...S", ".C.C.", ".C.C.", ".....", "..R.."] },
  { title: "তিনটা পাথর", map: ["S...S", ".CC..", ".....", "..C..", "R.S.."] },
  { title: "লুপ: বার বার", map: ["....S.", "....C.", "......", "......", "......", "R....."], repeat: true },
  { title: "লুপে ঘুরপথ", map: ["S.....", "CCCC..", "......", "..CCCC", "......", "R....."], repeat: true },
  { title: "কম ব্লকে পারবে?", map: ["S....S", "C.....", "C.CCC.", "C.....", "C....C", "R....S"], repeat: true, challenge: true },
];

export const LEVELS: Level[] = SPECS.map((spec, index) => ({ n: index + 1, title: spec.title, ...parseMap(spec.map), repeat: !!spec.repeat, challenge: !!spec.challenge }));
export const LEVEL_COUNT = LEVELS.length;

/** Four worlds of three levels. Each world's last level is its named finale; the ids are the saved-stars ids, in play order. */
export type World = { id: number; name: string; finale: string; ids: readonly number[]; light: string };
export const WORLDS: readonly World[] = [
  { id: 0, name: "ল্যান্ডিং সাইট", finale: "প্রথম গর্ত", ids: [1, 2, 3], light: "বিকেলের বালি" },
  { id: 1, name: "গর্তের মাঠ", finale: "গর্তের সারি", ids: [4, 5, 6], light: "ধুলোমাখা পাথর" },
  { id: 2, name: "পাথরের উপত্যকা", finale: "তিন পাথরের ঢিবি", ids: [7, 8, 9], light: "নীল সূর্যাস্ত" },
  { id: 3, name: "লুপের পাহাড়", finale: "কম ব্লকে পারবে?", ids: [10, 11, 12], light: "সন্ধ্যার পাহাড়" },
];
export const worldOf = (n: number) => WORLDS.find(world => world.ids.includes(n)) ?? WORLDS[0];
export const isFinale = (n: number) => worldOf(n).ids.at(-1) === n;
/** The name on the badge: a finale's own name, otherwise the level's title. */
export const badgeName = (n: number) => (isFinale(n) ? worldOf(n).finale : levelOf(n).title);
export const isWorldEnd = isFinale;

/** The one new thing each level teaches, for the list and the parent card. */
export const LEARNS: readonly string[] = [
  "একটা তীর, তারপর চালাও", "দুই ব্লকের প্ল্যান: একটার পর একটা", "গর্ত পাশ কাটাও",
  "লম্বা প্ল্যান", "ঘুরপথ", "গর্তের দুই সারি",
  "দুটো পাথর", "দুই কোণের পাথর", "তিনটা পাথর",
  "আরেক বার: লুপ", "গর্তের পাশে লুপ", "সবচেয়ে কম ব্লক",
];

/** The level that is ready: the first with no stars, else the first with fewer than three, else the last. */
export function nextToPlay(stars: Record<number, number>) {
  for (let n = 1; n <= LEVEL_COUNT; n++) if (!stars[n]) return n;
  for (let n = 1; n <= LEVEL_COUNT; n++) if ((stars[n] ?? 0) < 3) return n;
  return LEVEL_COUNT;
}
export const levelOf = (n: number) => LEVELS[Math.max(1, Math.min(LEVEL_COUNT, Math.round(n) || 1)) - 1];

/** The shortest plan for each level, worked out once: in arrows (no repeat) and in blocks (with the repeat block where allowed). */
export const BEST = LEVELS.map(level => {
  const arrows = solve(level, false)!, blocks = solve(level)!;
  return { steps: arrows.length, blocks: blocks.length, plan: blocks, arrows };
});


// Twelve Mars maps in five steps: short plans, longer plans, several samples, the repeat block, then a fewest-blocks challenge.
import { parseMap, solve, type Level } from "./rover";

type Spec = { title: string; map: string[]; repeat?: boolean; challenge?: boolean };

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
export const levelOf = (n: number) => LEVELS[Math.max(1, Math.min(LEVEL_COUNT, Math.round(n) || 1)) - 1];

/** The shortest plan for each level, worked out once: in arrows (no repeat) and in blocks (with the repeat block where allowed). */
export const BEST = LEVELS.map(level => {
  const arrows = solve(level, false)!, blocks = solve(level)!;
  return { steps: arrows.length, blocks: blocks.length, plan: blocks, arrows };
});


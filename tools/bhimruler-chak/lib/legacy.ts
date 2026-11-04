// The 30 orchards from before the rewrite. They no longer make the ladder, but a link shared then (no `v` key) names one of
// them, so they are rebuilt exactly as they were: the same table, the same pars and the untouched old generator (board.ts).
import { generate as legacyGenerate } from "./board";
import type { Orchard } from "./orchard";

// 30 orchards in three worlds: [columns, rows, nests]. Each level adds a row, a column or one nest, never a jump.
// Nine columns at most, so a bush stays about 39px wide on a 390px phone (ten would shrink it to 35px).
export const LEVELS: ReadonlyArray<readonly [cols: number, rows: number, nests: number]> = [
  [6, 6, 4], [6, 6, 5], [6, 7, 6], [6, 8, 7], [7, 8, 8], [7, 8, 9], [7, 9, 10], [7, 10, 11], [8, 10, 12], [8, 10, 13],
  [8, 11, 14], [8, 11, 15], [8, 12, 16], [8, 12, 17], [9, 12, 18], [9, 12, 19], [9, 13, 20], [9, 13, 21], [9, 13, 22], [9, 14, 23],
  [9, 14, 24], [9, 14, 25], [9, 14, 26], [9, 14, 26], [9, 14, 27], [9, 14, 27], [9, 14, 28], [9, 14, 28], [9, 14, 29], [9, 14, 30],
];

export const LEVEL_COUNT = LEVELS.length;

/** Ten levels each. `pace` is the seconds a safe bush may take for three stars. */
export const WORLDS = [
  { name: "বাড়ির পেছনে", long: "বাড়ির পেছনের বাগান", pace: 0.9 },
  { name: "রাজশাহী", long: "রাজশাহীর আমবাগান", pace: 1 },
  { name: "চাঁপাইনবাবগঞ্জ", long: "চাঁপাইনবাবগঞ্জের বড় বাগান", pace: 1.1 },
] as const;

export const isLevel = (level: number) => Number.isInteger(level) && level >= 1 && level <= LEVEL_COUNT;
export const worldOf = (level: number) => WORLDS[Math.min(WORLDS.length - 1, Math.floor((level - 1) / 10))];

export function specOf(level: number) {
  const [cols, rows, nests] = LEVELS[level - 1];
  const safe = cols * rows - nests;
  // Seconds for three stars: half a minute to look around, plus the pace per safe bush, rounded up to ten.
  const par = Math.ceil((30 + safe * worldOf(level).pace) / 10) * 10;
  return { level, cols, rows, nests, safe, par };
}
export type Spec = ReturnType<typeof specOf>;

// ---- the ladder from before the rewrite, kept so a link shared then (no `v` key) rebuilds the very same orchard ----
// The old generator (lib/board.ts) is untouched; this only wraps its board as an Orchard with every bush PLAIN.

export const LEGACY_COUNT = LEVEL_COUNT;
export const legacySpec = (level: number) => isLevel(level) ? specOf(level) : null;

/** The old orchard for an old link: laid around the friend's first tap, exactly as the old game did. */
export function legacyOrchard(level: number, seed: number, first: number): { orchard: Orchard; fair: boolean } {
  const { cols, rows, nests } = specOf(level);
  const { board, fair } = legacyGenerate(cols, rows, nests, seed, first, level === 1);
  return { orchard: { cols, rows, nests, start: first, nest: board.nest, kind: new Uint8Array(cols * rows), count: board.count }, fair };
}

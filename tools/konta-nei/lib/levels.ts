// 30 hand-set levels in three shops. Each adds one small thing: an item more, a second less to look, another choice,
// more choices that were never on the shelf. World 2 shuffles the shelf after an item goes; world 3 slips a new one in.

/** gap: the item's place stays empty · move: the shelf closes up and two items change places · swap: a new item takes its place */
export type Twist = "gap" | "move" | "swap";
/** items on the shelf, seconds to look, answer choices, how many choices were never on the shelf */
export type Level = { count: number; view: number; choices: number; unseen: number; twist: Twist };

const row = (twist: Twist) => ([count, view, choices, unseen]: number[]): Level => ({ count, view, choices, unseen, twist });

export const LEVELS: readonly Level[] = [
  ...[[4, 5, 3, 0], [4, 4, 3, 1], [5, 5, 3, 1], [5, 4, 4, 1], [6, 5, 4, 2], [6, 4, 4, 2], [7, 5, 4, 2], [7, 4, 4, 3], [8, 6, 4, 3], [8, 5, 4, 3]].map(row("gap")),
  ...[[5, 5, 4, 1], [6, 5, 4, 2], [6, 4, 4, 2], [7, 5, 4, 2], [7, 4, 6, 3], [8, 6, 6, 3], [8, 5, 6, 3], [9, 6, 6, 3], [10, 7, 6, 4], [10, 6, 6, 4]].map(row("move")),
  ...[[6, 5, 4, 1], [7, 5, 4, 2], [8, 6, 6, 2], [8, 5, 6, 3], [9, 6, 6, 3], [10, 7, 6, 3], [10, 6, 6, 4], [11, 7, 6, 4], [12, 8, 6, 4], [12, 7, 6, 4]].map(row("swap")),
];

export const LEVEL_COUNT = LEVELS.length;
/** The three shops, ten levels each. */
export const WORLDS = ["পাড়ার দোকান", "বাজারের দোকান", "হাটের দোকান"] as const;
export const worldOf = (level: number) => Math.floor((level - 1) / 10);

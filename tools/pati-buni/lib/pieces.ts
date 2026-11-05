// The cane strips and the frame. Six strips from the original game (kept exactly, so খোলা পাটি and old links replay),
// plus the one-cell সুই and the five-cell ডালা that later পাটি add.

export const COLS = 8;
export const ROWS = 14;
export const CELLS = COLS * ROWS;

/** A board cell: colour in the low 3 bits (1 natural বেত, 2 হলুদ, 3 মেহেদি, 4 খয়েরি, 5 সোনালি), plus flags. */
export const ACROSS = 8;
export const OLD = 16;
export const WET = 32;
export const GOLD = 5;
export const colourOf = (cell: number) => cell & 7;

type Cells = ReadonlyArray<readonly [number, number]>;
/** Each strip turns inside its own `box`; cells are [x, y] with y down. */
export const PIECES = {
  dui: { box: 2, colour: 2, cells: [[0, 0], [1, 0]] },
  tin: { box: 3, colour: 1, cells: [[0, 1], [1, 1], [2, 1]] },
  kona: { box: 2, colour: 4, cells: [[0, 0], [0, 1], [1, 1]] },
  lomba: { box: 4, colour: 3, cells: [[0, 1], [1, 1], [2, 1], [3, 1]] },
  banka: { box: 3, colour: 2, cells: [[0, 1], [1, 1], [2, 1], [2, 0]] },
  dheu: { box: 3, colour: 3, cells: [[0, 1], [1, 1], [1, 0], [2, 0]] },
  sui: { box: 1, colour: 1, cells: [[0, 0]] },
  dala: { box: 3, colour: 4, cells: [[0, 0], [2, 0], [0, 1], [1, 1], [2, 1]] },
} as const satisfies Record<string, { box: number; colour: number; cells: Cells }>;
export type Kind = keyof typeof PIECES;
export const KINDS = Object.keys(PIECES) as Kind[];
/** Kinds as small numbers, so the hot loop indexes typed arrays. */
export const KIND_INDEX = Object.fromEntries(KINDS.map((kind, index) => [kind, index])) as Record<Kind, number>;
export const SUI = KIND_INDEX.sui;
export const SIZE = KINDS.map(kind => PIECES[kind].cells.length);
export const BOX = KINDS.map(kind => PIECES[kind].box);
export const COLOUR = KINDS.map(kind => PIECES[kind].colour);

/** Flat [x0, y0, x1, y1, …] for every kind and quarter turn, worked out once so a frame never allocates. */
export const TURNS: number[][][] = KINDS.map(kind => {
  const { box, cells } = PIECES[kind];
  const turns: number[][] = [];
  let current: Cells = cells;
  for (let turn = 0; turn < 4; turn++) {
    turns.push(current.flat());
    current = current.map(([x, y]) => [box - 1 - y, x] as const);
  }
  return turns;
});

/** Whether the slats of cell `index` run across, so neighbours look over-and-under. */
export const across = (kind: number, turn: number, index: number) => ((TURNS[kind][turn][index * 2] + TURNS[kind][turn][index * 2 + 1]) & 1) === 0;

/** The original game's bundle: eight strips, the short ones twice, shuffled per bundle; and its first two strips. */
export const CLASSIC_BUNDLE: readonly Kind[] = ["dui", "tin", "tin", "kona", "kona", "lomba", "banka", "dheu"];
export const CLASSIC_OPENING: readonly Kind[] = ["dui", "tin"];

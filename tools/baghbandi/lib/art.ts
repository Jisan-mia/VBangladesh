// The yard's look, shared by the live SVG board and the canvas card: colours, and the two pieces as SVG path strings
// (drawn as <path d> on the board and as Path2D on the card), centred on 0,0 inside one 100-unit cell.

export const palette = {
  clay: "#e9cf9f",
  claySwirl: "#dfbf88",
  groove: "#8f5f37",
  grooveLight: "#f7e3bd",
  pit: "#7b4c2a",
  tiger: "#e07a22",
  tigerEdge: "#5c3112",
  stripe: "#3a2210",
  eye: "#fff6e3",
  seed: "#5e3820",
  seedFace: "#80502f",
  seedShine: "#e2b98e",
  ink: "#3b2614",
  muted: "#7a5b40",
  lit: "#1f7a5c",
  danger: "#c0392b",
  badge: "#fffaf0",
};

/** A tiger is a big angular pebble with painted stripes and two eyes; a goat is a small round tamarind seed. Shape tells them apart, not colour. */
export const TIGER_STONE = "M-31 -6L-20 -28L8 -33L30 -17L33 10L15 31L-15 30L-33 11Z";
export const TIGER_STRIPES = "M-21 -21Q-12 -14-20 -3M-3 -30Q4 -20-4 -12M17 -25Q21 -15 13 -8M-29 15Q-19 13-14 22M27 18Q18 15 13 25";
export const TIGER_EYES: ReadonlyArray<readonly [number, number]> = [[-9, 4], [9, 4]];
export const SEED = "M-18 -3Q-18 -18-3 -18L4 -18Q18 -18 18 -4L18 4Q18 18 3 18L-4 18Q-18 18-18 3Z";
/** The paler oval every tamarind seed has on its face, and a glint of shine. */
export const SEED_FACE = "M-10 1a10 8 0 1 0 20 0a10 8 0 1 0-20 0Z";
export const SEED_SHINE = "M-11 -11Q-5 -14 2 -13";
/** A pile is drawn as up to three seeds, nudged so the stack reads at a glance; its count sits in a badge. */
export const PILE_OFFSETS: ReadonlyArray<readonly [number, number]> = [[-9, 7], [9, 5], [0, -6]];

/** One palette per world, for the yard and the stage around it: পাঠশালা is morning chalk, উঠোন the afternoon clay (the card's
 * original look), সাঁঝের উঠোন dusk under a hurricane lamp. Pieces keep their colours everywhere, so a tiger always reads as one. */
export type Yard = { clay: string; claySwirl: string; groove: string; grooveLight: string; pit: string; ground: string; groundInk: string; glow: string };
export const YARDS: readonly Yard[] = [
  { clay: "#f2e4c3", claySwirl: "#e7d3a6", groove: "#9a6c43", grooveLight: "#fdf4dc", pit: "#8a5a35", ground: "#fbf4e2", groundInk: "#3b2614", glow: "#fff7e0" },
  { clay: palette.clay, claySwirl: palette.claySwirl, groove: palette.groove, grooveLight: palette.grooveLight, pit: palette.pit, ground: "#f6ead2", groundInk: "#3b2614", glow: "#fff3d6" },
  { clay: "#cfa674", claySwirl: "#bf935f", groove: "#5a361b", grooveLight: "#e2c497", pit: "#4c2c16", ground: "#2e2118", groundInk: "#f6e6c8", glow: "#ffcf7a" },
];
/** The rope that shows round a tiger with no move left. */
export const ROPE = { line: "#6b4a2a", shine: "#d8b47a" };

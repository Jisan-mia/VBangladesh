// The board's look, shared by the live board (SVG + CSS) and the canvas card: one palette per house, and the bulb as SVG path
// strings (drawn as <path d> on the board and as Path2D on the card). product.css carries the same colours under data-world.

export type Art = {
  ground: string; card: string; edge: string; ink: string; muted: string;
  wall: string; wallLine: string; wood: string; woodLight: string; woodDark: string;
  brass: string; brassLight: string; brassDark: string; accent: string; band: string;
};

/** বারান্দা is an afternoon on whitewash and teak, মেস an evening under a tube light on green distemper and plywood, প্যান্ডেল a night
 * under indigo cloth with marigold. The bulbs and the tape keep their colours everywhere, so a lit bulb always reads as one. */
export const WORLD_ART: readonly Art[] = [
  { ground: "#f6ecd6", card: "#fffaf0", edge: "#e2d3b5", ink: "#3b2614", muted: "#75573a", wall: "#f2e6cc", wallLine: "#e8d8b8", wood: "#8a4f22", woodLight: "#a3602b", woodDark: "#5e3314", brass: "#c99a3e", brassLight: "#f0cf7a", brassDark: "#8a6420", accent: "#9a4b12", band: "#3b2614" },
  { ground: "#dcebe0", card: "#f4faf5", edge: "#b9d2c0", ink: "#1f3328", muted: "#4b6656", wall: "#cfe3d5", wallLine: "#bdd6c4", wood: "#9b7446", woodLight: "#b88f5c", woodDark: "#5c4426", brass: "#c4a256", brassLight: "#eed592", brassDark: "#7f6526", accent: "#2f6b4f", band: "#1f3328" },
  { ground: "#1e1b3d", card: "#2b2756", edge: "#433e7a", ink: "#f6ecd8", muted: "#cbc2e6", wall: "#262252", wallLine: "#2f2a60", wood: "#7a3b26", woodLight: "#9a5133", woodDark: "#3f1d12", brass: "#d6a845", brassLight: "#f6d98a", brassDark: "#8a6420", accent: "#f59e0b", band: "#14122b" },
];
/** An old link's board wears the original look. */
export const artFor = (world: number) => WORLD_ART[Math.max(0, Math.min(WORLD_ART.length - 1, world))];

export const BULB_COLOURS = { glass: "#ffd54a", glassEdge: "#a86f00", glow: "#ffe9a0", filament: "#a4460c", dark: "#e7dcc3", base: "#b9b2a3", star: "#f2a900", starOff: "#d8c9a8" };
export const TAPE = { fill: "#ead3a2", edge: "#6f5226", streak: "#f7e8c8" };

/** The pear-shaped bulb's paths in a 40×48 box. */
export const BULB = {
  rays: "M20 1v4M5 8l3 3M35 8l-3 3M1 22h4M35 22h4",
  glass: "M20 7a12 12 0 0 0-7 21.6c1.6 1.3 2.4 2.8 2.4 4.4h9.2c0-1.6.8-3.1 2.4-4.4A12 12 0 0 0 20 7Z",
  filament: "M16.5 32v-7l2-3 1.5 3 1.5-3 2 3v7",
  base: "M15.4 34h9.2v3h-9.2zM16 38.5h8v2.5l-2 2h-4l-2-2z",
};
/** A strip of brown tape across a round switch, in a 40×40 box. */
export const TAPE_PATH = "M3 15.5 37 12.5 38 26 4 28.5Z";
export const TAPE_STREAKS = "M8 18 32 16M9 23 33 21";

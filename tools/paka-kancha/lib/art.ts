// The look, shared by the live game (CSS, under data-world) and the canvas card: one palette per world. product.css carries the
// same colours. The mangoes themselves are in mango.ts and keep their colours everywhere, so a পাকা always reads as one.

export type Art = {
  ground: string; card: string; edge: string; ink: string; muted: string;
  board: string; boardEdge: string; tile: string; accent: string; band: string; gold: string; soft: string; cream: string;
  /** The share card: its page and its board. */
  cardBg: string; cardBoard: string;
};

/** উঠান: a morning in nana's courtyard, leaf green on whitewash. আমবাগান: noon under the trees, deeper green and dappled gold.
 * আমের হাট: the market at dusk, lantern orange on dark teal. */
export const WORLD_ART: readonly Art[] = [
  { ground: '#f6f0d8', card: '#fffaea', edge: '#e0d4ad', ink: '#1f2a1c', muted: '#5b6553', board: '#1f4d30', boardEdge: '#143a22', tile: '#fff8e7', accent: '#2f7a3e', band: '#11301d', gold: '#f6c443', soft: '#cfe6c0', cream: '#fff4d6', cardBg: '#1c4a2e', cardBoard: '#275f3b' },
  { ground: '#e3efd6', card: '#f6fbee', edge: '#bdd3a6', ink: '#1b2c1a', muted: '#4d6347', board: '#2c5e2a', boardEdge: '#1a4219', tile: '#fbf7e3', accent: '#5b8a1f', band: '#173a16', gold: '#f2b632', soft: '#d6eac0', cream: '#fff6d8', cardBg: '#1f4a1d', cardBoard: '#2f6a2c' },
  { ground: '#17302f', card: '#21403d', edge: '#34605b', ink: '#fbeed2', muted: '#b8d2c6', board: '#0f2423', boardEdge: '#071615', tile: '#fff1cf', accent: '#f28f1b', band: '#0a1b1a', gold: '#ffc94d', soft: '#a9cdbd', cream: '#ffefc9', cardBg: '#0f2a29', cardBoard: '#1d4a45' },
];
export const artFor = (world: number) => WORLD_ART[Math.max(0, Math.min(WORLD_ART.length - 1, world))];

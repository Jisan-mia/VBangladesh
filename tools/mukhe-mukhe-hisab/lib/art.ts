// One palette per world, shared by the CSS (set as custom properties on the game) and the card canvas. Code-drawn only.
// ১ the slate: chalk on green-black in a wooden frame · ২ the ledger: blue ink on cream, a red margin · ৩ the ফর্দ: green ink on kraft paper.
export type Palette = {
  surface: string; surfaceEdge: string; rule: string; margin: string; ink: string; muted: string; answer: string;
  good: string; bad: string; frame: string; accent: string; accentDeep: string; band: string; ask: string;
};

export const PALETTES: readonly Palette[] = [
  { surface: "#26332e", surfaceEdge: "#1b2420", rule: "#3a4a43", margin: "#3a4a43", ink: "#f4f1e6", muted: "#b7c2b9", answer: "#ffe08a", good: "#9be3a8", bad: "#ff9a8a", frame: "#a8713d", accent: "#2f6b4f", accentDeep: "#1d4a35", band: "#1b2420", ask: "#ffe08a" },
  { surface: "#fbf6e9", surfaceEdge: "#e6dcc4", rule: "#c9dceb", margin: "#d0463b", ink: "#1f3550", muted: "#5d6b7a", answer: "#1d5c8a", good: "#2f9e5b", bad: "#d0463b", frame: "#9c2f2a", accent: "#1d5c8a", accentDeep: "#123f61", band: "#1f3550", ask: "#ffd166" },
  { surface: "#e2c597", surfaceEdge: "#c9a873", rule: "#cfb07f", margin: "#a3542c", ink: "#2c3a1e", muted: "#6b5a3c", answer: "#1f6b3a", good: "#1f6b3a", bad: "#b23a24", frame: "#7a5530", accent: "#2f7d3f", accentDeep: "#1f5a2b", band: "#3b2a17", ask: "#ffd166" },
];

export const paletteOf = (world: number) => PALETTES[Math.max(0, Math.min(PALETTES.length - 1, world))];

/** The confetti for a clear: the world's ink, answer and accent, and the star gold. */
export const confettiOf = (world: number) => { const p = paletteOf(world); return [p.accent, p.answer, p.bad, "#f2a900", p.surface]; };

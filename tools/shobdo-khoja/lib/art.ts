// One palette per world, shared by the live page (as CSS variables) and the card. Paper is each pack's own colour.
import { type PackId } from "./packs";

export type Palette = { paper: string; sheet: string; edge: string; ink: string; deep: string; motif: string };

export const PALETTES: Readonly<Record<PackId, Palette>> = {
  phul: { paper: "#fbe7ec", sheet: "#fffafb", edge: "#e9b9c6", ink: "#b0305a", deep: "#6e1735", motif: "#e0607f" },
  mach: { paper: "#e3eff6", sheet: "#f8fcfe", edge: "#b5d0e0", ink: "#1f5f8f", deep: "#123a59", motif: "#4c8fbf" },
  pitha: { paper: "#f9ecd6", sheet: "#fffaf1", edge: "#e2c495", ink: "#9a5a12", deep: "#5c3507", motif: "#d08a2c" },
  phol: { paper: "#eef3d8", sheet: "#fcfdf5", edge: "#cbd69a", ink: "#527a12", deep: "#2f4a06", motif: "#e2a21c" },
  pakhi: { paper: "#e4f1e4", sheet: "#f9fdf9", edge: "#b7d6b7", ink: "#24764a", deep: "#13472b", motif: "#3c9a62" },
  khela: { paper: "#fbe8d6", sheet: "#fffaf5", edge: "#e8bf98", ink: "#b5560f", deep: "#6b3105", motif: "#d9762e" },
  ritu: { paper: "#eee8f6", sheet: "#fcfaff", edge: "#cbbde3", ink: "#5b3aa0", deep: "#34206a", motif: "#8a6ac8" },
  nodi: { paper: "#e0f0ee", sheet: "#f7fcfb", edge: "#a9d3cd", ink: "#0f6f68", deep: "#06433f", motif: "#2b958c" },
};

/** Ballpoint colours, one per word, so crossing words stay apart. The live board uses the same ones. */
export const INKS = ["#1f4fbf", "#c4302b", "#14805a", "#7a3fb8", "#0b6f93", "#b5560f", "#a3326e", "#5a6b12"] as const;
export const LETTER = "#2a211b";
export const MUTED = "#6b5d52";
export const FINALE = "#b8321f";

/** Each world's key for the found-word song: the root of a major pentatonic, so any run of notes sounds right. */
export const ROOTS: Readonly<Record<PackId, number>> = { phul: 523, mach: 587, pitha: 494, phol: 659, pakhi: 698, khela: 440, ritu: 554, nodi: 466 };

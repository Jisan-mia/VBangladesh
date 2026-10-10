import { books, type ShelfId } from "./shelf";

// Old hardbound Bangla spines: each series has its own family of colours (Himu's yellows, Misir Ali's night shades, Shubhro's whites).
const palettes: Record<ShelfId, { colors: string[]; ink: string }> = {
  himu: { colors: ["#e8b723", "#d4951b", "#f0c94a", "#c78a18", "#e2a62d"], ink: "#2a1d05" },
  misir: { colors: ["#2f4858", "#3d3459", "#284b3e", "#4d2f3c", "#34415f"], ink: "#f3e9cc" },
  shubhro: { colors: ["#f2ede1", "#dce7ee", "#ebe3cf", "#d5e2e6"], ink: "#22324a" },
  uponnash: { colors: ["#a3362b", "#2f6b4f", "#7a2e3e", "#b2552a", "#3e5d7a", "#6b4a2b"], ink: "#f6ecd2" },
};
const heights = [6, 0, 10, 3, 13, 5, 9, 1, 12, 4];

export function spineLook(index: number) {
  const book = books[index];
  const palette = palettes[book.shelf];
  const within = books.slice(0, index).filter(other => other.shelf === book.shelf).length;
  return { color: palette.colors[within % palette.colors.length], ink: palette.ink, lift: heights[index % heights.length] };
}

// A faceless walker in a yellow panjabi, drawn in a 100×140 box; shared by the page (SVG) and the card (canvas).
export const walker = {
  skin: "M39 18a11 11 0 1 0 22 0a11 11 0 1 0-22 0ZM46 27h8v8h-8ZM40 92l-7 39h8l8-35ZM58 94l9 36h-8l-8-34Z",
  panjabi: "M36 34q14-6 28 0l7 58q-21 7-42 0ZM37 36l-12 30 7 3 11-24ZM63 36l12 27-7 3-10-22Z",
};

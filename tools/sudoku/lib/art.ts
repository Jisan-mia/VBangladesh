// One paper and one ink per world (`card` is the share card's ink on newsprint); the CSS in product.css uses the same values (data-world on .sd).
// 0 সকালের কাগজ, 1 খাতার পাতা, 2 রবিবারের পাতা, 3 রাতের সংস্করণ, and the daily page.
export const PAPERS = [
  { paper: "#f4efe3", sheet: "#fffdf7", ink: "#1f1d1a", pen: "#24439a", marker: "#ffe27a", card: "#24439a" },
  { paper: "#eaf1e6", sheet: "#fbfdf8", ink: "#1d2a22", pen: "#1d6b47", marker: "#ffd59a", card: "#1d6b47" },
  { paper: "#f5e6dc", sheet: "#fffaf6", ink: "#2a1d1a", pen: "#8a2b3c", marker: "#bfe8d2", card: "#8a2b3c" },
  { paper: "#1c2131", sheet: "#252b3f", ink: "#e4e9f7", pen: "#ffc53d", marker: "#40548f", card: "#1c2131" },
  { paper: "#f4efe3", sheet: "#fffdf7", ink: "#1f1d1a", pen: "#24439a", marker: "#ffe27a", card: "#24439a" },
] as const;
export const paperFor = (level: number) => PAPERS[level ? Math.min(3, Math.floor((level - 1) / 10)) : 4];

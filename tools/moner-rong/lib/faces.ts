// The six feelings: a word, a colour and a face. One set of path data (viewBox 0 0 100 100) draws both the page's SVG and the card's canvas.

export type Feeling = "khushi" | "mon-kharap" | "rag" | "bhoy" | "obak" | "lojja";
export const ORDER: readonly Feeling[] = ["khushi", "mon-kharap", "rag", "bhoy", "obak", "lojja"];

/** `say` names the feeling in a sentence about a child (who / whose), the way a child says it: "রাফির মন খারাপ।" */
export const FEELINGS: Record<Feeling, { word: string; color: string; light: string; mirror: string; say: (who: string, whose: string) => string }> = {
  khushi: { word: "খুশি", color: "#c98a00", light: "#ffe07a", mirror: "খুশির মুখ", say: who => `${who} খুশি।` },
  "mon-kharap": { word: "মন খারাপ", color: "#3f73b8", light: "#bcd6f5", mirror: "মন খারাপের মুখ", say: (_, whose) => `${whose} মন খারাপ।` },
  rag: { word: "রাগ", color: "#c8402e", light: "#f8b6a6", mirror: "রাগের মুখ", say: (_, whose) => `${whose} রাগ হচ্ছে।` },
  bhoy: { word: "ভয়", color: "#7151a3", light: "#dccff0", mirror: "ভয়ের মুখ", say: (_, whose) => `${whose} ভয় লাগছে।` },
  obak: { word: "অবাক", color: "#16877a", light: "#b4e6dc", mirror: "অবাক মুখ", say: who => `${who} অবাক।` },
  lojja: { word: "লজ্জা", color: "#c2527c", light: "#f9cadb", mirror: "লজ্জার মুখ", say: (_, whose) => `${whose} লজ্জা লাগছে।` },
};

export const INK = "#3b2a20";
/** A face part: filled, outlined in ink (`line` = stroke width), or both. */
export type Part = { d: string; fill?: string; line?: number };

const dot = (x: number, y: number, r: number) => `M${x - r} ${y}a${r} ${r} 0 1 0 ${2 * r} 0a${r} ${r} 0 1 0 ${-2 * r} 0z`;
export const HEAD = dot(50, 50, 45);
const eyes = (y: number, r = 5, dx = 0) => ({ d: `${dot(36 + dx, y, r)}${dot(64 + dx, y, r)}`, fill: INK });
const cheeks = (fill: string, r = 6) => ({ d: `${dot(24, 60, r)}${dot(76, 60, r)}`, fill });
const MOUTH = "#8a3a2a";

// No teeth, no tears streaming, no frowns that read as cruel: every face should look like a child you know, never a scary one.
export const FACES: Record<Feeling | "calm", Part[]> = {
  khushi: [eyes(42), cheeks("#ff9e7a"), { d: "M28 58Q50 88 72 58Z", fill: MOUTH, line: 4 }],
  "mon-kharap": [eyes(48), { d: "M24 38L40 31M60 31L76 38", line: 4 }, { d: "M34 75Q50 61 66 75", line: 5 }, { d: "M71 55q-5 8 0 12q5-4 0-12z", fill: "#5fa8e8" }],
  rag: [eyes(50), { d: "M24 33L42 41M58 41L76 33", line: 5 }, { d: "M36 73Q50 65 64 73", line: 5 }, cheeks("#ef7a62", 7)],
  bhoy: [{ d: `${dot(36, 46, 10)}${dot(64, 46, 10)}`, fill: "#fff", line: 3 }, eyes(48, 4), { d: "M24 30Q34 21 44 27M56 27Q66 21 76 30", line: 4 }, { d: "M36 72q3.5-5 7 0t7 0t7 0t7 0", line: 4 }],
  obak: [eyes(44, 6), { d: "M26 30Q36 21 46 29M54 29Q64 21 74 30", line: 4 }, { d: "M42 70a8 10 0 1 0 16 0a8 10 0 1 0 -16 0z", fill: MOUTH, line: 4 }],
  lojja: [eyes(52, 4.5, -3), { d: "M28 39Q35 36 42 39M56 39Q63 36 70 39", line: 3 }, cheeks("#f07a9a", 9), { d: "M42 70Q49 75 57 68", line: 4 }],
  /** After a kind choice: the same colour of feeling, but the face has settled. */
  calm: [{ d: "M28 44Q35 50 42 44M58 44Q65 50 72 44", line: 4 }, cheeks("#ff9e7a"), { d: "M36 63Q50 76 64 63", line: 5 }],
};

export const NEUTRAL = "#efe6d8";

/** Draws a face onto a canvas at (x, y) with diameter `size`. Path2D takes the same SVG path strings the page uses. */
export function drawFace(c: CanvasRenderingContext2D, feeling: Feeling | "calm", x: number, y: number, size: number, fill: string) {
  c.save();
  c.translate(x - size / 2, y - size / 2);
  c.scale(size / 100, size / 100);
  c.lineCap = "round"; c.lineJoin = "round"; c.strokeStyle = INK;
  const head = new Path2D(HEAD);
  c.fillStyle = fill; c.fill(head); c.lineWidth = 4; c.stroke(head);
  for (const part of FACES[feeling]) {
    const path = new Path2D(part.d);
    if (part.fill) { c.fillStyle = part.fill; c.fill(path); }
    if (part.line) { c.lineWidth = part.line; c.stroke(path); }
  }
  c.restore();
}

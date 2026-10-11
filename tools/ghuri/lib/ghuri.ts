// Kite names are ones Old Dhaka shops sell at Shakrain; the drawings are our own, from the names.
// Sources: https://www.prothomalo.com/bangladesh/capital/wzotxb2r7l (চশমাদার, পঙ্খিরাজ, চক্ষুদার/গোলচোখ, মালাদার, দাবা ঘুড়ি, টেক্কা)
//          https://www.thedailystar.net/news/old-dhaka-readies-sakrain-kites-lanterns-memories-return-winter-skies-tomorrow-4079976 (Chokhdar, Pankhiraj, Maladar, Chashmadar; Sakrain = Poush Sankranti, 14 Jan)

export const MAX_TEXT = 16;

// Ids go in links: only append, never rename or delete.
export const patterns = [
  { id: "pankhiraj", label: "পঙ্খিরাজ", line: "পঙ্খিরাজ একবার উঠলে আর নামতে চায় না।" },
  { id: "chokhdar", label: "চোখদার", line: "চোখদার ঘুড়ি আকাশ থেকে পুরো পাড়াটা দেখে রাখে।" },
  { id: "choshmadar", label: "চশমাদার", line: "চশমা পরা ঘুড়ি, সবার আগে বাতাস চিনে ফেলে।" },
  { id: "maladar", label: "মালাদার", line: "মালাদার উড়লে ছাদের সবাই একবার মাথা তোলে।" },
  { id: "daba", label: "দাবা ঘুড়ি", line: "দাবার ঘরের মতো ঘুড়ি, এবার চাল দেবে বাতাস।" },
  { id: "tekka", label: "টেক্কা", line: "হাতে টেক্কা থাকলে আকাশটা নিজের মনে হয়।" },
] as const;

export const colors = [
  { id: "red", label: "লাল", paper: "#d62828", trim: "#fff1d0" },
  { id: "yellow", label: "হলুদ", paper: "#f5bf1f", trim: "#a4161a" },
  { id: "green", label: "সবুজ", paper: "#1f8a4c", trim: "#ffe08a" },
  { id: "blue", label: "নীল", paper: "#2346a8", trim: "#ffd23f" },
  { id: "pink", label: "গোলাপি", paper: "#e64f8a", trim: "#ffffff" },
  { id: "black", label: "কালো", paper: "#1f1c24", trim: "#f5bf1f" },
] as const;

// Lantern wishes are fixed, so a link never carries private words beyond the short text.
export const wishes = [
  { id: "bhalo", label: "সবাই ভালো থাকুক" },
  { id: "shustho", label: "মা-বাবা সুস্থ থাকুক" },
  { id: "notun", label: "নতুন বছর ভালো কাটুক" },
  { id: "porikkha", label: "পরীক্ষাটা ভালো হোক" },
  { id: "fera", label: "দূরের মানুষ ঘরে ফিরুক" },
  { id: "shanti", label: "মনে একটু শান্তি আসুক" },
] as const;

export type Mode = "kite" | "fanush";
export type PatternId = (typeof patterns)[number]["id"];
export type ColorId = (typeof colors)[number]["id"];
export type WishId = (typeof wishes)[number]["id"];
export type Ghuri = { mode: Mode; pattern: PatternId; color: ColorId; wish: WishId; text: string };

export const DEFAULT: Ghuri = { mode: "kite", pattern: "pankhiraj", color: "red", wish: "bhalo", text: "" };

const digits = "০১২৩৪৫৬৭৮৯";
export const bn = (value: number) => String(value).replace(/\d/g, digit => digits[Number(digit)]);

/** Bangla year (Bangladesh calendar: ১ বৈশাখ = 14 Apr). Shakrain, the last day of Poush (14 Jan), falls in the year that began the April before. */
export const banglaYear = (now: Date) => now.getFullYear() - (now.getMonth() > 3 || (now.getMonth() === 3 && now.getDate() >= 14) ? 593 : 594);

export function cleanText(text: string) {
  // NFC so one word has one spelling; strip control and bidi-override characters so a link can't scramble the card.
  return text.normalize("NFC").replace(/[\u0000-\u001f\u007f-\u009f‎‏‪-‮⁦-⁩]/g, " ").replace(/\s+/g, " ").trim().slice(0, MAX_TEXT).trim();
}

export const patternOf = (id: string) => patterns.find(item => item.id === id);
export const colorOf = (id: string) => colors.find(item => item.id === id);
export const wishOf = (id: string) => wishes.find(item => item.id === id);

/** The big words on the card: for a kite what they wrote, else its own name; for a lantern, the wish it carries. */
export const headline = (ghuri: Ghuri) => ghuri.mode === "fanush" ? wishOf(ghuri.wish)!.label : ghuri.text || patternOf(ghuri.pattern)!.label;
export const humanLine = (ghuri: Ghuri) => ghuri.mode === "kite" ? patternOf(ghuri.pattern)!.line : "আকাশে একটা আলো, মনে একটা চাওয়া।";

export function stateOf(ghuri: Ghuri) {
  const params = new URLSearchParams(ghuri.mode === "kite" ? { o: "kite", p: ghuri.pattern, c: ghuri.color } : { o: "fanush", w: ghuri.wish, c: ghuri.color });
  const text = cleanText(ghuri.text);
  if (text) params.set("nm", text);
  return params.toString();
}

export function parseShareHash(hash: string): Ghuri | null {
  const params = new URLSearchParams(hash.replace(/^#/, "").slice(0, 400));
  const mode = params.get("o");
  const color = colorOf(params.get("c") ?? "");
  if ((mode !== "kite" && mode !== "fanush") || !color) return null;
  const pattern = mode === "kite" ? patternOf(params.get("p") ?? "") : patternOf(DEFAULT.pattern);
  const wish = mode === "fanush" ? wishOf(params.get("w") ?? "") : wishOf(DEFAULT.wish);
  if (!pattern || !wish) return null;
  return { mode, pattern: pattern.id, color: color.id, wish: wish.id, text: cleanText(params.get("nm") ?? "") };
}

export function caption(ghuri: Ghuri) {
  if (ghuri.mode === "fanush") return `আমার ফানুসে লিখলাম: “${wishOf(ghuri.wish)!.label}”। তোমার ফানুসে কী লিখবে?`;
  return `সাকরাইনের আকাশে আমার ঘুড়ি ‘${headline(ghuri)}’ উড়ছে! তোমার ঘুড়ির নাম কী?`;
}

export function previewTitle(ghuri: Ghuri) {
  if (ghuri.mode === "fanush") return `${ghuri.text ? `‘${ghuri.text}’ লেখা` : "এক বন্ধুর"} ফানুসে একটা চাওয়া: ${wishOf(ghuri.wish)!.label}`;
  return ghuri.text ? `‘${ghuri.text}’ উড়ছে সাকরাইনের আকাশে। তোমার ঘুড়ি কই?` : `এক বন্ধুর ${patternOf(ghuri.pattern)!.label} উড়ছে সাকরাইনের আকাশে। তোমার ঘুড়ি কই?`;
}

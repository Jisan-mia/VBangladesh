// Gold weight in the units Bangladeshi jewellers write on a cash memo. Weights only: no gold price (it changes daily), no advice.
//
// 1 ভরি = 11.664 g. BAJUS (বাংলাদেশ জুয়েলার্স সমিতি) states this in its price notices, "প্রতি ভরি (১১ দশমিক ৬৬৪ গ্রাম)", e.g.
//   https://bangla.thedailystar.net/economy/news-523736
//   https://www.tbsnews.net/bangla/bangladesh/news-details-398176
// 1 ভরি = 16 আনা = 96 রতি = 960 পয়েন্ট (so 1 আনা = 6 রতি, 1 রতি = 10 পয়েন্ট):
//   https://en.wikipedia.org/wiki/Bhori
//   https://www.bdlandsurveyor.com/2020/05/blog-post_95.html
// One BBC Bangla piece (https://www.tbsnews.net/bangla/bbc/news-details-446946) writes "আট রতি সমান এক আনা"; we follow the
// 96-রতি ভরি above, and the page says some shops count differently.
// Everything is counted in whole পয়েন্ট, and 1 পয়েন্ট = 11.664 / 960 = 0.01215 g exactly, so grams are integer maths.
import { possessive } from "../../../shared/bangla";

export const CHECKED = "১০ অক্টোবর ২০২৬";
// ISO twin of the date above for schema dateModified and sitemap lastmod; bump both together.
export const CHECKED_ON = "2026-10-10";
export const MAX_NAME_LENGTH = 20;
/** Grams per পয়েন্ট × 100000. */
const POINT_MICRO = 1215;
export const POINTS_PER_BHORI = 960;
export const MAX_POINTS = POINTS_PER_BHORI * 100;

export const units = [
  { id: "bhori", label: "ভরি", points: 960 },
  { id: "ana", label: "আনা", points: 60 },
  { id: "roti", label: "রতি", points: 10 },
  { id: "point", label: "পয়েন্ট", points: 1 },
] as const;
export type UnitId = (typeof units)[number]["id"];

// Share links store these ids: only append, never rename or reorder.
// Drawings sit in a 48×48 box and are stroked in gold, both on the page (SVG) and on the card (Path2D).
export const items = [
  { id: "bala", label: "বালা", drawing: "M24 7a17 17 0 1 0 0 34 17 17 0 1 0 0-34Zm0 3.5a13.5 13.5 0 1 0 0 27 13.5 13.5 0 1 0 0-27Zm0 3.5a10 10 0 1 0 0 20 10 10 0 1 0 0-20Z" },
  { id: "churi", label: "চুড়ি", drawing: "M7 17c0-4 8-6 17-6s17 2 17 6-8 6-17 6-17-2-17-6Zm0 7c0 4 8 6 17 6s17-2 17-6M7 31c0 4 8 6 17 6s17-2 17-6M7 17v14m34-14v14" },
  { id: "dul", label: "দুল", drawing: "M24 3c5 0 6 7 0 8v4M24 15a3 3 0 1 0 0 6 3 3 0 1 0 0-6ZM12 33c0-8 5-12 12-12s12 4 12 12ZM12 33h24M15 37v3m5-2v5m4-5v6m4-6v5m5-4v3" },
  { id: "angti", label: "আংটি", drawing: "M24 19a12 12 0 1 0 0 24 12 12 0 1 0 0-24Zm0 4a8 8 0 1 0 0 16 8 8 0 1 0 0-16ZM17 9h14l-7 10ZM17 9l4-4h6l4 4M21 9l3 10 3-10" },
  { id: "har", label: "হার", drawing: "M7 5c0 19 8 28 17 28S41 24 41 5M9 14l-3 1m6 5-3 2m6 4-2 3M39 14l3 1m-6 5 3 2m-6 4 2 3M24 33l-5 5 5 6 5-6Z" },
  { id: "nakful", label: "নাকফুল", drawing: "M24 21a3 3 0 1 0 0 6 3 3 0 1 0 0-6ZM27 24a4 4 0 1 0 8 0 4 4 0 1 0-8 0M13 24a4 4 0 1 0 8 0 4 4 0 1 0-8 0M20.5 30a4 4 0 1 0 7 0 4 4 0 1 0-7 0M20.5 18a4 4 0 1 0 7 0 4 4 0 1 0-7 0M24 34v9" },
] as const;

export const owners = [
  { id: "ma", label: "মায়ের", line: "আলমারির কোণের লাল বাক্সটা খুললেই মায়ের গন্ধ পাই।" },
  { id: "nanu", label: "নানুর", line: "নানুর বাক্স খুললেই আগে গল্প বেরোত, তারপর গয়না।" },
  { id: "dadi", label: "দাদির", line: "দাদি বলত, ‘এটা তোর জন্য রেখে দিলাম।’ ওজনটা তখন কেউ মাপেনি।" },
  { id: "bon", label: "বোনের", line: "একবার ধার নিয়েছিলাম। গয়নাটা ফেরত দিয়েছি, গল্পটা রেখে দিয়েছি।" },
  { id: "amar", label: "আমার", line: "ওজনটা ভুলে যেতাম, দিনটা কখনো ভুলিনি।" },
] as const;

/** A few pairs deserve their own line; everything else uses the owner's. */
const pairLines: Record<string, string> = {
  "ma.bala": "বালার টুংটাং শুনলেই বুঝতাম, মা রান্নাঘরে।",
  "ma.churi": "চুড়ির টুংটাং শুনলেই বুঝতাম, মা রান্নাঘরে।",
  "ma.dul": "ছোটবেলায় মায়ের দুল ধরে টানতাম, মা হেসে হাতটা সরিয়ে দিত।",
  "nanu.nakful": "নানুর মুখটা মনে পড়লে আগে ছোট্ট নাকফুলটাই চোখে ভাসে।",
  "dadi.har": "বিয়ের দিন দাদির হারটা গলায় দিয়ে সবাই বলেছিল, ‘একদম দাদির মতো লাগছে।’",
  "amar.angti": "আঙুলের এই ছোট্ট আংটিটায় একটা পুরো দিন আটকে আছে।",
};

export type ItemId = (typeof items)[number]["id"];
export type OwnerId = (typeof owners)[number]["id"];
export type Piece = { points: number; item: ItemId; owner: OwnerId; name: string };

/** The brief's first screen: মায়ের বালা, ২ ভরি ৪ আনা = ২৬.২৪ গ্রাম. */
export const samplePiece: Piece = { points: 2 * 960 + 4 * 60, item: "bala", owner: "ma", name: "" };

const DIGITS = "০১২৩৪৫৬৭৮৯";
export const bn = (value: number | string) => String(value).replace(/\d/g, digit => DIGITS[Number(digit)]);
const grouped = (value: number) => bn(value.toLocaleString("en-IN"));

export function cleanName(name: string) {
  return name.normalize("NFC").replace(/[\u0000-\u001f\u007f‪-‮⁦-⁩]/g, "").trim().replace(/\s+/g, " ").slice(0, MAX_NAME_LENGTH).trim();
}

export const clampPoints = (points: number) => Math.min(MAX_POINTS, Math.max(0, Math.round(points)));

export function split(points: number): Record<UnitId, number> {
  return { bhori: Math.floor(points / 960), ana: Math.floor((points % 960) / 60), roti: Math.floor((points % 60) / 10), point: points % 10 };
}

/** "১ ভরি ৫ আনা ২ রতি": zero parts are left out. */
export function weightText(points: number) {
  const parts = split(points);
  const text = units.filter(unit => parts[unit.id]).map(unit => `${bn(parts[unit.id])} ${unit.label}`).join(" ");
  return text || "০ ভরি";
}

/** Grams to 2 decimals as a plain "15.31" (half up, in integers so 1.215 never becomes 1.21). */
export function gramsValue(points: number) {
  const hundredths = Math.floor((points * POINT_MICRO + 500) / 1000);
  return `${Math.floor(hundredths / 100)}.${String(hundredths % 100).padStart(2, "0")}`;
}

/** The exact grams, trailing zeros dropped: 1260 পয়েন্ট → "15.309". */
export function gramsExact(points: number) {
  const micro = points * POINT_MICRO;
  const fraction = String(micro % 100000).padStart(5, "0").replace(/0+$/, "");
  return fraction ? `${Math.floor(micro / 100000)}.${fraction}` : String(Math.floor(micro / 100000));
}

export const grams = (points: number) => bn(gramsValue(points));

/** "২১ আনা × ০.৭২৯ = ১৫.৩০৯ গ্রাম ≈ ১৫.৩১": the sum written out, in the biggest unit that divides evenly. */
export function workingLine(points: number) {
  const [count, unit, factor] = points % 60 === 0 ? [points / 60, "আনা", "0.729"] : points % 10 === 0 ? [points / 10, "রতি", "0.1215"] : [points, "পয়েন্ট", "0.01215"];
  const exact = gramsExact(points);
  const rounded = gramsValue(points);
  return `${grouped(count)} ${unit} × ${bn(factor)} = ${bn(exact)} গ্রাম${Number(exact) === Number(rounded) ? "" : ` ≈ ${bn(rounded)}`}`;
}

/** Reads a typed gram amount: Bangla or English digits, one decimal point. Null when it isn't a weight we can show. */
export function parseGrams(text: string) {
  const ascii = text.trim().replace(/[০-৯]/g, digit => String(DIGITS.indexOf(digit))).replace(/[,\s]/g, "").replace(/গ্রাম$|g$/i, "");
  if (!/^\d{0,5}(\.\d*)?$/.test(ascii) || !/\d/.test(ascii)) return null;
  const value = Number(ascii);
  if (!Number.isFinite(value) || value < 0 || value * 100000 > MAX_POINTS * POINT_MICRO) return null;
  return value;
}

/** Grams → the nearest whole পয়েন্ট, plus how much rounding moved it, so the page can say so. */
export function fromGrams(value: number) {
  const points = clampPoints((value * 100000) / POINT_MICRO);
  const diff = Math.abs(points * POINT_MICRO - Math.round(value * 100000)) / 100000;
  return { points, diff };
}

const itemOf = (id: ItemId) => items.find(item => item.id === id)!;
const ownerOf = (id: OwnerId) => owners.find(owner => owner.id === id)!;

export type Card = {
  /** "রাফির নানুর হার" / "মায়ের বালা" */
  title: string;
  item: (typeof items)[number];
  weight: string;
  grams: string;
  working: string;
  line: string;
};

export function pieceTitle({ item, owner, name }: Pick<Piece, "item" | "owner" | "name">) {
  const who = cleanName(name);
  const label = itemOf(item).label;
  if (owner === "amar") return who ? `${possessive(who)} ${label}` : `আমার ${label}`;
  return `${who ? `${possessive(who)} ` : ""}${ownerOf(owner).label} ${label}`;
}

export function createCard(piece: Piece): Card {
  const points = clampPoints(piece.points);
  return {
    title: pieceTitle(piece),
    item: itemOf(piece.item),
    weight: weightText(points),
    grams: grams(points),
    working: workingLine(points),
    line: pairLines[`${piece.owner}.${piece.item}`] ?? ownerOf(piece.owner).line,
  };
}

export function shareHash({ points, item, owner, name }: Piece) {
  const params = new URLSearchParams({ g: gramsValue(clampPoints(points)), it: item, w: owner });
  const shown = cleanName(name);
  if (shown) params.set("n", shown);
  return "#" + params.toString();
}

export function parseShareHash(hash: string): Piece | null {
  if (hash.length > 300) return null;
  const params = new URLSearchParams(hash.replace(/^#/, ""));
  const g = params.get("g") ?? "";
  const item = items.find(entry => entry.id === params.get("it"))?.id;
  const owner = owners.find(entry => entry.id === params.get("w"))?.id;
  if (!/^\d{1,4}(\.\d{1,2})?$/.test(g) || !item || !owner) return null;
  // 2-decimal grams map back to exactly one পয়েন্ট count, because a পয়েন্ট (0.01215 g) is wider than 0.01 g.
  const points = Math.round((Math.round(Number(g) * 100) * 1000) / POINT_MICRO);
  if (points < 1 || points > MAX_POINTS) return null;
  return { points, item, owner, name: cleanName(params.get("n") ?? "") };
}

/** "রাফির নানুর হার: ১ ভরি ৫ আনা — ১৫.৩১ গ্রাম" for link previews and the friend banner. */
export const previewTitle = (card: Card) => `${card.title}: ${card.weight}, ${card.grams} গ্রাম`;

export const caption = (card: Card) => `${card.title}: ${card.weight}, মানে ${card.grams} গ্রাম। ${card.line} তোমার বাড়ির পুরোনো গয়নাটা কার?`;

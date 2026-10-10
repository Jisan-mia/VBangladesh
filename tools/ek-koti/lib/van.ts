import { possessive } from "../../../shared/bangla";

export const BUDGET = 1_00_00_000;
export const MAX_NAME_LENGTH = 30;
/** Shown next to every price, on the page and on the card. */
export const PRICE_NOTE = "আনুমানিক, মজার জন্য · অক্টোবর ২০২৬";

export const groups = [
  { id: "khawa", label: "খাওয়াদাওয়া", short: "খাওয়া" },
  { id: "shokh", label: "শখের জিনিস", short: "শখ" },
  { id: "ghora", label: "ঘোরাঘুরি", short: "ঘোরা" },
  { id: "poribar", label: "পরিবারের জন্য", short: "পরিবার" },
  { id: "sobar", label: "সবার জন্য", short: "সবার জন্য" },
] as const;

export type GroupId = (typeof groups)[number]["id"];

type Item = {
  id: string;
  group: GroupId;
  /** The row label on the page. */
  label: string;
  note?: string;
  /** Taka for one tap of +. */
  price: number;
  /** How a count reads on the card: `${count × pack}${unit} ${noun}`, e.g. "৩০০ প্লেট কাচ্চি", "৫টা নলকূপ". */
  unit: string;
  noun: string;
  pack?: number;
  /** What a count of one reads as, when "১ বার …" would sound odd. */
  one?: string;
  max?: number;
};

/*
 * Prices: round, plausible Bangladesh prices for October 2026, for a game. Not quotes and not advice.
 * Estimated from typical Dhaka retail and market prices reported in 2025–26 news and seen on ordinary shop
 * listings, then rounded to a number people would say out loud (চা ১৫, কাচ্চি ৩৫০, এক কেজির ইলিশ ২,৫০০,
 * 150cc মোটরসাইকেল আড়াই লাখ, রিকন্ডিশন্ড গাড়ি ৩৫ লাখ, গ্রামে পাকা বাড়ি ৩০ লাখ, হজ দুজনের ১২ লাখ,
 * ইট বিছানো গ্রামের রাস্তা কিলোমিটারে ২০ লাখের মতো, অ্যাম্বুলেন্স ৩০ লাখ). No brands, shops or companies.
 * No lottery, prize, betting or investment items (shares, crypto, savings certificates, gold, land) on purpose.
 * Ids go into share links and the tally: never rename or delete one; add new items at the end of a group.
 */
export const items = [
  { id: "cha", group: "khawa", label: "এক কাপ চা", price: 15, unit: " কাপ", noun: "চা" },
  { id: "fuchka", group: "khawa", label: "এক প্লেট ফুচকা", price: 60, unit: " প্লেট", noun: "ফুচকা" },
  { id: "kacchi", group: "khawa", label: "এক প্লেট কাচ্চি", price: 350, unit: " প্লেট", noun: "কাচ্চি" },
  { id: "mishti", group: "khawa", label: "এক কেজি মিষ্টি", price: 400, unit: " কেজি", noun: "মিষ্টি" },
  { id: "aam", group: "khawa", label: "এক ঝুড়ি আম", note: "২০ কেজি", price: 2_000, unit: " ঝুড়ি", noun: "আম" },
  { id: "ilish", group: "khawa", label: "বড় একটা ইলিশ", note: "এক কেজির বেশি", price: 2_500, unit: "টা", noun: "বড় ইলিশ" },
  { id: "treat", group: "khawa", label: "বন্ধুদের ট্রিট", note: "দশজন মিলে", price: 10_000, unit: " বার", noun: "বন্ধুদের ট্রিট", one: "বন্ধুদের ট্রিট" },
  { id: "biriyani", group: "khawa", label: "পাড়ার সবাইকে বিরিয়ানি", note: "২০০ প্লেট", price: 60_000, unit: " বার", noun: "পাড়ায় বিরিয়ানি", one: "পাড়ায় বিরিয়ানি" },

  { id: "jersey", group: "shokh", label: "প্রিয় দলের জার্সি", price: 2_000, unit: "টা", noun: "জার্সি" },
  { id: "guitar", group: "shokh", label: "একটা গিটার", price: 15_000, unit: "টা", noun: "গিটার" },
  { id: "cycle", group: "shokh", label: "নতুন সাইকেল", price: 18_000, unit: "টা", noun: "সাইকেল" },
  { id: "phone", group: "shokh", label: "নতুন স্মার্টফোন", price: 35_000, unit: "টা", noun: "স্মার্টফোন" },
  { id: "tv", group: "shokh", label: "বড় পর্দার টিভি", price: 70_000, unit: "টা", noun: "টিভি" },
  { id: "laptop", group: "shokh", label: "ল্যাপটপ", price: 85_000, unit: "টা", noun: "ল্যাপটপ" },
  { id: "bike", group: "shokh", label: "মোটরসাইকেল", price: 2_50_000, unit: "টা", noun: "মোটরসাইকেল" },
  { id: "car", group: "shokh", label: "নিজের গাড়ি", price: 35_00_000, unit: "টা", noun: "গাড়ি" },

  { id: "haor", group: "ghora", label: "হাওরে হাউসবোট", note: "এক রাত", price: 12_000, unit: " রাত", noun: "হাওরে হাউসবোট" },
  { id: "sajek", group: "ghora", label: "সাজেক ভ্যালি", note: "তিন দিনের ট্রিপ", price: 15_000, unit: " বার", noun: "সাজেক", one: "সাজেক ট্রিপ" },
  { id: "bandarban", group: "ghora", label: "বান্দরবানের পাহাড়", note: "তিন দিনের ট্রিপ", price: 18_000, unit: " বার", noun: "বান্দরবান", one: "বান্দরবান ট্রিপ" },
  { id: "sundarban", group: "ghora", label: "নৌকায় সুন্দরবন", note: "তিন দিনের ট্রিপ", price: 25_000, unit: " বার", noun: "সুন্দরবন", one: "নৌকায় সুন্দরবন" },
  { id: "coxs", group: "ghora", label: "কক্সবাজারে এক সপ্তাহ", price: 40_000, unit: " সপ্তাহ", noun: "কক্সবাজার", one: "কক্সবাজারে এক সপ্তাহ" },
  { id: "bidesh", group: "ghora", label: "প্রথম বিদেশ ভ্রমণ", price: 2_00_000, unit: "টা", noun: "বিদেশ ভ্রমণ", one: "বিদেশ ভ্রমণ" },
  { id: "zila", group: "ghora", label: "৬৪ জেলা ঘোরা", price: 3_00_000, unit: "", noun: "", one: "৬৪ জেলা ঘোরা", max: 1 },
  { id: "worldcup", group: "ghora", label: "মাঠে বসে বিশ্বকাপ দেখা", note: "যাওয়া-আসা আর টিকিট", price: 5_00_000, unit: " বার", noun: "মাঠে বসে বিশ্বকাপ", one: "মাঠে বসে বিশ্বকাপ দেখা" },

  { id: "panjabi", group: "poribar", label: "বাবার জন্য পাঞ্জাবি", price: 3_000, unit: "টা", noun: "পাঞ্জাবি" },
  { id: "jamdani", group: "poribar", label: "মায়ের জন্য জামদানি", price: 15_000, unit: "টা", noun: "জামদানি" },
  { id: "jama", group: "poribar", label: "পরিবারের সবার নতুন জামা", price: 25_000, unit: " বার", noun: "সবার নতুন জামা", one: "সবার নতুন জামা" },
  { id: "sagor", group: "poribar", label: "মা-বাবাকে সমুদ্র দেখানো", price: 50_000, unit: " বার", noun: "মা-বাবাকে সমুদ্র দেখানো", one: "মা-বাবাকে সমুদ্র দেখানো" },
  { id: "ac", group: "poribar", label: "বাসার জন্য এসি", price: 75_000, unit: "টা", noun: "এসি" },
  { id: "porashona", group: "poribar", label: "ভাইবোনের পড়ার খরচ", note: "এক বছর", price: 1_20_000, unit: " বছরের", noun: "পড়ার খরচ" },
  { id: "hajj", group: "poribar", label: "আব্বু-আম্মুর হজ", note: "দুজনের খরচ", price: 12_00_000, unit: "", noun: "", one: "আব্বু-আম্মুর হজ", max: 1 },
  { id: "bari", group: "poribar", label: "আম্মুর জন্য বাড়ি", note: "গ্রামে পাকা বাড়ি", price: 30_00_000, unit: "", noun: "", one: "আম্মুর জন্য বাড়ি", max: 1 },

  { id: "gach", group: "sobar", label: "১০০টা গাছের চারা", note: "লাগানোসহ", price: 10_000, pack: 100, unit: "টা", noun: "গাছের চারা" },
  { id: "kombol", group: "sobar", label: "১০০টা শীতের কম্বল", price: 40_000, pack: 100, unit: "টা", noun: "শীতের কম্বল" },
  { id: "nolkup", group: "sobar", label: "গ্রামে একটা নলকূপ", price: 50_000, unit: "টা", noun: "নলকূপ" },
  { id: "britti", group: "sobar", label: "এক বছরের পড়ার বৃত্তি", note: "একজনের জন্য", price: 60_000, unit: "টা", noun: "বৃত্তি" },
  { id: "tran", group: "sobar", label: "১০০ পরিবারের ত্রাণ", note: "বন্যার সময়", price: 1_50_000, pack: 100, unit: " পরিবারের", noun: "ত্রাণ" },
  { id: "library", group: "sobar", label: "স্কুলে একটা লাইব্রেরি", price: 3_00_000, unit: "টা", noun: "স্কুল লাইব্রেরি" },
  { id: "rasta", group: "sobar", label: "গ্রামের রাস্তা", note: "আধা কিলোমিটার, ইট বিছিয়ে", price: 10_00_000, pack: 500, unit: " মিটার", noun: "গ্রামের রাস্তা" },
  { id: "ambulance", group: "sobar", label: "এলাকার অ্যাম্বুলেন্স", price: 30_00_000, unit: "টা", noun: "অ্যাম্বুলেন্স" },
] as const satisfies readonly Item[];

export type ItemId = (typeof items)[number]["id"];
export type Cart = Partial<Record<ItemId, number>>;
export type Shared = { cart: Cart; name: string };

/** The van never starts empty: one cup of tea, so the counter already shows how it works. */
export const starter: Cart = { cha: 1 };

const numbers = new Intl.NumberFormat("bn-BD");
export const bn = (value: number) => numbers.format(value);
/** ৳১,০০,০০,০০০ — Bangla digits with lakh/crore grouping. */
export const taka = (value: number) => "৳" + bn(value);

const byId = new Map<string, Item>(items.map(item => [item.id, item]));
export const isItemId = (id: string): id is ItemId => byId.has(id);
export const itemById = (id: ItemId) => byId.get(id)!;
const maxOf = (item: Item) => item.max ?? Infinity;

export const countOf = (cart: Cart, id: ItemId) => cart[id] ?? 0;
export const spentOf = (cart: Cart) => items.reduce((total, item) => total + item.price * countOf(cart, item.id), 0);
export const leftOf = (cart: Cart) => BUDGET - spentOf(cart);
/** Items in list order with a count above zero. */
export const boughtIn = (cart: Cart) => items.filter(item => countOf(cart, item.id) > 0);

/** How many more of this item the money (and its cap) allows. */
export function roomFor(cart: Cart, id: ItemId) {
  const item = itemById(id);
  return Math.max(0, Math.min(Math.floor(leftOf(cart) / item.price), maxOf(item) - countOf(cart, id)));
}

/** Sets a count, clamped so it is never below zero, never past the item's cap, and never past the money left. */
export function setCount(cart: Cart, id: string, count: number): Cart {
  if (!isItemId(id)) throw new RangeError("এই জিনিসটা তালিকায় নেই।");
  const now = countOf(cart, id);
  const wanted = Number.isFinite(count) ? Math.max(0, Math.floor(count)) : now;
  const next = Math.min(wanted, now + roomFor(cart, id));
  const copy: Cart = { ...cart };
  if (next > 0) copy[id] = next; else delete copy[id];
  return copy;
}

/** What someone typed in a count box, in Bangla or English digits; anything else counts as nothing. */
export function parseCount(text: string) {
  const digits = text.replace(/[\u09e6-\u09ef]/g, digit => String(digit.charCodeAt(0) - 0x09e6)).replace(/\D/g, "").slice(0, 7);
  return digits ? Number(digits) : 0;
}

export function phrase(id: ItemId, count: number) {
  const item: Item = itemById(id);
  if (count === 1 && item.one) return item.one;
  return `${bn(count * (item.pack ?? 1))}${item.unit} ${item.noun}`.trim();
}

/** Spend per group, in group order. */
export function groupSpend(cart: Cart) {
  return groups.map(group => items.filter(item => item.group === group.id).reduce((total, item) => total + item.price * countOf(cart, item.id), 0));
}

/** Distinct items bought per group (0–8), in group order: how high each stack on the van grows. */
export function groupLevels(cart: Cart) {
  return groups.map(group => items.filter(item => item.group === group.id && countOf(cart, item.id) > 0).length);
}

export function cleanName(name: string) {
  // NFC, and no control or bidi-override characters, so a shared link can't scramble the card text.
  return name.normalize("NFC").replace(/[\u0000-\u001f\u007f‪-‮⁦-⁩]/g, "").trim().replace(/\s+/g, " ").slice(0, MAX_NAME_LENGTH);
}

export function encodeCart(cart: Cart) {
  return boughtIn(cart).map(item => `${item.id}:${countOf(cart, item.id)}`).join(",");
}

/** Reads `cha:300,kacchi:2`. Anything unknown, over a cap or over the budget makes the whole cart invalid. */
export function decodeCart(code: string): Cart | null {
  if (!code || code.length > 600) return null;
  const cart: Cart = {};
  for (const pair of code.split(",")) {
    const [, id = "", digits = ""] = /^([a-z]{2,12}):([1-9]\d{0,6})$/.exec(pair) ?? [];
    if (!isItemId(id) || id in cart) return null;
    const count = Number(digits);
    if (count > maxOf(itemById(id))) return null;
    cart[id] = count;
  }
  return spentOf(cart) <= BUDGET && boughtIn(cart).length ? cart : null;
}

export function shareHash({ cart, name }: Shared) {
  const shown = cleanName(name);
  return `#q=${encodeCart(cart)}` + (shown ? `&n=${encodeURIComponent(shown)}` : "");
}

export function parseShareHash(hash: string): Shared | null {
  let params: URLSearchParams;
  try { params = new URLSearchParams(hash.replace(/^#/, "")); } catch { return null; }
  const cart = decodeCart(params.get("q") ?? "");
  return cart ? { cart, name: cleanName(params.get("n") ?? "") } : null;
}

/** One warm line chosen from what is actually on the van. */
export function vanLine(cart: Cart) {
  const spent = spentOf(cart);
  if (!spent) return "ভ্যান খালি, পকেট ভরা। কী কিনবে?";
  if (spent === BUDGET) return "শেষ পয়সাটাও খরচ! হিসাব একদম মিলে গেছে।";
  const spend = groupSpend(cart);
  const gifts = spend[3] + spend[4];
  if (gifts * 2 >= spent) return "এই কোটি টাকায় অন্যের হাসিই বেশি।";
  if (spent < BUDGET / 100) return "কোটি টাকা হাতে, তবু খরচ করতে হাত কাঁপে!";
  if (countOf(cart, "cha") >= 100) return "কোটি টাকা হোক আর যা-ই হোক, চা চলবেই।";
  const top = groups[spend.indexOf(Math.max(...spend))].id;
  if (top === "khawa") return "টাকা যাক, পেট আর মন দুটোই ভরুক।";
  if (top === "shokh") return "শখের দাম লাখ টাকা, এবার সত্যি সত্যি!";
  if (top === "ghora") return "টাকা থাকলে দেশটা আগে ঘুরে দেখা চাই।";
  return "সবার মুখে হাসি, এর চেয়ে বড় কেনাকাটা নেই।";
}

export type CardContent = {
  title: string;
  spent: number;
  left: number;
  headline: string;
  /** Biggest spends first: "আম্মুর জন্য বাড়ি, ৩০০ প্লেট কাচ্চি, …" (commas stick to the word before, so wrapped lines never start with one). */
  list: string;
  line: string;
  match: string;
  levels: number[];
  count: number;
};

export function createCard(own: Shared, friend?: Shared | null): CardContent {
  const name = cleanName(own.name);
  const spent = spentOf(own.cart);
  const bought = boughtIn(own.cart);
  const ordered = [...bought].sort((a, b) => b.price * countOf(own.cart, b.id) - a.price * countOf(own.cart, a.id));
  let match = "";
  if (friend && bought.length) {
    const common = bought.filter(item => countOf(friend.cart, item.id) > 0).length;
    match = `${friend.name ? possessive(friend.name) : "বন্ধুর"} সাথে ${common ? `${bn(common)}টা জিনিস মিলে গেছে` : "একটাও মেলেনি"}`;
  }
  return {
    title: `${name ? possessive(name) : "আমার"} এক কোটির ভ্যান`,
    spent,
    left: BUDGET - spent,
    headline: name ? `${name} খরচ করেছে ${taka(spent)}` : `আমি খরচ করেছি ${taka(spent)}`,
    list: ordered.map(item => phrase(item.id, countOf(own.cart, item.id))).join(", "),
    line: vanLine(own.cart),
    match,
    levels: groupLevels(own.cart),
    count: bought.length,
  };
}

export { possessive };

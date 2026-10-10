import { possessive } from "../../../shared/bangla";

// Six bowls of one steel tiffin carrier, top to bottom. Percentages only: there is no salary or amount anywhere.
export const MAX_NAME = 20;
export const TOTAL = 100;

/** The fourth bowl can hold one of these; everything else is fixed. Ids are tally keys: only ever append. */
export const flexOptions = [
  { id: "mobile", label: "মোবাইল-নেট" },
  { id: "bills", label: "বিদ্যুৎ-গ্যাস বিল" },
  { id: "study", label: "পড়াশোনা" },
  { id: "medicine", label: "ওষুধপত্র" },
  { id: "hobby", label: "শখ" },
  { id: "dawat", label: "দাওয়াত-উপহার" },
] as const;
export type FlexId = (typeof flexOptions)[number]["id"];

const fixed = {
  rent: "বাসা ভাড়া",
  bazar: "বাজার",
  travel: "যাতায়াত",
  home: "বাড়িতে পাঠানো",
  save: "জমা",
} as const;
type FixedId = keyof typeof fixed;
export type CategoryId = FixedId | FlexId;

export const FLEX_INDEX = 3;
/** জমা is the buffer: other bowls borrow from it first and give back to it. */
export const SAVE_INDEX = 5;

export type Month = { shares: number[]; flex: FlexId; name: string };

export const sample: Month = { shares: [35, 25, 10, 5, 15, 10], flex: "mobile", name: "" };

const numbers = new Intl.NumberFormat("bn-BD");
export const bn = (value: number) => numbers.format(value);

const isFlexId = (id: string): id is FlexId => flexOptions.some(option => option.id === id);
const flexLabel = (id: FlexId) => flexOptions.find(option => option.id === id)!.label;

export function categories(flex: FlexId): CategoryId[] {
  return ["rent", "bazar", "travel", flex, "home", "save"];
}
export const labelOf = (id: CategoryId) => (id in fixed ? fixed[id as FixedId] : flexLabel(id as FlexId));
export const labels = (flex: FlexId) => categories(flex).map(labelOf);

/**
 * Moves `delta` share units into (delta > 0) or out of (delta < 0) the bowls at `pool`, split in proportion to what
 * each already holds, in whole numbers (largest remainder; ties go to the fuller bowl, then the higher one).
 * Taking never empties a bowl below 0; giving to an all-empty pool splits it evenly.
 */
function spread(shares: number[], pool: number[], delta: number) {
  const next = shares.slice();
  const held = pool.reduce((sum, index) => sum + shares[index], 0);
  const amount = delta < 0 ? Math.min(-delta, held) : delta;
  if (!amount || !pool.length) return next;
  const weight = (index: number) => (held ? shares[index] : 1);
  const base = held || pool.length;
  const parts = pool.map(index => ({ index, whole: Math.floor((amount * weight(index)) / base), rest: (amount * weight(index)) % base }));
  let left = amount - parts.reduce((sum, part) => sum + part.whole, 0);
  for (const part of [...parts].sort((a, b) => b.rest - a.rest || shares[b.index] - shares[a.index] || a.index - b.index)) {
    if (!left) break;
    part.whole += 1;
    left -= 1;
  }
  for (const part of parts) next[part.index] += delta < 0 ? -part.whole : part.whole;
  return next;
}

/**
 * The always-100 rule. Set bowl `index` to `value` (rounded, clamped 0–100), then:
 * raising any other bowl takes from জমা first and, once জমা is empty, from the remaining bowls in proportion;
 * lowering it gives the freed share to জমা; moving জমা itself spreads the change over the other five in proportion.
 */
export function setShare(shares: readonly number[], index: number, value: number): number[] {
  const current = shares.slice();
  if (!Number.isFinite(value) || index < 0 || index >= current.length) return current;
  const target = Math.min(TOTAL, Math.max(0, Math.round(value)));
  const delta = target - current[index];
  if (!delta) return current;
  const others = current.map((_, i) => i).filter(i => i !== index);
  let next = current;
  if (index === SAVE_INDEX) next = spread(current, others, -delta);
  else if (delta < 0) next = spread(current, [SAVE_INDEX], -delta);
  else {
    const fromSave = Math.min(delta, current[SAVE_INDEX]);
    next = spread(current, [SAVE_INDEX], -fromSave);
    next = spread(next, others.filter(i => i !== SAVE_INDEX), -(delta - fromSave));
  }
  next[index] = target;
  return next;
}

export function cleanName(name: string) {
  // Strip control and bidi-override characters so a shared link can't scramble the card text.
  return name.normalize("NFC").replace(/[\u0000-\u001f\u007f‪-‮⁦-⁩]/g, "").trim().replace(/\s+/g, " ").slice(0, MAX_NAME).trim();
}

/** `p=35,25,10,5,15,10[&t=study][&n=রাফি]`, without the leading #. */
export function monthHash(month: Month) {
  const params = new URLSearchParams({ p: month.shares.join(",") });
  if (month.flex !== "mobile") params.set("t", month.flex);
  const name = cleanName(month.name);
  if (name) params.set("n", name);
  return params.toString();
}

/** Only an exact six-part split that adds up to 100 opens; anything else is ignored. */
export function parseMonth(hash: string): Month | null {
  const params = new URLSearchParams(hash.replace(/^#/, "").slice(0, 400));
  const raw = params.get("p") ?? "";
  if (!/^\d{1,3}(,\d{1,3}){5}$/.test(raw)) return null;
  const shares = raw.split(",").map(Number);
  if (shares.some(share => share > TOTAL) || shares.reduce((sum, share) => sum + share, 0) !== TOTAL) return null;
  const flex = params.get("t") ?? "";
  return { shares, flex: isFlexId(flex) ? flex : "mobile", name: cleanName(params.get("n") ?? "") };
}

/** The fullest bowl; on a tie, the higher one. */
export function biggest(month: Month) {
  const index = month.shares.indexOf(Math.max(...month.shares));
  return { index, label: labels(month.flex)[index], share: month.shares[index] };
}

export const monthTitle = (name: string) => (name ? `${possessive(name)} মাস` : "আমার মাস");

const flexLines: Record<FlexId, string> = {
  mobile: "এক বাটি যায় মোবাইল আর নেটে, সবার সাথে যোগাযোগে।",
  bills: "আলো-পাখা-চুলার জন্য আলাদা একটা বাটি।",
  study: "একটা বাটি আলাদা করে রাখা পড়াশোনার জন্য।",
  medicine: "একটা বাটি আলাদা থাকে ওষুধপত্রের জন্য।",
  hobby: "শখের জন্যও একটা বাটি আছে।",
  dawat: "দাওয়াত আর উপহারের জন্য আলাদা একটা বাটি।",
};

/** A warm observation about the split. Never advice, never a verdict on how anyone spends. */
export function monthLine(month: Month) {
  const [, , travel, flex, home, save] = month.shares;
  const top = biggest(month);
  if (home >= 25) return "বেতনের একটা বড় বাটি যায় বাড়ির জন্য।";
  if (save >= 20) return "একটা বাটি তুলে রাখা, সামনের দিনের জন্য।";
  if (top.index === 0 && top.share >= 40) return "মাথার ওপরের ছাদটাই সবচেয়ে বড় বাটি।";
  if (top.index === 1 && top.share >= 30) return "সবচেয়ে বড় বাটিটা ভাত-তরকারির।";
  if (travel >= 20) return "মাসের অনেকটা কাটে রাস্তায়, যাওয়া-আসায়।";
  if (flex >= 15) return flexLines[month.flex];
  if (Math.max(...month.shares) <= 25) return "ছয়টা বাটিই প্রায় সমান সমান ভরা।";
  return "ছয় বাটিতে ভাগ করা একটা পুরো মাস।";
}

export function previewTitle(month: Month) {
  const top = biggest(month);
  return `${month.name ? possessive(month.name) : "এক বন্ধুর"} বেতনের সবচেয়ে বড় বাটি ${top.label}, ${bn(top.share)}% — তোমারটা কোনটা?`;
}

export function caption(month: Month) {
  const top = biggest(month);
  return `আমার বেতনের সবচেয়ে বড় বাটি ${top.label} (${bn(top.share)}%)! টাকার অঙ্ক না, শুধু ভাগ। তোমার বেতনের সবচেয়ে বড় বাটি কোনটা?`;
}

export const splitText = (month: Month) => labels(month.flex).map((label, index) => `${label} ${bn(month.shares[index])}%`).join(", ");

// Tally: each share falls in a fixed bucket per category (0, 1–4, 5–9 … 95–100), so only fixed ids are ever counted.
const bucketStarts = [0, 1, ...Array.from({ length: 19 }, (_, i) => (i + 1) * 5)];
const bucketLabel = (start: number) => (start === 0 ? "0" : start === 1 ? "1-4" : start === 95 ? "95-100" : `${start}-${start + 4}`);
const bucketMiddle = (start: number) => (start === 0 ? 0 : start === 1 ? 2.5 : start === 95 ? 97.5 : start + 2);
const bucketStart = (share: number) => (share === 0 ? 0 : share < 5 ? 1 : Math.min(95, Math.floor(share / 5) * 5));
export const bucketId = (category: CategoryId, share: number) => `${category}:${bucketLabel(bucketStart(share))}`;

const allCategories: CategoryId[] = ["rent", "bazar", "travel", ...flexOptions.map(option => option.id), "home", "save"];
export const tallyIds = allCategories.flatMap(category => bucketStarts.map(start => `${category}:${bucketLabel(start)}`));
export const tallyItems = (month: Month) => categories(month.flex).map((category, index) => bucketId(category, month.shares[index]));

/** How many counted this category and their rough average share (bucket middles), or null when nobody has. */
export function crowdAverage(counts: Record<string, number>, category: CategoryId) {
  let people = 0, sum = 0;
  for (const start of bucketStarts) {
    const count = counts[`${category}:${bucketLabel(start)}`] ?? 0;
    people += count;
    sum += count * bucketMiddle(start);
  }
  return people ? { people, average: Math.round(sum / people) } : null;
}

export { possessive };

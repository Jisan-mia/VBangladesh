// Gift-envelope helper. The amounts are our own light, made-up guide for a typical city wedding, not a survey and not a rule.
// Families, regions and pockets differ; the page and the card both say so, and "সামর্থ্য অনুযায়ী" never shows a number.
import { possessive } from "../../../shared/bangla";

export const GUIDE_UPDATED = "অক্টোবর ২০২৬";
export const MAX_NAME_LENGTH = 20;
export const MAX_NUDGE = 3;

const DIGITS = "০১২৩৪৫৬৭৮৯";
export const bn = (value: number | string) => String(value).replace(/\d/g, digit => DIGITS[Number(digit)]);
/** ২,০০০ / ১০,০০০ (Indian grouping, Bangla digits). */
export const taka = (amount: number) => bn(amount.toLocaleString("en-IN"));

/** The one curated ladder every range is cut from; a range is two neighbouring steps. */
export const ladder = [200, 300, 500, 700, 1000, 1500, 2000, 3000, 4000, 5000, 7000, 10000, 15000] as const;

// Share links store these ids: only append, never rename or reorder.
export const relations = [
  { id: "close", label: "কাছের বন্ধু", of: "কাছের বন্ধুর বিয়ে", step: 6, line: "কাছের বন্ধুর বিয়ে। খামের সাথে হলুদের নাচটাও তোমার পাওনা।" },
  { id: "friend", label: "বন্ধু", of: "বন্ধুর বিয়ে", step: 4, line: "বন্ধুর বিয়ে মানে পুরোনো ব্যাচের রিইউনিয়ন। খামের সাথে গ্রুপ ছবিটাও।" },
  { id: "cousin", label: "কাজিন", of: "কাজিনের বিয়ে", step: 6, line: "কাজিনের বিয়েতে খামের চেয়েও বড় দায়িত্ব: জুতা চুরির দলে থাকা।" },
  { id: "colleague", label: "অফিসের কলিগ", of: "কলিগের বিয়ে", step: 4, line: "অফিসের সবাই মিলে চাঁদা তুললে একটা বড় উপহারও হয়ে যায়।" },
  { id: "neighbour", label: "প্রতিবেশী", of: "প্রতিবেশীর বিয়ে", step: 3, line: "পাশের বাসার বিয়ে। খামের সাথে চেয়ার টানার কাজেও হাত লাগাও।" },
  { id: "distant", label: "দূর সম্পর্কের আত্মীয়", of: "দূরের আত্মীয়ের বিয়ে", step: 3, line: "দূর সম্পর্কের আত্মীয়। আগে খুঁজে বের করো, তুমি আসলে কে হও।" },
  { id: "boss", label: "বসের বাড়ি", of: "বসের বাড়ির বিয়ে", step: 5, line: "বসের বাড়ির দাওয়াত। খামটা মাপমতো, হাসিটা আসল।" },
] as const;

export const distances = [
  { id: "near", label: "পাশের পাড়া", step: 0, note: "পাশের পাড়া, রিকশাভাড়াও লাগবে না।" },
  { id: "city", label: "অন্য শহর", step: -1, note: "অন্য শহর থেকে যাওয়া। বাসভাড়াটাও তো উপহার।" },
  { id: "abroad", label: "বিদেশ থেকে", step: 0, note: "বিদেশ থেকে আসছ? তুমি এলেই সবচেয়ে বড় উপহার।" },
] as const;

export const foods = [
  { id: "kacchi", label: "কাচ্চি", step: 1, note: "কাচ্চি থাকলে খামটা একটু ভারী করো। প্লেটের হিসাবও তো আছে।" },
  { id: "roast", label: "রোস্ট-পোলাও", step: 0, note: "রোস্ট-পোলাও আর বোরহানি। খাম মাপমতো, পেট ভরপুর।" },
  { id: "cha", label: "চা-মিষ্টি", step: -2, note: "চা-মিষ্টির ঘরোয়া আয়োজন। ছোট খাম, বড় দোয়া।" },
] as const;

export const modes = [
  { id: "cash", label: "টাকা" },
  { id: "gift", label: "টাকা না, উপহার" },
  { id: "heart", label: "সামর্থ্য অনুযায়ী" },
] as const;

/** Gift ideas by the lower step of the range; no prices are shown, they only roughly match the envelope. */
const giftTiers: ReadonlyArray<{ from: number; ideas: readonly [string, string] }> = [
  { from: 0, ideas: ["একটা ভালো বই আর ফুল", "সুন্দর একটা ফটো ফ্রেম"] },
  { from: 3, ideas: ["চায়ের কাপের সেট", "দেয়ালঘড়ি"] },
  { from: 5, ideas: ["বেডশিটের সেট", "নকশিকাঁথা"] },
  { from: 7, ideas: ["ডিনার সেট", "রাইস কুকার"] },
  { from: 9, ideas: ["তাঁতের শাড়ি বা পাঞ্জাবি", "ব্লেন্ডার"] },
  { from: 11, ideas: ["মাইক্রোওয়েভ ওভেন", "জামদানি শাড়ি"] },
];

export type RelationId = (typeof relations)[number]["id"];
export type DistanceId = (typeof distances)[number]["id"];
export type FoodId = (typeof foods)[number]["id"];
export type ModeId = (typeof modes)[number]["id"];
export type Envelope = { relation: RelationId; distance: DistanceId; food: FoodId; mode: ModeId; nudge: number; name: string };

/** The brief's first screen: a cousin's wedding in another city with kacchi on the menu → ২,০০০–৩,০০০. */
export const sampleEnvelope: Envelope = { relation: "cousin", distance: "city", food: "kacchi", mode: "cash", nudge: 0, name: "" };

export function cleanName(name: string) {
  return name.normalize("NFC").replace(/[\u0000-\u001f\u007f‪-‮⁦-⁩]/g, "").trim().replace(/\s+/g, " ").slice(0, MAX_NAME_LENGTH).trim();
}

const relationOf = (id: RelationId) => relations.find(item => item.id === id)!;
const distanceOf = (id: DistanceId) => distances.find(item => item.id === id)!;
const foodOf = (id: FoodId) => foods.find(item => item.id === id)!;

/** Index of the range's lower step on the ladder. */
export function stepOf({ relation, distance, food, nudge }: Pick<Envelope, "relation" | "distance" | "food" | "nudge">) {
  const raw = relationOf(relation).step + distanceOf(distance).step + foodOf(food).step + nudge;
  return Math.min(ladder.length - 2, Math.max(0, raw));
}

export const canLower = (envelope: Envelope) => envelope.nudge > -MAX_NUDGE && stepOf(envelope) > 0;
export const canRaise = (envelope: Envelope) => envelope.nudge < MAX_NUDGE && stepOf(envelope) < ladder.length - 2;

export type Card = {
  name: string;
  occasion: string;
  mode: ModeId;
  /** "২,০০০–৩,০০০ টাকা"; empty in the no-number modes. */
  range: string;
  low: number;
  high: number;
  /** The big ballpoint line on the envelope. */
  headline: string;
  /** A smaller second line under it. */
  sub: string;
  /** The human line, picked from the relation (or the mode). */
  line: string;
  note: string;
  ideas: readonly [string, string];
};

export function createCard(envelope: Envelope): Card {
  const step = stepOf(envelope);
  const low = ladder[step], high = ladder[step + 1];
  const range = `${taka(low)}–${taka(high)} টাকা`;
  const ideas = [...giftTiers].reverse().find(tier => step >= tier.from)!.ideas;
  const relation = relationOf(envelope.relation);
  const base = { name: cleanName(envelope.name), occasion: relation.of, mode: envelope.mode, ideas, note: foodOf(envelope.food).note };
  if (envelope.mode === "heart") {
    return { ...base, range: "", low: 0, high: 0, headline: "সামর্থ্য অনুযায়ী", sub: "সাথে অনেক দোয়া আর ভালোবাসা", line: "খামে অঙ্ক নেই। হাসিমুখে পৌঁছে যাও, বাকিটা দোয়া।", note: distanceOf(envelope.distance).note };
  }
  const nudged = envelope.nudge > 0 ? `${envelope.mode === "gift" ? "উপহারটা একটু বড়" : "খাম একটু ভারী"} করছ? বর-কনে খুশি, মানিব্যাগ একটু কাঁদবে।` : envelope.nudge < 0 ? "একটু হালকা হলো? ঠিক আছে। হাসিমুখে পৌঁছালেই বর-কনে খুশি।" : "";
  const line = nudged || (envelope.distance === "abroad" ? distanceOf("abroad").note : relation.line);
  if (envelope.mode === "gift") return { ...base, range: "", low, high, headline: ideas[0], sub: `অথবা ${ideas[1]}`, line };
  return { ...base, range, low, high, headline: range, sub: "হালকা আন্দাজ, নিয়ম না", line };
}

export function shareHash({ relation, distance, food, mode, nudge, name }: Envelope) {
  const params = new URLSearchParams({ r: relation, d: distance, f: food });
  if (mode !== "cash") params.set("m", mode);
  if (nudge) params.set("a", String(nudge));
  const shown = cleanName(name);
  if (shown) params.set("n", shown);
  return "#" + params.toString();
}

export function parseShareHash(hash: string): Envelope | null {
  if (hash.length > 300) return null;
  const params = new URLSearchParams(hash.replace(/^#/, ""));
  const relation = relations.find(item => item.id === params.get("r"))?.id;
  const distance = distances.find(item => item.id === params.get("d"))?.id;
  const food = foods.find(item => item.id === params.get("f"))?.id;
  if (!relation || !distance || !food) return null;
  const mode = modes.find(item => item.id === params.get("m"))?.id ?? "cash";
  const a = params.get("a") ?? "0";
  const nudge = /^-?[0-3]$/.test(a) ? Number(a) || 0 : 0;
  return { relation, distance, food, mode, nudge, name: cleanName(params.get("n") ?? "") };
}

/** "রাফির খাম: কাজিনের বিয়েতে ২,০০০–৩,০০০ টাকা" for link previews. */
export function previewTitle(card: Card) {
  const who = card.name ? `${possessive(card.name)} ${card.mode === "gift" ? "উপহার" : "খাম"}` : card.mode === "gift" ? "দাওয়াতের উপহার" : "দাওয়াতের খাম";
  const where = card.occasion.replace(/বিয়ে$/, "বিয়েতে");
  if (card.mode === "heart") return `${who}: ${where} সামর্থ্য অনুযায়ী, ভালোবাসা সহ`;
  if (card.mode === "gift") return `${who}: ${where} ${card.headline}`;
  return `${who}: ${where} ${card.range}`;
}

/** What a friend's shared envelope says in the "your turn" banner. */
export function friendLine(card: Card) {
  const who = card.name || "তোমার বন্ধু";
  const where = card.occasion.replace(/বিয়ে$/, "বিয়েতে");
  if (card.mode === "heart") return `${who} ${where} যাচ্ছে সামর্থ্য অনুযায়ী, ভালোবাসা নিয়ে।`;
  if (card.mode === "gift") return `${who} ${where} দিচ্ছে ${card.headline}।`;
  return `${who} ${where} খামে দিচ্ছে আন্দাজ ${card.range}।`;
}

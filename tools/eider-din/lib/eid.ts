import { possessive } from "../../../shared/bangla";
import { dateLine, dhakaToday, nextDate, occasionById, sources } from "../../koto-din-baki/lib/countdown";

export const MAX_NAME_LENGTH = 30;

const numbers = new Intl.NumberFormat("bn-BD");
export const bn = (value: number) => numbers.format(value);

/** Outfit colours. `bg` is the card background, `ink` the text on it, `deep` the footer band. Ids go into links: append only. */
export const colors = [
  { id: "green", label: "সবুজ", bg: "#1d7a4c", ink: "#fff8e8", deep: "#0f4a2d", hl: "#ffd166" },
  { id: "white", label: "সাদা", bg: "#f3efe4", ink: "#2b2622", deep: "#2b2622", hl: "#b0441a" },
  { id: "red", label: "লাল", bg: "#b4232c", ink: "#fff5ea", deep: "#6e1219", hl: "#ffd166" },
  { id: "blue", label: "নীল", bg: "#21408f", ink: "#f6f7ff", deep: "#12245a", hl: "#ffd166" },
  { id: "sky", label: "আকাশি", bg: "#86c7ea", ink: "#0f2f47", deep: "#0f2f47", hl: "#9a2f0c" },
  { id: "yellow", label: "হলুদ", bg: "#f3c232", ink: "#3a2600", deep: "#5a3a00", hl: "#8a1d0c" },
  { id: "pink", label: "গোলাপি", bg: "#e05b8f", ink: "#fff6fa", deep: "#7d1d45", hl: "#ffe08a" },
  { id: "black", label: "কালো", bg: "#1d1c1f", ink: "#f8f2e6", deep: "#000000", hl: "#ffd166" },
] as const;

/** Parts of the day; each one decorates its own part of the hand (see hand.ts). */
export const chapters = [
  { id: "chandrat", label: "চাঁদরাত", region: "আঙুলের ডগা" },
  { id: "shokal", label: "ঈদের সকাল", region: "হাতের মাঝখানের ফুল" },
  { id: "dupur", label: "দুপুর", region: "আঙুলের নকশা আর কবজি" },
  { id: "bikel", label: "বিকেল-সন্ধ্যা", region: "পাতা আর কলকা" },
] as const;

// Festive things only: no worship is ever scored (no namaz, zakat or fitra ticks), so friends of every faith can play.
// Links store picks as bit positions: once public, only append; never reorder or delete.
export const items = [
  { id: "chand", chapter: "chandrat", label: "চাঁদ দেখা" },
  { id: "mehedi", chapter: "chandrat", label: "হাতে মেহেদি" },
  { id: "shopping", chapter: "chandrat", label: "চাঁদরাতের কেনাকাটা" },
  { id: "lukano", chapter: "chandrat", label: "জামা লুকিয়ে রাখা" },
  { id: "message", chapter: "chandrat", label: "ঈদ মোবারক মেসেজ" },
  { id: "jama", chapter: "shokal", label: "নতুন জামা" },
  { id: "ator", chapter: "shokal", label: "আতর মাখা" },
  { id: "semai", chapter: "shokal", label: "সেমাই" },
  { id: "kolakuli", chapter: "shokal", label: "কোলাকুলি" },
  { id: "salam", chapter: "shokal", label: "বড়দের সালাম" },
  { id: "salami", chapter: "shokal", label: "সালামি পাওয়া" },
  { id: "salami-dewa", chapter: "shokal", label: "সালামি দেওয়া" },
  { id: "polao", chapter: "dupur", label: "পোলাও-কোর্মা" },
  { id: "jorda", chapter: "dupur", label: "ফিরনি-জর্দা" },
  { id: "mehman", chapter: "dupur", label: "বাসায় মেহমান" },
  { id: "ghum", chapter: "dupur", label: "দুপুরের ঘুম" },
  { id: "natok", chapter: "dupur", label: "ঈদের নাটক" },
  { id: "video", chapter: "dupur", label: "ভিডিও কলে ঈদ" },
  { id: "ghoraghuri", chapter: "bikel", label: "ঘোরাঘুরি" },
  { id: "nanabari", chapter: "bikel", label: "নানাবাড়ি-দাদাবাড়ি" },
  { id: "adda", chapter: "bikel", label: "বন্ধুদের আড্ডা" },
  { id: "mela", chapter: "bikel", label: "ঈদের মেলা" },
  { id: "fuchka", chapter: "bikel", label: "ফুচকা-চটপটি" },
  { id: "faka", chapter: "bikel", label: "ফাঁকা শহর" },
  { id: "chhobi", chapter: "bikel", label: "নতুন জামায় ছবি" },
] as const;

export type ColorId = (typeof colors)[number]["id"];
export type ItemId = (typeof items)[number]["id"];
export type Color = (typeof colors)[number];
/** What a link carries. `eid` is like "fitr27"; empty when unknown. */
export type Eid = { color: ColorId; picked: ItemId[]; eid: string; name: string };

export const defaultPicks: ItemId[] = ["jama", "semai", "kolakuli", "salami", "ghoraghuri"];
export const TOTAL = items.length;

const itemIds = new Set<string>(items.map(item => item.id));
export const isItemId = (id: string): id is ItemId => itemIds.has(id);
export const isColorId = (id: string): id is ColorId => colors.some(color => color.id === id);
export const colorById = (id: ColorId): Color => colors.find(color => color.id === id)!;
export const itemLabel = (id: ItemId) => items.find(item => item.id === id)!.label;

export function toggleItem(picked: readonly ItemId[], id: ItemId): ItemId[] {
  return picked.includes(id) ? picked.filter(item => item !== id) : [...picked, id];
}

export function cleanName(name: string) {
  // NFC, and no control or bidi-override characters, so a shared link can't scramble the card text. ZWJ/ZWNJ stay for Bangla shaping.
  const flat = name.normalize("NFC").replace(/[\u0000-\u001f\u007f-\u009f‎‏‪-‮⁦-⁩]/g, " ").replace(/\s+/g, " ").trim();
  return Array.from(flat).slice(0, MAX_NAME_LENGTH).join("").trim();
}

export function encodePicks(picked: readonly ItemId[]) {
  let bits = 0;
  items.forEach((item, index) => { if (picked.includes(item.id)) bits += 2 ** index; });
  return bits.toString(36);
}

export function decodePicks(code: string): ItemId[] {
  // 25 bits fit in 5 base-36 digits; anything longer is not ours.
  if (!/^[0-9a-z]{1,5}$/.test(code)) return [];
  const bits = parseInt(code, 36);
  return items.filter((_, index) => Math.floor(bits / 2 ** index) % 2 === 1).map(item => item.id);
}

// "fitr27" = Eid-ul-Fitr 2027. Only Fitr for now; an Adha pack can add "adha27" later.
const EID = /^fitr(2[6-9]|[3-9]\d)$/;

export function shareHash({ color, picked, eid, name }: Eid) {
  const params = new URLSearchParams({ c: color, i: encodePicks(picked) });
  if (EID.test(eid)) params.set("e", eid);
  const shown = cleanName(name);
  if (shown) params.set("n", shown);
  return "#" + params.toString();
}

/** Reads #c=green&i=…&e=fitr27&n=রাফি; anything without a known colour and at least one pick is null. */
export function parseShareHash(hash: string): Eid | null {
  let params: URLSearchParams;
  try { params = new URLSearchParams(hash.replace(/^#/, "")); } catch { return null; }
  const color = params.get("c") ?? "";
  const picked = decodePicks(params.get("i") ?? "");
  if (!isColorId(color) || !picked.length) return null;
  const eid = params.get("e") ?? "";
  return { color, picked, eid: EID.test(eid) ? eid : "", name: cleanName(params.get("n") ?? "") };
}

/** "ঈদুল ফিতর ২০২৭", or plain "ঈদ" when the link had no year. */
export function eidTitle(eid: string) {
  return EID.test(eid) ? `ঈদুল ফিতর ${(2000 + Number(eid.slice(4))).toLocaleString("bn-BD", { useGrouping: false })}` : "ঈদ";
}

/**
 * The Eid this card is for: the coming Eid-ul-Fitr, still counting the week after it so people can post their day late.
 * Dates come from koto-din-baki's table, so both tools move together. They are projections, shown as "সম্ভাব্য":
 *   https://www.bangladatetoday.com/blog/eid-ul-fitr-2027-date-bangladesh · https://www.officeholidays.com/holidays/bangladesh/eid-al-fitr
 * The National Moon Sighting Committee (Islamic Foundation) fixes the day: https://www.islamicfoundation.gov.bd/
 */
export function currentEid(now: Date) {
  const weekAgo = dhakaToday(new Date(now.getTime() - 7 * 86_400_000));
  const date = nextDate(occasionById("eid-fitr"), weekAgo);
  return date ? { eid: `fitr${date.slice(2, 4)}`, date, when: dateLine(date), source: sources.moon } : null;
}

/** The human line, chosen from what was ticked. First match wins. */
export function eidLine(picked: readonly ItemId[]) {
  const has = (id: ItemId) => picked.includes(id);
  const count = picked.length;
  if (count === 0) return "এখনো একটাও টিক দাওনি।";
  if (count === TOTAL) return "পুরো ২৫! এমন ঈদ বছরে একবারই আসে।";
  if (has("salami") && has("salami-dewa")) return "নিলেও, দিলেও। এটাই বড় হওয়া।";
  if (has("salami-dewa")) return "এবার শুধু দিলাম। বড় হয়ে গেছি, মেনে নিলাম।";
  if (has("video") && !has("kolakuli")) return "দূরে আছি, তবু ভিডিও কলেই ঈদ মোবারক।";
  if (count >= 18) return "চাঁদরাত থেকে সন্ধ্যা, একটুও ফাঁক নেই।";
  if (has("ghum") && count <= 8) return "ঈদের আসল আনন্দ দুপুরের ঘুমে।";
  if (has("nanabari")) return "নানু-দাদুর বাড়ির ঈদ, সবচেয়ে মিষ্টি ঈদ।";
  if (has("lukano")) return "জামাটা লুকিয়ে রাখার মজাই আলাদা।";
  if (has("semai") && has("polao") && has("jorda")) return "পেট ভরা, মন ভরা।";
  if (has("faka")) return "ফাঁকা শহর, ভরা মন।";
  if (count <= 3) return "অল্প কয়টা, কিন্তু ঈদ তো ঈদই।";
  if (count <= 10) return "হাতে মেহেদি, মনে খুশি। ঈদ জমে গেছে।";
  return "সেমাইয়ের মতোই মিষ্টি একটা দিন।";
}

/** "দুজনেরই: সেমাই, দুপুরের ঘুম আর ৩টা" — what two people's Eids share, for the friend overlay. */
export function commonLine(own: Pick<Eid, "color" | "picked">, friend: Eid | null) {
  if (!friend || !own.picked.length) return "";
  const common: string[] = items.filter(item => own.picked.includes(item.id) && friend.picked.includes(item.id)).map(item => item.label);
  if (friend.color === own.color) common.unshift(`${colorById(own.color).label} জামা`);
  if (!common.length) return `${friend.name ? possessive(friend.name) : "বন্ধুর"} সাথে একটাও মেলেনি!`;
  return `দুজনেরই: ${common.slice(0, 2).join(", ")}${common.length > 2 ? ` আর ${bn(common.length - 2)}টা` : ""}`;
}

/** The colour most people wore, once enough people have joined in; null until then. */
export function leadingColor(counts: Record<string, number>, minimum: number): Color | null {
  const ranked = colors.map(color => ({ color, count: counts[color.id] ?? 0 })).sort((a, b) => b.count - a.count);
  const total = ranked.reduce((sum, row) => sum + row.count, 0);
  return total >= minimum && ranked[0].count > ranked[1].count ? ranked[0].color : null;
}

/** Each colour's share of everyone's votes, in percent, for the palette bar. */
export function colorShares(counts: Record<string, number>) {
  const total = colors.reduce((sum, color) => sum + (counts[color.id] ?? 0), 0);
  return colors.map(color => ({ color, percent: total ? Math.round(((counts[color.id] ?? 0) / total) * 100) : 0 }));
}

export function previewTitle(eid: Eid) {
  const who = eid.name ? `${possessive(eid.name)} ঈদে` : "এক বন্ধুর ঈদে";
  return `${who} ২৫-এ ${bn(eid.picked.length)}টা হলো — তোমার কয়টা?`;
}

export { possessive };

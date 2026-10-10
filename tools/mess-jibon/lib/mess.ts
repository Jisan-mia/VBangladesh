import { possessive } from "../../../shared/bangla";

export const MAX_NAME_LENGTH = 24;
export const MAX_HALL_LENGTH = 20;

const numbers = new Intl.NumberFormat("bn-BD", { useGrouping: false });
export const bn = (value: number) => numbers.format(value);
/** "০৭": the serial printed in each box of the meal card. */
export const serial = (value: number) => bn(value).padStart(2, "০");

/** Printed sections of the card. `tag` is the short word printed beside each box number. */
export const sections = [
  { id: "dining", label: "ডাইনিং আর মিল", tag: "মিল" },
  { id: "room", label: "রুম আর রুমমেট", tag: "রুম" },
  { id: "study", label: "পড়া আর পরীক্ষা", tag: "পড়া" },
  { id: "bazar", label: "বাজার আর হিসাব", tag: "বাজার" },
  { id: "adda", label: "আড্ডা আর বাড়ির টান", tag: "আড্ডা" },
] as const;
export type SectionId = (typeof sections)[number]["id"];

// Halls, hostels and private messes, men's and women's alike. No campus politics, no named institutions, no jokes at the staff's expense.
// Links store picks as bit positions: once public, only append; never reorder or delete. `card` is the short label printed on the share card.
export const moments = [
  { id: "dimdal", section: "dining", label: "ডিম-ডাল সপ্তাহ", card: "ডিম-ডাল সপ্তাহ" },
  { id: "buya", section: "dining", label: "বুয়া আসেনি, নিজেরাই রাঁধুনি", card: "বুয়া আসেনি" },
  { id: "feast", section: "dining", label: "মাস শেষে ফিস্টের দিন", card: "ফিস্টের দিন" },
  { id: "patladal", section: "dining", label: "ডাইনিংয়ের পাতলা ডাল", card: "পাতলা ডাল" },
  { id: "miloff", section: "dining", label: "বাড়ি যাওয়ার আগে মিল অফ", card: "মিল অফ" },
  { id: "singara", section: "dining", label: "ক্যান্টিনে চা-সিঙ্গারার নাশতা", card: "চা-সিঙ্গারা" },
  { id: "bhorta", section: "dining", label: "খালার হাতের আলুভর্তা", card: "খালার আলুভর্তা" },
  { id: "torkari", section: "dining", label: "দেরিতে ফিরে দেখি তরকারি শেষ", card: "তরকারি শেষ" },
  { id: "maggi", section: "room", label: "রাত দুটোয় ম্যাগি", card: "ম্যাগি রাত" },
  { id: "prothom", section: "room", label: "প্রথম দিন ব্যাগ হাতে অচেনা রুমে", card: "প্রথম দিনের রুম" },
  { id: "ekkhat", section: "room", label: "কেউ বেড়াতে এলে এক খাটে দুজন", card: "এক খাটে দুজন" },
  { id: "jama", section: "room", label: "রুমমেটের জামা ধার করে দাওয়াতে", card: "ধার করা জামা" },
  { id: "light", section: "room", label: "লাইট নেভানো নিয়ে দর-কষাকষি", card: "লাইট নেভানোর তর্ক" },
  { id: "charger", section: "room", label: "এক চার্জার, পাঁচটা ফোন", card: "এক চার্জার, পাঁচ ফোন" },
  { id: "ketli", section: "room", label: "কেতলিতে ডিম সেদ্ধ", card: "কেতলিতে ডিম" },
  { id: "balti", section: "room", label: "গোসলের লাইনে বালতির সিরিয়াল", card: "বালতির সিরিয়াল" },
  { id: "groupstudy", section: "study", label: "পরীক্ষার আগের রাতে গ্রুপ স্টাডি", card: "গ্রুপ স্টাডি" },
  { id: "photocopy", section: "study", label: "সিনিয়রের নোট ফটোকপি", card: "নোটের ফটোকপি" },
  { id: "bhor", section: "study", label: "পড়তে পড়তে ভোর", card: "পড়তে পড়তে ভোর" },
  { id: "alarm", section: "study", label: "পাঁচ অ্যালার্মেও সকালের ক্লাস মিস", card: "অ্যালার্ম, তবু মিস" },
  { id: "result", section: "study", label: "রেজাল্টের রাতে পুরো রুম জেগে", card: "রেজাল্টের রাত" },
  { id: "reading", section: "study", label: "রিডিং রুমে আগেভাগে চেয়ার রাখা", card: "রিডিং রুমের চেয়ার" },
  { id: "tuition", section: "study", label: "টিউশনি সেরে রাতে ফেরা", card: "টিউশনি সেরে ফেরা" },
  { id: "mombati", section: "study", label: "লোডশেডিংয়ে মোমবাতি জ্বেলে পড়া", card: "মোমবাতিতে পড়া" },
  { id: "manager", section: "bazar", label: "এক মাস বাজার ম্যানেজার", card: "বাজার ম্যানেজার" },
  { id: "milrate", section: "bazar", label: "মাস শেষে মিল রেটের হিসাব", card: "মিল রেটের হিসাব" },
  { id: "pocket", section: "bazar", label: "মাসের শেষ সপ্তাহ, পকেট ফাঁকা", card: "পকেট ফাঁকা সপ্তাহ" },
  { id: "barirtaka", section: "bazar", label: "বাড়ি থেকে টাকা আসার অপেক্ষা", card: "টাকার অপেক্ষা" },
  { id: "dhar", section: "bazar", label: "বন্ধুর কাছে ধার, মাসের শুরুতে শোধ", card: "ধার আর শোধ" },
  { id: "tong", section: "bazar", label: "মোড়ের টং দোকানে বাকির খাতা", card: "টং-এ বাকি" },
  { id: "basa", section: "bazar", label: "ব্যাচেলর বলে বাসা না পাওয়া", card: "ব্যাচেলরের বাসা খোঁজা" },
  { id: "boksish", section: "bazar", label: "ছুটির আগে সবাই মিলে খালাকে বকশিশ", card: "খালার বকশিশ" },
  { id: "achar", section: "adda", label: "বাড়ি থেকে আসা আচারের বয়াম", card: "আচারের বয়াম" },
  { id: "adda", section: "adda", label: "ছাদে বা বারান্দায় মাঝরাতের আড্ডা", card: "মাঝরাতের আড্ডা" },
  { id: "cake", section: "adda", label: "রাত বারোটায় রুমমেটের জন্মদিন", card: "রাত ১২টার কেক" },
  { id: "khela", section: "adda", label: "কমন রুমে সবাই মিলে খেলা দেখা", card: "কমন রুমে খেলা" },
  { id: "ticket", section: "adda", label: "ছুটিতে বাড়ির টিকিট কাটার যুদ্ধ", card: "বাড়ির টিকিট" },
  { id: "faka", section: "adda", label: "ছুটিতে ফাঁকা হল বা মেসে একা", card: "ফাঁকা রুমে একা" },
  { id: "gate", section: "adda", label: "গেট বন্ধের আগে দৌড়ে ফেরা", card: "গেট বন্ধের আগে" },
  { id: "bidai", section: "adda", label: "শেষ দিনে রুম ছাড়তে গিয়ে চোখ ভেজা", card: "রুম ছাড়ার দিন" },
] as const;

export type Moment = (typeof moments)[number];
export type MomentId = Moment["id"];
/** What a link carries. Empty strings mean "not given". */
export type MealCard = { picked: MomentId[]; name: string; hall: string };

export const TOTAL = moments.length;
export const defaultPicks: MomentId[] = ["dimdal", "buya", "maggi", "manager"];

const momentIds = new Set<string>(moments.map(moment => moment.id));
export const isMomentId = (id: string): id is MomentId => momentIds.has(id);
/** 1-based number printed in the moment's box. */
export const momentNumber = (id: MomentId) => moments.findIndex(moment => moment.id === id) + 1;

export function toggleMoment(picked: readonly MomentId[], id: MomentId): MomentId[] {
  return picked.includes(id) ? picked.filter(item => item !== id) : [...picked, id];
}

/** NFC, no control, zero-width or direction-override characters (ZWJ/ZWNJ stay for Bangla shaping), no markup brackets, single spaces, capped by code points. */
export function cleanText(text: string, max: number) {
  const flat = text.normalize("NFC").replace(/[\u0000-\u001f\u007f-\u009f­​‎‏‪-‮⁠-⁩﻿<>]/g, " ").replace(/\s+/g, " ").trim();
  return Array.from(flat).slice(0, max).join("").trim();
}
export const cleanName = (name: string) => cleanText(name, MAX_NAME_LENGTH);
export const cleanHall = (hall: string) => cleanText(hall, MAX_HALL_LENGTH);

// 40 bits: below 2^53, so plain numbers are exact. Bitwise operators would cut at 32 bits, hence the arithmetic.
export function encodePicks(picked: readonly MomentId[]) {
  let bits = 0;
  moments.forEach((moment, index) => { if (picked.includes(moment.id)) bits += 2 ** index; });
  return bits.toString(36);
}

export function decodePicks(code: string): MomentId[] {
  if (!/^[0-9a-z]{1,8}$/.test(code)) return [];
  const bits = parseInt(code, 36);
  if (bits >= 2 ** TOTAL) return [];
  return moments.filter((_, index) => Math.floor(bits / 2 ** index) % 2 === 1).map(moment => moment.id);
}

export function shareHash({ picked, name, hall }: MealCard) {
  const params = new URLSearchParams();
  params.set("m", encodePicks(picked));
  const shownHall = cleanHall(hall);
  if (shownHall) params.set("h", shownHall);
  const shownName = cleanName(name);
  if (shownName) params.set("n", shownName);
  return "#" + params.toString();
}

/** Reads #m=…&h=সবুজ নীড়&n=রাফি; without at least one known moment it is not a card (in-page anchors like #result included). */
export function parseShareHash(hash: string): MealCard | null {
  let params: URLSearchParams;
  try { params = new URLSearchParams(hash.replace(/^#/, "")); } catch { return null; }
  const picked = decodePicks(params.get("m") ?? "");
  if (!picked.length) return null;
  return { picked, name: cleanName(params.get("n") ?? ""), hall: cleanHall(params.get("h") ?? "") };
}

/** Titles earned by how many boxes are punched. */
export const tiers = [
  { from: 0, title: "নতুন বোর্ডার" },
  { from: 9, title: "চেনা মুখ" },
  { from: 18, title: "পাকা বোর্ডার" },
  { from: 27, title: "সিনিয়র বোর্ডার" },
  { from: 36, title: "মেসের মুরুব্বি" },
] as const;
export const tierFor = (count: number) => [...tiers].reverse().find(tier => count >= tier.from)!.title;

/** The human line, chosen from what was punched. First match wins. */
export function messLine(picked: readonly MomentId[]) {
  const has = (id: MomentId) => picked.includes(id);
  const count = picked.length;
  if (count === 0) return "মিল কার্ড এখনো আস্ত, একটাও ফুটো পড়েনি।";
  if (count === TOTAL) return "পুরো ৪০! এই কার্ডে আর ফুটো করার জায়গা নেই।";
  if (has("prothom") && has("bidai")) return "যে রুম প্রথম দিন অচেনা ছিল, ছাড়ার দিন সেখানেই চোখ ভিজল।";
  if (has("achar")) return "বাড়ির আচারের বয়াম খুলতেই পুরো ফ্লোর হাজির।";
  if (has("bhorta")) return "খালার হাতের আলুভর্তা, বাড়ির পরে সবচেয়ে কাছের স্বাদ।";
  if (has("faka")) return "ছুটিতে ফাঁকা রুমটা বড্ড বেশি চুপচাপ লাগে।";
  if (has("cake")) return "রাত বারোটার কেক, মুখে ক্রিম, আর হাসির শব্দে পুরো ফ্লোর জাগা।";
  if (has("mombati")) return "কারেন্ট গেছে তো কী, মোমবাতি তো ছিল।";
  if (has("groupstudy")) return "পরীক্ষার আগের রাতের গ্রুপ স্টাডি: অর্ধেক পড়া, অর্ধেক আড্ডা।";
  if (has("maggi")) return "রাত দুটোর ম্যাগির চেয়ে দামি ডিনার আর হয় না।";
  if (has("manager")) return "বাজার ম্যানেজার হলে বোঝা যায়, এক হালি ডিমেরও হিসাব আছে।";
  if (has("buya")) return "বুয়া আসেনি যেদিন, সেদিন সবাই রাঁধুনি।";
  if (has("dimdal")) return "ডিম-ডাল সপ্তাহেও প্লেট খালি হতো হাসিমুখে।";
  if (count >= 30) return "কার্ডভরা ফুটো, মনভরা মেসের গল্প।";
  if (count <= 3) return "অল্প কয়টা ফুটো, প্রত্যেকটায় একটা গল্প।";
  return "হল-মেসের দিনগুলো ফেরে না, গল্পগুলো থেকে যায়।";
}

/** "দুজনেরই: ম্যাগি রাত, বুয়া আসেনি আর ৩টা" — what two cards share, for a roommate's overlay. */
export function commonLine(picked: readonly MomentId[], friend: MealCard | null) {
  if (!friend || !picked.length) return "";
  const common = moments.filter(moment => picked.includes(moment.id) && friend.picked.includes(moment.id)).map(moment => moment.card);
  if (!common.length) return `${friend.name ? possessive(friend.name) : "বন্ধুর"} সাথে একটাও মেলেনি!`;
  return `দুজনেরই: ${common.slice(0, 2).join(", ")}${common.length > 2 ? ` আর ${bn(common.length - 2)}টা` : ""}`;
}

/** "রাফির মেস সার্টিফিকেট", or "আমার …" without a name. */
export const certificateTitle = (name: string) => `${cleanName(name) ? possessive(cleanName(name)) : "আমার"} মেস সার্টিফিকেট`;

// The hall or mess name stays on the card and in the link only; it never goes into the public preview title.
export function previewTitle(card: MealCard) {
  const who = card.name ? possessive(card.name) : "এক বন্ধুর";
  return `${who} মিল কার্ডে হল-মেস জীবনের ${bn(card.picked.length)}টা ফুটো — তোমার কয়টা?`;
}

/** Share of everyone who punched this moment, in whole percent. */
export const percentOf = (count: number, total: number) => Math.round((count / Math.max(total, 1)) * 100);

export { possessive };

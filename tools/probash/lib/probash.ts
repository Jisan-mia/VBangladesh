import { possessive } from "../../../shared/bangla";

export const MAX_NAME_LENGTH = 24;
export const MAX_CITY_LENGTH = 20;

const numbers = new Intl.NumberFormat("bn-BD");
export const bn = (value: number) => numbers.format(value);

/** Why someone lives abroad. Optional; it only moves that pack's page to the front and labels the card. Ids go into links: append only. */
export const packs = [
  { id: "worker", chip: "কাজে", card: "কাজের সূত্রে প্রবাসে" },
  { id: "student", chip: "পড়াশোনায়", card: "পড়াশোনার জন্য প্রবাসে" },
  { id: "family", chip: "পরিবারসহ", card: "পরিবার নিয়ে প্রবাসে" },
] as const;
export type PackId = (typeof packs)[number]["id"];

/** Passport pages. The last three belong to a pack and move to the front when that pack is picked. `stamp` is the invented word at the top of each stamp. */
export const chapters = [
  { id: "leave", label: "যাওয়ার দিন", stamp: "বিদায়" },
  { id: "arrive", label: "নতুন দেশে", stamp: "আগমন" },
  { id: "home", label: "দূর থেকে বাড়ি", stamp: "বাড়ি" },
  { id: "festival", label: "উৎসব দূরে", stamp: "উৎসব" },
  { id: "together", label: "প্রবাসে আমরা", stamp: "আমরা" },
  { id: "return", label: "দেশে ফেরা", stamp: "ফেরা" },
  { id: "worker", label: "কাজের সূত্রে", stamp: "কাজ" },
  { id: "student", label: "পড়াশোনায়", stamp: "পড়া" },
  { id: "family", label: "পরিবার নিয়ে", stamp: "পরিবার" },
] as const;
export type ChapterId = (typeof chapters)[number]["id"];

// Shared experiences only: no visa, legal status, debt, hardship or money amounts. Faith moments are things that happen, never worship to score.
// Links store picks as bit positions: once public, only append; never reorder or delete. `card` is the short label printed on the stamp.
export const moments = [
  { id: "airport", chapter: "leave", label: "এয়ারপোর্টে কান্না", card: "এয়ারপোর্টে কান্না" },
  { id: "shutki", chapter: "leave", label: "লাগেজে শুঁটকি", card: "লাগেজে শুঁটকি" },
  { id: "achar", chapter: "leave", label: "মায়ের দেওয়া আচারের বয়াম", card: "আচারের বয়াম" },
  { id: "plane", chapter: "leave", label: "জীবনের প্রথম প্লেন", card: "প্রথম প্লেন" },
  { id: "raat", chapter: "leave", label: "যাওয়ার আগের রাতে কেউ ঘুমায়নি", card: "নির্ঘুম শেষ রাত" },
  { id: "sim", chapter: "arrive", label: "দেশের সিম বন্ধ", card: "দেশের সিম বন্ধ" },
  { id: "taka", chapter: "arrive", label: "দাম দেখে মনে মনে টাকায় হিসাব", card: "মনে মনে টাকায় হিসাব" },
  { id: "ishara", chapter: "arrive", label: "ভাষা না বুঝে ইশারায় কথা", card: "ইশারায় কথা" },
  { id: "bhat", chapter: "arrive", label: "প্রথমবার নিজে ভাত রান্না", card: "নিজে ভাত রান্না" },
  { id: "dokan", chapter: "arrive", label: "প্রথম বাঙালি দোকান খুঁজে পাওয়া", card: "বাঙালি দোকান" },
  { id: "ranna", chapter: "home", label: "মায়ের রান্না মিস", card: "মায়ের রান্না মিস" },
  { id: "kheyechhis", chapter: "home", label: "কল ধরলেই ‘খেয়েছিস?’", card: "‘খেয়েছিস?’" },
  { id: "somoy", chapter: "home", label: "দেশের সময় মিলিয়ে কল", card: "সময় মিলিয়ে কল" },
  { id: "biye", chapter: "home", label: "ভাইবোনের বিয়ে ভিডিও কলে দেখা", card: "বিয়ে ভিডিও কলে" },
  { id: "khela", chapter: "home", label: "রাত জেগে দেশের খেলা দেখা", card: "রাত জেগে খেলা" },
  { id: "video-eid", chapter: "festival", label: "ভিডিও কলে ঈদ", card: "ভিডিও কলে ঈদ" },
  { id: "iftar", chapter: "festival", label: "একা ইফতার", card: "একা ইফতার" },
  { id: "jamat", chapter: "festival", label: "বিদেশে ঈদের জামাত খোঁজা", card: "ঈদের জামাত খোঁজা" },
  { id: "puja", chapter: "festival", label: "দূর দেশে পূজার মণ্ডপ খোঁজা", card: "পূজার মণ্ডপ খোঁজা" },
  { id: "minar", chapter: "festival", label: "বিদেশের শহীদ মিনারে ফুল", card: "শহীদ মিনারে ফুল" },
  { id: "bangla", chapter: "together", label: "রাস্তায় বাংলা শুনে ঘুরে তাকানো", card: "বাংলা শুনে ফেরা" },
  { id: "adda", chapter: "together", label: "ছুটির দিনে দেশি আড্ডা", card: "দেশি আড্ডা" },
  { id: "lal-sobuj", chapter: "together", label: "বিদেশে লাল-সবুজ দেখে বুক ভরে যাওয়া", card: "লাল-সবুজে গর্ব" },
  { id: "boishakh", chapter: "together", label: "প্রবাসে বৈশাখী মেলা", card: "বৈশাখী মেলা" },
  { id: "gona", chapter: "return", label: "দেশে ফেরার দিন গোনা", card: "দিন গোনা" },
  { id: "gift", chapter: "return", label: "সবার উপহারে লাগেজ ভরা", card: "উপহারের লাগেজ" },
  { id: "gondho", chapter: "return", label: "দেশে নেমেই সেই চেনা গন্ধ", card: "চেনা গন্ধ" },
  { id: "bidai", chapter: "return", label: "ছুটি ফুরিয়ে আবার বিদায়", card: "আবার বিদায়" },
  { id: "duty", chapter: "worker", label: "ডিউটি শেষে বাড়িতে কল", card: "ডিউটি শেষে কল" },
  { id: "roommate", chapter: "worker", label: "রুমমেটরাই এখন পরিবার", card: "রুমমেটরাই পরিবার" },
  { id: "rumer-ranna", chapter: "worker", label: "রুমে সবার জন্য রান্না", card: "সবার জন্য রান্না" },
  { id: "upohar", chapter: "worker", label: "প্রথম বেতনে মায়ের জন্য উপহার", card: "প্রথম বেতনে উপহার" },
  { id: "nam", chapter: "student", label: "ক্লাসে নিজের নামের ভুল উচ্চারণ", card: "নামের ভুল উচ্চারণ" },
  { id: "cooker", chapter: "student", label: "সিনিয়রের দেওয়া পুরনো রাইস কুকার", card: "পুরনো রাইস কুকার" },
  { id: "noodles", chapter: "student", label: "পরীক্ষার রাতে নুডলস", card: "পরীক্ষার রাতে নুডলস" },
  { id: "parttime", chapter: "student", label: "ক্লাস, পার্ট-টাইম আর রাত জেগে পড়া", card: "ক্লাস আর পার্ট-টাইম" },
  { id: "tan", chapter: "family", label: "বাচ্চার বাংলায় বিদেশি টান", card: "বাংলায় বিদেশি টান" },
  { id: "oa", chapter: "family", label: "ঘরে বাচ্চাকে অ আ শেখানো", card: "ঘরে অ আ" },
  { id: "nanu", chapter: "family", label: "বাচ্চার সাথে নানু-দাদুর ভিডিও কল", card: "নানু-দাদুর কল" },
  { id: "tiffin", chapter: "family", label: "টিফিনে ভাত না স্যান্ডউইচ?", card: "ভাত না স্যান্ডউইচ" },
] as const;

export type Moment = (typeof moments)[number];
export type MomentId = Moment["id"];
/** What a link carries. Empty strings mean "not given". */
export type Passport = { picked: MomentId[]; pack: PackId | ""; city: string; name: string };

export const TOTAL = moments.length;
export const defaultPicks: MomentId[] = ["video-eid", "shutki", "sim", "ranna"];

const momentIds = new Set<string>(moments.map(moment => moment.id));
export const isMomentId = (id: string): id is MomentId => momentIds.has(id);
export const isPackId = (id: string): id is PackId => packs.some(pack => pack.id === id);
export const packById = (id: PackId) => packs.find(pack => pack.id === id)!;
export const chapterById = (id: ChapterId) => chapters.find(chapter => chapter.id === id)!;

/** Pages in the order shown: the picked pack's page first, everything else as listed. */
export function pageOrder(pack: PackId | "") {
  return pack ? [...chapters.filter(chapter => chapter.id === pack), ...chapters.filter(chapter => chapter.id !== pack)] : [...chapters];
}

export function toggleMoment(picked: readonly MomentId[], id: MomentId): MomentId[] {
  return picked.includes(id) ? picked.filter(item => item !== id) : [...picked, id];
}

/** NFC, no control, zero-width or direction-override characters (ZWJ/ZWNJ stay for Bangla shaping), single spaces, capped by code points. */
export function cleanText(text: string, max: number) {
  const flat = text.normalize("NFC").replace(/[\u0000-\u001f\u007f-\u009f­​‎‏‪-‮⁠-⁩﻿]/g, " ").replace(/\s+/g, " ").trim();
  return Array.from(flat).slice(0, max).join("").trim();
}
export const cleanName = (name: string) => cleanText(name, MAX_NAME_LENGTH);
export const cleanCity = (city: string) => cleanText(city, MAX_CITY_LENGTH);

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

export function shareHash({ picked, pack, city, name }: Passport) {
  const params = new URLSearchParams();
  if (pack) params.set("p", pack);
  params.set("m", encodePicks(picked));
  const shownCity = cleanCity(city);
  if (shownCity) params.set("c", shownCity);
  const shownName = cleanName(name);
  if (shownName) params.set("n", shownName);
  return "#" + params.toString();
}

/** Reads #p=worker&m=…&c=রিয়াদ&n=রাফি; without at least one known moment it is not a passport (in-page anchors like #result included). */
export function parseShareHash(hash: string): Passport | null {
  let params: URLSearchParams;
  try { params = new URLSearchParams(hash.replace(/^#/, "")); } catch { return null; }
  const picked = decodePicks(params.get("m") ?? "");
  if (!picked.length) return null;
  const pack = params.get("p") ?? "";
  return { picked, pack: isPackId(pack) ? pack : "", city: cleanCity(params.get("c") ?? ""), name: cleanName(params.get("n") ?? "") };
}

/** The human line, chosen from what was stamped. First match wins. */
export function passportLine(picked: readonly MomentId[]) {
  const has = (id: MomentId) => picked.includes(id);
  const count = picked.length;
  if (count === 0) return "পাসপোর্টের পাতা এখনো ফাঁকা।";
  if (count === TOTAL) return "পুরো ৪০! এই পাসপোর্টে আর সিলের জায়গা নেই।";
  if (has("iftar")) return "একা ইফতার, তবু প্লেটে দেশের পেঁয়াজু।";
  if (has("oa")) return "দূর দেশের ঘরে অ আ, এভাবেই বাংলা বাঁচে।";
  if (has("roommate")) return "রক্তের সম্পর্ক না, তবু রুমমেটরাই এখন পরিবার।";
  if (has("cooker")) return "সিনিয়রের পুরনো রাইস কুকারে আজও ভাত ফোটে।";
  if (has("biye")) return "বিয়েটা দেখেছি ফোনের পর্দায়, দোয়া পাঠিয়েছি মন থেকে।";
  if (has("minar")) return "দূর দেশেও একুশের ভোরে হাতে ফুল।";
  if (has("airport") && has("bidai")) return "যতবার বিদায়, ততবার চোখ ভেজে।";
  if (has("gondho")) return "প্লেনের দরজা খুলতেই সেই চেনা গন্ধ।";
  if (has("bangla")) return "অচেনা রাস্তায় বাংলা শুনলেই মনে হয় বাড়ি।";
  if (has("lal-sobuj")) return "যেখানেই থাকি, লাল-সবুজ দেখলে বুকটা ভরে যায়।";
  if (has("ranna")) return "মায়ের রান্নার স্বাদ কোনো দোকানে মেলে না।";
  if (has("khela")) return "দেশের খেলা মানে বিদেশে রাত জাগা।";
  if (count >= 30) return "পাতাভরা সিল, বুকভরা দেশ।";
  if (count <= 3) return "অল্প কয়টা সিল, প্রত্যেকটায় একটা গল্প।";
  return "দূরে আছি, তবু মনটা পড়ে থাকে দেশে।";
}

/** "দুজনেরই: এয়ারপোর্টে কান্না, একা ইফতার আর ৩টা" — what two passports share, for the friend overlay. */
export function commonLine(picked: readonly MomentId[], friend: Passport | null) {
  if (!friend || !picked.length) return "";
  const common = moments.filter(moment => picked.includes(moment.id) && friend.picked.includes(moment.id)).map(moment => moment.card);
  if (!common.length) return `${friend.name ? possessive(friend.name) : "বন্ধুর"} সাথে একটাও মেলেনি!`;
  return `দুজনেরই: ${common.slice(0, 2).join(", ")}${common.length > 2 ? ` আর ${bn(common.length - 2)}টা` : ""}`;
}

/** "রাফি · রিয়াদ · ৪০-এ ২৭" without the count, which the card colours separately. */
export function whoLine({ name, city }: Pick<Passport, "name" | "city">) {
  return [cleanName(name), cleanCity(city)].filter(Boolean).join(" · ");
}

export function previewTitle(passport: Passport) {
  const who = passport.name ? possessive(passport.name) : "এক বন্ধুর";
  return `${who} পাসপোর্টে প্রবাস জীবনের ${bn(passport.picked.length)}টা সিল — তোমার কয়টা?`;
}

/** Share of everyone who stamped this moment, in whole percent. */
export const percentOf = (count: number, total: number) => Math.round((count / Math.max(total, 1)) * 100);

export { possessive };

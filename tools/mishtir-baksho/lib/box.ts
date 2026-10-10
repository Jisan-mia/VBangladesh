import { possessive } from "../../../shared/bangla";

export const MAX_NAME_LENGTH = 30;

export const groups = [
  { id: "rosh", label: "রসের মিষ্টি" },
  { id: "sondesh", label: "সন্দেশ আর শুকনো মিষ্টি" },
  { id: "doi", label: "দই আর দুধের মিষ্টি" },
  { id: "aro", label: "আরও: মেলা, মিলাদ আর বাড়ির" },
] as const;

/*
 * Where a sweet is known from ("যেখানকার বলে পরিচিত") and whether it is a registered Bangladesh GI (DPDT register).
 * GI list as of the Industries Minister's reply in parliament, 2 Sep 2026 (64 GI products):
 *   https://www.tbsnews.net/bangladesh/bangladesh-now-has-64-gi-products-industries-minister-1531481
 * Individual registrations:
 *   বগুড়ার দই (2023): https://www.tbsnews.net/node/660610
 *   নাটোরের কাঁচাগোল্লা (2023): https://www.thedailystar.net/business/economy/commodities/news/natores-kancha-golla-gets-gi-recognition-3390956
 *   টাঙ্গাইলের পোড়াবাড়ির চমচম, কুমিল্লার রসমালাই, কুষ্টিয়ার তিলের খাজা (Jan 2024): https://www.prothomalo.com/bangladesh/aad1ilork6
 *   মুক্তাগাছার মণ্ডা, গোপালগঞ্জের রসগোল্লা (GI by Aug 2024): https://www.prothomalo.com/opinion/column/8e7gb82xac
 *   ব্রাহ্মণবাড়িয়ার ছানামুখী: https://www.prothomalo.com/bangladesh/district/eyzasb3tjs
 *   শেরপুরের ছানার পায়েস (Dec 2024): https://www.prothomalo.com/bangladesh/district/je9sm04nqz
 *   জামুর্কীর সন্দেশ, মুন্সীগঞ্জের পাতক্ষীর (2025): https://bangla.thedailystar.net/news/bangladesh/news-670026
 *   নেত্রকোনার বালিশ মিষ্টি (Sep 2025): https://www.dhakatribune.com/bangladesh/nation/392855/netrokona-s-balish-mishti-earns-gi-tag
 *   মেহেরপুরের সাবিত্রী, ভোলার মহিষের দই: listed in the 2 Sep 2026 TBS report above.
 * Known-from places without GI (গৌরনদীর দই, গাইবান্ধার রসমঞ্জরী, মহাস্থানগড়ের কটকটি) follow the PKSF list of traditional
 * dairy sweets in the Prothom Alo column above. Contested origins (প্যারা সন্দেশ: নওগাঁ, সরিষাবাড়ী, ফরিদপুর) get no place.
 */
// Share links store picks as bit positions: once links are public, only append new sweets; never reorder or delete.
export const sweets = [
  { id: "roshogolla", group: "rosh", label: "রসগোল্লা" },
  { id: "kalojam", group: "rosh", label: "কালোজাম" },
  { id: "chomchom", group: "rosh", label: "পোড়াবাড়ির চমচম", place: "টাঙ্গাইল", known: "টাঙ্গাইলের পোড়াবাড়ির চমচম", gi: true },
  { id: "balish", group: "rosh", label: "বালিশ মিষ্টি", place: "নেত্রকোনা", known: "নেত্রকোনার বালিশ মিষ্টি", gi: true },
  { id: "lalmohon", group: "rosh", label: "লালমোহন" },
  { id: "pantua", group: "rosh", label: "পান্তুয়া" },
  { id: "rajbhog", group: "rosh", label: "রাজভোগ" },
  { id: "langcha", group: "rosh", label: "ল্যাংচা" },
  { id: "golapjam", group: "rosh", label: "গোলাপজাম" },
  { id: "chhanar-jilapi", group: "rosh", label: "ছানার জিলাপি" },
  { id: "kamalabhog", group: "rosh", label: "কমলাভোগ" },
  { id: "kachagolla", group: "sondesh", label: "কাঁচাগোল্লা", place: "নাটোর", known: "নাটোরের কাঁচাগোল্লা", gi: true },
  { id: "monda", group: "sondesh", label: "মণ্ডা", place: "মুক্তাগাছা, ময়মনসিংহ", known: "মুক্তাগাছার মণ্ডা", gi: true },
  { id: "chhanamukhi", group: "sondesh", label: "ছানামুখী", place: "ব্রাহ্মণবাড়িয়া", known: "ব্রাহ্মণবাড়িয়ার ছানামুখী", gi: true },
  { id: "jamurki", group: "sondesh", label: "জামুর্কীর সন্দেশ", place: "মির্জাপুর, টাঙ্গাইল", known: "মির্জাপুরের জামুর্কীর সন্দেশ", gi: true },
  { id: "sabitri", group: "sondesh", label: "সাবিত্রী", place: "মেহেরপুর", known: "মেহেরপুরের সাবিত্রী", gi: true },
  { id: "pera", group: "sondesh", label: "প্যারা সন্দেশ" },
  { id: "gurer-sondesh", group: "sondesh", label: "খেজুর গুড়ের সন্দেশ" },
  { id: "roshkodom", group: "sondesh", label: "রসকদম" },
  { id: "laddu", group: "sondesh", label: "মতিচুরের লাড্ডু" },
  { id: "bundia", group: "sondesh", label: "বুন্দিয়া" },
  { id: "mishti-doi", group: "doi", label: "মিষ্টি দই" },
  { id: "bogura-doi", group: "doi", label: "বগুড়ার দই", place: "বগুড়া", known: "বগুড়ার দই", gi: true },
  { id: "bhola-doi", group: "doi", label: "মহিষের দই", place: "ভোলা", known: "ভোলার মহিষের দই", gi: true },
  { id: "gournadi-doi", group: "doi", label: "গৌরনদীর দই", place: "গৌরনদী, বরিশাল", known: "বরিশালের গৌরনদীর দই" },
  { id: "tok-doi", group: "doi", label: "টক দই" },
  { id: "roshmalai", group: "doi", label: "রসমালাই", place: "কুমিল্লা", known: "কুমিল্লার রসমালাই", gi: true },
  { id: "chhanar-payesh", group: "doi", label: "ছানার পায়েস", place: "শেরপুর", known: "শেরপুরের ছানার পায়েস", gi: true },
  { id: "patkshir", group: "doi", label: "পাতক্ষীর", place: "মুন্সীগঞ্জ", known: "মুন্সীগঞ্জের পাতক্ষীর", gi: true },
  { id: "roshmonjori", group: "doi", label: "রসমঞ্জরী", place: "গাইবান্ধা", known: "গাইবান্ধার রসমঞ্জরী" },
  { id: "malaikari", group: "doi", label: "মালাইকারি" },
  { id: "jilapi", group: "aro", label: "জিলাপি" },
  { id: "amriti", group: "aro", label: "আমিত্তি" },
  { id: "tiler-khaja", group: "aro", label: "তিলের খাজা", place: "কুষ্টিয়া", known: "কুষ্টিয়ার তিলের খাজা", gi: true },
  { id: "kotkoti", group: "aro", label: "কটকটি", place: "মহাস্থানগড়, বগুড়া", known: "মহাস্থানগড়ের কটকটি" },
  { id: "batasha", group: "aro", label: "বাতাসা" },
  { id: "sonpapri", group: "aro", label: "সন পাপড়ি" },
  { id: "narkel-naru", group: "aro", label: "নারকেলের নাড়ু" },
  { id: "malpoa", group: "aro", label: "মালপোয়া" },
  { id: "hawai-mithai", group: "aro", label: "হাওয়াই মিঠাই" },
] as const satisfies ReadonlyArray<{ id: string; group: (typeof groups)[number]["id"]; label: string; place?: string; known?: string; gi?: boolean }>;

export type Sweet = (typeof sweets)[number];
export type SweetId = Sweet["id"];
export type Shared = { selected: SweetId[]; name: string };

/** The near-universal three: the box never opens empty. */
export const starters: SweetId[] = ["roshogolla", "kalojam", "mishti-doi"];

const numbers = new Intl.NumberFormat("bn-BD");
export const bn = (value: number) => numbers.format(value);
export const total = sweets.length;

const ids = new Set<string>(sweets.map(sweet => sweet.id));
const isSweetId = (id: string): id is SweetId => ids.has(id);
export const sweetById = (id: SweetId) => sweets.find(sweet => sweet.id === id)!;
export const placeOf = (sweet: Sweet) => "place" in sweet ? sweet.place : "";
export const knownName = (sweet: Sweet) => "known" in sweet ? sweet.known : sweet.label;
export const isGi = (sweet: Sweet) => "gi" in sweet && sweet.gi;
const doiIds = sweets.filter(sweet => sweet.group === "doi" && sweet.label.includes("দই")).map(sweet => sweet.id);
export const giCount = sweets.filter(isGi).length;

export function toggleSweet(selected: readonly SweetId[], id: string): SweetId[] {
  if (!isSweetId(id)) throw new RangeError("এই মিষ্টিটা তালিকায় নেই।");
  return selected.includes(id) ? selected.filter(item => item !== id) : [...selected, id];
}

export function cleanName(name: string) {
  // Strip control and bidi-override characters so a shared link can't scramble the lid text.
  return name.normalize("NFC").replace(/[\u0000-\u001f\u007f‪-‮⁦-⁩]/g, "").trim().replace(/\s+/g, " ").slice(0, MAX_NAME_LENGTH);
}

export function encodeSelection(selected: readonly SweetId[]) {
  let bits = 0n;
  sweets.forEach((sweet, index) => { if (selected.includes(sweet.id)) bits |= 1n << BigInt(index); });
  return bits.toString(36);
}

export function decodeSelection(code: string): SweetId[] {
  // 40 bits fit in 8 base-36 digits; anything longer is not ours.
  if (!/^[0-9a-z]{1,8}$/.test(code)) return [];
  const bits = BigInt(parseInt(code, 36));
  return sweets.filter((_, index) => (bits >> BigInt(index)) & 1n).map(sweet => sweet.id);
}

export function shareHash({ selected, name }: Shared) {
  const params = new URLSearchParams({ s: encodeSelection(selected) });
  const shownName = cleanName(name);
  if (shownName) params.set("n", shownName);
  return "#" + params.toString();
}

export function parseShareHash(hash: string): Shared | null {
  const params = new URLSearchParams(hash.replace(/^#/, ""));
  const selected = decodeSelection(params.get("s") ?? "");
  if (!selected.length) return null;
  return { selected, name: cleanName(params.get("n") ?? "") };
}

export function tier(count: number) {
  if (count <= 10) return "মিষ্টিমুখ শুরু";
  if (count <= 20) return "রসিক";
  if (count <= 30) return "মিষ্টি-পর্যটক";
  return "ময়রার প্রিয় খদ্দের";
}

/** One warm line chosen from what is actually in the box. */
export function boxLine(selected: readonly SweetId[]) {
  const has = (id: SweetId) => selected.includes(id);
  const count = selected.length;
  const gi = selected.filter(id => isGi(sweetById(id))).length;
  if (count === total) return "দেশের সব নামকরা মিষ্টি এক বাক্সে — ময়রারা নাম ধরে ডাকে!";
  if (count < 10) return "বাক্সে এখনো অনেক জায়গা — চলো, মিষ্টির দোকানে!";
  if (doiIds.every(has)) return "দই ছাড়া দাওয়াত অসম্পূর্ণ।";
  if (gi >= 10) return `জিআই পাওয়া ${bn(giCount)}টা মিষ্টির ${bn(gi)}টাই চেখে দেখা হয়ে গেছে!`;
  if (has("chomchom")) return "টাঙ্গাইলের চমচম একবার খেলে ভোলা যায় না।";
  if (has("kachagolla")) return "নাটোরের কাঁচাগোল্লা: গোল না, তবু নাম গোল্লা!";
  if (has("balish")) return "একটা বালিশ মিষ্টিতেই পেট ভরে, তবু মন ভরে না।";
  if (has("hawai-mithai") && has("batasha")) return "মেলার মিষ্টির স্বাদ এখনো মুখে লেগে আছে।";
  if (count <= 20) return "মিষ্টির দোকানে ঢুকলে চোখ আগে চেনা মুখগুলো খোঁজে।";
  if (count <= 30) return "যেখানে যাই, সেখানকার মিষ্টিটা চেখে আসি।";
  return "দোকানে ঢুকলেই ময়রা বাক্স খুলে বসেন।";
}

export type CardContent = {
  lid: string;
  count: number;
  tier: string;
  line: string;
  names: string;
  match: string;
  /** In list order, so the same picks always fill the box the same way. */
  picked: SweetId[];
};

export function createCard(own: Shared, friend?: Shared | null): CardContent {
  const picked = sweets.filter(sweet => own.selected.includes(sweet.id)).map(sweet => sweet.id);
  const name = cleanName(own.name);
  let match = "";
  if (friend && picked.length) {
    const common = friend.selected.filter(id => picked.includes(id)).length;
    const who = friend.name ? possessive(friend.name) : "বন্ধুর";
    const diff = friend.selected.length - picked.length;
    match = `দুজনের মিল ${bn(common)}টা — ` + (diff > 0 ? `${who} বাক্সে ${bn(diff)}টা বেশি` : diff < 0 ? `আমার বাক্সে ${bn(-diff)}টা বেশি` : "বাক্স সমান সমান");
  }
  // Place-known sweets read best on a card ("নাটোরের কাঁচাগোল্লা"), so they lead the list.
  const ordered = [...picked].sort((a, b) => Number("known" in sweetById(b)) - Number("known" in sweetById(a)));
  return {
    lid: `${name ? possessive(name) : "আমার"} মিষ্টির বাক্স`,
    count: picked.length,
    tier: tier(picked.length),
    line: boxLine(picked),
    names: ordered.map(id => knownName(sweetById(id))).join(" · "),
    match,
    picked,
  };
}

export { possessive };

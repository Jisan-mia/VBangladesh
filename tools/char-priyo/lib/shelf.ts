import { possessive } from "../../../shared/bangla";

export const MAX_TITLE_LENGTH = 30;
export const MAX_NAME_LENGTH = 30;
export const SLOTS = 4;

const numbers = new Intl.NumberFormat("bn-BD");
export const bn = (value: number) => numbers.format(value);

export type Item = { title: string; by: string; tag?: "eid" | "old" | "new" | "series" | "folk" | "band" };

/*
 * Curated lists. Titles are text only: no posters, covers, logos or lyrics. Songs are title + artist.
 * Every title and name was checked against Bangla Wikipedia (Oct 2026); the spelling follows the article title.
 * Links store an item's position in its list: once public, only append; never reorder or delete.
 *
 * নাটক — the name is the writer for Humayun Ahmed's serials and the director/writer-director for the rest:
 *   https://bn.wikipedia.org/wiki/কোথাও_কেউ_নেই (writer হুমায়ূন আহমেদ, BTV) · https://bn.wikipedia.org/wiki/বহুব্রীহি_(ধারাবাহিক_নাটক)
 *   https://bn.wikipedia.org/wiki/আজ_রবিবার · https://bn.wikipedia.org/wiki/এইসব_দিনরাত্রি · https://bn.wikipedia.org/wiki/অয়োময়
 *   https://bn.wikipedia.org/wiki/নক্ষত্রের_রাত · https://bn.wikipedia.org/wiki/তারা_তিনজন · https://bn.wikipedia.org/wiki/উড়ে_যায়_বকপক্ষী
 *   https://bn.wikipedia.org/wiki/রঙের_মানুষ (director সালাহউদ্দিন লাভলু) · https://bn.wikipedia.org/wiki/ভবের_হাট (writer মাসুম রেজা)
 *   https://bn.wikipedia.org/wiki/হাড়_কিপ্‌টে (writer বৃন্দাবন দাস) · https://bn.wikipedia.org/wiki/ব্যাচেলর_পয়েন্ট (director কাজল আরেফিন অমি)
 *   https://bn.wikipedia.org/wiki/বড়_ছেলে (2017 Eid-ul-Adha telefilm, মিজানুর রহমান আরিয়ান) · https://bn.wikipedia.org/wiki/শ্বশুরবাড়িতে_ঈদ (2024 Eid telefilm, মহিন খান)
 * সিনেমা — the name is the director; "old" = 1970–89, "new" = 2016 on:
 *   https://bn.wikipedia.org/wiki/জীবন_থেকে_নেয়া · https://bn.wikipedia.org/wiki/ওরা_১১_জন · https://bn.wikipedia.org/wiki/তিতাস_একটি_নদীর_নাম_(চলচ্চিত্র)
 *   https://bn.wikipedia.org/wiki/সুজন_সখী · https://bn.wikipedia.org/wiki/সারেং_বৌ · https://bn.wikipedia.org/wiki/গোলাপী_এখন_ট্রেনে
 *   https://bn.wikipedia.org/wiki/ছুটির_ঘণ্টা · https://bn.wikipedia.org/wiki/বেদের_মেয়ে_জোস্‌না · https://bn.wikipedia.org/wiki/কেয়ামত_থেকে_কেয়ামত
 *   https://bn.wikipedia.org/wiki/আগুনের_পরশমণি_(চলচ্চিত্র) · https://bn.wikipedia.org/wiki/স্বপ্নের_ঠিকানা · https://bn.wikipedia.org/wiki/দীপু_নাম্বার_টু_(চলচ্চিত্র)
 *   https://bn.wikipedia.org/wiki/শ্রাবণ_মেঘের_দিন · https://bn.wikipedia.org/wiki/মাটির_ময়না · https://bn.wikipedia.org/wiki/মনপুরা
 *   https://bn.wikipedia.org/wiki/আয়নাবাজি · https://bn.wikipedia.org/wiki/ঢাকা_অ্যাটাক · https://en.wikipedia.org/wiki/Debi_(2018_film)
 *   https://bn.wikipedia.org/wiki/হাওয়া_(চলচ্চিত্র) · https://bn.wikipedia.org/wiki/পরাণ_(চলচ্চিত্র) · https://bn.wikipedia.org/wiki/সুড়ঙ্গ_(চলচ্চিত্র)
 *   https://bn.wikipedia.org/wiki/তুফান_(২০২৪-এর_চলচ্চিত্র) · director's own spelling: https://bn.wikipedia.org/wiki/রায়হান_রাফী
 * বই — the name is the author (compiler for ঠাকুরমার ঝুলি, creator for the two series):
 *   https://bn.wikipedia.org/wiki/পথের_পাঁচালী · https://bn.wikipedia.org/wiki/চাঁদের_পাহাড়_(উপন্যাস) · https://bn.wikipedia.org/wiki/শেষের_কবিতা
 *   https://bn.wikipedia.org/wiki/দেবদাস · https://bn.wikipedia.org/wiki/পদ্মানদীর_মাঝি_(উপন্যাস) · https://bn.wikipedia.org/wiki/নকশী_কাঁথার_মাঠ
 *   https://bn.wikipedia.org/wiki/জসীম_উদ্‌দীন · https://bn.wikipedia.org/wiki/ঠাকুরমার_ঝুলি · https://bn.wikipedia.org/wiki/লালসালু_(উপন্যাস)
 *   https://bn.wikipedia.org/wiki/হাজার_বছর_ধরে · https://bn.wikipedia.org/wiki/সংশপ্তক_(উপন্যাস) · https://bn.wikipedia.org/wiki/শহীদুল্লা_কায়সার
 *   https://bn.wikipedia.org/wiki/চিলেকোঠার_সেপাই · https://bn.wikipedia.org/wiki/নন্দিত_নরকে · https://bn.wikipedia.org/wiki/শঙ্খনীল_কারাগার
 *   https://bn.wikipedia.org/wiki/ময়ূরাক্ষী_(উপন্যাস) · https://bn.wikipedia.org/wiki/জোছনা_ও_জননীর_গল্প · https://bn.wikipedia.org/wiki/দীপু_নাম্বার_টু
 *   https://bn.wikipedia.org/wiki/আমার_বন্ধু_রাশেদ · https://bn.wikipedia.org/wiki/মুহম্মদ_জাফর_ইকবাল · https://bn.wikipedia.org/wiki/একাত্তরের_দিনগুলি
 *   https://bn.wikipedia.org/wiki/হাঙর_নদী_গ্রেনেড · https://bn.wikipedia.org/wiki/প্রথম_আলো_(উপন্যাস) · https://bn.wikipedia.org/wiki/পূর্ব-পশ্চিম
 *   https://bn.wikipedia.org/wiki/কালবেলা_(উপন্যাস) · https://bn.wikipedia.org/wiki/সোনার_কেল্লা_(উপন্যাস) · https://bn.wikipedia.org/wiki/মাসুদ_রানা
 *   https://bn.wikipedia.org/wiki/তিন_গোয়েন্দা · https://bn.wikipedia.org/wiki/রকিব_হাসান · https://bn.wikipedia.org/wiki/গাভী_বিত্তান্ত
 * গান — the name is the singer or band; for folk songs, Tagore and Nazrul it is the songwriter:
 *   https://bn.wikipedia.org/wiki/লালন (খাঁচার ভিতর অচিন পাখি) · https://bn.wikipedia.org/wiki/হাছন_রাজা_(হাসন_রাজা) (লোকে বলে, বলেরে)
 *   https://bn.wikipedia.org/wiki/আব্বাসউদ্দীন_আহমদ (ওকি গাড়িয়াল ভাই) · https://bn.wikipedia.org/wiki/শাহ_আবদুল_করিম (আগে কি সুন্দর দিন কাটাইতাম)
 *   https://bn.wikipedia.org/wiki/ও_মন_রমজানের_ঐ_রোজার_শেষে_এলো_খুশির_ঈদ (কাজী নজরুল ইসলাম) · https://bn.wikipedia.org/wiki/রবীন্দ্রসঙ্গীত (এসো হে বৈশাখ, পুরানো সেই দিনের কথা)
 *   https://bn.wikipedia.org/wiki/আমি_বাংলায়_গান_গাই · https://bn.wikipedia.org/wiki/আব্দুল_জব্বার (ওরে নীল দরিয়া) · https://bn.wikipedia.org/wiki/সাবিনা_ইয়াসমিন
 *   https://bn.wikipedia.org/wiki/এন্ড্রু_কিশোর · https://bn.wikipedia.org/wiki/আজম_খান · https://bn.wikipedia.org/wiki/তপন_চৌধুরী_(গায়ক) (সোল্‌স)
 *   https://bn.wikipedia.org/wiki/চলো_বদলে_যাই · https://bn.wikipedia.org/wiki/মাইলস (ফিরিয়ে দাও) · https://bn.wikipedia.org/wiki/জেমস-এর_গাওয়া_গানের_তালিকা (তারায় তারায়)
 *   https://bn.wikipedia.org/wiki/শাহ_আলম_সরকার (মমতাজ) · https://bn.wikipedia.org/wiki/শিরোনামহীন (হাসিমুখ) · https://bn.wikipedia.org/wiki/ওয়ারফেজ
 *   https://bn.wikipedia.org/wiki/আর্টসেল (ধূসর সময়) · https://bn.wikipedia.org/wiki/চিরকুট (দুনিয়া) · https://bn.wikipedia.org/wiki/ভালোবাসবো_বাসবো_রে_বন্ধু_তোমায়_যতনে
 *   https://bn.wikipedia.org/wiki/কোক_স্টুডিও_বাংলা_(মৌসুম_১) (নাসেক নাসেক)
 */
const HUMAYUN = "হুমায়ূন আহমেদ";
const ZAFAR = "মুহম্মদ জাফর ইকবাল";

export const categories = [
  {
    id: "natok", label: "নাটক", of: "নাটকের",
    items: [
      { title: "কোথাও কেউ নেই", by: HUMAYUN },
      { title: "বহুব্রীহি", by: HUMAYUN },
      { title: "আজ রবিবার", by: HUMAYUN },
      { title: "এইসব দিনরাত্রি", by: HUMAYUN },
      { title: "অয়োময়", by: HUMAYUN },
      { title: "নক্ষত্রের রাত", by: HUMAYUN },
      { title: "তারা তিনজন", by: HUMAYUN },
      { title: "উড়ে যায় বকপক্ষী", by: HUMAYUN },
      { title: "রঙের মানুষ", by: "সালাহউদ্দিন লাভলু" },
      { title: "ভবের হাট", by: "মাসুম রেজা" },
      { title: "হাড় কিপ্‌টে", by: "বৃন্দাবন দাস" },
      { title: "ব্যাচেলর পয়েন্ট", by: "কাজল আরেফিন অমি" },
      { title: "বড় ছেলে", by: "মিজানুর রহমান আরিয়ান", tag: "eid" },
      { title: "শ্বশুরবাড়িতে ঈদ", by: "মহিন খান", tag: "eid" },
    ],
  },
  {
    id: "cinema", label: "সিনেমা", of: "সিনেমার",
    items: [
      { title: "জীবন থেকে নেয়া", by: "জহির রায়হান", tag: "old" },
      { title: "ওরা ১১ জন", by: "চাষী নজরুল ইসলাম", tag: "old" },
      { title: "তিতাস একটি নদীর নাম", by: "ঋত্বিক ঘটক", tag: "old" },
      { title: "সুজন সখী", by: "খান আতাউর রহমান", tag: "old" },
      { title: "সারেং বৌ", by: "আবদুল্লাহ আল মামুন", tag: "old" },
      { title: "গোলাপী এখন ট্রেনে", by: "আমজাদ হোসেন", tag: "old" },
      { title: "ছুটির ঘণ্টা", by: "আজিজুর রহমান", tag: "old" },
      { title: "বেদের মেয়ে জোস্‌না", by: "তোজাম্মেল হক বকুল", tag: "old" },
      { title: "কেয়ামত থেকে কেয়ামত", by: "সোহানুর রহমান সোহান" },
      { title: "আগুনের পরশমণি", by: HUMAYUN },
      { title: "স্বপ্নের ঠিকানা", by: "এম এ খালেক" },
      { title: "দীপু নাম্বার টু", by: "মোরশেদুল ইসলাম" },
      { title: "শ্রাবণ মেঘের দিন", by: HUMAYUN },
      { title: "মাটির ময়না", by: "তারেক মাসুদ" },
      { title: "মনপুরা", by: "গিয়াস উদ্দিন সেলিম" },
      { title: "আয়নাবাজি", by: "অমিতাভ রেজা চৌধুরী", tag: "new" },
      { title: "ঢাকা অ্যাটাক", by: "দীপংকর দীপন", tag: "new" },
      { title: "দেবী", by: "অনম বিশ্বাস", tag: "new" },
      { title: "হাওয়া", by: "মেজবাউর রহমান সুমন", tag: "new" },
      { title: "পরাণ", by: "রায়হান রাফী", tag: "new" },
      { title: "সুড়ঙ্গ", by: "রায়হান রাফী", tag: "new" },
      { title: "তুফান", by: "রায়হান রাফী", tag: "new" },
    ],
  },
  {
    id: "boi", label: "বই", of: "বইয়ের",
    items: [
      { title: "পথের পাঁচালী", by: "বিভূতিভূষণ বন্দ্যোপাধ্যায়" },
      { title: "চাঁদের পাহাড়", by: "বিভূতিভূষণ বন্দ্যোপাধ্যায়" },
      { title: "শেষের কবিতা", by: "রবীন্দ্রনাথ ঠাকুর" },
      { title: "দেবদাস", by: "শরৎচন্দ্র চট্টোপাধ্যায়" },
      { title: "পদ্মানদীর মাঝি", by: "মানিক বন্দ্যোপাধ্যায়" },
      { title: "নকশী কাঁথার মাঠ", by: "জসীম উদ্‌দীন" },
      { title: "ঠাকুরমার ঝুলি", by: "দক্ষিণারঞ্জন মিত্র মজুমদার" },
      { title: "লালসালু", by: "সৈয়দ ওয়ালীউল্লাহ" },
      { title: "হাজার বছর ধরে", by: "জহির রায়হান" },
      { title: "সংশপ্তক", by: "শহীদুল্লা কায়সার" },
      { title: "চিলেকোঠার সেপাই", by: "আখতারুজ্জামান ইলিয়াস" },
      { title: "নন্দিত নরকে", by: HUMAYUN },
      { title: "শঙ্খনীল কারাগার", by: HUMAYUN },
      { title: "ময়ূরাক্ষী", by: HUMAYUN },
      { title: "জোছনা ও জননীর গল্প", by: HUMAYUN },
      { title: "দীপু নাম্বার টু", by: ZAFAR },
      { title: "আমার বন্ধু রাশেদ", by: ZAFAR },
      { title: "একাত্তরের দিনগুলি", by: "জাহানারা ইমাম" },
      { title: "হাঙর নদী গ্রেনেড", by: "সেলিনা হোসেন" },
      { title: "প্রথম আলো", by: "সুনীল গঙ্গোপাধ্যায়" },
      { title: "পূর্ব-পশ্চিম", by: "সুনীল গঙ্গোপাধ্যায়" },
      { title: "কালবেলা", by: "সমরেশ মজুমদার" },
      { title: "সোনার কেল্লা", by: "সত্যজিৎ রায়" },
      { title: "মাসুদ রানা", by: "কাজী আনোয়ার হোসেন", tag: "series" },
      { title: "তিন গোয়েন্দা", by: "রকিব হাসান", tag: "series" },
      { title: "গাভী বিত্তান্ত", by: "আহমদ ছফা" },
    ],
  },
  {
    id: "gaan", label: "গান", of: "গানের",
    items: [
      { title: "খাঁচার ভিতর অচিন পাখি", by: "লালন", tag: "folk" },
      { title: "লোকে বলে, বলেরে", by: "হাছন রাজা", tag: "folk" },
      { title: "ওকি গাড়িয়াল ভাই", by: "আব্বাসউদ্দীন আহমদ", tag: "folk" },
      { title: "আগে কি সুন্দর দিন কাটাইতাম", by: "শাহ আবদুল করিম", tag: "folk" },
      { title: "ও মন রমজানের ঐ রোজার শেষে", by: "কাজী নজরুল ইসলাম", tag: "eid" },
      { title: "এসো হে বৈশাখ", by: "রবীন্দ্রনাথ ঠাকুর" },
      { title: "পুরানো সেই দিনের কথা", by: "রবীন্দ্রনাথ ঠাকুর" },
      { title: "আমি বাংলায় গান গাই", by: "প্রতুল মুখোপাধ্যায়" },
      { title: "ওরে নীল দরিয়া", by: "আব্দুল জব্বার" },
      { title: "সব ক’টা জানালা খুলে দাও না", by: "সাবিনা ইয়াসমিন" },
      { title: "হায়রে মানুষ রঙিন ফানুস", by: "এন্ড্রু কিশোর" },
      { title: "রেল লাইনের ঐ বস্তিতে", by: "আজম খান", tag: "band" },
      { title: "মন শুধু মন ছুঁয়েছে", by: "সোল্‌স", tag: "band" },
      { title: "চলো বদলে যাই", by: "আইয়ুব বাচ্চু", tag: "band" },
      { title: "ফিরিয়ে দাও", by: "মাইলস", tag: "band" },
      { title: "তারায় তারায়", by: "জেমস", tag: "band" },
      { title: "বুকটা ফাইট্টা যায়", by: "মমতাজ", tag: "folk" },
      { title: "হাসিমুখ", by: "শিরোনামহীন", tag: "band" },
      { title: "অবাক ভালোবাসা", by: "ওয়ারফেজ", tag: "band" },
      { title: "ধূসর সময়", by: "আর্টসেল", tag: "band" },
      { title: "দুনিয়া", by: "চিরকুট", tag: "band" },
      { title: "ভালোবাসবো বাসবো রে বন্ধু তোমায় যতনে", by: "হাবিব ওয়াহিদ" },
      { title: "নাসেক নাসেক", by: "অনিমেষ রায় ও পান্থ কানাই" },
    ],
  },
] as const satisfies ReadonlyArray<{ id: string; label: string; of: string; items: readonly Item[] }>;

export type CatId = (typeof categories)[number]["id"];
export type Category = { id: CatId; label: string; of: string; items: readonly Item[] };
/** A spine: a curated item's position in its list, or a title the person typed. */
export type Choice = number | string;
export type Shelf = { cat: CatId; picks: Choice[]; name: string };

export const catById = (id: CatId): Category => categories.find(cat => cat.id === id)!;
export const isCatId = (id: string): id is CatId => categories.some(cat => cat.id === id);

/** Starting shelves: a spread of eras, so nobody starts from an empty shelf. */
export const defaults: Record<CatId, Choice[]> = {
  natok: [0, 1, 2, 11],
  cinema: [0, 6, 14, 18],
  boi: [0, 13, 15, 23],
  gaan: [0, 4, 13, 17],
};

/** Anonymous tally ids: one per category (so each list has its own total) and one per curated item. Typed titles are never counted. */
export const tallyIds: string[] = [...categories.map(cat => cat.id), ...categories.flatMap(cat => cat.items.map((_, index) => `${cat.id}-${index}`))];
export const tallyId = (cat: CatId, pick: number) => `${cat}-${pick}`;

// Control and direction-override characters out, so a shared link can't scramble the card. ZWJ/ZWNJ stay for Bangla shaping.
const UNSAFE = /[\u0000-\u001f\u007f-\u009f‎‏‪-‮⁦-⁩]/g;

function clean(text: string, max: number) {
  const flat = text.normalize("NFC").replace(UNSAFE, " ").replace(/\s+/g, " ").trim();
  return Array.from(flat).slice(0, max).join("").trim();
}

/** A typed title: NFC, safe, ≤30 characters. Commas are the link's separator, so they become spaces. */
export const cleanTitle = (title: string) => clean(title.replace(/[,，]/g, " "), MAX_TITLE_LENGTH);
export const cleanName = (name: string) => clean(name, MAX_NAME_LENGTH);

/** A typed title that matches a curated one becomes that item, so it counts and matches like one. */
export function resolveTyped(cat: CatId, text: string): Choice | null {
  const title = cleanTitle(text);
  if (!title) return null;
  const index = catById(cat).items.findIndex(item => item.title === title);
  return index >= 0 ? index : title;
}

const pickKey = (pick: Choice) => typeof pick === "number" ? `#${pick}` : `t:${pick.toLocaleLowerCase("bn")}`;
export const samePick = (a: Choice, b: Choice) => pickKey(a) === pickKey(b);

/** Puts a pick in a slot; if it is already on the shelf, the two swap places so nothing appears twice. */
export function placePick(picks: readonly Choice[], slot: number, pick: Choice): Choice[] {
  const next = [...picks];
  const existing = next.findIndex(item => samePick(item, pick));
  if (existing >= 0 && existing !== slot) next[existing] = next[slot];
  next[slot] = pick;
  return next;
}

export function describe(cat: CatId, pick: Choice): Item & { typed: boolean } {
  if (typeof pick === "string") return { title: pick, by: "", typed: true };
  return { ...catById(cat).items[pick], typed: false };
}

/** "#k=natok&i=12,4,0,t:<title>&n=<name>" — curated ids as numbers, typed titles after "t:". */
export function shareHash({ cat, picks, name }: Shelf) {
  const parts = picks.map(pick => typeof pick === "number" ? String(pick) : `t:${encodeURIComponent(cleanTitle(pick))}`);
  const shown = cleanName(name);
  return `#k=${cat}&i=${parts.join(",")}${shown ? `&n=${encodeURIComponent(shown)}` : ""}`;
}

/** Exactly four distinct, valid spines in a known category, or null. */
export function parseShareHash(hash: string): Shelf | null {
  let params: URLSearchParams;
  try { params = new URLSearchParams(hash.replace(/^#/, "")); } catch { return null; }
  const cat = params.get("k") ?? "";
  const raw = params.get("i") ?? "";
  if (!isCatId(cat) || raw.length > 600) return null;
  const parts = raw.split(",");
  if (parts.length !== SLOTS) return null;
  const size = catById(cat).items.length;
  const picks: Choice[] = [];
  for (const part of parts) {
    const pick: Choice | null = /^\d{1,3}$/.test(part) && Number(part) < size ? Number(part) : part.startsWith("t:") ? cleanTitle(part.slice(2)) || null : null;
    if (pick === null || picks.some(item => samePick(item, pick))) return null;
    picks.push(pick);
  }
  return { cat, picks, name: cleanName(params.get("n") ?? "") };
}

/** "রাফির চার প্রিয় নাটক" / "আমার চার প্রিয় গান". */
export function headline(shelf: Pick<Shelf, "cat" | "name">, fallback = "আমার") {
  return `${shelf.name ? possessive(shelf.name) : fallback} চার প্রিয় ${catById(shelf.cat).label}`;
}

/** The human line, chosen from the category and what is on the shelf. First match wins. */
export function shelfLine(cat: CatId, picks: readonly Choice[]) {
  const items = picks.filter((pick): pick is number => typeof pick === "number").map(pick => catById(cat).items[pick]);
  const typed = picks.length - items.length;
  const has = (title: string) => items.some(item => item.title === title);
  const count = (test: (item: Item) => boolean) => items.filter(test).length;
  const humayun = count(item => item.by === HUMAYUN);
  if (typed >= 3) return "এই চারটা কারও তালিকায় নেই, কিন্তু আমার তাকে আছে।";
  if (cat === "natok") {
    if (has("কোথাও কেউ নেই")) return "বাকের ভাইয়ের জন্য মনটা এখনো কেমন করে।";
    if (humayun === SLOTS) return "পুরো তাকটাই হুমায়ূন আহমেদের।";
    if (count(item => item.tag === "eid")) return "ঈদের রাতে সবাই মিলে টিভির সামনে, এটাই তো ঈদ।";
    if (humayun >= 2) return "বিটিভির সেই রাতগুলো, নাটকের সময় রাস্তা ফাঁকা।";
    return "রিমোট নিয়ে কাড়াকাড়ি, নাটক শুরু হলেই সবাই চুপ।";
  }
  if (cat === "cinema") {
    const old = count(item => item.tag === "old"), fresh = count(item => item.tag === "new");
    if (has("ছুটির ঘণ্টা")) return "ছুটির ঘণ্টা দেখে কে কাঁদেনি, বলো তো?";
    if (old && fresh) return "সাদাকালো দিন থেকে আজকের হল, সব যুগের চারটা।";
    if (old >= 3) return "শুক্রবার বিকেল, বিটিভির সিনেমা, পুরো পাড়া এক ঘরে।";
    if (fresh >= 3) return "হলে বসে বড় পর্দায় দেখার মজাই আলাদা।";
    return "টিভিতে যতবার দেয়, ততবার বসে যাই।";
  }
  if (cat === "boi") {
    if (count(item => item.tag === "series")) return "পাঠ্যবইয়ের ভাঁজে লুকিয়ে পড়া সেই রহস্য।";
    if (has("ময়ূরাক্ষী")) return "হলুদ পাঞ্জাবি, খালি পা, হিমু হতে কে না চেয়েছে?";
    if (humayun === SLOTS) return "পুরো তাকটাই হুমায়ূন আহমেদের।";
    if (count(item => item.by === ZAFAR)) return "কিশোর বয়সের সাহসটা এই বইগুলো থেকেই।";
    return "নীলক্ষেতের পুরোনো বইয়ের গন্ধ, পাতায় পাতায় দাগ।";
  }
  const folk = count(item => item.tag === "folk"), band = count(item => item.tag === "band");
  if (count(item => item.tag === "eid")) return "চাঁদরাতে এই গান না বাজলে ঈদ আসে না।";
  if (folk && band) return "মাটির গান থেকে ব্যান্ড, দুটোই আমার।";
  if (band >= 3) return "ক্যাসেট উল্টে উল্টে শোনা সেই ব্যান্ডের দিন।";
  if (folk >= 3) return "একতারার সুরে মনটা উদাস হয়ে যায়।";
  return "এই চারটা বাজলে ভলিউম নিজে থেকেই বাড়ে।";
}

/** Which of my spines a friend also has (same category only). */
export function sharedPicks(own: Pick<Shelf, "cat" | "picks">, friend: Shelf | null): Choice[] {
  if (!friend || friend.cat !== own.cat) return [];
  return own.picks.filter(pick => friend.picks.some(other => samePick(pick, other)));
}

/** "দুজনেরই আছে: কোথাও কেউ নেই, আজ রবিবার" — for the card when a friend's shelf is open. */
export function commonLine(own: Pick<Shelf, "cat" | "picks">, friend: Shelf | null) {
  if (!friend || friend.cat !== own.cat) return "";
  const shared = sharedPicks(own, friend).map(pick => describe(own.cat, pick).title);
  if (!shared.length) return `${friend.name ? possessive(friend.name) : "বন্ধুর"} সাথে একটাও মেলেনি!`;
  if (shared.length === SLOTS) return `${friend.name ? possessive(friend.name) : "বন্ধুর"} সাথে চারটাই মিলে গেছে!`;
  return `দুজনেরই আছে: ${shared.slice(0, 2).join(", ")}${shared.length > 2 ? ` আর ${bn(shared.length - 2)}টা` : ""}`;
}

export function previewTitle(shelf: Shelf) {
  return `${headline(shelf, "এক বন্ধুর")} — তোমার চারটা কী?`;
}

/** Link-preview text lists only curated titles; typed ones stay in the link and on the card. */
export function previewDescription(shelf: Shelf) {
  const label = catById(shelf.cat).label;
  const curated = shelf.picks.filter((pick): pick is number => typeof pick === "number").map(pick => describe(shelf.cat, pick).title);
  return `${curated.length ? `${curated.join(", ")}… ` : ""}নীলক্ষেতের বইয়ের তাকের মতো নিজের চারটা প্রিয় ${label} সাজাও, বন্ধুর তাকের সাথে মিলিয়ে দেখো।`;
}

/* Spine looks. Curated items are cloth-bound; typed titles look like a Nilkhet photocopy binding with a hand-written label. */
export type Look = { bg: string; ink: string; trim: string; width: number; height: number; style: 0 | 1 | 2; typed: boolean };
const cloth = [
  { bg: "#8c2f2b", ink: "#f6e2ae", trim: "#d9b45a" },
  { bg: "#1f4a5c", ink: "#f3e7c9", trim: "#c9a24f" },
  { bg: "#2f5a3c", ink: "#f6e2ae", trim: "#d2ad55" },
  { bg: "#d4a23c", ink: "#2b1a0c", trim: "#6e3b17" },
  { bg: "#3a3a6e", ink: "#f1e6ca", trim: "#c8a75a" },
  { bg: "#ece0c4", ink: "#6b1e12", trim: "#9c3b22" },
  { bg: "#a5502b", ink: "#fbecd2", trim: "#f0c46a" },
  { bg: "#5a2a48", ink: "#f4e1ba", trim: "#d3b062" },
];
const paper = [
  { bg: "#e9dcbc", ink: "#20398a", trim: "#b59a66" },
  { bg: "#c9d6c0", ink: "#20398a", trim: "#8ea283" },
  { bg: "#e6c3b8", ink: "#20398a", trim: "#b48979" },
  { bg: "#c8d3e2", ink: "#20398a", trim: "#8797ad" },
];

function hash(text: string) {
  let value = 2166136261;
  for (const char of text) value = Math.imul(value ^ char.codePointAt(0)!, 16777619) >>> 0;
  return value;
}

/** Deterministic per title, so a book looks the same on every shelf; neighbours never share a colour. */
export function shelfLooks(cat: CatId, picks: readonly Choice[]): Look[] {
  const looks: Look[] = [];
  let previous = -1;
  for (const pick of picks) {
    const typed = typeof pick === "string";
    const value = hash(typed ? `t:${pick}` : `${cat}:${pick}`);
    const palette = typed ? paper : cloth;
    let index = value % palette.length;
    if (index === previous) index = (index + 1) % palette.length;
    previous = index;
    looks.push({ ...palette[index], width: 0.74 + ((value >>> 8) % 27) / 100, height: 0.84 + ((value >>> 16) % 17) / 100, style: ((value >>> 4) % 3) as Look["style"], typed });
  }
  return looks;
}

export { possessive };

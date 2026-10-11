import { possessive } from "../../../shared/bangla";

export const MAX_NAME_LENGTH = 30;
export const SIZE = 16;

// Share links store picks as bit positions in a pack: once links are public, never reorder, edit or replace a pack's squares.
// Only append whole new packs. Exactly 16 squares each so every score is out of the same ১৬.
// House rules for squares: nothing about bodies, skin, weight, fertility, dowry, religion or politics; same for every gender; fond, never cruel.
export const packs = [
  {
    id: "relatives", chip: "আত্মীয়স্বজন", title: "আত্মীয়দের প্রশ্ন", exam: "দাওয়াত পরীক্ষা", code: "১০১", time: "সারা দিন",
    note: "ওনারা ভালোবাসেন বলেই জিজ্ঞেস করেন।",
    calm: "এবার আত্মীয়রা ছুটিতে ছিলেন।",
    squares: ["বিয়ে কবে?", "রেজাল্ট কত?", "চাকরি কবে?", "বেতন কত?", "এত রাত জেগে কী করিস?", "ইঞ্জিনিয়ার না ডাক্তার?", "আমাদের সময়ে…", "চিনতে পেরেছ আমাকে?", "এখন কিসে পড়ো?", "অমুক তো বিদেশ চলে গেছে!", "সারাদিন মোবাইল কেন?", "আরেকটু খাও, কিছুই তো খেলে না!", "তোমাকে তো এইটুকু দেখেছি!", "বিসিএস দিচ্ছ না?", "আমাদের বাসায় আসো না কেন?", "পাশের বাসারটা কিন্তু গোল্ডেন পেয়েছে"],
  },
  {
    id: "biyebari", chip: "বিয়েবাড়ি", title: "বিয়েবাড়ির কাণ্ড", exam: "বিয়েবাড়ি পরীক্ষা", code: "১০২", time: "গেট ধরা থেকে বিদায়",
    note: "রোস্ট দুইটা নেওয়া নিষেধ নয়।",
    calm: "এমন শান্ত বিয়েবাড়ি আগে দেখিনি!",
    squares: ["গেটে টাকা নিয়ে দরাদরি", "জুতা চুরি", "স্টেজে ছবির লম্বা লাইন", "বরযাত্রী দুই ঘণ্টা লেট", "খাবারের লাইনে ঠেলাঠেলি", "রোস্টের সাইজ নিয়ে গবেষণা", "বোরহানি শেষ!", "দ্বিতীয় ব্যাচে খাওয়া", "হলুদে মাখামাখি", "কার মেহেদি বেশি গাঢ়", "সবাই এক রঙের থিমে", "একই গান বারবার", "মাথার ওপর ড্রোন ক্যামেরা", "কোনো এক খালুর অভিমান", "হঠাৎ কারেন্ট গেল", "“এরপর তোমার পালা!”"],
  },
  {
    id: "eid", chip: "ঈদের দিন", title: "ঈদের দিনের কাণ্ড", exam: "ঈদ পরীক্ষা", code: "১০৩", time: "চাঁদরাত থেকে ছুটি শেষ",
    note: "সালামি গোনা এই পরীক্ষার অংশ নয়।",
    calm: "ঈদটা এবার বেশ চুপচাপ কাটল।",
    squares: ["“সালামি কত পেলি?”", "চাঁদ দেখার হুড়োহুড়ি", "চাঁদরাতে মেহেদি", "নতুন জামার ট্যাগ খোলা", "তিন বাড়িতে তিন বাটি সেমাই", "বাড়ি ফেরার টিকিট যুদ্ধ", "দুপুরে লম্বা ঘুম", "টিভিতে ঈদের নাটক", "বাড়ি বাড়ি বেড়ানো", "“কত বড় হয়ে গেছিস!”", "সালামি আম্মুর কাছে জমা", "ফাঁকা ঢাকা", "বিকেলে ঘুরতে বের হওয়া", "তিন বেলা পোলাও", "চকচকে নতুন নোট", "ঈদের ছবি তোলার লাইন"],
  },
  {
    id: "ammu", chip: "আম্মুর কথা", title: "আম্মুর কথা", exam: "বাসার পরীক্ষা", code: "১০৪", time: "সকাল থেকে রাত",
    note: "প্রতিটা বকার পেছনে এক প্লেট ভাত আছে।",
    calm: "আম্মু আজ খুব খুশি মনে হচ্ছে।",
    squares: ["ভাত খেয়েছিস?", "মোবাইলটা রাখ!", "ফ্যান-লাইট বন্ধ কর", "আমি কি তোর কাজের লোক?", "ঘরের কী অবস্থা!", "আমি এসে খুঁজে পেলে?", "তোর আব্বু আসুক আজ", "পৌঁছে ফোন দিস", "ঠান্ডা লাগবে, গায়ে কিছু দে", "একটু পড়তে বস", "বাইরে থেকে এসে হাত ধো", "আরেকটা রুটি নে", "এত রাতে কার সাথে কথা?", "পাশের বাসার ওকে দেখ", "পানি খা বেশি করে", "কাল থেকে সব বন্ধ!"],
  },
  {
    id: "natok", chip: "ঈদের নাটক", title: "ঈদের নাটক", exam: "নাটক পরীক্ষা", code: "১০৫", time: "সাত দিন, সাত নাটক",
    note: "টিস্যু সাথে রাখা যাবে।",
    calm: "এবার নাটক কম, ঘুম বেশি।",
    squares: ["বিজ্ঞাপনের ফাঁকে নাটক", "রিকশায় প্রথম দেখা", "ভুল নম্বরে প্রেম", "ধনী-গরিবের প্রেম", "“এই বিয়ে হবে না!”", "অন্য কারও সাথে বিয়ে ঠিক", "ভুল বোঝাবুঝি", "বৃষ্টিতে গান", "হাসপাতালের দৃশ্য", "ক্যাফেতে কফির কাপ", "পেছনে দুঃখের গান", "গ্রামে শুটিং", "বাড়ি ফেরার বাস-ট্রেন", "মামার কমেডি", "শেষে সবাই মেনে নেয়", "শেষে লেখা “চলবে…”"],
  },
  {
    id: "office", chip: "অফিস", title: "অফিসের কথা", exam: "অফিস পরীক্ষা", code: "১০৬", time: "নয়টা থেকে… কে জানে",
    note: "চা-বিরতি পরীক্ষার সময়ের মধ্যে ধরা হবে না।",
    calm: "অফিসে আজ শান্তি, নাকি ছুটির দিন?",
    squares: ["“একটু আর্জেন্ট”", "যে মিটিং মেইলেই হতো", "“পাঁচ মিনিটের” মিটিং দুই ঘণ্টা", "“কালকের মধ্যে লাগবে”", "ফাইনাল_ফাইনাল_২", "প্রিন্টার নষ্ট", "নেট নেই", "“আমার কাছে আসেনি তো”", "ছুটির দিনে মেসেজ", "“আজকে একটু থাকতে হবে”", "জ্যামে লেট", "গ্রুপে “সবাইকে জানানো যাচ্ছে”", "কারও জন্মদিনের কেক", "লম্বা চা-বিরতি", "“একটু দেখে দিও তো”", "ভুল করে রিপ্লাই অল"],
  },
  {
    id: "khela", chip: "খেলার দিন", title: "খেলার দিন", exam: "ম্যাচ পরীক্ষা", code: "১০৭", time: "টস থেকে শেষ বল",
    note: "জিতলে সবাই খুশি, হারলে সবাই কোচ।",
    calm: "আজকের ম্যাচটা বেশ ঠান্ডা মাথায় দেখেছ।",
    squares: ["রিভিউ নষ্ট", "শেষ ওভারে ১২ লাগবে", "আব্বুর চিৎকার", "“আমি দেখলেই আউট”", "সহজ ক্যাচ মিস", "বৃষ্টি নামল", "লাইভ আটকে গেল", "পাশের বাসার চিৎকারে উইকেটের খবর", "একটু পরপর স্কোর দেখা", "“ওকে কেন খেলাল?”", "টং দোকানে ভিড়", "গালে পতাকা আঁকা", "শেষ বলে ছক্কা", "“এবার কিন্তু জিতব!”", "রাগ করে টিভি বন্ধ", "ম্যাচ শেষে সবাই বিশেষজ্ঞ"],
  },
  {
    id: "jam", chip: "জ্যাম", title: "রাস্তার পরীক্ষা", exam: "যাতায়াত পরীক্ষা", code: "১০৮", time: "দশ মিনিটের রাস্তা, দুই ঘণ্টা",
    note: "হেঁটে আগে পৌঁছালে বাড়তি নম্বর নেই।",
    calm: "রাস্তা ফাঁকা পেয়েছিলে? ভাগ্যবান!",
    squares: ["তিনবার লাল বাতি", "উল্টো দিকে রিকশা", "জানালায় হকার", "“মামা, যাবেন?” না", "ভাড়া নিয়ে দরাদরি", "“ওঠেন, খালি গাড়ি!”", "ম্যাপে টকটকে লাল রাস্তা", "হর্নের কনসার্ট", "ফ্লাইওভারেও জ্যাম", "“আমি রাস্তায়, পাঁচ মিনিট”", "জ্যামে বসে পুরো এক পর্ব", "হেঁটেই আগে পৌঁছানো", "মাঝরাস্তায় যাত্রী তোলা", "রাস্তা খোঁড়াখুঁড়ি", "জানালায় ঝালমুড়ি", "মিটারে যাবে না"],
  },
  {
    id: "brishti", chip: "বর্ষা", title: "বর্ষার পরীক্ষা", exam: "বৃষ্টির দিনের পরীক্ষা", code: "১০৯", time: "আষাঢ় থেকে ভাদ্র",
    note: "ছাতা আনা বাধ্যতামূলক, কাজে লাগা নয়।",
    calm: "ছাতাটা এবার ঠিক জায়গায় ছিল।",
    squares: ["রাস্তায় হাঁটুপানি", "রিকশাভাড়া ডবল", "জুতা হাতে হাঁটা", "ছাতা উল্টে গেল", "গাড়ির পানির ছিটা", "খিচুড়ি আর ডিমভাজি", "কাপড় শুকায় না", "“আজ কি ক্লাস হবে?”", "জানালায় বসে বৃষ্টি দেখা", "মোবাইল পলিথিনে", "ঝড়ে কারেন্ট গেল", "সারা রাত ব্যাঙের ডাক", "জুতায় চপচপ", "রিকশায় পলিথিনের পর্দা", "ছাদের কাপড় নিয়ে দৌড়", "বৃষ্টির গান"],
  },
  {
    id: "gorom", chip: "গরমের দিন", title: "গরমের পরীক্ষা", exam: "লোডশেডিং পরীক্ষা", code: "১১০", time: "যতক্ষণ কারেন্ট নেই",
    note: "হাতপাখা ব্যবহার করা যাবে।",
    calm: "কারেন্ট এবার বেশ ভদ্র ছিল।",
    squares: ["হাতপাখা হাতে", "মোমবাতি খোঁজা", "আইপিএস শেষ", "পাম্প বন্ধ, পানি নেই", "মোবাইলে ১০% চার্জ", "ফ্রিজের আইসক্রিম গলে গেল", "বারান্দায় ঘুম", "“কারেন্ট আসছে!” চিৎকার", "ওয়াইফাই বন্ধ", "পাশের বাসার জেনারেটর", "ঘামে ঘুম ভাঙা", "চার্জার লাইট", "অন্ধকারে আড্ডা", "পাওয়ার ব্যাংক ধার", "দিনে দুবার গোসল", "ফ্যান কখন ঘুরবে?"],
  },
] as const;

export type Pack = (typeof packs)[number];
export type PackId = Pack["id"];
export type Shared = { pack: PackId; mask: number; name: string };

const numbers = new Intl.NumberFormat("bn-BD");
export const bn = (value: number) => numbers.format(value);

export const isPackId = (id: string): id is PackId => packs.some(pack => pack.id === id);
export const packById = (id: PackId): Pack => packs.find(pack => pack.id === id)!;

/** Wedding season (Nov–Feb) opens on the বিয়েবাড়ি pack; the rest of the year on আত্মীয়দের প্রশ্ন. */
export const defaultPack = (date: Date): PackId => [10, 11, 0, 1].includes(date.getMonth()) ? "biyebari" : "relatives";

// Seasons as the Bangladesh Meteorological Department splits the year: pre-monsoon summer Mar–May, monsoon Jun–Sep.
/** The weather pack for this month, or null; it gets a chip near the front but never replaces the default pack. */
export const seasonPack = (date: Date): PackId | null => {
  const month = date.getMonth();
  return month >= 5 && month <= 8 ? "brishti" : month >= 2 && month <= 4 ? "gorom" : null;
};
/** Chips in display order: the in-season pack moves to second place so it shows without scrolling. Pack order and ids stay put. */
export const chipOrder = (season: PackId | null): readonly Pack[] => season ? [packs[0], packById(season), ...packs.slice(1).filter(pack => pack.id !== season)] : packs;

export const toggle = (mask: number, index: number) => {
  if (!Number.isInteger(index) || index < 0 || index >= SIZE) throw new RangeError("এই ঘরটা প্রশ্নপত্রে নেই।");
  return mask ^ (1 << index);
};
export const has = (mask: number, index: number) => (mask >> index & 1) === 1;
export const countOf = (mask: number) => [...Array(SIZE).keys()].filter(index => has(mask, index)).length;

// 4 rows, 4 columns, 2 diagonals.
export const LINES = [
  [0, 1, 2, 3], [4, 5, 6, 7], [8, 9, 10, 11], [12, 13, 14, 15],
  [0, 4, 8, 12], [1, 5, 9, 13], [2, 6, 10, 14], [3, 7, 11, 15],
  [0, 5, 10, 15], [3, 6, 9, 12],
] as const;
export const bingoLines = (mask: number) => LINES.filter(line => line.every(index => has(mask, index)));
export const bingoWord = (lines: number) => lines === 0 ? "" : lines === 1 ? "বিঙ্গো!" : lines === 2 ? "ডাবল বিঙ্গো!" : `${bn(lines)}টা বিঙ্গো!`;

export function cleanName(name: string) {
  // Strip control and bidi-override characters so a shared link can't scramble the card text.
  return name.normalize("NFC").replace(/[\u0000-\u001f\u007f‪-‮⁦-⁩]/g, "").trim().replace(/\s+/g, " ").slice(0, MAX_NAME_LENGTH);
}

export const encodeMask = (mask: number) => (mask & 0xffff).toString(16).padStart(4, "0");
export const decodeMask = (code: string) => /^[0-9a-f]{4}$/i.test(code) ? parseInt(code, 16) : null;

export function shareHash({ pack, mask, name }: Shared) {
  const params = new URLSearchParams({ p: pack, s: encodeMask(mask) });
  const shown = cleanName(name);
  if (shown) params.set("n", shown);
  return "#" + params.toString();
}

export function parseShareHash(hash: string): Shared | null {
  if (hash.length > 1000) return null; // a capped name is under 300 even percent-encoded
  const params = new URLSearchParams(hash.replace(/^#/, ""));
  const pack = params.get("p") ?? "";
  const mask = decodeMask(params.get("s") ?? "");
  if (!isPackId(pack) || mask === null) return null;
  return { pack, mask, name: cleanName(params.get("n") ?? "") };
}

export function humanLine(count: number, pack: Pack) {
  if (count <= 3) return pack.calm;
  if (count <= 9) return "মাঝারি প্রস্তুতি, ভালো ফল।";
  if (count <= 15) return "পুরো সিলেবাস কমন!";
  return "গোল্ডেন এ-প্লাস! সব প্রশ্ন একদিনেই।";
}

export type CardContent = {
  pack: Pack;
  mask: number;
  name: string;
  count: number;
  lines: ReadonlyArray<readonly number[]>;
  bingo: string;
  line: string;
  match: string;
};

/** "রাফি ১১, আমি ৯। দুজনেরই কমন: বিয়ে কবে?" — only when both cards are the same pack, so the squares mean the same thing. */
export function matchLine(own: Shared, friend: Shared) {
  if (friend.pack !== own.pack) return "";
  const pack = packById(own.pack);
  const common = pack.squares.findIndex((_, index) => has(own.mask, index) && has(friend.mask, index));
  const scores = `${friend.name || "বন্ধু"} ${bn(countOf(friend.mask))}, ${cleanName(own.name) || "আমি"} ${bn(countOf(own.mask))}`;
  return common >= 0 ? `${scores}। দুজনেরই কমন: ${pack.squares[common]}` : scores;
}

export function createCard(own: Shared, friend?: Shared | null): CardContent {
  const pack = packById(own.pack);
  const mask = own.mask & 0xffff;
  const count = countOf(mask);
  const lines = bingoLines(mask);
  return { pack, mask, name: cleanName(own.name), count, lines, bingo: bingoWord(lines.length), line: humanLine(count, pack), match: friend ? matchLine(own, friend) : "" };
}

export const headline = (count: number) => `${bn(SIZE)}-র মধ্যে ${bn(count)}টা কমন পড়েছে!`;

/** Post text a real person would write under the card. */
export function caption(card: CardContent) {
  const lead = card.match ? `${card.match}!` : `${card.pack.title}: ${headline(card.count)}`;
  return `${lead}${card.bingo ? ` ${card.bingo}` : ""} তোমার কয়টা কমন পড়ল?`;
}

/** Fixed, countable ids for the opt-in "everyone" tally: "<pack>.<n>" per square, "seen:<pack>" per card, so each square gets a percentage within its pack. */
export const squareId = (pack: PackId, index: number) => `${pack}.${index + 1}`;
export const tallyIds = packs.flatMap(pack => [...pack.squares.map((_, index) => squareId(pack.id, index)), `seen:${pack.id}`]);
export const tallyItems = ({ pack, mask }: Shared) => [...packById(pack).squares.flatMap((_, index) => has(mask, index) ? [squareId(pack, index)] : []), `seen:${pack}`];

export { possessive };

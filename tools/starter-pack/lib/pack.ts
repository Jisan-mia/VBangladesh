import { possessive } from "../../../shared/bangla";

export const MAX_NAME_LENGTH = 20;
/** The classic blister card holds 6 bubbles; the 3×3 grid holds 9. */
export const CLASSIC = 6;
export const GRID = 9;

/** Every toy accessory, drawn in lib/art. Labels stay short: they sit inside a bubble on a phone screen. */
export const items = {
  // ভার্সিটি
  khata: "ধার করা খাতা",
  "canteen-cha": "ক্যান্টিনের চা",
  photocopy: "ফটোকপির শিট",
  "alarm-3am": "রাত ৩টার অ্যালার্ম",
  "one-strap-bag": "এক ফিতার ব্যাগ",
  singara: "সিঙ্গারা",
  calculator: "ক্যালকুলেটর",
  "tuition-taka": "টিউশনির টাকা",
  pendrive: "পেনড্রাইভ",
  "varsity-bus": "ভার্সিটির বাস",
  "clear-file": "অ্যাসাইনমেন্টের ফাইল",
  charger: "বন্ধুর চার্জার",
  // নতুন চাকরি
  tiffin: "টিফিন বাটি",
  "office-id": "অফিসের আইডি কার্ড",
  iron: "ইস্ত্রি",
  "sweets-box": "জয়েনিংয়ের মিষ্টি",
  "tea-flask": "চায়ের ফ্লাস্ক",
  "laptop-bag": "ল্যাপটপ ব্যাগ",
  inbox: "৯৯+ মেইল",
  "holiday-calendar": "ছুটির ক্যালেন্ডার",
  "diary-pen": "ডায়েরি আর কলম",
  "alarm-7am": "সকাল ৭টার অ্যালার্ম",
  "salary-sms": "বেতনের মেসেজ",
  shoes: "পালিশ করা জুতা",
  // প্রবাসী
  "achar-jar": "লাগেজে আচার",
  "video-call": "ভিডিও কল",
  passport: "পাসপোর্ট",
  suitcase: "ঠাসা লাগেজ",
  "rice-cooker": "রাইস কুকার",
  "two-clocks": "দুই দেশের ঘড়ি",
  adapter: "প্লাগ অ্যাডাপ্টার",
  "two-sims": "দুই দেশের সিম",
  flag: "লাল-সবুজ পতাকা",
  spices: "মায়ের দেওয়া মসলা",
  jacket: "ভারী জ্যাকেট",
  "boarding-pass": "বোর্ডিং পাস",
  // নতুন বাবা-মা
  feeder: "ফিডার",
  "sleepy-eyes": "ঘুমহীন চোখ",
  diaper: "ডায়াপার",
  jhunjhuni: "ঝুনঝুনি",
  kantha: "নকশিকাঁথা",
  "cold-tea": "ঠান্ডা হয়ে যাওয়া চা",
  "photo-phone": "ছবিতে ভরা ফোন",
  dolna: "দোলনা",
  "baby-bag": "বাচ্চার ব্যাগ",
  "chhora-boi": "ছড়ার বই",
  socks: "পুঁচকে মোজা",
  "sorshe-balish": "সরিষার বালিশ",
  // ঈদের ছুটিতে বাড়ি
  "bus-ticket": "বাসের টিকিট",
  "salami-khaam": "সালামির খাম",
  "power-bank": "পাওয়ার ব্যাংক",
  "gift-bag": "সবার উপহার",
  "neck-pillow": "ঘাড়ের বালিশ",
  ludu: "লুডু",
  "train-ticket": "ট্রেনের টিকিট",
  "new-clothes": "নতুন জামা",
  "water-biscuit": "পানি আর বিস্কুট",
  "house-lock": "বাসার তালা-চাবি",
  semai: "সেমাই",
  ghuri: "ঘুড়ি",
  // বৃষ্টির দিন
  khichuri: "খিচুড়ির হাঁড়ি",
  umbrella: "উল্টে যাওয়া ছাতা",
  ilish: "ইলিশ ভাজা",
  raincoat: "রেইনকোট",
  sandal: "প্লাস্টিকের স্যান্ডেল",
  "polythene-phone": "পলিথিনে মোড়া ফোন",
  kadam: "কদম ফুল",
  "paper-boat": "কাগজের নৌকা",
  "ada-cha": "আদা চা",
  muri: "চানাচুর-মুড়ি",
  candle: "মোমবাতি",
  "golper-boi": "গল্পের বই",
} as const;

export type ItemId = keyof typeof items;
export type Mood = "smile" | "sleepy" | "grin" | "calm";
type Line = { when: readonly ItemId[]; text: string };

/*
 * Packs are about shared everyday life, never about a region, religion, gender, class or body.
 * Share links store items as positions in a pack's list: once links are public, only append to a list; never reorder or delete.
 * The first 6 fill the classic card, the first 9 the 3×3 grid; the rest wait in the swap list.
 */
export const packs = [
  {
    id: "varsity", label: "ভার্সিটি স্টুডেন্ট", chip: "ভার্সিটি", color: "#2f5bd3", deep: "#1c3a91", on: "#ffffff", mood: "smile",
    badge: ["সেমিস্টার", "১ থেকে ৮"], warning: "ধার দেওয়া খাতা ফেরত আসার নিশ্চয়তা নেই।",
    items: ["khata", "canteen-cha", "photocopy", "alarm-3am", "one-strap-bag", "singara", "calculator", "tuition-taka", "pendrive", "varsity-bus", "clear-file", "charger"],
    lines: [
      { when: ["khata", "canteen-cha"], text: "খাতা বন্ধুর, চা বাকিতে — ভার্সিটি এভাবেই চলে।" },
      { when: ["alarm-3am"], text: "পুরো সেমিস্টারের পড়া এক রাতেই শেষ হয়।" },
      { when: ["tuition-taka"], text: "টিউশনির টাকায় মাসের শেষ সপ্তাহটা পার।" },
      { when: ["varsity-bus"], text: "বাস মিস মানে প্রথম ক্লাসটাও মিস।" },
    ],
    fallback: "ক্লাস যতই থাকুক, আড্ডাটা কখনো মিস হয় না।",
  },
  {
    id: "chakri", label: "নতুন চাকরি", chip: "নতুন চাকরি", color: "#c2307a", deep: "#86184f", on: "#ffffff", mood: "smile",
    badge: ["প্রবেশন", "পিরিয়ড"], warning: "বৃহস্পতিবার বিকেলে মন ডেস্কে থাকে না।",
    items: ["tiffin", "office-id", "iron", "sweets-box", "tea-flask", "laptop-bag", "inbox", "holiday-calendar", "diary-pen", "alarm-7am", "salary-sms", "shoes"],
    lines: [
      { when: ["sweets-box"], text: "জয়েনিংয়ের মিষ্টি বিলিয়েই শুরু নতুন অফিস।" },
      { when: ["tiffin"], text: "টিফিন বাটিতে বাসার রান্না, অফিসেও বাড়ির স্বাদ।" },
      { when: ["salary-sms"], text: "মাস শেষের ওই একটা মেসেজই সবচেয়ে মিষ্টি।" },
      { when: ["holiday-calendar"], text: "জয়েন করেই প্রথম কাজ: সামনের ছুটি গোনা।" },
    ],
    fallback: "নতুন ডেস্ক, নতুন মানুষ, পুরনো সেই চা।",
  },
  {
    id: "probashi", label: "প্রবাসী", chip: "প্রবাসী", color: "#d9452b", deep: "#962a17", on: "#ffffff", mood: "smile",
    badge: ["বাড়ি", "অনেক দূর"], warning: "লাগেজ খুললেই আচারের গন্ধ ছড়াতে পারে।",
    items: ["achar-jar", "video-call", "passport", "suitcase", "rice-cooker", "two-clocks", "adapter", "two-sims", "flag", "spices", "jacket", "boarding-pass"],
    lines: [
      { when: ["achar-jar", "spices"], text: "লাগেজের অর্ধেকটাই মায়ের রান্নাঘর।" },
      { when: ["video-call"], text: "ভিডিও কলেই রোজ একবার বাড়ি ঘুরে আসি।" },
      { when: ["two-clocks"], text: "হাতে এক দেশের সময়, মনে আরেক দেশের।" },
      { when: ["rice-cooker"], text: "রাইস কুকারটাই এখন সবচেয়ে কাছের দেশি।" },
    ],
    fallback: "যত দূরেই যাই, ব্যাগে একটু দেশ থাকে।",
  },
  {
    id: "baba-ma", label: "নতুন বাবা-মা", chip: "নতুন বাবা-মা", color: "#f0a020", deep: "#9a5a00", on: "#2b2135", mood: "sleepy",
    badge: ["বয়স", "০+"], warning: "ঘুম আলাদা কিনতে পাওয়া যায় না।",
    items: ["feeder", "sleepy-eyes", "diaper", "jhunjhuni", "kantha", "cold-tea", "photo-phone", "dolna", "baby-bag", "chhora-boi", "socks", "sorshe-balish"],
    lines: [
      { when: ["sleepy-eyes", "cold-tea"], text: "চা ঠান্ডা, চোখে ঘুম, তবু মুখে হাসি।" },
      { when: ["photo-phone"], text: "ফোনের গ্যালারিতে এখন একজনেরই ছবি।" },
      { when: ["sorshe-balish"], text: "সরিষার বালিশ নিয়ে বাড়ির সবার পরামর্শ চলছেই।" },
      { when: ["jhunjhuni"], text: "ঝুনঝুনির শব্দে এখন সারা বাসা জেগে থাকে।" },
    ],
    fallback: "ঘুম কম, কিন্তু ঘরভরা নতুন হাসি।",
  },
  {
    id: "eid", label: "ঈদের ছুটিতে বাড়ি", chip: "ঈদের ছুটি", color: "#21915a", deep: "#0f5c36", on: "#ffffff", mood: "grin",
    badge: ["বছরে", "দুবার"], warning: "রাস্তায় সময় লাগবে, ধৈর্য সাথে রাখো।",
    items: ["bus-ticket", "salami-khaam", "power-bank", "gift-bag", "neck-pillow", "ludu", "train-ticket", "new-clothes", "water-biscuit", "house-lock", "semai", "ghuri"],
    lines: [
      { when: ["bus-ticket", "power-bank"], text: "টিকিট হাতে, চার্জ ফুল — এবার শুধু বাড়ির পথ।" },
      { when: ["salami-khaam"], text: "খামগুলো রেডি, ছোটরা লাইনে দাঁড়াও!" },
      { when: ["ludu"], text: "ঈদের দুপুরে লুডুতে কেউ কাউকে ছাড় দেয় না।" },
      { when: ["house-lock"], text: "শহরের বাসায় তালা, মন আগেই বাড়ি পৌঁছে গেছে।" },
    ],
    fallback: "যত জ্যামই হোক, ঈদটা বাড়িতেই।",
  },
  {
    id: "brishti", label: "বৃষ্টির দিন", chip: "বৃষ্টির দিন", color: "#1f8fb3", deep: "#0d5a73", on: "#ffffff", mood: "calm",
    badge: ["আষাঢ়", "শ্রাবণ"], warning: "খিচুড়ি খেলে দুপুরে ঘুম আসতে পারে।",
    items: ["khichuri", "umbrella", "ilish", "raincoat", "sandal", "polythene-phone", "kadam", "paper-boat", "ada-cha", "muri", "candle", "golper-boi"],
    lines: [
      { when: ["khichuri", "ilish"], text: "বৃষ্টি নামলেই হাঁড়িতে খিচুড়ি, পাতে ইলিশ ভাজা।" },
      { when: ["umbrella"], text: "বাতাসে ছাতা উল্টে গেছে, এখন ভেজাই ভরসা।" },
      { when: ["polythene-phone"], text: "ফোনটা পলিথিনে শুকনো, নিজে পুরো ভেজা।" },
      { when: ["kadam"], text: "এক গুচ্ছ কদম আর জানালার ধারের বিকেল।" },
    ],
    fallback: "টিনের চালে বৃষ্টির শব্দ, আজ আর কোথাও যাওয়া নেই।",
  },
] as const satisfies ReadonlyArray<{
  id: string; label: string; chip: string; color: string; deep: string; on: string; mood: Mood;
  badge: readonly [string, string]; warning: string; items: readonly ItemId[]; lines: readonly Line[]; fallback: string;
}>;

export type Pack = (typeof packs)[number];
export type PackId = Pack["id"];
/** `items` are the visible bubbles in order: 6 for the classic card, 9 for the 3×3 grid. */
export type PackState = { pack: PackId; items: ItemId[]; name: string };

const numbers = new Intl.NumberFormat("bn-BD");
export const bn = (value: number) => numbers.format(value);
export const label = (id: ItemId) => items[id];
export const packById = (id: PackId): Pack => packs.find(pack => pack.id === id)!;
export const isPackId = (id: string): id is PackId => packs.some(pack => pack.id === id);
const packItems = (pack: PackId): readonly ItemId[] => packById(pack).items;

/** All 9 slots for a pack: the given visible items first, then the pack's unused items in list order. */
export function fillSlots(pack: PackId, visible: readonly ItemId[] = []): ItemId[] {
  const own = packItems(pack);
  const kept = [...new Set(visible)].filter(id => own.includes(id)).slice(0, GRID);
  return [...kept, ...own.filter(id => !kept.includes(id))].slice(0, GRID);
}

/** Puts `item` into slot `index`. If the item already sits in another slot (seen or hidden), the two trade places, so the pack never holds a duplicate. */
export function swapItem(slots: readonly ItemId[], index: number, item: ItemId): ItemId[] {
  if (!Number.isInteger(index) || index < 0 || index >= slots.length) throw new RangeError("এই খোপটা প্যাকেটে নেই।");
  const next = [...slots];
  const from = next.indexOf(item);
  if (from >= 0) next[from] = next[index];
  next[index] = item;
  return next;
}

/** What a bubble can become: the pack's items that are not already on show. */
export function swapOptions(pack: PackId, visible: readonly ItemId[]): ItemId[] {
  return packItems(pack).filter(id => !visible.includes(id));
}

export function cleanName(name: string) {
  // NFC first so য়/ড় typed as two code points count once; then drop control, bidi-override and angle characters so a link can't scramble the card.
  const clean = name.normalize("NFC").replace(/[\u0000-\u001f\u007f‎‏‪-‮⁦-⁩<>]/g, "").trim().replace(/\s+/g, " ");
  // Cut by code point, and never leave a dangling hasanta or joiner at the cut.
  return [...clean].slice(0, MAX_NAME_LENGTH).join("").replace(/[্‌‍\s]+$/, "");
}

export function shareHash({ pack, items: visible, name }: PackState) {
  const own = packItems(pack);
  const params = new URLSearchParams({ p: pack, i: visible.map(id => own.indexOf(id)).join(",") });
  const shownName = cleanName(name);
  if (shownName) params.set("n", shownName);
  return "#" + params.toString();
}

export function parseShareHash(hash: string): PackState | null {
  const params = new URLSearchParams(hash.replace(/^#/, ""));
  const pack = params.get("p") ?? "";
  if (!isPackId(pack)) return null;
  const own = packItems(pack);
  const raw = (params.get("i") ?? "").split(",");
  if (raw.length !== CLASSIC && raw.length !== GRID) return null;
  if (!raw.every(part => /^\d{1,2}$/.test(part))) return null;
  const indexes = raw.map(Number);
  if (indexes.some(index => index >= own.length) || new Set(indexes).size !== indexes.length) return null;
  return { pack, items: indexes.map(index => own[index]), name: cleanName(params.get("n") ?? "") };
}

/** One warm line chosen from what is actually in the pack. */
export function packLine(pack: PackId, visible: readonly ItemId[]) {
  const chosen = packById(pack);
  const rules: readonly Line[] = chosen.lines;
  return rules.find(rule => rule.when.every(id => visible.includes(id)))?.text ?? chosen.fallback;
}

export type CardContent = {
  pack: Pack;
  title: string;
  items: ItemId[];
  line: string;
  match: string;
};

export function createCard(own: PackState, friend?: PackState | null): CardContent {
  const pack = packById(own.pack);
  const visible = own.items.filter(id => (pack.items as readonly ItemId[]).includes(id));
  const name = cleanName(own.name);
  let match = "";
  if (friend && friend.pack === own.pack) {
    const common = friend.items.filter(id => visible.includes(id)).length;
    const who = friend.name ? possessive(friend.name) : "বন্ধুর";
    match = common ? `${who} প্যাকেটের সাথে ${bn(common)}টা মিলে গেছে` : `${who} প্যাকেটের সাথে একটাও মেলেনি!`;
  }
  return { pack, title: `${name ? possessive(name) : "আমার"} স্টার্টার প্যাক`, items: visible, line: packLine(own.pack, visible), match };
}

/** Anonymous counts: one marker per pack (how many people voted that pack) plus pack.item for each item. Fixed ids only. */
export const tallyIds = packs.flatMap(pack => [pack.id, ...pack.items.map(id => `${pack.id}.${id}`)]);
export const tallyVote = ({ pack, items: visible }: Pick<PackState, "pack" | "items">) => [pack, ...visible.map(id => `${pack}.${id}`)];

export { possessive };

import { possessive } from "../../../shared/bangla";

export const MAX_NAME_LENGTH = 20;
export const PER_SET = 10;
/** Each page holds this many words of each kind; the percentages assume it. */
export const PER_KIND = 5;

export type Kind = "genz" | "elder";
export type Answer = 0 | 1 | 2;
export type Entry = {
  id: string;
  word: string;
  /** Shorter label for the two-column card, where the full phrase won't fit. */
  short?: string;
  kind: Kind;
  options: readonly [string, string, string];
  answer: Answer;
  /** The misreading the other generation falls for (a literal or sound-alike reading). */
  trap: Answer;
  /** Shown when you fall for the trap; names the misreading, never the right meaning, so it is safe on the card. */
  oops: string;
  meaning: string;
  example: string;
  /** How the other generation would say the same thing. */
  bridge: string;
  /** Where to check it; null when it's a household saying no dictionary or article covers. */
  source: { label: string; url: string } | null;
};

/** The dictionary stores ড় ঢ় য় precomposed, but NFC splits them; rebuild them (by escape) before searching. */
export function dictionaryUrl(head: string) {
  const query = head.normalize("NFC").replace(/[\u09a1\u09a2\u09af]\u09bc/g, pair => ({ "\u09a1": "\u09dc", "\u09a2": "\u09dd", "\u09af": "\u09df" })[pair[0]]!);
  return "https://accessibledictionary.gov.bd/bengali-to-bengali/?q=" + encodeURIComponent(query);
}

const academy = (head: string) => ({ label: "বাংলা একাডেমির অভিধানে দেখো", url: dictionaryUrl(head) });
const PROTHOM_ALO_GENZ = { label: "সূত্র: প্রথম আলো", url: "https://www.prothomalo.com/lifestyle/ch4a02d8l9" };
const DAILY_STAR_GENZ = { label: "সূত্র: ডেইলি স্টার বাংলা", url: "https://bangla.thedailystar.net/life-living/news-607001" };

// ── Sources ──────────────────────────────────────────────────────────────────────────────────────────────────────────
// Elders' words, checked Oct 2026 against the Bangla Academy dictionary as served by the government's Accessible Dictionary
// (https://accessibledictionary.gov.bd/bengali-to-bengali/?q=<headword>). Headword → sense:
//   আক্কেল → আক্কেল গুড়ুম: হতবুদ্ধিতা; আকস্মিক ভয়ে বুদ্ধিলোপ; স্তম্ভিত; হতবুদ্ধি
//   গোল্লা → (listed under উৎসন্ন/উচ্ছন্ন, অধঃ, জাহান্নাম) গোল্লায় যাওয়া: উচ্ছন্নে যাওয়া; অধঃপাতে যাওয়া; খারাপ হওয়া
//   ফুটানি → জাঁক; আড়ম্বর প্রকাশ; অশোভন বাবুগিরি; অহঙ্কার; বড়াই
//   ধানাইপানাই → অসংবদ্ধ কথা; আবোলতাবোল; নানা অপ্রাসঙ্গিক উক্তি
//   ইঁচড় → ইঁচড়ে পাকা: অকালপক্ব; (আলঙ্কারিক) ফাজিল, জেঠা, বাচাল (ইঁচড় = কাঁচা কাঁঠাল)
//   নাক → নাকে সরষের তেল দিয়ে ঘুমানো: নিশ্চিন্ত হওয়া; নিরুদ্বেগ অবস্থায় দিন কাটানো
//   লেফাফা → লেফাফাদুরস্ত: বাইরের আদবকায়দায় ত্রুটিহীন কিন্তু আসলে ফাঁকিবাজ; কপট (লেফাফা = খাম)
//   আদিখ্যেতা → ভান; ন্যাকামি; বাড়াবাড়ি; আতিশয্য
//   লাট → লাটসাহেব: গভর্নর; (ব্যঙ্গার্থ) হর্তাকর্তা, যেমন “হুকুম দেখ না, যেন লাট সাহেব”
//   “টাকা কি গাছে ধরে?” is a household saying, not a dictionary entry (সাধারণ ব্যবহারে).
// Gen Z slang meanings are as commonly used (সাধারণ ব্যবহারে); slang drifts, so each cites a Bangla article where one exists:
//   গোট, সাস, ক্যাপ/নো ক্যাপ, ফ্লেক্স, ডেলুলু, রেড ফ্ল্যাগ: প্রথম আলো, “জেন–জির ব্যবহৃত শব্দগুলোর অর্থ জানেন তো?” (মৃণাল সাহা, ১২ আগস্ট ২০২৪)
//     https://www.prothomalo.com/lifestyle/ch4a02d8l9 ; GOAT also in https://www.prothomalo.com/lifestyle/lr6euqrl8r (১১ আগস্ট ২০২৩)
//   ফ্লেক্স, ক্যাপ, লো-কি: ডেইলি স্টার বাংলা, “জেন জি’র যত শব্দ” (অনিন্দিতা চৌধুরী, ১৯ আগস্ট ২০২৪) https://bangla.thedailystar.net/life-living/news-607001
//   ডেলুলু: ডেইলি স্টার বাংলা, “‘ডেলুলু’ বলতে জেন-জি আসলে কী বোঝায়?” (জারীন তাসনিম, ১৫ জুলাই ২০২৬) https://bangla.thedailystar.net/life-living/news-3943316
//   প্যারা: আজকের পত্রিকা, “শব্দের আড়ালে গল্প: প্যারা” (রাজীব কুমার সাহা, ১৩ নভেম্বর ২০২৩) https://www.ajkerpatrika.com/epaper/ajp4t2hy0y33s
//     and প্রথম আলো, “যে কারণে ‘প্যারা’ খাই” (২০১৮)
//   স্লে, ক্রিঞ্জ: no Bangla article found; meanings as commonly used (English slang: slay = do brilliantly; cringe = embarrassing to watch).
// Left out on purpose: crude, sexual or romantic slang (রিজ, ক্রাশ), slurs, body-shaming (ফেস কার্ড), gendered digs (সিম্প, পুকি),
// anything political (2024 movement slogans included), deities, and idioms already in বাগধারার ছবি (tools/bagdhara).
// FOLLOW-UP: two reviewers from each generation should check every meaning, example and trap before launch.
// Share links store answers by position: once links are public, never edit, reorder or swap a set's entries or options. Add sets instead.
export const sets = [
  {
    id: "s1", label: "প্রথম পাতা",
    entries: [
      { id: "slay", word: "স্লে", kind: "genz", options: ["কাউকে মেরে ফেলা", "দারুণভাবে করে দেখানো, ফাটিয়ে দেওয়া", "স্লেট-পেনসিলে লেখা"], answer: 1, trap: 0,
        oops: "“স্লে” শুনে খুনখারাবি ভেবেছিলে? একদম আব্বু-আম্মুর মতো!",
        meaning: "কোনো কিছু দারুণভাবে করা বা দুর্দান্ত দেখানো। ইংরেজিতে slay মানে মেরে ফেলা, কিন্তু এখানে এটা প্রশংসা।",
        example: "আম্মুর রাঁধা পায়েস এক চামচ খেয়েই ছোট বোন বলল, আম্মু, স্লে!", bridge: "ফাটাফাটি! একদম ফার্স্টক্লাস!", source: null },
      { id: "taka-gachhe", word: "টাকা কি গাছে ধরে?", short: "টাকা কি গাছে ধরে", kind: "elder", options: ["টাকা সহজে আসে না, বুঝেশুনে খরচ করো", "গাছ লাগালে একদিন টাকা আসবে", "টাকা জমাতে ব্যাংকে যাও"], answer: 0, trap: 1,
        oops: "টাকার গাছ লাগাতে চেয়েছিলে? আব্বু-আম্মু শুনলে হাসবেন!",
        meaning: "টাকা আপনা-আপনি আসে না, খেটে রোজগার করতে হয়, তাই হিসাব করে খরচ করো। নতুন কিছু চাইলেই যে প্রশ্নটা শুনতে হয়।",
        example: "নতুন জুতার কথা তুলতেই আব্বু চশমার ওপর দিয়ে তাকালেন, টাকা কি গাছে ধরে?", bridge: "বাজেট নাই, ব্রো।", source: null },
      { id: "goat", word: "গোট", kind: "genz", options: ["আস্ত একটা ছাগল", "খেলার মাঠের গোলপোস্ট", "সর্বকালের সেরা"], answer: 2, trap: 0,
        oops: "“গোট” শুনে ছাগল ভেবেছিলে! খাঁটি আব্বু-আম্মু।",
        meaning: "ইংরেজি GOAT, মানে Greatest Of All Time: সর্বকালের সেরা। ইংরেজিতে goat মানে ছাগল হলেও এখানে সবচেয়ে বড় প্রশংসা।",
        example: "মোড়ের দোকানের দুধ-চা? গোট! শহরের কোনো ক্যাফে ওর ধারেকাছে নেই।", bridge: "সেরার সেরা, ওস্তাদের ওস্তাদ।", source: PROTHOM_ALO_GENZ },
      { id: "akkel-gurum", word: "আক্কেল গুড়ুম", kind: "elder", options: ["বুদ্ধিতে সবাইকে টেক্কা দেওয়া", "আক্কেলদাঁত ওঠার ব্যথা", "হঠাৎ কিছু দেখে হতভম্ব হয়ে যাওয়া"], answer: 2, trap: 1,
        oops: "আক্কেল গুড়ুম শুনে আক্কেলদাঁতের কথা ভেবেছিলে? খাঁটি জেন-জি!",
        meaning: "হঠাৎ কিছু দেখে বা শুনে হতবুদ্ধি হয়ে যাওয়া, একদম থ।",
        example: "রেজাল্ট কার্ডে অঙ্কে ৯৫ দেখে আব্বুর আক্কেল গুড়ুম, ভাবলেন অন্য কারও কার্ড।", bridge: "মাথা পুরা হ্যাং!", source: academy("আক্কেল") },
      { id: "para", word: "প্যারা", kind: "genz", options: ["ঝামেলা, মানসিক চাপ", "বইয়ের একটা অনুচ্ছেদ", "সরিষাবাড়ীর প্যারা সন্দেশ"], answer: 0, trap: 1,
        oops: "“প্যারা” শুনে বইয়ের অনুচ্ছেদ ভেবেছিলে? একদম দাদির মতো!",
        meaning: "ঝামেলা, যন্ত্রণা, মানসিক চাপ। “প্যারা খাওয়া” মানে চাপ নেওয়া, “প্যারা নাই” মানে চিন্তা নেই।",
        example: "পরীক্ষার আগের রাতে ভাইয়া বলল, সিলেবাস দেখে প্যারা লাগছে। দাদি জিজ্ঞেস করলেন, কোন প্যারাটা পড়া বাকি?", bridge: "ঝক্কি-ঝামেলা।",
        source: { label: "সূত্র: আজকের পত্রিকা", url: "https://www.ajkerpatrika.com/epaper/ajp4t2hy0y33s" } },
      { id: "golla", word: "গোল্লায় যাওয়া", kind: "elder", options: ["রসগোল্লা খেতে যাওয়া", "একদম বখে যাওয়া, নষ্ট হয়ে যাওয়া", "খেলায় গোল দিতে যাওয়া"], answer: 1, trap: 0,
        oops: "গোল্লায় যাওয়া শুনে রসগোল্লার কথা ভেবেছিলে? মিষ্টি ভুল!",
        meaning: "একদম বখে যাওয়া, নষ্ট হয়ে যাওয়া, উচ্ছন্নে যাওয়া। আব্বু-আম্মুর হুঁশিয়ারির পুরোনো শব্দ।",
        example: "সারাদিন ফোন টিপলে পড়াশোনা গোল্লায় যাবে! প্রায় সব বাসায় এই কথাটা একবার না একবার বাজে।", bridge: "লাইফ শেষ, পুরা গেম ওভার।", source: academy("গোল্লা") },
      { id: "sus", word: "সাস", kind: "genz", options: ["কেমন যেন সন্দেহজনক", "টমেটো সস", "সাসপেন্সে ভরা সিনেমা"], answer: 0, trap: 1,
        oops: "“সাস” শুনে টমেটো সস ভেবেছিলে? আব্বু-আম্মুর দলে স্বাগতম!",
        meaning: "ইংরেজি suspicious-এর ছোট রূপ, মানে সন্দেহজনক। কারও কথা বা কাজ ঠিক মিলছে না মনে হলে বলে।",
        example: "রাত এগারোটায় ছোট ভাই নিজে থেকে প্লেট ধুয়ে রাখছে? সাস! নিশ্চয়ই কিছু চাইবে।", bridge: "ঘাপলা আছে মনে হচ্ছে।", source: PROTHOM_ALO_GENZ },
      { id: "phutani", word: "ফুটানি", kind: "elder", options: ["বড়াই, লোক-দেখানো জাঁক", "ভাত ফোটানো", "কাপড়ে ফুটো হয়ে যাওয়া"], answer: 0, trap: 1,
        oops: "ফুটানি শুনে ভাত ফোটানোর কথা ভেবেছিলে? চুলাটা নিভিয়ে আসো!",
        meaning: "জাঁক, বড়াই, লোক-দেখানো বাবুগিরি। “এত ফুটানি কিসের?” শুনলেই বুঝবে, আম্মু খুশি না।",
        example: "নতুন ঘড়ি পরে হাত নেড়ে নেড়ে কথা বলছিল, খালা বললেন, থাক, এত ফুটানি দেখাতে হবে না।", bridge: "ফ্লেক্স।", source: academy("ফুটানি") },
      { id: "cringe", word: "ক্রিঞ্জ", kind: "genz", options: ["দারুণ মজার, হাসতে হাসতে শেষ", "দেখে নিজেরই লজ্জা লাগে এমন", "ক্রিম দেওয়া বিস্কুট"], answer: 1, trap: 0,
        oops: "“ক্রিঞ্জ”কে মজার জিনিস ভেবেছিলে? ছোটরা শুনলে মাথায় হাত দেবে!",
        meaning: "এমন কাণ্ড, যা দেখে বা শুনে অস্বস্তিতে নিজেরই লজ্জা লাগে, কাণ্ডটা অন্য কারও হলেও।",
        example: "পাঁচ বছর আগের নিজের ফেসবুক পোস্ট পড়ে নিজেরই ক্রিঞ্জ লাগল।", bridge: "দেখে লজ্জায় মাথা কাটা যায়।", source: null },
      { id: "dhanaipanai", word: "ধানাইপানাই", kind: "elder", options: ["ধান আর পানির হিসাব", "খুব মিষ্টি করে গল্প বলা", "আসল কথা ঘুরিয়ে আবোলতাবোল বলা"], answer: 2, trap: 0,
        oops: "ধানাইপানাইয়ে ধান-পানির হিসাব খুঁজেছিলে? খাঁটি জেন-জি!",
        meaning: "অসংলগ্ন, আবোলতাবোল কথা; আসল কথায় না এসে এদিক-ওদিক ঘোরানো।",
        example: "দেরিতে ফিরে জ্যাম, ফোনের চার্জ, বন্ধুর জন্মদিন… আম্মু থামিয়ে দিলেন, ধানাইপানাই রাখো, কয়টা বাজে দেখো!", bridge: "আজাইরা ইয়াপিং।", source: academy("ধানাইপানাই") },
    ],
  },
  {
    id: "s2", label: "দ্বিতীয় পাতা",
    entries: [
      { id: "flex", word: "ফ্লেক্স", kind: "genz", options: ["ব্যায়ামে পেশি ফোলানো", "নিজের জিনিস বা অর্জন নিয়ে জাহির করা", "দোকানের সামনের ফ্লেক্স ব্যানার"], answer: 1, trap: 2,
        oops: "“ফ্লেক্স” শুনে মোড়ের ব্যানার ভেবেছিলে? খাঁটি আব্বু-আম্মু!",
        meaning: "নিজের টাকা, জিনিস বা অর্জন নিয়ে লোক-দেখানো জাহির। কখনো মজা করে নিজের ছোট্ট খুশিকেও বলে।",
        example: "প্রথম বেতনে আব্বু-আম্মুকে নিয়ে রেস্টুরেন্টে খেয়ে ছবি দিল, লিখল: ছোট্ট একটা ফ্লেক্স।", bridge: "ফুটানি।", source: PROTHOM_ALO_GENZ },
      { id: "inchore-paka", word: "ইঁচড়ে পাকা", kind: "elder", options: ["বয়সের আগেই বেশি পাকা, ফাজিল", "কাঁচা কাঁঠাল পেকে যাওয়া", "খুব মেধাবী, ক্লাসের ফার্স্ট বয়"], answer: 0, trap: 1,
        oops: "ইঁচড়ে পাকা শুনে কাঁঠাল পাকার কথা ভেবেছিলে? নানাবাড়ির গাছে খোঁজো!",
        meaning: "বয়সের তুলনায় বেশি পাকা, অকালপক্ব; বড়দের মতো পাকা পাকা কথা বলে যে। ইঁচড় মানে কাঁচা কাঁঠাল।",
        example: "সাত বছরের ভাগনে নানাকে ফোনের সেটিং শেখাচ্ছে আর বলছে, তোমরা কিছুই বোঝো না। নানি হেসে বললেন, ইঁচড়ে পাকা!", bridge: "ওভারস্মার্ট।", source: academy("ইঁচড়") },
      { id: "delulu", word: "ডেলুলু", kind: "genz", options: ["আদুরে ডাকনাম, যেমন লুলু", "অবাস্তব কল্পনায় ভেসে থাকা", "দিল্লির লাড্ডু"], answer: 1, trap: 2,
        oops: "“ডেলুলু” শুনে দিল্লির লাড্ডু ভেবেছিলে? মিষ্টি ভুল, তবে ভুল!",
        meaning: "ইংরেজি delusional থেকে: কিছু হওয়ার আগেই মনে মনে বড় গল্প সাজিয়ে ফেলা। প্রায়ই নিজেকে নিয়ে মজা করে বলা।",
        example: "পাড়ার ম্যাচে দুটো ছক্কা মেরেই জাতীয় দলের জার্সির মাপ ঠিক করছে, পুরা ডেলুলু!", bridge: "আকাশকুসুম কল্পনা।",
        source: { label: "সূত্র: ডেইলি স্টার বাংলা", url: "https://bangla.thedailystar.net/life-living/news-3943316" } },
      { id: "nake-tel", word: "নাকে সরষের তেল দিয়ে ঘুমানো", short: "নাকে সরষের তেল", kind: "elder", options: ["কোনো চিন্তা না করে নিশ্চিন্তে থাকা", "সর্দি সারানোর ঘরোয়া টোটকা", "খুব ভোরে ঘুম থেকে ওঠা"], answer: 0, trap: 1,
        oops: "নাকে সরষের তেল শুনে সর্দির টোটকা ভেবেছিলে? খাঁটি জেন-জি!",
        meaning: "কোনো দুশ্চিন্তা না করে নিশ্চিন্তে থাকা; দায়িত্ব ভুলে আরামে দিন কাটানো।",
        example: "কাল পরীক্ষা, আর তুমি নাকে সরষের তেল দিয়ে ঘুমাচ্ছ? বইটা খোলো!", bridge: "ফুল চিল মোডে।", source: academy("নাক") },
      { id: "low-key", word: "লো-কি", kind: "genz", options: ["চাবির গোছা হারানো", "গলা নামিয়ে গান গাওয়া", "চুপিচুপি, মনে মনে একটু"], answer: 2, trap: 0,
        oops: "“লো-কি” শুনে চাবির গোছা খুঁজছিলে? চাবি টেবিলের ওপরেই আছে!",
        meaning: "চুপিচুপি, প্রকাশ্যে না; মনে মনে একটু। “লো-কি খুশি” মানে ভেতরে ভেতরে খুশি, বাইরে দেখাচ্ছে না।",
        example: "আম্মুর পায়েসের প্রশংসায় সবাই পঞ্চমুখ, আম্মু মুখে কিছু বলছেন না, তবে লো-কি খুব খুশি।", bridge: "তলে তলে।", source: DAILY_STAR_GENZ },
      { id: "lefafa", word: "লেফাফাদুরস্ত", kind: "elder", options: ["চিঠির খামে ঠিকঠাক আঠা লাগানো", "বাইরে একদম কেতাদুরস্ত, ভেতরে ফাঁকি", "খুব দুরন্ত, চঞ্চল"], answer: 1, trap: 2,
        oops: "লেফাফাদুরস্ত শুনে দুরন্ত ভেবেছিলে? দাদা শুনলে হাসবেন!",
        meaning: "বাইরের চালচলন আর আদবকায়দায় একদম নিখুঁত, কিন্তু আসলে ফাঁকিবাজ। লেফাফা মানে খাম: খামটা ঝকঝকে, ভেতরে কিছু নেই।",
        example: "স্যুট-টাই পরে সবার আগে অফিসে হাজির, ফাইল খুললে কাজ শূন্য। দাদার ভাষায়, লেফাফাদুরস্ত।", bridge: "লুক দশে দশ, কাজ দশে শূন্য।", source: academy("লেফাফা") },
      { id: "no-cap", word: "নো ক্যাপ", kind: "genz", options: ["সত্যি বলছি, একটুও বানিয়ে না", "মাথায় টুপি নেই", "বোতলের ছিপি খোলা"], answer: 0, trap: 1,
        oops: "“নো ক্যাপ” শুনে টুপির খোঁজ করেছিলে? খাঁটি আব্বু-আম্মু!",
        meaning: "জেন-জির ভাষায় “ক্যাপ” মানে মিথ্যা, তাই “নো ক্যাপ” মানে সত্যি বলছি, বানিয়ে না।",
        example: "নানুর হাতের ভাপা পিঠা দুনিয়ার সেরা, নো ক্যাপ।", bridge: "তিন সত্যি!", source: PROTHOM_ALO_GENZ },
      { id: "adikhyeta", word: "আদিখ্যেতা", kind: "elder", options: ["আদি যুগের গল্প", "খুব আদরের ডাকনাম", "অতিরিক্ত ঢং, বাড়াবাড়ি"], answer: 2, trap: 0,
        oops: "আদিখ্যেতা শুনে আদি যুগের কথা ভেবেছিলে? নানি শুনলে হাসবেন!",
        meaning: "ভান, ন্যাকামি; কোনো কিছু নিয়ে মাত্রাছাড়া বাড়াবাড়ি।",
        example: "দুই ফোঁটা বৃষ্টিতে ছাতা, রেইনকোট, গামবুট! নানি বললেন, আদিখ্যেতা দেখে বাঁচি না।", bridge: "ওভার অ্যাক্টিং, ফুল ড্রামা।", source: academy("আদিখ্যেতা") },
      { id: "red-flag", word: "রেড ফ্ল্যাগ", kind: "genz", options: ["রেফারির লাল কার্ড", "সাবধান! খারাপ কিছুর লক্ষণ", "খুশির খবরের সংকেত"], answer: 1, trap: 0,
        oops: "“রেড ফ্ল্যাগ” শুনে মাঠের লাল কার্ড ভেবেছিলে? খেলাটা এখানে অন্য!",
        meaning: "এমন আচরণ বা লক্ষণ, যা দেখে সাবধান হওয়া উচিত; সামনে ঝামেলা আসতে পারে।",
        example: "দোকানদার বলল, ভাই, রসিদ লাগবে না, কিছুই নষ্ট হবে না। এটাই তো রেড ফ্ল্যাগ!", bridge: "লক্ষণ সুবিধার না।", source: PROTHOM_ALO_GENZ },
      { id: "lat-saheb", word: "লাটসাহেব", kind: "elder", options: ["খুব লাজুক, চুপচাপ মানুষ", "ঘুড়ির লাটাই যার হাতে", "হুকুম চালায়, নিজেকে বিরাট কিছু ভাবে"], answer: 2, trap: 1,
        oops: "লাটসাহেব শুনে ঘুড়ির লাটাই ভেবেছিলে? খাঁটি জেন-জি!",
        meaning: "আসলে ব্রিটিশ আমলের গভর্নর (লাট)। ব্যঙ্গ করে বলা হয় তাকে, যে নিজেকে হর্তাকর্তা ভেবে সবার ওপর হুকুম চালায়।",
        example: "শুয়ে শুয়ে এক গ্লাস পানি চাইতেই আম্মু বললেন, নিজে উঠে নাও, লাটসাহেব!", bridge: "নিজেকে বস ভাবা, মেইন ক্যারেক্টার ভাব।", source: academy("লাট") },
    ],
  },
] as const satisfies ReadonlyArray<{ id: string; label: string; entries: readonly Entry[] }>;

export type SetId = (typeof sets)[number]["id"];
export type Shared = { set: SetId; answers: Answer[]; name: string };

const numbers = new Intl.NumberFormat("bn-BD");
export const bn = (value: number) => numbers.format(value);

export const isSetId = (id: string): id is SetId => sets.some(item => item.id === id);
export const setById = (id: SetId) => sets.find(item => item.id === id)!;
export const entriesOf = (id: SetId): readonly Entry[] => setById(id).entries;
export const allEntries: readonly Entry[] = sets.flatMap((item): readonly Entry[] => item.entries);
export const kindLabel = (kind: Kind) => kind === "genz" ? "জেন-জির শব্দ" : "আব্বু-আম্মুর কথা";

/** Anonymous tally ids: "seen:<set>" counts finished pages, each word id counts a right answer. */
export const tallyIds = sets.flatMap(item => [`seen:${item.id}`, ...item.entries.map(entry => entry.id)]);

export function cleanName(name: string) {
  // Strip control and bidi-override characters so a shared link can't scramble the card text.
  return name.normalize("NFC").replace(/[\u0000-\u001f\u007f‎‏‪-‮⁦-⁩]/g, "").trim().replace(/\s+/g, " ").slice(0, MAX_NAME_LENGTH);
}

/** Which answers were right, recomputed from the entries; a score in a link is never trusted. */
export function marks(set: SetId, answers: readonly Answer[]) {
  return entriesOf(set).map((entry, index) => answers[index] === undefined ? null : answers[index] === entry.answer);
}

export type Split = { genzRight: number; elderRight: number; total: number; genzPct: number; elderPct: number; lean: Kind | "even" };

/**
 * জেন-জি % = right Gen Z words ÷ (right Gen Z words + right elders' words) × 100, rounded; আব্বু-আম্মু % is the rest.
 * Nothing right on either side is an even 50–50.
 */
export function split(set: SetId, answers: readonly Answer[]): Split {
  const hits = marks(set, answers);
  const count = (kind: Kind) => entriesOf(set).filter((entry, index) => entry.kind === kind && hits[index]).length;
  const genzRight = count("genz"), elderRight = count("elder"), total = genzRight + elderRight;
  const genzPct = total ? Math.round((genzRight / total) * 100) : 50;
  return { genzRight, elderRight, total, genzPct, elderPct: 100 - genzPct, lean: genzPct > 50 ? "genz" : genzPct < 50 ? "elder" : "even" };
}

export function verdict({ genzRight, elderRight, total, genzPct, elderPct }: Split) {
  if (genzRight >= 4 && elderRight >= 4) return "দুই প্রজন্মের দোভাষী";
  if (total <= 2) return "অভিধানটা আবার খোলো";
  if (genzPct >= 70) return "খাঁটি জেন-জি";
  if (elderPct >= 70) return "খাঁটি আব্বু-আম্মু";
  return "মাঝখানের মিলেনিয়াল";
}

export const splitText = ({ genzPct, elderPct }: Split) => `${bn(genzPct)}% জেন-জি, ${bn(elderPct)}% আব্বু-আম্মু`;

/** The line on the result and card, chosen from what was answered. Never reveals a right meaning. */
export function humanLine(set: SetId, answers: readonly Answer[]) {
  const result = split(set, answers);
  if (result.total === PER_SET) return "দশে দশ! খাবার টেবিলে এখন তুমিই দুই প্রজন্মের দোভাষী।";
  const fooled = entriesOf(set).find((entry, index) => answers[index] === entry.trap);
  if (fooled) return fooled.oops;
  if (result.genzRight >= 4 && result.elderRight >= 4) return "দুই দিকের ভাষাই চেনো। আব্বু-আম্মু আর ছোটদের মাঝে তুমিই সেতু।";
  if (result.total <= 2) return "দুই প্রজন্মের কেউই তোমাকে দলে নিতে পারছে না! অভিধানটা আরেকবার খোলো।";
  if (result.lean === "genz") return "জেন-জির ভাষায় তুমি পাকা, এবার আব্বু-আম্মুর কথাগুলো একটু কান পেতে শোনো।";
  if (result.lean === "elder") return "আব্বু-আম্মুর কথা তোমার মুখস্থ, জেন-জির শব্দে এখনো একটু কাঁচা।";
  return "ঠিক মাঝখানে! দুই প্রজন্মের আড্ডাতেই তোমার জায়গা আছে।";
}

/** The formula with this player's own numbers, shown under the result. */
export function formula({ genzRight, elderRight, total, genzPct, elderPct }: Split) {
  const counts = `জেন-জির ${bn(PER_KIND)}টা শব্দের মধ্যে পেরেছ ${bn(genzRight)}টা, আব্বু-আম্মুর ${bn(PER_KIND)}টার মধ্যে ${bn(elderRight)}টা।`;
  if (!total) return `${counts} দুই দিকেই একটাও মেলেনি, তাই ৫০-৫০।`;
  return `${counts} জেন-জি = ${bn(genzRight)} ÷ (${bn(genzRight)} + ${bn(elderRight)}) × ১০০ = ${bn(genzPct)}%, বাকি ${bn(elderPct)}% আব্বু-আম্মু।`;
}

/** Who the challenge goes to: the generation you understood less. */
export function sendTo({ lean }: Split) {
  return lean === "genz" ? "আব্বু-আম্মুকে পাঠাও" : lean === "elder" ? "ছোটদের পাঠাও" : "আব্বু-আম্মু আর ছোটদের পাঠাও";
}

export function shareHash({ set, answers, name }: Shared) {
  const params = new URLSearchParams({ set, a: answers.join("") });
  const shown = cleanName(name);
  if (shown) params.set("n", shown);
  return "#" + params.toString();
}

/** Only a finished page (10 digits 0–2) from the fixed list counts as a shared result. */
export function parseShareHash(hash: string): Shared | null {
  const params = new URLSearchParams(hash.replace(/^#/, ""));
  const set = params.get("set") ?? "";
  const code = params.get("a") ?? "";
  if (!isSetId(set) || !/^[0-2]{10}$/.test(code)) return null;
  return { set, answers: [...code].map(Number) as Answer[], name: cleanName(params.get("n") ?? "") };
}

const who = (shared: Shared) => shared.name || "তোমার বন্ধু";

/** Facebook caption: the split and an invitation to the other generation, never a meaning. */
export function caption(shared: Shared, friend?: Shared | null) {
  const result = split(shared.set, shared.answers);
  const vs = friend && friend.set === shared.set ? ` ${friend.name ? possessive(friend.name) : "বন্ধুর"} ${bn(split(friend.set, friend.answers).genzPct)}% জেন-জি।` : "";
  const ask = result.lean === "genz" ? "আব্বু-আম্মু, তোমরা কয়টা পারো দেখি?" : result.lean === "elder" ? "ছোটরা, তোমরা পারবে তো?" : "তুমি কোন প্রজন্মের ভাষা বোঝো?";
  return `প্রজন্মের অভিধানের ১০টা শব্দে আমি ${splitText(result)}, ${verdict(result)}!${vs} ${ask}`;
}

/** The your-turn banner on a shared link, rescored from the answers. */
export function friendBanner(friend: Shared) {
  const result = split(friend.set, friend.answers);
  const dare = result.lean === "genz" ? `${who(friend)} জেন-জির শব্দে পাকা, আব্বু-আম্মুর কথায় তুমি পারবে তো?`
    : result.lean === "elder" ? `${who(friend)} আব্বু-আম্মুর কথায় পাকা, জেন-জির শব্দে তুমি পারবে তো?`
    : "দেখো তো তুমি কোন দিকে হেলে আছ।";
  return { title: `${who(friend)} ${splitText(result)}। এবার তোমার পালা!`, sub: `${dare} একই ১০টা শব্দ; কে কী বেছেছে, তোমার শেষ হওয়ার আগে দেখাবে না।` };
}

export function versusLine(own: Shared, friend: Shared) {
  const mine = split(own.set, own.answers), theirs = split(friend.set, friend.answers);
  if (mine.lean !== theirs.lean && mine.lean !== "even" && theirs.lean !== "even") return "দুজন দুই প্রজন্মের দিকে! একসাথে বসলে পুরো অভিধান।";
  if (mine.total > theirs.total) return `দশে ${bn(mine.total)} বনাম ${bn(theirs.total)}, তুমি এগিয়ে! লিংকটা ফেরত পাঠাও।`;
  if (mine.total < theirs.total) return `দশে ${bn(mine.total)} বনাম ${bn(theirs.total)}, এবার ${who(friend)} এগিয়ে। আরেক পাতায় শোধ নাও!`;
  return "দুজনেরই সমান নম্বর! এক অভিধানের দুই পাতা।";
}

export { possessive };

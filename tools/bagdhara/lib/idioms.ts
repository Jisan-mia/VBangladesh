import { possessive } from "../../../shared/bangla";

export const MAX_NAME_LENGTH = 20;
export const PER_SET = 10;

export type IdiomId =
  | "bheja-biral" | "oronne-rodon" | "kanthaler-amsotto" | "bhuter-mukhe" | "tele-begune"
  | "okal-kushmando" | "jilapir-pach" | "gure-bali" | "pukur-churi" | "akash-theke-pora"
  | "gachhe-kanthal" | "byanger-sordi" | "gachhe-tule-moi" | "chinir-bolod" | "saper-pach-pa"
  | "shak-diye-mach" | "amra-kather-dheki" | "aday-kanchkolay" | "bina-meghe" | "dumurer-ful";
export type Answer = 0 | 1 | 2;
export type Idiom = {
  id: IdiomId;
  idiom: string;
  /** What the drawing shows, for screen readers. Literal, never the meaning. */
  scene: string;
  options: readonly [string, string, string];
  answer: Answer;
  /** The option that just reads the picture literally; falling for it drives the human line. */
  trap: Answer;
  /** Shown after the answer, paraphrasing the dictionary sense. */
  meaning: string;
  example: string;
  /** Headword under which the Bangla Academy dictionary lists the idiom. */
  head: string;
};

// Meanings checked Oct 2026 against the Bangla Academy dictionary, as served by the government's Accessible Dictionary
// ("এই অভিধানের ডাটাবেজটি বাংলা একাডেমি থেকে প্রকাশিত অভিধানের ভিত্তিতে তৈরি"): https://accessibledictionary.gov.bd/bengali-to-bengali/?q=<headword>
// The dictionary entry quoted for each idiom (headword → sense):
//   ভিজে → ভিজা/ভিজে বিড়াল: দেখতে নিরীহ হলেও প্রকৃতপক্ষে অনিষ্টকারী দুষ্টু লোক; কুমতলববাজ
//   অরণ্য → অরণ্যে রোদন: বৃথা ক্রন্দন; বৃথা অনুনয়-বিনয়
//   কাঁঠাল → কাঁঠালের আমসত্ত্ব: অসম্ভব বস্তু · গাছে কাঁঠাল গোঁফে তেল: অপ্রাপ্ত বস্তুকে প্রাপ্ত কল্পনা করে পরিকল্পনা
//   ভূত → ভূতের মুখে রাম নাম: স্বভাব-বিরুদ্ধ কথা বা বাক্য (the dictionary marks it "হিন্দু সমাজে প্রচলিত"; the drawing has no deity or religious symbol)
//   বেগুন → তেলে-বেগুনে জ্বলে ওঠা: অত্যন্ত ক্রুদ্ধ হওয়া
//   অকাল → অকালকুষ্মাণ্ড: ১ অকালে উৎপন্ন কুমড়া ২ (আলঙ্কারিক) মূর্খ; অকর্মণ্য; অপদার্থ
//   জিলাপি → জিলাপির প্যাঁচ: কুটিলতা; অসরল ভাব
//   গুড় → গুড়ে বালি: প্রত্যাশা নাশ; আশায় নৈরাশ্য
//   পুকুর → পুকুর চুরি: আগাগোড়া ফাঁকি বা বেমালুম চুরি; অসম্ভব রকমের বিরাট চুরি
//   আকাশ → আকাশ থেকে পড়া: অজানা বিষয় হঠাৎ জেনে অত্যন্ত বিস্মিত হওয়া; না জানার ভান করে বিস্ময় প্রকাশ
//   ব্যাঙ → ব্যাঙের সর্দি: অসম্ভব ব্যাপার
//   মই → গাছে তুলে দিয়ে মই কেড়ে নেওয়া: উৎসাহ দিয়ে কর্মে প্রবৃত্ত করে অসহায় অবস্থায় ফেলে সরে দাঁড়ানো
//   চিনি → চিনির বলদ: যে পরের সুখের জন্য খাটে কিন্তু নিজের পরিশ্রমলব্ধ সম্পদ ভোগ করতে পারে না
//   সাপ → সাপের পাঁচ পা দেখা: অত্যন্ত স্পর্ধার ফলে অহেতুক বাড়াবাড়ি করা
//   শাক → শাক দিয়ে মাছ ঢাকা: গুরুতর অপরাধ সামান্য উপায়ে ঢাকার ব্যর্থ চেষ্টা
//   আমড়া → আমড়া কাঠের ঢেঁকি: অকেজো লোক
//   আদা → আদায় কাঁচকলায়: পরস্পর শত্রুভাবাপন্ন; সাপে-নেউলে
//   বজ্রপাত (বিনা) → বিনা মেঘে বজ্রপাত: সহসা অপ্রত্যাশিত ভয়ঙ্কর বিপদ
//   ডুমুর → ডুমুরের ফুল: অদৃশ্য বস্তু (ফুল থাকে ফলের ভেতরে); দুর্লভ বা দুষ্প্রাপ্য বস্তু
// Skipped on purpose: idioms that mock a caste, trade group, ethnicity, gender, body or disability, and ones built on a deity.
// Share links store answers by position: once links are public, never edit, reorder or swap a set's questions or options. Add new sets instead.
export const sets = [
  {
    id: "s1", label: "প্রথম পাতা",
    questions: [
      { id: "bheja-biral", idiom: "ভিজে বিড়াল", scene: "বৃষ্টিতে ভিজে চুপচুপে একটা বিড়াল, চোখ দুটো খুব নিরীহ", options: ["বৃষ্টিতে ভিজে যে একদম কাহিল", "দেখতে নিরীহ, ভেতরে ভেতরে কুমতলব", "সবার আদরের, খুব মিষ্টি মানুষ"], answer: 1, trap: 0, meaning: "দেখতে ভিজে বিড়ালের মতো নিরীহ, আসলে কুমতলববাজ দুষ্টু লোক।", example: "টিচারের সামনে সে ভিজে বিড়াল, টিচার বোর্ডের দিকে ফিরলেই কাগজের রকেট ওড়ে।", head: "ভিজে" },
      { id: "oronne-rodon", idiom: "অরণ্যে রোদন", scene: "ঘন জঙ্গলে একজন একা বসে কাঁদছে, গাছগুলো চোখ বুজে ঘুমায়", options: ["জঙ্গলে পথ হারিয়ে কান্না", "খুব জোরে জোরে কাঁদা", "যেখানে কেউ শুনবে না, সেখানে বৃথা অনুনয়"], answer: 2, trap: 0, meaning: "বৃথা কান্না, বৃথা অনুনয়-বিনয়। যার কাছে চাইছ, সে শুনবেই না।", example: "বাড়িওয়ালাকে ভাড়া কমাতে বলা আর অরণ্যে রোদন একই কথা।", head: "অরণ্য" },
      { id: "kanthaler-amsotto", idiom: "কাঁঠালের আমসত্ত্ব", scene: "একটা আস্ত কাঁঠাল, পাশে চ্যাপ্টা একটা আমসত্ত্ব আর বড় একটা প্রশ্নচিহ্ন", options: ["অসম্ভব জিনিস", "কাঁঠাল দিয়ে বানানো নতুন মিষ্টি", "দুই ফলের দারুণ জুটি"], answer: 0, trap: 1, meaning: "অসম্ভব বস্তু। আমসত্ত্ব হয় আমে, কাঁঠালে না।", example: "এক রাত পড়েই সব বিষয়ে এ-প্লাস? ওটা কাঁঠালের আমসত্ত্ব।", head: "কাঁঠাল" },
      { id: "bhuter-mukhe", idiom: "ভূতের মুখে রাম নাম", scene: "চাঁদনি রাতে একটা ভূত হাত জোড় করে খুব ভালো মানুষের মতো কথা বলছে", options: ["ভূত তাড়ানোর উপায়", "যার মুখে মানায় না, তার মুখে ভালো কথা", "রাত জেগে গল্প বলা"], answer: 1, trap: 0, meaning: "স্বভাবের সাথে মেলে না এমন কথা, যেমন অসৎ লোকের মুখে সততার উপদেশ।", example: "যে নিজে কখনো লাইনে দাঁড়ায় না, সে বলছে নিয়ম মানো! ভূতের মুখে রাম নাম।", head: "ভূত" },
      { id: "tele-begune", idiom: "তেলে-বেগুনে জ্বলে ওঠা", scene: "গরম তেলের কড়াইয়ে একটা বেগুন, রাগে ভুরু কুঁচকে মাথা দিয়ে ধোঁয়া বেরোচ্ছে", options: ["বেগুনি ভাজতে বসা", "হঠাৎ ভীষণ রেগে যাওয়া", "খুব তাড়াহুড়া করা"], answer: 1, trap: 0, meaning: "অত্যন্ত রেগে ওঠা, গরম তেলে বেগুন পড়লে যেমন ছ্যাঁৎ করে ওঠে।", example: "রিমোটটা কে লুকাল জিজ্ঞেস করতেই ভাইয়া তেলে-বেগুনে জ্বলে উঠল।", head: "বেগুন" },
      { id: "okal-kushmando", idiom: "অকালকুষ্মাণ্ড", scene: "চড়া রোদে মাফলার জড়ানো ছোট্ট একটা কুমড়া, ঘামছে", options: ["অকর্মণ্য, কোনো কাজের না", "অসময়ে ফলা কুমড়া, খেতে দারুণ", "যে সবার আগে কাজ সেরে ফেলে"], answer: 0, trap: 1, meaning: "মূর্খ, অকর্মণ্য, অপদার্থ লোক। আক্ষরিক মানে অসময়ে ফলা কুমড়া।", example: "দুপুর পর্যন্ত ঘুম, বাজারে লবণ আনতে ভুল; দাদি হেসে বলেন, আস্ত অকালকুষ্মাণ্ড!", head: "অকাল" },
      { id: "jilapir-pach", idiom: "জিলাপির প্যাঁচ", scene: "বড় একটা জিলাপি, তার প্যাঁচের ভেতর একটা পিঁপড়া পথ হারিয়েছে", options: ["মিষ্টি করে কথা বলা", "জিলাপি বানানোর কায়দা", "কুটিল, প্যাঁচালো বুদ্ধি"], answer: 2, trap: 1, meaning: "কুটিলতা, সোজাসাপ্টা না হওয়া; জিলাপির মতো প্যাঁচানো মন।", example: "ওর কথায় এত জিলাপির প্যাঁচ, শেষে বোঝাই যায় না কী চায়।", head: "জিলাপি" },
      { id: "gure-bali", idiom: "গুড়ে বালি", scene: "খেজুর গুড়ের হাঁড়িতে কেউ বালতি উপুড় করে বালি ঢালছে", options: ["ভেজাল দিয়ে ব্যবসা", "আশা ভেঙে যাওয়া", "অল্পে খুশি থাকা"], answer: 1, trap: 0, meaning: "আশায় নিরাশা। মিষ্টি গুড় খাবে ভেবেছিলে, মুখে গেল বালি।", example: "ভেবেছিলাম কাল ছুটি, নোটিশ এল অফিস খোলা। গুড়ে বালি!", head: "গুড়" },
      { id: "pukur-churi", idiom: "পুকুর চুরি", scene: "এক চোর আস্ত একটা পুকুর, মাছসহ, মাথায় তুলে দৌড়াচ্ছে", options: ["রাতে চুপিচুপি পুকুরের মাছ ধরা", "ছোটখাটো দুষ্টুমি", "বিশাল, বেমালুম চুরি"], answer: 2, trap: 0, meaning: "আগাগোড়া ফাঁকি, বিরাট রকমের বেমালুম চুরি।", example: "নতুন রাস্তা এক বর্ষাতেই খানাখন্দ, বোঝাই যায় পুকুর চুরি হয়েছে।", head: "পুকুর" },
      { id: "akash-theke-pora", idiom: "আকাশ থেকে পড়া", scene: "মেঘের ওপর থেকে একজন ধপাস করে পড়ছে, চোখ ছানাবড়া", options: ["হঠাৎ শুনে ভীষণ অবাক হওয়া", "উঁচু থেকে পড়ে ব্যথা পাওয়া", "স্বপ্নে বড়লোক হয়ে যাওয়া"], answer: 0, trap: 1, meaning: "অজানা কথা হঠাৎ জেনে ভীষণ অবাক হওয়া; কখনো না জানার ভান করে অবাক হওয়া।", example: "বিস্কুটের বয়াম খালি কেন, আম্মু জিজ্ঞেস করতেই ছোট ভাই আকাশ থেকে পড়ল।", head: "আকাশ" },
    ],
  },
  {
    id: "s2", label: "দ্বিতীয় পাতা",
    questions: [
      { id: "gachhe-kanthal", idiom: "গাছে কাঁঠাল গোঁফে তেল", scene: "গাছে কাঁচা কাঁঠাল ঝুলছে, নিচে গোঁফওয়ালা একজন আগেভাগেই গোঁফে তেল মাখছে", options: ["পাওয়ার আগেই পাওয়া ধরে নিয়ে আয়োজন", "কাঁঠালের আঠা থেকে বাঁচার কায়দা", "গাছ লাগিয়ে ধৈর্য ধরা"], answer: 0, trap: 1, meaning: "যা এখনো পাওনি, তা পেয়ে গেছ ধরে নিয়ে পরিকল্পনা। কাঁঠাল পাড়াই হয়নি, আঠা ঠেকাতে গোঁফে তেল!", example: "লটারির টিকিট কিনেই গাড়ির রং ঠিক করছে, গাছে কাঁঠাল গোঁফে তেল।", head: "কাঁঠাল" },
      { id: "byanger-sordi", idiom: "ব্যাঙের সর্দি", scene: "মাফলার পেঁচানো একটা ব্যাঙ রুমালে হাঁচি দিচ্ছে", options: ["বর্ষায় ঠান্ডা লাগা", "একটানা ঘ্যানঘ্যান করা", "অসম্ভব ব্যাপার"], answer: 2, trap: 0, meaning: "অসম্ভব ব্যাপার। যে সারাক্ষণ পানিতেই থাকে, তার আবার সর্দি!", example: "কিপটে মামা নিজে থেকে সবাইকে বিরিয়ানি খাওয়াবেন? ব্যাঙের সর্দি!", head: "ব্যাঙ" },
      { id: "gachhe-tule-moi", idiom: "গাছে তুলে মই কেড়ে নেওয়া", scene: "একজন গাছের মাথায় আটকে আছে, নিচে আরেকজন মইটা কাঁধে নিয়ে শিস দিতে দিতে চলে যাচ্ছে", options: ["গাছ থেকে ফল পাড়তে সাহায্য করা", "উৎসাহ দিয়ে কাজে নামিয়ে বিপদের মুখে সরে পড়া", "কাউকে উঁচু পদে বসানো"], answer: 1, trap: 0, meaning: "উৎসাহ দিয়ে কাজে নামিয়ে, অসহায় অবস্থায় ফেলে সরে দাঁড়ানো।", example: "সবাই বলল ক্যাপ্টেন হতে নাম দে, আমরা আছি; ভোটের দিন কেউ নেই। গাছে তুলে মই কেড়ে নিল।", head: "মই" },
      { id: "chinir-bolod", idiom: "চিনির বলদ", scene: "পিঠে চিনির বস্তা নিয়ে এক বলদ হাঁটছে, পেছনে পিঁপড়ার সারি", options: ["খুব শক্তিশালী মানুষ", "মিষ্টি খেতে ভালোবাসে যে", "খেটে মরে, কিন্তু ফল ভোগ করে অন্যজন"], answer: 2, trap: 1, meaning: "যে পরের সুখের জন্য খাটে, কিন্তু নিজের খাটুনির ফল ভোগ করতে পারে না।", example: "সারা মাস খেটে বেতন তুলে দেয়, নিজের একটা শার্টও কেনা হয় না; চিনির বলদ যেন।", head: "চিনি" },
      { id: "saper-pach-pa", idiom: "সাপের পাঁচ পা দেখা", scene: "একটা সাপ বুক ফুলিয়ে দাঁড়িয়ে, তার নিচে পাঁচটা ছোট্ট পা", options: ["অহংকারে বাড়াবাড়ি করা", "অদ্ভুত কিছু দেখে ভয় পাওয়া", "খুব জোরে দৌড়ানো"], answer: 0, trap: 1, meaning: "বেশি স্পর্ধায় অকারণে বাড়াবাড়ি করা; দুদিনের সাফল্যে মাটিতে পা না পড়া।", example: "এক ম্যাচে ফিফটি করেই সাপের পাঁচ পা দেখছে, প্র্যাকটিসে আর আসে না।", head: "সাপ" },
      { id: "shak-diye-mach", idiom: "শাক দিয়ে মাছ ঢাকা", scene: "থালায় বড় একটা রুই মাছ, ওপরে দুটো শাকের পাতা, মাথা আর লেজ বেরিয়ে আছে", options: ["রান্নার একটা দেশি কায়দা", "বড় দোষ ছোট অজুহাতে ঢাকার বৃথা চেষ্টা", "অল্প জিনিস ভাগাভাগি করে খাওয়া"], answer: 1, trap: 0, meaning: "গুরুতর দোষ সামান্য উপায়ে ঢাকার ব্যর্থ চেষ্টা।", example: "খাতার লাল দাগের ওপর স্টিকার মেরে দিল; শাক দিয়ে মাছ ঢাকা আর কী!", head: "শাক" },
      { id: "amra-kather-dheki", idiom: "আমড়া কাঠের ঢেঁকি", scene: "একটা ঢেঁকি, পাড় দিতেই মাঝখান থেকে বেঁকে গেছে, পাশে দুটো আমড়া", options: ["খুব মজবুত, টেকসই জিনিস", "ধান ভানার পুরোনো যন্ত্র", "অকেজো লোক"], answer: 2, trap: 1, meaning: "অকেজো লোক, যাকে দিয়ে কোনো কাজ হয় না।", example: "রিমোট খুঁজতে পাঠালাম, চোখের সামনে থেকেও বলে পাইনি। আস্ত আমড়া কাঠের ঢেঁকি!", head: "আমড়া" },
      { id: "aday-kanchkolay", idiom: "আদায় কাঁচকলায়", scene: "এক টুকরা আদা আর একটা কাঁচকলা মুখোমুখি, দুজনেই রেগে ঘুসি পাকাচ্ছে", options: ["একদম বনিবনা নেই, শত্রুতা", "আদা দিয়ে কাঁচকলার তরকারি", "দারুণ মিল, হরিহর আত্মা"], answer: 0, trap: 1, meaning: "পরস্পর শত্রুভাবাপন্ন; একজনের সাথে আরেকজনের একদম মেলে না।", example: "দুই প্রতিবেশীর সম্পর্ক আদায় কাঁচকলায়, মুরগি উঠান পার হলেই ঝগড়া।", head: "আদা" },
      { id: "bina-meghe", idiom: "বিনা মেঘে বজ্রপাত", scene: "ঝকঝকে রোদ, আকাশে একটাও মেঘ নেই, তবু একজনের পাশে বাজ পড়ছে", options: ["রোদের দিনে ঝড়ের পূর্বাভাস", "হঠাৎ, একেবারে অপ্রত্যাশিত বিপদ", "খুব সৌভাগ্যের দিন"], answer: 1, trap: 0, meaning: "হঠাৎ, একেবারে অপ্রত্যাশিত ভয়ংকর বিপদ।", example: "পরীক্ষার আগের রাতে ল্যাপটপ নষ্ট, যেন বিনা মেঘে বজ্রপাত।", head: "বজ্রপাত" },
      { id: "dumurer-ful", idiom: "ডুমুরের ফুল", scene: "ডুমুর গাছের ডালে থোকা থোকা ডুমুর, একজন আতশ কাচ দিয়ে ফুল খুঁজছে", options: ["ডুমুর গাছের সুন্দর ফুল", "সহজে পাওয়া যায় এমন জিনিস", "যার দেখা মেলে না, দুর্লভ"], answer: 2, trap: 0, meaning: "দুর্লভ, যার দেখা প্রায় মেলেই না। ডুমুরের ফুল থাকে ফলের ভেতরে, তাই চোখে পড়ে না।", example: "আজকাল হাতে লেখা চিঠি ডুমুরের ফুল হয়ে গেছে।", head: "ডুমুর" },
    ],
  },
] as const satisfies ReadonlyArray<{ id: string; label: string; questions: readonly Idiom[] }>;

export type SetId = (typeof sets)[number]["id"];
export type Shared = { set: SetId; answers: Answer[]; name: string };

const numbers = new Intl.NumberFormat("bn-BD");
export const bn = (value: number) => numbers.format(value);

export const isSetId = (id: string): id is SetId => sets.some(item => item.id === id);
export const setById = (id: SetId) => sets.find(item => item.id === id)!;
export const questionsOf = (id: SetId): readonly Idiom[] => setById(id).questions;
export const allIdioms: readonly Idiom[] = sets.flatMap((item): readonly Idiom[] => item.questions);

/** Anonymous tally ids: "seen:<set>" counts finished pages, each idiom id counts a right answer. */
export const tallyIds = sets.flatMap(item => [`seen:${item.id}`, ...item.questions.map(question => question.id)]);

/** The dictionary stores ড় ঢ় য় precomposed, but NFC splits them; rebuild them (by escape) before searching. */
export function dictionaryUrl(head: string) {
  const query = head.normalize("NFC").replace(/[\u09a1\u09a2\u09af]\u09bc/g, pair => ({ "\u09a1": "\u09dc", "\u09a2": "\u09dd", "\u09af": "\u09df" })[pair[0]]!);
  return "https://accessibledictionary.gov.bd/bengali-to-bengali/?q=" + encodeURIComponent(query);
}

export function cleanName(name: string) {
  // Strip control and bidi-override characters so a shared link can't scramble the card text.
  return name.normalize("NFC").replace(/[\u0000-\u001f\u007f‎‏‪-‮⁦-⁩]/g, "").trim().replace(/\s+/g, " ").slice(0, MAX_NAME_LENGTH);
}

/** Which answers were right, recomputed from the questions; a passed score is never trusted. */
export function marks(set: SetId, answers: readonly Answer[]) {
  return questionsOf(set).map((question, index) => answers[index] === undefined ? null : answers[index] === question.answer);
}

export const scoreOf = (set: SetId, answers: readonly Answer[]) => marks(set, answers).filter(Boolean).length;
export const trapsOf = (set: SetId, answers: readonly Answer[]) => questionsOf(set).filter((question, index) => answers[index] === question.trap).length;

export function rank(score: number) {
  if (score === PER_SET) return "বাগধারার পণ্ডিত";
  if (score >= 8) return "ফার্স্ট বেঞ্চ";
  if (score >= 5) return "পাস মার্ক পার";
  if (score >= 3) return "পেছনের বেঞ্চ";
  return "বইটা আবার খোলো";
}

export function humanLine(set: SetId, answers: readonly Answer[]) {
  const score = scoreOf(set, answers);
  const traps = trapsOf(set, answers);
  if (score === PER_SET) return "১০-এ ১০! টিচার আজ লাল কালিতে শুধু টিক দিলেন।";
  if (traps >= 3) return `${bn(traps)}বার ছবি যা দেখায় সেটাই ধরেছ! বাগধারা কিন্তু ঘুরিয়ে কথা বলে।`;
  if (score >= 8) {
    const missed = questionsOf(set).find((question, index) => answers[index] !== question.answer)!;
    return `বইটা প্রায় মুখস্থ, শুধু “${missed.idiom}” আরেকবার দেখে নাও।`;
  }
  if (score <= 3) return "ছবিগুলো মনে রাখো, পরের বার মানেগুলোও মনে পড়বে।";
  return "মাঝামাঝি! আরেক পাতা খেললেই হাত পেকে যাবে।";
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

/** Facebook caption. Spoiler-free: a score and a question, never a meaning. */
export function caption(shared: Shared, friend?: Shared | null) {
  const score = scoreOf(shared.set, shared.answers);
  const vs = friend && friend.set === shared.set ? ` ${friend.name ? possessive(friend.name) : "বন্ধুর"} ${bn(scoreOf(friend.set, friend.answers))}।` : "";
  return `মজার ছবি দেখে ১০টা বাগধারার মধ্যে ${bn(score)}টার মানে পেরেছি, ${rank(score)}!${vs} তুমি কয়টা পারবে?`;
}

export { possessive };

// Kinship chains: tap up to 4 steps from "আমি" (আব্বুর → বোনের → স্বামী) and get the Bangla name, with the two family styles side by side.
//
// Sources (checked Oct 2026):
// - Bangla Academy dictionary, as served by the government's Accessible Dictionary ("এই অভিধানের ডাটাবেজটি বাংলা একাডেমি থেকে
//   প্রকাশিত অভিধানের ভিত্তিতে তৈরি"): https://accessibledictionary.gov.bd/bengali-to-bengali/?q=<headword> — `head` below is the
//   headword whose entry carries the term. Quoted senses: চাচা "বাপের ভাই; কাকা; খুড়া; পিতৃব্য"; কাকা "পিতার ছোট ভাই";
//   জেঠা/জ্যাঠা "পিতার বড় ভাই", জেঠিমা "জেঠার পত্নী"; ফুফা, ফুপা (অশুদ্ধ) "ফুফুর স্বামী; পিতার বোনের স্বামী; পিসা";
//   পিসি "পিতার ভগিনী; ফুফু", পিসা/পিসে/পিসেমশাই "পিসির স্বামী; ফুফা"; খালা "মাতার ভগিনী; মাসি", খালু "খালার স্বামী; মেসো";
//   মামি/মামানি "মামার স্ত্রী"; পিতামহ "দাদা; ঠাকুরদাদা; ঠাকুরদা", ঠাকুরমা/ঠাকুমা "পিতার মাতা", দাদি "পিতামহী";
//   নানা "মাতামহ", দাদা মশাই "হিন্দু ব্যবহারে মাতামহ", দিদিমা "মাতামহী"; ভাবি "বড় ভাইয়ের স্ত্রী; বৌদি"; বউমা "পুত্রবধূ বা
//   কনিষ্ঠ ভ্রাতার বধূ", ভাদ্রবৌ "কনিষ্ঠ ভ্রাতার স্ত্রী"; দুলাভাই "ভগিনীপতি; বোনাই", দাদাবাবু "(হিন্দু সমাজে) বড় বোনের স্বামী";
//   ভাতিজা/ভাতিজি, ভাইপো/ভাইঝি; ভাগনে/ভাগ্নে/ভাগিনা, ভাগ্নি, বোনপো/বোনঝি; দেবর/দেওর "স্বামীর ছোট ভাই", ভাশুর/ভাসুর
//   "স্বামীর বড় ভাই", ঠাকুরপো "দেবর"; ননদ "স্বামীর বোন", ননাস "স্বামীর জ্যেষ্ঠা ভগিনী", ঠাকুরঝি "ননদ", নন্দাই "ননদের স্বামী";
//   সম্বন্ধী "স্ত্রীর ভাই; শ্যালক; স্ত্রীর বড় ভাই", শ্যালক "স্ত্রীর চেয়ে বয়সে ছোট তার ... ভাই", শ্যালিকা "স্ত্রীর বোন";
//   শালাজ "শালার স্ত্রী"; জা "স্বামীর ভাইয়ের বউ"; ভায়রা "স্ত্রীর ভগ্নিপতি; শ্যালিকার স্বামী"; বেহাই/বেয়াই "পুত্র বা কন্যার
//   শ্বশুর", বেহান/বেয়ান (স্ত্রী); তাউই/তালুই "ভাই বা বোনের শ্বশুর", মাউই/মাওই "ভাই বা বোনের শাশুড়ি"; নাতবৌ "নাতির স্ত্রী",
//   নাতজামাই "নাতনির স্বামী"; দাদাশ্বশুর "স্বামী কিংবা স্ত্রীর পিতামহ বা মাতামহ", দিদিশাশুড়ি "শ্বশুর বা শাশুড়ির মাতা";
//   মামাশ্বশুর "স্বামী বা স্ত্রীর মামা", মামিশাশুড়ি; খুড়শ্বশুর "স্বামী বা স্ত্রীর খুড়া", জেঠশ্বশুর "স্বামীর বা স্ত্রীর জেঠা",
//   পিসশ্বশুর "স্বামী বা পত্নীর ফুফা বা পিসা", পিসশাশুড়ি; খুড়তুতো, জেঠতুতো, পিসতুতো, ফুফুতো, মামাতো, খালাতো, মাসতুতো;
//   আপা "বড় বোন", বুবু "(বাঙালি মুসলমান সমাজে কথ্যভাষায়) বড় বোন", দিদি "হিন্দু সমাজে জ্যেষ্ঠা ভগ্নী", দাদা "বড় ভাই".
// - The Hindu / Muslim columns follow "Basic Bangla", ch. 5.1 Kinship Terms (Prasenjit Dey & Rajiv Ranjan, Michigan State
//   University open textbook): https://openbooks.lib.msu.edu/basicbangla/chapter/5-1-kinship-terms-in-bangla/
// - জামাইবাবু (বড় বোনের স্বামী) is not in the Accessible Dictionary; bn.wiktionary's দুলাভাই entry lists it: https://bn.wiktionary.org/wiki/দুলাভাই
// Where neither source gives a word we don't invent one: the tool says "আলাদা নাম নেই" and builds the phrase people use.

export const MAX_STEPS = 4;
export const MAX_NAME_LENGTH = 20;

export const STEPS = ["f", "m", "b", "z", "h", "w", "s", "d"] as const;
export type Step = (typeof STEPS)[number];
/** c = the চাচা-ফুপু-খালা way (most Bangladeshi Muslim families), k = the কাকা-পিসি-মাসি way (most Hindu families, West Bengal). */
export type Style = "c" | "k";
export const STYLES: ReadonlyArray<{ id: Style; label: string; home: string; who: string }> = [
  { id: "c", label: "চাচা · ফুপু · খালা", home: "চাচা-ফুপুর ঘরে", who: "বাংলাদেশের বেশির ভাগ মুসলিম পরিবারে" },
  { id: "k", label: "কাকা · পিসি · মাসি", home: "কাকা-পিসির ঘরে", who: "বেশির ভাগ হিন্দু পরিবারে, পশ্চিমবঙ্গে" },
];

const MALE: ReadonlySet<Step> = new Set(["f", "b", "h", "s"]);
export const isMale = (step: Step) => MALE.has(step);
const isStep = (value: string): value is Step => (STEPS as readonly string[]).includes(value);

/** What each step is called on its own; only parents differ between the two styles. */
const nouns: Record<Step, readonly [string, string]> = {
  f: ["আব্বু", "বাবা"], m: ["আম্মু", "মা"], b: ["ভাই", "ভাই"], z: ["বোন", "বোন"],
  h: ["স্বামী", "স্বামী"], w: ["স্ত্রী", "স্ত্রী"], s: ["ছেলে", "ছেলে"], d: ["মেয়ে", "মেয়ে"],
};
export const stepNoun = (step: Step, style: Style) => nouns[step][style === "c" ? 0 : 1];
/** The chip label: "আব্বুর", "মায়ের", "ভাইয়ের". */
export const stepLabel = (step: Step, style: Style) => kinPossessive(stepNoun(step, style));

/** Possessive of a kin word: ভাই → ভাইয়ের, মা → মায়ের, ফুপু → ফুপুর, ভাসুর → ভাসুরের. "দেবর / ভাসুর" → "দেবর বা ভাসুরের". */
export function kinPossessive(term: string) {
  const word = term.replace(/ \/ /g, " বা ");
  if (word === "মা" || word === "জা") return word + "য়ের";
  if (/[\u0987\u0989]$/.test(word)) return word + "য়ের";
  if (/[\u09be-\u09cc\u09d7]$/.test(word)) return word + "র";
  return word + "ের";
}

export type Kind = "core" | "grand" | "elder" | "cousin" | "inlaw" | "young" | "bond";
/** c / k: the everyday word in each style ("" = no sourced word in that style). " / " joins terms that split by age. */
export type Entry = { c: string; k: string; kind: Kind; note?: string; book?: string; head: string };

// Keys are chains of steps from "আমি". Every chain here is reviewed by hand; anything else is described, never named.
export const terms: Record<string, Entry> = {
  f: { c: "আব্বু", k: "বাবা", kind: "core", book: "পিতা", head: "পিতা", note: "আব্বা, বাবা — যে নামে ডাকো।" },
  m: { c: "আম্মু", k: "মা", kind: "core", book: "মাতা", head: "আম্মা", note: "আম্মা, মা — যে নামে ডাকো।" },
  b: { c: "ভাই", k: "ভাই", kind: "core", book: "ভ্রাতা", head: "ভাই", note: "বড় হলে বড় ভাই; হিন্দু পরিবারে বড় ভাইকে দাদা ডাকে।" },
  z: { c: "বোন", k: "বোন", kind: "core", book: "ভগিনী", head: "বোন", note: "বড় বোনকে অনেকে আপা বা বুবু ডাকে; হিন্দু পরিবারে দিদি।" },
  h: { c: "স্বামী", k: "স্বামী", kind: "core", book: "পতি", head: "স্বামী" },
  w: { c: "স্ত্রী", k: "স্ত্রী", kind: "core", book: "পত্নী", head: "স্ত্রী", note: "মুখে বউ।" },
  s: { c: "ছেলে", k: "ছেলে", kind: "core", book: "পুত্র", head: "পুত্র" },
  d: { c: "মেয়ে", k: "মেয়ে", kind: "core", book: "কন্যা", head: "কন্যা" },

  "f.f": { c: "দাদা", k: "ঠাকুরদা", kind: "grand", book: "পিতামহ", head: "পিতা", note: "আদর করে দাদু। হিন্দু পরিবারে ‘দাদা’ মানে কিন্তু বড় ভাই।" },
  "f.m": { c: "দাদি", k: "ঠাকুমা", kind: "grand", book: "পিতামহী", head: "দাদি", note: "ঠাকুরমা বলেও।" },
  "m.f": { c: "নানা", k: "দাদু", kind: "grand", book: "মাতামহ", head: "নানা", note: "হিন্দু পরিবারে দাদামশাইও বলে।" },
  "m.m": { c: "নানি", k: "দিদিমা", kind: "grand", book: "মাতামহী", head: "দিদি", note: "দিদাও বলে।" },

  "f.b": { c: "চাচা", k: "কাকা / জ্যাঠা", kind: "elder", book: "পিতৃব্য", head: "চাচা", note: "বাবার ছোট ভাই কাকা (কাকু), বড় ভাই জ্যাঠা (জেঠু); চাচা-ফুপুর ঘরে বড় চাচা, ছোট চাচা।" },
  "f.z": { c: "ফুপু", k: "পিসি", kind: "elder", book: "পিতৃষ্বসা", head: "পিসি", note: "অভিধানের বানান ফুফু। পিসিমাও বলে।" },
  "m.b": { c: "মামা", k: "মামা", kind: "elder", book: "মাতুল", head: "মামা", note: "মামুও বলে।" },
  "m.z": { c: "খালা", k: "মাসি", kind: "elder", head: "খালা", note: "মাসিমাও বলে।" },
  "f.b.w": { c: "চাচি", k: "কাকি / জেঠি", kind: "elder", head: "জেঠা", note: "কাকার বউ কাকি (খুড়ি), জ্যাঠার বউ জেঠি (জেঠিমা)।" },
  "f.z.h": { c: "ফুপা", k: "পিসেমশাই", kind: "elder", head: "ফুফা", note: "অভিধানের বানান ফুফা। পিসা, পিসেও বলে।" },
  "m.b.w": { c: "মামি", k: "মামি", kind: "elder", book: "মাতুলানী", head: "মামা", note: "মামানিও বলে।" },
  "m.z.h": { c: "খালু", k: "মেসো", kind: "elder", head: "খালু" },

  "f.b.s": { c: "চাচাতো ভাই", k: "খুড়তুতো / জেঠতুতো ভাই", kind: "cousin", head: "খুড়তুতো", note: "কাকার ছেলে খুড়তুতো, জ্যাঠার ছেলে জেঠতুতো ভাই।" },
  "f.b.d": { c: "চাচাতো বোন", k: "খুড়তুতো / জেঠতুতো বোন", kind: "cousin", head: "খুড়তুতো", note: "কাকার মেয়ে খুড়তুতো, জ্যাঠার মেয়ে জেঠতুতো বোন।" },
  "f.z.s": { c: "ফুপাতো ভাই", k: "পিসতুতো ভাই", kind: "cousin", head: "পিসি", note: "অভিধানে ফুফুতো।" },
  "f.z.d": { c: "ফুপাতো বোন", k: "পিসতুতো বোন", kind: "cousin", head: "পিসি", note: "অভিধানে ফুফুতো।" },
  "m.b.s": { c: "মামাতো ভাই", k: "মামাতো ভাই", kind: "cousin", head: "মামা" },
  "m.b.d": { c: "মামাতো বোন", k: "মামাতো বোন", kind: "cousin", head: "মামা" },
  "m.z.s": { c: "খালাতো ভাই", k: "মাসতুতো ভাই", kind: "cousin", head: "খালা" },
  "m.z.d": { c: "খালাতো বোন", k: "মাসতুতো বোন", kind: "cousin", head: "মাসতুতো" },

  "b.w": { c: "ভাবি", k: "বউদি", kind: "inlaw", book: "ভ্রাতৃবধূ", head: "ভাবি", note: "এটা বড় ভাইয়ের বউয়ের ডাক। ছোট ভাইয়ের বউকে অভিধানে বউমা বা ভাদ্রবউ বলে।" },
  "z.h": { c: "দুলাভাই", k: "জামাইবাবু", kind: "inlaw", book: "ভগ্নিপতি", head: "দুলা", note: "অভিধানে বোনাইও আছে; হিন্দু পরিবারে দাদাবাবুও বলে।" },
  "h.f": { c: "শ্বশুর", k: "শ্বশুর", kind: "inlaw", head: "শ্বশুর" },
  "h.m": { c: "শাশুড়ি", k: "শাশুড়ি", kind: "inlaw", book: "শ্বশ্রূ", head: "শাশুড়ি" },
  "w.f": { c: "শ্বশুর", k: "শ্বশুর", kind: "inlaw", head: "শ্বশুর" },
  "w.m": { c: "শাশুড়ি", k: "শাশুড়ি", kind: "inlaw", book: "শ্বশ্রূ", head: "শাশুড়ি" },
  "h.b": { c: "দেবর / ভাসুর", k: "দেবর / ভাসুর", kind: "inlaw", head: "ভাশুর", note: "স্বামীর ছোট ভাই দেবর (দেওর), বড় ভাই ভাসুর (ভাশুর)। হিন্দু পরিবারে দেবরকে ঠাকুরপো ডাকে।" },
  "h.z": { c: "ননদ", k: "ননদ", kind: "inlaw", head: "ননদ", note: "স্বামীর বড় বোনকে ননাসও বলে। হিন্দু পরিবারে ঠাকুরঝি ডাকে।" },
  "w.b": { c: "সম্বন্ধী / শ্যালক", k: "সম্বন্ধী / শ্যালক", kind: "inlaw", head: "সম্বন্ধ", note: "স্ত্রীর বড় ভাই সম্বন্ধী, ছোট ভাই শ্যালক।" },
  "w.z": { c: "শ্যালিকা", k: "শ্যালিকা", kind: "inlaw", head: "শ্যালক" },
  "h.b.w": { c: "জা", k: "জা", kind: "inlaw", head: "জা", note: "স্বামীর বড় ভাইয়ের বউ বড় জা, ছোট ভাইয়ের বউ ছোট জা।" },
  "h.z.h": { c: "নন্দাই", k: "নন্দাই", kind: "inlaw", head: "ননদ", note: "ননদের স্বামী। হিন্দু পরিবারে ঠাকুরজামাইও বলে।" },
  "w.z.h": { c: "ভায়রা", k: "ভায়রা", kind: "inlaw", head: "ভায়রা", note: "ভায়রাভাইও বলে।" },
  "w.b.w": { c: "শালাজ", k: "শালাজ", kind: "inlaw", head: "শালা", note: "অভিধানে স্ত্রীর ছোট ভাইয়ের বউ; বড় ভাইয়ের বউয়ের আলাদা নাম অভিধানে পাইনি।" },
  "h.f.f": { c: "দাদাশ্বশুর", k: "দাদাশ্বশুর", kind: "inlaw", head: "দাদা", note: "স্বামী বা স্ত্রীর দাদা-নানা দুজনই অভিধানে দাদাশ্বশুর।" },
  "h.m.f": { c: "দাদাশ্বশুর", k: "দাদাশ্বশুর", kind: "inlaw", head: "দাদা", note: "স্বামী বা স্ত্রীর দাদা-নানা দুজনই অভিধানে দাদাশ্বশুর।" },
  "w.f.f": { c: "দাদাশ্বশুর", k: "দাদাশ্বশুর", kind: "inlaw", head: "দাদা", note: "স্বামী বা স্ত্রীর দাদা-নানা দুজনই অভিধানে দাদাশ্বশুর।" },
  "w.m.f": { c: "দাদাশ্বশুর", k: "দাদাশ্বশুর", kind: "inlaw", head: "দাদা", note: "স্বামী বা স্ত্রীর দাদা-নানা দুজনই অভিধানে দাদাশ্বশুর।" },
  "h.f.m": { c: "দিদিশাশুড়ি", k: "দিদিশাশুড়ি", kind: "inlaw", head: "দিদি", note: "শ্বশুর বা শাশুড়ির মা।" },
  "h.m.m": { c: "দিদিশাশুড়ি", k: "দিদিশাশুড়ি", kind: "inlaw", head: "দিদি", note: "শ্বশুর বা শাশুড়ির মা।" },
  "w.f.m": { c: "দিদিশাশুড়ি", k: "দিদিশাশুড়ি", kind: "inlaw", head: "দিদি", note: "শ্বশুর বা শাশুড়ির মা।" },
  "w.m.m": { c: "দিদিশাশুড়ি", k: "দিদিশাশুড়ি", kind: "inlaw", head: "দিদি", note: "শ্বশুর বা শাশুড়ির মা।" },
  "h.m.b": { c: "মামাশ্বশুর", k: "মামাশ্বশুর", kind: "inlaw", head: "মামা" },
  "w.m.b": { c: "মামাশ্বশুর", k: "মামাশ্বশুর", kind: "inlaw", head: "মামা" },
  "h.m.b.w": { c: "মামিশাশুড়ি", k: "মামিশাশুড়ি", kind: "inlaw", head: "মামা" },
  "w.m.b.w": { c: "মামিশাশুড়ি", k: "মামিশাশুড়ি", kind: "inlaw", head: "মামা" },
  "h.f.b": { c: "", k: "খুড়শ্বশুর / জেঠশ্বশুর", kind: "inlaw", head: "খুড়াশ্বশুর", note: "শ্বশুরের ছোট ভাই খুড়শ্বশুর, বড় ভাই জেঠশ্বশুর।" },
  "w.f.b": { c: "", k: "খুড়শ্বশুর / জেঠশ্বশুর", kind: "inlaw", head: "খুড়াশ্বশুর", note: "শ্বশুরের ছোট ভাই খুড়শ্বশুর, বড় ভাই জেঠশ্বশুর।" },
  "h.f.b.w": { c: "", k: "খুড়শাশুড়ি / জেঠশাশুড়ি", kind: "inlaw", head: "খুড়াশ্বশুর" },
  "w.f.b.w": { c: "", k: "খুড়শাশুড়ি / জেঠশাশুড়ি", kind: "inlaw", head: "খুড়াশ্বশুর" },
  "h.f.z": { c: "", k: "পিসশাশুড়ি", kind: "inlaw", head: "পিসি" },
  "w.f.z": { c: "", k: "পিসশাশুড়ি", kind: "inlaw", head: "পিসি" },
  "h.f.z.h": { c: "", k: "পিসশ্বশুর", kind: "inlaw", head: "পিসি" },
  "w.f.z.h": { c: "", k: "পিসশ্বশুর", kind: "inlaw", head: "পিসি" },

  "b.s": { c: "ভাতিজা", k: "ভাইপো", kind: "young", book: "ভ্রাতুষ্পুত্র", head: "ভাতিজা" },
  "b.d": { c: "ভাতিজি", k: "ভাইঝি", kind: "young", book: "ভ্রাতুষ্পুত্রী", head: "ভাতিজা" },
  "z.s": { c: "ভাগনে", k: "ভাগনে", kind: "young", book: "ভাগিনেয়", head: "ভাগনে", note: "ভাগ্নে, ভাগিনা বলেও; বোনপোও বলে।" },
  "z.d": { c: "ভাগ্নি", k: "ভাগ্নি", kind: "young", book: "ভাগিনেয়ী", head: "ভাগনে", note: "বোনঝিও বলে।" },
  "s.s": { c: "নাতি", k: "নাতি", kind: "young", book: "পৌত্র", head: "নাতি" },
  "s.d": { c: "নাতনি", k: "নাতনি", kind: "young", book: "পৌত্রী", head: "নাতি" },
  "d.s": { c: "নাতি", k: "নাতি", kind: "young", book: "দৌহিত্র", head: "দৌহিত্র" },
  "d.d": { c: "নাতনি", k: "নাতনি", kind: "young", book: "দৌহিত্রী", head: "দৌহিত্র" },

  "s.w": { c: "বউমা", k: "বউমা", kind: "bond", book: "পুত্রবধূ", head: "বউ", note: "ছেলের বউ।" },
  "d.h": { c: "জামাই", k: "জামাই", kind: "bond", book: "জামাতা", head: "জামাই" },
  "s.s.w": { c: "নাতবউ", k: "নাতবউ", kind: "bond", head: "নাতি" },
  "d.s.w": { c: "নাতবউ", k: "নাতবউ", kind: "bond", head: "নাতি" },
  "s.d.h": { c: "নাতজামাই", k: "নাতজামাই", kind: "bond", head: "নাতি" },
  "d.d.h": { c: "নাতজামাই", k: "নাতজামাই", kind: "bond", head: "নাতি" },
  "s.w.f": { c: "বেয়াই", k: "বেয়াই", kind: "bond", head: "বেহাই", note: "বেহাই, বিয়াইও বলে।" },
  "d.h.f": { c: "বেয়াই", k: "বেয়াই", kind: "bond", head: "বেহাই", note: "বেহাই, বিয়াইও বলে।" },
  "s.w.m": { c: "বেয়ান", k: "বেয়ান", kind: "bond", head: "বেহাই", note: "বেহানও বলে; অনেকে বেয়াইন বলে।" },
  "d.h.m": { c: "বেয়ান", k: "বেয়ান", kind: "bond", head: "বেহাই", note: "বেহানও বলে; অনেকে বেয়াইন বলে।" },
  "b.w.f": { c: "তালুই", k: "তালুই", kind: "bond", head: "তালুই", note: "তাওই, তালইও বলে।" },
  "z.h.f": { c: "তালুই", k: "তালুই", kind: "bond", head: "তালুই", note: "তাওই, তালইও বলে।" },
  "b.w.m": { c: "মাউই", k: "মাউই", kind: "bond", head: "মাউই", note: "মাওই, মাঐও বলে।" },
  "z.h.m": { c: "মাউই", k: "মাউই", kind: "bond", head: "মাউই", note: "মাওই, মাঐও বলে।" },
};

export const keyOf = (chain: readonly Step[]) => chain.join(".");
export const termFor = (chain: readonly Step[], style: Style) => terms[keyOf(chain)]?.[style] || null;

/** Why a step can't follow the chain (a loop back or an impossible spouse), as a friendly line naming who it really is; null if it's fine. */
export function stepProblem(chain: readonly Step[], next: Step, style: Style): string | null {
  if (chain.length >= MAX_STEPS) return "চার ধাপের বেশি খোঁজা যায় না, এর পরে হাতে মিলিয়ে দেখা কঠিন।";
  const last = chain.at(-1);
  if (!last) return null;
  const was = kinPossessive(phrase(chain, style));
  if (next === "h" && isMale(last)) return `${was} তো স্ত্রী থাকে, স্বামী না। “স্ত্রীর” চাপো।`;
  if (next === "w" && !isMale(last)) return `${was} তো স্বামী থাকে, স্ত্রী না। “স্বামীর” চাপো।`;
  const parent = (step: Step) => step === "f" || step === "m";
  const sibling = (step: Step) => step === "b" || step === "z";
  const child = (step: Step) => step === "s" || step === "d";
  const spouse = (step: Step) => step === "h" || step === "w";
  // `base` is the person before `last`; every loop collapses onto them or someone one step from them.
  const base = chain.slice(0, -1);
  const self = base.length ? phrase(base, style) : "তুমি";
  const one = (step: Step) => phrase([...base, step], style);
  // "নয়তো আব্বু নিজেই" only fits if base is the same sex as the step; my own sex is unknown, so "তুমি" always fits.
  const orSelf = !base.length || isMale(base.at(-1)!) === isMale(next) ? `, নয়তো ${self} নিজেই!` : "।";
  const asked = `${was} ${stepNoun(next, style)} মানে তো`;
  const fix = (step: Step) => ` একটা মুছে “${stepLabel(step, style)}” চাপো।`;
  if (last === "f" && next === "w") return `${asked} ${one("m")}।${fix("m")}`;
  if (last === "m" && next === "h") return `${asked} ${one("f")}।${fix("f")}`;
  if (parent(last) && child(next)) { const sib: Step = next === "s" ? "b" : "z"; return `${asked} ${one(sib)}${orSelf}${fix(sib)}`; }
  if (sibling(last) && parent(next)) return `${asked} ${base.length ? one(next) : "তোমারও " + stepNoun(next, style)}।`;
  if (sibling(last) && sibling(next)) return `${asked} ${one(next)}${orSelf}`;
  if (child(last) && sibling(next)) { const kid: Step = next === "b" ? "s" : "d"; return `${asked} ${base.length ? one(kid) : "তোমারও " + stepNoun(kid, style)}।`; }
  if (child(last) && parent(next)) {
    if (!base.length) return `${asked} তুমি নিজে, নয়তো তোমার ${next === "f" ? "স্বামী" : "স্ত্রী"}।`;
    return `${asked} ${isMale(base.at(-1)!) === isMale(next) ? self + " নিজেই" : one(next === "f" ? "h" : "w")}।`;
  }
  if (spouse(last) && spouse(next)) return `${asked} ${self} নিজেই!`;
  if (spouse(last) && child(next)) return `${asked} ${base.length ? one(next) : "তোমারও " + stepNoun(next, style)}।`;
  return null;
}

export const isValidChain = (chain: readonly Step[]) => chain.length <= MAX_STEPS && chain.every((step, index) => !stepProblem(chain.slice(0, index), step, "c"));

/** The phrase people say: the term if this style has one, else "longest named part + plain steps" (চাচাতো ভাইয়ের স্ত্রী). */
export function phrase(chain: readonly Step[], style: Style): string {
  if (!chain.length) return "তুমি নিজেই";
  const named = termFor(chain, style);
  if (named) return named.replace(/ \/ /g, " বা ");
  let cut = chain.length - 1;
  while (cut > 1 && !termFor(chain.slice(0, cut), style)) cut--;
  const rest = chain.slice(cut).map(step => step === "f" ? "বাবা" : step === "m" ? "মা" : stepNoun(step, style));
  const words = [termFor(chain.slice(0, cut), style)!, ...rest];
  return words.map((word, index) => index < words.length - 1 ? kinPossessive(word) : word).join(" ");
}

/** "আব্বুর বোনের স্বামী". */
export const chainText = (chain: readonly Step[], style: Style) => chain.map((step, index) => index < chain.length - 1 ? stepLabel(step, style) : stepNoun(step, style)).join(" ");

/** Generation of the person at the end of the chain relative to me: parents +1, children −1. Drives the photo's age tint. */
export const generation = (chain: readonly Step[]) => chain.reduce((gen, step) => gen + (step === "f" || step === "m" ? 1 : step === "s" || step === "d" ? -1 : 0), 0);

export type Answer = {
  key: string;
  /** This style's word, or null. */
  term: string | null;
  /** The other style's word, or null. */
  other: string | null;
  /** True when neither style has a word. */
  unnamed: boolean;
  said: string;
  saidOther: string;
  entry: Entry | null;
};

export function answerFor(chain: readonly Step[], style: Style): Answer {
  const other: Style = style === "c" ? "k" : "c";
  const entry = terms[keyOf(chain)] ?? null;
  const term = termFor(chain, style);
  const otherTerm = termFor(chain, other);
  return { key: keyOf(chain), term, other: otherTerm, unnamed: !term && !otherTerm, said: phrase(chain, style), saidOther: phrase(chain, other), entry };
}

const lines: Record<Kind | "none", string> = {
  core: "সবচেয়ে কাছের ডাকগুলোই সবচেয়ে ছোট।",
  grand: "দুপুরবেলা গল্প শোনার মানুষ, নামটা শুনলেই মনে পড়ে।",
  elder: "এই বাসায় গেলে খালি মুখে ফেরা যায় না।",
  cousin: "কাজিনরা এক হলেই বাড়িটা জমে ওঠে।",
  inlaw: "বিয়ের পর পরিবারটা বড় হয়, ডাকের তালিকাও।",
  young: "ছোটদের মুখে নিজের ডাক শুনলে একটু বড় বড় লাগে।",
  bond: "বিয়ের পরেই এই ডাকগুলো চালু হয়।",
  none: "আলাদা নাম নেই, তবু বিয়েবাড়িতে ঠিকই চিনে ফেলবে।",
};

/** A warm line for the card, picked from what kind of relative the chain lands on. */
export function humanLine(chain: readonly Step[], style: Style) {
  if (!chain.length) return "তুমি তো তুমিই! ওপর থেকে একটা বোতাম চাপো।";
  const entry = terms[keyOf(chain)];
  return entry && entry[style] ? lines[entry.kind] : lines.none;
}

// A tiny deterministic shuffle so the same chain always shows the same quiz options (and tests can pin them).
function seeded(seed: string) {
  let state = [...seed].reduce((hash, char) => (hash * 31 + char.charCodeAt(0)) >>> 0, 7);
  return () => { state = (state * 1103515245 + 12345) >>> 0; return state / 2 ** 32; };
}

/** Three choices for the friend's quiz: the answer plus two same-gender terms of the same kind (ফুপা vs খালু vs মামা). */
export function quizOptions(chain: readonly Step[], style: Style): string[] | null {
  const answer = termFor(chain, style);
  const last = chain.at(-1);
  if (!answer || !last) return null;
  const kind = terms[keyOf(chain)]!.kind;
  const sameSex = (key: string) => isMale(key.split(".").at(-1) as Step) === isMale(last);
  const pick = (filter: (key: string) => boolean) => [...new Set(Object.keys(terms).filter(key => sameSex(key) && filter(key)).map(key => terms[key][style]).filter(term => term && term !== answer))];
  const random = seeded(keyOf(chain) + style);
  const shuffle = <T,>(items: T[]) => items.map(item => [random(), item] as const).sort((a, b) => a[0] - b[0]).map(([, item]) => item);
  const near = shuffle(pick(key => terms[key].kind === kind));
  const far = shuffle(pick(() => true)).filter(term => !near.includes(term));
  return shuffle([answer, ...[...near, ...far].slice(0, 2)]);
}

export function cleanName(name: string) {
  // Strip control and bidi-override characters so a shared link can't scramble the card text.
  return name.normalize("NFC").replace(/[\u0000-\u001f\u007f\u200e\u200f\u202a-\u202e\u2066-\u2069]/g, "").trim().replace(/\s+/g, " ").slice(0, MAX_NAME_LENGTH);
}

export type Shared = { chain: Step[]; style: Style; name: string };

export function shareHash({ chain, style, name }: Shared) {
  const params = new URLSearchParams({ c: keyOf(chain) });
  if (style === "k") params.set("d", "k");
  const shown = cleanName(name);
  if (shown) params.set("n", shown);
  return "#" + params.toString();
}

/** Only a real chain (1–4 known steps, no loops, no impossible spouse) counts as a shared link. */
export function parseShareHash(hash: string): Shared | null {
  const params = new URLSearchParams(hash.replace(/^#/, ""));
  const code = params.get("c") ?? "";
  if (!/^[fmbzhwsd](\.[fmbzhwsd]){0,3}$/.test(code)) return null;
  const chain = code.split(".").filter(isStep);
  if (!isValidChain(chain)) return null;
  return { chain, style: params.get("d") === "k" ? "k" : "c", name: cleanName(params.get("n") ?? "") };
}

/** Every chain the tool can show, for tests and the reviewer: all loop-free chains of 1–4 steps. */
export function allChains(): Step[][] {
  const out: Step[][] = [];
  const grow = (chain: Step[]) => {
    if (chain.length) out.push(chain);
    if (chain.length === MAX_STEPS) return;
    for (const step of STEPS) if (!stepProblem(chain, step, "c")) grow([...chain, step]);
  };
  grow([]);
  return out;
}

/** Ids people may count for "সবচেয়ে বেশি খোঁজা": only the reviewed, named chains. */
export const tallyIds = Object.keys(terms);

export function dictionaryUrl(head: string) {
  // The dictionary indexes ড় ঢ় য় as single code points; NFC text keeps them as letter + nukta.
  const query = head.normalize("NFC").replace(/[\u09a1\u09a2\u09af]\u09bc/g, pair => ({ "\u09a1": "\u09dc", "\u09a2": "\u09dd", "\u09af": "\u09df" })[pair[0]]!);
  return "https://accessibledictionary.gov.bd/bengali-to-bengali/?q=" + encodeURIComponent(query);
}

const numbers = new Intl.NumberFormat("bn-BD");
export const bn = (value: number) => numbers.format(value);

/** The Facebook caption: the chain, the answer in both styles, and the question that starts the comments. */
export function caption(chain: readonly Step[], style: Style) {
  const answer = answerFor(chain, style);
  const text = chainText(chain, style);
  if (answer.unnamed) return `${text}: আলাদা কোনো নাম নেই, বলে “${answer.said}”। তোমাদের বাসায় কী ডাকে?`;
  const homes = STYLES.find(item => item.id !== style)!.home;
  const both = answer.other && answer.other !== answer.term ? ` (${homes} ${answer.other.replace(/ \/ /g, " বা ")})` : "";
  return `${text} = ${answer.said}${both}। তোমাদের বাসায় কী ডাকে?`;
}

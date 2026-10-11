import { possessive } from "../../../shared/bangla";

export const MAX_NAME = 24;
export const MIN_YEAR = 2020;
export const MAX_YEAR = 2099;
// shortcut: the SEO copy names this year; bump it each December (the card itself follows the phone's date).
export const EDITION = 2026;

// Links store each pick as a 1-based position: once links are public, only append options; never reorder or delete.
export const prompts = [
  {
    id: "khabar", label: "বছরের খাবার", options: [
      { id: "kacchi", label: "কাচ্চি" },
      { id: "fuchka", label: "ফুচকা" },
      { id: "mayer-ranna", label: "মায়ের হাতের রান্না" },
      { id: "bhorta", label: "ভর্তা-ভাত" },
      { id: "ilish", label: "ইলিশ" },
      { id: "cha", label: "চা আর সিঙ্গারা" },
      { id: "khichuri", label: "বৃষ্টির দিনের খিচুড়ি" },
      { id: "aam", label: "আম" },
      { id: "pitha", label: "শীতের পিঠা" },
      { id: "momo", label: "মোমো" },
    ],
  },
  {
    id: "jayga", label: "বছরের জায়গা", options: [
      { id: "gram", label: "গ্রামের বাড়ি" },
      { id: "tong", label: "টং দোকান" },
      { id: "bichhana", label: "নিজের বিছানা" },
      { id: "chhad", label: "বাসার ছাদ" },
      { id: "desk", label: "অফিসের ডেস্ক" },
      { id: "table", label: "পড়ার টেবিল" },
      { id: "jam", label: "রাস্তার জ্যাম" },
      { id: "shomudro", label: "সমুদ্রের পাড়" },
      { id: "pahar", label: "পাহাড়" },
      { id: "probash", label: "প্রবাসের ঘর" },
    ],
  },
  {
    id: "shobdo", label: "বছরের শব্দ", options: [
      { id: "dhoirjo", label: "ধৈর্য" },
      { id: "notun", label: "নতুন শুরু" },
      { id: "dour", label: "দৌড়" },
      { id: "shanti", label: "শান্তি" },
      { id: "shekha", label: "শেখা" },
      { id: "shahosh", label: "সাহস" },
      { id: "opekkha", label: "অপেক্ষা" },
      { id: "bhalobasha", label: "ভালোবাসা" },
      { id: "bodol", label: "বদল" },
      { id: "ghum", label: "ঘুম" },
    ],
  },
  {
    id: "muhurto", label: "সেরা মুহূর্ত", options: [
      { id: "chakri", label: "নতুন চাকরি" },
      { id: "biye", label: "বিয়ে" },
      { id: "result", label: "রেজাল্ট" },
      { id: "deshe", label: "দেশে ফেরা" },
      { id: "tike", label: "শুধু টিকে থাকা" },
      { id: "otithi", label: "ঘরে নতুন অতিথি" },
      { id: "tour", label: "বন্ধুদের সাথে ট্যুর" },
      { id: "basha", label: "নতুন বাসা" },
      { id: "nijer", label: "নিজের কিছু শুরু" },
      { id: "maa-baba", label: "মা-বাবার মুখে হাসি" },
    ],
  },
  {
    id: "chai", label: "সামনের বছর চাই", options: [
      { id: "shanti", label: "একটু শান্তি" },
      { id: "shustho", label: "সবাই সুস্থ থাকুক" },
      { id: "ghum", label: "পুরো আট ঘণ্টা ঘুম" },
      { id: "tour", label: "একটা লম্বা ট্যুর" },
      { id: "jomano", label: "কিছু টাকা জমানো" },
      { id: "poribar", label: "পরিবারের সাথে সময়" },
      { id: "nijer", label: "নিজের জন্য সময়" },
      { id: "biye", label: "বিয়েটা এবার হোক" },
      { id: "deshe", label: "দেশে ফেরা" },
      { id: "shekha", label: "নতুন কিছু শেখা" },
    ],
  },
] as const;

/** The editorial on the cover, one per সেরা মুহূর্ত: the human line. */
export const editorials: Record<(typeof prompts)[3]["options"][number]["id"], string> = {
  chakri: "নতুন অফিস, নতুন মানুষ, আর নিজের ওপর নতুন ভরসা।",
  biye: "এ বছর জীবনে একজন মানুষ যোগ হলো, সাথে পুরো একটা পরিবার।",
  result: "রাত জাগা পড়াগুলো এ বছর ঠিকই কথা রেখেছে।",
  deshe: "এয়ারপোর্টের গেটে মায়ের মুখটা দেখেই বছরটা ভরে গেল।",
  tike: "এ বছর টিকে থাকাটাই ছিল বড় জয়।",
  otithi: "ঘরে ছোট্ট একজন এলো, আর বাসার সব নিয়ম বদলে গেল।",
  tour: "বন্ধুদের সাথে সেই ট্যুরের গল্প আরও দশ বছর চলবে।",
  basha: "নতুন বাসা, নতুন জানালা, জানালায় নতুন আকাশ।",
  nijer: "ভয় নিয়েই শুরু করেছিলাম, এখন সেটাই আমার গর্ব।",
  "maa-baba": "মা-বাবার মুখের হাসিটাই এ বছরের সবচেয়ে বড় পাওয়া।",
};

/** A finished sample so the first screen is never empty: কাচ্চি, টং দোকান, ধৈর্য, শুধু টিকে থাকা, একটু শান্তি. */
export const DEFAULT_PICKS: readonly number[] = [0, 1, 0, 4, 0];
export const WORD = 2;
export const MOMENT = 3;

export type Cover = { year: number; picks: number[]; name: string };

const digits = "০১২৩৪৫৬৭৮৯";
/** Bangla digits without thousands separators, so a year reads ২০২৬, not ২,০২৬. */
export const bn = (value: number) => String(value).replace(/\d/g, digit => digits[Number(digit)]);

/** Late in the year people recap this year; in January they are still recapping the last one. */
export const defaultYear = (now: Date) => now.getMonth() === 0 ? now.getFullYear() - 1 : now.getFullYear();

export const daysIn = (year: number) => new Date(Date.UTC(year, 1, 29)).getUTCMonth() === 1 ? 366 : 365;

export function fridaysIn(year: number) {
  let count = 0;
  for (let day = 0; day < daysIn(year); day++) if (new Date(Date.UTC(year, 0, 1 + day)).getUTCDay() === 5) count++;
  return count;
}

export function cleanName(name: string) {
  // NFC so one name has one spelling; strip control and bidi-override characters so a link can't scramble the cover.
  return name.normalize("NFC").replace(/[\u0000-\u001f\u007f-\u009f‎‏‪-‮⁦-⁩]/g, " ").replace(/\s+/g, " ").trim().slice(0, MAX_NAME).trim();
}

export const pickLabel = (cover: Cover, prompt: number) => prompts[prompt].options[cover.picks[prompt]].label;
export const wordId = (cover: Cover) => prompts[WORD].options[cover.picks[WORD]].id;
export const editorial = (cover: Cover) => editorials[prompts[MOMENT].options[cover.picks[MOMENT]].id];
export const owner = (name: string) => name ? possessive(name) : "আমার";
export const coverTitle = (cover: Cover) => `${owner(cover.name)} বার্ষিকী ${bn(cover.year)}`;

export function stateOf({ year, picks, name }: Cover) {
  const params = new URLSearchParams({ y: String(year), p: picks.map(pick => pick + 1).join(",") });
  const shown = cleanName(name);
  if (shown) params.set("n", shown);
  return params.toString();
}

export const shareHash = (cover: Cover) => "#" + stateOf(cover);

export function parseShareHash(hash: string): Cover | null {
  const params = new URLSearchParams(hash.replace(/^#/, "").slice(0, 600));
  const year = params.get("y") ?? "";
  const parts = (params.get("p") ?? "").split(",");
  if (!/^\d{4}$/.test(year) || Number(year) < MIN_YEAR || Number(year) > MAX_YEAR || parts.length !== prompts.length) return null;
  const picks = parts.map((part, index) => /^\d{1,2}$/.test(part) && Number(part) >= 1 && Number(part) <= prompts[index].options.length ? Number(part) - 1 : -1);
  if (picks.includes(-1)) return null;
  return { year: Number(year), picks, name: cleanName(params.get("n") ?? "") };
}

export function caption(cover: Cover) {
  // The poster writes it, so it's always first person, whatever name is on the cover.
  return `আমার ${bn(cover.year)}, এক প্রচ্ছদে। বছরের শব্দ: ${pickLabel(cover, WORD)}। সেরা মুহূর্ত: ${pickLabel(cover, MOMENT)}। তোমার বছরের শব্দ কী?`;
}

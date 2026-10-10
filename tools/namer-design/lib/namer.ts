import { possessive } from "../../../shared/bangla";

export const MAX_NAME = 16;
export const PLACEHOLDER_NAME = "তোমার নাম";

// Lettering styles. Share links store the id: never rename or delete one once links are public.
// No rickshaw lettering on purpose: রিকশার রং already owns that look.
export const styles = [
  { id: "tile", label: "টালি", phrase: "বর্ণপরিচয়ের টালিতে" },
  { id: "alpana", label: "আলপনা", phrase: "উঠোনের আলপনায়" },
  { id: "gold", label: "বিয়ের কার্ড", phrase: "বিয়ের কার্ডের সোনালি অক্ষরে" },
  { id: "chalk", label: "স্লেটে চক", phrase: "স্লেটে চক দিয়ে" },
  { id: "neon", label: "নিয়ন সাইন", phrase: "নিয়ন সাইনবোর্ডে" },
  { id: "nakshi", label: "নকশি সুতো", phrase: "নকশি কাঁথার সুতোয়" },
  { id: "bijoy", label: "লাল-সবুজ", phrase: "লাল-সবুজে" },
  { id: "ekushe", label: "একুশের সাদা-কালো", phrase: "একুশের সাদা-কালোয়" },
] as const;

export type StyleId = (typeof styles)[number]["id"];
export type Design = { name: string; style: StyleId; from: string };

export const defaultDesign: Design = { name: "", style: "tile", from: "" };
export const styleById = (id: string) => styles.find(style => style.id === id);

// shortcut: a short public-card blocklist copied from tools/amar-jersey (no shared filter yet); move both to shared/ when one exists.
// Long, distinctive words match anywhere (after spaces and dots are squeezed out); short ones only as a whole word, so ইকবাল/Iqbal stays fine.
const blockedParts = ["চোদা", "চুদি", "চুদ", "চোদন", "মাদারচোদ", "বোকাচোদ", "খানকি", "খাংকি", "মাগি", "মাগী", "হারামি", "হারামজাদ", "বেশ্যা", "কুত্তারবাচ্চা", "শুয়োরেরবাচ্চা", "শুয়রেরবাচ্চা", "গান্ডু", "ভোদা",
  "fuck", "bitch", "pussy", "porn", "khanki", "khangki", "harami", "haramjada", "haramzada", "madarchod", "bokachod", "choda", "chodi", "chudi", "chudir", "gandu", "kuttarbacc", "kuttarbach", "shuorerbacc", "bainchod", "behenchod"];
const blockedWords = new Set(["বাল", "চোদ", "bal", "baal", "chod", "chud", "chodu", "fuk", "shit", "magi", "maggi", "randi", "besha", "dick", "sex", "nude", "cock", "ass"]);

export function isBlocked(text: string) {
  const lower = text.normalize("NFC").toLowerCase().replace(/[‌‍]/g, "");
  const squeezed = lower.replace(/[^ঀ-৿a-z]/g, "");
  return blockedParts.some(part => squeezed.includes(part)) || lower.split(/[^ঀ-৿a-z]+/).some(word => blockedWords.has(word));
}

/** Keeps Bangla, Latin letters and single spaces (no digits or symbols), NFC, capped at MAX_NAME characters. Anything on the blocklist becomes "". */
export function cleanName(raw: string) {
  const name = raw.normalize("NFC").replace(/[০-৯]/g, "").replace(/[^ঀ-৿A-Za-z ‌‍]/g, "").replace(/\s+/g, " ").trim();
  const capped = [...name].slice(0, MAX_NAME).join("").trim();
  return isBlocked(capped) ? "" : capped;
}

const MARK = /[ঁ-ঃ়া-ৌৗৢৣ‌‍]/;
const CONSONANT = /[\u0995-\u09b9\u09ce\u09dc-\u09df]/;
const VIRAMA = "্";

/**
 * Splits a name into the letters a reader sees (যুক্তাক্ষর stay whole: "শ্রাবন্তী" → শ্রা, ব, ন্তী), so each one can sit on its own tile.
 * Spaces come back as " ".
 */
export function letters(name: string) {
  const out: string[] = [];
  let joining = false;
  for (const char of name.normalize("NFC")) {
    const last = out.length - 1;
    if (last >= 0 && out[last] !== " " && (MARK.test(char) || char === VIRAMA || (joining && CONSONANT.test(char)))) out[last] += char;
    else out.push(char);
    if (char === VIRAMA) joining = true;
    else if (!/[‌‍]/.test(char)) joining = false;
  }
  return out;
}

// One line per first letter, warm and from everyday Bangladesh. Latin names and rare letters get one of the general lines.
const firstLetterLines: Record<string, string> = {
  "অ": "অ দিয়ে শুরু, অপরাজিতার মতো নীল আর নরম নাম।",
  "আ": "আ দিয়ে শুরু, আমের মুকুলের মতো, শুনলেই মন ভালো।",
  "ই": "ই দিয়ে শুরু, ইলিশের মতো, সবার প্রিয়।",
  "ঈ": "ঈ দিয়ে শুরু, ঈগলের মতো উঁচুতে ওড়া নাম।",
  "উ": "উ দিয়ে শুরু, উঠোনের রোদের মতো উষ্ণ নাম।",
  "ঊ": "ঊ দিয়ে শুরু, ঊষার আলোর মতো, দিনের প্রথম নাম।",
  "ঋ": "ঋ দিয়ে শুরু, এমন নাম কমই হয়, তাই আরও আলাদা।",
  "এ": "এ দিয়ে শুরু, একতারার সুরের মতো সহজ আর মিঠে।",
  "ঐ": "ঐ দিয়ে শুরু, পুরনো সিন্দুকের গয়নার মতো দুর্লভ নাম।",
  "ও": "ও দিয়ে শুরু, ডাক দিলেই সাড়া দেয় এমন নাম।",
  "ঔ": "ঔ দিয়ে শুরু, বর্ণমালার শেষ স্বর, তাই মনে থাকে।",
  "ক": "ক দিয়ে শুরু, কদম ফুলের মতো, বর্ষা এলেই মনে পড়ে।",
  "খ": "খ দিয়ে শুরু, খেজুরের রসের মতো, শীতের সকালের নাম।",
  "গ": "গ দিয়ে শুরু, গাঙচিলের মতো, নদীর ওপর ভেসে থাকে।",
  "ঘ": "ঘ দিয়ে শুরু, ঘুড়ির মতো, সুতো ছাড়লেই আকাশে।",
  "চ": "চ দিয়ে শুরু, চায়ের কাপের মতো, আড্ডা জমিয়ে দেয়।",
  "ছ": "ছ দিয়ে শুরু, ছাতিম ফুলের ঘ্রাণের মতো, দূর থেকেও টের পাওয়া যায়।",
  "জ": "জ দিয়ে শুরু, জোনাকির মতো, অন্ধকারেও জ্বলে।",
  "ঝ": "ঝ দিয়ে শুরু, ঝুম বৃষ্টির মতো, একবার এলে থামে না।",
  "ট": "ট দিয়ে শুরু, টিনের চালে বৃষ্টির শব্দের মতো নাম।",
  "ঠ": "ঠ দিয়ে শুরু, ঠোঁটে লেগে থাকা গানের মতো নাম।",
  "ড": "ড দিয়ে শুরু, ডাকপিয়নের আনা চিঠির মতো, অপেক্ষার নাম।",
  "ঢ": "ঢ দিয়ে শুরু, ঢোলের তালের মতো, শুনলেই পা নাচে।",
  "ত": "ত দিয়ে শুরু, তারার মতো, রাত যত গভীর তত উজ্জ্বল।",
  "থ": "থ দিয়ে শুরু, থইথই বর্ষার মতো ভরা নাম।",
  "দ": "দ দিয়ে শুরু, দোয়েলের শিসের মতো, ভোরবেলার নাম।",
  "ধ": "ধ দিয়ে শুরু, ধানক্ষেতের ঢেউয়ের মতো সবুজ নাম।",
  "ন": "ন দিয়ে শুরু, নদীর মতো, যেতে যেতে গল্প বলে।",
  "প": "প দিয়ে শুরু, শীতের পিঠার মতো, সবাই খোঁজ করে।",
  "ফ": "ফ দিয়ে শুরু, ফানুসের মতো, আলো নিয়ে ওপরে ওঠে।",
  "ব": "ব দিয়ে শুরু, বকুলের মালার মতো, শুকিয়েও সুবাস রাখে।",
  "ভ": "ভ দিয়ে শুরু, ভাটিয়ালির সুরের মতো, নদীর বুকে ভাসে।",
  "ম": "ম দিয়ে শুরু, ‘মা’ ডাকের মতোই আপন নাম।",
  "য": "য দিয়ে শুরু, যাত্রাপালার মতো, সবাইকে টেনে আনে।",
  "র": "র দিয়ে শুরু, রোদ্দুরের মতো ঝলমলে নাম।",
  "ল": "ল দিয়ে শুরু, লাটিমের মতো, মাথায় ঘুরতেই থাকে।",
  "শ": "শ দিয়ে শুরু, শাপলার মতো, বিলের বুকে ফুটে থাকে।",
  "ষ": "ষ দিয়ে শুরু, ষড়ঋতুর মতো, ছয় রঙের নাম।",
  "স": "স দিয়ে শুরু, সর্ষে ক্ষেতের মতো হলুদ আর হাসিখুশি।",
  "হ": "হ দিয়ে শুরু, হারিকেনের আলোর মতো, ছোট কিন্তু ঘর ভরায়।",
};

const generalLines = [
  "নামটা ছোট্ট, কিন্তু ডাক দিলে পুরো পাড়া শোনে।",
  "খাতার শেষ পাতায় লিখে রাখার মতো নাম।",
  "সাজালে নামটা আরও নিজের লাগে।",
  "স্কুলের বেঞ্চে খোদাই করা নামের মতো, থেকে যায়।",
  "এই নামে চিঠি এলে খুশি লাগে।",
  "নামের গায়ে একটু রং, আর মানুষটা হাসছে।",
  "এই নাম ধরে ডাকলে কেউ না কেউ ফিরে তাকায়।",
  "নামটা শুনলেই মুখটা মনে পড়ে।",
  "নামটা ছোট, স্মৃতিগুলো বড়।",
  "বারান্দা থেকে মা যে নামে ডাকে, সেটাই সবচেয়ে সুন্দর।",
];

/** The human line: by the first letter, except the two national styles, which stay sober. */
export function humanLine(design: Pick<Design, "name" | "style">) {
  if (design.style === "ekushe") return "মায়ের ভাষায় লেখা আমার নাম।";
  if (design.style === "bijoy") return "লাল-সবুজে লেখা আমার নাম।";
  const name = cleanName(design.name);
  const first = name[0] ?? "";
  if (firstLetterLines[first]) return firstLetterLines[first];
  const seed = [...name].reduce((sum, char) => sum + char.charCodeAt(0), 0);
  return generalLines[seed % generalLines.length];
}

export function shareHash(design: Design) {
  const params = new URLSearchParams();
  const name = cleanName(design.name), from = cleanName(design.from);
  if (name) params.set("n", name);
  params.set("st", design.style);
  if (from) params.set("f", from);
  return "#" + params.toString();
}

/** Null unless the hash carries a real style and a printable name; in-page anchors like #result are ignored. */
export function parseShareHash(hash: string): Design | null {
  let params: URLSearchParams;
  try { params = new URLSearchParams(hash.replace(/^#/, "")); } catch { return null; }
  const style = styleById(params.get("st") ?? "");
  const name = cleanName(params.get("n") ?? "");
  if (!style || !name) return null;
  return { name, style: style.id, from: cleanName(params.get("f") ?? "") };
}

export function caption(design: Design) {
  const name = cleanName(design.name), from = cleanName(design.from);
  const style = styleById(design.style)!;
  if (from && name) return `${name}, তোমার নামটা ${style.phrase} সাজিয়ে দিলাম। পছন্দ হলো?`;
  return `আমার নামটা লিখলাম ${style.phrase}। তুমি তোমারটা কোন ঢঙে সাজাবে? বানিয়ে দেখো:`;
}

export function previewTitle(design: Design | null) {
  if (!design) return "নিজের নাম, নিজের মতো সাজাও — নামের ডিজাইন";
  if (design.from) return `${design.from} তোমার নামটা সাজিয়ে পাঠিয়েছে, ${design.name}!`;
  return `${possessive(design.name)} নাম ${styleById(design.style)!.phrase} — তোমারটা সাজাও`;
}

// Fixed ids only: the style. Never the name.
export const tallyIds = styles.map(style => style.id);

export { possessive };

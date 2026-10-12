export const MAX_NAME = 12;

// The copybook order, F-L-A-M-E-S. Links store names only and the result is recomputed, so labels may change; the order may not.
// Kind outcomes only: E (Enemies) is played as ঝগড়ুটে বন্ধু, never শত্রু. Two human lines each, picked by the letters left.
export const outcomes = [
  { letter: "F", label: "বন্ধু", lines: ["টিফিন ভাগ করে খাওয়ার বন্ধু, সারাজীবনের।", "এক বেঞ্চে বসা, এক খাতায় কাটাকাটি।"] },
  { letter: "L", label: "প্রেম", lines: ["খাতার শেষ পাতা জানে, আর কেউ না।", "স্যার দেখার আগেই পাতাটা উল্টে ফেলো।"] },
  { letter: "A", label: "ভালো লাগা", lines: ["দেখা হলেই মনটা একটু ভালো হয়ে যায়।", "নামটা শুনলেই মুখে একটু হাসি।"] },
  { letter: "M", label: "বিয়ে", lines: ["আগে পরীক্ষা, তারপর দাওয়াত!", "কার্ড ছাপাতে দিয়ো না, এটা খেলা!"] },
  { letter: "E", label: "ঝগড়ুটে বন্ধু", lines: ["রোজ ঝগড়া, তবু টিফিনের সময় পাশাপাশি।", "কথা বন্ধ এক দিনের, বন্ধুত্ব সারাজীবনের।"] },
  { letter: "S", label: "ভাইবোন", lines: ["চুল টানাটানি আর চকলেট ভাগাভাগি।", "ঝগড়া করবে, আবার আগলেও রাখবে।"] },
] as const;

export type Pair = { a: string; b: string };
// The sample shares a letter (রা) so the first screen shows a real crossing-out, and lands on the friendliest answer.
export const samplePair: Pair = { a: "রাফি", b: "রাইসা" };

const bnFormat = new Intl.NumberFormat("bn-BD");
export const bn = (value: number) => bnFormat.format(value);

// Copied from tools/amar-jersey/lib/jersey.ts (tools don't import each other).
// shortcut: a short public-card blocklist, not a full moderation filter; extend it when reports come in.
// Long, distinctive words match anywhere (after spaces and dots are squeezed out); short ones only as a whole word, so ইকবাল/Iqbal stays fine.
const blockedParts = ["চোদা", "চুদি", "চুদ", "চোদন", "মাদারচোদ", "বোকাচোদ", "খানকি", "খাংকি", "মাগি", "মাগী", "হারামি", "হারামজাদ", "বেশ্যা", "কুত্তারবাচ্চা", "শুয়োরেরবাচ্চা", "শুয়রেরবাচ্চা", "গান্ডু", "ভোদা",
  "fuck", "bitch", "pussy", "porn", "khanki", "khangki", "harami", "haramjada", "haramzada", "madarchod", "bokachod", "choda", "chodi", "chudi", "chudir", "gandu", "kuttarbacc", "kuttarbach", "shuorerbacc", "bainchod", "behenchod"];
const blockedWords = new Set(["বাল", "চোদ", "bal", "baal", "chod", "chud", "chodu", "fuk", "shit", "magi", "maggi", "randi", "besha", "dick", "sex", "nude", "cock", "ass"]);

export function isBlocked(text: string) {
  const lower = text.normalize("NFC").toLowerCase().replace(/[‌‍]/g, "");
  const squeezed = lower.replace(/[^ঀ-৿a-z]/g, "");
  return blockedParts.some(part => squeezed.includes(part)) || lower.split(/[^ঀ-৿a-z]+/).some(word => blockedWords.has(word));
}

/** Keeps Bangla, Latin letters, digits and single spaces, NFC, capped at MAX_NAME characters. Anything on the blocklist becomes "". */
export function cleanName(raw: string) {
  const name = raw.normalize("NFC").replace(/[^ঀ-৿A-Za-z0-9 ‌‍]/g, "").replace(/\s+/g, " ").trim();
  const capped = [...name].slice(0, MAX_NAME).join("").trim();
  return isBlocked(capped) ? "" : capped;
}

// A Bangla "letter" is what a child would strike with one line: a consonant or vowel with its vowel signs, ঁ ং ঃ, nukta,
// and any conjunct joined by hasanta (শু, ভ্র, র্ক, ক্ষ). Hand-rolled instead of Intl.Segmenter, whose conjunct rules changed
// in Unicode 15.1, so the same two names give the same answer on every phone.
const LETTER_START = /[A-Za-zঅ-ঔক-হৎ\u09dc-\u09dfৠৡৰৱ]/;
const ATTACHES = /[ঁ-ঃ়া-্ৗৢৣ‌‍]/;
const CONSONANT = /[ক-হ\u09dc-\u09dfৰৱ]/;

/** The name split into the letters that get crossed out; spaces and digits don't count. Latin is shown in capitals, like on the khata. */
export function letters(name: string) {
  const units: string[] = [];
  for (const char of cleanName(name)) {
    const last = units.at(-1);
    if (last && (ATTACHES.test(char) || (CONSONANT.test(char) && /্[‌‍]?$/.test(last)))) units[units.length - 1] = last + char;
    else if (LETTER_START.test(char)) units.push(char.toUpperCase());
  }
  return units;
}

const isBangla = (name: string) => /[ঀ-৿]/.test(name);
const isLatin = (name: string) => /[A-Za-z]/.test(name);
/** One name in Bangla and the other in English letters can never cancel each other. */
export const mixedScripts = (pair: Pair) => (isBangla(pair.a) && isLatin(pair.b) && !isBangla(pair.b)) || (isLatin(pair.a) && isBangla(pair.b) && !isBangla(pair.a));

export type Game = {
  a: string[];
  b: string[];
  /** Crossed-out pairs in the order they're struck: [index in a, index in b]. */
  pairs: [number, number][];
  /** Letters left on both sides after the crossing. */
  left: number;
  /** FLAMES indexes in the order they're struck. */
  struck: number[];
  result: number;
};

/** The copybook game: strike every shared letter once from each name, count what's left, then count round F-L-A-M-E-S striking where the count lands, until one is left. */
export function play(pair: Pair): Game {
  const a = letters(pair.a), b = letters(pair.b);
  const key = (unit: string) => unit.replace(/[\u200c\u200d]/g, "");
  const used = new Set<number>();
  const pairs: [number, number][] = [];
  a.forEach((unit, i) => {
    const j = b.findIndex((other, index) => !used.has(index) && key(other) === key(unit));
    if (j >= 0) { used.add(j); pairs.push([i, j]); }
  });
  const left = a.length + b.length - pairs.length * 2;
  const struck: number[] = [];
  const ring = [0, 1, 2, 3, 4, 5];
  // Same letters on both sides leave nothing to count with; the khata answer was "বন্ধু".
  if (left > 0) {
    let start = 0;
    while (ring.length > 1) {
      const at = (start + left - 1) % ring.length;
      struck.push(ring.splice(at, 1)[0]);
      start = at % ring.length;
    }
  }
  return { a, b, pairs, left, struck, result: left > 0 ? ring[0] : 0 };
}

export const outcome = (game: Game) => outcomes[game.result];
export const humanLine = (game: Game) => outcome(game).lines[game.left % 2];

export function shareHash(pair: Pair) {
  const params = new URLSearchParams();
  params.set("a", cleanName(pair.a));
  params.set("b", cleanName(pair.b));
  return "#" + params.toString();
}

/** Null unless both names survive cleaning and have at least one letter; in-page anchors like #result are ignored. */
export function parseShareHash(hash: string): Pair | null {
  let params: URLSearchParams;
  try { params = new URLSearchParams(hash.replace(/^#/, "")); } catch { return null; }
  const a = cleanName(params.get("a") ?? ""), b = cleanName(params.get("b") ?? "");
  return letters(a).length && letters(b).length ? { a, b } : null;
}

export function caption(pair: Pair) {
  const game = play(pair);
  return `খাতার শেষ পাতায় ফ্লেমস খেললাম: ${cleanName(pair.a)} + ${cleanName(pair.b)} = ${outcome(game).label}! ${humanLine(game)} তোমাদের কী আসে? খেলে দেখো:`;
}

/** The link preview names only the person who played, never the second name. */
export function previewTitle(pair: Pair | null) {
  if (!pair) return "দুই নাম, এক খেলা: ফ্লেমসে কী আসে?";
  return `${cleanName(pair.a)} ফ্লেমস খেলেছে, তুমিও খেলো`;
}

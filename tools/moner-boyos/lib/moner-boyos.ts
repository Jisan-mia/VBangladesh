import { possessive } from "../../../shared/bangla";

export const MAX_NAME = 20;

// Each option scores 0 (চঞ্চল), 1 (মাঝামাঝি) or 2 (ধীরস্থির). Options are listed in the order shown, so the
// "young" answer isn't always first. The link stores the shown position (`a=01201120`): never reorder an option,
// only reword it in place. `line` is what the ticket's মন্তব্য says when this answer is picked for it.
// Just for fun: no psychology, no health claim. Every answer is a kind one.
export const questions = [
  { ask: "সকালের প্রথম চুমুক?", options: [
    { label: "দুধ চা, কড়া লিকার", score: 1, line: "কড়া লিকারের দুধ চা ছাড়া চোখ খোলে না" },
    { label: "কোল্ড কফি", score: 0, line: "সকাল শুরু হয় বরফ দেওয়া কফিতে" },
    { label: "আদা দিয়ে লাল চা", score: 2, line: "আদা-চায়ের ভাপেই দিনটা গুছিয়ে নেয়" },
  ] },
  { ask: "গান শোনো কোথায়?", options: [
    { label: "রেডিওতে, যা বাজে", score: 2, line: "রেডিওতে যা বাজে, তাতেই গুনগুন করে" },
    { label: "রিলে, ১৫ সেকেন্ড করে", score: 0, line: "রিলের ১৫ সেকেন্ডেই একটা গান মুখস্থ করে ফেলে" },
    { label: "নিজের প্লেলিস্টে", score: 1, line: "নিজের প্লেলিস্ট নিজেই যত্ন করে সাজায়" },
  ] },
  { ask: "১০ মিনিটের পথ, কীভাবে যাবে?", options: [
    { label: "অ্যাপে বাইক ডাকি", score: 0, line: "অ্যাপে বাইক ডেকে হাওয়ার বেগে ছোটে" },
    { label: "হেঁটেই চলে যাই", score: 2, line: "হাঁটতে হাঁটতে পাড়ার সবার খোঁজ নেয়" },
    { label: "মামা, যাবেন? রিকশা", score: 1, line: "রিকশার হুড ফেলে শহর দেখতে ভালোবাসে" },
  ] },
  { ask: "হঠাৎ ঝুম বৃষ্টি!", options: [
    { label: "আগে ছাদের কাপড় তুলি", score: 2, line: "বৃষ্টি এলেই আগে সবার কাপড়ের কথা মনে পড়ে" },
    { label: "জানালায় বসে গান", score: 1, line: "বৃষ্টি নামলে জানালার পাশে গান খোঁজে" },
    { label: "ছাদে গিয়ে ভিজি", score: 0, line: "এখনো বৃষ্টি দেখলে ভিজতে চায়" },
  ] },
  { ask: "শুক্রবারের সকাল?", options: [
    { label: "দুপুর পর্যন্ত ঘুম", score: 0, line: "ছুটির দিনের ঘুম কারও জন্য ভাঙে না" },
    { label: "সকাল সকাল বাজারে", score: 2, line: "ছুটির সকালে তাজা মাছ খুঁজতে বাজারে যায়" },
    { label: "বন্ধুদের সাথে আড্ডা", score: 1, line: "ছুটি মানেই চায়ের দোকানে লম্বা আড্ডা" },
  ] },
  { ask: "মেসেজের উত্তর দাও কীভাবে?", options: [
    { label: "লম্বা ভয়েস মেসেজে", score: 1, line: "লম্বা ভয়েস মেসেজে মনের সব কথা বলে" },
    { label: "সোজা ফোন করি", score: 2, line: "লেখার চেয়ে ফোন করে গলা শুনতে ভালোবাসে" },
    { label: "মিম আর স্টিকারে", score: 0, line: "একটা মিমেই সব কথা বলে দেয়" },
  ] },
  { ask: "রাত ১২টা বাজে, তুমি?", options: [
    { label: "রাত তো মাত্র শুরু", score: 0, line: "রাত বারোটায় মনটা সবচেয়ে জেগে থাকে" },
    { label: "আর এক পর্ব দেখেই ঘুম", score: 1, line: "‘আর এক পর্ব’ বলে আরও তিন পর্ব দেখে" },
    { label: "কখন ঘুমিয়ে গেছি!", score: 2, line: "তাড়াতাড়ি ঘুমিয়ে ভোরের আলো দেখে" },
  ] },
  { ask: "দাওয়াতে গেলে তুমি কোথায়?", options: [
    { label: "বড়দের গল্পের আসরে", score: 2, line: "বড়দের আসরে বসে পুরোনো দিনের গল্প শোনে" },
    { label: "খাবার টেবিলের কাছে", score: 1, line: "দাওয়াতে গিয়ে খাবার টেবিলটা আগে চিনে নেয়" },
    { label: "ছোটদের সাথে খেলায়", score: 0, line: "দাওয়াতে গেলে ছোটদের দলে ভিড়ে যায়" },
  ] },
] as const;

export const QUESTION_COUNT = questions.length;

// Five age buckets, each with a kind line: old is never "bad", young is never "childish". `target` is the
// answer score whose line best fits the bucket, used to pick the ticket's মন্তব্য.
export const buckets = [
  { id: "kishor", upTo: 19, label: "কিশোর মন", target: 0, kind: "মনটা এখনো টিফিনের ঘণ্টার অপেক্ষায় থাকে।" },
  { id: "torun", upTo: 29, label: "তরুণ মন", target: 0, kind: "দুনিয়াটা ঘুরে দেখার তাড়া এখনো মনে।" },
  { id: "bhora", upTo: 44, label: "ভরা নদীর মন", target: 1, kind: "দায়িত্বও নিয়েছে, মজাটাও ছাড়েনি।" },
  { id: "dighi", upTo: 59, label: "শান্ত দিঘির মন", target: 2, kind: "তাড়াহুড়া নেই, যা করে মন দিয়ে করে।" },
  { id: "bot", upTo: Infinity, label: "বটগাছের মন", target: 2, kind: "সবার গল্প শোনার ধৈর্য আর ছায়া দেওয়ার মতো মন।" },
] as const;
export type Bucket = (typeof buckets)[number];

export type Answer = 0 | 1 | 2;
export type Reading = { answers: Answer[]; name: string };

const bnFormat = new Intl.NumberFormat("bn-BD");
export const bn = (value: number) => bnFormat.format(value);

const scoreOf = (answers: readonly Answer[]) => answers.map((answer, index) => questions[index].options[answer].score as number);

/** 12 to 70. The digit-weighted offset spreads equal scores over nearby ages so friends don't all tie. */
export function heartAge(answers: readonly Answer[]) {
  const total = scoreOf(answers).reduce((sum, score) => sum + score, 0);
  const offset = answers.reduce<number>((sum, answer, index) => sum + answer * (index + 1), 0) % 3;
  return 12 + Math.round(total * 3.5) + offset;
}

/** The needle while answering: where the answers so far point, on the same scale. */
export function runningAge(answers: readonly Answer[]) {
  if (!answers.length) return null;
  const scores = scoreOf(answers);
  return 12 + Math.round((scores.reduce((sum, score) => sum + score, 0) / scores.length) * 8 * 3.5);
}

export const bucketOf = (age: number): Bucket => buckets.find(bucket => age <= bucket.upTo)!;

/** The ticket's মন্তব্য: one of the person's own answers, the one nearest the bucket, starting at a spot set by the answers so it varies. */
export function comment(answers: readonly Answer[]) {
  const target = bucketOf(heartAge(answers)).target;
  const scores = scoreOf(answers);
  const start = answers.reduce<number>((sum, answer) => sum + answer, 0) % answers.length;
  let best = start;
  for (let step = 0; step < answers.length; step++) {
    const index = (start + step) % answers.length;
    if (Math.abs(scores[index] - target) < Math.abs(scores[best] - target)) best = index;
  }
  return questions[best].options[answers[best]].line;
}

/** A ticket number like the mela machines print; fixed by the answers so a shared ticket looks the same. */
const plain = new Intl.NumberFormat("bn-BD", { useGrouping: false });
export const ticketNumber = (answers: readonly Answer[]) => plain.format(1000 + (answers.reduce<number>((sum, answer) => sum * 3 + answer, 0) % 9000));

// Copied from tools/daknam/lib/daknam.ts (tools don't import each other).
// shortcut: a short public-card blocklist, not a full moderation filter; extend it when reports come in.
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

export function shareHash({ answers, name }: Reading) {
  const params = new URLSearchParams({ a: answers.join("") });
  const shown = cleanName(name);
  if (shown) params.set("n", shown);
  return "#" + params.toString();
}

/** Null unless the hash holds all eight answers; in-page anchors like #result are ignored. */
export function parseShareHash(hash: string): Reading | null {
  let params: URLSearchParams;
  try { params = new URLSearchParams(hash.replace(/^#/, "")); } catch { return null; }
  const digits = params.get("a") ?? "";
  if (!new RegExp(`^[0-2]{${QUESTION_COUNT}}$`).test(digits)) return null;
  return { answers: [...digits].map(Number) as Answer[], name: cleanName(params.get("n") ?? "") };
}

export function caption({ answers }: Reading) {
  const age = heartAge(answers);
  return `মেলার মেশিনে মেপে দেখলাম, আমার মনের বয়স ${bn(age)}! মন্তব্য: ${comment(answers)}। তোমার মনের বয়স কত?`;
}

export function previewTitle(reading: Reading | null) {
  if (!reading) return "মনের বয়স কত? — ৮ প্রশ্নে মেপে দেখো";
  const who = reading.name ? `${possessive(reading.name)} মন` : "এক বন্ধুর মন";
  return `${who} ${bn(heartAge(reading.answers))}, তোমার? — মনের বয়স মাপো`;
}

// Fixed ids only: the age bucket, never the name.
export const tallyIds = buckets.map(bucket => bucket.id);

export { possessive };

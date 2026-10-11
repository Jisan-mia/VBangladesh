import { possessive } from "../../../shared/bangla";

export const MAX_NAME = 20;

// Nine bhortas, every one of them lovable: no mean trait, no "worst" result. `tag` goes under the name on the
// card, `line` is the warm personality line. `ball`/`fleck` paint the bhorta ball. Just for fun, no food or health claim.
export const bhortas = [
  { id: "alu", name: "আলু ভর্তা", tag: "সবার আপন, সবার আগে শেষ", line: "যে বাসাতেই যাও, সবাই তোমাকেই চায়। মন ভার হোক, মাসের শেষ হোক, বৃষ্টির দুপুর হোক, সবখানে তুমিই ভরসা।", ball: "#e9cf86", fleck: "#2f8a3a" },
  { id: "begun", name: "বেগুন ভর্তা", tag: "ওপরে পোড়া পোড়া, ভেতরে নরম", line: "আগুনে পুড়েও ধোঁয়া-ধোঁয়া একটা মায়া রেখে দাও। তোমার সাথে একবার বসলে কথা আর শেষ হয় না।", ball: "#8a6f45", fleck: "#c9452d" },
  { id: "shutki", name: "শুঁটকি ভর্তা", tag: "ঝাঁঝালো, তবু সবাই খোঁজে", line: "নাম শুনে কেউ কেউ নাক কোঁচকায়, একবার চেখে দেখলে আর ভোলে না। তুমি যেখানে, আসর সেখানে জমে।", ball: "#b0552f", fleck: "#5a2a14" },
  { id: "taki", name: "টাকি মাছ ভর্তা", tag: "যত্নে বানানো, নানুবাড়ির স্বাদ", line: "এক এক করে কাঁটা বেছে যত্ন করো সবার। তোমার কাছে এলে মনে হয় বাড়ি ফিরলাম।", ball: "#c79a64", fleck: "#2f8a3a" },
  { id: "kalojira", name: "কালোজিরা ভর্তা", tag: "চুপচাপ, কিন্তু গভীর", line: "কথা কম বলো, যা বলো মনে গেঁথে যায়। ছোট্ট দানার মতো, ভেতরে অনেক স্বাদ।", ball: "#3a2f2a", fleck: "#c9452d" },
  { id: "dal", name: "ডাল ভর্তা", tag: "রোজকার ভরসা", line: "ঝড়-বৃষ্টি-পরীক্ষা যা-ই আসুক, তুমি ঠিক পাশে থাকো। সবাই জানে, তোমাকে ডাকলে কাজ হবেই।", ball: "#e2a83c", fleck: "#7a3b12" },
  { id: "shim", name: "শিম ভর্তা", tag: "শীতের সকালের মতো তাজা", line: "তুমি এলে মৌসুমটাই বদলে যায়। সবুজ মন, খোলা হাসি, আর নতুন কিছু দেখার শখ।", ball: "#7fa64a", fleck: "#c9452d" },
  { id: "tomato", name: "টমেটো ভর্তা", tag: "টক-ঝাল-মিষ্টি মেজাজ", line: "যেখানে যাও, রং ছড়াও। তোমার এক কথায় পুরো টেবিল হেসে গড়াগড়ি।", ball: "#d4532f", fleck: "#2f8a3a" },
  { id: "chingri", name: "চিংড়ি ভর্তা", tag: "একটু শৌখিন, এলেই উৎসব", line: "তুমি টেবিলে এলে সাধারণ দুপুরও দাওয়াত হয়ে যায়। সবাই চুপিচুপি তোমার বাটির দিকে তাকায়।", ball: "#e48a5c", fleck: "#b8322a" },
] as const;
export type Bhorta = (typeof bhortas)[number];
export type BhortaId = Bhorta["id"];

// Each option votes for two bhortas; every bhorta gets exactly four votes in all, so none is rare or common
// by design. The link stores the shown position (`a=012210`): never reorder an option, only reword in place.
// `line` is the "কেন" on the card when this answer is the reason for the result.
export const questions = [
  { ask: "আড্ডায় তুমি কেমন?", options: [
    { label: "সবাইকে হাসিয়ে মাতাই", votes: ["tomato", "chingri"], line: "আড্ডায় সবাইকে হাসিয়ে মাতিয়ে রাখে" },
    { label: "চুপচাপ শুনি, শেষে এক কথায় বাজিমাত", votes: ["kalojira", "begun"], line: "চুপচাপ শোনে, শেষে এক কথায় বাজিমাত করে" },
    { label: "যা মনে আসে, সোজা বলে দিই", votes: ["shutki", "shim"], line: "যা মনে আসে, সোজাসুজি বলে দেয়" },
  ] },
  { ask: "হঠাৎ মেহমান, ফ্রিজ প্রায় খালি!", options: [
    { label: "যা আছে তাই দিয়েই জমিয়ে দিই", votes: ["alu", "dal"], line: "খালি ফ্রিজ থেকেও মেহমানের থালা ভরিয়ে দেয়" },
    { label: "দৌড়ে বাজারে, ভালো কিছু আনবই", votes: ["chingri", "taki"], line: "মেহমান এলে দৌড়ে বাজারে যায়, ভালোটা আনবেই" },
    { label: "আগে চা দিই, গল্পে ভুলিয়ে রাখি", votes: ["tomato", "kalojira"], line: "চা আর গল্পেই মেহমানকে খুশি করে দেয়" },
  ] },
  { ask: "ছুটির দুপুর কেমন হলে ভালো?", options: [
    { label: "গরম ভাত, তারপর লম্বা ঘুম", votes: ["alu", "begun"], line: "ছুটির দুপুরে গরম ভাতের পর লম্বা ঘুম দেয়" },
    { label: "গ্রামের বাড়ি, পুকুরঘাট", votes: ["taki", "shim"], line: "ছুটি পেলেই গ্রামের পুকুরঘাটে মন চলে যায়" },
    { label: "দলবেঁধে নতুন কোথাও খেতে যাই", votes: ["chingri", "shutki"], line: "ছুটির দিনে দলবেঁধে নতুন খাবার খুঁজতে বেরোয়" },
  ] },
  { ask: "কারও মন খারাপ হলে তুমি?", options: [
    { label: "পাশে বসে চুপচাপ থাকি", votes: ["begun", "kalojira"], line: "কারও মন খারাপ হলে চুপচাপ পাশে বসে থাকে" },
    { label: "জোক বলে হাসিয়ে ছাড়ি", votes: ["tomato", "alu"], line: "মন খারাপের মানুষকে হাসিয়েই ছাড়ে" },
    { label: "কী হয়েছে শুনে সমাধান খুঁজি", votes: ["dal", "taki"], line: "কারও বিপদ শুনলে সমাধান না খুঁজে থামে না" },
  ] },
  { ask: "ঝালের ব্যাপারে তুমি?", options: [
    { label: "যত ঝাল, তত মজা", votes: ["shutki", "tomato"], line: "ঝাল যত বেশি, খাওয়া তত জমে" },
    { label: "মাঝামাঝি, বেশিও না কমও না", votes: ["dal", "shim"], line: "ঝালেও মাঝামাঝি, সবকিছুতে মাপমতো" },
    { label: "ঝাল দেখলেই পানির গ্লাস খুঁজি", votes: ["alu", "kalojira"], line: "এক কামড় ঝালেই পানির গ্লাস খোঁজে" },
  ] },
  { ask: "ফোনের গ্যালারিতে সবচেয়ে বেশি কী?", options: [
    { label: "খাবারের ছবি", votes: ["chingri", "shutki"], line: "খাওয়ার আগে খাবারের ছবি তোলা চাই-ই" },
    { label: "আকাশ, গাছ, বৃষ্টি", votes: ["shim", "begun"], line: "ফোনভর্তি আকাশ, গাছ আর বৃষ্টির ছবি" },
    { label: "পরিবারের ছবি আর দরকারি স্ক্রিনশট", votes: ["dal", "taki"], line: "ফোনে পরিবারের ছবি আর দরকারি সব স্ক্রিনশট গুছিয়ে রাখে" },
  ] },
] as const;

export const QUESTION_COUNT = questions.length;

export type Answer = 0 | 1 | 2;
export type Plate = { answers: Answer[]; name: string };

const bnFormat = new Intl.NumberFormat("bn-BD");
export const bn = (value: number) => bnFormat.format(value);

const codeOf = (answers: readonly Answer[]) => answers.reduce<number>((sum, answer) => sum * 3 + answer, 0);
const votesOf = (answers: readonly Answer[]) => answers.map((answer, index) => questions[index].options[answer].votes as readonly BhortaId[]);

/** The bhorta with the most votes; a tie is settled by the answers themselves, so the same answers always give the same bhorta. */
export function bhortaOf(answers: readonly Answer[]): Bhorta {
  const counts = new Map<BhortaId, number>();
  for (const id of votesOf(answers).flat()) counts.set(id, (counts.get(id) ?? 0) + 1);
  const most = Math.max(...counts.values());
  const tied = bhortas.filter(bhorta => counts.get(bhorta.id) === most);
  return tied[codeOf(answers) % tied.length];
}

/** The card's "কেন": one of the person's own answers that voted for their bhorta. */
export function reason(answers: readonly Answer[]) {
  const id = bhortaOf(answers).id;
  const votes = votesOf(answers);
  const start = codeOf(answers) % answers.length;
  for (let step = 0; step < answers.length; step++) {
    const index = (start + step) % answers.length;
    if (votes[index].includes(id)) return questions[index].options[answers[index]].line as string;
  }
  return "";
}

/** The line a friend's link adds: two bhortas side by side on one plate. */
export function pairLine(me: Plate, friend: Plate) {
  const mine = bhortaOf(me.answers), theirs = bhortaOf(friend.answers);
  const short = (bhorta: Bhorta) => bhorta.name.replace(/ ভর্তা$/, "");
  const myName = me.name || "আমি", friendName = friend.name || "বন্ধু";
  if (mine.id === theirs.id) return `${myName} আর ${friendName}, দুজনেই ${short(mine)}। এক বাটি থেকেই দুই লোকমা`;
  const endings = ["একসাথে মাখলে এক থালা ভাত শেষ", "এক থালায় পাশাপাশি, দুপুরটা জমে গেল", "দুজন মিলে পুরো ভর্তার আসর"];
  return `${myName} ${short(mine)}, ${friendName} ${short(theirs)}। ${endings[(codeOf(me.answers) + codeOf(friend.answers)) % endings.length]}`;
}

// Copied from tools/moner-boyos/lib/moner-boyos.ts (tools don't import each other).
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

export function shareHash({ answers, name }: Plate) {
  const params = new URLSearchParams({ a: answers.join("") });
  const shown = cleanName(name);
  if (shown) params.set("n", shown);
  return "#" + params.toString();
}

/** Null unless the hash holds all six answers; in-page anchors like #result are ignored. */
export function parseShareHash(hash: string): Plate | null {
  let params: URLSearchParams;
  try { params = new URLSearchParams(hash.replace(/^#/, "")); } catch { return null; }
  const digits = params.get("a") ?? "";
  if (!new RegExp(`^[0-2]{${QUESTION_COUNT}}$`).test(digits)) return null;
  return { answers: [...digits].map(Number) as Answer[], name: cleanName(params.get("n") ?? "") };
}

export function caption({ answers }: Plate) {
  const bhorta = bhortaOf(answers);
  return `শিলপাটায় বেটে দেখলাম, আমি ${bhorta.name}! ${bhorta.tag}। তুমি কোন ভর্তা?`;
}

export function previewTitle(plate: Plate | null) {
  if (!plate) return "ভর্তার নাম — তুমি কোন ভর্তা?";
  const who = plate.name || "তোমার বন্ধু";
  return `${who} হলো ${bhortaOf(plate.answers).name}, তুমি কোনটা?`;
}

// Fixed ids only: the result bhorta, never the name.
export const tallyIds = bhortas.map(bhorta => bhorta.id);

export { possessive };

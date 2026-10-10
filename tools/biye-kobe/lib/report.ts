import { possessive } from "../../../shared/bangla";

export const MAX_NAME_LENGTH = 24;
export type Answer = 0 | 1 | 2;

// Share links store answers by position (#a=120102): once links are public, never reorder questions or chips.
// Every joke works for anyone: no age, looks, income, dowry, caste or gender, and staying single is a happy ending too.
export const questions = [
  { short: "সম্বন্ধের কথা", ask: "এই মাসে বাসায় কয়বার ‘ভালো একটা সম্বন্ধ’-এর কথা উঠেছে?", chips: ["একবারও না, শান্তি", "দু-একবার", "গুনে শেষ নেই"] },
  { short: "দাওয়াতে গিয়ে", ask: "বিয়েবাড়ির দাওয়াতে গিয়ে তুমি আসলে কী করো?", chips: ["রোস্টের পিস গুনি", "স্টেজে ছবি তুলি", "গেট ধরার দলে থাকি"] },
  { short: "শেষ মিষ্টি", ask: "ফ্রিজে শেষ মিষ্টিটা পড়ে আছে। কী করবে?", chips: ["একাই খেয়ে ফেলি", "আধা আধা ভাগ করি", "অন্যের জন্য রেখে দিই"] },
  { short: "‘বিয়ে কবে?’", ask: "কেউ জিজ্ঞেস করল ‘বিয়ে কবে?’ তুমি বলো…", chips: ["দাওয়াত পাবেন, দোয়া রাখবেন", "আগে ক্যারিয়ার", "একাই বেশ আছি"] },
  { short: "রাত দুইটায়", ask: "রাত দুইটায় তোমাকে কোথায় পাওয়া যাবে?", chips: ["নাটকের শেষ পর্বে", "বন্ধুদের মিম পাঠাতে", "নাক ডেকে ঘুমে"] },
  { short: "বৃষ্টির দিনে", ask: "বৃষ্টি নামল। তোমার প্ল্যান কী?", chips: ["খিচুড়ি আর ডিমভাজি", "জানালায় বসে গান", "কম্বল মুড়ি দিয়ে ঘুম"] },
] as const;
export const QUESTION_COUNT = questions.length;

// The "কারণ" line on the report, one per chip, written about the person (Bangla verbs carry no gender).
const reasons: Partial<Record<number, readonly [string, string, string]>> = {
  1: ["দাওয়াতে গিয়ে এখনো রোস্টের পিস গোনে", "অন্যের বিয়ের স্টেজে ছবি তুলতেই ব্যস্ত", "গেট ধরার টাকা নিয়ে দর-কষাকষিতে ওস্তাদ"],
  2: ["ফ্রিজের মিষ্টি এখনো একাই খায়", "মিষ্টি আধা আধা ভাগ করতে শিখে গেছে", "শেষ মিষ্টিটাও অন্যের জন্য রেখে দেয়"],
  4: ["রাত দুইটায় নাটকের শেষ পর্ব না দেখে ঘুমায় না", "রাত দুইটায় মিম পাঠিয়ে বন্ধুদের ঘুম ভাঙায়", "রাত দশটায় ঘুমিয়ে পড়ে, ঘটক ফোনেও পায় না"],
  5: ["বৃষ্টি নামলেই খিচুড়ির হাঁড়ি খোঁজে", "বৃষ্টি দেখলেই জানালায় বসে গান ধরে", "বৃষ্টির দিনে কম্বল থেকে বের হয় না"],
};
const reasonQuestions = [1, 2, 4, 5];

// The 12 joke timings. Ids feed the anonymous tally, so they are fixed once public.
export const timings = [
  { id: "shit", text: "আগামী শীতে, দাওয়াতের মৌসুমে", short: "আগামী শীতে" },
  { id: "aam", text: "আম-কাঁঠালের ছুটির পরে", short: "আম-কাঁঠালের ছুটির পরে" },
  { id: "biryani", text: "যেদিন আম্মু তোমার পছন্দের বিরিয়ানি রাঁধবে", short: "আম্মুর বিরিয়ানির দিনে" },
  { id: "borsha", text: "কোনো এক ঝুম বৃষ্টির খিচুড়ির দিনে", short: "ঝুম বৃষ্টির দিনে" },
  { id: "falgun", text: "কোনো এক পহেলা ফাল্গুনে, সবাই যখন হলুদে", short: "পহেলা ফাল্গুনে" },
  { id: "roast", text: "যেদিন রোস্টের বড় পিসটা তোমার প্লেটে পড়বে", short: "রোস্টের বড় পিসের দিনে" },
  { id: "current", text: "যেদিন সারাদিনে একবারও কারেন্ট যাবে না", short: "কারেন্ট না যাওয়ার দিনে" },
  { id: "wifi", text: "যেদিন বাসার ওয়াইফাই পাসওয়ার্ড মুখস্থ হবে", short: "ওয়াইফাই পাসওয়ার্ড মুখস্থ হলে" },
  { id: "chhata", text: "ঘটক চাচা হারানো ছাতাটা খুঁজে পাওয়ার পরের সপ্তাহে", short: "ঘটকের ছাতা খুঁজে পেলে" },
  { id: "chhuti", text: "পরের লম্বা ছুটিতে, সবাই যখন বাড়িতে", short: "পরের লম্বা ছুটিতে" },
  { id: "career", text: "প্রমোশনের মিষ্টি খাওয়ানোর পরে", short: "প্রমোশনের মিষ্টির পরে" },
  { id: "nijer", text: "যখন তুমি চাইবে, তার আগে এক দিনও না", short: "নিজে যখন চাইবে" },
] as const;
export type Timing = (typeof timings)[number];
export const timingIds: readonly string[] = timings.map(timing => timing.id);
const careerFirst = timings[10], ownTime = timings[11];
const jokePool = timings.slice(0, 10);

export type Shared = { answers: Answer[]; name: string };
export type Report = { answers: readonly (Answer | null)[]; complete: boolean; answered: number; name: string; fileNo: string; timing: Timing | null; reason: string; line: string };

const digits = new Intl.NumberFormat("bn-BD", { useGrouping: false });
export const bn = (value: number) => digits.format(value);

export function cleanName(name: string) {
  // NFC so one name typed on two keyboards is one string; control and bidi-override characters could scramble the card.
  return name.normalize("NFC").replace(/[\u0000-\u001f\u007f‎‏‪-‮⁦-⁩]/g, "").trim().replace(/\s+/g, " ").slice(0, MAX_NAME_LENGTH).trim();
}

export function shareHash({ answers, name }: Shared) {
  const params = new URLSearchParams({ a: answers.join("") });
  const shown = cleanName(name);
  if (shown) params.set("n", shown);
  return "#" + params.toString();
}

export function parseShareHash(hash: string): Shared | null {
  const params = new URLSearchParams(hash.replace(/^#/, ""));
  const code = params.get("a") ?? "";
  if (!new RegExp(`^[0-2]{${QUESTION_COUNT}}$`).test(code)) return null;
  return { answers: [...code].map(Number) as Answer[], name: cleanName(params.get("n") ?? "") };
}

/** The report the ghotok types up. Same answers always give the same report, so a link reopens the exact card. */
export function createReport(answers: readonly (Answer | null)[], name: string): Report {
  const answered = answers.filter(answer => answer !== null).length;
  const complete = answered === QUESTION_COUNT && answers.length === QUESTION_COUNT;
  const fileNo = answers.map(answer => answer === null ? "০" : bn(answer + 1)).join("");
  if (!complete) return { answers, complete, answered, name: cleanName(name), fileNo, timing: null, reason: "", line: "" };
  const list = answers as Answer[];
  const code = list.reduce<number>((total, answer) => total * 3 + answer, 0);
  const reply = list[3];
  const timing = reply === 1 ? careerFirst : reply === 2 ? ownTime : jokePool[(code * 7 + 3) % jokePool.length];
  const asked = reasonQuestions[code % reasonQuestions.length];
  const reason = reasons[asked]![list[asked]];
  return { answers, complete, answered, name: cleanName(name), fileNo, timing, reason, line: humanLine(list) };
}

export function humanLine(answers: readonly Answer[]) {
  if (answers[3] === 1) return "আগে চাকরি, তারপর মিষ্টি। ঘটক চা খেতে খেতে অপেক্ষায়।";
  if (answers[3] === 2) return "নিজের সাথেই দারুণ আছো। ঘটক ছাতা গুটিয়ে হাসিমুখে বাড়ি গেল।";
  return [
    "বাসায় এখন শান্তি, ঘটকের ছাতাও আলমারিতে।",
    "কথা উঠছে, তুমি হাসছ। ঘটক বলে, তাড়ার কিছু নেই।",
    "বাসায় সম্বন্ধের মেলা, তুমি তবু ঠান্ডা মাথায় চা খাও।",
  ][answers[0]];
}

export function caption(report: Report) {
  if (!report.timing) return "";
  return `ঘটকের রিপোর্টে লেখা: “${report.timing.text}”। শুধু মজা! তোমার রিপোর্টে কী লেখা?`;
}

export function previewTitle(shared: Shared) {
  const report = createReport(shared.answers, shared.name);
  const who = shared.name ? possessive(shared.name) : "এক বন্ধুর";
  return `ঘটক বলছে, ${who} বিয়ে ${report.timing!.short}! তোমার রিপোর্টে কী লেখা?`;
}

export { possessive };

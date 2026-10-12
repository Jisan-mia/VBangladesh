import { possessive } from "../../../shared/bangla";

// Folk rules of street and rooftop cricket, not the Laws of Cricket. Every পাড়া had its own;
// local groups setting their own rules (ball into a house = out) is described in
// https://thefinancialexpress.com.bd/others/children-cannot-even-play-in-the-streets-of-dhaka
export const MAX_PARA_LENGTH = 16;

export const groups = [
  { id: "out", label: "আউটের আইন" },
  { id: "run", label: "রান আর বলের আইন" },
  { id: "para", label: "মাঠের বাইরের আইন" },
] as const;

// Share links store ticks as bit positions (24 bits): once links are public, never reorder, rename or delete; only replace the cap.
export const rules = [
  { id: "chhad", group: "out", label: "ছাদে মারলে আউট", line: "ছাদের বল আনতে ওঠাটাই ছিল সাহসের পরীক্ষা।" },
  { id: "one-tip", group: "out", label: "ওয়ান টিপ ওয়ান হ্যান্ড আউট", line: "এক ড্রপে এক হাতে ক্যাচ, এটাই গলির ফিল্ডিং।" },
  { id: "pechhone", group: "out", label: "পেছনে মারলে আউট", line: "গলি সরু, তাই শট শুধু সোজা।" },
  { id: "kach", group: "out", label: "জানালার কাচে লাগলে আউট", line: "কাচের শব্দ শুনলেই সবাই হঠাৎ খুব ভদ্র।" },
  { id: "onner-bari", group: "out", label: "অন্যের বাড়িতে বল গেলে আউট", line: "বল ফেরত চাইতে কে যাবে, সেটাই ছিল আসল টস।" },
  { id: "deyal-catch", group: "out", label: "দেয়াল ছুঁয়ে ক্যাচ ধরলেও আউট", line: "দেয়ালটাও আমাদের দলের ফিল্ডার ছিল।" },
  { id: "no-lbw", group: "out", label: "এলবিডব্লিউ বলে কিছু নেই", line: "এলবিডব্লিউ বোঝাতে গেলে সন্ধ্যা নেমে যেত।" },
  { id: "dudhbhat", group: "out", label: "ছোটরা দুধভাত, আউট হয় না", line: "দুধভাত হয়েই আমাদের সবার খেলা শুরু।" },
  { id: "tip-run", group: "run", label: "এক টিপ এক রান", line: "ব্যাটে একটু ছুঁলেই দৌড়, ভাবার সময় নেই।" },
  { id: "drain", group: "run", label: "ড্রেনে পড়লে ছয়", line: "বলের চেয়ে ড্রেন বেশি চেনো তুমি।" },
  { id: "deyal-char", group: "run", label: "দেয়ালে লাগলে চার", line: "দেয়াল ছুঁলে চার, পেরোলেই বিপদ।" },
  { id: "trial", group: "run", label: "প্রথম বল ট্রায়াল", line: "ট্রায়াল বলে আউট? ওটা তো গোনাই হয় না।" },
  { id: "char-bol", group: "run", label: "চার বলে এক ওভার", line: "চার বলের ওভার, সন্ধ্যা তো আর অপেক্ষা করে না।" },
  { id: "wide", group: "run", label: "ওয়াইডে রান নেই, আবার বল", line: "ওয়াইডে রান নেই, শুধু আরেকবার চেষ্টা।" },
  { id: "no-throw", group: "run", label: "হাত ঘুরিয়ে বল, থ্রো চলবে না", line: "হাত একটু বাঁকলেই সবাই একসাথে: ‘থ্রো!’" },
  { id: "last-man", group: "run", label: "শেষজন একাই ব্যাট করবে", line: "শেষজন একাই দৌড়ায়, পুরো গলি তার পেছনে।" },
  { id: "bat-jar", group: "para", label: "ব্যাট যার, প্রথম ব্যাটিং তার", line: "ব্যাটের মালিকই পাড়ার আসল ক্যাপ্টেন।" },
  { id: "bol-malik", group: "para", label: "বলের মালিক গেলে খেলা শেষ", line: "বলের মালিকের মুখ ভার হলেই ম্যাচ শেষ।" },
  { id: "bol-harale", group: "para", label: "বল হারালে যে মেরেছে, সে কিনবে", line: "যে হারাবে সে কিনবে, গলির সবচেয়ে কড়া আইন।" },
  { id: "riksha", group: "para", label: "রিকশা এলে খেলা থামবে", line: "রিকশার বেল মানেই টাইম আউট।" },
  { id: "ammu", group: "para", label: "আম্মু ডাকলে খেলা শেষ", line: "আম্মুর এক ডাকে সব ম্যাচ ড্র।" },
  { id: "no-umpire", group: "para", label: "আম্পায়ার নেই, তর্কেই রায়", line: "আউট না নট আউট, তর্কেই অর্ধেক বিকেল।" },
  { id: "sandal-toss", group: "para", label: "স্যান্ডেল উল্টে টস", line: "স্যান্ডেল উল্টালেই টস, কয়েন কে খোঁজে!" },
  { id: "deyal-stump", group: "para", label: "দেয়ালে আঁকা স্টাম্পই উইকেট", line: "দেয়ালে কয়লার তিন দাগই ছিল আমাদের স্টাম্প।" },
] as const;

export type Rule = (typeof rules)[number];
export type RuleId = Rule["id"];
export type Ain = { ticked: RuleId[]; para: string };

export const defaultAin: Ain = { ticked: ["chhad", "one-tip", "trial", "bat-jar"], para: "" };

// Which ticked rule speaks for the whole wall: the oddest, most particular ones first, the everywhere-rules last.
export const linePriority: readonly RuleId[] = ["drain", "dudhbhat", "bol-malik", "sandal-toss", "ammu", "no-umpire", "riksha", "kach", "deyal-stump", "onner-bari", "bol-harale", "no-throw", "deyal-catch", "last-man", "char-bol", "no-lbw", "deyal-char", "tip-run", "pechhone", "wide", "bat-jar", "chhad", "trial", "one-tip"];
const MANY = 15;

const numbers = new Intl.NumberFormat("bn-BD");
export const bn = (value: number) => numbers.format(value);

const ruleIds = new Set<string>(rules.map(rule => rule.id));
const isRuleId = (id: string): id is RuleId => ruleIds.has(id);
export const ruleLabel = (id: RuleId) => rules.find(rule => rule.id === id)!.label;

export function toggleRule(ticked: readonly RuleId[], id: string): RuleId[] {
  if (!isRuleId(id)) throw new RangeError("এই আইনটা তালিকায় নেই।");
  return ticked.includes(id) ? ticked.filter(item => item !== id) : [...ticked, id];
}

/** Ticked rules in wall order (the list order), whatever order they were tapped in. */
export const inOrder = (ticked: readonly RuleId[]) => rules.filter(rule => ticked.includes(rule.id));

export function cleanPara(para: string) {
  // Strip control and bidi-override characters so a shared link can't scramble the wall.
  return para.normalize("NFC").replace(/[\u0000-\u001f\u007f‪-‮⁦-⁩]/g, "").trim().replace(/\s+/g, " ").slice(0, MAX_PARA_LENGTH).trim();
}

export function encodeRules(ticked: readonly RuleId[]) {
  return rules.reduce((bits, rule, index) => ticked.includes(rule.id) ? bits + 2 ** index : bits, 0).toString(36);
}

export function decodeRules(code: string): RuleId[] {
  if (!/^[0-9a-z]{1,5}$/.test(code)) return [];
  const bits = parseInt(code, 36);
  if (bits >= 2 ** rules.length) return [];
  return rules.filter((_, index) => Math.floor(bits / 2 ** index) % 2 === 1).map(rule => rule.id);
}

export function shareHash({ ticked, para }: Ain) {
  const params = new URLSearchParams({ r: encodeRules(ticked) });
  const shown = cleanPara(para);
  if (shown) params.set("p", shown);
  return "#" + params.toString();
}

export function parseShareHash(hash: string): Ain | null {
  const params = new URLSearchParams(hash.replace(/^#/, ""));
  const ticked = decodeRules(params.get("r") ?? "");
  return ticked.length ? { ticked, para: cleanPara(params.get("p") ?? "") } : null;
}

/** The human line on the wall, from the most telling rule they ticked. */
export function ainLine(ticked: readonly RuleId[]) {
  if (!ticked.length) return "দেয়ালটা এখনো ফাঁকা। নিচ থেকে তোমার গলির আইন বেছে নাও।";
  if (ticked.length >= MANY) return "এত আইন! তোমাদের গলিতে খেলার চেয়ে নিয়ম বেশি।";
  const id = linePriority.find(item => ticked.includes(item))!;
  return rules.find(rule => rule.id === id)!.line;
}

export const matchCount = (own: readonly RuleId[], friend: readonly RuleId[]) => own.filter(id => friend.includes(id)).length;

export function matchLine(own: readonly RuleId[], friend: Ain | null) {
  if (!friend || !own.length) return "";
  const count = matchCount(own, friend.ticked);
  const them = friend.para ? `${possessive(friend.para)} গলির` : "বন্ধুর গলির";
  return count ? `${them} সাথে মিল ${bn(count)}টা আইনে` : `${them} সাথে একটাও মেলেনি!`;
}

export function previewTitle({ ticked, para }: Ain) {
  return `${para ? possessive(para) : "এক পাড়ার"} গলির ক্রিকেটে ${bn(ticked.length)}টা আইন। তোমার গলিতে কী ছিল?`;
}

export { possessive };

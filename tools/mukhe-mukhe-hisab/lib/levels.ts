// 30 levels in three worlds. Each adds one small thing: a bigger number, a new sign, a new kind of bazaar sum.
// Every question comes from makeRng(seed), so a friend's link gets the same sums in the same order.
import { pick } from "../../../shared/game-core";

const digits = new Intl.NumberFormat("bn-BD", { useGrouping: false });
export const bn = (value: number) => digits.format(value);

/** `lines` is what you read (one sum, or a bazaar list), `ask` the question under it, `choices` four answers in kids levels. */
export type Question = { lines: string[]; ask: string; answer: number; choices: number[] | null; bazar: boolean };
type Made = { lines: string[]; ask?: string; answer: number };
type Rng = () => number;

/** stars: right answers in one round for ★, ★★, ★★★. */
export type Level = { label: string; make: (rng: Rng) => Made; stars: readonly [number, number, number]; choices: boolean };

/** A whole number in [lo, hi]. */
const int = (rng: Rng, lo: number, hi: number) => lo + pick(rng, hi - lo + 1);
const one = <T>(rng: Rng, list: readonly T[]) => list[pick(rng, list.length)];

// ---- plain sums ----
const sum = (text: string, answer: number): Made => ({ lines: [text], answer });
const add = (rng: Rng, a: [number, number], b: [number, number], max = 999) => {
  let x = int(rng, ...a), y = int(rng, ...b);
  while (x + y > max) { x = int(rng, ...a); y = int(rng, ...b); }
  return rng() < 0.5 ? sum(`${bn(x)} + ${bn(y)}`, x + y) : sum(`${bn(y)} + ${bn(x)}`, x + y);
};
/** Always a bigger number first, so the answer is at least 1. */
const sub = (rng: Rng, a: [number, number], b: [number, number]) => {
  let x = int(rng, ...a), y = int(rng, ...b);
  while (y >= x) { x = int(rng, ...a); y = int(rng, ...b); }
  return sum(`${bn(x)} − ${bn(y)}`, x - y);
};
const mul = (rng: Rng, a: [number, number], b: [number, number]) => {
  const x = int(rng, ...a), y = int(rng, ...b);
  return rng() < 0.5 ? sum(`${bn(x)} × ${bn(y)}`, x * y) : sum(`${bn(y)} × ${bn(x)}`, x * y);
};
/** Only sums that come out whole: the dividend is built from the answer. */
const div = (rng: Rng, by: [number, number], quotient: [number, number]) => {
  const y = int(rng, ...by), q = int(rng, ...quotient);
  return sum(`${bn(y * q)} ÷ ${bn(y)}`, q);
};
/** a + b − c, never below 1. */
const three = (rng: Rng) => {
  const x = int(rng, 10, 60), y = int(rng, 5, 40), z = int(rng, 5, x + y - 1);
  return sum(`${bn(x)} + ${bn(y)} − ${bn(z)}`, x + y - z);
};
const tens = (rng: Rng, lo: number, hi: number) => 10 * int(rng, lo / 10, hi / 10);

// ---- the bazaar: prices are rough, everyday, made up for the game (আনুমানিক) ----
const COUNTED = [
  { name: "শিঙাড়া", prices: [10] }, { name: "পরোটা", prices: [10, 15] }, { name: "ডাব", prices: [60, 70, 80] },
  { name: "লাউ", prices: [50, 60, 70] }, { name: "খাতা", prices: [30, 40, 50] }, { name: "কলম", prices: [10, 15, 20] },
] as const;
const BY_KG = [
  { name: "আলু", prices: [30, 35, 40] }, { name: "পেঁয়াজ", prices: [60, 70, 80] }, { name: "চাল", prices: [60, 65, 70, 75] },
  { name: "চিনি", prices: [120, 130] }, { name: "ডাল", prices: [100, 110, 120] }, { name: "আটা", prices: [50, 55, 60] },
  { name: "টমেটো", prices: [40, 50, 60] }, { name: "বেগুন", prices: [50, 60, 70] },
] as const;
const BY_HALI = [{ name: "ডিম", prices: [40, 45, 50, 55] }, { name: "কলা", prices: [30, 35, 40] }] as const;
const SNACKS = ["চা-শিঙাড়া", "ঝালমুড়ি", "ফুচকা", "নাশতা"] as const;

/** "৩টা শিঙাড়া, একটা ১০ টাকা" */
const counted = (rng: Rng, n: [number, number]): Made => {
  const item = one(rng, COUNTED), p = one(rng, item.prices), k = int(rng, ...n);
  return { lines: [`${bn(k)}টা ${item.name}, একটা ${bn(p)} টাকা`], answer: k * p };
};
/** "২ হালি ডিম, হালি ৪৫ টাকা" or "১ ডজন কলা, ডজন ১১০ টাকা" */
const hali = (rng: Rng): Made => {
  if (rng() < 0.3) { const p = one(rng, [100, 110, 120]), k = int(rng, 1, 3); return { lines: [`${bn(k)} ডজন কলা, ডজন ${bn(p)} টাকা`], answer: k * p }; }
  const item = one(rng, BY_HALI), p = one(rng, item.prices), k = int(rng, 1, 4);
  return { lines: [`${bn(k)} হালি ${item.name}, হালি ${bn(p)} টাকা`], answer: k * p };
};
/** "১ ডজন ডিম, হালি ৫০ টাকা": a dozen is three হালি. */
const dozenOfHali = (rng: Rng): Made => {
  const item = one(rng, BY_HALI), p = one(rng, item.prices), k = int(rng, 1, 2);
  return { lines: [`${bn(k)} ডজন ${item.name}, হালি ${bn(p)} টাকা`], answer: 3 * k * p };
};
/** "৩ কেজি চাল, কেজি ৬৫ টাকা" */
const kg = (rng: Rng, n: [number, number]): Made => {
  const item = one(rng, BY_KG), p = one(rng, item.prices), k = int(rng, ...n);
  return { lines: [`${bn(k)} কেজি ${item.name}, কেজি ${bn(p)} টাকা`], answer: k * p };
};
/** আধা, দেড় or আড়াই কেজি, only of things with an even price, so the answer stays whole. */
const part = (rng: Rng): Made => {
  const item = one(rng, BY_KG), p = one(rng, item.prices.filter(price => price % 2 === 0));
  const [word, halves] = one(rng, [["আধা", 1], ["দেড়", 3], ["আড়াই", 5]] as const);
  return { lines: [`${word} কেজি ${item.name}, কেজি ${bn(p)} টাকা`], answer: (p * halves) / 2 };
};
/** One line of a list: "১ কেজি আলু ৩৫ টাকা", or with a quantity "২ কেজি আলু, কেজি ৩৫ টাকা". */
const line = (rng: Rng, withCount: boolean, avoid: string[]) => {
  const pool = BY_KG.filter(item => !avoid.includes(item.name));
  const item = one(rng, pool), p = one(rng, item.prices), k = withCount ? int(rng, 1, 3) : 1;
  avoid.push(item.name);
  return { text: k === 1 ? `১ কেজি ${item.name} ${bn(p)} টাকা` : `${bn(k)} কেজি ${item.name}, কেজি ${bn(p)} টাকা`, cost: k * p };
};
const list = (rng: Rng, rows: number, withCount: boolean): Made => {
  const used: string[] = [], picked = Array.from({ length: rows }, () => line(rng, withCount, used));
  return { lines: picked.map(row => row.text), answer: picked.reduce((total, row) => total + row.cost, 0) };
};
/** "৪ বন্ধু মিলে ২০০ টাকার ফুচকা খেলে", "সমান ভাগে একেকজন কত দেবে?" */
const share = (rng: Rng): Made => {
  const people = int(rng, 2, 5), each = 5 * int(rng, 4, 20);
  return { lines: [`${bn(people)} বন্ধু মিলে ${bn(people * each)} টাকার ${one(rng, SNACKS)} খেলে`], ask: "সমান ভাগে একেকজন কত দেবে?", answer: each };
};
/** "বাজার ১৩৫ টাকার, দিলাম ২০০ টাকা", "ফেরত কত?" */
const change = (rng: Rng): Made => {
  const note = one(rng, [100, 200, 500]), cost = 5 * int(rng, Math.ceil(note * 0.3 / 5), note / 5 - 1);
  return { lines: [`বাজার ${bn(cost)} টাকার`, `দিলাম ${bn(note)} টাকার নোট`], ask: "ফেরত কত?", answer: note - cost };
};

const kids = (label: string, make: Level["make"], stars: Level["stars"]): Level => ({ label, make, stars, choices: true });
const pad = (label: string, make: Level["make"], stars: Level["stars"]): Level => ({ label, make, stars, choices: false });
const mix = (rng: Rng, makers: Level["make"][]) => one(rng, makers)(rng);

export const LEVELS: readonly Level[] = [
  // ছোটদের হিসাব: four answers to pick from, small numbers.
  kids("দশের মধ্যে যোগ", r => add(r, [1, 5], [1, 5], 10), [5, 10, 15]),
  kids("এক অঙ্কের যোগ", r => add(r, [2, 9], [2, 9]), [5, 10, 15]),
  kids("দশের মধ্যে বিয়োগ", r => sub(r, [3, 10], [1, 9]), [5, 10, 15]),
  kids("বিশের মধ্যে বিয়োগ", r => sub(r, [10, 20], [2, 9]), [5, 10, 14]),
  kids("যোগ-বিয়োগ", r => mix(r, [x => add(x, [2, 9], [2, 9]), x => sub(x, [6, 18], [2, 9])]), [5, 10, 14]),
  kids("দুই অঙ্কে যোগ", r => add(r, [11, 40], [2, 9]), [5, 9, 13]),
  kids("২ থেকে ৫-এর গুণ", r => mul(r, [2, 5], [1, 10]), [5, 9, 13]),
  kids("পঞ্চাশের মধ্যে যোগ-বিয়োগ", r => mix(r, [x => add(x, [10, 30], [5, 19], 50), x => sub(x, [20, 50], [5, 19])]), [5, 9, 13]),
  kids("নয়ের ঘর পর্যন্ত গুণ", r => mul(r, [2, 9], [2, 9]), [5, 9, 12]),
  kids("যোগ, বিয়োগ, গুণ", r => mix(r, [x => add(x, [10, 40], [5, 19]), x => sub(x, [20, 50], [5, 19]), x => mul(x, [2, 9], [2, 9])]), [5, 9, 12]),
  // দোকানের খাতা: type the answer, numbers grow.
  pad("নিজে লিখে যোগ", r => add(r, [12, 89], [3, 9]), [5, 10, 14]),
  pad("দুই অঙ্কে দুই অঙ্ক যোগ", r => add(r, [11, 59], [11, 39]), [4, 8, 12]),
  pad("দুই অঙ্ক থেকে বিয়োগ", r => sub(r, [21, 99], [3, 9]), [5, 9, 13]),
  pad("দুই অঙ্কে দুই অঙ্ক বিয়োগ", r => sub(r, [30, 99], [11, 59]), [4, 8, 11]),
  pad("নামতার গুণ", r => mul(r, [3, 9], [3, 9]), [5, 9, 13]),
  pad("দশকের যোগ", r => { const x = tens(r, 100, 500), y = tens(r, 20, 400); return sum(`${bn(x)} + ${bn(y)}`, x + y); }, [4, 8, 12]),
  pad("দুই অঙ্কে এক অঙ্ক গুণ", r => mul(r, [11, 25], [2, 9]), [3, 6, 9]),
  pad("ভাগ", r => div(r, [2, 9], [2, 9]), [4, 8, 12]),
  pad("চার চিহ্নের মিশেল", r => mix(r, [x => add(x, [11, 79], [11, 39]), x => sub(x, [30, 99], [11, 29]), x => mul(x, [3, 9], [3, 9]), x => div(x, [2, 9], [2, 9])]), [4, 8, 11]),
  pad("তিন সংখ্যার হিসাব", three, [3, 6, 9]),
  // বাজারের হিসাব: a list to add up, prices rough and everyday.
  pad("একই জিনিস কয়েকটা", r => counted(r, [2, 5]), [4, 7, 10]),
  pad("হালি আর ডজন", hali, [3, 6, 9]),
  pad("দুই জিনিসের দাম", r => list(r, 2, false), [3, 6, 9]),
  pad("কেজি দরে", r => kg(r, [2, 5]), [3, 6, 9]),
  pad("আধা, দেড়, আড়াই কেজি", part, [3, 6, 8]),
  pad("সমান ভাগ", share, [3, 6, 8]),
  pad("দুই জিনিস, কয়েক কেজি", r => list(r, 2, true), [3, 5, 8]),
  pad("তিন জিনিস আর ডজন", r => mix(r, [dozenOfHali, x => list(x, 3, false)]), [3, 5, 8]),
  pad("ফেরত কত", change, [3, 6, 8]),
  pad("পুরো বাজার", r => mix(r, [x => counted(x, [2, 5]), hali, dozenOfHali, x => kg(x, [2, 4]), part, share, x => list(x, 2, true), change]), [3, 5, 8]),
];

export const LEVEL_COUNT = LEVELS.length;
export const WORLDS = ["ছোটদের হিসাব", "দোকানের খাতা", "বাজারের হিসাব"] as const;
export const worldOf = (level: number) => Math.floor((level - 1) / 10);
/** The pad never takes more than this many digits. */
export const MAX_DIGITS = 3;

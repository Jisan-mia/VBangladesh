// 30 levels in three worlds. Each world brings one twist (pick an answer, write it yourself, read a bazaar list); inside a
// world each level adds one thing (its `lesson` and `chip`), and the tenth is the world's named finale.
// Every sum comes from makeRng(seed) in the same order as before the rewrite, so an old friend's link gets the same sums.
// The `how` line (how to work the sum out, shown after a miss) is built from the numbers already drawn: it uses no rng.
// Never reorder: links and saved stars carry the level number.
import { pick } from "../../../shared/game-core";

const digits = new Intl.NumberFormat("bn-BD", { useGrouping: false });
export const bn = (value: number) => digits.format(value);

/** `lines` is what you read (one sum, or a bazaar list), `ask` the question under it, `choices` four answers in world 1, `how` the way to work it out. */
export type Question = { lines: string[]; ask: string; answer: number; choices: number[] | null; bazar: boolean; how: string };
type Made = { lines: string[]; ask?: string; answer: number; how: string };
type Rng = () => number;

/** stars: right answers in one round for ★, ★★, ★★★. `lesson` is the start card's নতুন line, `chip` its before → after. */
export type Level = { label: string; make: (rng: Rng) => Made; stars: readonly [number, number, number]; choices: boolean; lesson: string; chip: string };

/** A whole number in [lo, hi]. */
const int = (rng: Rng, lo: number, hi: number) => lo + pick(rng, hi - lo + 1);
const one = <T>(rng: Rng, list: readonly T[]) => list[pick(rng, list.length)];

// ---- how to work it out: one short line, from the numbers on the page ----
const plus = (a: number, b: number) => {
  const s = a + b, big = Math.max(a, b), small = Math.min(a, b);
  if (big < 10 && s <= 10) return `${bn(big)} থেকে আরও ${bn(small)} ঘর গোনো: ${bn(s)}`;
  if (big < 10) return `${bn(big)} + ${bn(10 - big)} = ১০, আর ${bn(small - (10 - big))} = ${bn(s)}`;
  if (small < 10) {
    const ones = big % 10;
    if (ones + small < 10) return `${bn(ones)} + ${bn(small)} = ${bn(ones + small)}, তাই ${bn(s)}`;
    const up = 10 - ones;
    return up === small ? `${bn(big)} + ${bn(small)} = ${bn(s)}, ঠিক পরের দশক` : `${bn(big)} + ${bn(up)} = ${bn(big + up)}, আর ${bn(small - up)} = ${bn(s)}`;
  }
  if (a % 10 === 0 && b % 10 === 0) return `দশক গোনো: ${bn(a / 10)} + ${bn(b / 10)} = ${bn(s / 10)}, তাই ${bn(s)}`;
  const place = 10 ** (String(b).length - 1), lo = b % place, hi = b - lo;
  return lo ? `${bn(a)} + ${bn(hi)} = ${bn(a + hi)}, আর ${bn(lo)} = ${bn(s)}` : `${bn(a)} + ${bn(b)} = ${bn(s)}`;
};
const minus = (x: number, y: number) => {
  const d = x - y;
  if (x <= 10) return `${bn(y)} থেকে ${bn(x)} যেতে ${bn(d)} ঘর`;
  if (y < 10) {
    const ones = x % 10;
    return ones >= y ? `${bn(ones)} − ${bn(y)} = ${bn(ones - y)}, তাই ${bn(d)}` : `${bn(x)} − ${bn(ones)} = ${bn(x - ones)}, আরও ${bn(y - ones)} কম = ${bn(d)}`;
  }
  const lo = y % 10, hi = y - lo;
  return lo ? `${bn(x)} − ${bn(hi)} = ${bn(x - hi)}, আরও ${bn(lo)} কম = ${bn(d)}` : `${bn(x)} − ${bn(y)} = ${bn(d)}`;
};
const times = (a: number, b: number) => {
  const p = a * b, m = Math.min(a, b), o = Math.max(a, b);
  if (o >= 10 && o !== 10) {
    const lo = o % 10, hi = o - lo;
    return lo ? `${bn(hi)} × ${bn(m)} = ${bn(hi * m)}, ${bn(lo)} × ${bn(m)} = ${bn(lo * m)}, মোট ${bn(p)}` : `${bn(o / 10)} × ${bn(m)} = ${bn(p / 10)}, পাশে একটা শূন্য`;
  }
  if (m === 1) return `একবার ${bn(o)} = ${bn(o)}`;
  if (o === 10) return `${bn(m)}-এর পাশে একটা শূন্য: ${bn(p)}`;
  if (m === 2) return `দ্বিগুণ: ${bn(o)} + ${bn(o)} = ${bn(p)}`;
  if (m === 3) return `${bn(o)} + ${bn(o)} + ${bn(o)} = ${bn(p)}`;
  if (m === 4) return `দুবার দ্বিগুণ: ${bn(o)} → ${bn(2 * o)} → ${bn(p)}`;
  if (m === 5) return `${bn(o)} × ১০ = ${bn(10 * o)}, তার অর্ধেক ${bn(p)}`;
  if (m === 9 || o === 9) { const k = m === 9 ? o : m; return `${bn(k)} × ১০ = ${bn(10 * k)}, এক ${bn(k)} কম = ${bn(p)}`; }
  if (m === 6) return `${bn(o)} × ৫ = ${bn(5 * o)}, আর ${bn(o)} = ${bn(p)}`;
  if (m === 7) return `${bn(o)} × ৫ = ${bn(5 * o)}, আর ${bn(o)} × ২ = ${bn(2 * o)}, মোট ${bn(p)}`;
  return `${bn(o)} × ১০ = ${bn(10 * o)}, দুই ${bn(o)} কম = ${bn(p)}`;
};
const taka = (value: number) => `${bn(value)} টাকা`;

// ---- plain sums ----
const sum = (text: string, answer: number, how: string): Made => ({ lines: [text], answer, how });
const add = (rng: Rng, a: [number, number], b: [number, number], max = 999) => {
  let x = int(rng, ...a), y = int(rng, ...b);
  while (x + y > max) { x = int(rng, ...a); y = int(rng, ...b); }
  return rng() < 0.5 ? sum(`${bn(x)} + ${bn(y)}`, x + y, plus(x, y)) : sum(`${bn(y)} + ${bn(x)}`, x + y, plus(y, x));
};
/** Always a bigger number first, so the answer is at least 1. */
const sub = (rng: Rng, a: [number, number], b: [number, number]) => {
  let x = int(rng, ...a), y = int(rng, ...b);
  while (y >= x) { x = int(rng, ...a); y = int(rng, ...b); }
  return sum(`${bn(x)} − ${bn(y)}`, x - y, minus(x, y));
};
const mul = (rng: Rng, a: [number, number], b: [number, number]) => {
  const x = int(rng, ...a), y = int(rng, ...b);
  return rng() < 0.5 ? sum(`${bn(x)} × ${bn(y)}`, x * y, times(x, y)) : sum(`${bn(y)} × ${bn(x)}`, x * y, times(x, y));
};
/** Only sums that come out whole: the dividend is built from the answer. */
const div = (rng: Rng, by: [number, number], quotient: [number, number]) => {
  const y = int(rng, ...by), q = int(rng, ...quotient);
  return sum(`${bn(y * q)} ÷ ${bn(y)}`, q, `${bn(q)}, কারণ ${bn(y)} × ${bn(q)} = ${bn(y * q)}`);
};
/** a + b − c, never below 1: the ledger's running total (জের + বিক্রি − খরচ). */
const three = (rng: Rng) => {
  const x = int(rng, 10, 60), y = int(rng, 5, 40), z = int(rng, 5, x + y - 1);
  return sum(`${bn(x)} + ${bn(y)} − ${bn(z)}`, x + y - z, `আগে ${bn(x)} + ${bn(y)} = ${bn(x + y)}, তারপর ${bn(z)} বাদ = ${bn(x + y - z)}`);
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

/** k × p in taka, worked out by tens when the price has ones. */
const priced = (k: number, p: number) => p % 10 && p > 10 && k > 1
  ? `${bn(k)} × ${bn(p - (p % 10))} = ${bn(k * (p - (p % 10)))}, ${bn(k)} × ${bn(p % 10)} = ${bn(k * (p % 10))}, মোট ${taka(k * p)}`
  : `${bn(k)} × ${bn(p)} = ${taka(k * p)}`;

/** "৩টা শিঙাড়া, একটা ১০ টাকা" */
const counted = (rng: Rng, n: [number, number]): Made => {
  const item = one(rng, COUNTED), p = one(rng, item.prices), k = int(rng, ...n);
  return { lines: [`${bn(k)}টা ${item.name}, একটা ${bn(p)} টাকা`], answer: k * p, how: priced(k, p) };
};
/** "২ হালি ডিম, হালি ৪৫ টাকা" or "১ ডজন কলা, ডজন ১১০ টাকা" */
const hali = (rng: Rng): Made => {
  if (rng() < 0.3) { const p = one(rng, [100, 110, 120]), k = int(rng, 1, 3); return { lines: [`${bn(k)} ডজন কলা, ডজন ${bn(p)} টাকা`], answer: k * p, how: k === 1 ? `এক ডজনের দামই: ${taka(p)}` : priced(k, p) }; }
  const item = one(rng, BY_HALI), p = one(rng, item.prices), k = int(rng, 1, 4);
  return { lines: [`${bn(k)} হালি ${item.name}, হালি ${bn(p)} টাকা`], answer: k * p, how: k === 1 ? `এক হালির দামই: ${taka(p)}` : priced(k, p) };
};
/** "১ ডজন ডিম, হালি ৫০ টাকা": a dozen is three হালি. */
const dozenOfHali = (rng: Rng): Made => {
  const item = one(rng, BY_HALI), p = one(rng, item.prices), k = int(rng, 1, 2);
  return { lines: [`${bn(k)} ডজন ${item.name}, হালি ${bn(p)} টাকা`], answer: 3 * k * p, how: `১ ডজন = ৩ হালি, তাই ${bn(3 * k)} × ${bn(p)} = ${taka(3 * k * p)}` };
};
/** "৩ কেজি চাল, কেজি ৬৫ টাকা" */
const kg = (rng: Rng, n: [number, number]): Made => {
  const item = one(rng, BY_KG), p = one(rng, item.prices), k = int(rng, ...n);
  return { lines: [`${bn(k)} কেজি ${item.name}, কেজি ${bn(p)} টাকা`], answer: k * p, how: priced(k, p) };
};
/** আধা, দেড় or আড়াই কেজি, only of things with an even price, so the answer stays whole. */
const part = (rng: Rng): Made => {
  const item = one(rng, BY_KG), p = one(rng, item.prices.filter(price => price % 2 === 0));
  const [word, halves] = one(rng, [["আধা", 1], ["দেড়", 3], ["আড়াই", 5]] as const);
  const answer = (p * halves) / 2, half = p / 2;
  const how = halves === 1 ? `আধা কেজি মানে অর্ধেক দাম: ${bn(p)} ÷ ২ = ${taka(half)}`
    : halves === 3 ? `১ কেজি ${bn(p)} + আধা কেজি ${bn(half)} = ${taka(answer)}`
    : `২ কেজি ${bn(2 * p)} + আধা কেজি ${bn(half)} = ${taka(answer)}`;
  return { lines: [`${word} কেজি ${item.name}, কেজি ${bn(p)} টাকা`], answer, how };
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
  const answer = picked.reduce((total, row) => total + row.cost, 0);
  return { lines: picked.map(row => row.text), answer, how: `${picked.map(row => bn(row.cost)).join(" + ")} = ${taka(answer)}` };
};
/** "৪ বন্ধু মিলে ২০০ টাকার ফুচকা খেলে", "সমান ভাগে একেকজন কত দেবে?" */
const share = (rng: Rng): Made => {
  const people = int(rng, 2, 5), each = 5 * int(rng, 4, 20);
  return {
    lines: [`${bn(people)} বন্ধু মিলে ${bn(people * each)} টাকার ${one(rng, SNACKS)} খেলে`], ask: "সমান ভাগে একেকজন কত দেবে?", answer: each,
    how: `${bn(people * each)} ÷ ${bn(people)} = ${bn(each)}, কারণ ${bn(people)} × ${bn(each)} = ${bn(people * each)}`,
  };
};
/** "বাজার ১৩৫ টাকার, দিলাম ২০০ টাকা", "ফেরত কত?": the how-line counts up from the bill, the way a দোকানদার does. */
const change = (rng: Rng): Made => {
  const note = one(rng, [100, 200, 500]), cost = 5 * int(rng, Math.ceil(note * 0.3 / 5), note / 5 - 1);
  const up = Math.ceil(cost / 100) * 100;
  const how = up === cost || up >= note ? `${bn(cost)} থেকে ${bn(note)} যেতে ${bn(note - cost)}` : `${bn(cost)} থেকে ${bn(up)} যেতে ${bn(up - cost)}, তারপর ${bn(note)} যেতে ${bn(note - up)}, ফেরত ${taka(note - cost)}`;
  return { lines: [`বাজার ${bn(cost)} টাকার`, `দিলাম ${bn(note)} টাকার নোট`], ask: "ফেরত কত?", answer: note - cost, how };
};

const kids = (label: string, make: Level["make"], stars: Level["stars"], lesson: string, chip = ""): Level => ({ label, make, stars, choices: true, lesson, chip });
const pad = (label: string, make: Level["make"], stars: Level["stars"], lesson: string, chip = ""): Level => ({ label, make, stars, choices: false, lesson, chip });
const mix = (rng: Rng, makers: Level["make"][]) => one(rng, makers)(rng);

export const LEVELS: readonly Level[] = [
  // ১ ছোটদের হিসাব: four numbered answers to pick from, small numbers.
  kids("দশের মধ্যে যোগ", r => add(r, [1, 5], [1, 5], 10), [5, 18, 24], "চারটা উত্তরের একটা ঠিক। চাপো, নয়তো কিবোর্ডে ১–৪।"),
  kids("এক অঙ্কের যোগ", r => add(r, [2, 9], [2, 9]), [5, 13, 18], "যোগফল এবার দশ পেরোয়। আগে দশ বানাও, তারপর বাকিটা।", "যোগফল ১০ → ১৮"),
  kids("দশের মধ্যে বিয়োগ", r => sub(r, [3, 10], [1, 9]), [5, 14, 19], "নতুন চিহ্ন: বিয়োগ। ছোটটা থেকে বড়টা পর্যন্ত গোনো।", "+ → −"),
  kids("বিশের মধ্যে বিয়োগ", r => sub(r, [10, 20], [2, 9]), [5, 10, 15], "বিশের মধ্যে বিয়োগ। আগে দশে নামো।", "১০ → ২০"),
  kids("যোগ-বিয়োগ", r => mix(r, [x => add(x, [2, 9], [2, 9]), x => sub(x, [6, 18], [2, 9])]), [5, 12, 17], "যোগ আর বিয়োগ মিশে আসবে। চিহ্নটা আগে দেখো।", "+ আর − একসাথে"),
  kids("দুই অঙ্কে যোগ", r => add(r, [11, 40], [2, 9]), [5, 12, 17], "দুই অঙ্কের সংখ্যার সাথে এক অঙ্ক।", "১৮ → ৪৯"),
  kids("২ থেকে ৫-এর গুণ", r => mul(r, [2, 5], [1, 10]), [5, 15, 20], "নতুন চিহ্ন: গুণ, ২ থেকে ৫-এর নামতা।", "× এলো"),
  kids("পঞ্চাশের মধ্যে যোগ-বিয়োগ", r => mix(r, [x => add(x, [10, 30], [5, 19], 50), x => sub(x, [20, 50], [5, 19])]), [5, 10, 14], "যোগ-বিয়োগ, এবার পঞ্চাশের মধ্যে।", "২০ → ৫০"),
  kids("নয়ের ঘর পর্যন্ত গুণ", r => mul(r, [2, 9], [2, 9]), [5, 13, 18], "নামতা, এবার ৯-এর ঘর পর্যন্ত।", "৫ → ৯-এর ঘর"),
  kids("যোগ, বিয়োগ, গুণ", r => mix(r, [x => add(x, [10, 40], [5, 19]), x => sub(x, [20, 50], [5, 19]), x => mul(x, [2, 9], [2, 9])]), [5, 10, 17], "যোগ, বিয়োগ, গুণ, সব একসাথে। ঘণ্টা পড়ার আগে যত পারো।"),
  // ২ দোকানের খাতা: write the answer yourself, the numbers grow.
  pad("নিজে লিখে যোগ", r => add(r, [12, 89], [3, 9]), [13, 23, 41], "নতুন খাতা: উত্তর এবার নিজে লেখো। সব ঘর ভরলেই উত্তর যায়।", "বাছাই → নিজে লেখা"),
  pad("দুই অঙ্কে দুই অঙ্ক যোগ", r => add(r, [11, 59], [11, 39]), [11, 20, 36], "দুই অঙ্কের সাথে দুই অঙ্ক। আগে দশক, পরে একক।", "+৯ → +৩৯"),
  pad("দুই অঙ্ক থেকে বিয়োগ", r => sub(r, [21, 99], [3, 9]), [11, 20, 36], "লিখে বিয়োগ: দুই অঙ্ক থেকে এক অঙ্ক।", "+ → −"),
  pad("দুই অঙ্কে দুই অঙ্ক বিয়োগ", r => sub(r, [30, 99], [11, 59]), [10, 18, 32], "দুই অঙ্ক থেকে দুই অঙ্ক বিয়োগ। আগে দশক বাদ দাও।", "−৯ → −৫৯"),
  pad("নামতার গুণ", r => mul(r, [3, 9], [3, 9]), [13, 23, 42], "নামতা, এবার লিখে।", "× এলো"),
  pad("দশকের যোগ", r => { const x = tens(r, 100, 500), y = tens(r, 20, 400); return sum(`${bn(x)} + ${bn(y)}`, x + y, plus(x, y)); }, [9, 17, 30], "শত আর দশকের যোগ। দশক গুনে শেষে শূন্য বসাও।", "উত্তর ৩ অঙ্কে"),
  pad("দুই অঙ্কে এক অঙ্ক গুণ", r => mul(r, [11, 25], [2, 9]), [6, 12, 23], "দুই অঙ্ককে এক অঙ্ক দিয়ে গুণ। দশক আর একক আলাদা গুণ করো।", "৯ × ৯ → ২৫ × ৯"),
  pad("ভাগ", r => div(r, [2, 9], [2, 9]), [13, 22, 41], "নতুন চিহ্ন: ভাগ। কোন নামতায় মেলে, ভাবো।", "÷ এলো"),
  pad("চার চিহ্নের মিশেল", r => mix(r, [x => add(x, [11, 79], [11, 39]), x => sub(x, [30, 99], [11, 29]), x => mul(x, [3, 9], [3, 9]), x => div(x, [2, 9], [2, 9])]), [11, 20, 36], "চার চিহ্নই মিশে আসবে।", "+ − × ÷"),
  pad("তিন সংখ্যার হিসাব", three, [5, 10, 20], "হালখাতার দিন: আগের জের, তার সাথে বিক্রি, তারপর খরচ বাদ। তিন সংখ্যার হিসাব।"),
  // ৩ বাজারের ফর্দ: a list to add up, prices rough and everyday.
  pad("একই জিনিস কয়েকটা", r => counted(r, [2, 5]), [5, 9, 17], "নতুন ফর্দ: কথায় লেখা হিসাব, দাম টাকায়।", "অঙ্ক → বাজার"),
  pad("হালি আর ডজন", hali, [4, 9, 17], "এক হালি ৪টা, এক ডজন ১২টা। দাম হালি বা ডজন ধরে।", "টা → হালি, ডজন"),
  pad("দুই জিনিসের দাম", r => list(r, 2, false), [3, 6, 12], "ফর্দে দুই জিনিস। দুটো দাম যোগ করো।", "১ লাইন → ২ লাইন"),
  pad("কেজি দরে", r => kg(r, [2, 5]), [4, 8, 16], "কেজি দরে দাম: কেজি গুণ দর।", "টা → কেজি"),
  pad("আধা, দেড়, আড়াই কেজি", part, [4, 7, 14], "আধা মানে অর্ধেক, দেড় মানে এক আর আধা, আড়াই মানে দুই আর আধা।", "২ কেজি → দেড় কেজি"),
  pad("সমান ভাগ", share, [3, 6, 13], "বন্ধুরা সমান ভাগে দেবে। মোটটা ভাগ করো।", "÷ এলো বাজারে"),
  pad("দুই জিনিস, কয়েক কেজি", r => list(r, 2, true), [3, 6, 11], "দুই জিনিস, কয়েক কেজি করে। আগে একেকটা, পরে যোগ।", "১ কেজি → ৩ কেজি"),
  pad("তিন জিনিস আর ডজন", r => mix(r, [dozenOfHali, x => list(x, 3, false)]), [3, 6, 11], "তিন লাইনের ফর্দ, নয়তো হালির দামে ডজন।", "২ লাইন → ৩ লাইন"),
  pad("ফেরত কত", change, [3, 6, 12], "নোট দিলে ফেরত কত? দোকানদারের মতো বিল থেকে গুনে ওঠো।", "যোগ → ফেরত"),
  pad("পুরো বাজার", r => mix(r, [x => counted(x, [2, 5]), hali, dozenOfHali, x => kg(x, [2, 4]), part, share, x => list(x, 2, true), change]), [3, 7, 15], "চাঁদরাতের ভিড়: বাজারের সব রকম হিসাব একসাথে।"),
];

export const LEVEL_COUNT = LEVELS.length;
export const PER_WORLD = 10;
/** The world names (kept as plain strings for older imports); WORLD has the rest. */
export const WORLDS = ["ছোটদের হিসাব", "দোকানের খাতা", "বাজারের ফর্দ"] as const;
export type World = { name: string; surface: string; rule: string; finale: string; finaleLine: string };
export const WORLD: readonly World[] = [
  { name: WORLDS[0], surface: "স্লেট", rule: "চারটা উত্তর থেকে ঠিকটা বাছো।", finale: "টিফিনের ঘণ্টা", finaleLine: "টিফিনের ঘণ্টা পড়ার আগেই স্লেট ভরা।" },
  { name: WORLDS[1], surface: "খাতা", rule: "উত্তর নিজে লেখো।", finale: "হালখাতা", finaleLine: "হালখাতার পাতা মিলেছে, জের ঠিকঠাক।" },
  { name: WORLDS[2], surface: "ফর্দ", rule: "কথায় লেখা বাজারের হিসাব, দাম টাকায়।", finale: "চাঁদরাতের বাজার", finaleLine: "চাঁদরাতের ভিড়েও ফর্দের মোট আগে বলেছ।" },
];
export const worldOf = (level: number) => Math.floor((level - 1) / PER_WORLD);
export const worldStart = (index: number) => index * PER_WORLD + 1;
export const isFinale = (level: number) => level % PER_WORLD === 0;
export const finaleName = (level: number) => isFinale(level) ? WORLD[worldOf(level)].finale : "";
/** The pad never takes more than this many digits. */
export const MAX_DIGITS = 3;

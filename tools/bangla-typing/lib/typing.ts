export const TEST_SECONDS = 60;
export const MAX_NAME = 20;
export const MAX_WPM = 200;

// Original practice text written for this tool (no book, song or newspaper lines).
// Share links store the index: only append new passages; never reorder or delete.
export const passages = [
  "সকালে মা চা বানায়, বাবা পত্রিকা পড়ে। ছোট ভাই স্কুলের ব্যাগ খুঁজে পায় না। জানালা দিয়ে রোদ আসে, রিকশার টুংটাং শোনা যায়। নাশতার টেবিলে সবাই একসাথে বসলে মনটা ভালো হয়ে যায়। এভাবেই আমাদের দিন শুরু হয়, তাড়াহুড়োয় আর হাসিতে।",
  "আকাশ কালো হয়ে এলো, তারপর ঝুম বৃষ্টি। টিনের চালে শব্দটা গানের মতো লাগে। মা খিচুড়ি চুলায় দিলেন, সাথে ডিম ভাজা। আমরা জানালার পাশে বসে গল্প করি। চায়ের কাপে ধোঁয়া ওঠে, আর সময়টা যেন থেমে যায়। এমন দিনে কারও কোথাও যেতে ইচ্ছা করে না।",
  "অফিস শেষে মোড়ের টং দোকানে দাঁড়াই। মামা, এক কাপ দুধ চা দেন। পাশে কেউ খেলার কথা বলে, কেউ দামের কথা। গরম কাপটা হাতে নিলে সারা দিনের ক্লান্তি একটু কমে। চায়ের সাথে একটা টোস্ট বিস্কুট হলে তো কথাই নেই। তারপর বাসায় ফেরার পালা, রাস্তায় আলো জ্বলে উঠেছে।",
  "ছুটিতে নানাবাড়ি যাওয়ার কথা শুনলেই মন নেচে ওঠে। পুকুরে সাঁতার, গাছ থেকে আম পাড়া, সন্ধ্যায় নানির গল্প। মামাতো ভাইবোনেরা মিলে সারা উঠান মাতিয়ে রাখি। রাতে উঠানে মাদুর পেতে সবাই তারা গুনি। ফেরার দিন সবার চোখ ভিজে যায়, আবার আসব বলে বিদায় নিই।",
  "শুক্রবার সকালে বাবার সাথে বাজারে যাই। মাছের বাজারে হইচই, সবজির দোকানে সবুজের মেলা। বাবা দরদাম করেন, আমি ব্যাগ ধরে থাকি। ফেরার পথে একটা জিলাপি জোটে আমার ভাগে। এই ছোট্ট খুশিটুকুর জন্যই প্রতি সপ্তাহে অপেক্ষা করি। বাসায় ফিরে মা ব্যাগ খুলে দেখেন কী কী আনলাম।",
  "বিদেশ থেকে ভাইয়া ভিডিও কলে আসে প্রতি রাতে। মা আগে জিজ্ঞেস করেন, ঠিকমতো খাচ্ছিস তো? ভাইয়া হাসে, বলে সব ঠিক আছে। তারপর ছোট বোন তার নতুন আঁকা ছবি দেখায়। বাবা চুপচাপ পাশে বসে শোনেন, চোখে একটু পানি। কল কেটে গেলেও ঘরটা অনেকক্ষণ ভরা ভরা লাগে।",
  "পহেলা বৈশাখের সকালে শহর লাল সাদা হয়ে যায়। মাথায় ফুল, হাতে বাঁশি, মুখে হাসি। মেলায় মাটির পুতুল, বাতাসা আর নাগরদোলা। ঢাকের শব্দে পা আপনিই নাচতে চায়। দুপুরে বাসায় ফিরে পান্তা ভাত আর আলু ভর্তা। নতুন বছরটা যেন এমন রঙিনই থাকে।",
  "টিফিনের ঘণ্টা বাজতেই সবাই মাঠে দৌড় দিই। কেউ ক্রিকেট খেলে, কেউ গাছের নিচে বসে আড্ডা দেয়। বন্ধুর টিফিন বাক্স থেকে একটা পরোটা ভাগ করে খাই। কে কত রান করল, সেই হিসাব চলে সারা দিন। ঘণ্টা আবার বাজলে মন খারাপ করে ক্লাসে ফিরি।",
  "হঠাৎ কারেন্ট চলে গেল, চারদিক অন্ধকার। দাদি মোমবাতি জ্বালিয়ে দিলেন। সবাই এক ঘরে জড়ো হলাম, শুরু হলো ভূতের গল্প। ছোট বোন ভয়ে আমার হাত চেপে ধরল। বাইরে ঝিঁঝিঁ ডাকছে, হাতপাখার বাতাসে মোমের আলো কাঁপে। কারেন্ট ফিরলে সবাই একটু হতাশই হলো, গল্পটা যে শেষ হয়নি।",
  "শীতের সকালে কুয়াশায় কিছুই দেখা যায় না। খেজুরের রস নিয়ে গাছি আসে বাড়ির উঠানে। মা ভাপা পিঠা বানান, ধোঁয়া ওঠে হাঁড়ি থেকে। চাদর জড়িয়ে রোদে বসে পিঠা খাওয়ার মজাই আলাদা। দুপুর হতেই রোদ মিষ্টি হয়, আর সবাই উঠানে গল্পে বসে।",
  "ট্রেনের জানালা দিয়ে সবুজ ধানখেত ছুটে যায়। দূরে নদী, নৌকায় জেলেরা জাল ফেলছে। হকার হাঁক দেয়, বাদাম, চানাচুর, ঝালমুড়ি। পাশের যাত্রী গল্প জুড়ে দেন, যেন কত দিনের চেনা। স্টেশনে থামলে চায়ের কাপ হাতে নামি। পথ লম্বা, কিন্তু একটুও খারাপ লাগে না।",
  "সন্ধ্যায় ছাদে বন্ধুদের আড্ডা জমে। কেউ গিটার আনে, কেউ মুড়ি মাখা। পুরোনো দিনের কথা উঠলে হাসি থামে না। কে কবে কার টিফিন চুরি করেছিল, সব ফাঁস হয়ে যায়। চাঁদ ওঠে, বাতাস ঠান্ডা হয়, তবু কেউ উঠতে চায় না। এমন সন্ধ্যা জীবনে যত আসে, তত ভালো।",
] as const;

const numbers = new Intl.NumberFormat("bn-BD");
export const bn = (value: number) => numbers.format(value);

const segmenter = new Intl.Segmenter("bn", { granularity: "grapheme" });
export const graphemes = (text: string) => Array.from(segmenter.segment(text), part => part.segment);
export const words = (text: string) => text.normalize("NFC").split(/\s+/).filter(Boolean);

/**
 * One word as every keyboard should agree on it. NFC folds precomposed য়/ড়/ঢ় into their decomposed form and joins ে+া into ো;
 * ত্‍ is the old way to type ৎ; joiners are invisible; punctuation is optional because দাঁড়ি is buried on phone keyboards.
 */
export function fold(word: string) {
  return word.normalize("NFC").replace(/ত্‍/g, "ৎ").replace(/[​-‍­﻿]/g, "").replace(/[,।॥|.!?;:'"‘’“”()\-–—]/g, "");
}

export type Mark = "ok" | "bad" | "now" | "slip" | "todo";
export type Check = {
  /** One mark per passage word: typed right, typed wrong, being typed (fine so far / already off), not reached. */
  marks: Mark[];
  current: number;
  correctWords: number;
  /** Graphemes typed right, and all graphemes judged, for accuracy. */
  correct: number;
  judged: number;
  finished: boolean;
};

export function check(target: string, typed: string): Check {
  const goal = words(target).map(word => graphemes(fold(word)));
  const got = words(typed).map(word => graphemes(fold(word)));
  // A word without a space after it is still being typed: judge only what is there, and let its last letter be half-built (ক্ before ক্ষ).
  const open = got.length > 0 && !/\s$/.test(typed);
  const closed = open ? got.length - 1 : got.length;
  let correct = 0, judged = 0, correctWords = 0, onTrack = true;
  got.forEach((word, index) => {
    const want = goal[index] ?? [];
    const last = open && index === got.length - 1;
    const span = last ? word.length : Math.max(word.length, want.length);
    for (let at = 0; at < span; at++) {
      const right = word[at] === want[at] || (last && at === word.length - 1 && want[at] !== undefined && want[at].startsWith(word[at]));
      judged++;
      if (right) correct++;
      else if (last) onTrack = false;
    }
    if (word.join("") === want.join("") && want.length) correctWords++;
  });
  const finished = closed >= goal.length || (open && got.length === goal.length && got.at(-1)!.join("") === goal.at(-1)!.join(""));
  const marks = goal.map((want, index): Mark => {
    if (index < closed || (finished && index < got.length)) return got[index].join("") === want.join("") ? "ok" : "bad";
    if (index === closed) return open && !onTrack ? "slip" : "now";
    return "todo";
  });
  return { marks, current: Math.min(closed, goal.length), correctWords, correct, judged, finished };
}

/** Net speed: only words typed exactly right count. Accuracy rounds down, so 100% means not one wrong letter. */
export function score(result: Check, seconds: number) {
  const minutes = Math.max(seconds, 1) / 60;
  return {
    wpm: Math.min(MAX_WPM, Math.round(result.correctWords / minutes)),
    accuracy: result.judged ? Math.floor((result.correct / result.judged) * 100) : 0,
  };
}

export type Shared = { p: number; w: number; a: number; n: string };

export function cleanName(name: string) {
  // NFC so the same name typed on two keyboards matches; strip control and bidi-override characters so a link can't scramble the card.
  return name.normalize("NFC").replace(/[\u0000-\u001f\u007f‪-‮⁦-⁩]/g, "").trim().replace(/\s+/g, " ").slice(0, MAX_NAME);
}

export function shareHash({ p, w, a, n }: Shared) {
  const params = new URLSearchParams({ p: String(p), w: String(Math.min(w, MAX_WPM)), a: String(Math.min(a, 100)) });
  const name = cleanName(n);
  if (name) params.set("n", name);
  return "#" + params.toString();
}

const whole = (value: string | null, max: number) => value !== null && /^\d{1,3}$/.test(value) && +value <= max ? +value : null;

export function parseShareHash(hash: string): Shared | null {
  if (hash.length > 300) return null;
  const params = new URLSearchParams(hash.replace(/^#/, ""));
  const p = whole(params.get("p"), passages.length - 1);
  const w = whole(params.get("w"), MAX_WPM);
  const a = whole(params.get("a"), 100);
  if (p === null || w === null || a === null) return null;
  return { p, w, a, n: cleanName(params.get("n") ?? "") };
}

// The stamp on the card, and the fixed buckets people may count anonymously.
export const grades = [
  { id: "shikkhanobish", min: 0, stamp: "শিক্ষানবিশ", label: "১৫-এর কম" },
  { id: "cholonsoi", min: 15, stamp: "চলনসই", label: "১৫ থেকে ২৪" },
  { id: "paka", min: 25, stamp: "পাকা হাত", label: "২৫ থেকে ৩৪" },
  { id: "ostad", min: 35, stamp: "ওস্তাদ", label: "৩৫ বা তার বেশি" },
] as const;
export const gradeOf = (wpm: number) => grades.findLast(grade => wpm >= grade.min)!;
export const tallyIds = grades.map(grade => grade.id);

export function humanLine(wpm: number, accuracy: number) {
  if (wpm >= 40) return "কোর্টের টাইপিস্টরাও তোমাকে সালাম দেবে।";
  if (accuracy === 100 && wpm >= 5) return "একটা অক্ষরও ভুল হয়নি। হেডক্লার্ক খুশি।";
  if (accuracy < 80) return "তাড়াহুড়োয় কয়েকটা অক্ষর পিছলে গেছে। একটু আস্তে লিখলেই বাড়বে।";
  if (wpm >= 30) return "আঙুল তো না, যেন টাইপরাইটারের হাতুড়ি।";
  if (wpm >= 20) return "মেসেঞ্জারে তোমার উত্তরের জন্য কাউকে বসে থাকতে হয় না।";
  if (wpm >= 10) return "ধীরে, কিন্তু প্রতিটা অক্ষর মন দিয়ে।";
  return "টাইপ স্কুলের প্রথম দিন সবারই এমন যায়। কাল আবার!";
}

/** The first few words, for "same passage" labels. */
export const opening = (p: number) => words(passages[p]).slice(0, 4).join(" ").replace(/[,।]$/, "") + "…";

export function caption({ w, a }: Shared) {
  return `বাংলা টাইপিং টেস্টে মিনিটে ${bn(w)}টা শব্দ, ${bn(a)}% নির্ভুল। একই লেখা, তুমি কত পারো?`;
}

export function previewTitle({ w, a, n }: Shared) {
  return `${n || "এক বন্ধু"} মিনিটে ${bn(w)}টা বাংলা শব্দ টাইপ করেছে, ${bn(a)}% নির্ভুল — তুমি কত?`;
}

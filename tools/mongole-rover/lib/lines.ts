// Every line the child or the card sees after a run, as pure functions so the tests can read them.
import { DIRS, type Block, type Level, type Run } from "./rover";

const digits = new Intl.NumberFormat("bn-BD", { useGrouping: false });
export const bn = (n: number) => digits.format(n);

export const levelLabel = (n: number) => `লেভেল ${bn(n)}`;
export const blockText = (block: Block) => (block.times > 1 ? `${bn(block.times)} বার ${DIRS[block.dir].bn}` : DIRS[block.dir].bn);

/** What went wrong, in one line, and which block to look at. Never a penalty: the next run starts fresh. */
export function noteFor(level: Level, run: Run, planLength: number) {
  if (!planLength) return { title: "আগে তীর চাপো।", why: "প্রতিটা তীর রোভারকে এক ঘর সরায়।" };
  const at = run.failBlock === null ? "" : `${bn(run.failBlock + 1)} নম্বর ব্লকে`;
  if (run.end === "crater") return { title: "এখানে গর্ত! প্ল্যানটা ঠিক করো।", why: `${at} গর্তে ঠেকল। ব্লকটায় চাপ দিলে মুছে যাবে।` };
  if (run.end === "edge") return { title: "ম্যাপ এখানেই শেষ। প্ল্যানটা ঠিক করো।", why: `${at} ম্যাপের বাইরে যাচ্ছিল।` };
  const left = level.samples.length - run.got;
  return { title: "প্ল্যান ফুরিয়ে গেল।", why: `আরও ${bn(left)}টা পাথর বাকি। শেষে আরও তীর বসাও।` };
}

/** The line under the board before a run: what to do on this level, in as few words as possible. */
export function tipFor(level: Level, plan: Block[]) {
  if (level.n === 1 && !plan.length) return "তীর চাপো, তারপর চালাও।";
  if (level.repeat && level.n === 10 && plan.length <= 1) return plan.length ? "এবার ‘আরেক বার’ চাপো: এক ব্লকেই দুই ঘর।" : "↑ চাপো, তারপর ‘আরেক বার’ চাপো।";
  if (level.challenge) return "সবচেয়ে কম ব্লকে সব পাথর তোলো।";
  if (level.samples.length > 1) return `${bn(level.samples.length)}টা পাথরই তুলতে হবে।`;
  return "পথটা আঙুলে দেখে নাও, তারপর তীর সাজাও।";
}

export const endTitle = (blocks: number) => `${bn(blocks)} ব্লকের প্ল্যানে সব পাথর তোলা হলো`;

/** Praise the method, not the child, and only when it's true. Otherwise say what's possible, without pressure. */
export function methodLine(blocks: number, fewest: number, runs: number, usedRepeat: boolean) {
  if (blocks > fewest) return `সবচেয়ে ছোট প্ল্যানটা ${bn(fewest)} ব্লকের। খুঁজে দেখবে?`;
  if (usedRepeat) return "লুপ দিয়ে প্ল্যান ছোট হলো। এর চেয়ে কম ব্লকে হয় না।";
  if (runs === 1 && fewest >= 5) return "প্রথম বারেই মিলেছে। আগে পুরো পথটা ভেবে নিয়েছিলে।";
  return "এর চেয়ে ছোট প্ল্যান হয় না।";
}

export type Today = { levels: number; samples: number; last: { n: number; plan: Block[]; stars: number } | null };

export const cardTitle = (today: Today) => `আজ মঙ্গলে রোভার চালিয়ে ${bn(today.samples)}টা পাথর তুললাম`;
export const cardSub = (today: Today) => today.last ? `${bn(today.levels)}টা লেভেল পার, শেষ প্ল্যান ${bn(today.last.plan.length)} ব্লকের` : "";
export const CARD_FOOTER = "আগে প্ল্যান, তারপর চালাও: কোডিংয়ের প্রথম পাঠ";

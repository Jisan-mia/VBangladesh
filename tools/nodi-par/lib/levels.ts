// The rivers as data: three worlds of ten, each river with the one new thing it teaches, rivers 10, 20 and 30 as named finales.
// The rivers themselves (lanes, floaters, seeds) are made by river.ts; nothing here changes how a river is built, so old stars,
// best times and challenge links keep their meaning. tests/levels.test.ts proves every river crossable and bot-clearable.

export const LEVEL_COUNT = 30;
export const PER_WORLD = 10;

export type Look = "khal" | "nodi" | "borsha";
export type World = { name: string; look: Look; tag: string; /** The world's three notes at the start of a river. */ call: readonly [number, number, number] };

export const WORLDS: readonly World[] = [
  { name: "গ্রামের খাল", look: "khal", tag: "শরতের সকাল", call: [523, 659, 784] },
  { name: "বড় নদী", look: "nodi", tag: "দুপুরের রোদ", call: [440, 554, 659] },
  { name: "বর্ষার নদী", look: "borsha", tag: "ঝিরঝিরে বৃষ্টি", call: [392, 494, 587] },
];

/** What waits across each river. The first and the last are নানুবাড়ি. */
export const PLACES = [
  "নানুবাড়ির ঘাট", "স্কুলের মাঠ", "বড় আমগাছ", "মুদি দোকান", "খালার বাড়ি", "ধানখেত", "বটতলা", "হাটখোলা", "কামারবাড়ি", "মেলার মাঠ",
  "চরের কাশবন", "খেয়াঘাট", "লঞ্চঘাট", "জেলেপাড়া", "ইটভাটা", "চায়ের দোকান", "বাঁশঝাড়", "কুমারপাড়া", "পাটখেত", "উপজেলা সদর",
  "বৃষ্টিভেজা হাট", "নৌকাবাইচের ঘাট", "তালগাছের সারি", "নতুন চর", "হিজল বন", "শাপলা বিল", "পুরোনো জমিদারবাড়ি", "রেলস্টেশন", "বড় বাজার", "নানুবাড়ি",
] as const;

/** The one new thing each river brings, as its start card and সব নদী say it. Quantities are exact (see river.ts specOf). */
export const LESSONS = [
  "ভেলা থেকে ভেলায় লাফাও, ওপারের ঘাটে ওঠো।",
  "নতুন: নৌকা। লম্বা, দাঁড়ানোর জায়গা বেশি।",
  "নতুন: কচুরিপানা। ছোট আর পাতলা, মাঝখানে নামো।",
  "নতুন: দুটো আম। দুটোই তুললে একটা তারা।",
  "নতুন: কিনারা। স্রোত তোমাকে পর্দার বাইরে নিলে পানিতে পড়বে। কিনারা লাল হলে লাফ দাও।",
  "নতুন: পাশে লাফ। আঙুল ডানে-বাঁয়ে টানো, বা পাশের বোতাম চাপো।",
  "নতুন: পিছনে লাফ। ভুল সারিতে উঠলে এক ধাপ নেমে এসো।",
  "আরও এক সারি: ছয় সারি পানি।",
  "ফাঁক বড় হচ্ছে। পরের ভেলা আসতে দেখে নামো।",
  "সাত সারি পানি, এ খালের সবচেয়ে চওড়া জায়গা।",
  "নতুন: মাঝনদীতে চর। চরে একটা আম, পানিতে পড়লে চর থেকেই আবার।",
  "স্রোত আরেকটু জোরে।",
  "নতুন: ফেরি। ভোঁ শুনলে বুঝবে আসছে, কিনারে তীর জ্বলবে।",
  "ফেরির পিঠেও দাঁড়ানো যায়। পাঁচ ঘর লম্বা, তবে সবচেয়ে জোরে চলে।",
  "নতুন: ফেরির ঢেউ। ঢেউয়ে কচুরিপানা ডোবে, ডোবার আগে ছোট হয়ে আসে।",
  "স্রোত আরও জোরে।",
  "ঢেউয়ের সারিতে বেশির ভাগই কচুরিপানা। দেরি কোরো না।",
  "আরও এক সারি: নয় সারি পানি।",
  "কচুরিপানা প্রতি পাঁচ সেকেন্ডে একবার ডোবে। তাল ধরো।",
  "দশ সারি পানি, ফেরি আর ঢেউ একসাথে।",
  "নতুন: বর্ষা। বৃষ্টিতে ভেলা-নৌকার মাঝে ফাঁক আরও বড়।",
  "আরও এক সারি: আট সারি পানি।",
  "ফেরি আর ঢেউ ফিরে এল, এবার বর্ষার স্রোতে।",
  "নতুন: দুটো চর। মাঝে দুবার জিরিয়ে নিতে পারবে।",
  "ফেরির দুই পাশেই এখন ঢেউ।",
  "নতুন: চারটা আম। চারটাই তুললে একটা তারা।",
  "কচুরিপানা এবার ছোট। মাঝখানে নামো।",
  "আরও এক সারি: এগারো সারি পানি।",
  "স্রোত আরও জোরে। কিনারা লাল হলেই লাফ।",
  "বারো সারি, দুই চর, দুই পাশে ঢেউ। ওপারে নানুবাড়ি।",
] as const;

/** The three finales, named. Their name and a progress bar sit top-centre while you cross. */
export const FINALES: Readonly<Record<number, string>> = { 10: "খালের মোড়", 20: "ফেরিঘাটের ঢেউ", 30: "নানুবাড়ির ঘাট" };

export const isLevel = (level: number) => Number.isInteger(level) && level >= 1 && level <= LEVEL_COUNT;
export const isFinale = (level: number) => level in FINALES;
export const worldOf = (level: number) => Math.min(WORLDS.length - 1, Math.max(0, Math.ceil(level / PER_WORLD) - 1));
export const lessonOf = (level: number) => LESSONS[Math.min(LEVEL_COUNT, Math.max(1, Math.round(level) || 1)) - 1];
/** "খালের মোড়" for a finale, else the place across. */
export const riverName = (level: number) => FINALES[level] ?? PLACES[level - 1];

/**
 * The foot: how much of an end of a ভেলা still holds you (`grip`, cells) and how long you stay in the water (`respawn`, seconds).
 * The river, its clock and its time star never change with the mode, so a friend's link is the same crossing on every mode.
 */
export const MODES = [
  { name: "সহজ", grip: 0.4, respawn: 0.45, line: "পা রাখার জায়গা বেশি, পড়লে চটপট উঠে আসো।" },
  { name: "স্বাভাবিক", grip: 0.25, respawn: 0.7, line: "ঠিক যেমন ছিল।" },
  { name: "কঠিন", grip: 0.1, respawn: 1.0, line: "ভেলার কিনারা ছুঁলে পড়বে, ঘাটে ফিরতে দেরি লাগে।" },
] as const;
export const DEFAULT_MODE = 1;
export const modeOf = (mode: number) => MODES[Math.max(0, Math.min(MODES.length - 1, Math.round(mode) || 0))];

/** The first-run story, three panels over the river. */
export const STORY = [
  "ছুটির দিন। কাঁধে ব্যাগ, যাবে নানুবাড়ি।",
  "সেতু নেই। আছে ভেলা, নৌকা, কচুরিপানা।",
  "লাফ দাও। ওপারের ঘাটে ঘণ্টা বাজবে।",
] as const;

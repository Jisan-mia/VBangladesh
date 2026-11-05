// The ladder's words: four streets, and for every jam its name and the one new thing it shows. The jams themselves are
// data in levels.ts (made by scripts/make-levels.ts); tests/levels.test.ts proves each line is true of its jam.
export const LEVEL_COUNT = 32;

export type World = {
  name: string; from: number; to: number;
  /** What this street adds, in the player's words. */
  adds: string;
  /** Where the story is, for the title. */
  place: string;
};
export const WORLDS: readonly World[] = [
  { name: "গলির মুখ", from: 1, to: 8, adds: "রিকশা আর ভ্যান", place: "বিকেলের গলি" },
  { name: "বড় রাস্তা", from: 9, to: 16, adds: "বাস আর ট্রাক, ৩ ঘর লম্বা", place: "অফিস ছুটির মোড়" },
  { name: "রাস্তা খোঁড়া", from: 17, to: 24, adds: "ইটের স্তূপ আর বেড়া, যা নড়ে না", place: "খোঁড়া রাস্তা" },
  { name: "ঈদের আগের রাত", from: 25, to: 32, adds: "দুটো CNG, দুটোই বের করতে হবে", place: "ঈদের আগের রাত" },
];

export type LevelInfo = { name: string; teach: string; finale: boolean };
const info = (name: string, teach: string, finale = false): LevelInfo => ({ name, teach, finale });

/** One entry a level, in order. What each line says is checked against the jam by tests/levels.test.ts. */
export const LEVEL_INFO: readonly LevelInfo[] = [
  // 1 গলির মুখ
  info("প্রথম টান", "রিকশাটা টেনে সরাও, তারপর CNG-টাকে ওপরে তোলো।"),
  info("জোড়া বাধা", "দুটো গাড়ি পথ আটকেছে। দুটোকেই সরাও।"),
  info("আটকের ওপর আটক", "যে গাড়ি সরতে পারছে না, আগে তার বাধা সরাও।"),
  info("আড়াআড়ি", "ওপর-নিচে চলা গাড়ি আড়াআড়ি গাড়ির পথ আটকায়।"),
  info("আবার সেই গাড়ি", "একই গাড়িকে দুবার সরাতে হতে পারে।"),
  info("গলির ভিড়", "অনেক গাড়ি। আগে ভাবো: কোনটা সরলে জায়গা হয়?"),
  info("মোড়ের ভিড়", "ভুল চাল? ফিরিয়ে নাও। চাল গুনে তারা মেলে।"),
  info("গলির মুখের জ্যাম", "গলির মুখে সবাই আটকা। এখানে সব ভাবনা লাগবে।", true),
  // 2 বড় রাস্তা
  info("বাস এল", "বাস ৩ ঘর লম্বা। সরাতে বেশি ফাঁকা জায়গা লাগে।"),
  info("ট্রাকের পাশে", "ট্রাকও ৩ ঘর। আগে ওর পাশ ফাঁকা করো।"),
  info("লম্বা বাধা", "লম্বা গাড়ি সব জায়গায় যেতে পারে না। জায়গা বুঝে সরাও।"),
  info("বাস আর ট্রাক", "বাস আর ট্রাক দুটোই সরাতে হবে। কোনটা আগে?"),
  info("ঘুরে আসা", "বড় গাড়িকে সরিয়ে আবার সরাতে হতে পারে।"),
  info("সকালের চাপ", "ছোট গাড়ি সরলে বড় গাড়ির জায়গা হয়।"),
  info("সন্ধ্যার চাপ", "পথ আছে, তবে ঘুরিয়ে। ধীরে ভাবো।"),
  info("অফিস ছুটির মোড়", "বাস, ট্রাক, রিকশা, সবাই আটকা। সব ভাবনা এখানে।", true),
  // 3 রাস্তা খোঁড়া
  info("ইটের স্তূপ", "ইটের স্তূপ নড়ে না। ওর পাশ দিয়ে পথ খোঁজো।"),
  info("ঘুরে যাও", "স্তূপ যে লেনে, সেখানে গাড়ি কম দূর যায়।"),
  info("দুই স্তূপ", "দুটো স্তূপ। কোন গাড়ি কত দূর যেতে পারে, আগে দেখো।"),
  info("বেড়ার ধারে", "স্তূপ আর বেড়া একই কাজ করে: জায়গা আটকায়।"),
  info("সরু পথ", "সোজা পথ বন্ধ। ঘুরে যাওয়ার জায়গা বানাও।"),
  info("তিন স্তূপ", "তিনটা স্তূপ। প্রতিটা চাল হিসেব করে দাও।"),
  info("খোঁড়াখুঁড়ি", "খোঁড়া রাস্তায় ভুল চালের দাম বেশি।"),
  info("ওয়াসার খোঁড়া রাস্তা", "চারদিকে স্তূপ আর বেড়া। সব শেখা এখানে লাগবে।", true),
  // 4 ঈদের আগের রাত
  info("দুই CNG", "নীল CNG-টাও তোমার। দুটোই বের করো।"),
  info("একজন বেরোলে", "একটা CNG বের হলে রাস্তায় তার জায়গা ফাঁকা হয়ে যায়।"),
  info("আগে কে?", "দুই CNG-র দুই পথ। কোনটা আগে খুললে সহজ?"),
  info("এক গাড়ি, দুই পথ", "একটা গাড়ি দুই CNG-রই পথ আটকে আছে। ওকে সরালে দুটোরই কাজ হয়।"),
  info("রাতের ভিড়", "বাড়ি ফেরার ভিড়। দুটো পথ একসাথে ভাবো।"),
  info("স্তূপ আর জোড়া", "স্তূপও আছে, দুটো CNG-ও আছে।"),
  info("শেষ রাতের মোড়", "সবার তাড়া। সবচেয়ে কম চালে দুটোকে বের করো।"),
  info("ঈদের আগের রাত", "সবাই বাড়ি ফিরছে। দুটো CNG-ই বের করো।", true),
];

export const isLevel = (level: number) => Number.isInteger(level) && level >= 1 && level <= LEVEL_COUNT;
export const infoOf = (level: number) => LEVEL_INFO[level - 1];
export const isFinale = (level: number) => isLevel(level) && LEVEL_INFO[level - 1].finale;
export const worldIndex = (level: number) => Math.max(0, WORLDS.findIndex(world => level >= world.from && level <= world.to));
export const worldOf = (level: number) => WORLDS[worldIndex(level)];
/** A level's place in its street, 1-based. */
export const inWorld = (level: number) => level - worldOf(level).from + 1;

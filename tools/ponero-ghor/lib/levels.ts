// The 30 levels as data: four worlds, each its own tin and picture, each level with a name and the one new thing it
// teaches. The plates themselves (seed, shuffle, par) are generated into plates.ts and never change, so old links replay.
import { PLATES } from "./plates";

export const LEVELS = PLATES;

/** How a level's ঘুঁটি look: digits, picture slices with a corner digit, a faint digit, or the picture alone. */
export type Look = "digits" | "picture" | "faint" | "only";
export type Picture = "boat" | "rickshaw" | "kites" | "wheel";

export type World = { name: string; tin: string; size: 3 | 4 | 5; from: number; to: number; picture: Picture; thing: string };

export const WORLDS: readonly World[] = [
  { name: "নদীর ঘাট", tin: "লাল টিন", size: 3, from: 1, to: 10, picture: "boat", thing: "নৌকা" },
  { name: "শহরের রাস্তা", tin: "নীল টিন", size: 4, from: 11, to: 18, picture: "rickshaw", thing: "রিকশা" },
  { name: "পুরান ঢাকার ছাদ", tin: "সবুজ টিন", size: 4, from: 19, to: 25, picture: "kites", thing: "ঘুড়ি" },
  { name: "রাতের মেলা", tin: "সোনালি টিন", size: 5, from: 26, to: 30, picture: "wheel", thing: "নাগরদোলা" },
];

export type LevelInfo = { name: string; teach: string; look: Look; finale?: true };

export const LEVEL_INFO: readonly LevelInfo[] = [
  // নদীর ঘাট, ৩×৩
  { name: "প্রথম ঠেলা", teach: "ফাঁকা ঘরের পাশের ঘুঁটি চাপো, সরে যাবে।", look: "digits" },
  { name: "আঙুলে টানো", teach: "ঘুঁটি আঙুলে টেনেও সরানো যায়। অর্ধেক টানলেই বসে যায়।", look: "digits" },
  { name: "এক টানে লাইন", teach: "একই সারির দূরের ঘুঁটি চাপলে মাঝেরগুলোও একসাথে সরে।", look: "digits" },
  { name: "ফিরিয়ে নাও", teach: "উল্টো দিকে ঠেললে আগের চালটা বাদ যায়, চালও কমে।", look: "digits" },
  { name: "সারি মিলল", teach: "পুরো সারি জায়গামতো বসলে ঘুঁটিগুলো পিতলের মতো হলুদ হয়।", look: "digits" },
  { name: "তারার হিসাব", teach: "ওপরে ডানে দেখো কয় তারার পথে আছ। তারা কমার আগে কিনারা কমলা হয়।", look: "digits" },
  { name: "ছবির ঘুঁটি", teach: "এবার ঘুঁটিতে নৌকার টুকরো। কোণের ছোট সংখ্যা দেখে সাজাও।", look: "picture" },
  { name: "আগে ওপরের সারি", teach: "ওপরের সারি আগে মেলাও। তারপর ওটা আর ছুঁয়ো না।", look: "picture" },
  { name: "আবছা সংখ্যা", teach: "সংখ্যা আবছা হয়ে এল। পাল আর পানির দাগ মিলিয়ে বসাও।", look: "faint" },
  { name: "মাঝির নৌকা", teach: "শুধু ছবি, সংখ্যা নেই। নিচে বাঁয়ে পুরো নৌকাটা দেখা যায়।", look: "only", finale: true },
  // শহরের রাস্তা, ৪×৪
  { name: "আসল ১৫ ঘর", teach: "এবার ৪×৪, ১ থেকে ১৫। মেলার আসল প্লেট এটাই।", look: "digits" },
  { name: "একটা চাল", teach: "আটকে গেলে ‘একটা চাল’ চাপো। প্রথমবারে ৩ তারার সুযোগ ২-এ নামে।", look: "digits" },
  { name: "শেষ দুটো জোড়ায়", teach: "সারির শেষ দুটো একসাথে বসে: ৩ কোণে, ৪ তার ঠিক নিচে, তারপর দুটোকে ঘুরিয়ে আনো।", look: "digits" },
  { name: "রিকশার ছবি", teach: "ঘুঁটিতে রিকশার টুকরো। কোণের ছোট সংখ্যা সঙ্গে আছে।", look: "picture" },
  { name: "দ্বিতীয় সারি", teach: "প্রথম সারির পর দ্বিতীয়টাও একইভাবে: শেষ দুটো জোড়ায়।", look: "picture" },
  { name: "বাম কলাম", teach: "দুই সারির পর বাম কলাম: ৯ আর ১৩ একসাথে, জোড়ায়।", look: "picture" },
  { name: "আবছা সংখ্যা", teach: "সংখ্যা আবছা। চাকা আর হুডের রং দেখে বসাও।", look: "faint" },
  { name: "মামার রিকশা", teach: "শুধু ছবি। রিকশাওয়ালা মামার রংচঙে রিকশা জোড়া লাগাও।", look: "only", finale: true },
  // পুরান ঢাকার ছাদ, ৪×৪
  { name: "ছাদের ঘুড়ি", teach: "দূরের ঘুঁটি দুই ধাপে আনো: আগে ঠিক কলামে, তারপর ঠিক সারিতে।", look: "picture" },
  { name: "ফাঁকা ঘর সামনে", teach: "ঠেলার আগে ফাঁকা ঘরটা ঘুঁটির সামনে নিয়ে যাও।", look: "picture" },
  { name: "চক্কর", teach: "২×২ বাক্সে তিনটে ঘুঁটি চক্কর দিলে বাকিরা নড়ে না।", look: "picture" },
  { name: "আবছা সংখ্যা", teach: "সংখ্যা আবছা। ঘুড়ির রং আর সুতো দেখে বসাও।", look: "faint" },
  { name: "শেষের ৩×৩", teach: "দুই সারি আর বাম কলাম মিললে বাকিটা ছোট ৩×৩ প্লেটের মতো।", look: "faint" },
  { name: "শুধু ছবি", teach: "সংখ্যা নেই। নিচে বাঁয়ে পুরো ছবিটা দেখে নাও, তারপর মেলাও।", look: "only" },
  { name: "সাকরাইনের আকাশ", teach: "পৌষের শেষ দিন। পুরান ঢাকার আকাশভরা ঘুড়ি জোড়া লাগাও।", look: "only", finale: true },
  // রাতের মেলা, ৫×৫
  { name: "বড় প্লেট", teach: "৫×৫, ১ থেকে ২৪। নিয়ম একই, শুধু ঘর বেশি।", look: "digits" },
  { name: "আগে বাইরের দিক", teach: "ওপরের সারি আর বাম কলাম মিললে বাকিটা ৪×৪-এর মতো।", look: "digits" },
  { name: "নাগরদোলার ছবি", teach: "ঘুঁটিতে নাগরদোলার টুকরো, কোণে ছোট সংখ্যা।", look: "picture" },
  { name: "আবছা সংখ্যা", teach: "সংখ্যা আবছা। আলোর মালা আর দোলনার রং দেখে বসাও।", look: "faint" },
  { name: "মেলার নাগরদোলা", teach: "শুধু ছবি, ২৪টা ঘুঁটি। মেলার শেষ রাতের বড় প্লেট।", look: "only", finale: true },
];

export const worldIndex = (level: number) => WORLDS.findIndex(world => level >= world.from && level <= world.to);
export const worldOf = (level: number) => WORLDS[Math.max(0, worldIndex(level))];
export const infoOf = (level: number) => LEVEL_INFO[Math.min(LEVEL_INFO.length, Math.max(1, level)) - 1];
export const isFinale = (level: number) => infoOf(level).finale === true;
export const isPicture = (level: number) => infoOf(level).look !== "digits";

// The ladder, as data: three worlds of six levels. Each world adds one twist to the rules, each level one new thing (its
// `line`, on the start card), and the sixth level of a world is its named "boss" code. There are still 18 levels, but they are
// new codes: the stars start again (lib/save.ts), and the old ladder is kept in legacy.ts for links made before the rewrite.
// tests/rewrite.test.ts proves a careful player cracks every possible code within the tries and holds the bots to their
// target rates (tests/bot.ts), which is how `three` and `two` were tuned.
import type { Rules } from './rules';

export type World = {
  name: string; long: string;
  /** The world's twist in a word and one line, for the start card (null for the first, which has none). */
  twist: string | null; rule: string | null;
};
export const WORLDS: readonly World[] = [
  { name: 'উঠান', long: 'নানাবাড়ির উঠান', twist: null, rule: null },
  { name: 'আমবাগান', long: 'দুপুরের আমবাগান', twist: 'জোড়া অঙ্ক', rule: 'এই বাগানের প্রতিটা কোডে একটা অঙ্ক অন্তত দুবার আছে। প্যাডেও একই অঙ্ক দুবার চাপা যায়।' },
  { name: 'আমের হাট', long: 'সন্ধ্যার আমের হাট', twist: 'ঝুড়ির হিসাব', rule: 'আম আর অঙ্কের পাশে বসে না, পড়ে ঝুড়িতে। শুধু গোনা যায় কয়টা পাকা, কয়টা আধপাকা।' },
];
export const PER_WORLD = 6;
export const LEVEL_COUNT = WORLDS.length * PER_WORLD;

type Spec = { name: string; line: string; finale?: string; digits: number; tries: number; three: number; two: number };

// Pads grow one key at a time inside a world; each new world starts small again for its twist. `three`/`two`: the most
// tries for ★★★ and ★★ (any crack is ★), tuned with the bots.
const SPECS: readonly Spec[] = [
  // ১ উঠান: a mango beside each digit
  { name: 'প্রথম কোড', digits: 4, tries: 7, three: 3, two: 4, line: 'প্যাডের চারটা অঙ্কই কোডে আছে। পাকা আম মানে ঠিক ঘরে, আধপাকা মানে অন্য ঘরে।' },
  { name: 'কাঁচা আম', digits: 5, tries: 7, three: 3, two: 4, line: 'প্যাডে একটা অঙ্ক বেশি, ওটা কোডে নেই। ওর পাশে পড়বে কাঁচা আম।' },
  { name: 'প্যাডের আম', digits: 6, tries: 7, three: 3, two: 4, line: 'প্যাডের কোণে ছোট আম বসে। কোন অঙ্ক কী পেয়েছে, এক নজরে দেখো।' },
  { name: 'মিলিয়ে দেখো', digits: 6, tries: 6, three: 3, two: 4, line: 'চারটা অঙ্ক দিলে নিচে লেখা ওঠে: এটা আগের আমের সঙ্গে মেলে কি না।' },
  { name: 'শেষ সুযোগ', digits: 7, tries: 6, three: 3, two: 4, line: 'প্যাডে ৭টা অঙ্ক। শেষ সুযোগে চারপাশ লাল হয়, তখন ভেবে চাপো।' },
  { name: 'লেভেল ৬', finale: 'নানার সিন্দুক', digits: 8, tries: 6, three: 3, two: 4, line: 'নানার পুরোনো সিন্দুকের পেতলের তালা। প্যাডে ৮টা অঙ্ক, সুযোগ ৬ বার।' },
  // ২ আমবাগান: a pair in every code
  { name: 'জোড়া অঙ্ক', digits: 4, tries: 7, three: 3, two: 4, line: 'কোডে একটা অঙ্ক দুবার। প্যাডেও এখন একই অঙ্ক দুবার চাপা যায়।' },
  { name: 'দুই ঘরে এক অঙ্ক', digits: 5, tries: 7, three: 3, two: 5, line: 'একই অঙ্ক দুই ঘরে দিয়ে দেখো। দুটোই পাকলে জোড়াটা পেয়ে গেলে।' },
  { name: 'একটা পাকে, একটা না', digits: 6, tries: 7, three: 4, two: 5, line: 'কোডে অঙ্কটা একবার থাকলে, দুবার দিলেও একটা আমই পাবে। অন্যটা কাঁচা থাকবে।' },
  { name: 'ছয় সুযোগ', digits: 6, tries: 6, three: 4, two: 5, line: 'সুযোগ ৬ বার। জোড়াটা আগে খোঁজো, বাকিটা পরে।' },
  { name: 'সাত অঙ্কের বাগান', digits: 7, tries: 7, three: 4, two: 5, line: 'প্যাডে ৭টা অঙ্ক। প্রথমবার চারটা আলাদা অঙ্ক দিলে বেশি জানা যায়।' },
  { name: 'লেভেল ১২', finale: 'মালির গুদাম', digits: 8, tries: 7, three: 4, two: 6, line: 'মালির গুদামঘরের তালা। ৮টা অঙ্ক, জোড়া আছে, সুযোগ ৭ বার।' },
  // ৩ আমের হাট: the basket only counts
  { name: 'ঝুড়ি', digits: 4, tries: 7, three: 4, two: 5, line: 'চারটা অঙ্কই কোডে। ঝুড়ি বলে কয়টা ঠিক ঘরে, কোনগুলো তা বলে না।' },
  { name: 'একটা বদলাও', digits: 5, tries: 7, three: 4, two: 5, line: 'একবারে একটাই অঙ্ক বদলাও। ঝুড়ি বদলালে বুঝবে দোষ কার।' },
  { name: 'অদলবদল', digits: 6, tries: 7, three: 4, two: 5, line: 'দুটো ঘর অদলবদল করে দেখো, পাকা বাড়ে না কমে।' },
  { name: 'খালি ঝুড়ি', digits: 7, tries: 7, three: 5, two: 6, line: 'ঝুড়িতে একটাও আম না পড়লে চারটা অঙ্কই কোডের বাইরে। প্যাডে ওরা কাঁচা হয়ে যায়।' },
  { name: 'আট অঙ্কের হাট', digits: 8, tries: 7, three: 5, two: 6, line: 'প্যাডে ৮টা অঙ্ক। আগের সব ঝুড়ি মিলিয়ে তবে চাপো।' },
  { name: 'লেভেল ১৮', finale: 'হাটের বড় তালা', digits: 9, tries: 7, three: 5, two: 6, line: 'হাট ভাঙার আগে আড়তের বড় তালাটা খোলো। ৯টা অঙ্ক, শুধু ঝুড়ির হিসাব।' },
];

export type Level = Spec & Rules & { level: number; world: number };

const LEVELS: readonly Level[] = SPECS.map((spec, index) => {
  const world = Math.floor(index / PER_WORLD) + 1;
  return { ...spec, level: index + 1, world, repeat: world === 2, feedback: world === 3 ? 'basket' : 'digit' };
});

export const isLevel = (level: number) => Number.isInteger(level) && level >= 1 && level <= LEVEL_COUNT;
export const levelOf = (level: number): Level | null => isLevel(level) ? LEVELS[level - 1] : null;
export const worldOf = (level: number) => Math.min(WORLDS.length, Math.max(1, Math.ceil(level / PER_WORLD)));
export const isFinale = (level: number) => isLevel(level) && level % PER_WORLD === 0;
export const levelName = (level: number) => { const info = levelOf(level); return info ? info.finale ?? info.name : ''; };

/** The first level that teaches each aid; before it, the game stays out of the way (a level-free code has them all). */
export const TAUGHT_AT = { hints: 3, clash: 4, edge: 5 } as const;

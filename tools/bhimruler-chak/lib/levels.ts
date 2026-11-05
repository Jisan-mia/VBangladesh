// The ladder, as data: three orchards (worlds) of ten levels. Each world brings one new kind of cleared bush, each level one
// new thing (its `line`, on the start card), and the tenth level of a world is its named finale, where the hornets forgive
// one sting instead of two. Orchards are laid fresh from a seed each time (lib/orchard.ts), always no-guess.
// tests/levels.test.ts proves every level fair over many seeds, and tests/bot.ts tunes each par to its target rates.
import type { Shape } from "./orchard";

export type World = {
  name: string; long: string; of: string;
  /** The world's new kind of bush, in one line for the start card (null for the first, which has none). */
  rule: string | null; ruleName: string | null;
};
export const WORLDS: readonly World[] = [
  { name: "বাড়ির পেছনে", long: "বাড়ির পেছনের বাগান", of: "বাড়ির পেছনের", ruleName: null, rule: null },
  { name: "রাজশাহী", long: "রাজশাহীর আমবাগান", of: "রাজশাহীর", ruleName: "ঝরা আম", rule: "কিছু ঘরে আম পড়ে সংখ্যা ঢেকে গেছে। ওই ঘর নিরাপদ, তবে কিছু বলে না।" },
  { name: "চাঁপাইনবাবগঞ্জ", long: "চাঁপাইনবাবগঞ্জের বড় বাগান", of: "চাঁপাইনবাবগঞ্জের", ruleName: "বাঁশের খুঁটি", rule: "খুঁটির সংখ্যা গোনে শুধু ওপর, নিচ, ডান আর বাম। কোনাকুনি না।" },
];
export const PER_WORLD = 10;
export const LEVEL_COUNT = WORLDS.length * PER_WORLD;

type Spec = Shape & { name: string; line: string; finale?: string; par: number; see?: boolean };

// [cols, rows, nests] grow one step at a time. Pars are seconds for ★★★ (twice that for ★★), tuned with the bots.
const SPECS: readonly Spec[] = [
  // ১ বাড়ির পেছনে: plain numbers
  { name: "প্রথম চাক", cols: 5, rows: 5, nests: 2, par: 20, line: "১ লেখা ঘরের পাশে ঢাকা ঝোপ একটাই হলে, চাক ওখানেই। ওতে গামছা বাঁধো।" },
  { name: "চেপে ধরো", cols: 6, rows: 6, nests: 3, par: 25, line: "ঝোপে আঙুল চেপে ধরলেও গামছা বাঁধা হয়। আবার চেপে ধরলে খোলে।" },
  { name: "সংখ্যায় চাপো", cols: 6, rows: 7, nests: 5, par: 30, line: "কোনো সংখ্যার সব চাকে গামছা? সংখ্যাটায় চাপো, বাকি ঝোপ একসাথে সাফ।" },
  { name: "২ মানে দুটো", cols: 6, rows: 8, nests: 6, par: 35, line: "২ লেখা ঘরের পাশে ঢাকা ঝোপ দুটো থাকলে, দুটোতেই চাক।" },
  { name: "পাশাপাশি দুই সংখ্যা", cols: 7, rows: 8, nests: 8, par: 45, line: "দুটো সংখ্যা মিলিয়ে দেখো। একটার চাক অন্যটার ভাগেও পড়ে।" },
  { name: "দুবার মাফ", cols: 7, rows: 9, nests: 9, par: 50, line: "ভুল ঝোপে চাপ পড়লে ভিমরুল জাগে। দুবার মাফ, তৃতীয়বার সবাই দৌড়।" },
  { name: "চাক গোনো", cols: 7, rows: 10, nests: 11, par: 55, line: "ওপরে লেখা কয়টা চাক বাকি। শেষের ঝোপগুলো ওই হিসাবেই মেলে।" },
  { name: "হিন্ট", cols: 8, rows: 10, nests: 12, par: 65, line: "আটকে গেলে হিন্ট: কোন ঝোপ নিরাপদ, কোন সংখ্যা দেখে, সব দেখায়। তারা একটা কমে।" },
  { name: "ঘড়ির তারা", cols: 8, rows: 11, nests: 14, par: 75, line: "৩ তারার সময় পেরোলে ঘড়ির পাশের তারা একটা নেভে।" },
  { name: "লেভেল ১০", finale: "বুড়ো আমগাছ", cols: 8, rows: 11, nests: 16, par: 80, line: "নানার লাগানো গাছটার চারপাশে ১৬টা চাক। এখানে ভিমরুল একবারই মাফ করে।" },
  // ২ রাজশাহী: ঝরা আম
  { name: "ঝরা আম", cols: 7, rows: 9, nests: 9, mangoes: 2, see: true, par: 45, line: "প্রথম ঝরা আম। আমের নিচের সংখ্যা দেখা যায় না, পাশের সংখ্যা দিয়ে বোঝো।" },
  { name: "আমের পাশে চাক", cols: 7, rows: 10, nests: 10, mangoes: 3, par: 50, line: "আম কখনো চাকের ওপর পড়ে না, পড়ে চাকের পাশে। আমের ঘর নিরাপদ।" },
  { name: "তিনটা আম", cols: 8, rows: 10, nests: 12, mangoes: 3, par: 60, line: "বাগান বড় হলো, ৮×১০। আম তিনটা।" },
  { name: "আম গাছতলায়", cols: 8, rows: 10, nests: 13, mangoes: 4, par: 70, line: "চারটা আম। ঢাকা সংখ্যার চারপাশটা দুই দিক থেকে মিলিয়ে দেখো।" },
  { name: "ঘন বাগান", cols: 8, rows: 11, nests: 15, mangoes: 4, par: 80, line: "চাক বেশি, ১৫টা। আগে সহজ সংখ্যাগুলো সারো।" },
  { name: "কোণ থেকে", cols: 9, rows: 11, nests: 16, mangoes: 5, par: 85, line: "বাগান চওড়া, ৯ সারি পাশাপাশি। কোণের ঝোপের পাশে ঘর কম, তাই ওখানে হিসাব সহজ।" },
  { name: "পাঁচ আম", cols: 9, rows: 11, nests: 17, mangoes: 5, par: 90, line: "পাঁচটা আম ছড়ানো। যেখানে আম, সেখানে অন্য দিক দিয়ে ঘোরো।" },
  { name: "আমের সারি", cols: 9, rows: 12, nests: 18, mangoes: 6, par: 95, line: "ছয়টা আম, বাগান ১২ সারি লম্বা।" },
  { name: "শেষের হিসাব", cols: 9, rows: 12, nests: 19, mangoes: 7, par: 100, line: "সাতটা আম। শেষ কয়টা ঝোপ মেলাও বাকি চাকের হিসাবে।" },
  { name: "লেভেল ২০", finale: "ফজলির বাগান", cols: 9, rows: 12, nests: 20, mangoes: 8, par: 110, line: "ফজলির মৌসুম, আম ঝরছে সারা বাগানে। ২০টা চাক, একবারই মাফ।" },
  // ৩ চাঁপাইনবাবগঞ্জ: বাঁশের খুঁটি
  { name: "বাঁশের খুঁটি", cols: 7, rows: 10, nests: 10, posts: 2, see: true, par: 50, line: "প্রথম খুঁটি। এর সংখ্যা গোনে শুধু চার পাশ, কোনাকুনি ঝোপ বাদ।" },
  { name: "খুঁটির ০", cols: 8, rows: 10, nests: 12, posts: 3, par: 60, line: "খুঁটিতে ০ মানে চার পাশ নিরাপদ। কোনাকুনি ঝোপে তবু চাক থাকতে পারে।" },
  { name: "তিন খুঁটি", cols: 8, rows: 10, nests: 13, posts: 3, par: 70, line: "খুঁটির ১ আর পাশের সাধারণ ১, দুটো মিলিয়ে দেখো।" },
  { name: "খুঁটির বেড়া", cols: 8, rows: 11, nests: 14, posts: 4, par: 75, line: "চারটা খুঁটি। বাঁশের দাগ দেখে চেনো কোনটা খুঁটি।" },
  { name: "আম ফিরল", cols: 8, rows: 11, nests: 15, posts: 3, mangoes: 2, par: 80, line: "ঝরা আম ফিরে এল খুঁটির সাথে। দুই নিয়ম একসাথে।" },
  { name: "চওড়া বাগান", cols: 9, rows: 11, nests: 16, posts: 4, mangoes: 2, par: 85, line: "বাগান চওড়া, ৯ পাশাপাশি। খুঁটি চারটা।" },
  { name: "ঘন খুঁটি", cols: 9, rows: 11, nests: 17, posts: 5, mangoes: 2, par: 90, line: "পাঁচটা খুঁটি। কোনাকুনি চাক খুঁটি দেখে না, পাশের সংখ্যা দেখে।" },
  { name: "লম্বা বাগান", cols: 9, rows: 12, nests: 18, posts: 5, mangoes: 3, par: 95, line: "১২ সারি লম্বা বাগান, আম আর খুঁটি দুটোই।" },
  { name: "সন্ধ্যা নামছে", cols: 9, rows: 12, nests: 20, posts: 5, mangoes: 3, par: 105, line: "২০টা চাক। সন্ধ্যার আগে সাফ করো।" },
  { name: "লেভেল ৩০", finale: "কানসাটের বড় বাগান", cols: 9, rows: 13, nests: 22, posts: 6, mangoes: 4, par: 115, line: "কানসাটের হাটের পাশের সবচেয়ে বড় বাগান। ২২টা চাক, একবারই মাফ।" },
];

export type Level = Spec & { level: number; world: number; see: boolean; safe: number; forgive: number };

const LEVELS: readonly Level[] = SPECS.map((spec, index) => ({
  ...spec, level: index + 1, world: Math.floor(index / PER_WORLD) + 1, see: Boolean(spec.see), safe: spec.cols * spec.rows - spec.nests,
  forgive: spec.finale ? 1 : 2,
}));

export const isLevel = (level: number) => Number.isInteger(level) && level >= 1 && level <= LEVEL_COUNT;
export const levelOf = (level: number): Level | null => isLevel(level) ? LEVELS[level - 1] : null;
export const worldOf = (level: number) => Math.min(WORLDS.length, Math.max(1, Math.ceil(level / PER_WORLD)));
export const isFinale = (level: number) => isLevel(level) && level % PER_WORLD === 0;
export const levelName = (level: number) => { const info = levelOf(level); return info ? info.finale ?? info.name : ""; };

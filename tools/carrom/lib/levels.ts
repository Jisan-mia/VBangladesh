// The ladder: three worlds of five boards, each hand-placed in board millimetres (0–740, y down; you shoot from y 622).
// Each board teaches one new thing, written in `lesson`. Tests play every board with headless bots and assert their rates.

export type Spot = readonly [number, number];

export type LevelSpec = {
  /** The board's number in links (s=), checked against `c=` so a link can't pass one board off as another. */
  seed: number;
  name: string;
  /** The one new thing, on the start card. */
  lesson: string;
  /** The first line under the board, said the moment play starts. */
  hint: string;
  world: 0 | 1 | 2;
  whites?: readonly Spot[];
  blacks?: readonly Spot[];
  queen?: Spot;
  /** The opening pattern instead of placed coins (nine of each colour and the queen). */
  pattern?: boolean;
  /** Whites needed to clear (default: all of them). */
  need?: number;
  /** The queen must be in and covered to clear. */
  needQueen?: boolean;
  strikes: number;
  /** Strikes for three stars, and for two. */
  par: number;
  two: number;
  /** Where the striker starts (0 left – 1 right), and the point the first strike already aims at. */
  u: number;
  aim?: Spot;
  /** The first strike's aim stays put while you pull: only the power changes (a tap elsewhere frees it). */
  lockAim?: boolean;
  /** A world's last board: who set it, and their record (the par). */
  boss?: { who: string; line: string };
};

export const WORLDS = [
  { name: "পাড়ার ক্লাবঘর", from: 1, line: "মধুরঙা বোর্ড, মাথার ওপর একটা বাল্ব।" },
  { name: "চায়ের দোকান", from: 6, line: "বেঞ্চের পাশে পুরোনো বোর্ড, কেরোসিনের আলো।" },
  { name: "টুর্নামেন্ট", from: 11, line: "হলঘরের বোর্ড, চারপাশে দর্শক।" },
] as const;

export const LEVELS: readonly LevelSpec[] = [
  // ---- পাড়ার ক্লাবঘর ----
  {
    seed: 7101, world: 0, name: "টানো, ছাড়ো", lesson: "বোর্ডে আঙুল রেখে নিচে টানো, তারপর ছেড়ে দাও। নিশানা ঠিক করাই আছে।",
    hint: "নিচে টেনে ছাড়ো, নয়তো মারো চাপো",
    whites: [[266, 443]], strikes: 3, par: 1, two: 2, u: 0.5, aim: [284.7, 474.6], lockAim: true,
  },
  {
    seed: 7102, world: 0, name: "সরাও", lesson: "স্ট্রাইকারটা ডানে সরাও। ওখান থেকে গুটি আর গর্ত এক লাইনে।",
    hint: "স্ট্রাইকার টেনে ডানে নাও",
    whites: [[652, 323]], strikes: 3, par: 1, two: 2, u: 0.15,
  },
  {
    seed: 7103, world: 0, name: "কোণাকুণি", lesson: "সোজা লাইন নেই। গুটির গায়ে কোনা করে লাগাও। তীর দেখায় গুটি কোন দিকে যাবে।",
    hint: "তীরটা গর্তের দিকে ঘোরাও",
    whites: [[370, 200]], strikes: 3, par: 1, two: 2, u: 0.5,
  },
  {
    seed: 7104, world: 0, name: "আস্তে", lesson: "জোরে মারলে স্ট্রাইকারও গর্তে পড়ে, তখন গুটি ফেরত আসে। আস্তে টোকা দাও।",
    hint: "রিং সবুজ থাকতেই ছাড়ো",
    whites: [[76, 114], [664, 114]], strikes: 5, par: 2, two: 3, u: 0.5,
  },
  {
    seed: 7105, world: 0, name: "মন্টু ভাইয়ের বোর্ড", lesson: "পাঁচটা গুটি, নয় চাল। এ পর্যন্ত যা শিখেছ, সব লাগবে।",
    hint: "মন্টু ভাই পাঁচ চালে পারে",
    whites: [[197, 323], [543, 323], [370, 210], [110, 160], [600, 470]], strikes: 9, par: 5, two: 7, u: 0.5,
    boss: { who: "মন্টু ভাই", line: "ক্লাবের চ্যাম্পিয়ন। এই বোর্ড সে পাঁচ চালে সাফ করে।" },
  },
  // ---- চায়ের দোকান ----
  {
    seed: 7106, world: 1, name: "কালো গুটি", lesson: "কালোগুলো অন্যের। একটা ঢুকলে এক চাল কাটা যায়।",
    hint: "কালোর গায়ে লাগিয়ো না",
    whites: [[197, 323], [543, 300], [370, 170]], blacks: [[250, 280], [470, 250], [300, 140]],
    strikes: 6, par: 3, two: 4, u: 0.5,
  },
  {
    seed: 7107, world: 1, name: "কুশন", lesson: "সোজা পথ বন্ধ। পাশের কুশনে লাগিয়ে ঘুরিয়ে মারো।",
    hint: "বাঁ দিকের কুশনে লাগাও",
    whites: [[90, 260]], blacks: [[150, 470], [205, 450], [260, 430], [315, 410], [370, 390]], strikes: 4, par: 1, two: 2, u: 0.75,
  },
  {
    seed: 7108, world: 1, name: "জোড়া", lesson: "দুটো গুটি গায়ে গায়ে, গর্তের দিকে মুখ করে। পেছনেরটা মারলে সামনেরটা ঢোকে।",
    hint: "পেছনের গুটিতে সোজা মারো",
    whites: [[640, 108], [617, 131], [160, 380]], blacks: [[500, 220], [610, 330]], strikes: 5, par: 2, two: 3, u: 0.5,
  },
  {
    seed: 7109, world: 1, name: "কুইন", lesson: "লাল কুইন ঢুকিয়ে একই চালে বা পরের চালে একটা সাদা ঢোকাও। এটাই কভার।",
    hint: "আগে কুইন, তারপর একটা সাদা",
    whites: [[197, 323], [543, 323]], queen: [370, 250], needQueen: true, strikes: 7, par: 3, two: 5, u: 0.5,
  },
  {
    seed: 7110, world: 1, name: "মতিন চাচার বোর্ড", lesson: "কুইন, সাদা আর কালো একসাথে। শেষ সাদার আগে কুইনের কভার লাগবে।",
    hint: "মতিন চাচা ছয় চালে পারে",
    whites: [[180, 330], [560, 330], [370, 150], [120, 200]], blacks: [[260, 250], [480, 250], [300, 400], [440, 400]], queen: [370, 270], needQueen: true,
    strikes: 10, par: 6, two: 8, u: 0.5,
    boss: { who: "মতিন চাচা", line: "দোকানের মালিক। চা ঠান্ডা হওয়ার আগে এটা ছয় চালে সারে।" },
  },
  // ---- টুর্নামেন্ট ----
  {
    seed: 7111, world: 2, name: "ভাঙা", lesson: "পুরো সাজানো বোর্ড। জোরে মেরে ভাঙো, তারপর তিনটা সাদা ঢোকাও।",
    hint: "প্রথম টোকা পুরো জোরে",
    pattern: true, need: 3, strikes: 8, par: 4, two: 6, u: 0.5, aim: [370, 370],
  },
  {
    seed: 7112, world: 2, name: "ভিড়", lesson: "গুটিগুলো জট পাকিয়ে আছে। আগে ছড়াও, তারপর ঢোকাও।",
    hint: "জটের কোনায় লাগাও",
    whites: [[340, 300], [373, 300], [356, 271], [389, 271], [323, 271]], blacks: [[406, 300], [306, 300], [340, 242], [373, 242]],
    strikes: 9, par: 6, two: 7, u: 0.5,
  },
  {
    seed: 7113, world: 2, name: "নিচের গর্ত", lesson: "তোমার পাশের গুটিও ঢোকে। পাতলা করে ছুঁয়ে নিচের গর্তে পাঠাও।",
    hint: "গুটির ওপরের কোনায় ছোঁয়াও",
    whites: [[80, 640], [660, 640], [370, 200]], strikes: 6, par: 3, two: 4, u: 0.15,
  },
  {
    seed: 7114, world: 2, name: "পুরো বোর্ড", lesson: "সাজানো বোর্ড, এবার কুইনসহ: তিনটা সাদা আর কুইনের কভার।",
    hint: "ভাঙো, তারপর কুইন",
    pattern: true, need: 3, needQueen: true, strikes: 15, par: 7, two: 10, u: 0.5, aim: [370, 370],
  },
  {
    seed: 7115, world: 2, name: "টুর্নামেন্টের ফাইনাল", lesson: "নয়টা সাদা আর কুইন, পুরো বোর্ড সাফ।",
    hint: "শিলা আপা ষোলো চালে পারে",
    pattern: true, needQueen: true, strikes: 24, par: 16, two: 20, u: 0.5, aim: [370, 370],
    boss: { who: "শিলা আপা", line: "গত বছরের চ্যাম্পিয়ন। ফাইনালে ষোলো চালে বোর্ড সাফ করেছিল।" },
  },
];

export const LEVEL_COUNT = LEVELS.length;
export const levelSpec = (level: number) => LEVELS[Math.min(LEVEL_COUNT, Math.max(1, level)) - 1];
export const worldOf = (level: number) => levelSpec(level).world;
export const isFinale = (level: number) => Boolean(LEVELS[level - 1]?.boss);

/**
 * The ten boards from before the ladder: a দশ চাল scatter seed each, with points for 1, 2 and 3 stars.
 * Old board links (`l=`) still open these, so a friend's score is compared on the very board it was made on.
 */
export const OLD_BOARDS = [
  { seed: 733103, name: "পাড়ার ক্লাবঘর", one: 1, two: 4, three: 6 },
  { seed: 256765, name: "চায়ের দোকান", one: 2, two: 4, three: 7 },
  { seed: 209458, name: "ছাদের চিলেকোঠা", one: 3, two: 5, three: 7 },
  { seed: 199343, name: "হোস্টেলের রুম", one: 3, two: 5, three: 8 },
  { seed: 361494, name: "নানাবাড়ির বারান্দা", one: 3, two: 6, three: 8 },
  { seed: 675681, name: "স্কুলের কমনরুম", one: 4, two: 6, three: 9 },
  { seed: 875024, name: "মেসবাড়ি", one: 4, two: 7, three: 9 },
  { seed: 466223, name: "লঞ্চের কেবিন", one: 4, two: 7, three: 10 },
  { seed: 837832, name: "পাড়ার টুর্নামেন্ট", one: 5, two: 8, three: 10 },
  { seed: 513530, name: "টুর্নামেন্টের ফাইনাল", one: 5, two: 8, three: 11 },
] as const;

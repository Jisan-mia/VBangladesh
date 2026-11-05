// The 24 levels as data: three tables (worlds) of eight boards. Each level adds exactly one thing to the one before it;
// the eighth is the world's named finale. `three`/`two` are the most moves for ★★★ and ★★ (any clear is ★); the bots in
// tests/bot.ts set them and tests/levels.test.ts asserts the rates, so change a row only together with that test.

/** One board: which table, how many pairs, and what is different about it. */
export type Spec = {
  world: 0 | 1 | 2;
  pairs: number;
  /** Look-alike twin pairs on the board (each is two pictures, so four cards). */
  alike: number;
  /** A pair lies face up until your first tap. */
  demo: boolean;
  /** Seconds all the cards show face up before play (0: none). */
  peek: number;
  /** The birds fly after every Nth miss (0: never). */
  every: number;
  /** Swaps of two cards each time the birds fly. */
  flyers: number;
  three: number;
  two: number;
};

const L = (
  world: 0 | 1 | 2, pairs: number, three: number, two: number,
  more: Partial<Pick<Spec, "alike" | "demo" | "peek" | "every" | "flyers">> = {},
): Spec => ({ world, pairs, alike: 0, demo: false, peek: 0, every: 0, flyers: 0, three, two, ...more });

/** ১ বৈশাখী মেলা: the rules. ২ মধুমাসের হাট: এক ঝলক. ৩ বিলের পাখি: উড়ে বসা. */
export const LEVELS: readonly Spec[] = [
  L(0, 3, 5, 7, { demo: true }),
  L(0, 4, 7, 9),
  L(0, 6, 10, 12),
  L(0, 6, 10, 13, { alike: 1 }),
  L(0, 8, 13, 18, { alike: 1 }),
  L(0, 8, 13, 18, { alike: 2 }),
  L(0, 10, 17, 27, { alike: 2 }),
  L(0, 12, 22, 34, { alike: 2 }),

  L(1, 6, 7, 9, { peek: 3 }),
  L(1, 8, 10, 15, { peek: 3 }),
  L(1, 8, 10, 15, { peek: 2 }),
  L(1, 8, 11, 16, { peek: 2, alike: 1 }),
  L(1, 10, 15, 23, { peek: 2, alike: 1 }),
  L(1, 10, 15, 24, { peek: 2, alike: 2 }),
  L(1, 10, 16, 23, { peek: 1.5, alike: 2 }),
  L(1, 12, 20, 31, { peek: 1.5, alike: 2 }),

  L(2, 6, 10, 12, { every: 3, flyers: 1 }),
  L(2, 8, 13, 17, { every: 3, flyers: 1 }),
  L(2, 8, 14, 18, { every: 2, flyers: 1 }),
  L(2, 8, 14, 18, { every: 2, flyers: 1, alike: 1 }),
  L(2, 10, 18, 25, { every: 2, flyers: 1, alike: 1 }),
  L(2, 10, 18, 25, { every: 2, flyers: 1, alike: 2 }),
  L(2, 10, 19, 26, { every: 2, flyers: 2, alike: 2 }),
  L(2, 12, 23, 35, { every: 2, flyers: 2, alike: 2 }),
];

export const LEVEL_COUNT = LEVELS.length;
export const PER_WORLD = 8;
export const isLevel = (level: number) => Number.isInteger(level) && level >= 1 && level <= LEVEL_COUNT;
export const levelAt = (level: number): Spec => LEVELS[level - 1];
export const worldOf = (level: number) => Math.floor((level - 1) / PER_WORLD);
export const worldStart = (world: number) => world * PER_WORLD + 1;
export const isFinale = (level: number) => level % PER_WORLD === 0;

export const WORLDS = [
  { name: "বৈশাখী মেলা", short: "মেলা", of: "মেলার", rule: "দুটো করে খোলো। একই খেলনা হলে থেকে যাবে।", finale: "মেলার শেষ দোকান", scene: "চৈত্রের শেষ বিকেল। দোকানির সব খেলনা উল্টে রাখা।" },
  { name: "মধুমাসের হাট", short: "হাট", of: "হাটের", rule: "শুরুতে সব কার্ড কয়েক সেকেন্ড খোলা থাকে। দেখে নাও।", finale: "মধুমাসের ভরা হাট", scene: "জ্যৈষ্ঠের দুপুর। ডালা ভরা ফল, সব ঢাকা।" },
  { name: "বিলের পাখি", short: "বিল", of: "বিলের", rule: "ভুল হলে মাঝে মাঝে দুটো পাখি উড়ে জায়গা বদলায়।", finale: "কালবৈশাখীর আগে", scene: "আকাশ কালো হয়ে আসছে। পাখিরা ঘুরে ঘুরে বসছে।" },
] as const;

/** The finale's name (levels 8, 16, 24), else "". */
export const finaleName = (level: number) => isFinale(level) ? WORLDS[worldOf(level)].finale : "";

/** The two-player boards: toys only, no stars. */
export const DUO_SIZES = [12, 16] as const;
export type DuoSize = (typeof DUO_SIZES)[number];
export const duoSpec = (cards: DuoSize): Spec => L(0, cards / 2, 0, 0);

export const cardsOf = (spec: Spec) => spec.pairs * 2;
/** Columns and rows of a board: six cards sit 3×2, bigger ones four across. */
export const colsOf = (cards: number) => cards <= 6 ? 3 : 4;
export const rowsOfCards = (cards: number) => Math.ceil(cards / colsOf(cards));

/** The one new thing a level adds over the one before it, as short chips with a before → after: the start card shows these. */
export function changes(level: number): string[] {
  const now = levelAt(level), before = level % PER_WORLD === 1 ? null : levelAt(level - 1);
  const out: string[] = [];
  const bn = (n: number) => new Intl.NumberFormat("bn-BD", { useGrouping: false }).format(n);
  if (before === null) {
    // The first level of a table: say its twist, and the size next to the last board of the table before.
    if (level === 1) return [`জোড়া ${bn(now.pairs)}`, "একটা জোড়া খোলা"];
    const w = WORLDS[now.world];
    return [now.peek ? `এক ঝলক ${bn(now.peek)} সে.` : `উড়ে বসা, প্রতি ${bn(now.every)} ভুলে`, `জোড়া ${bn(now.pairs)}`, w.short];
  }
  if (now.pairs !== before.pairs) out.push(`জোড়া ${bn(before.pairs)} → ${bn(now.pairs)}`);
  if (now.alike !== before.alike) out.push(`প্রায় একই ছবি ${bn(before.alike)} → ${bn(now.alike)} জোড়া`);
  if (now.peek !== before.peek) out.push(`এক ঝলক ${bn(before.peek)} → ${bn(now.peek)} সে.`);
  if (now.every !== before.every) out.push(`পাখি ওড়ে প্রতি ${bn(before.every)} → ${bn(now.every)} ভুলে`);
  if (now.flyers !== before.flyers) out.push(`একবারে ${bn(before.flyers * 2)} → ${bn(now.flyers * 2)}টা পাখি`);
  return out;
}

/** What is new on a level, in one plain line. */
export function lesson(level: number): string {
  const now = levelAt(level), before = level % PER_WORLD === 1 ? null : levelAt(level - 1);
  if (level === 1) return "একটা জোড়া খোলা আছে। দুটো করে কার্ড খোলো, একই ছবি হলে থেকে যাবে।";
  if (isFinale(level)) return `${WORLDS[now.world].scene} ${new Intl.NumberFormat("bn-BD", { useGrouping: false }).format(now.pairs)} জোড়া।`;
  if (before === null) return WORLDS[now.world].rule;
  if (now.alike > before.alike) return now.alike === 1 ? "দুটো ছবি প্রায় একই রকম। রং আর নকশা দেখে চেনো।" : "প্রায় একই রকম ছবি এবার দুই জোড়া।";
  if (now.peek !== before.peek) return "শুরুর ঝলক আরও ছোট। চোখ খোলা রাখো।";
  if (now.every !== before.every) return "পাখি আরও তাড়াতাড়ি জায়গা বদলায়, প্রতি দুই ভুলে।";
  if (now.flyers !== before.flyers) return "এবার চারটে পাখি একসঙ্গে ওড়ে।";
  if (now.pairs !== before.pairs) return "বোর্ড বড় হলো। কোনটা কোথায়, মনে রাখো।";
  return "";
}

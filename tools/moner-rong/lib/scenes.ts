// The scenes and the rules of মনের রং. Pure, so the tests can play it. No score: a feeling that fits is never "right", only "fits".
import { FEELINGS, ORDER, type Feeling } from "./faces";

const digits = new Intl.NumberFormat("bn-BD", { useGrouping: false });
export const bn = (value: number) => digits.format(value);

export type Prop =
  | "jama" | "brishti" | "tiffin" | "ghuri" | "khata" | "naru" | "andhar" | "kukur" | "baksho" | "cycle"
  | "board" | "chhora" | "baj" | "bench" | "carrom" | "pani" | "dolna" | "nagordola" | "suitcase" | "cake";
export type Icon = "hug" | "tell" | "breathe" | "count" | "share" | "make" | "hand" | "thanks" | "sit" | "play" | "light" | "walk" | "song";
export type Hair = "short" | "long" | "tupi";
export type Kind = { icon: Icon; text: string; after: string };
export type Scene = {
  id: string; prop: Prop;
  /** The child whose face we read, and the possessive the sentences need (রাফি / রাফির, মং / মং-এর). */
  who: string; whose: string; hair: Hair; glasses?: boolean;
  text: string;
  /** Every feeling that fits; any of them is fine. One to three. */
  feels: Feeling[];
  /** Shown when a face doesn't fit: one fact from the scene, then "আরেকবার ভাবো". */
  clue: string;
  /** "কী করলে ভালো লাগবে?" unless the scene is a happy one or about someone else. */
  q?: string;
  kind: [Kind, Kind];
  /** The one question for the grown-up to ask. */
  ask: string;
};

const HAPPY = "খুশিটা কী করবে?";

export const SCENES: readonly Scene[] = [
  { id: "eid", prop: "jama", who: "নুসরাত", whose: "নুসরাতের", hair: "long", text: "ঈদের আগের রাতে নুসরাতের নতুন জামা এল।", feels: ["khushi"], clue: "কাল ঈদ, হাতে নতুন জামা।", q: HAPPY,
    kind: [{ icon: "hug", text: "আম্মুকে জড়িয়ে ধরবে", after: "আম্মুও হেসে ফেললেন।" }, { icon: "tell", text: "ছোট ভাইকে জামাটা দেখাবে", after: "ভাইয়ের চোখ বড় বড় হয়ে গেল।" }],
    ask: "নতুন জামা পেয়ে তোমার কেমন লেগেছিল?" },
  { id: "brishti", prop: "brishti", who: "জয়", whose: "জয়ের", hair: "short", text: "ঝুম বৃষ্টি নামল। জয়ের মাঠে খেলা বন্ধ।", feels: ["mon-kharap"], clue: "আজ আর বল খেলা হবে না।",
    kind: [{ icon: "make", text: "আপুর সাথে কাগজের নৌকা বানাবে", after: "উঠানের পানিতে নৌকা ভাসল।" }, { icon: "tell", text: "আব্বুকে বলবে, ‘আমার মন খারাপ।’", after: "আব্বু পাশে বসে বৃষ্টির গল্প বললেন।" }],
    ask: "বৃষ্টিতে খেলা বন্ধ হলে তুমি কী করো?" },
  { id: "tiffin", prop: "tiffin", who: "মং", whose: "মং-এর", hair: "short", text: "মং আজ টিফিন আনেনি। অর্পিতা ওকে অর্ধেক রুটি দিল।", feels: ["khushi"], clue: "খিদের সময় কেউ রুটি দিলে কেমন লাগে?", q: HAPPY,
    kind: [{ icon: "thanks", text: "অর্পিতাকে ধন্যবাদ বলবে", after: "অর্পিতা হাসল।" }, { icon: "share", text: "কাল নিজের টিফিন ভাগ দেবে", after: "পরদিন দুজনে মিলে পিঠা খেল।" }],
    ask: "কারও সাথে কখনো টিফিন ভাগ করে খেয়েছ?" },

  { id: "ghuri", prop: "ghuri", who: "রাফি", whose: "রাফির", hair: "short", text: "রাফির ঘুড়িটা কেটে উড়ে গেল।", feels: ["mon-kharap", "rag"], clue: "এত যত্নের ঘুড়িটা আর নেই।",
    kind: [{ icon: "make", text: "আব্বুর সাথে নতুন ঘুড়ি বানাবে", after: "নতুন ঘুড়ির লেজটা আরও লম্বা হলো।" }, { icon: "breathe", text: "বসে তিনবার লম্বা শ্বাস নেবে", after: "বুকটা একটু হালকা লাগল।" }],
    ask: "তোমার প্রিয় কোনো জিনিস কখনো হারিয়েছে?" },
  { id: "khata", prop: "khata", who: "প্রিয়াংকা", whose: "প্রিয়াংকার", hair: "long", text: "ছোট ভাই প্রিয়াংকার আঁকার খাতাটা ছিঁড়ে ফেলল।", feels: ["rag", "mon-kharap"], clue: "কত যত্নে আঁকা ছবি, এখন ছেঁড়া।",
    kind: [{ icon: "count", text: "দশ পর্যন্ত গুনে মাকে বলবে", after: "মা পাতাটা টেপ দিয়ে জুড়ে দিলেন।" }, { icon: "tell", text: "ভাইকে বলবে, ‘এটা আমার খাতা।’", after: "ভাই মাথা নিচু করে বলল, সরি।" }],
    ask: "কেউ তোমার জিনিস নষ্ট করলে তুমি কী করো?" },
  { id: "nanu", prop: "naru", who: "অর্পিতা", whose: "অর্পিতার", hair: "long", text: "অর্পিতাদের বাসায় নানু এলেন, ব্যাগে নারকেলের নাড়ু।", feels: ["khushi"], clue: "কত দিন পরে নানুকে দেখা।", q: HAPPY,
    kind: [{ icon: "sit", text: "নানুর পাশে বসে গল্প শুনবে", after: "নানু আম্মুর ছোটবেলার গল্প বললেন।" }, { icon: "hand", text: "নানুকে এক গ্লাস পানি এনে দেবে", after: "নানু মাথায় হাত বুলিয়ে দিলেন।" }],
    ask: "নানু-দাদু বেড়াতে এলে তুমি কী করো?" },

  { id: "andhar", prop: "andhar", who: "নুসরাত", whose: "নুসরাতের", hair: "long", text: "রাতে হঠাৎ কারেন্ট গেল। নুসরাতের ঘর অন্ধকার।", feels: ["bhoy"], clue: "চারপাশে কিছুই দেখা যাচ্ছে না।",
    kind: [{ icon: "hand", text: "আম্মুর হাত ধরবে", after: "আম্মুর হাত ধরে ভয়টা কমে এল।" }, { icon: "light", text: "টর্চ জ্বেলে দেয়ালে হাতের ছায়া বানাবে", after: "দেয়ালে একটা পাখি উড়ল।" }],
    ask: "অন্ধকারে তোমার কেমন লাগে?" },
  { id: "kukur", prop: "kukur", who: "জয়", whose: "জয়ের", hair: "short", glasses: true, text: "স্কুলের পথে জয়কে দেখে একটা কুকুর ঘেউ ঘেউ করল।", feels: ["bhoy"], clue: "হঠাৎ জোরে ঘেউ ঘেউ।",
    kind: [{ icon: "hand", text: "আব্বুর হাত ধরে দাঁড়াবে", after: "কুকুরটা লেজ নেড়ে চলে গেল।" }, { icon: "walk", text: "না দৌড়ে আস্তে হেঁটে যাবে", after: "কুকুরটা আর পিছু নিল না।" }],
    ask: "কোন জিনিসে তোমার ভয় লাগে?" },
  { id: "bondhu", prop: "baksho", who: "রাফি", whose: "রাফির", hair: "short", text: "রাফির বন্ধু সামি অন্য শহরে চলে যাচ্ছে।", feels: ["mon-kharap"], clue: "কাল থেকে মাঠে সামি থাকবে না।",
    kind: [{ icon: "make", text: "সামিকে একটা ছবি এঁকে দেবে", after: "সামি ছবিটা ব্যাগে রেখে দিল।" }, { icon: "tell", text: "আম্মুর ফোনে মাঝে মাঝে কথা বলবে", after: "সামি বলল, পৌঁছেই ফোন দেবে।" }],
    ask: "কোনো বন্ধুর কথা কখনো খুব মনে পড়েছে?" },

  { id: "cycle", prop: "cycle", who: "অর্পিতা", whose: "অর্পিতার", hair: "long", text: "জন্মদিনে মামা অর্পিতার জন্য চুপিচুপি সাইকেল আনলেন।", feels: ["obak", "khushi"], clue: "কেউ জানত না, হঠাৎ সাইকেল।", q: HAPPY,
    kind: [{ icon: "thanks", text: "মামাকে ধন্যবাদ বলবে", after: "মামা বললেন, চলো, ছাদে চালাই।" }, { icon: "share", text: "ছোট বোনকেও একটু চালাতে দেবে", after: "বোন হাসতে হাসতে বেল বাজাল।" }],
    ask: "কেউ কখনো তোমাকে চমকে দিয়েছে?" },
  { id: "class", prop: "board", who: "মং", whose: "মং-এর", hair: "short", text: "ক্লাসে মং নতুন। স্যার বললেন, সবার সামনে নাম বলো।", feels: ["lojja", "bhoy"], clue: "এত নতুন মুখ, সবাই ওর দিকে তাকিয়ে।",
    kind: [{ icon: "breathe", text: "একটা লম্বা শ্বাস নিয়ে নাম বলবে", after: "নাম বলা হলো, সবাই হাততালি দিল।" }, { icon: "tell", text: "স্যারকে বলবে, ‘একটু পরে বলি?’", after: "স্যার বললেন, ঠিক আছে, পরে বলো।" }],
    ask: "নতুন জায়গায় গিয়ে তোমার কেমন লেগেছিল?" },
  { id: "chhora", prop: "chhora", who: "নুসরাত", whose: "নুসরাতের", hair: "long", text: "সবার সামনে ছড়া বলতে গিয়ে নুসরাত মাঝখানে ভুলে গেল।", feels: ["lojja", "bhoy"], clue: "সবার সামনে কথা আটকে গেল।",
    kind: [{ icon: "breathe", text: "শ্বাস নিয়ে আবার শুরু থেকে বলবে", after: "এবার পুরো ছড়াটা মনে পড়ল।" }, { icon: "sit", text: "আম্মুর পাশে গিয়ে বসবে", after: "আম্মু কানে কানে প্রথম লাইনটা বললেন।" }],
    ask: "কখনো কিছু ভুলে গিয়ে লজ্জা লেগেছে?" },

  { id: "baj", prop: "baj", who: "জয়", whose: "জয়ের", hair: "short", glasses: true, text: "ঝড়ের রাতে খুব জোরে বাজ পড়ল। জয় চমকে উঠল।", feels: ["bhoy", "obak"], clue: "কড়কড় করে বাজ, জানালা কাঁপছে।",
    kind: [{ icon: "sit", text: "আম্মুর কাছে গিয়ে বসবে", after: "আম্মুর কোলে বসে বৃষ্টির শব্দ শুনল।" }, { icon: "count", text: "কানে হাত দিয়ে দশ পর্যন্ত গুনবে", after: "দশ গোনার আগেই বাজ থেমে গেল।" }],
    ask: "ঝড়ের রাতে তোমার কেমন লাগে?" },
  { id: "eka", prop: "bench", who: "ঝুমা", whose: "ঝুমার", hair: "long", glasses: true, text: "টিফিনে ঝুমা একা বসে আছে। কেউ ওকে খেলায় ডাকেনি।", feels: ["mon-kharap", "lojja"], clue: "সবাই খেলছে, শুধু ঝুমা একা।", q: "তুমি পাশে থাকলে কী করবে?",
    kind: [{ icon: "play", text: "ঝুমাকে খেলায় ডাকবে", after: "ঝুমা দৌড়ে এসে দলে ঢুকল।" }, { icon: "sit", text: "ঝুমার পাশে বসে টিফিন খাবে", after: "দুজনে মিলে গল্প জমে উঠল।" }],
    ask: "স্কুলে কাউকে একা দেখলে তুমি কী করো?" },
  { id: "carrom", prop: "carrom", who: "রাফি", whose: "রাফির", hair: "short", text: "ক্যারমের শেষ গুটিটা ফেলে রাফি জিতে গেল।", feels: ["khushi"], clue: "শেষ গুটি, আর খেলায় জিত।", q: HAPPY,
    kind: [{ icon: "hand", text: "সবার সাথে হাত মেলাবে", after: "বন্ধুরা বলল, আরেক দান হবে।" }, { icon: "play", text: "হেরে যাওয়া বন্ধুকে আবার খেলতে ডাকবে", after: "এবারের খেলা আরও জমে উঠল।" }],
    ask: "খেলায় জিতলে তুমি কী করো?" },
  { id: "sangrai", prop: "pani", who: "মং", whose: "মং-এর", hair: "short", text: "সাংগ্রাইয়ের দিনে বন্ধুরা মং-এর গায়ে পানি ছিটিয়ে দিল।", feels: ["khushi", "obak"], clue: "সাংগ্রাইয়ে পানি ছিটানো মানে নতুন বছরের শুভেচ্ছা।", q: HAPPY,
    kind: [{ icon: "play", text: "হেসে বন্ধুদেরও পানি দেবে", after: "সবাই ভিজে একাকার।" }, { icon: "thanks", text: "বন্ধুদের নতুন বছরের শুভেচ্ছা দেবে", after: "বন্ধুরাও বলল, শুভ নববর্ষ।" }],
    ask: "কোন উৎসবে তোমার সবচেয়ে মজা লাগে?" },

  { id: "bon", prop: "dolna", who: "জয়", whose: "জয়ের", hair: "short", glasses: true, text: "জয়ের ছোট বোন হয়েছে। সবাই এখন বোনকে নিয়েই ব্যস্ত।", feels: ["khushi", "mon-kharap"], clue: "নতুন বোন এসেছে, কিন্তু কেউ জয়ের দিকে তাকাচ্ছে না।",
    kind: [{ icon: "tell", text: "আম্মুকে বলবে, ‘আমার সাথেও একটু বসো।’", after: "আম্মু জয়কে কাছে টেনে নিলেন।" }, { icon: "song", text: "বোনকে আস্তে একটা গান শোনাবে", after: "বোনটা জয়ের আঙুল ধরে ফেলল।" }],
    ask: "ছোট ভাই বা বোন আসার পর তোমার কেমন লেগেছিল?" },
  { id: "nagordola", prop: "nagordola", who: "প্রিয়াংকা", whose: "প্রিয়াংকার", hair: "long", text: "পূজার মেলায় প্রিয়াংকা প্রথমবার নাগরদোলায় উঠল।", feels: ["khushi", "bhoy"], clue: "অনেক উঁচুতে উঠছে, নিচে মেলাটা ছোট দেখাচ্ছে।",
    kind: [{ icon: "hand", text: "বাবার হাত শক্ত করে ধরবে", after: "বাবা বললেন, দেখো, আকাশ কত কাছে।" }, { icon: "breathe", text: "লম্বা শ্বাস নিয়ে চারপাশটা দেখবে", after: "দূরে নদী দেখা গেল, ছোট্ট নৌকাও।" }],
    ask: "কখনো ভয় আর মজা একসাথে লেগেছে?" },
  { id: "chacha", prop: "suitcase", who: "নুসরাত", whose: "নুসরাতের", hair: "long", text: "অনেক দিন পর ছোট চাচা বিদেশ থেকে এলেন। নুসরাত প্রথমে চিনতেই পারল না।", feels: ["obak", "lojja"], clue: "চেনা মানুষ, তবু অচেনা লাগছে।",
    kind: [{ icon: "hand", text: "হাত নেড়ে একটু হাসবে", after: "চাচা বললেন, এত বড় হয়ে গেছ!" }, { icon: "sit", text: "আম্মুর পাশে থেকে আস্তে কথা বলবে", after: "একটু পরেই চাচার সাথে লুডু জমে গেল।" }],
    ask: "কাউকে অনেক দিন পর দেখে কখনো লজ্জা লেগেছে?" },
  { id: "cake", prop: "cake", who: "জোসেফ", whose: "জোসেফের", hair: "short", text: "বড়দিনের কেক থেকে জোসেফের টুকরোটা বিড়াল খেয়ে ফেলল।", feels: ["rag", "obak", "mon-kharap"], clue: "প্লেট খালি, বিড়ালের মুখে কেক।",
    kind: [{ icon: "tell", text: "আম্মুকে গিয়ে বলবে", after: "আম্মু আরেকটা ছোট টুকরো কেটে দিলেন।" }, { icon: "share", text: "আপুর টুকরোটা ভাগ করে খাবে", after: "অর্ধেক অর্ধেক, তবু মিষ্টি।" }],
    ask: "কখনো এমন রাগ হয়েছে যে পরে হাসি পেয়েছে?" },
];

/** Six sets, each a short round. The faces on offer grow from two to six; the last set is all two-feeling scenes. */
export const SETS: readonly { title: string; pool: readonly Feeling[]; scenes: readonly string[]; mirror: Feeling }[] = [
  { title: "খুশি আর মন খারাপ", pool: ["khushi", "mon-kharap"], scenes: ["eid", "brishti", "tiffin"], mirror: "khushi" },
  { title: "রাগ", pool: ["khushi", "mon-kharap", "rag"], scenes: ["ghuri", "khata", "nanu"], mirror: "rag" },
  { title: "ভয়", pool: ["khushi", "mon-kharap", "rag", "bhoy"], scenes: ["andhar", "kukur", "bondhu"], mirror: "bhoy" },
  { title: "অবাক আর লজ্জা", pool: ["khushi", "bhoy", "obak", "lojja"], scenes: ["cycle", "class", "chhora"], mirror: "obak" },
  { title: "ছয়টা মুখ", pool: ORDER, scenes: ["baj", "eka", "carrom", "sangrai"], mirror: "lojja" },
  { title: "একসাথে দুটো মন", pool: ORDER, scenes: ["bon", "nagordola", "chacha", "cake"], mirror: "mon-kharap" },
];
export const SET_COUNT = SETS.length;
export const setOf = (set: number) => SETS[Math.min(Math.max(set, 1), SET_COUNT) - 1];
export const sceneById = (id: string) => SCENES.find(scene => scene.id === id)!;
export const scenesOf = (set: number) => setOf(set).scenes.map(sceneById);

/** The faces offered for a scene, always in the same order. Eased: only the faces that fit plus one other. */
export function facesFor(scene: Scene, set: number, eased: boolean): Feeling[] {
  const pool = setOf(set).pool;
  if (!eased) return [...pool];
  const other = pool.find(feeling => !scene.feels.includes(feeling));
  return pool.filter(feeling => scene.feels.includes(feeling) || feeling === other);
}

export type Step = "name" | "kind" | "after";
export type Round = {
  set: number; index: number; faces: Feeling[];
  step: Step; picked: Feeling | null; tries: number; kind: number | null;
  /** The quiet ease: three misses in a row offer fewer faces from the next scene; five first-try fits in a row lift it. */
  missRun: number; rightRun: number; eased: boolean;
  named: Feeling[];
};

export function newRound(set: number, eased = false, rightRun = 0): Round {
  return { set, index: 0, faces: facesFor(scenesOf(set)[0], set, eased), step: "name", picked: null, tries: 0, kind: null, missRun: 0, rightRun, eased, named: [] };
}

export const sceneOf = (round: Round) => scenesOf(round.set)[round.index];
export const isLast = (round: Round) => round.index === scenesOf(round.set).length - 1;
/** After two tries the faces that fit glow. */
export const glows = (round: Round) => round.step === "name" && round.tries >= 2;

export type NameResult = { round: Round; outcome: "fits" | "again" | "ignore" };
export function nameFeeling(round: Round, feeling: Feeling): NameResult {
  if (round.step !== "name" || !round.faces.includes(feeling)) return { round, outcome: "ignore" };
  const scene = sceneOf(round);
  if (!scene.feels.includes(feeling)) {
    const missRun = round.missRun + 1;
    return { round: { ...round, tries: round.tries + 1, missRun, rightRun: 0, eased: round.eased || missRun >= 3 }, outcome: "again" };
  }
  const rightRun = round.tries === 0 ? round.rightRun + 1 : 0;
  return {
    round: { ...round, step: "kind", picked: feeling, missRun: 0, rightRun, named: round.named.includes(feeling) ? round.named : [...round.named, feeling] },
    outcome: "fits",
  };
}

export function chooseKind(round: Round, choice: number): Round {
  if (round.step !== "kind" || (choice !== 0 && choice !== 1)) return round;
  return { ...round, step: "after", kind: choice };
}

/** The next scene, or null when the round is over. The ease changes only here, between scenes, never under a finger. */
export function nextScene(round: Round): Round | null {
  if (round.step !== "after" || isLast(round)) return null;
  const eased = round.eased && round.rightRun < 5;
  const index = round.index + 1;
  return { ...round, index, faces: facesFor(scenesOf(round.set)[index], round.set, eased), step: "name", picked: null, tries: 0, kind: null, eased, rightRun: eased ? round.rightRun : 0 };
}

/** Stars mark practice only: one more each time a set is played through, up to three. Never how many fitted. */
export const practised = (before: number) => Math.min(3, Math.max(0, before) + 1);

export const question = (scene: Scene) => `${scene.whose} এখন কেমন লাগছে?`;
export const kindQuestion = (scene: Scene) => scene.q ?? "কী করলে ভালো লাগবে?";
export const againLine = (scene: Scene) => `${scene.clue} আরেকবার ভাবো।`;
export const sayLine = (scene: Scene, feeling: Feeling) => FEELINGS[feeling].say(scene.who, scene.whose);

/** "রাগ আর মন খারাপ, দুটোই হতে পারে।" when more than one feeling fits; empty otherwise. */
export function alsoLine(scene: Scene, picked: Feeling) {
  if (scene.feels.length < 2) return "";
  const words = [picked, ...scene.feels.filter(feeling => feeling !== picked)].map(feeling => FEELINGS[feeling].word);
  return scene.feels.length === 2 ? `${words[0]} আর ${words[1]}, দুটোই হতে পারে।` : `${words.join(", ")}, তিনটাই হতে পারে।`;
}

export const mirrorLine = (set: number) => `এবার আয়নায় একটা ${FEELINGS[setOf(set).mirror].mirror} বানাও তো।`;
export const endLine = (round: Round) => `${bn(round.index + 1)}টা ছবিতে মন চিনলে: ${listWords(round.named)}।`;

export function listWords(feelings: readonly Feeling[]) {
  const words = ORDER.filter(feeling => feelings.includes(feeling)).map(feeling => FEELINGS[feeling].word);
  return words.length < 2 ? words.join("") : `${words.slice(0, -1).join(", ")} আর ${words.at(-1)}`;
}

export type Today = { scenes: number; feelings: Feeling[] };
export const addToday = (today: Today, round: Round): Today =>
  ({ scenes: today.scenes + round.index + 1, feelings: ORDER.filter(feeling => today.feelings.includes(feeling) || round.named.includes(feeling)) });
export const cardHead = (today: Today) => `আজ ${bn(today.scenes)}টা ছবিতে`;
export const cardTail = "মনের রং চিনলাম";
export const cardSub = "প্রতিটায় ভাবলাম, কী করলে ভালো লাগে";

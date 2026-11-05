// The twenty-one "কী হবে?" experiments: a setup scene, 2–3 picture guesses, what happened, a line of why for the grown-up, and a safe home try.
// Facts checked against NASA Space Place (blue sky, red sunset), NASA Science (moon phases), NASA NSSDC (Apollo 15 hammer-feather drop),
// USGS Water Science School (water cycle) and Britannica (buoyancy, magnetism, germination, sound). See the parent note.
import type { Pic } from "./art";

export type Scene = "pond" | "ice" | "fall" | "moonfall" | "shadow" | "seed" | "sky" | "sunset" | "rain" | "moon" | "magnet" | "phone" | "drum";
export type Choice = { pics: readonly Pic[]; label: string };
export type Item = {
  id: string;
  scene: Scene;
  /** The picture that carries the question for a child who can't read it: what we are asking about. */
  verb: Pic;
  /** Pond only: the two things dropped in, and whether each floats. */
  drop?: readonly [Pic, Pic];
  floats?: readonly [boolean, boolean];
  /** Fall only: the two things dropped, and whether each one drifts (air pushes it) instead of dropping. */
  duo?: readonly [Pic, Pic];
  drifts?: readonly [boolean, boolean];
  /** Phone only: a slack string. */
  loose?: boolean;
  ask: string;
  choices: readonly Choice[];
  answer: number;
  /** What the child sees happen, in one line. */
  result: string;
  why: string;
  /** The "বাসায় করে দেখো (বড়দের সাথে)" idea: no heat, nothing sharp, no electricity. */
  home: string;
  /** Short fact for the parent card. */
  card: string;
  /** How long the experiment runs before the answer shows, in ms. */
  ms: number;
};

export const ITEMS: readonly Item[] = [
  // ---- the pond ----
  {
    id: "narkel-it", scene: "pond", verb: "askFloat", drop: ["coconut", "brick"], floats: [true, false],
    ask: "নারকেল আর ইট পুকুরে ছাড়লে কোনটা ভাসবে?",
    choices: [{ pics: ["coconut"], label: "নারকেল" }, { pics: ["brick"], label: "ইট" }],
    answer: 0,
    result: "নারকেল ভেসে রইল, ইট টুপ করে ডুবে গেল।",
    why: "নারকেলের ছোবড়ায় বাতাস ভরা, তাই একই মাপের পানির চেয়ে সে হালকা। ইট সেই পানির চেয়ে ভারী, তাই ডোবে।",
    home: "বালতির পানিতে একটা ছোট পাথর আর একটা কাঠের টুকরো ছাড়ো। আগে বলো, কোনটা ভাসবে?",
    card: "নারকেল ভাসে, ইট ডোবে", ms: 2700,
  },
  {
    id: "pata-chamoch", scene: "pond", verb: "askFloat", drop: ["leaf", "spoon"], floats: [true, false],
    ask: "শুকনো পাতা আর স্টিলের চামচ, কোনটা ভাসবে?",
    choices: [{ pics: ["spoon"], label: "স্টিলের চামচ" }, { pics: ["leaf"], label: "শুকনো পাতা" }],
    answer: 1,
    result: "পাতা ভাসছে, চামচ নিচে চলে গেল।",
    why: "শুকনো পাতা পাতলা আর হালকা, পানির ওপর বিছিয়ে থাকে। চামচ ছোট, কিন্তু স্টিল পানির চেয়ে অনেক ভারী।",
    home: "এক বাটি পানিতে একটা শুকনো পাতা আর একটা ছোট পাথর রাখো। কোনটা ভাসল?",
    card: "শুকনো পাতা ভাসে, স্টিলের চামচ ডোবে", ms: 2700,
  },
  {
    id: "aloo-bol", scene: "pond", verb: "askFloat", drop: ["potato", "ball"], floats: [false, true],
    ask: "কাঁচা আলু আর প্লাস্টিকের বল পুকুরে ছাড়লে কোনটা ভাসবে?",
    choices: [{ pics: ["potato"], label: "কাঁচা আলু" }, { pics: ["ball"], label: "প্লাস্টিকের বল" }],
    answer: 1,
    result: "বল ভেসে রইল, আলু ডুবে গেল।",
    why: "বলের ভেতরে বাতাস ভরা, তাই সে পানির চেয়ে হালকা। কাঁচা আলু একই মাপের পানির চেয়ে ভারী, তাই ডোবে।",
    home: "বালতির পানিতে একটা কাঁচা আলু আর একটা প্লাস্টিকের বল ছাড়ো। আগে বলো, কোনটা ভাসবে?",
    card: "প্লাস্টিকের বল ভাসে, কাঁচা আলু ডোবে", ms: 2700,
  },
  {
    id: "botol-vela", scene: "pond", verb: "askFloat", drop: ["bottle", "raft"], floats: [true, true],
    ask: "খালি বোতল আর কলাগাছের ভেলা, পুকুরে কী হবে?",
    choices: [{ pics: ["bottle"], label: "বোতল ভাসবে" }, { pics: ["raft"], label: "ভেলা ভাসবে" }, { pics: ["bottle", "raft"], label: "দুটোই ভাসবে" }],
    answer: 2,
    result: "দুটোই ভাসল।",
    why: "ঢাকনা আঁটা খালি বোতলে শুধু বাতাস। কলাগাছের ভেতরে অনেক ফাঁপা ঘর, তাই গ্রামে কলার ভেলায় চড়ে পুকুর পার হয়।",
    home: "ঢাকনা আঁটা খালি বোতল বালতির পানিতে চেপে নিচে নাও, তারপর ছেড়ে দাও। কী হলো?",
    card: "খালি বোতল আর কলার ভেলা দুটোই ভাসে", ms: 2700,
  },
  {
    id: "pathor-poisha", scene: "pond", verb: "askFloat", drop: ["stone", "coin"], floats: [false, false],
    ask: "পাথর আর একটা পয়সা পুকুরে ফেললে কী হবে?",
    choices: [{ pics: ["stone"], label: "পাথর ডুববে" }, { pics: ["stone", "coin"], label: "দুটোই ডুববে" }, { pics: ["coin"], label: "পয়সা ডুববে" }],
    answer: 1,
    result: "দুটোই টুপ করে ডুবে গেল।",
    why: "পাথর আর ধাতুর পয়সা, দুটোই একই মাপের পানির চেয়ে অনেক ভারী। তাই ছোট হলেও দুটো ডোবে।",
    home: "বালতির পানিতে একটা পয়সা, একটা ছোট পাথর আর একটা শুকনো পাতা ছাড়ো। কোনটা ডুবল, কোনটা ভাসল?",
    card: "পাথর আর পয়সা দুটোই ডোবে", ms: 2700,
  },
  {
    id: "kath-pathor", scene: "pond", verb: "askFloat", drop: ["log", "stone"], floats: [true, false],
    ask: "কাঠের টুকরো আর পাথর পুকুরে ফেললে কোনটা ভাসবে?",
    choices: [{ pics: ["log"], label: "কাঠ" }, { pics: ["stone"], label: "পাথর" }, { pics: ["log", "stone"], label: "দুটোই" }],
    answer: 0,
    result: "কাঠ ভেসে রইল, পাথর ডুবে গেল।",
    why: "বেশিরভাগ কাঠ পানির চেয়ে হালকা, তাই ভাসে। পাথর ভারী, তাই ডোবে। বড় কাঠের গুঁড়িও ভেসে থাকে।",
    home: "বালতির পানিতে একটা কাঠের চামচ আর একটা স্টিলের চামচ ছাড়ো। আগে বলো, কোনটা ভাসবে?",
    card: "কাঠ ভাসে, পাথর ডোবে", ms: 2700,
  },
  // ---- sun and ice ----
  {
    id: "borof", scene: "ice", verb: "askMelt",
    ask: "দুটো বরফের টুকরো। একটা রোদে, একটা ছায়ায়। কোনটা আগে গলবে?",
    choices: [{ pics: ["sun"], label: "রোদেরটা" }, { pics: ["shade"], label: "ছায়ারটা" }],
    answer: 0,
    result: "রোদের বরফ আগে গলে পানি হয়ে গেল।",
    why: "রোদ বরফে সরাসরি তাপ দেয়। ছায়ায় তাপ কম পৌঁছায়, তাই সেখানে বরফ ধীরে গলে।",
    home: "দুটো বাটিতে একটা করে বরফ নাও। একটা জানালার রোদে, একটা ঘরের ছায়ায় রাখো। ৫ মিনিট পরপর দেখো।",
    card: "রোদে বরফ আগে গলে", ms: 3000,
  },
  // ---- falling ----
  {
    id: "pathor-palok", scene: "fall", verb: "askFall", duo: ["stone", "feather"], drifts: [false, true],
    ask: "একই উঁচু থেকে পাথর আর পালক ছাড়লে কোনটা আগে মাটিতে পড়বে?",
    choices: [{ pics: ["stone"], label: "পাথর" }, { pics: ["feather"], label: "পালক" }, { pics: ["stone", "feather"], label: "একসাথে" }],
    answer: 0,
    result: "পাথর ধপ করে আগে পড়ল। পালক দুলে দুলে নামল।",
    why: "পালক চওড়া আর খুব হালকা, বাতাস তাকে নিচ থেকে ঠেলে ধরে রাখে। পাথরকে বাতাস তেমন আটকাতে পারে না।",
    home: "একটা বই আর একটা শুকনো পাতা একসাথে ছাড়ো। কোনটা আগে নামল?",
    card: "পাথর আগে পড়ে, পালক দুলে নামে", ms: 3000,
  },
  {
    id: "kagoj", scene: "fall", verb: "askFall", duo: ["paperBall", "paper"], drifts: [false, true],
    ask: "একই কাগজ। একটা খোলা, একটা দলা পাকানো। একসাথে ছাড়লে কোনটা আগে পড়বে?",
    choices: [{ pics: ["paper"], label: "খোলা কাগজ" }, { pics: ["paperBall"], label: "দলা কাগজ" }, { pics: ["paper", "paperBall"], label: "একসাথে" }],
    answer: 1,
    result: "দলা কাগজ ধপ করে আগে পড়ল। খোলা কাগজ দুলে দুলে নামল।",
    why: "দুটো একই কাগজ, ওজনও সমান। খোলা কাগজকে বাতাস বেশি ঠেলে ধরে, তাই সে দেরিতে নামে। দলা করলে বাতাস কম ধরে।",
    home: "দুটো একই কাগজ নাও। একটা খোলা রাখো, আরেকটা দলা পাকাও। একসাথে ছাড়ো।",
    card: "দলা কাগজ আগে পড়ে, খোলা কাগজ দুলে নামে", ms: 3000,
  },
  {
    id: "chande-pora", scene: "moonfall", verb: "askFall", duo: ["hammer", "feather"], drifts: [false, false],
    ask: "চাঁদে বাতাস নেই। সেখানে হাতুড়ি আর পালক একসাথে ছাড়লে কোনটা আগে পড়বে?",
    choices: [{ pics: ["hammer"], label: "হাতুড়ি" }, { pics: ["feather"], label: "পালক" }, { pics: ["hammer", "feather"], label: "একসাথে" }],
    answer: 2,
    result: "হাতুড়ি আর পালক একসাথে মাটি ছুঁল।",
    why: "বাতাস নেই, তাই পালককে ঠেলে ধরার কেউ নেই। তখন ভারী-হালকা সব সমান তালে পড়ে। ১৯৭১ সালে অ্যাপোলো ১৫-এর নভোচারী ডেভিড স্কট চাঁদে এটা করে দেখিয়েছিলেন।",
    home: "একটা বইয়ের ওপর ছোট এক টুকরো কাগজ রাখো। বইটা বিছানার ওপর ছাড়ো। কাগজ কি পিছিয়ে পড়ল?",
    card: "চাঁদে হাতুড়ি আর পালক একসাথে পড়ে", ms: 2600,
  },
  // ---- seeds and magnets ----
  {
    id: "bij", scene: "seed", verb: "askGrow",
    ask: "তিনটা টবে বীজ। কোন টবের চারা সবুজ হয়ে বড় হবে?",
    choices: [{ pics: ["potDry"], label: "আলো, পানি নেই" }, { pics: ["potDark"], label: "পানি, আলো নেই" }, { pics: ["potLight"], label: "পানি আর আলো" }],
    answer: 2,
    result: "পানি আর আলো পাওয়া টবে সবুজ চারা হলো।",
    why: "বীজ ফুটতে পানি লাগে, তাই শুকনো টবে কিছু হয়নি। অন্ধকারে চারা বের হলো, কিন্তু হলদে আর লিকলিকে। সবুজ আর শক্ত হতে আলো লাগে।",
    home: "দুটো ভেজা তুলায় কয়েকটা মুগ ডাল রাখো। একটা জানালায়, একটা আলমারির অন্ধকারে। চার দিন পর দুটো মিলিয়ে দেখো।",
    card: "চারার লাগে পানি আর আলো", ms: 3200,
  },
  {
    id: "chumbok", scene: "magnet", verb: "askStick",
    ask: "চুম্বক কাছে আনলে কোনটা লেগে যাবে?",
    choices: [{ pics: ["clip"], label: "কাগজের ক্লিপ" }, { pics: ["pencil"], label: "কাঠের পেনসিল" }, { pics: ["plasticSpoon"], label: "প্লাস্টিকের চামচ" }],
    answer: 0,
    result: "ক্লিপটা লাফিয়ে চুম্বকে লেগে গেল।",
    why: "চুম্বক টানে লোহা আর লোহার মতো কয়েকটা ধাতু। ক্লিপ লোহার তার দিয়ে বানানো। কাঠ, প্লাস্টিক, কাগজকে চুম্বক টানে না।",
    home: "ফ্রিজের বড় চুম্বকটা নাও। চামচ, ক্লিপ, পেনসিল, দরজার কড়া ছুঁয়ে দেখো, কোনটা লাগে। ছোট চুম্বক মুখে দেবে না।",
    card: "চুম্বক লোহার ক্লিপ টানে, কাঠ-প্লাস্টিক টানে না", ms: 3200,
  },
  {
    id: "chumbok-perek", scene: "magnet", verb: "askStick",
    ask: "লোহার পেরেক, কাঠের চামচ আর কাচের গুলি। চুম্বক কাছে আনলে কোনটা টানবে?",
    choices: [{ pics: ["woodSpoon"], label: "কাঠের চামচ" }, { pics: ["marble"], label: "কাচের গুলি" }, { pics: ["nail"], label: "লোহার পেরেক" }],
    answer: 2,
    result: "পেরেকটা লাফিয়ে চুম্বকে লেগে গেল।",
    why: "পেরেক লোহার, তাই চুম্বক তাকে টানে। কাঠ আর কাচকে চুম্বক টানে না।",
    home: "ঘরে চুম্বক হাতে নিয়ে আলমারি, চামচ আর দরজার কড়া ছুঁয়ে দেখো। কোনটা টানে, কোনটা টানে না? ছোট চুম্বক মুখে দেবে না।",
    card: "চুম্বক লোহার পেরেক টানে, কাঠ-কাচ টানে না", ms: 3200,
  },
  // ---- light, shadow, sky ----
  {
    id: "chaya", scene: "shadow", verb: "askLong",
    ask: "উঠানে একটা খুঁটি। কখন তার ছায়া বেশি লম্বা হবে?",
    choices: [{ pics: ["noon"], label: "দুপুরে" }, { pics: ["evening"], label: "বিকেলে" }],
    answer: 1,
    result: "বিকেলে ছায়া অনেক লম্বা হয়ে গেল।",
    why: "দুপুরে সূর্য মাথার প্রায় ওপরে, আলো খাড়া পড়ে, ছায়া ছোট। বিকেলে সূর্য নিচে নামে, আলো কাত হয়ে পড়ে, ছায়া লম্বা হয়।",
    home: "দুপুরে আর বিকেলে একই জায়গায় দাঁড়াও। নিজের ছায়াটা পা ফেলে মাপো। সূর্যের দিকে তাকাবে না।",
    card: "বিকেলের ছায়া দুপুরের চেয়ে লম্বা", ms: 3000,
  },
  {
    id: "akash", scene: "sky", verb: "askWhy",
    ask: "দিনের আকাশ নীল কেন?",
    choices: [{ pics: ["paint"], label: "আকাশে নীল রং" }, { pics: ["sea"], label: "সাগরের ছায়া" }, { pics: ["light"], label: "রোদের আলো ছড়ায়" }],
    answer: 2,
    result: "রোদ বাতাসে ঢুকতেই নীল আলো চারদিকে ছড়িয়ে গেল।",
    why: "রোদের সাদা আলোয় সব রং মেশানো। বাতাসের খুব ছোট কণায় লেগে নীল আলো সবচেয়ে বেশি ছড়ায়, তাই যেদিকে তাকাও, নীল।",
    home: "দিনের বেলা আকাশের দিকে তাকিয়ে দেখো, কোথায় সবচেয়ে গাঢ় নীল। সূর্যের দিকে সরাসরি তাকাবে না।",
    card: "রোদের নীল আলো ছড়ায় বলে আকাশ নীল", ms: 3400,
  },
  {
    id: "sondhya", scene: "sunset", verb: "askWhy",
    ask: "সূর্য ডোবার সময় আকাশ লাল-কমলা হয় কেন?",
    choices: [{ pics: ["paintRed"], label: "আকাশে লাল রং" }, { pics: ["sunLow"], label: "আলো অনেক পথ পেরোয়" }],
    answer: 1,
    result: "সূর্য নামতেই নীল আলো পথে ছড়িয়ে গেল, রইল লাল-কমলা।",
    why: "সূর্য নিচে নামলে তার আলো অনেক বেশি বাতাস পেরিয়ে আমাদের চোখে আসে। পথেই নীল আলো ছড়িয়ে যায়, বাকি থাকে লাল আর কমলা।",
    home: "বিকেলে পশ্চিমের আকাশ দেখো, সূর্যের দিকে সরাসরি নয়। কোন কোন রং দেখলে?",
    card: "সন্ধ্যায় আলো অনেক পথ পেরোয়, তাই আকাশ লাল-কমলা", ms: 3200,
  },
  {
    id: "brishti", scene: "rain", verb: "askWhy",
    ask: "বৃষ্টির পানি আসে কোথা থেকে?",
    choices: [{ pics: ["tank"], label: "আকাশের ট্যাংক থেকে" }, { pics: ["river"], label: "নদী-সাগর থেকে" }],
    answer: 1,
    result: "নদীর পানি ওপরে উঠে মেঘ হলো, মেঘ থেকে বৃষ্টি নামল।",
    why: "সূর্যের তাপে নদী-সাগরের পানি বাষ্প হয়ে ওপরে ওঠে। ওপরের ঠান্ডায় জমে মেঘ হয়, ফোঁটা ভারী হলে বৃষ্টি নামে। সেই পানি আবার নদীতে ফেরে। একেই বলে পানিচক্র।",
    home: "ফ্রিজের ঠান্ডা পানির বোতল বাইরে রাখো। একটু পরে গায়ে ফোঁটা জমবে। বাতাসের বাষ্প ঠান্ডায় পানি হলো, মেঘেও এমনই হয়।",
    card: "নদী-সাগরের পানি মেঘ হয়, মেঘ থেকে বৃষ্টি", ms: 3800,
  },
  {
    id: "chand", scene: "moon", verb: "askWhy",
    ask: "চাঁদ কেন রোজ একটু করে বদলায়?",
    choices: [{ pics: ["earthShadow"], label: "পৃথিবীর ছায়া পড়ে" }, { pics: ["orbit"], label: "আলোর দিকটা কম-বেশি দেখি" }, { pics: ["moonShrink"], label: "চাঁদ নিজে ছোট-বড় হয়" }],
    answer: 1,
    result: "চাঁদ ঘুরছে, আর আমরা তার আলো-পড়া দিকটা কম-বেশি দেখছি।",
    why: "সূর্য সবসময় চাঁদের অর্ধেকটা আলো করে রাখে। চাঁদ পৃথিবীর চারপাশে ঘোরে, তাই আলোর দিকটা কখনো পুরো দেখি, কখনো এক ফালি। পুরো পালা ঘুরে আসতে প্রায় সাড়ে ২৯ দিন লাগে।",
    home: "চার-পাঁচ রাত একই সময়ে চাঁদটা দেখো, খাতায় এঁকে রাখো। কোন দিকটা বাড়ছে?",
    card: "চাঁদের আলো-পড়া দিকটা কম-বেশি দেখি", ms: 3800,
  },
  // ---- sound ----
  {
    id: "sutor-phone", scene: "phone", verb: "askHear",
    ask: "সুতোয় বাঁধা দুটো কাপ। সুতো টানটান করে এক কাপে কথা বললে কী হবে?",
    choices: [{ pics: ["quiet"], label: "কিছুই শোনা যাবে না" }, { pics: ["ear"], label: "অন্য কাপে শোনা যাবে" }],
    answer: 1,
    result: "কথাটা সুতো বেয়ে অন্য কাপে পৌঁছাল।",
    why: "কথা বললে কাপের তলা কাঁপে। টানটান সুতো সেই কাঁপুনি অন্য কাপে নিয়ে যায়, সেখানে আবার শব্দ হয়।",
    home: "দুটো কাগজের কাপের তলায় লম্বা সুতোর দুই মাথা টেপ দিয়ে আটকাও। সুতো টানটান করে ফিসফিস করে কথা বলো।",
    card: "টানটান সুতো বেয়ে শব্দ যায়", ms: 3000,
  },
  {
    id: "sutor-dhila", scene: "phone", verb: "askHear", loose: true,
    ask: "এবার সুতোটা ঢিলা। এক কাপে কথা বললে অন্য কাপে শোনা যাবে?",
    choices: [{ pics: ["ear"], label: "শোনা যাবে" }, { pics: ["quiet"], label: "শোনা যাবে না" }],
    answer: 1,
    result: "ঢিলা সুতো কাঁপুনি বইতে পারল না, কথা পৌঁছাল না।",
    why: "কথার কাঁপুনি সুতো বেয়ে যায়, কিন্তু সুতো টানটান না হলে সেই কাঁপুনি মাঝপথে থেমে যায়।",
    home: "সুতোর ফোনে একবার সুতো ঢিলা, একবার টানটান করে ফিসফিস করে কথা বলে দেখো। কখন শোনা যায়?",
    card: "ঢিলা সুতোয় শব্দ যায় না", ms: 3000,
  },
  {
    id: "dhol-dana", scene: "drum", verb: "askHear",
    ask: "ঢোলের ওপর কয়েকটা চালের দানা। ঢোলে টোকা দিলে দানাগুলো কী করবে?",
    choices: [{ pics: ["drumStill"], label: "স্থির থাকবে" }, { pics: ["drumHop"], label: "লাফাবে" }],
    answer: 1,
    result: "টোকা দিতেই দানাগুলো লাফিয়ে উঠল।",
    why: "ঢোলের চামড়া টোকায় কাঁপে। সেই কাঁপুনিই আমরা শব্দ হিসেবে শুনি। চামড়া কাঁপছে বলেই দানাগুলো লাফায়।",
    home: "একটা বাটির মুখে পলিথিন টানটান করে বাঁধো। ওপরে কয়েকটা চালের দানা রেখে পলিথিনে আঙুলে আস্তে টোকা দাও।",
    card: "ঢোলের চামড়া কাঁপে, তাই দানা লাফায়", ms: 2800,
  },
];

export const itemById = (id: string): Item => {
  const item = ITEMS.find(one => one.id === id);
  if (!item) throw new Error(`no experiment ${id}`);
  return item;
};

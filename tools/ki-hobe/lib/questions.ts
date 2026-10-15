// The thirteen "কী হবে?" questions: a setup scene, 2–3 picture predictions, what happened, one line of why, and a safe home try.
// Facts checked against NASA Space Place (blue sky), NASA Science (moon phases), NASA NSSDC (Apollo 15 hammer-feather drop),
// USGS Water Science School (water cycle) and Britannica (buoyancy, magnetism, germination, sound). See the parent note.
import type { Pic } from "./art";

export type Scene = "pond" | "ice" | "fall" | "moonfall" | "shadow" | "seed" | "sky" | "rain" | "moon" | "magnet" | "phone";
export type Choice = { pics: readonly Pic[]; label: string };
export type Item = {
  id: string;
  set: 1 | 2 | 3;
  scene: Scene;
  /** Pond only: the two things dropped in, and whether each floats. */
  drop?: readonly [Pic, Pic];
  floats?: readonly [boolean, boolean];
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
};

export const ITEMS: readonly Item[] = [
  {
    id: "narkel-it", set: 1, scene: "pond", drop: ["coconut", "brick"], floats: [true, false],
    ask: "নারকেল আর ইট পুকুরে ছাড়লে কোনটা ভাসবে?",
    choices: [{ pics: ["coconut"], label: "নারকেল" }, { pics: ["brick"], label: "ইট" }],
    answer: 0,
    result: "নারকেল ভেসে রইল, ইট টুপ করে ডুবে গেল।",
    why: "নারকেলের ছোবড়ায় বাতাস ভরা, তাই একই মাপের পানির চেয়ে সে হালকা। ইট সেই পানির চেয়ে ভারী, তাই ডোবে।",
    home: "বালতির পানিতে একটা আলু আর একটা প্লাস্টিকের বল ছাড়ো। আগে বলো, কোনটা ভাসবে?",
    card: "নারকেল ভাসে, ইট ডোবে",
  },
  {
    id: "pata-chamoch", set: 1, scene: "pond", drop: ["leaf", "spoon"], floats: [true, false],
    ask: "শুকনো পাতা আর স্টিলের চামচ, কোনটা ভাসবে?",
    choices: [{ pics: ["leaf"], label: "শুকনো পাতা" }, { pics: ["spoon"], label: "স্টিলের চামচ" }],
    answer: 0,
    result: "পাতা ভাসছে, চামচ নিচে চলে গেল।",
    why: "শুকনো পাতা পাতলা আর হালকা, পানির ওপর বিছিয়ে থাকে। চামচ ছোট, কিন্তু স্টিল পানির চেয়ে অনেক ভারী।",
    home: "এক বাটি পানিতে একটা শুকনো পাতা আর একটা ছোট পাথর রাখো। কোনটা ভাসল?",
    card: "শুকনো পাতা ভাসে, স্টিলের চামচ ডোবে",
  },
  {
    id: "botol-vela", set: 1, scene: "pond", drop: ["bottle", "raft"], floats: [true, true],
    ask: "খালি বোতল আর কলাগাছের ভেলা, পুকুরে কী হবে?",
    choices: [{ pics: ["bottle"], label: "বোতল ভাসবে" }, { pics: ["raft"], label: "ভেলা ভাসবে" }, { pics: ["bottle", "raft"], label: "দুটোই ভাসবে" }],
    answer: 2,
    result: "দুটোই ভাসল।",
    why: "ঢাকনা আঁটা খালি বোতলে শুধু বাতাস। কলাগাছের ভেতরে অনেক ফাঁপা ঘর, তাই গ্রামে কলার ভেলায় চড়ে পুকুর পার হয়।",
    home: "ঢাকনা আঁটা খালি বোতল বালতির পানিতে চেপে নিচে নাও, তারপর ছেড়ে দাও। কী হলো?",
    card: "খালি বোতল আর কলার ভেলা দুটোই ভাসে",
  },
  {
    id: "borof", set: 1, scene: "ice",
    ask: "দুটো বরফের টুকরো। একটা রোদে, একটা ছায়ায়। কোনটা আগে গলবে?",
    choices: [{ pics: ["sun"], label: "রোদেরটা" }, { pics: ["shade"], label: "ছায়ারটা" }],
    answer: 0,
    result: "রোদের বরফ আগে গলে পানি হয়ে গেল।",
    why: "রোদ বরফে সরাসরি তাপ দেয়। ছায়ায় তাপ কম পৌঁছায়, তাই সেখানে বরফ ধীরে গলে।",
    home: "দুটো বাটিতে একটা করে বরফ নাও। একটা জানালার রোদে, একটা ঘরের ছায়ায় রাখো। ৫ মিনিট পরপর দেখো।",
    card: "রোদে বরফ আগে গলে",
  },
  {
    id: "pathor-palok", set: 2, scene: "fall",
    ask: "একই উঁচু থেকে পাথর আর পালক ছাড়লে কোনটা আগে মাটিতে পড়বে?",
    choices: [{ pics: ["stone"], label: "পাথর" }, { pics: ["feather"], label: "পালক" }, { pics: ["stone", "feather"], label: "একসাথে" }],
    answer: 0,
    result: "পাথর ধপ করে আগে পড়ল। পালক দুলে দুলে নামল।",
    why: "পালক চওড়া আর খুব হালকা, বাতাস তাকে নিচ থেকে ঠেলে ধরে রাখে। পাথরকে বাতাস তেমন আটকাতে পারে না।",
    home: "দুটো একই কাগজ নাও। একটা খোলা রাখো, আরেকটা দলা পাকাও। একসাথে ছাড়ো।",
    card: "পাথর আগে পড়ে, পালক দুলে নামে",
  },
  {
    id: "chande-pora", set: 2, scene: "moonfall",
    ask: "চাঁদে বাতাস নেই। সেখানে হাতুড়ি আর পালক একসাথে ছাড়লে কোনটা আগে পড়বে?",
    choices: [{ pics: ["hammer"], label: "হাতুড়ি" }, { pics: ["feather"], label: "পালক" }, { pics: ["hammer", "feather"], label: "একসাথে" }],
    answer: 2,
    result: "হাতুড়ি আর পালক একসাথে মাটি ছুঁল।",
    why: "বাতাস নেই, তাই পালককে ঠেলে ধরার কেউ নেই। তখন ভারী-হালকা সব সমান তালে পড়ে। ১৯৭১ সালে অ্যাপোলো ১৫-এর নভোচারী ডেভিড স্কট চাঁদে এটা করে দেখিয়েছিলেন।",
    home: "একটা বইয়ের ওপর ছোট এক টুকরো কাগজ রাখো। বইটা বিছানার ওপর ছাড়ো। কাগজ কি পিছিয়ে পড়ল?",
    card: "চাঁদে হাতুড়ি আর পালক একসাথে পড়ে",
  },
  {
    id: "chaya", set: 2, scene: "shadow",
    ask: "উঠানে একটা খুঁটি। কখন তার ছায়া বেশি লম্বা হবে?",
    choices: [{ pics: ["noon"], label: "দুপুরে" }, { pics: ["evening"], label: "বিকেলে" }],
    answer: 1,
    result: "বিকেলে ছায়া অনেক লম্বা হয়ে গেল।",
    why: "দুপুরে সূর্য মাথার প্রায় ওপরে, আলো খাড়া পড়ে, ছায়া ছোট। বিকেলে সূর্য নিচে নামে, আলো কাত হয়ে পড়ে, ছায়া লম্বা হয়।",
    home: "দুপুরে আর বিকেলে একই জায়গায় দাঁড়াও। নিজের ছায়াটা পা ফেলে মাপো। সূর্যের দিকে তাকাবে না।",
    card: "বিকেলের ছায়া দুপুরের চেয়ে লম্বা",
  },
  {
    id: "bij", set: 2, scene: "seed",
    ask: "তিনটা টবে বীজ। কোন টবের চারা সবুজ হয়ে বড় হবে?",
    choices: [{ pics: ["potLight"], label: "পানি আর আলো" }, { pics: ["potDry"], label: "আলো, পানি নেই" }, { pics: ["potDark"], label: "পানি, আলো নেই" }],
    answer: 0,
    result: "পানি আর আলো পাওয়া টবে সবুজ চারা হলো।",
    why: "বীজ ফুটতে পানি লাগে, তাই শুকনো টবে কিছু হয়নি। অন্ধকারে চারা বের হলো, কিন্তু হলদে আর লিকলিকে। সবুজ আর শক্ত হতে আলো লাগে।",
    home: "দুটো ভেজা তুলায় কয়েকটা মুগ ডাল রাখো। একটা জানালায়, একটা আলমারির অন্ধকারে। চার দিন পর দুটো মিলিয়ে দেখো।",
    card: "চারার লাগে পানি আর আলো",
  },
  {
    id: "chumbok", set: 2, scene: "magnet",
    ask: "চুম্বক কাছে আনলে কোনটা লেগে যাবে?",
    choices: [{ pics: ["clip"], label: "কাগজের ক্লিপ" }, { pics: ["pencil"], label: "কাঠের পেনসিল" }, { pics: ["plasticSpoon"], label: "প্লাস্টিকের চামচ" }],
    answer: 0,
    result: "ক্লিপটা লাফিয়ে চুম্বকে লেগে গেল।",
    why: "চুম্বক টানে লোহা আর লোহার মতো কয়েকটা ধাতু। ক্লিপ লোহার তার দিয়ে বানানো। কাঠ, প্লাস্টিক, কাগজকে চুম্বক টানে না।",
    home: "ফ্রিজের বড় চুম্বকটা নাও। চামচ, ক্লিপ, পেনসিল, দরজার কড়া ছুঁয়ে দেখো, কোনটা লাগে। ছোট চুম্বক মুখে দেবে না।",
    card: "চুম্বক লোহার ক্লিপ টানে, কাঠ-প্লাস্টিক টানে না",
  },
  {
    id: "akash", set: 3, scene: "sky",
    ask: "দিনের আকাশ নীল কেন?",
    choices: [{ pics: ["paint"], label: "আকাশে নীল রং" }, { pics: ["sea"], label: "সাগরের ছায়া" }, { pics: ["light"], label: "রোদের আলো ছড়ায়" }],
    answer: 2,
    result: "রোদ বাতাসে ঢুকতেই নীল আলো চারদিকে ছড়িয়ে গেল।",
    why: "রোদের সাদা আলোয় সব রং মেশানো। বাতাসের খুব ছোট কণায় লেগে নীল আলো সবচেয়ে বেশি ছড়ায়, তাই যেদিকে তাকাও, নীল।",
    home: "সূর্য ডোবার সময় পশ্চিমের আকাশটা দেখো, সূর্যের দিকে নয়। আলো তখন অনেক বেশি বাতাস পেরোয়, নীল পথেই ছড়িয়ে যায়, তাই লাল-কমলা দেখায়।",
    card: "রোদের নীল আলো ছড়ায় বলে আকাশ নীল",
  },
  {
    id: "brishti", set: 3, scene: "rain",
    ask: "বৃষ্টির পানি আসে কোথা থেকে?",
    choices: [{ pics: ["river"], label: "নদী-সাগর থেকে" }, { pics: ["tank"], label: "আকাশের ট্যাংক থেকে" }],
    answer: 0,
    result: "নদীর পানি ওপরে উঠে মেঘ হলো, মেঘ থেকে বৃষ্টি নামল।",
    why: "সূর্যের তাপে নদী-সাগরের পানি বাষ্প হয়ে ওপরে ওঠে। ওপরের ঠান্ডায় জমে মেঘ হয়, ফোঁটা ভারী হলে বৃষ্টি নামে। সেই পানি আবার নদীতে ফেরে। একেই বলে পানিচক্র।",
    home: "ফ্রিজের ঠান্ডা পানির বোতল বাইরে রাখো। একটু পরে গায়ে ফোঁটা জমবে। বাতাসের বাষ্প ঠান্ডায় পানি হলো, মেঘেও এমনই হয়।",
    card: "নদী-সাগরের পানি মেঘ হয়, মেঘ থেকে বৃষ্টি",
  },
  {
    id: "chand", set: 3, scene: "moon",
    ask: "চাঁদ কেন রোজ একটু করে বদলায়?",
    choices: [{ pics: ["earthShadow"], label: "পৃথিবীর ছায়া পড়ে" }, { pics: ["orbit"], label: "আলোর দিকটা কম-বেশি দেখি" }, { pics: ["moonShrink"], label: "চাঁদ নিজে ছোট-বড় হয়" }],
    answer: 1,
    result: "চাঁদ ঘুরছে, আর আমরা তার আলো-পড়া দিকটা কম-বেশি দেখছি।",
    why: "সূর্য সবসময় চাঁদের অর্ধেকটা আলো করে রাখে। চাঁদ পৃথিবীর চারপাশে ঘোরে, তাই আলোর দিকটা কখনো পুরো দেখি, কখনো এক ফালি। পুরো পালা ঘুরে আসতে প্রায় সাড়ে ২৯ দিন লাগে।",
    home: "চার-পাঁচ রাত একই সময়ে চাঁদটা দেখো, খাতায় এঁকে রাখো। কোন দিকটা বাড়ছে?",
    card: "চাঁদের আলো-পড়া দিকটা কম-বেশি দেখি",
  },
  {
    id: "sutor-phone", set: 3, scene: "phone",
    ask: "সুতোয় বাঁধা দুটো কাপ। সুতো টানটান করে এক কাপে কথা বললে কী হবে?",
    choices: [{ pics: ["ear"], label: "অন্য কাপে শোনা যাবে" }, { pics: ["quiet"], label: "কিছুই শোনা যাবে না" }],
    answer: 0,
    result: "কথাটা সুতো বেয়ে অন্য কাপে পৌঁছাল।",
    why: "কথা বললে কাপের তলা কাঁপে। টানটান সুতো সেই কাঁপুনি অন্য কাপে নিয়ে যায়, সেখানে আবার শব্দ হয়। সুতো ঢিলা হলে কাঁপুনি থেমে যায়।",
    home: "দুটো কাগজের কাপের তলায় লম্বা সুতোর দুই মাথা টেপ দিয়ে আটকাও। সুতো টানটান করে ফিসফিস করে কথা বলো।",
    card: "টানটান সুতো বেয়ে শব্দ যায়",
  },
];

/** How long each scene's animation runs before the "why" appears (the slow mode shows the end at once). */
export const SCENE_MS: Record<Scene, number> = {
  pond: 2600, ice: 3200, fall: 3200, moonfall: 2400, shadow: 3000, seed: 3200, sky: 3400, rain: 4400, moon: 4400, magnet: 3200, phone: 3000,
};

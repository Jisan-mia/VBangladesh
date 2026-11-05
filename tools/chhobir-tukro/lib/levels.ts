// The 30 levels as data: three worlds, each with its one new idea, and per level a name, the one thing it teaches, how
// strongly the painting shows on the empty board, and how many pieces start already in. The cut itself (seed, grid size,
// turned pieces) lives in game.ts and never changes, so old links open the same puzzle.

export type WorldInfo = { name: string; place: string; idea: string; from: number; to: number; finale: string };

export const WORLDS: readonly WorldInfo[] = [
  { name: "ভোর", place: "নদীর ঘাট", idea: "টুকরো জোড়া লাগানো, তারপর বড় ছবি", from: 1, to: 10, finale: "খেয়াঘাটের ভোর" },
  { name: "গোধূলি", place: "পশ্চিমের নদী", idea: "ঘোরানো টুকরো", from: 11, to: 20, finale: "পাল তুলে বাড়ি ফেরা" },
  { name: "জোছনা", place: "রাতের খেত", idea: "একই রকম দেখতে টুকরো", from: 21, to: 30, finale: "পূর্ণিমার ফানুস" },
];

export type LevelInfo = {
  name: string;
  teach: string;
  /** How strongly the finished painting shows on the empty board (0: only the cut lines). */
  ghost: number;
  /** Pieces already in when the level starts (level 1 only: a first win inside 10 seconds). */
  preset?: number;
  /** A new idea arrives here: the title marks it নতুন. */
  fresh?: true;
  finale?: true;
};

export const LEVEL_INFO: readonly LevelInfo[] = [
  // ভোর: ৩×৩, then ৪×৪
  { name: "প্রথম ছবি", teach: "নিচের টুকরো টেনে ছবির ছায়ার ওপর ছাড়ো। কাছে গেলেই খট করে বসে যাবে।", ghost: 0.42, preset: 5, fresh: true },
  { name: "পুরো ছবি", teach: "এবার ৯টা টুকরোই তোমার। আকাশ ওপরে, পানি নিচে।", ghost: 0.38 },
  { name: "চাপো, তারপর চাপো", teach: "টানতে না চাইলে টুকরোয় একবার চাপো, তারপর বোর্ডের ঘরে চাপো।", ghost: 0.36, fresh: true },
  { name: "কোণ আর কিনারা", teach: "কিনারার টুকরোর এক দিক সোজা, কোণের টুকরোর দুই দিক। ওগুলো ফ্রেমের ধারে বসে।", ghost: 0.34 },
  { name: "ষোলো টুকরো", teach: "এবার ৪×৪। ট্রেতে সব ধরে না, জায়গা খালি হলে বাকিগুলো আসে।", ghost: 0.34, fresh: true },
  { name: "পরপর বসাও", teach: "ভুল না করে পরপর বসালে শব্দ চড়তে থাকে। শেষে গোনা হয় সবচেয়ে লম্বা টানা।", ghost: 0.32 },
  { name: "তারার ঘড়ি", teach: "ওপরে ডানে ঘড়ি আর তারা। একটা তারা কমার আগে বোর্ডের কিনারা কমলা হয়।", ghost: 0.3, fresh: true },
  { name: "বাক্সের ছবি", teach: "নিচে বাঁয়ে বাক্সের ছবিটা চেপে ধরো, পুরো ছবি দেখা যাবে।", ghost: 0.28, fresh: true },
  { name: "আবছা ছায়া", teach: "বোর্ডে ছবির ছায়া এবার হালকা। রং আর খাঁজ দুটোই দেখো।", ghost: 0.2 },
  { name: "খেয়াঘাটের ভোর", teach: "শেষ ছবি। বোর্ডে ছায়া নেই, শুধু কাটার দাগ। বাক্সের ছবি দেখে নাও।", ghost: 0, finale: true },
  // গোধূলি: turned pieces, ৪×৪ then ৫×৫
  { name: "ঘোরানো টুকরো", teach: "কিছু টুকরো ঘোরানো। বাছাই করা টুকরোয় আবার চাপলে ডানে ঘোরে।", ghost: 0.3, fresh: true },
  { name: "হাতে রেখে ঘোরাও", teach: "টুকরো ধরে টানার সময় আরেক আঙুলে স্ক্রিনে চাপো, হাতের টুকরোটা ঘুরবে। কিবোর্ডে R।", ghost: 0.28, fresh: true },
  { name: "জায়গা ঠিক", teach: "ঘোরানো টুকরো ঠিক ঘরে ছাড়লে ঘরটা হলুদ হয়। জায়গা ঠিক, শুধু ঘোরাও।", ghost: 0.26 },
  { name: "পঁচিশ টুকরো", teach: "এবার ৫×৫, সব টুকরো সোজা। শুধু টুকরো বেশি।", ghost: 0.26, fresh: true },
  { name: "আগে ফ্রেম", teach: "আগে চারপাশের ফ্রেম বানাও। ফ্রেম পুরো হলে টুং করে বাজে।", ghost: 0.24 },
  { name: "আলোর দিক", teach: "সূর্য যেদিকে, সেদিকের টুকরো বেশি উজ্জ্বল। আলো দেখে দিক চেনো।", ghost: 0.22 },
  { name: "আবছা ছায়া", teach: "ছায়া আরও হালকা। নদীর বাঁক ধরে এগোও।", ghost: 0.16 },
  { name: "আবার ঘোরানো", teach: "৫×৫, ঘোরানো টুকরোসহ। আগে সোজা করো, তারপর টানো।", ghost: 0.22, fresh: true },
  { name: "ঘুরিয়ে আনো", teach: "আকাশের টুকরো কোন দিকে সোজা, মেঘের তলা দেখে বোঝো।", ghost: 0.18 },
  { name: "পাল তুলে বাড়ি ফেরা", teach: "শেষ ছবি। বোর্ডে ছায়া নেই, টুকরোও ঘোরানো। লাল পালগুলো খোঁজো।", ghost: 0, finale: true },
  // জোছনা: ৬×৬ with look-alike pieces
  { name: "রাতের আকাশ", teach: "এবার ৬×৬। রাতের আকাশের টুকরো দেখতে প্রায় এক। বোর্ডের দাগে খাঁজ মিলিয়ে বসাও।", ghost: 0.26, fresh: true },
  { name: "খাঁজ মেলে কি না", teach: "ভুল ঘরে ছাড়লে খেলা বলে দেয়, খাঁজ মিলেছিল কি না। মিললে রংটা আবার দেখো।", ghost: 0.24 },
  { name: "তারা আর জোনাকি", teach: "আকাশে তারা, খেতে জোনাকি। ছোট আলোর বিন্দু দেখে টুকরো আলাদা করো।", ghost: 0.22 },
  { name: "চাঁদের রাস্তা", teach: "পানিতে চাঁদের আলোর রাস্তা। ওটা ধরে মাঝের টুকরোগুলো বসাও।", ghost: 0.2 },
  { name: "আবছা ছায়া", teach: "ছায়া এবার খুব হালকা। কিনারা আগে, তারপর আলো থেকে অন্ধকারে।", ghost: 0.14 },
  { name: "রাতে ঘোরানো", teach: "৬×৬, ঘোরানো টুকরোসহ। একই রকম টুকরো ঘোরানো থাকলে আগে খাঁজ দেখো।", ghost: 0.22, fresh: true },
  { name: "আগে চার কোণ", teach: "চার কোণের টুকরো আগে খোঁজো। দুই দিক সোজা হলে বুঝবে, কোন দিকে ঘোরাতে হবে।", ghost: 0.2 },
  { name: "ঘোরানো ফ্রেম", teach: "ফ্রেমের টুকরো সোজা দিকটা বাইরে রেখে ঘোরাও।", ghost: 0.18 },
  { name: "সবচেয়ে আবছা", teach: "ছায়া প্রায় নেই। শেষ ছবির আগে হাত পাকিয়ে নাও।", ghost: 0.1 },
  { name: "পূর্ণিমার ফানুস", teach: "শেষ ছবি। ৩৬ টুকরো, ঘোরানো, বোর্ডে ছায়া নেই। ফানুসের আলো খোঁজো।", ghost: 0, finale: true },
];

export const LEVEL_COUNT = LEVEL_INFO.length;
export const infoOf = (level: number) => LEVEL_INFO[Math.min(LEVEL_COUNT, Math.max(1, Math.round(level) || 1)) - 1];
export const worldIndex = (level: number) => Math.max(0, WORLDS.findIndex(world => level >= world.from && level <= world.to));
export const worldInfo = (level: number) => WORLDS[worldIndex(level)];
export const isFinale = (level: number) => infoOf(level).finale === true;
export const presetOf = (level: number) => infoOf(level).preset ?? 0;

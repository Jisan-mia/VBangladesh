// The worlds and levels. Ids 1–6 keep their old meaning (the same two dinosaurs, so saved stars still fit); 7–9 are the finales.
// The list shows play order, numbered ১–৯. Each level teaches exactly one new thing; each world ends with a named giant.
import type { BoneKind } from "./art";

export type WorldId = 0 | 1 | 2;
export type World = { id: WorldId; name: string; place: string };
export const WORLDS: readonly World[] = [
  { id: 0, name: "বালুর মাঠ", place: "সোনালি বালু" },
  { id: 1, name: "জঙ্গলের মাটি", place: "ভেজা মাটি আর পাথর" },
  { id: 2, name: "পাহাড়ের গা", place: "ধূসর পাথুরে মাটি" },
];

export type LevelSpec = {
  id: number; world: WorldId;
  /** The one new thing, as a short name. A finale carries the giant's name. */
  title: string;
  finale: boolean;
  /** The dinosaurs of this level, in order. A finale has one, found in two pits. */
  dinos: readonly string[];
  /** Pits per dinosaur: 2 for a finale (half the bones in each). */
  digs: 1 | 2;
  /** Bones in a pit-level's dig (3–5); a finale always has six. */
  bones: number;
  depth: 1 | 2; rocks: number; decoys: number;
  /** A mound and a crack over each bone, so even the youngest know where to brush. */
  marks: boolean;
  /** The grey bones in their places on the skeleton board. Off: only the dinosaur's shadow. */
  ghost: boolean;
  /** The one line of help for this level's new thing (for the parent; the pictures and the ghost finger carry it for the child). */
  tip: string;
  /** What the child can do now (the end screen), and one thing to do off the screen. */
  news: string; off: string;
};

const level = (spec: LevelSpec) => spec;
export const LEVELS: readonly LevelSpec[] = [
  level({ id: 1, world: 0, title: "বালু সরাও", finale: false, dinos: ["triceratops", "trex"], digs: 1, bones: 3, depth: 1, rocks: 0, decoys: 0, marks: true, ghost: true,
    tip: "বালুর নিচে হাড় লুকানো। আঙুল দিয়ে বালু সরাও, বা টোকা দাও।",
    news: "এখন তুমি বালু সরিয়ে হাড় বের করতে পারো।", off: "উঠানে বা টবে একটু মাটি সরিয়ে দেখো, নিচে কী আছে।" }),
  level({ id: 2, world: 0, title: "গভীর বালু", finale: false, dinos: ["stegosaurus", "velociraptor"], digs: 1, bones: 3, depth: 2, rocks: 0, decoys: 0, marks: true, ghost: true,
    tip: "গভীর বালু: একবার সরিয়ে আঙুল তোলো, তারপর আবার ব্রাশ করো।",
    news: "গভীর বালু একবারে সরে না। আঙুল তুলে আরেকবার ব্রাশ করতে হয়।", off: "আব্বুকে জিজ্ঞেস করো, ‘সবচেয়ে ছোট ডাইনোসর কোনটা?’" }),
  level({ id: 7, world: 0, title: "টি-রেক্সের কঙ্কাল", finale: true, dinos: ["trex"], digs: 2, bones: 6, depth: 2, rocks: 0, decoys: 0, marks: true, ghost: true,
    tip: "বড় কঙ্কালের অর্ধেক হাড় এই গর্তে, বাকি অর্ধেক পরের গর্তে।",
    news: "দুই গর্তের হাড় জোড়া দিয়ে একটা বড় কঙ্কাল বানিয়েছ।", off: "একটা বড় বাস দেখলে বলো, ‘টি-রেক্সও এত লম্বা।’" }),
  level({ id: 3, world: 1, title: "পাথরের ফাঁকে", finale: false, dinos: ["brachiosaurus", "allosaurus"], digs: 1, bones: 4, depth: 1, rocks: 2, decoys: 0, marks: true, ghost: true,
    tip: "পাথর সরে না। তার পাশ দিয়ে ব্রাশ করো।",
    news: "পাথর সরে না। তার পাশ দিয়ে ব্রাশ করে হাড় বের করতে পারো।", off: "ছাদে বা মাঠে একটা পাথর খুঁজে তার পাশে মাটি সরিয়ে দেখো।" }),
  level({ id: 4, world: 1, title: "সব হাড় নয়", finale: false, dinos: ["ankylosaurus", "spinosaurus"], digs: 1, bones: 4, depth: 1, rocks: 1, decoys: 2, marks: true, ghost: true,
    tip: "ঝিনুক আর নুড়ি হাড় নয়। শুধু হাড় তোলো।",
    news: "বালির নিচে ঝিনুক আর নুড়িও থাকে। শুধু হাড় তোলো।", off: "নদীর পাড়ে গেলে একটা ঝিনুক আর একটা নুড়ি খুঁজে পাশাপাশি রাখো।" }),
  level({ id: 8, world: 1, title: "ব্র্যাকিওসরাসের কঙ্কাল", finale: true, dinos: ["brachiosaurus"], digs: 2, bones: 6, depth: 1, rocks: 2, decoys: 1, marks: true, ghost: true,
    tip: "দুই গর্তে ছয়টা হাড়। পাথরের পাশ দিয়ে ব্রাশ করো।",
    news: "দুটো বড় বাসের সমান ডাইনোসর তুমি জোড়া দিয়েছ।", off: "পরের বার দুটো বাস পাশাপাশি দেখলে বলো, ‘ব্র্যাকিওসরাস এত লম্বা।’" }),
  level({ id: 5, world: 2, title: "ছায়া দেখে বসাও", finale: false, dinos: ["diplodocus", "parasaurolophus"], digs: 1, bones: 5, depth: 1, rocks: 0, decoys: 0, marks: true, ghost: false,
    tip: "হাড়গুলো ছায়ার ঠিক জায়গায় বসাও।",
    news: "ছায়া দেখেই হাড় ঠিক জায়গায় বসাতে পারো।", off: "নিজের হাত আর পা দেখো। কোন হাড় কোথায় বসেছে?" }),
  level({ id: 6, world: 2, title: "চিহ্ন ছাড়া খোঁড়া", finale: false, dinos: ["iguanodon", "pachycephalosaurus"], digs: 1, bones: 5, depth: 1, rocks: 0, decoys: 0, marks: false, ghost: false,
    tip: "এবার বালুতে কোনো চিহ্ন নেই। চারদিক ব্রাশ করে দেখো।",
    news: "বালুতে কোনো চিহ্ন না থাকলেও খুঁজে বের করতে পারো।", off: "ঘরের একটা জিনিস চোখ বন্ধ করে হাতড়ে চেনো।" }),
  level({ id: 9, world: 2, title: "ডিপ্লোডোকাসের কঙ্কাল", finale: true, dinos: ["diplodocus"], digs: 2, bones: 6, depth: 1, rocks: 2, decoys: 1, marks: false, ghost: false,
    tip: "সবচেয়ে বড় কঙ্কাল। দুই গর্ত, পাথর, কোনো চিহ্ন নেই।",
    news: "২৬ মিটার লম্বা কঙ্কাল, পুরোটা তোমার হাতে জোড়া।", off: "রাস্তায় দুটো বাস পরপর দেখলে ভাবো, ডিপ্লোডোকাস তার চেয়েও লম্বা।" }),
];

/** The play order: each world's two levels, then its finale. */
export const ORDER: readonly number[] = [1, 2, 7, 3, 4, 8, 5, 6, 9];
export const LEVEL_COUNT = LEVELS.length;

export const isLevel = (id: number) => LEVELS.some(each => each.id === id);
export const levelOf = (id: number): LevelSpec => LEVELS.find(each => each.id === id) ?? LEVELS[0];
/** The number the child sees (১–৯). */
export const placeOf = (id: number) => Math.max(0, ORDER.indexOf(id)) + 1;
export const levelsOfWorld = (world: WorldId): number[] => ORDER.filter(id => levelOf(id).world === world);
export const isWorldEnd = (id: number) => levelOf(id).finale;
/** The level after this one in play order, or 0 after the last. */
export const nextInOrder = (id: number) => ORDER[ORDER.indexOf(id) + 1] ?? 0;
/** The first level in play order with no stars yet; the first level again when every one has some. Never a lock: everything is open. */
export const nextToPlay = (stars: Readonly<Record<number, number>>) => ORDER.find(id => !stars[id]) ?? ORDER[0];

/** How many bones a finale holds, split across its two pits. */
export const FINALE_BONES = 6;
export type Kinds = readonly BoneKind[];

// The twelve dinosaurs: facts from the Natural History Museum's Dino Directory (nhm.ac.uk/discover/dino-directory), checked October 2026.
// Lengths are NHM's adult lengths; "when" is NHM's range in millions of years; the wow line re-says one NHM fact in our words.
import type { BoneKind, Look, Teeth } from "./art";

const bnDigits = new Intl.NumberFormat("bn-BD", { useGrouping: false, maximumFractionDigits: 1 });
export const bn = (value: number) => bnDigits.format(value);

export type Diet = "plant" | "meat";
export type Era = "jurassic" | "early-cretaceous" | "late-cretaceous";
/** kind, x, y, rotation (deg), scale: where a bone sits on the skeleton, in the 240×160 drawing box. */
export type Part = readonly [BoneKind, number, number, number, number];

export type Dino = {
  id: string;
  /** what children call it */
  name: string;
  /** the scientific (genus + species) name in Bangla script, then in Latin */
  science: string;
  latin: string;
  lengthM: number;
  diet: Diet;
  teeth: Teeth;
  food: string;
  /** NHM's range, in millions of years ago: [older, younger] */
  mya: readonly [number, number];
  era: Era;
  wow: string;
  /** six bones, most important first: a round uses the first 3–6 */
  parts: readonly Part[];
  look: Look;
};

export const ERA_NAME: Record<Era, string> = { jurassic: "জুরাসিক যুগের শেষ ভাগ", "early-cretaceous": "ক্রিটেশাস যুগের প্রথম ভাগ", "late-cretaceous": "ক্রিটেশাস যুগের শেষ ভাগ" };

export const DINOS: readonly Dino[] = [
  {
    id: "trex", name: "টি-রেক্স", science: "টিরানোসরাস রেক্স", latin: "Tyrannosaurus rex", lengthM: 12, diet: "meat", teeth: "sharp",
    food: "অন্য ডাইনোসরের মাংস", mya: [68, 66], era: "late-cretaceous",
    wow: "মুখে ৬০টা দাঁত, একেকটা ২০ সেন্টিমিটার পর্যন্ত লম্বা, প্রায় একটা কলার সমান।",
    parts: [["skull", 172, 48, 0, 1], ["ribs", 106, 82, -15, 1.1], ["arm", 154, 92, 30, 0.6], ["tail", 40, 104, 8, 1], ["leg", 117, 124, 0, 0.95], ["neck", 146, 60, -35, 0.7]],
    look: {
      color: "#7cb26a", shade: "#5a8f4a", belly: "#e3efc0", accent: "#4d7d3f",
      body: [108, 84, 40, 26, -18], head: [172, 48, 27, 18, -4], neck: { from: [132, 70], via: [146, 58], to: [160, 52], w: 26 },
      tail: { from: [76, 96], via: [44, 104], to: [6, 112], w: 24 },
      legs: [{ from: [98, 96], to: [94, 144], w: 13, far: true }, { from: [114, 98], to: [120, 144], w: 17 }],
      arms: [{ from: [146, 82], to: [157, 92], w: 5 }],
      extras: [{ k: "spot", at: [100, 70], r: 3 }, { k: "spot", at: [113, 65], r: 3.5 }, { k: "spot", at: [88, 78], r: 2.5 }],
    },
  },
  {
    id: "triceratops", name: "ট্রাইসেরাটপস", science: "ট্রাইসেরাটপস হরিডাস", latin: "Triceratops horridus", lengthM: 9, diet: "plant", teeth: "beak",
    food: "ঝোপঝাড় আর নিচু গাছের পাতা", mya: [68, 66], era: "late-cretaceous",
    wow: "মাথায় তিনটা শিং। ঘাড়ের ঢালটা প্রায় এক মিটার চওড়া।",
    parts: [["skull", 186, 92, 0, 0.9], ["ribs", 104, 88, 0, 1.15], ["frill", 160, 62, -20, 0.9], ["tail", 36, 102, 8, 0.9], ["leg", 94, 128, 0, 0.85], ["arm", 150, 128, 0, 0.85]],
    look: {
      color: "#e2a24c", shade: "#c07e2e", belly: "#f7dfae", accent: "#d8673f",
      body: [108, 92, 50, 30, -4], head: [184, 92, 24, 17, 8], neck: { from: [146, 88], via: [158, 88], to: [170, 90], w: 22 },
      tail: { from: [62, 96], via: [34, 104], to: [8, 110], w: 22 },
      legs: [{ from: [80, 104], to: [78, 144], w: 13, far: true }, { from: [92, 108], to: [96, 146], w: 17 }, { from: [136, 106], to: [138, 144], w: 12, far: true }, { from: [146, 108], to: [150, 146], w: 15 }],
      extras: [{ k: "frill", e: [164, 72, 22, 30, -25] }, { k: "horn", from: [184, 78], to: [206, 58], w: 6 }, { k: "horn", from: [176, 78], to: [194, 58], w: 5 }, { k: "horn", from: [203, 88], to: [212, 78], w: 6 }],
    },
  },
  {
    id: "stegosaurus", name: "স্টেগোসরাস", science: "স্টেগোসরাস স্টেনপস", latin: "Stegosaurus stenops", lengthM: 9, diet: "plant", teeth: "beak",
    food: "নিচু গাছপালা", mya: [152, 145], era: "jurassic",
    wow: "এত বড় শরীর, অথচ মগজটা ছিল একটা আলুবোখারার সমান।",
    parts: [["skull", 180, 112, 0, 0.6], ["ribs", 110, 96, -6, 1.1], ["plate", 112, 54, 0, 0.85], ["tail", 38, 104, 0, 0.8], ["leg", 102, 130, 0, 0.8], ["arm", 150, 130, 0, 0.75]],
    look: {
      color: "#6aa7c9", shade: "#4a85a8", belly: "#d4ecf7", accent: "#e46c5a",
      body: [112, 94, 48, 32, -6], head: [180, 112, 16, 11, 12], neck: { from: [150, 98], via: [160, 106], to: [170, 110], w: 16 },
      tail: { from: [70, 102], via: [40, 108], to: [12, 98], w: 20 },
      legs: [{ from: [88, 110], to: [86, 146], w: 14, far: true }, { from: [100, 112], to: [104, 146], w: 18 }, { from: [136, 110], to: [138, 146], w: 12, far: true }, { from: [146, 112], to: [150, 146], w: 14 }],
      extras: [
        { k: "plate", at: [74, 80], h: 18, w: 16 }, { k: "plate", at: [90, 70], h: 24, w: 20 }, { k: "plate", at: [110, 66], h: 28, w: 22 },
        { k: "plate", at: [130, 68], h: 24, w: 20 }, { k: "plate", at: [146, 78], h: 18, w: 16 },
        { k: "horn", from: [20, 98], to: [8, 82], w: 6 }, { k: "horn", from: [28, 101], to: [20, 85], w: 6 },
      ],
    },
  },
  {
    id: "brachiosaurus", name: "ব্র্যাকিওসরাস", science: "ব্র্যাকিওসরাস অ্যালটিথোরাক্স", latin: "Brachiosaurus altithorax", lengthM: 22, diet: "plant", teeth: "flat",
    food: "উঁচু গাছের পাতা", mya: [152, 145], era: "jurassic",
    wow: "সামনের পা পেছনের পায়ের চেয়ে লম্বা, তাই উঁচু গাছের মাথায় মুখ পৌঁছাত।",
    parts: [["skull", 176, 20, 0, 0.6], ["ribs", 98, 96, -10, 1.05], ["neck", 148, 54, -60, 0.85], ["tail", 36, 112, 10, 0.8], ["leg", 90, 132, 0, 0.75], ["arm", 136, 126, 0, 0.85]],
    look: {
      color: "#b38fd0", shade: "#8f6cae", belly: "#eadcf5", accent: "#8f6cae",
      body: [100, 98, 44, 28, -12], head: [176, 20, 17, 11, 0], neck: { from: [130, 84], via: [150, 52], to: [166, 24], w: 18 },
      tail: { from: [62, 106], via: [36, 116], to: [8, 124], w: 18 },
      legs: [{ from: [76, 112], to: [74, 146], w: 13, far: true }, { from: [88, 114], to: [90, 146], w: 16 }, { from: [122, 100], to: [124, 146], w: 13, far: true }, { from: [132, 102], to: [136, 146], w: 16 }],
      extras: [{ k: "spot", at: [92, 82], r: 3 }, { k: "spot", at: [106, 80], r: 3.5 }, { k: "spot", at: [80, 90], r: 2.5 }],
    },
  },
  {
    id: "diplodocus", name: "ডিপ্লোডোকাস", science: "ডিপ্লোডোকাস কার্নেগি", latin: "Diplodocus carnegii", lengthM: 26, diet: "plant", teeth: "flat",
    food: "নরম গাছপালা আর গাছের পাতা", mya: [152, 145], era: "jurassic",
    wow: "লেজটা চাবুকের মতো লম্বা। হাঁটার সময় লেজ মাটি থেকে উঁচু করে রাখত।",
    parts: [["skull", 206, 60, 0, 0.5], ["ribs", 110, 90, 0, 0.95], ["neck", 172, 72, -25, 0.85], ["tail", 38, 94, -5, 1], ["leg", 105, 130, 0, 0.75], ["arm", 138, 130, 0, 0.75]],
    look: {
      color: "#5fb3a3", shade: "#3f907f", belly: "#d2efe8", accent: "#3f907f",
      body: [110, 92, 38, 24, 0], head: [206, 60, 14, 9, 0], neck: { from: [138, 86], via: [170, 68], to: [196, 62], w: 14 },
      tail: { from: [76, 94], via: [40, 98], to: [2, 82], w: 18 },
      legs: [{ from: [94, 104], to: [92, 146], w: 12, far: true }, { from: [102, 106], to: [104, 146], w: 15 }, { from: [126, 104], to: [128, 146], w: 11, far: true }, { from: [134, 106], to: [138, 146], w: 14 }],
      extras: [{ k: "spot", at: [104, 76], r: 3 }, { k: "spot", at: [118, 75], r: 3 }],
    },
  },
  {
    id: "velociraptor", name: "ভেলোসিরাপ্টর", science: "ভেলোসিরাপ্টর মঙ্গোলিয়েনসিস", latin: "Velociraptor mongoliensis", lengthM: 1.8, diet: "meat", teeth: "sharp",
    food: "অন্য প্রাণী", mya: [74, 70], era: "late-cretaceous",
    wow: "গায়ে পালক ছিল। ওজন মাত্র ৭ কেজি, পায়ে একটা বাঁকা নখ।",
    parts: [["skull", 166, 54, 0, 0.7], ["ribs", 110, 86, -15, 0.8], ["claw", 128, 138, 0, 0.6], ["tail", 44, 92, 0, 0.8], ["leg", 115, 112, 0, 0.7], ["arm", 146, 94, 40, 0.5]],
    look: {
      color: "#c98a5b", shade: "#a66b40", belly: "#f3dcc3", accent: "#3f8fd0",
      body: [110, 88, 32, 18, -15], head: [164, 54, 19, 11, -5], neck: { from: [132, 78], via: [142, 64], to: [152, 58], w: 14 },
      tail: { from: [84, 96], via: [50, 92], to: [14, 86], w: 14 },
      legs: [{ from: [104, 98], to: [100, 144], w: 9, far: true }, { from: [116, 98], to: [120, 144], w: 12 }],
      arms: [{ from: [136, 84], to: [148, 98], w: 5 }],
      extras: [
        { k: "fan", e: [24, 86, 16, 7, -5] }, { k: "feather", from: [136, 86], to: [150, 101], w: 8 },
        { k: "feather", from: [156, 46], to: [148, 36], w: 3 }, { k: "feather", from: [161, 45], to: [158, 34], w: 3 },
        { k: "horn", from: [124, 142], to: [131, 130], w: 4 },
      ],
    },
  },
  {
    id: "ankylosaurus", name: "অ্যাঙ্কিলোসরাস", science: "অ্যাঙ্কিলোসরাস ম্যাগনিভেন্ট্রিস", latin: "Ankylosaurus magniventris", lengthM: 8, diet: "plant", teeth: "flat",
    food: "নিচু গাছপালা", mya: [68, 66], era: "late-cretaceous",
    wow: "লেজের আগায় হাড়ের মুগুর। ডানে-বাঁয়ে জোরে দোলাতে পারত।",
    parts: [["skull", 180, 106, 0, 0.6], ["ribs", 110, 98, 0, 1.1], ["club", 16, 110, 0, 0.7], ["tail", 46, 110, 0, 0.75], ["leg", 96, 134, 0, 0.6], ["arm", 148, 134, 0, 0.6]],
    look: {
      color: "#a8925f", shade: "#7f6b40", belly: "#e8dcb8", accent: "#6b5a34",
      body: [110, 102, 52, 24, 0], head: [178, 110, 17, 13, 0], neck: { from: [154, 106], via: [162, 108], to: [168, 110], w: 18 },
      tail: { from: [64, 106], via: [40, 112], to: [18, 112], w: 14 },
      legs: [{ from: [84, 116], to: [82, 146], w: 14, far: true }, { from: [94, 118], to: [96, 146], w: 16 }, { from: [134, 116], to: [136, 146], w: 13, far: true }, { from: [144, 118], to: [148, 146], w: 15 }],
      extras: [
        { k: "club", e: [14, 112, 12, 9, 0] },
        { k: "bump", at: [76, 86], r: 5 }, { k: "bump", at: [92, 81], r: 5.5 }, { k: "bump", at: [110, 79], r: 6 }, { k: "bump", at: [128, 80], r: 5.5 }, { k: "bump", at: [144, 85], r: 5 },
        { k: "bump", at: [84, 95], r: 3.5 }, { k: "bump", at: [101, 91], r: 3.5 }, { k: "bump", at: [119, 91], r: 3.5 }, { k: "bump", at: [136, 94], r: 3.5 },
      ],
    },
  },
  {
    id: "spinosaurus", name: "স্পাইনোসরাস", science: "স্পাইনোসরাস ইজিপটিয়াকাস", latin: "Spinosaurus aegyptiacus", lengthM: 14, diet: "meat", teeth: "sharp",
    food: "মাছ, হয়তো অন্য ডাইনোসরও", mya: [99, 94], era: "late-cretaceous",
    wow: "পিঠে প্রায় দেড় মিটার উঁচু পাল, নৌকার পালের মতো।",
    parts: [["skull", 176, 62, 0, 0.85], ["ribs", 106, 88, -10, 1], ["sail", 106, 44, 0, 1], ["tail", 40, 102, 0, 0.9], ["leg", 112, 124, 0, 0.8], ["arm", 148, 92, 40, 0.5]],
    look: {
      color: "#6c8fd6", shade: "#4c6fb4", belly: "#d9e4f8", accent: "#f0a04b",
      body: [106, 86, 40, 24, -10], head: [176, 62, 28, 11, 4], neck: { from: [134, 76], via: [146, 66], to: [158, 62], w: 18 },
      tail: { from: [72, 94], via: [40, 104], to: [6, 104], w: 18 },
      legs: [{ from: [96, 98], to: [92, 144], w: 12, far: true }, { from: [110, 100], to: [114, 144], w: 15 }],
      arms: [{ from: [138, 84], to: [150, 95], w: 6 }],
      extras: [{ k: "sail", x1: 72, x2: 140, y: 78, h: 40 }],
    },
  },
  {
    id: "iguanodon", name: "ইগুয়ানোডন", science: "ইগুয়ানোডন বার্নিসার্টেনসিস", latin: "Iguanodon bernissartensis", lengthM: 10, diet: "plant", teeth: "beak",
    food: "গাছপালা", mya: [140, 110], era: "early-cretaceous",
    wow: "হাতের বুড়ো আঙুলে ধারালো কাঁটা। বিপদে হয়তো সেটা দিয়েই নিজেকে বাঁচাত।",
    parts: [["skull", 168, 54, 0, 0.75], ["ribs", 108, 88, -14, 1], ["claw", 156, 106, 0, 0.5], ["tail", 44, 104, 0, 0.85], ["leg", 115, 126, 0, 0.85], ["neck", 145, 66, -40, 0.6]],
    look: {
      color: "#d9b44a", shade: "#b28f2a", belly: "#f5e6b0", accent: "#b28f2a",
      body: [108, 88, 40, 26, -14], head: [168, 54, 20, 13, 10], neck: { from: [134, 76], via: [146, 64], to: [156, 58], w: 18 },
      tail: { from: [76, 98], via: [44, 106], to: [8, 108], w: 20 },
      legs: [{ from: [98, 100], to: [94, 146], w: 13, far: true }, { from: [112, 102], to: [116, 146], w: 17 }],
      arms: [{ from: [140, 86], to: [150, 116], w: 8 }],
      extras: [{ k: "horn", from: [149, 110], to: [158, 98], w: 5 }, { k: "spot", at: [100, 74], r: 3 }, { k: "spot", at: [114, 70], r: 3 }],
    },
  },
  {
    id: "parasaurolophus", name: "প্যারাসরোলোফাস", science: "প্যারাসরোলোফাস ওয়াকেরি", latin: "Parasaurolophus walkeri", lengthM: 9, diet: "plant", teeth: "beak",
    food: "পাইনের সরু পাতা আর গাছের পাতা", mya: [77, 73], era: "late-cretaceous",
    wow: "মাথার ঝুঁটি ভেতরে ফাঁপা। বাতাস ঠেলে হয়তো ভেঁপুর মতো ডাকত।",
    parts: [["skull", 170, 56, 0, 0.75], ["ribs", 108, 88, -10, 1], ["crest", 138, 30, 0, 0.8], ["tail", 44, 102, 0, 0.85], ["leg", 115, 126, 0, 0.85], ["arm", 144, 100, 20, 0.5]],
    look: {
      color: "#e07f6b", shade: "#bf5f4b", belly: "#fadccf", accent: "#8b5fbf",
      body: [108, 88, 40, 26, -10], head: [170, 56, 20, 13, 6], neck: { from: [134, 76], via: [148, 62], to: [158, 58], w: 18 },
      tail: { from: [76, 98], via: [44, 104], to: [8, 104], w: 20 },
      legs: [{ from: [98, 100], to: [94, 146], w: 13, far: true }, { from: [112, 102], to: [116, 146], w: 17 }],
      arms: [{ from: [138, 86], to: [146, 110], w: 7 }],
      extras: [{ k: "crest", from: [164, 48], via: [142, 30], to: [116, 30], w: 9 }],
    },
  },
  {
    id: "allosaurus", name: "অ্যালোসরাস", science: "অ্যালোসরাস ফ্র্যাজিলিস", latin: "Allosaurus fragilis", lengthM: 9.7, diet: "meat", teeth: "sharp",
    food: "অন্য ডাইনোসরের মাংস", mya: [152, 145], era: "jurassic",
    wow: "দাঁতের ধার করাতের মতো খাঁজকাটা। চোখের ওপর ছোট্ট দুটো শিং।",
    parts: [["skull", 170, 48, 0, 0.95], ["ribs", 106, 82, -14, 1], ["claw", 152, 96, 30, 0.5], ["tail", 40, 100, 0, 0.9], ["leg", 117, 124, 0, 0.85], ["neck", 145, 60, -40, 0.7]],
    look: {
      color: "#c86a5a", shade: "#a04c40", belly: "#f4d0c4", accent: "#f2c94c",
      body: [108, 84, 40, 24, -14], head: [170, 48, 25, 15, -2], neck: { from: [132, 70], via: [146, 58], to: [158, 52], w: 22 },
      tail: { from: [76, 94], via: [44, 100], to: [6, 104], w: 20 },
      legs: [{ from: [98, 96], to: [94, 144], w: 13, far: true }, { from: [112, 98], to: [118, 144], w: 16 }],
      arms: [{ from: [140, 80], to: [152, 96], w: 6 }],
      extras: [{ k: "horn", from: [168, 36], to: [172, 26], w: 7 }, { k: "spot", at: [98, 72], r: 3 }, { k: "spot", at: [110, 68], r: 3 }, { k: "spot", at: [122, 68], r: 2.5 }],
    },
  },
  {
    id: "pachycephalosaurus", name: "প্যাকিসেফালোসরাস", science: "প্যাকিসেফালোসরাস ওয়াইয়োমিংজেনসিস", latin: "Pachycephalosaurus wyomingensis", lengthM: 3, diet: "plant", teeth: "flat",
    food: "পাতা, ফল আর বীজ", mya: [69, 66], era: "late-cretaceous",
    wow: "মাথার ওপর মোটা হাড়ের গম্বুজ, ঠিক হেলমেটের মতো।",
    parts: [["dome", 160, 52, 0, 0.7], ["ribs", 108, 90, -10, 0.85], ["tail", 48, 102, 0, 0.8], ["leg", 114, 126, 0, 0.8], ["arm", 140, 96, 30, 0.45], ["neck", 140, 70, -40, 0.5]],
    look: {
      color: "#d98fb4", shade: "#b56f92", belly: "#f8deea", accent: "#eed9b4",
      body: [108, 90, 34, 22, -10], head: [160, 62, 18, 14, 0], neck: { from: [130, 80], via: [140, 70], to: [150, 66], w: 16 },
      tail: { from: [80, 98], via: [50, 104], to: [16, 106], w: 16 },
      legs: [{ from: [100, 100], to: [96, 146], w: 12, far: true }, { from: [112, 102], to: [116, 146], w: 15 }],
      arms: [{ from: [132, 86], to: [140, 98], w: 5 }],
      extras: [{ k: "dome", e: [158, 50, 16, 12, 0] }, { k: "bump", at: [143, 54], r: 3 }, { k: "bump", at: [148, 44], r: 3 }, { k: "bump", at: [172, 46], r: 3 }],
    },
  },
];

export const dinoOf = (id: string) => DINOS.find(dino => dino.id === id);

/** 66 → "৬ কোটি ৬০ লাখ": millions of years, said the Bangla way. */
export function croreLakh(millions: number) {
  const crore = Math.floor(millions / 10), lakh = Math.round((millions % 10) * 10);
  return [crore ? `${bn(crore)} কোটি` : "", lakh ? `${bn(lakh)} লাখ` : ""].filter(Boolean).join(" ");
}

/** "৬ কোটি ৬০ লাখ বছরেরও আগে": the younger end of NHM's range, so the line is always true. */
export const whenLine = (dino: Dino) => `${croreLakh(dino.mya[1])} বছরেরও আগে, ${ERA_NAME[dino.era]}`;

export const BUS_M = 12;
export const RICKSHAW_M = 2.5;

/** Length against things a child has seen: a rickshaw for the small ones, a 12 m bus for the rest. */
export function sizeLine(lengthM: number) {
  const m = `লম্বায় ${bn(lengthM)} মিটার`;
  if (lengthM < RICKSHAW_M) return `${m}, একটা রিকশার চেয়েও ছোট।`;
  if (lengthM < 4) return `${m}, প্রায় একটা রিকশার সমান।`;
  if (lengthM < 11) return `${m}। একটা বড় বাস ১২ মিটার।`;
  if (lengthM <= 13) return `${m}, একটা বড় বাসের সমান।`;
  if (lengthM < 18) return `${m}, একটা বাসের চেয়েও লম্বা।`;
  if (lengthM < 24) return `${m}, প্রায় দুটো বাসের সমান।`;
  return `${m}, দুটো বাসের চেয়েও লম্বা।`;
}

/**
 * One scale for the size picture (units per metre): enough buses or rickshaws to cover the dinosaur, across 280 units at most,
 * and never so zoomed that a vehicle stands taller than the picture (a rickshaw is about as tall as it is long).
 */
export function sizeScale(lengthM: number) {
  const small = lengthM < 4, unit = small ? RICKSHAW_M : BUS_M, count = Math.max(1, Math.ceil(lengthM / unit - 0.05));
  return { kind: small ? "rickshaw" as const : "bus" as const, unit, count, scale: Math.min(280 / Math.max(lengthM, unit * count), small ? 30 : 280 / BUS_M) };
}

export const DIET_NAME: Record<Diet, string> = { plant: "পাতা খেত", meat: "মাংস খেত" };
export const DIET_WORD: Record<Diet, string> = { plant: "তৃণভোজী", meat: "মাংসাশী" };

/** After a wrong sort: look at the mouth. */
export function teethHint(teeth: Teeth) {
  if (teeth === "sharp") return "দাঁতগুলো দেখো: ছুরির মতো ধারালো, মাংস কাটার দাঁত।";
  if (teeth === "beak") return "মুখটা দেখো: পাখির মতো ঠোঁট, পাতা ছেঁড়ার জন্য।";
  return "দাঁতগুলো দেখো: ছোট আর ভোঁতা, পাতা চিবানোর দাঁত।";
}

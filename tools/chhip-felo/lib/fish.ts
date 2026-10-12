// The game's own 20 fish, the three places and the album kept on this phone. Pure: no React, no browser.
/** 0 সাধারণ, 1 মাঝে মাঝে, 2 দুর্লভ */
export type Rarity = 0 | 1 | 2;
export type Look = {
  body: string; belly: string; fin: string;
  /** length ÷ height */
  long: number;
  mark?: "bars" | "stripe" | "dots";
  markColor?: string;
  /** a dark spot near the tail or behind the gill */
  spot?: "tail" | "gill";
  whiskers?: 2 | 4;
  tail: "fork" | "round";
  /** a humped back (চিতল) */
  hump?: number;
  /** a big head and mouth (কাতলা, বোয়াল) */
  head?: number;
};
export type Fish = { id: string; name: string; places: readonly number[]; rarity: Rarity; chance: number; grams: readonly [number, number]; note: string; look: Look };

export const PLACES = [
  { name: "পুকুর", at: "পুকুরে", of: "পুকুরের", long: "বাড়ির পুকুরের", need: 0 },
  { name: "বিল", at: "বিলে", of: "বিলের", long: "বিলের ধারের", need: 4 },
  { name: "নদী", at: "নদীতে", of: "নদীর", long: "নদীর ঘাটের", need: 10 },
] as const;

export const RARITY = ["সাধারণ", "মাঝে মাঝে ওঠে", "দুর্লভ"] as const;

export const FISH: readonly Fish[] = [
  { id: "punti", name: "পুঁটি", places: [0, 1], rarity: 0, chance: 30, grams: [25, 80], note: "ছোট, চকচকে। পুকুরে সবার আগে এটাই ঠোকরায়।",
    look: { body: "#b9c6c9", belly: "#f2f4f0", fin: "#e0623f", long: 2.5, spot: "tail", tail: "fork" } },
  { id: "telapia", name: "তেলাপিয়া", places: [0], rarity: 0, chance: 24, grams: [150, 450], note: "পুকুরে সবচেয়ে বেশি দেখা যায়। টোপ খেতে ওস্তাদ।",
    look: { body: "#71836f", belly: "#c8cdbb", fin: "#93645a", long: 2.3, mark: "bars", markColor: "#55654f", tail: "round" } },
  { id: "koi", name: "কই", places: [0, 1], rarity: 0, chance: 18, grams: [60, 180], note: "শক্ত প্রাণ। কানকোয় ভর দিয়ে ডাঙায়ও খানিক এগোতে পারে।",
    look: { body: "#857f43", belly: "#d9c886", fin: "#6b6633", long: 2.6, mark: "dots", markColor: "#5b5728", spot: "gill", tail: "round" } },
  { id: "taki", name: "টাকি", places: [0, 1], rarity: 0, chance: 20, grams: [100, 350], note: "দেখতে শোলের ছোট ভাই। টাকি ভর্তা চেনো তো?",
    look: { body: "#5c6157", belly: "#b6b5a4", fin: "#4b4f46", long: 4.6, mark: "bars", markColor: "#3e423a", tail: "round" } },
  { id: "shing", name: "শিং", places: [0, 1], rarity: 1, chance: 11, grams: [80, 250], note: "শুঁড়ওয়ালা মাছ। গায়ে কাঁটা আছে, হাতে ধরতে সাবধান।",
    look: { body: "#4d3c43", belly: "#7e6c6c", fin: "#3d3036", long: 5, whiskers: 4, tail: "round" } },
  { id: "magur", name: "মাগুর", places: [0, 1], rarity: 1, chance: 9, grams: [150, 500], note: "কাদার মধ্যে লুকিয়ে থাকে। শিংয়ের চেয়ে মোটা আর বড়।",
    look: { body: "#3f3b2f", belly: "#8a8371", fin: "#35322a", long: 4.8, whiskers: 4, tail: "round", head: 0.1 } },
  { id: "shol", name: "শোল", places: [0, 1, 2], rarity: 1, chance: 6, grams: [400, 1500], note: "লম্বা গা, মাথাটা সাপের মতো। ঘাই দেয় জোরে।",
    look: { body: "#5b5a3a", belly: "#cbc19f", fin: "#4a4930", long: 5.2, mark: "bars", markColor: "#34331f", tail: "round" } },
  { id: "rui", name: "রুই", places: [0, 2], rarity: 2, chance: 3, grams: [1000, 3500], note: "পুকুরের সবচেয়ে বড় মাছগুলোর একটা। ছিপে উঠলে পাড়ে ভিড় জমে।",
    look: { body: "#a7a29a", belly: "#ece4d8", fin: "#c9675a", long: 3, mark: "dots", markColor: "#c58f86", tail: "fork" } },
  { id: "katla", name: "কাতলা", places: [2, 0], rarity: 1, chance: 9, grams: [1500, 4500], note: "মাথাটা বড়, পিঠ চওড়া। মুড়িঘণ্টে এর মাথাই লাগে।",
    look: { body: "#6f7a80", belly: "#e2e2d9", fin: "#5c6469", long: 2.7, tail: "fork", head: 0.25 } },
  { id: "tengra", name: "টেংরা", places: [1, 2], rarity: 0, chance: 26, grams: [30, 100], note: "গায়ে লম্বা দাগ, মুখে শুঁড়। বেগুন দিয়ে টেংরার ঝোল, এক থালা ভাত শেষ।",
    look: { body: "#b8943b", belly: "#eedc9c", fin: "#8a6c25", long: 3.6, mark: "stripe", markColor: "#4a3a1f", whiskers: 4, tail: "fork" } },
  { id: "kholisha", name: "খলিসা", places: [1], rarity: 0, chance: 22, grams: [20, 60], note: "ছোট্ট, গায়ে রঙের ডোরা। বিলের পানিতে ঝাঁক বেঁধে ঘোরে।",
    look: { body: "#869d5d", belly: "#e5e2b4", fin: "#d8643a", long: 2.2, mark: "bars", markColor: "#d8643a", tail: "round" } },
  { id: "baim", name: "বাইম", places: [1, 2], rarity: 1, chance: 10, grams: [80, 300], note: "লম্বা, সরু, পিচ্ছিল। হাত থেকে পিছলে যায়।",
    look: { body: "#6a5233", belly: "#c9ad7c", fin: "#4f3c25", long: 8, mark: "dots", markColor: "#3a2c1a", tail: "round" } },
  { id: "gojar", name: "গজার", places: [1], rarity: 1, chance: 7, grams: [800, 3000], note: "শোলের জাত, আকারে অনেক বড়। বিলের গভীরে থাকে।",
    look: { body: "#3c4232", belly: "#a8a585", fin: "#30352a", long: 5, mark: "dots", markColor: "#c9803c", tail: "round" } },
  { id: "mrigel", name: "মৃগেল", places: [1, 2], rarity: 1, chance: 8, grams: [700, 2500], note: "রুই-কাতলার জাতভাই। পানির তলায় খাবার খোঁজে।",
    look: { body: "#99a0a1", belly: "#e8e8e2", fin: "#b37070", long: 3.4, tail: "fork" } },
  { id: "pabda", name: "পাবদা", places: [2, 1], rarity: 0, chance: 20, grams: [60, 180], note: "নরম মাংস, কাঁটা কম। সরষে-পাবদা অনেকের প্রিয়।",
    look: { body: "#d6cdc4", belly: "#f4efe8", fin: "#c2b3a6", long: 3.8, spot: "gill", whiskers: 2, tail: "fork" } },
  { id: "boal", name: "বোয়াল", places: [1, 2], rarity: 2, chance: 3, grams: [1500, 5000], note: "মুখটা বিশাল, গোঁফ লম্বা। একা তোলা কঠিন।",
    look: { body: "#6b6b68", belly: "#d9d8cf", fin: "#545451", long: 5, whiskers: 2, tail: "fork", head: 0.3 } },
  { id: "bata", name: "বাটা", places: [2], rarity: 0, chance: 24, grams: [100, 300], note: "নদীর ছোট রুপালি মাছ। ভাজা খেতে মজা।",
    look: { body: "#b6bfbf", belly: "#eef1ef", fin: "#cf9f9c", long: 3.1, tail: "fork" } },
  { id: "air", name: "আইড়", places: [2], rarity: 1, chance: 8, grams: [800, 3500], note: "লম্বা গোঁফওয়ালা নদীর মাছ। বড় নদীতে বড় হয়।",
    look: { body: "#88898a", belly: "#e0dfd8", fin: "#6f7070", long: 5, whiskers: 4, tail: "fork" } },
  { id: "chitol", name: "চিতল", places: [2], rarity: 2, chance: 4, grams: [1500, 4500], note: "পিঠ কুঁজো, গায়ে গোল ছোপ। চিতলের মুইঠ্যা বানাতে ধৈর্য লাগে।",
    look: { body: "#b9bcbd", belly: "#eceae4", fin: "#9a9c9d", long: 4.2, mark: "dots", markColor: "#4a4d50", tail: "round", hump: 0.35 } },
  { id: "ilish", name: "ইলিশ", places: [2], rarity: 2, chance: 3, grams: [600, 1600], note: "জালেই বেশি ওঠে। ছিপে উঠলে গল্প করার মতো ব্যাপার।",
    look: { body: "#c4ccd6", belly: "#f3f4f8", fin: "#a9b1bf", long: 3.4, spot: "gill", tail: "fork" } },
];

export const FISH_COUNT = FISH.length;
export const MAX_GRAMS = 5000;
export const fishIn = (place: number) => FISH.map((_, index) => index).filter(index => FISH[index].places.includes(place));

/** How much a cast near the bubbles (accuracy 0..1) tilts the odds towards rarer fish. */
const LUCK = [0, 1.5, 4];

/** The fish that bites: weighted by chance, rarer ones likelier the closer the cast landed to the bubbles. */
export function rollFish(place: number, accuracy: number, rng: () => number) {
  const pool = fishIn(place);
  let total = 0;
  for (const index of pool) total += FISH[index].chance * (1 + accuracy * LUCK[FISH[index].rarity]);
  let roll = rng() * total;
  for (const index of pool) {
    roll -= FISH[index].chance * (1 + accuracy * LUCK[FISH[index].rarity]);
    if (roll < 0) return index;
  }
  return pool[pool.length - 1];
}

/** Its weight, to the nearest 10 g: a good cast leans to the heavy end. */
export function rollGrams(fish: number, accuracy: number, rng: () => number) {
  const [min, max] = FISH[fish].grams;
  const x = Math.min(1, rng() * 0.7 + accuracy * 0.3);
  return Math.round((min + (max - min) * x ** 1.3) / 10) * 10;
}

/** How hard a fish fights, 0 (a 50 g পুঁটি) to 1 (a 5 kg বোয়াল). */
export const fight = (grams: number) => Math.max(0, Math.min(1, Math.log10(Math.max(50, grams) / 50) / 2));

/** The album: fish id → the heaviest one caught, in grams. */
export type Album = Record<string, number>;

export function parseAlbum(raw: string | null): Album {
  const album: Album = {};
  try {
    const parsed = JSON.parse(raw ?? "{}");
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) return album;
    for (const fish of FISH) {
      const grams = Number(parsed[fish.id]);
      if (Object.hasOwn(parsed, fish.id) && Number.isInteger(grams) && grams >= 1 && grams <= MAX_GRAMS) album[fish.id] = grams;
    }
  } catch { /* broken JSON: start a fresh album */ }
  return album;
}

export function addCatch(album: Album, fish: number, grams: number) {
  const id = FISH[fish].id, before = album[id] ?? 0;
  return { album: { ...album, [id]: Math.max(before, grams) }, isNew: !before, isRecord: before > 0 && grams > before };
}

export const albumCount = (album: Album) => FISH.filter(fish => album[fish.id]).length;
export const placeOpen = (place: number, count: number) => count >= PLACES[place].need;

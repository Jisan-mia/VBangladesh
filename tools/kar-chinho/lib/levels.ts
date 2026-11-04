// The levels as data: four worlds grouped by where the sign sits, fourteen levels of ten picture words.
// Level ids 1–11 keep their old meaning, so saved stars and ?print=N links still point at the same words; the three
// world finales are ids 12–14. ORDER is the play order the list shows (১–১৪).
// Spellings follow the Bangla Academy প্রমিত বানান: non-তৎসম words take ি/ু (পাখি, বাড়ি, মুলা), তৎসম keep ী/ূ (নদী, সূর্য).
import { word as w, type Item, type Kar } from "./words";

export type WorldId = 0 | 1 | 2 | 3;
export type World = { id: WorldId; name: string; place: string; signs: readonly Kar[] };

export const WORLDS: readonly World[] = [
  { id: 0, name: "পাশে বসে", place: "ভোরের উঠান", signs: ["া", "ি", "ী"] },
  { id: 1, name: "নিচে বসে", place: "মাঠ", signs: ["ু", "ূ", "ৃ"] },
  { id: 2, name: "দুই পাশে", place: "নদী", signs: ["ে", "ৈ", "ো", "ৌ"] },
  { id: 3, name: "মেলা", place: "মেলা", signs: ["া", "ি", "ী", "ু", "ূ", "ৃ", "ে", "ৈ", "ো", "ৌ"] },
];

/**
 * One level. `kar` is the one sign it teaches (null for a finale). `pool` is the set of signs a finale's tiles come from
 * before any look-alike, so a finale asks "which of these three?" and never brings in a sign from another world first.
 */
export type Level = { id: number; world: WorldId; kar: Kar | null; title: string; finale?: string; base: number; pool?: readonly Kar[]; items: readonly Item[] };

// Focus words first, then a few from the level before, so ি sits next to ী and ে next to ৈ.
const BY_ID: readonly Level[] = [
  { id: 1, world: 0, kar: "া", title: "আ-কার", base: 2, items: [
    w("মাছ", "hilsa", "া"), w("কলা", "banana", "া"), w("হাতি", "elephant", "া"), w("ছাতা", "umbrella", "া"), w("থালা", "plate", "া"),
    w("বাঘ", "tiger", "া"), w("ডাব", "coconut", "া"), w("জাহাজ", "ship", "া"), w("ধান", "paddy", "া"), w("পানি", "water", "া"),
  ] },
  { id: 2, world: 0, kar: "ি", title: "ই-কার", base: 2, items: [
    w("ঘুড়ি", "kite", "ি"), w("টিয়া", "parrot", "ি"), w("ঘড়ি", "clock", "ি"), w("ঝিনুক", "shell", "ি"), w("হরিণ", "deer", "ি"),
    w("রিকশা", "rickshaw", "ি"), w("হাতি", "elephant", "ি"), w("পানি", "water", "ি"), w("লাটিম", "top", "ি"), w("বিড়াল", "cat", "ি"),
  ] },
  { id: 3, world: 0, kar: "ী", title: "ঈ-কার", base: 3, items: [
    w("নদী", "river", "ী"), w("তীর", "arrow", "ী"), w("বীজ", "seeds", "ী"), w("পৃথিবী", "earth", "ী"),
    w("টিয়া", "parrot", "ি"), w("রিকশা", "rickshaw", "ি"), w("হরিণ", "deer", "ি"), w("ঘুড়ি", "kite", "ি"), w("লাটিম", "top", "ি"), w("বিড়াল", "cat", "ি"),
  ] },
  { id: 4, world: 1, kar: "ু", title: "উ-কার", base: 3, items: [
    w("ঘুড়ি", "kite", "ু"), w("গরু", "cow", "ু"), w("ফুল", "flower", "ু"), w("ঝিনুক", "shell", "ু"), w("তরমুজ", "watermelon", "ু"),
    w("মুলা", "radish", "ু", 0, ["ূ"]), w("কুকুর", "dog", "ু"), w("জুতা", "shoes", "ু"), w("লিচু", "litchi", "ু"), w("আলু", "potato", "ু"),
  ] },
  { id: 5, world: 1, kar: "ূ", title: "ঊ-কার", base: 3, items: [
    w("ময়ূর", "peacock", "ূ"), w("সূর্য", "sun", "ূ"), w("নূপুর", "anklet", "ূ"), w("ধূমকেতু", "comet", "ূ"),
    w("গরু", "cow", "ু"), w("ফুল", "flower", "ু"), w("তরমুজ", "watermelon", "ু"), w("মুলা", "radish", "ু", 0, ["ূ"]), w("কুকুর", "dog", "ু"), w("আলু", "potato", "ু"),
  ] },
  { id: 6, world: 1, kar: "ৃ", title: "ঋ-কার", base: 3, items: [
    w("বৃষ্টি", "rain", "ৃ"), w("পৃথিবী", "earth", "ৃ"), w("কৃষক", "farmer", "ৃ"), w("হৃদয়", "heart", "ৃ"), w("বৃত্ত", "circle", "ৃ"),
    w("ঘুড়ি", "kite", "ু"), w("ময়ূর", "peacock", "ূ"), w("সূর্য", "sun", "ূ"), w("জুতা", "shoes", "ু"), w("লিচু", "litchi", "ু"),
  ] },
  { id: 7, world: 2, kar: "ে", title: "এ-কার", base: 3, items: [
    w("পেঁপে", "papaya", "ে", 1), w("ভেড়া", "sheep", "ে"), w("সাইকেল", "cycle", "ে"), w("টমেটো", "tomato", "ে"), w("বেল", "woodapple", "ে"),
    w("বেলুন", "balloon", "ে"), w("মেঘ", "cloud", "ে"), w("ঢেউ", "wave", "ে"), w("বেগুন", "brinjal", "ে"), w("দোয়েল", "magpie", "ে"),
  ] },
  { id: 8, world: 2, kar: "ৈ", title: "ঐ-কার", base: 3, items: [
    w("বৈঠা", "oar", "ৈ"), w("সৈকত", "beach", "ৈ"), w("শৈবাল", "algae", "ৈ"),
    w("ভেড়া", "sheep", "ে"), w("বেল", "woodapple", "ে"), w("বেলুন", "balloon", "ে"), w("মেঘ", "cloud", "ে"), w("ঢেউ", "wave", "ে"), w("বেগুন", "brinjal", "ে"), w("সাইকেল", "cycle", "ে"),
  ] },
  { id: 9, world: 2, kar: "ো", title: "ও-কার", base: 3, items: [
    w("ঢোল", "drum", "ো"), w("দোয়েল", "magpie", "ো"), w("খরগোশ", "rabbit", "ো"), w("টমেটো", "tomato", "ো"), w("মোরগ", "rooster", "ো"),
    w("বোতল", "bottle", "ো"), w("ঘোড়া", "horse", "ো"), w("চোখ", "eye", "ো"), w("গোলাপ", "rose", "ো"), w("মোমবাতি", "candle", "ো"),
  ] },
  { id: 10, world: 2, kar: "ৌ", title: "ঔ-কার", base: 3, items: [
    w("নৌকা", "boat", "ৌ"), w("মৌমাছি", "bee", "ৌ"), w("মৌচাক", "hive", "ৌ"), w("কৌটা", "tin", "ৌ"), w("চৌকি", "cot", "ৌ"),
    w("ঢোল", "drum", "ো"), w("দোয়েল", "magpie", "ো"), w("খরগোশ", "rabbit", "ো"), w("মোরগ", "rooster", "ো"), w("ঘোড়া", "horse", "ো"),
  ] },
  { id: 11, world: 3, kar: null, title: "সব কার", finale: "সব কার একসাথে", base: 4, items: [
    w("শাপলা", "lily", "া"), w("মৌমাছি", "bee", "ি"), w("পৃথিবী", "earth", "ী"), w("ঝিনুক", "shell", "ু"), w("নূপুর", "anklet", "ূ"),
    w("কৃষক", "farmer", "ৃ"), w("সাইকেল", "cycle", "ে"), w("বৈঠা", "oar", "ৈ"), w("গোলাপ", "rose", "ো"), w("চৌকি", "cot", "ৌ"),
  ] },
  { id: 12, world: 0, kar: null, title: "নদীর ধারে", finale: "নদীর ধারে", base: 3, pool: WORLDS[0].signs, items: [
    w("নদী", "river", "ী"), w("মাছ", "hilsa", "া"), w("ঝিনুক", "shell", "ি"), w("জাহাজ", "ship", "া"), w("তীর", "arrow", "ী"),
    w("হরিণ", "deer", "ি"), w("ধান", "paddy", "া"), w("বীজ", "seeds", "ী"), w("টিয়া", "parrot", "ি"), w("ডাব", "coconut", "া"),
  ] },
  { id: 13, world: 1, kar: null, title: "গ্রামের মাঠ", finale: "গ্রামের মাঠ", base: 3, pool: WORLDS[1].signs, items: [
    w("কৃষক", "farmer", "ৃ"), w("গরু", "cow", "ু"), w("সূর্য", "sun", "ূ"), w("ফুল", "flower", "ু"), w("বৃষ্টি", "rain", "ৃ"),
    w("ময়ূর", "peacock", "ূ"), w("কুকুর", "dog", "ু"), w("পৃথিবী", "earth", "ৃ"), w("নূপুর", "anklet", "ূ"), w("মুলা", "radish", "ু", 0, ["ূ"]),
  ] },
  { id: 14, world: 2, kar: null, title: "নৌকাবাইচ", finale: "নৌকাবাইচ", base: 4, pool: WORLDS[2].signs, items: [
    w("নৌকা", "boat", "ৌ"), w("বৈঠা", "oar", "ৈ"), w("ঢোল", "drum", "ো"), w("ঢেউ", "wave", "ে"), w("মৌমাছি", "bee", "ৌ"),
    w("সৈকত", "beach", "ৈ"), w("দোয়েল", "magpie", "ো"), w("মেঘ", "cloud", "ে"), w("শৈবাল", "algae", "ৈ"), w("বোতল", "bottle", "ো"),
  ] },
];

/** Every level id, 1–14. Stars are saved by id. */
export const LEVEL_COUNT = BY_ID.length;
/** The id of the সব কার level, the grand finale (also the ?print default). */
export const ALL_SIGNS = 11;
/** The play order, as the list numbers it ১–১৪. */
export const ORDER: readonly number[] = [1, 2, 3, 12, 4, 5, 6, 13, 7, 8, 9, 10, 14, 11];

export const isLevel = (id: number) => Number.isInteger(id) && id >= 1 && id <= LEVEL_COUNT;
export const levelOf = (id: number): Level => BY_ID[(isLevel(id) ? id : 1) - 1];
/** 1-based place in the play order: the number the child sees. */
export const placeOf = (id: number) => ORDER.indexOf(levelOf(id).id) + 1;
export const worldOf = (id: number) => WORLDS[levelOf(id).world];
/** The level after this one in play order, or 0 after the last. */
export const nextInOrder = (id: number) => ORDER[placeOf(id)] ?? 0;
/** The last level of a world is its finale. */
export const isWorldEnd = (id: number) => { const at = placeOf(id); return at === ORDER.length || levelOf(ORDER[at]).world !== levelOf(id).world; };
export const levelsOfWorld = (world: WorldId) => ORDER.filter(id => levelOf(id).world === world);

/** The first level in play order with no stars yet; once every level has stars, the first one. */
export const nextToPlay = (stars: Record<number, number>) => ORDER.find(id => !stars[id]) ?? ORDER[0];

/** The signs a level is about, on dotted circles: "◌া" for a level, "◌া ◌ি ◌ী" for a finale. */
export const signsOf = (id: number): readonly Kar[] => { const level = levelOf(id); return level.kar ? [level.kar] : level.pool ?? WORLDS[3].signs; };

/** `?print=4` → 4; a bare or odd `?print` gives the সব কার sheet with every sign. */
export function printLevel(value: string | null) {
  const level = Number(value);
  return value !== null && value !== "" && isLevel(level) ? level : ALL_SIGNS;
}

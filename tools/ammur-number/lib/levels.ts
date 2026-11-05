// The levels as data: three worlds, nine levels, each with one new idea. Ids 1–4 are the four old ধাপ (so stars saved before the
// rewrite keep their meaning: 1 copy, 2 the old piece hides, 3 look then hide, 4 the whole number from memory); 5–9 are new.
// ORDER is the order the list shows (১–৯). Pieces are how the number grows (০১৭ → ০১৭১২ → …); a piece is dialled again from its start.

export type Hide = "none" | "old" | "all";
export type WorldId = 0 | 1 | 2;
export type World = { id: WorldId; name: string; place: string };

export const WORLDS: readonly World[] = [
  { id: 0, name: "বাসায়", place: "ঘরের ফোন" },
  { id: 1, name: "মেলায়", place: "ভিড়ের মধ্যে" },
  { id: 2, name: "ঈদের বাজারে", place: "দোকানের সারি" },
];

export type Level = {
  id: number; world: WorldId; title: string;
  /** The world's finale: a name, a ring that is a bigger moment. */
  finale?: string;
  /** How the number grows: each piece is dialled from the start, and ends at this many digits. */
  pieces: readonly number[];
  hide: Hide;
  /** The digits play and light once at the start of every piece (the look). Without it the child starts from memory or from the guide. */
  show: boolean;
  /** How many looks again the round allows (the eye key); null is as many as wanted. */
  eyes: number | null;
};

export const PIECES_4 = [3, 5, 8, 11] as const;
export const PIECES_2 = [5, 11] as const;
export const PIECES_1 = [11] as const;

const BY_ID: readonly Level[] = [
  { id: 1, world: 0, title: "দেখে দেখে", pieces: PIECES_4, hide: "none", show: false, eyes: null },
  { id: 2, world: 1, title: "আগেরটুকু মনে রেখে", pieces: PIECES_4, hide: "old", show: true, eyes: null },
  { id: 3, world: 1, title: "দেখে, তারপর লুকিয়ে", pieces: PIECES_4, hide: "all", show: true, eyes: null },
  { id: 4, world: 2, title: "পুরোটা মনে থেকে", finale: "ঈদের বাজারের ফোন", pieces: PIECES_1, hide: "all", show: false, eyes: 1 },
  { id: 5, world: 0, title: "বড় টুকরো", pieces: PIECES_2, hide: "none", show: false, eyes: null },
  { id: 6, world: 0, title: "পুরোটা একবারে", finale: "বাসার ফোন", pieces: PIECES_1, hide: "none", show: false, eyes: null },
  { id: 7, world: 1, title: "বড় টুকরো, লুকিয়ে", finale: "মেলার ফোন", pieces: PIECES_2, hide: "all", show: true, eyes: null },
  { id: 8, world: 2, title: "তিনটা চোখ", pieces: PIECES_2, hide: "all", show: true, eyes: 3 },
  { id: 9, world: 2, title: "দুটো চোখ", pieces: PIECES_1, hide: "all", show: true, eyes: 2 },
];

export const LEVEL_COUNT = BY_ID.length;
/** The play order the list shows, ১–৯. */
export const ORDER: readonly number[] = [1, 5, 6, 2, 3, 7, 8, 9, 4];

export const isLevel = (id: number) => Number.isInteger(id) && id >= 1 && id <= LEVEL_COUNT;
export const levelOf = (id: number): Level => BY_ID[(isLevel(id) ? id : 1) - 1];
export const worldOf = (id: number) => WORLDS[levelOf(id).world];
/** 1-based place in the play order: the number the child sees. */
export const placeOf = (id: number) => ORDER.indexOf(levelOf(id).id) + 1;
/** The level after this one in play order, or 0 after the last. */
export const nextInOrder = (id: number) => ORDER[placeOf(id)] ?? 0;
export const isWorldEnd = (id: number) => Boolean(levelOf(id).finale);
export const levelsOfWorld = (world: WorldId) => ORDER.filter(id => levelOf(id).world === world);
/** The first level in play order with no stars yet; once every level has stars, the first one. */
export const nextToPlay = (stars: Record<number, number>) => ORDER.find(id => !stars[id]) ?? ORDER[0];
/** The digits in the whole number's last piece: the number is always 11 digits. */
export const NUMBER_LENGTH = 11;

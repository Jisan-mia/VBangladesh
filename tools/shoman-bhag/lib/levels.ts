// The levels as data: four worlds, ten levels, each teaching one new idea, each world ending in a named finale.
// Ids 1–5 keep their old meaning (1 two plates, 2 three, 3 four, 4 cutting, 5 naming), so saved stars stay true.
// 6–10 are new. ORDER is the play order the list shows (১–১০). Pure data, no React.

/** share: n plates, everyone the same. left: the same, then one piece left over: who gets it? cut: share whole রুটি, cut the last one.
 *  name: which fraction is the shaded piece? fair: which রুটি is cut into equal pieces? */
export type Kind = "share" | "left" | "cut" | "name" | "fair";
/** One serving of a round. `n` is the guests (0: 2–4 by the seed), `per` the pieces each plate gets (low, high). */
export type Slot = { kind: Kind; n?: number; per?: [number, number] };

export type WorldId = 0 | 1 | 2 | 3;
export type World = { id: WorldId; name: string; place: string };
export const WORLDS: readonly World[] = [
  { id: 0, name: "অর্ধেক", place: "হলুদ চাদর" },
  { id: 1, name: "তিন ভাগ", place: "নীল পাটি" },
  { id: 2, name: "চার ভাগ", place: "লাল পাড়" },
  { id: 3, name: "শেষ টুকরো", place: "গোলাপি মেলা" },
];

export type Level = { id: number; world: WorldId; title: string; finale?: string; slots: readonly Slot[]; mark: { parts: number; kind: "cut" | "heart" } };

const share = (n: number, per: [number, number], count = 4): Slot[] => Array.from({ length: count }, () => ({ kind: "share", n, per }));
const mix = (n: number, kinds: Kind[]): Slot[] => kinds.map(kind => ({ kind, n, per: kind === "cut" ? [1, 1] : [1, 2] }));

const BY_ID: readonly Level[] = [
  { id: 1, world: 0, title: "দুজনের ভাগ", slots: [{ kind: "share", n: 2, per: [1, 1] }, ...share(2, [1, 3], 3)], mark: { parts: 2, kind: "cut" } },
  { id: 2, world: 1, title: "তিনজনের ভাগ", slots: share(3, [1, 2]), mark: { parts: 3, kind: "cut" } },
  { id: 3, world: 2, title: "চারজনের ভাগ", slots: share(4, [1, 2]), mark: { parts: 4, kind: "cut" } },
  { id: 4, world: 2, title: "রুটি কাটা", slots: [{ kind: "cut", n: 2 }, { kind: "cut", n: 4 }, { kind: "cut", n: 3 }, { kind: "cut", n: 0 }], mark: { parts: 3, kind: "cut" } },
  { id: 5, world: 3, title: "ভাগের নাম", slots: [{ kind: "name" }, { kind: "name" }, { kind: "fair" }, { kind: "name" }], mark: { parts: 2, kind: "cut" } },
  { id: 6, world: 0, title: "দুজনের দাওয়াত", finale: "দুজনের দাওয়াত", slots: mix(2, ["share", "cut", "cut", "share", "cut", "share"]), mark: { parts: 2, kind: "cut" } },
  { id: 7, world: 1, title: "তিনজনের দাওয়াত", finale: "তিনজনের দাওয়াত", slots: mix(3, ["share", "cut", "cut", "share", "cut", "share"]), mark: { parts: 3, kind: "cut" } },
  { id: 8, world: 2, title: "চারজনের ভোজ", finale: "চারজনের ভোজ", slots: mix(4, ["share", "cut", "cut", "share", "cut", "cut"]), mark: { parts: 4, kind: "cut" } },
  { id: 9, world: 3, title: "শেষটা কে পাবে?", slots: [{ kind: "left", n: 2, per: [1, 2] }, { kind: "left", n: 3, per: [1, 2] }, { kind: "left", n: 2, per: [1, 2] }, { kind: "left", n: 3, per: [1, 2] }], mark: { parts: 0, kind: "heart" } },
  {
    id: 10, world: 3, title: "সমান ভাগের মেলা", finale: "সমান ভাগের মেলা", mark: { parts: 4, kind: "cut" },
    slots: [{ kind: "name" }, { kind: "fair" }, { kind: "left", n: 3, per: [1, 1] }, { kind: "cut", n: 4 }, { kind: "name" }, { kind: "fair" }],
  },
];

export const LEVEL_COUNT = BY_ID.length;
/** The play order, as the list numbers it ১–১০. */
export const ORDER: readonly number[] = [1, 6, 2, 7, 3, 4, 8, 9, 5, 10];

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
export const lengthOf = (id: number) => levelOf(id).slots.length;

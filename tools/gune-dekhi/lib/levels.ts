// গুনে দেখি's levels as data: three worlds, each with three steps and a named finale. The first nine ids are the old ones
// (guni 1–3, এক নজরে 4–6, কোনটায় বেশি 7–9), so saved stars keep their meaning; the three finales are new ids 10–12.
// Each level teaches one new thing and is proved by tests/levels.test.ts with headless bots.

export type Kind = "guni" | "nojor" | "beshi" | "merge";
export type WorldId = 0 | 1 | 2;
export type Look = "dots" | "dice" | "mango" | "fish";

export type Level = {
  id: number;
  world: WorldId;
  kind: Kind;
  /** The name on the card. */
  title: string;
  /** A short range or tag for the HUD and the card. */
  label: string;
  /** The one new thing this level brings, for the parent. */
  idea: string;
  /** Quantity range of the item (for beshi, the larger pond; for merge, the total). */
  min: number;
  max: number;
  /** nojor: answer with dot rows (ages 3–4) instead of numerals. */
  pictures?: boolean;
  /** nojor: two groups shown side by side (adding). */
  parts?: 2;
  /** nojor: the largest single group (a dice face). */
  group?: number;
  /** nojor: always this look (the finale is dice). */
  look?: Look;
  /** beshi: after the pond, ask how many more. */
  koto?: boolean;
  /** The finale's own name; only the last level of a world has one. */
  finale?: string;
  /** The first pond of the round is small, so the first win comes within ten seconds. */
  warm?: boolean;
};

export const WORLDS: { id: WorldId; name: string; idea: string }[] = [
  { id: 0, name: "পুকুরঘাট", idea: "ছুঁয়ে ছুঁয়ে গোনা" },
  { id: 1, name: "মেলার মাঠ", idea: "এক নজরে চেনা" },
  { id: 2, name: "মাছের হাট", idea: "মিলিয়ে দেখা" },
];

export const LEVELS: Level[] = [
  { id: 1, world: 0, kind: "guni", title: "পাঁচ পর্যন্ত", label: "১–৫", idea: "প্রতিটা মাছে একবার চাপ, শেষ নম্বরটাই মোট", min: 2, max: 5, warm: true },
  { id: 2, world: 0, kind: "guni", title: "দশ পর্যন্ত", label: "১–১০", idea: "দুই হাতের আঙুলের চেয়ে বেশি", min: 4, max: 10 },
  { id: 3, world: 0, kind: "guni", title: "পনেরো পর্যন্ত", label: "১–১৫", idea: "বড় সংখ্যা, জায়গা হারাবে না", min: 8, max: 15 },
  { id: 10, world: 0, kind: "guni", title: "বড় দিঘি", label: "১–২০", idea: "কুড়ি পর্যন্ত গোনা", min: 15, max: 20, finale: "বড় দিঘি" },
  { id: 4, world: 1, kind: "nojor", title: "এক নজরে চার", label: "১–৪", idea: "না গুনে চার পর্যন্ত চেনা", min: 1, max: 4, pictures: true, group: 4, warm: true },
  { id: 5, world: 1, kind: "nojor", title: "এক নজরে ছয়", label: "১–৬", idea: "ছক্কার নকশা চেনা", min: 2, max: 6, group: 6 },
  { id: 6, world: 1, kind: "nojor", title: "দুই ভাগে", label: "৩–১০", idea: "দুটো দল মিলিয়ে মোট", min: 3, max: 10, parts: 2, group: 5 },
  { id: 11, world: 1, kind: "nojor", title: "লুডুর চাল", label: "৬–১২", idea: "দুটো ছক্কা মিলিয়ে মোট", min: 6, max: 12, parts: 2, group: 6, look: "dice", finale: "লুডুর চাল" },
  { id: 7, world: 2, kind: "beshi", title: "কোনটায় বেশি", label: "১–৫", idea: "দুই পুকুরের কোনটায় বেশি", min: 1, max: 5, warm: true },
  { id: 8, world: 2, kind: "beshi", title: "বড় মাছ, কম মাছ", label: "১–১০", idea: "মাছ বড় হলেই বেশি নয়", min: 1, max: 10 },
  { id: 9, world: 2, kind: "beshi", title: "কতটা বেশি", label: "কতটা", idea: "জোড়া না মেলা মাছগুলো গোনা", min: 1, max: 10, koto: true },
  { id: 12, world: 2, kind: "merge", title: "পুকুর মেলানো", label: "যোগ", idea: "দুই পুকুর এক করলে মোট কয়টা", min: 3, max: 10, finale: "পুকুর মেলানো" },
];

export const LEVEL_COUNT = LEVELS.length;
/** Play order: each world's three steps, then its finale. */
export const ORDER = [1, 2, 3, 10, 4, 5, 6, 11, 7, 8, 9, 12];

export const isLevel = (id: number) => Number.isInteger(id) && id >= 1 && id <= LEVEL_COUNT;
export const levelOf = (id: number): Level => LEVELS.find(level => level.id === id) ?? LEVELS[0];
export const worldOf = (id: number) => WORLDS[levelOf(id).world];
export const levelsOfWorld = (world: WorldId) => ORDER.filter(id => levelOf(id).world === world);
/** The number the child sees on the card, 1–12 in play order. */
export const placeOf = (id: number) => ORDER.indexOf(id) + 1;
export const nextInOrder = (id: number) => ORDER[ORDER.indexOf(id) + 1] ?? 0;
export const isWorldEnd = (id: number) => Boolean(levelOf(id).finale);

/** The first level in play order without stars: the one the title offers and the list marks এটা খেলো. After the last, level 1 again. */
export function nextToPlay(stars: Record<number, number>) {
  return ORDER.find(id => !stars[id]) ?? ORDER[0];
}

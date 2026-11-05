// The levels as data: three worlds, nine levels. Ids 1–6 are the six trips in their old order (so saved stars keep their
// meaning); the three passport checks are new ids 7–9. ORDER is the play order the list shows (১–৯).
// A stop is a country plus what the stamp question asks there. A trip asks one question a stop; a level can ask two.
import { COUNTRIES, TRIPS, countryOf, type Kind } from "./countries";

export type Ask = Kind | "hello";
export type WorldId = 0 | 1 | 2;
export type World = { id: WorldId; name: string; place: string };
export type Stop = { id: string; asks: readonly Ask[] };

export const WORLDS: readonly World[] = [
  { id: 0, name: "কাছের এশিয়া", place: "ধানের দেশ" },
  { id: 1, name: "দূর পুব আর মরুভূমি", place: "বালি আর সাগর" },
  { id: 2, name: "সাগরের ওপারে", place: "আফ্রিকা, ইউরোপ, আমেরিকা" },
];

/**
 * `base` is how many pictures a question shows before the pace moves it (`opening` for the very first question).
 * `short` shows three postcards a stop instead of five. `recall` asks after every stop is visited: the passport check.
 * `near` makes the wrong pictures the other countries on this map first, the ones just visited.
 */
export type Level = {
  id: number; world: WorldId; title: string; finale?: boolean; idea: string; icon: string;
  stops: readonly Stop[]; base: number; opening?: number; short?: boolean; recall?: boolean; near?: boolean;
};

const trip = (id: number, ...extra: (readonly Ask[] | undefined)[]): Stop[] =>
  TRIPS[id - 1].ids.map((cid, at) => ({ id: cid, asks: extra[at] ?? [countryOf(cid)!.ask] }));
const stops = (...list: readonly [string, ...Ask[]][]): Stop[] => list.map(([id, ...asks]) => ({ id, asks }));

const BY_ID: readonly Level[] = [
  { id: 1, world: 0, title: "পাশের দেশে", icon: "in:place", idea: "ছবি দেখে ঠিক ছবিটা বাছো", stops: trip(1), base: 3, opening: 2, short: true },
  { id: 2, world: 0, title: "পুবের পথে", icon: "mm", idea: "পতাকা চেনো", stops: trip(2), base: 3 },
  { id: 3, world: 1, title: "আরও পুবে", icon: "jp", idea: "চারটা ছবি", stops: trip(3), base: 4 },
  { id: 4, world: 1, title: "মরুভূমির দেশে", icon: "sa:animal", idea: "কাছাকাছি দেশের গুলিয়ে যাওয়া", stops: trip(4), base: 4, near: true },
  { id: 5, world: 2, title: "আফ্রিকা থেকে ইউরোপ", icon: "ke", idea: "কে বলে এই হ্যালো?", stops: trip(5, ["hello"]), base: 4 },
  { id: 6, world: 2, title: "সাগর পেরিয়ে আমেরিকা", icon: "us", idea: "প্রতি দেশে দুটো সিল", stops: trip(6, ["animal", "hello"], ["flag", "food"], ["place", "animal"]), base: 4 },
  { id: 7, world: 0, title: "পাসপোর্ট চেক: ধানের দেশ", finale: true, icon: "passport", idea: "সব ঘুরে এসে পাসপোর্টের প্রশ্ন",
    stops: stops(["np", "place"], ["mm", "animal"], ["sg", "flag"]), base: 3, short: true, recall: true },
  { id: 8, world: 1, title: "পাসপোর্ট চেক: বালি আর সাগর", finale: true, icon: "passport", idea: "সব ঘুরে এসে, কাছাকাছি দেশের গুলিয়ে যাওয়া",
    stops: stops(["au", "place"], ["ae", "animal"], ["eg", "food"]), base: 4, short: true, recall: true, near: true },
  { id: 9, world: 2, title: "পাসপোর্ট চেক: সাগরের ওপারে", finale: true, icon: "passport", idea: "সব ঘুরে এসে, হ্যালো আর পতাকা",
    stops: stops(["ca", "food"], ["gb", "hello"], ["br", "animal"]), base: 4, short: true, recall: true, near: true },
];

/** Every level id, 1–9. Stars are saved by id. */
export const LEVEL_COUNT = BY_ID.length;
/** The play order, as the list numbers it ১–৯. */
export const ORDER: readonly number[] = [1, 2, 7, 3, 4, 8, 5, 6, 9];

export const isLevel = (id: number) => Number.isInteger(id) && id >= 1 && id <= LEVEL_COUNT;
export const levelOf = (id: number): Level => BY_ID[(isLevel(id) ? id : 1) - 1];
export const placeOf = (id: number) => ORDER.indexOf(levelOf(id).id) + 1;
export const worldOf = (id: number) => WORLDS[levelOf(id).world];
export const nextInOrder = (id: number) => ORDER[placeOf(id)] ?? 0;
export const isWorldEnd = (id: number) => !!levelOf(id).finale;
export const levelsOfWorld = (world: WorldId) => ORDER.filter(id => levelOf(id).world === world);
/** The first level in play order with no stars yet; once every level has stars, the first one. */
export const nextToPlay = (stars: Record<number, number>) => ORDER.find(id => !stars[id]) ?? ORDER[0];
export const stopIds = (id: number) => levelOf(id).stops.map(stop => stop.id);

/** Every country the child has stamped on a finished level. */
export function stampedIds(stars: Record<number, number>) {
  const ids = new Set<string>();
  for (const level of BY_ID) if (stars[level.id]) for (const stop of level.stops) ids.add(stop.id);
  return COUNTRIES.filter(country => ids.has(country.id)).map(country => country.id);
}

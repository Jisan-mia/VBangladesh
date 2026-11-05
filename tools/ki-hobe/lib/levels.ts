// The levels of কী হবে বলো তো? as data: three worlds, nine levels. Each level adds one new idea; the last in a world is its named
// finale and mixes what the world taught (some fixed experiments, the rest drawn from the world's pool by seed). Ids are fixed (1–9).
// Every level is open: a child never meets a lock.

import type { Pic } from "./art";

export type WorldId = "pukur" | "uthan" | "akash";

export type Level = {
  id: number; world: WorldId;
  name: string;
  /** One line for the parent: what this level adds. */
  line: string;
  /** Experiments always in the round, in this order after the shuffle of the rest. */
  fixed: readonly string[];
  /** Experiments drawn from by seed (`take` of them). */
  pool: readonly string[];
  take: number;
  finale?: boolean;
  /** The picture for its tile in the level list. */
  pic: Pic;
};

export type World = { id: WorldId; name: string; first: number; last: number; palette: { paper: string; edge: string; deep: string; glow: string }; root: number };

const L = (id: number, world: WorldId, name: string, line: string, pic: Pic, fixed: readonly string[], pool: readonly string[], take: number, finale = false): Level =>
  ({ id, world, name, line, pic, fixed, pool, take, finale: finale || undefined });
const all = (...ids: string[]) => ids;

const POND = ["narkel-it", "pata-chamoch", "aloo-bol", "botol-vela", "pathor-poisha", "kath-pathor"];

export const LEVELS: readonly Level[] = [
  L(1, "pukur", "ভাসে না ডোবে", "দুটো জিনিস, একটা ভাসে আর একটা ডোবে। আগে ভাবো, তারপর দেখো।", "askFloat", [], all("narkel-it", "pata-chamoch", "aloo-bol"), 3),
  L(2, "pukur", "দুটোই একরকম", "কখনো দুটোই ভাসে, কখনো দুটোই ডোবে। তিনটে আন্দাজ থেকে একটা বাছো।", "bottle", [], all("botol-vela", "pathor-poisha", "kath-pathor"), 3),
  L(3, "pukur", "পুকুরপাড়ের মেলা", "রোদে বরফ গলে, আর পুকুরের জিনিসগুলো আবার ভাসে-ডোবে।", "askMelt", ["borof"], POND, 3, true),
  L(4, "uthan", "বাতাস ঠেলে", "হালকা জিনিসকে বাতাস ঠেলে ধরে। চাঁদে বাতাস নেই, তাই সেখানে অন্যরকম।", "askFall", [], all("pathor-palok", "kagoj", "chande-pora"), 3),
  L(5, "uthan", "কী লাগে?", "বীজের জন্য কী লাগে, আর চুম্বক কাকে টানে।", "askStick", [], all("bij", "chumbok", "chumbok-perek"), 3),
  L(6, "uthan", "উঠানের বিজ্ঞানী", "পড়া, বীজ আর চুম্বক একসাথে।", "askGrow", [], all("pathor-palok", "kagoj", "chande-pora", "bij", "chumbok", "chumbok-perek"), 4, true),
  L(7, "akash", "শব্দ কাঁপে", "শব্দ আসলে কাঁপুনি। সুতো আর ঢোলে সেটা দেখা যায়।", "askHear", [], all("sutor-phone", "dhol-dana", "sutor-dhila"), 3),
  L(8, "akash", "আলো আর ছায়া", "সূর্য নিচে নামলে ছায়া লম্বা হয়, আকাশের রংও বদলায়।", "askLong", [], all("chaya", "akash", "sondhya"), 3),
  L(9, "akash", "আকাশের মেলা", "চাঁদ, মেঘ আর বৃষ্টি, তার সাথে আগের আকাশের দুটো।", "askWhy", ["chand", "brishti"], all("chaya", "akash", "sondhya", "sutor-phone", "dhol-dana"), 2, true),
];
export const LEVEL_COUNT = LEVELS.length;

export const WORLDS: readonly World[] = [
  { id: "pukur", name: "পুকুরপাড়", first: 1, last: 3, palette: { paper: "#eaf5fc", edge: "#b9d8ec", deep: "#1c5f96", glow: "#ffcf5a" }, root: 440 },
  { id: "uthan", name: "উঠান", first: 4, last: 6, palette: { paper: "#f4f6e2", edge: "#d5dca4", deep: "#4e6b1c", glow: "#ffcf5a" }, root: 392 },
  { id: "akash", name: "আকাশ আর শব্দ", first: 7, last: 9, palette: { paper: "#e9ecfa", edge: "#bfc6ea", deep: "#38418f", glow: "#ffd98a" }, root: 523 },
];
export const worldOf = (id: WorldId): World => WORLDS.find(world => world.id === id)!;
export const levelOf = (id: number): Level => LEVELS[Math.max(1, Math.min(LEVEL_COUNT, Math.round(id) || 1)) - 1];
export const worldLevels = (id: WorldId): readonly Level[] => LEVELS.filter(level => level.world === id);
export const placeInWorld = (id: number) => id - worldOf(levelOf(id).world).first + 1;

/** The first level of the world with no star yet (or the last one), the one the title offers. */
export function recommended(world: WorldId, stars: Record<number, number>): number {
  const levels = worldLevels(world);
  return (levels.find(level => !stars[level.id]) ?? levels[levels.length - 1]).id;
}
/** The level after this one, or the same at the very end. */
export const nextUp = (id: number) => Math.min(LEVEL_COUNT, id + 1);

/** The first version had four sets under the same saved key; they move once to the new ids. */
export const OLD_SET_TO_LEVEL: Record<number, number> = { 1: 1, 2: 4, 3: 7, 4: 9 };


// The levels as data: four waters of four, each level's one new thing, the modes, and the unlock rule.
// Server-safe (no React, no DOM): the link and share code read names from here.
import { readLevels, unlockedLevel, type LevelStars } from "../../../shared/game-core";
import { BOSSES, fishIndex } from "./species";

/** e: সহজ, n: স্বাভাবিক, h: কঠিন. Links carry `d=e|h`; no `d` is স্বাভাবিক. */
export type Mode = "e" | "n" | "h";
export const MODES: readonly Mode[] = ["e", "n", "h"];
export const MODE_INFO: Record<Mode, {
  name: string; line: string;
  /** Baits beyond the fish you need. */ spare: number;
  /** × the seconds the float stays under. */ window: number;
  /** + the green band's half-width. */ band: number;
  /** × the warning before a surge, a leap or a rush. */ warn: number;
  /** সহজ tops out at two stars, so it's never the short way to three. */ maxStars: number;
}> = {
  e: { name: "সহজ", line: "ফাতনা বেশিক্ষণ ডোবে, সবুজ ঘর চওড়া, হাতে ৪টা বাড়তি টোপ। তারা বড়জোর ২টা।", spare: 4, window: 1.35, band: 0.05, warn: 1.35, maxStars: 2 },
  n: { name: "স্বাভাবিক", line: "হাতে ২টা বাড়তি টোপ। একটাও না হারালে ৩ তারা।", spare: 2, window: 1, band: 0, warn: 1, maxStars: 3 },
  h: { name: "কঠিন", line: "ফাতনা কম সময় ডোবে, সংকেত আসে দেরিতে। হাতে ১টা বাড়তি টোপ।", spare: 1, window: 0.82, band: -0.02, warn: 0.8, maxStars: 3 },
};
export const isMode = (value: string): value is Mode => (MODES as readonly string[]).includes(value);

export type WorldId = 0 | 1 | 2 | 3;
export const WORLDS: readonly { name: string; water: number; time: string }[] = [
  { name: "নানাবাড়ির পুকুর", water: 0, time: "দুপুর" },
  { name: "শাপলার বিল", water: 1, time: "বিকেল" },
  { name: "নদীর ঘাট", water: 2, time: "সন্ধ্যার আগে" },
  { name: "বর্ষার হাওর", water: 3, time: "বৃষ্টির দিন" },
];

export type LevelDef = {
  world: WorldId;
  /** The one new thing, as a short title, and in one line for the title screen, the level list and the level's first card. */
  title: string;
  teach: string;
  /** Fish to land. A finale's last one is its boss. */
  need: number;
  /** The fish that can bite here (indexes into FISH). */
  pool: readonly number[];
  /** Until the first fish is landed, this one bites (the level's new kind of fish), or -1. */
  first: number;
  /** Most nibbles before the real dip. */
  fakes: number;
  /** Seconds the float stays under. */
  window: number;
  /** × every fish's pull. */
  pull: number;
  /** × the seconds it takes to bring a fish in. */
  reel: number;
  /** An early tap only gets a word (level 1). */
  forgiving: boolean;
  /** Lily pads on the water: a cast onto one snags. */
  pads: boolean;
  /** The current: the line tightens by itself, per second. */
  current: number;
  /** Waves rock the float; the "!" over the dip is gone from here on. */
  waves: boolean;
  /** Dusk: only the float's lit tip shows. */
  dark: boolean;
  /** Index into BOSSES, or -1. */
  boss: number;
};

const ids = (...names: string[]) => names.map(fishIndex);
const level = (def: Partial<LevelDef> & Pick<LevelDef, "world" | "title" | "teach" | "need" | "pool">): LevelDef =>
  ({ first: -1, fakes: 0, window: 1.05, pull: 1, reel: 1, forgiving: false, pads: false, current: 0, waves: false, dark: false, boss: -1, ...def });

const POND = ids("punti", "telapia", "koi");
const POND_SURGE = [...POND, ...ids("taki")];
const BEEL = ids("punti", "koi", "taki", "tengra", "kholisha", "mrigel");
const BEEL_SLIP = [...BEEL, ...ids("baim", "shing", "magur")];
const BEEL_JUMP = [...BEEL_SLIP, ...ids("gojar", "shol", "boal")];
const RIVER = ids("shol", "rui", "katla", "tengra", "baim", "mrigel", "pabda", "boal", "bata");
const RIVER_SOFT = [...RIVER, ...ids("ilish")];
const RIVER_RUSH = [...RIVER_SOFT, ...ids("air", "chitol")];
const HAOR = ids("punti", "koi", "shing", "magur", "shol", "rui", "katla", "gojar", "pabda", "boal", "air", "chitol");

export const LEVELS: readonly LevelDef[] = [
  level({ world: 0, title: "প্রথম ছিপ", teach: "বুদবুদের কাছে ফেলো। ফাতনা পুরো ডুবলে চাপো, তারপর চেপে ধরে গোটাও।", need: 2, pool: ids("punti", "telapia"), window: 1.3, pull: 0.7, reel: 0.7, forgiving: true }),
  level({ world: 0, title: "ঠোকর", teach: "ফাতনা একটু নড়লে ওটা ঠোকর। পুরো ডুবলে তবেই টান।", need: 3, pool: POND, fakes: 2, window: 1.2, pull: 0.8, reel: 0.85 }),
  level({ world: 0, title: "ঘাই", teach: "পানি ঘুরপাক খেলে মাছ ঘাই দেবে। তখন আঙুল তুলে ঢিল দাও।", need: 3, pool: POND_SURGE, first: fishIndex("taki"), fakes: 2, window: 1.15, pull: 0.9 }),
  level({ world: 0, title: "বুড়ো রুই", teach: "পুকুরের সবচেয়ে পুরোনো মাছ। ওর তিন দাগ দম ভাঙাও।", need: 2, pool: POND_SURGE, fakes: 2, window: 1.15, pull: 0.9, boss: 0 }),
  level({ world: 1, title: "শাপলা পাতা", teach: "পাতার ওপর ফেললে টোপ আটকে যায়। ফাঁকা পানিতে ফেলো।", need: 3, pool: BEEL, fakes: 2, window: 1.1, pull: 0.95, pads: true }),
  level({ world: 1, title: "পিচ্ছিল মাছ", teach: "বাইম সুতো ঢিলা পেলেই পিছলে যায়। টান ছেড়ো না।", need: 3, pool: BEEL_SLIP, first: fishIndex("baim"), fakes: 2, window: 1.05, pull: 1, pads: true }),
  level({ world: 1, title: "লাফ", teach: "ছায়া ওপরে উঠলে মাছ লাফ দেবে। লাফের আগেই ঢিল দাও।", need: 3, pool: BEEL_JUMP, first: fishIndex("gojar"), fakes: 2, window: 1.05, pull: 1, pads: true }),
  level({ world: 1, title: "রাক্ষুসে বোয়াল", teach: "লাফায়, ঘাইও মারে। তিন দাগ দম।", need: 2, pool: BEEL_JUMP, fakes: 2, window: 1.05, pull: 1, pads: true, boss: 1 }),
  level({ world: 2, title: "স্রোত", teach: "স্রোত নিজেই সুতো টানে। ঘন ঘন আঙুল তোলো।", need: 3, pool: RIVER, fakes: 2, window: 1, pull: 1, current: 0.2 }),
  level({ world: 2, title: "নরম মুখ", teach: "ইলিশের মুখ নরম। লালের অনেক আগেই ঢিল দাও।", need: 3, pool: RIVER_SOFT, first: fishIndex("ilish"), fakes: 3, window: 1, pull: 1, current: 0.2 }),
  level({ world: 2, title: "ছুটে আসা", teach: "আইড় হঠাৎ পাড়ের দিকে ছোটে। নিচে তীর দেখলে চেপে ধরে গোটাও।", need: 3, pool: RIVER_RUSH, first: fishIndex("air"), fakes: 3, window: 0.95, pull: 1, current: 0.2 }),
  level({ world: 2, title: "কুঁজো চিতল", teach: "ছুটে আসে, ঘাই মারে, স্রোতও টানে। চার দাগ দম।", need: 2, pool: RIVER_RUSH, fakes: 3, window: 0.95, pull: 1, current: 0.2, boss: 2 }),
  level({ world: 3, title: "ঢেউ", teach: "ঢেউয়ে ফাতনা দোলে। দোলা আর ডোবা আলাদা করে চেনো।", need: 3, pool: HAOR, fakes: 3, window: 0.95, pull: 1, waves: true }),
  level({ world: 3, title: "সন্ধ্যা", teach: "আঁধারে শুধু ফাতনার আলো দেখা যায়।", need: 3, pool: HAOR, fakes: 3, window: 0.95, pull: 1, waves: true, dark: true }),
  level({ world: 3, title: "সব একসাথে", teach: "ঢেউ, আঁধার আর সব রকম মাছ। চারটা তুলতে হবে।", need: 4, pool: HAOR, fakes: 3, window: 0.92, pull: 1.05, waves: true, dark: true }),
  level({ world: 3, title: "হাওরের রাজা আইড়", teach: "সব কৌশল জানে। চার দাগ দম।", need: 2, pool: HAOR, fakes: 3, window: 0.92, pull: 1.05, waves: true, dark: true, boss: 3 }),
];
export const LEVEL_COUNT = LEVELS.length;
export const isLevel = (value: number) => Number.isInteger(value) && value >= 1 && value <= LEVEL_COUNT;
export const levelDef = (value: number) => LEVELS[Math.min(LEVEL_COUNT, Math.max(1, Math.round(value))) - 1];
export const bossOf = (def: LevelDef) => def.boss >= 0 ? BOSSES[def.boss] : null;

/** Stars are baits kept: none lost 3, one lost 2, more 1; 0 when the baits ran out. সহজ tops out at two. */
export function starsOf(won: boolean, lost: number, mode: Mode = "n") {
  if (!won) return 0;
  return Math.min(MODE_INFO[mode].maxStars, lost === 0 ? 3 : lost === 1 ? 2 : 1);
}

/* ---------- progress on this phone ---------- */
// The shared unlockedLevel opens every level below the highest one with stars. That's right for the one-time migration,
// wrong after a friend's link, so the game keeps its own unlock: migrated once, then raised only by clearing the furthest open level.

/** The saved unlock, or (the first time) the shared rule's answer over the old stars. `migrated` says whether to write it back. */
export function readUnlock(raw: string | null, stars: LevelStars) {
  const saved = Number(raw);
  if (raw !== null && Number.isInteger(saved) && saved >= 1) return { unlock: Math.min(LEVEL_COUNT, saved), migrated: false };
  return { unlock: unlockedLevel(stars, LEVEL_COUNT), migrated: true };
}
export const readStars = (raw: string | null) => readLevels(raw, LEVEL_COUNT);

/** After a clear: the next level opens only when this one was already open. A friend's far level keeps its stars and opens nothing. */
export const afterClear = (unlock: number, value: number) => value >= 1 && value <= unlock ? Math.max(unlock, Math.min(LEVEL_COUNT, value + 1)) : unlock;

/** A level can be played when it's open, already has stars, or is the friend's level on this link. */
export const playable = (value: number, unlock: number, stars: LevelStars, friendLevel = 0) =>
  isLevel(value) && (value <= unlock || Boolean(stars[value]) || value === friendLevel);

/** The level to suggest: the first open one without stars, else the first with fewer than 3, else the last open one. */
export function recommended(unlock: number, stars: LevelStars) {
  for (let value = 1; value <= unlock; value++) if (!stars[value]) return value;
  for (let value = 1; value <= unlock; value++) if ((stars[value] ?? 0) < 3) return value;
  return unlock;
}

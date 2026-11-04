// The levels as data: three পাড়া of four, যত দূর পারো, the modes, the stars and the unlock rule.
// Server-safe (no React, no DOM): the link and share code read names from here.
import { unlockedLevel, type LevelStars } from "../../../shared/game-core";

/** e: সহজ, n: সাধারণ, h: কঠিন. Links carry `m=e|h`; no `m` is সাধারণ. */
export type Mode = "e" | "n" | "h";
export const MODES: readonly Mode[] = ["e", "n", "h"];
export const MODE_INFO: Record<Mode, {
  name: string; line: string;
  /** Balloons on the seller's stick for this run. */ balloons: number;
  /** Added to every gap, in units. */ gap: number;
  /** × the warning before a crow or a gust. */ warn: number;
  /** × every crow's speed, × every gust's push, × a crow's body. */ crow: number; gust: number; body: number;
  /** Easy tops out at two stars, so it's never the short way to three. */ maxStars: number;
}> = {
  e: { name: "সহজ", line: "ফাঁক বড়, সংকেত আগে, হাতে ৩টা বেলুন। তারা বড়জোর ২টা।", balloons: 3, gap: 26, warn: 1.4, crow: 0.85, gust: 0.75, body: 0.75, maxStars: 2 },
  n: { name: "সাধারণ", line: "হাতে ২টা বেলুন। না ফাটিয়ে পার হলে ২ তারা, তারে কম ঘষলে ৩।", balloons: 2, gap: 0, warn: 1, crow: 1, gust: 1, body: 1, maxStars: 3 },
  h: { name: "কঠিন", line: "ফাঁক সরু, সংকেত দেরিতে, হাতে একটাই বেলুন।", balloons: 1, gap: -10, warn: 0.75, crow: 1.1, gust: 1.1, body: 1, maxStars: 3 },
};
export const isMode = (value: string): value is Mode => (MODES as readonly string[]).includes(value);

export type WorldId = 0 | 1 | 2;
export const WORLDS: readonly { name: string; time: string; adds: string }[] = [
  { name: "পুরান ঢাকা", time: "বিকেল", adds: "তার" },
  { name: "মিরপুর", time: "সন্ধ্যা", adds: "কাক" },
  { name: "মতিঝিল", time: "ঝড়ের রাত", adds: "হাওয়া" },
];

/** A finale's named moment: the knots of a tangle, a big crow's swoops, a storm's three blasts. */
export type Boss = "jot" | "goda" | "jhor";
export const BOSS_NAME: Record<Boss, string> = { jot: "মহাজট", goda: "গোদা কাক", jhor: "রাতের ঝড়" };

export type LevelDef = {
  /** The পাড়া, and the same name "in" and "of", so lines read as Bangla. */
  name: string; at: string; of: string;
  /** The one new thing, as a short title, and in one line for the title screen and the level list. */
  title: string; teach: string;
  world: WorldId;
  /** Crossings to pass (a tangle's knots included), the street's speed (units a second). */
  crossings: number; speed: number;
  /** The first gaps' height, the narrowest a gap gets, how far one gap may sit from the last, and the wires' tilt. */
  gap: number; floor: number; reach: number; tilt: number;
  /** Extra street between crossings (crow levels leave room to dodge and get back on line). */
  space: number;
  /** Every other crossing comes close and on the other side: an S-bend. */
  pairs: boolean;
  /** The finale tangle: this many knots back to back at the end. */
  knots: number;
  /** Crows: single flyers, flocks of three, divers that aim at you. */
  flyers: number; flocks: number; swoops: number;
  /** A gust's push (units/s², 0 for none) and the street between gusts. */
  gust: number; every: number;
  /** How far a swinging gap rises and falls (0: still wires). */
  swing: number;
  boss: Boss | null;
  /** The world's last level. */
  finale: boolean;
};

const level = (def: Partial<LevelDef> & Pick<LevelDef, "name" | "at" | "of" | "title" | "teach" | "world" | "crossings" | "speed">): LevelDef => ({
  gap: 156, floor: 146, reach: 120, tilt: 14, space: 0, pairs: false, knots: 0, flyers: 0, flocks: 0, swoops: 0, gust: 0, every: 520, swing: 0, boss: null, finale: false, ...def,
});

export const LEVELS: readonly LevelDef[] = [
  level({ world: 0, name: "লালবাগ", at: "লালবাগে", of: "লালবাগের", title: "প্রথম ফাঁক", teach: "আঙুল চেপে রাখো, বেলুন ওঠে। ছেড়ে দাও, নামে।", crossings: 4, speed: 100, gap: 178, floor: 178, reach: 14, tilt: 5 }),
  level({ world: 0, name: "চকবাজার", at: "চকবাজারে", of: "চকবাজারের", title: "উঁচু-নিচু", teach: "পরের ফাঁক ওপরে না নিচে, আগেই দেখে নাও।", crossings: 6, speed: 104, gap: 160, floor: 150, reach: 110, tilt: 12 }),
  level({ world: 0, name: "আরমানিটোলা", at: "আরমানিটোলায়", of: "আরমানিটোলার", title: "জোড়া ফাঁক", teach: "দুটো ফাঁক গায়ে গায়ে: একটা উঁচুতে, একটা নিচে।", crossings: 8, speed: 106, gap: 156, floor: 148, pairs: true }),
  level({ world: 0, name: "বংশাল", at: "বংশালে", of: "বংশালের", title: "বংশালের মহাজট", teach: "শেষে ছয়টা জট পরপর। থেমো না, মাঝ বরাবর থাকো।", crossings: 12, speed: 108, gap: 148, floor: 136, knots: 6, boss: "jot", finale: true }),
  level({ world: 1, name: "মিরপুর ১০", at: "মিরপুর ১০-এ", of: "মিরপুর ১০-এর", title: "উড়ন্ত কাক", teach: "ডান কিনারায় কাকের চিহ্ন মানে ওই উচ্চতায় কাক আসছে। সরে যাও।", crossings: 9, speed: 106, gap: 152, floor: 144, space: 30, flyers: 3 }),
  level({ world: 1, name: "পল্লবী", at: "পল্লবীতে", of: "পল্লবীর", title: "কাকের ঝাঁক", teach: "তিনটা কাক একসঙ্গে। দুই কাকের মাঝের ফাঁকে ঢোকো।", crossings: 10, speed: 108, gap: 156, floor: 146, space: 30, flyers: 1, flocks: 2 }),
  level({ world: 1, name: "কাজীপাড়া", at: "কাজীপাড়ায়", of: "কাজীপাড়ার", title: "ছোঁ মারা কাক", teach: "এই কাক তুমি যেখানে, সেখানেই ছোঁ মারে। ঠিক আগে সরে যাও।", crossings: 10, speed: 108, gap: 154, floor: 144, space: 30, flyers: 1, swoops: 3 }),
  level({ world: 1, name: "শেওড়াপাড়া", at: "শেওড়াপাড়ায়", of: "শেওড়াপাড়ার", title: "শেওড়াপাড়ার গোদা কাক", teach: "গোদা কাক তিনবার ছোঁ মারবে, বড় ডানায়। তিনবারই এড়াও।", crossings: 12, speed: 110, gap: 152, floor: 142, space: 34, flyers: 2, swoops: 3, boss: "goda", finale: true }),
  level({ world: 2, name: "দিলকুশা", at: "দিলকুশায়", of: "দিলকুশার", title: "দমকা হাওয়া", teach: "কিনারায় তীর মানে দমকা আসছে। তীর যেদিকে, হাওয়া সেদিকে ঠেলবে।", crossings: 10, speed: 110, gap: 152, floor: 142, tilt: 14, gust: 240, every: 460 }),
  level({ world: 2, name: "আরামবাগ", at: "আরামবাগে", of: "আরামবাগের", title: "দোলা তার", teach: "ঝড়ে তার দুলছে। ফাঁক ওঠানামা করে, তাল বুঝে ঢোকো।", crossings: 11, speed: 112, gap: 152, floor: 142, tilt: 14, gust: 200, every: 560, swing: 22 }),
  level({ world: 2, name: "ফকিরাপুল", at: "ফকিরাপুলে", of: "ফকিরাপুলের", title: "সব একসাথে", teach: "কাক, দমকা আর দোলা তার একসঙ্গে।", crossings: 12, speed: 112, gap: 156, floor: 146, tilt: 14, space: 28, flyers: 2, swoops: 1, gust: 170, every: 580, swing: 20 }),
  level({ world: 2, name: "শাপলা চত্বর", at: "শাপলা চত্বরে", of: "শাপলা চত্বরের", title: "শাপলা চত্বরে রাতের ঝড়", teach: "রাতের ঝড় তিনবার জোরে ঝাপটা দেবে। তিনবারই সামলাও।", crossings: 14, speed: 112, gap: 160, floor: 150, tilt: 14, space: 24, flyers: 1, gust: 130, every: 660, swing: 16, boss: "jhor", finale: true }),
];
export const LEVEL_COUNT = LEVELS.length;
/** Level 0: যত দূর পারো, the street with no end. Its crossings are generated as far as anyone could fly. */
export const ENDLESS_CROSSINGS = 400;
export const ENDLESS: LevelDef = level({
  world: 0, name: "যত দূর পারো", at: "যত দূর পারো-তে", of: "যত দূর পারো-র", title: "যত দূর পারো", teach: "শেষ নেই। যত এগোবে, তত কাক, দমকা আর দোলা।",
  crossings: ENDLESS_CROSSINGS, speed: 104, gap: 172, floor: 124,
});
export const isLevel = (value: number) => Number.isInteger(value) && value >= 1 && value <= LEVEL_COUNT;
/** 0 is যত দূর পারো; anything else is clamped to a real level. */
export const levelDef = (value: number) => value === 0 ? ENDLESS : LEVELS[Math.min(LEVEL_COUNT, Math.max(1, Math.round(value))) - 1];

/** Scrapes allowed for three stars: one per six crossings. */
export const freeScrapes = (value: number) => Math.floor(levelDef(value).crossings / 6);
/** Cleared ★; with no balloon lost ★★; and with few scrapes ★★★. Easy tops out at two. 0 when not cleared. */
export function starsOf(won: boolean, lost: number, scrapes: number, value: number, mode: Mode = "n") {
  if (!won || value === 0) return 0;
  const earned = lost > 0 ? 1 : scrapes <= freeScrapes(value) ? 3 : 2;
  return Math.min(MODE_INFO[mode].maxStars, earned);
}

/* ---------- progress on this phone ---------- */

/**
 * The highest level you may pick. Levels cleared from a friend's link beyond your own unlock sit in `ahead`: they keep
 * their stars but don't open the levels in between. Once your own play reaches one, it counts as yours.
 * Saved progress from before (no `ahead`) opens exactly what `unlockedLevel` opened.
 */
export function openLevel(stars: LevelStars, ahead: readonly number[], count = LEVEL_COUNT) {
  const own: LevelStars = {};
  for (const key of Object.keys(stars)) if (!ahead.includes(Number(key))) own[Number(key)] = stars[Number(key)];
  let open = unlockedLevel(own, count);
  while (open < count && stars[open] && ahead.includes(open)) open++;
  return open;
}

/** After clearing `value`: is it beyond what you had opened (a friend's far level)? Returns the new `ahead` list. */
export function nextAhead(stars: LevelStars, ahead: readonly number[], value: number) {
  const open = openLevel(stars, ahead);
  const rest = ahead.filter(item => item !== value && item >= open);
  return value > open ? [...rest, value].sort((a, b) => a - b) : rest;
}

/** `ektukhani-ahead-tarer-fanke-belun`: a JSON list of level numbers; junk reads as none. */
export function readAhead(raw: string | null) {
  try {
    const parsed: unknown = JSON.parse(raw ?? "[]");
    return Array.isArray(parsed) ? [...new Set(parsed.filter((item): item is number => typeof item === "number" && isLevel(item)))].sort((a, b) => a - b) : [];
  } catch { return []; }
}

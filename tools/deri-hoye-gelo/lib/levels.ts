// The levels as data: three worlds of four, যত দূর পারো, the modes, the stars and the unlock rule.
// Server-safe (no React, no DOM): the link and share code read names from here.
import { unlockedLevel, type LevelStars } from "../../../shared/game-core";
import { BASKET, BIKE, BRANCH, COW, LINE, MUD, PUDDLE, SIGN, TIRE } from "./course";

/** e: সহজ, n: সাধারণ, h: কঠিন. Links carry `m=e|h`; no `m` is সাধারণ. Modes change only the bell, never the road or the stars. */
export type Mode = "e" | "n" | "h";
export const MODES: readonly Mode[] = ["e", "n", "h"];
export const MODE_INFO: Record<Mode, { name: string; line: string; /** Stumbles the bell allows for. */ stumbles: number }> = {
  e: { name: "সহজ", line: "ঘণ্টা দেরিতে পড়ে। ৫ বার হোঁচট খেলেও সময়মতো।", stumbles: 5 },
  n: { name: "সাধারণ", line: "২ বার হোঁচট খেলেও সময়মতো পৌঁছাবে।", stumbles: 2 },
  h: { name: "কঠিন", line: "ঘণ্টা প্রায় পড়ো-পড়ো। একবার হোঁচটের সময় আছে।", stumbles: 1 },
};
export const isMode = (value: string): value is Mode => (MODES as readonly string[]).includes(value);

export type WorldId = 0 | 1 | 2;
export const WORLDS: readonly { name: string; time: string; adds: string }[] = [
  { name: "গ্রামের পথ", time: "ভোর", adds: "লাফ আর মাথা নিচু" },
  { name: "বাজারের গলি", time: "সকাল", adds: "সাইকেল, সাইনবোর্ড, চাকা" },
  { name: "বর্ষার সকাল", time: "বৃষ্টি", adds: "কাদা আর ভাঙা ডাল" },
];

/** A finale's named stretch before the gate: these many things of one kind (or a mix) at a fixed beat. */
export type Finale = { name: string; kinds: readonly number[]; count: number; beat: number; /** A finale tyre's own speed (units a second, plus up to 30). */ roll: number };

export type LevelDef = {
  /** The place on the way to school, and the one new thing as a short title and in one line. */
  name: string; title: string; teach: string;
  world: WorldId;
  /** The gate in মিটার; the road's speed at the start and at the gate (units a second). */
  gate: number; speed: number; top: number;
  /** Weights of what may come; the level's new thing comes second, with its lesson over it. */
  kinds: Readonly<Partial<Record<number, number>>>;
  fresh: number;
  /** Seconds between one thing's end and the next one's start, at the start and near the gate (before ×1–1.45). */
  gapStart: number; gapEnd: number;
  /** Pages may float high (a jump to reach them). */
  highPages: boolean;
  /** A low branch is followed straight away by mud (a duck, then a jump). */
  pairs: boolean;
  /** How many mud widths may come (1: the narrowest only, up to 4). */
  mud: number;
  /** The last 150 m speed up by this much (the last level's sprint). */
  sprint: number;
  finale: Finale | null;
};

const level = (def: Partial<LevelDef> & Pick<LevelDef, "name" | "title" | "teach" | "world" | "gate" | "speed" | "top" | "kinds" | "fresh">): LevelDef => ({
  gapStart: 1.25, gapEnd: 0.95, highPages: true, pairs: false, mud: 4, sprint: 0, finale: null, ...def,
});

export const LEVELS: readonly LevelDef[] = [
  level({ world: 0, name: "উঠান পার", title: "প্রথম লাফ", teach: "চাপ দিলে লাফ। কাদাপানি টপকে যাও।", gate: 90, speed: 195, top: 200, kinds: { [PUDDLE]: 1 }, fresh: PUDDLE, gapStart: 1.05, gapEnd: 1.0, highPages: false }),
  level({ world: 0, name: "পুকুরপাড়", title: "সবজির ঝাঁকা", teach: "ঝাঁকা উঁচু। একটু আগে লাফ দাও।", gate: 160, speed: 200, top: 210, kinds: { [PUDDLE]: 1, [BASKET]: 1.4 }, fresh: BASKET, gapStart: 1.15, gapEnd: 1.0, highPages: false }),
  level({ world: 0, name: "বাঁশঝাড়", title: "দড়ির গামছা", teach: "গামছা ঝুললে নিচে টানো, মাথা নিচু।", gate: 220, speed: 205, top: 215, kinds: { [PUDDLE]: 1, [BASKET]: 1, [LINE]: 1.4 }, fresh: LINE, gapStart: 1.15, gapEnd: 0.95 }),
  level({ world: 0, name: "ধানখেতের আল", title: "গরুর পাল", teach: "শেষে পাঁচটা গরু পরপর বসে। লম্বা গরু, আগেভাগে লাফ।", gate: 300, speed: 210, top: 222, kinds: { [PUDDLE]: 1, [BASKET]: 1, [LINE]: 1, [COW]: 0.8 }, fresh: COW, gapStart: 1.05, gapEnd: 0.9, finale: { name: "গরুর পাল", kinds: [COW], count: 5, beat: 0.8, roll: 0 } }),
  level({ world: 1, name: "বাজারের মোড়", title: "সাইকেলের সারি", teach: "চওড়া সাইকেল। ঠিক সময়ে লাফ, নয়তো চেপে ধরো।", gate: 300, speed: 218, top: 232, kinds: { [PUDDLE]: 1, [BASKET]: 0.8, [LINE]: 0.8, [BIKE]: 1.5 }, fresh: BIKE, gapStart: 1.1, gapEnd: 0.9 }),
  level({ world: 1, name: "চায়ের দোকান", title: "ঝুলন্ত সাইনবোর্ড", teach: "সাইনবোর্ড লম্বা। অনেকক্ষণ মাথা নিচু রাখো।", gate: 340, speed: 222, top: 238, kinds: { [PUDDLE]: 1, [BASKET]: 0.8, [BIKE]: 1, [SIGN]: 1.5, [LINE]: 0.4 }, fresh: SIGN, gapStart: 1.05, gapEnd: 0.88 }),
  level({ world: 1, name: "রিকশা স্ট্যান্ড", title: "গড়ানো চাকা", teach: "চাকা গড়িয়ে আসে তোমার দিকে। ডান কিনারায় চাকার চিহ্ন দেখলেই তৈরি হও।", gate: 360, speed: 226, top: 242, kinds: { [PUDDLE]: 1, [BASKET]: 0.6, [BIKE]: 0.8, [SIGN]: 0.8, [TIRE]: 1.5 }, fresh: TIRE, gapStart: 1.1, gapEnd: 0.9 }),
  level({ world: 1, name: "কাঁচাবাজার", title: "চাকার মিছিল", teach: "শেষে ছয়টা চাকা পরপর গড়িয়ে আসে। তাল রেখে লাফ।", gate: 420, speed: 230, top: 246, kinds: { [PUDDLE]: 1, [BASKET]: 0.6, [BIKE]: 0.8, [SIGN]: 0.8, [TIRE]: 1 }, fresh: TIRE, gapStart: 0.98, gapEnd: 0.76, finale: { name: "চাকার মিছিল", kinds: [TIRE], count: 6, beat: 0.5, roll: 170 } }),
  level({ world: 2, name: "খালপাড়", title: "বড় কাদা", teach: "কাদা চওড়া। লাফ দিয়ে চেপে ধরে রাখো, লম্বা লাফ।", gate: 400, speed: 232, top: 248, kinds: { [PUDDLE]: 0.6, [MUD]: 1.6, [BASKET]: 0.6, [SIGN]: 0.8, [LINE]: 0.6 }, fresh: MUD, mud: 2, gapStart: 1.05, gapEnd: 0.88 }),
  level({ world: 2, name: "আমবাগান", title: "ডাল, তারপর কাদা", teach: "নিচু ডালের ঠিক পরেই কাদা। আগে মাথা নিচু, তারপর লাফ।", gate: 450, speed: 236, top: 252, kinds: { [PUDDLE]: 0.6, [MUD]: 0.8, [BASKET]: 0.6, [BRANCH]: 1, [BIKE]: 0.6 }, fresh: BRANCH, mud: 3, gapStart: 1.05, gapEnd: 0.85, pairs: true }),
  level({ world: 2, name: "স্কুলের রাস্তা", title: "সব একসাথে", teach: "কাদা, ডাল, চাকা, গরু, সব একসাথে। আরও জোরে।", gate: 500, speed: 240, top: 262, kinds: { [PUDDLE]: 0.6, [MUD]: 0.9, [BASKET]: 0.6, [BRANCH]: 0.8, [BIKE]: 0.7, [COW]: 0.6, [SIGN]: 0.7, [TIRE]: 0.9 }, fresh: TIRE, gapStart: 1.0, gapEnd: 0.8 }),
  level({ world: 2, name: "স্কুলের গেট", title: "গেট বন্ধ হচ্ছে!", teach: "শেষ দেড়শো মিটারে রাস্তা জোরে ছোটে। দারোয়ান চাচা গেট টানছেন!", gate: 540, speed: 252, top: 270, kinds: { [PUDDLE]: 0.6, [MUD]: 1.6, [BASKET]: 0.6, [BRANCH]: 0.8, [BIKE]: 0.7, [COW]: 0.6, [SIGN]: 0.9, [TIRE]: 0.9 }, fresh: COW, gapStart: 0.9, gapEnd: 0.7, sprint: 60, finale: { name: "গেট বন্ধ হচ্ছে", kinds: [PUDDLE, SIGN, TIRE, MUD, BRANCH, BIKE, COW], count: 7, beat: 0.8, roll: 140 } }),
];
export const LEVEL_COUNT = LEVELS.length;
/** Level 0: যত দূর পারো, the original endless road (old links open it, piece for piece). */
export const ENDLESS: LevelDef = level({
  world: 0, name: "যত দূর পারো", title: "যত দূর পারো", teach: "সেই পুরোনো রাস্তা, শেষ নেই। একটা ধাক্কাতেই শেষ, টিফিন বাক্স একবার বাঁচায়।",
  gate: 1000, speed: 190, top: 350, kinds: {}, fresh: PUDDLE,
});
export const isLevel = (value: number) => Number.isInteger(value) && value >= 1 && value <= LEVEL_COUNT;
/** 0 is যত দূর পারো; anything else is clamped to a real level. */
export const levelDef = (value: number) => value === 0 ? ENDLESS : LEVELS[Math.min(LEVEL_COUNT, Math.max(1, Math.round(value))) - 1];

/** Pages along each level's road. */
export const PAGES = 3;
/** ★ at the gate before the bell, ★ for no stumble, ★ for every page. 0 when late (or on the endless road). Slow mode and the mode never change it. */
export function starsOf(won: boolean, stumbles: number, pages: number, value: number) {
  if (!won || value === 0) return 0;
  return 1 + (stumbles === 0 ? 1 : 0) + (pages >= PAGES ? 1 : 0);
}

/* ---------- progress on this phone ---------- */

/**
 * The highest level you may pick. Levels cleared from a friend's link beyond your own unlock sit in `ahead`: they keep
 * their stars but don't open the levels in between. Once your own play reaches one, it counts as yours.
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

/** `ektukhani-ahead-deri-hoye-gelo`: a JSON list of level numbers; junk reads as none. */
export function readAhead(raw: string | null) {
  try {
    const parsed: unknown = JSON.parse(raw ?? "[]");
    return Array.isArray(parsed) ? [...new Set(parsed.filter((item): item is number => typeof item === "number" && isLevel(item)))].sort((a, b) => a - b) : [];
  } catch { return []; }
}

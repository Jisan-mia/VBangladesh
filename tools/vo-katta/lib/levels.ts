// The levels as data: three evenings of four, the rival kites and their personalities, the modes, and the unlock rule.
// Server-safe (no React, no DOM): the link and share code read names from here.
import { unlockedLevel, type LevelStars } from "../../../shared/game-core";

/** e: সহজ, n: সাধারণ, h: কঠিন. Links carry `d=e|h`; no `d` is সাধারণ. */
export type Mode = "e" | "n" | "h";
export const MODES: readonly Mode[] = ["e", "n", "h"];
export const MODE_INFO: Record<Mode, {
  name: string; line: string;
  /** Spare kites on the নাটাই. */ kites: number;
  /** × every rival's pull in a প্যাঁচ. */ strength: number;
  /** × the warning before a charge, a yank or a gust. */ warn: number;
  /** Easy tops out at two stars, so it's never the short way to three. */ maxStars: number;
}> = {
  e: { name: "সহজ", line: "ওদের টান কম, সংকেত আসে আগে, হাতে পাঁচটা ঘুড়ি। তারা বড়জোর ২টা।", kites: 5, strength: 0.78, warn: 1.45, maxStars: 2 },
  n: { name: "সাধারণ", line: "আসল সাকরাইন। একটাও ঘুড়ি না হারালে ৩ তারা।", kites: 3, strength: 1, warn: 1, maxStars: 3 },
  h: { name: "কঠিন", line: "ওদের হাত শক্ত, সংকেত আসে দেরিতে। হাতে তিনটা ঘুড়ি।", kites: 3, strength: 1.1, warn: 0.75, maxStars: 3 },
};
export const isMode = (value: string): value is Mode => (MODES as readonly string[]).includes(value);

export type WorldId = 0 | 1 | 2;
export const WORLDS: readonly { name: string; time: string }[] = [
  { name: "পৌষের বিকেল", time: "বিকেল" },
  { name: "কুয়াশার সন্ধ্যা", time: "সন্ধ্যা" },
  { name: "সাকরাইনের রাত", time: "রাত" },
];

export type RivalKind = "pichchi" | "hamla" | "jhotka" | "palai" | "boltu" | "minu" | "kalu";
export type RivalDef = {
  name: string;
  /** The personality, in one line. */
  line: string;
  /** Top speed while hovering, units a second. */
  speed: number;
  wanderX: number; wanderY: number;
  /** Its tension inside a প্যাঁচ: a swing around `mid`, once every `period` seconds. */
  mid: number; amp: number; period: number;
  /** × its saw. */
  strength: number;
  /** Seconds between dives at your string (0: never). */
  charge: number;
  /** Seconds between yanks inside a প্যাঁচ (0: never). */
  yank: number;
  /** Runs from your kite when it comes close. */
  dodge: boolean;
  /** Notches of সুতার জোর a champion has; 1 for everyone else. */
  notches: number;
  /** Index into LOOKS, and the size of its kite. */
  look: number;
  size: number;
};

/**
 * The rivals. The champions mix the others' tricks; each one's name appears only on its own finale.
 * `mid` sits in the green band (0.45–0.8) for a rival that pulls well; a wide `amp` swings it in and out.
 */
export const RIVALS: Record<RivalKind, RivalDef> = {
  pichchi: { name: "পিচ্চি", line: "সবে প্যাঁচ শিখছে, টান এলোমেলো।", speed: 34, wanderX: 40, wanderY: 22, mid: 0.4, amp: 0.38, period: 2.6, strength: 0.65, charge: 8, yank: 0, dodge: false, notches: 1, look: 4, size: 0.86 },
  hamla: { name: "হামলাবাজ", line: "নিজেই প্যাঁচ লাগাতে আসে। লাল তীর দেখলে তৈরি থাকো।", speed: 52, wanderX: 38, wanderY: 22, mid: 0.56, amp: 0.34, period: 2.1, strength: 0.88, charge: 4.2, yank: 0, dodge: false, notches: 1, look: 1, size: 1 },
  jhotka: { name: "ঝটকাবাজ", line: "প্যাঁচে ঝটকা দেয়। ওর সুতা জ্বললে ঢিল দাও।", speed: 46, wanderX: 34, wanderY: 22, mid: 0.6, amp: 0.26, period: 2.0, strength: 0.7, charge: 7, yank: 2.4, dodge: false, notches: 1, look: 5, size: 1 },
  palai: { name: "পালাই", line: "কাছে গেলেই পালায়। ওর সুতা ধরো নিচের দিকে।", speed: 64, wanderX: 50, wanderY: 30, mid: 0.52, amp: 0.3, period: 2.2, strength: 0.86, charge: 7, yank: 0, dodge: true, notches: 1, look: 0, size: 0.92 },
  boltu: { name: "বল্টু", line: "পাশের ছাদের বল্টু। হারলেও ছাড়ে না, আবার আসে।", speed: 56, wanderX: 36, wanderY: 20, mid: 0.6, amp: 0.3, period: 2.0, strength: 0.8, charge: 3.6, yank: 0, dodge: false, notches: 3, look: 3, size: 1.18 },
  minu: { name: "মিনু আপা", line: "লাল বাড়ির মিনু আপা। প্যাঁচ লাগায়, ঝটকাও দেয়।", speed: 56, wanderX: 34, wanderY: 20, mid: 0.62, amp: 0.26, period: 1.9, strength: 0.76, charge: 4.4, yank: 2.6, dodge: false, notches: 3, look: 2, size: 1.2 },
  kalu: { name: "ওস্তাদ কালু মিয়া", line: "পাড়ার সেরা ওস্তাদ। সব কৌশল জানে।", speed: 62, wanderX: 40, wanderY: 22, mid: 0.62, amp: 0.24, period: 1.8, strength: 0.77, charge: 4.6, yank: 2.6, dodge: true, notches: 4, look: 1, size: 1.24 },
};
export const BOSSES: readonly RivalKind[] = ["boltu", "minu", "kalu"];
export const isBoss = (kind: RivalKind) => RIVALS[kind].notches > 1;

export type LevelDef = {
  /** The পাড়া, and the same name "in" and "of" (সূত্রাপুরে, সূত্রাপুরের), so lines read as Bangla. */
  name: string; at: string; of: string;
  /** The one new thing, as a short title, and in one line for the title screen and the level list. */
  title: string;
  teach: string;
  world: WorldId;
  /** The rivals in the order they rise. */
  roster: readonly RivalKind[];
  /** Two rival kites in the sky at once. */
  pair: boolean;
  /** × every rival's pull on this level. */
  pull: number;
  /** × the side wind. */
  wind: number;
  gusts: boolean;
  lanterns: boolean;
  /** The world's last level, with a champion at the end of its list. */
  finale: boolean;
};

const level = (def: Partial<LevelDef> & Pick<LevelDef, "name" | "at" | "of" | "title" | "teach" | "world" | "roster">): LevelDef =>
  ({ pair: false, pull: 1, wind: 1, gusts: false, lanterns: false, finale: false, ...def });

export const LEVELS: readonly LevelDef[] = [
  level({ world: 0, name: "সূত্রাপুর", at: "সূত্রাপুরে", of: "সূত্রাপুরের", title: "প্রথম প্যাঁচ", teach: "ওর সুতার ওপর দিয়ে নিজের সুতা নাও, তারপর কাঁটা সবুজে রাখো।", roster: ["pichchi", "pichchi"], wind: 0.35 }),
  level({ world: 0, name: "লক্ষ্মীবাজার", at: "লক্ষ্মীবাজারে", of: "লক্ষ্মীবাজারের", title: "হাওয়ার ঝোঁক", teach: "ঢিল দিলে হাওয়া ঘুড়ি সরিয়ে নেয়। টানে ধরে রাখো।", roster: ["pichchi", "pichchi", "pichchi"], wind: 1.3 }),
  level({ world: 0, name: "বংশাল", at: "বংশালে", of: "বংশালের", pull: 1.3, title: "হামলাবাজ", teach: "কিনারায় লাল তীর মানে ও প্যাঁচ লাগাতে আসছে।", roster: ["pichchi", "hamla", "hamla"] }),
  level({ world: 0, name: "গেণ্ডারিয়া", at: "গেণ্ডারিয়ায়", of: "গেণ্ডারিয়ার", pull: 1.37, title: "পাশের ছাদের বল্টু", teach: "বল্টুর সুতায় তিন দাগ জোর। তিনবার প্যাঁচে হারাও।", roster: ["pichchi", "hamla", "boltu"], finale: true }),
  level({ world: 1, name: "তাঁতীবাজার", at: "তাঁতীবাজারে", of: "তাঁতীবাজারের", pull: 1.4, title: "ঝটকা", teach: "প্যাঁচের মধ্যে ওর সুতা জ্বলে উঠলে ঢিল দাও।", roster: ["hamla", "jhotka", "jhotka", "jhotka"] }),
  level({ world: 1, name: "ফরাশগঞ্জ", at: "ফরাশগঞ্জে", of: "ফরাশগঞ্জের", pull: 1.45, title: "দমকা হাওয়া", teach: "কিনারায় নীল তীর মানে দমকা আসছে। ঘুড়ি সামলাও।", roster: ["pichchi", "hamla", "jhotka", "hamla"], gusts: true }),
  level({ world: 1, name: "বাংলাবাজার", at: "বাংলাবাজারে", of: "বাংলাবাজারের", pull: 1.38, title: "জোড়া ঘুড়ি", teach: "আকাশে এবার দুটো ঘুড়ি একসঙ্গে।", roster: ["pichchi", "hamla", "jhotka", "hamla"], pair: true }),
  level({ world: 1, name: "লালবাগ", at: "লালবাগে", of: "লালবাগের", pull: 1.38, title: "লাল বাড়ির মিনু আপা", teach: "মিনু আপা প্যাঁচ লাগাতে আসে, ঝটকাও দেয়। তিন দাগ জোর।", roster: ["jhotka", "hamla", "minu"], gusts: true, finale: true }),
  level({ world: 2, name: "নারিন্দা", at: "নারিন্দায়", of: "নারিন্দার", pull: 1.23, title: "পালাই", teach: "কাছে গেলেই পালায়। ওর সুতা ধরো নিচের দিকে।", roster: ["palai", "palai", "hamla", "palai"] }),
  level({ world: 2, name: "কলতাবাজার", at: "কলতাবাজারে", of: "কলতাবাজারের", pull: 1.2, title: "ফানুস", teach: "ফানুসে সুতা লাগলে জট পাকে, একটু টান দেওয়া যায় না।", roster: ["hamla", "palai", "jhotka", "hamla"], lanterns: true }),
  level({ world: 2, name: "ওয়ারী", at: "ওয়ারীতে", of: "ওয়ারীর", pull: 1.15, title: "সব একসাথে", teach: "জোড়া ঘুড়ি, দমকা আর ফানুস একসঙ্গে।", roster: ["jhotka", "palai", "hamla", "jhotka", "palai"], pair: true, gusts: true, lanterns: true }),
  level({ world: 2, name: "শাঁখারীবাজার", at: "শাঁখারীবাজারে", of: "শাঁখারীবাজারের", pull: 1.12, title: "ওস্তাদ কালু মিয়া", teach: "পাড়ার ওস্তাদ: চার দাগ জোর, সব কৌশল একসঙ্গে।", roster: ["palai", "jhotka", "kalu"], gusts: true, lanterns: true, finale: true }),
];
export const LEVEL_COUNT = LEVELS.length;
export const isLevel = (value: number) => Number.isInteger(value) && value >= 1 && value <= LEVEL_COUNT;
export const levelDef = (value: number) => LEVELS[Math.min(LEVEL_COUNT, Math.max(1, Math.round(value))) - 1];
export const bossOf = (def: LevelDef): RivalKind | null => def.finale ? def.roster[def.roster.length - 1] : null;

/** Stars are kites kept: none lost 3, one lost 2, more 1; 0 when the নাটাই ran out. Easy tops out at two. */
export function starsOf(won: boolean, lost: number, mode: Mode = "n") {
  if (!won) return 0;
  return Math.min(MODE_INFO[mode].maxStars, lost === 0 ? 3 : lost === 1 ? 2 : 1);
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

/** `ektukhani-ahead-vo-katta`: a JSON list of level numbers; junk reads as none. */
export function readAhead(raw: string | null) {
  try {
    const parsed: unknown = JSON.parse(raw ?? "[]");
    return Array.isArray(parsed) ? [...new Set(parsed.filter((item): item is number => typeof item === "number" && isLevel(item)))].sort((a, b) => a - b) : [];
  } catch { return []; }
}

/** `ektukhani-times-vo-katta`: best tenths per "<level><mode>" (e.g. "4n"). Junk entries are dropped. */
export type Times = Record<string, number>;
export const timeKey = (value: number, mode: Mode) => `${value}${mode}`;
export function readTimes(raw: string | null): Times {
  const times: Times = {};
  try {
    const parsed: unknown = JSON.parse(raw ?? "{}");
    if (parsed && typeof parsed === "object") for (const [key, value] of Object.entries(parsed)) {
      if (/^(?:[1-9]|1[0-2])[enh]$/.test(key) && Number.isInteger(value) && (value as number) > 0 && (value as number) <= 36000) times[key] = value as number;
    }
  } catch { /* broken JSON: start fresh */ }
  return times;
}

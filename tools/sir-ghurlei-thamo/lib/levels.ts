// The levels as data: three classes (worlds) of four periods, each adding one thing, the modes, star rules and this phone's
// progress. Server-safe (no React, no DOM): challenge.ts and share.ts read the names from here.
import { starsFor, unlockedLevel, type LevelStars } from "../../../shared/game-core";

export const SLUG = "sir-ghurlei-thamo";

/** e: সহজ, n: সাধারণ, h: কঠিন. Links carry `d=e|h`; no `d` is সাধারণ. */
export type Mode = "e" | "n" | "h";
export const MODES: readonly Mode[] = ["e", "n", "h"];
export const MODE_INFO: Record<Mode, {
  name: string; line: string;
  /** × every warning (the hand coming down, the captain straightening, the flicker). */ tell: number;
  /** seconds added to the grace before a look counts. */ grace: number;
  /** × every look. */ look: number;
  /** Easy tops out at two stars, so it's never the short way to three. */ maxStars: number;
}> = {
  e: { name: "সহজ", line: "স্যার ঘোরার আগে অনেকক্ষণ থামেন। তারা বড়জোর ২টা।", tell: 1.4, grace: 0.08, look: 1, maxStars: 2 },
  n: { name: "সাধারণ", line: "আসল ক্লাস। ৩ তারা পেতে শেষ মুহূর্ত পর্যন্ত চালাতে হবে।", tell: 1, grace: 0, look: 1, maxStars: 3 },
  h: { name: "কঠিন", line: "ঘোরার আগে থামা ছোট, তাকানো লম্বা। তারার সময়ও সেভাবে মাপা।", tell: 0.85, grace: -0.03, look: 1.15, maxStars: 3 },
};
export const isMode = (value: string): value is Mode => (MODES as readonly string[]).includes(value);

export type World = { name: string; time: string; line: string };
export const WORLDS: readonly World[] = [
  { name: "ক্লাস থ্রি", time: "সকালের ক্লাস", line: "রোদ এসে পড়েছে জানালায়, বাংলা ক্লাস চলছে।" },
  { name: "ক্লাস সিক্স", time: "দুপুরের অঙ্ক", line: "টিফিনের পর গরম দুপুর, পাখা ঘুরছে।" },
  { name: "ক্লাস নাইন", time: "বৃষ্টির শেষ পিরিয়ড", line: "বাইরে ঝুম বৃষ্টি, টিউবলাইট জ্বলছে।" },
];

/** A second pair of eyes on a finale: how long it stays away, warns (straightens up, a shadow) and looks. [base, random]. */
export type Watcher = { kind: "monitor" | "door"; name: string; first: number; away: readonly [number, number]; tell: readonly [number, number]; look: readonly [number, number] };

export type LevelDef = {
  world: number;
  name: string;
  /** The one new thing, in one line, for the title and the level list. */
  teach: string;
  /** Benches the chit crosses, the first included (5–8); it always ends on the back bench. */
  benches: number;
  /** Benches a second while the chit walks. */
  speed: number;
  /** The first, calm stretch of writing, then every other one: [base, random] seconds. */
  first: readonly [number, number]; write: readonly [number, number];
  /** The hand coming down before a turn, and the look itself: [base, random] seconds. */
  tell: readonly [number, number]; look: readonly [number, number];
  /** Seconds into a look before moving counts: the turn itself is still happening. */
  grace: number;
  /** Chances per cycle: a harmless moment inside the writing (a cough, a peek), and how the turn goes (glasses, duster, a second look). */
  cough: number; peek: number; glasses: number; duster: number; double: number;
  /** Load-shedding: seconds of light between blackouts, and how long each lasts, [base, random]; null for none. */
  dark: readonly [number, number] | null; blackout: readonly [number, number];
  /** Benches whose kid sleeps: the chit is thrown over them. */
  sleepers: readonly number[];
  /** A finale: its watcher (none when the headmaster teaches), and the boss bar's name. */
  finale: { boss: string; watcher: Watcher | null } | null;
  /** The headmaster teaches this one. */
  head: boolean;
};

const level = (def: Partial<LevelDef> & Pick<LevelDef, "world" | "name" | "teach" | "benches">): LevelDef => ({
  speed: 0.85, first: [3.0, 0.8], write: [2.2, 1.4], tell: [0.85, 0.15], look: [1.1, 0.6], grace: 0.2,
  cough: 0, peek: 0, glasses: 0, duster: 0, double: 0, dark: null, blackout: [3, 1.5], sleepers: [], finale: null, head: false, ...def,
});

/** Throwing over a sleeper covers two benches in this many seconds, and can't be stopped once it starts. */
export const THROW_TIME = 0.9;
/** Seconds of the raised eyebrow after a catch; nothing moves meanwhile (the clock does). */
export const SCOLD = 2;
/** A finale ends on this catch. */
export const LIVES = 3;

const CAPTAIN: Watcher = { kind: "monitor", name: "ক্যাপ্টেন মিলি", first: 5, away: [2.6, 2.4], tell: [0.45, 0.2], look: [1.2, 0.7] };
const HEADMASTER: Watcher = { kind: "door", name: "দরজায় হেডস্যার", first: 5, away: [2.4, 2.4], tell: [0.8, 0.25], look: [1.3, 0.8] };

/** The ladder this phone and new links (`v=2`) play. tests/levels.test.ts asserts each is fair and the bots' rates. */
/** Each class sets its teacher's pace (kept the same through its four periods); each period adds one thing on top. */
const MORNING = { world: 0, speed: 0.65, write: [2.4, 1.3], tell: [0.85, 0.15], look: [1.0, 0.6], grace: 0.22 } as const;
const NOON = { world: 1, speed: 0.65, write: [2.3, 1.3], tell: [0.7, 0.15], look: [1.1, 0.7], grace: 0.2 } as const;
const RAIN = { world: 2, speed: 0.65, write: [2.2, 1.3], tell: [0.6, 0.15], look: [1.1, 0.7], grace: 0.2 } as const;

/** The ladder this phone and new links (`v=2`) play. tests/levels.test.ts asserts each is fair and the bots' rates. */
export const LEVELS: readonly LevelDef[] = [
  level({ ...MORNING, name: "চক চললে চালাও", teach: "চক চললে চেপে ধরো। হাত নামলেই ছেড়ে দাও।", benches: 5, speed: 0.8,
    first: [2.6, 0.5], write: [2.8, 1.2], tell: [1.0, 0.2], look: [1.0, 0.4], grace: 0.24 }),
  level({ ...MORNING, name: "খুক খুক", teach: "কাশির সময় স্যার বোর্ডের দিকেই থাকেন। চালিয়ে যাও।", benches: 6, cough: 0.45 }),
  level({ ...MORNING, name: "শুধু মাথা ঘোরানো", teach: "মাথা ঘুরল, কিন্তু চকের হাত বোর্ডে? ওটা ঘোরা না।", benches: 6, cough: 0.2, peek: 0.45 }),
  level({ ...MORNING, name: "ক্যাপ্টেন মিলি", teach: "সামনের বেঞ্চে ক্যাপ্টেন মিলিও মাঝে মাঝে পেছনে তাকায়। আগে সোজা হয়ে বসে।", benches: 7,
    cough: 0.15, peek: 0.3, finale: { boss: "ক্যাপ্টেন মিলি", watcher: CAPTAIN } }),
  level({ ...NOON, name: "চশমা মোছা", teach: "ঘুরেও চশমা মুছলে কিছু দেখেন না। চশমা চোখে উঠলেই থামো।", benches: 7, cough: 0.15, peek: 0.2, glasses: 0.45 }),
  level({ ...NOON, name: "ডাস্টার", teach: "ডাস্টারে বোর্ড মোছা শেষ হলেই চট করে ঘোরেন। মোছার শেষে থামো।", benches: 7, peek: 0.25, glasses: 0.2, duster: 0.4 }),
  level({ ...NOON, name: "ঘুমন্ত বন্ধু", teach: "ঘুমন্ত বন্ধুর ওপর দিয়ে চিরকুট ছুড়তে হয়, ছুড়লে আর থামে না। স্যার নতুন করে লেখা ধরলেই ছোড়ো।", benches: 8,
    peek: 0.25, glasses: 0.2, duster: 0.2, sleepers: [4] }),
  level({ ...NOON, name: "দরজায় হেডস্যার", teach: "বারান্দায় পায়ের শব্দ, দরজার কাচে ছায়া, তারপর হেডস্যার উঁকি দেন।", benches: 8,
    peek: 0.2, glasses: 0.2, duster: 0.2, sleepers: [3], finale: { boss: "হেডস্যার", watcher: HEADMASTER } }),
  level({ ...RAIN, name: "লোডশেডিং", teach: "বাতি গেলে অন্ধকারে কেউ দেখে না। টিউবলাইট মিটমিট করলেই বাতি ফিরছে।", benches: 8,
    peek: 0.2, glasses: 0.15, duster: 0.15, sleepers: [5], dark: [6, 4] }),
  level({ ...RAIN, name: "দুবার তাকানো", teach: "তাকানোর পর বোর্ডে ফিরে চকের হাত না উঠলে আবার তাকাবেন।", benches: 8,
    peek: 0.2, glasses: 0.15, duster: 0.15, double: 0.45, sleepers: [5], dark: [9, 5] }),
  level({ ...RAIN, name: "চট করে ঘোরা", teach: "এই স্যার হাত নামিয়েই ঘুরে যান। থামার সময় অর্ধেক।", benches: 8,
    tell: [0.42, 0.08], peek: 0.2, glasses: 0.15, duster: 0.15, double: 0.2, sleepers: [5], dark: [9, 5] }),
  level({ ...RAIN, name: "হেডস্যারের ক্লাস", teach: "শেষ পিরিয়ড নেন হেডস্যার নিজে, আজকের সব কৌশল নিয়ে। তাঁর ঘরে আইপিএস, বাতি যায় না।", benches: 8,
    write: [1.5, 0.9], tell: [0.4, 0.2], look: [1.3, 0.9], cough: 0.15, peek: 0.25, glasses: 0.12, duster: 0.2, double: 0.5, sleepers: [4],
    finale: { boss: "হেডস্যার", watcher: null }, head: true }),
];
export const LEVEL_COUNT = LEVELS.length;
export const isLevel = (value: number) => Number.isInteger(value) && value >= 1 && value <= LEVEL_COUNT;
export const levelDef = (value: number) => LEVELS[Math.min(LEVEL_COUNT, Math.max(1, Math.round(value) || 1)) - 1];

/** Stars for a finished class: within the careful time +1 s is three, +6 s two, finishing one; a lost finale none. Easy tops out at two. */
export function starsOf(tenths: number, targets: { three: number; two: number }, mode: Mode, won = true) {
  if (!won) return 0;
  return Math.min(MODE_INFO[mode].maxStars, starsFor(tenths, targets.three, targets.two, true));
}
/** Tenths to cut for the next star, or 0 when there's none to get in this mode. */
export function toNextStar(tenths: number, targets: { three: number; two: number }, mode: Mode) {
  const earned = starsOf(tenths, targets, mode);
  if (earned >= MODE_INFO[mode].maxStars) return 0;
  return tenths - (earned === 2 ? targets.three : targets.two);
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

/** `ektukhani-ahead-sir-ghurlei-thamo`: a JSON list of level numbers; junk reads as none. */
export function readAhead(raw: string | null) {
  try {
    const parsed: unknown = JSON.parse(raw ?? "[]");
    return Array.isArray(parsed) ? [...new Set(parsed.filter((item): item is number => typeof item === "number" && isLevel(item)))].sort((a, b) => a - b) : [];
  } catch { return []; }
}

/** `ektukhani-times-sir-ghurlei-thamo`: the best tenths per "<level><mode>" (e.g. "4n"). Junk entries are dropped. */
export type Bests = Record<string, number>;
export const bestKey = (value: number, mode: Mode) => `${value}${mode}`;
export function readBests(raw: string | null): Bests {
  const bests: Bests = {};
  try {
    const parsed: unknown = JSON.parse(raw ?? "{}");
    if (parsed && typeof parsed === "object") for (const [key, value] of Object.entries(parsed)) {
      if (/^(?:[1-9]|1[0-2])[enh]$/.test(key) && Number.isInteger(value) && (value as number) >= 1 && (value as number) <= 6000) bests[key] = value as number;
    }
  } catch { /* broken JSON: start fresh */ }
  return bests;
}

// Challenge links, saved-progress migration and the lines around a result.
// Server-safe: share.ts (and so /api/share) imports this, so it reaches only pure modules, never React.
// The jokes are about being late, never about a school or a teacher.
import { possessive } from "../../../shared/bangla";
import { challengeHash, readChallenge, readLevels, type LevelStars } from "../../../shared/game-core";
import { BASKET, BIKE, BRANCH, COW, GATE_M, LINE, MUD, PUDDLE, SIGN, TIRE } from "./course";
import { isMode, LEVEL_COUNT, levelDef, MODE_INFO, PAGES, starsOf, type Mode } from "./levels";

export const SLUG = "deri-hoye-gelo";
/** The 12-level ladder's useLevels slug, and the keys this phone keeps. */
export const LADDER = `${SLUG}-ladder`;
export const KEYS = {
  ladder: `ektukhani-levels-${LADDER}`, days: `ektukhani-levels-${SLUG}`, best: `ektukhani-best-${SLUG}`,
  ahead: `ektukhani-ahead-${SLUG}`, mode: `ektukhani-mode-${SLUG}`, intro: `ektukhani-intro-${SLUG}`,
};
/** Before the rewrite: six school days, each with its gate (মিটার), and the endless road. */
export const OLD_DAYS: readonly { name: string; gate: number }[] = [
  { name: "শনিবার", gate: 300 }, { name: "রবিবার", gate: 400 }, { name: "সোমবার", gate: 500 },
  { name: "মঙ্গলবার", gate: 600 }, { name: "বুধবার", gate: 800 }, { name: "বৃহস্পতিবার", gate: 1000 },
];
/** About 20 minutes at top speed. A real-time score can't be re-checked, so the cap only keeps links sane. */
export const MAX_METERS = 20000;
/** The endless road's first puddle is 28 m out: nobody can be stopped before about 24 m. */
export const MIN_METERS = 20;
export const MAX_TENTHS = 36000;

const digits = new Intl.NumberFormat("bn-BD", { useGrouping: false });
const decimal = new Intl.NumberFormat("bn-BD", { minimumFractionDigits: 1, maximumFractionDigits: 1, useGrouping: false });
export const bn = (value: number) => digits.format(value);
/** 423 → "৪২.৩" */
export const seconds = (tenths: number) => decimal.format(tenths / 10);

/**
 * A friend's run. `oldDay` (1–6) marks a link from before the rewrite with a school day: it opens level 2·day−1 with
 * the friend's seed, and the মিটার show only as their claim from the old game. Old links with no day are the endless
 * road, which is the same road as ever, so those are compared like new ones.
 */
export type Shared = {
  seed: number; meters: number; name: string; level: number; mode: Mode; slow: boolean;
  stumbles: number; pages: number; tenths: number; won: boolean; oldDay: number;
};

const NEW_KEYS = ["v", "m", "k", "p", "c", "d"];

/**
 * New: `#s=<seed>&t=<মিটার>&l=<0 যত দূর পারো, 1–12>&v=2&m=<e|h>&k=<stumbles>&p=<pages>&c=<tenths>&d=1&n=<name>`.
 * Old: `#s=&t=&n=` (the endless road) and `#s=&t=&l=<1–6>&n=` (a school day). Anything impossible rejects the link.
 * Add `&og=1` to open the friend's finished card for a preview image.
 */
export function parseShared(hash: string): Shared | null {
  const challenge = readChallenge(hash, { maxTarget: MAX_METERS, extraKeys: ["l", "og", ...NEW_KEYS] });
  if (!challenge) return null;
  const { l, v, m, k, p, c, d, og } = challenge.extra;
  // `og=1` only asks for the preview-image view (the friend's own card, nothing saved); it is never written back.
  if (og !== undefined && og !== "1") return null;
  const base = { seed: challenge.seed, meters: challenge.target, name: challenge.name, mode: "n" as Mode, slow: false, stumbles: 0, pages: 0, tenths: 0, won: false, oldDay: 0 };
  if (v === undefined) {
    if (NEW_KEYS.some(key => challenge.extra[key] !== undefined)) return null;
    if (l === undefined) return challenge.target < MIN_METERS ? null : { ...base, level: 0 };
    if (!/^[1-6]$/.test(l) || challenge.target < MIN_METERS || challenge.target > OLD_DAYS[Number(l) - 1].gate) return null;
    return { ...base, level: 2 * Number(l) - 1, oldDay: Number(l) };
  }
  if (v !== "2" || !/^(?:0|[1-9]\d?)$/.test(l ?? "") || (d !== undefined && d !== "1") || (m !== undefined && (m === "n" || !isMode(m)))) return null;
  const level = Number(l), slow = d === "1", mode: Mode = m === undefined ? "n" : m as Mode;
  if (level > LEVEL_COUNT) return null;
  if (c !== undefined && !/^[1-9]\d{0,4}$/.test(c)) return null;
  const tenths = c === undefined ? 0 : Number(c);
  if (tenths > MAX_TENTHS) return null;
  if (level === 0) {
    if (k !== undefined || p !== undefined || challenge.target < MIN_METERS) return null;
    return { ...base, level, mode, slow, tenths };
  }
  if (!/^\d{1,2}$/.test(k ?? "") || !/^[0-3]$/.test(p ?? "") || c === undefined) return null;
  const gate = levelDef(level).gate;
  if (challenge.target > gate) return null;
  return { ...base, level, mode, slow, stumbles: Number(k), pages: Number(p), tenths, won: challenge.target === gate };
}

/**
 * New links always carry v=2. An old day link is written back in its old form (`l=<day>`, no new keys), so it still
 * opens level 2·day−1 and its metres stay a claim from the old game.
 */
export function sharedHash({ seed, meters, name, level, mode, slow, stumbles, pages, tenths, oldDay = 0 }: Omit<Shared, "won" | "oldDay"> & { oldDay?: number }) {
  if (oldDay) return challengeHash({ seed, target: meters, name, extra: { l: oldDay } });
  const extra: Record<string, string | number> = { l: level, v: 2 };
  if (mode !== "n") extra.m = mode;
  if (level) { extra.k = Math.min(99, stumbles); extra.p = Math.min(PAGES, pages); }
  if (tenths > 0) extra.c = Math.min(MAX_TENTHS, tenths);
  if (slow) extra.d = 1;
  return challengeHash({ seed, target: meters, name, extra });
}

export const starsOfShared = (shared: Shared) => shared.oldDay ? 0 : starsOf(shared.won, shared.stumbles, shared.pages, shared.level);

/* ---------- saved progress ---------- */

/**
 * Old phones kept the six days' stars, or before that only a best on the endless road (every day whose gate it passed
 * counts as cleared with 1 star, up to half the week). Run once, before the 12-level ladder is first read: day d
 * opens levels 2d−1 and 2d with its stars. Returns the new ladder, or null when there is nothing to move.
 */
export function migrateLadder(ladderRaw: string | null, daysRaw: string | null, bestRaw: string | null) {
  if (ladderRaw !== null) return null;
  let days: LevelStars = {};
  if (daysRaw !== null) days = readLevels(daysRaw, OLD_DAYS.length);
  else if (bestRaw !== null && Number.isFinite(Number(bestRaw))) {
    const passed = Math.min(Math.floor(OLD_DAYS.length / 2), OLD_DAYS.filter(day => day.gate <= Number(bestRaw)).length);
    for (let day = 1; day <= passed; day++) days[day] = 1;
  }
  const ladder: LevelStars = {};
  for (const [day, earned] of Object.entries(days)) { ladder[2 * Number(day) - 1] = earned; ladder[2 * Number(day)] = earned; }
  return Object.keys(ladder).length ? JSON.stringify(readLevels(JSON.stringify(ladder), LEVEL_COUNT)) : null;
}

/* ---------- words ---------- */

const who = (name: string) => name || "বন্ধু";

/** What tripped you up, said kindly. */
export function bumpLine(kind: number) {
  switch (kind) {
    case PUDDLE: return "ছপাৎ! জুতা-মোজা কাদায় মাখামাখি।";
    case MUD: return "পা আটকে গেল কাদায়! স্যান্ডেল খুঁজতে খুঁজতে দেরি।";
    case BASKET: return "সবজির ঝাঁকায় হোঁচট! বেগুন গড়াগড়ি।";
    case BIKE: return "সাইকেলে ধাক্কা! ক্রিং ক্রিং।";
    case COW: return "গরুটা রাস্তা ছেড়ে নড়লই না!";
    case LINE: return "ভেজা গামছা মুখে জড়িয়ে গেল!";
    case BRANCH: return "ডালে টুক করে মাথা ঠুকল!";
    case SIGN: return "সাইনবোর্ডে মাথা ঠুক! দোকানি হাসছে।";
    case TIRE: return "চাকা এসে পায়ে লাগল! পেছনে ছেলেটা জিভ কাটল।";
    default: return "উফ, একটুর জন্য!";
  }
}

/** The endless road's kind line, by how far you got. */
export const bands = [
  { min: 0, line: "জুতার ফিতাটা বেঁধে নাও, তারপর আবার!" },
  { min: 100, line: "গলির মোড় পার! কাল দশ মিনিট আগে উঠলেই হবে।" },
  { min: 300, line: "মাঠ পর্যন্ত চলে এসেছ, গেট আর বেশি দূরে না!" },
  { min: 600, line: "গেট প্রায় দেখা যাচ্ছিল! আর একটু হলেই।" },
  { min: GATE_M, line: "ঘণ্টা পড়ার আগেই গেটে!" },
  { min: 1500, line: "এত জোরে? গেটের দারোয়ান চাচাও অবাক!" },
] as const;
export const endlessLine = (meters: number) => [...bands].reverse().find(band => meters >= band.min)!.line;

/** One dry line for a result. */
export function humanLine({ level, won, stumbles, pages, meters }: { level: number; won: boolean; stumbles: number; pages: number; meters: number }) {
  if (!level) return endlessLine(meters);
  if (!won) return stumbles === 1 ? "একবার হোঁচটেই সময় ফুরিয়ে গেল।" : stumbles > 1 ? `${bn(stumbles)} বার হোঁচট খেয়ে সময় ফুরিয়ে গেল।` : `${bn(meters)} মিটারে ঘণ্টা শুনলে।`;
  if (!stumbles && pages >= PAGES) return "একবারও হোঁচট নেই, খাতার সব পাতাও ব্যাগে।";
  if (!stumbles) return "একবারও হোঁচট খাওনি। ঠিক সময়ে গেটে!";
  return stumbles === 1 ? "একবার হোঁচট খেয়েও ঠিক সময়ে গেটে।" : `${bn(stumbles)} বার হোঁচট খেয়েও ঠিক সময়ে গেটে।`;
}

/** The big line on the end screen. */
export const headline = (level: number, won: boolean, meters: number) =>
  !level ? (meters >= GATE_M ? "আজ আর লেট না!" : "বেল পড়ে গেল!") : won ? "ঠিক সময়ে গেটে!" : "দেরি হয়ে গেল!";

/** What one more try would change, with the exact number; "" when nothing is close. */
export function nearMiss({ level, won, stumbles, pages, meters, best, mode }: { level: number; won: boolean; stumbles: number; pages: number; meters: number; best: number | null; mode: Mode }) {
  if (!level) return best !== null && meters < best && best - meters <= Math.max(25, Math.round(best * 0.12)) ? `আর ${bn(best - meters)} মিটার গেলেই নতুন সেরা।` : "";
  const def = levelDef(level);
  if (!won) {
    const extra = stumbles - MODE_INFO[mode].stumbles;
    return extra > 0 && extra <= 2 ? `আর ${bn(extra)}টা হোঁচট কম হলেই সময়মতো গেটে।` : `আর ${bn(def.gate - meters)} মিটার গেলেই ${def.name} পার।`;
  }
  if (stumbles && pages < PAGES) return "হোঁচট না খেলে আর খাতার সব পাতা কুড়ালে ৩ তারা।";
  if (stumbles) return "একবারও হোঁচট না খেলেই ৩ তারা।";
  if (pages < PAGES) return `আর ${bn(PAGES - pages)}টা পাতা কুড়ালেই ৩ তারা।`;
  return "";
}

const placeOf = (level: number) => level ? `লেভেল ${bn(level)}-এ` : "যত দূর পারো-তে";

/** The friend's claim, said honestly: their own phone's play (or the old game's metres). */
export function friendLine(shared: Shared) {
  const name = who(shared.name);
  if (shared.oldDay) return `${name} আগের খেলায় ${OLD_DAYS[shared.oldDay - 1].name} ${bn(shared.meters)} মিটার গিয়েছিল।`;
  if (!shared.level) return `${name} যত দূর পারো-তে ${bn(shared.meters)} মিটার গেছে।`;
  const def = levelDef(shared.level);
  if (shared.won) return `${name} ${def.name} পার হয়েছে ${seconds(shared.tenths)} সেকেন্ডে${shared.stumbles === 0 ? ", একবারও হোঁচট না খেয়ে" : ""}।`;
  return `${name} ${placeOf(shared.level)} ${bn(shared.meters)} মিটার গিয়েছিল, তারপর ঘণ্টা পড়ে গেল।`;
}
export const friendClaim = (shared: Shared) => shared.oldDay
  ? `একই রাস্তার নম্বর, নতুন লেভেলে। আগের খেলার স্কোর, ${possessive(who(shared.name))} নিজের ফোনে খেলা।`
  : `একই রাস্তা, একই কাদা, একই চাকা। ${possessive(who(shared.name))} নিজের ফোনের স্কোর${shared.slow ? ", ধীরে খেলায়" : ""}।`;

/** Your run against the friend's on the same road: who made it, then fewer stumbles, more pages, then the time. */
export function compareLine(you: { won: boolean; stumbles: number; pages: number; tenths: number; meters: number }, friend: Shared) {
  if (friend.oldDay) return "";
  const name = who(friend.name), whose = friend.name ? possessive(friend.name) : "বন্ধুর";
  if (!friend.level || (!you.won && !friend.won)) {
    const mine = you.meters, theirs = friend.meters;
    if (mine > theirs) return `${whose} চেয়ে ${bn(mine - theirs)} মিটার বেশি!`;
    if (mine === theirs) return `${name} আর তুমি একদম সমান সমান!`;
    if (theirs - mine <= Math.max(25, theirs * 0.12)) return `আর একটু হলেই! ${whose} চেয়ে মাত্র ${bn(theirs - mine)} মিটার কম।`;
    return `${name} এবার ${bn(theirs - mine)} মিটার এগিয়ে। একই রাস্তায় আরেকবার?`;
  }
  if (you.won && !friend.won) return `${name} সময়মতো পৌঁছাতে পারেনি, তুমি পারলে।`;
  if (!you.won && friend.won) return `${name} ঠিক সময়ে পৌঁছেছে। আরেকবার?`;
  if (you.stumbles !== friend.stumbles) return you.stumbles < friend.stumbles ? `${whose} চেয়ে ${bn(friend.stumbles - you.stumbles)} বার কম হোঁচট।` : `${name} ${bn(you.stumbles - friend.stumbles)} বার কম হোঁচট খেয়েছে।`;
  if (you.pages !== friend.pages) return you.pages > friend.pages ? `${whose} চেয়ে ${bn(you.pages - friend.pages)}টা পাতা বেশি কুড়ালে।` : `${name} ${bn(friend.pages - you.pages)}টা পাতা বেশি কুড়িয়েছে।`;
  const gap = friend.tenths - you.tenths;
  if (gap > 0) return `${whose} চেয়ে ${seconds(gap)} সেকেন্ড আগে!`;
  if (gap === 0) return `একদম সমান সময়, ${seconds(you.tenths)} সেকেন্ড।`;
  return -gap <= 10 ? `আর একটু হলেই! মাত্র ${seconds(-gap)} সেকেন্ড পিছিয়ে।` : `${name} এখনো ${seconds(-gap)} সেকেন্ড এগিয়ে।`;
}

export function previewTitle(shared: Shared) {
  const name = shared.name;
  if (shared.oldDay) {
    const day = OLD_DAYS[shared.oldDay - 1].name;
    return name ? `${name} ${day} স্কুলের পথে ${bn(shared.meters)} মিটার গেছে। তুমি পারবে?` : `${day} স্কুলের পথে ${bn(shared.meters)} মিটার! তুমি পারবে?`;
  }
  if (!shared.level) return name ? `${name} স্কুলের পথে ${bn(shared.meters)} মিটার গেছে। তুমি পারবে?` : `স্কুলের পথে ${bn(shared.meters)} মিটার! তুমি পারবে?`;
  const def = levelDef(shared.level);
  if (shared.won) return `${name || "এক বন্ধু"} ঘণ্টার আগেই ${def.name} পার, ${seconds(shared.tenths)} সেকেন্ডে। তুমি পারবে?`;
  return `${name || "এক বন্ধু"} ${def.name}-এ ${bn(shared.meters)} মিটার গিয়ে দেরি করে ফেলল। তুমি পারবে?`;
}

export function caption(shared: Pick<Shared, "meters" | "level" | "won">) {
  if (!shared.level) return shared.meters >= GATE_M
    ? `ঘণ্টা পড়ার আগেই গেটে! স্কুলের পথে ${bn(shared.meters)} মিটার গেলাম। একই রাস্তায় তুমি কত দূর যাবে?`
    : `দেরি হয়ে গেল! তবু স্কুলের পথে ${bn(shared.meters)} মিটার গেলাম। একই রাস্তায় তুমি কত দূর যাবে?`;
  const def = levelDef(shared.level);
  return shared.won
    ? `দেরি হয়ে গেল!-তে ${def.name} পার, ঘণ্টা পড়ার আগেই। একই রাস্তায় তুমি পারবে?`
    : `দেরি হয়ে গেল! ${def.name}-এ ${bn(shared.meters)} মিটার এসে ঘণ্টা শুনলাম। একই রাস্তায় তুমি পারবে?`;
}

/** The friend's road fits a run when the seed, the level and (for new links) the mode are the same. */
export const friendFits = (friend: Shared | null, seed: number, level: number, mode: Mode) =>
  Boolean(friend && friend.seed === seed && friend.level === level && (friend.oldDay || !friend.level || friend.mode === mode));

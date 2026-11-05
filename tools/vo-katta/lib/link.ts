// Challenge links, the kite looks, saved-progress migration and the lines around a result.
// Server-safe: share.ts (and so /api/share) imports this, so it reaches only pure modules, never React.
import { possessive } from "../../../shared/bangla";
import { challengeHash, readChallenge, type LevelStars } from "../../../shared/game-core";
import { colorOf, colors, patternOf, patterns, type ColorId, type PatternId } from "../../ghuri/lib/ghuri";
import { isMode, LEVEL_COUNT, levelDef, MODE_INFO, starsOf, type Mode } from "./levels";

export const SLUG = "vo-katta";
/** Before the rewrite an evening was three rounds of at most ten rivals, so no old link claims more. */
export const MAX_CUTS = 30;
const OLD_LEVELS = 10;
export const MAX_TENTHS = 36000;

const digits = new Intl.NumberFormat("bn-BD", { useGrouping: false });
const decimal = new Intl.NumberFormat("bn-BD", { minimumFractionDigits: 1, maximumFractionDigits: 1, useGrouping: false });
export const bn = (value: number) => digits.format(value);
/** 423 → "৪২.৩" */
export const seconds = (tenths: number) => decimal.format(tenths / 10);

/** A kite's look, in ঘুড়ি আর ফানুস's own ids, so a kite made there can fly here. */
export type Look = { pattern: PatternId; color: ColorId };
/** Six ready kites, one per pattern, each in its own colour. */
export const LOOKS: readonly Look[] = patterns.map((pattern, index) => ({ pattern: pattern.id, color: colors[index].id }));

export function readLook(pattern: string | null | undefined, color: string | null | undefined): Look | null {
  const p = patternOf(pattern ?? ""), c = colorOf(color ?? "");
  return p && c ? { pattern: p.id, color: c.id } : null;
}

/** ঘুড়ি আর ফানুস keeps a kite in its #hash as o=kite&p=…&c=…; read just the look from it (never its text). */
export function lookFromGhuri(hash: string): Look | null {
  if (hash.length > 400) return null;
  const params = new URLSearchParams(hash.replace(/^#/, ""));
  return params.get("o") === "kite" ? readLook(params.get("p"), params.get("c")) : null;
}

/**
 * A friend's evening. `old`: a link from before the rewrite (no `v`), which carries only the count of a three-round
 * evening; it opens the same seed on the same level number, and its count shows as the friend's claim from the old game.
 */
export type Shared = {
  seed: number; cuts: number; name: string; look: Look | null; level: number; mode: Mode;
  /** v=2 only: kites lost, tenths of a second, and whether the list was cleared. */
  lost: number; tenths: number; won: boolean;
  old: boolean;
};

/**
 * `#s=<seed>&t=<cuts>&p=&c=&l=<level>&v=2&d=<mode>&k=<lost>&m=<tenths>&n=<name>`. Unknown keys are dropped, a bad kite is
 * dropped, and anything impossible (more cuts than the level has rivals, more kites lost than the নাটাই holds) rejects the link.
 */
export function parseShared(hash: string): Shared | null {
  const challenge = readChallenge(hash, { maxTarget: MAX_CUTS, extraKeys: ["p", "c", "l", "v", "d", "k", "m"] });
  if (!challenge) return null;
  const { extra } = challenge, raw = extra.l ?? "1", level = Number(raw), look = readLook(extra.p, extra.c);
  if (!/^[1-9]\d?$/.test(raw)) return null;
  if (extra.v === undefined) {
    if (level > OLD_LEVELS || extra.d !== undefined) return null;
    return { seed: challenge.seed, cuts: challenge.target, name: challenge.name, look, level, mode: "n", lost: 0, tenths: 0, won: false, old: true };
  }
  if (extra.v !== "2" || level > LEVEL_COUNT) return null;
  const mode = extra.d ?? "n", lost = Number(extra.k ?? "x"), tenths = Number(extra.m ?? "x");
  if (!isMode(mode) || !/^\d$/.test(extra.k ?? "") || !/^[1-9]\d{0,4}$/.test(extra.m ?? "") || tenths > MAX_TENTHS) return null;
  const rivals = levelDef(level).roster.length, kites = MODE_INFO[mode].kites;
  if (challenge.target > rivals || lost > kites) return null;
  const won = challenge.target === rivals && lost < kites;
  // A run ends either with every rival cut or with every kite gone.
  if (!won && lost !== kites) return null;
  return { seed: challenge.seed, cuts: challenge.target, name: challenge.name, look, level, mode, lost, tenths, won, old: false };
}

/** Old links write exactly the old format; new ones add v=2 with the mode (off normal), kites lost and time. */
export const sharedHash = ({ seed, cuts, name, look, level, mode, lost, tenths, old }: Omit<Shared, "won">) => challengeHash({
  seed, target: cuts, name,
  extra: {
    ...(look && { p: look.pattern, c: look.color }),
    ...(old ? (level > 1 ? { l: level } : {}) : { l: level, v: 2, ...(mode === "n" ? {} : { d: mode }), k: lost, m: tenths }),
  },
});

export const starsOfShared = (shared: Shared) => shared.old ? 0 : starsOf(shared.won, shared.lost, shared.mode);

/* ---------- saved progress ---------- */

/** Before levels this phone kept one best count for the one evening there was (now level 1): 1, 4 and 7 cuts were its stars. */
export function migrateBest(stars: LevelStars, oldBest: string | null) {
  const cuts = Number(oldBest);
  if (Object.keys(stars).length || oldBest === null || oldBest === "" || !Number.isInteger(cuts) || cuts < 1 || cuts > MAX_CUTS) return 0;
  return cuts >= 7 ? 3 : cuts >= 4 ? 2 : 1;
}

/* ---------- words ---------- */

/** One dry line for a result, by how it went. */
export function humanLine(won: boolean, lost: number, cuts: number) {
  if (!won) return cuts ? `${bn(cuts)}টা কেটেছ, তারপর নাটাই খালি। আরেকবার?` : "প্রথম সাকরাইনে সবারই সুতা জড়ায়। আরেকবার?";
  if (lost === 0) return "একটাও ঘুড়ি হারাওনি। ছাদের সবাই তোমার নাটাই দেখছে।";
  if (lost === 1) return "একটা ঘুড়ি গেছে, বাকি আকাশটা তোমার।";
  return "নাটাইয়ে শেষ ঘুড়িটা নিয়ে পার হলে।";
}

const levelWord = (level: number) => `লেভেল ${bn(level)}`;

/** The friend's claim, said honestly: their own phone's play (or the old game's count). */
export function friendLine(shared: Shared) {
  const who = shared.name || "বন্ধু";
  if (shared.old) return `${who} আগের ভো-কাট্টায় ${bn(shared.cuts)}টা ঘুড়ি কেটেছিল।`;
  const def = levelDef(shared.level);
  if (!shared.won) return shared.cuts ? `${who} ${def.at} ${bn(shared.cuts)}টা ঘুড়ি কেটেছে।` : `${who} ${def.at} একটাও ঘুড়ি কাটতে পারেনি।`;
  return `${who} ${def.name} পার করেছে ${seconds(shared.tenths)} সেকেন্ডে${shared.lost === 0 ? ", একটাও ঘুড়ি না হারিয়ে" : ""}।`;
}
export const friendClaim = (shared: Shared) => shared.old
  ? `একই আকাশ, ${levelWord(shared.level)}। আগের খেলার স্কোর, ${possessive(shared.name || "বন্ধু")} নিজের ফোনে খেলা।`
  : `একই আকাশ, একই বাতাস। ${possessive(shared.name || "বন্ধু")} নিজের ফোনের স্কোর।`;

/** Your evening against the friend's on the same sky: who cleared, then fewer kites lost, then the time. */
export function compareLine(you: { won: boolean; lost: number; tenths: number; cuts: number }, friend: Shared) {
  const who = friend.name || "বন্ধু";
  if (friend.old) return "";
  if (you.won && !friend.won) return `${who} পার হতে পারেনি, তুমি পারলে।`;
  if (!you.won && friend.won) return `${who} পার হয়েছে। আরেকবার?`;
  if (!you.won) return you.cuts > friend.cuts ? `${possessive(who)} চেয়ে ${bn(you.cuts - friend.cuts)}টা বেশি কেটেছ।` : you.cuts === friend.cuts ? `${who}ও ${bn(friend.cuts)}টা কেটেছে। সমান।` : `${who} এখনো ${bn(friend.cuts - you.cuts)}টা এগিয়ে।`;
  if (you.lost !== friend.lost) return you.lost < friend.lost ? `${possessive(who)} চেয়ে ${bn(friend.lost - you.lost)}টা ঘুড়ি কম হারিয়েছ।` : `${who} ${bn(you.lost - friend.lost)}টা ঘুড়ি কম হারিয়েছে।`;
  const gap = friend.tenths - you.tenths;
  if (gap > 0) return `${possessive(who)} চেয়ে ${seconds(gap)} সেকেন্ড আগে!`;
  if (gap === 0) return `একদম সমান সময়, ${seconds(you.tenths)} সেকেন্ড।`;
  return -gap <= 30 ? `আর একটু হলেই! মাত্র ${seconds(-gap)} সেকেন্ড পিছিয়ে।` : `${who} এখনো ${seconds(-gap)} সেকেন্ড এগিয়ে।`;
}

export const previewTitle = (shared: Shared) => {
  if (shared.old) return shared.name ? `${shared.name} ${bn(shared.cuts)}টা ঘুড়ি কেটেছে। তুমি পারবে?` : `সাকরাইনের ছাদে ${bn(shared.cuts)}টা ঘুড়ি কাটা! তুমি পারবে?`;
  const who = shared.name || "এক বন্ধু", def = levelDef(shared.level);
  return shared.won
    ? `${who} ${def.of} ${bn(shared.cuts)}টা ঘুড়িই কেটেছে, ${seconds(shared.tenths)} সেকেন্ডে। তুমি পারবে?`
    : `${who} ${def.at} ${bn(shared.cuts)}টা ঘুড়ি কেটেছে। তুমি পারবে?`;
};

export const caption = (shared: Pick<Shared, "cuts" | "level" | "won">) => shared.cuts > 0
  ? `সাকরাইনের ছাদে ${bn(shared.cuts)}টা ঘুড়ি কাটলাম, ভো-কাট্টা! ${levelDef(shared.level).of} একই আকাশ তোমার জন্য রাখলাম, দেখি কয়টা কাটো।`
  : "সাকরাইনের ছাদে প্যাঁচ খেলতে গিয়ে এবার একটাও কাটতে পারিনি! একই আকাশ তোমার জন্য রাখলাম, দেখি তুমি পারো কি না।";

export const cutLine = (cuts: number, name = "") => name ? `${name} ${bn(cuts)}টা ঘুড়ি কাটল` : `${bn(cuts)}টা ঘুড়ি কাটলাম`;

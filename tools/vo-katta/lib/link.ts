// Scoring, challenge links and preview text. Server-safe: the share routes load this file, so it imports only pure modules.
import { possessive } from "../../../shared/bangla";
import { challengeHash, readChallenge, starsFor, type LevelStars } from "../../../shared/game-core";
import { colorOf, colors, patternOf, patterns, type ColorId, type PatternId } from "../../ghuri/lib/ghuri";

export const ROUNDS = 3;
/** Each round has at most this many rival kites, so a higher score is a forged link. */
export const RIVALS_PER_ROUND = 10;
export const MAX_CUTS = ROUNDS * RIVALS_PER_ROUND;

/**
 * Ten Old Dhaka পাড়া, one evening of three rounds each, every one a step harder: quicker rival kites (`speed`), a steadier rival pull
 * (`steady` shrinks its swing in and out of the green), stronger hands (`strength`), the first roof coming to hook you (`attack0`, seconds
 * between tries), more frequent hooks (`attack` scales the gap), and gustier wind (`wind`). Level 1 is the original evening, so old links
 * replay unchanged. `pass` cuts clear the level (1 star); `two` and `three` are the marks for 2 and 3 stars.
 */
export const LEVELS = [
  { name: "সূত্রাপুর", note: "তিন ছাদ, তিন রাউন্ড। প্রথম ছাদ সহজ।", speed: 1, steady: 1, strength: 0, attack0: 0, attack: 1, wind: 1, pass: 1, two: 4, three: 7 },
  { name: "লক্ষ্মীবাজার", note: "ঘুড়িগুলো ছোটে আরেকটু জোরে।", speed: 1.15, steady: 1, strength: 0, attack0: 0, attack: 1, wind: 1, pass: 2, two: 5, three: 8 },
  { name: "শাঁখারীবাজার", note: "প্রথম ছাদও প্যাঁচ লাগাতে আসে।", speed: 1.15, steady: 1, strength: 0, attack0: 6, attack: 1, wind: 1, pass: 2, two: 5, three: 9 },
  { name: "তাঁতীবাজার", note: "ওদের টান আরও মাপা।", speed: 1.15, steady: 0.85, strength: 0, attack0: 6, attack: 1, wind: 1, pass: 2, two: 6, three: 10 },
  { name: "গেণ্ডারিয়া", note: "ওদের হাতে জোর বেশি।", speed: 1.15, steady: 0.85, strength: 0.05, attack0: 6, attack: 1, wind: 1, pass: 2, two: 6, three: 10 },
  { name: "ফরাশগঞ্জ", note: "দমকা বাতাস, ঘুড়ি সরে বেশি।", speed: 1.15, steady: 0.85, strength: 0.05, attack0: 6, attack: 1, wind: 1.3, pass: 2, two: 6, three: 11 },
  { name: "বাংলাবাজার", note: "প্যাঁচ লাগাতে আসে ঘন ঘন।", speed: 1.15, steady: 0.85, strength: 0.05, attack0: 5, attack: 0.8, wind: 1.3, pass: 3, two: 7, three: 11 },
  { name: "নারিন্দা", note: "ঘুড়ি ছোটে আরও জোরে।", speed: 1.3, steady: 0.85, strength: 0.05, attack0: 5, attack: 0.8, wind: 1.3, pass: 3, two: 7, three: 12 },
  { name: "কলতাবাজার", note: "টান মাপা, হাতেও জোর।", speed: 1.3, steady: 0.7, strength: 0.1, attack0: 5, attack: 0.8, wind: 1.3, pass: 3, two: 6, three: 11 },
  { name: "ওয়ারী", note: "পাড়ার সেরা ওস্তাদেরা, সব একসঙ্গে।", speed: 1.4, steady: 0.7, strength: 0.15, attack0: 4, attack: 0.7, wind: 1.5, pass: 3, two: 6, three: 12 },
] as const;
export const LEVEL_COUNT = LEVELS.length;
const levelOf = (level: number) => LEVELS[Math.min(LEVEL_COUNT, Math.max(1, level)) - 1];

/** Stars for the kites cut on a level: 0 below its pass mark. */
export function starsOf(cuts: number, level: number) {
  const { pass, two, three } = levelOf(level);
  return cuts < pass ? 0 : starsFor(cuts, three, two);
}

/** The near miss with the exact gap: kites to the next star, or (at 3 stars) to this phone's best on the level. */
export function nearLine(cuts: number, level: number, best: number | null) {
  const { pass, two, three } = levelOf(level), stars = starsOf(cuts, level);
  const mark = [pass, two, three].find(value => cuts < value);
  if (mark !== undefined) return `আর ${bn(mark - cuts)}টা কাটলেই ${stars ? `${bn(stars + 1)} তারা` : "এই পাড়া পার"}।`;
  return best !== null && cuts <= best && best < MAX_CUTS ? `আর ${bn(best - cuts + 1)}টা কাটলেই নতুন সেরা।` : "";
}

/** Before levels this phone kept one best count for the one evening there was (now level 1). Its stars, or 0 when there is nothing to move. */
export function migrateBest(stars: LevelStars, oldBest: string | null) {
  const cuts = Number(oldBest);
  if (Object.keys(stars).length || oldBest === null || oldBest === "" || !Number.isInteger(cuts) || cuts < 0 || cuts > MAX_CUTS) return 0;
  return starsOf(cuts, 1);
}

const digits = new Intl.NumberFormat("bn-BD", { useGrouping: false });
export const bn = (value: number) => digits.format(value);

/** A kite's look, in ঘুড়ি আর ফানুস's own ids, so a kite made there can fly here. */
export type Look = { pattern: PatternId; color: ColorId };
/** Six ready kites, one per pattern, each in its own colour; "ঘুড়ি বদলাও" walks through them. */
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

export type Shared = { seed: number; cuts: number; name: string; look: Look | null; level: number };

/**
 * s = seed, t = kites cut, n = name, p and c = the sharer's kite, l = the পাড়া (links from before levels have none and open level 1).
 * A bad kite is dropped; a bad score or level rejects the link.
 */
export function parseShared(hash: string): Shared | null {
  const challenge = readChallenge(hash, { maxTarget: MAX_CUTS, extraKeys: ["p", "c", "l"] });
  if (!challenge) return null;
  const rawLevel = challenge.extra.l ?? "1", level = Number(rawLevel);
  if (!/^[1-9]\d?$/.test(rawLevel) || level > LEVEL_COUNT) return null;
  return { seed: challenge.seed, cuts: challenge.target, name: challenge.name, look: readLook(challenge.extra.p, challenge.extra.c), level };
}

export const sharedHash = ({ seed, cuts, name, look, level }: Shared) =>
  challengeHash({ seed, target: cuts, name, extra: { ...(look && { p: look.pattern, c: look.color }), ...(level > 1 && { l: level }) } });

export const bands = [
  { below: 1, line: "প্রথম সাকরাইনে সবারই সুতা জড়ায়। আরেকবার?" },
  { below: 3, line: "হাত খুলছে! পাশের ছাদ টের পেয়ে গেছে।" },
  { below: 6, line: "আশপাশের ছাদে এখন তোমার নাম।" },
  { below: 9, line: "পাড়ার ওস্তাদও এবার তোমার নাটাই দেখতে চাইবে।" },
  { below: Infinity, line: "আজ সাকরাইনের আকাশটা তোমার!" },
] as const;
export const humanLine = (cuts: number) => bands.find(band => cuts < band.below)!.line;

export const cutLine = (cuts: number, name = "") => name ? `${name} ${bn(cuts)}টা ঘুড়ি কাটল` : `${bn(cuts)}টা ঘুড়ি কাটলাম`;

export function compareLine(cuts: number, target: number, name: string) {
  const who = name || "বন্ধু", gap = cuts - target;
  if (gap > 0) return `${possessive(who)} চেয়ে ${bn(gap)}টা বেশি!`;
  if (gap === 0) return `একদম সমান! ${who}ও ${bn(target)}টা কেটেছে।`;
  if (-gap <= 2) return `আর একটু হলেই! মাত্র ${bn(-gap)}টা কম।`;
  return `${who} এখনো ${bn(-gap)}টা এগিয়ে। আরেকবার?`;
}

export const banner = ({ cuts, name }: Pick<Shared, "cuts" | "name">) => `${name || "বন্ধু"} ${bn(cuts)}টা ঘুড়ি কেটেছে। একই আকাশ, একই বাতাস, এবার তোমার পালা।`;
export const previewTitle = ({ cuts, name }: Pick<Shared, "cuts" | "name">) =>
  name ? `${name} ${bn(cuts)}টা ঘুড়ি কেটেছে। তুমি পারবে?` : `সাকরাইনের ছাদে ${bn(cuts)}টা ঘুড়ি কাটা! তুমি পারবে?`;
export const caption = ({ cuts }: Pick<Shared, "cuts">) => cuts > 0
  ? `সাকরাইনের ছাদে ${bn(cuts)}টা ঘুড়ি কাটলাম, ভো-কাট্টা! একই আকাশ আর একই বাতাস তোমার জন্য রাখলাম, দেখি কয়টা কাটো।`
  : "সাকরাইনের ছাদে প্যাঁচ খেলতে গিয়ে এবার একটাও কাটতে পারিনি! একই আকাশ তোমার জন্য রাখলাম, দেখি তুমি পারো কি না।";

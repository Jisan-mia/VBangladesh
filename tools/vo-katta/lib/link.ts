// Scoring, challenge links and preview text. Server-safe: the share routes load this file, so it imports only pure modules.
import { possessive } from "../../../shared/bangla";
import { challengeHash, readChallenge } from "../../../shared/game-core";
import { colorOf, colors, patternOf, patterns, type ColorId, type PatternId } from "../../ghuri/lib/ghuri";

export const ROUNDS = 3;
/** Each round has at most this many rival kites, so a higher score is a forged link. */
export const RIVALS_PER_ROUND = 10;
export const MAX_CUTS = ROUNDS * RIVALS_PER_ROUND;

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

export type Shared = { seed: number; cuts: number; name: string; look: Look | null };

/** s = seed, t = kites cut, n = name, p and c = the sharer's kite. A bad kite is dropped, a bad score rejects the link. */
export function parseShared(hash: string): Shared | null {
  const challenge = readChallenge(hash, { maxTarget: MAX_CUTS, extraKeys: ["p", "c"] });
  if (!challenge) return null;
  return { seed: challenge.seed, cuts: challenge.target, name: challenge.name, look: readLook(challenge.extra.p, challenge.extra.c) };
}

export const sharedHash = ({ seed, cuts, name, look }: Shared) =>
  challengeHash({ seed, target: cuts, name, extra: look ? { p: look.pattern, c: look.color } : {} });

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

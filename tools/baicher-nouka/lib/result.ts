// Words, rank lines and the challenge link. Server-safe: share.ts (and so the share API) imports this file,
// so it uses game-core and plain strings only.
import { possessive } from "../../../shared/bangla";
import { challengeHash, readChallenge, type LevelStars } from "../../../shared/game-core";
import { isLevel, LEGACY_LEVEL } from "./race";

const whole = new Intl.NumberFormat("bn-BD", { useGrouping: false });
const tenth = new Intl.NumberFormat("bn-BD", { useGrouping: false, minimumFractionDigits: 1, maximumFractionDigits: 1 });
export const bn = (value: number) => whole.format(value);
/** 384 tenths → "৩৮.৪" */
export const secs = (tenths: number) => tenth.format(tenths / 10);
const ORDINAL = ["", "১ম", "২য়", "৩য়", "৪র্থ"] as const;
export const ordinal = (rank: number) => ORDINAL[rank] ?? "";

/** What a challenge link carries: the river's seed, your time in tenths of a second, your place, the race number, an optional first name. */
export type Shared = { seed: number; tenths: number; rank: number; level: number; name: string };
/**
 * No boat can row the course faster than about 26 seconds even at top speed the whole way (COURSE / VMAX), and anyone who
 * rows at all is in well before two minutes. A real-time score can't be re-checked, so the caps only keep links sane.
 */
export const MIN_TENTHS = 270, MAX_TENTHS = 1200;

/** `#s=<seed>&t=<tenths>&r=<place>&l=<race>&n=<name>`. No `l` means race 7, the pace from before races had numbers, so old links still open. */
export function parseShareHash(hash: string): Shared | null {
  const challenge = readChallenge(hash, { maxTarget: MAX_TENTHS, extraKeys: ["r", "l"] });
  if (!challenge || challenge.target < MIN_TENTHS || !/^[1-4]$/.test(challenge.extra.r ?? "")) return null;
  const { l } = challenge.extra, level = l === undefined ? LEGACY_LEVEL : /^[1-9][0-9]?$/.test(l) ? Number(l) : 0;
  if (!isLevel(level)) return null;
  return { seed: challenge.seed, tenths: challenge.target, rank: Number(challenge.extra.r), level, name: challenge.name };
}

export const shareHash = (shared: Shared) => challengeHash({
  seed: shared.seed, target: shared.tenths, name: shared.name, extra: shared.level === LEGACY_LEVEL ? { r: shared.rank } : { r: shared.rank, l: shared.level },
});

/** Stars for a race: 3 for 1st, 2 for 2nd, 1 for 3rd. 4th earns none, and the next race stays shut until you place. */
export const starsForRank = (rank: number) => rank >= 1 && rank <= 3 ? 4 - rank : 0;

/** Where to start: the furthest open race you haven't won (race 1 for someone new). */
export function openingLevel(stars: LevelStars, unlocked: number) {
  let level = unlocked;
  while (level > 1 && stars[level] === 3) level--;
  return stars[level] === 3 ? unlocked : level;
}

/** The next goal in exact numbers after a race: the place just ahead, or this phone's best. Empty when there's nothing close. */
export function nearMiss(rank: number, behind: number, tenths: number, best: number | null) {
  if (rank > 1 && behind > 0 && behind <= 50) return `আর ${secs(behind)} সেকেন্ড আগে পৌঁছালেই ${ordinal(rank - 1)}।`;
  if (best !== null && tenths >= best && tenths - best <= 30) return `আর ${secs(tenths - best + 1)} সেকেন্ড কম লাগলেই নতুন সেরা।`;
  return "";
}

/** A line for the card, by place: warm whichever way it went. */
export const rankLines = [
  "",
  "মাঝির হাত পাকা! সবার আগে ঘাটে।",
  "একটুর জন্য প্রথম হলে না। পরের বার আরও জোরে টান!",
  "মাঝনদীতে লড়াই জমেছিল। তালটা ধরলেই সামনে যাবে।",
  "আজ নৌকাটা একটু ভারী ছিল! ঢোলের তালে চাপলেই ছুটবে।",
] as const;
export const humanLine = (rank: number) => rankLines[rank] ?? rankLines[4];

/** "৩৮.৪ সেকেন্ডে ১ম" */
export const resultLine = (shared: Pick<Shared, "tenths" | "rank">) => `${secs(shared.tenths)} সেকেন্ডে ${ordinal(shared.rank)}`;

export const banner = (shared: Shared) => `${shared.name || "তোমার বন্ধু"} ${resultLine(shared)} হয়েছে। একই নদী, এবার তোমার পালা।`;

export const previewTitle = (shared: Shared) => shared.name
  ? `${shared.name} ${resultLine(shared)} হয়েছে। তুমি পারবে?`
  : `বাইচের নৌকায় ${resultLine(shared)}! তুমি পারবে?`;

export const caption = (shared: Shared) =>
  `নৌকাবাইচে ${secs(shared.tenths)} সেকেন্ডে ঘাটে পৌঁছালাম, ${ordinal(shared.rank)} হলাম! ঢোলের তালে বৈঠা, একই নদীতে তুমি কত সেকেন্ডে পারবে?`;

/** After a friend's link: lower time wins. Exact and kind, never a scold. */
export function compareLine(mine: number, theirs: number, name: string) {
  const who = name || "বন্ধু", whose = name ? possessive(name) : "বন্ধুর";
  const gap = theirs - mine;
  if (gap > 0) return `${whose} চেয়ে ${secs(gap)} সেকেন্ড আগে পৌঁছালে!`;
  if (gap === 0) return `${who} আর তুমি একদম সমান সমান!`;
  if (-gap <= Math.max(10, theirs * 0.03)) return `আর একটু হলেই! ${whose} চেয়ে মাত্র ${secs(-gap)} সেকেন্ড পিছিয়ে।`;
  return `${who} এবার ${secs(-gap)} সেকেন্ড এগিয়ে। একই নদীতে আরেকবার?`;
}

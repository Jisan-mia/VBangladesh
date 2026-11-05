// Words, rank lines and the challenge link. Server-safe: share.ts (and so the share API) imports this file,
// so it uses game-core, levels and plain strings only.
import { possessive } from "../../../shared/bangla";
import { challengeHash, readChallenge } from "../../../shared/game-core";
import { isLevel, isMode, LEGACY_LEVEL, levelDef, LEVEL_COUNT, starsForRank, type Mode } from "./levels";

const whole = new Intl.NumberFormat("bn-BD", { useGrouping: false });
const tenth = new Intl.NumberFormat("bn-BD", { useGrouping: false, minimumFractionDigits: 1, maximumFractionDigits: 1 });
export const bn = (value: number) => whole.format(value);
/** 384 tenths → "৩৮.৪" */
export const secs = (tenths: number) => tenth.format(tenths / 10);
const ORDINAL = ["", "১ম", "২য়", "৩য়", "৪র্থ"] as const;
export const ordinal = (rank: number) => ORDINAL[rank] ?? "";

/**
 * What a challenge link carries: the river's seed, your time in tenths of a second, your place, the race number, the mode and an
 * optional first name. `old` is a link from before the rewrite (no `v=2`): the same river, but the old long course at the old pace.
 * A real-time score can't be re-checked, so it is always the friend's word for their own phone.
 */
export type Shared = { seed: number; tenths: number; rank: number; level: number; name: string; mode: Mode; old: boolean };
/**
 * No boat can row a course faster than its length over the top speed, and anyone who rows at all is in well before two minutes.
 * The caps only keep links sane.
 */
export const MIN_TENTHS_OLD = 270, MAX_TENTHS = 1200;
export const minTenths = (level: number, old: boolean) => old ? MIN_TENTHS_OLD : Math.floor((levelDef(level).course / 340) * 10) - 1;

/**
 * `#s=<seed>&t=<tenths>&r=<place>&l=<race>[&v=2][&d=e|h]&n=<name>`. No `l` and no `v` means the old race 7, the pace from before races
 * had numbers, so old links still open. `v=2` links name one of today's twelve races; `d` is the mode, left out for সাধারণ.
 */
export function parseShareHash(hash: string): Shared | null {
  const read = readChallenge(hash, { maxTarget: MAX_TENTHS, extraKeys: ["r", "l", "v", "d"] });
  if (!read || !/^[1-4]$/.test(read.extra.r ?? "")) return null;
  const { l, v, d } = read.extra;
  if (v !== undefined && v !== "2") return null;
  const old = v === undefined;
  if (d !== undefined && (old || (d !== "e" && d !== "h"))) return null;
  let level: number;
  if (l === undefined) { if (!old) return null; level = LEGACY_LEVEL; }
  else level = /^[1-9][0-9]?$/.test(l) ? Number(l) : 0;
  if (!isLevel(level, old) || read.target < minTenths(level, old)) return null;
  const mode: Mode = d && isMode(d) ? d : "n";
  return { seed: read.seed, tenths: read.target, rank: Number(read.extra.r), level, name: read.name, mode, old };
}

/** Old links are written back exactly as they came (no `l` for race 7); new ones carry `v=2` and a mode other than সাধারণ. */
export function shareHash(shared: Shared) {
  const extra: Record<string, string | number> = { r: shared.rank };
  if (shared.old) { if (shared.level !== LEGACY_LEVEL) extra.l = shared.level; }
  else { extra.l = shared.level; extra.v = 2; if (shared.mode !== "n") extra.d = shared.mode; }
  return challengeHash({ seed: shared.seed, target: shared.tenths, name: shared.name, extra });
}

/** Where to start: the furthest open race you haven't placed first in (race 1 for someone new). */
export function openingLevel(stars: Record<number, number>, unlocked: number) {
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
  "মাঝির হাত পাকা। সবার আগে ঘাটে।",
  "প্রথম হতে একটুর জন্য বাদ। পরের বার আরেকটু জোরে টান।",
  "মাঝনদীতে লড়াই জমেছিল। তালটা ধরলেই সামনে যাবে।",
  "আজ নৌকাটা একটু ভারী ছিল। ঢোলের তালে চাপলেই ছুটবে।",
] as const;
export const humanLine = (rank: number) => rankLines[rank] ?? rankLines[4];

/** The line on the end screen for a first place, one per race. */
const CLEAR_LINES = [
  "প্রথম বাইচেই ঘাটে সবার আগে।",
  "পানার ঘাট পার। কচুরিপানা এবার পথ ছাড়ল।",
  "সারির শেষ টান ঠিক জায়গায় পড়েছে।",
  "পাকা মাঝিও এবার পেছনে। ঘাটে হাততালি।",
  "স্রোতের লেনটা ঠিক ধরেছ।",
  "সরু খালে পাশ কাটিয়ে বেরিয়ে এলে।",
  "ঢোল দ্রুত হলেও তাল ছাড়োনি।",
  "বর্ষার সর্দারকে পেছনে ফেলেছ।",
  "মশালের আলোয় পানা বাঁচিয়ে এলে।",
  "হাওয়া ঠেলেছে, তুমি ফিরে এসেছ।",
  "স্রোত, খাল আর হাওয়া, সব পার।",
  "গাঁয়ের ওস্তাদকেও ছাড়িয়ে গেলে। ঘাটে মশাল জ্বলছে।",
] as const;
export const clearLine = (level: number, old = false) => old ? humanLine(1) : CLEAR_LINES[Math.min(LEVEL_COUNT, Math.max(1, level)) - 1];

/** After a race you didn't place in: one exact, kind fact, then what to try. */
export function lossLine({ beats, hits, offbeats, patchHits, boss }: { beats: number; hits: number; offbeats: number; patchHits: number; boss: string }) {
  if (beats >= 4 && hits * 2 < beats) return `${bn(beats)}টা তালের ${bn(hits)}টা ধরেছ। রিং ঢোলে মিললেই চাপো।`;
  if (offbeats > hits) return `${bn(offbeats)}বার তালের বাইরে চেপেছ, তাতে নৌকা হোঁচট খেয়েছে। প্রতি ঢোলে একবার চাপো।`;
  if (patchHits >= 2) return `কচুরিপানায় ${bn(patchHits)} বার আটকেছ। সামনের সারি দেখে আগেই সরো।`;
  if (boss) return `${possessive(boss)} শেষ টানের সময় তাল ধরে রাখো, তখনই ওরা এগোয়।`;
  return "শেষ দিকে ওদের নৌকা এগিয়ে গিয়েছিল। প্রথম থেকেই তাল ধরো।";
}

/** "৩৮.৪ সেকেন্ডে ১ম" */
export const resultLine = (shared: Pick<Shared, "tenths" | "rank">) => `${secs(shared.tenths)} সেকেন্ডে ${ordinal(shared.rank)}`;

export const banner = (shared: Shared) => `${shared.name || "তোমার বন্ধু"} ${resultLine(shared)} হয়েছে। একই নদী, এবার তোমার পালা।`;

export const previewTitle = (shared: Shared) => shared.name
  ? `${shared.name} ${resultLine(shared)} হয়েছে। তুমি পারবে?`
  : `বাইচের নৌকায় ${resultLine(shared)}! তুমি পারবে?`;

export const raceLabel = (shared: Pick<Shared, "level" | "old">) => shared.old ? "পুরোনো বাইচ" : levelDef(shared.level).name;

export const caption = (shared: Shared) =>
  `নৌকাবাইচে ${shared.old ? "" : `${raceLabel(shared)}, `}${secs(shared.tenths)} সেকেন্ডে ঘাটে পৌঁছালাম, ${ordinal(shared.rank)} হলাম। ঢোলের তালে বৈঠা, একই নদীতে তুমি কত সেকেন্ডে পারবে?`;

/** After a friend's link: lower time wins. Exact and kind, never a scold. */
export function compareLine(mine: number, theirs: number, name: string) {
  const who = name || "বন্ধু", whose = name ? possessive(name) : "বন্ধুর";
  const gap = theirs - mine;
  if (gap > 0) return `${whose} চেয়ে ${secs(gap)} সেকেন্ড আগে পৌঁছালে!`;
  if (gap === 0) return `${who} আর তুমি একদম সমান সমান!`;
  if (-gap <= Math.max(10, theirs * 0.03)) return `আর একটু হলেই! ${whose} চেয়ে মাত্র ${secs(-gap)} সেকেন্ড পিছিয়ে।`;
  return `${who} এবার ${secs(-gap)} সেকেন্ড এগিয়ে। একই নদীতে আরেকবার?`;
}

export { starsForRank };

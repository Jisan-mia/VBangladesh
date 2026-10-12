// Words, score bands and the challenge link. Server-safe: share.ts (and so the share API) imports this file,
// so it uses game-core and plain strings only. The jokes are about being late, never about a school or a teacher.
import { possessive } from "../../../shared/bangla";
import { challengeHash, readChallenge, readLevels } from "../../../shared/game-core";
import { BASKET, BIKE, BRANCH, COW, DAY_COUNT, DAYS, dayOf, GATE_M, LINE, PAGES, PUDDLE } from "./road";

const digits = new Intl.NumberFormat("bn-BD", { useGrouping: false });
export const bn = (value: number) => digits.format(value);

/** What a challenge link carries: the road's seed, the মিটার reached, an optional first name, and the day (left out for the endless road, which old links open). */
export type Shared = { seed: number; meters: number; name: string; day?: number };
/** About 20 minutes at top speed. A real-time score can't be re-checked, so the cap only keeps links sane. */
export const MAX_METERS = 20000;
/** The first puddle is 28 m out: nobody can be stopped before about 24 m. */
export const MIN_METERS = 20;

export function parseShareHash(hash: string): Shared | null {
  const challenge = readChallenge(hash, { maxTarget: MAX_METERS, extraKeys: ["l"] });
  if (!challenge || challenge.target < MIN_METERS) return null;
  const { l } = challenge.extra;
  if (l === undefined) return { seed: challenge.seed, meters: challenge.target, name: challenge.name };
  if (!/^[1-9]$/.test(l) || Number(l) > DAY_COUNT || challenge.target > DAYS[Number(l) - 1].gate) return null;
  return { seed: challenge.seed, meters: challenge.target, name: challenge.name, day: Number(l) };
}

export const shareHash = (shared: Shared) => challengeHash({ seed: shared.seed, target: shared.meters, name: shared.name, extra: shared.day ? { l: shared.day } : {} });

/** What one more try would change, with the exact number; "" when nothing is close. */
export function nearMiss({ day, meters, stars, pages, best }: { day: number; meters: number; stars: number; pages: number; best: number | null }) {
  if (day && !stars) return `আর ${bn(dayOf(day).gate - meters)} মিটার গেলেই ${dayOf(day).name}ের গেট।`;
  if (day && stars < 3) return `আর ${bn((stars === 1 ? 2 : PAGES) - pages)}টা পাতা কুড়ালেই ${bn(stars + 1)} তারা।`;
  if (!day && best !== null && meters < best && best - meters <= Math.max(25, Math.round(best * 0.12))) return `আর ${bn(best - meters)} মিটার গেলেই নতুন সেরা।`;
  return "";
}

/**
 * Old phones kept only a best distance on the endless road. Run once, before the level store is first read: every day whose gate
 * that distance passed counts as cleared with 1 star, up to half the week. Returns the new store, or null for nothing to do.
 */
export function migrateLevels(levelsRaw: string | null, bestRaw: string | null) {
  if (levelsRaw !== null || bestRaw === null) return null;
  const best = Number(bestRaw);
  if (!Number.isFinite(best)) return null;
  const cleared = Math.min(Math.floor(DAY_COUNT / 2), DAYS.filter(day => day.gate <= best).length);
  if (!cleared) return null;
  return JSON.stringify(readLevels(JSON.stringify(Object.fromEntries(Array.from({ length: cleared }, (_, index) => [index + 1, 1]))), DAY_COUNT));
}

export const bands = [
  { min: 0, line: "জুতার ফিতাটা বেঁধে নাও, তারপর আবার!" },
  { min: 100, line: "গলির মোড় পার! কাল দশ মিনিট আগে উঠলেই হবে।" },
  { min: 300, line: "মাঠ পর্যন্ত চলে এসেছ, গেট আর বেশি দূরে না!" },
  { min: 600, line: "গেট প্রায় দেখা যাচ্ছিল! আর একটু হলেই।" },
  { min: GATE_M, line: "ঘণ্টা পড়ার আগেই গেটে!" },
  { min: 1500, line: "এত জোরে? গেটের দারোয়ান চাচাও অবাক!" },
] as const;
/** `gate` is a day's gate: reaching a nearer one is "on time" too. */
export const humanLine = (meters: number, gate = GATE_M) => meters >= gate && gate < GATE_M ? "ঘণ্টা পড়ার আগেই গেটে!" : [...bands].reverse().find(band => meters >= band.min)!.line;

/** The big line on the game-over screen: late, or (past the gate) not late at all. */
export const headline = (meters: number, gate = GATE_M) => meters >= gate ? "আজ আর লেট না!" : meters % 2 ? "আজ আবার লেট!" : "বেল পড়ে গেল!";

/** What tripped you up, said kindly. */
export function bumpLine(kind: number) {
  switch (kind) {
    case PUDDLE: return "ছপাৎ! জুতা-মোজা কাদায় মাখামাখি।";
    case BASKET: return "সবজির ঝাঁকায় হোঁচট! বেগুন গড়াগড়ি।";
    case BIKE: return "সাইকেলে ধাক্কা! ক্রিং ক্রিং।";
    case COW: return "গরুটা রাস্তা ছেড়ে নড়লই না!";
    case LINE: return "ভেজা গামছা মুখে জড়িয়ে গেল!";
    case BRANCH: return "ডালে টুক করে মাথা ঠুকল!";
    default: return "উফ, একটুর জন্য!";
  }
}

export const previewTitle = (shared: Shared) => shared.name
  ? `${shared.name} ${shared.day ? `${dayOf(shared.day).name} ` : ""}স্কুলের পথে ${bn(shared.meters)} মিটার গেছে। তুমি পারবে?`
  : `${shared.day ? `${dayOf(shared.day).name} ` : ""}স্কুলের পথে ${bn(shared.meters)} মিটার! তুমি পারবে?`;

export const caption = (shared: Shared) => shared.day
  ? (shared.meters >= dayOf(shared.day).gate
    ? `${dayOf(shared.day).name} ঘণ্টা পড়ার আগেই গেটে! স্কুলের পথে ${bn(shared.meters)} মিটার। একই রাস্তায় তুমি পারবে?`
    : `${dayOf(shared.day).name} আবার দেরি! তবু স্কুলের পথে ${bn(shared.meters)} মিটার গেলাম। একই রাস্তায় তুমি কত দূর যাবে?`)
  : shared.meters >= GATE_M
  ? `ঘণ্টা পড়ার আগেই গেটে! স্কুলের পথে ${bn(shared.meters)} মিটার গেলাম। একই রাস্তায় তুমি কত দূর যাবে?`
  : `দেরি হয়ে গেল! তবু স্কুলের পথে ${bn(shared.meters)} মিটার গেলাম। একই রাস্তায় তুমি কত দূর যাবে?`;

/** After a friend's link: exact and kind, never a scold. */
export function compareLine(mine: number, theirs: number, name: string) {
  const who = name || "বন্ধু", whose = name ? possessive(name) : "বন্ধুর";
  if (mine > theirs) return `${whose} চেয়ে ${bn(mine - theirs)} মিটার বেশি!`;
  if (mine === theirs) return `${who} আর তুমি একদম সমান সমান!`;
  if (theirs - mine <= Math.max(25, theirs * 0.12)) return `আর একটু হলেই! ${whose} চেয়ে মাত্র ${bn(theirs - mine)} মিটার কম।`;
  return `${who} এবার ${bn(theirs - mine)} মিটার এগিয়ে। একই রাস্তায় আরেকবার?`;
}

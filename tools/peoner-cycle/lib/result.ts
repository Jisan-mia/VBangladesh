// Words, score bands and the challenge link. Server-safe: share.ts (and so the share API) imports this file,
// so it uses game-core and plain strings only.
import { possessive } from "../../../shared/bangla";
import { challengeHash, readChallenge } from "../../../shared/game-core";
import { scoreOf, BELL_POINTS, CART, COW, GOAT, LEVEL_COUNT, LETTER_POINTS, PUDDLE, ROUTES } from "./ride";

const digits = new Intl.NumberFormat("bn-BD", { useGrouping: false });
export const bn = (value: number) => digits.format(value);

/** What a challenge link carries: the road's seed, the route, the মিটার, the letters, an optional first name. The score follows from them plus the bells. */
export type Shared = { seed: number; score: number; meters: number; letters: number; name: string; level: number };
/** About 20 minutes at top speed. A real-time score can't be re-checked, so the caps only keep links sane. */
export const MAX_METERS = 20000;
/** The first puddle stands 26 m out: nobody stops sooner. */
export const MIN_METERS = 20;
/** Rows are at least 10 m apart with at most one letter and two things each (see ride.ts nextRow). */
export const maxLetters = (meters: number) => Math.floor(meters / 10) + 2;
export const maxBells = (meters: number) => Math.floor(meters / 5) + 4;
export const MAX_SCORE = scoreOf(MAX_METERS, maxLetters(MAX_METERS), maxBells(MAX_METERS));

const whole = (value: string | undefined) => value !== undefined && /^\d{1,6}$/.test(value) ? Number(value) : -1;

export function parseShareHash(hash: string): Shared | null {
  // Links from before routes have no `l` and open route 1, the same road they were played on.
  const challenge = readChallenge(hash, { maxTarget: MAX_SCORE, extraKeys: ["m", "c", "l"] });
  if (!challenge) return null;
  const meters = whole(challenge.extra.m), letters = whole(challenge.extra.c);
  if (meters < MIN_METERS || meters > MAX_METERS || letters < 0 || letters > maxLetters(meters)) return null;
  const rest = challenge.target - meters - LETTER_POINTS * letters;
  if (rest < 0 || rest % BELL_POINTS !== 0 || rest / BELL_POINTS > maxBells(meters)) return null;
  const rawLevel = challenge.extra.l ?? "1", level = Number(rawLevel);
  if (!/^[1-9]\d?$/.test(rawLevel) || level > LEVEL_COUNT) return null;
  return { seed: challenge.seed, score: challenge.target, meters, letters, name: challenge.name, level };
}

export const bellsOf = (shared: Pick<Shared, "score" | "meters" | "letters">) => (shared.score - shared.meters - LETTER_POINTS * shared.letters) / BELL_POINTS;

// Route 1 leaves `l` out, so its links stay exactly the old format.
export const shareHash = (shared: Shared) => challengeHash({ seed: shared.seed, target: shared.score, name: shared.name, extra: { m: shared.meters, c: shared.letters, ...(shared.level > 1 && { l: shared.level }) } });

/** "রুট ৩ · স্কুলপাড়া" */
export const routeLabel = (level: number) => `রুট ${bn(level)} · ${ROUTES[level - 1].name}`;

export const bands = [
  { min: 0, line: "সবে প্যাডেলে পা দিলে। চিঠি গুছিয়ে আবার চলো!" },
  { min: 150, line: "পাড়ার মোড় পর্যন্ত চিঠি পৌঁছে গেল।" },
  { min: 400, line: "হাট পেরিয়ে অর্ধেক গ্রামের চিঠি বিলি শেষ!" },
  { min: 800, line: "পুরো গ্রাম ঘুরে এলে, কারও চিঠি বাকি থাকল না!" },
  { min: 1500, line: "এমন পিয়ন থাকলে কোনো চিঠিই দেরিতে আসত না!" },
] as const;
export const humanLine = (score: number) => [...bands].reverse().find(band => score >= band.min)!.line;

/** What stopped the bike, said kindly. Nobody gets hurt: the bike wobbles and the letters fly. */
export function bumpLine(kind: number) {
  switch (kind) {
    case PUDDLE: return "ছপাৎ! কাদায় চাকা পিছলে গেল।";
    case GOAT: return "ভ্যা! ছাগলটা একচুলও সরল না।";
    case CART: return "ঠক! ঠেলাগাড়ির সাথে ঠোকাঠুকি।";
    case COW: return "হাম্বা! গরুটা নড়ার নামই নিল না।";
    default: return "উফ, একটুর জন্য!";
  }
}

/** "৩৮৭ মিটার · ১২টা চিঠি · ৪ বার ক্রিং" */
export function detailLine(shared: Pick<Shared, "score" | "meters" | "letters">) {
  const bells = bellsOf(shared);
  return `${bn(shared.meters)} মিটার · ${bn(shared.letters)}টা চিঠি${bells > 0 ? ` · ${bn(bells)} বার ক্রিং` : ""}`;
}

export const banner = (shared: Shared) => `${shared.name || "তোমার বন্ধু"} ${bn(shared.score)} করেছে। একই রাস্তা, এবার তোমার পালা।`;

export const previewTitle = (shared: Shared) => shared.name
  ? `${shared.name} ${bn(shared.score)} করেছে। তুমি পারবে?`
  : `পিয়নের সাইকেলে ${bn(shared.score)}! তুমি পারবে?`;

export const caption = (shared: Shared) =>
  `পিয়নের সাইকেলে ${bn(shared.meters)} মিটার গেলাম, ${bn(shared.letters)}টা চিঠি তুললাম। স্কোর ${bn(shared.score)}। একই রাস্তায় তুমি কত দূর যাবে?`;

/** After a friend's link: exact and kind, never a scold. */
export function compareLine(mine: number, theirs: number, name: string) {
  const who = name || "বন্ধু", whose = name ? possessive(name) : "বন্ধুর";
  if (mine > theirs) return `${whose} চেয়ে ${bn(mine - theirs)} বেশি!`;
  if (mine === theirs) return `${who} আর তুমি একদম সমান সমান!`;
  if (theirs - mine <= Math.max(30, theirs * 0.12)) return `আর একটু হলেই! ${whose} চেয়ে মাত্র ${bn(theirs - mine)} কম।`;
  return `${who} এবার ${bn(theirs - mine)} এগিয়ে। একই রাস্তায় আরেকবার?`;
}

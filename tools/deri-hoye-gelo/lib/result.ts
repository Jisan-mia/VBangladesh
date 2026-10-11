// Words, score bands and the challenge link. Server-safe: share.ts (and so the share API) imports this file,
// so it uses game-core and plain strings only. The jokes are about being late, never about a school or a teacher.
import { possessive } from "../../../shared/bangla";
import { challengeHash, readChallenge } from "../../../shared/game-core";
import { BASKET, BIKE, BRANCH, COW, GATE_M, LINE, PUDDLE } from "./road";

const digits = new Intl.NumberFormat("bn-BD", { useGrouping: false });
export const bn = (value: number) => digits.format(value);

/** What a challenge link carries: the road's seed, the মিটার reached, an optional first name. */
export type Shared = { seed: number; meters: number; name: string };
/** About 20 minutes at top speed. A real-time score can't be re-checked, so the cap only keeps links sane. */
export const MAX_METERS = 20000;
/** The first puddle is 28 m out: nobody can be stopped before about 24 m. */
export const MIN_METERS = 20;

export function parseShareHash(hash: string): Shared | null {
  const challenge = readChallenge(hash, { maxTarget: MAX_METERS });
  if (!challenge || challenge.target < MIN_METERS) return null;
  return { seed: challenge.seed, meters: challenge.target, name: challenge.name };
}

export const shareHash = (shared: Shared) => challengeHash({ seed: shared.seed, target: shared.meters, name: shared.name });

export const bands = [
  { min: 0, line: "জুতার ফিতাটা বেঁধে নাও, তারপর আবার!" },
  { min: 100, line: "গলির মোড় পার! কাল দশ মিনিট আগে উঠলেই হবে।" },
  { min: 300, line: "মাঠ পর্যন্ত চলে এসেছ, গেট আর বেশি দূরে না!" },
  { min: 600, line: "গেট প্রায় দেখা যাচ্ছিল! আর একটু হলেই।" },
  { min: GATE_M, line: "ঘণ্টা পড়ার আগেই গেটে!" },
  { min: 1500, line: "এত জোরে? গেটের দারোয়ান চাচাও অবাক!" },
] as const;
export const humanLine = (meters: number) => [...bands].reverse().find(band => meters >= band.min)!.line;

/** The big line on the game-over screen: late, or (past the gate) not late at all. */
export const headline = (meters: number) => meters >= GATE_M ? "আজ আর লেট না!" : meters % 2 ? "আজ আবার লেট!" : "বেল পড়ে গেল!";

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
  ? `${shared.name} স্কুলের পথে ${bn(shared.meters)} মিটার গেছে। তুমি পারবে?`
  : `স্কুলের পথে ${bn(shared.meters)} মিটার! তুমি পারবে?`;

export const caption = (shared: Shared) => shared.meters >= GATE_M
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

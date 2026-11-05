// The words around the stall: the first-run story, the end screen's lines, the near miss, the card's one line and the
// floating chips. Pure and server-safe.
import { bn } from "./link";
import { MODE_INFO, OLD_STALLS, type LevelDef, type Mode } from "./levels";

/** The first-run story: three panels, one line each. */
export const STORY = [
  "বৈশাখের মেলা। রহিম চাচার দোকানে দড়িতে ঝুলছে নকশা-আঁকা হাঁড়ি।",
  "এক টাকায় তিনটা বল। যত হাঁড়ি ভাঙবে, তত হাততালি।",
  "তাক করো, ছোড়ো। বল ফিরলে লাঠিতে ধরো।",
] as const;

/** "+১৫", the chip that floats up from a pot that broke. */
export const popText = (points: number) => `+${bn(points)}`;
/** The chip for a run of pots in one flight. */
export const flightText = (count: number) => `এক ছোড়ায় ×${bn(count)}`;

/** The sentence under the stars: how the stall went. */
export function levelLine(stars: number, cleared: boolean, finale: string) {
  if (!cleared) return "বল শেষ। আরেকবার ধরো।";
  if (stars >= 3) return finale ? `একটা বলও না হারিয়ে ${finale} সাফ।` : "একটা বলও না হারিয়ে সাফ।";
  if (stars === 2) return "একটা বল গেছে, দোকান সাফ।";
  return "বল অনেক গেছে, তবু দোকান সাফ।";
}

/** Why the round ended, in one short line. */
export function endLine(def: LevelDef, cleared: boolean, left: number) {
  if (cleared) return def.finale ? "মটকা ভেঙেছে। দোকান সাফ।" : "দোকান সাফ!";
  return left === 1 ? "বল শেষ। একটা হাঁড়ি রয়ে গেল।" : `বল শেষ। ${bn(left)}টা হাঁড়ি রয়ে গেল।`;
}

/** The near miss, with exact numbers. */
export function nearLine(stars: number, cleared: boolean, lost: number, left: number, mode: Mode, best: number | null, score: number) {
  if (!cleared) return left === 1 ? "আর একটা হাঁড়ি ভাঙলেই সাফ।" : `আর ${bn(left)}টা হাঁড়ি ভাঙলেই সাফ।`;
  if (stars >= MODE_INFO[mode].maxStars) {
    if (MODE_INFO[mode].maxStars < 3) return "সহজে বড়জোর ২ তারা। ৩ তারা পেতে সাধারণে খেলো।";
    return best !== null && score < best ? `আর ${bn(best - score + 1)} পয়েন্ট হলেই নতুন সেরা।` : "";
  }
  return lost === 2 ? "আর একটা বল কম হারালে ২ তারা।" : "একটা বলও না হারালে ৩ তারা।";
}

/** The card's one line, by stars on a stall. */
export const cardLine = (stars: number, cleared: boolean) =>
  !cleared ? "আর কয়েকটা হাঁড়ি বাকি ছিল, তুমি পারবে?" : stars >= 3 ? "একটা বলও যায়নি, পুরো দোকান সাফ।" : stars === 2 ? "একটা বল গেছে, দোকান সাফ।" : "দোকান সাফ, তবে বল অনেক গেছে।";

/** The old stalls' result line by score, word for word. */
export const bands = [
  { below: 100, line: "হাত গরম হলো, এবার আসল খেলা!" },
  { below: 250, line: "মেলার দোকানি একটু চিন্তায় পড়ে গেছে!" },
  { below: 400, line: "আর কয়েকটা হলেই দোকান সাফ!" },
  { below: 500, line: "সব হাঁড়ি ভাঙা শেষ! মেলা জমে গেছে।" },
  { below: Infinity, line: "একটা চান্সও যায়নি, পুরো দোকান সাফ!" },
] as const;
export const humanLine = (score: number) => bands.find(band => score < band.below)!.line;

/** An old link's stall name (links without `v` keep their ten stalls). */
export const oldName = (level: number) => OLD_STALLS[level - 1].name;

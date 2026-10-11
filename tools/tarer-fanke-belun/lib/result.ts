// The challenge link, the result lines and the personal preview. Runs on the server too (share.ts → /api/share).
import { challengeHash, readChallenge } from "../../../shared/game-core";
import { possessive } from "../../../shared/bangla";

export const MAX_SCORE = 999;

const numbers = new Intl.NumberFormat("bn-BD", { useGrouping: false });
export const bn = (value: number) => numbers.format(value);

/** A finished run as a link carries it: which wires (seed), how many gaps, the name, and whether the easier settings were on. */
export type Card = { seed: number; score: number; name: string; big: boolean; slow: boolean };

export function cardHash({ seed, score, name, big, slow }: Card) {
  const extra: Record<string, number> = {};
  if (big) extra.b = 1;
  if (slow) extra.d = 1;
  return challengeHash({ seed, target: Math.min(MAX_SCORE, score), name, extra });
}

/** Reads a friend's link; null for anything broken or out of range. Flags are "1" or absent, nothing else. */
export function parseCard(hash: string): Card | null {
  const challenge = readChallenge(hash, { maxTarget: MAX_SCORE, extraKeys: ["b", "d"] });
  if (!challenge) return null;
  const { b, d } = challenge.extra;
  if ((b !== undefined && b !== "1") || (d !== undefined && d !== "1")) return null;
  return { seed: challenge.seed, score: challenge.target, name: challenge.name, big: b === "1", slow: d === "1" };
}

const who = (name: string) => name || "বন্ধু";

/** The kind line on the card, by score band. */
export function humanLine(score: number) {
  if (score === 0) return "প্রথম তারেই ফটাস! এ তো সবে শুরু।";
  if (score < 5) return "বেলুনওয়ালা মামা বলছে, আরেকটা নিয়ে যাও।";
  if (score < 15) return "তারের জটে ভালোই পথ খুঁজে নিচ্ছ।";
  if (score < 30) return "তারে বসা কাকগুলোও অবাক হয়ে দেখছে।";
  if (score < 60) return "এই হাতে বেলুন সহজে ফাটে না।";
  return "ঢাকার সব তারের জট তোমার চেনা!";
}

export function versusLine(mine: number, theirs: number, name: string) {
  const diff = Math.abs(mine - theirs);
  if (mine > theirs) return `${possessive(who(name))} চেয়ে ${bn(diff)}টা ফাঁক বেশি!`;
  if (mine === theirs) return `সমান সমান! দুজনেই ${bn(mine)}টা ফাঁক।`;
  if (diff <= 3) return `আর একটু হলেই! ${possessive(who(name))} চেয়ে মাত্র ${bn(diff)}টা কম।`;
  return `এবার ${who(name)} এগিয়ে। একই তার, আরেকবার চেষ্টা করো।`;
}

export const friendBanner = (card: Card) => `${card.name || "তোমার বন্ধু"} ${bn(card.score)}টা ফাঁক পার করেছে। একই তারের জট, এবার তোমার পালা।`;
export const friendNote = (card: Card) => `${possessive(who(card.name))} নিজের ফোনের স্কোর${card.big ? ", বড় ফাঁকে" : ""}${card.slow ? ", ধীরে খেলায়" : ""}`;
export const previewTitle = (card: Card) => `${card.name || "এক বন্ধু"} তারের জটে ${bn(card.score)}টা ফাঁক পার করেছে। তুমি পারবে?`;
export const caption = (card: Card) => card.score
  ? `তারের ফাঁকে বেলুন নিয়ে ${bn(card.score)}টা ফাঁক পার করলাম, তারপর ফটাস! একই তারের জটে তুমি কয়টা পারবে?`
  : "তারের ফাঁকে বেলুন: প্রথম তারেই ফটাস! একই তারের জটে তুমি কয়টা পারবে?";

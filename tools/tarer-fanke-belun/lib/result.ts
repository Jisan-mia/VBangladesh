// The challenge link, the result lines and the personal preview. Runs on the server too (share.ts → /api/share).
import { challengeHash, readChallenge, readLevels } from "../../../shared/game-core";
import { possessive } from "../../../shared/bangla";
import { stageOf, twoStarGrazes, STAGE_COUNT, STAGES } from "./game";

export const MAX_SCORE = 999;

const numbers = new Intl.NumberFormat("bn-BD", { useGrouping: false });
export const bn = (value: number) => numbers.format(value);

/** A finished run as a link carries it: which wires (seed), how many gaps, the name, whether the easier settings were on, and the level (0 = the endless street, which old links open). */
export type Card = { seed: number; score: number; name: string; big: boolean; slow: boolean; stage: number };

export function cardHash({ seed, score, name, big, slow, stage }: Card) {
  const extra: Record<string, number> = {};
  if (stage) extra.l = stage;
  if (big) extra.b = 1;
  if (slow) extra.d = 1;
  return challengeHash({ seed, target: Math.min(MAX_SCORE, score), name, extra });
}

/** Reads a friend's link; null for anything broken or out of range. Flags are "1" or absent, nothing else. */
export function parseCard(hash: string): Card | null {
  const challenge = readChallenge(hash, { maxTarget: MAX_SCORE, extraKeys: ["b", "d", "l"] });
  if (!challenge) return null;
  const { b, d, l } = challenge.extra;
  if ((b !== undefined && b !== "1") || (d !== undefined && d !== "1")) return null;
  const stage = l === undefined ? 0 : /^[1-9]\d?$/.test(l) ? Number(l) : -1;
  if (stage < 0 || stage > STAGE_COUNT || (stage && challenge.target > STAGES[stage - 1].gates)) return null;
  return { seed: challenge.seed, score: challenge.target, name: challenge.name, big: b === "1", slow: d === "1", stage };
}

/** "লেভেল ৩-এ" for a level card, "" for the endless street. */
const inStage = (stage: number) => stage ? `লেভেল ${bn(stage)}-এ` : "";

/** What one more try would change, with the exact number; "" when nothing is close. */
export function nearMiss({ stage, score, cleared, grazes, best }: { stage: number; score: number; cleared: boolean; grazes: number; best: number | null }) {
  if (stage && !cleared) return `আর ${bn(stageOf(stage).gates - score)}টা ফাঁক হলেই লেভেল ${bn(stage)} পার।`;
  if (stage && grazes > twoStarGrazes(stage)) return `আর ${bn(grazes - twoStarGrazes(stage))}টা ঘষা কম হলেই ২ তারা।`;
  if (stage && grazes > 0) return `আর ${bn(grazes)}টা ঘষা কম হলেই ৩ তারা।`;
  if (!stage && best !== null && score < best && best - score <= Math.max(5, Math.ceil(best * 0.2))) return `আর ${bn(best - score)}টা ফাঁক হলেই নতুন সেরা।`;
  return "";
}

/**
 * Old phones kept only a best score on the endless street. Run once, before the level store is first read: every level that
 * is no longer than that best counts as cleared with 1 star, up to half of them. Returns the new store, or null for nothing to do.
 */
export function migrateLevels(levelsRaw: string | null, bestRaw: string | null) {
  if (levelsRaw !== null || bestRaw === null) return null;
  const best = Number(bestRaw);
  if (!Number.isFinite(best)) return null;
  const cleared = Math.min(Math.floor(STAGE_COUNT / 2), STAGES.filter(stage => stage.gates <= best).length);
  if (!cleared) return null;
  return JSON.stringify(readLevels(JSON.stringify(Object.fromEntries(Array.from({ length: cleared }, (_, index) => [index + 1, 1]))), STAGE_COUNT));
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

export const friendBanner = (card: Card) => `${card.name || "তোমার বন্ধু"} ${card.stage ? `${inStage(card.stage)} ` : ""}${bn(card.score)}টা ফাঁক পার করেছে। একই তারের জট, এবার তোমার পালা।`;
export const friendNote = (card: Card) => `${possessive(who(card.name))} নিজের ফোনের স্কোর${card.big ? ", বড় ফাঁকে" : ""}${card.slow ? ", ধীরে খেলায়" : ""}`;
export const previewTitle = (card: Card) => `${card.name || "এক বন্ধু"} ${card.stage ? `বেলুনের ${inStage(card.stage)}` : "তারের জটে"} ${bn(card.score)}টা ফাঁক পার করেছে। তুমি পারবে?`;
export const caption = (card: Card) => card.stage && card.score >= stageOf(card.stage).gates
  ? `তারের ফাঁকে বেলুনের লেভেল ${bn(card.stage)} পার, ${bn(card.score)}টা ফাঁক, ফটাস হয়নি! একই তারের জটে তুমি পারবে?`
  : card.score
  ? `তারের ফাঁকে বেলুন নিয়ে ${bn(card.score)}টা ফাঁক পার করলাম, তারপর ফটাস! একই তারের জটে তুমি কয়টা পারবে?`
  : "তারের ফাঁকে বেলুন: প্রথম তারেই ফটাস! একই তারের জটে তুমি কয়টা পারবে?";

// Challenge links and preview text. Server-safe: the share routes load this file, so it imports only pure game-core.
import { challengeHash, readChallenge } from "../../../shared/game-core";
import { chilliesIn, levelOf, levelStars, LEVEL_COUNT } from "./levels";
import { POINTS } from "./rules";

export { POINTS };
// A full board holds 192 cells, so 189 bites at most (a quarter of them golden): no real run gets near 3000.
export const MAX_SCORE = 3000;

const digits = new Intl.NumberFormat("bn-BD", { useGrouping: false });
export const bn = (value: number) => digits.format(value);

/** level 0 is the classic endless game (old links carry no `l`); a level link also carries `g`, the golden chillies eaten. */
export type Shared = { seed: number; score: number; name: string; level?: number; golden?: number };

/** Bites in a level result: the score is 10 a bite and 30 a golden chilli. */
export const bitesOf = ({ score, golden = 0 }: Pick<Shared, "score" | "golden">) => (score - 30 * golden) / POINTS;
/** 0 when the level wasn't cleared. */
export const sharedStars = (shared: Shared) => shared.level && bitesOf(shared) === levelOf(shared.level).goal ? levelStars(shared.level, shared.golden ?? 0) : 0;

/** Reads a challenge link. Scores only ever move in steps of 10, and a level score must add up from its bites and chillies; anything else is a forged link. */
export function parseShared(hash: string): Shared | null {
  const challenge = readChallenge(hash, { maxTarget: MAX_SCORE, extraKeys: ["l", "g"] });
  if (!challenge || challenge.target % POINTS !== 0) return null;
  const shared: Shared = { seed: challenge.seed, score: challenge.target, name: challenge.name };
  if (challenge.extra.l === undefined) return shared;
  const level = Number(challenge.extra.l), golden = Number(challenge.extra.g ?? "0");
  if (!/^\d{1,2}$/.test(challenge.extra.l) || level < 1 || level > LEVEL_COUNT || !/^\d$/.test(challenge.extra.g ?? "0")) return null;
  const bites = bitesOf({ score: shared.score, golden }), goal = levelOf(level).goal;
  if (!Number.isInteger(bites) || bites < 0 || bites > goal || golden > (bites === goal ? chilliesIn(level) : Math.floor(bites / 4))) return null;
  return { ...shared, level, golden };
}

export const sharedHash = ({ seed, score, name, level, golden }: Shared) => challengeHash({ seed, target: score, name, extra: level ? { l: level, g: golden ?? 0 } : {} });

const where = (level?: number) => level ? `লেভেল ${bn(level)}-এ ` : "";
export const banner = ({ score, name, level }: Shared) => `${name || "বন্ধু"} ${where(level)}${bn(score)} করেছে। একই ঠোঙা, তোমার পালা।`;
export const previewTitle = ({ score, name, level }: Shared) => name ? `${name} ${where(level)}${bn(score)} করেছে। তুমি পারবে?` : `ঝালমুড়ি সাপে ${where(level)}${bn(score)}! তুমি পারবে?`;
export function caption(shared: Pick<Shared, "score" | "level" | "golden">) {
  if (!shared.level) return `ঝালমুড়ি সাপে আমার স্কোর ${bn(shared.score)}। একই ঠোঙা তোমার জন্য রাখলাম, দেখি কত পারো!`;
  const stars = sharedStars({ seed: 1, name: "", ...shared });
  return `ঝালমুড়ি সাপের লেভেল ${bn(shared.level)}-এ আমার স্কোর ${bn(shared.score)}${stars ? `, ${bn(stars)} তারা` : ""}। একই ঠোঙা তোমার জন্য রাখলাম, দেখি কত পারো!`;
}

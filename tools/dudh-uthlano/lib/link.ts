// The challenge link: what a finished round carries, and the personal preview. Runs on the server too (share.ts → /api/share).
import { challengeHash, readChallenge } from "../../../shared/game-core";

export const POTS = 5;

const numbers = new Intl.NumberFormat("bn-BD", { useGrouping: false });
export const bn = (value: number) => numbers.format(value);
export const totalOf = (scores: readonly number[]) => Math.round(scores.reduce((sum, score) => sum + score, 0) / POTS);

/** A finished round as a link carries it. `total` is always recomputed from the five pots. */
export type Shared = { seed: number; total: number; scores: number[]; spills: boolean[]; name: string; slow: boolean };

const POT_LIST = /^(?:\d{1,2}|x)(?:\.(?:\d{1,2}|x)){4}$/;

export function shareHash({ seed, scores, spills, name, slow }: Omit<Shared, "total">) {
  const clean = scores.map((score, index) => spills[index] ? 0 : Math.max(0, Math.min(99, Math.round(score) || 0)));
  const p = clean.map((score, index) => spills[index] ? "x" : String(score)).join(".");
  return challengeHash({ seed, target: totalOf(clean), name, extra: slow ? { p, d: 1 } : { p } });
}

/** Reads a friend's link; null for anything broken, out of range or inconsistent (the total must match the five pots). */
export function parseShare(hash: string): Shared | null {
  const challenge = readChallenge(hash, { maxTarget: 99, extraKeys: ["p", "d"] });
  const list = challenge?.extra.p;
  if (!challenge || !list || !POT_LIST.test(list)) return null;
  const parts = list.split(".");
  const spills = parts.map(part => part === "x");
  const scores = parts.map(part => part === "x" ? 0 : Number(part));
  if (totalOf(scores) !== challenge.target) return null;
  return { seed: challenge.seed, total: challenge.target, scores, spills, name: challenge.name, slow: challenge.extra.d === "1" };
}

export const spillCount = (spills: readonly boolean[]) => spills.filter(Boolean).length;

export function caption({ total, spills }: Pick<Shared, "total" | "spills">) {
  const spilled = spillCount(spills);
  return `দুধ উথলানোর আগে: পাঁচটা পাতিলে ${bn(total)}%, ${spilled ? `${bn(spilled)}টা উথলে গেছে` : "একটাও উথলায়নি"}। একই পাতিলে তুমি কত পারবে?`;
}

export const previewTitle = ({ total, name }: Pick<Shared, "total" | "name">) => `${name || "এক বন্ধু"} দুধ উথলানোর খেলায় ${bn(total)}% করেছে। তুমি পারবে?`;


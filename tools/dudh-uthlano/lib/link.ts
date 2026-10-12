// The challenge link: what a finished round carries, and the personal preview. Runs on the server too (share.ts → /api/share).
import { challengeHash, readChallenge } from "../../../shared/game-core";
import { potsIn, potsPlain, potsWord, CLASSIC, KITCHEN_COUNT } from "./kitchens";

/** Pots in the original game (kitchen 3). */
export const POTS = 5;

const numbers = new Intl.NumberFormat("bn-BD", { useGrouping: false });
export const bn = (value: number) => numbers.format(value);
/** The round's average: every pot counts, a spill as zero. */
export const totalOf = (scores: readonly number[]) => Math.round(scores.reduce((sum, score) => sum + score, 0) / (scores.length || 1));

/** A finished round as a link carries it. `total` is always recomputed from the pots. Old links carry no kitchen: they are kitchen 3. */
export type Shared = { seed: number; total: number; scores: number[]; spills: boolean[]; name: string; slow: boolean; kitchen: number };

const potList = (count: number) => new RegExp(`^(?:\\d{1,2}|x)(?:\\.(?:\\d{1,2}|x)){${count - 1}}$`);

export function shareHash({ seed, scores, spills, name, slow, kitchen = CLASSIC }: Omit<Shared, "total" | "kitchen"> & { kitchen?: number }) {
  const clean = scores.map((score, index) => spills[index] ? 0 : Math.max(0, Math.min(99, Math.round(score) || 0)));
  const p = clean.map((score, index) => spills[index] ? "x" : String(score)).join(".");
  return challengeHash({ seed, target: totalOf(clean), name, extra: { p, ...(kitchen !== CLASSIC ? { l: kitchen } : {}), ...(slow ? { d: 1 } : {}) } });
}

/** Reads a friend's link; null for anything broken, out of range or inconsistent (one score per pot of that kitchen, and the total must match). */
export function parseShare(hash: string): Shared | null {
  const challenge = readChallenge(hash, { maxTarget: 99, extraKeys: ["p", "d", "l"] });
  const list = challenge?.extra.p, level = challenge?.extra.l ?? String(CLASSIC);
  if (!challenge || !list || !/^\d$/.test(level) || Number(level) < 1 || Number(level) > KITCHEN_COUNT) return null;
  const kitchen = Number(level);
  if (!potList(potsIn(kitchen)).test(list)) return null;
  const parts = list.split(".");
  const spills = parts.map(part => part === "x");
  const scores = parts.map(part => part === "x" ? 0 : Number(part));
  if (totalOf(scores) !== challenge.target) return null;
  return { seed: challenge.seed, total: challenge.target, scores, spills, name: challenge.name, slow: challenge.extra.d === "1", kitchen };
}

export const spillCount = (spills: readonly boolean[]) => spills.filter(Boolean).length;

export function caption({ total, spills }: Pick<Shared, "total" | "spills">) {
  const spilled = spillCount(spills);
  return `দুধ উথলানোর আগে: ${potsWord(spills.length)} পাতিলে ${bn(total)}%, ${spilled ? `${bn(spilled)}টা উথলে গেছে` : "একটাও উথলায়নি"}। একই পাতিলে তুমি কত পারবে?`;
}

export { potsPlain, potsWord };

export const previewTitle = ({ total, name }: Pick<Shared, "total" | "name">) => `${name || "এক বন্ধু"} দুধ উথলানোর খেলায় ${bn(total)}% করেছে। তুমি পারবে?`;


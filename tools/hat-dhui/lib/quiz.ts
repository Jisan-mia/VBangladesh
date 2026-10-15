// "কখন ধোব": a picture quiz on the critical times to wash hands with soap, with no React.
import { starsFor } from "../../../shared/game-core";

export type Moment = { id: string; bn: string };
export type Question = { id: string; right: Moment; wrong: readonly Moment[]; why: string; hint: string };

export const ASK = "কখন সাবান দিয়ে হাত ধোবে?";

// Moments when hands don't need soap: calm, clean things, so no wrong pick is ever a real reason to skip washing.
const GAN = { id: "gan", bn: "গান গাওয়ার সময়" };
const CHAND = { id: "chand", bn: "চাঁদ দেখার সময়" };
const GOLPO = { id: "golpo", bn: "গল্প শোনার সময়" };
const RONGDHONU = { id: "rongdhonu", bn: "রংধনু দেখার সময়" };

/** The critical times (WHO, UNICEF and icddr,b): before eating, after the toilet, after play, after a sneeze, after animals. */
export const QUESTIONS: readonly Question[] = [
  { id: "bhat", right: { id: "bhat", bn: "ভাত খাওয়ার আগে" }, wrong: [GAN, CHAND, GOLPO], why: "আমরা হাত দিয়ে ভাত মাখি। হাত ধুলে জীবাণু আর খাবারে যায় না।", hint: "কোনটায় হাত দিয়ে খাবার ধরবে?" },
  { id: "toilet", right: { id: "toilet", bn: "টয়লেটের পরে" }, wrong: [RONGDHONU, GAN, CHAND], why: "টয়লেটের পরে সাবানে হাত ধুলে পেটের অসুখ কম হয়।", hint: "কোনটার পরে হাতে জীবাণু লেগে থাকে?" },
  { id: "khela", right: { id: "khela", bn: "মাঠে খেলার পরে" }, wrong: [GOLPO, CHAND, RONGDHONU], why: "মাটি আর বলে অনেক জীবাণু থাকে। খেলা শেষে হাত ধুয়ে নাও।", hint: "কোনটায় হাতে মাটি লাগে?" },
  { id: "hanchi", right: { id: "hanchi", bn: "হাঁচি-কাশির পরে" }, wrong: [CHAND, GAN, GOLPO], why: "হাঁচির সাথে জীবাণু হাতে আসে। ধুয়ে ফেললে আর কারও কাছে যায় না।", hint: "হাঁচ্চু! তারপর কী করবে?" },
  { id: "tiffin", right: { id: "tiffin", bn: "টিফিন খাওয়ার আগে" }, wrong: [RONGDHONU, GOLPO, GAN], why: "স্কুলে কত কিছু ধরো। টিফিনের আগে হাত ধুলে জীবাণু খাবারে ওঠে না।", hint: "কোনটায় খাবার মুখে যাবে?" },
  { id: "murgi", right: { id: "murgi", bn: "মুরগি-ছাগল ধরার পরে" }, wrong: [GAN, RONGDHONU, CHAND], why: "মুরগি-ছাগল আদর করা ভালো। তারপর সাবানে হাত ধোও।", hint: "কোনটায় হাত দিয়ে কিছু ছুঁয়েছ?" },
];

export const MOMENT_IDS = [...new Set(QUESTIONS.flatMap(q => [q.right.id, ...q.wrong.map(w => w.id)]))];

export function shuffle<T>(list: readonly T[], rng: () => number): T[] {
  const out = [...list];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

/**
 * Pictures to offer: three, two after three misses in a row (quietly easier), four after five right in a row.
 * A "miss" is a question not answered on the first tap. Never more than the question has.
 */
export function choiceCount(missRun: number, rightRun: number, available: number, base = 3) {
  const wanted = missRun >= 3 ? base - 1 : rightRun >= 5 ? base + 1 : base;
  return Math.max(2, Math.min(wanted, available));
}

/** The right moment plus the first `count - 1` calm ones, shuffled. */
export const choicesFor = (q: Question, count: number, rng: () => number) => shuffle([q.right, ...q.wrong.slice(0, Math.max(1, count - 1))], rng);

/** Stars are a record only: 3 for five or six right first time, 2 for three or four, 1 for finishing. */
export const starsOf = (firstTry: number, total = QUESTIONS.length) => starsFor(firstTry, total - 1, Math.ceil(total / 2));

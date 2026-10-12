import { possessive } from "../../../shared/bangla";
import { starsFor } from "../../../shared/game-core";
import { quizSets, type Question, type QuizSet, type SetId } from "./questions";

export const ROUNDS = 10;
export const MAX_NAME_LENGTH = 24;
/** Below this many players a question's "% got it right" is noise, so it isn't shown. */
export const MIN_TALLY = 20;

export type Pick = 0 | 1 | 2;
export type Result = { set: SetId; picks: Pick[]; name: string };

const numbers = new Intl.NumberFormat("bn-BD");
export const bn = (value: number) => numbers.format(value);

export const setById = (id: string): QuizSet | undefined => (quizSets as readonly QuizSet[]).find(set => set.id === id);
export const isSetId = (id: string): id is SetId => Boolean(setById(id));
export const isRight = (question: Question, pick: Pick | undefined) => question.right === pick;

export function scoreOf(set: SetId, picks: readonly Pick[]) {
  const questions = setById(set)!.questions;
  return picks.filter((pick, index) => questions[index] && isRight(questions[index], pick)).length;
}

export function cleanName(name: string) {
  // Strip control and bidi-override characters so a shared link can't scramble the card text.
  return name.normalize("NFC").replace(/[\u0000-\u001f\u007f‎‏‪-‮⁦-⁩]/g, "").trim().replace(/\s+/g, " ").slice(0, MAX_NAME_LENGTH);
}

/** The link state (no leading #). Picks are which chip was tapped, so the score is always recomputed on open. */
export function resultHash({ set, picks, name }: Result) {
  const params = new URLSearchParams({ set, a: picks.join("") });
  const shown = cleanName(name);
  if (shown) params.set("n", shown);
  return params.toString();
}

export function parseResult(hash: string): Result | null {
  const params = new URLSearchParams(hash.replace(/^#/, ""));
  const set = params.get("set") ?? "";
  const answers = params.get("a") ?? "";
  if (!isSetId(set) || !new RegExp(`^[012]{${ROUNDS}}$`).test(answers)) return null;
  return { set, picks: [...answers].map(Number) as Pick[], name: cleanName(params.get("n") ?? "") };
}

/** Where you'd sit in class. Gender-neutral on purpose (no ছাত্র/ছাত্রী). */
export function badge(score: number) {
  if (score === ROUNDS) return "ফার্স্ট বেঞ্চ";
  if (score >= 8) return "ক্লাস ক্যাপ্টেন";
  if (score >= 6) return "মাঝের বেঞ্চ";
  if (score >= 3) return "পেছনের বেঞ্চ";
  return "নতুন ভর্তি";
}

/** The human line: from the score, and when only one was missed, from which one. */
export function humanLine({ set, picks }: Result) {
  const quiz = setById(set)!;
  const score = scoreOf(set, picks);
  const missed = quiz.questions.filter((question, index) => !isRight(question, picks[index]));
  const one = missed.length === 1 && picks.length === ROUNDS ? possessive(missed[0].topic) : "";
  if (quiz.victory) {
    if (score === ROUNDS) return "বিজয়ের ৫৫ বছরে দেশটা তোমার পুরো চেনা।";
    if (one) return `লাল-সবুজের প্রায় সবটাই চেনা, শুধু ${one} প্রশ্নটা ফসকেছে।`;
    if (score >= 6) return "লাল-সবুজের বেশিরভাগটাই তোমার জানা।";
    return "বিজয়ের মাসে নতুন করে দেশ চেনা শুরু হলো।";
  }
  if (score === ROUNDS) return "দশটা তারাই তোমার। চার্ট পেপারে আর জায়গা নেই।";
  if (one) return `দেশটা প্রায় মুখস্থ, শুধু ${one} প্রশ্নটা ফসকেছে।`;
  if (score >= 7) return "চার্টের বেশিরভাগ তারা তোমার, বাকিগুলো এবার মনে থাকবে।";
  if (score >= 4) return "অর্ধেক দেশ চেনা হলো, বাকিটা ঘুরে দেখার বাহানা।";
  return "ফাঁকা তারাই বেশি। নিচে প্রতিটার উত্তর আর সূত্র আছে।";
}

/** Stars per set: 3 for a perfect ROUNDS, 2 for 7 or more, 1 for finishing. */
export const setStars = (score: number) => starsFor(score, ROUNDS, 7);

/** What the next star needs, with the exact number. Empty at 3 stars. */
export function nearMissLine(score: number) {
  if (score >= ROUNDS) return "";
  return score >= 7 ? `আর ${bn(ROUNDS - score)}টা ঠিক হলে ৩ তারা।` : `আর ${bn(7 - score)}টা ঠিক হলে ২ তারা।`;
}

export const scoreLine = (score: number) => `${bn(ROUNDS)}-এ ${bn(score)}`;
export const cardTitle = (set: SetId) => setById(set)?.victory ? "বিজয়ের ৫৫ বছর: দেশ চেনো" : "দেশ চেনো";

export function previewTitle(result: Result) {
  const score = scoreOf(result.set, result.picks);
  const lead = setById(result.set)?.victory ? "বিজয়ের ৫৫ বছর: " : "";
  return `${lead}${result.name || "এক বন্ধু"} দেশ চেনো কুইজে ${scoreLine(score)}। তুমি কয়টা পারবে?`;
}

export function compareLine(mine: number, friend: Result) {
  const theirs = scoreOf(friend.set, friend.picks);
  const who = friend.name ? possessive(friend.name) : "বন্ধুর";
  if (mine === theirs) return `${who} সাথে সমান সমান, দুজনেই ${bn(mine)}।`;
  return mine > theirs ? `${who} চেয়ে ${bn(mine - theirs)}টা বেশি!` : `${who} চেয়ে ${bn(theirs - mine)}টা কম। আরেকবার?`;
}

// Tally ids: "s-<question>" counts who answered it, "r-<question>" who got it right. Fixed ids only, never names.
export const tallyIds = quizSets.flatMap(set => set.questions.flatMap(question => [`s-${question.id}`, `r-${question.id}`]));

export function tallyItems({ set, picks }: Result) {
  return setById(set)!.questions.flatMap((question, index) => picks[index] === undefined ? [] : isRight(question, picks[index]) ? [`s-${question.id}`, `r-${question.id}`] : [`s-${question.id}`]);
}

/** Share of players who picked right, or null while the sample is too small. */
export function rightShare(counts: Record<string, number>, id: string) {
  const seen = counts[`s-${id}`] ?? 0;
  return seen >= MIN_TALLY ? Math.round(((counts[`r-${id}`] ?? 0) / seen) * 100) : null;
}

/** The Victory Day set leads through December (55th Victory Day on 16 Dec 2026); national symbols lead the rest of the year. */
export const defaultSet = (date: Date): SetId => date.getMonth() === 11 ? "v55" : "protik";

export { possessive };

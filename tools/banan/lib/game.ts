import { possessive } from "../../../shared/bangla";
import { wordSets, type SetId, type Word, type WordSet } from "./words";

export const ROUNDS = 10;
export const MAX_NAME_LENGTH = 24;
/** Below this many players a word's "% got it right" is noise, so it isn't shown. */
export const MIN_TALLY = 20;

export type Pick = 0 | 1;
export type Result = { set: SetId; picks: Pick[]; name: string };

const numbers = new Intl.NumberFormat("bn-BD");
export const bn = (value: number) => numbers.format(value);

export const setById = (id: string): WordSet | undefined => (wordSets as readonly WordSet[]).find(set => set.id === id);
export const isSetId = (id: string): id is SetId => Boolean(setById(id));

export const isRight = (word: Word, pick: Pick) => word.right === pick;

export function scoreOf(set: SetId, picks: readonly Pick[]) {
  const words = setById(set)!.words;
  return picks.filter((pick, index) => words[index] && isRight(words[index], pick)).length;
}

export function cleanName(name: string) {
  // Strip control and bidi-override characters so a shared link can't scramble the card text.
  return name.normalize("NFC").replace(/[\u0000-\u001f\u007f‎‏‪-‮⁦-⁩]/g, "").trim().replace(/\s+/g, " ").slice(0, MAX_NAME_LENGTH);
}

/** The link state (no leading #). Picks are which option was tapped, so the score is always recomputed on open. */
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
  if (!isSetId(set) || !new RegExp(`^[01]{${ROUNDS}}$`).test(answers)) return null;
  return { set, picks: [...answers].map(Number) as Pick[], name: cleanName(params.get("n") ?? "") };
}

export function badge(score: number, set: SetId) {
  if (setById(set)?.sober) return "একুশের ৭৫ বছর";
  if (score === ROUNDS) return "সাইনবোর্ড-ওস্তাদ";
  if (score >= 8) return "বানান-বীর";
  if (score >= 6) return "পাকা হাত আসছে";
  if (score >= 3) return "নতুন রংমিস্ত্রি";
  return "আজ থেকে শুরু";
}

export function humanLine(score: number, set: SetId) {
  if (setById(set)?.sober) {
    if (score === ROUNDS) return "শুদ্ধ করে লেখাও একুশের প্রতি শ্রদ্ধা।";
    if (score >= 6) return "প্রায় সবটাই শুদ্ধ। বাকিটা এবার মনে থাকবে।";
    return "ভুল থেকেই শেখা। মাতৃভাষা রোজ একটু করে শিখি।";
  }
  if (score === ROUNDS) return "তোমার হাতে সাইনবোর্ড দিলে একটাও ভুল থাকত না।";
  if (score >= 6) return "প্রায় সব ঠিক, বাকিটা এখন শিখে গেলে।";
  return "বানান ভুল হয়, ভালোবাসা কমে না।";
}

export const scoreLine = (score: number) => `${bn(ROUNDS)}-এ ${bn(score)}`;

export function previewTitle(result: Result) {
  const score = scoreOf(result.set, result.picks);
  const who = result.name || "এক বন্ধু";
  const lead = setById(result.set)?.sober ? "একুশের ৭৫ বছর: " : "";
  return `${lead}${who} ${scoreLine(score)}টা বানান ঠিক করেছে — তুমি পারবে?`;
}

/** What a friend's link says above the game. */
export function friendLine(result: Result) {
  const score = scoreOf(result.set, result.picks);
  return `${result.name || "তোমার বন্ধু"} পেয়েছে ${scoreLine(score)}, তুমি?`;
}

export function compareLine(mine: number, friend: Result) {
  const theirs = scoreOf(friend.set, friend.picks);
  const who = friend.name ? possessive(friend.name) : "বন্ধুর";
  if (mine === theirs) return `${who} সাথে সমান সমান, দুজনেই ${bn(mine)}।`;
  return mine > theirs ? `${who} চেয়ে ${bn(mine - theirs)}টা বেশি!` : `${who} চেয়ে ${bn(theirs - mine)}টা কম। আরেকবার?`;
}

// Tally ids: "s-<word>" counts who answered it, "r-<word>" who got it right. Fixed ids only, never names.
export const tallyIds = wordSets.flatMap(set => set.words.flatMap(word => [`s-${word.id}`, `r-${word.id}`]));

export function tallyItems({ set, picks }: Result) {
  return setById(set)!.words.flatMap((word, index) => picks[index] === undefined ? [] : isRight(word, picks[index]) ? [`s-${word.id}`, `r-${word.id}`] : [`s-${word.id}`]);
}

/** Share of players who picked right, or null while the sample is too small. */
export function rightShare(counts: Record<string, number>, wordId: string) {
  const seen = counts[`s-${wordId}`] ?? 0;
  return seen >= MIN_TALLY ? Math.round(((counts[`r-${wordId}`] ?? 0) / seen) * 100) : null;
}

/** The Ekushe set leads through February (75th anniversary on 21 Feb 2027); the shop signs lead the rest of the year. */
export const defaultSet = (date: Date): SetId => date.getMonth() === 1 ? "e75" : "dokan";

export { possessive };

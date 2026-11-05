// The words around a picture, and what the parents' card says. Text is for the grown-up who reads along; every cue also has a picture.
import { FEELINGS, ORDER, type Feeling } from "./faces";
import { levelOf } from "./levels";
import type { Round } from "./round";
import type { Scene } from "./scenes";

const digits = new Intl.NumberFormat("bn-BD", { useGrouping: false });
export const bn = (value: number) => digits.format(value);

export const question = (scene: Scene) => `${scene.whose} এখন কেমন লাগছে?`;
export const kindQuestion = (scene: Scene) => scene.q ?? "কী করলে ভালো লাগবে?";
export const againLine = (scene: Scene) => `${scene.clue} আরেকবার ভাবো।`;
export const sayLine = (scene: Scene, feeling: Feeling) => FEELINGS[feeling].say(scene.who, scene.whose);

/** "রাগ আর মন খারাপ, দুটোই হতে পারে।" when more than one feeling fits; empty otherwise. */
export function alsoLine(scene: Scene, picked: Feeling) {
  if (scene.feels.length < 2) return "";
  const words = [picked, ...scene.feels.filter(feeling => feeling !== picked)].map(feeling => FEELINGS[feeling].word);
  return scene.feels.length === 2 ? `${words[0]} আর ${words[1]}, দুটোই হতে পারে।` : `${words.join(", ")}, তিনটাই হতে পারে।`;
}

export const mirrorLine = (levelId: number) => `এবার আয়নায় একটা ${FEELINGS[levelOf(levelId).feeling].mirror} বানাও তো।`;

export function listWords(feelings: readonly Feeling[]) {
  const words = ORDER.filter(feeling => feelings.includes(feeling)).map(feeling => FEELINGS[feeling].word);
  return words.length < 2 ? words.join("") : `${words.slice(0, -1).join(", ")} আর ${words.at(-1)}`;
}

/** The distinct feelings found in a round, in the fixed order. */
export const colorsOf = (round: Round): Feeling[] => ORDER.filter(feeling => round.found.includes(feeling));
export const endLine = (round: Round) => `${bn(round.scenes.length)}টা ছবিতে মন চিনলে: ${listWords(colorsOf(round))}।`;

/** What the child did today, for the parent card: pictures finished and the feelings found. Only rounds that were won count. */
export type Today = { scenes: number; feelings: Feeling[] };
export const addToday = (today: Today, round: Round): Today =>
  ({ scenes: today.scenes + round.scenes.length, feelings: ORDER.filter(feeling => today.feelings.includes(feeling) || round.found.includes(feeling)) });

export const cardHead = (today: Today) => `আজ ${bn(today.scenes)}টা ছবিতে`;
export const cardTail = "মনের রং চিনলাম";
export const cardSub = "প্রতিটায় ভাবলাম, কী করলে ভালো লাগে";
/** The level and its stars on the card: the same stars the end screen showed. */
export const cardLevel = (levelId: number) => levelOf(levelId).name;

// Every line of Bangla the game says outside the pictures, in the site's তুমি voice. Read aloud by a parent, never spoken by the phone.
import { levelOf } from "./course";
import { cardWords, RULES, WORDS, type Rule } from "./pairs";
import { rightChoice, type Result, type Round } from "./round";

export const bn = (value: number) => new Intl.NumberFormat("bn-BD", { useGrouping: false }).format(value);

/** What to do now: under the choices before an answer. */
export const promptOf = (round: Round) => round.rang ? `ঘণ্টা বাজল! ${RULES[round.rule].say}।` : `${RULES[round.rule].say}।`;

/** What the picture was, for the screen reader. */
export const shownLabel = (round: Round) => round.item.kind === "pair" ? WORDS[round.item.show] : cardWords(round.item.card);

/** A kind nudge after a miss: it names the rule and asks the question, never gives the answer away and never says "ভুল". */
export function hintOf(round: Round) {
  const rule = round.rule, item = round.item;
  if (item.kind === "pair") return rule === "same" ? `এখন নিয়ম ‘একই’। ${WORDS[item.show]} এসেছে, ওই ছবিটাই খোঁজো।` : `এখন নিয়ম ‘উল্টো’। ${WORDS[item.show]} এসেছে, তার উল্টো কী?`;
  return rule === "shape" ? `এখন আকার দেখো। ${cardWords(item.card)}টা কোন আকারের?` : `এখন রং দেখো। ${cardWords(item.card)}টা কোন রঙের?`;
}

/** What was matched, after a right answer. */
export function foundLine(round: Round) {
  const item = round.item;
  if (item.kind === "pair") {
    const picked = item.choices[rightChoice(item, round.rule)];
    return round.rule === "same" ? `${WORDS[item.show]} আর ${WORDS[picked]} একই।` : `${WORDS[item.show]} আর ${WORDS[picked]} উল্টো।`;
  }
  return round.rule === "shape" ? `${cardWords(item.card)} গেল আকারের ঝুড়িতে।` : `${cardWords(item.card)} গেল রঙের ঝুড়িতে।`;
}

/** চটপট's picture ran out of time: said softly, with the right one lit. */
export const passLine = (rule: Rule) => `সময় শেষ। ${RULES[rule].say}।`;

/** The honest line under the stars: praise the method only for a clean round, a plain count for one or two slips, a tip for more. */
export function methodLine(result: Result) {
  const level = levelOf(result.level), many = result.mistakes >= 3;
  if (result.mistakes <= 1) {
    if (level.kind === "sort") return "ঘণ্টা শুনেই রং ছেড়ে আকার দেখলে।";
    return result.bells ? "ঘণ্টা শুনেই নিয়ম বদলে নিলে।" : "হাতটা একটু থামিয়ে চাপলে, তাই মিলল।";
  }
  if (!many) return `${bn(result.mistakes)}বার থেমে আবার ভেবেছ।`;
  if (level.kind === "sort") return "ঘণ্টা বাজলে চিহ্নটা আগে দেখো: রং, না আকার?";
  return result.bells ? "ঘণ্টা বাজলে চিহ্নটা আগে দেখো: উল্টো, না একই?" : "আগে মনে মনে উল্টোটা বলো, তারপর চাপো।";
}

/** "এখন তুমি … পারো": what this round showed the child can do, only after a round with few slips. */
export const newsLine = (id: number) => `এখন তুমি ${levelOf(id).learned} পারো।`;

/** A task off the screen, one per world. */
const TASKS = ["আম্মুকে বলো ‘দিন’, ও বলবে ‘রাত’। তারপর তুমি বলো, ও উল্টোটা বলবে।", "আব্বু বলবে ‘উঠে দাঁড়াও’, তুমি বসবে। ঘণ্টা বাজালে এবার যা বলবে, তা-ই কোরো।", "ঘরে লাল আর নীল দুটো জিনিস খুঁজে আনো। কোনটা ফুলের মতো, কোনটা নৌকার?"];
export const taskLine = (id: number) => TASKS[levelOf(id).world];

/** The title's one line under the chips. */
export const titleLine = (quick: boolean) => quick ? "চটপট: প্রতিটা ছবি কয়েক সেকেন্ড থাকে, তারপর সরে যায়।" : "আরামে: কোনো তাড়া নেই, চাপলে তবেই পরের ছবি।";

export const doneLine = (id: number) => levelOf(id).kind === "sort" ? "রং আর আকারে কার্ড সাজালাম" : "ছবির উল্টোটা খুঁজে নিলাম";

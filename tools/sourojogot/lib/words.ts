// Every Bangla line the game says, in one place: the question, the end screen, the card. Pure strings, no React.
// Rules: short, concrete, warm; a slip is never "ভুল", and a round with many slips is never praised as if it were clean.
import { levelOf, type Mode } from "./course";
import { bn, footballScale, metreLabel, mmLabel, PLANETS } from "./planets";
import { itemOf, planetOf, type Round } from "./round";

export function doneLine(level: number) {
  const { mode, count } = levelOf(level);
  switch (mode) {
    case "tour": return `আজ সূর্য থেকে ${PLANETS[count - 1].name} পর্যন্ত ঘুরে এলাম`;
    case "sort": return `আজ ${bn(count)}টা গ্রহ ঠিক ক্রমে সাজালাম`;
    case "know": return `আজ ${bn(count)}টা গ্রহ চিনলাম`;
    case "build": return `আজ ${bn(count)}টা গ্রহ নিজের জায়গায় বসালাম`;
    case "size": return `আজ ${bn(count)}টা গ্রহের মাপ মেলালাম`;
    case "far": return `আজ ${bn(count)}টা গ্রহের দূরত্ব মাপলাম`;
    default: return "আজ নেপচুন পর্যন্ত মাপ আর দূরত্ব মেলালাম";
  }
}

/** What the child can do now: an informational reward, never a grade. */
export function newsLine(level: number) {
  const { mode, count } = levelOf(level);
  switch (mode) {
    case "tour": return count === 4 ? "এখন তুমি সূর্যের কাছের চার গ্রহ ক্রমে বলতে পারো।" : "এখন তুমি আট গ্রহই ক্রমে বলতে পারো।";
    case "sort": return "এখন তুমি এলোমেলো গ্রহও ক্রমে সাজাতে পারো।";
    case "know": return "এখন তুমি চেহারা দেখে গ্রহ চিনতে পারো।";
    case "build": return count === 4 ? "এখন তুমি সূর্যের পাড়াটা নিজের হাতে সাজাতে পারো।" : "এখন তুমি পুরো সৌরজগৎ নিজের হাতে সাজাতে পারো।";
    case "size": return "এখন তুমি জানো, ফুটবল-সূর্যের পাশে পৃথিবী একটা সরিষার দানা।";
    case "far": return `এখন তুমি জানো, ফুটবল-সূর্য হলে নেপচুন ${metreLabel(footballScale(PLANETS[7]).distanceM)} দূরে।`;
    default: return "এখন তুমি জানো, গ্রহগুলো ছোট আর মাঝখানের ফাঁকা জায়গা অনেক বড়।";
  }
}

/** A task off the screen. */
export function taskLine(level: number) {
  const { mode, count } = levelOf(level);
  switch (mode) {
    case "tour": return count === 4 ? "এবার আম্মুকে বলো, পৃথিবী সূর্যের কত নম্বর গ্রহ।" : "এবার আব্বুকে আট গ্রহের নাম ক্রমে বলে শোনাও।";
    case "sort": return "এবার আঙুলে গুনে গুনে গ্রহের নাম বলো।";
    case "know": return "এবার রাতে আকাশ দেখার সময় আম্মু বা আব্বুকে জিজ্ঞেস করো, কোনটা গ্রহ।";
    case "build": return "এবার কাগজে সূর্য আর গ্রহ এঁকে ক্রমে সাজাও।";
    case "size": return "এবার একটা সরিষার দানা হাতে নিয়ে দেখো। পৃথিবী ততটুকুই।";
    case "far": return "এবার একটা মাঠের এক মাথা থেকে অন্য মাথা হেঁটে দেখো।";
    default: return "এবার আম্মু বা আব্বুকে বলো, ফুটবল-সূর্য হলে নেপচুন কত দূরে থাকত।";
  }
}

const NAMES = (count: number) => PLANETS.slice(0, count).map(planet => planet.name).join(", ");

/** After many slips: one thing to try, no praise. */
export function tipLine(level: number) {
  const { mode, count } = levelOf(level);
  switch (mode) {
    case "tour": case "sort": case "build": return `সূর্য থেকে গুনে দেখো: ${NAMES(count)}।`;
    case "know": return "প্রতিটা গ্রহের একটা চেনার চিহ্ন আছে: শনির বলয়, মঙ্গলের লাল রং, বৃহস্পতির ঝড়।";
    case "size": return "ফুটবলের পাশে সব গ্রহ ছোট। পৃথিবী একটা সরিষার দানা।";
    case "far": return "সূর্য থেকে যত বাইরে, তত দূরে। নেপচুন সবচেয়ে দূরে।";
    default: return "গ্রহ ছোট, কিন্তু অনেক দূরে দূরে। এভাবে ভাবো।";
  }
}

/** The end screen's second line. Praise only for a clean round; a few slips are named plainly; many get a tip. */
export function methodLine(level: number, mistakes: number) {
  const { mode } = levelOf(level);
  if (mistakes >= 3) return tipLine(level);
  if (mistakes > 0) return `${bn(mistakes)}বার থেমে আবার ভেবেছ।`;
  if (mode === "tour" || mode === "sort") return "সূর্য থেকে গুনে গুনে গেছ, তাই একবারও আটকাওনি।";
  if (mode === "build") return "ক্রমটা মনে রেখেছ, তাই একবারও আটকাওনি।";
  if (mode === "know") return "চেহারা মনে রেখেছ, তাই একবারও আটকাওনি।";
  return "একবারও আটকাওনি।";
}

/** The line under the board before an answer: what to do. */
export function introOf(mode: Mode) {
  switch (mode) {
    case "tour": return "রকেট সূর্যের পাশে। সবচেয়ে কাছের গ্রহে চাপো।";
    case "sort": return "গ্রহগুলো জায়গা বদলে ফেলেছে। সূর্যের সবচেয়ে কাছেরটা আগে চাপো।";
    case "build": return "গ্রহটাকে তার নিজের পথে বসাও। সূর্যের কাছেরটা ১ নম্বর।";
    case "know": return "জানালা দিয়ে কী দেখা যাচ্ছে? কোন গ্রহ?";
    default: return "";
  }
}
export function promptOf(round: Round) {
  const item = itemOf(round), name = planetOf(round).name;
  if (item.kind === "size") return `সূর্য যদি একটা ফুটবল হয়, ${name} কত বড় হতো?`;
  if (item.kind === "far") return `ফুটবল-সূর্য মাঠের এক মাথায়। ${name} কোথায় থাকত?`;
  if (item.kind === "place") return `${name} কোন পথে বসবে? সূর্যের কাছেরটা ১ নম্বর।`;
  if (item.kind === "know") return introOf("know");
  return introOf(levelOf(round.level).mode);
}

/** The card's second line: one true number from the round. */
export function cardFact(level: number) {
  const { mode, count } = levelOf(level);
  const earth = PLANETS[2], neptune = PLANETS[7];
  if (mode === "size") return `সূর্য ফুটবল হলে পৃথিবী ${mmLabel(footballScale(earth).sizeMm)}, একটা সরিষার দানা`;
  if (mode === "far" || mode === "scale") return `সূর্য ফুটবল হলে নেপচুন ${metreLabel(footballScale(neptune).distanceM)} দূরে`;
  if (mode === "know") return "শনির বলয় আছে, মঙ্গল লাল, শুক্র সবচেয়ে গরম";
  return count === 4 ? "সূর্যের কাছের এই চার গ্রহের ওপরটা শক্ত মাটির" : "বৃহস্পতির ভেতরে প্রায় ১০০০টা পৃথিবী ধরে যায়";
}

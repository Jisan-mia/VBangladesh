// Challenge links, stars and every line of result text. Server-safe: share.ts loads this, so it reaches only game-core and the levels.
import { possessive } from "../../../shared/bangla";
import { challengeHash, cleanName, readChallenge, starsFor } from "../../../shared/game-core";
import { isLevel, seedOf, worldOf, LEVEL_COUNT } from "./levels";

const digits = new Intl.NumberFormat("bn-BD", { useGrouping: false });
export const bn = (value: number) => digits.format(value);

export const BALLS = 3;
/** All seven down with one ball is 3 stars, with two balls 2, with the last ball 1. */
export const starsOf = (balls: number) => starsFor(balls, 1, 2, true);

/** A cleared level as the player reports it. Real-time aim can't be re-checked, so the ball count is their phone's word. */
export type Shared = { level: number; balls: number; name: string };

/** `#s=<the level's seed>&t=<balls used, 1–3>&l=<level>&n=<name>`. Anything else is refused. */
export function parseShared(hash: string): Shared | null {
  const read = readChallenge(hash, { maxTarget: BALLS, extraKeys: ["l"] });
  if (!read || read.target < 1) return null;
  const l = read.extra.l ?? "";
  if (!/^[1-9]\d?$/.test(l)) return null;
  const level = Number(l);
  if (!isLevel(level) || read.seed !== seedOf(level)) return null;
  return { level, balls: read.target, name: read.name };
}

export const sharedHash = ({ level, balls, name }: Shared) =>
  challengeHash({ seed: seedOf(level), target: Math.min(BALLS, Math.max(1, Math.round(balls))), name, extra: { l: level } });

export const levelLabel = (level: number) => `লেভেল ${bn(level)} · ${worldOf(level).name}`;
/** "এক বলে", "২ বলে" */
export const ballsText = (balls: number) => balls === 1 ? "এক বলে" : `${bn(balls)} বলে`;

const CLEAR_LINES = [
  ["সাতটা চাড়াই গলির ধুলায়।", "চায়ের দোকানের মামা মুখ তুলে তাকালেন।", "বলটা ড্রেনে পড়েনি, এটাই বড় কথা।", "রিকশার বেল বাজিয়ে কেউ পাশ কাটাল।", "জানালা থেকে কেউ বলল, আস্তে!", "খটাখট শব্দে পুরো গলি টের পেল।", "ইটের রাস্তায় চাড়াগুলো ছড়িয়ে আছে।", "বিকেলের আলো পড়ে আসছে। আরেকটা হয়ে যাক।", "পাশের বাসার ছাদ থেকে কেউ হাততালি দিল।"],
  ["টিফিনের ঘণ্টা পড়ার আগেই সাফ।", "দপ্তরি চাচা বারান্দা থেকে দেখছেন।", "সিঁড়ির চাড়াও আর দাঁড়িয়ে নেই।", "ইটের ওপর দিয়ে বলটা ঠিক জায়গায় পড়ল।", "মাঠের ঘাসে সাতটা চাড়া শুয়ে আছে।", "ক্লাসের জানালায় তিনটা মাথা উঁকি দিল।", "স্যার আসার আগেই খেলা শেষ।", "বল ফিরিয়ে আনতে এবার কে যাবে?", "সাদা জামায় একটুও কাদা লাগেনি।"],
  ["উঠানে খটাখট, রান্নাঘর থেকে আম্মু ডাকলেন।", "দড়ির গামছাটা বেঁচে গেল।", "বারান্দার সিঁড়ি এখন ফাঁকা।", "কলপাড় থেকে আপু মুখ তুলে তাকাল।", "নানু পিঁড়িতে বসে হাসছেন।", "উঠান ঝাড়ু দেওয়ার আগেই সাফ।", "টিনের চালে বল লাগেনি, বাঁচা গেল।", "পুকুরপাড় থেকে ছোট ভাই দৌড়ে এল।", "সন্ধ্যার আগে আরেকটা খেলা হবে?"],
] as const;

/** The level-clear line: one small scene from that place. A place's last level and the very last one get their own. */
export function clearLine(level: number) {
  if (level === LEVEL_COUNT) return "৩০টা সাজানো চাড়াই ফেলে দিলে, গলি থেকে উঠান পর্যন্ত।";
  if (level === 10) return "গলির সব সাজানো শেষ। এবার স্কুলের মাঠে।";
  if (level === 20) return "স্কুলের মাঠও শেষ। এবার বাড়ির উঠানে।";
  const lines = CLEAR_LINES[Math.min(2, Math.floor((level - 1) / 10))];
  return lines[(level - 1) % 10 % lines.length];
}

/** After a throw that didn't finish the level. A miss names the far-off dog, so the joke never lives in the sound alone. */
export function throwLine(knocked: number, left: number, ballsLeft: number) {
  const next = ballsLeft === 1 ? " শেষ বল।" : "";
  if (!knocked) return `ফসকে গেছে। দূরে একটা কুকুর ডেকে উঠল।${next}`;
  if (left === 1) return `${bn(knocked)}টা পড়ল। আর মাত্র ১টা!${next}`;
  return `${bn(knocked)}টা পড়ল। আর ${bn(left)}টা বাকি।${next}`;
}

/** When the three balls are used up: exact and kind. */
export const missLine = (left: number) => left === 7 ? "একটাও পড়েনি। এবার একটু নিচ দিয়ে, গোড়া বরাবর ছুড়ে দেখো।" : left === 1 ? "আর মাত্র ১টা চাড়া বাকি ছিল!" : `আর ${bn(left)}টা চাড়া বাকি ছিল।`;

/** "আর ২টা পড়লে প্রথম বলেই ৩ তারা হতো।" From how many fell on the first ball. Empty at three stars. */
export function nearMissLine(balls: number, firstBall: number) {
  if (balls === 1) return "";
  if (firstBall >= 1 && firstBall < 7) return `প্রথম বলে ${bn(firstBall)}টা পড়েছিল। আর ${bn(7 - firstBall)}টা পড়লে ৩ তারা হতো।`;
  return balls === 2 ? "এক বলে সাতটা ফেললে ৩ তারা।" : "দুই বলে সাতটা ফেললে ২ তারা, এক বলে ৩ তারা।";
}

/** The line on the card, seen by friends: first person, one image. */
export function humanLine(balls: number) {
  if (balls === 1) return "প্রথম বলেই খটাখট।";
  if (balls === 2) return "দ্বিতীয় বলে বাকিগুলোও গেল।";
  return "শেষ বলে শেষ চাড়া।";
}

/** "রাফি লেভেল ১২-এর সাত চাড়া ২ বলে ফেলেছে" */
export function feat({ level, balls, name }: Shared) {
  return `${cleanName(name) || "এক বন্ধু"} লেভেল ${bn(level)}-এর সাত চাড়া ${ballsText(balls)} ফেলেছে`;
}

export const previewTitle = (shared: Shared) => `${feat(shared)}। তুমি পারবে?`;

export function bannerNote({ name }: Pick<Shared, "name">) {
  return `এটা ${possessive(cleanName(name) || "বন্ধু")} নিজের ফোনের হিসাব। একই সাজানো চাড়া, এবার তোমার পালা।`;
}

/** After a friend's level: fewer balls is better. Kind either way. */
export function compareLine(mine: number, theirs: number, name: string) {
  const who = cleanName(name) || "বন্ধু";
  if (mine < theirs) return `${possessive(who)} চেয়ে ${bn(theirs - mine)} বল কম লাগল!`;
  if (mine === theirs) return `সমান সমান! ${who}ও ${ballsText(theirs)} ফেলেছিল।`;
  return `${who} ${ballsText(theirs)} পেরেছিল। আর একটু হলেই!`;
}

export function caption({ level, balls }: Pick<Shared, "level" | "balls">) {
  return `সাত চাড়ার লেভেল ${bn(level)}: সাতটা চাড়া ফেললাম ${ballsText(balls)}। তুমি কয় বলে পারবে?`;
}

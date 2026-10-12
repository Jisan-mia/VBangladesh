// Challenge links and every line of result text. Server-safe: share.ts loads this, so it reaches only game-core and the game rules.
import { possessive } from "../../../shared/bangla";
import { challengeHash, cleanName, readChallenge } from "../../../shared/game-core";
import { isLevel, levelSeed, puzzleOf, shortBy, starsFor, worldOf, LEVEL_COUNT, WORLDS } from "./game";

const digits = new Intl.NumberFormat("bn-BD", { useGrouping: false });
export const bn = (value: number) => digits.format(value);

export const MAX_SECONDS = 5999;
/** A cleared picture as the player reports it: time and mistakes come from their own phone and can't be re-checked. */
export type Shared = { level: number; seconds: number; mistakes: number; hinted: boolean; name: string };

/** `#s=<level's seed>&t=<seconds>&l=<level>&m=<mistakes>&h=1 if a hint was taken&n=<name>`. Anything else is refused. */
export function parseShared(hash: string): Shared | null {
  const challenge = readChallenge(hash, { maxTarget: MAX_SECONDS, extraKeys: ["l", "m", "h"] });
  if (!challenge || challenge.target < 1) return null;
  const { l = "", m = "", h } = challenge.extra;
  const level = /^[1-9]\d?$/.test(l) ? Number(l) : 0;
  if (!isLevel(level) || challenge.seed !== levelSeed(level) || (h !== undefined && h !== "1") || !/^(0|[1-9]\d?)$/.test(m)) return null;
  const { solution } = puzzleOf(level), mistakes = Number(m);
  if (mistakes > solution.filter(filled => !filled).length) return null;
  return { level, seconds: challenge.target, mistakes, hinted: h === "1", name: challenge.name };
}

export function sharedHash({ level, seconds, mistakes, hinted, name }: Shared) {
  return challengeHash({ seed: levelSeed(level), target: Math.min(MAX_SECONDS, Math.max(1, seconds)), name, extra: { l: level, m: mistakes, ...(hinted ? { h: 1 } : {}) } });
}

/** "২ মিনিট ১০ সেকেন্ড", "৪৫ সেকেন্ড", "৩ মিনিট" */
export function timeText(seconds: number) {
  const minutes = Math.floor(seconds / 60), rest = seconds % 60;
  if (!minutes) return `${bn(rest)} সেকেন্ড`;
  return rest ? `${bn(minutes)} মিনিট ${bn(rest)} সেকেন্ড` : `${bn(minutes)} মিনিট`;
}

export const levelLabel = (level: number) => `লেভেল ${bn(level)} · ${WORLDS[worldOf(level)]}`;
export const pictureName = (level: number) => puzzleOf(level).picture.name;

/** The level-clear line: one picture, one small scene. The last level gets its own. */
export function clearLine(level: number) {
  return level === LEVEL_COUNT ? `${puzzleOf(level).picture.line} ৩০টা ছবিই এখন তোমার অ্যালবামে।` : puzzleOf(level).picture.line;
}

/** The near-miss line, with exact numbers. Empty at three stars. */
export function nearMiss(mistakes: number, hinted: boolean) {
  const earned = starsFor(mistakes, hinted), gap = shortBy(mistakes, hinted);
  if (earned === 3) return "";
  if (gap > 0) return `আর ${bn(gap)}টা ভুল ঘর কম হলে ${bn(earned + 1)} তারা।`;
  return mistakes ? "হিন্ট ছাড়া, কোনো ভুল ঘর না ভরে পারলে ৩ তারা।" : "হিন্ট ছাড়া পারলে ৩ তারা পাবে।";
}

/** The line on the card, seen by friends: first person, the number first. */
export function cardLine({ seconds, mistakes, hinted }: Pick<Shared, "seconds" | "mistakes" | "hinted">) {
  if (starsFor(mistakes, hinted) === 3) return `${timeText(seconds)}, একটা ঘরও ভুল ভরিনি।`;
  if (hinted) return `${timeText(seconds)}, একটু হিন্ট নিয়ে।`;
  return `${timeText(seconds)}, ভুল ঘর ${bn(mistakes)}টা। শেষে ঠিকই মিলেছে।`;
}

/** "রাফি লেভেল ১২-এর ছবি ২ মিনিট ১০ সেকেন্ডে ফুটিয়েছে" */
export function feat({ level, seconds, name }: Pick<Shared, "level" | "seconds" | "name">) {
  return `${cleanName(name) || "এক বন্ধু"} লেভেল ${bn(level)}-এর ছবি ${timeText(seconds)}ে ফুটিয়েছে`;
}

export const previewTitle = (shared: Shared) => `${feat(shared)}। তুমি পারবে?`;

export function bannerNote({ name, mistakes }: Pick<Shared, "name" | "mistakes">) {
  const who = cleanName(name) || "বন্ধু";
  return `${mistakes ? `ভুল ঘর ${bn(mistakes)}টা` : "একটাও ভুল ঘর নেই"}। সময়টা ${possessive(who)} নিজের ফোনের হিসাব। একই ছবি, এবার তোমার পালা।`;
}

/** After playing a friend's picture: less time is better. Kind either way. */
export function compareLine(mine: number, theirs: number, name: string) {
  const who = cleanName(name) || "বন্ধু";
  if (mine < theirs) return `${possessive(who)} চেয়ে ${timeText(theirs - mine)} আগে!`;
  if (mine === theirs) return `একদম সমান! ${who}ও ${timeText(theirs)} নিয়েছিল।`;
  if (mine - theirs <= 15) return `আর একটু হলেই! মাত্র ${timeText(mine - theirs)} পিছিয়ে।`;
  return `${who} এখনো ${timeText(mine - theirs)} এগিয়ে। আরেকবার?`;
}

export function caption({ level, seconds, mistakes, hinted }: Pick<Shared, "level" | "seconds" | "mistakes" | "hinted">) {
  return starsFor(mistakes, hinted) === 3
    ? `ছবি ফোটাও-এর লেভেল ${bn(level)}, ${timeText(seconds)}ে ছবিটা ফোটালাম, একটা ঘরও ভুল না করে। তুমি কত সময়ে পারো?`
    : `ছবি ফোটাও-এর লেভেল ${bn(level)}-এর ছবিটা ${timeText(seconds)}ে ফোটালাম। দেখি তুমি কত সময়ে পারো।`;
}

// Challenge links and every line of result text. Server-safe: share.ts loads this, so it reaches only game-core and the game rules.
import { possessive } from "../../../shared/bangla";
import { challengeHash, cleanName, readChallenge } from "../../../shared/game-core";
import { isLevel, levelSeed, pieceCount, planOf, shortBy, starsFor, worldOf, LEVEL_COUNT, WORLDS } from "./game";
import { isFinale } from "./levels";
import { nameFor } from "./painting";

const digits = new Intl.NumberFormat("bn-BD", { useGrouping: false });
export const bn = (value: number) => digits.format(value);

export const MAX_SECONDS = 5999;
/** A finished painting as the player reports it: the time comes from their own phone and can't be re-checked. */
export type Shared = { level: number; seconds: number; name: string };

/** `#s=<level's seed>&t=<seconds>&l=<level>&n=<name>`. Anything else is refused. */
export function parseShared(hash: string): Shared | null {
  const challenge = readChallenge(hash, { maxTarget: MAX_SECONDS, extraKeys: ["l"] });
  if (!challenge || challenge.target < 1) return null;
  const l = challenge.extra.l ?? "";
  const level = /^[1-9]\d?$/.test(l) ? Number(l) : 0;
  if (!isLevel(level) || challenge.seed !== levelSeed(level)) return null;
  return { level, seconds: challenge.target, name: challenge.name };
}

export const sharedHash = ({ level, seconds, name }: Shared) =>
  challengeHash({ seed: levelSeed(level), target: Math.min(MAX_SECONDS, Math.max(1, Math.round(seconds))), name, extra: { l: level } });

/** "২ মিনিট ১০ সেকেন্ড", "৪৫ সেকেন্ড", "৩ মিনিট" */
export function timeText(seconds: number) {
  const minutes = Math.floor(seconds / 60), rest = seconds % 60;
  if (!minutes) return `${bn(rest)} সেকেন্ড`;
  return rest ? `${bn(minutes)} মিনিট ${bn(rest)} সেকেন্ড` : `${bn(minutes)} মিনিট`;
}
/** The ticking clock: "১:০৫" */
export const clockText = (seconds: number) => `${bn(Math.floor(seconds / 60))}:${bn(seconds % 60).padStart(2, "০")}`;

export const paintingName = (level: number) => nameFor(level);
export const levelLabel = (level: number) => `লেভেল ${bn(level)} · ${WORLDS[worldOf(level)]}`;
/** "৩×৩, ৯ টুকরো" or "৫×৫, ২৫ টুকরো, ঘোরানো" */
export function gridText(level: number) {
  const { n, rotate } = planOf(level);
  return `${bn(n)}×${bn(n)}, ${bn(n * n)} টুকরো${rotate ? ", ঘোরানো" : ""}`;
}

/** One concrete picture per world, said when the last piece goes in. A few each, so a replay doesn't repeat the line. */
const CLEAR_LINES = [
  ["শেষ টুকরোটা বসল, কুয়াশার ভেতর থেকে নৌকা বেরিয়ে এল।", "ভোরের রোদ এখন পুরো খেতে।", "ঘরের চালে রোদ পড়েছে, ছবিটা পুরো।"],
  ["সূর্য ডোবার আগেই ছবি পুরো হলো।", "পাখিরা ঘরে ফিরছে, তোমার ছবিও জোড়া লাগল।", "নদীর পানিতে কমলা আলো, একটা ফাঁকও নেই।"],
  ["চাঁদের আলোয় নদী চিকচিক করছে। ছবি পুরো।", "জোনাকিরাও এসে গেছে, শেষ টুকরো বসল।", "ঘরের দরজায় কুপির আলো, ছবিটা পুরো।"],
] as const;
/** The finales' own lines, said the first time each is whole. */
const FINALE_LINES = [
  "খেয়ার মাঝি বাঁশের ঘাটে নৌকা বাঁধল। ভোরের ছবি শেষ।",
  "তিনটা লাল পাল বাড়ির দিকে। গোধূলির ছবি শেষ।",
  "পূর্ণিমার আকাশে এগারোটা ফানুস। নানার বাক্সের ৩০টা ছবিই জোড়া লাগল।",
] as const;
export function clearLine(level: number, firstClear = false) {
  if (isFinale(level) && firstClear) return FINALE_LINES[worldOf(level)];
  const line = CLEAR_LINES[worldOf(level)][level % 3];
  return level === LEVEL_COUNT ? `${line} ৩০টা ছবিই জোড়া লাগিয়েছ।` : line;
}

/** The near-miss line, with exact numbers. Empty at three stars. */
export function nearMiss(level: number, seconds: number) {
  const gap = shortBy(level, seconds);
  return gap ? `আর ${timeText(Math.max(1, gap.seconds))} আগে পারলে ${bn(gap.stars)} তারা।` : "";
}

/** "৪×৪" */
export const sizeText = (level: number) => `${bn(planOf(level).n)}×${bn(planOf(level).n)}`;

/** The card's line under the headline, first person, by star band. */
export function cardLine({ level, seconds }: Pick<Shared, "level" | "seconds">) {
  const time = timeText(seconds), stars = starsFor(level, seconds);
  if (stars === 3) return `${time}ে পুরো ছবি। আকাশের টুকরোগুলোও চিনে ফেলেছি।`;
  if (stars === 2) return `${time}ে পুরো ছবি। দু-একটা টুকরো একটু ভুগিয়েছে।`;
  return `${time} লাগল, তবে একটা ফাঁকও রাখিনি।`;
}

/** "রাফি ৩৬ টুকরোর ছবি ২ মিনিট ১০ সেকেন্ডে জোড়া লাগিয়েছে" */
export function feat({ level, seconds, name }: Shared) {
  return `${cleanName(name) || "এক বন্ধু"} ${bn(pieceCount(level))} টুকরোর ছবি ${timeText(seconds)}ে জোড়া লাগিয়েছে`;
}

export const previewTitle = (shared: Shared) => `${feat(shared)}। তুমি পারবে?`;

export function bannerNote({ level, name }: Shared) {
  const who = cleanName(name) || "বন্ধু";
  return `লেভেল ${bn(level)}, ${paintingName(level)}। সময়টা ${possessive(who)} নিজের ফোনের হিসাব। একই ছবি, একই টুকরো, এবার তোমার পালা।`;
}

/** After playing a friend's level: less time is better. Kind either way. */
export function compareLine(mine: number, theirs: number, name: string) {
  const who = cleanName(name) || "বন্ধু";
  if (mine < theirs) return `${possessive(who)} চেয়ে ${timeText(theirs - mine)} আগে!`;
  if (mine === theirs) return `একদম সমান! ${who}ও ${timeText(theirs)} নিয়েছিল।`;
  if (mine - theirs <= 10) return `আর একটু হলেই! মাত্র ${timeText(mine - theirs)} পিছিয়ে।`;
  return `${who} এখনো ${timeText(mine - theirs)} এগিয়ে। আরেকবার?`;
}

export function caption({ level, seconds }: Pick<Shared, "level" | "seconds">) {
  return `ছবির টুকরো, লেভেল ${bn(level)}: ${bn(pieceCount(level))} টুকরোর ‘${paintingName(level)}’ ${timeText(seconds)}ে জোড়া লাগালাম। তুমি কত সময়ে পারো?`;
}

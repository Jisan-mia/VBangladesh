// Challenge links and every line of result text. Server-safe: share.ts loads this.
import { possessive } from "../../../shared/bangla";
import { challengeHash, cleanName, readChallenge } from "../../../shared/game-core";
import { HINT_SECONDS, WORDS, type Level } from "./grid";
import { packById, type PackId } from "./packs";
import { secondsShort, stageAt, stageStars, STAGE_COUNT } from "./stages";

const digits = new Intl.NumberFormat("bn-BD", { useGrouping: false });
export const bn = (value: number) => digits.format(value);

/** 99:59 at most; nobody finds six words in under five seconds. */
export const MAX_TIME = 5999;
export const MIN_TIME = 5;

/** `stage` is the level number (1–24) for a grid played as a level; free grids have none. */
export type Shared = { seed: number; pack: PackId; level: Level; demo: boolean; hints: number; time: number; name: string; stage?: number };

/**
 * `#s=<seed>&t=<seconds, hints included>&p=<pack>&l=<0 সহজ, 1 কঠিন>&h=<hints>&d=1 (first grid, one word shown)&v=<level number>&n=<name>`.
 * `v` came with levels; links without it are free grids and still open.
 * The grid is rebuilt from the seed; the time is the friend's own clock and is shown as that.
 */
export function parseShared(hash: string): Shared | null {
  const challenge = readChallenge(hash, { maxTarget: MAX_TIME, extraKeys: ["p", "l", "h", "d", "v"] });
  if (!challenge) return null;
  const { p, l, h, d, v } = challenge.extra;
  const pack = packById(p ?? "");
  const level = l === "0" ? 0 : l === "1" ? 1 : null;
  const demo = d === undefined ? false : d === "1" ? true : null;
  if (!pack || level === null || demo === null || !/^[0-6]$/.test(h ?? "")) return null;
  const hints = Number(h);
  if (hints > WORDS - Number(demo) || challenge.target < MIN_TIME + hints * HINT_SECONDS) return null;
  const shared: Shared = { seed: challenge.seed, pack: pack.id, level, demo, hints, time: challenge.target, name: challenge.name };
  if (v === undefined) return shared;
  // A level must match its own pack and difficulty; only level 1 has the teaching grid.
  const stage = /^\d{1,2}$/.test(v) ? Number(v) : 0, at = stageAt(stage);
  if (!at || stage > STAGE_COUNT || at.pack !== pack.id || at.level !== level || (demo && stage !== 1)) return null;
  return { ...shared, stage };
}

export function sharedHash({ seed, pack, level, demo, hints, time, name, stage }: Shared) {
  const extra: Record<string, string | number> = { p: pack, l: level, h: hints };
  if (demo) extra.d = 1;
  if (stage) extra.v = stage;
  return challengeHash({ seed, target: time, name, extra });
}

const packName = (id: PackId) => packById(id)?.name ?? "";
export const levelName = (level: Level) => level ? "কঠিন" : "সহজ";

/** "২:০৫" */
export const clock = (seconds: number) => `${bn(Math.floor(seconds / 60))}:${bn(Math.floor(seconds % 60)).padStart(2, "০")}`;

/** "২ মিনিট ৫ সেকেন্ডে", "৪৫ সেকেন্ডে", "২ মিনিটে" */
export function spokenIn(seconds: number) {
  const minutes = Math.floor(seconds / 60), rest = Math.round(seconds % 60);
  if (!minutes) return `${bn(rest)} সেকেন্ডে`;
  return rest ? `${bn(minutes)} মিনিট ${bn(rest)} সেকেন্ডে` : `${bn(minutes)} মিনিটে`;
}
/** "২ মিনিট ৫ সেকেন্ড" */
export const spoken = (seconds: number) => spokenIn(seconds).replace(/(মিনিট|সেকেন্ড)ে$/, "$1");

export const hintText = (hints: number) => hints ? `${bn(hints)}টা হিন্ট, +${bn(hints * HINT_SECONDS)} সেকেন্ড` : "হিন্ট ছাড়া";

/** "৬টার ৬টা · সহজ · হিন্ট ছাড়া" */
export const detail = ({ level, hints }: Pick<Shared, "level" | "hints">) => `${bn(WORDS)}টার ${bn(WORDS)}টা · ${levelName(level)} · ${hintText(hints)}`;

/** 0 fastest … 3 slowest. কঠিন gets half as much time again. */
export function band({ time, level }: Pick<Shared, "time" | "level">) {
  const scale = level ? 1.5 : 1;
  return time <= 60 * scale ? 0 : time <= 120 * scale ? 1 : time <= 240 * scale ? 2 : 3;
}
const LINES = [
  "চোখ তো না, যেন চিলের চোখ!",
  "চটপট খোঁজা, একটাও ফসকায়নি!",
  "তাড়াহুড়ো নেই, ছয়টাই শেষমেশ ধরা পড়ল!",
  "সময় লাগুক, পুরো গ্রিড চষে ছয়টাই!",
];
/** The kind line on the card. Never says anyone was slow. */
export const humanLine = (shared: Pick<Shared, "time" | "level">) => LINES[band(shared)];

/** "রাফি ফুলের ছয়টা শব্দ ১ মিনিট ১৫ সেকেন্ডে খুঁজে পেয়েছে" */
export const feat = ({ name, pack, time }: Shared) => `${cleanName(name) || "এক বন্ধু"} ${possessive(packName(pack))} ছয়টা শব্দ ${spokenIn(time)} খুঁজে পেয়েছে`;

export const previewTitle = (shared: Shared) => `${feat(shared)}। তুমি পারবে?`;

export function bannerNote({ name }: Shared) {
  const who = cleanName(name);
  return `সময়টা ${who ? possessive(who) : "বন্ধুর"} নিজের ফোনে মাপা। একই গ্রিড, এবার তোমার পালা।`;
}

/** After a friend's grid: kind either way, and honest that their time came from their phone. */
export function compareLine(mine: number, friend: Shared) {
  const who = cleanName(friend.name) || "বন্ধু";
  const gap = friend.time - mine;
  if (gap > 0) return `${possessive(who)} চেয়ে ${spoken(gap)} আগে!`;
  if (gap === 0) return `একদম ${possessive(who)} সমান সময়!`;
  if (-gap <= 15) return `আর একটু হলেই! মাত্র ${spoken(-gap)} পিছিয়ে।`;
  return `এবার ${who} ${spoken(-gap)} এগিয়ে। নতুন গ্রিডে আরেকবার দেখো!`;
}

export function caption({ pack, time, hints }: Shared) {
  const helped = hints ? ` (${bn(hints)}টা হিন্ট নিয়ে)` : "";
  return `শব্দ খোঁজায় ${possessive(packName(pack))} ছয়টা শব্দ ${spokenIn(time)} খুঁজে পেলাম${helped}! তুমি কত সময়ে পারবে?`;
}

/** The card's top line; a level adds its number and stars. */
export const kicker = ({ name, pack, stage, time }: Shared) =>
  `${cleanName(name) ? `${possessive(cleanName(name))} ` : ""}শব্দ খোঁজা · ${stage ? `লেভেল ${bn(stage)} · ` : ""}${packName(pack)}${stage ? ` ${"★".repeat(stageStars(stage, time))}` : ""}`;

/** Under the stars: exactly how much faster earns the next one. */
export function nearLine(stage: number, time: number) {
  const short = secondsShort(stage, time);
  return short ? `আর ${spoken(short)} কম লাগলে ${bn(stageStars(stage, time) + 1)} তারা।` : "";
}

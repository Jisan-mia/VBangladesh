// Challenge links and every line of result text. Server-safe: share.ts loads this.
import { possessive } from "../../../shared/bangla";
import { challengeHash, cleanName, readChallenge, starsFor } from "../../../shared/game-core";
import { HINT_SECONDS, WORDS, type Level } from "./grid";
import { stageAt, finaleName } from "./levels";
import { PACKS, packById, type PackId } from "./packs";

const digits = new Intl.NumberFormat("bn-BD", { useGrouping: false });
export const bn = (value: number) => digits.format(value);

/** 99:59 at most; nobody finds six words in under five seconds. */
export const MAX_TIME = 5999;
export const MIN_TIME = 5;
/** The old ladder (before November 2026): the eight packs, সহজ then twice কঠিন. Links still carry its numbers as `v`. */
export const OLD_STAGES = 24;

/**
 * A finished page. `page` is the ladder level (1–32, the `g` key). `stage` is the old ladder's level (`v`), kept only so
 * those links still open; they are replayed as the classic grid they always were. Free grids have neither.
 */
export type Shared = { seed: number; pack: PackId; level: Level; demo: boolean; hints: number; time: number; name: string; stage?: number; page?: number };

/** How many words the page had. */
export const wordCount = (shared: Pick<Shared, "page">) => (shared.page && stageAt(shared.page)?.words) || WORDS;

/**
 * Old: `#s=<seed>&t=<seconds, hints included>&p=<pack>&l=<0 সহজ, 1 কঠিন>&h=<hints>&d=1 (first grid, one word shown)&v=<old level>&n=<name>`.
 * New ladder pages: `#s=&t=&p=<the world's pack>&h=&g=<level 1–32>&n=`, with no `l`, `d` or `v`.
 * The grid is rebuilt from the seed; the time is the friend's own clock and is shown as that.
 */
export function parseShared(hash: string): Shared | null {
  const challenge = readChallenge(hash, { maxTarget: MAX_TIME, extraKeys: ["p", "l", "h", "d", "v", "g"] });
  if (!challenge) return null;
  const { p, l, h, d, v, g } = challenge.extra;
  const pack = packById(p ?? "");
  if (!pack || !/^[0-8]$/.test(h ?? "")) return null;
  const hints = Number(h);
  if (g !== undefined) {
    const page = /^[1-9]\d?$/.test(g) ? Number(g) : 0, at = stageAt(page);
    if (!at || l !== undefined || d !== undefined || v !== undefined || at.pack !== pack.id) return null;
    if (hints > at.words || challenge.target < at.words + hints * HINT_SECONDS) return null;
    const level: Level = at.dirs.length > 3 ? 1 : 0;
    return { seed: challenge.seed, pack: pack.id, level, demo: false, hints, time: challenge.target, name: challenge.name, page };
  }
  const level = l === "0" ? 0 : l === "1" ? 1 : null;
  const demo = d === undefined ? false : d === "1" ? true : null;
  if (level === null || demo === null || hints > 6) return null;
  if (hints > WORDS - Number(demo) || challenge.target < MIN_TIME + hints * HINT_SECONDS) return null;
  const shared: Shared = { seed: challenge.seed, pack: pack.id, level, demo, hints, time: challenge.target, name: challenge.name };
  if (v === undefined) return shared;
  // An old level must match its own pack and difficulty; only its level 1 had the teaching grid.
  const stage = /^\d{1,2}$/.test(v) ? Number(v) : 0;
  if (stage < 1 || stage > OLD_STAGES || PACKS[(stage - 1) % PACKS.length].id !== pack.id || Number(stage > PACKS.length) !== level || (demo && stage !== 1)) return null;
  return { ...shared, stage };
}

export function sharedHash({ seed, pack, level, demo, hints, time, name, stage, page }: Shared) {
  if (page) return challengeHash({ seed, target: time, name, extra: { p: pack, h: hints, g: page } });
  const extra: Record<string, string | number> = { p: pack, l: level, h: hints };
  if (demo) extra.d = 1;
  if (stage) extra.v = stage;
  return challengeHash({ seed, target: time, name, extra });
}

const packName = (id: PackId) => packById(id)?.name ?? "";
export const levelName = (level: Level) => level ? "কঠিন" : "সহজ";
const COUNT_WORDS = ["", "একটা", "দুটো", "তিনটা", "চারটা", "পাঁচটা", "ছয়টা", "সাতটা", "আটটা"];
export const countWord = (n: number) => COUNT_WORDS[n] ?? `${bn(n)}টা`;

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

/** "৬টার ৬টা · সহজ · হিন্ট ছাড়া"; a ladder page leaves out সহজ/কঠিন. */
export function detail(shared: Pick<Shared, "level" | "hints" | "page">) {
  const n = wordCount(shared);
  return `${bn(n)}টার ${bn(n)}টা · ${shared.page ? "" : `${levelName(shared.level)} · `}${hintText(shared.hints)}`;
}

/** Stars a ladder page earns at `time` seconds (hints included); 0 for anything else. */
export function pageStars(page: number | undefined, time: number) {
  const at = page ? stageAt(page) : null;
  return at ? starsFor(time, at.three, at.two, true) : 0;
}

/** 0 fastest … 3 slowest. A ladder page uses its own star times; a classic কঠিন grid gets half as much time again. */
export function band({ time, level, page }: Pick<Shared, "time" | "level" | "page">) {
  const at = page ? stageAt(page) : null;
  if (at) return time <= at.three ? 0 : time <= at.two ? 1 : time <= at.two * 2 ? 2 : 3;
  const scale = level ? 1.5 : 1;
  return time <= 60 * scale ? 0 : time <= 120 * scale ? 1 : time <= 240 * scale ? 2 : 3;
}
const LINES = [
  () => "চোখ তো না, যেন চিলের চোখ!",
  () => "চটপট খোঁজা, একটাও ফসকায়নি!",
  (n: number) => `তাড়াহুড়ো নেই, ${n === 6 ? "ছয়টাই" : "সবকটা"} শেষমেশ ধরা পড়ল!`,
  (n: number) => `সময় লাগুক, পুরো গ্রিড চষে ${n === 6 ? "ছয়টাই" : "সবকটা"}!`,
];
/** The kind line on the card. Never says anyone was slow. */
export const humanLine = (shared: Pick<Shared, "time" | "level" | "page">) => LINES[band(shared)](wordCount(shared));

const who = (name: string) => cleanName(name) || "এক বন্ধু";
/** "রাফি ফুলের ছয়টা শব্দ ১ মিনিট ১৫ সেকেন্ডে খুঁজে পেয়েছে"; a ladder page: "রাফি লেভেল ৪-এ ফুলের পাঁচটা শব্দ …" */
export function feat(shared: Shared) {
  const where = shared.page ? `লেভেল ${bn(shared.page)}-এ ` : "";
  return `${who(shared.name)} ${where}${possessive(packName(shared.pack))} ${countWord(wordCount(shared))} শব্দ ${spokenIn(shared.time)} খুঁজে পেয়েছে`;
}

export const previewTitle = (shared: Shared) => `${feat(shared)}। তুমি পারবে?`;

export function bannerNote({ name }: Shared) {
  const friend = cleanName(name);
  return `সময়টা ${friend ? possessive(friend) : "বন্ধুর"} নিজের ফোনে মাপা। একই গ্রিড, এবার তোমার পালা।`;
}

/** After a friend's grid: kind either way, and honest that their time came from their phone. */
export function compareLine(mine: number, friend: Shared) {
  const them = cleanName(friend.name) || "বন্ধু";
  const gap = friend.time - mine;
  if (gap > 0) return `${possessive(them)} চেয়ে ${spoken(gap)} আগে!`;
  if (gap === 0) return `একদম ${possessive(them)} সমান সময়!`;
  if (-gap <= 15) return `আর একটু হলেই! মাত্র ${spoken(-gap)} পিছিয়ে।`;
  return `এবার ${them} ${spoken(-gap)} এগিয়ে। নতুন গ্রিডে আরেকবার দেখো!`;
}

export function caption(shared: Shared) {
  const { pack, time, hints, page } = shared;
  const helped = hints ? ` (${bn(hints)}টা হিন্ট নিয়ে)` : "";
  if (!page) return `শব্দ খোঁজায় ${possessive(packName(pack))} ছয়টা শব্দ ${spokenIn(time)} খুঁজে পেলাম${helped}! তুমি কত সময়ে পারবে?`;
  return `শব্দ খোঁজার লেভেল ${bn(page)}-এ ${possessive(packName(pack))} ${countWord(wordCount(shared))} শব্দ ${spokenIn(time)} খুঁজে পেলাম${helped}, ${bn(pageStars(page, time))} তারা। তুমি কত সময়ে পারবে?`;
}

/** The card's top line: whose, the game, a ladder page's number (or its finale's name) and stars, the pack. */
export function kicker(shared: Shared) {
  const name = cleanName(shared.name), page = shared.page;
  const where = page ? `${finaleName(page) || `লেভেল ${bn(page)}`} · ` : "";
  const stars = page ? ` ${"★".repeat(pageStars(page, shared.time))}` : "";
  return `${name ? `${possessive(name)} ` : ""}শব্দ খোঁজা · ${where}${packName(shared.pack)}${page ? "" : ` · ${levelName(shared.level)}`}${stars}`;
}

/** Under the stars: exactly how much faster earns the next one ("আর ১২ সেকেন্ড কম লাগলে ৩ তারা।"). */
export function pageNear(page: number, time: number) {
  const at = stageAt(page), stars = pageStars(page, time);
  if (!at || stars === 3) return "";
  return `আর ${spoken(time - (stars === 2 ? at.three : at.two))} কম লাগলে ${bn(stars + 1)} তারা।`;
}

/** A level's label: its number, or its finale's name. */
export const pageLabel = (page: number) => finaleName(page) || `লেভেল ${bn(page)}`;

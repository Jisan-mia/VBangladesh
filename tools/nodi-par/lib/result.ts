// Words, score bands and the challenge link. Server-safe: share.ts (and so the share API) imports this file,
// so it uses game-core and plain strings only.
import { possessive } from "../../../shared/bangla";
import { challengeHash, readChallenge } from "../../../shared/game-core";
import { FINALES, PLACES, isFinale, lessonOf, DEFAULT_MODE } from "./levels";
import { levelSeed, mangoCount, minTenths, LEVEL_COUNT, MAX_TENTHS, PAR } from "./river";

const digits = new Intl.NumberFormat("bn-BD", { useGrouping: false });
export const bn = (value: number) => digits.format(value);
/** Tenths of a second as "৩৪.৬". */
export const secs = (tenths: number) => `${bn(Math.floor(tenths / 10))}.${bn(tenths % 10)}`;

/** What a challenge link carries: the river, its time in tenths, the mangoes, the splashes, an optional first name. */
export type Shared = { level: number; seed: number; tenths: number; mangoes: number; splashes: number; name: string; /** 0 সহজ, 1 স্বাভাবিক (the default; not in the link), 2 কঠিন. */ mode: number };
export const MAX_SPLASHES = 999;

export { PLACES, WORLDS } from "./levels";

/** "নদী ৭ · ওপারে বটতলা" */
export const riverLabel = (level: number) => `নদী ${bn(level)} · ওপারে ${PLACES[level - 1]}`;

/** The one new thing a river brings, said on its start screen. */
export const newsOf = lessonOf;

/** The end screen's heading: a finale names itself; else by stars. */
export function heading(level: number, stars: number) {
  if (isFinale(level)) return `${FINALES[level]} পার!`;
  return stars >= 3 ? `ঢং! নদী ${bn(level)} একদম ঠিকঠাক পার` : `ঢং! নদী ${bn(level)} পার`;
}

/** What the next river is, said under a finale's stars: the world turns. */
export function worldLine(level: number) {
  if (level === 10) return "গ্রামের খাল শেষ। সামনে বড় নদী, মাঝে চর আর ফেরি।";
  if (level === 20) return "বড় নদী শেষ। সামনে বর্ষা, নানুবাড়ি আর দশটা নদী দূরে।";
  if (level === 30) return "নানুবাড়ির ঘাটে ঘণ্টা বাজল। নানু দাঁড়িয়ে আছেন।";
  return "";
}

const whole = (value: string | undefined, max: number) => value !== undefined && /^\d{1,3}$/.test(value) && Number(value) <= max ? Number(value) : -1;

export function parseShareHash(hash: string): Shared | null {
  const challenge = readChallenge(hash, { maxTarget: MAX_TENTHS, extraKeys: ["l", "a", "p", "d"] });
  if (!challenge) return null;
  const rawLevel = challenge.extra.l ?? "";
  if (!/^[1-9]\d?$/.test(rawLevel) || Number(rawLevel) > LEVEL_COUNT) return null;
  const level = Number(rawLevel);
  // Each river has one seed; a link with another seed isn't one of ours.
  if (challenge.seed !== levelSeed(level) || challenge.target < minTenths(level)) return null;
  const mangoes = whole(challenge.extra.a, mangoCount(level)), splashes = whole(challenge.extra.p, MAX_SPLASHES);
  if (mangoes < 0 || splashes < 0) return null;
  const d = challenge.extra.d, mode = d === undefined ? DEFAULT_MODE : /^[0-2]$/.test(d) ? Number(d) : -1;
  if (mode < 0) return null;
  return { level, seed: challenge.seed, tenths: challenge.target, mangoes, splashes, name: challenge.name, mode };
}

export const shareHash = (shared: Shared) =>
  challengeHash({ seed: shared.seed, target: shared.tenths, name: shared.name, extra: { l: shared.level, a: shared.mangoes, p: shared.splashes, ...(shared.mode !== DEFAULT_MODE && { d: shared.mode }) } });

/** The kind line on the card, by splashes (and every mango, when there was no splash at all). */
export function humanLine(shared: Pick<Shared, "splashes" | "mangoes" | "level">) {
  const n = shared.splashes, times = n === 1 ? "একবার" : `${bn(n)} বার`;
  if (n === 0) return shared.mangoes >= mangoCount(shared.level) ? "একবারও পানিতে পড়োনি, আমও সব তোলা। ব্যাগ শুকনো।" : "একবারও পানিতে পড়োনি। স্কুলব্যাগ একদম শুকনো।";
  if (n <= 2) return `${times} ছপাৎ। গামছায় মুছে আবার লাফ।`;
  if (n <= 5) return `${times} পানিতে। বইগুলো রোদে দিতে হবে।`;
  return `${times} ছপাৎ। নদী আজ গোসল করিয়েই ছাড়ল।`;
}

/** "আম ২/৩ · ২ বার পানিতে" */
export function detailLine(shared: Pick<Shared, "splashes" | "mangoes" | "level">) {
  return `আম ${bn(shared.mangoes)}/${bn(mangoCount(shared.level))} · ${shared.splashes ? `${bn(shared.splashes)} বার পানিতে` : "একবারও পড়েনি"}`;
}

/** The exact gap to the next star, or "" at three stars. */
export function nearLine(tenths: number, mangoes: number, level: number) {
  const late = tenths - PAR[level - 1] * 10, missing = mangoCount(level) - mangoes;
  if (late > 0 && missing > 0) return `আরেকটা তারা: ${secs(late)} সেকেন্ড আগে পৌঁছাও, বা আরও ${bn(missing)}টা আম তোলো।`;
  if (late > 0) return `আর ${secs(late)} সেকেন্ড আগে পৌঁছালেই আরেকটা তারা।`;
  if (missing > 0) return `আর ${bn(missing)}টা আম তুললেই আরেকটা তারা।`;
  return "";
}

export const ARRIVED_LINE = "ঢং! ঘাটের ঘণ্টা বাজল।";

export const banner = (shared: Shared) => `${shared.name || "তোমার বন্ধু"} নদী ${bn(shared.level)} পার হয়েছে ${secs(shared.tenths)} সেকেন্ডে। একই নদী, এবার তোমার পালা।`;

export const previewTitle = (shared: Shared) => shared.name
  ? `${shared.name} ${secs(shared.tenths)} সেকেন্ডে নদী পার হয়েছে। তুমি পারবে?`
  : `${secs(shared.tenths)} সেকেন্ডে নদী পার! তুমি পারবে?`;

export const caption = (shared: Shared) =>
  `নদী পার, নদী ${bn(shared.level)}: ${secs(shared.tenths)} সেকেন্ডে ওপারের ঘাটে, ${bn(mangoCount(shared.level))}টা আমের ${bn(shared.mangoes)}টা তুলেছি। তুমি কত সেকেন্ডে পারবে?`;

/** After a friend's link: lower time wins. Exact and kind, never a scold. */
export function compareLine(mine: number, theirs: number, name: string) {
  const who = name || "বন্ধু", whose = name ? possessive(name) : "বন্ধুর";
  if (mine < theirs) return `${whose} চেয়ে ${secs(theirs - mine)} সেকেন্ড আগে পৌঁছালে!`;
  if (mine === theirs) return `${who} আর তুমি একদম সমান।`;
  if (mine - theirs <= Math.max(20, theirs * 0.12)) return `আর একটু হলেই! ${whose} চেয়ে মাত্র ${secs(mine - theirs)} সেকেন্ড পিছে।`;
  return `${who} এবার ${secs(mine - theirs)} সেকেন্ড এগিয়ে। একই নদী, আরেকবার?`;
}

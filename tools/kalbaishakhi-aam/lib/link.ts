// Challenge links and the words around a result. Old links (`s t a l n`) open the old storms exactly; new ones add `w`.
// Every link is re-checked against the seed's real storm: no more mangoes than fell, no score those mangoes can't make.
import { challengeHash, cleanName, readChallenge } from "../../../shared/game-core";
import { possessive } from "../../../shared/bangla";
import { CLASSIC_STAGE, LEGACY_COUNT, legacyStage, makeLegacyStorm } from "./legacy";
import { LEVEL_COUNT, levelOf } from "./levels";
import { makeLevelStorm, pointRange, type StormRef } from "./gen";
import { GREEN, RIPE } from "./physics";

const numbers = new Intl.NumberFormat("bn-BD", { useGrouping: false });
export const bn = (value: number) => numbers.format(value);

/** What a link carries: the storm (seed and its number), the score, how many mangoes, an optional first name. */
export type Shared = { seed: number; score: number; count: number; name: string; stage?: number; level?: number };
export const MAX_SCORE = 3000;

export const refOf = (shared: Pick<Shared, "stage" | "level">): StormRef => shared.level ? { level: shared.level } : { stage: shared.stage ?? CLASSIC_STAGE };
export const stormName = (ref: StormRef) => "level" in ref ? levelOf(ref.level).name : legacyStage(ref.stage).name;
/** "ঝড় ৬ · শিল", or "পুরোনো ঝড় ৪ · কালবৈশাখী" for an old link's storm. */
export const stormLabel = (ref: StormRef) => "level" in ref ? `ঝড় ${bn(ref.level)} · ${stormName(ref)}` : `পুরোনো ঝড় ${bn(ref.stage)} · ${stormName(ref)}`;

/** Ripe mangoes in an old result (5 a green, 10 a ripe), or -1 when the numbers can't add up. */
export const ripeOf = (score: number, count: number) => {
  const ripe = (score - 5 * count) / 5;
  return Number.isInteger(ripe) && ripe >= 0 && ripe <= count ? ripe : -1;
};

export function parseShared(hash: string): Shared | null {
  const challenge = readChallenge(hash, { maxTarget: MAX_SCORE, extraKeys: ["a", "l", "w"] });
  if (!challenge || !/^\d{1,3}$/.test(challenge.extra.a ?? "")) return null;
  const count = Number(challenge.extra.a), { seed, target: score, name } = challenge;
  if (challenge.extra.w !== undefined) {
    if (!/^\d{1,2}$/.test(challenge.extra.w)) return null;
    const level = Number(challenge.extra.w);
    if (level < 1 || level > LEVEL_COUNT || score % 5) return null;
    const range = pointRange(makeLevelStorm(seed, level), count);
    if (!range || score < range.low || score > range.high) return null;
    return { seed, score, count, name, level };
  }
  const raw = challenge.extra.l ?? String(CLASSIC_STAGE);
  if (!/^\d$/.test(raw) || Number(raw) < 1 || Number(raw) > LEGACY_COUNT) return null;
  const stage = Number(raw), ripe = ripeOf(score, count);
  if (ripe < 0) return null;
  const { drops } = makeLegacyStorm(seed, stage);
  if (ripe > drops.filter(drop => drop.kind === RIPE).length || count - ripe > drops.filter(drop => drop.kind === GREEN).length) return null;
  return stage === CLASSIC_STAGE ? { seed, score, count, name } : { seed, score, count, name, stage };
}

export const sharedHash = (shared: Shared) => challengeHash({
  seed: shared.seed, target: shared.score, name: shared.name,
  extra: shared.level ? { a: shared.count, w: shared.level } : { a: shared.count, ...(shared.stage && shared.stage !== CLASSIC_STAGE ? { l: shared.stage } : {}) },
});

/** Old links keep their old words, so an old preview stays the same. */
const oldWhere = (stage?: number) => stage && stage !== CLASSIC_STAGE ? `ঝড় ${bn(stage)}-এ` : "";
export function previewTitle(shared: Shared) {
  if (shared.level) {
    const storm = `‘${levelOf(shared.level).name}’ ঝড়ে`;
    return shared.name
      ? `${shared.name} ${storm} ${bn(shared.count)}টা আম কুড়িয়েছে, ${bn(shared.score)} পয়েন্ট। তুমি পারবে?`
      : `কালবৈশাখী আমের ${storm} ${bn(shared.count)}টা আম, ${bn(shared.score)} পয়েন্ট। তুমি পারবে?`;
  }
  const where = oldWhere(shared.stage);
  if (shared.name) return `${shared.name} ${where || "ঝড়ের মধ্যে"} ${bn(shared.count)}টা আম কুড়িয়েছে, ${bn(shared.score)} পয়েন্ট। তুমি পারবে?`;
  return `${where ? `কালবৈশাখী আমের ${where}` : "কালবৈশাখীর ঝড়ে"} ${bn(shared.count)}টা আম, ${bn(shared.score)} পয়েন্ট। তুমি পারবে?`;
}

export function caption(shared: Shared) {
  if (shared.level) return `কালবৈশাখী আমের ‘${levelOf(shared.level).name}’ ঝড়ে ${bn(shared.count)}টা আম কুড়ালাম, ${bn(shared.score)} পয়েন্ট। একই ঝড়ে তুমি কয়টা পারো?`;
  const where = oldWhere(shared.stage);
  return `${where ? `কালবৈশাখী আমের ${where}` : "কালবৈশাখীর ঝড়ে"} ${bn(shared.count)}টা আম কুড়ালাম, ${bn(shared.score)} পয়েন্ট! একই ঝড়ে তুমি কয়টা পারো?`;
}

export const bands = [
  { min: 0, line: "ঝড়টা আজ একটু বেশিই জোরে ছিল। আরেকবার ডালা ধরো।" },
  { min: 80, line: "হাত গরম হচ্ছে। পরের ঝড়ে ডালা আরও ভরবে।" },
  { min: 180, line: "মাথা বাঁচিয়ে আম কুড়ানো চাট্টিখানি কথা না।" },
  { min: 300, line: "এত আম! নানির আচারের বয়াম এবার ভরে যাবে।" },
  { min: 450, line: "ঝড় থামার আগেই গাছ খালি। পাড়ার আম-কুড়ানি বলতে এখন তুমি।" },
] as const;
export const humanLine = (score: number) => [...bands].reverse().find(band => score >= band.min)!.line;

/** One dry line about this run, from what happened in it (a 10-second storm and a 50-second one score very differently). */
export function resultLine(r: { over: number; stars: number; caught: number; mangoes: number }) {
  if (r.over === 2) return "ডাল আর ডালা একসঙ্গে চলে না। জান বাঁচিয়ে আরেকবার।";
  if (!r.stars) return `${bn(r.mangoes)}টার মধ্যে ${bn(r.caught)}টা। ঝড় থামল, ডালা প্রায় খালি।`;
  if (r.caught === r.mangoes) return `${bn(r.mangoes)}টার ${bn(r.mangoes)}টাই। একটা আমও মাটি ছোঁয়নি।`;
  if (r.stars === 3) return `${bn(r.mangoes)}টার মধ্যে ${bn(r.caught)}টা। পাড়ার আম-কুড়ানি বলতে এখন তুমি।`;
  if (r.stars === 2) return `${bn(r.mangoes)}টার মধ্যে ${bn(r.caught)}টা। নানির আচারের বয়াম ভরছে।`;
  return `${bn(r.mangoes)}টার মধ্যে ${bn(r.caught)}টা। ঝড় পার, ডালায় আরও জায়গা ছিল।`;
}

/** After a friend's link: kind, exact, never a scold. */
export function compareLine(mine: number, theirs: number, name: string) {
  const who = name || "বন্ধু", whose = name ? possessive(name) : "বন্ধুর";
  if (mine > theirs) return `${whose} চেয়ে ${bn(mine - theirs)} পয়েন্ট বেশি।`;
  if (mine === theirs) return `${who} আর তুমি একদম সমান সমান।`;
  if (theirs - mine <= Math.max(15, theirs * 0.15)) return `আর একটু হলেই! ${whose} চেয়ে মাত্র ${bn(theirs - mine)} কম।`;
  return `${who} এবার ${bn(theirs - mine)} পয়েন্ট এগিয়ে। একই ঝড়ে আরেকবার?`;
}

/** What one more try would change, with the exact number; "" when there's nothing close to chase. */
export function nearMiss(r: { over: number; stars: number; caught: number; pass: number; two: number; three: number; left: number; score: number; best: number | null }) {
  if (r.over === 2) return `আর ${bn(Math.max(1, Math.ceil(r.left)))} সেকেন্ড টিকলেই ঝড় পার।`;
  if (!r.stars) return `আর ${bn(r.pass - r.caught)}টা আম হলেই ঝড় পার।`;
  if (r.stars < 3) {
    const need = (r.stars === 1 ? r.two : r.three) - r.caught;
    if (need <= 8) return `আর ${bn(need)}টা আম হলেই ${bn(r.stars + 1)} তারা।`;
  }
  if (r.best !== null && r.score < r.best && r.best - r.score <= Math.max(40, r.best * 0.15)) return `আর ${bn(r.best - r.score)} পয়েন্ট হলেই নতুন সেরা।`;
  return "";
}

export { cleanName };

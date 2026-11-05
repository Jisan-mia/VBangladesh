// The challenge link and the words around it. Server-safe: share.ts (and so /api/share and /api/tally) imports this, so it
// reaches only shared/game-core, shared/bangla and levels.ts, never React.
import { possessive } from "../../../shared/bangla";
import { challengeHash, readChallenge } from "../../../shared/game-core";
import {
  BALL_POINTS, BOSS_POINTS, isMode, LEVEL_COUNT, LEVELS, MODE_INFO, OLD_BALLS, OLD_COUNT, OLD_MAX, OLD_POTS, OLD_STALLS, oldBallsFrom,
  oldPotsFrom, oldStarsOf, potCount, starsOf, validOldScore, type Kind, type Mode,
} from "./levels";

export const SLUG = "handi-bhanga";

const digits = new Intl.NumberFormat("bn-BD", { useGrouping: false });
export const bn = (value: number) => digits.format(value);

/** What a link carries: the seed (the same stall), what was played, the score, pots broken, balls lost, and a name. */
export type Card = { seed: number; kind: Kind; level: number; mode: Mode; score: number; pots: number; lost: number; name: string };

/** The most a stall can score: every pot at the top of a run, the মটকা, and every ball still in hand. */
export function maxScore(level: number, mode: Mode) {
  const def = LEVELS[level - 1], pots = potCount(def) - (def.boss ? 1 : 0);
  return pots * 50 + (def.boss ? BOSS_POINTS : 0) + MODE_INFO[mode].balls * BALL_POINTS;
}
export const potsIn = (card: Pick<Card, "kind" | "level">) => card.kind === "old" ? OLD_POTS : potCount(LEVELS[card.level - 1]);
export const ballsIn = (card: Pick<Card, "kind" | "mode">) => card.kind === "old" ? OLD_BALLS : MODE_INFO[card.mode].balls;
export const clearedCard = (card: Pick<Card, "kind" | "level" | "pots">) => card.pots >= potsIn(card);

const COUNT = /^(0|[1-9]\d?)$/;

/**
 * Reads `s`, `t` (score), `l`, `n`, and for new links `v`, `d`, `p` (pots) and `b` (balls lost).
 * - no `v`: a link from before the rewrite. `l` is the old stall (none is stall 1) and `t` an old score (0–340, 400, 450, 500).
 * - `v=2`: `l` is a stall 1–12 and `d=e|h` the mode. A cleared stall has every pot and a ball to spare; one that ran out of
 *   balls has lost them all. The score can't pass the stall's most.
 */
export function parseCard(hash: string): Card | null {
  const challenge = readChallenge(hash, { maxTarget: 99_999, extraKeys: ["l", "v", "d", "p", "b"] });
  if (!challenge) return null;
  const { l, v, d, p, b } = challenge.extra, score = challenge.target;
  if (v === undefined) {
    if (d !== undefined || p !== undefined || b !== undefined || score > OLD_MAX || !validOldScore(score)) return null;
    const raw = l ?? "1", level = Number(raw);
    if (!/^[1-9]\d?$/.test(raw) || level > OLD_COUNT) return null;
    const pots = oldPotsFrom(score), lost = pots < OLD_POTS ? OLD_BALLS : OLD_BALLS - oldBallsFrom(score);
    return { seed: challenge.seed, kind: "old", level, mode: "n", score, pots, lost, name: challenge.name };
  }
  if (v !== "2" || l === undefined || !/^[1-9]\d?$/.test(l) || Number(l) > LEVEL_COUNT) return null;
  const mode = d ?? "n";
  if (!isMode(mode) || d === "n" || p === undefined || b === undefined || !COUNT.test(p) || !COUNT.test(b)) return null;
  const level = Number(l), pots = Number(p), lost = Number(b), total = potCount(LEVELS[level - 1]), balls = MODE_INFO[mode].balls;
  if (pots > total || lost > balls || (pots === total ? lost >= balls : lost !== balls) || score > maxScore(level, mode)) return null;
  if (pots === 0 && score !== 0) return null;
  return { seed: challenge.seed, kind: "level", level, mode, score, pots, lost, name: challenge.name };
}

/** Old links write exactly the old format (stall 1 leaves `l` out); new ones add `v=2`, `d` off সাধারণ, `p` and `b`. */
export function cardHash(card: Card) {
  const { seed, score, name, level, kind, mode, pots, lost } = card;
  const extra: Record<string, string | number> = kind === "old" ? (level > 1 ? { l: level } : {})
    : { l: level, v: 2, ...(mode === "n" ? {} : { d: mode }), p: pots, b: lost };
  return challengeHash({ seed, target: score, name, extra });
}

/** The stars a card shows: a stall's by balls lost, an old stall's by its old score marks. */
export function cardStars(card: Card) {
  if (card.kind === "old") return oldStarsOf(card.score, card.level);
  return starsOf(clearedCard(card), card.lost, card.mode);
}

/** "লেভেল ৪ · রহিম চাচার মটকা", or the old "পুরোনো দোকান ৩ · নদীর ঘাটের মেলা". */
export function playLabel(card: Pick<Card, "kind" | "level">) {
  if (card.kind === "old") return `পুরোনো দোকান ${bn(card.level)} · ${OLD_STALLS[card.level - 1].name}`;
  return `লেভেল ${bn(card.level)} · ${LEVELS[card.level - 1].name}`;
}
export const stallName = (card: Pick<Card, "kind" | "level">) => card.kind === "old" ? OLD_STALLS[card.level - 1].name : LEVELS[card.level - 1].name;

/** "৩৫টার ২৮টা", or after a clear "১২টার ১২টা, ২ বল বাকি". */
export function tallyLine(card: Pick<Card, "kind" | "level" | "mode" | "pots" | "lost">) {
  const total = potsIn(card), head = `${bn(total)}টার ${bn(card.pots)}টা`;
  if (card.pots < total) return head;
  const spare = ballsIn(card) - card.lost;
  return card.lost === 0 ? `${head}, একটা বলও যায়নি` : `${head}, ${bn(spare)} বল বাকি`;
}

const who = (name: string) => name || "বন্ধু";

/** What the friend did, in one line. */
export function feat(card: Card) {
  if (card.kind === "old") return `${bn(card.score)} করেছে`;
  const name = stallName(card);
  return clearedCard(card) ? `${name} সাফ করেছে, ${bn(card.score)} পয়েন্ট` : `${name}-এ ${tallyLine(card)} হাঁড়ি ভেঙেছে`;
}
export const friendLine = (card: Card) => `${card.name || "তোমার বন্ধু"} ${feat(card)}। একই দোকান, এবার তোমার পালা।`;
export const friendClaim = (card: Card) => `${possessive(who(card.name))} নিজের ফোনের স্কোর`;
/** Old links keep their old preview title, word for word. */
export const previewTitle = (card: Card) => card.kind === "old"
  ? (card.name ? `${card.name} ${bn(card.score)} করেছে। তুমি পারবে?` : `হাঁড়িভাঙায় ${bn(card.score)}! তুমি পারবে?`)
  : `${card.name || "এক বন্ধু"} ${feat(card)}। তুমি পারবে?`;

export function caption(card: Card) {
  if (card.kind === "old") {
    return card.pots < OLD_POTS
      ? `হাঁড়িভাঙায় ৩৫টার ${bn(card.pots)}টা হাঁড়ি ভাঙলাম, ${bn(card.score)} পয়েন্ট। একই হাঁড়ির সারি তোমার জন্য রাখলাম, দেখি কয়টা পারো!`
      : `হাঁড়িভাঙায় ৩৫টা হাঁড়িই ভেঙে দিলাম, ${bn(card.score)} পয়েন্ট! একই সারি তোমার জন্য রাখলাম, দেখি পারো কি না।`;
  }
  return clearedCard(card)
    ? `হাঁড়িভাঙায় ${playLabel(card)} সাফ, ${bn(card.score)} পয়েন্ট। একই দোকান তোমার জন্য রাখলাম, দেখি পারো কি না।`
    : `হাঁড়িভাঙায় ${playLabel(card)}: ${tallyLine(card)} হাঁড়ি, ${bn(card.score)} পয়েন্ট। একই দোকানে তুমি কয়টা পারো?`;
}

/** After playing a friend's stall: by score. */
export function versusLine(score: number, theirs: Card) {
  const name = who(theirs.name), gap = score - theirs.score;
  if (gap > 0) return `${possessive(name)} চেয়ে ${bn(gap)} পয়েন্ট বেশি।`;
  if (gap === 0) return `একদম সমান। দুজনেরই ${bn(score)}।`;
  if (-gap <= 50) return `আর একটু হলেই। মাত্র ${bn(-gap)} পয়েন্ট কম।`;
  return `${name} এখনো ${bn(-gap)} পয়েন্ট এগিয়ে। আরেকবার?`;
}

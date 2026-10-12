// Challenge links, banners and preview text. Server-safe: share.ts loads this, so it imports only pure code.
import { possessive } from '../../../shared/bangla';
import { challengeHash, readChallenge } from '../../../shared/game-core';
import { CUSTOMERS, DAYS, FAST_POINTS, MAX_SCORE, RIGHT_POINTS, bn } from './game';

/**
 * `s` the seed (which ten customers) · `t` the score to beat · `r` how many got the right change · `n` an optional first name.
 * Shop-day links add `d` the day and `c` how many were right on the first try (the stars); links without `d` are the classic queue.
 */
export type Shared = { seed: number; score: number; right: number; name: string; day?: number; clean?: number };

/** Every right customer earns 100 plus a bonus of 0–50 in steps of 5; anything else is a forged link. */
export function validResult(score: number, right: number) {
  return Number.isInteger(score) && Number.isInteger(right) && right >= 0 && right <= CUSTOMERS && score % 5 === 0
    && score >= right * RIGHT_POINTS && score <= right * (RIGHT_POINTS + FAST_POINTS);
}

export function parseShared(hash: string): Shared | null {
  const challenge = readChallenge(hash, { maxTarget: MAX_SCORE, extraKeys: ['r', 'd', 'c'] });
  const raw = challenge?.extra.r;
  if (!challenge || raw === undefined || !/^\d{1,2}$/.test(raw)) return null;
  const right = Number(raw);
  if (!validResult(challenge.target, right)) return null;
  const shared: Shared = { seed: challenge.seed, score: challenge.target, right, name: challenge.name };
  const { d, c } = challenge.extra;
  if (d === undefined && c === undefined) return shared;
  if (!/^\d{1,2}$/.test(d ?? '') || !/^\d{1,2}$/.test(c ?? '')) return null;
  const day = Number(d), clean = Number(c);
  // A first-try answer is a right answer, and only first tries can carry a fast bonus.
  if (day < 1 || day > DAYS || clean > right || challenge.target > right * RIGHT_POINTS + clean * FAST_POINTS) return null;
  return { ...shared, day, clean };
}

export const sharedHash = ({ seed, score, right, name, day, clean }: Shared) =>
  challengeHash({ seed, target: score, name, extra: day ? { r: right, d: day, c: clean ?? 0 } : { r: right } });

/** "১০ জনের ৯ জনকে" */
export const outOf = (right: number) => `${bn(CUSTOMERS)} জনের ${bn(right)} জনকে`;

/** "দিন ৭ · " for a shop-day link, nothing for the classic queue. */
export const dayTag = (day?: number) => day ? `দিন ${bn(day)} · ` : '';

export const banner = ({ score, name, day }: Shared) => `${dayTag(day)}${name || 'বন্ধু'} ${bn(score)} করেছে। একই দশজন খদ্দের, এবার তোমার পালা।`;

export const previewTitle = ({ score, right, name, day }: Shared) =>
  `${dayTag(day)}${name || 'এক বন্ধু'} ${bn(score)} করেছে, ${outOf(right)} ঠিক ভাংতি। তুমি পারবে?`;

export function caption({ score, right, day }: Pick<Shared, 'score' | 'right' | 'day'>) {
  return `ভাংতি নাই! ${day ? `দোকানের ${bn(day)} নম্বর দিনে` : 'আজ দোকানে'} ${outOf(right)} ঠিক ভাংতি দিলাম, ${bn(score)} পয়েন্ট। একই দশজন খদ্দের তোমার জন্য রাখলাম, দেখি কয়জনকে পারো!`;
}

/** A kind comparison after playing the same ten customers a friend sent. */
export function compareLine(mine: number, theirs: number, name: string) {
  const who = possessive(name || 'বন্ধু');
  if (mine > theirs) return `${who} চেয়ে ${bn(mine - theirs)} বেশি!`;
  if (mine === theirs) return `${who} সমান সমান! কেউ কারও চেয়ে কম না।`;
  if (theirs - mine <= 100) return `আর একটু হলেই! ${who} চেয়ে মাত্র ${bn(theirs - mine)} কম।`;
  return `${name || 'বন্ধু'} এবার এগিয়ে, ${bn(theirs)}। আরেকবার হোক?`;
}

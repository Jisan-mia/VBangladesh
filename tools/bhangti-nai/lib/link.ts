// Challenge links, banners and preview text. Server-safe: share.ts loads this, so it imports only pure code.
import { possessive } from '../../../shared/bangla';
import { challengeHash, readChallenge } from '../../../shared/game-core';
import { CUSTOMERS, FAST_POINTS, MAX_SCORE, RIGHT_POINTS, bn } from './game';

/** `s` the seed (which ten customers) · `t` the score to beat · `r` how many got the right change · `n` an optional first name. */
export type Shared = { seed: number; score: number; right: number; name: string };

/** Every right customer earns 100 plus a bonus of 0–50 in steps of 5; anything else is a forged link. */
export function validResult(score: number, right: number) {
  return Number.isInteger(score) && Number.isInteger(right) && right >= 0 && right <= CUSTOMERS && score % 5 === 0
    && score >= right * RIGHT_POINTS && score <= right * (RIGHT_POINTS + FAST_POINTS);
}

export function parseShared(hash: string): Shared | null {
  const challenge = readChallenge(hash, { maxTarget: MAX_SCORE, extraKeys: ['r'] });
  const raw = challenge?.extra.r;
  if (!challenge || raw === undefined || !/^\d{1,2}$/.test(raw)) return null;
  const right = Number(raw);
  if (!validResult(challenge.target, right)) return null;
  return { seed: challenge.seed, score: challenge.target, right, name: challenge.name };
}

export const sharedHash = ({ seed, score, right, name }: Shared) => challengeHash({ seed, target: score, name, extra: { r: right } });

/** "১০ জনের ৯ জনকে" */
export const outOf = (right: number) => `${bn(CUSTOMERS)} জনের ${bn(right)} জনকে`;

export const banner = ({ score, name }: Shared) => `${name || 'বন্ধু'} ${bn(score)} করেছে। একই দশজন খদ্দের, এবার তোমার পালা।`;

export const previewTitle = ({ score, right, name }: Shared) =>
  `${name || 'এক বন্ধু'} ${bn(score)} করেছে, ${outOf(right)} ঠিক ভাংতি। তুমি পারবে?`;

export function caption({ score, right }: Pick<Shared, 'score' | 'right'>) {
  return `ভাংতি নাই!: আজ দোকানে ${outOf(right)} ঠিক ভাংতি দিলাম, ${bn(score)} পয়েন্ট। একই দশজন খদ্দের তোমার জন্য রাখলাম, দেখি কয়জনকে পারো!`;
}

/** A kind comparison after playing the same ten customers a friend sent. */
export function compareLine(mine: number, theirs: number, name: string) {
  const who = possessive(name || 'বন্ধু');
  if (mine > theirs) return `${who} চেয়ে ${bn(mine - theirs)} বেশি!`;
  if (mine === theirs) return `${who} সমান সমান! কেউ কারও চেয়ে কম না।`;
  if (theirs - mine <= 100) return `আর একটু হলেই! ${who} চেয়ে মাত্র ${bn(theirs - mine)} কম।`;
  return `${name || 'বন্ধু'} এবার এগিয়ে, ${bn(theirs)}। আরেকবার হোক?`;
}

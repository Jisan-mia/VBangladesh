// Challenge links, banners and preview text. Server-safe: share.ts loads this, so it imports only pure code.
import { possessive } from '../../../shared/bangla';
import { challengeHash, readChallenge } from '../../../shared/game-core';
import { CUSTOMERS, DAYS } from './legacy';
import { bn } from './money';
import { dealExists, FAST_POINTS, MAX_SCORE, RIGHT_POINTS, type Version } from './play';

/**
 * `s` the seed (which ten customers) · `t` the score to beat · `r` how many got the right change · `n` an optional first name.
 * Day links add `d` the day and `c` how many were right on the first try (the stars). A link without `v` is from before the
 * rewrite: `d` is an old shop day (none: the classic queue, level 0) and it replays the old queue. `v=2` links name a level
 * of the new ladder in `d`; `m=1` (new links only) says it was played without the clock (সময় নিয়ে): no speed bonus, at most two stars.
 */
export type Shared = { seed: number; score: number; right: number; name: string; v: Version; level: number; clean?: number; calm?: boolean };

/** Every right customer earns 100 plus a bonus of 0–50 in steps of 5; anything else is a forged link. */
export function validResult(score: number, right: number) {
  return Number.isInteger(score) && Number.isInteger(right) && right >= 0 && right <= CUSTOMERS && score % 5 === 0
    && score >= right * RIGHT_POINTS && score <= right * (RIGHT_POINTS + FAST_POINTS);
}

export function parseShared(hash: string): Shared | null {
  const challenge = readChallenge(hash, { maxTarget: MAX_SCORE, extraKeys: ['r', 'd', 'c', 'v', 'm'] });
  const raw = challenge?.extra.r;
  if (!challenge || raw === undefined || !/^\d{1,2}$/.test(raw)) return null;
  const right = Number(raw);
  if (!validResult(challenge.target, right)) return null;
  const { d, c, v, m } = challenge.extra;
  if ((v !== undefined && v !== '2') || (m !== undefined && (m !== '1' || v !== '2'))) return null;
  const version: Version = v === '2' ? 2 : 1;
  const base = { seed: challenge.seed, score: challenge.target, right, name: challenge.name };
  if (d === undefined && c === undefined && version === 1) return { ...base, v: 1, level: 0 };
  if (!/^\d{1,2}$/.test(d ?? '') || !/^\d{1,2}$/.test(c ?? '')) return null;
  const level = Number(d), clean = Number(c);
  // A first-try answer is a right answer, and only first tries can carry a fast bonus.
  if (level < 1 || !dealExists(level, version) || (version === 1 && level > DAYS) || clean > right || challenge.target > right * RIGHT_POINTS + clean * FAST_POINTS) return null;
  // Without the clock there is no speed bonus: the score is exactly 100 a customer.
  if (m === '1' && challenge.target !== right * RIGHT_POINTS) return null;
  return m === '1' ? { ...base, v: version, level, clean, calm: true } : { ...base, v: version, level, clean };
}

export const sharedHash = ({ seed, score, right, name, v, level, clean, calm }: Shared) =>
  challengeHash({ seed, target: score, name, extra: v === 2 ? { r: right, d: level, c: clean ?? 0, v: 2, ...(calm ? { m: 1 } : {}) } : level ? { r: right, d: level, c: clean ?? 0 } : { r: right } });

/** "১০ জনের ৯ জনকে" */
export const outOf = (right: number) => `${bn(CUSTOMERS)} জনের ${bn(right)} জনকে`;

/** "দিন ৭ · " for a day link, nothing for the classic queue. */
export const dayTag = (level?: number) => level ? `দিন ${bn(level)} · ` : '';

export const banner = ({ score, name, level }: Shared) => `${dayTag(level)}${name || 'বন্ধু'} ${bn(score)} করেছে। একই দশজন খদ্দের, এবার তোমার পালা।`;

export const previewTitle = ({ score, right, name, level }: Shared) =>
  `${dayTag(level)}${name || 'এক বন্ধু'} ${bn(score)} করেছে, ${outOf(right)} ঠিক ভাংতি। তুমি পারবে?`;

export function caption({ score, right, level }: Pick<Shared, 'score' | 'right' | 'level'>) {
  return `ভাংতি নাই! ${level ? `দোকানের ${bn(level)} নম্বর দিনে` : 'আজ দোকানে'} ${outOf(right)} ঠিক ভাংতি দিলাম, ${bn(score)} পয়েন্ট। একই দশজন খদ্দের তোমার জন্য রাখলাম, দেখি কয়জনকে পারো!`;
}

/** The game is real time, so a friend's score is their phone's word, said plainly. */
export const friendClaim = (shared: Pick<Shared, 'name' | 'right' | 'calm'>) => `${possessive(shared.name || 'বন্ধু')} নিজের ফোনের স্কোর${shared.calm ? ', ঘড়ি ছাড়া' : ''} · ${outOf(shared.right)} ঠিক ভাংতি`;

/** A kind comparison after playing the same ten customers a friend sent. */
export function compareLine(mine: number, theirs: number, name: string) {
  const who = possessive(name || 'বন্ধু');
  if (mine > theirs) return `${who} চেয়ে ${bn(mine - theirs)} বেশি!`;
  if (mine === theirs) return `${who} সমান সমান! কেউ কারও চেয়ে কম না।`;
  if (theirs - mine <= 100) return `আর একটু হলেই! ${who} চেয়ে মাত্র ${bn(theirs - mine)} কম।`;
  return `${name || 'বন্ধু'} এবার এগিয়ে, ${bn(theirs)}। আরেকবার হোক?`;
}

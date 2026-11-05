'use client';
// The pictures: a country's food, place or animal, its flag (or its animal when its flag is too hard to draw exactly), the
// "like" picture, and the small icons the buttons use. All drawn in code (lib/art.ts, lib/likes.ts); nothing is fetched.
import { FLAGS, INK, PICS } from '../lib/art';
import { likeMarkup } from '../lib/likes';

export function Pic({ k, className = 'pg-pic' }: { k: string; className?: string }) {
  return <svg className={className} viewBox="0 0 64 64" aria-hidden="true">
    <g stroke={INK} strokeWidth="1.8" strokeLinejoin="round" strokeLinecap="round" dangerouslySetInnerHTML={{ __html: PICS[k] ?? likeMarkup(k) }} />
  </svg>;
}

export function Flag({ id, className = 'pg-flag' }: { id: string; className?: string }) {
  const flag = FLAGS[id];
  if (!flag) return null;
  return <svg className={className} viewBox={`0 0 ${flag.w} ${flag.h}`} preserveAspectRatio="none" style={{ aspectRatio: `${flag.w} / ${flag.h}` }} aria-hidden="true" dangerouslySetInnerHTML={{ __html: flag.svg }} />;
}

/** The country's badge: its flag if we draw one, otherwise its animal. */
export const Badge = ({ id, flagClass = 'pg-badge-flag', picClass = 'pg-badge-pic' }: { id: string; flagClass?: string; picClass?: string }) =>
  FLAGS[id] ? <Flag id={id} className={flagClass} /> : <Pic k={`${id}:animal`} className={picClass} />;

/** A level's picture in the list and on the title chip. */
export function LevelIcon({ icon, className = 'pg-icon' }: { icon: string; className?: string }) {
  if (icon === 'passport') return <Passport className={className} />;
  if (icon.includes(':')) return <Pic k={icon} className={className} />;
  return <span className={`${className} pg-icon-flag`}><Badge id={icon} /></span>;
}

export function Passport({ className = 'pg-icon' }: { className?: string }) {
  return <svg className={className} viewBox="0 0 64 64" aria-hidden="true">
    <g stroke={INK} strokeWidth="1.8" strokeLinejoin="round" strokeLinecap="round">
      <rect x="12" y="6" width="40" height="52" rx="3" fill="#1d4f91" />
      <circle cx="32" cy="27" r="11" fill="none" stroke="#e8c15a" strokeWidth="2.2" />
      <path d="M21 27h22M32 16c-5 6-5 16 0 22M32 16c5 6 5 16 0 22" fill="none" stroke="#e8c15a" strokeWidth="1.6" />
      <path d="M22 46h20M25 51h14" fill="none" stroke="#e8c15a" strokeWidth="2.4" />
    </g>
  </svg>;
}

/** A plane in one colour, nose to the right, for buttons and the title. */
export function PlaneIcon({ className = 'pg-plane-icon' }: { className?: string }) {
  return <svg className={className} viewBox="-1 -1 2 2" aria-hidden="true"><path d="M1 0 .55 -.1 .1 -.9 -.12 -.9 .1 -.1 -.55 -.12 -.75 -.42 -.9 -.42 -.8 0 -.9 .42 -.75 .42 -.55 .12 .1 .1 -.12 .9 .1 .9 .55 .1z" /></svg>;
}

/** The ghost finger that shows the first tap, so a child who can't read yet knows where to press. */
export function Finger() {
  return <svg className="pg-finger" viewBox="0 0 48 64" aria-hidden="true">
    <circle className="pg-ripple" cx="20" cy="10" r="10" />
    <path d="M14 10a6 6 0 0 1 12 0v20l4-2a6 6 0 0 1 6 2l6 6a8 8 0 0 1 2 6v8c0 6-5 12-12 12H22c-5 0-9-3-11-7L4 40a5 5 0 0 1 8-6l2 3z" fill="#fff" stroke="#23303a" strokeWidth="2.5" strokeLinejoin="round" />
  </svg>;
}

export const NextArrow = ({ last }: { last?: boolean }) => <svg viewBox="0 0 48 48" aria-hidden="true">{last
  ? <path d="M24 6l5.4 11 12.1 1.7-8.8 8.5 2.1 12L24 33.4 13.2 39.2l2.1-12-8.8-8.5L18.6 17z" />
  : <path d="M8 24h32M28 11l13 13-13 13" />}</svg>;

export const BackIcon = () => <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M15 5l-7 7 7 7" /></svg>;

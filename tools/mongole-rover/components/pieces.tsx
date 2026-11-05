// The small drawn parts: a picture from lib/art.ts, the ghost finger, a stars row, and the icons of the end buttons. No voice, no emoji.
import { ARROW, REPEAT } from "../lib/art";

export function Art({ svg, className, turn }: { svg: string; className?: string; turn?: number }) {
  return <svg className={className} viewBox="0 0 64 64" aria-hidden="true" style={turn ? { transform: `rotate(${turn}deg)` } : undefined} dangerouslySetInnerHTML={{ __html: svg }} />;
}

/** A scene (the story and the title): 320×200. */
export function Scene({ svg, className }: { svg: string; className?: string }) {
  return <svg className={className} viewBox="0 0 320 200" preserveAspectRatio="xMidYMid slice" aria-hidden="true" dangerouslySetInnerHTML={{ __html: svg }} />;
}

/** A ghost finger that shows a tap, for a child who cannot read yet. */
export function Finger() {
  return <span className="mr-ghost-at" aria-hidden="true"><svg className="mr-ghost" viewBox="0 0 40 52"><path d="M15 4a4 4 0 0 1 8 0v20l10 2a5 5 0 0 1 4 6l-3 14a6 6 0 0 1-6 5H17a6 6 0 0 1-5-3L4 34a4 4 0 0 1 6-5l5 5z" fill="#fff" stroke="#2d1f1a" strokeWidth="2.6" strokeLinejoin="round" /></svg></span>;
}

const STAR = "M12 2l2.9 6.3 6.9.8-5.1 4.7 1.4 6.8L12 17.2 5.9 20.6l1.4-6.8L2.2 9.1l6.9-.8z";

/** Stars that pop in one after another (CSS delay); all at once in ধীরে খেলো. */
export function StarsRow({ count, of = 3, label }: { count: number; of?: number; label: string }) {
  return <span className="mr-stars" role="img" aria-label={label}>
    {Array.from({ length: of }, (_, index) => <svg key={index} viewBox="0 0 24 24" data-on={index < count || undefined} style={{ animationDelay: `${260 + index * 300}ms` }}><path d={STAR} /></svg>)}
  </span>;
}

/** Small stars for a level card. */
export function MiniStars({ count, of = 3 }: { count: number; of?: number }) {
  return <span className="mr-mini" aria-hidden="true">{Array.from({ length: of }, (_, index) => <svg key={index} viewBox="0 0 24 24" data-on={index < count || undefined}><path d={STAR} /></svg>)}</span>;
}

export const ICONS = {
  again: <svg viewBox="0 0 48 48" aria-hidden="true"><path d="M38 24a14 14 0 1 1-4.1-9.9" /><path d="M35 6v9h-9" /></svg>,
  home: <svg viewBox="0 0 48 48" aria-hidden="true"><path d="M6 20l18-12 18 12" /><path d="M10 18v20h28V18" /><path d="M20 38V26h8v12" /></svg>,
  next: <svg viewBox="0 0 48 48" aria-hidden="true"><path d="M8 24h28M26 12l12 12-12 12" /></svg>,
  stop: <svg viewBox="0 0 48 48" aria-hidden="true"><rect x="12" y="12" width="24" height="24" rx="3" /></svg>,
  play: <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 4.5v15l12.5-7.5z" /></svg>,
  back: <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M15 5l-7 7 7 7" /></svg>,
  menu: <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 7h14M5 12h14M5 17h14" /></svg>,
  del: <svg viewBox="0 0 48 48" aria-hidden="true"><path d="M16 12h24a3 3 0 0 1 3 3v18a3 3 0 0 1-3 3H16L5 24z" /><path d="M22 19l10 10M32 19L22 29" /></svg>,
  blocks: <svg viewBox="0 0 32 32" aria-hidden="true"><rect x="3" y="4" width="11" height="11" rx="2" /><rect x="17" y="4" width="11" height="11" rx="2" /><rect x="3" y="18" width="11" height="11" rx="2" /><path d="M20 23h8M25 19l4 4-4 4" /></svg>,
};

export { ARROW, REPEAT };

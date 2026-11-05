'use client';
// Under the counter on the start screen: which day (‹ ›), what is new in it (before → after), the facts, the two modes with
// their consequence, and সব দিন. The start action itself is the brass bell above (shop-game.tsx), the biggest thing on the screen.
import type { RefObject } from 'react';
import { cardSizes } from '../../../shared/card-canvas';
import { changes, finaleName, isFinale, LEVEL_COUNT, WORLDS, worldOf, type Level } from '../lib/levels';
import { banner, friendClaim, type Shared } from '../lib/link';
import { bn } from '../lib/money';

export function StartInfo({ level, v, spec, stars, timed, canBack, canNext, friend, friendCanvas, onLevel, onTimed, onSheet }: {
  level: number; v: 1 | 2; spec: Level | null; stars: number; timed: boolean; canBack: boolean; canNext: boolean;
  friend: Shared | null; friendCanvas: RefObject<HTMLCanvasElement | null>;
  onLevel: (level: number) => void; onTimed: (timed: boolean) => void; onSheet: () => void;
}) {
  const finale = v === 2 ? finaleName(level) : '';
  const chips = v === 2 ? changes(level) : [];
  const tap = (run: () => void) => (event: { currentTarget: HTMLButtonElement }) => { event.currentTarget.blur(); run(); };
  return (
    <div className="bt-start">
      {friend && (
        <div className="bt-friend">
          <canvas ref={friendCanvas} width={cardSizes.feed.width} height={cardSizes.feed.height} role="img" aria-label={`${banner(friend)} বন্ধুর কার্ড।`} />
          <p><b>{banner(friend)}</b> {friendClaim(friend)}</p>
        </div>
      )}
      <div className="bt-pick">
        <button type="button" className="bt-step" onClick={tap(() => onLevel(level - 1))} disabled={!canBack} aria-label="আগের দিন">
          <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M15 5l-7 7 7 7" /></svg>
        </button>
        <div className="bt-pick-name">
          {finale && <span className="bt-finale-badge">শেষ দিন</span>}
          <h2>{v === 2 ? `দিন ${bn(level)}${finale ? `: ${finale}` : ''}` : level ? `বন্ধুর পুরোনো দিন ${bn(level)}` : 'বন্ধুর দোকান'}</h2>
          <p>{v === 2 ? WORLDS[worldOf(level)].name : 'পুরোনো লিংকের দশজন খদ্দের'} · দশজন খদ্দের{spec ? ` · প্রতিজনের ${bn(spec.secs)} সেকেন্ড` : ''}{stars ? ` · ${'★'.repeat(stars)}` : ''}</p>
        </div>
        <button type="button" className="bt-step" onClick={tap(() => onLevel(level + 1))} disabled={!canNext || level >= LEVEL_COUNT} aria-label="পরের দিন">
          <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9 5l7 7-7 7" /></svg>
        </button>
      </div>
      {spec && (
        <p className="bt-lesson">
          <b>{isFinale(level) ? 'শেষ দিন' : level === 1 ? 'শুরু' : 'নতুন'}</b> {spec.lesson}
          {chips.length > 0 && <span className="bt-chips">{chips.slice(0, 2).map(chip => <i key={chip}>{chip}</i>)}</span>}
        </p>
      )}
      {v === 2 && level === 1 && <p className="bt-example">উদাহরণ: <b>৫০ − ৩৫ = ১৫</b> (১০ + ৫)</p>}
      <div className="bt-modes" role="group" aria-label="কীভাবে খেলবে">
        <button type="button" aria-pressed={timed} onClick={tap(() => onTimed(true))}>ঝটপট</button>
        <button type="button" aria-pressed={!timed} onClick={tap(() => onTimed(false))}>সময় নিয়ে</button>
      </div>
      <p className="bt-mode-line">{timed ? 'ঘড়ি চলে, ঝটপট বোনাস আছে, ৩ তারা পর্যন্ত।' : 'ঘড়ি নেই, ঝটপট বোনাসও নেই, ২ তারা পর্যন্ত।'}</p>
      <button type="button" className="kit-link bt-all" onClick={tap(onSheet)}>সব দিন</button>
    </div>
  );
}

'use client';
// The end of a trip: the stamps of the countries, the stars, the counts ticking up, a task off the screen, then আবার খেলো
// and শেষ as two equal picture buttons, and আব্বু-আম্মুকে দেখাও.
import { useEffect, useRef, type CSSProperties } from 'react';
import { Stars } from '../../../shared/game-ui';
import { bn, ShowParentButton } from '../../../shared/kids-kit';
import { countryOf } from '../lib/countries';
import { awayLine, cardTitle } from '../lib/text';
import type { Result } from '../lib/trip';
import { COUNT_FRAMES, COUNT_MS, paintCount, type CountUp } from './count.hot';
import { Pic } from './pictures';

const countFrames = (to: number) => Array.from({ length: COUNT_FRAMES }, (_, frame) => bn(Math.round((to * frame) / (COUNT_FRAMES - 1))));

export function EndScreen({ result, slow, onAgain, onDone, onShow }: { result: Result; slow: boolean; onAgain: () => void; onDone: () => void; onShow: () => void }) {
  const places = useRef<HTMLElement>(null), first = useRef<HTMLElement>(null);
  useEffect(() => {
    const count: CountUp = { nodes: [places.current, first.current], frames: [countFrames(result.ids.length), countFrames(result.firstTry)], last: new Int16Array(2).fill(-1) };
    if (slow) { paintCount(count, 1); return; }
    paintCount(count, 0);
    let raf = 0;
    const started = performance.now() + 450;
    const frame = (now: number) => { paintCount(count, (now - started) / COUNT_MS); if (now - started < COUNT_MS) raf = requestAnimationFrame(frame); };
    raf = requestAnimationFrame(frame);
    return () => cancelAnimationFrame(raf);
  }, [result, slow]);
  const done = (action: () => void) => (event: { currentTarget: HTMLButtonElement }) => { event.currentTarget.blur(); action(); };
  const last = countryOf(result.ids.at(-1)!);
  return <div className="pg-end" data-slow={slow || undefined}>
    <ol className="pg-end-stamps" aria-label="আজকের সিল">
      {result.ids.map((id, index) => { const c = countryOf(id)!; return <li key={id} style={{ '--ink': c.ink, '--i': index } as CSSProperties}><Pic k={`${id}:animal`} /><span>{c.name}</span></li>; })}
    </ol>
    <div className="pg-end-stars"><Stars count={result.stars} /></div>
    <p className="pg-end-count"><span><b ref={places}>{bn(result.ids.length)}</b>টা দেশ</span><span aria-hidden="true">·</span><span><b ref={first}>{bn(result.firstTry)}</b>টা প্রথমবারেই</span></p>
    <p className="pg-end-news">{cardTitle(result.ids.length, bn)}।</p>
    {result.clean && <p className="pg-end-method">সবগুলো প্রথমবারে। মন দিয়ে দেখেছ বলেই মনে ছিল।</p>}
    <p className="pg-end-off">{awayLine(last)}</p>
    <div className="pg-end-actions">
      <button type="button" className="pg-big" onClick={done(onAgain)}>
        <svg viewBox="0 0 48 48" aria-hidden="true"><path d="M38 24a14 14 0 1 1-4.1-9.9" /><path d="M35 6v9h-9" /></svg>
        <span>আবার খেলো</span>
      </button>
      <button type="button" className="pg-big pg-big-done" onClick={done(onDone)}>
        <svg viewBox="0 0 48 48" aria-hidden="true"><path d="M8 10c6-2 11-1 16 3v26c-5-4-10-5-16-3z" /><path d="M40 10c-6-2-11-1-16 3v26c5-4 10-5 16-3z" /></svg>
        <span>শেষ</span>
      </button>
    </div>
    <ShowParentButton onClick={onShow} />
  </div>;
}

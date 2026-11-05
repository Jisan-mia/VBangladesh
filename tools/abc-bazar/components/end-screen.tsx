'use client';
// The end of a round: the basket (every picture of the round with its letter), the stars, the counts ticking up with
// picture icons, what the child can do now, a task off the screen, then আবার খেলো and শেষ as two equal picture buttons
// of at least 96 px, and আব্বু-আম্মুকে দেখাও. The stage is cleared: nothing of the round shows behind it.
import { useEffect, useRef } from 'react';
import { COUNT_FRAMES, COUNT_MS, paintCount, type CountUp } from './count.hot';
import { Stars } from '../../../shared/game-ui';
import { bn, ShowParentButton } from '../../../shared/kids-kit';
import { entryOf } from '../lib/letters';
import { newsOf, taskOf, type Result } from '../lib/play';
import { Pic } from './pieces';

const countFrames = (to: number) => Array.from({ length: COUNT_FRAMES }, (_, frame) => bn(Math.round(to * frame / (COUNT_FRAMES - 1))));

export function EndScreen({ result, slow, onAgain, onDone, onShow }: { result: Result; slow: boolean; onAgain: () => void; onDone: () => void; onShow: () => void }) {
  const total = useRef<HTMLElement>(null), first = useRef<HTMLElement>(null);
  useEffect(() => {
    const count: CountUp = { nodes: [total.current, first.current], frames: [countFrames(result.count), countFrames(result.firstTry)], last: new Int16Array(2).fill(-1) };
    if (slow) { paintCount(count, 1); return; }
    paintCount(count, 0);
    let raf = 0;
    const started = performance.now() + 450;
    const frame = (now: number) => { paintCount(count, (now - started) / COUNT_MS); if (now - started < COUNT_MS) raf = requestAnimationFrame(frame); };
    raf = requestAnimationFrame(frame);
    return () => cancelAnimationFrame(raf);
  }, [result, slow]);
  const done = (action: () => void) => (event: { currentTarget: HTMLButtonElement }) => { event.currentTarget.blur(); action(); };
  return <div className="ab-end" data-slow={slow || undefined}>
    <ol className="ab-basket" aria-label="আজকের ঝুড়ি">
      {result.items.map((item, index) => {
        const entry = entryOf(item.letter), mirror = item.kind === 'mirror' || item.kind === 'same';
        return <li key={`${item.letter}${index}`} style={{ animationDelay: `${Math.round(60 * Math.sqrt(index))}ms` }}>
          <Pic letter={item.letter} className="ab-pic ab-basket-pic" /><span lang="en">{mirror ? item.letter.toLowerCase() : `${entry.letter}${entry.letter.toLowerCase()}`}</span>
        </li>;
      })}
    </ol>
    <div className="ab-end-stars"><Stars count={result.stars} /></div>
    <p className="ab-end-count">
      <span><svg viewBox="0 0 32 32" aria-hidden="true"><path d="M4 13h24l-3 14H7z" /><path d="M10 13l5-8M22 13l-5-8" /></svg><b ref={total}>{bn(result.count)}</b></span>
      <span><svg viewBox="0 0 32 32" aria-hidden="true"><path d="M13 5a3 3 0 0 1 6 0v12l5 1a3 3 0 0 1 2 4l-1 5a4 4 0 0 1-4 3h-7a4 4 0 0 1-3-2l-4-6a2.5 2.5 0 0 1 4-3l2 2z" /></svg><b ref={first}>{bn(result.firstTry)}</b></span>
    </p>
    <p className="ab-end-news">{newsOf(result.level)}</p>
    <p className="ab-end-off">{taskOf(result.level)}</p>
    <div className="ab-end-actions">
      <button type="button" className="ab-big" onClick={done(onAgain)}>
        <svg viewBox="0 0 48 48" aria-hidden="true"><path d="M38 24a14 14 0 1 1-4.1-9.9" /><path d="M35 6v9h-9" /></svg>
        <span>আবার খেলো</span>
      </button>
      <button type="button" className="ab-big ab-big-done" onClick={done(onDone)}>
        <svg viewBox="0 0 48 48" aria-hidden="true"><path d="M6 20l18-12 18 12" /><path d="M10 18v20h28V18" /><path d="M20 38V26h8v12" /></svg>
        <span>শেষ</span>
      </button>
    </div>
    <ShowParentButton onClick={onShow} />
  </div>;
}

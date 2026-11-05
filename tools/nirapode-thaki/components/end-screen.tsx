'use client';
// The end of a round: the safe pictures of the round as ticked tiles, the stars, the counts ticking up, what the child
// can do now, a task off the screen, then আবার খেলো and শেষ as two equal picture buttons, and আব্বু-আম্মুকে দেখাও.
import { useEffect, useRef } from 'react';
import { COUNT_FRAMES, COUNT_MS, paintCount, type CountUp } from './count.hot';
import { Stars } from '../../../shared/game-ui';
import { bn, ShowParentButton } from '../../../shared/kids-kit';
import { levelOf, setsOf } from '../lib/levels';
import { cardLine, type Result } from '../lib/play';
import { Icon } from './pictures';

const countFrames = (to: number) => Array.from({ length: COUNT_FRAMES }, (_, frame) => bn(Math.round(to * frame / (COUNT_FRAMES - 1))));

export function EndScreen({ result, slow, onAgain, onDone, onShow }: { result: Result; slow: boolean; onAgain: () => void; onDone: () => void; onShow: () => void }) {
  const level = levelOf(result.level);
  const rules = useRef<HTMLElement>(null), first = useRef<HTMLElement>(null);
  useEffect(() => {
    const count: CountUp = { nodes: [rules.current, first.current], frames: [countFrames(result.count), countFrames(result.firstTry)], last: new Int16Array(2).fill(-1) };
    if (slow) { paintCount(count, 1); return; }
    paintCount(count, 0);
    let raf = 0;
    const started = performance.now() + 450;
    const frame = (now: number) => { paintCount(count, (now - started) / COUNT_MS); if (now - started < COUNT_MS) raf = requestAnimationFrame(frame); };
    raf = requestAnimationFrame(frame);
    return () => cancelAnimationFrame(raf);
  }, [result, slow]);
  const done = (action: () => void) => (event: { currentTarget: HTMLButtonElement }) => { event.currentTarget.blur(); action(); };
  const away = setsOf(result.level).map(set => set.away)[level.finale ? 1 : 0];
  return <div className="nt-end" data-slow={slow || undefined}>
    <ol className="nt-page" aria-label="আজ যা শিখলে">
      {result.items.map((item, index) => <li key={`${item.set}${item.question.id}`} style={{ '--i': index } as React.CSSProperties}>
        <Icon id={item.question.right.icon} className="nt-page-icon" /><svg className="nt-tick" viewBox="0 0 20 20" aria-hidden="true"><circle cx="10" cy="10" r="10" /><path d="M5.2 10.4l3.2 3.2 6.2-7" /></svg>
      </li>)}
    </ol>
    <div className="nt-end-stars"><Stars count={result.stars} /></div>
    <p className="nt-end-count"><span><b ref={rules}>{bn(result.count)}</b>টা নিয়ম</span><span aria-hidden="true">·</span><span><b ref={first}>{bn(result.firstTry)}</b>টা প্রথমবারেই</span></p>
    <p className="nt-end-news">{cardLine(result, bn)}।</p>
    <p className="nt-end-off">{away}</p>
    <div className="nt-end-actions">
      <button type="button" className="nt-big" onClick={done(onAgain)}>
        <svg viewBox="0 0 48 48" aria-hidden="true"><path d="M38 24a14 14 0 1 1-4.1-9.9" /><path d="M35 6v9h-9" /></svg>
        <span>আবার খেলো</span>
      </button>
      <button type="button" className="nt-big nt-big-done" onClick={done(onDone)}>
        <svg viewBox="0 0 48 48" aria-hidden="true"><path d="M8 10c6-2 11-1 16 3v26c-5-4-10-5-16-3z" /><path d="M40 10c-6-2-11-1-16 3v26c5-4 10-5 16-3z" /></svg>
        <span>শেষ</span>
      </button>
    </div>
    <ShowParentButton onClick={onShow} />
  </div>;
}

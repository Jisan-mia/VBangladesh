'use client';
// The end of a round: the pairs you met as little pictures, the stars, the counts ticking up, a plain line (praise only for a
// clean round, a tip after many slips), what the child can do now, a task off the screen, then আবার খেলো and শেষ as two
// equal picture buttons, and আব্বু-আম্মুকে দেখাও.
import { useEffect, useRef } from 'react';
import { Stars } from '../../../shared/game-ui';
import { ShowParentButton } from '../../../shared/kids-kit';
import { levelOf } from '../lib/course';
import type { Result } from '../lib/round';
import { bn, methodLine, newsLine, taskLine } from '../lib/words';
import { COUNT_FRAMES, COUNT_MS, paintCount, type CountUp } from './count.hot';
import { Bell, PairArt, SortArt } from './pics';
import { TARGETS } from '../lib/pairs';

const countFrames = (to: number) => Array.from({ length: COUNT_FRAMES }, (_, frame) => bn(Math.round(to * frame / (COUNT_FRAMES - 1))));

export function EndScreen({ result, slow, onAgain, onDone, onShow }: { result: Result; slow: boolean; onAgain: () => void; onDone: () => void; onShow: () => void }) {
  const spec = levelOf(result.level);
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
  const many = result.mistakes >= 3;
  return <div className="uk-end" data-slow={slow || undefined}>
    <ol className="uk-met" aria-label="আজকের জোড়া" data-n={result.seen.length}>
      {spec.kind === 'sort'
        ? TARGETS.map((card, at) => <li key={at} style={{ animationDelay: `${at * 50}ms` }}><span className="uk-met-card"><SortArt card={card} /></span></li>)
        : result.seen.map((pair, at) => <li key={pair} style={{ animationDelay: `${Math.min(at, 5) * 40}ms` }}><PairArt pair={pair} /></li>)}
    </ol>
    <div className="uk-end-stars"><Stars count={result.stars} /></div>
    <p className="uk-end-count">
      <span><b ref={total}>{bn(result.count)}</b>টা {spec.kind === 'sort' ? 'কার্ড' : 'ছবি'}</span><span aria-hidden="true">·</span>
      <span><b ref={first}>{bn(result.firstTry)}</b>টা প্রথমবারেই</span>
      {result.bells > 0 && <><span aria-hidden="true">·</span><span className="uk-end-bell"><i><Bell /></i><b>{bn(result.bells)}</b>বার ঘণ্টা</span></>}
    </p>
    <p className={many ? 'uk-end-tip' : 'uk-end-method'}>{methodLine(result)}</p>
    {!many && <p className="uk-end-news">{newsLine(result.level)}</p>}
    <p className="uk-end-off">{taskLine(result.level)}</p>
    <div className="uk-end-actions">
      <button type="button" className="uk-big" onClick={done(onAgain)}>
        <svg viewBox="0 0 48 48" aria-hidden="true"><path d="M38 24a14 14 0 1 1-4.1-9.9" /><path d="M35 6v9h-9" /></svg>
        <span>আবার খেলো</span>
      </button>
      <button type="button" className="uk-big uk-big-done" onClick={done(onDone)}>
        <svg viewBox="0 0 48 48" aria-hidden="true"><path d="M6 36h36M14 36a10 10 0 0 1 20 0M24 14v4M10 22l3 3M38 22l-3 3M6 26h4M38 26h4" /></svg>
        <span>শেষ</span>
      </button>
    </div>
    <ShowParentButton onClick={onShow} />
  </div>;
}

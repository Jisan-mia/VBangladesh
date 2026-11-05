'use client';
// The end of a round: the toys matched (each beside its own shadow), the stars, two counts ticking up with picture icons, then
// আবার খেলো and শেষ as two equal picture buttons of at least 96 px, and আব্বু-আম্মুকে দেখাও, all on the first screen of a phone.
// What is new and a task off the screen come after, for the parent. The stage is cleared: nothing of the round shows behind it.
import { useEffect, useRef } from 'react';
import { COUNT_FRAMES, COUNT_MS, paintCount, type CountUp } from './count.hot';
import { Stars } from '../../../shared/game-ui';
import { bn, ShowParentButton } from '../../../shared/kids-kit';
import { levelOf } from '../lib/levels';
import { doneLine, methodLine, newsOf, taskOf } from '../lib/lines';
import { shapesOf, type Result } from '../lib/round';
import { Toy } from './pieces';

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
  const spec = levelOf(result.level);
  return <div className="cs-end" data-slow={slow || undefined}>
    <ol className="cs-found" aria-label="আজ যাদের মেলালে">
      {shapesOf(result.ids).map((shape, index) => <li key={`${shape.id}${index}`} style={{ animationDelay: `${Math.round(55 * Math.sqrt(index))}ms` }}><Toy shape={shape} /></li>)}
    </ol>
    <div className="cs-end-stars"><Stars count={result.stars} /></div>
    <p className="cs-end-count" aria-label={doneLine(result.count, bn)}>
      <span><svg viewBox="0 0 32 32" aria-hidden="true"><circle cx="16" cy="16" r="12" /><path d="M10 16.5l4 4 8-9" /></svg><b ref={total}>{bn(result.count)}</b></span>
      <span><svg viewBox="0 0 32 32" aria-hidden="true"><path d="M13 5a3 3 0 0 1 6 0v12l5 1a3 3 0 0 1 2 4l-1 5a4 4 0 0 1-4 3h-7a4 4 0 0 1-3-2l-4-6a2.5 2.5 0 0 1 4-3l2 2z" /></svg><b ref={first}>{bn(result.firstTry)}</b></span>
    </p>
    <div className="cs-end-actions">
      <button type="button" className="cs-big" onClick={done(onAgain)}>
        <svg viewBox="0 0 48 48" aria-hidden="true"><path d="M38 24a14 14 0 1 1-4.1-9.9" /><path d="M35 6v9h-9" /></svg>
        <span>আবার খেলো</span>
      </button>
      <button type="button" className="cs-big cs-big-done" onClick={done(onDone)}>
        <svg viewBox="0 0 48 48" aria-hidden="true"><path d="M12 42V8h24v34" /><path d="M8 42h32" /><circle cx="30" cy="26" r="1.8" /></svg>
        <span>শেষ</span>
      </button>
    </div>
    <ShowParentButton onClick={onShow} />
    <p className="cs-end-news">{result.slips === 0 ? methodLine : `${doneLine(result.count, bn)} ${newsOf(spec.id)}`}</p>
    <p className="cs-end-off">{taskOf(spec.id)}</p>
  </div>;
}

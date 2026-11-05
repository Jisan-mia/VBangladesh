'use client';
// The end of a set: the filled page (every letter with the picture it turned into), the stars, the counts ticking up,
// what the child can do now, a task off the screen, then আবার খেলো and শেষ as two equal 112 px picture buttons, and
// আব্বু-আম্মুকে দেখাও. Nothing starts by itself.
import { useEffect, useRef } from 'react';
import { Stars } from '../../../shared/game-ui';
import { ShowParentButton } from '../../../shared/kids-kit';
import { COUNT_FRAMES, COUNT_MS, paintCount, type CountUp } from './count.hot';
import { PicCanvas } from './pic-canvas';
import { bn, endLine, levelOf, pictureOf } from '../lib/levels';
import type { Result } from '../lib/result';

const countFrames = (to: number) => Array.from({ length: COUNT_FRAMES }, (_, frame) => bn(Math.round(to * frame / (COUNT_FRAMES - 1))));

export function EndScreen({ result, slow, onAgain, onDone, onShow }: { result: Result; slow: boolean; onAgain: () => void; onDone: () => void; onShow: () => void }) {
  const spec = levelOf(result.level);
  const letters = useRef<HTMLElement>(null), strokes = useRef<HTMLElement>(null);
  useEffect(() => {
    const count: CountUp = { nodes: [letters.current, strokes.current], frames: [countFrames(result.letters.length), countFrames(result.strokes)], last: new Int16Array(2).fill(-1) };
    if (slow) { paintCount(count, 1); return; }
    paintCount(count, 0);
    let raf = 0;
    const started = performance.now() + 450;
    const frame = (now: number) => { paintCount(count, (now - started) / COUNT_MS); if (now - started < COUNT_MS) raf = requestAnimationFrame(frame); };
    raf = requestAnimationFrame(frame);
    return () => cancelAnimationFrame(raf);
  }, [result, slow]);
  const done = (action: () => void) => (event: { currentTarget: HTMLButtonElement }) => { event.currentTarget.blur(); action(); };
  return <div className="bl-end" data-slow={slow || undefined}>
    {spec.finale && <p className="bl-end-finale">{spec.finale}</p>}
    <ol className="bl-page" aria-label="আজকের পাতা">
      {result.letters.map((char, index) => <li key={`${char}${index}`} style={{ animationDelay: `${index * 45}ms` }}>
        <PicCanvas pic={pictureOf(char).pic} size={64} /><span>{char}</span>
      </li>)}
    </ol>
    <div className="bl-end-stars"><Stars count={result.stars} /></div>
    <p className="bl-end-count"><span><b ref={letters}>{bn(result.letters.length)}</b>টা {result.noun}</span><span aria-hidden="true">·</span><span><b ref={strokes}>{bn(result.strokes)}</b>টা দাগ</span></p>
    <p className="bl-end-news">{endLine(result.letters)}।</p>
    <p className="bl-end-off">এবার খাতায় পেনসিলে একবার করে লেখো। আম্মু বা আব্বুকে পাশে বসাও।</p>
    <div className="bl-end-actions">
      <button type="button" className="bl-big" onClick={done(onAgain)}>
        <svg viewBox="0 0 48 48" aria-hidden="true"><path d="M38 24a14 14 0 1 1-4.1-9.9" /><path d="M35 6v9h-9" /></svg>
        <span>আবার খেলো</span>
      </button>
      <button type="button" className="bl-big bl-big-done" onClick={done(onDone)}>
        <svg viewBox="0 0 48 48" aria-hidden="true"><path d="M8 10c6-2 11-1 16 3v26c-5-4-10-5-16-3z" /><path d="M40 10c-6-2-11-1-16 3v26c5-4 10-5 16-3z" /></svg>
        <span>শেষ</span>
      </button>
    </div>
    <ShowParentButton onClick={onShow} />
  </div>;
}

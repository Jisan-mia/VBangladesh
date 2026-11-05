'use client';
// The end of a round: the filled page (each word's picture with its equation), the stars, the counts ticking up, what the
// child can do now, a task off the screen, then আবার খেলো and শেষ as two equal picture buttons, and আব্বু-আম্মুকে দেখাও.
import { useEffect, useRef } from 'react';
import { COUNT_FRAMES, COUNT_MS, paintCount, type CountUp } from './count.hot';
import { Stars } from '../../../shared/game-ui';
import { bn, ShowParentButton } from '../../../shared/kids-kit';
import { worldOf } from '../lib/levels';
import { methodLine, type Result } from '../lib/round';
import { equation } from '../lib/words';
import { WordPicture } from './word-parts';

const countFrames = (to: number) => Array.from({ length: COUNT_FRAMES }, (_, frame) => bn(Math.round(to * frame / (COUNT_FRAMES - 1))));

export function EndScreen({ result, slow, fresh, onAgain, onDone, onShow }: { result: Result; slow: boolean; fresh: readonly string[]; onAgain: () => void; onDone: () => void; onShow: () => void }) {
  const world = worldOf(result.level);
  const words = useRef<HTMLElement>(null), first = useRef<HTMLElement>(null);
  useEffect(() => {
    const count: CountUp = { nodes: [words.current, first.current], frames: [countFrames(result.words), countFrames(result.firstTry)], last: new Int16Array(2).fill(-1) };
    if (slow) { paintCount(count, 1); return; }
    paintCount(count, 0);
    let raf = 0;
    const started = performance.now() + 450;
    const frame = (now: number) => { paintCount(count, (now - started) / COUNT_MS); if (now - started < COUNT_MS) raf = requestAnimationFrame(frame); };
    raf = requestAnimationFrame(frame);
    return () => cancelAnimationFrame(raf);
  }, [result, slow]);
  const done = (action: () => void) => (event: { currentTarget: HTMLButtonElement }) => { event.currentTarget.blur(); action(); };
  const made = result.steps.some(step => step.mode === 'juri') && !result.steps.some(step => step.mode === 'bhangi') ? 'জুড়তে' : result.steps.some(step => step.mode === 'juri') ? 'ভাঙতে আর জুড়তে' : 'ভাঙতে';
  return <div className="jb-end" data-slow={slow || undefined}>
    <ol className="jb-page" aria-label="আজকের পাতা">
      {result.steps.map((step, index) => <li key={`${step.word.word}${index}`} style={{ animationDelay: `${index * 40}ms` }}>
        <WordPicture pic={step.word.pic} size={36} /><span>{equation(step.word.parts)}</span>
      </li>)}
    </ol>
    <div className="jb-end-stars"><Stars count={result.stars} /></div>
    <p className="jb-end-count"><span><b ref={words}>{bn(result.words)}</b>টা যুক্তবর্ণ</span><span aria-hidden="true">·</span><span><b ref={first}>{bn(result.firstTry)}</b>টা প্রথমবারেই</span></p>
    <p className="jb-end-news">এখন তুমি {world.skill} {made} পারো।</p>
    <p className="jb-end-note">{methodLine(result)}</p>
    {fresh.length > 0 && <p className="jb-end-book">খাতায় নতুন: {fresh.map(joint => <b key={joint}>{joint}</b>)}</p>}
    <p className="jb-end-off">{world.task}</p>
    <div className="jb-end-actions">
      <button type="button" className="jb-big" onClick={done(onAgain)}>
        <svg viewBox="0 0 48 48" aria-hidden="true"><path d="M38 24a14 14 0 1 1-4.1-9.9" /><path d="M35 6v9h-9" /></svg>
        <span>আবার খেলো</span>
      </button>
      <button type="button" className="jb-big jb-big-done" onClick={done(onDone)}>
        <svg viewBox="0 0 48 48" aria-hidden="true"><path d="M8 10c6-2 11-1 16 3v26c-5-4-10-5-16-3z" /><path d="M40 10c-6-2-11-1-16 3v26c5-4 10-5 16-3z" /></svg>
        <span>শেষ</span>
      </button>
    </div>
    <ShowParentButton onClick={onShow} />
  </div>;
}


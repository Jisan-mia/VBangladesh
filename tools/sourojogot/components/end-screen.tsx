'use client';
// The end of a round: the planets you visited, the stars, the counts ticking up, a plain line (praise only for a clean
// round, a tip after many slips), what the child can do now, a task off the screen, then আবার খেলো and শেষ as two equal
// picture buttons, and আব্বু-আম্মুকে দেখাও.
import { useEffect, useRef } from 'react';
import { Stars } from '../../../shared/game-ui';
import { bn, ShowParentButton } from '../../../shared/kids-kit';
import { levelOf } from '../lib/course';
import { PLANETS } from '../lib/planets';
import type { Result } from '../lib/round';
import { methodLine, newsLine, taskLine } from '../lib/words';
import { PlanetArt } from './art';
import { COUNT_FRAMES, COUNT_MS, paintCount, type CountUp } from './count.hot';

const countFrames = (to: number) => Array.from({ length: COUNT_FRAMES }, (_, frame) => bn(Math.round(to * frame / (COUNT_FRAMES - 1))));

export function EndScreen({ result, slow, onAgain, onDone, onShow }: { result: Result; slow: boolean; onAgain: () => void; onDone: () => void; onShow: () => void }) {
  const spec = levelOf(result.level);
  const planets = useRef<HTMLElement>(null), first = useRef<HTMLElement>(null);
  useEffect(() => {
    const count: CountUp = { nodes: [planets.current, first.current], frames: [countFrames(result.count), countFrames(result.firstTry)], last: new Int16Array(2).fill(-1) };
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
  const seen = [...new Set(result.planets)];
  return <div className="sj-end" data-slow={slow || undefined}>
    <ol className="sj-visited" aria-label="আজকের গ্রহ" data-n={seen.length}>
      {seen.map((index, at) => <li key={index} style={{ animationDelay: `${Math.min(at, 5) * 40}ms` }}>
        <span className="sj-visited-art"><PlanetArt planet={PLANETS[index]} box={80} r={Math.min(PLANETS[index].drawR + 4, 38)} /></span>
        <span>{PLANETS[index].name}</span>
      </li>)}
    </ol>
    <div className="sj-end-stars"><Stars count={result.stars} /></div>
    <p className="sj-end-count"><span><b ref={planets}>{bn(result.count)}</b>টা {spec.mode === 'scale' ? 'প্রশ্ন' : 'গ্রহ'}</span><span aria-hidden="true">·</span><span><b ref={first}>{bn(result.firstTry)}</b>টা প্রথমবারেই</span></p>
    <p className={many ? 'sj-end-tip' : 'sj-end-method'}>{methodLine(result.level, result.mistakes)}</p>
    {!many && <p className="sj-end-news">{newsLine(result.level)}</p>}
    <p className="sj-end-off">{taskLine(result.level)}</p>
    <div className="sj-end-actions">
      <button type="button" className="sj-big" onClick={done(onAgain)}>
        <svg viewBox="0 0 48 48" aria-hidden="true"><path d="M38 24a14 14 0 1 1-4.1-9.9" /><path d="M35 6v9h-9" /></svg>
        <span>আবার খেলো</span>
      </button>
      <button type="button" className="sj-big sj-big-done" onClick={done(onDone)}>
        <svg viewBox="0 0 48 48" aria-hidden="true"><path d="M24 6c6 6 6 18 4 26H20c-2-8-2-20 4-26z" /><path d="M20 32l-6 8h6zM28 32l6 8h-6z" /><circle cx="24" cy="18" r="3" /></svg>
        <span>শেষ</span>
      </button>
    </div>
    <ShowParentButton onClick={onShow} />
  </div>;
}

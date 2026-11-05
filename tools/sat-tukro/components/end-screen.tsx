'use client';
// The end of a picture: the finished picture bobbing, three stars, the real counts ticking up, what the child can do now,
// a task off the screen, then আবার খেলো and শেষ as two equal picture buttons (112 px), and আব্বু-আম্মুকে দেখাও.
import { useEffect, useRef } from 'react';
import { Stars } from '../../../shared/game-ui';
import { bn, ShowParentButton } from '../../../shared/kids-kit';
import { FIGURES } from '../lib/figures';
import type { Result } from '../lib/game';
import { NEWS, WORLDS, figureOf, isFinale, levelsOfWorld, specOf } from '../lib/levels';
import { COUNT_FRAMES, COUNT_MS, paintCount, type CountUp } from './count.hot';
import { FigureArt } from './figure-art';

/** The world's pictures pop in as a wave that speeds up (not a metronome). */
const WAVE = [0, 80, 150, 210, 260, 300];
const countFrames = (to: number) => Array.from({ length: COUNT_FRAMES }, (_, frame) => bn(Math.round(to * frame / (COUNT_FRAMES - 1))));

export function EndScreen({ result, slow, onAgain, onDone, onShow }: { result: Result; slow: boolean; onAgain: () => void; onDone: () => void; onShow: () => void }) {
  const spec = specOf(result.level), figure = FIGURES.find(f => f.id === result.figure) ?? figureOf(result.level), world = WORLDS[spec.world];
  const placed = useRef<HTMLElement>(null), misses = useRef<HTMLElement>(null), turned = useRef<HTMLElement>(null);
  useEffect(() => {
    const count: CountUp = { nodes: [placed.current, misses.current, turned.current], frames: [countFrames(result.placed), countFrames(result.misses), countFrames(result.turned)], last: new Int16Array(3).fill(-1) };
    if (slow) { paintCount(count, 1); return; }
    paintCount(count, 0);
    let raf = 0;
    const started = performance.now() + 450;
    const frame = (now: number) => { paintCount(count, (now - started) / COUNT_MS); if (now - started < COUNT_MS) raf = requestAnimationFrame(frame); };
    raf = requestAnimationFrame(frame);
    return () => cancelAnimationFrame(raf);
  }, [result, slow]);
  const done = (action: () => void) => (event: { currentTarget: HTMLButtonElement }) => { event.currentTarget.blur(); action(); };
  const finale = isFinale(result.level);
  return <div className="st-end" data-slow={slow || undefined}>
    {finale
      ? <ol className="st-world" aria-label={`${world.name}-এর সব ছবি`}>{levelsOfWorld(spec.world).map((id, at) => <li key={id} style={{ animationDelay: `${WAVE[Math.min(at, WAVE.length - 1)]}ms` }}><FigureArt figure={figureOf(id)} size={48} label={false} /></li>)}</ol>
      : <div className="st-end-pic"><FigureArt figure={figure} size={150} /></div>}
    <p className="st-end-name">{finale ? `${world.name}-এর শেষ ছবি: ${figure.name}` : `${figure.name} হলো`}</p>
    <div className="st-end-stars"><Stars count={result.stars} /></div>
    <p className="st-end-count">
      <span><b ref={placed}>{bn(result.placed)}</b>টা বসালে</span><span aria-hidden="true">·</span>
      <span><b ref={misses}>{bn(result.misses)}</b>বার ভুল</span><span aria-hidden="true">·</span>
      <span><b ref={turned}>{bn(result.turned)}</b>বার ঘোরানো</span>
    </p>
    <p className="st-end-news">{NEWS[spec.world]}</p>
    <p className="st-end-off">ছবিতে ত্রিভুজ কয়টা? গুনে আব্বু-আম্মুকে বলো।</p>
    <div className="st-end-actions">
      <button type="button" className="st-big" onClick={done(onAgain)}>
        <svg viewBox="0 0 48 48" aria-hidden="true"><path d="M38 24a14 14 0 1 1-4.1-9.9" /><path d="M35 6v9h-9" /></svg>
        <span>আবার খেলো</span>
      </button>
      <button type="button" className="st-big st-big-done" onClick={done(onDone)}>
        <svg viewBox="0 0 48 48" aria-hidden="true"><path d="M10 24l9 9 19-19" /></svg>
        <span>শেষ</span>
      </button>
    </div>
    <ShowParentButton onClick={onShow} />
  </div>;
}

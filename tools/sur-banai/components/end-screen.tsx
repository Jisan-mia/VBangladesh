'use client';
// The end of a round: the tune as a picture (its notes pop in left to right), the stars, the counts ticking up, a task off
// the screen, then আবার খেলো and শেষ as two equal picture buttons, and আব্বু-আম্মুকে দেখাও. The same screen shows a kept tune.
import { useEffect, useRef } from 'react';
import { COUNT_FRAMES, COUNT_MS, paintCount, type CountUp } from './count.hot';
import { Stars } from '../../../shared/game-ui';
import { bn, ShowParentButton } from '../../../shared/kids-kit';
import { levelOf, worldOf } from '../lib/levels';
import { methodLine, type Tune } from '../lib/music';
import type { Result } from '../lib/round';
import { Icon, MiniTune } from './pictures';

const countFrames = (to: number) => Array.from({ length: COUNT_FRAMES }, (_, frame) => bn(Math.round(to * frame / (COUNT_FRAMES - 1))));

export type EndData = { kind: 'level'; result: Result } | { kind: 'kept'; tune: Tune; notes: number };

const AWAY = {
  copy: 'এবার আম্মুকে একটা সুর গুনগুন করে শোনাও।',
  gap: 'আম্মু গুনগুন করবে আর মাঝখানে থেমে যাবে। বাকিটা তুমি গাও।',
  make: 'তোমার সুরের তালে আব্বুকে তালি দিতে বলো।',
} as const;

export function EndScreen({ data, slow, head, onAgain, onDone, onShow }: { data: EndData; slow: boolean; head: number; onAgain: () => void; onDone: () => void; onShow: () => void }) {
  const notes = useRef<HTMLElement>(null), tries = useRef<HTMLElement>(null);
  const level = data.kind === 'level' ? levelOf(data.result.level) : null;
  const total = data.kind === 'level' ? data.result.notes : data.notes;
  const turns = data.kind === 'level' && level?.kind !== 'make' ? data.result.listens : 0;
  useEffect(() => {
    const count: CountUp = { nodes: [notes.current, tries.current], frames: [countFrames(total), countFrames(turns)], last: new Int16Array(2).fill(-1) };
    if (slow) { paintCount(count, 1); return; }
    paintCount(count, 0);
    let raf = 0;
    const started = performance.now() + 450;
    const frame = (now: number) => { paintCount(count, (now - started) / COUNT_MS); if (now - started < COUNT_MS) raf = requestAnimationFrame(frame); };
    raf = requestAnimationFrame(frame);
    return () => cancelAnimationFrame(raf);
  }, [total, turns, slow]);
  const done = (action: () => void) => (event: { currentTarget: HTMLButtonElement }) => { event.currentTarget.blur(); action(); };
  const tune = data.kind === 'level' ? data.result.tune : data.tune;
  const news = data.kind === 'kept' ? 'সুরটা এই ফোনে রাখা হলো।'
    : level?.kind === 'make' ? `${bn(total)}টা নোটের নিজের সুর।` : methodLine(data.result.tries, total);
  const away = data.kind === 'kept' ? AWAY.make : AWAY[level?.kind ?? 'copy'];
  return <div className="sb-end" data-slow={slow || undefined}>
    <MiniTune tune={tune} className="sb-end-tune" head={head} pop={!slow} />
    {data.kind === 'level' && <div className="sb-end-stars"><Stars count={data.result.stars} /></div>}
    <p className="sb-end-count"><span><b ref={notes}>{bn(total)}</b>টা নোট</span>{turns > 0 && <><span aria-hidden="true">·</span><span><b ref={tries}>{bn(turns)}</b> বার শুনেছ</span></>}</p>
    <p className="sb-end-news">{news}{data.kind === 'level' && level?.finale ? ` ${worldOf(level.id).name} শেষ।` : ''}</p>
    <p className="sb-end-off">{away}</p>
    <div className="sb-end-actions">
      <button type="button" className="sb-big" onClick={done(onAgain)}>
        <Icon id="again" className="sb-big-ic" />
        <span>আবার খেলো</span>
      </button>
      <button type="button" className="sb-big sb-big-done" onClick={done(onDone)}>
        <Icon id="home" className="sb-big-ic" />
        <span>শেষ</span>
      </button>
    </div>
    <ShowParentButton onClick={onShow} />
  </div>;
}

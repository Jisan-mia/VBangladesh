'use client';
// The end of a round: the phone connected (a face on the screen, the handset ringing), the stars, the counts ticking up, one line, a task
// off the screen, then আবার খেলো and শেষ as two equal picture buttons of 112 px, and আব্বু-আম্মুকে দেখাও. The panel arrives as one piece
// (the buttons are tappable at once); only the stars and the counts are choreographed, and both are skipped in ধীরে খেলো.
import { useEffect, useRef } from 'react';
import { COUNT_FRAMES, COUNT_MS, paintCount, type CountUp } from './count.hot';
import { Stars } from '../../../shared/game-ui';
import { bn as digits, ShowParentButton } from '../../../shared/kids-kit';
import { levelOf } from '../lib/levels';
import { askLine, endLine, type Result, type Round, type Who } from '../lib/play';
import { Face, HangUp, Handset, Replay } from './pictures';

const countFrames = (to: number) => Array.from({ length: COUNT_FRAMES }, (_, frame) => digits(Math.round(to * frame / (COUNT_FRAMES - 1))));

export function EndScreen({ result, round, who, slow, onAgain, onDone, onShow }: { result: Result; round: Round; who: Who; slow: boolean; onAgain: () => void; onDone: () => void; onShow: () => void }) {
  const level = levelOf(result.level);
  const dialled = useRef<HTMLElement>(null), clean = useRef<HTMLElement>(null);
  useEffect(() => {
    const count: CountUp = { nodes: [dialled.current, clean.current], frames: [countFrames(result.dialled), countFrames(result.clean)], last: new Int16Array(2).fill(-1) };
    if (slow) { paintCount(count, 1); return; }
    paintCount(count, 0);
    let raf = 0;
    const started = performance.now() + 450;
    const frame = (now: number) => { paintCount(count, (now - started) / COUNT_MS); if (now - started < COUNT_MS) raf = requestAnimationFrame(frame); };
    raf = requestAnimationFrame(frame);
    return () => cancelAnimationFrame(raf);
  }, [result, slow]);
  const done = (action: () => void) => (event: { currentTarget: HTMLButtonElement }) => { event.currentTarget.blur(); action(); };
  return <div className="am-end" data-slow={slow || undefined} data-finale={level.finale ? '' : undefined}>
    <div className="am-connect" aria-hidden="true">
      <Face who={who} className="am-connect-face" />
      <span className="am-connect-call"><Handset className="am-connect-handset" /></span>
      <svg className="am-connect-waves" viewBox="0 0 60 40"><path d="M6 10q-6 10 0 20M14 5q-10 15 0 30" /><path d="M54 10q6 10 0 20M46 5q10 15 0 30" /></svg>
    </div>
    {level.finale && <p className="am-end-finale"><span>ফাইনাল</span> {level.finale}</p>}
    <div className="am-end-stars"><Stars count={result.stars} /></div>
    <p className="am-end-count"><span><b ref={dialled}>{digits(result.dialled)}</b>টা অঙ্ক</span><span aria-hidden="true">·</span><span><b ref={clean}>{digits(result.clean)}</b>টা প্রথমবারেই</span></p>
    <p className="am-end-news">{endLine(round, who)}</p>
    <p className="am-end-off">{askLine(who)}</p>
    <div className="am-end-actions">
      <button type="button" className="am-big" onClick={done(onAgain)}><Replay /><span>আবার খেলো</span></button>
      <button type="button" className="am-big am-big-done" onClick={done(onDone)}><HangUp /><span>শেষ</span></button>
    </div>
    <ShowParentButton onClick={onShow} />
  </div>;
}

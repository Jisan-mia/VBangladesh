'use client';
// The end of a round: the stars, what the round did counting up, a task off the screen, then আবার খেলো and শেষ as two
// equal picture buttons (112 px), and আব্বু-আম্মুকে দেখাও. Nothing here needs reading: the picture buttons and the stars carry it.
import { useEffect, useRef } from 'react';
import { Stars } from '../../../shared/game-ui';
import { bn, ShowParentButton } from '../../../shared/kids-kit';
import { levelOf } from '../lib/levels';
import { endLine, praiseLine, type Result } from '../lib/round';
import { COUNT_FRAMES, COUNT_MS, paintCount, type CountUp } from './count.hot';
import { AgainIcon, DoneIcon, Fish, Pattern, WorldIcon } from './pictures';

const countFrames = (to: number) => Array.from({ length: COUNT_FRAMES }, (_, frame) => bn(Math.round(to * frame / (COUNT_FRAMES - 1))));
const OFF_SCREEN = {
  guni: 'এবার ঘরে কিছু জিনিস সাজিয়ে একসাথে গুনে দেখো।',
  nojor: 'এবার একটা থালায় কয়েকটা জিনিস রেখে এক নজরে বলো, কয়টা।',
  beshi: 'এবার দুই থালায় ভাত-মুড়ি রেখে বলো, কোনটায় বেশি।',
  merge: 'এবার দুই হাতের জিনিস এক করে গুনে দেখো, মোট কয়টা।',
};

export function EndScreen({ result, slow, onAgain, onDone, onShow }: { result: Result; slow: boolean; onAgain: () => void; onDone: () => void; onShow: () => void }) {
  const spec = levelOf(result.level);
  const done = useRef<HTMLElement>(null), first = useRef<HTMLElement>(null);
  useEffect(() => {
    const count: CountUp = { nodes: [done.current, first.current], frames: [countFrames(result.done), countFrames(result.firstTry)], last: new Int16Array(2).fill(-1) };
    if (slow) { paintCount(count, 1); return; }
    paintCount(count, 0);
    let raf = 0;
    const started = performance.now() + 450;
    const frame = (now: number) => { paintCount(count, (now - started) / COUNT_MS); if (now - started < COUNT_MS) raf = requestAnimationFrame(frame); };
    raf = requestAnimationFrame(frame);
    return () => cancelAnimationFrame(raf);
  }, [result, slow]);
  const press = (action: () => void) => (event: { currentTarget: HTMLButtonElement }) => { event.currentTarget.blur(); action(); };
  return <div className="gd-end" data-slow={slow || undefined}>
    <div className="gd-end-stars"><Stars count={result.stars} /></div>
    <p className="gd-end-count">
      <span className="gd-end-what">{spec.kind === 'guni' ? <Fish /> : spec.kind === 'nojor' ? <Pattern n={5} look="dice" /> : <WorldIcon world={2} />}<b ref={done}>{bn(result.done)}</b></span>
      <span className="gd-end-what gd-end-first"><DoneIcon /><b ref={first}>{bn(result.firstTry)}</b><small>/{bn(5)}</small></span>
    </p>
    <p className="gd-end-line">{endLine(result)}</p>
    {praiseLine(result) && <p className="gd-end-note">{praiseLine(result)}</p>}
    <p className="gd-end-off">{OFF_SCREEN[spec.kind]}</p>
    <div className="gd-end-actions">
      <button type="button" className="gd-big" onClick={press(onAgain)} aria-label="আবার খেলো"><AgainIcon /><span>আবার</span></button>
      <button type="button" className="gd-big gd-big-done" onClick={press(onDone)} aria-label="শেষ"><DoneIcon /><span>শেষ</span></button>
    </div>
    <ShowParentButton onClick={onShow} />
  </div>;
}

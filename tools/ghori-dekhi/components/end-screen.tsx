"use client";
// The end of a round: the day's times as small clocks, the stars, the counts ticking up, what the child can do now, a task off the
// screen, then আবার খেলো and শেষ as two equal picture buttons, and আব্বু-আম্মুকে দেখাও.
import { useEffect, useRef } from "react";
import { COUNT_FRAMES, COUNT_MS, paintCount, type CountUp } from "./count.hot";
import { Stars } from "../../../shared/game-ui";
import { bn, ShowParentButton } from "../../../shared/kids-kit";
import { levelOf } from "../lib/levels";
import { say, type Result } from "../lib/round";
import { MiniClock } from "./face";

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
  return <div className="gd-end" data-slow={slow || undefined}>
    <ol className="gd-day" aria-label="আজকের দিন" data-n={result.items.length}>
      {result.items.map((item, index) => <li key={index} style={{ animationDelay: `${index * 40}ms` }}>
        <MiniClock time={item.time} size={52} />
        <span>{say(item.time, spec)}</span>
      </li>)}
    </ol>
    <div className="gd-end-stars"><Stars count={result.stars} /></div>
    <p className="gd-end-count"><span><b ref={total}>{bn(result.count)}</b>টা সময়</span><span aria-hidden="true">·</span><span><b ref={first}>{bn(result.firstTry)}</b>টা প্রথমবারেই</span></p>
    <p className="gd-end-news">{spec.news}</p>
    <p className="gd-end-off">{spec.off}</p>
    <div className="gd-end-actions">
      <button type="button" className="gd-big" onClick={done(onAgain)}>
        <svg viewBox="0 0 48 48" aria-hidden="true"><path d="M38 24a14 14 0 1 1-4.1-9.9" /><path d="M35 6v9h-9" /></svg>
        <span>আবার খেলো</span>
      </button>
      <button type="button" className="gd-big gd-big-done" onClick={done(onDone)}>
        <svg viewBox="0 0 48 48" aria-hidden="true"><path d="M8 10c6-2 11-1 16 3v26c-5-4-10-5-16-3z" /><path d="M40 10c-6-2-11-1-16 3v26c5-4 10-5 16-3z" /></svg>
        <span>শেষ</span>
      </button>
    </div>
    <ShowParentButton onClick={onShow} />
  </div>;
}

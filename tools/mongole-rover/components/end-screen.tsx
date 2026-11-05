"use client";
// The end of a level: the stage is cleared. The stars pop in with chimes, two counts tick up beside picture icons (blocks of the
// shortest plan, rocks lifted), the exact method line, a Mars fact, what the child can do now, then পরের লেভেল (96 px tall) and two
// equal 112 px picture buttons, আবার খেলো and শেষ, and আব্বু-আম্মুকে দেখাও. Choreography: stars lead, the counts start after the
// card's entrance, the buttons arrive with the card (no stagger of children).
import { useEffect, useRef } from "react";
import { bn, ShowParentButton } from "../../../shared/kids-kit";
import { SAMPLE } from "../lib/art";
import { factFor } from "../lib/facts";
import { LEVEL_COUNT, isFinale, worldOf } from "../lib/levels";
import { NEWS, TASKS, endTitle, methodLine } from "../lib/lines";
import type { Result } from "../lib/play";
import { COUNT_FRAMES, COUNT_MS, paintCount, type CountUp } from "./count.hot";
import { Art, ICONS, StarsRow } from "./pieces";

const countFrames = (to: number) => Array.from({ length: COUNT_FRAMES }, (_, frame) => bn(Math.round(to * frame / (COUNT_FRAMES - 1))));

export function EndScreen({ result, slow, onNext, onAgain, onDone, onShow }: { result: Result; slow: boolean; onNext: () => void; onAgain: () => void; onDone: () => void; onShow: () => void }) {
  const blocks = useRef<HTMLElement>(null), rocks = useRef<HTMLElement>(null);
  useEffect(() => {
    const count: CountUp = { nodes: [blocks.current, rocks.current], frames: [countFrames(result.blocks), countFrames(result.rocks)], last: new Int16Array(2).fill(-1) };
    if (slow) { paintCount(count, 1); return; }
    paintCount(count, 0);
    let raf = 0;
    const started = performance.now() + 450;
    const frame = (now: number) => { paintCount(count, (now - started) / COUNT_MS); if (now - started < COUNT_MS) raf = requestAnimationFrame(frame); };
    raf = requestAnimationFrame(frame);
    return () => cancelAnimationFrame(raf);
  }, [result, slow]);
  const done = (action: () => void) => (event: { currentTarget: HTMLButtonElement }) => { event.currentTarget.blur(); action(); };
  const finale = isFinale(result.level), last = result.level >= LEVEL_COUNT;
  return <div className="mr-end" data-slow={slow || undefined}>
    {finale && <p className="mr-end-finale">{worldOf(result.level).name} পার</p>}
    <StarsRow count={result.stars} label={`তিনটার মধ্যে ${bn(result.stars)}টা তারা`} />
    <h2>{endTitle(result.blocks)}</h2>
    <p className="mr-end-count">
      <span>{ICONS.blocks}<b ref={blocks}>{bn(result.blocks)}</b><i>/ {bn(result.fewest)}</i></span>
      <span><Art svg={SAMPLE} className="mr-end-rock" /><b ref={rocks}>{bn(result.rocks)}</b></span>
    </p>
    <p className="mr-method">{methodLine(result.blocks, result.fewest, result.runs, result.repeat)}</p>
    <div className="mr-fact"><span className="mr-fact-planet" aria-hidden="true" /><p><b>মঙ্গলের কথা</b>{factFor(result.level)}</p></div>
    <p className="mr-end-news">{NEWS[result.level - 1]}</p>
    {finale && <p className="mr-end-off">{TASKS[worldOf(result.level).id]}</p>}
    <div className="mr-end-actions">
      {!last && <button type="button" className="mr-big-next" onClick={done(onNext)}>{ICONS.next}<span>পরের লেভেল</span></button>}
      <div className="mr-end-pair">
        <button type="button" className="mr-big" onClick={done(onAgain)}>{ICONS.again}<span>আবার খেলো</span></button>
        <button type="button" className="mr-big mr-big-done" onClick={done(onDone)}>{ICONS.home}<span>শেষ</span></button>
      </div>
    </div>
    <ShowParentButton onClick={onShow} />
  </div>;
}

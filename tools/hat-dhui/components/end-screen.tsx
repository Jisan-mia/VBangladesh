"use client";
// The end of a round: a clean picture, the stars popping in, three counts ticking up, what to do next, then আবার খেলো and
// শেষ as two equal picture buttons (112 px), and আব্বু-আম্মুকে দেখাও. Nothing starts by itself.
import { useEffect, useRef } from "react";
import { Stars } from "../../../shared/game-ui";
import { ShowParentButton, bn } from "../../../shared/kids-kit";
import { SCENES, mouth } from "../lib/art";
import { BRUSH_TIP } from "../lib/card-data";
import type { ModeId } from "../lib/levels";
import { QUESTIONS } from "../lib/quiz";
import { BRUSH_ZONES, GERMS_EACH, WASH_STEPS, cardTitle, totalSeconds } from "../lib/routines";
import { COUNT_FRAMES, COUNT_MS, paintCount, type CountUp } from "./count.hot";
import { Icon, Picture } from "./icon";

export type Result = { mode: ModeId; stars: number; bedtime: boolean; firstTry: number };

/** The three numbers an end screen counts up to, with the words after them. */
export function countsOf(result: Result): { to: number; unit: string }[] {
  if (result.mode === "hat") return [{ to: WASH_STEPS.length, unit: "ধাপ" }, { to: WASH_STEPS.length * GERMS_EACH, unit: "জীবাণু পালাল" }, { to: totalSeconds(WASH_STEPS), unit: "সেকেন্ড" }];
  if (result.mode === "dat") return [{ to: BRUSH_ZONES.length, unit: "জায়গা" }, { to: BRUSH_ZONES.length * GERMS_EACH, unit: "জীবাণু পালাল" }, { to: totalSeconds(BRUSH_ZONES) / 60, unit: "মিনিট" }];
  return [{ to: QUESTIONS.length, unit: "সময়" }, { to: result.firstTry, unit: "প্রথমবারেই" }];
}

const countFrames = (to: number) => Array.from({ length: COUNT_FRAMES }, (_, frame) => bn(Math.round(to * frame / (COUNT_FRAMES - 1))));

export function EndScreen({ result, slow, onAgain, onDone, onShow }: { result: Result; slow: boolean; onAgain: () => void; onDone: () => void; onShow: () => void }) {
  const counts = countsOf(result);
  const nodes = useRef<(HTMLElement | null)[]>([]);
  useEffect(() => {
    const count: CountUp = { nodes: nodes.current, frames: counts.map(item => countFrames(item.to)), last: new Int16Array(counts.length).fill(-1) };
    if (slow) { paintCount(count, 1); return; }
    paintCount(count, 0);
    let raf = 0;
    const started = performance.now() + 450;
    const frame = (now: number) => { paintCount(count, (now - started) / COUNT_MS); if (now - started < COUNT_MS) raf = requestAnimationFrame(frame); };
    raf = requestAnimationFrame(frame);
    return () => cancelAnimationFrame(raf);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [result, slow]);
  const done = (action: () => void) => (event: { currentTarget: HTMLButtonElement }) => { event.currentTarget.blur(); action(); };
  return <div className="hd-end" data-slow={slow || undefined}>
    {result.mode === "hat" && <Picture svg={SCENES.clean} className="hd-end-pic" />}
    {result.mode === "dat" && <Picture svg={mouth(null)} className="hd-end-pic" />}
    {result.mode === "kokhon" && <ul className="hd-times" aria-hidden="true">{QUESTIONS.map(q => <li key={q.id}><Icon id={q.id} /></li>)}</ul>}
    <div className="hd-end-stars"><Stars count={result.stars} /></div>
    <h2>{cardTitle(result.mode, bn, QUESTIONS.length)}</h2>
    <p className="hd-end-count">{counts.map((item, at) => <span key={item.unit}><b ref={node => { nodes.current[at] = node; }}>{bn(item.to)}</b> {item.unit}</span>)}</p>
    {result.mode === "hat" && <ul className="hd-after-steps">
      <li><Picture svg={SCENES.rinse} className="hd-pic" /><span>এবার পানিতে ধুয়ে ফেলো</span></li>
      <li><Picture svg={SCENES.dry} className="hd-pic" /><span>গামছায় মুছে নাও</span></li>
    </ul>}
    {result.mode === "dat" && <>
      <p className="hd-end-note">এবার পেস্টটা থু করে ফেলো।</p>
      {result.bedtime && <p className="hd-badge"><Icon id="raat" /><span>রাতের ব্রাশের তারা। এবার ঘুম।</span></p>}
      <p className="hd-tip"><Icon id="mishti" /><span>{BRUSH_TIP}।</span></p>
    </>}
    <div className="hd-end-actions">
      <button type="button" className="hd-big" onClick={done(onAgain)}>
        <svg viewBox="0 0 48 48" aria-hidden="true"><path d="M38 24a14 14 0 1 1-4.1-9.9" /><path d="M35 6v9h-9" /></svg>
        <span>আবার খেলো</span>
      </button>
      <button type="button" className="hd-big hd-big-done" onClick={done(onDone)}>
        <svg viewBox="0 0 48 48" aria-hidden="true"><path d="M7 23L24 8l17 15" /><path d="M12 20v20h24V20" /><path d="M20 40V28h8v12" /></svg>
        <span>শেষ</span>
      </button>
    </div>
    <ShowParentButton onClick={onShow} />
  </div>;
}

"use client";
// The end of a round: the balance level in a picture, the stars, the counts ticking up, what the child can do now, a task off the
// screen, then আবার খেলো and শেষ as two equal picture buttons, and আব্বু-আম্মুকে দেখাও.
import { useEffect, useRef, type CSSProperties } from "react";
import { Stars } from "../../../shared/game-ui";
import { ShowParentButton } from "../../../shared/kids-kit";
import { bn, levelOf } from "../lib/levels";
import type { Piece } from "../lib/puzzle";
import type { Result } from "../lib/sim";
import { endLine, praiseLine } from "../lib/text";
import { Backdrop, MiniScale } from "./art";
import { COUNT_FRAMES, COUNT_MS, paintCount, type CountUp } from "./count.hot";

const countFrames = (to: number) => Array.from({ length: COUNT_FRAMES }, (_, frame) => bn(Math.round(to * frame / (COUNT_FRAMES - 1))));
const w = (value: number): Piece => ({ kind: "weight", value });

export function EndScreen({ result, slow, onAgain, onDone, onShow }: { result: Result; slow: boolean; onAgain: () => void; onDone: () => void; onShow: () => void }) {
  const spec = levelOf(result.level), praise = praiseLine(result.level, result.misses);
  const solved = useRef<HTMLElement>(null), exact = useRef<HTMLElement>(null);
  useEffect(() => {
    const count: CountUp = { nodes: [solved.current, exact.current], frames: [countFrames(result.solved), countFrames(result.exact)], last: new Int16Array(2).fill(-1) };
    if (slow) { paintCount(count, 1); return; }
    paintCount(count, 0);
    let raf = 0;
    const started = performance.now() + 450;
    const frame = (now: number) => { paintCount(count, (now - started) / COUNT_MS); if (now - started < COUNT_MS) raf = requestAnimationFrame(frame); };
    raf = requestAnimationFrame(frame);
    return () => cancelAnimationFrame(raf);
  }, [result, slow]);
  const done = (action: () => void) => (event: { currentTarget: HTMLButtonElement }) => { event.currentTarget.blur(); action(); };
  const kind = spec.kind;
  return <div className="dp-end" data-slow={slow || undefined}>
    <div className="dp-end-pic" aria-hidden="true"><Backdrop world={spec.world} /><MiniScale tilt={0} level
      left={kind === "guess" ? [{ kind: "star", value: 3 }, { kind: "star", value: 3 }] : kind === "find" ? [{ kind: "fruit", fruit: "kola", value: 4, hidden: false }] : [w(6)]} right={kind === "guess" ? [w(6)] : kind === "find" ? [w(2), w(2)] : [w(4), w(2)]} /></div>
    <div className="dp-end-stars"><Stars count={result.stars} /></div>
    <p className="dp-end-count dp-in" style={{ "--d": "120ms" } as CSSProperties}><span><b ref={solved}>{bn(result.solved)}</b>টা পাল্লা সমান</span><span aria-hidden="true">·</span><span><b ref={exact}>{bn(result.exact)}</b>টা প্রথমবারেই ঠিক</span></p>
    <p className="dp-end-news dp-in" style={{ "--d": "180ms" } as CSSProperties}>{spec.news}</p>
    {praise && <p className="dp-end-note dp-in" style={{ "--d": "220ms" } as CSSProperties}>{praise}</p>}
    <p className="dp-end-off dp-in" style={{ "--d": "260ms" } as CSSProperties}>{spec.task}</p>
    <p className="dp-sr">{endLine(result.level, result.solved)}</p>
    <div className="dp-end-actions">
      <button type="button" className="dp-big" onClick={done(onAgain)}>
        <svg viewBox="0 0 48 48" aria-hidden="true"><path d="M38 24a14 14 0 1 1-4.1-9.9" /><path d="M35 6v9h-9" /></svg>
        <span>আবার খেলো</span>
      </button>
      <button type="button" className="dp-big" onClick={done(onDone)}>
        <svg viewBox="0 0 48 48" aria-hidden="true"><path d="M8 34h32" /><path d="M24 34V14M14 14h20" /><path d="M10 22l4 12M38 22l-4 12" /></svg>
        <span>শেষ</span>
      </button>
    </div>
    <ShowParentButton onClick={onShow} />
  </div>;
}

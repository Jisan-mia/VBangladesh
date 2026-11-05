"use client";
// The end of a race: both boats at their ghats as a picture, the stars, the counts ticking up, what the child can do now, a
// task off the screen, then আবার খেলো and শেষ as two equal picture buttons, and আব্বু-আম্মুকে দেখাও. No winner is named.
import { useEffect, useRef, type CSSProperties } from "react";
import { Stars } from "../../../shared/game-ui";
import { ShowParentButton } from "../../../shared/kids-kit";
import { BOAT, BOATS } from "../lib/art";
import { bn, levelOf } from "../lib/levels";
import type { Result } from "../lib/sim";
import { COUNT_FRAMES, COUNT_MS, paintCount, type CountUp } from "./count.hot";

const countFrames = (to: number) => Array.from({ length: COUNT_FRAMES }, (_, frame) => bn(Math.round(to * frame / (COUNT_FRAMES - 1))));

/** The whole river in one row: a tile per ghat, the flag at the last, your boat and the other boat where they stopped. */
function Row({ result }: { result: Result }) {
  const n = result.n, cell = 300 / n, spots = [result.n, result.rivalAt];
  const at = (k: number) => 10 + (result.dir > 0 ? k : n + 1 - k) * cell - cell / 2;
  return <svg className="dg-row" viewBox="0 0 320 112" role="img" aria-label={result.dir > 0 ? `তোমার নৌকা ${bn(n)} নম্বর ঘাটে` : "তোমার নৌকা ঘরের ঘাটে"}>
    <defs><linearGradient id="dg-e-sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" style={{ stopColor: "var(--w-sky-top)" }} /><stop offset="1" style={{ stopColor: "var(--w-sky-low)" }} /></linearGradient></defs>
    <rect width="320" height="112" fill="url(#dg-e-sky)" />
    <rect y="56" width="320" height="20" style={{ fill: "var(--w-bank)" }} />
    <rect y="76" width="320" height="36" style={{ fill: "var(--w-water)" }} />
    {Array.from({ length: n }, (_, index) => {
      const k = index + 1, goal = k === n, x = 10 + (result.dir > 0 ? index : n - 1 - index) * cell;
      return <rect key={k} x={x + 1} y="58" width={Math.max(4, cell - 2)} height="16" rx="3" style={{ fill: goal ? "#f2a900" : "var(--w-tile)" }} />;
    })}
    {([1, 0] as const).map(player => {
      if (player === 1 && !result.rival) return null;
      const k = spots[player === 0 ? 0 : 1], s = player === 0 ? 0.62 : 0.46, x = Math.max(50 * s + 2, Math.min(318 - 50 * s, k === 0 ? (result.dir > 0 ? 18 : 302) : at(k)));
      return <g key={player} transform={`translate(${x - 50 * s} ${player === 0 ? 62 : 58}) scale(${s})`}>
        <g transform={result.dir < 0 ? "translate(100 0) scale(-1 1)" : undefined}>
          <path d={BOAT.roof} fill={BOATS[player].roof} /><path d={BOAT.hull} fill={BOATS[player].hull} /><path d={BOAT.pole} stroke="#5b4636" strokeWidth="2.5" /><path d={BOAT.flag} fill={BOATS[player].flag} />
        </g>
      </g>;
    })}
  </svg>;
}

export function EndScreen({ result, slow, onAgain, onDone, onShow }: { result: Result; slow: boolean; onAgain: () => void; onDone: () => void; onShow: () => void }) {
  const spec = levelOf(result.level);
  const spins = useRef<HTMLElement>(null), exact = useRef<HTMLElement>(null);
  useEffect(() => {
    const count: CountUp = { nodes: [spins.current, exact.current], frames: [countFrames(result.spins), countFrames(result.exact)], last: new Int16Array(2).fill(-1) };
    if (slow) { paintCount(count, 1); return; }
    paintCount(count, 0);
    let raf = 0;
    const started = performance.now() + 450;
    const frame = (now: number) => { paintCount(count, (now - started) / COUNT_MS); if (now - started < COUNT_MS) raf = requestAnimationFrame(frame); };
    raf = requestAnimationFrame(frame);
    return () => cancelAnimationFrame(raf);
  }, [result, slow]);
  const done = (action: () => void) => (event: { currentTarget: HTMLButtonElement }) => { event.currentTarget.blur(); action(); };
  return <div className="dg-end" data-slow={slow || undefined}>
    <Row result={result} />
    <div className="dg-end-stars"><Stars count={result.stars} /></div>
    <p className="dg-end-count dg-in" style={{ "--d": "120ms" } as CSSProperties}><span><b ref={spins}>{bn(result.spins)}</b> বার চরকি</span><span aria-hidden="true">·</span><span><b ref={exact}>{bn(result.exact)}</b>টা প্রথমবারেই ঠিক</span></p>
    <p className="dg-end-news dg-in" style={{ "--d": "180ms" } as CSSProperties}>{spec.news}</p>
    <p className="dg-end-off dg-in" style={{ "--d": "240ms" } as CSSProperties}>{spec.task}</p>
    <div className="dg-end-actions">
      <button type="button" className="dg-big" onClick={done(onAgain)}>
        <svg viewBox="0 0 48 48" aria-hidden="true"><path d="M38 24a14 14 0 1 1-4.1-9.9" /><path d="M35 6v9h-9" /></svg>
        <span>আবার খেলো</span>
      </button>
      <button type="button" className="dg-big" onClick={done(onDone)}>
        <svg viewBox="0 0 48 48" aria-hidden="true"><path d="M6 32q18 6 36 0" /><path d="M10 32L8 20h32l-2 12" /><path d="M24 20V6l10 5-10 5" /></svg>
        <span>শেষ</span>
      </button>
    </div>
    <ShowParentButton onClick={onShow} />
  </div>;
}

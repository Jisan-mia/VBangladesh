"use client";
// The end of a run: the stars pop in, the stage reached as a big plate, the stats count up, then the near-miss line and
// the numbered choices. The count-up is one rAF loop, cancelled on unmount; in slow mode everything shows at once.
import { useEffect, useRef, useState } from "react";
import { drawStage } from "../lib/art";
import { stageName } from "../lib/board";
import { bn } from "../lib/words";

export type EndStats = {
  kicker: string; why: string; won: boolean; stars: number; maxStars: number; showStars: boolean; top: number;
  moves: number; limit: number; score: number; pairs: number; streak: number; undos: number; seconds: number; weeds: number;
  swipe: string; line: string; near: string; best: string;
};
export type Choice = { label: string; run: () => void };
const COUNT_MS = 850;
const starAt = (index: number) => 0.3 + index * 0.28;

export function EndScreen({ stats, slow, choices, onCard }: { stats: EndStats; slow: boolean; choices: Choice[]; onCard: () => void }) {
  const [shown, setShown] = useState(slow ? 1 : 0);
  const plate = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    if (slow) { setShown(1); return; }
    let frame = 0;
    const start = performance.now();
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / COUNT_MS);
      setShown(1 - (1 - t) ** 3);
      if (t < 1) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [stats, slow]);
  useEffect(() => {
    const target = plate.current;
    if (!target) return;
    const ratio = Math.min(2, window.devicePixelRatio || 1), side = 96;
    target.width = target.height = side * ratio;
    const c = target.getContext("2d");
    if (!c) return;
    c.setTransform(ratio, 0, 0, ratio, 0, 0);
    drawStage(c, stats.top, 0, 0, side);
  }, [stats.top]);
  const count = (value: number) => bn(Math.round(value * shown));

  return (
    <div className="aa-end" data-slow={slow || undefined} data-won={stats.won || undefined}>
      <div className="aa-end-top">
        <canvas ref={plate} className="aa-end-plate" role="img" aria-label={`সবচেয়ে বড়: ${stageName(stats.top)}`} />
        <div>
          <p className="aa-end-kicker">{stats.kicker}</p>
          <p className="aa-end-why">{stats.why}</p>
          {stats.showStars && (
            <p className="gx-stars aa-end-stars" role="img" aria-label={`৩টার মধ্যে ${bn(stats.stars)}টা তারা`}>
              {[0, 1, 2].map(star => <span key={star} className={star < stats.stars ? "on gx-pop" : star >= stats.maxStars ? "aa-capped" : ""} style={{ animationDelay: `${starAt(star)}s` }}>★</span>)}
            </p>
          )}
        </div>
      </div>
      <ul className="aa-end-stats">
        <li><b>{count(stats.moves)}{stats.limit ? <small>/{bn(stats.limit)}</small> : null}</b><span>চাল</span></li>
        <li><b>{count(stats.score)}</b><span>পয়েন্ট</span></li>
        <li><b>{count(stats.pairs)}</b><span>জোড়া মিলেছে</span></li>
        <li><b>{count(stats.streak)}</b><span>টানা সেরা</span></li>
        <li><b>{count(stats.undos)}</b><span>ফেরত নিয়েছ</span></li>
        <li><b>{bn(Math.round(stats.seconds * shown))} সে.</b><span>সময়</span></li>
        {stats.weeds > 0 && <li><b>{count(stats.weeds)}</b><span>আগাছা তুলেছ</span></li>}
      </ul>
      {stats.swipe && <p className="aa-end-swipe">{stats.swipe}</p>}
      <p className="aa-end-line">{stats.line}</p>
      {stats.near && <p className="aa-end-near">{stats.near}</p>}
      {stats.best && <p className="aa-end-best">{stats.best}</p>}
      <ol className="aa-end-choices" data-count={choices.length}>
        {choices.map((choice, index) => (
          <li key={choice.label}>
            <button type="button" className={index === 0 ? "kit-primary" : "kit-secondary"} onClick={event => { event.currentTarget.blur(); choice.run(); }}>
              <kbd aria-hidden="true">{bn(index + 1)}</kbd>{choice.label}{index === 0 && <em>এটাই ভালো</em>}
            </button>
          </li>
        ))}
      </ol>
      <button type="button" className="kit-link aa-see" onClick={event => { event.currentTarget.blur(); onCard(); }}>কার্ড দেখো ↓</button>
    </div>
  );
}

"use client";
// The end of a round: the stars pop in, the load counts up, then real stats and numbered choices.
// The count-up is one rAF loop, cancelled on unmount; in slow mode everything shows at once.
import { useEffect, useRef, useState } from "react";
import { bn } from "../lib/link";

export type EndStats = {
  kicker: string; why: string;
  sacks: number; goal: number; stars: number; maxStars: number; levelRun: boolean;
  perfect: number; streak: number; lost: number; seconds: number; gusts: number;
  line: string; near: string; best: string; versus: string;
};
export type Choice = { label: string; run: () => void };

const COUNT_MS = 800;
const starAt = (index: number) => 0.3 + index * 0.28;
const tenths = new Intl.NumberFormat("bn-BD", { minimumFractionDigits: 1, maximumFractionDigits: 1 });

export function EndScreen({ stats, slow, choices, onCard }: { stats: EndStats; slow: boolean; choices: Choice[]; onCard: () => void }) {
  const [shown, setShown] = useState(slow ? 1 : 0);
  const box = useRef<HTMLDivElement>(null);
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
  const count = (value: number) => bn(Math.round(value * shown));

  return (
    <div className="bp-end" ref={box} data-slow={slow || undefined} data-won={stats.stars > 0 || undefined}>
      <p className="bp-end-kicker">{stats.kicker}</p>
      <p className="bp-end-why">{stats.why}</p>
      {stats.levelRun && (
        <p className="gx-stars bp-end-stars" role="img" aria-label={`৩টার মধ্যে ${bn(stats.stars)}টা তারা`}>
          {[0, 1, 2].map(star => <span key={star} className={star < stats.stars ? "on gx-pop" : star >= stats.maxStars ? "bp-capped" : ""} style={{ animationDelay: `${starAt(star)}s` }}>★</span>)}
        </p>
      )}
      <p className="bp-end-load" aria-label={stats.goal ? `${bn(stats.goal)}টার মধ্যে ${bn(stats.sacks)}টা বস্তা` : `${bn(stats.sacks)}টা বস্তা`}>
        <b aria-hidden="true">{count(stats.sacks)}</b>{stats.goal ? <span aria-hidden="true">/{bn(stats.goal)}</span> : null}টা বস্তা
      </p>
      <p className="bp-end-line">{stats.versus || stats.line}</p>
      <ul className="bp-end-stats">
        <li><b>{count(stats.perfect)} বার</b><span>ঠিক মাঝে</span></li>
        <li><b>{count(stats.streak)} বার</b><span>টানা ঠিক মাঝে</span></li>
        <li><b>{count(stats.lost)}টা</b><span>নদীতে পড়েছে</span></li>
        <li><b>{tenths.format(stats.seconds * shown)} সে.</b><span>সময়</span></li>
        {stats.gusts > 0 && <li><b>{count(stats.gusts)}টা</b><span>দমকা সামলেছ</span></li>}
      </ul>
      {stats.near && <p className="bp-end-near">{stats.near}</p>}
      {stats.best && <p className="bp-end-best">{stats.best}</p>}
      <ol className="bp-end-choices" data-count={choices.length}>
        {choices.map((choice, index) => (
          <li key={choice.label}>
            <button type="button" className={index === 0 ? "kit-primary" : "kit-secondary"} onClick={event => { event.currentTarget.blur(); choice.run(); }}>
              <kbd aria-hidden="true">{bn(index + 1)}</kbd>{choice.label}{index === 0 && <em>এটাই ভালো</em>}
            </button>
          </li>
        ))}
      </ol>
      <button type="button" className="kit-link" onClick={event => { event.currentTarget.blur(); onCard(); }}>কার্ডটা দেখো ↓</button>
    </div>
  );
}

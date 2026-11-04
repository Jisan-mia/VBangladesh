"use client";
// The end of a walk: the stars pop in, the time counts up, then real stats and three numbered choices.
// The count-up is one rAF loop, cancelled on unmount; in slow mode everything shows at once.
import { useEffect, useState } from "react";
import { bn, seconds } from "../lib/link";

export type EndStats = {
  kicker: string; tenths: number; stars: number; maxStars: number;
  steps: number; shortest: number; swipes: number; deadEnds: number; keys: number; rides: number; hasKeys: boolean; hasRides: boolean;
  line: string; near: string; best: string;
};
export type Choice = { label: string; run: () => void };

const COUNT_MS = 800;
const starAt = (index: number) => 0.3 + index * 0.28;

export function EndScreen({ stats, slow, choices, onCard }: { stats: EndStats; slow: boolean; choices: Choice[]; onCard: () => void }) {
  const [shown, setShown] = useState(slow ? stats.tenths : 0);
  useEffect(() => {
    if (slow) { setShown(stats.tenths); return; }
    let frame = 0;
    const start = performance.now();
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / COUNT_MS), eased = 1 - (1 - t) ** 3;
      setShown(Math.round(stats.tenths * eased));
      if (t < 1) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [stats.tenths, slow]);

  return (
    <div className="gd-end" data-slow={slow || undefined}>
      <p className="gd-end-kicker">{stats.kicker}</p>
      <div className="gd-end-head">
        <p className="gx-stars gd-end-stars" role="img" aria-label={`৩টার মধ্যে ${bn(stats.stars)}টা তারা`}>
          {[0, 1, 2].map(star => <span key={star} className={star < stats.stars ? "on gx-pop" : star >= stats.maxStars ? "gd-capped" : ""} style={{ animationDelay: `${starAt(star)}s` }}>★</span>)}
        </p>
        <p className="gd-end-time" aria-label={`${seconds(stats.tenths)} সেকেন্ড`}><b aria-hidden="true">{seconds(shown)}</b> সেকেন্ড</p>
      </div>
      <p className="gd-end-line">{stats.line}</p>
      <ul className="gd-end-stats">
        <li><b>{bn(stats.steps)} ঘর</b><span>হেঁটেছ, ছোট পথ {bn(stats.shortest)}</span></li>
        <li><b>{bn(stats.swipes)}টা</b><span>মোড়ে দিক বেছেছ</span></li>
        <li><b>{bn(stats.deadEnds)}টা</b><span>কানাগলি</span></li>
        {stats.hasKeys && <li><b>{bn(stats.keys)}টা</b><span>চাবি</span></li>}
        {stats.hasRides && <li><b>{bn(stats.rides)} বার</b><span>রিকশায়</span></li>}
      </ul>
      {stats.near && <p className="gd-end-near">{stats.near}</p>}
      {stats.best && <p className="gd-end-best">{stats.best}</p>}
      <ol className="gd-end-choices">
        {choices.map((choice, index) => (
          <li key={choice.label}>
            <button type="button" className={index === 0 ? "kit-primary" : "kit-secondary"} onClick={event => { event.currentTarget.blur(); choice.run(); }}>
              <kbd aria-hidden="true">{bn(index + 1)}</kbd>{choice.label}{index === 0 && <em>এটাই ভালো</em>}
            </button>
          </li>
        ))}
      </ol>
      <button type="button" className="kit-link gd-end-card" onClick={event => { event.currentTarget.blur(); onCard(); }}>কার্ডটা দেখো ↓</button>
    </div>
  );
}

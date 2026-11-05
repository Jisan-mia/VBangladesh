"use client";
// The end of a round: the stars pop in, the score counts up, then real stats and numbered choices.
// The count-up is one rAF loop, cancelled on unmount; in slow mode everything shows at once.
import { useEffect, useState } from "react";
import { bn } from "../lib/link";

export type EndStats = {
  kicker: string; why: string;
  stars: number; maxStars: number; levelRun: boolean; cleared: boolean;
  score: number; pots: number; total: number; flight: number; lost: number; throws: number; seconds: number;
  line: string; near: string; best: string; versus: string;
};
export type Choice = { label: string; run: () => void };

const COUNT_MS = 800;
const starAt = (index: number) => 0.3 + index * 0.28;
const tenths = new Intl.NumberFormat("bn-BD", { minimumFractionDigits: 1, maximumFractionDigits: 1 });

export function EndScreen({ stats, slow, choices, onCard }: { stats: EndStats; slow: boolean; choices: Choice[]; onCard: () => void }) {
  const [shown, setShown] = useState(slow ? 1 : 0);
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
    <div className="hb-end" data-slow={slow || undefined} data-won={stats.cleared || undefined}>
      <p className="hb-end-kicker">{stats.kicker}</p>
      <p className="hb-end-why">{stats.why}</p>
      {stats.levelRun && (
        <p className="gx-stars hb-end-stars" role="img" aria-label={`৩টার মধ্যে ${bn(stats.stars)}টা তারা`}>
          {[0, 1, 2].map(star => <span key={star} className={star < stats.stars ? "on gx-pop" : star >= stats.maxStars ? "hb-capped" : ""} style={{ animationDelay: `${starAt(star)}s` }}>★</span>)}
        </p>
      )}
      <p className="hb-end-score" aria-label={`${bn(stats.score)} পয়েন্ট`}><b aria-hidden="true">{count(stats.score)}</b> পয়েন্ট</p>
      <p className="hb-end-line">{stats.versus || stats.line}</p>
      <ul className="hb-end-stats">
        <li><b>{count(stats.pots)}/{bn(stats.total)}</b><span>হাঁড়ি</span></li>
        <li><b>{count(stats.flight)}টা</b><span>এক ছোড়ায় সর্বোচ্চ</span></li>
        <li><b>{count(stats.lost)}টা</b><span>বল হারানো</span></li>
        <li><b>{count(stats.throws)} বার</b><span>ছোড়া</span></li>
        <li><b>{tenths.format(stats.seconds * shown)} সে.</b><span>সময়</span></li>
      </ul>
      {stats.near && <p className="hb-end-near">{stats.near}</p>}
      {stats.best && <p className="hb-end-best">{stats.best}</p>}
      <ol className="hb-end-choices" data-count={choices.length}>
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

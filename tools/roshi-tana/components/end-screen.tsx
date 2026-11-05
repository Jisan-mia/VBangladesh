"use client";
// The end of a match: the stars pop in, the beat count counts up, then real stats and numbered choices.
// The count-up is one rAF loop, cancelled on unmount; in slow mode everything shows at once.
import { useEffect, useState } from "react";
import { bn } from "../lib/link";

export type EndStats = {
  won: boolean; kicker: string; title: string;
  beats: number; stars: number; maxStars: number;
  perfect: number; good: number; slips: number; missed: number; wrongRests: number; best: number;
  /** Heave beats faced and held (finales only). */
  heaves: number; held: number;
  line: string; near: string; record: string;
};
export type Choice = { label: string; run: () => void };

const COUNT_MS = 800;
const starAt = (index: number) => 0.3 + index * 0.28;

export function EndScreen({ stats, slow, choices, onCard }: { stats: EndStats; slow: boolean; choices: Choice[]; onCard: (() => void) | null }) {
  const [shown, setShown] = useState(slow ? stats.beats : 0);
  useEffect(() => {
    if (slow) { setShown(stats.beats); return; }
    let frame = 0;
    const start = performance.now();
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / COUNT_MS), eased = 1 - (1 - t) ** 3;
      setShown(Math.round(stats.beats * eased));
      if (t < 1) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [stats.beats, slow]);

  return (
    <div className="rt-end" data-won={stats.won || undefined} data-slow={slow || undefined}>
      <p className="rt-end-kicker">{stats.kicker}</p>
      {stats.won ? (
        <p className="gx-stars rt-end-stars" role="img" aria-label={`৩টার মধ্যে ${bn(stats.stars)}টা তারা`}>
          {[0, 1, 2].map(star => <span key={star} className={star < stats.stars ? "on gx-pop" : star >= stats.maxStars ? "rt-capped" : ""} style={{ animationDelay: `${starAt(star)}s` }}>★</span>)}
        </p>
      ) : <p className="rt-end-lost">{stats.title}</p>}
      <p className="rt-end-beats" aria-label={`${bn(stats.beats)} টান`}><b aria-hidden="true">{bn(shown)}</b> টান</p>
      <p className="rt-end-line">{stats.line}</p>
      <ul className="rt-end-stats">
        <li data-tone="gold"><b>{bn(stats.perfect)}</b><span>ঠিক তালে</span></li>
        <li><b>{bn(stats.good)}</b><span>চলবে</span></li>
        <li data-tone="bad"><b>{bn(stats.slips)}</b><span>ফসকেছে</span></li>
        {stats.missed > 0 && <li><b>{bn(stats.missed)}</b><span>ছুটে গেছে</span></li>}
        <li><b>{bn(stats.best)}</b><span>টানা সেরা</span></li>
        {stats.heaves > 0 && <li data-tone="gold"><b>{bn(stats.held)}/{bn(stats.heaves)}</b><span>হেঁইয়ো ঠেকিয়েছ</span></li>}
      </ul>
      {stats.near && <p className="rt-end-near">{stats.near}</p>}
      {stats.record && <p className="rt-end-best">{stats.record}</p>}
      <ol className="rt-end-choices" data-count={choices.length}>
        {choices.map((choice, index) => (
          <li key={choice.label}>
            <button type="button" className={index === 0 ? "kit-primary" : "kit-secondary"} onClick={event => { event.currentTarget.blur(); choice.run(); }}>
              <kbd aria-hidden="true">{bn(index + 1)}</kbd>{choice.label}{index === 0 && <em>এটাই ভালো</em>}
            </button>
          </li>
        ))}
      </ol>
      {onCard && <button type="button" className="kit-link rt-see" onClick={event => { event.currentTarget.blur(); onCard(); }}>কার্ডটা দেখো ↓</button>}
    </div>
  );
}

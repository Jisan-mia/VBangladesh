"use client";
// The end of a match: the stars pop in, the score counts up, then real stats and numbered choices.
// The count-up is one rAF loop, cancelled on unmount; in slow mode everything shows at once.
import { useEffect, useState } from "react";
import { bn } from "../lib/lines";

export type EndStats = {
  won: boolean; kicker: string; title: string;
  us: number; them: number; stars: number; maxStars: number;
  hits: number; perfect: number; longest: number; smashWins: number; dropWins: number; leftOut: number; faults: number;
  /** The finale's named move: its name, faced and held. */
  move: string; specials: number; held: number;
  line: string; near: string; record: string;
};
export type Choice = { label: string; run: () => void };

const COUNT_MS = 700;
const starAt = (index: number) => 0.3 + index * 0.28;

export function EndScreen({ stats, slow, choices, onCard }: { stats: EndStats; slow: boolean; choices: Choice[]; onCard: (() => void) | null }) {
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
  const up = (value: number) => bn(Math.round(value * shown));

  return (
    <div className="gb-end" data-won={stats.won || undefined}>
      <p className="gb-end-kicker">{stats.kicker}</p>
      {stats.won ? (
        <p className="gx-stars gb-end-stars" role="img" aria-label={`৩টার মধ্যে ${bn(stats.stars)}টা তারা`}>
          {[0, 1, 2].map(star => <span key={star} className={star < stats.stars ? "on gx-pop" : star >= stats.maxStars ? "gb-capped" : ""} style={{ animationDelay: `${starAt(star)}s` }}>★</span>)}
        </p>
      ) : <p className="gb-end-lost">{stats.title}</p>}
      <p className="gb-end-score" aria-label={`পয়েন্ট ${bn(stats.us)}–${bn(stats.them)}`}><b aria-hidden="true">{up(stats.us)}–{up(stats.them)}</b></p>
      <p className="gb-end-line">{stats.line}</p>
      <ul className="gb-end-stats">
        <li data-tone="gold"><b>{up(stats.perfect)}/{bn(stats.hits)}</b><span>সোনালি মার</span></li>
        <li><b>{up(stats.longest)}</b><span>লম্বা র‍্যালি</span></li>
        {stats.smashWins > 0 && <li><b>{up(stats.smashWins)}</b><span>স্ম্যাশে পয়েন্ট</span></li>}
        {stats.dropWins > 0 && <li><b>{up(stats.dropWins)}</b><span>ড্রপে পয়েন্ট</span></li>}
        {stats.leftOut > 0 && <li><b>{up(stats.leftOut)}</b><span>বাইরে ছেড়েছ</span></li>}
        {stats.faults > 0 && <li data-tone="bad"><b>{up(stats.faults)}</b><span>জালে/বাইরে</span></li>}
        {stats.specials > 0 && <li data-tone="gold"><b>{bn(stats.held)}/{bn(stats.specials)}</b><span>{stats.move} ঠেকিয়েছ</span></li>}
      </ul>
      {stats.near && <p className="gb-end-near">{stats.near}</p>}
      {stats.record && <p className="gb-end-best">{stats.record}</p>}
      <ol className="gb-end-choices" data-count={choices.length}>
        {choices.map((choice, index) => (
          <li key={choice.label}>
            <button type="button" className={index === 0 ? "kit-primary" : "kit-secondary"} onClick={event => { event.currentTarget.blur(); choice.run(); }}>
              <kbd aria-hidden="true">{bn(index + 1)}</kbd>{choice.label}{index === 0 && <em>এটাই ভালো</em>}
            </button>
          </li>
        ))}
      </ol>
      {onCard && <button type="button" className="kit-link gb-see" onClick={event => { event.currentTarget.blur(); onCard(); }}>কার্ডটা দেখো ↓</button>}
    </div>
  );
}

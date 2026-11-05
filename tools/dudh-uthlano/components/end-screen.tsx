"use client";
// The end of a round: the stars pop in, the average counts up, then real stats and numbered choices.
// The count-up is one rAF loop, cancelled on unmount; in slow mode everything shows at once.
import { useEffect, useRef } from "react";
import { bn } from "../lib/challenge";

export type EndStats = {
  won: boolean; kicker: string; title: string;
  average: number; stars: number; maxStars: number;
  /** The best pot, the pots at 90% or more, the pots that boiled over, and seconds on the stove. */
  best: number; close: number; spills: number; seconds: number;
  scores: number[]; spilled: boolean[]; boss: boolean;
  line: string; near: string; record: string;
};
export type Choice = { label: string; run: () => void };

const COUNT_MS = 800;
const starAt = (index: number) => 0.3 + index * 0.28;

export function EndScreen({ stats, slow, choices, onCard }: { stats: EndStats; slow: boolean; choices: Choice[]; onCard: (() => void) | null }) {
  // The count writes the number straight into the text node: no re-render per frame.
  const number = useRef<HTMLElement>(null);
  useEffect(() => {
    const el = number.current;
    if (!el) return;
    if (slow) { el.textContent = bn(stats.average) + "%"; return; }
    let frame = 0;
    const start = performance.now();
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / COUNT_MS), eased = 1 - (1 - t) ** 3;
      el.textContent = bn(Math.round(stats.average * eased)) + "%";
      if (t < 1) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [stats.average, slow]);

  const last = stats.scores.length - 1;
  return (
    <div className="du-end" data-won={stats.won || undefined} data-slow={slow || undefined}>
      <p className="du-end-kicker">{stats.kicker}</p>
      {stats.won ? (
        <p className="gx-stars du-end-stars" role="img" aria-label={`৩টার মধ্যে ${bn(stats.stars)}টা তারা`}>
          {[0, 1, 2].map(star => <span key={star} className={star < stats.stars ? "on gx-pop" : star >= stats.maxStars ? "du-capped" : ""} style={{ animationDelay: `${starAt(star)}s` }}>★</span>)}
        </p>
      ) : <p className="du-end-lost">{stats.title}</p>}
      <p className="du-end-avg" aria-label={`গড় ${bn(stats.average)}%`}><b aria-hidden="true" ref={number}>{bn(slow ? stats.average : 0)}%</b> গড়</p>
      <ol className="du-end-pots" aria-label="প্রতিটা পাতিলের স্কোর" style={{ gridTemplateColumns: `repeat(${stats.scores.length}, minmax(0, 1fr))` }}>
        {stats.scores.map((score, index) => (
          <li key={index} data-state={stats.spilled[index] ? "spill" : "ok"} data-boss={stats.boss && index === last ? "" : undefined}>
            <span>{bn(index + 1)}{stats.boss && index === last ? " ×২" : ""}</span><b>{stats.spilled[index] ? "উথলেছে" : `${bn(score)}%`}</b>
          </li>
        ))}
      </ol>
      <p className="du-end-line">{stats.line}</p>
      <ul className="du-end-stats">
        <li data-tone="gold"><b>{bn(stats.best)}%</b><span>সেরা পাতিল</span></li>
        <li data-tone={stats.close ? "gold" : undefined}><b>{bn(stats.close)}</b><span>৯০%-এর ওপরে</span></li>
        <li data-tone={stats.spills ? "bad" : "gold"}><b>{bn(stats.spills)}</b><span>উথলেছে</span></li>
        <li><b>{bn(stats.seconds)}</b><span>সেকেন্ড চুলায়</span></li>
      </ul>
      {stats.near && <p className="du-end-near">{stats.near}</p>}
      {stats.record && <p className="du-end-best">{stats.record}</p>}
      <ol className="du-end-choices" data-count={choices.length}>
        {choices.map((choice, index) => (
          <li key={choice.label}>
            <button type="button" className={index === 0 ? "kit-primary" : "kit-secondary"} onClick={event => { event.currentTarget.blur(); choice.run(); }}>
              <kbd aria-hidden="true">{bn(index + 1)}</kbd>{choice.label}{index === 0 && <em>এটাই ভালো</em>}
            </button>
          </li>
        ))}
      </ol>
      {onCard && <button type="button" className="kit-link du-see" onClick={event => { event.currentTarget.blur(); onCard(); }}>কার্ডটা দেখো ↓</button>}
    </div>
  );
}

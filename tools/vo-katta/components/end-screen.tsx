"use client";
// The end of an evening: the stars pop in, the cuts count up, then real stats and three numbered choices.
// The count-up is one rAF loop, cancelled on unmount; in slow mode everything shows at once.
import { useEffect, useRef, useState } from "react";
import { bn, seconds } from "../lib/link";

export type EndStats = {
  level: number; name: string; title: string; won: boolean;
  cuts: number; rivals: number; lost: number; tenths: number; stars: number; maxStars: number;
  /** Tenths of the quickest প্যাঁচ won, or 0. */
  fastest: number; bestStreak: number; yanks: number; yankHits: number; gusts: number; tangles: number;
  line: string; near: string; best: string;
};
export type Choice = { label: string; run: () => void };

const COUNT_MS = 700;
const starAt = (index: number) => 0.3 + index * 0.28;

export function EndScreen({ stats, slow, choices, onCard }: { stats: EndStats; slow: boolean; choices: Choice[]; onCard: () => void }) {
  const [shown, setShown] = useState(slow ? stats.cuts : 0);
  useEffect(() => {
    if (slow) { setShown(stats.cuts); return; }
    let frame = 0;
    const start = performance.now();
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / COUNT_MS), eased = 1 - (1 - t) ** 3;
      setShown(Math.round(stats.cuts * eased));
      if (t < 1) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [stats.cuts, slow]);

  return (
    <div className="vk-end" data-slow={slow || undefined} data-won={stats.won || undefined}>
      <p className="vk-end-kicker">{stats.won ? `লেভেল ${bn(stats.level)} পার` : `লেভেল ${bn(stats.level)}`} · {stats.name}</p>
      {stats.won ? (
        <p className="gx-stars vk-end-stars" role="img" aria-label={`৩টার মধ্যে ${bn(stats.stars)}টা তারা`}>
          {[0, 1, 2].map(star => <span key={star} className={star < stats.stars ? "on gx-pop" : star >= stats.maxStars ? "vk-capped" : ""} style={{ animationDelay: `${starAt(star)}s` }}>★</span>)}
        </p>
      ) : <p className="vk-end-out">নাটাইয়ে আর ঘুড়ি নেই</p>}
      <p className="vk-end-count" aria-label={`${bn(stats.rivals)}টার মধ্যে ${bn(stats.cuts)}টা ঘুড়ি কেটেছ`}><b aria-hidden="true">{bn(shown)}</b><span aria-hidden="true">/{bn(stats.rivals)}</span> ঘুড়ি কাটলে</p>
      <p className="vk-end-line">{stats.line}</p>
      <ul className="vk-end-stats">
        <li><b>{seconds(stats.tenths)} সে.</b><span>সময়</span></li>
        <li><b>{bn(stats.lost)}টা</b><span>ঘুড়ি হারালে</span></li>
        {stats.fastest > 0 && <li><b>{seconds(stats.fastest)} সে.</b><span>সবচেয়ে ছোট প্যাঁচ</span></li>}
        {stats.bestStreak > 1 && <li><b>টানা {bn(stats.bestStreak)}টা</b><span>না হারিয়ে কাটা</span></li>}
        {stats.yanks + stats.yankHits > 0 && <li><b>{bn(stats.yanks)}/{bn(stats.yanks + stats.yankHits)}</b><span>ঝটকায় ঢিল দিলে</span></li>}
        {stats.gusts > 0 && <li><b>{bn(stats.gusts)}টা</b><span>দমকা সামলেছ</span></li>}
        {stats.tangles > 0 && <li><b>{bn(stats.tangles)} বার</b><span>ফানুসে জট</span></li>}
      </ul>
      {stats.near && <p className="vk-end-near">{stats.near}</p>}
      {stats.best && <p className="vk-end-best">{stats.best}</p>}
      <ol className="vk-end-choices">
        {choices.map((choice, index) => (
          <li key={choice.label}>
            <button type="button" className={index === 0 ? "kit-primary" : "kit-secondary"} onClick={event => { event.currentTarget.blur(); choice.run(); }}>
              <kbd aria-hidden="true">{bn(index + 1)}</kbd>{choice.label}{index === 0 && <em>এটাই ভালো</em>}
            </button>
          </li>
        ))}
      </ol>
      <button type="button" className="kit-link vk-end-card" onClick={event => { event.currentTarget.blur(); onCard(); }}>কার্ডটা দেখো ↓</button>
    </div>
  );
}

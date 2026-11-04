"use client";
// The end of an evening: the stars pop in, the time counts up, then real stats and three numbered choices.
// The count-up is one rAF loop, cancelled on unmount; in slow mode everything shows at once.
import { useEffect, useRef, useState } from "react";
import { bn, channelName, seconds } from "../lib/antenna";

export type EndStats = {
  level: number; name: string; tenths: number; stars: number; maxStars: number;
  /** Seconds per channel. */
  splits: number[]; slips: number; gusts: number;
  line: string; near: string; best: string;
};
export type Choice = { label: string; run: () => void };

const COUNT_MS = 800;
const starAt = (index: number) => 0.3 + index * 0.28;

export function EndScreen({ stats, slow, choices, onCard }: { stats: EndStats; slow: boolean; choices: Choice[]; onCard: () => void }) {
  const [shown, setShown] = useState(slow ? stats.tenths : 0);
  const first = useRef<HTMLButtonElement>(null);
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

  const fastest = stats.splits.reduce((best, time, index) => time < stats.splits[best] ? index : best, 0);
  return (
    <div className="at-end" data-slow={slow || undefined}>
      <p className="at-end-kicker">লেভেল {bn(stats.level)} পার · {stats.name}</p>
      <p className="gx-stars at-end-stars" role="img" aria-label={`৩টার মধ্যে ${bn(stats.stars)}টা তারা`}>
        {[0, 1, 2].map(star => <span key={star} className={star < stats.stars ? "on gx-pop" : star >= stats.maxStars ? "at-capped" : ""} style={{ animationDelay: `${starAt(star)}s` }}>★</span>)}
      </p>
      <p className="at-end-time" aria-label={`${seconds(stats.tenths)} সেকেন্ড`}><b aria-hidden="true">{seconds(shown)}</b> সেকেন্ড</p>
      <p className="at-end-line">{stats.line}</p>
      <ul className="at-end-stats">
        <li><b>{seconds(Math.round(stats.splits[fastest] * 10))} সে.</b><span>সবচেয়ে তাড়াতাড়ি, {channelName(fastest)}</span></li>
        <li><b>{bn(stats.slips)} বার</b><span>ছবি সরে গেছে</span></li>
        {stats.gusts > 0 && <li><b>{bn(stats.gusts)}টা</b><span>দমকা সামলেছ</span></li>}
      </ul>
      {stats.near && <p className="at-end-near">{stats.near}</p>}
      {stats.best && <p className="at-end-best">{stats.best}</p>}
      <ol className="at-end-choices">
        {choices.map((choice, index) => (
          <li key={choice.label}>
            <button ref={index === 0 ? first : undefined} type="button" className={index === 0 ? "kit-primary" : "kit-secondary"} onClick={event => { event.currentTarget.blur(); choice.run(); }}>
              <kbd aria-hidden="true">{bn(index + 1)}</kbd>{choice.label}{index === 0 && <em>এটাই ভালো</em>}
            </button>
          </li>
        ))}
      </ol>
      <button type="button" className="kit-link" onClick={event => { event.currentTarget.blur(); onCard(); }}>কার্ডটা দেখো ↓</button>
    </div>
  );
}

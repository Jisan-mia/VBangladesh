"use client";
// The end of a round: a slip rises over the lane. The stars pop in (their chimes are scheduled tones, so a pause cuts them),
// the real stats count up over 0.8 s (at once in ধীরে খেলো), then the near-miss line and numbered choices.
import { useEffect, useState } from "react";
import { bn } from "../lib/words";

export type EndStats = {
  kicker: string; line: string; cleared: boolean; stars: number; levelRun: boolean;
  balls: number; first: number; flew: number; caught: number; back: number; seconds: number;
  near: string; versus: string;
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
    setShown(0);
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [stats, slow]);
  const count = (value: number) => bn(Math.round(value * shown));

  return (
    <div className="sc-end" data-won={stats.cleared || undefined} role="status">
      <p className="sc-end-kicker">{stats.kicker}</p>
      {stats.cleared && stats.levelRun && (
        <p className="gx-stars sc-end-stars" role="img" aria-label={`৩টার মধ্যে ${bn(stats.stars)}টা তারা`}>
          {[0, 1, 2].map(star => <span key={star} className={star < stats.stars ? "on gx-pop" : ""} style={{ animationDelay: `${starAt(star)}s` }}>★</span>)}
        </p>
      )}
      <p className="sc-end-line">{stats.versus || stats.line}</p>
      <ul className="sc-end-stats">
        <li><b>{count(stats.balls)}টা</b><span>বল</span></li>
        <li><b>{count(stats.first)}/৭</b><span>প্রথম বলে পড়ল</span></li>
        <li><b>{count(stats.flew)} হাত</b><span>সবচেয়ে দূরে ছিটকাল</span></li>
        {stats.caught > 0 && <li><b>{count(stats.caught)} বার</b><span>মিঠু ধরেছে</span></li>}
        {stats.back > 0 && <li><b>{count(stats.back)}টা</b><span>টুনি সাজিয়েছে</span></li>}
        <li><b>{tenths.format(stats.seconds * shown)} সে.</b><span>সময়</span></li>
      </ul>
      {stats.near && <p className="sc-end-near">{stats.near}</p>}
      <ol className="sc-end-choices" data-count={choices.length}>
        {choices.map((choice, index) => (
          <li key={choice.label}>
            <button type="button" className={index === 0 ? "kit-primary" : "kit-secondary"} onClick={event => { event.currentTarget.blur(); choice.run(); }}>
              <kbd aria-hidden="true">{bn(index + 1)}</kbd>{choice.label}{index === 0 && <em>এটাই ভালো</em>}
            </button>
          </li>
        ))}
      </ol>
      <button type="button" className="kit-link sc-end-card" onClick={event => { event.currentTarget.blur(); onCard(); }}>কার্ড বানাও, বন্ধুকে পাঠাও ↓</button>
    </div>
  );
}

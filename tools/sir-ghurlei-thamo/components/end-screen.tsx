"use client";
// The end of a class: the stars pop in, the time counts up, then real stats and numbered choices.
// The count-up is one rAF loop, cancelled on unmount; in slow mode everything shows at once.
import { useEffect, useState } from "react";
import { bn, seconds } from "../lib/challenge";

export type EndStats = {
  won: boolean; kicker: string; title: string;
  tenths: number; stars: number; maxStars: number;
  catches: number; close: number; braved: number; throws: number;
  /** Shown only where the class has them. */
  fakes: boolean; sleepers: boolean; lives: number;
  line: string; near: string; record: string;
};
export type Choice = { label: string; run: () => void };

const COUNT_MS = 800;
const starAt = (index: number) => 0.3 + index * 0.28;

export function EndScreen({ stats, slow, choices, onCard }: { stats: EndStats; slow: boolean; choices: Choice[]; onCard: (() => void) | null }) {
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
    <div className="sg-end" data-won={stats.won || undefined} data-slow={slow || undefined}>
      <p className="sg-end-kicker">{stats.kicker}</p>
      {stats.won ? (
        <p className="gx-stars sg-end-stars" role="img" aria-label={`৩টার মধ্যে ${bn(stats.stars)}টা তারা`}>
          {[0, 1, 2].map(star => <span key={star} className={star < stats.stars ? "on gx-pop" : star >= stats.maxStars ? "sg-capped" : ""} style={{ animationDelay: `${starAt(star)}s` }}>★</span>)}
        </p>
      ) : <p className="sg-end-lost">{stats.title}</p>}
      {stats.won && <p className="sg-end-time" aria-label={`${seconds(stats.tenths)} সেকেন্ড`}><b aria-hidden="true">{seconds(shown)}</b> সেকেন্ড</p>}
      <p className="sg-end-line">{stats.line}</p>
      <ul className="sg-end-stats">
        <li data-tone={stats.catches ? "bad" : "gold"}><b>{bn(stats.catches)}</b><span>ধরা পড়েছ</span></li>
        <li data-tone={stats.close ? "gold" : undefined}><b>{bn(stats.close)}</b><span>অল্পের জন্য বেঁচেছ</span></li>
        {stats.fakes && <li><b>{bn(stats.braved)}</b><span>ভুয়া ঘোরায় চালিয়েছ</span></li>}
        {stats.sleepers && <li><b>{bn(stats.throws)}</b><span>ছুড়ে দেওয়া</span></li>}
        {stats.lives > 0 && <li data-tone={stats.won ? "gold" : "bad"}><b>{bn(Math.max(0, stats.lives - stats.catches))}/{bn(stats.lives)}</b><span>সুযোগ বাকি</span></li>}
      </ul>
      {stats.near && <p className="sg-end-near">{stats.near}</p>}
      {stats.record && <p className="sg-end-best">{stats.record}</p>}
      <ol className="sg-end-choices" data-count={choices.length}>
        {choices.map((choice, index) => (
          <li key={choice.label}>
            <button type="button" className={index === 0 ? "kit-primary" : "kit-secondary"} onClick={event => { event.currentTarget.blur(); choice.run(); }}>
              <kbd aria-hidden="true">{bn(index + 1)}</kbd>{choice.label}{index === 0 && <em>এটাই ভালো</em>}
            </button>
          </li>
        ))}
      </ol>
      {onCard && <button type="button" className="kit-link sg-see" onClick={event => { event.currentTarget.blur(); onCard(); }}>কার্ডটা দেখো ↓</button>}
    </div>
  );
}

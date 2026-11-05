"use client";
// The end of a level: the stars pop in, the weight counts up, then real stats and three numbered choices.
// The count-up is one rAF loop, cancelled on unmount; in slow mode everything shows at once.
import { useEffect, useState } from "react";
import { bn, secondsText, weightText } from "../lib/lines";

export type EndStats = {
  level: number; title: string; world: string; won: boolean; boss: string;
  catches: number; need: number; grams: number; stars: number; maxStars: number;
  big: string; casts: number; lost: number; fastest: number; surges: number; jumps: number; rushes: number;
  line: string; near: string; best: string;
};
export type Choice = { label: string; run: () => void };

const COUNT_MS = 800;
const starAt = (index: number) => 0.3 + index * 0.28;

export function EndScreen({ stats, slow, choices, onCard }: { stats: EndStats; slow: boolean; choices: Choice[]; onCard: () => void }) {
  const [shown, setShown] = useState(slow ? stats.grams : 0);
  useEffect(() => {
    if (slow) { setShown(stats.grams); return; }
    let frame = 0;
    const start = performance.now();
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / COUNT_MS), eased = 1 - (1 - t) ** 3;
      setShown(Math.round((stats.grams * eased) / 10) * 10);
      if (t < 1) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [stats.grams, slow]);

  return (
    <div className="cf-end" data-slow={slow || undefined} data-won={stats.won || undefined}>
      <p className="cf-end-kicker">{stats.won ? `লেভেল ${bn(stats.level)} পার` : `লেভেল ${bn(stats.level)}`} · {stats.title}</p>
      {stats.won ? (
        <p className="gx-stars cf-end-stars" role="img" aria-label={`৩টার মধ্যে ${bn(stats.stars)}টা তারা`}>
          {[0, 1, 2].map(star => <span key={star} className={star < stats.stars ? "on gx-pop" : star >= stats.maxStars ? "cf-capped" : ""} style={{ animationDelay: `${starAt(star)}s` }}>★</span>)}
        </p>
      ) : <p className="cf-end-out">টোপ শেষ</p>}
      <p className="cf-end-count" aria-label={`ঝুড়িতে ${weightText(stats.grams)}`}><b aria-hidden="true">{weightText(shown)}</b></p>
      <p className="cf-end-line">{stats.line}</p>
      <ul className="cf-end-stats">
        <li><b>{bn(stats.catches)}/{bn(stats.need)}টা</b><span>মাছ</span></li>
        {stats.big && <li><b>{stats.big}</b><span>সবচেয়ে বড়</span></li>}
        <li><b>{bn(stats.casts)} বার</b><span>ছিপ ফেলেছ</span></li>
        <li><b>{bn(stats.lost)}টা</b><span>টোপ গেছে</span></li>
        {stats.fastest > 0 && <li><b>{secondsText(stats.fastest)} সে.</b><span>সবচেয়ে ছোট টান</span></li>}
        {stats.surges > 0 && <li><b>{bn(stats.surges)}টা</b><span>ঘাই সামলেছ</span></li>}
        {stats.jumps > 0 && <li><b>{bn(stats.jumps)}টা</b><span>লাফ সামলেছ</span></li>}
        {stats.rushes > 0 && <li><b>{bn(stats.rushes)} বার</b><span>ছুটে আসা থামিয়েছ</span></li>}
      </ul>
      {stats.near && <p className="cf-end-near">{stats.near}</p>}
      {stats.best && <p className="cf-end-best">{stats.best}</p>}
      <ol className="cf-end-choices">
        {choices.map((choice, index) => (
          <li key={choice.label}>
            <button type="button" className={index === 0 ? "kit-primary" : "kit-secondary"} onClick={event => { event.currentTarget.blur(); choice.run(); }}>
              <kbd aria-hidden="true">{bn(index + 1)}</kbd>{choice.label}{index === 0 && <em>এটাই ভালো</em>}
            </button>
          </li>
        ))}
      </ol>
      <button type="button" className="kit-link cf-end-card" onClick={event => { event.currentTarget.blur(); onCard(); }}>কার্ডটা দেখো ↓</button>
    </div>
  );
}

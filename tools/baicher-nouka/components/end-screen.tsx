"use client";
// The end of a race: the stars pop in, the time counts up, then real stats and numbered choices. The count-up is one rAF loop,
// cancelled on unmount; in slow mode everything shows at once.
import { useEffect, useState } from "react";
import { bn, ordinal, secs } from "../lib/link";

export type EndStats = {
  placed: boolean; kicker: string; rank: number; tenths: number; stars: number; maxStars: number;
  beats: number; hits: number; perfect: number; bestStreak: number; patchHits: number;
  /** The champion's name when this race had one, and whether you finished ahead of it. */
  boss: string; bossBeaten: boolean;
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
    <div className="bn-end" data-placed={stats.placed || undefined} data-slow={slow || undefined}>
      <p className="bn-end-kicker">{stats.kicker}</p>
      {stats.placed ? (
        <p className="gx-stars bn-end-stars" role="img" aria-label={`৩টার মধ্যে ${bn(stats.stars)}টা তারা`}>
          {[0, 1, 2].map(star => <span key={star} className={star < stats.stars ? "on gx-pop" : star >= stats.maxStars ? "bn-capped" : ""} style={{ animationDelay: `${starAt(star)}s` }}>★</span>)}
        </p>
      ) : <p className="bn-end-lost">এবার {ordinal(stats.rank)}</p>}
      <p className="bn-end-time" aria-label={`${secs(stats.tenths)} সেকেন্ডে ${ordinal(stats.rank)}`}><b aria-hidden="true">{secs(shown)}</b> সেকেন্ড · {ordinal(stats.rank)}</p>
      <p className="bn-end-line">{stats.line}</p>
      <ul className="bn-end-stats">
        <li data-tone="gold"><b>{bn(stats.hits)}/{bn(stats.beats)}</b><span>তাল ধরেছ</span></li>
        <li data-tone="gold"><b>{bn(stats.perfect)}</b><span>ঠিক তালে</span></li>
        <li><b>{bn(stats.bestStreak)}</b><span>সেরা ছন্দ</span></li>
        <li data-tone={stats.patchHits ? "bad" : undefined}><b>{stats.patchHits ? bn(stats.patchHits) : "০"}</b><span>{stats.patchHits ? "বার পানায় আটকেছ" : "পানা ছোঁয়নি"}</span></li>
        {stats.boss && <li data-tone={stats.bossBeaten ? "gold" : "bad"}><b>{stats.bossBeaten ? "✓" : "✗"}</b><span>{stats.boss}{stats.bossBeaten ? "কে ছাড়িয়েছ" : " এগিয়ে ছিল"}</span></li>}
      </ul>
      {stats.near && <p className="bn-end-near">{stats.near}</p>}
      {stats.record && <p className="bn-end-best">{stats.record}</p>}
      <ol className="bn-end-choices" data-count={choices.length}>
        {choices.map((choice, index) => (
          <li key={choice.label}>
            <button type="button" className={index === 0 ? "kit-primary" : "kit-secondary"} onClick={event => { event.currentTarget.blur(); choice.run(); }}>
              <kbd aria-hidden="true">{bn(index + 1)}</kbd>{choice.label}{index === 0 && <em>এটাই ভালো</em>}
            </button>
          </li>
        ))}
      </ol>
      {onCard && <button type="button" className="kit-link bn-see" onClick={event => { event.currentTarget.blur(); onCard(); }}>কার্ডটা দেখো ↓</button>}
    </div>
  );
}

"use client";
// The end of a run: the stars pop in, the crossings count up, then real stats and three numbered choices.
// The count-up is one rAF loop, cancelled on unmount; in slow mode everything shows at once.
import { useEffect, useState } from "react";
import { bn, seconds } from "../lib/link";

export type EndStats = {
  level: number; name: string; won: boolean;
  score: number; goal: number; lost: number; balloons: number; tenths: number; stars: number; maxStars: number;
  grazes: number; bestStreak: number; dodged: number; gusts: number;
  /** Why the last balloon popped: a wire, the street, a crow or the cable mesh. */
  popped: number;
  line: string; near: string; best: string;
};
export type Choice = { label: string; run: () => void };

const COUNT_MS = 700;
const starAt = (index: number) => 0.3 + index * 0.28;
const POPPED = ["", "তারে লেগে ফটাস!", "রাস্তায় পড়ে ফটাস!", "কাকের ঠোকরে ফটাস!", "ওপরের তারে লেগে ফটাস!"];

export function EndScreen({ stats, slow, choices, onCard }: { stats: EndStats; slow: boolean; choices: Choice[]; onCard: () => void }) {
  const [shown, setShown] = useState(slow ? stats.score : 0);
  useEffect(() => {
    if (slow) { setShown(stats.score); return; }
    let frame = 0;
    const start = performance.now();
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / COUNT_MS), eased = 1 - (1 - t) ** 3;
      setShown(Math.round(stats.score * eased));
      if (t < 1) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [stats.score, slow]);

  const endless = stats.level === 0;
  return (
    <div className="tb-end" data-slow={slow || undefined} data-won={stats.won || undefined}>
      <p className="tb-end-kicker">{endless ? "যত দূর পারো" : stats.won ? `লেভেল ${bn(stats.level)} পার · ${stats.name}` : `লেভেল ${bn(stats.level)} · ${stats.name}`}</p>
      {stats.won && !endless ? (
        <p className="gx-stars tb-end-stars" role="img" aria-label={`৩টার মধ্যে ${bn(stats.stars)}টা তারা`}>
          {[0, 1, 2].map(star => <span key={star} className={star < stats.stars ? "on gx-pop" : star >= stats.maxStars ? "tb-capped" : ""} style={{ animationDelay: `${starAt(star)}s` }}>★</span>)}
        </p>
      ) : <p className="tb-end-out">{POPPED[stats.popped] || "ফটাস!"}</p>}
      <p className="tb-end-count" aria-label={endless ? `${bn(stats.score)}টা ফাঁক পার` : `${bn(stats.goal)}টার মধ্যে ${bn(stats.score)}টা ফাঁক পার`}>
        <b aria-hidden="true">{bn(shown)}</b>{!endless && <span aria-hidden="true">/{bn(stats.goal)}</span>} ফাঁক পার
      </p>
      <p className="tb-end-line">{stats.line}</p>
      <ul className="tb-end-stats">
        <li><b>{seconds(stats.tenths)} সে.</b><span>ওড়া</span></li>
        <li><b>{bn(stats.lost)}/{bn(stats.balloons)}</b><span>বেলুন ফাটল</span></li>
        <li><b>{bn(stats.grazes)} বার</b><span>তারে ঘষা</span></li>
        {stats.bestStreak > 1 && <li><b>টানা {bn(stats.bestStreak)}টা</b><span>না ঘষে পার</span></li>}
        {stats.dodged > 0 && <li><b>{bn(stats.dodged)}টা</b><span>কাক এড়ালে</span></li>}
        {stats.gusts > 0 && <li><b>{bn(stats.gusts)}টা</b><span>দমকা সামলালে</span></li>}
      </ul>
      {stats.near && <p className="tb-end-near">{stats.near}</p>}
      {stats.best && <p className="tb-end-best">{stats.best}</p>}
      <ol className="tb-end-choices">
        {choices.map((choice, index) => (
          <li key={choice.label}>
            <button type="button" className={index === 0 ? "kit-primary" : "kit-secondary"} onClick={event => { event.currentTarget.blur(); choice.run(); }}>
              <kbd aria-hidden="true">{bn(index + 1)}</kbd>{choice.label}{index === 0 && <em>এটাই ভালো</em>}
            </button>
          </li>
        ))}
      </ol>
      <button type="button" className="kit-link tb-end-card" onClick={event => { event.currentTarget.blur(); onCard(); }}>কার্ডটা দেখো ↓</button>
    </div>
  );
}

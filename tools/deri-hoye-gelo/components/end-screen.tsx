"use client";
// The end of a run: the stars pop in, the মিটার count up, the three star jobs are ticked or left open (by shape), then
// real stats and numbered choices. The count-up is one rAF loop, cancelled on unmount; in slow mode everything shows at once.
import { useEffect, useRef } from "react";
import { bn, seconds } from "../lib/link";

export type EndStats = {
  level: number; name: string; title: string; finale: string; won: boolean;
  meters: number; gate: number; stars: number;
  /** The three star jobs: at the gate before the bell, no stumble, every page. */
  jobs: readonly [boolean, boolean, boolean]; pages: number; stumbles: number;
  tenths: number; /** Tenths of a second to spare at the gate (0 when late). */ spare: number;
  jumps: number; ducks: number; cleared: number; bestStreak: number;
  headline: string; trip: string; line: string; near: string; best: string;
};
export type Choice = { label: string; run: () => void };

const COUNT_MS = 800;
const starAt = (index: number) => 0.3 + index * 0.28;
const Tick = ({ on }: { on: boolean }) => (
  <svg viewBox="0 0 20 20" aria-hidden="true" className="dh-job-mark" data-on={on}>
    {on ? <path d="M4 10.5 8.5 15 16 5.5" fill="none" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" /> : <circle cx="10" cy="10" r="6" fill="none" strokeWidth="2.4" strokeDasharray="3 3" />}
  </svg>
);

export function EndScreen({ stats, slow, choices, onCard }: { stats: EndStats; slow: boolean; choices: Choice[]; onCard: () => void }) {
  // The count is written straight into the number (no re-render a frame); the markup already holds the final value.
  const count = useRef<HTMLElement>(null);
  useEffect(() => {
    const node = count.current;
    if (!node || slow) return;
    let frame = 0;
    const start = performance.now();
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / COUNT_MS), eased = 1 - (1 - t) ** 4;
      node.textContent = bn(Math.round(stats.meters * eased));
      if (t < 1) frame = requestAnimationFrame(tick);
    };
    node.textContent = bn(0);
    frame = requestAnimationFrame(tick);
    return () => { cancelAnimationFrame(frame); node.textContent = bn(stats.meters); };
  }, [stats.meters, slow]);

  const endless = stats.level === 0;
  const jobs = [
    { done: stats.jobs[0], text: "ঘণ্টার আগে গেটে" },
    { done: stats.jobs[1], text: stats.stumbles === 0 ? "একবারও হোঁচট নয়" : `হোঁচট ${bn(stats.stumbles)} বার` },
    { done: stats.jobs[2], text: `খাতার পাতা ${bn(stats.pages)}/৩` },
  ];
  return (
    <div className="dh-end" data-slow={slow || undefined} data-won={stats.won || undefined}>
      <p className="dh-end-kicker">{endless ? "যত দূর পারো" : `লেভেল ${bn(stats.level)}${stats.won ? " পার" : ""} · ${stats.finale || stats.title}`}</p>
      <p className="dh-end-headline">{stats.headline}</p>
      {stats.won && !endless ? (
        <p className="gx-stars dh-end-stars" role="img" aria-label={`৩টার মধ্যে ${bn(stats.stars)}টা তারা`}>
          {[0, 1, 2].map(star => <span key={star} className={star < stats.stars ? "on gx-pop" : ""} style={{ animationDelay: `${starAt(star)}s` }}>★</span>)}
        </p>
      ) : <p className="dh-end-trip">{stats.trip}</p>}
      <p className="dh-end-count" aria-label={endless ? `${bn(stats.meters)} মিটার` : `${bn(stats.gate)} মিটারের মধ্যে ${bn(stats.meters)} মিটার`}>
        <b aria-hidden="true" ref={count}>{bn(stats.meters)}</b>{!endless && <span aria-hidden="true">/{bn(stats.gate)}</span>} মিটার
      </p>
      {!endless && (
        <ul className="dh-end-jobs">
          {jobs.map((job, index) => <li key={index} data-on={job.done}><Tick on={job.done} />{job.text}</li>)}
        </ul>
      )}
      <ul className="dh-end-stats">
        <li><b>{seconds(stats.tenths)} সে.</b><span>সময়</span></li>
        {stats.won && !endless && <li><b>{seconds(stats.spare)} সে.</b><span>হাতে ছিল</span></li>}
        <li><b>{bn(stats.jumps)} বার</b><span>লাফ</span></li>
        <li><b>{bn(stats.ducks)} বার</b><span>মাথা নিচু</span></li>
        <li><b>{bn(stats.cleared)}টা</b><span>পার করেছ</span></li>
        {stats.bestStreak > 1 && <li><b>টানা {bn(stats.bestStreak)}টা</b><span>হোঁচট ছাড়া</span></li>}
      </ul>
      <p className="dh-end-line">{stats.line}</p>
      {stats.near && <p className="dh-end-near">{stats.near}</p>}
      {stats.best && <p className="dh-end-best">{stats.best}</p>}
      <ol className="dh-end-choices">
        {choices.map((choice, index) => (
          <li key={choice.label}>
            <button type="button" className={index === 0 ? "kit-primary" : "kit-secondary"} onClick={event => { event.currentTarget.blur(); choice.run(); }}>
              <kbd aria-hidden="true">{bn(index + 1)}</kbd>{choice.label}{index === 0 && <em>এটাই ভালো</em>}
            </button>
          </li>
        ))}
      </ol>
      <button type="button" className="kit-link dh-end-card" onClick={event => { event.currentTarget.blur(); onCard(); }}>কার্ডটা দেখো ↓</button>
    </div>
  );
}

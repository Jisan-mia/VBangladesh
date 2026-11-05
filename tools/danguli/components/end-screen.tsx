"use client";
// The end of a round: the stars pop in, the total counts up against the neighbour's score, then real stats and numbered
// choices. The count-up is one rAF loop, cancelled on unmount; in ধীরে খেলো everything shows at once.
import { useEffect, useState } from "react";
import { bn, hitLabel, ordinal } from "../lib/lines";

export type EndStats = {
  won: boolean; kicker: string; title: string;
  total: number; target: number; short: string; hits: string[];
  stars: number; maxStars: number;
  gold: number; swings: number; longest: number; lofts: number; drives: number; caught: number; pond: number;
  /** The finale's named move: its name, how often it came into play, and how often you beat it. */
  move: string; faced: number; beat: number;
  line: string; near: string; record: string;
};
export type Choice = { label: string; run: () => void };

const COUNT_MS = 800;
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
    <div className="dg-end" data-won={stats.won || undefined}>
      <p className="dg-end-kicker">{stats.kicker}</p>
      {stats.won ? (
        <p className="gx-stars dg-end-stars" role="img" aria-label={`৩টার মধ্যে ${bn(stats.stars)}টা তারা`}>
          {[0, 1, 2].map(star => <span key={star} className={star < stats.stars ? "on gx-pop" : star >= stats.maxStars ? "dg-capped" : ""} style={{ animationDelay: `${starAt(star)}s` }}>★</span>)}
        </p>
      ) : <p className="dg-end-lost">{stats.title}</p>}
      <p className="dg-end-score" aria-label={`তিন মারে ${bn(stats.total)} ডাং, ${stats.short} ${bn(stats.target)}`}>
        <b aria-hidden="true">{up(stats.total)}</b> <span aria-hidden="true">ডাং · {stats.short} {bn(stats.target)}</span>
      </p>
      <ol className="dg-end-hits" aria-label="তিন মার">
        {stats.hits.map((hit, index) => <li key={index}><span>{ordinal(index)}</span><b>{hitLabel(hit)}</b></li>)}
      </ol>
      <p className="dg-end-line">{stats.line}</p>
      <ul className="dg-end-stats">
        <li data-tone="gold"><b>{up(stats.gold)}/{bn(stats.swings)}</b><span>সোনালি মার</span></li>
        <li><b>{up(stats.longest)}</b><span>সবচেয়ে দূর</span></li>
        <li><b>{bn(stats.lofts)}–{bn(stats.drives)}</b><span>উঁচু–নিচু</span></li>
        {stats.caught > 0 && <li data-tone="bad"><b>{bn(stats.caught)}</b><span>ক্যাচ</span></li>}
        {stats.pond > 0 && <li data-tone="bad"><b>{bn(stats.pond)}</b><span>পুকুরে</span></li>}
        {stats.faced > 0 && <li data-tone="gold"><b>{bn(stats.beat)}/{bn(stats.faced)}</b><span>{stats.move}</span></li>}
      </ul>
      {stats.near && <p className="dg-end-near">{stats.near}</p>}
      {stats.record && <p className="dg-end-best">{stats.record}</p>}
      <ol className="dg-end-choices" data-count={choices.length}>
        {choices.map((choice, index) => (
          <li key={choice.label}>
            <button type="button" className={index === 0 ? "kit-primary" : "kit-secondary"} onClick={event => { event.currentTarget.blur(); choice.run(); }}>
              <kbd aria-hidden="true">{bn(index + 1)}</kbd>{choice.label}{index === 0 && <em>এটাই ভালো</em>}
            </button>
          </li>
        ))}
      </ol>
      {onCard && <button type="button" className="kit-link dg-see" onClick={event => { event.currentTarget.blur(); onCard(); }}>কার্ডটা দেখো ↓</button>}
    </div>
  );
}

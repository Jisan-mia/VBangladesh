"use client";
// The end screen: a page of the খাতা. The title, the stars stamped in (StarReveal clears its own chimes on unmount),
// real stats that count up, the line, the exact near-miss, the sums you missed with how to work them out, and three
// numbered choices (the first one marked এটাই ভালো).
import { useEffect, useState } from "react";
import { StarReveal } from "../../../shared/game-ui";
import { countAt } from "../lib/tick.hot";
import { bn, seconds } from "../lib/link";

export type FinishStats = { right: number; wrong: number; score: number; stars: number; bestStreak: number; avgMs: number; fastestMs: number; lostMs: number };
export type Miss = { sum: string; answer: string; typed: string; how: string };
export type Choice = { label: string; run: () => void };
const COUNT_MS = 900;

export function Finish({ title, sub, stats, line, near, best, misses, slow, finale, choices, onCard }: {
  title: string; sub: string; stats: FinishStats; line: string; near: string; best: string; misses: readonly Miss[];
  slow: boolean; finale: boolean; choices: readonly Choice[]; onCard: () => void;
}) {
  const [t, setT] = useState(slow ? 1 : 0);
  useEffect(() => {
    if (slow) { setT(1); return; }
    let frame = 0;
    const started = performance.now();
    const step = (now: number) => {
      const progress = Math.min(1, (now - started) / COUNT_MS);
      setT(progress);
      if (progress < 1) frame = requestAnimationFrame(step);
    };
    setT(0);
    frame = requestAnimationFrame(step);
    return () => cancelAnimationFrame(frame);
  }, [stats, slow]);

  return (
    <section className="mh-finish" aria-labelledby="mh-finish-title" data-finale={finale || undefined} data-still={slow || undefined}>
      <header>
        <p>মুখে মুখে হিসাব · খাতার পাতা</p>
        <h2 id="mh-finish-title">{title}</h2>
        <small>{sub}</small>
      </header>
      <div className="mh-finish-total">
        <StarReveal count={stats.stars} />
        <b aria-label={`${bn(stats.right)}টা মিলেছে, ${bn(stats.score)} পয়েন্ট`}><span aria-hidden="true">{bn(countAt(stats.right, t))}টা মিলেছে</span></b>
      </div>
      <dl className="mh-finish-stats">
        <div><dt>পয়েন্ট</dt><dd>{bn(countAt(stats.score, t))}</dd></div>
        <div><dt>ভুল</dt><dd>{bn(countAt(stats.wrong, t))}{stats.lostMs ? <small> −{bn(Math.round(countAt(stats.lostMs, t) / 1000))}সে.</small> : null}</dd></div>
        <div><dt>সেরা টানা</dt><dd>{bn(countAt(stats.bestStreak, t))}</dd></div>
        <div><dt>গড় সময়</dt><dd>{stats.avgMs ? `${seconds(Math.max(100, countAt(stats.avgMs, t)))} সে.` : "–"}</dd></div>
      </dl>
      <p className="mh-finish-line">{line}</p>
      {near && <p className="mh-finish-near">{near}</p>}
      {misses.length > 0 && (
        <div className="mh-misses">
          <h3>যেগুলো ফসকেছে</h3>
          <ol>
            {misses.map((miss, index) => (
              <li key={index}>
                <span className="mh-miss-sum">{miss.sum} <b>{miss.answer}</b>{miss.typed && <s>{miss.typed}</s>}</span>
                <span className="mh-miss-how">{miss.how}</span>
              </li>
            ))}
          </ol>
        </div>
      )}
      {best && <p className="mh-finish-best">{best}</p>}
      <ol className="mh-finish-choices">
        {choices.map((choice, index) => (
          <li key={choice.label}>
            <button type="button" className={index === 0 ? "kit-primary" : "kit-secondary"} onClick={event => { event.currentTarget.blur(); choice.run(); }}>
              <kbd aria-hidden="true">{bn(index + 1)}</kbd>{choice.label}{index === 0 && <em>এটাই ভালো</em>}
            </button>
          </li>
        ))}
      </ol>
      <button type="button" className="kit-link mh-see" onClick={event => { event.currentTarget.blur(); onCard(); }}>কার্ড বানাও ↓</button>
      {stats.fastestMs > 0 && <p className="mh-finish-fast">সবচেয়ে চটপট: {seconds(stats.fastestMs)} সেকেন্ডে একটা।</p>}
    </section>
  );
}

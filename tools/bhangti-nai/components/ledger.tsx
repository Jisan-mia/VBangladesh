'use client';
// The end screen: দিনের হিসাবের খাতা. One line per customer (who, the change, first try or after a slip or walked off,
// seconds, points), the total counting up, the stars stamped in (StarReveal clears its own chimes on unmount), real
// stats, and numbered choices.
import { useEffect, useState } from 'react';
import { StarReveal } from '../../../shared/game-ui';
import { countAt } from '../lib/tick.hot';
import { bn, PEOPLE, seconds } from '../lib/money';

export type LedgerRow = { who: number; change: number; ok: boolean; clean: boolean; ms: number; points: number };
export type LedgerStats = { score: number; stars: number; clean: number; right: number; avgMs: number; fastestMs: number; bestStreak: number };
export type Choice = { label: string; run: () => void };
const COUNT_MS = 900;

export function Ledger({ rows, stats, title, sub, line, near, best, slow, finale, choices, onCard }: {
  rows: readonly LedgerRow[]; stats: LedgerStats; title: string; sub: string; line: string; near: string; best: string; slow: boolean;
  finale: boolean; choices: readonly Choice[]; onCard: () => void;
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
    <section className="bt-ledger" aria-labelledby="bt-ledger-title" data-finale={finale || undefined} data-still={slow || undefined}>
      <header>
        <p>দোকানের খাতা · দিনের হিসাব</p>
        <h2 id="bt-ledger-title">{title}</h2>
        <small>{sub}</small>
      </header>
      <ol className="bt-ledger-rows" aria-label="দশজন খদ্দের">
        {rows.map((row, index) => (
          <li key={index} data-state={row.ok ? (row.clean ? 'clean' : 'slip') : 'late'} style={{ animationDelay: slow ? undefined : `${index * 60}ms` }}>
            <span className="bt-ledger-n">{bn(index + 1)}</span>
            <span className="bt-ledger-who">{PEOPLE[row.who]} <b>ফেরত {bn(row.change)}</b></span>
            <span className="bt-ledger-mark" role="img" aria-label={row.ok ? (row.clean ? 'প্রথমবারেই ঠিক' : 'ভুলের পর ঠিক') : 'চলে গেছে'}>{row.ok ? (row.clean ? '✓' : '~') : '✗'}</span>
            <span className="bt-ledger-time">{row.ok ? `${seconds(row.ms)} সে.` : '–'}</span>
            <span className="bt-ledger-pts">{bn(row.points)}</span>
          </li>
        ))}
      </ol>
      <div className="bt-ledger-total">
        <span>মোট</span>
        <StarReveal count={stats.stars} />
        <b aria-label={`পয়েন্ট ${bn(stats.score)}`}><span aria-hidden="true">{bn(countAt(stats.score, t))}</span></b>
      </div>
      <dl className="bt-ledger-stats">
        <div><dt>একবারে ঠিক</dt><dd>{bn(countAt(stats.clean, t))}/১০</dd></div>
        <div><dt>গড় সময়</dt><dd>{stats.right ? `${seconds(Math.max(100, countAt(stats.avgMs, t)))} সে.` : '–'}</dd></div>
        <div><dt>সবচেয়ে চটপট</dt><dd>{stats.fastestMs ? `${seconds(Math.max(100, countAt(stats.fastestMs, t)))} সে.` : '–'}</dd></div>
        <div><dt>সেরা টানা</dt><dd>{bn(countAt(stats.bestStreak, t))}</dd></div>
      </dl>
      <p className="bt-ledger-line">{line}</p>
      {near && <p className="bt-ledger-near">{near}</p>}
      {best && <p className="bt-ledger-best">{best}</p>}
      <ol className="bt-ledger-choices">
        {choices.map((choice, index) => (
          <li key={choice.label}>
            <button type="button" className={index === 0 ? 'kit-primary' : 'kit-secondary'} onClick={event => { event.currentTarget.blur(); choice.run(); }}>
              <kbd aria-hidden="true">{bn(index + 1)}</kbd>{choice.label}{index === 0 && <em>এটাই ভালো</em>}
            </button>
          </li>
        ))}
      </ol>
      <button type="button" className="kit-link bt-see" onClick={event => { event.currentTarget.blur(); onCard(); }}>কার্ড বানাও ↓</button>
    </section>
  );
}

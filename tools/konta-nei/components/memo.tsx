"use client";
// The end screen: মামার ক্যাশ মেমো. One line per shelf (what went, ✓ or ✗, seconds, points), the total counting up,
// the stars stamped in (StarReveal clears its own chimes on unmount), real stats, and three numbered choices.
import { useEffect, useRef, useState } from "react";
import { StarReveal } from "../../../shared/game-ui";
import { countAt } from "../lib/tick.hot";
import { bn, seconds } from "../lib/link";
import { itemName, type ItemId } from "../lib/items";
import { ItemArt } from "./item-art";

export type MemoRow = { gone: readonly ItemId[]; right: boolean; ms: number; points: number };
export type MemoStats = { score: number; stars: number; right: number; avgMs: number; fastestMs: number; bestStreak: number };
export type Choice = { label: string; run: () => void };
const COUNT_MS = 900;

export function Memo({ rows, stats, title, sub, line, near, best, slow, finale, choices, onCard }: {
  rows: readonly MemoRow[]; stats: MemoStats; title: string; sub: string; line: string; near: string; best: string; slow: boolean;
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
    <section className="kn-memo" aria-labelledby="kn-memo-title" data-finale={finale || undefined} data-still={slow || undefined}>
      <header>
        <p>মামার দোকান · ক্যাশ মেমো</p>
        <h2 id="kn-memo-title">{title}</h2>
        <small>{sub}</small>
      </header>
      <ol className="kn-memo-rows" aria-label="তিনটা তাক">
        {rows.map((row, index) => (
          <li key={index} data-right={row.right || undefined} style={{ animationDelay: slow ? undefined : `${index * 110}ms` }}>
            <span className="kn-memo-n">{bn(index + 1)}</span>
            <span className="kn-memo-what">
              {row.gone.map(id => <ItemArt key={id} id={id} width={34} height={30} />)}
              <b>{row.gone.map(itemName).join(", ")}</b>
            </span>
            <span className="kn-memo-mark" aria-label={row.right ? "ঠিক" : "ভুল"}>{row.right ? "✓" : "✗"}</span>
            <span className="kn-memo-time">{seconds(row.ms)} সে.</span>
            <span className="kn-memo-pts">{bn(row.points)}</span>
          </li>
        ))}
      </ol>
      <div className="kn-memo-total">
        <span>মোট</span>
        <StarReveal count={stats.stars} />
        <b aria-label={`স্কোর ${bn(stats.score)}`}><span aria-hidden="true">{bn(countAt(stats.score, t))}</span></b>
      </div>
      <dl className="kn-memo-stats">
        <div><dt>ঠিক</dt><dd>{bn(countAt(stats.right, t))}/৩</dd></div>
        <div><dt>গড় সময়</dt><dd>{seconds(Math.max(100, countAt(stats.avgMs, t)))} সে.</dd></div>
        <div><dt>সবচেয়ে চটপট</dt><dd>{stats.fastestMs ? `${seconds(Math.max(100, countAt(stats.fastestMs, t)))} সে.` : "–"}</dd></div>
        <div><dt>সেরা টানা</dt><dd>{bn(countAt(stats.bestStreak, t))}</dd></div>
      </dl>
      <p className="kn-memo-line">{line}</p>
      {near && <p className="kn-memo-near">{near}</p>}
      {best && <p className="kn-memo-best">{best}</p>}
      <ol className="kn-memo-choices">
        {choices.map((choice, index) => (
          <li key={choice.label}>
            <button type="button" className={index === 0 ? "kit-primary" : "kit-secondary"} onClick={event => { event.currentTarget.blur(); choice.run(); }}>
              <kbd aria-hidden="true">{bn(index + 1)}</kbd>{choice.label}{index === 0 && <em>এটাই ভালো</em>}
            </button>
          </li>
        ))}
      </ol>
      <button type="button" className="kit-link kn-see" onClick={event => { event.currentTarget.blur(); onCard(); }}>কার্ড বানাও ↓</button>
    </section>
  );
}

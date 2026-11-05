"use client";
// The end screen: ঘণ্টাওয়ালার খাতা. The tune you played as a strip of numbered bells (rests as gaps), the points counting
// up, the stars stamped in (StarReveal clears its own chimes on unmount), real stats and numbered choices.
import { useEffect, useLayoutEffect, useRef, type CSSProperties } from "react";
import { StarReveal } from "../../../shared/game-ui";
import { BELL_COLORS } from "../lib/art";
import { bn } from "../lib/links";
import { countAt } from "../lib/tick.hot";
import type { Note } from "../lib/tune";

export type Choice = { label: string; run: () => void };
export type FinishStats = { score: number; unit: string; stars: number; notes: number; mistakes: number; hearts: number; graded: number; onBeat: number; bestStreak: number; heard: number; showStars: boolean };
const COUNT_MS = 900;

/** A number counting up from 0 by writing its own text, so a count never re-renders the screen. */
function Count({ value, slow, suffix = "" }: { value: number; slow: boolean; suffix?: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  useLayoutEffect(() => { if (ref.current && !slow) ref.current.textContent = `${bn(0)}${suffix}`; }, [value, slow, suffix]);
  useEffect(() => {
    const element = ref.current;
    if (!element) return;
    if (slow) { element.textContent = `${bn(value)}${suffix}`; return; }
    let frame = 0;
    const started = performance.now();
    const step = (now: number) => {
      const t = Math.min(1, (now - started) / COUNT_MS);
      element.textContent = `${bn(countAt(value, t))}${suffix}`;
      if (t < 1) frame = requestAnimationFrame(step);
    };
    frame = requestAnimationFrame(step);
    return () => cancelAnimationFrame(frame);
  }, [value, slow, suffix]);
  return <span ref={ref}>{bn(value)}{suffix}</span>;
}

export function Finish({ title, sub, tune, upTo, stats, line, near, best, slow, finale, won, choices, onCard }: {
  title: string; sub: string; tune: readonly Note[]; upTo: number; stats: FinishStats; line: string; near: string; best: string;
  slow: boolean; finale: boolean; won: boolean; choices: readonly Choice[]; onCard: () => void;
}) {
  // Long endless tunes show their last 18 notes.
  const from = Math.max(0, upTo - 18), shown = tune.slice(from, upTo);
  return (
    <section className="gs-memo" aria-labelledby="gs-memo-title" data-finale={finale || undefined} data-lost={!won || undefined} data-still={slow || undefined}>
      <header>
        <p>ঘণ্টাওয়ালার খাতা</p>
        <h2 id="gs-memo-title">{title}</h2>
        <small>{sub}</small>
      </header>
      <ol className="gs-memo-tune" aria-label={`সুরের ${bn(upTo)}টা ঘণ্টা`}>
        {from > 0 && <li className="gs-memo-more" aria-hidden="true">…</li>}
        {shown.map((note, index) => (
          <li key={from + index} data-rest={note.gap > 1 || undefined} style={{ "--c": BELL_COLORS[note.bell], animationDelay: slow ? undefined : `${Math.min(index, 10) * 28}ms` } as CSSProperties}>
            <b>{bn(note.bell + 1)}</b>
          </li>
        ))}
      </ol>
      <div className="gs-memo-total">
        {stats.showStars ? <StarReveal count={stats.stars} /> : <span />}
        <b aria-label={`${stats.unit} ${bn(stats.score)}`}><span aria-hidden="true"><Count value={stats.score} slow={slow} /></span><small>{stats.unit}</small></b>
      </div>
      <dl className="gs-memo-stats">
        <div><dt>সুর</dt><dd aria-label={`${bn(stats.notes)}টা`}><Count value={stats.notes} slow={slow} suffix="টা" /></dd></div>
        <div><dt>ভুল</dt><dd>{bn(stats.mistakes)}/৩</dd></div>
        {stats.graded > 0
          ? <div><dt>তালে</dt><dd aria-label={`${bn(stats.onBeat)}/${bn(stats.graded)}`}><Count value={stats.onBeat} slow={slow} />/{bn(stats.graded)}</dd></div>
          : <div><dt>সেরা টানা</dt><dd aria-label={bn(stats.bestStreak)}><Count value={stats.bestStreak} slow={slow} /></dd></div>}
        <div><dt>শোনা</dt><dd>{bn(stats.heard)} বার</dd></div>
      </dl>
      <p className="gs-memo-line">{line}</p>
      {near && <p className="gs-memo-near">{near}</p>}
      {best && <p className="gs-memo-best">{best}</p>}
      <ol className="gs-memo-choices">
        {choices.map((choice, index) => (
          <li key={choice.label}>
            <button type="button" className={index === 0 ? "kit-primary" : "kit-secondary"} onClick={event => { event.currentTarget.blur(); choice.run(); }}>
              <kbd aria-hidden="true">{bn(index + 1)}</kbd>{choice.label}{index === 0 && <em>এটাই ভালো</em>}
            </button>
          </li>
        ))}
      </ol>
      <button type="button" className="kit-link gs-see" onClick={event => { event.currentTarget.blur(); onCard(); }}>কার্ড বানাও ↓</button>
    </section>
  );
}

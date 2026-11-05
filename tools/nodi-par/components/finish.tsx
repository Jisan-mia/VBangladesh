"use client";
// The end screen over the dimmed river: the heading, the stars one by one (StarReveal clears its own chimes), the real stats
// counting up, the exact near-miss line, and three numbered choices. Count-ups run at once in ধীরে খেলো.
import { useEffect, useRef, useState } from "react";
import { StarReveal } from "../../../shared/game-ui";
import { bn, secs } from "../lib/result";

/** `tenths` shows the value as seconds ("১২.৩"). */
export type Stat = { label: string; value: number; of?: number; unit?: string; tenths?: boolean };
export type Choice = { label: string; run: () => void };
const COUNT_MS = 700;
/** The card waits this long (its CSS delay) so the bell is seen first; the count starts as the card shows. */
const CARD_WAIT_MS = 320;

function useCountUp(key: unknown, still: boolean) {
  const [t, setT] = useState(still ? 1 : 0);
  const frame = useRef(0);
  useEffect(() => {
    if (still) { setT(1); return; }
    const began = performance.now();
    const tick = (now: number) => {
      const progress = Math.max(0, Math.min(1, (now - began - CARD_WAIT_MS) / COUNT_MS));
      setT(progress);
      if (progress < 1) frame.current = requestAnimationFrame(tick);
    };
    setT(0);
    frame.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame.current);
  }, [key, still]);
  return t;
}

export function Finish({ countKey, kicker, heading, won, stars, stats, line, note, versus, slow, choices, onSeeCard }: {
  /** Changes once per result, so the count-up runs once. */
  countKey: number; kicker: string; heading: string; won: boolean; stars: number; stats: Stat[]; line: string; note: string; versus: string; slow: boolean;
  choices: Choice[]; onSeeCard: (() => void) | null;
}) {
  const t = useCountUp(countKey, slow), eased = 1 - (1 - t) ** 3;
  return (
    <section className="np-finish" aria-labelledby="np-finish-title" data-won={won || undefined}>
      <p className="np-finish-kicker">{kicker}</p>
      <h2 id="np-finish-title">{heading}</h2>
      {won ? <StarReveal count={stars} delay={CARD_WAIT_MS + 260} /> : <p className="np-nostar" aria-label="কোনো তারা নেই">☆☆☆</p>}
      <dl className="np-stats" aria-label="এই নদীর হিসাব">
        {stats.map(stat => (
          <div key={stat.label}><dt>{stat.label}</dt><dd>{stat.tenths ? secs(Math.round(stat.value * eased)) : bn(Math.round(stat.value * eased))}{stat.unit}{stat.of !== undefined && <small>/{bn(stat.of)}</small>}</dd></div>
        ))}
      </dl>
      {note && <p className="np-miss">{note}</p>}
      {versus && <p className="np-versus">{versus}</p>}
      <p className="np-line">{line}</p>
      <ol className="np-choices">
        {choices.map((choice, index) => (
          <li key={choice.label}>
            <button type="button" className={index === 0 ? "kit-primary" : "kit-secondary"} onClick={event => { event.currentTarget.blur(); choice.run(); }} data-first={index === 0 || undefined}>
              <kbd aria-hidden="true">{bn(index + 1)}</kbd>{choice.label}{index === 0 && choices.length > 1 && <em>এটাই ভালো</em>}
            </button>
          </li>
        ))}
      </ol>
      {onSeeCard && <button type="button" className="kit-link np-see" onClick={event => { event.currentTarget.blur(); onSeeCard(); }}>কার্ড দেখো, বন্ধুকে পাঠাও ↓</button>}
    </section>
  );
}

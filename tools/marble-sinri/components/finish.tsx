"use client";
// The end of a floor over the dimmed board: the heading, the stars one by one (StarReveal clears its own chimes), the real
// stats counting up, the exact near-miss line, a new marble if one opened, and the numbered choices. Count-ups run at once
// in ধীরে খেলো. Keys 1–3 and Enter are the caller's (fresh presses only).
import { useEffect, useRef, useState } from "react";
import { StarReveal } from "../../../shared/game-ui";
import { MARBLES } from "../lib/levels";
import { bn } from "../lib/link";

export type Stat = { label: string; value: number; of?: number; tenths?: boolean };
export type Choice = { label: string; run: () => void };
const COUNT_MS = 800;

function useCountUp(key: unknown, still: boolean) {
  const [t, setT] = useState(still ? 1 : 0);
  const frame = useRef(0);
  useEffect(() => {
    if (still) { setT(1); return; }
    const began = performance.now();
    const tick = (now: number) => {
      const progress = Math.min(1, (now - began) / COUNT_MS);
      setT(progress);
      if (progress < 1) frame.current = requestAnimationFrame(tick);
    };
    setT(0);
    frame.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame.current);
  }, [key, still]);
  return t;
}

const shown = (stat: Stat, eased: number) => {
  const value = Math.round(stat.value * eased);
  return stat.tenths ? `${bn(Math.floor(value / 10))}.${bn(value % 10)}` : bn(value);
};

export function Finish({ countKey, kicker, heading, stars, stats, line, note, versus, fresh, slow, choices, onSeeCard }: {
  /** Changes once per result, so the count-up runs once. */
  countKey: number; kicker: string; heading: string; stars: number; stats: Stat[]; line: string; note: string; versus: string;
  /** A marble colour this clear opened, or -1. */
  fresh: number; slow: boolean; choices: Choice[]; onSeeCard: () => void;
}) {
  const t = useCountUp(countKey, slow), eased = 1 - (1 - t) ** 3;
  return (
    <section className="ms-finish" aria-labelledby="ms-finish-title">
      <p className="ms-finish-kicker">{kicker}</p>
      <h2 id="ms-finish-title">{heading}</h2>
      {stars > 0 ? <StarReveal count={stars} /> : <p className="ms-nostar" aria-label="কোনো তারা নেই">☆☆☆</p>}
      <dl className="ms-stats" aria-label="এই তলার হিসাব">
        {stats.map(stat => (
          <div key={stat.label}><dt>{stat.label}</dt><dd>{shown(stat, eased)}{stat.of !== undefined && <small>/{bn(stat.of)}</small>}</dd></div>
        ))}
      </dl>
      {note && <p className="ms-miss">{note}</p>}
      {versus && <p className="ms-versus">{versus}</p>}
      {fresh > 0 && (
        <p className="ms-fresh">
          <span className="ms-swatch" style={{ backgroundColor: MARBLES[fresh].glass, color: MARBLES[fresh].eye }} aria-hidden="true" />
          <span>নতুন মার্বেল খুলল: <b>{MARBLES[fresh].name}</b>। এখন এটাই গড়াবে।</span>
        </p>
      )}
      <p className="ms-line">{line}</p>
      <ol className="ms-actions">
        {choices.map((choice, index) => (
          <li key={choice.label}>
            <button type="button" className={index === 0 ? "kit-primary" : "kit-secondary"} onClick={event => { event.currentTarget.blur(); choice.run(); }} data-first={index === 0 || undefined}>
              <kbd aria-hidden="true">{bn(index + 1)}</kbd>{choice.label}{index === 0 && choices.length > 1 && <em>এটাই ভালো</em>}
            </button>
          </li>
        ))}
      </ol>
      <button type="button" className="kit-link ms-see" onClick={event => { event.currentTarget.blur(); onSeeCard(); }}>ছবি বানাও, বন্ধুকে পাঠাও ↓</button>
    </section>
  );
}

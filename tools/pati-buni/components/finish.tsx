"use client";
// The end screen over the dimmed frame: the heading, the stars one by one (StarReveal clears its own chimes), the real stats
// counting up, the exact near-miss line, and the two choices. Count-ups run at once in ধীরে খেলো.
import { useEffect, useRef, useState } from "react";
import { StarReveal } from "../../../shared/game-ui";
import { bn } from "../lib/link";

export type Stat = { label: string; value: number; of?: number; unit?: string };
const COUNT_MS = 850;

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

export type Choice = { label: string; run: () => void };

export function Finish({ countKey, heading, stars, showStars, stats, line, note, versus, slow, primary, secondary, onSeeCard }: {
  /** Changes once per result, so the count-up runs once. */
  countKey: number; heading: string; stars: number; showStars: boolean; stats: Stat[]; line: string; note: string; versus: string; slow: boolean;
  primary: Choice; secondary: Choice | null; onSeeCard: () => void;
}) {
  const t = useCountUp(countKey, slow), eased = 1 - (1 - t) ** 3;
  return (
    <section className="pb-finish" aria-labelledby="pb-finish-title">
      <h2 id="pb-finish-title">{heading}</h2>
      {showStars && (stars > 0 ? <StarReveal count={stars} /> : <p className="pb-nostar" aria-label="কোনো তারা নেই">☆☆☆</p>)}
      <dl className="pb-stats" aria-label="এই পাটির হিসাব">
        {stats.map(stat => (
          <div key={stat.label}><dt>{stat.label}</dt><dd>{bn(Math.round(stat.value * eased))}{stat.of !== undefined && <small>/{bn(stat.of)}</small>}{stat.unit && <small>{stat.unit}</small>}</dd></div>
        ))}
      </dl>
      {note && <p className="pb-miss">{note}</p>}
      {versus && <p className="pb-versus">{versus}</p>}
      {line && <p className="pb-line">{line}</p>}
      <div className="pb-actions">
        <button type="button" className="kit-primary" onClick={primary.run} data-first>{primary.label}<kbd aria-hidden="true">Enter</kbd></button>
        {secondary && <button type="button" className="kit-secondary" onClick={secondary.run}>{secondary.label}</button>}
      </div>
      <button type="button" className="kit-link pb-see" onClick={onSeeCard}>পাটির কার্ড বানাও, বন্ধুকে পাঠাও ↓</button>
    </section>
  );
}

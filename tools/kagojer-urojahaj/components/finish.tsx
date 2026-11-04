"use client";
// The end screen over the dimmed scene: the heading, the stars one by one (StarReveal clears its own chimes), the real stats
// counting up, the exact near-miss line, the two choices, and what the next level brings. Count-ups run at once in ধীরে খেলো.
import { useEffect, useRef, useState } from "react";
import { StarReveal } from "../../../shared/game-ui";
import { bn } from "../lib/link";

export type Stat = { label: string; value: number; of?: number; unit?: string; tenths?: boolean };
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

const tenths = new Intl.NumberFormat("bn-BD", { minimumFractionDigits: 1, maximumFractionDigits: 1, useGrouping: false });

export function Finish({ countKey, heading, stars, stats, line, note, versus, slow, primary, secondary, next, onSeeCard }: {
  /** Changes once per result, so the count-up runs once. */
  countKey: number; heading: string; stars: number; stats: Stat[]; line: string; note: string; versus: string; slow: boolean;
  primary: Choice; secondary: Choice | null;
  /** What পরের লেভেল brings, in a line ("" when there is no next level). */
  next: string;
  onSeeCard: () => void;
}) {
  const t = useCountUp(countKey, slow), eased = 1 - (1 - t) ** 3;
  return (
    <section className="ku-finish" aria-labelledby="ku-finish-title">
      <h2 id="ku-finish-title">{heading}</h2>
      {stars > 0 ? <StarReveal count={stars} /> : <p className="ku-nostar" aria-label="কোনো তারা নেই">☆☆☆</p>}
      <dl className="ku-stats" aria-label="এই উড়ানের হিসাব">
        {stats.map(stat => (
          <div key={stat.label}>
            <dt>{stat.label}</dt>
            <dd>{stat.tenths ? tenths.format(stat.value * eased) : bn(Math.round(stat.value * eased))}{stat.of !== undefined && <small>/{bn(stat.of)}</small>}{stat.unit && <small> {stat.unit}</small>}</dd>
          </div>
        ))}
      </dl>
      {note && <p className="ku-miss">{note}</p>}
      {versus && <p className="ku-versus">{versus}</p>}
      <p className="ku-line">{line}</p>
      <div className="ku-actions">
        <button type="button" className="kit-primary" onClick={primary.run} data-first>{primary.label}<kbd aria-hidden="true">Enter</kbd></button>
        {secondary && <button type="button" className="kit-secondary" onClick={secondary.run}>{secondary.label}</button>}
      </div>
      {next && <p className="ku-next"><b>পরের লেভেলে নতুন</b> {next}</p>}
      <button type="button" className="kit-link ku-see" onClick={onSeeCard}>ছবি বানাও, বন্ধুকে পাঠাও ↓</button>
    </section>
  );
}

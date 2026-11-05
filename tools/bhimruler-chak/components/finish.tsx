"use client";
// The end screen, under the orchard: stars pop in one by one (StarReveal clears its own chimes on unmount) and the real numbers
// count up. The count-up writes text straight into its nodes each frame (count.hot.ts does the maths), so React renders it once.
// Choices are numbered: 1–3 or Enter (the first, marked এটাই ভালো), only from a fresh press after the screen appears.
import { useEffect, useRef } from "react";
import { StarReveal } from "../../../shared/game-ui";
import { countAt } from "../lib/count.hot";
import { bn, clock } from "../lib/challenge";

export type Stat = { label: string; value: number; of?: number; time?: boolean };
export type Choice = { label: string; run: () => void };
const COUNT_MS = 900;
const show = (stat: Stat, value: number) => stat.time ? clock(value) : stat.of !== undefined ? `${bn(value)}/${bn(stat.of)}` : bn(value);

export function Finish({ title, won, stars, stats, line, note, slow, choices, onSeeCard }: {
  title: string; won: boolean; stars: number; stats: Stat[]; line: string; note: string; slow: boolean;
  choices: Choice[]; onSeeCard?: () => void;
}) {
  const nodes = useRef<(HTMLElement | null)[]>([]);
  useEffect(() => {
    const paint = (t: number) => stats.forEach((stat, index) => { const node = nodes.current[index]; if (node) node.textContent = show(stat, countAt(stat.value, t)); });
    if (slow) { paint(1); return; }
    const started = performance.now();
    let frame = 0;
    const tick = (now: number) => {
      const t = Math.min(1, (now - started) / COUNT_MS);
      paint(t);
      if (t < 1) frame = requestAnimationFrame(tick);
    };
    paint(0);
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [stats, slow]);
  return (
    <section className="bc-finish" data-won={won || undefined} aria-labelledby="bc-finish-title">
      <div className="bc-finish-head">
        <h2 id="bc-finish-title">{title}</h2>
        {won && <StarReveal count={stars} />}
      </div>
      <dl className="bc-stats" aria-label="এই বাগানের হিসাব">
        {stats.map((stat, index) => <div key={stat.label}><dt>{stat.label}</dt><dd ref={node => { nodes.current[index] = node; }}>{show(stat, stat.value)}</dd></div>)}
      </dl>
      <p className="bc-finish-line">{line}</p>
      {note && <p className="bc-finish-note">{note}</p>}
      <ol className="bc-choices">
        {choices.map((choice, index) => (
          <li key={choice.label}>
            <button type="button" className={index ? "kit-secondary" : "kit-primary"} onClick={choice.run} data-first={index === 0 || undefined}>
              <kbd aria-hidden="true">{bn(index + 1)}</kbd>{choice.label}{index === 0 && <em>এটাই ভালো</em>}
            </button>
          </li>
        ))}
      </ol>
      {onSeeCard && <button type="button" className="kit-link bc-see" onClick={onSeeCard}>কার্ড বানাও ↓</button>}
    </section>
  );
}

"use client";
// The end screen: a fan spins up, stars pop in one by one (StarReveal clears its own chimes on unmount), and the real numbers
// count up. The count-up writes text straight into its nodes each frame (count.hot.ts does the maths), so React renders it once.
import { useEffect, useRef } from "react";
import { StarReveal } from "../../../shared/game-ui";
import { countAt } from "../lib/count.hot";
import { bn } from "../lib/link";

export type Stat = { label: string; value: number; time?: boolean };
const COUNT_MS = 900;
export const clock = (seconds: number) => `${bn(Math.floor(seconds / 60))}:${bn(Math.floor(seconds % 60)).padStart(2, "০")}`;
const show = (stat: Stat, value: number) => stat.time ? clock(value) : bn(value);

export function Finish({ title, stars, stats, line, note, slow, primary, secondary, onSeeCard }: {
  title: string; stars: number; stats: Stat[]; line: string; note: string; slow: boolean;
  primary: { label: string; run: () => void }; secondary: { label: string; run: () => void }[]; onSeeCard?: () => void;
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
    <section className="sb-finish" aria-labelledby="sb-finish-title">
      <div className="sb-finish-head">
        <svg className="sb-fan" viewBox="-30 -30 60 60" aria-hidden="true">
          <g className="sb-fan-blades"><path d="M-3-4C-6-18-2-27 4-27S8-16 3-4ZM4 -1C17-6 26-3 27 3S17 9 4 3ZM-1 4C3 17 1 26-5 27S-10 17-4 3ZM-4 1C-17 6-26 3-27-3S-17-9-4-3Z" /></g>
          <circle r="5.5" />
        </svg>
        <h2 id="sb-finish-title">{title}</h2>
        <StarReveal count={stars} />
      </div>
      <dl className="sb-stats" aria-label="এই বোর্ডের হিসাব">
        {stats.map((stat, index) => <div key={stat.label}><dt>{stat.label}</dt><dd ref={node => { nodes.current[index] = node; }}>{show(stat, stat.value)}</dd></div>)}
      </dl>
      <p className="sb-finish-line">{line}</p>
      {note && <p className="sb-finish-note">{note}</p>}
      <div className="sb-finish-actions">
        <button type="button" className="kit-primary" onClick={primary.run} data-first>{primary.label}<kbd aria-hidden="true">Enter</kbd></button>
        {secondary.map(action => <button key={action.label} type="button" className="kit-secondary" onClick={action.run}>{action.label}</button>)}
      </div>
      {onSeeCard && <button type="button" className="kit-link sb-see" onClick={onSeeCard}>কার্ড বানাও ↓</button>}
    </section>
  );
}

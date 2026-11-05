"use client";
// The end screen: stars pop in one by one (StarReveal clears its own chimes on unmount), and the real numbers count up.
// The count-up writes text straight into its nodes each frame (count.hot.ts does the maths), so React renders it once.
import { useEffect, useRef } from "react";
import { StarReveal } from "../../../shared/game-ui";
import { countAt } from "../lib/count.hot";
import { bn } from "../lib/link";
import { clock, type Stat } from "../lib/result";

const COUNT_MS = 900;
const show = (stat: Stat, value: number) => stat.unit === "time" ? clock(value) : stat.of !== undefined ? `${bn(value)}/${bn(stat.of)}` : bn(value);

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
    <section className="bb-finish" aria-labelledby="bb-finish-title">
      <div className="bb-finish-head">
        <h2 id="bb-finish-title">{title}</h2>
        {stars > 0 && <StarReveal count={stars} />}
      </div>
      <dl className="bb-stats" aria-label="এই খেলার হিসাব">
        {stats.map((stat, index) => <div key={stat.label}><dt>{stat.label}</dt><dd ref={node => { nodes.current[index] = node; }}>{show(stat, stat.value)}</dd></div>)}
      </dl>
      <p className="bb-finish-line">{line}</p>
      {note && <p className="bb-finish-note">{note}</p>}
      <div className="bb-finish-actions">
        <button type="button" className="kit-primary" onClick={primary.run} data-first>{primary.label}<kbd aria-hidden="true">Enter</kbd></button>
        {secondary.map(action => <button key={action.label} type="button" className="kit-secondary" onClick={action.run}>{action.label}</button>)}
      </div>
      {onSeeCard && <button type="button" className="kit-link bb-see" onClick={onSeeCard}>কার্ড বানাও ↓</button>}
    </section>
  );
}

"use client";
// The end screen: the code is shown, stars pop in one by one (StarReveal clears its own chimes on unmount), and the real numbers
// count up. The count-up writes text straight into its nodes each frame (count.hot.ts does the maths), so React renders it once.
import { useEffect, useRef } from "react";
import { StarReveal } from "../../../shared/game-ui";
import { countAt } from "../lib/count.hot";
import { bn, bnDigits } from "../lib/rules";

export type Stat = { label: string; value: number; time?: boolean };
const COUNT_MS = 900;
export const clock = (seconds: number) => `${bn(Math.floor(seconds / 60))}:${bn(Math.floor(seconds % 60)).padStart(2, "০")}`;
const show = (stat: Stat, value: number) => stat.time ? clock(value) : bn(value);

export function Finish({ title, won, code, stars, ladder, stats, line, note, slow, primary, secondary, onSeeCard }: {
  title: string; won: boolean; code: string; stars: number; ladder: boolean; stats: Stat[]; line: string; note: string; slow: boolean;
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
    <section className="pk-finish" data-won={won || undefined} aria-labelledby="pk-finish-title">
      <div className="pk-finish-head">
        <h2 id="pk-finish-title">{title}</h2>
        {ladder && won && <StarReveal count={stars} />}
      </div>
      <p className="pk-reveal">কোডটা ছিল <b>{bnDigits(code)}</b></p>
      <dl className="pk-stats" aria-label="এই কোডের হিসাব">
        {stats.map((stat, index) => <div key={stat.label}><dt>{stat.label}</dt><dd ref={node => { nodes.current[index] = node; }}>{show(stat, stat.value)}</dd></div>)}
      </dl>
      <p className="pk-finish-line">{line}</p>
      {note && <p className="pk-finish-note">{note}</p>}
      <div className="pk-finish-actions">
        <button type="button" className="kit-primary" onClick={primary.run} data-first>{primary.label}<kbd aria-hidden="true">Enter</kbd></button>
        {secondary.map(action => <button key={action.label} type="button" className="kit-secondary" onClick={action.run}>{action.label}</button>)}
      </div>
      {onSeeCard && <button type="button" className="kit-link pk-see" onClick={onSeeCard}>কার্ড বানাও ↓</button>}
    </section>
  );
}

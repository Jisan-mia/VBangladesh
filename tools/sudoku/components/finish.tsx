"use client";
// The end screen: stars pop in one by one (StarReveal clears its own chimes on unmount), and the real stats count up.
import { useEffect, useRef, useState } from "react";
import { StarReveal } from "../../../shared/game-ui";
import { countAt } from "../lib/tick.hot";
import { bn, clock } from "../lib/link";

export type FinishStats = { seconds: number; stars: number; own: number; mistakes: number; hints: number };
const COUNT_MS = 900;

/** Counts 0 → each stat over COUNT_MS with an ease-out; all at once in slow mode. */
function useCountUp(stats: FinishStats, still: boolean) {
  const [t, setT] = useState(still ? 1 : 0);
  const frame = useRef(0);
  useEffect(() => {
    if (still) { setT(1); return; }
    const started = performance.now();
    const tick = (now: number) => {
      const progress = Math.min(1, (now - started) / COUNT_MS);
      setT(progress);
      if (progress < 1) frame.current = requestAnimationFrame(tick);
    };
    setT(0);
    frame.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame.current);
  }, [stats, still]);
  return t;
}

export function Finish({ stats, title, line, note, slow, primary, secondary, onSeeCard }: {
  stats: FinishStats; title: string; line: string; note: string; slow: boolean;
  primary: { label: string; run: () => void }; secondary: { label: string; run: () => void }[]; onSeeCard: () => void;
}) {
  const t = useCountUp(stats, slow);
  const rows = [
    { label: "সময়", value: clock(countAt(stats.seconds, t)) },
    { label: "নিজে ভরা", value: `${bn(countAt(stats.own, t))} ঘর` },
    { label: "ভুল", value: bn(countAt(stats.mistakes, t)) },
    { label: "সাহায্য", value: bn(countAt(stats.hints, t)) },
  ];
  return (
    <section className="sd-finish" aria-labelledby="sd-finish-title">
      <div className="sd-finish-head">
        <h2 id="sd-finish-title">{title}</h2>
        <StarReveal count={stats.stars} />
      </div>
      <dl className="sd-stats" aria-label="এই ছকের হিসাব">
        {rows.map(row => <div key={row.label}><dt>{row.label}</dt><dd>{row.value}</dd></div>)}
      </dl>
      <p className="sd-finish-line">{line}</p>
      {note && <p className="sd-finish-note">{note}</p>}
      <div className="sd-finish-actions">
        <button type="button" className="kit-primary" onClick={primary.run} data-first>{primary.label}<kbd aria-hidden="true">Enter</kbd></button>
        {secondary.map(action => <button key={action.label} type="button" className="kit-secondary" onClick={action.run}>{action.label}</button>)}
      </div>
      <button type="button" className="kit-link sd-see" onClick={onSeeCard}>কার্ড বানাও ↓</button>
    </section>
  );
}

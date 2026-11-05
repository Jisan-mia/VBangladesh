"use client";
// The end slip: stars pop in one by one (StarReveal clears its own chimes on unmount), and the real stats count up.
import { useEffect, useRef, useState } from "react";
import { StarReveal } from "../../../shared/game-ui";
import { countAt } from "../lib/tick.hot";
import { bn } from "../lib/link";

export type FinishStat = { label: string; value: number; unit?: string };
const COUNT_MS = 900;

function useCountUp(key: string, still: boolean) {
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
  }, [key, still]);
  return t;
}

export function Finish({ title, stars, stats, line, note, slow, primary, secondary, onSeeCard }: {
  title: string; stars: number | null; stats: FinishStat[]; line: string; note: string; slow: boolean;
  primary: { label: string; run: () => void }; secondary: { label: string; key?: string; run: () => void }[]; onSeeCard?: () => void;
}) {
  const t = useCountUp(title + stats.map(stat => stat.value).join(","), slow);
  return (
    <section className="cr-finish" aria-labelledby="cr-finish-title" role="status">
      <h2 id="cr-finish-title">{title}</h2>
      {stars !== null && stars > 0 && <StarReveal count={stars} />}
      <dl className="cr-stats" aria-label="এই বোর্ডের হিসাব">
        {stats.map(stat => <div key={stat.label}><dt>{stat.label}</dt><dd>{bn(countAt(stat.value, t))}{stat.unit ?? ""}</dd></div>)}
      </dl>
      <p className="cr-finish-line">{line}</p>
      {note && <p className="cr-finish-note">{note}</p>}
      <div className="cr-finish-actions">
        <button type="button" className="kit-primary" onClick={primary.run} data-first>{primary.label}<kbd aria-hidden="true">Enter</kbd></button>
        {secondary.map(action => <button key={action.label} type="button" className="kit-secondary" onClick={action.run}>{action.label}{action.key && <kbd aria-hidden="true">{action.key}</kbd>}</button>)}
      </div>
      {onSeeCard && <button type="button" className="kit-link cr-see" onClick={onSeeCard}>কার্ড বানাও, বন্ধুকে পাঠাও ↓</button>}
    </section>
  );
}

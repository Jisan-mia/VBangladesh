"use client";
// The end screen: a tin slip under the plate. The stars pop in one by one (StarReveal clears its own chimes on unmount),
// and the real stats count up (all at once in slow mode).
import { useEffect, useRef, useState } from "react";
import { StarReveal } from "../../../shared/game-ui";
import { countAt } from "../lib/drag.hot";
import { bn, clock } from "../lib/link";

export type EndStats = { moves: number; seconds: number; helped: number; undone: number; stars: number };
const COUNT_MS = 800;

function useCountUp(key: unknown, still: boolean) {
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

export function EndScreen({ stats, title, line, note, slow, primary, secondary, onCard }: {
  stats: EndStats; title: string; line: string; note: string; slow: boolean;
  primary: { label: string; run: () => void }; secondary: { label: string; run: () => void }; onCard: () => void;
}) {
  const t = useCountUp(stats, slow);
  const rows = [
    { label: "চাল", value: bn(countAt(stats.moves, t)) },
    { label: "সময়", value: clock(countAt(stats.seconds, t)) },
    { label: "সাহায্য", value: bn(countAt(stats.helped, t)) },
    { label: "ফেরানো", value: bn(countAt(stats.undone, t)) },
  ];
  return (
    <section className="pg-end" aria-labelledby="pg-end-title">
      <div className="pg-end-head">
        <h2 id="pg-end-title">{title}</h2>
        <StarReveal count={stats.stars} />
      </div>
      <dl className="pg-stats" aria-label="এই প্লেটের হিসাব">
        {rows.map(row => <div key={row.label}><dt>{row.label}</dt><dd>{row.value}</dd></div>)}
      </dl>
      <p className="pg-end-line">{line}</p>
      {note && <p className="pg-end-note">{note}</p>}
      <div className="pg-end-actions">
        <button type="button" className="kit-secondary" onClick={secondary.run}>{secondary.label}</button>
        <button type="button" className="kit-primary" onClick={primary.run}>{primary.label}<kbd aria-hidden="true">Enter</kbd></button>
      </div>
      <button type="button" className="kit-link pg-see" onClick={onCard}>কার্ড বানাও, বন্ধুকে পাঠাও</button>
    </section>
  );
}

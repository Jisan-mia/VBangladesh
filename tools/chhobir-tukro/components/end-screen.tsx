"use client";
// The end screen: a cardboard slip over the tray, the painting still in view. The stars pop in one by one (StarReveal
// clears its own chimes on unmount), and the real stats count up (all at once in slow mode).
import { useEffect, useRef, useState } from "react";
import { StarReveal } from "../../../shared/game-ui";
import { bn, clockText } from "../lib/link";
import { countAt } from "../lib/table.hot";

export type EndStats = { seconds: number; wrong: number; best: number; turned: number; stars: number; rotate: boolean };
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
    { label: "সময়", value: clockText(countAt(stats.seconds, t)) },
    { label: "ভুল", value: bn(countAt(stats.wrong, t)) },
    { label: "টানা", value: bn(countAt(stats.best, t)) },
    stats.rotate ? { label: "ঘোরানো", value: bn(countAt(stats.turned, t)) } : null,
  ].filter(row => row !== null);
  return (
    <section className="ct-end" aria-labelledby="ct-end-title">
      <div className="ct-end-head">
        <h2 id="ct-end-title">{title}</h2>
        <StarReveal count={stats.stars} />
      </div>
      <dl className="ct-stats" data-count={rows.length} aria-label="এই ছবির হিসাব">
        {rows.map(row => <div key={row.label}><dt>{row.label}</dt><dd>{row.value}</dd></div>)}
      </dl>
      <p className="ct-end-line">{line}</p>
      {note && <p className="ct-end-note">{note}</p>}
      <div className="ct-end-actions">
        <button type="button" className="kit-secondary" onClick={secondary.run}>{secondary.label}</button>
        <button type="button" className="kit-primary" onClick={primary.run}>{primary.label}<kbd aria-hidden="true">Enter</kbd></button>
      </div>
      <button type="button" className="kit-link ct-see" onClick={onCard}>কার্ড বানাও, বন্ধুকে পাঠাও</button>
    </section>
  );
}

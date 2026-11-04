"use client";
// The end screen: the place and stars come in, then the real stats count up (all at once in ধীরে খেলো).
import { useEffect, useRef, useState, type CSSProperties } from "react";
import { StarReveal } from "../../../shared/game-ui";
import { SEATS } from "../lib/art";
import { countAt } from "../lib/motion.hot";
import { bn } from "../lib/result";
import { Shape } from "./start-card";

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

export type Stat = { label: string; value: number; sign?: "+" | "−"; unit?: string };
export type Standing = { seat: number; name: string; square: number; note: string; first: boolean };
export type Action = { label: string; run: () => void };

export function Finish({ id, kicker, title, seat, stars, stats, lines, standings, note, slow, primary, secondary, onSeeCard }: {
  id: string; kicker: string; title: string; seat: number; stars: number | null; stats: Stat[]; lines: string[]; standings: Standing[]; note: string; slow: boolean;
  primary: Action; secondary: Action[]; onSeeCard: () => void;
}) {
  const t = useCountUp(id, slow);
  return (
    <section className="sl-finish" aria-labelledby="sl-finish-title" style={{ "--seat": SEATS[seat].color } as CSSProperties}>
      <p className="sl-finish-kicker">{kicker}</p>
      <h2 id="sl-finish-title">{title}</h2>
      {stars !== null && <StarReveal count={stars} />}
      <dl className="sl-stats" aria-label="এই খেলার হিসাব">
        {stats.map(stat => <div key={stat.label}><dt>{stat.label}</dt><dd>{stat.sign && stat.value ? stat.sign : ""}{bn(countAt(stat.value, t))}{stat.unit ? ` ${stat.unit}` : ""}</dd></div>)}
      </dl>
      {standings.length > 0 && (
        <ol className="sl-standings">
          {standings.map(row => (
            <li key={row.seat} data-first={row.first || undefined}>
              <Shape seat={row.seat} size={16} />
              <span>{row.name}</span>
              <b>{bn(countAt(row.square, t))}</b>
              <small>{row.note}</small>
            </li>
          ))}
        </ol>
      )}
      {lines.map(line => <p key={line} className="sl-finish-line">{line}</p>)}
      {note && <p className="sl-finish-note">{note}</p>}
      <div className="sl-finish-actions">
        <button type="button" className="kit-primary" onClick={primary.run} data-first>{primary.label}</button>
        {secondary.map(action => <button key={action.label} type="button" className="kit-secondary" onClick={action.run}>{action.label}</button>)}
      </div>
      <button type="button" className="kit-link sl-see" onClick={onSeeCard}>কার্ড দেখো ↓</button>
    </section>
  );
}

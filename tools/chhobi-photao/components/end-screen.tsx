"use client";
// The end screen: the finished stitched picture in its frame, the stars popping in one by one (StarReveal clears its own
// chimes on unmount), and the real stats counting up (all at once in slow mode).
import { useEffect, useRef, useState } from "react";
import { StarReveal } from "../../../shared/game-ui";
import { countAt } from "../lib/anim.hot";
import { paintCanvas } from "../lib/art";
import { bn, clockText } from "../lib/link";
import { ArtCanvas } from "./art-canvas";

export type EndStats = { seconds: number; wrong: number; stitches: number; longest: number; stars: number };
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

export function EndScreen({ level, stats, title, line, note, slow, finale, primary, secondary, onCard }: {
  level: number; stats: EndStats; title: string; line: string; note: string; slow: boolean; finale: boolean;
  primary: { label: string; run: () => void }; secondary: { label: string; run: () => void }; onCard: () => void;
}) {
  const t = useCountUp(stats, slow);
  const rows = [
    { label: "সময়", value: clockText(countAt(stats.seconds, t)) },
    { label: "ভুল", value: bn(countAt(stats.wrong, t)) },
    { label: "ফোঁড়", value: bn(countAt(stats.stitches, t)) },
    { label: "লম্বা টান", value: bn(countAt(stats.longest, t)) },
  ];
  return (
    <section className="cp-end" aria-labelledby="cp-end-title" data-finale={finale || undefined}>
      <div className="cp-end-pic">
        <ArtCanvas className="cp-end-art" deps={String(level)} label={title}
          draw={(canvas, width) => {
            const ratio = Math.min(2, window.devicePixelRatio || 1);
            canvas.width = canvas.height = Math.round(width * ratio);
            canvas.getContext("2d")!.drawImage(paintCanvas(level, width * ratio), 0, 0);
          }} />
        {finale && !slow && <i className="cp-sheen" aria-hidden="true" />}
      </div>
      <div className="cp-end-head">
        <h2 id="cp-end-title">{title}</h2>
        <StarReveal count={stats.stars} />
      </div>
      <dl className="cp-stats" aria-label="এই ছবির হিসাব">
        {rows.map(row => <div key={row.label}><dt>{row.label}</dt><dd>{row.value}</dd></div>)}
      </dl>
      <p className="cp-end-line">{line}</p>
      {note && <p className="cp-end-note">{note}</p>}
      <div className="cp-end-actions">
        <button type="button" className="kit-secondary" onClick={secondary.run}>{secondary.label}</button>
        <button type="button" className="kit-primary" onClick={primary.run}>{primary.label}<kbd aria-hidden="true">Enter</kbd></button>
      </div>
      <button type="button" className="kit-link cp-see" onClick={onCard}>কার্ড বানাও, বন্ধুকে পাঠাও</button>
    </section>
  );
}

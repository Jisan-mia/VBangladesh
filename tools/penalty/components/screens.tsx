"use client";
// Small presentational pieces for the match: the pre-drawn art canvases, the count-up numbers, the kick dots and the match list.
import { useEffect, useRef, useState } from "react";
import { bn } from "../lib/lines";
import { LEVELS, PER_WORLD, WORLDS } from "../lib/levels";
import { playable } from "../lib/progress";
import type { LevelStars } from "../../../shared/game-core";

const calmPhone = () => { try { return matchMedia("(prefers-reduced-motion: reduce)").matches || localStorage.getItem("ektukhani-slow") === "1"; } catch { return false; } };

/** A number that counts up from 0 over 0.7 s (at once in ধীরে খেলো). */
export function CountUp({ value, suffix = "" }: { value: number; suffix?: string }) {
  const [shown, setShown] = useState(0);
  useEffect(() => {
    if (calmPhone()) { setShown(value); return; }
    let frame = 0;
    const began = performance.now();
    const tick = (now: number) => {
      const t = Math.min(1, (now - began) / 700);
      setShown(Math.round(value * (1 - (1 - t) ** 3)));
      if (t < 1) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [value]);
  return <>{bn(shown)}{suffix}</>;
}

/** A pre-drawn art canvas, redrawn when its box or its drawing changes. */
export function Art({ draw, label, className }: { draw: (canvas: HTMLCanvasElement, width: number, height: number) => void; label: string; className: string }) {
  const ref = useRef<HTMLCanvasElement>(null);
  const drawRef = useRef(draw);
  drawRef.current = draw;
  useEffect(() => {
    const element = ref.current;
    if (!element) return;
    const paint = () => { if (element.clientWidth) drawRef.current(element, element.clientWidth, element.clientHeight); };
    paint();
    const observer = new ResizeObserver(paint);
    observer.observe(element);
    return () => observer.disconnect();
  }, []);
  useEffect(() => { const element = ref.current; if (element?.clientWidth) draw(element, element.clientWidth, element.clientHeight); });
  return <canvas ref={ref} className={className} role="img" aria-label={label} />;
}

/** A ✓ or ✕ per kick (so colour is never the only signal), the last five in sudden death. */
export function Dots({ marks, slots }: { marks: readonly number[]; slots: number }) {
  const cells = marks.length > slots ? marks.slice(-5) : marks.concat(Array.from({ length: slots - marks.length }, () => -1));
  return <span className="pk-dots" aria-hidden="true">{cells.map((mark, i) => <i key={i} data-k={mark < 0 ? "wait" : mark ? "goal" : "miss"}>{mark < 0 ? "" : mark ? "✓" : "✕"}</i>)}</span>;
}

/** The match list: four cups, three numbered rounds each, the next one to play marked. A choice screen: play is stopped under it. */
export function Picker({ world, setWorld, level, unlock, stars, friendLevel, suggest, total, onPick, onClose }: {
  world: number; setWorld: (world: number) => void; level: number; unlock: number; stars: LevelStars; friendLevel: number; suggest: number; total: number;
  onPick: (level: number) => void; onClose: () => void;
}) {
  return (
    <div className="pk-picker" role="dialog" aria-modal="false" aria-labelledby="pk-picker-title">
      <div className="pk-picker-card">
        <h2 id="pk-picker-title">সব ম্যাচ <span>★ {bn(total)}/{bn(LEVELS.length * 3)}</span></h2>
        <div className="pk-worlds" role="tablist" aria-label="কাপ">
          {WORLDS.map((each, index) => <button key={each.name} type="button" role="tab" aria-selected={world === index} onClick={() => setWorld(index)}>{each.name}</button>)}
        </div>
        <p className="pk-place">{WORLDS[world].place} · ১, ২, ৩ চেপেও বাছতে পারো</p>
        <ol className="pk-levels">
          {LEVELS.slice(world * PER_WORLD, (world + 1) * PER_WORLD).map((each, index) => {
            const number = world * PER_WORLD + index + 1, open = playable(number, unlock, stars, friendLevel), earned = stars[number] ?? 0;
            return <li key={number}>
              <button type="button" disabled={!open} aria-current={number === level || undefined} onClick={() => onPick(number)}>
                <b className="pk-num">{open ? bn(index + 1) : <svg viewBox="0 0 24 24" aria-label="বন্ধ"><rect x="5" y="11" width="14" height="9" rx="2" /><path d="M8 11V8a4 4 0 0 1 8 0v3" /></svg>}</b>
                <span className="pk-what"><strong>{each.finale ? "ফাইনাল: " : ""}{each.name}</strong><small>{each.team.name} · {each.teach}</small></span>
                {number === suggest && open ? <em className="pk-rec">এটা খেলো</em> : <span className="gx-stars" aria-label={`${bn(earned)} তারা`}>{[0, 1, 2].map(star => <span key={star} className={star < earned ? "on" : ""}>★</span>)}</span>}
              </button>
            </li>;
          })}
        </ol>
        <button type="button" className="pk-back" onClick={onClose}>ফিরে যাও</button>
      </div>
    </div>
  );
}

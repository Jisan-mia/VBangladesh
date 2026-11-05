"use client";
// The end of a spin: the stars pop in, the seconds count up, then real stats and numbered choices. The count-up is one rAF
// loop, cancelled on unmount; in ধীরে খেলো everything shows at once.
import { useEffect, useRef, useState } from "react";
import { bn, percent, secs } from "../lib/lines";
import { Star } from "./icons";

export type EndStats = {
  won: boolean; kicker: string; title: string;
  /** Tenths of a second, the palm bonus included. */
  score: number; palm: boolean;
  stars: number; maxStars: number;
  power: number; straight: number;
  good: number; nudges: number; bestCombo: number;
  faced: number; braced: number;
  /** The finale's named move and how often it came and was braced. */
  move: string; waveFaced: number; waveBraced: number;
  fall: string; line: string; near: string; record: string; fresh: string;
};
export type Choice = { label: string; run: () => void };

const COUNT_MS = 800;
const starAt = (index: number) => 0.3 + index * 0.28;

type Kind = "int" | "secs" | "pct";
const show = (value: number, kind: Kind) => kind === "secs" ? secs(value) : kind === "pct" ? percent(value / 100) : bn(Math.round(value));

/**
 * A number that counts up to its value. One rAF loop writes the text straight to the node (no re-render per frame), ends
 * with an ease-out so it settles, and is cancelled on unmount. In ধীরে খেলো, or with reduced motion, it just shows the number.
 */
function Count({ to, kind = "int", still }: { to: number; kind?: Kind; still: boolean }) {
  const node = useRef<HTMLElement>(null);
  useEffect(() => {
    const element = node.current;
    if (!element) return;
    if (still || to === 0) { element.textContent = show(to, kind); return; }
    let frame = 0;
    const start = performance.now();
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / COUNT_MS);
      element.textContent = show(to * (1 - (1 - t) ** 3), kind);
      if (t < 1) frame = requestAnimationFrame(tick);
    };
    element.textContent = show(0, kind);
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [to, kind, still]);
  return <b ref={node}>{show(to, kind)}</b>;
}

export function EndScreen({ stats, slow, choices, onCard }: { stats: EndStats; slow: boolean; choices: Choice[]; onCard: (() => void) | null }) {
  const [calm, setCalm] = useState(slow);
  useEffect(() => { setCalm(slow || matchMedia("(prefers-reduced-motion: reduce)").matches); }, [slow]);
  return (
    <div className="lt-end" data-won={stats.won || undefined}>
      <p className="lt-end-kicker">{stats.kicker}</p>
      {stats.won ? (
        <p className="gx-stars lt-end-stars" role="img" aria-label={`৩টার মধ্যে ${bn(stats.stars)}টা তারা`}>
          {[0, 1, 2].map(star => <span key={star} className={star < stats.stars ? "on gx-pop" : star >= stats.maxStars ? "lt-capped" : ""} style={{ animationDelay: `${starAt(star)}s` }}><Star /></span>)}
        </p>
      ) : <p className="lt-end-lost">{stats.title}</p>}
      <p className="lt-end-score" aria-label={`${secs(stats.score)} সেকেন্ড${stats.palm ? ", হাতে তুলে ৫ সেকেন্ড বোনাস" : ""}`}>
        <span aria-hidden="true"><Count to={stats.score} kind="secs" still={calm} /> সেকেন্ড{stats.palm ? " (হাতে তুলে +৫)" : ""}</span>
      </p>
      {stats.fall && <p className="lt-end-fall">{stats.fall}</p>}
      <p className="lt-end-line">{stats.line}</p>
      <ul className="lt-end-stats">
        <li><b><Count to={stats.power * 100} kind="pct" still={calm} /> · <Count to={stats.straight * 100} kind="pct" still={calm} /></b><span>জোর · সোজা</span></li>
        {stats.nudges > 0 && <li data-tone="good"><b><Count to={stats.good} still={calm} />/{bn(stats.nudges)}</b><span>ঠিক টোকা</span></li>}
        {stats.bestCombo >= 2 && <li data-tone="good"><b><Count to={stats.bestCombo} still={calm} /></b><span>সবচেয়ে টানা</span></li>}
        {stats.faced > 0 && <li><b><Count to={stats.braced} still={calm} />/{bn(stats.faced)}</b><span>ধাক্কা সামলেছ</span></li>}
        {stats.move && stats.waveFaced > 0 && <li data-tone="gold"><b><Count to={stats.waveBraced} still={calm} />/{bn(stats.waveFaced)}</b><span>{stats.move}</span></li>}
      </ul>
      {stats.near && <p className="lt-end-near">{stats.near}</p>}
      {stats.record && <p className="lt-end-best">{stats.record}</p>}
      {stats.fresh && <p className="lt-end-badge">{stats.fresh}</p>}
      <ol className="lt-end-choices" data-count={choices.length}>
        {choices.map((choice, index) => (
          <li key={choice.label}>
            <button type="button" className={index === 0 ? "kit-primary" : "kit-secondary"} onClick={event => { event.currentTarget.blur(); choice.run(); }}>
              <kbd aria-hidden="true">{bn(index + 1)}</kbd>{choice.label}{index === 0 && <em>এটাই ভালো</em>}
            </button>
          </li>
        ))}
      </ol>
      {onCard && <button type="button" className="kit-link lt-see" onClick={event => { event.currentTarget.blur(); onCard(); }}>কার্ডটা দেখো ↓</button>}
    </div>
  );
}

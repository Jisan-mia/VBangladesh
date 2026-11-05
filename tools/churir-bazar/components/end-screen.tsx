"use client";
// The end of a run: the stars pop in, the stats count up, then the biggest single move, the line, the exact near-miss and the
// numbered choices. The count-up is one rAF loop, cancelled on unmount; in slow mode everything shows at once.
import { useEffect, useLayoutEffect, useRef } from "react";
import { drawBangle } from "../lib/art";
import { bn } from "../lib/words";

export type EndStats = {
  kicker: string; why: string; won: boolean; stars: number; maxStars: number; showStars: boolean; piece: number;
  moves: number; limit: number; score: number; lifted: number; cascade: number; sparkles: number; rainbows: number; freed: number; wiped: number; seconds: number;
  bestMove: string; line: string; near: string; best: string;
};
export type Choice = { label: string; run: () => void };
/** The score is the lead and counts longest; the rest follow in 520–700 ms, so the row doesn't tick like one metronome. */
const COUNT_MS = { score: 850, other: 560 };
const easeOut = (t: number) => 1 - (1 - t) ** 3;
const starAt = (index: number) => 0.3 + index * 0.28;

/** A number that counts up from the DOM (no React render per frame): the final value is in the markup, the effect animates it. */
function Num({ value, lead }: { value: number; lead?: boolean }) {
  return <span data-count={value} data-ms={lead ? COUNT_MS.score : COUNT_MS.other}>{bn(value)}</span>;
}

export function EndScreen({ stats, slow, choices, onCard }: { stats: EndStats; slow: boolean; choices: Choice[]; onCard: () => void }) {
  const box = useRef<HTMLDivElement>(null), art = useRef<HTMLCanvasElement>(null);
  // one rAF loop for every counter, cancelled on unmount; in ধীরে খেলো (and reduced motion) the final numbers just stay
  useLayoutEffect(() => {
    const root = box.current;
    if (!root || slow) return;
    const nodes = Array.from(root.querySelectorAll<HTMLElement>("span[data-count]")), finals = nodes.map(node => node.textContent ?? "");
    nodes.forEach((node, index) => { node.textContent = bn(0); node.dataset.at = String(index * 40); });
    let frame = 0;
    const start = performance.now();
    const tick = (now: number) => {
      let running = false;
      nodes.forEach((node, index) => {
        const total = Number(node.dataset.ms), t = Math.min(1, Math.max(0, (now - start - Number(node.dataset.at)) / total));
        node.textContent = t >= 1 ? finals[index] : bn(Math.round(Number(node.dataset.count) * easeOut(t)));
        if (t < 1) running = true;
      });
      if (running) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => { cancelAnimationFrame(frame); nodes.forEach((node, index) => { node.textContent = finals[index]; }); };
  }, [stats, slow]);
  useEffect(() => {
    const target = art.current;
    if (!target) return;
    const ratio = Math.min(2, window.devicePixelRatio || 1), side = 76;
    target.width = target.height = side * ratio;
    const c = target.getContext("2d");
    if (!c) return;
    c.setTransform(ratio, 0, 0, ratio, 0, 0);
    drawBangle(c, stats.piece, 0, 0, side);
  }, [stats.piece]);

  return (
    <div className="cb-end" ref={box} data-slow={slow || undefined} data-won={stats.won || undefined}>
      <div className="cb-end-top">
        <canvas ref={art} className="cb-end-art" aria-hidden="true" />
        <div>
          <p className="cb-end-kicker">{stats.kicker}</p>
          <p className="cb-end-why">{stats.why}</p>
          {stats.showStars && (
            <p className="gx-stars cb-end-stars" role="img" aria-label={`৩টার মধ্যে ${bn(stats.stars)}টা তারা`}>
              {[0, 1, 2].map(star => <span key={star} className={star < stats.stars ? "on gx-pop" : star >= stats.maxStars ? "cb-capped" : ""} style={{ animationDelay: `${starAt(star)}s` }}>★</span>)}
            </p>
          )}
        </div>
      </div>
      <ul className="cb-end-stats">
        <li><b><Num value={stats.moves} /><small>/{bn(stats.limit)}</small></b><span>চাল</span></li>
        <li><b><Num value={stats.score} lead /></b><span>পয়েন্ট</span></li>
        <li><b><Num value={stats.lifted} /></b><span>চুড়ি তুলেছ</span></li>
        <li><b><Num value={stats.cascade} /></b><span>সেরা পরপর</span></li>
        {stats.sparkles + stats.rainbows > 0 && <li><b><Num value={stats.sparkles} />+<Num value={stats.rainbows} /></b><span>ঝিকমিক + রংধনু</span></li>}
        {stats.freed > 0 && <li><b><Num value={stats.freed} /></b><span>তালা খুলেছ</span></li>}
        {stats.wiped > 0 && <li><b><Num value={stats.wiped} /></b><span>ধুলো মুছেছ</span></li>}
        <li><b><Num value={stats.seconds} /> সে.</b><span>সময়</span></li>
      </ul>
      {stats.bestMove && <p className="cb-end-swipe">{stats.bestMove}</p>}
      <p className="cb-end-line">{stats.line}</p>
      {stats.near && <p className="cb-end-near">{stats.near}</p>}
      {stats.best && <p className="cb-end-best">{stats.best}</p>}
      <ol className="cb-end-choices" data-n={choices.length}>
        {choices.map((choice, index) => (
          <li key={choice.label}>
            <button type="button" className={index === 0 ? "kit-primary" : "kit-secondary"} onClick={event => { event.currentTarget.blur(); choice.run(); }}>
              <kbd aria-hidden="true">{bn(index + 1)}</kbd>{choice.label}{index === 0 && <em>এটাই ভালো</em>}
            </button>
          </li>
        ))}
      </ol>
      {stats.won && <button type="button" className="kit-link cb-see" onClick={event => { event.currentTarget.blur(); onCard(); }}>কার্ড দেখো ↓</button>}
    </div>
  );
}

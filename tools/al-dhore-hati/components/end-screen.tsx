"use client";
// The end of a field: the stars pop in, the metres count up, then real stats and numbered choices.
// The count-up is one rAF loop, cancelled on unmount; in slow mode everything shows at once.
import { useEffect, useRef } from "react";
import { bn } from "../lib/link";
import { Arrow } from "./icons";

export type EndStats = {
  kicker: string; why: string; cleared: boolean;
  metres: number; walked: number; stars: number; maxStars: number; levelRun: boolean;
  slips: number; lives: number; dry: number; nears: number; passed: number; seconds: number; gusts: number;
  line: string; near: string; best: string; versus: string;
};
export type Choice = { label: string; run: () => void };

const COUNT_MS = 800;
/** The panel rises first; the numbers start counting as it settles. */
const COUNT_DELAY = 120;
const starAt = (index: number) => 0.3 + index * 0.28;
const tenths = new Intl.NumberFormat("bn-BD", { minimumFractionDigits: 1, maximumFractionDigits: 1 });

/** The count-up is one rAF loop writing text straight into the numbers (no React render per frame), cancelled on unmount; slow mode and reduced motion show the end values at once. */
function useCountUp(box: React.RefObject<HTMLDivElement | null>, stats: EndStats, instant: boolean) {
  useEffect(() => {
    const root = box.current;
    if (!root) return;
    const nodes = [...root.querySelectorAll<HTMLElement>("[data-count]")];
    const write = (progress: number) => {
      for (const node of nodes) {
        const value = Number(node.dataset.count) * progress;
        node.textContent = node.dataset.kind === "seconds" ? `${tenths.format(value)} সে.` : bn(Math.round(value));
      }
    };
    if (instant) { write(1); return; }
    write(0);
    let frame = 0, start = 0;
    const tick = (now: number) => {
      start ||= now;
      const t = Math.min(1, Math.max(0, (now - start - COUNT_DELAY) / COUNT_MS));
      write(1 - (1 - t) ** 3);
      if (t < 1) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [stats, instant, box]);
}

export function EndScreen({ stats, slow, choices, onCard, canCard }: { stats: EndStats; slow: boolean; choices: Choice[]; onCard: () => void; canCard: boolean }) {
  const box = useRef<HTMLDivElement>(null);
  const instant = slow || (typeof matchMedia !== "undefined" && matchMedia("(prefers-reduced-motion: reduce)").matches);
  useCountUp(box, stats, instant);
  return (
    <div className="al-end" ref={box} data-slow={slow || undefined} data-won={stats.cleared || undefined}>
      <p className="al-end-kicker">{stats.kicker}</p>
      <p className="al-end-why">{stats.why}</p>
      {stats.levelRun && (
        <p className="gx-stars al-end-stars" role="img" aria-label={`৩টার মধ্যে ${bn(stats.stars)}টা তারা`}>
          {[0, 1, 2].map(star => <span key={star} className={star < stats.stars ? "on gx-pop" : star >= stats.maxStars ? "al-capped" : ""} style={{ animationDelay: `${starAt(star)}s` }}>★</span>)}
        </p>
      )}
      <p className="al-end-metres" aria-label={`${bn(stats.metres)} মিটারের মধ্যে ${bn(stats.walked)} মিটার`}>
        <b aria-hidden="true" data-count={stats.walked}>{bn(stats.walked)}</b><span aria-hidden="true">/{bn(stats.metres)}</span> মিটার
      </p>
      <p className="al-end-line">{stats.versus || stats.line}</p>
      <ul className="al-end-stats">
        <li><b><i data-count={stats.slips}>{bn(stats.slips)}</i> বার</b><span>পিছলেছ</span></li>
        <li><b><i data-count={stats.dry}>{bn(stats.dry)}</i> মিটার</b><span>টানা শুকনো</span></li>
        <li><b><i data-count={stats.nears}>{bn(stats.nears)}</i> বার</b><span>অল্পের জন্য</span></li>
        <li><b><i data-count={stats.passed}>{bn(stats.passed)}</i>টা</b><span>পানি-ছাগল-সাঁকো পার</span></li>
        {stats.gusts > 0 && <li><b><i data-count={stats.gusts}>{bn(stats.gusts)}</i>টা</b><span>দমকা সামলেছ</span></li>}
        <li><b data-count={stats.seconds} data-kind="seconds">{tenths.format(stats.seconds)} সে.</b><span>সময়</span></li>
      </ul>
      {stats.near && <p className="al-end-near">{stats.near}</p>}
      {stats.best && <p className="al-end-best">{stats.best}</p>}
      <ol className="al-end-choices" data-n={choices.length}>
        {choices.map((choice, index) => (
          <li key={choice.label}>
            <button type="button" className={index === 0 ? "kit-primary" : "kit-secondary"} onClick={event => { event.currentTarget.blur(); choice.run(); }}>
              <kbd aria-hidden="true">{bn(index + 1)}</kbd>{choice.label}{index === 0 && <em>এটাই ভালো</em>}
            </button>
          </li>
        ))}
      </ol>
      {canCard && <button type="button" className="kit-link" onClick={event => { event.currentTarget.blur(); onCard(); }}>কার্ডটা দেখো <Arrow down /></button>}
    </div>
  );
}

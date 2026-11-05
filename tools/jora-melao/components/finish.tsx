"use client";
// The end screen: the finished board in small, the stars stamped in (StarReveal clears its own chimes on unmount), stats that
// count up, the exact near miss, and numbered choices. Result keys are handled by the game (fresh presses only).
import { useEffect, useState, type CSSProperties } from "react";
import { StarReveal } from "../../../shared/game-ui";
import { countAt } from "../lib/tick.hot";
import { bn } from "../lib/link";
import { PLAYER_COLORS } from "../lib/draw-card";
import { Pic } from "./picture";

export type Choice = { label: string; run: () => void };
export type FinishStats = { moves: number; misses: number; bestStreak: number; remembered: number; pairs: number; seconds: number; stars: number };
const COUNT_MS = 900;

/** Seconds as ০:৪২ in Bangla digits. */
export const clock = (seconds: number) => `${bn(Math.floor(seconds / 60))}:${bn(Math.floor(seconds % 60)).padStart(2, "০")}`;

export function Finish({ title, sub, stats, board, cols, owners, line, near, best, duo, slow, finale, choices, onCard }: {
  title: string; sub: string; stats: FinishStats; board: readonly number[]; cols: number; owners?: readonly number[]; line: string; near: string; best: string;
  duo?: { names: readonly [string, string]; pairs: readonly [number, number]; top: 0 | 1 | null }; slow: boolean; finale: boolean; choices: readonly Choice[]; onCard: () => void;
}) {
  const [t, setT] = useState(slow ? 1 : 0);
  useEffect(() => {
    if (slow) { setT(1); return; }
    let frame = 0;
    const started = performance.now();
    const step = (now: number) => {
      const progress = Math.min(1, (now - started) / COUNT_MS);
      setT(progress);
      if (progress < 1) frame = requestAnimationFrame(step);
    };
    setT(0);
    frame = requestAnimationFrame(step);
    return () => cancelAnimationFrame(frame);
  }, [stats, slow]);

  return (
    <section className="jm-over" aria-labelledby="jm-over-title" data-finale={finale || undefined} data-still={slow || undefined}>
      <header>
        <p>{sub}</p>
        <h2 id="jm-over-title">{title}</h2>
      </header>
      <ol className="jm-mini-board" style={{ "--cols": cols } as CSSProperties} aria-hidden="true">
        {board.map((id, index) => (
          <li key={index} style={owners && owners[index] >= 0 ? { "--who": PLAYER_COLORS[owners[index]] } as CSSProperties : undefined} data-owner={owners && owners[index] >= 0 ? owners[index] : undefined}><Pic id={id} /></li>
        ))}
      </ol>
      {duo ? (
        <div className="jm-duo-score">
          {([0, 1] as const).map(seat => (
            <p key={seat} data-top={duo.top === seat || undefined} style={{ "--who": PLAYER_COLORS[seat] } as CSSProperties}><span>{duo.names[seat]}</span><b>{bn(countAt(duo.pairs[seat], t))}<small> জোড়া</small></b></p>
          ))}
        </div>
      ) : (
        <>
          <div className="jm-over-total">
            <b aria-label={`${bn(stats.moves)} চাল`}><span aria-hidden="true">{bn(countAt(stats.moves, t))}</span><small> চাল</small></b>
            {stats.stars > 0 && <StarReveal count={stats.stars} />}
          </div>
          <dl className="jm-over-stats">
            <div><dt>ভুল চাল</dt><dd>{bn(countAt(stats.misses, t))}</dd></div>
            <div><dt>সেরা টানা</dt><dd>{bn(countAt(stats.bestStreak, t))}</dd></div>
            <div><dt>মনে রেখে</dt><dd>{bn(countAt(stats.remembered, t))}/{bn(stats.pairs)}</dd></div>
            <div><dt>সময়</dt><dd>{clock(countAt(stats.seconds, t))}</dd></div>
          </dl>
        </>
      )}
      <p className="jm-over-line">{line}</p>
      {near && <p className="jm-over-near">{near}</p>}
      {best && <p className="jm-over-best">{best}</p>}
      <ol className="jm-over-choices">
        {choices.map((choice, index) => (
          <li key={choice.label}>
            <button type="button" className={index === 0 ? "kit-primary" : "kit-secondary"} onClick={event => { event.currentTarget.blur(); choice.run(); }}>
              <kbd aria-hidden="true">{bn(index + 1)}</kbd>{choice.label}{index === 0 && <em>এটাই ভালো</em>}
            </button>
          </li>
        ))}
      </ol>
      <button type="button" className="kit-link jm-see" onClick={event => { event.currentTarget.blur(); onCard(); }}>কার্ড বানাও ↓</button>
    </section>
  );
}

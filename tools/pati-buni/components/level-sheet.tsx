"use client";
// সব পাটি: the choice screen. Three worlds of four, numbered for the keyboard (1–9, 0, -, =), each with its one new thing
// and its stars, plus খোলা পাটি (O); the recommended one wears এটা খেলো. Opening it pauses a run in progress (the caller's job).
import { useEffect, useRef } from "react";
import type { LevelStars } from "../../../shared/game-core";
import { CLASSIC, LEVELS, PER_WORLD, WORLDS, isFinale } from "../lib/levels";
import { bn } from "../lib/link";

export const LIST_KEYS = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "0", "-", "="] as const;
export const CLASSIC_KEY = "o";

export function LevelSheet({ stars, playable, current, recommended, best, onPick, onClose }: {
  stars: LevelStars; playable: (level: number) => boolean; current: number; recommended: number; best: number | null;
  onPick: (level: number) => void; onClose: () => void;
}) {
  const total = Object.values(stars).reduce((sum, earned) => sum + earned, 0);
  const box = useRef<HTMLDivElement>(null);
  useEffect(() => { box.current?.querySelector<HTMLElement>("[data-next]")?.focus({ preventScroll: false }); }, []);
  return (
    <div className="pb-sheet" role="dialog" aria-modal="true" aria-labelledby="pb-sheet-title">
      <div className="pb-sheet-card" ref={box}>
        <header>
          <h2 id="pb-sheet-title">সব পাটি</h2>
          <p>★ {bn(total)}/{bn(LEVELS.length * 3)} · খেলা থেমে আছে</p>
          <button type="button" className="pb-sheet-close" onClick={onClose} aria-label="বন্ধ করো, খেলায় ফেরো">
            <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 6l12 12M18 6 6 18" /></svg>
          </button>
        </header>
        {WORLDS.map((world, w) => (
          <section key={world.name} className="pb-world" data-look={world.look}>
            <h3><i aria-hidden="true" />{world.name}</h3>
            <ol>
              {LEVELS.slice(w * PER_WORLD, (w + 1) * PER_WORLD).map((row, i) => {
                const level = w * PER_WORLD + i + 1, open = playable(level), earned = stars[level] ?? 0;
                return (
                  <li key={level}>
                    <button type="button" disabled={!open} onClick={() => onPick(level)}
                      aria-current={level === current ? "true" : undefined} data-next={level === recommended || undefined} data-finale={isFinale(level) || undefined}
                      aria-label={`${bn(level)}. ${row.name}${open ? "" : ", বন্ধ"}${earned ? `, ${bn(earned)} তারা` : ""}${level === recommended ? ", এটা খেলো" : ""}. ${row.line}`}>
                      <kbd aria-hidden="true">{LIST_KEYS[level - 1]}</kbd>
                      <span className="pb-row-name"><b>{bn(level)} · {row.name}</b>{level === recommended && <em>এটা খেলো</em>}</span>
                      <span className="pb-row-line">{open ? row.line : "আগের পাটিটা বোনা হলে খুলবে।"}</span>
                      <span className="pb-row-stars" aria-hidden="true">
                        {open ? [0, 1, 2].map(s => <i key={s} data-on={s < earned || undefined}>★</i>) : <svg viewBox="0 0 24 24"><rect x="5" y="11" width="14" height="9" rx="2" /><path d="M8 11V8a4 4 0 0 1 8 0v3" /></svg>}
                      </span>
                    </button>
                  </li>
                );
              })}
            </ol>
          </section>
        ))}
        <section className="pb-world" data-look="classic">
          <h3><i aria-hidden="true" />আরও</h3>
          <ol>
            <li>
              <button type="button" onClick={() => onPick(0)} aria-current={current === 0 ? "true" : undefined} aria-label={`${CLASSIC.name}. ${CLASSIC.line}`}>
                <kbd aria-hidden="true">O</kbd>
                <span className="pb-row-name"><b>{CLASSIC.name}</b></span>
                <span className="pb-row-line">{CLASSIC.line}</span>
                <span className="pb-row-stars pb-row-best" aria-hidden="true">{best ? `সেরা ${bn(best)}` : ""}</span>
              </button>
            </li>
          </ol>
        </section>
      </div>
    </div>
  );
}

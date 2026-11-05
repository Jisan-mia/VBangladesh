"use client";
// সব তলা: the choice screen. Three worlds of four, numbered for the keyboard (1–9, 0, -, =), each with its one new thing
// and its stars; the recommended floor wears এটা খেলো. Opening it pauses a floor in progress (the caller's job).
import { useEffect, useRef } from "react";
import type { LevelStars } from "../../../shared/game-core";
import { LEVELS, PER_WORLD, WORLDS, isFinale } from "../lib/levels";
import { bn } from "../lib/link";

export const LIST_KEYS = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "0", "-", "="] as const;
const Lock = () => <svg viewBox="0 0 24 24" aria-hidden="true"><rect x="5" y="11" width="14" height="9" rx="2" /><path d="M8 11V8a4 4 0 0 1 8 0v3" /></svg>;

export function FloorList({ stars, playable, current, recommended, onPick, onClose }: {
  stars: LevelStars; playable: (level: number) => boolean; current: number; recommended: number;
  onPick: (level: number) => void; onClose: () => void;
}) {
  const total = Object.values(stars).reduce((sum, earned) => sum + earned, 0);
  const box = useRef<HTMLDivElement>(null);
  useEffect(() => { box.current?.querySelector<HTMLElement>("[data-next]")?.focus({ preventScroll: false }); }, []);
  return (
    <div className="ms-sheet" role="dialog" aria-modal="true" aria-labelledby="ms-sheet-title">
      <div className="ms-sheet-card" ref={box}>
        <header>
          <h2 id="ms-sheet-title">সব তলা</h2>
          <p>★ {bn(total)}/{bn(LEVELS.length * 3)} · খেলা থেমে আছে</p>
          <button type="button" className="ms-sheet-close" onClick={onClose} aria-label="বন্ধ করো, খেলায় ফেরো">
            <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 6l12 12M18 6 6 18" /></svg>
          </button>
        </header>
        {WORLDS.map((world, w) => (
          <section key={world.name} className="ms-world" data-look={world.look}>
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
                      <span className="ms-row-name"><b>{bn(level)} · {row.name}</b>{isFinale(level) && <i>শেষ তলা</i>}{level === recommended && <em>এটা খেলো</em>}</span>
                      <span className="ms-row-line">{open ? row.line.replace(/^শেষ তলা: /, "") : "আগের তলাটা পার হলে খুলবে।"}</span>
                      <span className="ms-row-stars" aria-hidden="true">
                        {open ? [0, 1, 2].map(s => <i key={s} data-on={s < earned || undefined}>★</i>) : <Lock />}
                      </span>
                    </button>
                  </li>
                );
              })}
            </ol>
          </section>
        ))}
      </div>
    </div>
  );
}

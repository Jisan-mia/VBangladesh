"use client";
// সব লেভেল: the three tables with their eight boards, stars, locks, finales and the recommended level. Opening it pauses
// play (the caller's job); picking a level loads it on the start screen.
import { useEffect, useRef } from "react";
import type { LevelStars } from "../../../shared/game-core";
import { LEVEL_COUNT, PER_WORLD, WORLDS, isFinale, levelAt, worldStart } from "../lib/levels";
import { bn } from "../lib/link";

export function LevelSheet({ stars, open, visit, current, recommended, onPick, onClose }: {
  stars: LevelStars; open: number; visit: number; current: number; recommended: number;
  onPick: (level: number) => void; onClose: () => void;
}) {
  const close = useRef<HTMLButtonElement>(null);
  useEffect(() => { close.current?.focus({ preventScroll: true }); }, []);
  const total = Object.values(stars).reduce((sum, earned) => sum + earned, 0);
  return (
    <div className="jm-sheet" role="dialog" aria-modal="true" aria-labelledby="jm-sheet-title">
      <div className="jm-sheet-card">
        <header>
          <h2 id="jm-sheet-title">সব লেভেল</h2>
          <p>★ {bn(total)}/{bn(LEVEL_COUNT * 3)} · এখন খেলো: লেভেল {bn(recommended)}</p>
          <button ref={close} type="button" className="jm-sheet-close" onClick={onClose} aria-label="বন্ধ করো, খেলায় ফেরো">
            <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 6l12 12M18 6 6 18" /></svg>
          </button>
        </header>
        {WORLDS.map((world, index) => {
          const from = worldStart(index);
          return (
            <section key={world.name} className="jm-world" data-world={index}>
              <h3>{bn(index + 1)}. {world.name} <span>শেষ বোর্ড: {world.finale}</span></h3>
              <p>{world.rule}</p>
              <ol>
                {Array.from({ length: PER_WORLD }, (_, i) => {
                  const level = from + i, earned = stars[level] ?? 0, locked = level > open && level !== visit;
                  return (
                    <li key={level}>
                      <button type="button" disabled={locked} aria-current={level === current ? "true" : undefined}
                        data-finale={isFinale(level) || undefined} data-next={level === recommended || undefined}
                        aria-label={`লেভেল ${bn(level)}, ${bn(levelAt(level).pairs)} জোড়া${isFinale(level) ? `, ${world.finale}` : ""}${locked ? ", বন্ধ" : earned ? `, ${bn(earned)} তারা` : ""}${level === recommended ? ", এটা খেলো" : ""}`}
                        onClick={event => { event.currentTarget.blur(); onPick(level); }}>
                        <b>{locked ? <svg viewBox="0 0 24 24" aria-hidden="true"><rect x="5" y="11" width="14" height="9" rx="2" /><path d="M8 11V8a4 4 0 0 1 8 0v3" /></svg> : bn(level)}</b>
                        <small aria-hidden="true">{bn(levelAt(level).pairs)} জোড়া</small>
                        {(!locked || earned > 0) && <span className="jm-mini" aria-hidden="true">{[0, 1, 2].map(s => <i key={s} data-on={s < earned || undefined}>★</i>)}</span>}
                        {level === recommended && <em aria-hidden="true">এটা খেলো</em>}
                      </button>
                    </li>
                  );
                })}
              </ol>
            </section>
          );
        })}
      </div>
    </div>
  );
}

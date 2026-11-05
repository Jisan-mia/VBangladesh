"use client";
// সব লেভেল: four মেলা of ten, numbered, each with its one new thing and stars, finales marked, locks, and the recommended
// level marked এটা খেলো. Opening it pauses play (the caller's job). Keys 1–9 pick; ✕ closes.
import { useEffect, useRef } from "react";
import type { LevelStars } from "../../../shared/game-core";
import { DEFS, isFinale, LEVEL_COUNT, PER_WORLD, WORLDS, worldStart } from "../lib/ladder";
import { bn } from "../lib/words";

const Lock = () => <svg viewBox="0 0 24 24" aria-hidden="true"><rect x="5" y="10.5" width="14" height="10" rx="2.5" /><path d="M8 10.5V8a4 4 0 0 1 8 0v2.5" /></svg>;

export function LevelSheet({ stars, open, visit, current, recommended, onPick, onClose }: {
  stars: LevelStars; open: number; visit: number; current: number; recommended: number; onPick: (level: number) => void; onClose: () => void;
}) {
  const sheet = useRef<HTMLDivElement>(null);
  const total = Object.values(stars).reduce((sum, earned) => sum + earned, 0);
  useEffect(() => {
    sheet.current?.querySelector<HTMLElement>("[data-next]")?.focus({ preventScroll: false });
    const key = (event: KeyboardEvent) => {
      if (event.repeat || event.ctrlKey || event.metaKey || event.altKey || !/^[1-9]$/.test(event.key)) return;
      const level = Number(event.key);
      if (level <= open || level === visit) { event.preventDefault(); onPick(level); }
    };
    window.addEventListener("keydown", key);
    return () => window.removeEventListener("keydown", key);
  }, [open, visit, onPick]);

  return (
    <div className="cb-sheet" ref={sheet} role="dialog" aria-modal="true" aria-labelledby="cb-sheet-title">
      <div className="cb-sheet-head">
        <h2 id="cb-sheet-title">সব লেভেল <span>★ {bn(total)}/{bn(LEVEL_COUNT * 3)}</span></h2>
        <button type="button" className="cb-sheet-close" onClick={onClose} aria-label="বন্ধ করো, খেলায় ফেরো"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18" /></svg></button>
      </div>
      {WORLDS.map((world, index) => (
        <section key={world.name} className="cb-sheet-world" data-world={index}>
          <h3>{bn(index + 1)}. {world.name} <span>শেষ ধাপ: {world.finale}</span></h3>
          <ol>
            {DEFS.slice(worldStart(index) - 1, worldStart(index) - 1 + PER_WORLD).map((def, i) => {
              const level = worldStart(index) + i, earned = stars[level] ?? 0, locked = level > open && level !== visit;
              return (
                <li key={level}>
                  <button type="button" disabled={locked} data-next={level === recommended ? "" : undefined} aria-current={level === current ? "true" : undefined}
                    onClick={event => { event.currentTarget.blur(); onPick(level); }}
                    aria-label={`লেভেল ${bn(level)}, ${def.name}${locked ? ", বন্ধ" : earned ? `, ${bn(earned)} তারা` : ""}${level === recommended ? ", এটা খেলো" : ""}`}>
                    <b className="cb-sheet-num">{locked ? <Lock /> : bn(level)}</b>
                    <span className="cb-sheet-name">{def.name}{isFinale(level) && <i>শেষ ধাপ</i>}{level === recommended && !locked && <em>এটা খেলো</em>}</span>
                    <span className="cb-sheet-teach">{def.teach}</span>
                    <span className="cb-sheet-stars" aria-hidden="true">{[0, 1, 2].map(star => <span key={star} data-on={star < earned}>★</span>)}</span>
                  </button>
                </li>
              );
            })}
          </ol>
        </section>
      ))}
      <p className="cb-sheet-note">একটা লেভেল পার হলেই পরেরটা খোলে। বেশি পয়েন্টে বেশি তারা।</p>
    </div>
  );
}

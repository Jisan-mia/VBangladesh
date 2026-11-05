"use client";
// সব লেভেল: a choice screen with play paused behind it (the caller's job). Three places of five, numbered, each row with its
// one new thing and its stars. Finales say শেষ ধাপ, the level to play next says এটা খেলো, locked rows are dim with a lock.
import { useEffect, useRef } from "react";
import type { LevelStars } from "../../../shared/game-core";
import { LEVEL_COUNT, LEVELS, WORLDS } from "../lib/levels";
import { bn } from "../lib/words";

const Lock = () => <svg viewBox="0 0 24 24" aria-hidden="true"><rect x="5" y="10.5" width="14" height="10" rx="2.5" /><path d="M8 10.5V8a4 4 0 0 1 8 0v2.5" /></svg>;

export function LevelSheet({ stars, open, visit, current, next, onPick, onClose }: {
  stars: LevelStars; open: number; visit: number; current: number; next: number;
  onPick: (level: number) => void; onClose: () => void;
}) {
  const sheet = useRef<HTMLDivElement>(null);
  const locked = (level: number) => level > open && level !== visit;

  useEffect(() => {
    sheet.current?.querySelector<HTMLElement>("[data-next]")?.focus({ preventScroll: true });
    // 1–9 pick a level, as the numbers on the rows say; Escape belongs to the player, so ✕ closes.
    const key = (event: KeyboardEvent) => {
      if (event.repeat || event.ctrlKey || event.metaKey || event.altKey || !/^[1-9]$/.test(event.key)) return;
      const level = Number(event.key);
      if (!locked(level)) { event.preventDefault(); onPick(level); }
    };
    window.addEventListener("keydown", key);
    return () => window.removeEventListener("keydown", key);
  });

  const total = Object.values(stars).reduce((sum, earned) => sum + earned, 0);
  return (
    <div className="sc-sheet" ref={sheet} role="dialog" aria-modal="true" aria-labelledby="sc-sheet-title">
      <div className="sc-sheet-head">
        <h2 id="sc-sheet-title">সব লেভেল <span>★ {bn(total)}/{bn(LEVEL_COUNT * 3)}</span></h2>
        <button type="button" className="sc-sheet-close" onClick={onClose} aria-label="বন্ধ করো, খেলায় ফেরো">✕</button>
      </div>
      {WORLDS.map((world, index) => (
        <section key={world.name} className="sc-sheet-world" data-world={index}>
          <h3>{world.name}</h3>
          <ol>
            {LEVELS.map((def, i) => ({ def, level: i + 1 })).filter(({ def }) => def.world === index).map(({ def, level }) => {
              const shut = locked(level), earned = stars[level] ?? 0;
              return (
                <li key={level}>
                  <button type="button" disabled={shut} data-next={level === next ? "" : undefined} aria-current={level === current ? "true" : undefined} onClick={() => onPick(level)}
                    aria-label={`লেভেল ${bn(level)}, ${def.name}${shut ? ", বন্ধ" : earned ? `, ${bn(earned)} তারা` : ""}${level === next ? ", এটা খেলো" : ""}`}>
                    <b className="sc-sheet-num">{shut ? <Lock /> : bn(level)}</b>
                    <span className="sc-sheet-name">{def.name}{def.finale && <i>শেষ ধাপ</i>}{level === next && <em>এটা খেলো</em>}</span>
                    <span className="sc-sheet-teach">{def.finale ? def.finale.line : def.teach}</span>
                    <span className="sc-sheet-stars" aria-hidden="true">{[0, 1, 2].map(star => <span key={star} data-on={star < earned}>★</span>)}</span>
                  </button>
                </li>
              );
            })}
          </ol>
        </section>
      ))}
      <p className="sc-sheet-note">একটা লেভেল পার হলেই পরেরটা খোলে। বন্ধুর লিংকের লেভেল শুধু সেবার খেলা যায়।</p>
    </div>
  );
}

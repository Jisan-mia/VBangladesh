"use client";
// The level list, a choice screen with nothing running behind it: three worlds of four plus খোলা ঘাট, numbered, each with its
// one new thing and its stars. The next unplayed level is marked এটা খেলো; locked rows are dim and carry a lock shape.
import { useEffect, useRef } from "react";
import type { LevelStars } from "../../../shared/game-core";
import { LEVEL_COUNT, LEVELS, MODE_INFO, MODES, WORLDS, ENDLESS, type Mode } from "../lib/levels";
import { bn } from "../lib/link";

const Lock = () => <svg viewBox="0 0 24 24" aria-hidden="true"><rect x="5" y="10.5" width="14" height="10" rx="2.5" /><path d="M8 10.5V8a4 4 0 0 1 8 0v2.5" /></svg>;

export function LevelSheet({ stars, open, current, mode, best, onMode, onPick, onEndless, onClose }: {
  stars: LevelStars; open: number; current: number; mode: Mode; best: number | null;
  onMode: (mode: Mode) => void; onPick: (level: number) => void; onEndless: () => void; onClose: () => void;
}) {
  const sheet = useRef<HTMLDivElement>(null);
  const next = LEVELS.findIndex((_, index) => index + 1 <= open && !stars[index + 1]) + 1 || open;

  useEffect(() => {
    sheet.current?.querySelector<HTMLElement>("[data-next]")?.focus({ preventScroll: true });
    // 1–9 pick a level, as the numbers on the rows say; Escape belongs to the player, so ✕ closes.
    const key = (event: KeyboardEvent) => {
      if (event.repeat || event.ctrlKey || event.metaKey || event.altKey || !/^[1-9]$/.test(event.key)) return;
      const level = Number(event.key);
      if (level <= open) { event.preventDefault(); onPick(level); }
    };
    window.addEventListener("keydown", key);
    return () => window.removeEventListener("keydown", key);
  }, [open, onPick]);

  return (
    <div className="bp-sheet" ref={sheet} role="dialog" aria-modal="true" aria-labelledby="bp-sheet-title">
      <div className="bp-sheet-head">
        <h2 id="bp-sheet-title">সব লেভেল</h2>
        <button type="button" className="bp-sheet-close" onClick={onClose} aria-label="বন্ধ করো">✕</button>
      </div>
      <div className="bp-modes" role="radiogroup" aria-label="কতটা কঠিন">
        {MODES.map(item => <button key={item} type="button" role="radio" aria-checked={item === mode} onClick={() => onMode(item)}>{MODE_INFO[item].name}</button>)}
      </div>
      {WORLDS.map((world, worldIndex) => (
        <section key={world.name} className="bp-sheet-world" data-world={worldIndex}>
          <h3>{world.name}</h3>
          <ol>
            {LEVELS.map((def, index) => ({ def, level: index + 1 })).filter(({ def }) => def.world === worldIndex).map(({ def, level }) => {
              const locked = level > open, earned = stars[level] ?? 0;
              return (
                <li key={level}>
                  <button type="button" disabled={locked} data-next={level === next ? "" : undefined} aria-current={level === current ? "true" : undefined} onClick={() => onPick(level)}
                    aria-label={`লেভেল ${bn(level)}, ${def.name}${locked ? ", বন্ধ" : earned ? `, ${bn(earned)} তারা` : ""}`}>
                    <b className="bp-sheet-num">{locked ? <Lock /> : bn(level)}</b>
                    <span className="bp-sheet-name">{def.name}{def.finale && <i>শেষ ধাপ</i>}{level === next && !locked && <em>এটা খেলো</em>}</span>
                    <span className="bp-sheet-teach">{def.teach}</span>
                    <span className="bp-sheet-stars" aria-hidden="true">{[0, 1, 2].map(star => <span key={star} data-on={star < earned}>★</span>)}</span>
                  </button>
                </li>
              );
            })}
          </ol>
        </section>
      ))}
      <section className="bp-sheet-world bp-sheet-endless">
        <h3>খোলা ঘাট</h3>
        <button type="button" onClick={onEndless}>
          <b className="bp-sheet-num">∞</b>
          <span className="bp-sheet-name">{ENDLESS.name}</span>
          <span className="bp-sheet-teach">{ENDLESS.teach}{best !== null && ` এই ফোনের সেরা ${bn(best)}টা।`}</span>
        </button>
      </section>
      <p className="bp-sheet-note">একটা লেভেল পার হলেই পরেরটা খোলে। মোট {bn(LEVEL_COUNT)}টা।</p>
    </div>
  );
}

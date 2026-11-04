"use client";
// The level list, a choice screen with nothing running behind it: five worlds of six, numbered, each with its one new thing
// and its stars, and today's maze on top. The next unplayed level is marked এটা খেলো; locked rows are dim and carry a
// lock shape, not only a colour.
import { useEffect, useRef } from "react";
import type { LevelStars } from "../../../shared/game-core";
import { LEVELS, LEVEL_COUNT, MODE_INFO, MODES, suggestedLevel, WORLDS, type Mode } from "../lib/levels";
import { bn, dayLabel } from "../lib/link";

const Lock = () => <svg viewBox="0 0 24 24" aria-hidden="true"><rect x="5" y="10.5" width="14" height="10" rx="2.5" /><path d="M8 10.5V8a4 4 0 0 1 8 0v2.5" /></svg>;

export function LevelSheet({ stars, open, current, mode, today, onMode, onPick, onDaily, onClose }: {
  stars: LevelStars; open: number; current: number; mode: Mode; today: number;
  onMode: (mode: Mode) => void; onPick: (level: number) => void; onDaily: () => void; onClose: () => void;
}) {
  const sheet = useRef<HTMLDivElement>(null);
  const next = suggestedLevel(stars, open);

  useEffect(() => {
    sheet.current?.querySelector<HTMLElement>("[data-next]")?.focus({ preventScroll: false });
    // 1–9 pick a level, as the numbers on the rows say.
    const key = (event: KeyboardEvent) => {
      if (event.repeat || event.ctrlKey || event.metaKey || event.altKey || !/^[1-9]$/.test(event.key)) return;
      const level = Number(event.key);
      if (level <= open) { event.preventDefault(); event.stopPropagation(); onPick(level); }
    };
    window.addEventListener("keydown", key, true);
    return () => window.removeEventListener("keydown", key, true);
  }, [open, onPick]);

  return (
    <div className="gd-sheet" ref={sheet} role="dialog" aria-modal="true" aria-labelledby="gd-sheet-title">
      <div className="gd-sheet-head">
        <h2 id="gd-sheet-title">সব লেভেল</h2>
        <button type="button" className="gd-sheet-close" onClick={onClose} aria-label="বন্ধ করো">✕</button>
      </div>
      <div className="gd-modes" role="radiogroup" aria-label="কতটা কঠিন">
        {MODES.map(item => <button key={item} type="button" role="radio" aria-checked={item === mode} onClick={() => onMode(item)}>{MODE_INFO[item].name}</button>)}
      </div>
      <p className="gd-mode-line">{MODE_INFO[mode].line}</p>
      <button type="button" className="gd-sheet-daily" onClick={onDaily}>
        <b>আজকের ধাঁধা</b><span>{dayLabel(today)} · সবার ফোনে একই ধাঁধা</span>
      </button>
      {WORLDS.map((world, worldIndex) => (
        <section key={world.name} className="gd-sheet-world" data-world={worldIndex}>
          <h3>{bn(worldIndex + 1)}. {world.name}</h3>
          <ol>
            {LEVELS.map((def, index) => ({ def, level: index + 1 })).filter(({ def }) => def.world === worldIndex).map(({ def, level }) => {
              const locked = level > open, earned = stars[level] ?? 0;
              return (
                <li key={level}>
                  <button type="button" disabled={locked} data-next={level === next && !locked ? "" : undefined} aria-current={level === current ? "true" : undefined} onClick={() => onPick(level)}
                    aria-label={`লেভেল ${bn(level)}, ${def.name}${locked ? ", বন্ধ" : earned ? `, ${bn(earned)} তারা` : ""}`}>
                    <b className="gd-sheet-num">{locked ? <Lock /> : bn(level)}</b>
                    <span className="gd-sheet-name">{def.name}{def.finale && <i>শেষ ধাপ</i>}{level === next && !locked && <em>এটা খেলো</em>}</span>
                    <span className="gd-sheet-teach">{def.teach}</span>
                    <span className="gd-sheet-stars" aria-hidden="true">{[0, 1, 2].map(star => <span key={star} data-on={star < earned}>★</span>)}</span>
                  </button>
                </li>
              );
            })}
          </ol>
        </section>
      ))}
      <p className="gd-sheet-note">একটা লেভেল পার হলেই পরেরটা খোলে। মোট {bn(LEVEL_COUNT)}টা, পাঁচ জায়গায়।</p>
    </div>
  );
}
